from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Sequence


SCHEMA = """
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS logical_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel_type INTEGER NOT NULL,
  base_url TEXT NOT NULL,
  identity_hash TEXT NOT NULL UNIQUE,
  credential_fingerprint TEXT NOT NULL,
  masked_key TEXT,
  cost_ratio_millis INTEGER,
  models_json TEXT NOT NULL,
  model_mapping TEXT,
  note TEXT NOT NULL DEFAULT '',
  template_channel_id INTEGER UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  state TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS route_configs (
  group_name TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS changes (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  target TEXT NOT NULL,
  revision INTEGER,
  status TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  actor_id INTEGER NOT NULL,
  actor_name TEXT NOT NULL,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_changes_created_at ON changes(created_at DESC);

CREATE TABLE IF NOT EXISTS physical_records (
  channel_id INTEGER PRIMARY KEY,
  logical_id TEXT,
  kind TEXT NOT NULL,
  group_name TEXT,
  attempt INTEGER,
  route_revision INTEGER,
  status INTEGER NOT NULL,
  name TEXT NOT NULL,
  models TEXT NOT NULL,
  priority INTEGER,
  weight INTEGER,
  test_time INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  status_reason TEXT,
  drift INTEGER NOT NULL DEFAULT 0,
  observed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_physical_logical ON physical_records(logical_id);
CREATE INDEX IF NOT EXISTS idx_physical_route ON physical_records(group_name, route_revision);

CREATE TABLE IF NOT EXISTS execution_creations (
  creation_id TEXT PRIMARY KEY,
  logical_id TEXT NOT NULL,
  channel_id INTEGER UNIQUE,
  state TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS change_migrations (
  change_id TEXT PRIMARY KEY,
  original_plan_json TEXT NOT NULL,
  original_steps_json TEXT NOT NULL,
  migrated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS monitor_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observed_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  details_json TEXT NOT NULL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_monitor_observed ON monitor_snapshots(observed_at DESC);

CREATE TABLE IF NOT EXISTS model_discoveries (
  logical_id TEXT PRIMARY KEY,
  fetched_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  models_json TEXT NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS model_test_tasks (
  id TEXT PRIMARY KEY,
  logical_id TEXT NOT NULL,
  status TEXT NOT NULL,
  models_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  total INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  available_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  actor_id INTEGER NOT NULL,
  actor_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_test_tasks_logical ON model_test_tasks(logical_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_model_test_tasks_active
  ON model_test_tasks(logical_id) WHERE status IN ('pending', 'running');
"""


class Database:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.RLock()

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as connection:
            connection.executescript(SCHEMA)
            columns = {row["name"] for row in connection.execute("PRAGMA table_info(logical_channels)").fetchall()}
            if "masked_key" not in columns:
                connection.execute("ALTER TABLE logical_channels ADD COLUMN masked_key TEXT")
            if "config_ciphertext" not in columns:
                connection.execute("ALTER TABLE logical_channels ADD COLUMN config_ciphertext TEXT")
            if "config_version" not in columns:
                connection.execute("ALTER TABLE logical_channels ADD COLUMN config_version INTEGER NOT NULL DEFAULT 1")
            if "cost_ratio_millis" not in columns:
                connection.execute("ALTER TABLE logical_channels ADD COLUMN cost_ratio_millis INTEGER")
                if "cost_ratio" in columns:
                    connection.execute(
                        "UPDATE logical_channels SET cost_ratio_millis = CAST(ROUND(cost_ratio * 1000) AS INTEGER) WHERE cost_ratio IS NOT NULL"
                    )
            row = connection.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
            if row is None:
                connection.execute("INSERT INTO schema_version(version) VALUES (4)")
            elif int(row["version"]) < 4:
                connection.execute("UPDATE schema_version SET version = 4")

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            connection = sqlite3.connect(self.path, timeout=30, isolation_level=None)
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute("PRAGMA journal_mode = WAL")
            connection.execute("PRAGMA busy_timeout = 30000")
            try:
                yield connection
            finally:
                connection.close()

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                yield connection
            except Exception:
                connection.rollback()
                raise
            else:
                connection.commit()

    def fetch_all(self, sql: str, params: Sequence[Any] = ()) -> list[dict[str, Any]]:
        with self.connection() as connection:
            return [dict(row) for row in connection.execute(sql, params).fetchall()]

    def fetch_one(self, sql: str, params: Sequence[Any] = ()) -> dict[str, Any] | None:
        with self.connection() as connection:
            row = connection.execute(sql, params).fetchone()
            return dict(row) if row is not None else None

    def execute(self, sql: str, params: Sequence[Any] = ()) -> int:
        with self.transaction() as connection:
            cursor = connection.execute(sql, params)
            return cursor.rowcount

    def latest_snapshot(self) -> dict[str, Any] | None:
        row = self.fetch_one("SELECT * FROM monitor_snapshots ORDER BY observed_at DESC, id DESC LIMIT 1")
        if row is None:
            return None
        row["summary"] = json.loads(row.pop("summary_json"))
        row["details"] = json.loads(row.pop("details_json"))
        return row

    def prune_snapshots(self, keep: int) -> None:
        self.execute(
            "DELETE FROM monitor_snapshots WHERE id NOT IN (SELECT id FROM monitor_snapshots ORDER BY observed_at DESC, id DESC LIMIT ?)",
            (keep,),
        )
