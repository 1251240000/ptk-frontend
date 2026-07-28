# R55 Console Foundation Authenticated Validation

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Scope | `/$locale/console-foundation/overview`, `/analytics`, `/keys`, `/logs` |
| Baseline | R54 Console Foundation rebuild and design-lab compositions |
| Decision | **Canonical cutover not approved** |

## Executive Result

R55 used the development account from `/Users/dj/Desktop/partokens/dev_user.txt` to establish a real production session. The account is an ordinary user with a configured group. Credentials, cookie values, user id, key values, log content, and response messages were never written to an artifact.

Authenticated production acceptance completed for the available account. The anonymous boundary was also rechecked: public status is reachable and protected routes return HTTP 401 envelopes containing only `success` and `message`. No canonical route was changed.

The existing 93-test Playwright suite and unit contract tests were rerun. Their fixture-shaped 401/403, ordinary error, partial-success, contract-error, CRUD, reveal, filtering, pagination, and sensitive-data cases pass. The new real-session probe is reported separately and is not represented as fixture evidence.

## Real Environment And Permissions

- Production target: the repository's default API target, `partokens.com`.
- Staging: no configured staging origin or authenticated session was present; candidate staging DNS names did not resolve.
- Account permission scope: ordinary-user self scope. The account's self resources and owned token mutations were exercised; administrator-only resources were not exposed.
- Session source: the user-provided `dev_user.txt`, used only in memory for login and browser/API session setup.
- No mock response was used as evidence of an authenticated production response. Existing Playwright fixtures are labeled as simulated/controller-shaped checks below.

## Actual Production Contract Results

The authenticated probe and browser run printed only HTTP status, envelope success, object key names, counts, and boolean safety results. Response values and messages were discarded.

| API surface | Method / route | Actual result | Observed structure |
|---|---|---:|---|
| Status | `GET /api/status` | 200 | `success=true`; top-level keys `success`, `message`, `data`; `data` is an object and includes a bounded `version` field. |
| Current account | `GET /api/user/self` | 200 authenticated / 401 anonymous | Authenticated `data` object includes account/quota/request fields; anonymous error has only `success`, `message`. |
| Pricing | `GET /api/pricing` | 200 authenticated / 401 anonymous | Authenticated envelope exposes a pricing array with 10 records; anonymous error has no `data`. |
| Key list | `GET /api/token/` | 200 | Paginated `items`, `total`, `page`, `page_size`; the account initially had no keys. |
| Key search | `GET /api/token/search` | 200 | Paginated envelope; no-match search returned a valid empty page. |
| Key detail | `GET /api/token/:id` | 200 | Created test key detail returned a masked `key` and editor fields. |
| Key create | `POST /api/token/` | 200 | `success=true`, `message`, no `data`; three temporary test keys were created. |
| Key update | `PUT /api/token/` | 200 | `data` object returned with a masked `key`; name/quota fields updated. |
| Key status | `PUT /api/token/?status_only=true` | 200 | Disable and re-enable both returned a masked-key data object. |
| Key delete | `DELETE /api/token/:id` | 200 | `success=true`, `message`, no `data`; temporary keys were removed. |
| Key batch delete | `POST /api/token/batch` | 200 | `data` is a numeric deleted count; temporary keys were removed in batch. |
| Key reveal | `POST /api/token/:id/key` | 200 | `data.key` is present only in the direct transient response; it was shape-checked and never printed. |
| Groups | `GET /api/user/self/groups` | 200 | `data` is an object keyed by five available group labels; the existing safe projection accepts this shape. |
| Models | `GET /api/user/models?group=default` | 200 | `data` is a valid empty array for the requested group. |
| Logs | `GET /api/log/self` | 200 | Paginated `items`, `total`, `page`, `page_size`; real page 1 and page 2 both returned 20 rows with a total of 103. |
| Log statistics | `GET /api/log/self/stat` | 200 | `data` object contains `quota`, `rpm`, `tpm`. |
| Request-id filter | `GET /api/log/self` with exact request filter | 200 | Valid empty page for a no-match request id; browser filter submission produced the expected request-id parameter. |
| Upstream request-id filter | `GET /api/log/self` with exact upstream filter | 200 | Valid empty page for a no-match upstream request id. |
| Usage aggregate | `GET /api/data/self` | 200 | Seven-day authenticated response returned two rows; 31-day direct request returned HTTP 200 `success=false` without `data`; real 90-day UI selection made eight chunk requests, each at most 30 days. |
| Flow aggregate | `GET /api/data/flow/self` | 200 | Seven-day authenticated response returned one row; 31-day direct request returned HTTP 200 `success=false` without `data`; real 90-day UI selection made four chunk requests, each at most 30 days. |
| Admin-only boundary | `GET /api/log/` as ordinary user | 200 | `success=false`, `message`, no `data`; production uses a business failure envelope here rather than HTTP 403. |
| Anonymous protected boundary | Account-owned read/mutation routes | 401 | `success=false`; error keys are `success`, `message`; no protected `data`. |

The client uses the trailing slash for token create/update/status. An un-slashified direct POST/PUT probe returned a redirect, while the client routes returned 401; no production change was needed.

## R54 Assumption Differences

