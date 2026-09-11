from admin_api.vault import CredentialVault


def test_vault():
    return CredentialVault(b"x" * 32)


def encrypted_config(logical_id, key):
    return test_vault().encrypt(logical_id, {"key": key, "auto_ban": 0, "other": "", "settings": "{}"})
