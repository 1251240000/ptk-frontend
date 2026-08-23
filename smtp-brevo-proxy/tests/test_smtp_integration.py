from __future__ import annotations

import smtplib
import socket
import unittest
from email.message import EmailMessage
from pathlib import Path

from aiosmtpd.controller import Controller

from smtp_proxy.config import Settings
from smtp_proxy.handler import SMTPProxyHandler
from smtp_proxy.templating import (
    PasswordResetTemplateRenderer,
    RenderedEmail,
    VerificationTemplateRenderer,
)


TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class RecordingBrevoClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, RenderedEmail, tuple[str, ...]]] = []

    async def send(
        self,
        recipient: str,
        subject: str,
        content: RenderedEmail,
        *,
        tags: tuple[str, ...] = ("email-verification",),
    ) -> str:
        self.calls.append((recipient, subject, content, tags))
        return "integration-message-id"


def available_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


class SMTPIntegrationTests(unittest.TestCase):
    def test_accepts_new_api_message_and_rewrites_it(self) -> None:
        settings = Settings(
            brevo_api_key="test-key",
            brevo_sender_email="no-reply@partokens.com",
            smtp_listen_host="127.0.0.1",
            smtp_listen_port=available_port(),
            template_dir=TEMPLATE_DIR,
        )
        brevo = RecordingBrevoClient()
        handler = SMTPProxyHandler(
            settings,
            VerificationTemplateRenderer(TEMPLATE_DIR),
            PasswordResetTemplateRenderer(TEMPLATE_DIR),
            brevo,  # type: ignore[arg-type]
        )
        controller = Controller(
            handler,
            hostname=settings.smtp_listen_host,
            port=settings.smtp_listen_port,
            ident="Partokens SMTP Brevo Proxy Test",
            enable_SMTPUTF8=True,
            decode_data=False,
            data_size_limit=settings.smtp_max_message_bytes,
            ready_timeout=5.0,
        )

        message = EmailMessage()
        message["From"] = "Partokens <no-reply@partokens.com>"
        message["To"] = "user@example.com"
        message["Subject"] = "Partokens邮箱验证邮件"
        message.set_content(
            "您好，你正在进行Partokens邮箱验证。\n\n"
            "您的验证码为: ffa926\n\n"
            "验证码 10 分钟内有效，如果不是本人操作，请忽略。"
        )

        controller.start()
        try:
            with smtplib.SMTP(
                settings.smtp_listen_host,
                settings.smtp_listen_port,
                timeout=5,
            ) as smtp:
                smtp.send_message(
                    message,
                    from_addr="no-reply@partokens.com",
                    to_addrs=["user@example.com"],
                )
        finally:
            controller.stop()

        self.assertEqual(len(brevo.calls), 1)
        recipient, subject, rendered, tags = brevo.calls[0]
        self.assertEqual(recipient, "user@example.com")
        self.assertEqual(subject, "ffa926 is your Partokens verification code")
        self.assertIn("Verify your email", rendered.html)
        self.assertIn("ffa926", rendered.html)
        self.assertNotIn("您好", rendered.html)
        self.assertEqual(tags, ("email-verification",))

    def test_accepts_new_api_quota_warning_and_rewrites_it(self) -> None:
        settings = Settings(
            brevo_api_key="test-key",
            brevo_sender_email="no-reply@partokens.com",
            smtp_listen_host="127.0.0.1",
            smtp_listen_port=available_port(),
            template_dir=TEMPLATE_DIR,
        )
        brevo = RecordingBrevoClient()
        handler = SMTPProxyHandler(
            settings,
            VerificationTemplateRenderer(TEMPLATE_DIR),
            PasswordResetTemplateRenderer(TEMPLATE_DIR),
            brevo,  # type: ignore[arg-type]
        )
        controller = Controller(
            handler,
            hostname=settings.smtp_listen_host,
            port=settings.smtp_listen_port,
            ident="Partokens SMTP Brevo Proxy Test",
            enable_SMTPUTF8=True,
            decode_data=False,
            data_size_limit=settings.smtp_max_message_bytes,
            ready_timeout=5.0,
        )

        top_up_link = "https://partokens.com/wallet"
        message = EmailMessage()
        message["From"] = "Partokens <no-reply@partokens.com>"
        message["To"] = "user@example.com"
        message["Subject"] = "您的额度即将用尽"
        message.set_content(
            "<p>您的额度即将用尽，当前剩余额度为 $0.42，为了不影响您的使用，请及时充值。"
            f"<br/>充值链接：<a href='{top_up_link}'>{top_up_link}</a></p>",
            subtype="html",
        )

        controller.start()
        try:
            with smtplib.SMTP(
                settings.smtp_listen_host,
                settings.smtp_listen_port,
                timeout=5,
            ) as smtp:
                smtp.send_message(
                    message,
                    from_addr="no-reply@partokens.com",
                    to_addrs=["user@example.com"],
                )
        finally:
            controller.stop()

        self.assertEqual(len(brevo.calls), 1)
        recipient, subject, rendered, tags = brevo.calls[0]
        self.assertEqual(recipient, "user@example.com")
        self.assertEqual(subject, "Your Partokens quota is running low")
        self.assertIn("$0.42", rendered.html)
        self.assertIn(top_up_link, rendered.text)
        self.assertNotIn("额度", rendered.html)
        self.assertEqual(tags, ("quota-warning",))


if __name__ == "__main__":
    unittest.main()
