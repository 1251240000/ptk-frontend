from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

from admin_api.database import Database
from admin_api.domain import credential_fingerprint, channel_metadata
from admin_api.execution import owned
from admin_api.migration import audit, migrate_route
from admin_api.monitor import Monitor
from admin_api.config import Settings
from admin_api.repository import ConflictError, Repository
from admin_api.schemas import LogicalChannelCreate, LogicalChannelUpdate, LogicalChannelCopy, RoutePlanInput
from admin_api.service import AdminService
from admin_api.vault import CredentialVault
from admin_api.new_api import NewApiError
from support import test_vault
from test_routing import FakeNewApi, metadata


class LocalConfigTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = Database(Path(self.temp.name) / "test.sqlite3")
        self.db.initialize()
        self.repo = Repository(self.db, test_vault())
        self.client = FakeNewApi()
        self.client.channels = {}
        self.monitor = Monitor(Settings.from_mapping({}), self.repo, self.client)
        self.service = AdminService(self.repo, self.client, self.monitor)
        self.secret = "sk-private-source-credential-123456"

    async def create(self):
        channel = await self.service.create_channel("root", LogicalChannelCreate(
            name="monond", channel_type=1, base_url="https://example.test", api_key=self.secret,
            models=["good", "bad"], execution_config='{"header_override":"{\\"X-Provider-Token\\":\\"private-header-secret\\"}"}',
        ), {"id": 1})
        self.logical_id = channel["id"]
        self.route = RoutePlanInput.model_validate({"layers": [{"priority": 77, "members": [{"logical_id": self.logical_id, "weight": 37}]}]})
        return channel

    async def execute(self):
        return await self.service.routes.execute("root", "plus", self.route, {"id": 1})

    async def test_local_creation_encryption_copy_and_edit_do_not_call_upstream(self):
        channel = await self.create()
        self.assertEqual(self.client.channels, {})
        self.assertNotIn("template_channel_id", channel)
        self.assertEqual(channel["credential_status"], "ready")
        for secret in [self.secret, "private-header-secret"]:
            self.assertNotIn(secret, json.dumps(channel))
            self.assertNotIn(secret, self.db.path.read_bytes().decode(errors="replace"))
        copied = await self.service.copy_channel("root", self.logical_id, LogicalChannelCopy(api_key="different-private-key"), {"id": 1})
        self.assertEqual(self.repo.channel_config(copied["id"])["header_override"], self.repo.channel_config(self.logical_id)["header_override"])
        updated = self.service.update_channel(self.logical_id, LogicalChannelUpdate(api_key="replacement-private-key"))
        self.assertEqual(updated["config_version"], 2)
        self.assertEqual(self.repo.channel_config(self.logical_id)["key"], "replacement-private-key")
        self.assertEqual(self.client.channels, {})

    def test_authenticated_encryption_random_nonce_wrong_key_and_owner(self):
        vault = test_vault()
        first = vault.encrypt("lc_one", {"key": self.secret})
        self.assertNotEqual(first, vault.encrypt("lc_one", {"key": self.secret}))
        self.assertEqual(vault.decrypt("lc_one", first)["key"], self.secret)
        for key, owner, data in [(vault, "lc_two", first), (CredentialVault(b"y" * 32), "lc_one", first), (vault, "lc_one", first[:-8] + "AAAAAAAA")]:
            with self.assertRaises(ConflictError) as context:
                key.decrypt(owner, data)
            self.assertNotIn(self.secret, str(context.exception))

    async def test_lost_create_response_is_reconciled_without_duplicate(self):
        await self.create()
        original = self.client.add_channel
        async def lost(token, payload):
            await original(token, payload)
            raise NewApiError(self.secret, kind="timeout")
        self.client.add_channel = lost
        change = await self.execute()
        self.assertEqual(change["status"], "partial")
        self.assertNotIn(self.secret, json.dumps(change))
        self.client.add_channel = original
        resumed = await self.service.routes.continue_change("root", change["id"])
        self.assertEqual(resumed["status"], "success")
        self.assertEqual(len(self.client.channels), 1)
        for secret in [self.secret, "private-header-secret"]:
            self.assertNotIn(secret, json.dumps(resumed))
            self.assertNotIn(secret, self.db.path.read_bytes().decode(errors="replace"))

    async def test_ambiguous_create_without_visible_record_never_posts_again(self):
        await self.create()
        add = AsyncMock(side_effect=NewApiError("timeout", kind="timeout"))
        self.client.add_channel = add
        change = await self.execute()
        await self.service.routes.continue_change("root", change["id"])
        self.assertEqual(add.await_count, 1)
        self.assertEqual(self.repo.change(change["id"])["status"], "partial")

    async def test_wrong_credential_or_hidden_override_prevents_enable(self):
        await self.create()
        original = self.client.add_channel
        async def corrupt(token, payload):
            await original(token, payload)
            self.client.channels[100]["key"] = "another-secret"
        self.client.add_channel = corrupt
        change = await self.execute()
        self.assertEqual(change["status"], "partial")
        self.assertEqual(self.client.channels[100]["status"], 2)
        self.assertIsNone(self.repo.route("plus"))

    async def test_restart_continues_and_does_not_mutate_foreign_records(self):
        await self.create()
        self.client.channels[51] = {"id": 51, "name": "foreign", "group": "other", "status": 1}
        foreign = copy.deepcopy(self.client.channels[51])
        original = self.client.batch_status
        self.client.batch_status = AsyncMock(side_effect=NewApiError("failure"))
        change = await self.execute()
        self.client.batch_status = original
        restarted = AdminService(Repository(self.db, test_vault()), self.client, self.monitor)
        result = await restarted.routes.continue_change("root", change["id"])
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.client.channels[51], foreign)
        self.assertEqual(len(self.client.channels), 2)

    async def test_ownership_change_stops_resume(self):
        await self.create()
        self.client.batch_status = AsyncMock(side_effect=NewApiError("failure"))
        change = await self.execute()
        self.client.channels[100]["tag"] = "foreign"
        calls = self.client.batch_status.await_count
        result = await self.service.routes.continue_change("root", change["id"])
        self.assertEqual(result["status"], "partial")
        self.assertEqual(self.client.batch_status.await_count, calls)

    async def test_monitor_detects_missing_records_and_credential_config_drift(self):
        await self.create()
        self.assertEqual((await self.execute())["status"], "success")
        self.assertFalse((await self.monitor.refresh("root", include_logs=False))["details"]["issues"])
        self.client.channels[100]["key"] = "different-key"
        self.client.channels[100]["other_info"] = json.dumps({**json.loads(self.client.channels[100]["other_info"]), "status_reason": self.secret})
        snapshot = await self.monitor.refresh("root", include_logs=False)
        self.assertIn("drift", [item["kind"] for item in snapshot["details"]["issues"]])
        self.assertNotIn(self.secret, json.dumps(snapshot))
        self.client.channels.clear()
        snapshot = await self.monitor.refresh("root", include_logs=False)
        self.assertIn("missing", [item["kind"] for item in snapshot["details"]["issues"]])

    async def test_migrate_real_incident_shape_preserves_history_and_prepared_record(self):
        await self.create()
        self.db.execute("UPDATE logical_channels SET template_channel_id = 31, config_ciphertext = NULL WHERE id = ?", (self.logical_id,))
        self.repo.create_change({"id": "old_model", "kind": "model_remove", "target": self.logical_id, "status": "partial",
            "plan": {"logical_id": self.logical_id, "retain_models": ["good"], "logical_after_model_mapping": None},
            "steps": [{"action": "update_models", "status": "success", "result": {"channel_id": 31}}], "actor_id": 1, "actor_name": "root"})
        self.repo.create_change({"id": "old_route", "kind": "route_revision", "target": "plus", "status": "partial",
            "plan": {"route": self.route.model_dump(), "desired": []},
            "steps": [{"action": "copy", "status": "success", "result": {"channel_id": 24}}], "actor_id": 1, "actor_name": "root"})
        self.client.channels[24] = {"id": 24, "tag": f"ptlc:{self.logical_id}", "status": 2, "group": "plus",
                                    "other_info": metadata(self.logical_id, "route", group="plus", route_revision=1)}
        report = await audit(self.repo, self.client, "root")
        self.assertEqual(report["channels"][0]["credential_status"], "missing")
        self.assertFalse(report["channels"][0]["legacy_template_present"])
        with self.assertRaises(ConflictError):
            await migrate_route(self.service, "root", "old_route")
        self.service.update_channel(self.logical_id, LogicalChannelUpdate(api_key=self.secret))
        await migrate_route(self.service, "root", "old_model")
        plan = await migrate_route(self.service, "root", "old_route")
        self.assertEqual(plan["plan"]["desired"][0]["models"], ["good"])
        self.assertIn(24, plan["plan"]["old_channel_ids"])
        self.assertEqual(self.db.fetch_one("SELECT count(*) AS n FROM change_migrations")["n"], 2)
        self.assertEqual((await self.service.routes.continue_change("root", "old_route"))["status"], "success")
        self.assertEqual(channel_metadata(self.client.channels[24])["kind"], "archive")
        self.assertEqual(self.db.fetch_one("SELECT template_channel_id FROM logical_channels")["template_channel_id"], 31)

    async def test_additive_schema_migration_does_not_destroy_legacy_data(self):
        await self.create()
        self.db.execute("ALTER TABLE logical_channels DROP COLUMN config_ciphertext")
        self.db.execute("ALTER TABLE logical_channels DROP COLUMN config_version")
        self.db.execute("UPDATE schema_version SET version = 3")
        self.db.initialize()
        self.db.initialize()
        row = self.repo.logical_row(self.logical_id)
        self.assertEqual(row["name"], "monond")
        self.assertIsNone(row["config_ciphertext"])
        with self.assertRaises(ConflictError):
            self.repo.channel_config(self.logical_id)
