from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from jinja2 import TemplateError

from smtp_proxy.brevo import BrevoClient, BrevoError
from smtp_proxy.config import ConfigError, Settings
from smtp_proxy.handler import EnvelopeError, normalize_address
from smtp_proxy.templating import CustomerServiceTemplateRenderer


DEFAULT_SUBJECT = "Apology and Service Restored – $100 Account Credit Notice"
ENV_NAME_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line_number, raw_line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        name, separator, value = line.partition("=")
        name = name.strip()
        value = value.strip()
        if not separator or not ENV_NAME_PATTERN.fullmatch(name):
            raise ValueError(f"Invalid environment entry at {path}:{line_number}")
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ.setdefault(name, value)


async def send_notice(args: argparse.Namespace) -> str | None:
    load_env_file(args.env_file)
    settings = Settings.from_env()
    recipient = normalize_address(args.to)
    renderer = CustomerServiceTemplateRenderer(settings.template_dir)
    content = renderer.render(
        credit_amount=args.credit,
        outage_duration=args.duration,
        notice_date=args.date,
    )
    return await BrevoClient(settings).send(
        recipient,
        args.subject,
        content,
        tags=("customer-service", "service-restored"),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Send the Partokens service-restored customer notice through Brevo"
    )
    parser.add_argument("--to", required=True, help="Recipient email address")
    parser.add_argument("--subject", default=DEFAULT_SUBJECT)
    parser.add_argument("--credit", default="$100", help="Account credit amount")
    parser.add_argument("--duration", default="8 hours", help="Disruption duration")
    parser.add_argument("--date", default="August 4, 2026", help="Notice date")
    parser.add_argument(
        "--env-file",
        type=Path,
        default=PROJECT_ROOT / ".env",
        help="Environment file containing Brevo credentials (default: project .env)",
    )
    args = parser.parse_args()

    try:
        message_id = asyncio.run(send_notice(args))
    except (BrevoError, ConfigError, EnvelopeError, OSError, TemplateError, ValueError) as exc:
        print(f"Could not send customer notice: {exc}", file=sys.stderr)
        return 1

    result = message_id or "not returned"
    print(f"Brevo accepted the customer notice (message_id={result})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
