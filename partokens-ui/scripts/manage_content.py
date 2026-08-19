#!/usr/bin/env python3
"""Interactive manager and validator for public content configuration."""

from __future__ import annotations

import argparse
import copy
import difflib
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable, Mapping, MutableMapping, Sequence


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_DIR = PROJECT_ROOT / "config" / "public-content"
DEFAULT_BACKUP_DIR = PROJECT_ROOT / ".content-backups" / "public-content"

SUPPORTED_LOCALES = ("zh-CN", "zh-TW", "en", "ja", "ru", "fr", "vi")
LEGAL_KINDS = ("user-agreement", "service-agreement", "privacy-policy")
REVIEW_STATES = ("draft", "reviewed")
SCHEMA_VERSION = 1

CONFIG_PATHS = {
    "manifest": Path("manifest.json"),
    "system": Path("system.json"),
    "about": Path("about.json"),
    "notices": Path("notices.json"),
    "user-agreement": Path("legal/user-agreement.json"),
    "service-agreement": Path("legal/service-agreement.json"),
    "privacy-policy": Path("legal/privacy-policy.json"),
}
MANIFEST_FILE_PATHS = {
    key: path.as_posix() for key, path in CONFIG_PATHS.items() if key != "manifest"
}

VERSION_RE = re.compile(r"^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)+$")
NOTICE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SYSTEM_FIELDS = {
    "schemaVersion",
    "brandName",
    "brandLogoUrl",
    "defaultLocale",
    "supportedLocales",
    "contentFallbackLocale",
}

ConfigSet = dict[str, Any]
InputFn = Callable[[str], str]


class DuplicateKeyError(ValueError):
    """Raised when a JSON object contains the same key more than once."""


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"重复的 JSON 字段: {key}")
        result[key] = value
    return result


def json_text(value: Any) -> str:
    """Serialize configuration in the repository's canonical JSON format."""
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=_reject_duplicate_keys)


def load_config_set(config_dir: Path = DEFAULT_CONFIG_DIR) -> ConfigSet:
    """Load all known configuration files from a fixed, traversal-free layout."""
    loaded: ConfigSet = {}
    for name, relative_path in CONFIG_PATHS.items():
        path = config_dir / relative_path
        try:
            loaded[name] = load_json(path)
        except FileNotFoundError as exc:
            raise ValueError(f"缺少配置文件: {relative_path.as_posix()}") from exc
        except (json.JSONDecodeError, UnicodeDecodeError, DuplicateKeyError) as exc:
            raise ValueError(f"无法读取 {relative_path.as_posix()}: {exc}") from exc
    return loaded


def _is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _validate_date(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, str):
        errors.append(f"{field} 必须是 YYYY-MM-DD 日期")
        return
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        errors.append(f"{field} 不是有效日期: {value!r}")
        return
    if parsed.isoformat() != value:
        errors.append(f"{field} 必须使用 YYYY-MM-DD 格式: {value!r}")


def _validate_datetime(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, str):
        errors.append(f"{field} 必须是带时区的 ISO 8601 时间")
        return
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        errors.append(f"{field} 不是有效的 ISO 8601 时间: {value!r}")
        return
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        errors.append(f"{field} 必须包含时区: {value!r}")


def _validate_version(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, str) or VERSION_RE.fullmatch(value) is None:
        errors.append(f"{field} 不是有效版本号: {value!r}")


def _validate_schema(document: Any, name: str, errors: list[str]) -> bool:
    if not isinstance(document, dict):
        errors.append(f"{name} 顶层必须是 JSON 对象")
        return False
    if document.get("schemaVersion") != SCHEMA_VERSION:
        errors.append(f"{name}.schemaVersion 必须为 {SCHEMA_VERSION}")
    return True


