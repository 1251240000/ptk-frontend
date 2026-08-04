from __future__ import annotations

import unittest
from pathlib import Path

from smtp_proxy.templating import (
    CustomerServiceTemplateRenderer,
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


if __name__ == "__main__":
    unittest.main()
