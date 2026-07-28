from __future__ import annotations

import unittest
from email.message import EmailMessage

from smtp_proxy.parsing import (
    VerificationCodeNotFound,
    extract_code_from_text,
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


if __name__ == "__main__":
    unittest.main()
