# Local Channel Configuration Migration

## Inspected Data (2026-09-11)

Read-only inspection of the local SQLite schema-3 database found:

| Item | State |
| --- | --- |
| monond (`lc_9e9312f7d4a94deb85ce7d81214745b5`) | Enabled, legacy template 31 |
| partokens (`lc_46ab81ac98fd4f5c9ca6a1b6c58d2862`) | Enabled, legacy template 22 |
| `chg_b8d844b22eef4f89b7e7c6c58221ce2a` | Model removal: write to 31 succeeded, final verification failed |
| `chg_003e3a77b58743fb8596783f61c04ca6` | bailian route: record 24 created/configured/verified; second copy failed |
| bailian | Last committed revision 1 |
| Observed physical cache | 18 nonstandard, 2 route, 1 template |

These are local persisted observations, not a live upstream audit. No live
database was migrated or cleared during development. Both legacy logical rows
lack recoverable local credentials. Fingerprints and masks cannot restore keys.

## Upgrade Order

1. Stop Admin API writes and test workers. Back up SQLite using its backup API
   (or `sqlite3 database.sqlite3 '.backup backup.sqlite3'`); do not copy a live
   WAL database as a single file. Back up New API independently.
2. Deploy New API with `GET /api/channel/:id` returning an empty key, a masked
   display value and the exact `credential_fingerprint`. Verify its Go tests in
   a complete checkout before release.
3. Generate a base64 32-byte AES key once, outside the repository and database
   volume. Protect permissions and store a separate recoverable backup in your
   secret manager. Mount it as `PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE`.
   The Docker image runs as UID 10001: grant that UID read access to the mounted
   file (for example owner 10001, mode 0400 on Linux). Compose file-backed secrets
   may retain host permissions; confirm readability inside the container without
   printing the key. Keep parent directories inaccessible to unrelated users.
4. Install Admin API dependencies and deploy one worker. Startup applies additive
   schema 4 columns/tables only. Existing templates, rows, routes and journals are
   retained. Deploy the accompanying frontend.
5. As Root, GET `/admin-api/v1/migration/audit`. Compare the live channel IDs and
   ownership with the local findings above. This endpoint is read-only.
6. Edit both legacy channels and re-enter their full API keys. Enter any provider
   settings/headers using the write-only `execution_config` API field if the old
   channel used them. No automatic import reads a key from New API. Do not paste
   secrets into shell command lines, logs, notes or browser persistent storage.
7. For monond, review the old model-removal plan, then POST
   `/admin-api/v1/changes/chg_b8d844b22eef4f89b7e7c6c58221ce2a/migrate`.
   This preserves the original plan/steps in `change_migrations`, adopts its
   intended retained models locally and marks the old journal cancelled. It
   does not claim its old physical writes succeeded. Existing model results
   become stale and need a fresh test.
8. POST `/admin-api/v1/changes/chg_003e3a77b58743fb8596783f61c04ca6/migrate`.
   The original route journal is preserved. Known prepared record 24 is checked
   for ownership and added to the replacement plan. Missing old records are not
   recreated as templates. This endpoint prepares a new schema-2 plan only.
9. Review that new plan, then use the existing Continue action. It creates new
   disabled executions from local configuration and retires 24/old route records
   after verification. Rebuild other bound groups using **重建执行渠道**.
10. Refresh monitoring; inspect missing/duplicate/drift issues and run model
    discovery/tests. After verifying all groups, explicitly clean up disabled
    legacy templates/archives/probes with
    `POST /admin-api/v1/executions/{channel_id}/cleanup`. Cleanup is never automatic
    for templates or archives and checks ownership immediately before deletion.

Model migration changes the local model selection to the already recorded
intended plan. Route migration requires all referenced local credentials and
no unfinished model changes. If the old partially created channel no longer
has matching metadata/tag, migration stops for operator reconciliation. Legacy
copies still tagged as disabled templates are preserved for explicit cleanup.

## Synchronization and Drift

Local edits are durable immediately; existing traffic continues on the last
published configuration until a route rebuild. Monitoring makes this difference
visible. Rebuilding publishes a new revision with the same priorities/weights.
It does not adopt upstream edits. Any local channel used by an unfinished new
plan cannot be edited until that plan completes. Disabled logical channels stay
disabled when their routes are rebuilt. Status changes reread owned records and
verify the resulting status; enabling refuses configuration drift.

Ownership requires an existing local logical ID, `partokens_admin` metadata and
its `ptlc:` tag. New executions additionally match the local creation ledger.
An external Root can edit these fields concurrently; the HTTP API has no remote
compare-and-swap, so all channel administration must go through Admin API during
changes. This cannot be a distributed atomic transaction. A switch may briefly
have both old and new records enabled; failures remain resumable. The old records
are never disabled before the enabled replacements are read back successfully.

## Ambiguous Creation and Recovery

Each POST is preceded by a committed creation intent. If a response is lost but
the channel exists, Continue finds it by its creation ID and does not POST again.
If it is absent, the service refuses automatic recreation because an in-flight
request might still commit. Confirm the upstream request has terminated and
inspect the complete live list using the audit endpoint before manually resetting
that one `execution_creations.state` from `submitted` to `pending`. Stop Admin API
first, take a backup, and use a parameterized maintenance script for the exact
creation ID; never clear the ledger or all channels. A repeated or mismatched
creation marker must be reconciled before proceeding.

New records changed after preparation fail verification. Restore the reviewed
fields through controlled operator reconciliation, then Continue; the service
will not silently overwrite an upstream change on a partial plan. Missing
executions in a completed revision are recovered through a new route revision.

## Key Backup, Rotation and Rollback

Loss of the AES key makes ciphertext unrecoverable. Restore the matching key
backup or re-enter credentials; hashes cannot help. A wrong key prevents startup
against existing encrypted data. Database and master key backups must be stored
separately with distinct access controls.

Rotation is an offline operation: stop the sole runtime, back up SQLite and the
old key, decrypt each populated `config_ciphertext` with `CredentialVault` using
its logical ID, encrypt with a new independently generated key, update all rows
in one SQLite transaction, then atomically switch the secret mount and restart.
Keep the old key with the pre-rotation backup until retention expires. Do not
rotate only the file without re-encrypting the rows.

Before route publication, rollback can restore the pre-migration database and
previous service versions. After publication, reverting only SQLite would lose
the creation ledger and route revisions: first restore the matching New API
execution state or keep the new Admin API and publish a corrective revision.
Never run the old template-dependent code against a migrated logical channel
without a matching pre-migration database backup.
