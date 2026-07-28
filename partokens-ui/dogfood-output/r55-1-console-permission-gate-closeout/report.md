# R55.1 Console Permission Gate Closeout

| Field | Value |
|---|---|
| Date | 2026-07-28 |
| Scope | `/$locale/console-foundation/overview`, `/analytics`, `/keys`, `/logs` |
| Baseline | R55 authenticated production validation |
| Decision | **FAILED / R56 not approved** |

## Executive Result

R55.1 rechecked the Console Foundation against the current production API with the available ordinary-user account. The account credentials still authenticate, owned API key CRUD/status/batch/reveal passed, temporary keys were removed, self-scoped logs and analytics passed, anonymous and invalid-session boundaries returned real 401 responses, and the ordinary user now receives a real HTTP 403 from the administrator log boundary.

The gate is still not closed. There is no staging origin/session, restricted account, or second tenant, so non-owned existing resources and feature-level 403 behavior on the self-scoped Foundation endpoints cannot be accepted against a real permission setup. In addition, production authentication changed after R55: password login now returns an access-token/session bundle rather than the flat user object expected by this frontend. The current sign-in UI therefore cannot establish the session needed by Foundation without an injected in-memory bearer token.

No canonical route was changed.

## Real Environments

| Environment | Result |
|---|---|
| Current production API | `https://partokens.com/api/*` was exercised with a real ordinary-user login. API observations below are from deployed responses, not mocks. |
| Production Foundation UI | `https://partokens.com/en/console-foundation/overview` returned the native production 404 page. Foundation UI validation therefore used the local R54 frontend against the real production API. |
| Local Foundation plus production API | `http://127.0.0.1:4174/en/console-foundation/*` loaded all four pages when a real production access token was attached in browser memory and the existing user-id header was seeded. This was a test harness session, not proof that the current sign-in page works. |
| Staging | No configured staging origin, tenant, or session exists in the workspace. `staging.partokens.com`, `api-staging.partokens.com`, `staging-api.partokens.com`, and `test.partokens.com` returned no A records. |
| Account inventory | One ordinary production account is available through the existing credential file. No administrator, restricted, second-tenant, or resource-owner counterpart is available. |

Credentials, cookies, access tokens, user ids, full keys, log bodies, and response messages were not written to this report or a new R55.1 artifact. Authentication and reveal values existed only in process/browser memory and were discarded after shape checks.

## Account Permission Matrix

| Actor / resource | Surface | Real result | Gate status |
|---|---|---|---|
| Anonymous | Self, key list | HTTP 401, `success=false`, keys `code`, `message`, `success`, no `data` | Closed |
| Invalid bearer session | Self and Foundation guard | HTTP 401 with no protected `data`; local Foundation redirected to localized sign-in | Closed |
| Ordinary user | Self, status, pricing | Authenticated reads succeeded and required account/status/pricing shapes were present | Closed |
| Ordinary user / owned keys | List, create, detail, update, disable, enable, delete | All succeeded. Detail/update/status remained masked. Create/delete omitted `data` as allowed by contract | Closed |
| Ordinary user / owned keys | Reveal | HTTP 200 success; a full-key shape existed only in the direct transient response and was immediately discarded | Closed |
| Ordinary user / owned keys | Batch delete | Three temporary keys were created; one was deleted individually and two in batch. An unmatched id in the same batch was ignored and the returned count was 2 | Closed |
| Ordinary user / missing key | Detail, reveal, update, delete | HTTP 200, `success=false`, no `data` | Closed as missing-resource semantics only |
| Ordinary user / missing key | Batch delete | HTTP 200, `success=true`, numeric `data=0` | Closed as missing-resource semantics only |
| Ordinary user / non-owned existing key | Detail, reveal, update, delete, batch | Not executed: no second owner account/resource pair exists, and production mutation of an unknown third-party key would be unsafe | **Blocked** |
| Ordinary user / admin boundary | `GET /api/log/` | HTTP 403, `success=false`, keys `code`, `message`, `success`, no `data` | Closed as real 403 evidence |
| Ordinary user | Logs list/statistics | HTTP 200 success; page shape valid, 20 rows on the sampled page; `quota`, `rpm`, `tpm` present | Closed |
| Ordinary user | Analytics usage/flow, 7 days | HTTP 200 success with arrays | Closed |
| Ordinary user | Analytics usage/flow, 31 days | HTTP 200, `success=false`, no `data` | Closed as business-range failure |
| Ordinary user | Analytics, 90-day UI range | Eight usage and four flow requests; every chunk was at most 2,592,000 seconds | Closed |
| Restricted/staging user | Overview, Analytics, Keys, Logs | No real restricted or staging account/session exists | **Blocked** |

All temporary production keys were removed. A final owner list scan found zero R55.1 temporary records.

## Actual Error Semantics

Current production does not have one universal permission/error status:

- Authentication absence and an invalid bearer return HTTP 401 with `success=false`, `code`, `message`, and no `data`.
- The ordinary-user administrator boundary now returns HTTP 403 with the same failure-envelope shape. This differs from R55's 2026-07-26 observation of HTTP 200 `success=false` for the same boundary.
- Missing or inaccessible token detail/reveal/update/delete operations return HTTP 200 `success=false` without `data`.
- Batch deletion is filter/count based: no owned matches returns HTTP 200 `success=true` with numeric zero rather than a failure.
- Analytics requests beyond the one-month backend window return HTTP 200 `success=false` without `data`.

