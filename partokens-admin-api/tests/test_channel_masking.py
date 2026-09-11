from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

from admin_api.database import Database
from support import test_vault, encrypted_config
from admin_api.domain import masked_api_key
from admin_api.repository import Repository
from admin_api.schemas import LogicalChannelCreate, LogicalChannelUpdate
from admin_api.service import AdminService


class ChannelMaskingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.database = Database(Path(self.temp.name) / "admin.sqlite3")
        self.database.initialize()
        self.repository = Repository(self.database, test_vault())
        self.client = AsyncMock()
        self.service = AdminService(self.repository, self.client, AsyncMock())

    def test_masks_prefix_and_body_without_revealing_short_or_multiline_keys(self) -> None:
        for secret, expected in [
            ("sk-abcSECRETabcd", "sk-abc.....abcd"),
            ("abcSECRETabcd", "abc.....abcd"),
            ("sk-1234567", "sk-....."),
            ("sk-x", "sk-....."),
            ("", "....."),
            ("sk-first-secret\nsk-second-secret", "sk-....."),
        ]:
            with self.subTest(secret=secret):
                self.assertEqual(masked_api_key(secret), expected)

    async def test_create_persists_and_returns_only_masked_key(self) -> None:
        secret = "sk-abcHIDDEN-CREDENTIALabcd"
        self.client.list_channels.side_effect = lambda _: [{
            **self.client.add_channel.call_args.args[1], "id": 10,
        }]
        channel = await self.service.create_channel("Bearer root", LogicalChannelCreate(
            name="A", channel_type=1, base_url="https://example.test", api_key=secret, models=["gpt-4o"],
        ), {"id": 1, "username": "root"})
        self.assertEqual(channel["masked_key"], "sk-abc.....abcd")
        self.assertNotIn(secret, json.dumps(channel))
        self.assertNotIn(secret, json.dumps(self.repository.logical_rows()))
        self.client.add_channel.assert_not_called()
        self.assertEqual(self.repository.channel_config(channel["id"])["key"], secret)
        updated = self.service.update_channel(channel["id"], LogicalChannelUpdate(name="Renamed"))
        self.assertEqual(updated["masked_key"], "sk-abc.....abcd")

    async def test_migrates_legacy_rows_and_caches_only_upstream_mask(self) -> None:
        self.repository.create_logical({
            "id": "lc_legacy", "name": "Legacy", "channel_type": 1, "base_url": "https://example.test",
            "identity_hash": "identity", "credential_fingerprint": "sha256:hash", "models": [], "template_channel_id": 10,
        })
        self.database.execute("ALTER TABLE logical_channels DROP COLUMN masked_key")
        self.database.execute("UPDATE schema_version SET version = 2")
        self.database.initialize()
        self.database.initialize()
        self.client.get_channel.return_value = {"id": 10, "masked_key": "sk-abc.....abcd"}
        for _ in range(2):
            channels = await self.service.list_channels("Bearer root")
            self.assertIsNone(channels[0]["masked_key"])
            self.assertEqual(channels[0]["credential_status"], "missing")
        self.client.get_channel.assert_not_called()
        self.assertEqual(self.database.fetch_one("SELECT version FROM schema_version")["version"], 4)

    async def test_old_upstream_never_returns_its_raw_key(self) -> None:
        self.repository.create_logical({
            "id": "lc_legacy", "name": "Legacy", "channel_type": 1, "base_url": "https://example.test",
            "identity_hash": "identity", "credential_fingerprint": "sha256:hash", "models": [], "template_channel_id": 10,
        })
        self.client.get_channel.return_value = {"id": 10, "key": "sk-abcSECRETabcd"}
        channels = await self.service.list_channels("Bearer root")
        self.assertIsNone(channels[0]["masked_key"])
        self.assertNotIn("SECRET", json.dumps(channels))
