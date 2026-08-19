from __future__ import annotations

import argparse
import os
import smtplib
from email.message import EmailMessage


SAMPLE_CODE = "ffa926"
SAMPLE_RESET_TOKEN = "0123456789abcdef0123456789abcdef"


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a sample transactional email")
    parser.add_argument("--to", required=True, help="Envelope recipient")
    parser.add_argument(
        "--kind",
        choices=("verification", "password-reset"),
        default="verification",
        help="Source email shape to send",
    )
    parser.add_argument(
        "--from",
        dest="sender",
        default="no-reply@partokens.com",
        help="Envelope sender",
    )
    parser.add_argument(
        "--host", default=os.getenv("SMTP_PROXY_HOST", "127.0.0.1")
    )
    parser.add_argument(
        "--port", type=int, default=int(os.getenv("SMTP_PROXY_PORT", "2525"))
    )
    args = parser.parse_args()

    if args.kind == "password-reset":
        reset_link = (
            f"https://partokens.com/user/reset?email={args.to}"
            f"&token={SAMPLE_RESET_TOKEN}"
        )
        subject = "Partokens密码重置"
        text = (
            "您好，你正在进行Partokens密码重置。\n\n"
            f"点击下面的链接进行密码重置：\n{reset_link}\n\n"
            "重置链接 10 分钟内有效，如果不是本人操作，请忽略。"
        )
        html = (
            "<p>您好，你正在进行Partokens密码重置。</p>"
            f"<p>点击 <a href='{reset_link}'>此处</a> 进行密码重置。</p>"
            "<p>如果链接无法点击，请尝试点击下面的链接或将其复制到浏览器中打开："
            f"<br> {reset_link} </p>"
            "<p>重置链接 10 分钟内有效，如果不是本人操作，请忽略。</p>"
        )
    else:
        subject = "Partokens邮箱验证邮件"
        text = (
            "您好，你正在进行Partokens邮箱验证。\n\n"
            f"您的验证码为: {SAMPLE_CODE}\n\n"
            "验证码 10 分钟内有效，如果不是本人操作，请忽略。"
        )
        html = (
            "<p>您好，你正在进行Partokens邮箱验证。</p>"
            f"<p>您的验证码为: <strong>{SAMPLE_CODE}</strong></p>"
            "<p>验证码 10 分钟内有效，如果不是本人操作，请忽略。</p>"
        )
    message = EmailMessage()
    message["From"] = f"Partokens <{args.sender}>"
    message["To"] = args.to
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    with smtplib.SMTP(args.host, args.port, timeout=10) as smtp:
        smtp.send_message(message, from_addr=args.sender, to_addrs=[args.to])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
