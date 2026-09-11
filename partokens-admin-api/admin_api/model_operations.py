from __future__ import annotations

import asyncio
import copy
import hashlib
import json
import re
import time
from typing import Any

from .domain import channel_metadata, models_list, new_id
from .new_api import MODEL_TEST_TIMEOUT_SECONDS, NewApiClient, NewApiError
from .repository import ConflictError, NotFoundError, Repository
from .execution import ExecutionChannels, owned, matches_config


MODEL_TEST_CONCURRENCY = 4
MODEL_TEST_MAX_MODELS = 100
MODEL_RESULT_TTL_SECONDS = 15 * 60


def _digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _config_revision(logical: dict[str, Any]) -> str:
    return _digest({key: logical.get(key) for key in ("identity_hash", "config_version", "models_json", "model_mapping")})


def _physical_revision(channel: dict[str, Any]) -> str:
    values = {key: channel.get(key) for key in ("type", "base_url", "models", "model_mapping", "param_override", "header_override", "setting", "settings", "other_info", "key", "organization", "credential_fingerprint", "group", "name", "priority", "weight", "tag")}
    values["settings"] = values["settings"] or "{}"
    values["key"] = values["key"] or ""
    return _digest(values)


def _safe_error(error: Exception | str) -> str:
    if isinstance(error, NewApiError):
        return {
            "timeout": "渠道请求超时",
            "network": "渠道连接失败",
            "rate_limited": "渠道请求受到限流",
            "unauthorized": "渠道认证失败",
            "server_error": "渠道服务暂时不可用",
            "invalid_response": "渠道返回了不支持的模型清单",
            "not_found": "渠道不支持模型清单接口",
        }.get(error.kind, "渠道请求未完成")
    if isinstance(error, asyncio.TimeoutError):
        return "模型响应超时"
    return "模型测试未完成"


def _discovery_status(error: NewApiError) -> str:
    if error.kind in {"timeout", "network"}:
        return "timeout"
    if error.kind == "unauthorized":
        return "unauthorized"
    if error.kind == "rate_limited":
        return "rate_limited"
    if error.kind == "server_error":
        return "server_error"
    if error.kind == "not_found":
        return "not_found"
    if error.kind == "invalid_response":
        return "unsupported"
    return "unknown"


def _test_status_from_failure(error: Exception | None = None, payload: Any = None) -> tuple[str, str]:
    if error is not None:
        if isinstance(error, NewApiError):
            if error.kind == "timeout":
                return "timeout", "模型响应超时"
            if error.kind == "network":
                return "unknown", "渠道连接失败"
            if error.kind == "rate_limited":
                return "rate_limited", "渠道请求受到限流"
            if error.kind == "unauthorized":
                return "unauthorized", "渠道认证失败"
            if error.kind == "server_error":
                return "server_error", "渠道服务暂时不可用"
            if error.error_code in {"model_not_found", "unsupported_model", "model_not_supported"}:
                return "unavailable", "模型不存在或渠道未提供该模型"
            if error.kind == "not_found":
                return "unknown", "测试接口或渠道记录不存在"
        if isinstance(error, asyncio.TimeoutError):
            return "timeout", "模型响应超时"
        return "unknown", "模型测试未完成"

    message = ""
    code = ""
    if isinstance(payload, dict):
        detail = payload.get("error")
        detail = detail if isinstance(detail, dict) else {}
        message = str(payload.get("message") or detail.get("message") or payload.get("error") or "")
        code = str(payload.get("error_code") or detail.get("code") or "").lower()
    # Legacy new-api embeds HTTP status in message text. Never search digits in
    # request IDs or arbitrary response bodies when determining that status.
    lowered = f"{code} {message}".lower()
    status_match = re.search(r"(?:\bstatus(?:\s+code)?[\s:=]+|\bhttp[\s/]+)([45]\d{2})\b", message, re.I)
    if status_match is None:
        status_match = re.match(r"\s*([45]\d{2})\b", message)
    http_status = payload.get("status_code") if isinstance(payload, dict) else None
    try:
        http_status = int(http_status) if http_status is not None else None
    except (TypeError, ValueError):
        http_status = None
    if http_status is None and status_match:
        http_status = int(status_match[1])
    if http_status == 429 or "rate limit" in lowered or "rate_limit" in lowered or "quota" in lowered or "限流" in lowered:
        return "rate_limited", "渠道请求受到限流"
    if http_status in {401, 403} or "unauthor" in lowered or "forbidden" in lowered:
        return "unauthorized", "渠道认证失败"
    if "无可用渠道" in lowered:
        return "server_error", "上游分组下该模型无可用渠道，请检查分组与渠道可用性"
    if (http_status is not None and 500 <= http_status <= 599) or "server" in lowered:
        return "server_error", "渠道服务暂时不可用"
    if any(token in lowered for token in ("timeout", "timed out", "超时")):
        return "timeout", "模型响应超时"
    if code in {"model_not_found", "unsupported_model", "model_not_supported"} or any(token in lowered for token in ("model not found", "unknown model", "unsupported model", "no such model", "模型不存在", "未找到模型", "不支持该模型")) or re.search(r"\bmodel\s+[`'\"]?[\w./:-]+[`'\"]?\s+(?:does not exist|is not supported)\b", lowered):
        if any(token in lowered for token in ("or you do not have access", "permission", "权限")):
            return "unauthorized", "模型访问权限不足"
        return "unavailable", "模型不存在或渠道未提供该模型"
    if http_status == 400 and "upstream request failed" in lowered:
        return "unknown", "上游返回 HTTP 400（Upstream request failed），未提供具体拒绝原因"
    if "invalid" in lowered or "bad request" in lowered or http_status == 400:
        return "unknown", "测试请求格式不被渠道接受"
    return "unknown", "渠道返回了未知错误"


