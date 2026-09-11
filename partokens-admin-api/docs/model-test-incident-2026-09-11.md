# Model test recovery incident

## Confirmed cause

The manual process 93618 (`.venv/bin/python -m admin_api`) occupied port
8081 while the submitted launchd job `local.partokens.admin-api` had KeepAlive
enabled. The job repeatedly launched the same command from
`/Users/dj/Desktop/partokens/partokens-admin-api`, approximately every ten
seconds. At inspection it had run 281 times and its last exit code was 1.
Both wrote to `/tmp/partokens-admin-api.log` and used
`data/partokens-admin.sqlite3`. The upstream environment setting was
`PARTOKENS_ADMIN_NEW_API_ORIGIN=http://localhost:3000`; no service token was
configured. Port 3000 is an SSH tunnel to the New API service on 10.1.1.8.

Application import called `build_runtime()`, which recovered every active
model test before Uvicorn bound its listener. The losing processes therefore
changed the live worker's task to partial and its untested results to unknown,
also incorrectly reporting 100% completion. An isolated SQLite reproduction
confirmed that a process exiting with a bind error still changed its task.

The original task `mt_a746959f70de42b29685638f473df90d` was created on
2026-09-10 at 14:40:10 China time. The user observed the false terminal state
at 14:40:20. The database was subsequently updated at 14:40:50 with real
timeouts by the still-running worker. The UI had already stopped polling the
falsely terminal task. This corroborates cross-process recovery, rather than
an actual interruption of process 93618.

## Changes

- The module entry point reserves the listener before importing the app.
- Importing/building a runtime no longer recovers tasks.
- Lifespan holds a nonblocking OS file lock for the resolved SQLite path.
  A second process sharing the database cannot recover active work, including
  when launched directly with Uvicorn or on another port. This deployment
  intentionally supports one worker per SQLite database. Process death
  releases the lock automatically.
- Shutdown cancels and awaits model workers before releasing ownership.
  Interrupted, cancelled, and setup-failed models remain untested with an
  explanation and no fabricated test timestamp. Only actual outcomes count
  towards completed and failed totals. Cancellation requests survive recovery.
- The UI retains its four model states and displays an incomplete terminal
  task as interrupted, with its actual progress.
- Error classification parses explicit HTTP status values instead of finding
  digits anywhere in error messages or request IDs.

The manual process was stopped with SIGTERM. The existing launchd job took
over as PID 94536 using its original configuration. The final status-code
parsing guard was loaded by a graceful restart on September 11, with no active
tests, and launchd now owns PID 32665. No credentials or remote
service configuration were changed. Existing historical task rows were not
rewritten.

## Upstream evidence

Channel 22 is type 1 (OpenAI), base URL `https://partokens.com`, with no model
mapping, endpoint setting, or parameter override. The Admin API calls
`GET /api/channel/test/22?model=...`. New API constructs a Chat Completions
test by default and a Responses test for the codex model name.

- `gpt-5.4`: New API logged upstream HTTP 400 with
  `{"message":"Upstream request failed","type":"invalid_request_error"}`.
  Direct protocol comparison using the existing channel credential returned
  400 for both Chat Completions and Responses; Responses reported
  `type=upstream_error`. Neither response supplied a specific rejected field.
  A protocol mismatch alone is therefore not established.
- `gpt-5.4-mini`: the actual upstream response was HTTP 503,
  `code=model_not_found`, explaining that the Codex Plus group had no available
  channel for this model. The old classifier matched `401` inside request ID
  `202609100640107142625388268d9d65NSjnwkK` and mislabeled this as authentication
  failure. This is a routing/availability error, not evidence of invalid
  credentials, and is not eligible for automatic model removal.

Only relevant non-sensitive configuration and error fields were printed.

## Validation

- Backend: 61 tests passed, covering import without recovery, occupied-port
  startup, competing process ownership, crash lock release, recovery counts,
  shutdown, cancellation, and misleading request IDs.
- Frontend: 3 model-status unit tests, TypeScript checking, and 6 Playwright
  tests passed, including a new interrupted batch assertion (1/6 completed,
  zero failures, remaining models untested, removal disabled).
- Duplicate startup against the running local instance exited before app
  startup and left the task table unchanged.
- Real batch `mt_1cd83489826045c3b60a78dc351698b1`, submitted through the local
  UI on 2026-09-10 at 16:35:05, finished at 16:35:29: 7/7 tested, 3 available,
  4 abnormal. All seven have test timestamps; none report service restart.
  New API logs confirm the corresponding channel test calls.
- Available: `codex-auto-review`, `gpt-5.5`, `gpt-5.6-sol`.
- Remaining errors: `gpt-5.4` HTTP 400; `gpt-5.4-mini` no available group
  channel; `gpt-5.6-terra` and `gpt-6-astra` exceeded the existing ten-second
  attempt timeout twice. Timeout does not prove that a model is unavailable.

## Proxy chain

The actual logged-in browser page was
`http://localhost:5173/zh-CN/console/admin/channels`. Its network panel showed
`/admin-api/v1/bootstrap` and the proxy forwards to 8081. Both 5173 and 5177
returned the Admin API health JSON on September 10. The API listener and
health remained intact when work resumed on September 11; the temporary
5177 frontend has since stopped. Final health checks passed on 8081 and 5173.

Port 8080 is a separate Caddy process using `release/deploy/Caddyfile`; its
loaded configuration lacks `/admin-api`, unlike the current development and
deployment source configs. It forwards that path to the public site's HTML.
It was not in the failing task's request chain and was not reconfigured as
part of this repair. Use the local development URL above for this workflow.

Playwright report: `/tmp/partokens-runtime-e2e/playwright-report/index.html`.