def _validate_locale_map(
    value: Any,
    field: str,
    errors: list[str],
    validator: Callable[[Any, str, list[str]], None],
) -> None:
    if not isinstance(value, dict):
        errors.append(f"{field} 必须是多语言对象")
        return
    actual = set(value)
    expected = set(SUPPORTED_LOCALES)
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        if missing:
            errors.append(f"{field} 缺少语言: {', '.join(missing)}")
        if extra:
            errors.append(f"{field} 包含不支持的语言: {', '.join(extra)}")
    for locale in SUPPORTED_LOCALES:
        if locale in value:
            validator(value[locale], f"{field}.{locale}", errors)


def _validate_about_locale(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{field} 必须是对象")
        return
    for key in ("title", "lead", "body"):
        if not _is_nonempty_string(value.get(key)):
            errors.append(f"{field}.{key} 为必填文本")


def _validate_notice_locale(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{field} 必须是对象")
        return
    for key in ("title", "body"):
        if not _is_nonempty_string(value.get(key)):
            errors.append(f"{field}.{key} 为必填文本")
    highlights = value.get("highlights")
    if not isinstance(highlights, list) or not highlights:
        errors.append(f"{field}.highlights 必须是非空文本数组")
    elif any(not _is_nonempty_string(item) for item in highlights):
        errors.append(f"{field}.highlights 不能包含空值或非文本值")


def _validate_policy_locale(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{field} 必须是对象")
        return
    for key in ("title", "body"):
        if not _is_nonempty_string(value.get(key)):
            errors.append(f"{field}.{key} 为必填文本")


def _validate_legal_locale(value: Any, field: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{field} 必须是对象")
        return
    for key in ("title", "summary"):
        if not _is_nonempty_string(value.get(key)):
            errors.append(f"{field}.{key} 为必填文本")
    sections = value.get("sections")
    if not isinstance(sections, list) or not sections:
        errors.append(f"{field}.sections 必须是非空章节数组")
        return
    for index, section in enumerate(sections):
        section_field = f"{field}.sections[{index}]"
        if not isinstance(section, dict):
            errors.append(f"{section_field} 必须是对象")
            continue
        if not _is_nonempty_string(section.get("title")):
            errors.append(f"{section_field}.title 为必填文本")
        paragraphs = section.get("paragraphs")
        if not isinstance(paragraphs, list) or not paragraphs:
            errors.append(f"{section_field}.paragraphs 必须是非空文本数组")
        elif any(not _is_nonempty_string(item) for item in paragraphs):
            errors.append(f"{section_field}.paragraphs 不能包含空值或非文本值")


def validate_config_set(configs: Mapping[str, Any]) -> list[str]:
    """Return all validation errors; an empty list means the set is valid."""
    errors: list[str] = []
    missing_files = [name for name in CONFIG_PATHS if name not in configs]
    if missing_files:
        errors.append(f"配置集合缺少: {', '.join(missing_files)}")
        return errors

    manifest = configs["manifest"]
    if _validate_schema(manifest, "manifest.json", errors):
        _validate_version(manifest.get("revision"), "manifest.revision", errors)
        _validate_datetime(manifest.get("updatedAt"), "manifest.updatedAt", errors)
        if manifest.get("files") != MANIFEST_FILE_PATHS:
            errors.append("manifest.files 必须准确列出固定的相对配置路径")

    system = configs["system"]
    if _validate_schema(system, "system.json", errors):
        unexpected = set(system) - SYSTEM_FIELDS
        if unexpected:
            errors.append(f"system.json 包含不允许的字段: {', '.join(sorted(unexpected))}")
        for key in ("brandName", "brandLogoUrl"):
            if not _is_nonempty_string(system.get(key)):
                errors.append(f"system.{key} 为必填文本")
        supported = system.get("supportedLocales")
        if supported != list(SUPPORTED_LOCALES):
            errors.append("system.supportedLocales 必须与 AppLocale 的七种语言及顺序一致")
        for key in ("defaultLocale", "contentFallbackLocale"):
            if system.get(key) not in SUPPORTED_LOCALES:
                errors.append(f"system.{key} 必须是受支持语言")

    about = configs["about"]
    if _validate_schema(about, "about.json", errors):
        _validate_locale_map(about.get("locales"), "about.locales", errors, _validate_about_locale)

    notices = configs["notices"]
    if _validate_schema(notices, "notices.json", errors):
        current_id = notices.get("currentNoticeId")
        if not isinstance(current_id, str) or NOTICE_ID_RE.fullmatch(current_id) is None:
            errors.append(f"notices.currentNoticeId 不是有效通知 ID: {current_id!r}")
        entries = notices.get("notices")
        entry_ids: list[str] = []
        enabled_by_id: dict[str, bool] = {}
        if not isinstance(entries, list) or not entries:
            errors.append("notices.notices 必须是非空通知数组")
        else:
            for index, entry in enumerate(entries):
                field = f"notices.notices[{index}]"
                if not isinstance(entry, dict):
                    errors.append(f"{field} 必须是对象")
                    continue
                notice_id = entry.get("id")
                if not isinstance(notice_id, str) or NOTICE_ID_RE.fullmatch(notice_id) is None:
                    errors.append(f"{field}.id 不是有效通知 ID: {notice_id!r}")
                else:
                    entry_ids.append(notice_id)
                    enabled_by_id[notice_id] = entry.get("enabled") is True
                _validate_version(entry.get("version"), f"{field}.version", errors)
                _validate_date(entry.get("publishedAt"), f"{field}.publishedAt", errors)
                if not isinstance(entry.get("enabled"), bool):
                    errors.append(f"{field}.enabled 必须是布尔值")
                if not _is_nonempty_string(entry.get("releaseLabel")):
                    errors.append(f"{field}.releaseLabel 为必填文本")
                _validate_locale_map(entry.get("locales"), f"{field}.locales", errors, _validate_notice_locale)
            duplicates = sorted({item for item in entry_ids if entry_ids.count(item) > 1})
            if duplicates:
                errors.append(f"通知 ID 重复: {', '.join(duplicates)}")
            if isinstance(current_id, str) and current_id not in entry_ids:
                errors.append(f"当前通知引用不存在: {current_id}")
            elif isinstance(current_id, str) and not enabled_by_id.get(current_id, False):
                errors.append(f"当前通知必须启用: {current_id}")
        _validate_locale_map(notices.get("policy"), "notices.policy", errors, _validate_policy_locale)

    for expected_kind in LEGAL_KINDS:
        document = configs[expected_kind]
        file_name = f"legal/{expected_kind}.json"
        if not _validate_schema(document, file_name, errors):
            continue
        if document.get("kind") != expected_kind:
            errors.append(f"{file_name}.kind 必须为 {expected_kind!r}")
        _validate_version(document.get("version"), f"{expected_kind}.version", errors)
        _validate_date(document.get("effectiveDate"), f"{expected_kind}.effectiveDate", errors)
        if document.get("reviewState") not in REVIEW_STATES:
            errors.append(f"{expected_kind}.reviewState 必须是 draft 或 reviewed")
        _validate_locale_map(
            document.get("locales"),
            f"{expected_kind}.locales",
            errors,
            _validate_legal_locale,
        )
    return errors


def _atomic_replace(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_path, path)
    except BaseException:
        temporary_path.unlink(missing_ok=True)
        raise


def save_config_set(
    configs: Mapping[str, Any],
    config_dir: Path = DEFAULT_CONFIG_DIR,
    backup_dir: Path = DEFAULT_BACKUP_DIR,
) -> Path:
    """Validate, snapshot existing files, then atomically replace each JSON file."""
    errors = validate_config_set(configs)
    if errors:
        raise ValueError("配置校验失败:\n- " + "\n- ".join(errors))

    serialized = {name: json_text(configs[name]) for name in CONFIG_PATHS}
    timestamp = datetime.now().astimezone().strftime("%Y%m%dT%H%M%S.%f%z")
    snapshot_dir = backup_dir / timestamp
    snapshot_dir.mkdir(parents=True, exist_ok=False)
    for name, relative_path in CONFIG_PATHS.items():
        source = config_dir / relative_path
        if source.exists():
            backup_path = snapshot_dir / relative_path
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, backup_path)

    for name, relative_path in CONFIG_PATHS.items():
        _atomic_replace(config_dir / relative_path, serialized[name])
    return snapshot_dir


def updated_manifest(configs: ConfigSet, now: datetime | None = None) -> None:
    moment = now or datetime.now().astimezone()
    if moment.tzinfo is None or moment.utcoffset() is None:
        moment = moment.replace(tzinfo=timezone.utc)
    configs["manifest"]["updatedAt"] = moment.isoformat(timespec="seconds")


def edit_text_with_editor(
    current: str,
    *,
    suffix: str = ".txt",
    environ: Mapping[str, str] | None = None,
) -> str:
    """Edit text in $VISUAL/$EDITOR (or vi) and return it without one editor-added newline."""
    environment = os.environ if environ is None else environ
    editor = environment.get("VISUAL") or environment.get("EDITOR") or "vi"
    command = shlex.split(editor)
    if not command:
        raise ValueError("编辑器命令为空")
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", suffix=suffix, delete=False, newline="\n"
        ) as handle:
            handle.write(current)
            temporary_path = Path(handle.name)
        result = subprocess.run([*command, str(temporary_path)], check=False)
        if result.returncode != 0:
            raise RuntimeError(f"编辑器退出码为 {result.returncode}")
        value = temporary_path.read_text(encoding="utf-8")
        return value[:-1] if value.endswith("\n") else value
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def edit_json_with_editor(current: Any, description: str) -> Any:
    edited = edit_text_with_editor(json_text(current), suffix=".json")
    try:
        return json.loads(edited, object_pairs_hook=_reject_duplicate_keys)
    except (json.JSONDecodeError, DuplicateKeyError) as exc:
        raise ValueError(f"{description} 不是有效 JSON: {exc}") from exc


def pending_diff(original: Mapping[str, Any], current: Mapping[str, Any]) -> str:
    chunks: list[str] = []
    for name, relative_path in CONFIG_PATHS.items():
        before = json_text(original[name]).splitlines(keepends=True)
        after = json_text(current[name]).splitlines(keepends=True)
        if before == after:
            continue
        chunks.extend(
            difflib.unified_diff(
                before,
                after,
                fromfile=f"a/{relative_path.as_posix()}",
                tofile=f"b/{relative_path.as_posix()}",
            )
        )
    return "".join(chunks)


def _choose(prompt: str, choices: Sequence[str], input_fn: InputFn = input) -> int | None:
    for index, label in enumerate(choices, start=1):
        print(f"{index}. {label}")
    raw = input_fn(f"{prompt}（直接回车返回）: ").strip()
    if not raw:
        return None
    try:
        selection = int(raw)
    except ValueError:
        print("请输入菜单编号。")
        return None
    if selection < 1 or selection > len(choices):
        print("菜单编号超出范围。")
        return None
    return selection - 1


def _read_scalar(label: str, current: Any, input_fn: InputFn = input) -> str:
    value = input_fn(f"{label} [{current}]: ")
    return value if value else str(current)


def _choose_locale(input_fn: InputFn = input) -> str | None:
    index = _choose("选择语言", SUPPORTED_LOCALES, input_fn)
    return None if index is None else SUPPORTED_LOCALES[index]


def edit_system(configs: ConfigSet, input_fn: InputFn = input) -> None:
    system = configs["system"]
    choices = (
        "品牌名",
        "Logo URL",
        "默认语言",
        "内容回退语言",
        "全局 revision（manifest）",
    )
    index = _choose("选择字段", choices, input_fn)
    if index is None:
        return
    if index == 0:
        system["brandName"] = _read_scalar("品牌名", system["brandName"], input_fn)
    elif index == 1:
        system["brandLogoUrl"] = _read_scalar("Logo URL", system["brandLogoUrl"], input_fn)
    elif index in (2, 3):
        locale_index = _choose("选择语言", SUPPORTED_LOCALES, input_fn)
        if locale_index is not None:
            key = "defaultLocale" if index == 2 else "contentFallbackLocale"
            system[key] = SUPPORTED_LOCALES[locale_index]
    else:
        manifest = configs["manifest"]
        manifest["revision"] = _read_scalar("全局 revision", manifest["revision"], input_fn)


def edit_about(configs: ConfigSet, input_fn: InputFn = input) -> None:
    locale = _choose_locale(input_fn)
    if locale is None:
        return
    item = configs["about"]["locales"][locale]
    index = _choose("选择字段", ("标题", "导语", "正文"), input_fn)
    if index is None:
        return
    key = ("title", "lead", "body")[index]
    if key == "title":
        item[key] = _read_scalar("标题", item[key], input_fn)
    else:
        item[key] = edit_text_with_editor(item[key])


def _edit_notice_entry(entry: MutableMapping[str, Any], input_fn: InputFn = input) -> None:
    choices = ("ID", "版本", "发布日期", "版本标签", "启用/停用", "多语言内容")
    index = _choose("选择字段", choices, input_fn)
    if index is None:
        return
    if index < 4:
        key = ("id", "version", "publishedAt", "releaseLabel")[index]
        entry[key] = _read_scalar(choices[index], entry[key], input_fn)
    elif index == 4:
        entry["enabled"] = not entry["enabled"]
        print(f"通知现已{'启用' if entry['enabled'] else '停用'}。")
    else:
        locale = _choose_locale(input_fn)
        if locale is None:
            return
        localized = entry["locales"][locale]
        field_index = _choose("选择内容", ("标题", "正文", "重点列表"), input_fn)
        if field_index is None:
            return
        if field_index == 0:
            localized["title"] = _read_scalar("标题", localized["title"], input_fn)
        elif field_index == 1:
            localized["body"] = edit_text_with_editor(localized["body"])
        else:
            localized["highlights"] = edit_json_with_editor(localized["highlights"], "重点列表")


def edit_notices(configs: ConfigSet, input_fn: InputFn = input) -> None:
    document = configs["notices"]
    choices = ("编辑通知", "新增通知", "设置当前通知", "删除通知", "通知政策")
    index = _choose("通知管理", choices, input_fn)
    if index is None:
        return
    entries = document["notices"]
    if index == 0:
        selected = _choose("选择通知", [item.get("id", "<invalid>") for item in entries], input_fn)
        if selected is not None:
            _edit_notice_entry(entries[selected], input_fn)
    elif index == 1:
        notice_id = input_fn("新通知 ID: ").strip()
        if not notice_id:
            print("已取消。")
            return
        template = copy.deepcopy(entries[0])
        template.update({"id": notice_id, "enabled": False})
        entries.append(template)
        _edit_notice_entry(template, input_fn)
    elif index == 2:
        selected = _choose("选择当前通知", [item.get("id", "<invalid>") for item in entries], input_fn)
        if selected is not None:
            document["currentNoticeId"] = entries[selected]["id"]
    elif index == 3:
        selected = _choose("选择要删除的通知", [item.get("id", "<invalid>") for item in entries], input_fn)
        if selected is None:
            return
        notice_id = entries[selected].get("id")
        if input_fn(f"确认删除 {notice_id}？输入 yes: ").strip().lower() == "yes":
            entries.pop(selected)
    else:
        locale = _choose_locale(input_fn)
        if locale is None:
            return
        policy = document["policy"][locale]
        field_index = _choose("选择字段", ("标题", "正文"), input_fn)
        if field_index == 0:
            policy["title"] = _read_scalar("标题", policy["title"], input_fn)
        elif field_index == 1:
            policy["body"] = edit_text_with_editor(policy["body"])


def edit_legal(configs: ConfigSet, kind: str, input_fn: InputFn = input) -> None:
    document = configs[kind]
    index = _choose("选择字段", ("版本", "生效日期", "审核状态", "多语言内容"), input_fn)
    if index is None:
        return
    if index == 0:
        document["version"] = _read_scalar("版本", document["version"], input_fn)
    elif index == 1:
        document["effectiveDate"] = _read_scalar("生效日期", document["effectiveDate"], input_fn)
    elif index == 2:
        state_index = _choose("选择审核状态", REVIEW_STATES, input_fn)
        if state_index is not None:
            document["reviewState"] = REVIEW_STATES[state_index]
    else:
        locale = _choose_locale(input_fn)
        if locale is None:
            return
        localized = document["locales"][locale]
        field_index = _choose("选择内容", ("标题", "摘要", "章节和段落"), input_fn)
        if field_index is None:
            return
        if field_index == 0:
            localized["title"] = _read_scalar("标题", localized["title"], input_fn)
        elif field_index == 1:
            localized["summary"] = edit_text_with_editor(localized["summary"])
        else:
            localized["sections"] = edit_json_with_editor(localized["sections"], "协议章节")


def print_validation(configs: Mapping[str, Any]) -> bool:
    errors = validate_config_set(configs)
    if not errors:
        print("配置校验通过。")
        return True
    print("配置校验失败：", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    return False


def run_interactive(
    config_dir: Path = DEFAULT_CONFIG_DIR,
    backup_dir: Path = DEFAULT_BACKUP_DIR,
    input_fn: InputFn = input,
) -> int:
    configs = load_config_set(config_dir)
    original = copy.deepcopy(configs)
    menu = (
        "系统配置",
        "About 内容",
        "通知管理",
        "用户协议",
        "服务协议",
        "隐私政策",
        "检查全部配置",
        "查看待保存变更",
        "保存",
    )
    while True:
        print("\n公开内容配置管理")
        for index, label in enumerate(menu, start=1):
            print(f"{index}. {label}")
        print("0. 退出")
        choice = input_fn("请选择: ").strip()
        try:
            if choice == "1":
                edit_system(configs, input_fn)
            elif choice == "2":
                edit_about(configs, input_fn)
            elif choice == "3":
                edit_notices(configs, input_fn)
            elif choice in ("4", "5", "6"):
                edit_legal(configs, LEGAL_KINDS[int(choice) - 4], input_fn)
            elif choice == "7":
                print_validation(configs)
            elif choice == "8":
                print(pending_diff(original, configs) or "没有待保存变更。")
            elif choice == "9":
                if not pending_diff(original, configs):
                    print("没有需要保存的变更。")
                    continue
                updated_manifest(configs)
                if not print_validation(configs):
                    continue
                snapshot = save_config_set(configs, config_dir, backup_dir)
                original = copy.deepcopy(configs)
                print(f"保存完成。备份目录: {snapshot}")
            elif choice == "0":
                if pending_diff(original, configs):
                    answer = input_fn("存在未保存变更，确认退出？输入 yes: ").strip().lower()
                    if answer != "yes":
                        continue
                return 0
            else:
                print("请输入 0 到 9。")
        except (OSError, RuntimeError, ValueError) as exc:
            print(f"操作未完成: {exc}", file=sys.stderr)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="管理 Partokens 公开内容配置")
    parser.add_argument("--validate", action="store_true", help="只读校验全部配置")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    if args.validate:
        try:
            configs = load_config_set(DEFAULT_CONFIG_DIR)
        except ValueError as exc:
            print(exc, file=sys.stderr)
            return 1
        return 0 if print_validation(configs) else 1
    try:
        return run_interactive(DEFAULT_CONFIG_DIR, DEFAULT_BACKUP_DIR)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    except (EOFError, KeyboardInterrupt):
        print("\n已中止，未保存的变更不会写入。", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
