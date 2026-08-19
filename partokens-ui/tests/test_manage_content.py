from __future__ import annotations

import copy
import contextlib
import io
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import manage_content


class PublicContentConfigTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.config_dir = self.root / "config"
        self.backup_dir = self.root / "backups"
        shutil.copytree(manage_content.DEFAULT_CONFIG_DIR, self.config_dir)
        self.configs = manage_content.load_config_set(self.config_dir)

    def assert_invalid(self, configs: dict, expected: str) -> None:
        errors = manage_content.validate_config_set(configs)
        self.assertTrue(errors)
        self.assertIn(expected, "\n".join(errors))

    def test_valid_configuration_passes(self) -> None:
        self.assertEqual(manage_content.validate_config_set(self.configs), [])

    def test_invalid_date_version_and_language_fail(self) -> None:
        cases = (
            ("invalid date", lambda value: value["notices"]["notices"][0].update(publishedAt="2026-02-30"), "有效日期"),
            ("invalid version", lambda value: value["service-agreement"].update(version="not valid"), "有效版本号"),
            ("invalid language", lambda value: value["about"]["locales"].update({"de": value["about"]["locales"]["en"]}), "不支持的语言"),
        )
        for label, mutate, expected in cases:
            with self.subTest(label=label):
                candidate = copy.deepcopy(self.configs)
                mutate(candidate)
                self.assert_invalid(candidate, expected)

    def test_missing_current_notice_reference_fails(self) -> None:
        self.configs["notices"]["currentNoticeId"] = "missing-notice"
        self.assert_invalid(self.configs, "当前通知引用不存在")

    def test_legal_kind_must_match_file(self) -> None:
        self.configs["privacy-policy"]["kind"] = "service-agreement"
        self.assert_invalid(self.configs, "privacy-policy.json.kind")

    def test_atomic_save_creates_complete_backup(self) -> None:
        old_about = (self.config_dir / "about.json").read_text(encoding="utf-8")
        self.configs["about"]["locales"]["en"]["title"] = "Measured access"
        with mock.patch.object(manage_content.os, "replace", wraps=os.replace) as replace:
            snapshot = manage_content.save_config_set(
                self.configs, self.config_dir, self.backup_dir
            )
        self.assertEqual(replace.call_count, len(manage_content.CONFIG_PATHS))
        self.assertEqual(
            (snapshot / "about.json").read_text(encoding="utf-8"), old_about
        )
        self.assertTrue((snapshot / "legal/privacy-policy.json").is_file())
        saved = manage_content.load_config_set(self.config_dir)
        self.assertEqual(saved["about"]["locales"]["en"]["title"], "Measured access")
        self.assertFalse(list(self.config_dir.rglob("*.tmp")))

    def test_non_ascii_is_saved_without_json_escaping(self) -> None:
        value = "公开内容：你好，世界"
        self.configs["about"]["locales"]["zh-CN"]["title"] = value
        manage_content.save_config_set(self.configs, self.config_dir, self.backup_dir)
        raw = (self.config_dir / "about.json").read_text(encoding="utf-8")
        self.assertIn(value, raw)
        self.assertNotIn("\\u516c\\u5f00", raw)
        self.assertTrue(raw.endswith("\n"))

    def test_editor_smoke_edits_utf8_temporary_file(self) -> None:
        editor = self.root / "fake_editor.py"
        editor.write_text(
            "#!/usr/bin/env python3\n"
            "import pathlib, sys\n"
            "pathlib.Path(sys.argv[1]).write_text('编辑后的正文\\n', encoding='utf-8')\n",
            encoding="utf-8",
        )
        editor.chmod(0o755)
        result = manage_content.edit_text_with_editor(
            "原正文", environ={"EDITOR": str(editor)}
        )
        self.assertEqual(result, "编辑后的正文")

    def test_interactive_edit_and_save_in_temporary_directory(self) -> None:
        answers = iter(("1", "1", "Partokens Test", "9", "0"))
        with contextlib.redirect_stdout(io.StringIO()):
            result = manage_content.run_interactive(
                self.config_dir,
                self.backup_dir,
                input_fn=lambda _prompt: next(answers),
            )
        self.assertEqual(result, 0)
        saved = manage_content.load_config_set(self.config_dir)
        self.assertEqual(saved["system"]["brandName"], "Partokens Test")
        self.assertTrue(any(self.backup_dir.iterdir()))

    def test_validate_mode_is_read_only(self) -> None:
        before = {
            path.relative_to(self.config_dir): path.read_bytes()
            for path in self.config_dir.rglob("*.json")
        }
        self.assertEqual(manage_content.validate_config_set(self.configs), [])
        after = {
            path.relative_to(self.config_dir): path.read_bytes()
            for path in self.config_dir.rglob("*.json")
        }
        self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
