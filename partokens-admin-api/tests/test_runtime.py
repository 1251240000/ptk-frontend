from __future__ import annotations

import os
import socket
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from admin_api.database import Database
from admin_api.repository import Repository


class RuntimeOwnershipTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "admin.sqlite3"
        self.database = Database(self.path)
        self.database.initialize()
        self.repository = Repository(self.database)
        self.env = {**os.environ, "PARTOKENS_ADMIN_DATABASE_PATH": str(self.path)}

    def seed(self) -> dict:
        return self.repository.create_model_test_task({
            "id": "mt_active", "logical_id": "lc_test", "models": ["done", "waiting"],
            "results": [
                {"model_id": "done", "status": "available", "tested_at": 123, "latency_ms": 9},
                {"model_id": "waiting", "status": "untested", "tested_at": None, "latency_ms": None},
            ], "actor_id": 1, "actor_name": "test",
        })

    def run_code(self, code: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, "-c", code], env=self.env, capture_output=True, text=True, timeout=10)

    def test_import_and_failed_bind_do_not_recover_tasks(self) -> None:
        before = self.seed()
        imported = self.run_code("import admin_api.app")
        self.assertEqual(imported.returncode, 0, imported.stderr)
        self.assertEqual(self.repository.model_test_task("mt_active"), before)
        with socket.socket() as listener:
            listener.bind(("0.0.0.0", 0))
            listener.listen()
            result = self.run_code(f"from admin_api.__main__ import main; main({listener.getsockname()[1]})")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("address already in use", result.stderr.lower())
        self.assertEqual(self.repository.model_test_task("mt_active"), before)

    def test_second_process_cannot_recover_live_task_and_crash_releases_lock(self) -> None:
        code = """
from admin_api.app import app
r = app.state.runtime.repository
with r.model_test_runtime():
    print('ready', flush=True)
    input()
"""
        owner = subprocess.Popen([sys.executable, "-c", code], env=self.env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            self.assertEqual(owner.stdout.readline().strip(), "ready")
            before = self.seed()
            result = self.run_code("""
import asyncio
from admin_api.app import app
async def start():
    async with app.router.lifespan_context(app):
        pass
asyncio.run(start())
""")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Another administrator API owns this database", result.stderr)
            self.assertEqual(self.repository.model_test_task("mt_active"), before)
            owner.kill()
            owner.communicate(timeout=5)
            self.repository.recover_model_test_tasks()
            recovered = self.repository.model_test_task("mt_active")
            self.assertEqual(recovered["status"], "partial")
            self.assertEqual(recovered["results"][0], before["results"][0])
            self.assertEqual(recovered["completed"], 1)
            self.assertEqual(recovered["failed_count"], 0)
            self.assertEqual(recovered["results"][1]["status"], "untested")
            self.assertIsNone(recovered["results"][1]["tested_at"])
        finally:
            if owner.poll() is None:
                owner.kill()
            owner.communicate(timeout=5)

    def test_recovery_preserves_cancel_request(self) -> None:
        self.seed()
        self.repository.request_model_test_cancel("mt_active")
        self.repository.recover_model_test_tasks()
        task = self.repository.model_test_task("mt_active")
        self.assertEqual(task["status"], "cancelled")
        self.assertEqual(task["completed"], 1)
        self.assertIn("取消", task["results"][1]["error"])

    def test_route_recovery_preserves_successful_steps_and_exposes_resume(self) -> None:
        self.repository.create_change({"id": "chg_route", "kind": "route_revision", "target": "plus", "revision": 1, "status": "running", "plan": {}, "steps": [
            {"action": "copy", "status": "success", "result": {"channel_id": 10}},
            {"action": "configure", "status": "running", "result": None},
        ], "actor_id": 1, "actor_name": "test"})
        with self.repository.model_test_runtime():
            change = self.repository.change("chg_route")
            self.assertEqual(change["status"], "partial")
            self.assertEqual(change["steps"][0]["result"], {"channel_id": 10})
            self.assertEqual(change["steps"][0]["status"], "success")
            self.assertEqual(change["steps"][1]["status"], "failed")
