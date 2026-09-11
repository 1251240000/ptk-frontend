from __future__ import annotations

import asyncio
import copy
import json
import tempfile
import unittest
from pathlib import Path
from typing import Any

from admin_api.database import Database
from support import test_vault, encrypted_config
from admin_api.domain import credential_fingerprint, identity_hash
from admin_api.repository import Repository
from admin_api.repository import ConflictError
from admin_api.monitor import Monitor
from admin_api.new_api import NewApiError
from pydantic import ValidationError
from admin_api.routing import RouteService, RouteValidationError
from admin_api.schemas import RoutePlanInput


def metadata(logical_id: str, kind: str, **values: Any) -> str:
    return json.dumps({"partokens_admin": {"schema": 1, "logical_id": logical_id, "kind": kind, **values}})


class FakeNewApi:
    def __init__(self) -> None:
        self.next_id = 100
        self.channels: dict[int, dict[str, Any]] = {
            10: {"id": 10, "type": 1, "name": "A template", "status": 2, "group": "__partokens_catalog__", "models": "gpt-4o", "priority": 0, "weight": 0, "other_info": metadata("lc_a", "template"), "settings": "{}"},
            11: {"id": 11, "type": 1, "name": "B template", "status": 2, "group": "__partokens_catalog__", "models": "gpt-4o", "priority": 0, "weight": 0, "other_info": metadata("lc_b", "template"), "settings": "{}"},
            20: {"id": 20, "type": 1, "name": "old A", "status": 1, "group": "plus", "models": "gpt-4o", "priority": 1000, "weight": 100, "other_info": metadata("lc_a", "route", group="plus", attempt=0, weight=100, route_revision=1), "settings": "{}"},
        }

    async def get_groups(self, token: str) -> list[str]:
        return ["plus"]

    async def get_retry_times(self, token: str) -> int:
        return 2

    async def list_channels(self, token: str) -> list[dict[str, Any]]:
        return [copy.deepcopy(channel) for channel in self.channels.values()]

    async def add_channel(self, token: str, channel: dict[str, Any]) -> None:
        self.channels[self.next_id] = {**copy.deepcopy(channel), "id": self.next_id}
        self.next_id += 1

    async def copy_channel(self, token: str, channel_id: int, suffix: str) -> int:
        copied = copy.deepcopy(self.channels[channel_id])
        copied["id"] = self.next_id
        copied["name"] += suffix
        self.channels[self.next_id] = copied
        self.next_id += 1
        return copied["id"]

    async def get_channel(self, token: str, channel_id: int) -> dict[str, Any]:
        channel = copy.deepcopy(self.channels[channel_id])
        channel["credential_fingerprint"] = credential_fingerprint(channel.get("key", ""))
        return channel

    async def update_channel(self, token: str, channel: dict[str, Any]) -> dict[str, Any]:
        channel_id = int(channel["id"])
        self.channels[channel_id].update(copy.deepcopy(channel))
        return copy.deepcopy(self.channels[channel_id])

    async def batch_status(self, token: str, channel_ids: list[int], status: int) -> int:
        for channel_id in channel_ids:
            self.channels[channel_id]["status"] = status
        return len(channel_ids)


class RouteServiceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        database = Database(Path(self.temp.name) / "admin.sqlite3")
        database.initialize()
        self.repository = Repository(database, test_vault())
        for logical_id, name, template_id in [("lc_a", "A", 10), ("lc_b", "B", 11)]:
            fingerprint = credential_fingerprint(logical_id)
            self.repository.create_logical({
                "id": logical_id, "name": name, "channel_type": 1, "base_url": "https://api.example.com/v1",
                "identity_hash": identity_hash(1, f"https://api.example.com/{logical_id}", fingerprint),
                "credential_fingerprint": fingerprint, "cost_ratio": 0.08, "models": ["gpt-4o"],
                "note": "", "config_ciphertext": encrypted_config(logical_id, logical_id),
            })
        self.client = FakeNewApi()
        for channel in self.client.channels.values():
            channel["tag"] = "ptlc:" + json.loads(channel["other_info"])["partokens_admin"]["logical_id"]
        self.service = RouteService(self.repository, self.client)  # type: ignore[arg-type]

    def tearDown(self) -> None:
        self.temp.cleanup()

    async def test_preview_rejects_cross_layer_duplicates(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [{"members": [{"logical_id": "lc_a", "weight": 1}]}, {"members": [{"logical_id": "lc_a", "weight": 1}]}]})
        with self.assertRaises(RouteValidationError):
            await self.service.preview("Bearer root", "plus", request)

    async def test_executes_revision_and_archives_old_record(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [
            {"members": [{"logical_id": "lc_a", "weight": 60}, {"logical_id": "lc_b", "weight": 40}]},
        ]})
        result = await self.service.execute("Bearer root", "plus", request, {"id": 1, "username": "root"})
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.client.channels[20]["status"], 2)
        active = [channel for channel in self.client.channels.values() if channel["group"] == "plus" and channel["status"] == 1]
        self.assertEqual(len(active), 2)
        self.assertEqual({channel["weight"] for channel in active}, {40, 60})
        self.assertEqual(self.repository.route("plus")["revision"], 1)  # type: ignore[index]

    async def test_serializes_preview_and_execution_across_concurrent_saves(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [
            {"members": [{"logical_id": "lc_a", "weight": 100}]},
        ]})
        first, second = await asyncio.gather(
            self.service.execute("Bearer root", "plus", request, {"id": 1, "username": "root"}),
            self.service.execute("Bearer root", "plus", request, {"id": 1, "username": "root"}),
        )

        self.assertEqual([first["revision"], second["revision"]], [1, 2])
        self.assertEqual(self.repository.route("plus")["revision"], 2)  # type: ignore[index]
        active = [channel for channel in self.client.channels.values() if channel["group"] == "plus" and channel["status"] == 1]
        self.assertEqual(len(active), 1)
        self.assertEqual(json.loads(active[0]["other_info"])["partokens_admin"]["route_revision"], 2)

    async def test_numeric_priorities_round_trip_and_monitor(self) -> None:
        request = RoutePlanInput.model_validate({"expected_revision": 0, "layers": [
            {"priority": -321, "members": [{"logical_id": "lc_a", "weight": 7}]},
            {"priority": 4321, "members": [{"logical_id": "lc_b", "weight": 123}]},
        ]})
        plan = await self.service.preview("root", "plus", request)
        request.preview_token = plan["preview_token"]
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "success")
        self.assertEqual([layer["priority"] for layer in self.repository.route("plus")["config"]["layers"]], [4321, -321])
        for channel in self.client.channels.values():
            if channel["status"] == 1:
                self.assertIn(channel["priority"], [4321, -321])
                self.assertEqual(channel["base_url"], "https://api.example.com/v1")

    async def test_revision_and_preview_conflicts_do_not_write(self) -> None:
        request = RoutePlanInput.model_validate({"expected_revision": 0, "layers": [{"priority": 37, "members": [{"logical_id": "lc_a", "weight": 1}]}]})
        plan = await self.service.preview("root", "plus", request)
        request.preview_token = plan["preview_token"]
        self.repository.update_logical("lc_a", {"config_version": 2})
        with self.assertRaises(ConflictError):
            await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(self.client.next_id, 100)
        request.preview_token = None
        await self.service.execute("root", "plus", request, {"id": 1})
        with self.assertRaises(ConflictError):
            await self.service.execute("root", "plus", request, {"id": 1})

    async def test_nonstandard_preview_then_acknowledged_save_preserves_physical_channels(self) -> None:
        legacy = {"id": 30, "name": "Legacy shared channel", "group": "plus,other", "status": 1, "models": "gpt-4o"}
        unrelated = {"id": 31, "name": "Other channel", "group": "other", "status": 2}
        self.client.channels.update({30: copy.deepcopy(legacy), 31: copy.deepcopy(unrelated)})
        request = RoutePlanInput.model_validate({"layers": [{"priority": 37, "members": [{"logical_id": "lc_a", "weight": 1}]}]})
        before = copy.deepcopy(self.client.channels)
        plan = await self.service.preview("root", "plus", request)
        self.assertEqual(plan["nonstandard_channels"], [{"id": 30, "name": legacy["name"], "status": 1}])
        self.assertEqual(plan["summary"]["nonstandard_untouched"], 1)
        self.assertEqual(self.client.channels, before)
        request.preview_token = plan["preview_token"]
        with self.assertRaisesRegex(RouteValidationError, "请先核对并确认保留"):
            await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(self.client.channels, before)
        self.assertEqual(self.repository.unfinished_route_changes(), [])
        self.assertIsNone(self.repository.route("plus"))
        request.acknowledge_nonstandard = True
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.client.channels[30], legacy)
        self.assertEqual(self.client.channels[31], unrelated)

    async def test_nonstandard_changes_invalidate_acknowledged_preview(self) -> None:
        self.client.channels[30] = {"id": 30, "name": "Legacy channel", "group": "plus", "status": 2}
        request = RoutePlanInput.model_validate({"layers": [], "confirm_empty": True})
        for field, value in [("status", 1), ("name", "Renamed channel"), ("group", "other")]:
            with self.subTest(field=field):
                request.preview_token = None
                plan = await self.service.preview("root", "plus", request)
                request.preview_token = plan["preview_token"]
                request.acknowledge_nonstandard = True
                original = self.client.channels[30][field]
                self.client.channels[30][field] = value
                with self.assertRaises(ConflictError):
                    await self.service.execute("root", "plus", request, {"id": 1})
                self.client.channels[30][field] = original
        self.assertEqual(self.client.next_id, 100)
        self.assertEqual(self.repository.unfinished_route_changes(), [])

    async def test_clear_requires_confirmation_and_leaves_other_group_and_templates(self) -> None:
        request = RoutePlanInput(layers=[])
        with self.assertRaises(RouteValidationError):
            await self.service.preview("root", "plus", request)
        other = copy.deepcopy(self.client.channels[20])
        other.update(id=21, group="other", other_info=metadata("lc_a", "route", group="other", route_revision=1))
        self.client.channels[21] = other
        request.confirm_empty = True
        plan = await self.service.preview("root", "plus", request)
        self.assertEqual(plan["uncovered_models"], ["gpt-4o"])
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.repository.route("plus")["config"]["layers"], [])
        self.assertEqual(self.client.channels[21], other)
        self.assertEqual(self.client.channels[10]["status"], 2)
        self.assertEqual(self.client.channels[20]["status"], 2)

    async def test_partial_failure_blocks_new_save_and_continues_without_duplicate_copies(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [{"priority": 77, "members": [{"logical_id": "lc_a", "weight": 11}]}]})
        original = self.client.batch_status
        async def fail(*args: Any) -> int:
            raise NewApiError("temporary upstream error")
        self.client.batch_status = fail
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "partial")
        self.assertIsNone(self.repository.route("plus"))
        with self.assertRaises(ConflictError):
            await self.service.execute("root", "plus", request, {"id": 1})
        self.client.batch_status = original
        resumed = await self.service.continue_change("root", result["id"])
        self.assertEqual(resumed["status"], "success")
        self.assertEqual(self.client.next_id, 101)

    async def test_templates_are_not_needed_and_missing_local_credentials_block_writes(self) -> None:
        self.client.channels.pop(10)
        self.client.channels.pop(11)
        request = RoutePlanInput.model_validate({"layers": [{"members": [{"logical_id": "lc_a", "weight": 100}]}]})
        self.repository.update_logical("lc_a", {"config_ciphertext": None})
        with self.assertRaisesRegex(ConflictError, "重新录入"):
            await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(self.client.next_id, 100)
        self.repository.update_logical("lc_a", {"config_ciphertext": encrypted_config("lc_a", "lc_a")})
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "success")

    async def test_final_read_detects_priority_drift(self) -> None:
        original = self.client.batch_status
        async def corrupt(token: str, ids: list[int], status: int) -> int:
            result = await original(token, ids, status)
            if status == 1:
                self.client.channels[ids[0]]["priority"] = 1000
            return result
        self.client.batch_status = corrupt
        request = RoutePlanInput.model_validate({"layers": [{"priority": 73, "members": [{"logical_id": "lc_a", "weight": 100}]}]})
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "partial")
        self.assertEqual(next(step["status"] for step in result["steps"] if step["action"] == "enable_new"), "failed")
        self.assertEqual(self.client.channels[20]["status"], 1)
        self.assertIsNone(self.repository.route("plus"))

    async def test_model_less_and_disabled_channels_cannot_be_added(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [{"priority": 1, "members": [{"logical_id": "lc_a", "weight": 100}]}]})
        self.repository.update_logical("lc_a", {"enabled": False})
        with self.assertRaises(RouteValidationError):
            await self.service.preview("root", "plus", request)
        self.repository.update_logical("lc_a", {"enabled": True})
        self.repository.update_logical_models("lc_a", [], None)
        with self.assertRaises(RouteValidationError):
            await self.service.preview("root", "plus", request)

    async def test_existing_disabled_binding_is_not_reenabled_by_edit(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [{"priority": 123, "members": [{"logical_id": "lc_a", "weight": 100}]}]})
        await self.service.execute("root", "plus", request, {"id": 1})
        self.repository.update_logical("lc_a", {"enabled": False})
        result = await self.service.execute("root", "plus", request, {"id": 1})
        self.assertEqual(result["status"], "success")
        self.assertFalse(any(channel["status"] == 1 for channel in self.client.channels.values()))

    async def test_retry_limit_and_duplicate_priorities(self) -> None:
        request = RoutePlanInput.model_validate({"layers": [{"priority": priority, "members": [{"logical_id": str(priority), "weight": 100}]} for priority in [700, 500, 300, 100]]})
        with self.assertRaisesRegex(RouteValidationError, "全局重试"):
            await self.service.preview("root", "plus", request)
        request = RoutePlanInput.model_validate({"layers": [{"priority": 12, "members": [{"logical_id": logical_id, "weight": 100}]} for logical_id in ["lc_a", "lc_b"]]})
        with self.assertRaisesRegex(RouteValidationError, "同一层"):
            await self.service.preview("root", "plus", request)

    def test_numbers_are_strict_integers(self) -> None:
        for field, value in [("priority", 1.5), ("priority", True), ("priority", 2147483648), ("weight", 0), ("weight", 1.5), ("weight", "100")]:
            layer = {"priority": 123, "members": [{"logical_id": "lc_a", "weight": 100}]}
            if field == "priority":
                layer[field] = value
            else:
                layer["members"][0][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValidationError):
                RoutePlanInput.model_validate({"layers": [layer]})


if __name__ == "__main__":
    unittest.main()
