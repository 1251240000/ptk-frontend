# Partokens Admin API

Lightweight Root-only orchestration and monitoring service for Partokens logical
channels. New API remains authoritative for authentication, physical channels,
routing abilities, tests, logs, and billing. This service never writes directly
to the New API database.

## Responsibilities

- Persist logical channels, route revisions, execution steps, and monitoring
  snapshots in a service-owned SQLite database.
- Store optional cost ratios as integer thousandths (`cost_ratio_millis`), while
  accepting legacy integer/two-decimal input and rejecting more than three
  decimal places.
- Discover models through New API's supported channel endpoint without replacing
  the configured model list; run up to 100 selected model tests in a persisted
  task with four workers, a 10-second per-model timeout, and one short network
  retry.
- Preview and execute removal of only models explicitly classified as
  unavailable. Physical template, route, and archive mirrors are updated by
  resumable, audited change steps; timeouts, rate limits, and server errors are
  retained.
- Create disabled credential templates and expand route revisions through the
  supported New API HTTP endpoints.
- Keep credential variants separate even when they share an upstream URL, and
  support copying a variant's non-sensitive configuration while requiring a
  newly entered API key.
- Execute non-atomic route changes as resumable, read-back-verified steps.
- Poll one New API instance for physical-channel state and 24-hour attempt logs.
- Require a live New API Root identity for every `/v1/*` request.

API keys are accepted only when a Root creates a channel. They are forwarded in
that request to New API and are never stored in SQLite or application logs. The
background monitor uses a dedicated Root Personal Access Token and performs only
read operations.

## Model Operations API

All endpoints require the current New API bearer session and `role === 100`.
Responses contain model IDs, timestamps, status labels, latency, and sanitized
failure reasons only; channel keys never enter the response or SQLite.

```text
GET  /v1/channels/{logical_id}/models/discover
POST /v1/channels/models/discover
POST /v1/channels/{logical_id}/models/test
GET  /v1/model-tests/{task_id}
POST /v1/model-tests/{task_id}/cancel
POST /v1/channels/{logical_id}/models/remove/preview
POST /v1/channels/{logical_id}/models/remove/execute
```

Model test state is stored in SQLite so browser refreshes do not discard
results. Starting a second task for the same logical channel returns the active
task instead of creating duplicate upstream requests. A removal execute request
may include `change_id` to continue a partial change.

## Local Run

Python 3.11 or newer is required.

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
PARTOKENS_ADMIN_NEW_API_ORIGIN=http://localhost:3000 python -m admin_api
```

The module binds `0.0.0.0:8081`; use `http://127.0.0.1:8081` from the same host.
Configure the frontend proxy so `/admin-api/*` strips that prefix before
forwarding to this service. The `PARTOKENS_ADMIN_NEW_API_ORIGIN` value must be
the same New API origin used by the frontend proxy; otherwise authenticated
bootstrap requests fail with `new-api returned HTTP 502` when that upstream is
not reachable.

Unsaved channel forms use `POST /v1/channels/models/discover`, which forwards
the one-shot channel configuration to New API's `POST /api/channel/fetch_models`
route. The API key is used only for that request and is not written to SQLite.

To create another key for an existing upstream, use
`POST /v1/channels/{logical_id}/copy`. The source channel's URL, type, models,
ratio, and note are used as defaults; the request must provide a new
`api_key`, and any non-sensitive field may be overridden. The response is a
new independent logical channel. Variants are grouped by normalized upstream
address in the Partokens admin UI, but remain separate for routing and health.

## Test

The suite uses Python's standard library runner and adds no test-only runtime
dependency:

```bash
python -m unittest discover -s tests -v
```

## Background Monitoring

Create a dedicated Root Personal Access Token in New API and set
`PARTOKENS_ADMIN_NEW_API_TOKEN`. Channel state is refreshed every 60 seconds by
default; the more expensive per-channel log counts are refreshed every five
minutes. A missing token disables background polling but manual Root refresh
continues to work.

## Deployment

```bash
cp .env.example .env
chmod 600 .env
docker compose config --quiet
docker compose up -d --build
```

SQLite is appropriate for this single-instance service because route changes
are serialized and only Root operates it. Do not run multiple replicas against
the same SQLite volume. Move the service-owned tables to PostgreSQL before
introducing multiple workers or instances.
