from __future__ import annotations

import asyncio
import json
from decimal import Decimal
from typing import Any

from .domain import (
    channel_metadata,
    credential_fingerprint,
    cost_ratio_to_millis,
    identity_hash,
    masked_api_key,
    new_id,
    normalized_base_url,
)
from .monitor import Monitor
from .model_operations import ModelOperations
from .new_api import NewApiClient, NewApiError
from .repository import ConflictError, Repository
from .routing import RouteService
from .schemas import ChannelModelDiscoveryRequest, LogicalChannelCopy, LogicalChannelCreate, LogicalChannelStatus, LogicalChannelUpdate, RoutePlanInput
from .schemas import execution_config
from .execution import owned, matches_config
from pydantic import SecretStr


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
            "channels": await self.list_channels(authorization),
            "groups": groups,
            "retry_times": retry_times,
            "routes": self.repository.routes(),
            "monitor": self.repository.database.latest_snapshot(),
            "changes": list({change["id"]: change for change in self.repository.changes(50) + self.repository.unfinished_route_changes()}.values()),
        }

    async def list_channels(self, authorization: str) -> list[dict[str, Any]]:
        return self.repository.public_channels()

    async def create_channel(self, authorization: str, request: LogicalChannelCreate, actor: dict[str, Any]) -> dict[str, Any]:
        logical_id = new_id("lc")
        secret = request.api_key.get_secret_value()
        fingerprint = credential_fingerprint(secret)
        base_url = normalized_base_url(str(request.base_url))
        identity = identity_hash(request.channel_type, base_url, fingerprint)
        if self.repository.vault is None:
            raise ConflictError("未配置渠道加密主密钥")
        config = execution_config(request.execution_config)
        config["key"] = secret
        self.repository.create_logical({
            "id": logical_id, "name": request.name, "channel_type": request.channel_type,
            "base_url": base_url, "identity_hash": identity, "credential_fingerprint": fingerprint,
            "masked_key": masked_api_key(secret), "cost_ratio_millis": cost_ratio_to_millis(request.cost_ratio),
            "models": request.models, "model_mapping": request.model_mapping, "note": request.note,
            "config_ciphertext": self.repository.vault.encrypt(logical_id, config),
        })
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
            execution_config=SecretStr(json.dumps({key: value for key, value in self.repository.channel_config(logical_id).items() if key not in {"key", "type", "base_url", "models", "model_mapping"}})),
            cost_ratio=values["cost_ratio"] if "cost_ratio" in values else source_ratio,
            models=values.get("models") or source_models,
            model_mapping=values.get("model_mapping", source.get("model_mapping")),
            note=values["note"] if "note" in values else source.get("note", ""),
        )
        return await self.create_channel(authorization, create_request, actor)

    def update_channel(self, logical_id: str, request: LogicalChannelUpdate) -> dict[str, Any]:
        logical = self.repository.logical_row(logical_id)
        changes = request.model_dump(exclude_unset=True)
        config_fields = {"api_key", "channel_type", "base_url", "model_mapping", "execution_config"}
        if config_fields.intersection(changes):
            if self.routes._execution_lock.locked() or self.models._change_lock.locked() or self.repository.active_model_test_task(logical_id):
                raise ConflictError("渠道正在执行变更或测试，请稍后编辑")
            for change in self.repository.changes(10000):
                if change["status"] not in {"success", "cancelled"} and logical_id in json.dumps(change["plan"]):
                    # Credential re-entry is required to migrate legacy plans.
                    if change["plan"].get("schema") == 2:
                        raise ConflictError("渠道有未完成变更，请先继续执行")
            if logical.get("config_ciphertext"):
                config = self.repository.channel_config(logical_id)
            else:
                if request.api_key is None:
                    raise ConflictError("渠道缺少本地凭据，请重新录入")
                config = execution_config(None)
            if "execution_config" in changes:
                config = {**execution_config(request.execution_config), "key": config.get("key")}
            if request.api_key is not None:
                config["key"] = request.api_key.get_secret_value()
            config = {key: value for key, value in config.items() if key not in {"type", "base_url", "models", "model_mapping"}}
            fingerprint = credential_fingerprint(config["key"])
            base_url = normalized_base_url(str(request.base_url)) if request.base_url else logical["base_url"]
            channel_type = request.channel_type or logical["channel_type"]
            identity = identity_hash(channel_type, base_url, fingerprint)
            duplicate = self.repository.database.fetch_one("SELECT id FROM logical_channels WHERE identity_hash = ? AND id != ?", (identity, logical_id))
            if duplicate:
                raise ConflictError("该渠道配置及凭据已存在")
            changes.pop("api_key", None)
            changes.pop("execution_config", None)
            changes.update(base_url=base_url, channel_type=channel_type, identity_hash=identity,
                           credential_fingerprint=fingerprint, masked_key=masked_api_key(config["key"]),
                           config_ciphertext=self.repository.vault.encrypt(logical_id, config),
                           config_version=logical["config_version"] + 1)
        if "cost_ratio" in changes:
            changes["cost_ratio_millis"] = cost_ratio_to_millis(changes.pop("cost_ratio"))
        self.repository.update_logical(logical_id, changes)
        return next(channel for channel in self.repository.public_channels() if channel["id"] == logical_id)

    async def set_channel_status(self, authorization: str, logical_id: str, request: LogicalChannelStatus) -> dict[str, Any]:
        async with self.routes._execution_lock:
            return await self._set_channel_status(authorization, logical_id, request)

    async def _set_channel_status(self, authorization: str, logical_id: str, request: LogicalChannelStatus) -> dict[str, Any]:
        if self.repository.logical_row(logical_id)["state"] != "active":
            raise ConflictError("渠道正在删除，请完成删除后重试")
        for change in self.repository.unfinished_route_changes():
            if any(item.get("logical_id") == logical_id for item in change["plan"].get("desired", [])):
                raise ConflictError("渠道有未完成路由变更，请先继续执行")
        records = [item for item in await self.client.list_channels(authorization)
                   if owned(self.repository, item, logical_id) and channel_metadata(item).get("kind") == "route"]
        if request.enabled:
            config = self.repository.channel_config(logical_id)
            ids = []
            for record in records:
                channel = await self.routes.executions.require_owned(authorization, int(record["id"]), logical_id)
                metadata = channel_metadata(channel)
                route = self.repository.route(metadata.get("group"))
                if not route or metadata.get("route_revision") != route["revision"]:
                    continue
                if self.monitor._drift(channel, metadata) or not matches_config(channel, config):
                    raise ConflictError("渠道配置存在漂移，请重新保存分组路由后启用")
                if config["models"]:
                    ids.append(int(channel["id"]))
        else:
            ids = [int(record["id"]) for record in records]
        for channel_id in ids:
            await self.routes.executions.require_owned(authorization, channel_id, logical_id)
        await self.client.batch_status(authorization, ids, 1 if request.enabled else 2)
        for channel_id in ids:
            channel = await self.routes.executions.require_owned(authorization, channel_id, logical_id)
            if int(channel.get("status", 0)) != (1 if request.enabled else 2):
                raise ConflictError("执行渠道状态尚未同步，请重试")
        self.repository.update_logical(logical_id, {"enabled": int(request.enabled)})
        await self.monitor.refresh(authorization, include_logs=False)
        return next(channel for channel in self.repository.public_channels() if channel["id"] == logical_id)

    async def test_channel(self, authorization: str, logical_id: str) -> Any:
        logical = self.repository.logical_row(logical_id)
        return await self.models.start_test(authorization, logical_id, json.loads(logical["models_json"])[:100], {"id": 0, "username": "channel-test"})

    async def delete_channel(self, authorization: str, logical_id: str) -> dict[str, Any]:
        async with self.routes._execution_lock, self.models._change_lock:
            logical = self.repository.logical_row(logical_id)
            for route in self.repository.routes():
                if any(member["logical_id"] == logical_id for layer in route["config"]["layers"] for member in layer["members"]):
                    raise ConflictError("请先解除渠道的分组绑定")
            if self.repository.active_model_test_task(logical_id):
                raise ConflictError("模型测试正在执行，请等待完成后删除")
            if self.repository.database.fetch_one(
                "SELECT changes.id FROM changes, json_tree(changes.plan_json) WHERE changes.status NOT IN ('success', 'cancelled') AND json_tree.value = ? LIMIT 1",
                (logical_id,),
            ):
                raise ConflictError("存在未完成的渠道变更，请先完成变更后删除")
            # The state also blocks new tests while upstream deletion yields.
            self.repository.update_logical(logical_id, {"state": "deleting", "enabled": 0})
            channels = await self.client.list_channels(authorization)
            if any((channel_metadata(item) or {}).get("logical_id") == logical_id and not owned(self.repository, item, logical_id) for item in channels):
                raise ConflictError("渠道记录的归属已变化，请先核对后删除")
            managed = [item for item in channels if owned(self.repository, item, logical_id)]
            for item in managed:
                await self.routes.executions.delete(authorization, int(item["id"]), logical_id)
            remaining = await self.client.list_channels(authorization)
            if any(owned(self.repository, item, logical_id) for item in remaining):
                raise ConflictError("上游渠道尚未全部删除，请重试")
            with self.repository.database.transaction() as connection:
                connection.execute("DELETE FROM physical_records WHERE logical_id = ?", (logical_id,))
                connection.execute("DELETE FROM model_discoveries WHERE logical_id = ?", (logical_id,))
                connection.execute("DELETE FROM model_test_tasks WHERE logical_id = ?", (logical_id,))
                connection.execute("DELETE FROM logical_channels WHERE id = ?", (logical_id,))
            return {"id": logical_id}

    async def preview_route(self, authorization: str, group: str, request: RoutePlanInput) -> dict[str, Any]:
        return await self.routes.preview(authorization, group, request)

    async def execute_route(self, authorization: str, group: str, request: RoutePlanInput, actor: dict[str, Any]) -> dict[str, Any]:
        result = await self.routes.execute(authorization, group, request, actor)
        await self.monitor.refresh(authorization, include_logs=False)
        return result

    async def continue_change(self, authorization: str, change_id: str) -> dict[str, Any]:
        change = self.repository.change(change_id)
        if change["kind"] in {"model_remove", "model_update"}:
            async with self.routes._execution_lock:
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
        models = [model for model in models if request.api_key.get_secret_value() not in model]
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

    async def execute_model_remove(self, authorization: str, logical_id: str, models: list[str] | None, actor: dict[str, Any], preview_token: str | None = None, *, adding: bool = False) -> dict[str, Any]:
        async with self.routes._execution_lock:
            result = await self.models.execute_remove(authorization, logical_id, models, actor, preview_token, adding=adding)
        await self.monitor.refresh(authorization, include_logs=False)
        return result