def _mapping_after(raw: Any, removed: set[str]) -> tuple[str | None, bool]:
    if not isinstance(raw, str) or not raw.strip():
        return raw if isinstance(raw, str) and raw.strip() else None, False
    try:
        mapping = json.loads(raw)
    except (TypeError, ValueError):
        return raw, False
    if not isinstance(mapping, dict):
        return raw, False
    filtered = {
        str(source): str(target)
        for source, target in mapping.items()
        if str(source) not in removed and str(target) not in removed
    }
    changed = filtered != mapping
    return json.dumps(filtered, separators=(",", ":"), ensure_ascii=True, sort_keys=True), changed


class ModelOperations:
    def __init__(self, repository: Repository, client: NewApiClient):
        self.repository = repository
        self.client = client
        self._test_tasks: dict[str, asyncio.Task[None]] = {}
        self._cancel_events: dict[str, asyncio.Event] = {}
        self._change_lock = asyncio.Lock()
        self.executions = ExecutionChannels(repository, client)

    async def stop(self) -> None:
        workers = list(self._test_tasks.values())
        for worker in workers:
            worker.cancel()
        await asyncio.gather(*workers, return_exceptions=True)
        # Includes tasks cancelled before their coroutine first ran.
        self.repository._recover_model_test_tasks()

    async def discover(self, authorization: str, logical_id: str) -> dict[str, Any]:
        async with self._change_lock:
            return await self._discover(authorization, logical_id)

    async def _discover(self, authorization: str, logical_id: str) -> dict[str, Any]:
        logical = self.repository.logical_row(logical_id)
        if logical["state"] != "active":
            raise ConflictError("渠道正在删除，无法发现模型")
        config = self.repository.channel_config(logical_id)
        probe_id = None
        try:
            probe_id = await self.executions.probe(authorization, logical_id, new_id("discovery"))
            models, partial = await self.client.fetch_channel_models_result(authorization, probe_id)
            models = [model for model in models if config["key"] not in model]
            status = "partial" if partial else "empty" if not models else "success"
            error = "渠道只返回了部分模型" if partial else None
        except NewApiError as exc:
            models = []
            status = _discovery_status(exc)
            error = _safe_error(exc)
        finally:
            if probe_id is not None:
                try:
                    await self.executions.delete(authorization, probe_id, logical_id)
                except Exception:
                    pass
        configured = set(json.loads(logical["models_json"]))
        entries = [
            {"id": model, "name": model, "configured": model in configured}
            for model in models
        ]
        result = self.repository.save_model_discovery(
            logical_id,
            source="new-api channel model endpoint",
            status=status,
            models=entries,
            error=error,
        )
        return self._public_discovery(result)

    async def start_test(self, authorization: str, logical_id: str, models: list[str], actor: dict[str, Any]) -> dict[str, Any]:
        self.repository.channel_config(logical_id)
        if self._change_lock.locked():
            raise ConflictError("渠道变更正在执行，请稍后测试")
        if self.repository.logical_row(logical_id)["state"] != "active":
            raise ConflictError("渠道正在删除，无法开始测试")
        change = self.repository.active_change(kind="model_remove", target=logical_id)
        if change and change["status"] in {"pending", "running"}:
            raise ConflictError("模型移除正在执行，请稍后测试")
        normalized = list(dict.fromkeys(model.strip() for model in models if model.strip()))[:MODEL_TEST_MAX_MODELS]
        if not normalized:
            raise ConflictError("at least one model is required")
        active = self.repository.active_model_test_task(logical_id)
        if active:
            return self._public_task(active)
        task_id = new_id("mt")
        initial_results = [
            {"model_id": model, "name": model, "status": "untested", "latency_ms": None, "error": None, "tested_at": None}
            for model in normalized
        ]
        try:
            task = self.repository.create_model_test_task({
                "id": task_id,
                "logical_id": logical_id,
                "models": normalized,
                "results": initial_results,
                "actor_id": int(actor["id"]),
                "actor_name": str(actor.get("display_name") or actor.get("username") or actor["id"]),
            })
        except ConflictError:
            active = self.repository.active_model_test_task(logical_id)
            if active:
                return self._public_task(active)
            raise
        cancel_event = asyncio.Event()
        self._cancel_events[task_id] = cancel_event
        self._test_tasks[task_id] = asyncio.create_task(self._run_test_task(authorization, task_id, cancel_event))
        return self._public_task(task)

    async def get_test(self, task_id: str) -> dict[str, Any]:
        task = self.repository.model_test_task(task_id)
        if task is None:
            raise NotFoundError(f"model test {task_id} was not found")
        return self._public_task(task)

    async def cancel_test(self, task_id: str) -> dict[str, Any]:
        task = self.repository.model_test_task(task_id)
        if task is None:
            raise NotFoundError(f"model test {task_id} was not found")
        if task["status"] in {"success", "partial", "cancelled"}:
            return self._public_task(task)
        event = self._cancel_events.get(task_id)
        if event:
            event.set()
        self.repository.request_model_test_cancel(task_id)
        worker = self._test_tasks.get(task_id)
        if worker:
            worker.cancel()
            await asyncio.gather(worker, return_exceptions=True)
        self.repository.update_model_test_task(task_id, status="cancelled")
        self._test_tasks.pop(task_id, None)
        self._cancel_events.pop(task_id, None)
        return await self.get_test(task_id)

    async def preview_remove(self, authorization: str, logical_id: str, requested: list[str] | None = None) -> dict[str, Any]:
        logical = self.repository.logical_row(logical_id)
        if logical["state"] != "active":
            raise ConflictError("渠道正在删除，无法修改模型")
        latest = self.repository.latest_model_test_task(logical_id)
        if latest is None:
            raise ConflictError("请先测试模型，再移除不可用模型")
        if self.repository.active_model_test_task(logical_id):
            raise ConflictError("测试尚未结束，请等待完成后重新预览")
        results = self.repository.latest_model_results(logical_id)
        revision = _config_revision(logical)
        unavailable = {model for model, item in results.items() if self._removable(item, revision)}
        current_models = json.loads(logical["models_json"])
        discovery = self.repository.model_discovery(logical_id)
        known_models = list(dict.fromkeys(current_models + [item["id"] for item in (discovery or {}).get("models", [])]))
        selected = set(unavailable if requested is None else requested)
        if requested is not None and not selected.issubset(unavailable & set(known_models)):
            raise ConflictError("候选结果已过期或模型状态已变化，请重新测试并预览")
        removable = [model for model in known_models if model in unavailable and model in selected]
        if not removable:
            raise ConflictError("当前没有有效的移除候选，请重新测试模型")
        return await self._preview_change(authorization, logical, removable, [])

    async def preview_add(self, authorization: str, logical_id: str, requested: list[str] | None) -> dict[str, Any]:
        logical = self.repository.logical_row(logical_id)
        if logical["state"] != "active" or self.repository.active_model_test_task(logical_id):
            raise ConflictError("渠道正在变更或测试，请稍后更新模型")
        discovery = self.repository.model_discovery(logical_id)
        known = {item["id"] for item in (discovery or {}).get("models", [])}
        additions = list(dict.fromkeys(requested or []))
        current = set(json.loads(logical["models_json"]))
        if not additions or not set(additions).issubset(known - current):
            raise ConflictError("新增模型清单已变化，请重新获取并确认")
        return await self._preview_change(authorization, logical, [], additions)

    async def _preview_change(self, authorization: str, logical: dict[str, Any], removable: list[str], additions: list[str]) -> dict[str, Any]:
        logical_id = logical["id"]
        current_models = json.loads(logical["models_json"])
        results = self.repository.latest_model_results(logical_id)
        latest = self.repository.latest_model_test_task(logical_id)
        revision = _config_revision(logical)
        channels = await self.client.list_channels(authorization)
        config = self.repository.channel_config(logical_id)
        if any(change for change in self.repository.unfinished_route_changes()
               if logical_id in json.dumps(change["plan"])):
            raise ConflictError("渠道有未完成路由变更，请先继续执行")
        records: list[dict[str, Any]] = []
        for channel in channels:
            metadata = channel_metadata(channel)
            if not owned(self.repository, channel, logical_id):
                continue
            if metadata.get("kind") != "route":
                continue
            channel = await self.executions.require_owned(authorization, int(channel["id"]), logical_id)
            if not matches_config(channel, config):
                raise ConflictError("执行渠道配置漂移，请先重建分组路由")
            before_models = models_list(channel.get("models", ""))
            after_models = list(dict.fromkeys([model for model in before_models if model not in set(removable)] + additions))
            after_mapping, mapping_changed = _mapping_after(channel.get("model_mapping"), set(removable)) if removable else (channel.get("model_mapping"), False)
            records.append({
                "channel_id": int(channel["id"]),
                "kind": metadata.get("kind"),
                "name": str(channel.get("name", "")),
                "before_models": before_models,
                "after_models": after_models,
                "before_model_mapping": channel.get("model_mapping"),
                "after_model_mapping": after_mapping,
                "mapping_changed": mapping_changed,
                "before_revision": _physical_revision(channel),
                "after_revision": _physical_revision({**channel, "models": ",".join(after_models), "model_mapping": after_mapping}),
            })
        records.sort(key=lambda record: record["channel_id"])
        steps = [
            self._step("update_models", f"更新 {record['name']} 的模型清单", {"record_index": index})
            for index, record in enumerate(records)
        ]
        steps.append(self._step("verify_final", "重新读取并核对所有物理记录", {}))
        logical_after_models = [model for model in current_models if model not in set(removable)] + additions
        logical_mapping, logical_mapping_changed = _mapping_after(logical.get("model_mapping"), set(removable)) if removable else (logical.get("model_mapping"), False)
        plan = {
            "schema": 2,
            "logical_id": logical_id,
            "logical_name": logical["name"],
            "remove_models": removable,
            "add_models": additions,
            "retain_models": logical_after_models,
            "latest_test_id": latest["id"] if latest else None,
            "config_revision": revision,
            "evidence": {model: results[model] for model in removable},
            "physical_records": records,
            "modifies_models": any(record["before_models"] != record["after_models"] for record in records),
            "modifies_model_mapping": logical_mapping_changed or any(record["mapping_changed"] for record in records),
            "logical_after_model_mapping": logical_mapping,
            "failure_reasons": [
                {"model": item["model_id"], "reason": item.get("error") or "模型测试异常"}
                for item in results.values() if item.get("model_id") in removable
            ],
            "expected_steps": len(steps),
            "steps": steps,
        }
        plan["preview_token"] = _digest(plan)
        return plan

    @staticmethod
    def _removable(result: dict[str, Any], revision: str) -> bool:
        return (
            bool(result.get("status"))
            and result["status"] not in {"available", "untested", "pending", "running"}
            and result.get("config_revision") == revision
            and 0 <= time.time() - (result.get("tested_at") or 0) <= MODEL_RESULT_TTL_SECONDS
        )

    async def execute_remove(self, authorization: str, logical_id: str, requested: list[str] | None, actor: dict[str, Any], preview_token: str | None = None, *, adding: bool = False) -> dict[str, Any]:
        async with self._change_lock:
            active = self.repository.active_change(kind="model_remove", target=logical_id) or self.repository.active_change(kind="model_update", target=logical_id)
            if active:
                raise ConflictError("存在未完成的模型移除，请按原变更记录继续执行")
            plan = await (self.preview_add(authorization, logical_id, requested) if adding else self.preview_remove(authorization, logical_id, requested))
            if not preview_token or preview_token != plan["preview_token"]:
                raise ConflictError("移除预览已过期，请重新预览并确认")
            change = self.repository.create_change({
                "id": new_id("chg"),
                "kind": "model_update" if adding else "model_remove",
                "target": logical_id,
                "revision": None,
                "status": "pending",
                "plan": plan,
                "steps": copy.deepcopy(plan["steps"]),
                "actor_id": int(actor["id"]),
                "actor_name": str(actor.get("display_name") or actor.get("username") or actor["id"]),
            })
            return await self._continue_remove(authorization, change["id"])

    async def continue_remove(self, authorization: str, change_id: str) -> dict[str, Any]:
        async with self._change_lock:
            return await self._continue_remove(authorization, change_id)

    async def _continue_remove(self, authorization: str, change_id: str) -> dict[str, Any]:
        change = self.repository.change(change_id)
        if change["kind"] not in {"model_remove", "model_update"}:
            raise ConflictError("only model removal changes can be continued")
        if change["status"] == "success":
            return change
        if change["plan"].get("schema") != 2:
            raise ConflictError("旧模型变更需经迁移核对后重新预览")
        steps = change["steps"]
        self.repository.update_change(change_id, status="running", steps=steps, error=None)
        try:
            plan = change["plan"]
            logical = self.repository.logical_row(plan["logical_id"])
            if logical["state"] != "active" or _config_revision(logical) != plan.get("config_revision"):
                raise ConflictError("渠道配置已变化，未继续移除")
            if self.repository.active_model_test_task(plan["logical_id"]):
                raise ConflictError("测试尚未结束，未继续移除")
            results = self.repository.latest_model_results(plan["logical_id"])
            if any(not self._removable(results.get(model, {}), plan["config_revision"]) for model in plan["remove_models"]):
                raise ConflictError("移除依据已过期或状态变化，请重新测试候选模型")
            # Preflight every record, including previously successful writes, before resuming.
            for record in plan["physical_records"]:
                channel = await self.executions.require_owned(authorization, int(record["channel_id"]), plan["logical_id"])
                if not self._matches_record(channel, record, "before") and not self._matches_record(channel, record, "after"):
                    raise ConflictError("物理渠道配置已变化，未覆盖新配置")
                if not self._matches_record(channel, record, "after"):
                    for step in steps:
                        if step["action"] == "update_models" and plan["physical_records"][int(step["payload"]["record_index"])]["channel_id"] == record["channel_id"]:
                            step["status"] = "pending"
            for step in steps:
                if step["action"] == "verify_final":
                    step["status"] = "pending"
            for index, step in enumerate(steps):
                if step["status"] == "success":
                    continue
                step["status"] = "running"
                step["error"] = None
                self.repository.update_change(change_id, status="running", steps=steps)
                result = await self._run_remove_step(authorization, change, step)
                step["status"] = "success"
                step["result"] = result
                self.repository.update_change(change_id, status="running", steps=steps)
            plan = change["plan"]
            discovery = self.repository.model_discovery(plan["logical_id"])
            if discovery and plan["remove_models"]:
                self.repository.save_model_discovery(plan["logical_id"], source=discovery["source"], status=discovery["status"], models=[item for item in discovery["models"] if item["id"] not in plan["remove_models"]], error=discovery.get("error"))
            # Commit local truth and journal completion together, including after a restart.
            with self.repository.database.transaction() as connection:
                connection.execute("UPDATE logical_channels SET models_json = ?, model_mapping = ?, updated_at = ? WHERE id = ?",
                                   (json.dumps(plan["retain_models"]), plan.get("logical_after_model_mapping"), int(time.time()), plan["logical_id"]))
                connection.execute("UPDATE changes SET status = 'success', steps_json = ?, error = NULL, updated_at = ? WHERE id = ?",
                                   (json.dumps(steps), int(time.time()), change_id))
        except Exception as exc:
            message = str(exc) if isinstance(exc, ConflictError) else _safe_error(exc)
            for step in steps:
                if step["status"] == "running":
                    step["status"] = "failed"
                    step["error"] = message
            self.repository.update_change(change_id, status="partial", steps=steps, error=message)
        return self.repository.change(change_id)

    @staticmethod
    def _matches_record(channel: dict[str, Any], record: dict[str, Any], phase: str) -> bool:
        return _physical_revision(channel) == record.get(f"{phase}_revision")

    async def _run_remove_step(self, authorization: str, change: dict[str, Any], step: dict[str, Any]) -> dict[str, Any]:
        plan = change["plan"]
        if step["action"] == "update_models":
            record = plan["physical_records"][int(step["payload"]["record_index"])]
            channel = await self.executions.require_owned(authorization, int(record["channel_id"]), plan["logical_id"])
            if self._matches_record(channel, record, "after"):
                return {"channel_id": record["channel_id"], "already_applied": True}
            if not self._matches_record(channel, record, "before"):
                raise ConflictError("物理渠道配置已变化，未覆盖新配置")
            payload = {
                "id": record["channel_id"],
                "type": channel.get("type"),
                "name": channel.get("name", record["name"]),
                "base_url": channel.get("base_url"),
                "models": ",".join(record["after_models"]),
                "group": channel.get("group", ""),
                "model_mapping": record.get("after_model_mapping"),
                "priority": channel.get("priority"),
                "weight": channel.get("weight"),
                "auto_ban": channel.get("auto_ban", 1),
                "other": channel.get("other", ""),
                "other_info": channel.get("other_info", ""),
                "tag": channel.get("tag"),
                "setting": channel.get("setting"),
                "settings": channel.get("settings", "{}"),
                "param_override": channel.get("param_override"),
                "header_override": channel.get("header_override"),
                "remark": channel.get("remark") or "",
            }
            await self.client.update_channel(authorization, payload)
            return {"channel_id": record["channel_id"], "models": record["after_models"]}
        if step["action"] == "verify_final":
            channels = {int(channel["id"]): channel for channel in await self.client.list_channels(authorization)}
            actual_ids = {channel_id for channel_id, channel in channels.items() if owned(self.repository, channel, plan["logical_id"]) and (channel_metadata(channel) or {}).get("kind") == "route"}
            if actual_ids != {record["channel_id"] for record in plan["physical_records"]}:
                raise ConflictError("物理记录范围已变化，尚未完成移除")
            for record in plan["physical_records"]:
                channel = channels.get(int(record["channel_id"]))
                if not channel or not self._matches_record(await self.executions.require_owned(authorization, int(record["channel_id"]), plan["logical_id"]), record, "after"):
                    raise NewApiError("a physical channel did not match the removal plan", kind="verification")
            return {"verified": True, "channel_ids": [record["channel_id"] for record in plan["physical_records"]]}
        raise ConflictError(f"unknown model removal step {step['action']}")

    async def _run_test_task(self, authorization: str, task_id: str, cancel_event: asyncio.Event) -> None:
        task = self.repository.model_test_task(task_id)
        if task is None:
            return
        semaphore = asyncio.Semaphore(MODEL_TEST_CONCURRENCY)
        results = task["results"]
        workers: list[asyncio.Task] = []
        probe_id = None

        async def run_one(index: int, model: str) -> tuple[int, dict[str, Any]]:
            async with semaphore:
                if cancel_event.is_set() or self.repository.model_test_task(task_id)["cancel_requested"]:
                    cancel_event.set()
                    return index, results[index]
                outcome = await self._test_one(authorization, probe_id, model)
                outcome["config_revision"] = revision
                return index, outcome

        try:
            if cancel_event.is_set():
                return
            self.repository.update_model_test_task(task_id, status="running")
            logical = self.repository.logical_row(task["logical_id"])
            revision = _config_revision(logical)
            probe_id = await asyncio.wait_for(self.executions.probe(authorization, logical["id"], task_id), timeout=MODEL_TEST_TIMEOUT_SECONDS)
            workers = [asyncio.create_task(run_one(index, model)) for index, model in enumerate(task["models"])]
            completed = 0
            for future in asyncio.as_completed(workers):
                index, result = await future
                if cancel_event.is_set():
                    continue
                results[index] = result
                completed += 1
                available = sum(item.get("status") == "available" for item in results)
                failed = sum(item.get("status") not in {"available", "untested"} for item in results)
                self.repository.update_model_test_task(task_id, results=results, completed=completed, available_count=available, failed_count=failed)
            if cancel_event.is_set():
                status = "cancelled"
            else:
                status = "success" if all(item.get("status") == "available" for item in results) else "partial"
            available = sum(item.get("status") == "available" for item in results)
            failed = sum(item.get("status") not in {"available", "untested"} for item in results)
            self.repository.update_model_test_task(task_id, status=status, results=results, completed=sum(item.get("status") != "untested" for item in results), available_count=available, failed_count=failed)
        except asyncio.CancelledError:
            cancelled = cancel_event.is_set() or self.repository.model_test_task(task_id)["cancel_requested"]
            for item in results:
                if item.get("status") == "untested":
                    item["error"] = "测试已取消，模型尚未完成测试" if cancelled else "管理员服务停止，模型尚未完成测试"
            self.repository.update_model_test_task(task_id, status="cancelled" if cancelled else "partial", results=results)
            raise
        except Exception:
            for item in results:
                if item.get("status") == "untested":
                    item.update(error="模型测试异常，模型尚未完成测试，请重试")
            self.repository.update_model_test_task(
                task_id, status="partial", results=results, completed=sum(item.get("status") != "untested" for item in results),
                available_count=sum(item.get("status") == "available" for item in results),
                failed_count=sum(item.get("status") not in {"available", "untested"} for item in results),
            )
        finally:
            for worker in workers:
                if not worker.done():
                    worker.cancel()
            await asyncio.gather(*workers, return_exceptions=True)
            if probe_id is not None:
                try:
                    await self.executions.delete(authorization, probe_id, task["logical_id"])
                except Exception:
                    # A disabled probe remains visible to monitoring for explicit cleanup.
                    pass
            self._test_tasks.pop(task_id, None)
            self._cancel_events.pop(task_id, None)

    async def _test_one(self, authorization: str, channel_id: int, model: str) -> dict[str, Any]:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                started = asyncio.get_running_loop().time()
                payload = await asyncio.wait_for(
                    self.client.test_channel_model(authorization, channel_id, model),
                    timeout=MODEL_TEST_TIMEOUT_SECONDS,
                )
                latency_ms = max(0, int((asyncio.get_running_loop().time() - started) * 1000))
                if isinstance(payload, dict) and payload.get("success") is True:
                    raw_time = payload.get("time")
                    if isinstance(raw_time, (int, float)):
                        latency_ms = max(0, int(float(raw_time) * 1000))
                    return {"model_id": model, "name": model, "status": "available", "latency_ms": latency_ms, "error": None, "tested_at": int(time.time()), "attempts": attempt + 1}
                status, error = _test_status_from_failure(payload=payload)
                return {"model_id": model, "name": model, "status": status, "latency_ms": latency_ms, "error": error, "tested_at": int(time.time()), "attempts": attempt + 1}
            except (asyncio.TimeoutError, NewApiError) as exc:
                last_error = exc
                retryable = isinstance(exc, asyncio.TimeoutError) or (isinstance(exc, NewApiError) and exc.kind in {"timeout", "network"})
                if retryable and attempt == 0:
                    await asyncio.sleep(0.05)
                    continue
                status, error = _test_status_from_failure(exc)
                return {"model_id": model, "name": model, "status": status, "latency_ms": None, "error": error, "tested_at": int(time.time()), "attempts": attempt + 1}
            except Exception as exc:
                last_error = exc
                break
        status, error = _test_status_from_failure(last_error)
        return {"model_id": model, "name": model, "status": status, "latency_ms": None, "error": error, "tested_at": int(time.time()), "attempts": 2}

    @staticmethod
    def _step(action: str, label: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"action": action, "label": label, "payload": payload, "status": "pending", "result": None, "error": None}

    @staticmethod
    def _public_discovery(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "logical_id": row["logical_id"],
            "fetched_at": row["fetched_at"],
            "source": row["source"],
            "status": row["status"],
            "models": row["models"],
            "error": row.get("error"),
        }

    @staticmethod
    def _public_task(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "logical_id": row["logical_id"],
            "status": row["status"],
            "total": row["total"],
            "completed": row["completed"],
            "progress": round((row["completed"] / row["total"]) * 100) if row["total"] else 100,
            "available_count": row["available_count"],
            "failed_count": row["failed_count"],
            "cancel_requested": row["cancel_requested"],
            "results": row["results"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
