from __future__ import annotations

import json
import unittest

import httpx

from admin_api.new_api import NewApiClient, NewApiError


class NewApiClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_model_test_timeout_overrides_default_without_affecting_other_requests(self) -> None:
        seen: list[httpx.Request] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return httpx.Response(200, json={"success": True, "data": ["good"]})

        client = NewApiClient("https://new-api.example", timeout_seconds=15, transport=httpx.MockTransport(handler))
        try:
            await client.test_channel_model("Bearer root", 7, "good")
            await client.fetch_channel_models("Bearer root", 7)
            self.assertEqual(seen[0].url.path, "/api/channel/test/7")
            self.assertEqual(seen[0].url.params["model"], "good")
            self.assertEqual(seen[0].extensions["timeout"], dict.fromkeys(["connect", "read", "write", "pool"], 30))
            self.assertEqual(seen[1].extensions["timeout"], dict.fromkeys(["connect", "read", "write", "pool"], 15))
        finally:
            await client.close()

    async def test_fetch_models_preview_uses_new_api_create_preview_endpoint(self) -> None:
        seen: list[httpx.Request] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return httpx.Response(200, json={"success": True, "data": ["gpt-4.1", "", "gpt-4.1"]})

        client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
        try:
            models, partial = await client.fetch_channel_models_preview(
                "Bearer root", 1, "https://api.example/v1", "channel-secret"
            )
            self.assertEqual(models, ["gpt-4.1"])
            self.assertIsNone(partial)
            self.assertEqual(seen[0].method, "POST")
            self.assertEqual(seen[0].url.path, "/api/channel/fetch_models")
            self.assertEqual(seen[0].headers["authorization"], "Bearer root")
            json_body = json.loads(seen[0].content)
            self.assertEqual(json_body, {"type": 1, "base_url": "https://api.example/v1", "key": "channel-secret"})
            self.assertEqual(json_body["key"], "channel-secret")
        finally:
            await client.close()

    async def test_fetch_models_uses_supported_channel_endpoint_and_redacts_error_shape(self) -> None:
        seen: list[httpx.Request] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return httpx.Response(200, json={"success": True, "data": ["gpt-4.1", "", "gpt-4.1"]})

        client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
        try:
            self.assertEqual(await client.fetch_channel_models("Bearer root", 7), ["gpt-4.1"])
            self.assertEqual(seen[0].url.path, "/api/channel/fetch_models/7")
            self.assertEqual(seen[0].headers["authorization"], "Bearer root")
        finally:
            await client.close()

    async def test_http_statuses_have_stable_sanitized_kinds(self) -> None:
        for status, kind in [(401, "unauthorized"), (403, "unauthorized"), (404, "not_found"), (429, "rate_limited"), (500, "server_error")]:
            async def handler(request: httpx.Request, status: int = status) -> httpx.Response:
                return httpx.Response(status, json={"success": False, "message": "provider detail should not be forwarded"})

            client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
            try:
                with self.assertRaises(NewApiError) as raised:
                    await client.fetch_channel_models("Bearer root", 7)
                self.assertEqual(raised.exception.kind, kind)
                self.assertNotIn("provider detail", str(raised.exception))
            finally:
                await client.close()

    async def test_timeout_is_classified(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("upstream timeout")

        client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
        try:
            with self.assertRaises(NewApiError) as raised:
                await client.fetch_channel_models("Bearer root", 7)
            self.assertEqual(raised.exception.kind, "timeout")
            self.assertEqual(str(raised.exception), "new-api request timed out")
        finally:
            await client.close()

    async def test_partial_model_payload_is_kept_for_admin_review(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"success": False, "message": "provider timed out after one page", "data": ["gpt-4.1"]})

        client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
        try:
            self.assertEqual(await client.fetch_channel_models_result("Bearer root", 7), (["gpt-4.1"], "partial"))
        finally:
            await client.close()

    async def test_business_error_does_not_echo_upstream_secret(self) -> None:
        secret = "UPSTREAM-CHANNEL-SECRET"

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"success": False, "message": secret, "error_code": "provider_error"})

        client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
        try:
            with self.assertRaises(NewApiError) as raised:
                await client.add_channel("Bearer root", {"key": secret})
            self.assertNotIn(secret, str(raised.exception))
        finally:
            await client.close()

    async def test_copy_errors_are_actionable_without_exposing_arbitrary_upstream_messages(self) -> None:
        for message, expected in [
            ("获取渠道信息失败，请稍后重试", "POST /api/channel/copy/31"),
            ("Failed to copy channel: invalid channel settings", "POST /api/channel/copy/31"),
            ("复制渠道失败，请稍后重试", "POST /api/channel/copy/31"),
            ("UPSTREAM-CHANNEL-SECRET", "POST /api/channel/copy/31"),
            ({"key": "UPSTREAM-CHANNEL-SECRET"}, "POST /api/channel/copy/31"),
        ]:
            async def handler(request: httpx.Request) -> httpx.Response:
                return httpx.Response(200, json={"success": False, "message": message})

            client = NewApiClient("https://new-api.example", transport=httpx.MockTransport(handler))
            try:
                with self.assertRaises(NewApiError) as raised:
                    await client.request("POST", "/api/channel/copy/31", "Bearer root")
                self.assertIn(expected, str(raised.exception))
                self.assertNotIn("UPSTREAM-CHANNEL-SECRET", str(raised.exception))
                self.assertEqual(raised.exception.kind, "business_error")
            finally:
                await client.close()


if __name__ == "__main__":
    unittest.main()
