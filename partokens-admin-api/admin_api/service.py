from __future__ import annotations

import asyncio
import json
from decimal import Decimal
from typing import Any

from .domain import (
    CATALOG_GROUP,
    LOGICAL_TAG_PREFIX,
    credential_fingerprint,
    cost_ratio_to_millis,
    identity_hash,
    merged_other_info,
    new_id,
    normalized_base_url,
)
from .monitor import Monitor
from .model_operations import ModelOperations
from .new_api import NewApiClient, NewApiError
from .repository import ConflictError, Repository
from .routing import RouteService
from .schemas import ChannelModelDiscoveryRequest, LogicalChannelCopy, LogicalChannelCreate, LogicalChannelStatus, LogicalChannelUpdate, RoutePlanInput


class AdminService:
    def __init__(self, repository: Repository, client: NewApiClient, monitor: Monitor):
        self.repository = repository
        self.client = client
        self.monitor = monitor
        self.routes = RouteService(repository, client)
        self.models = ModelOperations(repository, client)

    async def bootstrap(self, authorization: str) -> dict[str, Any]:
        groups, retry_times = await asyncio.gather(
            self.client.get_groups(authorization),
            self.client.get_retry_times(authorization),
        )
        return {
            "channels": self.repository.public_channels(),
            "groups": groups,
            "retry_times": retry_times,
            "routes": self.repository.routes(),
            "monitor": self.repository.database.latest_snapshot(),
            "changes": self.repository.changes(50),
        }

    async def create_channel(self, authorization: str, request: LogicalChannelCreate, actor: dict[str, Any]) -> dict[str, Any]:
        logical_id = new_id("lc")
        secret = request.api_key.get_secret_value()
        fingerprint = credential_fingerprint(secret)
        base_url = normalized_base_url(str(request.base_url))
        identity = identity_hash(request.channel_type, base_url, fingerprint)
        existing = self.repository.database.fetch_one("SELECT id FROM logical_channels WHERE identity_hash = ?", (identity,))
        if existing:
            raise ConflictError(f"logical channel {existing['id']} already uses this channel identity")
        metadata = {
            "schema": 1,
            "logical_id": logical_id,
            "kind": "template",
            "cost_ratio_millis": cost_ratio_to_millis(request.cost_ratio),
            "credential_fingerprint": fingerprint,
        }
        channel = {
            "type": request.channel_type,
            "key": secret,
            "status": 2,
            "name": f"{request.name} · credential template",
            "weight": 0,
            "base_url": base_url,
            "models": ",".join(request.models),
            "group": CATALOG_GROUP,
            "model_mapping": request.model_mapping,
            "priority": 0,
            "auto_ban": 0,
            "other_info": json.dumps({"partokens_admin": metadata}, separators=(",", ":"), sort_keys=True),
            "tag": f"{LOGICAL_TAG_PREFIX}{logical_id}",
            "remark": request.note,
        }
        await self.client.add_channel(authorization, channel)
        template_id = None
        for item in await self.client.list_channels(authorization):
            if item.get("tag") == channel["tag"]:
                template_id = int(item["id"])
                break
        if template_id is None:
            raise NewApiError("new-api created the template but it could not be read back")
        self.repository.create_logical({
            "id": logical_id,
            "name": request.name,
            "channel_type": request.channel_type,
            "base_url": base_url,
            "identity_hash": identity,
            "credential_fingerprint": fingerprint,
            "cost_ratio_millis": cost_ratio_to_millis(request.cost_ratio),
            "models": request.models,
            "model_mapping": request.model_mapping,
            "note": request.note,
            "template_channel_id": template_id,
        })
        await self.monitor.refresh(authorization, include_logs=False)
        return next(channel for channel in self.repository.public_channels() if channel["id"] == logical_id)

    async def copy_channel(self, authorization: str, logical_id: str, request: LogicalChannelCopy, actor: dict[str, Any]) -> dict[str, Any]:
        """Create a new routeable credential variant without exposing the source key."""
        source = self.repository.logical_row(logical_id)
        source_models = json.loads(source["models_json"])
        source_ratio = None
        if source.get("cost_ratio_millis") is not None:
            source_ratio = Decimal(int(source["cost_ratio_millis"])) / Decimal(1000)
        elif source.get("cost_ratio") is not None:
            # Keep copies working for databases created before the exact
            # thousandths column was introduced.
            source_ratio = source["cost_ratio"]
        values = request.model_dump(exclude_unset=True)
        create_request = LogicalChannelCreate(
            name=values.get("name") or f"{source['name']} · 副本",
            channel_type=values.get("channel_type") or source["channel_type"],
            base_url=values.get("base_url") or source["base_url"],
            api_key=request.api_key,
            cost_ratio=values["cost_ratio"] if "cost_ratio" in values else source_ratio,
            models=values.get("models") or source_models,
            model_mapping=values.get("model_mapping", source.get("model_mapping")),
            note=values["note"] if "note" in values else source.get("note", ""),
        )
        return await self.create_channel(authorization, create_request, actor)

    def update_channel(self, logical_id: str, request: LogicalChannelUpdate) -> dict[str, Any]:
        changes = request.model_dump(exclude_unset=True)
        if "cost_ratio" in changes:
            changes["cost_ratio_millis"] = cost_ratio_to_millis(changes.pop("cost_ratio"))
        self.repository.update_logical(logical_id, changes)
        return next(channel for channel in self.repository.public_channels() if channel["id"] == logical_id)

    async def set_channel_status(self, authorization: str, logical_id: str, request: LogicalChannelStatus) -> dict[str, Any]:
        self.repository.logical_row(logical_id)
        records = [record for record in self.repository.physical_rows() if record.get("logical_id") == logical_id and record["kind"] == "route"]
        if request.enabled:
            routes = {route["group_name"]: route["revision"] for route in self.repository.routes()}
            ids = [
                int(record["channel_id"])
                for record in records
                if routes.get(record.get("group_name")) == record.get("route_revision") and not record.get("drift")
            ]
            await self.client.batch_status(authorization, ids, 1)
        else:
            ids = [int(record["channel_id"]) for record in records if record["status"] == 1]
            await self.client.batch_status(authorization, ids, 2)
        self.repository.update_logical(logical_id, {"enabled": int(request.enabled)})
        await self.monitor.refresh(authorization, include_logs=False)
        return next(channel for channel in self.repository.public_channels() if channel["id"] == logical_id)

    async def test_channel(self, authorization: str, logical_id: str) -> Any:
        logical = self.repository.logical_row(logical_id)
        return await self.client.test_channel(authorization, int(logical["template_channel_id"]))

    async def preview_route(self, authorization: str, group: str, request: RoutePlanInput) -> dict[str, Any]:
        return await self.routes.preview(authorization, group, request)

    async def execute_route(self, authorization: str, group: str, request: RoutePlanInput, actor: dict[str, Any]) -> dict[str, Any]:
        result = await self.routes.execute(authorization, group, request, actor)
        await self.monitor.refresh(authorization, include_logs=False)
        return result

    async def continue_change(self, authorization: str, change_id: str) -> dict[str, Any]:
        change = self.repository.change(change_id)
        if change["kind"] == "model_remove":
            result = await self.models.continue_remove(authorization, change_id)
        else:
            result = await self.routes.continue_change(authorization, change_id)
        await self.monitor.refresh(authorization, include_logs=False)
        return result

    async def discover_models(self, authorization: str, logical_id: str) -> dict[str, Any]:
        return await self.models.discover(authorization, logical_id)

    async def discover_models_preview(self, authorization: str, request: ChannelModelDiscoveryRequest) -> dict[str, Any]:
        models, partial = await self.client.fetch_channel_models_preview(
            authorization,
            request.channel_type,
            # New API appends `/v1/models` for OpenAI-compatible channels.
            # Strip a form-entered trailing slash so it cannot become
            # `//v1/models`, which some reverse proxies serve as the SPA HTML.
            normalized_base_url(str(request.base_url)),
            request.api_key.get_secret_value(),
        )
        return {
            "source": "new-api channel model endpoint",
            "status": "partial" if partial else "empty" if not models else "success",
            "models": [{"id": model, "name": model, "configured": False} for model in models],
            "error": "渠道只返回了部分模型" if partial else None,
        }

    async def start_model_test(self, authorization: str, logical_id: str, models: list[str], actor: dict[str, Any]) -> dict[str, Any]:
        return await self.models.start_test(authorization, logical_id, models, actor)

    async def get_model_test(self, task_id: str) -> dict[str, Any]:
        return await self.models.get_test(task_id)

    async def cancel_model_test(self, task_id: str) -> dict[str, Any]:
        return await self.models.cancel_test(task_id)

    async def preview_model_remove(self, authorization: str, logical_id: str, models: list[str] | None) -> dict[str, Any]:
        return await self.models.preview_remove(authorization, logical_id, models)

    async def execute_model_remove(self, authorization: str, logical_id: str, models: list[str] | None, actor: dict[str, Any]) -> dict[str, Any]:
        result = await self.models.execute_remove(authorization, logical_id, models, actor)
        await self.monitor.refresh(authorization, include_logs=False)
        return result
