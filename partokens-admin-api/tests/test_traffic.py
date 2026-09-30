from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx

from admin_api.config import Settings
from admin_api.database import Database
from admin_api.monitor import Monitor
from admin_api.new_api import NewApiClient
from admin_api.repository import Repository
from admin_api.traffic import metrics, report, request_sample, unique_requests


def log(index=1, **changes):
    return {"id": index, "request_id": f"req-{index}", "created_at": 2_000_000 - index,
            "type": 2, "channel": 10, "model_name": "gpt-test", "is_stream": True,
            "prompt_tokens": 1000, "completion_tokens": 200, "quota": 250_000,
            "other": json.dumps({"frt": 500, "cache_tokens": 500, "group_ratio": 2}), **changes}


class TrafficMetricsTests(unittest.TestCase):
    def test_price_removes_group_ratio_and_cost_is_usd_times_channel_ratio(self):
        sample = request_sample(log(), 500_000, 1.125)
        self.assertEqual(sample["original_usd"], .25)
        self.assertEqual(sample["cost_cny"], .28125)
        special = request_sample(log(other={"group_ratio": 2, "user_group_ratio": .5}), 1_000_000, 0)
        self.assertEqual(special["original_usd"], .5)
        self.assertEqual(special["cost_cny"], 0)

    def test_cache_is_token_weighted_and_missing_fields_are_excluded(self):
        rows = [request_sample(log(), 500_000, 1), request_sample(log(2, prompt_tokens=9000, other={"cache_tokens": 900, "frt": 3500, "group_ratio": 2}), 500_000, 1),
                request_sample(log(3, other="broken json"), 500_000, 1)]
        summary = metrics(rows)
        self.assertEqual(summary["cache_rate"], 14)
        self.assertEqual(summary["cache_samples"], 2)
        self.assertEqual(summary["first_token_ms"], 2000)
        self.assertEqual(summary["p95_first_token_ms"], 3500)
        self.assertIsNone(summary["original_usd"])
        self.assertEqual(summary["unpriced_requests"], 1)

    def test_claude_inputs_include_cache_read_and_write_without_double_counting(self):
        other = {"claude": True, "cache_tokens": 700, "cache_creation_tokens": 999,
                 "cache_creation_tokens_5m": 50, "cache_creation_tokens_1h": 150}
        sample = request_sample(log(prompt_tokens=100, other=other), 500_000, 1)
        self.assertEqual(sample["input_tokens"], 1000)
        self.assertEqual(sample["total_tokens"], 1200)
        self.assertEqual(sample["cache_rate"], 70)
        normalized = request_sample(log(prompt_tokens=100, other={**other, "input_tokens_total": 1000}), 500_000, 1)
        self.assertEqual(normalized["input_tokens"], 1000)

    def test_retries_merge_and_stream_failure_is_failure_but_keeps_usage(self):
        failed = request_sample(log(type=5, prompt_tokens=0, completion_tokens=0), 500_000, 1)
        success = request_sample(log(2, request_id="req-1", channel=11), 500_000, 1)
        interrupted = request_sample(log(3, other={"stream_status": {"status": "error"}, "frt": 0, "cache_tokens": 0, "group_ratio": 1}), 500_000, 1)
        rows = unique_requests([failed, success, interrupted])
        self.assertEqual(len(rows), 2)
        summary = metrics(rows)
        self.assertEqual(summary["success_rate"], 50)
        self.assertEqual(summary["total_tokens"], 2400)
        self.assertEqual(summary["latency_samples"], 2)

    def test_non_stream_invalid_latency_and_unregistered_cost_are_not_zero(self):
        sample = request_sample(log(is_stream=False), 500_000, None)
        self.assertIsNone(sample["first_token_ms"])
        self.assertIsNone(sample["cost_cny"])
        invalid = request_sample(log(other={"frt": -100, "cache_tokens": 2000, "group_ratio": 0}), 500_000, 1)
        self.assertIsNone(invalid["first_token_ms"])
        self.assertIsNone(invalid["cache_rate"])
        self.assertIsNone(invalid["original_usd"])
        self.assertIsNone(metrics([])["success_rate"])

    def test_recent_sixty_is_per_filtered_scope_and_time_summary_is_not_sampled(self):
        rows = [request_sample(log(index), 500_000, 1) for index in range(1, 201)]
        recent = report(rows, "requests_60", 2_000_000, ["gpt-test", "idle-model"])
        self.assertEqual(recent["summary"]["requests"], 60)
        self.assertEqual(len(recent["series"]), 60)
        self.assertEqual(recent["recent_requests"][0]["id"], 1)
        weekly = report(rows, "7d", 2_000_000, ["gpt-test"])
        self.assertEqual(weekly["summary"]["requests"], 200)
        self.assertEqual(sum(point["requests"] for point in weekly["series"]), 200)
        self.assertEqual(len(weekly["recent_requests"]), 60)
        self.assertIsNone(weekly["series"][0]["success_rate"])
        older = request_sample(log(999, created_at=2_000_000 - 7 * 86400 - 1), 500_000, 1)
        self.assertEqual(report([older], "7d", 2_000_000, [])['summary']['requests'], 0)


