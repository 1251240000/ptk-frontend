from __future__ import annotations

import asyncio
import unittest
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path

from smtp_proxy.brevo import BrevoTransientError
from smtp_proxy.config import Settings
from smtp_proxy.handler import SMTPProxyHandler
from smtp_proxy.templating import RenderedEmail, VerificationTemplateRenderer


TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


@dataclass
class FakeEnvelope:
    mail_from: str
    rcpt_tos: list[str]
    content: bytes


class FakeBrevoClient:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[tuple[str, str, RenderedEmail]] = []

    async def send(
        self, recipient: str, subject: str, content: RenderedEmail
    ) -> str:
        if self.error is not None:
            raise self.error
        self.calls.append((recipient, subject, content))
        return "message-id"


def raw_message(body: str) -> bytes:
    message = EmailMessage()
    message["From"] = "Partokens <no-reply@partokens.com>"
    message["To"] = "user@example.com"
    message["Subject"] = "Partokens邮箱验证邮件"
    message.set_content(body)
    return message.as_bytes()


class SMTPProxyHandlerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            brevo_api_key="test-key",
            brevo_sender_email="no-reply@partokens.com",
            template_dir=TEMPLATE_DIR,
        )
        self.renderer = VerificationTemplateRenderer(TEMPLATE_DIR)

    def test_rewrites_message_and_subject(self) -> None:
        brevo = FakeBrevoClient()
        handler = SMTPProxyHandler(self.settings, self.renderer, brevo)  # type: ignore[arg-type]
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message(
                "您好，你正在进行Partokens邮箱验证。\n\n"
                "您的验证码为: ffa926\n\n"
                "验证码 10 分钟内有效，如果不是本人操作，请忽略。"
            ),
        )

        with self.assertLogs("smtp_proxy.handler", level="INFO") as logs:
            response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("250"))
        self.assertEqual(len(brevo.calls), 1)
        recipient, subject, rendered = brevo.calls[0]
        self.assertEqual(recipient, "user@example.com")
        self.assertEqual(subject, "ffa926 is your Partokens verification code")
        self.assertIn("ffa926", rendered.html)
        self.assertIn("message_ids=message-id", logs.output[0])
        self.assertNotIn("user@example.com", logs.output[0])
        self.assertNotIn("ffa926", logs.output[0])

    def test_rejects_unapproved_sender_domain(self) -> None:
        brevo = FakeBrevoClient()
        handler = SMTPProxyHandler(self.settings, self.renderer, brevo)  # type: ignore[arg-type]
        envelope = FakeEnvelope(
            mail_from="sender@example.net",
            rcpt_tos=["user@example.com"],
            content=raw_message("您的验证码为: ffa926"),
        )

        response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("550"))
        self.assertEqual(brevo.calls, [])

    def test_rejects_message_without_code(self) -> None:
        brevo = FakeBrevoClient()
        handler = SMTPProxyHandler(self.settings, self.renderer, brevo)  # type: ignore[arg-type]
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message("验证码 10 分钟内有效。"),
        )

        response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("550"))
        self.assertEqual(brevo.calls, [])

    def test_returns_temporary_error_for_brevo_throttling(self) -> None:
        brevo = FakeBrevoClient(BrevoTransientError("rate limited"))
        handler = SMTPProxyHandler(self.settings, self.renderer, brevo)  # type: ignore[arg-type]
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message("您的验证码为: ffa926"),
        )

        response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("451"))


if __name__ == "__main__":
    unittest.main()
