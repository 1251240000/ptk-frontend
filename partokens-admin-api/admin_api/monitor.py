from __future__ import annotations

import asyncio
import logging
from typing import Any

from .config import Settings
from .domain import channel_metadata, channel_status_reason, models_list, now
from .new_api import NewApiClient, NewApiError
from .repository import Repository
from .execution import owned, matches_config


logger = logging.getLogger(__name__)


class Monitor:
    def __init__(self, settings: Settings, repository: Repository, client: NewApiClient):
        self.settings = settings
        self.repository = repository
        self.client = client
        self._stop = asyncio.Event()
        self._task: asyncio.Task[None] | None = None
        self._last_log_refresh = 0

    def start(self) -> None:
        if self.settings.service_token and self._task is None:
            self._task = asyncio.create_task(self.run(), name="partokens-admin-monitor")

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            await self._task
            self._task = None

    async def run(self) -> None:
        while not self._stop.is_set():
            try:
                include_logs = now() - self._last_log_refresh >= self.settings.log_interval_seconds
                await self.refresh(self.service_authorization(), include_logs=include_logs)
            except Exception:
                logger.error("administrator monitoring refresh failed")
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=self.settings.monitor_interval_seconds)
            except TimeoutError:
                continue

    def service_authorization(self) -> str:
        token = self.settings.service_token or ""
        return token if token.lower().startswith("bearer ") else f"Bearer {token}"

    async def refresh(self, authorization: str, *, include_logs: bool = True) -> dict[str, Any]:
        observed_at = now()
        try:
            channels = await self.client.list_channels(authorization)
            channels = [await self.client.get_channel(authorization, int(item["id"]))
                        if owned(self.repository, item) and (channel_metadata(item) or {}).get("kind") == "route" else item
                        for item in channels]
            records = self._physical_records(channels, observed_at)
            self.repository.replace_physical(records, observed_at)
            previous = self.repository.database.latest_snapshot()
            metrics = await self._log_metrics(authorization, records, observed_at) if include_logs else (
                (previous or {}).get("details", {}).get("channel_metrics", {})
            )
            if include_logs:
                self._last_log_refresh = observed_at
            summary, details = self._summary(channels, records, metrics, observed_at)
            self.repository.save_snapshot("healthy", summary, details)
            self.repository.database.prune_snapshots(self.settings.snapshot_retention)
            return {"status": "healthy", "observed_at": observed_at, "summary": summary, "details": details}
        except NewApiError as exc:
            summary = {"observed_at": observed_at, "monitoring_available": False}
            self.repository.save_snapshot("unavailable", summary, {}, "new-api monitoring unavailable")
            raise

    def _physical_records(self, channels: list[dict[str, Any]], observed_at: int) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        for channel in channels:
            metadata = channel_metadata(channel) if owned(self.repository, channel) else None
            records.append({
                "channel_id": int(channel["id"]),
                "logical_id": metadata.get("logical_id") if metadata else None,
                "kind": metadata.get("kind", "nonstandard") if metadata else "nonstandard",
                "group_name": metadata.get("group") if metadata else None,
                "attempt": metadata.get("attempt") if metadata else None,
                "route_revision": metadata.get("route_revision") if metadata else None,
                "status": int(channel.get("status", 0)),
                "name": str(channel.get("name", "")),
                "models": str(channel.get("models", "")),
                "priority": channel.get("priority"),
                "weight": channel.get("weight"),
                "test_time": int(channel.get("test_time", 0)),
                "response_time": int(channel.get("response_time", 0)),
                "status_reason": "执行记录被自动禁用" if int(channel.get("status", 0)) == 3 else None,
                "drift": self._drift(channel, metadata),
                "observed_at": observed_at,
            })
        return records

    def _drift(self, channel: dict[str, Any], metadata: dict[str, Any] | None) -> bool:
        if not metadata or metadata.get("kind") != "route":
            return False
        attempt = int(metadata.get("attempt", -1))
        expected_priority = metadata.get("priority", 1000 - attempt * 100)
        logical = self.repository.logical_row(metadata["logical_id"])
        route = self.repository.route(metadata.get("group"))
        expected = next(((index, layer, member) for index, layer in enumerate((route or {}).get("config", {}).get("layers", []))
                         for member in layer["members"] if member["logical_id"] == logical["id"]), None)
        if not expected or metadata.get("route_revision") != route["revision"]:
            return True
        index, layer, member = expected
        try:
            config = self.repository.channel_config(logical["id"])
        except Exception:
            return True
        return (
            not matches_config(channel, config)
            or metadata.get("config_version") != logical["config_version"]
            or attempt != index
            or int(channel.get("priority") or 0) != (layer.get("priority") if layer.get("priority") is not None else 1000 - index * 100)
            or int(channel.get("weight") or 0) != member["weight"]
            or (not logical["enabled"] and int(channel.get("status", 0)) == 1)
            or channel.get("group") != metadata.get("group")
            or int(channel.get("priority") or 0) != expected_priority
            or int(channel.get("weight") or 0) != int(metadata.get("weight") or 0)
        )

    async def _log_metrics(self, authorization: str, records: list[dict[str, Any]], observed_at: int) -> dict[str, Any]:
        start = observed_at - 24 * 60 * 60
        route_records = [record for record in records if record["kind"] == "route"]
        metrics: dict[str, Any] = {}
        semaphore = asyncio.Semaphore(4)

        async def count(record: dict[str, Any]) -> None:
            channel_id = int(record["channel_id"])
            async with semaphore:
                consume, errors = await asyncio.gather(
                    self.client.log_count(authorization, channel_id, 2, start, observed_at),
                    self.client.log_count(authorization, channel_id, 5, start, observed_at),
                )
            attempts = consume + errors
            metrics[str(channel_id)] = {
                "attempts": attempts,
                "successes": consume,
                "errors": errors,
                "success_rate": round(consume / attempts * 100, 2) if attempts else None,
            }

        await asyncio.gather(*(count(record) for record in route_records))
        return metrics

    def _summary(
        self,
        channels: list[dict[str, Any]],
        records: list[dict[str, Any]],
        metrics: dict[str, Any],
        observed_at: int,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        logical_rows = self.repository.logical_rows()
        known_ids = {row["id"] for row in logical_rows}
        route_records = [record for record in records if record["kind"] == "route"]
        issues: list[dict[str, Any]] = []
        for logical in logical_rows:
            if not logical.get("config_ciphertext"):
                issues.append({"kind": "credential_missing", "logical_id": logical["id"], "message": "请重新录入渠道凭据"})
        for route in self.repository.routes():
            for layer in route["config"]["layers"]:
                for member in layer["members"]:
                    matching = [record for record in route_records if record["logical_id"] == member["logical_id"]
                                and record["group_name"] == route["group_name"] and record["route_revision"] == route["revision"]]
                    if len(matching) != 1:
                        issues.append({"kind": "missing" if not matching else "duplicate", "logical_id": member["logical_id"], "message": "执行记录缺失或重复，请重新保存分组路由"})
        for record in records:
            if record["kind"] == "probe" and not self.repository.active_model_test_task(record["logical_id"]):
                issues.append({"kind": "probe_cleanup", "channel_id": record["channel_id"], "message": "测试执行记录待清理"})
            if record["kind"] == "nonstandard" and record.get("status") == 1:
                issues.append({"kind": "nonstandard", "channel_id": record["channel_id"], "message": "非标准物理渠道仍处于启用状态"})
            elif record.get("logical_id") and record["logical_id"] not in known_ids:
                issues.append({"kind": "orphan", "channel_id": record["channel_id"], "message": "物理记录引用了不存在的逻辑渠道"})
            if record.get("drift"):
                issues.append({"kind": "drift", "channel_id": record["channel_id"], "message": "底层路由字段与修订元数据不一致"})
            if record.get("status") == 3:
                issues.append({"kind": "auto_disabled", "channel_id": record["channel_id"], "message": record.get("status_reason") or "执行记录被自动禁用"})
        attempts = sum(int(metric["attempts"]) for metric in metrics.values())
        successes = sum(int(metric["successes"]) for metric in metrics.values())
        summary = {
            "observed_at": observed_at,
            "monitoring_available": True,
            "logical_channels": len(logical_rows),
            "route_records": len(route_records),
            "enabled_route_records": sum(1 for record in route_records if record["status"] == 1),
            "auto_disabled_records": sum(1 for record in route_records if record["status"] == 3),
            "nonstandard_records": sum(1 for record in records if record["kind"] == "nonstandard"),
            "issue_count": len(issues),
            "attempts_24h": attempts,
            "success_rate_24h": round(successes / attempts * 100, 2) if attempts else None,
        }
        details = {"issues": issues, "channel_metrics": metrics, "physical_records": records}
        return summary, details
