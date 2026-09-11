from __future__ import annotations

from typing import Any

import httpx


MODEL_TEST_TIMEOUT_SECONDS = 30


class NewApiError(RuntimeError):
    def __init__(self, message: str, status_code: int = 502, *, kind: str = "unknown", error_code: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.kind = kind
        self.error_code = error_code


class NewApiClient:
    def __init__(self, origin: str, timeout_seconds: int = 15, transport: httpx.AsyncBaseTransport | None = None):
        self.origin = origin.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.origin,
            timeout=httpx.Timeout(timeout_seconds),
            follow_redirects=False,
            transport=transport,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def request(
        self,
        method: str,
        path: str,
        token: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any = None,
        allow_business_error: bool = False,
        timeout_seconds: float | None = None,
    ) -> Any:
        try:
            response = await self._client.request(
                method,
                path,
                params=params,
                json=json,
                headers={"Authorization": token, "Accept": "application/json"},
                **({"timeout": timeout_seconds} if timeout_seconds is not None else {}),
            )
        except httpx.TimeoutException as exc:
            raise NewApiError("new-api request timed out", kind="timeout") from exc
        except httpx.ConnectError as exc:
            raise NewApiError("new-api connection failed", kind="network") from exc
        except httpx.HTTPError as exc:
            raise NewApiError("new-api is unavailable", kind="network") from exc
        if response.status_code in {401, 403}:
            raise NewApiError("new-api rejected the administrator session", response.status_code, kind="unauthorized")
        if response.status_code < 200 or response.status_code >= 300:
            kind = (
                "rate_limited" if response.status_code == 429
                else "server_error" if response.status_code >= 500
                else "not_found" if response.status_code == 404
                else "unknown"
            )
            raise NewApiError(f"new-api returned HTTP {response.status_code}", response.status_code, kind=kind)
        try:
            payload = response.json()
        except ValueError as exc:
            raise NewApiError("new-api returned an invalid JSON response") from exc
        if isinstance(payload, dict) and payload.get("success") is False and not allow_business_error:
            error_code = payload.get("error_code")
            raise NewApiError(
                f"new-api operation failed ({method} {path})",
                409,
                kind="business_error",
                error_code=error_code if isinstance(error_code, str) and error_code in {"model_not_found", "unsupported_model", "model_not_supported"} else None,
            )
        return payload

    async def verify_root(self, token: str) -> dict[str, Any]:
        payload = await self.request("GET", "/api/user/self", token)
        user = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(user, dict) or user.get("role") != 100:
            raise NewApiError("Root access is required", 403)
        return user

    async def list_channels(self, token: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            payload = await self.request(
                "GET",
                "/api/channel/",
                token,
                params={"p": page, "page_size": 100, "id_sort": "true"},
            )
            data = payload.get("data", {})
            page_items = data.get("items", []) if isinstance(data, dict) else []
            if not isinstance(page_items, list):
                raise NewApiError("new-api returned an invalid channel list")
            items.extend(item for item in page_items if isinstance(item, dict))
            total = int(data.get("total", len(items))) if isinstance(data, dict) else len(items)
            if not page_items or len(items) >= total:
                return items
            page += 1
            if page > 10_000:
                raise NewApiError("new-api channel pagination did not terminate")

    async def get_channel(self, token: str, channel_id: int) -> dict[str, Any]:
        payload = await self.request("GET", f"/api/channel/{channel_id}", token)
        channel = payload.get("data")
        if not isinstance(channel, dict):
            raise NewApiError(f"channel {channel_id} is unavailable")
        return channel

    async def get_groups(self, token: str) -> list[str]:
        payload = await self.request("GET", "/api/group/", token)
        groups = payload.get("data", [])
        if not isinstance(groups, list):
            raise NewApiError("new-api returned an invalid group list")
        return sorted(str(group) for group in groups)

    async def get_retry_times(self, token: str) -> int:
        payload = await self.request("GET", "/api/channel/ops", token)
        data = payload.get("data", {})
        return max(0, int(data.get("retry_times", 0)))

    async def add_channel(self, token: str, channel: dict[str, Any]) -> None:
        await self.request("POST", "/api/channel/", token, json={"mode": "single", "channel": channel})

    async def delete_channel(self, token: str, channel_id: int) -> None:
        await self.request("DELETE", f"/api/channel/{channel_id}", token)

    async def update_channel(self, token: str, channel: dict[str, Any]) -> dict[str, Any]:
        payload = await self.request("PUT", "/api/channel/", token, json=channel)
        result = payload.get("data")
        return result if isinstance(result, dict) else channel

    async def batch_status(self, token: str, channel_ids: list[int], status: int) -> int:
        if not channel_ids:
            return 0
        payload = await self.request(
            "POST",
            "/api/channel/status/batch",
            token,
            json={"ids": channel_ids, "status": status},
        )
        return int(payload.get("data", 0))

    async def test_channel(self, token: str, channel_id: int) -> Any:
        return await self.request("GET", f"/api/channel/test/{channel_id}", token, allow_business_error=True)

    async def test_channel_model(self, token: str, channel_id: int, model: str) -> Any:
        return await self.request(
            "GET",
            f"/api/channel/test/{channel_id}",
            token,
            params={"model": model},
            allow_business_error=True,
            timeout_seconds=MODEL_TEST_TIMEOUT_SECONDS,
        )

    async def fetch_channel_models(self, token: str, channel_id: int) -> list[str]:
        models, error = await self.fetch_channel_models_result(token, channel_id)
        if error and not models:
            raise NewApiError("new-api model discovery failed", kind="business_error")
        return models

    async def fetch_channel_models_preview(
        self,
        token: str,
        channel_type: int,
        base_url: str,
        api_key: str,
    ) -> tuple[list[str], str | None]:
        """Discover models for an unsaved channel through New API's preview route."""
        payload = await self.request(
            "POST",
            "/api/channel/fetch_models",
            token,
            json={"type": channel_type, "base_url": base_url, "key": api_key},
            allow_business_error=True,
        )
        models = payload.get("data", []) if isinstance(payload, dict) else []
        if not isinstance(models, list):
            raise NewApiError("new-api returned an invalid model list", kind="invalid_response")
        normalized = list(dict.fromkeys(str(model).strip() for model in models if str(model).strip()))
        partial = payload.get("success") is False if isinstance(payload, dict) else False
        if partial and not normalized:
            raise NewApiError("new-api model discovery failed", kind="business_error")
        return normalized, ("partial" if partial else None)

    async def fetch_channel_models_result(self, token: str, channel_id: int) -> tuple[list[str], str | None]:
        payload = await self.request("GET", f"/api/channel/fetch_models/{channel_id}", token, allow_business_error=True)
        models = payload.get("data", []) if isinstance(payload, dict) else []
        if not isinstance(models, list):
            raise NewApiError("new-api returned an invalid model list", kind="invalid_response")
        normalized = list(dict.fromkeys(str(model).strip() for model in models if str(model).strip()))
        partial = payload.get("success") is False if isinstance(payload, dict) else False
        if partial and not normalized:
            raise NewApiError("new-api model discovery failed", kind="business_error")
        return normalized, ("partial" if partial else None)

    async def log_count(self, token: str, channel_id: int, log_type: int, start: int, end: int) -> int:
        payload = await self.request(
            "GET",
            "/api/log/",
            token,
            params={
                "p": 1,
                "page_size": 1,
                "type": log_type,
                "channel": channel_id,
                "start_timestamp": start,
                "end_timestamp": end,
            },
        )
        data = payload.get("data", {})
        return int(data.get("total", 0)) if isinstance(data, dict) else 0
