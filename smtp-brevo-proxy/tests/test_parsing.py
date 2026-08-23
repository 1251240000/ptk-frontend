from __future__ import annotations

import unittest
from email.message import EmailMessage

from smtp_proxy.parsing import (
    PasswordResetLinkNotFound,
    QuotaWarningNotFound,
    VerificationCodeNotFound,
    extract_code_from_text,
    extract_password_reset_link,
    extract_quota_warning,
    extract_verification_code,
)


class VerificationCodeParsingTests(unittest.TestCase):
    def test_extracts_code_from_supplied_chinese_text(self) -> None:
        message = EmailMessage()
        message["From"] = "Partokens <no-reply@partokens.com>"
        message["To"] = "user@example.com"
        message["Subject"] = "Partokens邮箱验证邮件"
        message.set_content(
            "您好，你正在进行Partokens邮箱验证。\n\n"
            "您的验证码为: ffa926\n\n"
            "验证码 10 分钟内有效，如果不是本人操作，请忽略。"
        )

        self.assertEqual(extract_verification_code(message.as_bytes()), "ffa926")

    def test_extracts_code_from_html_with_strong_tag(self) -> None:
        message = EmailMessage()
        message["From"] = "no-reply@partokens.com"
        message["To"] = "user@example.com"
        message["Subject"] = "Verification"
        message.set_content(
            "<p>您好，你正在进行Partokens邮箱验证。</p>"
            "<p>您的验证码为: <strong>A1B2C3</strong></p>"
            "<p>验证码 10 分钟内有效，如果不是本人操作，请忽略。</p>",
            subtype="html",
        )

        self.assertEqual(extract_verification_code(message.as_bytes()), "a1b2c3")

    def test_extracts_code_from_new_api_raw_html_shape(self) -> None:
        raw_message = (
            "To: user@example.com\r\n"
            "From: Partokens <no-reply@partokens.com>\r\n"
            "Subject: Partokens verification\r\n"
            "Content-Type: text/html; charset=UTF-8\r\n\r\n"
            "<p>您好，你正在进行Partokens邮箱验证。</p>"
            "<p>您的验证码为: <strong>ffa926</strong></p>"
            "<p>验证码 10 分钟内有效，如果不是本人操作，请忽略。</p>\r\n"
        ).encode("utf-8")

        self.assertEqual(extract_verification_code(raw_message), "ffa926")

    def test_extracts_english_verification_code(self) -> None:
        self.assertEqual(
            extract_code_from_text("Your email verification code is 12abEF."),
            "12abef",
        )

    def test_does_not_treat_expiry_as_a_code(self) -> None:
        with self.assertRaises(VerificationCodeNotFound):
            extract_code_from_text("验证码 10 分钟内有效，如果不是本人操作，请忽略。")


class PasswordResetLinkParsingTests(unittest.TestCase):
    reset_link = (
        "https://partokens.com/user/reset?email=user%40example.com"
        "&token=0123456789abcdef0123456789abcdef"
    )

    def test_extracts_link_from_new_api_html_shape(self) -> None:
        message = EmailMessage()
        message["From"] = "Partokens <no-reply@partokens.com>"
        message["To"] = "user@example.com"
        message["Subject"] = "Partokens密码重置"
        message.set_content(
            "<p>您好，你正在进行Partokens密码重置。</p>"
            f"<p>点击 <a href='{self.reset_link}'>此处</a> 进行密码重置。</p>"
            "<p>如果链接无法点击，请尝试点击下面的链接或将其复制到浏览器中打开："
            f"<br> {self.reset_link} </p>"
            "<p>重置链接 10 分钟内有效，如果不是本人操作，请忽略。</p>",
            subtype="html",
        )

        self.assertEqual(
            extract_password_reset_link(message.as_bytes()), self.reset_link
        )

    def test_extracts_plain_text_link(self) -> None:
        message = EmailMessage()
        message.set_content(f"Reset your password: {self.reset_link}")

        self.assertEqual(
            extract_password_reset_link(message.as_bytes()), self.reset_link
        )

    def test_allows_configured_reset_host(self) -> None:
        link = self.reset_link.replace("partokens.com", "accounts.example.com")
        message = EmailMessage()
        message.set_content(link)

        self.assertEqual(
            extract_password_reset_link(
                message.as_bytes(), ("accounts.example.com",)
            ),
            link,
        )

    def test_rejects_untrusted_host(self) -> None:
        message = EmailMessage()
        message.set_content(self.reset_link.replace("partokens.com", "example.net"))

        with self.assertRaises(PasswordResetLinkNotFound):
            extract_password_reset_link(message.as_bytes())

    def test_rejects_wrong_path_or_missing_token(self) -> None:
        invalid_links = (
            self.reset_link.replace("/user/reset", "/reset"),
            "https://partokens.com/user/reset?email=user%40example.com",
            f"{self.reset_link}&redirect=https%3A%2F%2Fexample.net",
        )
        for link in invalid_links:
            with self.subTest(link=link):
                message = EmailMessage()
                message.set_content(link)
                with self.assertRaises(PasswordResetLinkNotFound):
                    extract_password_reset_link(message.as_bytes())


class QuotaWarningParsingTests(unittest.TestCase):
    def test_extracts_values_from_new_api_html_shape(self) -> None:
        top_up_link = "https://partokens.com/wallet"
        message = EmailMessage()
        message["Subject"] = "您的额度即将用尽"
        message.set_content(
            "<p>您的额度即将用尽，当前剩余额度为 $0.42，为了不影响您的使用，请及时充值。"
            f"<br/>充值链接：<a href='{top_up_link}'>{top_up_link}</a></p>",
            subtype="html",
        )

        details = extract_quota_warning(message.as_bytes())

        self.assertEqual(details.remaining_quota, "$0.42")
        self.assertEqual(details.top_up_link, top_up_link)

    def test_rejects_unrelated_message_with_amount_and_link(self) -> None:
        message = EmailMessage()
        message["Subject"] = "Your receipt"
        message.set_content(
            "Current remaining quota: $0.42\nhttps://partokens.com/wallet"
        )

        with self.assertRaises(QuotaWarningNotFound):
            extract_quota_warning(message.as_bytes())

    def test_rejects_untrusted_or_wrong_path_top_up_link(self) -> None:
        invalid_links = (
            "https://example.net/wallet",
            "https://partokens.com/sign-in",
        )
        for link in invalid_links:
            with self.subTest(link=link):
                message = EmailMessage()
                message["Subject"] = "您的额度即将用尽"
                message.set_content(
                    "您的额度即将用尽，当前剩余额度为 $0.42。\n"
                    f"充值链接：{link}"
                )
                with self.assertRaises(QuotaWarningNotFound):
                    extract_quota_warning(message.as_bytes())


if __name__ == "__main__":
    unittest.main()
