from __future__ import annotations

import unittest

from smtp_proxy.config import ConfigError, Settings


class SettingsTests(unittest.TestCase):
    def test_builds_subject_with_code(self) -> None:
        settings = Settings.from_mapping(
            {
                "BREVO_API_KEY": "test-key",
                "BREVO_SENDER_EMAIL": "no-reply@partokens.com",
            }
        )

        self.assertEqual(
            settings.subject_for("ffa926"),
            "ffa926 is your Partokens verification code",
        )

    def test_requires_code_in_subject_template(self) -> None:
        with self.assertRaises(ConfigError):
            Settings.from_mapping(
                {
                    "BREVO_API_KEY": "test-key",
                    "BREVO_SENDER_EMAIL": "no-reply@partokens.com",
                    "EMAIL_SUBJECT_TEMPLATE": "Partokens verification code",
                }
            )

    def test_requires_brevo_api_key(self) -> None:
        with self.assertRaises(ConfigError):
            Settings.from_mapping(
                {"BREVO_SENDER_EMAIL": "no-reply@partokens.com"}
            )

    def test_parses_password_reset_allowed_hosts(self) -> None:
        settings = Settings.from_mapping(
            {
                "BREVO_API_KEY": "test-key",
                "BREVO_SENDER_EMAIL": "no-reply@partokens.com",
                "PASSWORD_RESET_ALLOWED_HOSTS": "partokens.com, Accounts.EXAMPLE.com.",
            }
        )

        self.assertEqual(
            settings.password_reset_allowed_hosts,
            ("partokens.com", "accounts.example.com"),
        )


if __name__ == "__main__":
    unittest.main()
