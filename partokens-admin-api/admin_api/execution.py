from __future__ import annotations

import json
from typing import Any

from .domain import LOGICAL_TAG_PREFIX, channel_metadata, credential_fingerprint, merged_other_info
from .new_api import NewApiError
from .repository import ConflictError, Repository


def owned(repository: Repository, channel: dict[str, Any], logical_id: str | None = None) -> bool:
    metadata = channel_metadata(channel)
    if not metadata or (logical_id is not None and metadata["logical_id"] != logical_id):
        return False
    owner = metadata["logical_id"]
    if not repository.database.fetch_one("SELECT id FROM logical_channels WHERE id = ?", (owner,)):
        return False
    if channel.get("tag") != f"{LOGICAL_TAG_PREFIX}{owner}":
        return False
    creation_id = metadata.get("creation_id")
    if creation_id:
        creation = repository.database.fetch_one("SELECT * FROM execution_creations WHERE creation_id = ?", (creation_id,))
        return bool(creation and creation["logical_id"] == owner and creation["channel_id"] in {None, int(channel["id"])})
    # Legacy records require both the explicit owner metadata and logical tag.
    return metadata.get("kind") in {"route", "archive", "template"}


def normalized_field(value: Any) -> Any:
    if value in (None, ""):
        return None
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError:
            pass
    return value


def matches_config(channel: dict[str, Any], config: dict[str, Any], *, credential: bool = True) -> bool:
    defaults = dict.fromkeys(("openai_organization", "test_model", "status_code_mapping", "setting", "param_override", "header_override"))
    for key, expected in {**defaults, **config}.items():
        if key in {"key", "status", "other_info"}:
            continue
        if normalized_field(channel.get(key)) != normalized_field(expected):
            return False
    return not credential or channel.get("credential_fingerprint") == credential_fingerprint(config["key"])


class ExecutionChannels:
    def __init__(self, repository: Repository, client):
        self.repository = repository
        self.client = client

    async def require_owned(self, token: str, channel_id: int, logical_id: str | None = None) -> dict[str, Any]:
        channel = await self.client.get_channel(token, channel_id)
        if not owned(self.repository, channel, logical_id):
            raise ConflictError("执行渠道归属已变化，操作已停止")
        return channel

    async def ensure(self, token: str, creation_id: str, logical_id: str, payload: dict[str, Any]) -> int:
        db = self.repository.database
        db.execute("INSERT OR IGNORE INTO execution_creations(creation_id, logical_id) VALUES (?, ?)", (creation_id, logical_id))
        creation = db.fetch_one("SELECT * FROM execution_creations WHERE creation_id = ?", (creation_id,))
        matches = [item for item in await self.client.list_channels(token)
                   if (channel_metadata(item) or {}).get("creation_id") == creation_id]
        if len(matches) > 1:
            raise ConflictError("发现重复执行渠道，需核对后继续")
        if matches:
            channel_id = int(matches[0]["id"])
            if not owned(self.repository, matches[0], logical_id):
                raise ConflictError("执行渠道创建标识归属不一致")
        else:
            if creation["state"] != "pending":
                raise ConflictError("执行渠道创建结果待核对；未发现记录，禁止重复提交，请运行迁移审计")
            # Commit intent before the request: an ambiguous timeout must never issue another POST.
            db.execute("UPDATE execution_creations SET state = 'submitted' WHERE creation_id = ?", (creation_id,))
            try:
                await self.client.add_channel(token, payload)
            except NewApiError as exc:
                if exc.kind in {"unauthorized", "business_error"}:
                    db.execute("UPDATE execution_creations SET state = 'pending' WHERE creation_id = ?", (creation_id,))
                raise
            matches = [item for item in await self.client.list_channels(token)
                       if (channel_metadata(item) or {}).get("creation_id") == creation_id]
            if len(matches) != 1 or not owned(self.repository, matches[0], logical_id):
                raise ConflictError("执行渠道创建结果待核对，禁止重复提交")
            channel_id = int(matches[0]["id"])
        db.execute("UPDATE execution_creations SET channel_id = ?, state = 'created' WHERE creation_id = ?", (channel_id, creation_id))
        return channel_id

    def payload(self, logical_id: str, creation_id: str, metadata: dict[str, Any], **fields: Any) -> dict[str, Any]:
        logical = self.repository.logical_row(logical_id)
        return {**self.repository.channel_config(logical_id), **fields, "status": 2,
                "tag": f"{LOGICAL_TAG_PREFIX}{logical_id}",
                "other_info": merged_other_info({}, {"schema": 1, "logical_id": logical_id,
                    "creation_id": creation_id, "config_version": logical["config_version"], **metadata})}

    async def probe(self, token: str, logical_id: str, task_id: str) -> int:
        payload = self.payload(logical_id, task_id, {"kind": "probe"},
                               name=f"probe {task_id}", group="__partokens_probe__", priority=0, weight=0)
        channel_id = await self.ensure(token, task_id, logical_id, payload)
        channel = await self.require_owned(token, channel_id, logical_id)
        if int(channel.get("status", 0)) != 2 or not matches_config(channel, payload):
            raise ConflictError("测试执行渠道校验失败，请检查 new-api 版本及配置")
        return channel_id

    async def delete(self, token: str, channel_id: int, logical_id: str) -> None:
        await self.require_owned(token, channel_id, logical_id)
        await self.client.delete_channel(token, channel_id)
