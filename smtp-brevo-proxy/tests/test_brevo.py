from __future__ import annotations

import asyncio
import json
import unittest

import httpx

from smtp_proxy.brevo import BrevoClient, BrevoPermanentError, BrevoTransientError
from smtp_proxy.config import Settings
from smtp_proxy.templating import RenderedEmail


class BrevoClientTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            brevo_api_key="test-key",
            brevo_sender_email="no-reply@partokens.com",
        )
        self.content = RenderedEmail(html="<p>ffa926</p>", text="ffa926")

    def test_sends_transactional_email_payload(self) -> None:
        captured: dict[str, object] = {}

        async def respond(request: httpx.Request) -> httpx.Response:
            captured["headers"] = request.headers
            captured["payload"] = json.loads(request.content)
            return httpx.Response(201, json={"messageId": "brevo-message-id"})

        client = BrevoClient(self.settings, httpx.MockTransport(respond))
        message_id = asyncio.run(
            client.send(
                "user@example.com",
                "ffa926 is your Partokens verification code",
                self.content,
            )
        )

        self.assertEqual(message_id, "brevo-message-id")
        payload = captured["payload"]
        self.assertIsInstance(payload, dict)
        assert isinstance(payload, dict)
        self.assertEqual(payload["to"], [{"email": "user@example.com"}])
        self.assertEqual(
            payload["subject"], "ffa926 is your Partokens verification code"
        )
        headers = captured["headers"]
        self.assertIsInstance(headers, httpx.Headers)
        assert isinstance(headers, httpx.Headers)
        self.assertEqual(headers["api-key"], "test-key")

    def test_maps_rate_limit_to_transient_error(self) -> None:
        async def respond(request: httpx.Request) -> httpx.Response:
            return httpx.Response(429, json={"message": "rate limited"})

        client = BrevoClient(self.settings, httpx.MockTransport(respond))
        with self.assertRaises(BrevoTransientError):
            asyncio.run(
                client.send(
                    "user@example.com",
                    "ffa926 is your Partokens verification code",
                    self.content,
                )
            )

    def test_maps_bad_request_to_permanent_error(self) -> None:
        async def respond(request: httpx.Request) -> httpx.Response:
            return httpx.Response(400, json={"message": "invalid sender"})

        client = BrevoClient(self.settings, httpx.MockTransport(respond))
        with self.assertRaises(BrevoPermanentError):
            asyncio.run(
                client.send(
                    "user@example.com",
                    "ffa926 is your Partokens verification code",
                    self.content,
                )
            )


if __name__ == "__main__":
    unittest.main()
