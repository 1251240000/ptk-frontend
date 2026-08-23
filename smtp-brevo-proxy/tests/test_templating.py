from __future__ import annotations

import unittest
from pathlib import Path

from smtp_proxy.templating import (
    CustomerServiceTemplateRenderer,
    PasswordResetTemplateRenderer,
    QuotaWarningTemplateRenderer,
    VerificationTemplateRenderer,
)


TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class VerificationTemplateTests(unittest.TestCase):
    def test_renders_code_into_html_and_text(self) -> None:
        rendered = VerificationTemplateRenderer(TEMPLATE_DIR).render("ffa926")

        self.assertIn("ffa926", rendered.html)
        self.assertIn("ffa926", rendered.text)
        self.assertNotIn("{{ params.code }}", rendered.html)
        self.assertNotIn("{{ params.code }}", rendered.text)
        self.assertIn("support@partokens.com", rendered.html)


class CustomerServiceTemplateTests(unittest.TestCase):
    def test_renders_notice_details_into_html_and_text(self) -> None:
        rendered = CustomerServiceTemplateRenderer(TEMPLATE_DIR).render(
            credit_amount="$100",
            outage_duration="8 hours",
            notice_date="August 4, 2026",
        )

        for content in (rendered.html, rendered.text):
            self.assertIn("$100", content)
            self.assertIn("8 hours", content)
            self.assertIn("August 4, 2026", content)
            self.assertNotIn("{{ params.", content)
        self.assertIn("fully restored", rendered.html)
        self.assertIn("support@partokens.com", rendered.html)


class PasswordResetTemplateTests(unittest.TestCase):
    def test_renders_reset_link_into_html_and_text(self) -> None:
        reset_link = (
            "https://partokens.com/user/reset?email=user%40example.com"
            "&token=0123456789abcdef0123456789abcdef"
        )
        rendered = PasswordResetTemplateRenderer(TEMPLATE_DIR).render(reset_link)

        self.assertIn("Reset your password", rendered.html)
        self.assertIn("Reset password", rendered.html)
        self.assertIn(reset_link.replace("&", "&amp;"), rendered.html)
        self.assertIn(reset_link, rendered.text)
        self.assertNotIn("{{ params.reset_link }}", rendered.html)
        self.assertIn("support@partokens.com", rendered.html)


class QuotaWarningTemplateTests(unittest.TestCase):
    def test_renders_remaining_quota_and_top_up_link(self) -> None:
        top_up_link = "https://partokens.com/wallet"
        rendered = QuotaWarningTemplateRenderer(TEMPLATE_DIR).render(
            remaining_quota="$0.42",
            top_up_link=top_up_link,
        )

        for content in (rendered.html, rendered.text):
            self.assertIn("$0.42", content)
            self.assertIn(top_up_link, content)
            self.assertNotIn("{{ params.", content)
        self.assertIn("Your quota is running low", rendered.html)
        self.assertIn("support@partokens.com", rendered.html)


if __name__ == "__main__":
    unittest.main()
