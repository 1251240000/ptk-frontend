from __future__ import annotations

import logging
import signal
import threading

from aiosmtpd.controller import Controller
from jinja2 import TemplateError

from .brevo import BrevoClient
from .config import ConfigError, Settings
from .handler import SMTPProxyHandler
from .templating import (
    PasswordResetTemplateRenderer,
    VerificationTemplateRenderer,
)


logger = logging.getLogger(__name__)


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def run() -> int:
    try:
        settings = Settings.from_env()
    except ConfigError as exc:
        logging.basicConfig(level=logging.ERROR)
        logger.error("Invalid configuration: %s", exc)
        return 2

    configure_logging(settings.log_level)
    try:
        renderer = VerificationTemplateRenderer(settings.template_dir)
        password_reset_renderer = PasswordResetTemplateRenderer(
            settings.template_dir
        )
    except (OSError, TemplateError, ValueError) as exc:
        logger.error("Could not load transactional email templates: %s", exc)
        return 2

    handler = SMTPProxyHandler(
        settings,
        renderer,
        password_reset_renderer,
        BrevoClient(settings),
    )
    controller = Controller(
        handler,
        hostname=settings.smtp_listen_host,
        port=settings.smtp_listen_port,
        ident="Partokens SMTP Brevo Proxy",
        enable_SMTPUTF8=True,
        decode_data=False,
        data_size_limit=settings.smtp_max_message_bytes,
        ready_timeout=5.0,
    )
    stopped = threading.Event()

    def stop_server(signum: int, frame: object) -> None:
        logger.info("Received signal %d; stopping SMTP proxy", signum)
        stopped.set()

    signal.signal(signal.SIGTERM, stop_server)
    signal.signal(signal.SIGINT, stop_server)

    try:
        controller.start()
    except Exception:
        logger.exception("Could not start SMTP listener")
        return 1

    logger.info(
        "SMTP proxy listening on %s:%d",
        settings.smtp_listen_host,
        settings.smtp_listen_port,
    )
    try:
        stopped.wait()
    finally:
        controller.stop()
        logger.info("SMTP proxy stopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
