# Dogfood Report: Partokens R53 Console Usage Logs Production

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Production migration URL | `http://127.0.0.1:4174/en/console-foundation/logs` |
| Protected design-lab URL | `http://127.0.0.1:4180/` |
| Scope | Design-lab Usage Logs composition migrated into the parallel production `ConsoleShell` boundary |
| Result | Passed; canonical Usage Logs and every other Console screen remain on their prior routes |

## Summary

R53 adds the production Usage Logs screen only at `/$locale/console-foundation/logs`. It preserves the prototype's dense filters, usage summary, responsive list/table, refresh, pagination, and detail inspection while replacing all prototype records, local filtering, simulated refresh, totals, and export state with the existing self-scoped log and statistics APIs through React Query.

`/$locale/console/usage-logs` still renders the existing `UsageLogsPage` under `LegacyConsoleShell`. No canonical cutover, legacy-shell removal, Store, persistence, dependency, API endpoint, design-system change, prototype edit, copy edit, or other Console screen migration was made.

## Architecture And Query Choices

- The screen is a sibling of foundation Overview, Analytics, and API Keys under the existing `ConsoleFoundationGuard`, `ConsoleShell`, locale boundary, QueryClient, session Store, and theme/preference Store.
- List queries use `['console-foundation', 'logs', 'list', params]`; statistics use `['console-foundation', 'log-stats', statParams]`. Both disable retries so authentication and contract errors are not replayed implicitly.
- Refresh invalidates the two foundation Query roots. This refetches the active Logs screen and also invalidates Overview's existing recent-log and log-stat queries without introducing a new shared Store.
- Filter drafts, applied filters, page, safe detail selection, and validation notices remain component-local and transient. They are never written to a Store, URL, localStorage, IndexedDB, or another persistence layer.
- The page requests 20 server records at a time and uses the returned `total/page/page_size` contract for pagination. It does not load all records or locally invent search matches.
- Raw API records are projected into `SafeLogRecord` before the Query function returns. React Query therefore caches only the allowed display fields, not the raw response object.

## API And Query Contract

| Operation | Existing API client / route | R53 behavior |
|---|---|---|
| List | `getLogs` -> `GET /api/log/self` | Sends `p`, `page_size`, type, model, key name, group, time range, and one exact trace filter. Validates the envelope data, items, total, page fields, and each record's display id, timestamp, and type. |
| Request trace | `request_id` | Exact self-scoped filter; no prototype substring search or fabricated match. |
| Upstream trace | `upstream_request_id` | Exact self-scoped filter selected explicitly by the user. |
| Statistics | `getLogStats` -> `GET /api/log/self/stat` | Validates `quota/rpm/tpm` independently from the list. Quota remains backend quota units and is rendered through `formatQuota`; RPM/TPM are the backend's latest-60-second usage metrics. |
| Refresh | React Query invalidation | Invalidates both foundation log roots and refetches active queries; no timeout or simulated timestamp is used. |
| Detail | Current normalized list row | Opens only already-returned safe fields, closes with Escape/backdrop/button, and restores focus to the originating row action. No detail API exists or was invented. |

Backend/controller review established two limitations that affect the UI contract:

- Self statistics always aggregate consumption logs and accept time/model/token/group filters. The controller does not apply type, request-id, or upstream-request-id filters to statistics. R53 omits those unsupported parameters and explicitly labels that list/stat boundary rather than showing misleading filtered totals.
- The backend removes selected admin-only keys from `other`, but still returns `content` and an open-ended `other` JSON string. There is no field-level sensitivity guarantee for either field. R53 does not parse or display them.

The backend count is capped at 10,000 records and rewrites each returned `id` to a page-relative display sequence. R53 treats that id only as a row identity aid and never as a durable log identifier; request IDs remain the trace field.

## Redaction Boundary

- `SafeLogRecord` permits only display id, time, type, key name, model, token counts, quota, latency, stream flag, group, request id, and upstream request id. `content`, `other`, user/channel/IP fields, unknown fields, and raw metadata are discarded before React Query cache insertion.
- Allowed text fields are length-bounded and redact Bearer credentials, common key-shaped values, authorization/API-key/access-token assignments, and HTTP(S) URLs. Redacted rows remain usable with an explicit partial notice.
- Credential-shaped or URL-shaped filter input is blocked before a request is issued, preventing secrets from entering Query keys or request URLs.
- Axios/backend errors are converted to status-only safe errors before React Query receives them. Backend messages are not rendered or retained by the feature query error.
- Details never expose request content, raw metadata, media URLs, headers, or full API keys. There is no export path that could serialize raw or incomplete records.
- Safe detail state is cleared on close and page/filter changes. Nothing from a log record is copied to the session Store, preference Store, browser persistence, console, toast, report, or screenshot.

## State Handling

- Loading: list and statistics have independent, stable skeletons.
- Error: list/stat errors have separate alert and retry surfaces so one remains usable when the other fails.
- Empty: a successful zero-total response is distinct from errors and partial records; active-filter empty state offers a reset.
- Partial data: usable rows remain visible when optional fields are missing, invalid rows are removed, sensitive values are redacted, and pagination metadata issues are reported.
- Contract blocked: non-empty pages with no record containing required id/time/type fields stop rendering and expose a contract-specific retry state.
- 401: a genuinely anonymous session still redirects through the shared route guard; a feature-level 401 after session resolution remains in-page and requests sign-in again.
- 403: list or statistics authorization failure remains isolated in-page and does not clear, fabricate, or persist data.

