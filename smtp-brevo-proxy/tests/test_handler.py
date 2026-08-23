from __future__ import annotations

import asyncio
import unittest
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path

from smtp_proxy.brevo import BrevoTransientError
from smtp_proxy.config import Settings
from smtp_proxy.handler import SMTPProxyHandler
from smtp_proxy.templating import (
    PasswordResetTemplateRenderer,
    RenderedEmail,
    VerificationTemplateRenderer,
)


TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


@dataclass
class FakeEnvelope:
    mail_from: str
    rcpt_tos: list[str]
    content: bytes


class FakeBrevoClient:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[tuple[str, str, RenderedEmail, tuple[str, ...]]] = []

    async def send(
        self,
        recipient: str,
        subject: str,
        content: RenderedEmail,
        *,
        tags: tuple[str, ...] = ("email-verification",),
    ) -> str:
        if self.error is not None:
            raise self.error
        self.calls.append((recipient, subject, content, tags))
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
        self.password_reset_renderer = PasswordResetTemplateRenderer(
            TEMPLATE_DIR
        )

    def handler(self, brevo: FakeBrevoClient) -> SMTPProxyHandler:
        return SMTPProxyHandler(
            self.settings,
            self.renderer,
            self.password_reset_renderer,
            brevo,  # type: ignore[arg-type]
        )

    def test_rewrites_message_and_subject(self) -> None:
        brevo = FakeBrevoClient()
        handler = self.handler(brevo)
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
        recipient, subject, rendered, tags = brevo.calls[0]
        self.assertEqual(recipient, "user@example.com")
        self.assertEqual(subject, "ffa926 is your Partokens verification code")
        self.assertIn("ffa926", rendered.html)
        self.assertEqual(tags, ("email-verification",))
        self.assertIn("message_ids=message-id", logs.output[0])
        self.assertNotIn("user@example.com", logs.output[0])
        self.assertNotIn("ffa926", logs.output[0])

    def test_rejects_unapproved_sender_domain(self) -> None:
        brevo = FakeBrevoClient()
        handler = self.handler(brevo)
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
        handler = self.handler(brevo)
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
        handler = self.handler(brevo)
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message("您的验证码为: ffa926"),
        )

        response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("451"))

    def test_rewrites_password_reset_message(self) -> None:
        reset_link = (
            "https://partokens.com/user/reset?email=user@example.com"
            "&token=0123456789abcdef0123456789abcdef"
        )
        brevo = FakeBrevoClient()
        handler = self.handler(brevo)
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message(
                "<p>您好，你正在进行Partokens密码重置。</p>"
                f"<p>点击 <a href='{reset_link}'>此处</a> 进行密码重置。</p>"
                f"<p>链接：<br> {reset_link} </p>"
                "<p>重置链接 10 分钟内有效。</p>"
            ),
        )

        with self.assertLogs("smtp_proxy.handler", level="INFO") as logs:
            response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("250"))
        self.assertEqual(len(brevo.calls), 1)
        recipient, subject, rendered, tags = brevo.calls[0]
        self.assertEqual(recipient, "user@example.com")
        self.assertEqual(subject, "Reset your Partokens password")
        self.assertIn("Reset your password", rendered.html)
        self.assertIn(reset_link, rendered.text)
        self.assertEqual(tags, ("password-reset",))
        self.assertIn("Delivered password reset email", logs.output[0])
        self.assertNotIn(reset_link, logs.output[0])
        self.assertNotIn("user@example.com", logs.output[0])

    def test_rewrites_new_api_quota_warning_message(self) -> None:
        top_up_link = "https://partokens.com/wallet"
        brevo = FakeBrevoClient()
        handler = self.handler(brevo)
        envelope = FakeEnvelope(
            mail_from="no-reply@partokens.com",
            rcpt_tos=["user@example.com"],
            content=raw_message(
                "<p>您的额度即将用尽，当前剩余额度为 $0.42，为了不影响您的使用，请及时充值。"
                f"<br/>充值链接：<a href='{top_up_link}'>{top_up_link}</a></p>"
            ),
        )

        with self.assertLogs("smtp_proxy.handler", level="INFO") as logs:
            response = asyncio.run(handler.handle_DATA(None, None, envelope))

        self.assertTrue(response.startswith("250"))
        self.assertEqual(len(brevo.calls), 1)
        _, subject, rendered, tags = brevo.calls[0]
        self.assertEqual(subject, "Your Partokens quota is running low")
        self.assertIn("$0.42", rendered.html)
        self.assertIn(top_up_link, rendered.text)
        self.assertEqual(tags, ("quota-warning",))
        self.assertIn("Delivered quota warning email", logs.output[0])


if __name__ == "__main__":
    unittest.main()
