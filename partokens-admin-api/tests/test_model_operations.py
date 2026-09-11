from __future__ import annotations

import asyncio
import copy
import json
import tempfile
import time
import unittest
from unittest.mock import patch
from pathlib import Path
from typing import Any

from admin_api.database import Database
from support import test_vault, encrypted_config
from admin_api.domain import cost_ratio_to_millis, credential_fingerprint, identity_hash
from admin_api.model_operations import ModelOperations, _test_status_from_failure
from admin_api.new_api import NewApiError
from admin_api.repository import ConflictError, Repository
from admin_api.schemas import LogicalChannelCreate


def metadata(logical_id: str, kind: str) -> str:
    return json.dumps({"partokens_admin": {"schema": 1, "logical_id": logical_id, "kind": kind}})


class FakeModelClient:
    def __init__(self) -> None:
        self.channels: dict[int, dict[str, Any]] = {
            10: {
                "id": 10,
                "type": 1,
                "name": "A execution",
                "key": "channel-secret", "base_url": "https://api.example.com/v1",
                "auto_ban": 0, "other": "", "settings": "{}", "tag": "ptlc:lc_a",
                "status": 2,
                "group": "__partokens_catalog__",
                "models": "good,bad",
                "model_mapping": '{"alias":"bad"}',
                "other_info": metadata("lc_a", "route"),
            }
        }
        self.active = 0
        self.max_active = 0
        self.next_id = 100

    async def fetch_channel_models_preview(self, token, channel_type, base_url, key):
        return await self.fetch_channel_models(token, 0), None

    async def fetch_channel_models_result(self, token, channel_id):
        return await self.fetch_channel_models(token, channel_id), None

    async def add_channel(self, token, channel):
        channel_id = self.next_id
        self.next_id += 1
        self.channels[channel_id] = {**copy.deepcopy(channel), "id": channel_id}

    async def delete_channel(self, token, channel_id):
        self.channels.pop(channel_id, None)

    async def fetch_channel_models(self, token: str, channel_id: int) -> list[str]:
        return ["good", "bad", "new-model"]

    async def test_channel_model(self, token: str, channel_id: int, model: str) -> dict[str, Any]:
        self.active += 1
        self.max_active = max(self.max_active, self.active)
        await asyncio.sleep(0.005)
        self.active -= 1
        if model == "bad":
            return {"success": False, "error_code": "model_not_found", "message": "model not found"}
        return {"success": True, "time": 0.01}

    async def list_channels(self, token: str) -> list[dict[str, Any]]:
        return [copy.deepcopy(item) for item in self.channels.values()]

    async def get_channel(self, token: str, channel_id: int) -> dict[str, Any]:
        channel = copy.deepcopy(self.channels[channel_id])
        channel["credential_fingerprint"] = credential_fingerprint(channel.get("key", ""))
        return channel

    async def update_channel(self, token: str, channel: dict[str, Any]) -> dict[str, Any]:
        self.channels[int(channel["id"])].update(copy.deepcopy(channel))
        return copy.deepcopy(self.channels[int(channel["id"])])


class ModelOperationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        database = Database(Path(self.temp.name) / "admin.sqlite3")
        database.initialize()
        self.repository = Repository(database, test_vault())
        fingerprint = credential_fingerprint("channel-secret")
        self.repository.create_logical({
            "id": "lc_a",
            "name": "A",
            "channel_type": 1,
            "base_url": "https://api.example.com/v1",
            "identity_hash": identity_hash(1, "https://api.example.com/v1", fingerprint),
            "credential_fingerprint": fingerprint,
            "cost_ratio": 1.125,
            "models": ["good", "bad"],
            "model_mapping": '{"alias":"bad"}',
            "note": "",
            "config_ciphertext": encrypted_config("lc_a", "channel-secret"),
        })
        self.client = FakeModelClient()
        self.operations = ModelOperations(self.repository, self.client)  # type: ignore[arg-type]

    def tearDown(self) -> None:
        self.temp.cleanup()

    async def test_discovery_is_persisted_without_overwriting_models(self) -> None:
        result = await self.operations.discover("Bearer root", "lc_a")
        self.assertEqual(result["status"], "success")
        self.assertEqual([item["id"] for item in result["models"]], ["good", "bad", "new-model"])
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good", "bad"])
        self.assertEqual(self.repository.model_discovery("lc_a")["source"], "new-api channel model endpoint")  # type: ignore[index]

    async def test_confirm_model_update_preserves_existing_models_and_mapping(self) -> None:
        await self.operations.discover("Bearer root", "lc_a")
        self.client.channels[11] = {**copy.deepcopy(self.client.channels[10]), "id": 11, "other_info": metadata("lc_a", "route")}
        preview = await self.operations.preview_add("Bearer root", "lc_a", ["new-model"])
        self.assertEqual(preview["add_models"], ["new-model"])
        self.assertEqual(self.client.channels[10]["models"], "good,bad")
        self.assertFalse(preview["modifies_model_mapping"])
        change = await self.operations.execute_remove("Bearer root", "lc_a", ["new-model"], {"id": 1}, preview["preview_token"], adding=True)
        self.assertEqual(change["status"], "success")
        self.assertEqual(change["kind"], "model_update")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good", "bad", "new-model"])
        for channel in self.client.channels.values():
            self.assertEqual(channel["models"], "good,bad,new-model")
            self.assertEqual(channel["model_mapping"], '{"alias":"bad"}')

    async def test_model_update_rejects_unknown_models_and_stale_preview(self) -> None:
        await self.operations.discover("Bearer root", "lc_a")
        with self.assertRaises(ConflictError):
            await self.operations.preview_add("Bearer root", "lc_a", ["unknown"])
        preview = await self.operations.preview_add("Bearer root", "lc_a", ["new-model"])
        self.client.channels[10]["name"] = "renamed"
        with self.assertRaises(ConflictError):
            await self.operations.execute_remove("Bearer root", "lc_a", ["new-model"], {"id": 1}, preview["preview_token"], adding=True)

    async def test_unconfigured_unavailable_model_can_be_removed_from_discovery(self) -> None:
        self.repository.update_logical_models("lc_a", ["good"], None)
        self.client.channels[10]["models"] = "good"
        self.client.channels[10]["model_mapping"] = None
        await self.operations.discover("Bearer root", "lc_a")
        await self.finish_test(["bad"])
        preview = await self.operations.preview_remove("Bearer root", "lc_a", ["bad"])
        change = await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1}, preview["preview_token"])
        self.assertEqual(change["status"], "success")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good"])
        self.assertNotIn("bad", [item["id"] for item in self.repository.model_discovery("lc_a")["models"]])

    async def test_partial_model_update_can_resume(self) -> None:
        await self.operations.discover("Bearer root", "lc_a")
        preview = await self.operations.preview_add("Bearer root", "lc_a", ["new-model"])
        original = self.client.update_channel
        async def fail(token: str, channel: dict[str, Any]) -> dict[str, Any]:
            raise NewApiError("network", kind="network")
        self.client.update_channel = fail
        change = await self.operations.execute_remove("Bearer root", "lc_a", ["new-model"], {"id": 1}, preview["preview_token"], adding=True)
        self.assertEqual(change["status"], "partial")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good", "bad"])
        self.client.update_channel = original
        self.assertEqual((await self.operations.continue_remove("Bearer root", change["id"]))["status"], "success")

    async def test_cost_ratio_round_trips_through_integer_thousandths(self) -> None:
        stored = self.repository.database.fetch_one("SELECT cost_ratio_millis FROM logical_channels WHERE id = ?", ("lc_a",))
        self.assertEqual(stored["cost_ratio_millis"], 1125)  # type: ignore[index]
        self.assertEqual(self.repository.public_channels()[0]["cost_ratio"], 1.125)

    async def test_model_test_is_bounded_and_duplicate_start_reuses_task(self) -> None:
        first = await self.operations.start_test("Bearer root", "lc_a", ["good", "bad", "good"], {"id": 1, "username": "root"})
        second = await self.operations.start_test("Bearer root", "lc_a", ["good"], {"id": 1, "username": "root"})
        self.assertEqual(first["id"], second["id"])
        while (result := await self.operations.get_test(first["id"]))["status"] in {"pending", "running"}:
            await asyncio.sleep(0.01)
        self.assertEqual(result["status"], "partial")
        self.assertEqual({item["status"] for item in result["results"]}, {"available", "unavailable"})
        self.assertLessEqual(self.client.max_active, 4)

    async def test_slow_model_times_out_without_blocking_other_results(self) -> None:
        original = self.client.test_channel_model
        slow_attempts = 0
        async def test_model(token: str, channel_id: int, model: str) -> dict[str, Any]:
            nonlocal slow_attempts
            if model == "slow":
                slow_attempts += 1
                await asyncio.Event().wait()
            return await original(token, channel_id, model)
        self.client.test_channel_model = test_model
        with patch("admin_api.model_operations.MODEL_TEST_TIMEOUT_SECONDS", 0.02):
            task = await self.operations.start_test("Bearer root", "lc_a", ["slow", "good"], {"id": 1})
            await asyncio.wait_for(self.operations._test_tasks[task["id"]], timeout=1)
        result = await self.operations.get_test(task["id"])
        self.assertEqual(result["completed"], 2)
        self.assertEqual([item["status"] for item in result["results"]], ["timeout", "available"])
        self.assertEqual(slow_attempts, 2)
        self.assertEqual([item["attempts"] for item in result["results"]], [2, 1])
        self.assertIsNone(self.repository.active_model_test_task("lc_a"))

    async def test_cancel_interrupts_inflight_request_and_releases_batch(self) -> None:
        started = asyncio.Event()
        stopped = asyncio.Event()
        async def blocked(token: str, channel_id: int, model: str) -> dict[str, Any]:
            started.set()
            try:
                await asyncio.Event().wait()
            finally:
                stopped.set()
        self.client.test_channel_model = blocked
        task = await self.operations.start_test("Bearer root", "lc_a", ["good", "bad"], {"id": 1})
        await asyncio.wait_for(started.wait(), timeout=1)
        result = await asyncio.wait_for(self.operations.cancel_test(task["id"]), timeout=1)
        self.assertEqual(result["status"], "cancelled")
        self.assertTrue(stopped.is_set())
        self.assertIsNone(self.repository.active_model_test_task("lc_a"))

    async def test_preflight_timeout_and_setup_failure_do_not_leave_running_tasks(self) -> None:
        async def blocked(token: str, channel_id: int) -> dict[str, Any]:
            await asyncio.Event().wait()
        self.client.get_channel = blocked
        with patch("admin_api.model_operations.MODEL_TEST_TIMEOUT_SECONDS", 0.02):
            task = await self.operations.start_test("Bearer root", "lc_a", ["good"], {"id": 1})
            await asyncio.wait_for(self.operations._test_tasks[task["id"]], timeout=1)
        self.assertEqual((await self.operations.get_test(task["id"]))["status"], "partial")
        task = await self.operations.start_test("Bearer root", "lc_a", ["good"], {"id": 1})
        with patch.object(self.repository, "logical_row", side_effect=RuntimeError("setup failed")):
            await asyncio.wait_for(self.operations._test_tasks[task["id"]], timeout=1)
        result = await self.operations.get_test(task["id"])
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["failed_count"], 0)
        self.assertEqual(result["completed"], 0)
        self.assertEqual(result["results"][0]["status"], "untested")
        self.assertIsNone(result["results"][0]["tested_at"])
        self.assertIsNone(self.repository.active_model_test_task("lc_a"))

    async def test_shutdown_preserves_completed_results_and_leaves_unfinished_untested(self) -> None:
        entered = asyncio.Event()
        async def blocked(token: str, channel_id: int, model: str) -> dict[str, Any]:
            entered.set()
            await asyncio.Event().wait()
        self.client.test_channel_model = blocked
        task = await self.operations.start_test("Bearer root", "lc_a", ["good", "bad"], {"id": 1})
        await entered.wait()
        await self.operations.stop()
        result = await self.operations.get_test(task["id"])
        self.assertEqual(result["status"], "partial")
        self.assertFalse(result["cancel_requested"])
        self.assertEqual(result["completed"], 0)
        self.assertTrue(all(item["status"] == "untested" and item["tested_at"] is None for item in result["results"]))
        self.assertFalse(self.operations._test_tasks)

    async def test_removal_preview_is_read_only_and_execute_keeps_audit(self) -> None:
        task = await self.operations.start_test("Bearer root", "lc_a", ["good", "bad"], {"id": 1, "username": "root"})
        while (result := await self.operations.get_test(task["id"]))["status"] in {"pending", "running"}:
            await asyncio.sleep(0.01)
        preview = await self.operations.preview_remove("Bearer root", "lc_a")
        self.assertEqual(preview["remove_models"], ["bad"])
        self.assertEqual(self.client.channels[10]["models"], "good,bad")
        change = await self.operations.execute_remove("Bearer root", "lc_a", None, {"id": 1, "username": "root"}, preview["preview_token"])
        self.assertEqual(change["status"], "success")
        self.assertEqual(self.client.channels[10]["models"], "good")
        self.assertEqual(self.client.channels[10]["model_mapping"], "{}")
        self.assertEqual(change["plan"]["physical_records"][0]["before_models"], ["good", "bad"])
        self.assertNotIn("channel-secret", json.dumps(change))

    async def finish_test(self, models: list[str] | None = None) -> dict[str, Any]:
        task = await self.operations.start_test("Bearer root", "lc_a", models or ["good", "bad"], {"id": 1})
        while (result := await self.operations.get_test(task["id"]))["status"] in {"pending", "running"}:
            await asyncio.sleep(0.01)
        return result

    async def test_preview_requires_fresh_results_matching_configuration(self) -> None:
        task = await self.finish_test()
        with patch("admin_api.model_operations.time.time", return_value=time.time() + 901):
            with self.assertRaises(ConflictError):
                await self.operations.preview_remove("Bearer root", "lc_a")
        self.client.channels[10]["model_mapping"] = '{"alias":"good"}'
        with self.assertRaises(ConflictError):
            await self.operations.preview_remove("Bearer root", "lc_a")
        self.client.channels[10]["model_mapping"] = '{"alias":"bad"}'
        self.repository.update_logical_models("lc_a", ["good", "bad", "new"], None)
        with self.assertRaises(ConflictError):
            await self.operations.preview_remove("Bearer root", "lc_a")
        self.assertEqual(task["status"], "partial")

    async def test_execution_rejects_changed_preview_and_explicit_ineligible_models(self) -> None:
        await self.finish_test()
        preview = await self.operations.preview_remove("Bearer root", "lc_a")
        for models in ([], ["good"], ["bad", "good"]):
            with self.assertRaises(ConflictError):
                await self.operations.preview_remove("Bearer root", "lc_a", models)
        with self.assertRaises(ConflictError):
            await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1})
        self.client.channels[10]["name"] = "renamed"
        with self.assertRaises(ConflictError):
            await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1}, preview["preview_token"])
        self.assertEqual(self.client.channels[10]["models"], "good,bad")

    async def test_same_second_retry_supersedes_old_removal_evidence(self) -> None:
        with patch("admin_api.repository.now", return_value=100):
            first = await self.finish_test()
            second = await self.finish_test(["good"])
            self.assertEqual(self.repository.latest_model_test_task("lc_a")["id"], second["id"])
            self.assertEqual((await self.operations.preview_remove("Bearer root", "lc_a"))["remove_models"], ["bad"])
            third = await self.finish_test(["bad"])
            self.repository.update_model_test_task(third["id"], results=[{**third["results"][0], "status": "available"}])
            self.assertNotEqual(first["id"], third["id"])
            with self.assertRaises(ConflictError):
                await self.operations.preview_remove("Bearer root", "lc_a")

    async def test_removal_accepts_all_abnormal_results_and_keeps_available_models(self) -> None:
        task = await self.finish_test()
        good, bad = task["results"]
        for status in ("unavailable", "timeout", "rate_limited", "unauthorized", "server_error", "unknown", "unexpected"):
            with self.subTest(status=status):
                self.repository.update_model_test_task(task["id"], results=[good, {**bad, "status": status, "error": None}])
                preview = await self.operations.preview_remove("Bearer root", "lc_a")
                self.assertEqual(preview["remove_models"], ["bad"])
                self.assertEqual(preview["retain_models"], ["good"])
                self.assertEqual(preview["failure_reasons"], [{"model": "bad", "reason": "模型测试异常"}])
                self.assertEqual((await self.operations.preview_remove("Bearer root", "lc_a", ["bad"]))["remove_models"], ["bad"])
        change = await self.operations.execute_remove("Bearer root", "lc_a", None, {"id": 1}, preview["preview_token"])
        self.assertEqual(change["status"], "success")
        self.assertEqual(self.client.channels[10]["models"], "good")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good"])

    async def test_removal_rejects_unfinished_or_stale_abnormal_results(self) -> None:
        task = await self.finish_test()
        good, bad = task["results"]
        for status in ("available", "untested", "pending", "running", None, ""):
            with self.subTest(status=status):
                self.repository.update_model_test_task(task["id"], results=[good, {**bad, "status": status}])
                with self.assertRaises(ConflictError):
                    await self.operations.preview_remove("Bearer root", "lc_a", ["bad"])
        for evidence in ({"tested_at": int(time.time()) - 901}, {"config_revision": "stale"}):
            with self.subTest(evidence=evidence):
                self.repository.update_model_test_task(task["id"], results=[good, {**bad, "status": "timeout", **evidence}])
                with self.assertRaises(ConflictError):
                    await self.operations.preview_remove("Bearer root", "lc_a", ["bad"])

    async def test_partial_write_retry_verifies_backend_before_updating_tags(self) -> None:
        self.client.channels[11] = {**copy.deepcopy(self.client.channels[10]), "id": 11, "other_info": metadata("lc_a", "route")}
        await self.finish_test()
        preview = await self.operations.preview_remove("Bearer root", "lc_a")
        original = self.client.update_channel
        async def fail_second(token: str, channel: dict[str, Any]) -> dict[str, Any]:
            if channel["id"] == 11:
                raise NewApiError("temporary failure", kind="network")
            return await original(token, channel)
        self.client.update_channel = fail_second
        change = await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1}, preview["preview_token"])
        self.assertEqual(change["status"], "partial")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good", "bad"])
        self.assertEqual(self.client.channels[10]["models"], "good")
        self.client.update_channel = original
        result = await self.operations.continue_remove("Bearer root", change["id"])
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good"])
        self.assertEqual(self.client.channels[11]["models"], "good")
        self.assertEqual((await self.operations.continue_remove("Bearer root", change["id"]))["status"], "success")

    async def test_partial_retry_does_not_overwrite_new_configuration(self) -> None:
        await self.finish_test()
        preview = await self.operations.preview_remove("Bearer root", "lc_a")
        original = self.client.update_channel
        async def fail(token: str, channel: dict[str, Any]) -> dict[str, Any]:
            raise NewApiError("failure", kind="network")
        self.client.update_channel = fail
        change = await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1}, preview["preview_token"])
        self.client.update_channel = original
        self.client.channels[10]["models"] = "good,bad,new"
        result = await self.operations.continue_remove("Bearer root", change["id"])
        self.assertEqual(result["status"], "partial")
        self.assertIn("配置已变化", result["error"])
        self.assertEqual(self.client.channels[10]["models"], "good,bad,new")

    async def test_silent_upstream_failure_is_not_reported_as_success(self) -> None:
        await self.finish_test()
        preview = await self.operations.preview_remove("Bearer root", "lc_a")
        async def no_op(token: str, channel: dict[str, Any]) -> dict[str, Any]:
            return channel
        self.client.update_channel = no_op
        result = await self.operations.execute_remove("Bearer root", "lc_a", ["bad"], {"id": 1}, preview["preview_token"])
        self.assertEqual(result["status"], "partial")
        self.assertEqual(self.repository.public_channels()[0]["models"], ["good", "bad"])

    async def test_cancelled_retry_does_not_reuse_previous_failure(self) -> None:
        await self.finish_test()
        task = await self.operations.start_test("Bearer root", "lc_a", ["bad"], {"id": 1})
        await self.operations.cancel_test(task["id"])
        while (result := await self.operations.get_test(task["id"]))["status"] in {"pending", "running"}:
            await asyncio.sleep(0.01)
        self.assertEqual(result["status"], "cancelled")
        with self.assertRaises(ConflictError):
            await self.operations.preview_remove("Bearer root", "lc_a")

    async def test_restart_reconciles_an_incomplete_task_without_losing_results(self) -> None:
        task = self.repository.create_model_test_task({
            "id": "mt_restart",
            "logical_id": "lc_a",
            "models": ["good", "bad"],
            "results": [
                {"model_id": "good", "name": "good", "status": "available", "latency_ms": 10},
                {"model_id": "bad", "name": "bad", "status": "untested", "latency_ms": None},
            ],
            "actor_id": 1,
            "actor_name": "root",
        })
        self.repository.recover_model_test_tasks()
        recovered = await self.operations.get_test(task["id"])
        self.assertEqual(recovered["status"], "partial")
        self.assertEqual(recovered["results"][0]["status"], "available")
        self.assertEqual(recovered["results"][1]["status"], "untested")
        self.assertIsNone(recovered["results"][1].get("tested_at"))
        self.assertEqual(recovered["completed"], 1)
        self.assertEqual(recovered["failed_count"], 0)
        self.assertEqual(recovered["progress"], 50)


