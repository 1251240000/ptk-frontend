from __future__ import annotations

import logging
from email.headerregistry import Address
from typing import Any

from jinja2 import TemplateError

from .brevo import BrevoClient, BrevoPermanentError, BrevoTransientError
from .config import Settings
from .parsing import VerificationCodeNotFound, extract_verification_code
from .templating import VerificationTemplateRenderer


logger = logging.getLogger(__name__)


class EnvelopeError(ValueError):
    """Raised when the SMTP envelope is not allowed by proxy policy."""


def normalize_address(value: str) -> str:
    candidate = value.strip().removeprefix("<").removesuffix(">")
    if "\r" in candidate or "\n" in candidate:
        raise EnvelopeError("email address contains a line break")
    try:
        address = Address(addr_spec=candidate)
    except (TypeError, ValueError) as exc:
        raise EnvelopeError("invalid email address") from exc
    if not address.username or not address.domain:
        raise EnvelopeError("invalid email address")
    return address.addr_spec


class SMTPProxyHandler:
    def __init__(
        self,
        settings: Settings,
        renderer: VerificationTemplateRenderer,
        brevo: BrevoClient,
    ) -> None:
        self._settings = settings
        self._renderer = renderer
        self._brevo = brevo

    def _validate_sender(self, value: str) -> str:
        sender = normalize_address(value)
        domain = sender.rsplit("@", 1)[1].lower()
        allowed = self._settings.smtp_allowed_sender_domains
        if "*" not in allowed and domain not in allowed:
            raise EnvelopeError("sender domain is not allowed")
        return sender

    def _recipients(self, values: list[str]) -> list[str]:
        recipients = list(dict.fromkeys(normalize_address(value) for value in values))
        if not recipients:
            raise EnvelopeError("message has no recipients")
        if len(recipients) > self._settings.smtp_max_recipients:
            raise EnvelopeError("message has too many recipients")
        return recipients

    async def handle_DATA(
        self,
        server: Any,
        session: Any,
        envelope: Any,
    ) -> str:
        try:
            self._validate_sender(envelope.mail_from)
            recipients = self._recipients(envelope.rcpt_tos)
            code = extract_verification_code(bytes(envelope.content))
            rendered = self._renderer.render(code)
            subject = self._settings.subject_for(code)
        except EnvelopeError as exc:
            logger.warning("Rejected SMTP envelope: %s", exc)
            return "550 5.7.1 Message rejected by proxy policy"
        except VerificationCodeNotFound:
            logger.warning("Rejected unsupported SMTP message without verification code")
            return "550 5.6.0 Verification code not found"
        except (OSError, TemplateError, ValueError):
            logger.exception("Failed to prepare verification email")
            return "451 4.3.0 Could not prepare verification email"

        try:
            message_ids = [
                await self._brevo.send(recipient, subject, rendered)
                for recipient in recipients
            ]
        except BrevoTransientError as exc:
            logger.warning("Brevo temporarily unavailable: %s", exc)
            return "451 4.4.1 Upstream email service temporarily unavailable"
        except BrevoPermanentError as exc:
            logger.error("Brevo rejected the generated email: %s", exc)
            return "550 5.7.0 Upstream email service rejected the message"

        delivered_ids = [message_id for message_id in message_ids if message_id]
        logger.info(
            "Delivered verification email through Brevo recipients=%d message_ids=%s",
            len(recipients),
            ",".join(delivered_ids) or "unavailable",
        )
        return "250 2.0.0 Verification email accepted"