## Modified Files

- `apps/web/src/pages/console-foundation-logs-page.tsx`
  - New production Logs composition, safe response projection, real filters/statistics/pagination/refresh, all states, responsive table/cards, and detail focus restoration.
- `apps/web/src/pages/console-foundation-logs-page.test.ts`
  - Unit coverage for raw-field removal, credential/URL redaction, partial contracts, statistics validation, and filter blocking.
- `apps/web/src/components/console-foundation/console-shell.tsx`
  - Added only the foundation Usage Logs navigation item and active title.
- `apps/web/src/router.tsx`
  - Registered only `/$locale/console-foundation/logs` under the existing foundation route.
- `apps/web/e2e/console-foundation.spec.ts`
  - Added R53 API/query, invalidation, filtering, pagination, redaction, state, canonical-protection, theme, focus, console, and responsive coverage.
- `dogfood-output/r53-console-usage-logs-production/report.md`
- `dogfood-output/r53-console-usage-logs-production/screenshots/logs-1440.png`
- `dogfood-output/r53-console-usage-logs-production/screenshots/logs-390.png`

No R53 change was made to `apps/web/e2e/mock-api.ts`, `packages/api-client`, any Store or persistence implementation, design-lab/prototype source, design-system source, i18n copy, dependency manifest, lockfile, global styles, canonical `UsageLogsPage`, canonical Console route, `LegacyConsoleShell`, or R37-R52 screen implementations. All pre-existing dirty and untracked work was preserved.

## Verification

| Command / check | Result |
|---|---|
| `npm run typecheck` in `apps/web` | Passed |
| `npm run test -- --run` in `apps/web` | Passed: 10 files, 35 tests |
| `npm run build` in `apps/web` | Passed: Rsbuild 2.1.6, 1,499.3 kB total / 420.8 kB gzip |
| Complete Chromium E2E | Passed: all 36 tests across two specs, executed in mutually exclusive batches to stay within the terminal's per-process window |
| Foundation E2E | Passed: all 23 tests; shell/auth 5, Analytics 5, R53 Logs 7, API Keys 6 |
| R53 Logs E2E | Passed: 7 tests covering self scope, Query invalidation, trace filters, pagination, sensitive boundaries, every state, canonical protection, locale/theme/focus, console, and responsive behavior |
| `git diff --check -- apps/web packages/api-client` | Passed |
| 1440 / 390 / 320 responsive checks | Passed; `scrollWidth <= innerWidth` at every width and screenshots visually inspected |
| Locale and theme | Passed on Chinese mobile routes; system/light and dark behavior retained |
| Keyboard and focus | Passed for shell controls, detail Enter/Escape, dialog focus trap, and trigger focus restoration |
| Authenticated-shaped browser errors | `consoleErrors=[]`, `pageErrors=[]` |
| Production preview on 4174 | Built route returned 200; real session, self-log list, and self-log stat boundaries returned 401 without a session |
| Live anonymous browser route | Redirected to `/en/auth/sign-in`; no page error or horizontal overflow |

The live anonymous 401 produces the browser's expected failed-resource console entry. No local authenticated real-account session was available, so successful, partial, and authorization workflows were exercised with existing-endpoint, backend-controller-shaped Playwright responses. No fixture record is claimed as live account data.

## Protected Scope

- `/$locale/console/usage-logs` remains canonical and unchanged under `LegacyConsoleShell`.
- `/$locale/console-foundation/overview`, Analytics, API Keys, and every R37-R52 production/prototype screen retain their existing implementations.
- The foundation shell exposes only the four migrated screens: Overview, Analytics, API Keys, and Usage Logs. No placeholder route was added.
- Existing `getLogs`, `getLogStats`, QueryClient, session Store, theme Store, quota/date/number formatting, locale handling, and authentication guard remain the sources of truth.
- Generated Playwright report churn and all unrelated dirty files were left intact.

## Risks And Contract Blockers

- The self-log contract exposes open-ended request `content` and `other` metadata without a sensitivity schema. R53 withholds both. A future typed, server-redacted detail endpoint would be required before selected metadata or request summaries can be shown safely.
- Statistics cannot represent type or trace-id filters and always aggregate usage. The UI makes this visible, but a fully aligned summary requires backend support for those filters.
- The 10,000-record count cap means totals above that boundary cannot be represented. Server cursor pagination and an explicit capped-total flag would remove this ambiguity.
- Returned numeric log ids are display sequences rather than durable identities. A stable opaque log id would improve row identity and detail routing.
- The shared `UsageLog` fields remain optional and the generic envelope parser does not validate page or metric fields. R53 retains local validation until the API client contract becomes strict.
- Live authenticated list/stat behavior remains unverified because no local real-account session was available.

## Next Screen Recommendation

Migrate Wallet next under `console-foundation`. It is the next account-critical Console surface after observability, but it should keep payment amount revalidation, external-checkout boundaries, history pagination, 401/403 handling, and canonical route protection isolated from the existing production flow.

R53 stops here.
