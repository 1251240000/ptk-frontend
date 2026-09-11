"""Versioned authenticated encryption; key material never belongs in SQLite."""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .repository import ConflictError


class CredentialVault:
    def __init__(self, key: bytes):
        if len(key) != 32:
            raise ValueError("channel encryption key must contain 32 bytes")
        self._cipher = AESGCM(key)

    @classmethod
    def from_file(cls, path: Path) -> "CredentialVault":
        try:
            return cls(base64.b64decode(path.read_bytes().strip(), validate=True))
        except Exception:
            raise ValueError("cannot load channel encryption key file") from None

    def encrypt(self, logical_id: str, config: dict[str, Any]) -> str:
        nonce = os.urandom(12)
        ciphertext = self._cipher.encrypt(nonce, json.dumps(config, sort_keys=True).encode(), logical_id.encode())
        return "v1:" + base64.b64encode(nonce + ciphertext).decode()

    def decrypt(self, logical_id: str, ciphertext: str | None) -> dict[str, Any]:
        if not ciphertext:
            raise ConflictError("渠道缺少本地凭据，请编辑渠道重新录入")
        try:
            version, encoded = ciphertext.split(":", 1)
            if version != "v1":
                raise ValueError()
            raw = base64.b64decode(encoded, validate=True)
            return json.loads(self._cipher.decrypt(raw[:12], raw[12:], logical_id.encode()))
        except Exception:
            raise ConflictError("渠道配置无法解密，请检查独立主密钥或恢复备份") from None
