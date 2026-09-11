from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit


class ConfigError(ValueError):
    pass


def _positive_int(values: dict[str, str], name: str, default: int) -> int:
    raw = values.get(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer") from exc
    if value <= 0:
        raise ConfigError(f"{name} must be positive")
    return value


def _http_origin(value: str) -> str:
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ConfigError("PARTOKENS_ADMIN_NEW_API_ORIGIN must be an HTTP origin")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ConfigError("PARTOKENS_ADMIN_NEW_API_ORIGIN must not contain credentials, query, or fragment")
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"


@dataclass(frozen=True)
class Settings:
    new_api_origin: str
    database_path: Path
    service_token: str | None
    monitor_interval_seconds: int
    log_interval_seconds: int
    request_timeout_seconds: int
    snapshot_retention: int
    encryption_key_file: Path | None = None

    @classmethod
    def from_mapping(cls, source: dict[str, str] | None = None) -> "Settings":
        values = dict(os.environ if source is None else source)
        origin = _http_origin(values.get("PARTOKENS_ADMIN_NEW_API_ORIGIN", "http://localhost:3000"))
        database_path = Path(values.get("PARTOKENS_ADMIN_DATABASE_PATH", "data/partokens-admin.sqlite3")).expanduser()
        token = values.get("PARTOKENS_ADMIN_NEW_API_TOKEN", "").strip() or None
        return cls(
            new_api_origin=origin,
            database_path=database_path,
            service_token=token,
            encryption_key_file=Path(values["PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE"]).expanduser() if values.get("PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE") else None,
            monitor_interval_seconds=_positive_int(values, "PARTOKENS_ADMIN_MONITOR_INTERVAL_SECONDS", 60),
            log_interval_seconds=_positive_int(values, "PARTOKENS_ADMIN_LOG_INTERVAL_SECONDS", 300),
            request_timeout_seconds=_positive_int(values, "PARTOKENS_ADMIN_REQUEST_TIMEOUT_SECONDS", 15),
            snapshot_retention=_positive_int(values, "PARTOKENS_ADMIN_SNAPSHOT_RETENTION", 1440),
        )
