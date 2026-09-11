from __future__ import annotations

import json
import unittest

from admin_api.domain import channel_metadata, credential_fingerprint, identity_hash, normalized_base_url


class DomainTests(unittest.TestCase):
    def test_normalizes_only_origin_and_trailing_slash(self) -> None:
        self.assertEqual(normalized_base_url("HTTPS://API.Example.COM:443/v1/"), "https://api.example.com/v1")
        self.assertNotEqual(normalized_base_url("https://api.example.com/v1"), normalized_base_url("https://api.example.com/v2"))

    def test_rejects_credentials_in_channel_base_url(self) -> None:
        with self.assertRaises(ValueError):
            normalized_base_url("https://user:password@api.example.com/v1")

    def test_identity_uses_irreversible_fingerprint(self) -> None:
        fingerprint = credential_fingerprint("secret-value")
        self.assertTrue(fingerprint.startswith("sha256:"))
        self.assertNotIn("secret-value", fingerprint)
        self.assertEqual(identity_hash(1, "https://api.example.com/v1/", fingerprint), identity_hash(1, "https://API.example.com/v1", fingerprint))

    def test_rejects_unversioned_channel_metadata(self) -> None:
        self.assertIsNone(channel_metadata({"other_info": json.dumps({"partokens_admin": {"logical_id": "lc_x", "kind": "route"}})}))


if __name__ == "__main__":
    unittest.main()
