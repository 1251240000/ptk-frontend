"""Non-destructive inspection and explicit conversion of legacy change journals."""
from __future__ import annotations

import json

from .domain import channel_metadata, now
from .execution import owned
from .repository import ConflictError
from .schemas import RoutePlanInput


async def audit(repository, client, token: str) -> dict:
    channels = await client.list_channels(token)
    by_id = {int(item["id"]): item for item in channels}
    return {
        "schema_version": 4,
        "channels": [{"id": row["id"], "name": row["name"],
                      "credential_status": "ready" if row.get("config_ciphertext") else "missing",
                      "legacy_template_id": row.get("template_channel_id"),
                      "legacy_template_present": row.get("template_channel_id") in by_id}
                     for row in repository.logical_rows()],
        "unfinished_changes": [{"id": change["id"], "kind": change["kind"], "target": change["target"],
                                "legacy": change["plan"].get("schema") != 2,
                                "completed_steps": sum(step["status"] == "success" for step in change["steps"])}
                               for change in repository.changes(10000) if change["status"] not in {"success", "cancelled"}],
        "creations": repository.database.fetch_all("SELECT * FROM execution_creations WHERE state != 'pending'"),
        "legacy_templates": [int(item["id"]) for item in channels if owned(repository, item) and channel_metadata(item).get("kind") == "template"],
        "unmanaged_channel_ids": [int(item["id"]) for item in channels if not owned(repository, item)],
    }


async def migrate_route(service, token: str, change_id: str) -> dict:
    async with service.routes._execution_lock:
        repository = service.repository
        change = repository.change(change_id)
        if change["status"] in {"success", "cancelled"} or change["plan"].get("schema") == 2:
            raise ConflictError("该变更不需要旧路由迁移")
        if change["kind"] in {"model_remove", "model_update"}:
            logical_id = change["plan"]["logical_id"]
            repository.channel_config(logical_id)
            if repository.active_model_test_task(logical_id):
                raise ConflictError("测试正在执行，请稍后迁移")
            # Preserve the original intended models locally; routes are rebuilt in a new revision.
            with repository.database.transaction() as connection:
                connection.execute("INSERT INTO change_migrations VALUES (?, ?, ?, ?)",
                                   (change_id, json.dumps(change["plan"]), json.dumps(change["steps"]), now()))
                connection.execute("UPDATE logical_channels SET models_json = ?, model_mapping = ?, config_version = config_version + 1, updated_at = ? WHERE id = ?",
                                   (json.dumps(change["plan"]["retain_models"]), change["plan"].get("logical_after_model_mapping"), now(), logical_id))
                connection.execute("UPDATE changes SET status = 'cancelled', error = ?, updated_at = ? WHERE id = ?",
                                   ("旧变更已迁移为本地模型配置，请重建关联分组路由", now(), change_id))
            return repository.change(change_id)
        if change["kind"] != "route_revision":
            raise ConflictError("不支持该旧变更类型")
        existing = {int(item["id"]): item for item in await service.client.list_channels(token)}
        prepared = []
        for step in change["steps"]:
            channel_id = (step.get("result") or {}).get("channel_id")
            if not channel_id or channel_id not in existing:
                continue
            channel = existing[channel_id]
            metadata = channel_metadata(channel) or {}
            if not owned(repository, channel):
                raise ConflictError("旧变更创建记录的归属已变化，请先核对")
            if metadata.get("kind") == "route" and channel.get("group") == change["target"]:
                prepared.append(channel_id)
            elif metadata.get("kind") == "template" and int(channel.get("status", 0)) == 2:
                continue
            else:
                raise ConflictError("旧变更创建记录的用途已变化，请先核对")
        route = RoutePlanInput.model_validate(change["plan"]["route"])
        route.preview_token = None
        current = repository.route(change["target"])
        route.expected_revision = current["revision"] if current else 0
        plan = await service.routes.preview(token, change["target"], route, migrating=change_id)
        plan["old_channel_ids"] = sorted(set(plan["old_channel_ids"] + prepared))
        with repository.database.transaction() as connection:
            connection.execute("INSERT INTO change_migrations VALUES (?, ?, ?, ?)",
                               (change_id, json.dumps(change["plan"]), json.dumps(change["steps"]), now()))
            connection.execute("UPDATE changes SET revision = ?, plan_json = ?, steps_json = ?, status = 'pending', error = NULL, updated_at = ? WHERE id = ?",
                               (plan["revision"], json.dumps(plan), json.dumps(plan["steps"]), now(), change_id))
        return repository.change(change_id)
