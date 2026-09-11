from __future__ import annotations

import json
import sqlite3
import fcntl
from contextlib import contextmanager
from typing import Any

from .database import Database
from .domain import cost_ratio_to_millis, now, public_logical_channel


class ConflictError(RuntimeError):
    pass


class NotFoundError(RuntimeError):
    pass


class Repository:
    def __init__(self, database: Database, vault=None):
        self.database = database
        self.vault = vault

    def channel_config(self, logical_id: str) -> dict[str, Any]:
        if self.vault is None:
            raise ConflictError("未配置渠道加密主密钥")
        row = self.logical_row(logical_id)
        config = self.vault.decrypt(logical_id, row.get("config_ciphertext"))
        return {**config, "type": row["channel_type"], "base_url": row["base_url"],
                "models": ",".join(json.loads(row["models_json"])), "model_mapping": row["model_mapping"]}

    def logical_rows(self) -> list[dict[str, Any]]:
        return self.database.fetch_all("SELECT * FROM logical_channels ORDER BY created_at, id")

    def logical_row(self, logical_id: str) -> dict[str, Any]:
        row = self.database.fetch_one("SELECT * FROM logical_channels WHERE id = ?", (logical_id,))
        if row is None:
            raise NotFoundError(f"logical channel {logical_id} was not found")
        return row

    def physical_rows(self) -> list[dict[str, Any]]:
        return self.database.fetch_all("SELECT * FROM physical_records ORDER BY channel_id")

    def public_channels(self) -> list[dict[str, Any]]:
        physical = self.physical_rows()
        channels = []
        for row in self.logical_rows():
            channel = public_logical_channel(row, physical)
            discovery = self.model_discovery(row["id"])
            task = self.latest_model_test_task(row["id"])
            channel["model_discovery"] = discovery
            channel["latest_model_test"] = self._public_model_test_summary(task) if task else None
            results: dict[str, dict[str, Any]] = {}
            for history in self.database.fetch_all(
                "SELECT results_json FROM model_test_tasks WHERE logical_id = ? ORDER BY created_at DESC, rowid DESC", (row["id"],)
            ):
                for result in json.loads(history["results_json"]):
                    if result.get("tested_at") is not None and result.get("status") != "untested":
                        results.setdefault(result["model_id"], result)
            channel["latest_model_results"] = list(results.values())
            channels.append(channel)
        return channels

    @staticmethod
    def _public_model_test_summary(task: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": task["id"],
            "status": task["status"],
            "total": task["total"],
            "completed": task["completed"],
            "available_count": task["available_count"],
            "failed_count": task["failed_count"],
            "updated_at": task["updated_at"],
            "results": task["results"],
        }

    def create_logical(self, record: dict[str, Any]) -> dict[str, Any]:
        timestamp = now()
        try:
            self.database.execute(
                """INSERT INTO logical_channels(
                  id, name, channel_type, base_url, identity_hash, credential_fingerprint, masked_key,
                  cost_ratio_millis, models_json, model_mapping, note, template_channel_id,
                  config_ciphertext, enabled, state, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, ?)""",
                (
                    record["id"], record["name"], record["channel_type"], record["base_url"],
                    record["identity_hash"], record["credential_fingerprint"],
                    record.get("masked_key"),
                    record.get("cost_ratio_millis", cost_ratio_to_millis(record.get("cost_ratio"))),
                    json.dumps(record["models"], separators=(",", ":")), record.get("model_mapping"),
                    record.get("note", ""), record.get("template_channel_id"), record.get("config_ciphertext"), timestamp, timestamp,
                ),
            )
        except sqlite3.IntegrityError as exc:
            raise ConflictError("the logical channel identity already exists") from None
        return self.logical_row(record["id"])

    def update_logical(self, logical_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        allowed = {"name", "cost_ratio_millis", "note", "enabled", "state", "config_ciphertext", "config_version", "channel_type", "base_url", "identity_hash", "credential_fingerprint", "masked_key", "model_mapping"}
        values = {key: value for key, value in changes.items() if key in allowed}
        if not values:
            return self.logical_row(logical_id)
        values["updated_at"] = now()
        assignments = ", ".join(f"{key} = ?" for key in values)
        params = [*values.values(), logical_id]
        if self.database.execute(f"UPDATE logical_channels SET {assignments} WHERE id = ?", params) != 1:
            raise NotFoundError(f"logical channel {logical_id} was not found")
        return self.logical_row(logical_id)

    def replace_physical(self, records: list[dict[str, Any]], observed_at: int) -> None:
        with self.database.transaction() as connection:
            connection.execute("DELETE FROM physical_records")
            for record in records:
                connection.execute(
                    """INSERT INTO physical_records(
                      channel_id, logical_id, kind, group_name, attempt, route_revision, status,
                      name, models, priority, weight, test_time, response_time, status_reason, drift, observed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        record["channel_id"], record.get("logical_id"), record["kind"], record.get("group_name"),
                        record.get("attempt"), record.get("route_revision"), record["status"], record["name"],
                        record["models"], record.get("priority"), record.get("weight"), record.get("test_time", 0),
                        record.get("response_time", 0), record.get("status_reason"), int(bool(record.get("drift"))), observed_at,
                    ),
                )

    def routes(self) -> list[dict[str, Any]]:
        rows = self.database.fetch_all("SELECT * FROM route_configs ORDER BY group_name")
        for row in rows:
            row["config"] = json.loads(row.pop("config_json"))
        return rows

    def route(self, group: str) -> dict[str, Any] | None:
        row = self.database.fetch_one("SELECT * FROM route_configs WHERE group_name = ?", (group,))
        if row:
            row["config"] = json.loads(row.pop("config_json"))
        return row

    def save_route(self, group: str, revision: int, config: dict[str, Any], actor: str) -> None:
        self.database.execute(
            """INSERT INTO route_configs(group_name, revision, config_json, updated_at, updated_by)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(group_name) DO UPDATE SET revision=excluded.revision,
               config_json=excluded.config_json, updated_at=excluded.updated_at, updated_by=excluded.updated_by""",
            (group, revision, json.dumps(config, separators=(",", ":")), now(), actor),
        )

    def create_change(self, change: dict[str, Any]) -> dict[str, Any]:
        timestamp = now()
        self.database.execute(
            """INSERT INTO changes(id, kind, target, revision, status, plan_json, steps_json,
               actor_id, actor_name, error, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)""",
            (
                change["id"], change["kind"], change["target"], change.get("revision"), change["status"],
                json.dumps(change["plan"], separators=(",", ":")),
                json.dumps(change["steps"], separators=(",", ":")),
                change["actor_id"], change["actor_name"], timestamp, timestamp,
            ),
        )
        return self.change(change["id"])

    def change(self, change_id: str) -> dict[str, Any]:
        row = self.database.fetch_one("SELECT * FROM changes WHERE id = ?", (change_id,))
        if row is None:
            raise NotFoundError(f"change {change_id} was not found")
        row["plan"] = json.loads(row.pop("plan_json"))
        row["steps"] = json.loads(row.pop("steps_json"))
        return row

    def changes(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = self.database.fetch_all("SELECT * FROM changes ORDER BY created_at DESC LIMIT ?", (limit,))
        for row in rows:
            row["plan"] = json.loads(row.pop("plan_json"))
            row["steps"] = json.loads(row.pop("steps_json"))
        return rows

    def unfinished_route_changes(self) -> list[dict[str, Any]]:
        rows = self.database.fetch_all("SELECT id FROM changes WHERE kind = 'route_revision' AND status NOT IN ('success', 'cancelled') ORDER BY created_at DESC")
        return [self.change(row["id"]) for row in rows]

    def update_change(self, change_id: str, *, status: str, steps: list[dict[str, Any]], error: str | None = None) -> None:
        self.database.execute(
            "UPDATE changes SET status = ?, steps_json = ?, error = ?, updated_at = ? WHERE id = ?",
            (status, json.dumps(steps, separators=(",", ":")), error, now(), change_id),
        )

    def save_model_discovery(self, logical_id: str, *, source: str, status: str, models: list[dict[str, Any]], error: str | None = None) -> dict[str, Any]:
        fetched_at = now()
        self.database.execute(
            """INSERT INTO model_discoveries(logical_id, fetched_at, source, status, models_json, error)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(logical_id) DO UPDATE SET fetched_at=excluded.fetched_at,
               source=excluded.source, status=excluded.status, models_json=excluded.models_json, error=excluded.error""",
            (logical_id, fetched_at, source, status, json.dumps(models, separators=(",", ":")), error),
        )
        return self.model_discovery(logical_id) or {}

    def model_discovery(self, logical_id: str) -> dict[str, Any] | None:
        row = self.database.fetch_one("SELECT * FROM model_discoveries WHERE logical_id = ?", (logical_id,))
        if row is None:
            return None
        row["models"] = json.loads(row.pop("models_json"))
        return row

    def create_model_test_task(self, task: dict[str, Any]) -> dict[str, Any]:
        timestamp = now()
        try:
            self.database.execute(
                """INSERT INTO model_test_tasks(
                  id, logical_id, status, models_json, results_json, total, completed,
                  available_count, failed_count, cancel_requested, actor_id, actor_name, created_at, updated_at
                ) VALUES (?, ?, 'pending', ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?)""",
                (
                    task["id"], task["logical_id"], json.dumps(task["models"], separators=(",", ":")),
                    json.dumps(task["results"], separators=(",", ":")), len(task["models"]),
                    int(task["actor_id"]), str(task["actor_name"]), timestamp, timestamp,
                ),
            )
        except sqlite3.IntegrityError as exc:
            raise ConflictError("a model test is already running for this logical channel") from exc
        return self.model_test_task(task["id"])  # type: ignore[return-value]

    def model_test_task(self, task_id: str) -> dict[str, Any] | None:
        row = self.database.fetch_one("SELECT * FROM model_test_tasks WHERE id = ?", (task_id,))
        if row is None:
            return None
        row["models"] = json.loads(row.pop("models_json"))
        row["results"] = json.loads(row.pop("results_json"))
        row["cancel_requested"] = bool(row["cancel_requested"])
        return row

    def update_model_test_task(self, task_id: str, *, status: str | None = None, results: list[dict[str, Any]] | None = None, completed: int | None = None, available_count: int | None = None, failed_count: int | None = None) -> None:
        values: dict[str, Any] = {"updated_at": now()}
        if status is not None:
            values["status"] = status
        if results is not None:
            values["results_json"] = json.dumps(results, separators=(",", ":"))
        if completed is not None:
            values["completed"] = completed
        if available_count is not None:
            values["available_count"] = available_count
        if failed_count is not None:
            values["failed_count"] = failed_count
        assignments = ", ".join(f"{key} = ?" for key in values)
        self.database.execute(f"UPDATE model_test_tasks SET {assignments} WHERE id = ?", [*values.values(), task_id])

    def request_model_test_cancel(self, task_id: str) -> bool:
        return self.database.execute(
            "UPDATE model_test_tasks SET cancel_requested = 1, updated_at = ? WHERE id = ? AND status IN ('pending', 'running')",
            (now(), task_id),
        ) == 1

    def latest_model_test_task(self, logical_id: str) -> dict[str, Any] | None:
        row = self.database.fetch_one("SELECT id FROM model_test_tasks WHERE logical_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1", (logical_id,))
        return self.model_test_task(row["id"]) if row else None

    def latest_model_results(self, logical_id: str) -> dict[str, dict[str, Any]]:
        results: dict[str, dict[str, Any]] = {}
        for task in self.database.fetch_all(
            "SELECT id, results_json FROM model_test_tasks WHERE logical_id = ? ORDER BY created_at DESC, rowid DESC", (logical_id,)
        ):
            for result in json.loads(task["results_json"]):
                # A newer pending/cancelled test supersedes old removal evidence too.
                results.setdefault(result["model_id"], {**result, "test_id": task["id"]})
        return results

    def active_model_test_task(self, logical_id: str) -> dict[str, Any] | None:
        row = self.database.fetch_one("SELECT id FROM model_test_tasks WHERE logical_id = ? AND status IN ('pending', 'running') LIMIT 1", (logical_id,))
        return self.model_test_task(row["id"]) if row else None

    @contextmanager
    def model_test_runtime(self):
        # Hold the OS lock for the entire worker lifetime, including shutdown.
        # A crashed process releases it automatically; imports never acquire it.
        path = self.database.path.resolve().with_suffix(".runtime.lock")
        with path.open("a") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise RuntimeError("Another administrator API owns this database") from exc
            try:
                self._recover_model_test_tasks()
                for change in self.unfinished_route_changes():
                    if change["status"] not in {"pending", "running"}:
                        continue
                    steps = change["steps"]
                    for step in steps:
                        if step["status"] == "running":
                            step["status"] = "failed"
                            step["error"] = "管理员服务重启，此步骤未完成核对"
                    self.update_change(change["id"], status="partial", steps=steps, error="管理员服务重启，请核对并继续执行")
                yield
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)

    def recover_model_test_tasks(self) -> None:
        with self.model_test_runtime():
            pass

    def _recover_model_test_tasks(self) -> None:
        rows = self.database.fetch_all("SELECT id, results_json, cancel_requested FROM model_test_tasks WHERE status IN ('pending', 'running')")
        for row in rows:
            results = json.loads(row["results_json"])
            for item in results:
                if item.get("status") == "untested":
                    item["error"] = "测试已取消，模型尚未完成测试" if row["cancel_requested"] else "管理员服务重启，模型尚未完成测试"
            completed = sum(item.get("status") != "untested" for item in results)
            available = sum(item.get("status") == "available" for item in results)
            failed = sum(item.get("status") not in {"available", "untested"} for item in results)
            self.update_model_test_task(
                row["id"],
                status="cancelled" if row["cancel_requested"] else "partial",
                results=results,
                completed=completed,
                available_count=available,
                failed_count=failed,
            )

    def active_change(self, *, kind: str, target: str) -> dict[str, Any] | None:
        row = self.database.fetch_one(
            "SELECT id FROM changes WHERE kind = ? AND target = ? AND status IN ('pending', 'running', 'partial') ORDER BY created_at DESC LIMIT 1",
            (kind, target),
        )
        return self.change(row["id"]) if row else None

    def update_logical_models(self, logical_id: str, models: list[str], model_mapping: str | None) -> dict[str, Any]:
        if self.database.execute(
            "UPDATE logical_channels SET models_json = ?, model_mapping = ?, updated_at = ? WHERE id = ?",
            (json.dumps(models, separators=(",", ":")), model_mapping, now(), logical_id),
        ) != 1:
            raise NotFoundError(f"logical channel {logical_id} was not found")
        return self.logical_row(logical_id)

    def save_snapshot(self, status: str, summary: dict[str, Any], details: dict[str, Any], error: str | None = None) -> None:
        self.database.execute(
            "INSERT INTO monitor_snapshots(observed_at, status, summary_json, details_json, error) VALUES (?, ?, ?, ?, ?)",
            (now(), status, json.dumps(summary, separators=(",", ":")), json.dumps(details, separators=(",", ":")), error),
        )