class TrafficQueryTests(unittest.IsolatedAsyncioTestCase):
    async def test_existing_snapshots_backfill_retired_routes_but_not_probes(self):
        with tempfile.TemporaryDirectory() as directory:
            db = Database(Path(directory) / "db.sqlite")
            db.initialize()
            details = {"physical_records": [{"channel_id": 90, "logical_id": "lc_test", "kind": "route"},
                                            {"channel_id": 91, "logical_id": "lc_test", "kind": "probe"}]}
            db.execute("INSERT INTO monitor_snapshots(observed_at, status, summary_json, details_json) VALUES (?, ?, ?, ?)",
                       (123, "healthy", "{}", json.dumps(details)))
            db.initialize()
            db.initialize()
            self.assertEqual(db.fetch_all("SELECT * FROM monitor_channel_bindings"), [{"channel_id": 90, "logical_id": "lc_test"}])

    async def test_log_pagination_counts_unique_requests_and_excludes_other_log_types(self):
        seen = []
        pages = [[log(), log(), log(2, type=3)], [log(3), log(4)]]

        async def handler(request):
            seen.append(request)
            rows = pages[int(request.url.params["p"]) - 1]
            return httpx.Response(200, json={"success": True, "data": {"items": rows, "total": 5}})

        client = NewApiClient("http://test", transport=httpx.MockTransport(handler))
        try:
            rows = await client.request_logs("Bearer root", 10, 2, 0, 2_000_000, model="gpt-test", limit=3)
            self.assertEqual([row['id'] for row in rows], [1, 3, 4])
            self.assertEqual(len(seen), 2)
            self.assertEqual(seen[0].url.params['model_name'], 'gpt-test')
        finally:
            await client.close()

    async def test_monitor_includes_retired_route_bindings_and_filters_model(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = Settings.from_mapping({"PARTOKENS_ADMIN_DATABASE_PATH": str(Path(directory) / "db.sqlite")})
            db = Database(settings.database_path)
            db.initialize()
            repository = Repository(db)
            repository.create_logical({"id": "lc_test", "name": "Channel", "channel_type": 1, "base_url": "https://test",
                                       "identity_hash": "hash", "credential_fingerprint": "fingerprint", "models": ["gpt-test"], "cost_ratio": .5})
            records = [{"channel_id": channel, "logical_id": "lc_test", "kind": kind, "status": 1, "name": "record", "models": "gpt-test"}
                       for channel, kind in [(10, "route"), (12, "probe")]]
            repository.replace_physical(records, 2_000_000)
            repository.replace_physical([{**records[0], "channel_id": 11}], 2_000_000)
            client = AsyncMock()
            client.quota_per_unit.return_value = 500_000
            client.request_logs.side_effect = lambda token, channel, kind, start, end, **kwargs: [log(channel, channel=channel)] if kind == 2 else []
            monitor = Monitor(settings, repository, client)
            monitor.refresh = AsyncMock()
            with patch("admin_api.monitor.now", return_value=2_000_000):
                result = await monitor.channel_traffic("Bearer root", "lc_test", "6h", "gpt-test")
            self.assertEqual(result["summary"]["requests"], 2)
            self.assertEqual(result["summary"]["cost_cny"], .25)
            self.assertEqual({call.args[1] for call in client.request_logs.call_args_list}, {10, 11})
            self.assertTrue(all(call.kwargs['model'] == 'gpt-test' and call.kwargs['limit'] is None for call in client.request_logs.call_args_list))


if __name__ == "__main__":
    unittest.main()
