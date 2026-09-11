from __future__ import annotations

import hashlib
import json
import re
import time
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any
from urllib.parse import urlsplit, urlunsplit


CATALOG_GROUP = "__partokens_catalog__"
METADATA_KEY = "partokens_admin"
LOGICAL_TAG_PREFIX = "ptlc:"
ROUTE_PRIORITY_BASE = 1000
ROUTE_PRIORITY_STEP = 100


def now() -> int:
    return int(time.time())


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def normalized_base_url(raw: str) -> str:
    parsed = urlsplit(raw.strip())
    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").lower()
    if not scheme or not hostname:
        raise ValueError("invalid API base URL")
    if parsed.username or parsed.password:
        raise ValueError("API base URL must not contain credentials")
    if parsed.query or parsed.fragment:
        raise ValueError("API base URL must not contain query or fragment")
    port = parsed.port
    if port and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80)):
        hostname = f"{hostname}:{port}"
    path = parsed.path.rstrip("/")
    return urlunsplit((scheme, hostname, path, parsed.query, ""))


def credential_fingerprint(secret: str) -> str:
    return f"sha256:{hashlib.sha256(secret.encode('utf-8')).hexdigest()}"


def masked_api_key(secret: str) -> str:
    prefix = "sk-" if secret.startswith("sk-") else ""
    body = secret[len(prefix):]
    # Short credentials must not be reconstructable from overlapping fragments.
    if len(body) <= 7 or any(character.isspace() for character in body):
        return f"{prefix}....."
    return f"{prefix}{body[:3]}.....{body[-4:]}"


def identity_hash(channel_type: int, base_url: str, fingerprint: str) -> str:
    identity = f"{channel_type}\n{normalized_base_url(base_url)}\n{fingerprint}"
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def short_fingerprint(fingerprint: str) -> str:
    digest = fingerprint.partition(":")[2]
    return f"sha256:{digest[:8]}...{digest[-4:]}"


def cost_ratio_to_millis(value: Any) -> int | None:
    """Convert a non-negative decimal ratio to exact integer thousandths."""
    if value is None:
        return None
    try:
        decimal = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("cost_ratio must be a non-negative decimal") from exc
    if not decimal.is_finite() or decimal < 0:
        raise ValueError("cost_ratio must be a non-negative decimal")
    if decimal.as_tuple().exponent < -3:
        raise ValueError("cost_ratio must have at most three decimal places")
    scaled = decimal * 1000
    if scaled != scaled.to_integral_value(rounding=ROUND_HALF_UP):
        raise ValueError("cost_ratio must have at most three decimal places")
    return int(scaled)


def cost_ratio_from_millis(value: Any) -> float | None:
    if value is None:
        return None
    return int(value) / 1000


def parse_json_object(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return dict(raw)
    if not isinstance(raw, str) or not raw.strip():
        return {}
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return {}
    return value if isinstance(value, dict) else {}


def channel_metadata(channel: dict[str, Any]) -> dict[str, Any] | None:
    metadata = parse_json_object(channel.get("other_info")).get(METADATA_KEY)
    if not isinstance(metadata, dict) or metadata.get("schema") != 1:
        return None
    logical_id = metadata.get("logical_id")
    kind = metadata.get("kind")
    if not isinstance(logical_id, str) or kind not in {"template", "route", "archive", "probe"}:
        return None
    return metadata


def merged_other_info(channel: dict[str, Any], metadata: dict[str, Any]) -> str:
    other = parse_json_object(channel.get("other_info"))
    other[METADATA_KEY] = metadata
    return json.dumps(other, separators=(",", ":"), ensure_ascii=True, sort_keys=True)


def channel_status_reason(channel: dict[str, Any]) -> str | None:
    other = parse_json_object(channel.get("other_info"))
    reason = other.get("status_reason")
    return str(reason) if reason else None


def models_list(raw: Any) -> list[str]:
    if not isinstance(raw, str):
        return []
    return list(dict.fromkeys(part.strip() for part in raw.split(",") if part.strip()))


def route_record_name(logical_name: str, group: str, attempt: int, revision: int) -> str:
    attempt_name = "initial" if attempt == 0 else f"retry{attempt}"
    compact = re.sub(r"\s+", " ", logical_name).strip()
    return f"{compact} · {group} · {attempt_name} · r{revision}"


def public_logical_channel(row: dict[str, Any], physical: list[dict[str, Any]]) -> dict[str, Any]:
    records = [record for record in physical if record.get("logical_id") == row["id"]]
    route_records = [record for record in records if record.get("kind") == "route"]
    statuses = [int(record.get("status", 0)) for record in route_records]
    drift = any(bool(record.get("drift")) for record in route_records)
    if not row["enabled"]:
        status = "disabled"
    elif not route_records:
        status = "unknown"
    elif all(value != 1 for value in statuses):
        status = "unavailable"
    elif drift or any(value != 1 for value in statuses):
        status = "partial"
    else:
        status = "available"
    test_times = [int(record.get("test_time", 0)) for record in records]
    response_times = [int(record.get("response_time", 0)) for record in records if int(record.get("response_time", 0)) > 0]
    return {
        "id": row["id"],
        "name": row["name"],
        "channel_type": row["channel_type"],
        "base_url": row["base_url"],
        # This groups credential variants in the admin UI without merging
        # their routeable identities, health, or model configuration.
        "upstream_key": hashlib.sha256(row["base_url"].encode("utf-8")).hexdigest()[:16],
        "credential_fingerprint": short_fingerprint(row["credential_fingerprint"]),
        "masked_key": row.get("masked_key"),
        "cost_ratio": cost_ratio_from_millis(
            row.get("cost_ratio_millis")
            if row.get("cost_ratio_millis") is not None
            else row.get("cost_ratio")
        ),
        "models": json.loads(row["models_json"]),
        "note": row["note"],
        "credential_status": "ready" if row.get("config_ciphertext") else "missing",
        "config_version": row.get("config_version", 1),
        "enabled": bool(row["enabled"]),
        "state": row["state"],
        "status": status,
        "groups": len({record.get("group_name") for record in route_records if record.get("group_name")}),
        "attempt_layers": len({(record.get("group_name"), record.get("attempt")) for record in route_records}),
        "record_count": len(records),
        "latest_test_time": max(test_times, default=0),
        "response_time": max(response_times, default=0),
        "physical_records": records,
        "updated_at": row["updated_at"],
    }
