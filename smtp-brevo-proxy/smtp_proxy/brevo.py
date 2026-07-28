from __future__ import annotations

from typing import Any

import httpx

from .config import Settings
from .templating import RenderedEmail


class BrevoError(RuntimeError):
    """Base class for failures returned by Brevo."""


class BrevoTransientError(BrevoError):
    """A retryable network, throttling, or server failure."""


class BrevoPermanentError(BrevoError):
    """A non-retryable request or configuration failure."""


class BrevoClient:
    def __init__(
        self,
        settings: Settings,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._settings = settings
        self._transport = transport

    async def send(
        self,
        recipient: str,
        subject: str,
        content: RenderedEmail,
    ) -> str | None:
        payload: dict[str, Any] = {
            "sender": {
                "name": self._settings.brevo_sender_name,
                "email": self._settings.brevo_sender_email,
            },
            "to": [{"email": recipient}],
            "subject": subject,
            "htmlContent": content.html,
            "textContent": content.text,
            "tags": ["email-verification"],
        }
        headers = {
            "accept": "application/json",
            "api-key": self._settings.brevo_api_key,
            "content-type": "application/json",
        }
        timeout = httpx.Timeout(self._settings.brevo_timeout_seconds)

        try:
            async with httpx.AsyncClient(
                timeout=timeout,
                transport=self._transport,
                follow_redirects=False,
            ) as client:
                response = await client.post(
                    self._settings.brevo_api_url,
                    headers=headers,
                    json=payload,
                )
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            raise BrevoTransientError("Brevo request failed") from exc
        except httpx.HTTPError as exc:
            raise BrevoTransientError("Brevo HTTP client failed") from exc

        if 200 <= response.status_code < 300:
            try:
                body = response.json()
            except ValueError:
                return None
            message_id = body.get("messageId") if isinstance(body, dict) else None
            return message_id if isinstance(message_id, str) else None

        if response.status_code in {408, 425, 429} or response.status_code >= 500:
            raise BrevoTransientError(
                f"Brevo returned retryable status {response.status_code}"
            )
        raise BrevoPermanentError(
            f"Brevo returned non-retryable status {response.status_code}"
        )
