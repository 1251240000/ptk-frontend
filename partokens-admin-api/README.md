# Partokens Admin API

Root-only channel configuration, routing orchestration, model operations and monitoring.
Admin API is authoritative for logical configuration and encrypted credentials.
New API owns authentication, execution channels, forwarding, logs and billing;
Admin API never writes the New API database.

## Storage and Security

Schema 4 adds AES-256-GCM authenticated encryption using the maintained
`cryptography` library. A random 96-bit nonce is generated for every encryption;
the logical channel ID is authenticated as associated data. Keys, headers,
provider settings and overrides are encrypted together. The 32-byte master key
is read from `PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE`, outside the database volume.
Startup rejects a missing key or an unreadable existing ciphertext.

The API accepts write-only `api_key` and `execution_config` fields.
`execution_config` is a JSON string supporting `auto_ban`, `other`,
`openai_organization`, `test_model`, `status_code_mapping`, `setting`,
`settings`, `param_override` and `header_override`. Configuration not present
in that field uses conservative defaults. Creation and editing persist locally;
editing a connection or credential requires rebuilding its bound group routes.
Model selection continues to use the model update/removal workflow.

Public responses contain only display metadata, masked keys, configuration
versions and readiness (`credential_status: ready | missing`). Full credentials
and decrypted settings never enter route journals or monitoring snapshots.
Upstream errors and status reasons are replaced with fixed messages. Responses
are `Cache-Control: no-store`; frontend inputs remain in memory and Axios errors
do not retain credential request bodies in the mutation cache.
Do not enable HTTP body logging, debug dumps or request tracing on either service
or the reverse proxy. Use TLS or a private protected network between services.
New API necessarily retains the credential needed by each execution channel;
its database and backups also require restricted access and encrypted storage.

Cost ratios use exact integer thousandths. A copied channel inherits local
configuration and requires a newly entered API key. Channel identity
(type, normalized URL, credential fingerprint) remains unique.

## Execution and Recovery

Saving a route writes a versioned plan without secrets, then:
1. Persist a unique creation intent for each record.
2. Create a disabled execution channel directly from local configuration.
3. Read back and verify configuration, ownership and full-key fingerprint.
4. Enable the new records and read back again.
5. Disable and archive the old managed records, then verify the final state.
6. Commit the group revision.

Priorities, weights, global retry limits, optimistic revision checks and preview
confirmation are preserved. A partial change blocks another save to the group.
Continue it using `POST /v1/changes/{id}/continue`. Successful creations are
located by their durable creation ID, including after a lost HTTP response.
An ambiguous POST with no visible matching channel remains blocked: automatic
retry cannot safely prove that the first POST will not commit later.
See the migration runbook for recovery of that case.

Monitoring compares observed records with local group revision, configuration,
models, credential fingerprint, priority and weight. Missing/duplicate records
and abandoned probes are reported. Monitoring never repairs upstream state.
Use the route editor's **重建执行渠道** command to publish the same bindings as a
new revision after a configuration edit, missing execution record or drift.
Old managed records are retired only after the replacement verifies.

Every upstream mutation rechecks the logical metadata and `ptlc:` tag. New
records additionally require a local creation ledger match. Foreign channels
are reported and left untouched. Legacy templates are never used for routing,
discovery or tests; their database IDs survive solely for migration audit.

## Model Operations

Discovery and tests create temporary disabled execution probes from complete
local configuration, use New API's provider adapters, and delete the probes
afterward. Failed cleanup is visible to monitoring and can be retried through
`POST /v1/executions/{id}/cleanup`. Probes have an isolated group and are never
enabled. Test tasks allow 100 models, four workers, a 30-second timeout and one
network retry. Interrupted models remain untested. Model add/removal changes
verify their execution scope before resuming and update only owned routes;
local configuration commits after verification.

## Run and Deploy

Python 3.11+ and one runtime process per SQLite database are required.
The OS runtime lock prevents multiple workers from sharing the database.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
# Generate once, outside the repository and database directory.
install -d -m 700 /etc/partokens/secrets
openssl rand -base64 -out /etc/partokens/secrets/channel.key 32
chmod 600 /etc/partokens/secrets/channel.key
export PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE=/etc/partokens/secrets/channel.key
export PARTOKENS_ADMIN_NEW_API_ORIGIN=http://localhost:3000
python -m admin_api
```

The service listens on port 8081. The frontend proxy strips `/admin-api`.
The New API origin must match the frontend's authentication origin.
For Docker, set `PARTOKENS_ADMIN_ENCRYPTION_KEY_SOURCE` in `.env`; Compose mounts
it as a read-only secret independently of `admin_data`.
Configure `PARTOKENS_ADMIN_NEW_API_TOKEN` only for the read-only background
monitor. Manual operations use the current Root bearer session.

**Deploy the accompanying New API GET-channel fingerprint change first.**
Without `credential_fingerprint`, preparation fails closed and leaves new
records disabled. See [migration and deployment](docs/local-channel-migration.md)
before upgrading an existing database. Never regenerate the master key on deploy.

## Verification

Tests use temporary databases and synthetic credentials. Set the bootstrap
database and key paths to isolated test files before importing the ASGI module.

```bash
export PARTOKENS_ADMIN_DATABASE_PATH=/tmp/partokens-admin-test.sqlite3
export PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE=/tmp/partokens-admin-test.key
openssl rand -base64 -out /tmp/partokens-admin-test.key 32
python -m unittest discover -s tests -v
```

The frontend has `playwright.local-channels.config.ts` for the real Admin API
against a fake New API, including route retries, editing and browser storage
checks. Set `PARTOKENS_ROUTE_TEST_API=http://127.0.0.1:8083` and
`PARTOKENS_ROUTE_TEST_EVIDENCE=/tmp/partokens-local-channels` and run
`bunx playwright test --config playwright.local-channels.config.ts` from
`partokens-ui/apps/web` with the same isolated Python environment variables.