The sibling backend source snapshot still implements role insufficiency in `authHelper` as HTTP 200 `success=false`, while the deployed production response is now HTTP 403 with `code`. That source cannot be treated as the deployed contract. The frontend must continue accepting both transport-level 401/403 and HTTP 200 business failures.

The existing Foundation code already does this safely: Axios status is retained for 401/403 copy, failure envelopes stop projection, and optional failure `data` does not weaken successful page/row validation. No permission-error production fix was required.

## Authentication Drift

The deployed password login response now has `data` keys `access_expires_at`, `access_token`, `session`, `token_type`, and `user`. The nested user and session shapes validated, and the access token successfully authenticated `/api/user/self` when held only in memory.

The current frontend still expects login `data.id` and a legacy cookie session. During a real browser sign-in it therefore did not set the user-id header; the following self request returned 401 and the sign-in page remained open. Production's current native bundle also references `/api/user/auth/refresh` and `X-Auth-Session`, confirming that the deployed session lifecycle is broader than a response-shape normalization.

R55.1 did not add a partial token cache, refresh API, auth Store, or credential persistence. Doing so would violate this round's constraints and would leave reload, rotation, expiry, and sign-out incomplete. This drift requires a separately scoped authentication migration before canonical cutover.

## Contract And Safety Verification

- Real probes emitted only HTTP status, success booleans, bounded counts, top-level key names, and shape/safety booleans.
- Full reveal values, bearer tokens, cookies, account ids, response messages, raw logs, open-ended metadata, and unknown record values were never printed into the report or saved as R55.1 evidence.
- Overview, Analytics, Keys, and Logs all rendered through the local Foundation against production when authenticated through the in-memory test harness.
- None of the four page DOMs contained a full-key pattern, credential-shaped local-storage value, sensitive route query, or page alert after successful load.
- The invalid-session browser used a deliberately invalid non-secret bearer and was redirected to sign-in by a real production 401, without a network mock.
- Existing projection tests continue to cover raw log fields, secret-shaped backend errors, partial rows, malformed contracts, and fixture-shaped feature-level 401/403 states.
- No API, Store, dependency, application persistence mechanism, or canonical route was added.

## Fixes

- `apps/web/e2e/console-foundation.spec.ts`: hardened two flaky waits exposed by the full rerun. The administrator cross-document redirect now polls the final pathname instead of attaching a navigation waiter that can abort during `window.location.assign`. The mobile Logs keyboard test now confirms visibility, scroll position, and focus before pressing Enter.
- `dogfood-output/r55-1-console-permission-gate-closeout/report.md`: added this closeout report.

No application production code changed. In particular, `apps/web/src/router.tsx`, the API client, Query projections, Stores, and canonical routes were not modified.

## Test Results

| Command | Result |
|---|---|
| `npm run typecheck` | Passed: web and docs. Docs generated 98 localized pages with zero file updates. |
| `npm run test` | Passed: web 10 files / 36 tests; docs 1 file / 3 tests. |
| `npm run build` | Passed: web and docs production builds. No temporary esbuild architecture workaround was needed. |
| Targeted flaky-test repeat | Passed 9/9: administrator redirect plus both Logs mobile widths, repeated three times. |
| `npm run test:e2e` | Passed 93/93 Chromium tests, one worker, 2.7 minutes. Design-lab was served on its existing port 4180 for the visual cases. |

The first E2E attempt was invalid because the required existing design-lab server on port 4180 was not running. After starting it, two independent timing races were isolated, hardened, repeated, and followed by the green full run above.

## Remaining Risks

1. There is still no staging tenant or authenticated staging session.
2. No second account/resource-owner pair exists, so a real non-owned existing-key matrix is still missing.
3. The only real 403 is the ordinary-user admin log boundary. Overview, Analytics, Keys, and Logs self endpoints did not produce feature-level 403 for the available account; their UI handling remains fixture-proven.
4. Production Foundation routes are not deployed and return the native 404, so deployed-UI acceptance is unavailable.
5. The production login/refresh contract has moved to an access-token/session bundle and the current frontend sign-in path is incompatible. R55's authenticated-browser conclusion is no longer current.
6. The local backend source snapshot and deployed production disagree on role-failure HTTP status, so release ownership still needs a versioned backend contract or deployment-aligned source reference.

## R56 Canonical Cutover Decision

**FAILED / NOT APPROVED.** R55.1 closes the real production ordinary-user, owned-resource, missing-resource, anonymous/invalid-session, and administrator 403 evidence that is reachable today. It does not close staging, real non-owned resources, restricted-account feature permissions, deployed Foundation UI, or the new production authentication lifecycle.

`/$locale/console/*` must remain on `LegacyConsoleShell`. R56 canonical cutover may be reconsidered only after a deployed/staging Foundation build can authenticate through the current token/refresh contract and a controlled two-account tenant matrix proves non-owned detail, reveal, update, delete, and batch behavior. This round made no canonical route change.
