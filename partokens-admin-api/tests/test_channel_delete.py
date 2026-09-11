from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

from admin_api.database import Database
from admin_api.new_api import NewApiError
from admin_api.repository import ConflictError, Repository
from admin_api.service import AdminService


class ChannelDeleteTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        database = Database(Path(self.temp.name) / "test.sqlite3")
        database.initialize()
        self.repository = Repository(database)
        self.repository.create_logical({
            "id": "lc_a", "name": "A", "channel_type": 1, "base_url": "https://example.test",
            "identity_hash": "identity", "credential_fingerprint": "fingerprint",
            "models": ["fast", "slow"], "template_channel_id": 10,
        })
        self.channels = [
            {"id": 10, "other_info": json.dumps({"partokens_admin": {"schema": 1, "logical_id": "lc_a", "kind": "template"}})},
            {"id": 11, "other_info": json.dumps({"partokens_admin": {"schema": 1, "logical_id": "lc_a", "kind": "archive"}})},
            {"id": 20, "name": "unrelated"},
        ]
        self.client = AsyncMock()
        for channel in self.channels[:2]:
            channel["tag"] = "ptlc:lc_a"
        self.client.get_channel.side_effect = lambda _, channel_id: next(item for item in self.channels if item["id"] == channel_id)
        self.client.list_channels.side_effect = lambda _: list(self.channels)

        async def delete(_, channel_id):
            self.channels[:] = [item for item in self.channels if item["id"] != channel_id]

        self.client.delete_channel.side_effect = delete
        self.service = AdminService(self.repository, self.client, AsyncMock())

    def tearDown(self) -> None:
        self.temp.cleanup()

    async def test_delete_removes_owned_records_and_preserves_unrelated_channels(self) -> None:
        self.assertEqual(await self.service.delete_channel("Bearer root", "lc_a"), {"id": "lc_a"})
        self.assertEqual(self.repository.public_channels(), [])
        self.assertEqual(self.channels, [{"id": 20, "name": "unrelated"}])

    async def test_bound_channel_cannot_be_deleted(self) -> None:
        self.repository.save_route("default", 1, {"layers": [{"members": [{"logical_id": "lc_a", "weight": 100}]}]}, "root")
        with self.assertRaises(ConflictError):
            await self.service.delete_channel("Bearer root", "lc_a")
        self.client.delete_channel.assert_not_called()
        self.assertTrue(self.repository.logical_row("lc_a")["enabled"])

    async def test_failed_delete_keeps_local_record_and_can_be_retried(self) -> None:
        original_delete = self.client.delete_channel.side_effect
        self.client.delete_channel.side_effect = NewApiError("unavailable")
        with self.assertRaises(NewApiError):
            await self.service.delete_channel("Bearer root", "lc_a")
        self.assertEqual(self.repository.logical_row("lc_a")["state"], "deleting")
        self.client.delete_channel.side_effect = original_delete
        await self.service.delete_channel("Bearer root", "lc_a")
        self.assertEqual(self.repository.public_channels(), [])

    async def test_upstream_success_without_deletion_keeps_local_record(self) -> None:
        self.client.delete_channel.side_effect = None
        with self.assertRaises(ConflictError):
            await self.service.delete_channel("Bearer root", "lc_a")
        self.assertEqual(len(self.repository.public_channels()), 1)

    async def test_active_test_prevents_delete(self) -> None:
        self.repository.create_model_test_task({"id": "mt_a", "logical_id": "lc_a", "models": ["fast"], "results": [], "actor_id": 1, "actor_name": "root"})
        with self.assertRaises(ConflictError):
            await self.service.delete_channel("Bearer root", "lc_a")
        self.client.delete_channel.assert_not_called()

    async def test_recent_results_preserve_other_models_during_partial_retest(self) -> None:
        results = [{"model_id": "fast", "status": "available", "latency_ms": 100, "tested_at": 10}, {"model_id": "slow", "status": "available", "latency_ms": 4000, "tested_at": 10}]
        self.repository.create_model_test_task({"id": "mt_old", "logical_id": "lc_a", "models": ["fast", "slow"], "results": results, "actor_id": 1, "actor_name": "root"})
        self.repository.update_model_test_task("mt_old", status="success")
        self.repository.create_model_test_task({"id": "mt_new", "logical_id": "lc_a", "models": ["fast"], "results": [{"model_id": "fast", "status": "untested", "tested_at": None}], "actor_id": 1, "actor_name": "root"})
        self.assertEqual(self.repository.public_channels()[0]["latest_model_results"], results)
        self.repository.update_model_test_task("mt_new", status="success", results=[{"model_id": "fast", "status": "unavailable", "tested_at": 20}])
        latest = {item["model_id"]: item for item in self.repository.public_channels()[0]["latest_model_results"]}
        self.assertEqual(latest["fast"]["status"], "unavailable")
        self.assertEqual(latest["slow"]["latency_ms"], 4000)
