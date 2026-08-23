from __future__ import annotations

import os
from dataclasses import dataclass
from email.headerregistry import Address
from pathlib import Path
from typing import Mapping


class ConfigError(ValueError):
    """Raised when required runtime configuration is missing or invalid."""


PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise ConfigError(f"{name} is required")
    return value


def _positive_int(env: Mapping[str, str], name: str, default: int) -> int:
    raw_value = env.get(name, str(default)).strip()
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer") from exc
    if value <= 0:
        raise ConfigError(f"{name} must be greater than zero")
    return value


def _positive_float(env: Mapping[str, str], name: str, default: float) -> float:
    raw_value = env.get(name, str(default)).strip()
    try:
        value = float(raw_value)
    except ValueError as exc:
        raise ConfigError(f"{name} must be a number") from exc
    if value <= 0:
        raise ConfigError(f"{name} must be greater than zero")
    return value


def _email_address(value: str, name: str) -> str:
    if "\r" in value or "\n" in value:
        raise ConfigError(f"{name} contains an invalid line break")
    try:
        address = Address(addr_spec=value)
    except (TypeError, ValueError) as exc:
        raise ConfigError(f"{name} must be a valid email address") from exc
    if not address.username or not address.domain:
        raise ConfigError(f"{name} must be a valid email address")
    return address.addr_spec


@dataclass(frozen=True)
class Settings:
    brevo_api_key: str
    brevo_sender_email: str
    brevo_sender_name: str = "Partokens"
    brevo_api_url: str = "https://api.brevo.com/v3/smtp/email"
    brevo_timeout_seconds: float = 10.0
    smtp_listen_host: str = "0.0.0.0"
    smtp_listen_port: int = 2525
    smtp_allowed_sender_domains: tuple[str, ...] = ("partokens.com",)
    smtp_max_recipients: int = 1
    smtp_max_message_bytes: int = 1_048_576
    password_reset_allowed_hosts: tuple[str, ...] = ("partokens.com",)
    quota_warning_allowed_hosts: tuple[str, ...] = ("partokens.com",)
    subject_template: str = "{code} is your Partokens verification code"
    template_dir: Path = PROJECT_ROOT / "templates"
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls.from_mapping(os.environ)

    @classmethod
    def from_mapping(cls, env: Mapping[str, str]) -> "Settings":
        api_key = _required(env, "BREVO_API_KEY")
        sender_email = _email_address(
            _required(env, "BREVO_SENDER_EMAIL"), "BREVO_SENDER_EMAIL"
        )
        sender_name = env.get("BREVO_SENDER_NAME", "Partokens").strip() or "Partokens"
        if "\r" in sender_name or "\n" in sender_name:
            raise ConfigError("BREVO_SENDER_NAME contains an invalid line break")

        raw_domains = env.get("SMTP_ALLOWED_SENDER_DOMAINS", "partokens.com")
        allowed_domains = tuple(
            domain.strip().lower().lstrip("@")
            for domain in raw_domains.split(",")
            if domain.strip()
        )
        if not allowed_domains:
            raise ConfigError("SMTP_ALLOWED_SENDER_DOMAINS must not be empty")

        raw_reset_hosts = env.get(
            "PASSWORD_RESET_ALLOWED_HOSTS", "partokens.com"
        )
        reset_hosts = tuple(
            host.strip().lower().rstrip(".")
            for host in raw_reset_hosts.split(",")
            if host.strip()
        )
        if not reset_hosts:
            raise ConfigError("PASSWORD_RESET_ALLOWED_HOSTS must not be empty")

        raw_quota_hosts = env.get(
            "QUOTA_WARNING_ALLOWED_HOSTS", "partokens.com"
        )
        quota_hosts = tuple(
            host.strip().lower().rstrip(".")
            for host in raw_quota_hosts.split(",")
            if host.strip()
        )
        if not quota_hosts:
            raise ConfigError("QUOTA_WARNING_ALLOWED_HOSTS must not be empty")

        subject_template = env.get(
            "EMAIL_SUBJECT_TEMPLATE", "{code} is your Partokens verification code"
        ).strip()
        if "{code}" not in subject_template:
            raise ConfigError("EMAIL_SUBJECT_TEMPLATE must include {code}")
        try:
            subject_template.format(code="abcdef")
        except (KeyError, ValueError) as exc:
            raise ConfigError("EMAIL_SUBJECT_TEMPLATE is invalid") from exc

        template_dir = Path(
            env.get("TEMPLATE_DIR", str(PROJECT_ROOT / "templates"))
        ).expanduser()
        log_level = env.get("LOG_LEVEL", "INFO").strip().upper() or "INFO"

        return cls(
            brevo_api_key=api_key,
            brevo_sender_email=sender_email,
            brevo_sender_name=sender_name,
            brevo_api_url=env.get(
                "BREVO_API_URL", "https://api.brevo.com/v3/smtp/email"
            ).strip(),
            brevo_timeout_seconds=_positive_float(
                env, "BREVO_TIMEOUT_SECONDS", 10.0
            ),
            smtp_listen_host=env.get("SMTP_LISTEN_HOST", "0.0.0.0").strip()
            or "0.0.0.0",
            smtp_listen_port=_positive_int(env, "SMTP_LISTEN_PORT", 2525),
            smtp_allowed_sender_domains=allowed_domains,
            smtp_max_recipients=_positive_int(env, "SMTP_MAX_RECIPIENTS", 1),
            smtp_max_message_bytes=_positive_int(
                env, "SMTP_MAX_MESSAGE_BYTES", 1_048_576
            ),
            password_reset_allowed_hosts=reset_hosts,
            quota_warning_allowed_hosts=quota_hosts,
            subject_template=subject_template,
            template_dir=template_dir,
            log_level=log_level,
        )

    def subject_for(self, code: str) -> str:
        return self.subject_template.format(code=code)
