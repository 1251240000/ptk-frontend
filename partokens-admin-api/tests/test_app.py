from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from admin_api.app import Runtime, create_app
from admin_api.config import Settings
from admin_api.database import Database
from admin_api.new_api import NewApiError
from admin_api.repository import Repository
from admin_api.schemas import ChannelModelDiscoveryRequest
from admin_api.service import AdminService


class FakeClient:
    def __init__(self) -> None:
        self.authorizations: list[str] = []

    async def verify_root(self, authorization: str) -> dict[str, Any]:
        self.authorizations.append(authorization)
        if authorization != "Bearer root-token":
            raise NewApiError("Root access is required", 403)
        return {"id": 1, "username": "root", "role": 100}

    async def close(self) -> None:
        return None


class FakeMonitor:
    def start(self) -> None:
        return None

    async def stop(self) -> None:
        return None


class FakeService:
    def __init__(self) -> None:
        self.preview_requests: list[Any] = []
        self.copy_requests: list[Any] = []

    async def bootstrap(self, authorization: str) -> dict[str, Any]:
        return {
            "channels": [],
            "groups": ["default"],
            "retry_times": 2,
            "routes": [],
            "monitor": None,
            "changes": [],
        }

    async def discover_models_preview(self, authorization: str, request: Any) -> dict[str, Any]:
        self.preview_requests.append((authorization, request))
        return {
            "source": "new-api channel model endpoint",
            "status": "success",
            "models": [{"id": "gpt-4.1", "name": "gpt-4.1", "configured": False}],
            "error": None,
        }

    async def copy_channel(self, authorization: str, logical_id: str, request: Any, actor: dict[str, Any]) -> dict[str, Any]:
        self.copy_requests.append((authorization, logical_id, request, actor))
        return {"id": "lc_copy", "name": request.name or "copy", "credential_fingerprint": "sha256:redacted"}


class AppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        settings = Settings.from_mapping({
            "PARTOKENS_ADMIN_NEW_API_ORIGIN": "http://new-api.test",
            "PARTOKENS_ADMIN_DATABASE_PATH": str(Path(self.temp.name) / "admin.sqlite3"),
        })
        database = Database(settings.database_path)
        database.initialize()
        self.client = FakeClient()
        self.service = FakeService()
        runtime = Runtime(
            settings=settings,
            database=database,
            repository=Repository(database),
            client=self.client,  # type: ignore[arg-type]
            monitor=FakeMonitor(),  # type: ignore[arg-type]
            service=self.service,  # type: ignore[arg-type]
        )
        self.test_client = TestClient(create_app(settings=settings, runtime=runtime))
        self.test_client.__enter__()

    def tearDown(self) -> None:
        self.test_client.__exit__(None, None, None)
        self.temp.cleanup()

    def test_health_does_not_require_root(self) -> None:
        response = self.test_client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "sqlite", "monitor_configured": False})

    def test_bootstrap_requires_exact_root_role(self) -> None:
        missing = self.test_client.get("/v1/bootstrap")
        self.assertEqual(missing.status_code, 401, missing.text)

        non_root = self.test_client.get("/v1/bootstrap", headers={"Authorization": "Bearer admin-token"})
        self.assertEqual(non_root.status_code, 403)

        root = self.test_client.get("/v1/bootstrap", headers={"Authorization": "Bearer root-token"})
        self.assertEqual(root.status_code, 200)
        self.assertEqual(root.json()["data"]["groups"], ["default"])
        self.assertEqual(self.client.authorizations[-1], "Bearer root-token")

    def test_validation_errors_never_echo_channel_secret(self) -> None:
        secret = "TOP-SECRET-CHANNEL-KEY"
        response = self.test_client.post(
            "/v1/channels",
            headers={"Authorization": "Bearer root-token"},
            json={
                "name": "missing-models",
                "channel_type": 1,
                "base_url": "https://api.example.test/v1/",
                "api_key": secret,
            },
        )
        self.assertEqual(response.status_code, 422)
        self.assertNotIn(secret, response.text)
        self.assertEqual(response.json()["message"], "Invalid request")

    def test_update_rejects_explicit_null_text_fields_before_sqlite(self) -> None:
        response = self.test_client.patch(
            "/v1/channels/lc_missing",
            headers={"Authorization": "Bearer root-token"},
            json={"name": None},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["message"], "Invalid request")

    def test_unsaved_model_discovery_uses_root_session_and_does_not_echo_key(self) -> None:
        secret = "CHANNEL-SECRET"
        response = self.test_client.post(
            "/v1/channels/models/discover",
            headers={"Authorization": "Bearer root-token"},
            json={"channel_type": 1, "base_url": "https://api.example.test/v1/", "api_key": secret},
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["data"]["models"][0]["id"], "gpt-4.1")
        self.assertEqual(self.service.preview_requests[0][0], "Bearer root-token")
        self.assertEqual(self.service.preview_requests[0][1].api_key.get_secret_value(), secret)
        self.assertEqual(str(self.service.preview_requests[0][1].base_url), "https://api.example.test/v1/")
        self.assertNotIn(secret, response.text)

    def test_copy_channel_requires_a_new_secret_and_redacts_it_from_response(self) -> None:
        secret = "NEW-CHANNEL-SECRET"
        response = self.test_client.post(
            "/v1/channels/lc_source/copy",
            headers={"Authorization": "Bearer root-token"},
            json={"api_key": secret, "name": "Copied variant"},
        )
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["data"]["id"], "lc_copy")
        self.assertEqual(self.service.copy_requests[0][0:2], ("Bearer root-token", "lc_source"))
        self.assertEqual(self.service.copy_requests[0][2].api_key.get_secret_value(), secret)
        self.assertNotIn(secret, response.text)

    def test_copy_channel_rejects_missing_new_secret(self) -> None:
        response = self.test_client.post(
            "/v1/channels/lc_source/copy",
            headers={"Authorization": "Bearer root-token"},
            json={"name": "Copied variant"},
        )
        self.assertEqual(response.status_code, 422)


class PreviewNormalizationTests(unittest.IsolatedAsyncioTestCase):
    async def test_unsaved_preview_strips_trailing_base_url_slash(self) -> None:
        class PreviewClient:
            def __init__(self) -> None:
                self.base_urls: list[str] = []

            async def fetch_channel_models_preview(self, authorization: str, channel_type: int, base_url: str, api_key: str) -> tuple[list[str], str | None]:
                self.base_urls.append(base_url)
                return ["gpt-4.1"], None

        temp = tempfile.TemporaryDirectory()
        try:
            database = Database(Path(temp.name) / "admin.sqlite3")
            database.initialize()
            client = PreviewClient()
            service = AdminService(Repository(database), client, FakeMonitor())  # type: ignore[arg-type]
            request = ChannelModelDiscoveryRequest(
                channel_type=1,
                base_url="https://api.example.test/v1/",
                api_key="channel-secret",
            )
            result = await service.discover_models_preview("Bearer root-token", request)
            self.assertEqual(result["models"][0]["id"], "gpt-4.1")
            self.assertEqual(client.base_urls, ["https://api.example.test/v1"])
        finally:
            temp.cleanup()


if __name__ == "__main__":
    unittest.main()
