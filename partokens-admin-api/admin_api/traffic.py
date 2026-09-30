from __future__ import annotations

import json
import math
from collections import defaultdict
from decimal import Decimal
from typing import Any


def number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return result if math.isfinite(result) and result >= 0 else None


def request_sample(row: dict[str, Any], quota_unit: float, cost_ratio: float | None) -> dict[str, Any]:
    other = row.get("other")
    if isinstance(other, str):
        try:
            other = json.loads(other)
        except (ValueError, TypeError):
            other = {}
    other = other if isinstance(other, dict) else {}
    consumed = row["type"] == 2
    stream = other.get("stream_status")
    success = consumed and not (isinstance(stream, dict) and stream.get("status") == "error")
    cached = number(other.get("cache_tokens")) if consumed else None
    prompt = int(number(row.get("prompt_tokens")) or 0)
    output = int(number(row.get("completion_tokens")) or 0)
    total_input = number(other.get("input_tokens_total"))
    if total_input is None:
        total_input = prompt
        if other.get("usage_semantic") == "anthropic" or (other.get("claude") and "usage_semantic" not in other):
            write = number(other.get("cache_write_tokens"))
            if write is None:
                split = (number(other.get("cache_creation_tokens_5m")) or 0) + (number(other.get("cache_creation_tokens_1h")) or 0)
                write = split or number(other.get("cache_creation_tokens")) or 0
            total_input += (cached or 0) + write
    original: Decimal | None = Decimal(0) if not consumed else None
    if consumed:
        group = number(other.get("user_group_ratio"))
        if not group:
            group = number(other.get("group_ratio"))
        quota = number(row.get("quota"))
        if group and quota is not None:
            # Quota includes user/group pricing; remove it to recover the USD list amount.
            original = Decimal(str(quota)) / Decimal(str(quota_unit)) / Decimal(str(group))
    cost = original * Decimal(str(cost_ratio)) if original is not None and cost_ratio is not None else None
    if not consumed:
        cost = Decimal(0)
    return {
        "id": row.get("id"), "request_id": row.get("request_id") or None,
        "created_at": int(row["created_at"]), "channel_id": int(row["channel"]),
        "model": str(row.get("model_name") or "未记录模型"), "success": success, "consumed": consumed,
        "first_token_ms": number(other.get("frt")) if consumed and row.get("is_stream") else None,
        "input_tokens": int(total_input), "output_tokens": output, "total_tokens": int(total_input) + output,
        "cached_tokens": int(cached) if cached is not None else None,
        "cache_rate": round(cached / total_input * 100, 2) if cached is not None and total_input > 0 and cached <= total_input else None,
        "original_usd": float(original) if original is not None else None,
        "cost_cny": float(cost) if cost is not None else None,
    }


def unique_requests(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Retries on the same logical channel count once; a consumed result supersedes an error.
    grouped: dict[tuple[Any, ...], dict[str, Any]] = {}
    for row in rows:
        key = (row["request_id"], row["model"]) if row["request_id"] else (row["channel_id"], row["id"], row["created_at"])
        previous = grouped.get(key)
        if previous is None or (row["consumed"] and not previous["consumed"]):
            grouped[key] = row
    return sorted(grouped.values(), key=lambda row: (row["created_at"], row.get("id") or 0), reverse=True)


def metrics(rows: list[dict[str, Any]]) -> dict[str, Any]:
    count = len(rows)
    successes = sum(row["success"] for row in rows)
    latency = sorted(row["first_token_ms"] for row in rows if row["first_token_ms"] is not None)
    cache_rows = [row for row in rows if row["cache_rate"] is not None]
    cache_input = sum(row["input_tokens"] for row in cache_rows)
    original_known = all(row["original_usd"] is not None for row in rows)
    cost_known = all(row["cost_cny"] is not None for row in rows)
    return {
        "requests": count, "successes": successes, "errors": count - successes,
        "success_rate": round(successes / count * 100, 2) if count else None,
        "first_token_ms": round(sum(latency) / len(latency), 2) if latency else None,
        "p95_first_token_ms": latency[math.ceil(len(latency) * .95) - 1] if latency else None,
        "latency_samples": len(latency), "cache_samples": len(cache_rows),
        "cache_rate": round(sum(row["cached_tokens"] for row in cache_rows) / cache_input * 100, 2) if cache_input else None,
        "cached_tokens": sum(row["cached_tokens"] or 0 for row in rows),
        "input_tokens": sum(row["input_tokens"] for row in rows),
        "output_tokens": sum(row["output_tokens"] for row in rows),
        "total_tokens": sum(row["total_tokens"] for row in rows),
        "original_usd": float(sum((Decimal(str(row["original_usd"])) for row in rows), Decimal(0))) if original_known else None,
        "cost_cny": float(sum((Decimal(str(row["cost_cny"])) for row in rows), Decimal(0))) if cost_known else None,
        "unpriced_requests": sum(row["original_usd"] is None for row in rows),
        "uncosted_requests": sum(row["cost_cny"] is None for row in rows),
    }


def report(rows: list[dict[str, Any]], period: str, observed_at: int, configured_models: list[str]) -> dict[str, Any]:
    rows = unique_requests(rows)
    if period == "requests_60":
        rows = rows[:60]
        series = [{"created_at": row["created_at"], **metrics([row])} for row in reversed(rows)]
    else:
        seconds = 6 * 3600 if period == "6h" else 7 * 86400
        start = observed_at - seconds
        width = seconds // 60
        buckets: dict[int, list[dict[str, Any]]] = defaultdict(list)
        rows = [row for row in rows if start <= row["created_at"] <= observed_at]
        for row in rows:
            buckets[min(59, (row["created_at"] - start) // width)].append(row)
        series = [{"created_at": start + index * width, **metrics(buckets[index])} for index in range(60)]
    by_model: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_model[row["model"]].append(row)
    models = [{"model": model, **metrics(by_model[model])} for model in sorted(set(configured_models) | set(by_model))]
    return {"summary": metrics(rows), "series": series, "models": models, "recent_requests": rows[:60]}
