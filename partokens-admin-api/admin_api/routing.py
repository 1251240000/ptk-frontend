from __future__ import annotations

import asyncio
import copy
import hashlib
import json
from typing import Any

from .domain import (
    ROUTE_PRIORITY_BASE,
    ROUTE_PRIORITY_STEP,
    channel_metadata,
    merged_other_info,
    new_id,
    route_record_name,
)
from .new_api import NewApiClient, NewApiError
from .repository import ConflictError, Repository
from .schemas import RoutePlanInput
from .execution import ExecutionChannels, matches_config, owned


class RouteValidationError(RuntimeError):
    pass


class RouteService:
    def __init__(self, repository: Repository, client: NewApiClient):
        self.repository = repository
        self.client = client
        self._execution_lock = asyncio.Lock()
        self.executions = ExecutionChannels(repository, client)

    async def preview(self, authorization: str, group: str, route: RoutePlanInput, *, migrating: str | None = None) -> dict[str, Any]:
        groups, retry_times, channels = await asyncio.gather(
            self.client.get_groups(authorization),
            self.client.get_retry_times(authorization),
            self.client.list_channels(authorization),
        )
        if group not in groups:
            raise RouteValidationError(f"group {group} does not exist in new-api")
        # Older saved plans omit priority; only those plans use the legacy mapping.
        layers = sorted([
            layer.model_copy(update={"priority": layer.priority if layer.priority is not None else ROUTE_PRIORITY_BASE - index * ROUTE_PRIORITY_STEP})
            for index, layer in enumerate(route.layers)
        ], key=lambda layer: layer.priority, reverse=True)
        priorities = {layer.priority for layer in layers}
        if len(priorities) != len(layers):
            raise RouteValidationError("相同优先级的渠道必须放在同一层")
        if len(priorities) > retry_times + 1:
            raise RouteValidationError(f"配置包含 {len(priorities)} 个不同优先级，全局重试 {retry_times} 次，最多允许 {retry_times + 1} 个优先级")
        if not layers and not route.confirm_empty:
            raise RouteValidationError("请单独确认清空：该分组将没有受本系统管理的路由渠道")
        current = self.repository.route(group)
        current_revision = int(current["revision"] if current else 0)
        if route.expected_revision is not None and route.expected_revision != current_revision:
            raise ConflictError("分组配置已变化，请核对最新配置后重新编辑")
        if any(change["target"] == group and change["id"] != migrating for change in self.repository.unfinished_route_changes()):
            raise ConflictError("该分组有未完成的变更，请先继续执行")

        members = [member for layer in route.layers for member in layer.members]
        logical_ids = [member.logical_id for member in members]
        if len(logical_ids) != len(set(logical_ids)):
            raise RouteValidationError("a logical channel cannot appear in multiple attempt layers")

        logical_rows: dict[str, dict[str, Any]] = {}
        existing_ids = {member["logical_id"] for layer in current["config"]["layers"] for member in layer["members"]} if current else set()
        for logical_id in logical_ids:
            row = self.repository.logical_row(logical_id)
            if (not row["enabled"] and logical_id not in existing_ids) or row["state"] != "active":
                raise RouteValidationError(f"logical channel {logical_id} is not ready for routing")
            if not json.loads(row["models_json"]) and logical_id not in existing_ids:
                raise RouteValidationError(f"渠道 {row['name']} 没有模型，不能绑定路由")
            self.repository.channel_config(logical_id)
            if self.repository.active_change(kind="model_remove", target=logical_id) or self.repository.active_change(kind="model_update", target=logical_id):
                raise ConflictError("渠道有未完成的模型变更，请先继续执行")
            logical_rows[logical_id] = row

        revision = current_revision + 1
        desired: list[dict[str, Any]] = []
        for attempt, layer in enumerate(layers):
            for member in layer.members:
                logical = logical_rows[member.logical_id]
                desired.append({
                    "logical_id": member.logical_id,
                    "logical_name": logical["name"],
                    "config_version": logical["config_version"],
                    "group": group,
                    "attempt": attempt,
                    "priority": layer.priority,
                    "weight": member.weight,
                    "revision": revision,
                    "models": json.loads(logical["models_json"]),
                    "enabled": bool(logical["enabled"] and json.loads(logical["models_json"])),
                })

        standard_old: list[int] = []
        nonstandard: list[dict[str, Any]] = []
        for channel in channels:
            channel_groups = {item.strip() for item in str(channel.get("group", "")).split(",") if item.strip()}
            if group not in channel_groups:
                continue
            metadata = channel_metadata(channel)
            if metadata and metadata.get("kind") == "archive":
                continue
            if owned(self.repository, channel) and metadata.get("kind") == "route" and metadata.get("group") == group and channel.get("group") == group:
                standard_old.append(int(channel["id"]))
            else:
                nonstandard.append({"id": int(channel["id"]), "name": str(channel.get("name", "")), "status": channel.get("status")})

        model_coverage: dict[str, list[bool]] = {}
        previous_members = {
            member["logical_id"]: {"priority": layer.get("priority") if layer.get("priority") is not None else ROUTE_PRIORITY_BASE - index * ROUTE_PRIORITY_STEP, "weight": member["weight"]}
            for index, layer in enumerate(current["config"]["layers"] if current else []) for member in layer["members"]
        }
        old_models = {model.strip() for channel in channels if int(channel["id"]) in standard_old for model in str(channel.get("models", "")).split(",") if model.strip()}
        all_models = sorted(old_models | {model for record in desired for model in record["models"]})
        for model in all_models:
            model_coverage[model] = [
                any(model in record["models"] and record["enabled"] for record in desired if record["attempt"] == attempt)
                for attempt in range(len(layers))
            ]

        next_members = {record["logical_id"]: {"priority": record["priority"], "weight": record["weight"]} for record in desired}
        changes = [{"logical_id": logical_id, "before": previous_members.get(logical_id), "after": next_members.get(logical_id)} for logical_id in sorted(previous_members.keys() | next_members.keys()) if previous_members.get(logical_id) != next_members.get(logical_id)]
        normalized_route = route.model_dump(exclude={"preview_token"})
        normalized_route["layers"] = [layer.model_dump() for layer in layers]
        # Bind confirmation to the reviewed route, source models and current physical configuration.
        snapshot = [{key: channel.get(key) for key in ("id", "group", "status", "priority", "weight", "models", "model_mapping", "other_info")} for channel in channels if int(channel["id"]) in set(standard_old)]
        # Acknowledgment happens after preview; it does not change the reviewed plan.
        reviewed_route = {key: value for key, value in normalized_route.items() if key != "acknowledge_nonstandard"}
        preview_token = hashlib.sha256(json.dumps({"route": reviewed_route, "revision": revision, "desired": desired, "snapshot": sorted(snapshot, key=lambda item: item["id"]), "nonstandard": nonstandard, "retry_times": retry_times}, sort_keys=True).encode()).hexdigest()
        if route.preview_token is not None and route.preview_token != preview_token:
            raise ConflictError("路由预览已过期，请重新预览并确认")

        steps: list[dict[str, Any]] = []
        for index, record in enumerate(desired):
            steps.extend([
                self._step("create", f"创建 {record['logical_name']} 的禁用执行渠道", {"record_index": index}),
                self._step("configure", f"配置 {record['logical_name']} · 尝试层 {record['attempt']}", {"record_index": index}),
                self._step("verify", f"核对 {record['logical_name']} 的底层字段", {"record_index": index}),
            ])
        steps.extend([
            self._step("enable_new", f"启用 r{revision} 新记录", {}),
            self._step("disable_old", "停用旧修订记录", {}),
            self._step("archive_old", "标记旧修订为归档", {}),
            self._step("verify_final", "重新读取并核对实际路由", {}),
        ])
        return {
            "schema": 2,
            "group": group,
            "revision": revision,
            "route": normalized_route,
            "preview_token": preview_token,
            "changes": changes,
            "uncovered_models": [model for model, coverage in model_coverage.items() if not any(coverage)],
            "desired": desired,
            "old_channel_ids": sorted(set(standard_old)),
            "nonstandard_channels": nonstandard,
            "model_coverage": model_coverage,
            "summary": {
                "create_and_configure": len(desired),
                "enable_new": sum(record["enabled"] for record in desired),
                "disable_old": len(set(standard_old)),
                "nonstandard_untouched": len(nonstandard),
            },
            "steps": steps,
        }

    async def execute(
        self,
        authorization: str,
        group: str,
        route: RoutePlanInput,
        actor: dict[str, Any],
    ) -> dict[str, Any]:
        async with self._execution_lock:
            plan = await self.preview(authorization, group, route)
            if plan["nonstandard_channels"] and not route.acknowledge_nonstandard:
                raise RouteValidationError("请先核对并确认保留该分组的非标准物理渠道，再保存")
            change = self.repository.create_change({
                "id": new_id("chg"),
                "kind": "route_revision",
                "target": group,
                "revision": plan["revision"],
                "status": "pending",
                "plan": plan,
                "steps": copy.deepcopy(plan["steps"]),
                "actor_id": int(actor["id"]),
                "actor_name": str(actor.get("display_name") or actor.get("username") or actor["id"]),
            })
            return await self._continue_change(authorization, change["id"])

    async def continue_change(self, authorization: str, change_id: str) -> dict[str, Any]:
        async with self._execution_lock:
            return await self._continue_change(authorization, change_id)

    async def _continue_change(self, authorization: str, change_id: str) -> dict[str, Any]:
        change = self.repository.change(change_id)
        if change["kind"] != "route_revision":
            raise RouteValidationError("only route revisions can be continued")
        if change["status"] == "success":
            return change
        if change["plan"].get("schema") != 2:
            raise ConflictError("旧变更需要迁移，请先补录凭据并通过迁移入口重新生成计划")
        for record in change["plan"]["desired"]:
            logical = self.repository.logical_row(record["logical_id"])
            if logical["config_version"] != record["config_version"]:
                raise ConflictError("本地渠道配置已变化，不能继续旧计划")
            self.repository.channel_config(record["logical_id"])
        steps = change["steps"]
        self.repository.update_change(change_id, status="running", steps=steps, error=None)
        try:
            for index, step in enumerate(steps):
                if step["status"] == "success":
                    continue
                step["status"] = "running"
                step["error"] = None
                self.repository.update_change(change_id, status="running", steps=steps)
                result = await self._run_step(authorization, change, step)
                step["status"] = "success"
                step["result"] = result
                self.repository.update_change(change_id, status="running", steps=steps)
            actor = change["actor_name"]
            plan = change["plan"]
            self.repository.save_route(plan["group"], plan["revision"], plan["route"], actor)
            self.repository.update_change(change_id, status="success", steps=steps)
        except Exception as exc:
            step = steps[index]
            step["status"] = "failed"
            message = str(exc) if isinstance(exc, ConflictError) else "执行渠道操作失败，请检查连接及 new-api 版本后重试"
            step["error"] = message
            self.repository.update_change(change_id, status="partial", steps=steps, error=message)
        return self.repository.change(change_id)

    def _payload(self, change: dict[str, Any], index: int) -> dict[str, Any]:
        record = change["plan"]["desired"][index]
        return self.executions.payload(
            record["logical_id"], f"{change['id']}:{index}",
            {"kind": "route", "group": record["group"], "attempt": record["attempt"],
             "priority": record["priority"], "weight": record["weight"], "route_revision": record["revision"]},
            name=route_record_name(record["logical_name"], record["group"], record["attempt"], record["revision"]),
            group=record["group"], priority=record["priority"], weight=record["weight"],
        )

    async def _verify_new(self, token: str, change: dict[str, Any], *, active: bool) -> list[int]:
        ids = []
        for index, record in enumerate(change["plan"]["desired"]):
            channel_id = self._created_channel_id(change["steps"], index)
            channel = await self.executions.require_owned(token, channel_id, record["logical_id"])
            payload = self._payload(change, index)
            metadata = channel_metadata(channel) or {}
            expected_status = 1 if active and record["enabled"] else 2
            if (int(channel.get("status", 0)) != expected_status
                    or metadata != channel_metadata(payload)
                    or not matches_config(channel, payload)):
                raise ConflictError("执行渠道与本地配置不一致，旧记录未继续停用；请核对漂移后重试")
            ids.append(channel_id)
        return ids

    async def _old_records(self, token: str, change: dict[str, Any]) -> list[dict[str, Any]]:
        result = []
        for channel_id in change["plan"]["old_channel_ids"]:
            channel = await self.executions.require_owned(token, channel_id)
            metadata = channel_metadata(channel) or {}
            if (metadata.get("kind") not in {"route", "archive"}
                    or metadata.get("group") != change["plan"]["group"]
                    or channel.get("group") != change["plan"]["group"]):
                raise ConflictError("旧执行记录用途已变化，未继续操作")
            result.append(channel)
        return result

    async def _run_step(self, authorization: str, change: dict[str, Any], step: dict[str, Any]) -> dict[str, Any]:
        action = step["action"]
        if action in {"create", "configure", "verify"}:
            index = int(step["payload"]["record_index"])
            record = change["plan"]["desired"][index]
            payload = self._payload(change, index)
            if action == "create":
                channel_id = await self.executions.ensure(
                    authorization, f"{change['id']}:{index}", record["logical_id"], payload)
            else:
                channel_id = self._created_channel_id(change["steps"], index)
            channel = await self.executions.require_owned(authorization, channel_id, record["logical_id"])
            if (int(channel.get("status", 0)) != 2
                    or channel_metadata(channel) != channel_metadata(payload)
                    or not matches_config(channel, payload)):
                raise ConflictError("禁用执行渠道校验失败，请检查配置及 new-api 凭据核验能力")
            return {"channel_id": channel_id, "verified": True}
        if action == "enable_new":
            # On resume, successful enables are allowed, but every record is rechecked.
            ids = []
            for index, record in enumerate(change["plan"]["desired"]):
                channel_id = self._created_channel_id(change["steps"], index)
                channel = await self.executions.require_owned(authorization, channel_id, record["logical_id"])
                payload = self._payload(change, index)
                if (channel_metadata(channel) != channel_metadata(payload) or not matches_config(channel, payload)
                        or int(channel.get("status", 0)) not in {1, 2}):
                    raise ConflictError("新执行渠道漂移，未继续启用")
                if record["enabled"]:
                    ids.append(channel_id)
            if ids:
                await self.client.batch_status(authorization, ids, 1)
            await self._verify_new(authorization, change, active=True)
            return {"channel_ids": ids}
        if action == "disable_old":
            await self._verify_new(authorization, change, active=True)
            channels = await self._old_records(authorization, change)
            ids = [int(channel["id"]) for channel in channels]
            if ids:
                await self.client.batch_status(authorization, ids, 2)
            return {"channel_ids": ids}
        if action == "archive_old":
            channels = await self._old_records(authorization, change)
            for channel in channels:
                if int(channel.get("status", 0)) != 2:
                    raise ConflictError("旧执行渠道尚未停用")
                metadata = channel_metadata(channel)
                metadata["kind"] = "archive"
                # PUT requires the existing fields, but no upstream fields are persisted locally.
                payload = {key: value for key, value in channel.items() if key not in {"key", "masked_key", "credential_fingerprint", "status", "channel_info"}}
                payload["other_info"] = merged_other_info(channel, metadata)
                await self.client.update_channel(authorization, payload)
            return {"channel_ids": [int(channel["id"]) for channel in channels]}
        if action == "verify_final":
            ids = await self._verify_new(authorization, change, active=True)
            for channel in await self._old_records(authorization, change):
                if int(channel.get("status", 0)) != 2:
                    raise ConflictError("旧执行渠道仍处于启用状态")
            return {"verified": True, "active_channel_ids": ids}
        raise RouteValidationError(f"unknown change step {action}")

    @staticmethod
    def _step(action: str, label: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"action": action, "label": label, "payload": payload, "status": "pending", "result": None, "error": None}

    @staticmethod
    def _created_channel_id(steps: list[dict[str, Any]], record_index: int) -> int:
        for step in steps:
            if step["action"] == "create" and step["payload"].get("record_index") == record_index:
                channel_id = (step.get("result") or {}).get("channel_id")
                if isinstance(channel_id, int):
                    return channel_id
        raise ConflictError("执行渠道 ID 尚未确认")