class CostRatioTests(unittest.TestCase):
    def test_status_codes_inside_request_ids_do_not_classify_errors(self) -> None:
        payload = {"error_code": "model_not_found", "message": "bad response status code 503, message: 分组 Codex Plus 下模型 gpt-5.4-mini 无可用渠道（distributor） (request id: 202609100640107142625388268d9d65NSjnwkK)"}
        self.assertEqual(_test_status_from_failure(payload=payload), ("server_error", "上游分组下该模型无可用渠道，请检查分组与渠道可用性"))
        self.assertEqual(_test_status_from_failure(payload={"message": "bad response status code 400, message: Upstream request failed (request id: 401429503)"}), ("unknown", "上游返回 HTTP 400（Upstream request failed），未提供具体拒绝原因"))
        self.assertEqual(_test_status_from_failure(payload={"message": "unknown error (request id: abc401def)"})[0], "unknown")
        self.assertEqual(_test_status_from_failure(payload={"status_code": "401"})[0], "unauthorized")
        self.assertEqual(_test_status_from_failure(payload={"status_code": "invalid", "message": "bad response status code 503"})[0], "server_error")

    def test_only_explicit_model_errors_are_removable(self) -> None:
        for payload in (
            {"message": "404 not_found"}, {"message": "endpoint does not exist"},
            {"message": "model is not available"}, {"message": "timeout: model not found"},
            {"message": "401 model not found"}, {"message": "429 unsupported model"},
            {"message": "503 model not found"},
            {"message": "The model x does not exist or you do not have access to it"},
        ):
            with self.subTest(payload=payload):
                self.assertNotEqual(_test_status_from_failure(payload=payload)[0], "unavailable")
        self.assertEqual(_test_status_from_failure(NewApiError("404", kind="not_found"))[0], "unknown")
        for payload in ({"error_code": "model_not_found"}, {"error": {"code": "unsupported_model"}}, {"message": "The model 'retired' does not exist"}, {"message": "不支持该模型"}):
            self.assertEqual(_test_status_from_failure(payload=payload)[0], "unavailable")

    def test_ratio_accepts_three_decimals_and_rejects_four(self) -> None:
        self.assertEqual(str(LogicalChannelCreate(name="a", channel_type=1, base_url="https://x.test", api_key="k", models=["m"], cost_ratio="1.125").cost_ratio), "1.125")
        self.assertEqual(cost_ratio_to_millis("1.125"), 1125)
        with self.assertRaises(ValueError):
            LogicalChannelCreate(name="a", channel_type=1, base_url="https://x.test", api_key="k", models=["m"], cost_ratio="1.1250")
        with self.assertRaises(ValueError):
            cost_ratio_to_millis("1.1250")
        with self.assertRaises(ValueError):
            LogicalChannelCreate(name="a", channel_type=1, base_url="https://x.test", api_key="k", models=["m"], cost_ratio="-0.001")


if __name__ == "__main__":
    unittest.main()
