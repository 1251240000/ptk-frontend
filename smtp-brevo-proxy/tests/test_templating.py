from __future__ import annotations

import unittest
from pathlib import Path

from smtp_proxy.templating import VerificationTemplateRenderer


TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class VerificationTemplateTests(unittest.TestCase):
    def test_renders_code_into_html_and_text(self) -> None:
        rendered = VerificationTemplateRenderer(TEMPLATE_DIR).render("ffa926")

        self.assertIn("ffa926", rendered.html)
        self.assertIn("ffa926", rendered.text)
        self.assertNotIn("{{ params.code }}", rendered.html)
        self.assertNotIn("{{ params.code }}", rendered.text)
        self.assertIn("support@partokens.com", rendered.html)


if __name__ == "__main__":
    unittest.main()
