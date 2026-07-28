from __future__ import annotations

import argparse
import os
import smtplib
from email.message import EmailMessage


SAMPLE_CODE = "ffa926"


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a sample verification email")
    parser.add_argument("--to", required=True, help="Envelope recipient")
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
    message["Subject"] = "Partokens邮箱验证邮件"
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    with smtplib.SMTP(args.host, args.port, timeout=10) as smtp:
        smtp.send_message(message, from_addr=args.sender, to_addrs=[args.to])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
