from __future__ import annotations

import unittest

from admin_api.config import ConfigError, Settings


class SettingsTests(unittest.TestCase):
    def test_builds_lightweight_defaults(self) -> None:
        settings = Settings.from_mapping({})
        self.assertEqual(settings.new_api_origin, "http://localhost:3000")
        self.assertEqual(settings.monitor_interval_seconds, 60)
        self.assertEqual(settings.log_interval_seconds, 300)
        self.assertIsNone(settings.service_token)

    def test_rejects_credentials_in_origin(self) -> None:
        with self.assertRaises(ConfigError):
            Settings.from_mapping({"PARTOKENS_ADMIN_NEW_API_ORIGIN": "https://root:secret@example.com"})

    def test_requires_positive_intervals(self) -> None:
        with self.assertRaises(ConfigError):
            Settings.from_mapping({"PARTOKENS_ADMIN_MONITOR_INTERVAL_SECONDS": "0"})


if __name__ == "__main__":
    unittest.main()