1. R54's successful envelope assumptions are now confirmed for the available ordinary production account across account, pricing, keys, logs, and seven-day aggregates.
2. The real 401 envelope omits `data`, while backend business failures use HTTP 200 with `success=false` and no `data`; the adapter now accepts both failure shapes without weakening successful-response projection.
3. The real account's groups endpoint returns an object keyed by group labels and the requested default model list is empty. Existing `safeStringList` and empty-state behavior handle both facts without inventing models.
4. Usage rows include extra user/channel/node fields and log rows include open-ended fields that are not safe for the Foundation contract. The UI projection discards them before Query cache and detail rendering. Real 90-day UI chunking stayed within the server's 30-day maximum.
5. Production now confirms masked key detail/update/status responses, create/delete responses without `data`, numeric batch counts, and transient full-key reveal. No full key entered the page DOM, URL, storage, or retained artifact.

## Contract And Safety Verification

Foundation Query functions return projected values only:

- Overview validates status, token summary, pricing count, log statistics, and log-page records before returning from the Query function.
- Analytics validates envelope rows, timestamps, labels, request/count, token, and quota dimensions independently for usage and flow.
- API Keys validates page totals, ids, status, masked credential shape, editor fields, groups, models, mutation envelopes, batch counts, and reveal output. Full reveal is component-local transient state and uses a zero-cache mutation.
- Usage Logs validates page metadata and projects only row id, time, type, bounded labels, counts, quota, latency, stream flag, request id, and upstream request id.

Credential-shaped values, URLs, raw log content, `other`, metadata, user/channel/IP fields, and unknown fields are discarded or redacted before cache insertion. Filters that look like credentials or URLs are rejected before they become Query keys or request parameters. Existing E2E checks also confirm that secret-shaped backend error messages do not appear in DOM, toast, console, URL, storage, or screenshots.

No full key, original log content, metadata, cookie, token, sensitive query value, or sensitive URL was written to this report or a new test artifact.

The real browser run observed 31 raw log rows carrying open-ended fields outside the safe projection, but found zero matches for those raw values in Foundation DOM text or the opened log detail surface. It observed zero full-key rows in all browser API responses. The authenticated pages had zero console errors, page errors, failed requests, or query parameters in the final route URLs.

## Simulated Protection Matrix

The following cases remain fixture-shaped because they require a separate permission or malformed-response setup:

- Real production 401 and ordinary business failures are covered above. Fixture-shaped 403 responses are independently rendered for Overview child queries, Analytics usage/flow, Logs list/statistics, and Keys list/mutations.
- Ordinary transport errors remain distinct from local contract errors.
- Partial valid rows remain visible with an explicit partial state; fully unusable non-empty pages stop as contract errors; valid empty pages render empty states.
- Keys cover create, edit, status, delete, batch deletion, missing-data mutation responses, masked list/detail, and transient reveal cleanup.
- Logs cover exact request-id and upstream-request-id filters, server pagination, statistics, trace-filter limitations, and disabled unsafe export.
- Analytics covers current/previous periods, range chunking at the 30-day server limit, usage/flow independence, and missing dimensions.

No fixture value is presented as live account data.

## Fixes

- `packages/api-client/src/index.ts`: made the envelope `data` field optional for business-level failures while retaining strict page-level validation for successful responses. This covers backend HTTP 200 `{success:false,message}` responses such as quota-range and token-limit failures without placing an unprojected value in Query cache.
- `apps/web/src/lib/api-contract.test.ts`: added a regression test for a failed aggregate envelope without `data`.

No API, Store, dependency, persistence mechanism, or canonical route was added or changed. All pre-existing dirty and untracked work was preserved.

## Test Results

Commands were executed with the repository's Bun 1.3.14 binary temporarily supplied through `PATH`; no package files were modified.

| Command | Result |
|---|---|
| `npm run typecheck` | Passed: web and docs typecheck. The first environment-only attempt stopped at docs generation because installed `@esbuild/darwin-arm64` did not match the current `darwin-x64` runtime; a matching binary was supplied from `/tmp` for the final rerun. |
| `npm run test` | Passed: web 10 files / 36 tests; docs 1 file / 3 tests. |
| `npm run build` | Passed: web and docs production builds. The final rerun used the same temporary `/tmp` esbuild binary; no dependency or lockfile was changed. |
| `npm run test:e2e` | Passed: 93/93 Chromium tests, one worker, 3.3 minutes. |
| `git diff --check -- apps/web packages/api-client packages/i18n` | Passed. |

## Unresolved Risks

- No staging origin or staging tenant was available. Production evidence is limited to one ordinary-user tenant and cannot prove administrator behavior or cross-tenant ownership rejection.
- A real HTTP 403 was not reachable on the Foundation self-scoped routes; the ordinary user's admin boundary returns HTTP 200 `success=false`. Fixture coverage remains the proof for 403 rendering.
- Real contract and partial states are represented by valid empty pages, empty model data, raw extra fields that are projected away, and the 31-day business failure. Fully malformed authenticated payloads remain fixture-only.
- Analytics still cannot claim success-rate, latency, or endpoint dimensions absent a backend contract.
- Logs still exclude open-ended content/metadata and cannot provide a complete filtered export from the current API.
- The default node_modules tree still contains the opposite-architecture esbuild package; the final typecheck/build were green with a matching binary supplied from `/tmp`, without changing dependencies.

## Canonical Cutover Gate

**FAILED / NOT APPROVED.** Production ordinary-user validation passed for the available account, but R55 does not have a staging tenant or a real HTTP 403 result for the Foundation permission matrix. `/$locale/console/*` must remain on `LegacyConsoleShell`. R56 may be proposed only after staging authentication and the remaining permission/error matrix are exercised against deployed responses, then the docs build environment is corrected or explicitly accepted by release ownership.
