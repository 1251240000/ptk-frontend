# Dogfood Report: Partokens R51 Console Analytics Production

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Production migration URL | `http://127.0.0.1:4174/en/console-foundation/analytics` |
| Protected design-lab URL | `http://127.0.0.1:4180/` |
| Scope | Design-lab Analytics composition migrated into the parallel production `ConsoleShell` boundary |
| Result | Passed; canonical Analytics and all other Console screens were not changed |

## Summary

R51 adds a production Analytics screen only at `/$locale/console-foundation/analytics`. It preserves the design-lab hierarchy of filters, metric summary, trend, model ranking, request flow, detail inspection, refresh, and export while replacing all prototype values and simulated states with the existing self-scoped API contracts and React Query.

`/$locale/console/analytics` still renders the existing `AnalyticsPage` under `LegacyConsoleShell`. No canonical cutover, legacy-shell removal, API addition, Store addition, persistence change, production dependency, design-lab edit, or other Console screen migration was made.

## Architecture Choices

- The new page is a sibling of the R50 Overview under the existing R49 `ConsoleFoundationGuard` and `ConsoleShell`; it reuses `AuthenticatedUserBoundary`, `LocaleBoundary`, the shared `QueryClient`, session Store, and preference/theme Store.
- Usage and request-flow data use independent React Query entries keyed under `['console-foundation', 'analytics', ...]`, both with `retry: false`. One failed contract never hides the other usable surface.
- Filter, metric, view, table/chart, and dialog state are transient component state. No business Store or persisted preference was added.
- Refresh calls both real query `refetch()` functions. There is no timeout, fake progress, simulated success, or sample-data restore path.
- The page-local segmented-control classes explicitly use the existing `--surface-muted`, `--muted`, and `--ink` tokens. This avoids the repository's legacy `--muted` text-token collision without changing the design system or global styles.
- CSV export contains only the currently returned and aggregated rows. It labels the backend quota field as `Quota units`; UI cost uses the existing `formatQuota` conversion.

## API And Data Contract

| Surface | Existing contract | R51 behavior |
|---|---|---|
| Usage aggregates | `getQuotaData(range)` -> `QuotaDataPoint[]` from `/api/data/self` | Uses only typed numeric `request_count`, `token_used`, and `quota`; `created_at` drives the trend and `model_name` drives ranking. |
| Request flow | `getFlowQuotaData(range)` -> `FlowQuotaDataPoint[]` from `/api/data/flow/self` | Groups typed `token_id`/`token_name`, `use_group`, and `model_name`, and totals `count`, `token_used`, and `quota`. |
| Range limit | Existing API client `getChunkedQuotaData` | The 90-day selection is split into sequential, non-overlapping requests no longer than 30 days. No page-local API helper was added. |
| API envelopes | Existing `ApiEnvelope<T>` | `{ success: false }` and non-array data become query errors instead of false empty states. |
| Session/auth | Existing `getSelf` and `useSessionStore` | Anonymous users redirect to localized sign-in; administrators retain the native `/channels` redirect. Feature-level 401/403 responses remain in-page and do not fabricate data. |
| Formatting | Existing `formatInteger` and `formatQuota` | Locale-aware counts and USD display use the same quota conversion as existing production screens. |

The prototype's preceding-period values, percentage deltas, success rate, median latency, endpoint distribution, model health, and provider-route claims are not exposed by these production contracts. R51 stops those features instead of deriving them from unrelated fields. Weekly aggregation was also not used because the existing production Analytics establishes only `hour` and `day` values for `default_time`.

## State Handling

- Loading: stable metric and workspace skeletons are rendered while the first real queries are pending; refresh uses the query fetching state.
- Error: usage and flow errors have independent `role="alert"` surfaces and retry controls. A 200 envelope with `success: false` is also an error.
- Empty: a successful empty usage response shows no usage for the selected period; an empty flow response has its own no-flow state.
- Partial data: rows lacking every typed numeric metric are excluded and announced. If any row lacks the selected metric, that metric's summary/view is stopped rather than treating the field as zero. Missing timestamps stop only the trend; missing model names stop only ranking.
- Contract blocked: non-empty responses without usable numeric metric fields render an explicit incomplete-contract state. Other query/view data remains accessible.
- 401/403: transport status is read from the existing Axios error shape. 401 asks for a new sign-in; 403 reports that the account cannot access the requested analytics surface.

## Modified Files

- `apps/web/src/pages/console-foundation-analytics-page.tsx`
  - New production Analytics composition, strict envelope/field handling, independent queries, responsive chart/table/ranking/flow views, real refresh, detail dialog, and CSV export.
- `apps/web/src/components/console-foundation/console-shell.tsx`
  - Added only the foundation Analytics navigation item and route-aware shell title.
- `apps/web/src/router.tsx`
  - Registered only `/$locale/console-foundation/analytics` under the existing foundation route.
- `apps/web/e2e/mock-api.ts`
  - Added real-contract-shaped self usage and request-flow envelopes for browser verification.
- `apps/web/e2e/console-foundation.spec.ts`
  - Added ready/loading/error/empty/partial/contract/401/403, real refetch, 90-day chunking, canonical protection, locale/theme, focus, console, and 1440/390/320 coverage.
- `dogfood-output/r51-console-analytics-production/report.md`
- `dogfood-output/r51-console-analytics-production/screenshots/analytics-1440.png`
- `dogfood-output/r51-console-analytics-production/screenshots/analytics-390.png`

No API client source, Store, persistence implementation, dependency manifest, lockfile, global production style, i18n dictionary, design-system source, design-lab source, R37-R50 screen implementation, canonical Console route, canonical `AnalyticsPage`, or `LegacyConsoleShell` was modified for R51. All pre-existing dirty and untracked work was preserved.

## Verification

| Command / check | Result |
|---|---|
| `npm run typecheck` in `apps/web` | Passed |
| `npm run test` in `apps/web` | Passed: 9 files, 31 tests |
| `npm run build` in `apps/web` | Passed: Rsbuild 2.1.6, 1,424.1 kB total / 402.9 kB gzip |
| `npm run test:e2e` in `apps/web` | Passed: 23 Chromium tests |
| Foundation E2E | Passed: 10 tests, including all R51 states and prior foundation regressions |
| `git diff --check -- apps/web` | Passed |
| 1440 / 390 / 320 responsive checks | Passed; `scrollWidth <= innerWidth` at every width |
| Locale and theme | Passed on Chinese mobile routes; light/system and dark theme transitions retained |
| Keyboard and focus | Passed for sidebar shortcuts/Escape and Analytics details dialog Escape/focus restoration |
| Browser errors in authenticated-shaped flows | `consoleErrors=[]`, `pageErrors=[]` |
| Production preview on 4174 | Built output served successfully; real unauthenticated self, usage, and flow APIs all returned 401 |
| Live anonymous route | Redirected `/en/console-foundation/analytics` to `/en/auth/sign-in`; `pageErrors=[]` |

The local shell does not expose an authenticated real-account browser session. Consequently R51 verified the actual backend's unauthenticated 401 boundary and exercised authenticated data/state behavior with existing-endpoint, real-contract-shaped Playwright envelopes. It did not claim that fixture rows were live account data. Chromium records the expected failed-resource console entry for the live 401 request; authenticated-shaped success/error/partial flows have no browser console or page errors.

## Protected Scope

- `/$locale/console/analytics` remains canonical and unchanged under `LegacyConsoleShell`.
- `/$locale/console-foundation/overview` and every R37-R50 production/prototype screen remain unchanged.
- The foundation shell exposes only migrated Overview and Analytics links. No placeholder or duplicate route was added for an unmigrated screen.
- Existing `getQuotaData`/`getFlowQuotaData`, QueryClient, session Store, and theme Store own their established boundaries; R51 added no competing source of truth.
- Generated Playwright report churn and all unrelated dirty files were left intact.

## Risks And Contract Blockers

- The backend contract cannot support prior-period comparison, success/error rates, latency health, endpoint distribution, or provider routing. Those design-lab surfaces remain intentionally absent.
- `QuotaDataPoint` fields are optional. R51 refuses to total a selected metric when any returned row omits that numeric field; a backend schema guarantee would allow a simpler complete-data path.
- `token_name`, `use_group`, and `model_name` are optional in flow rows. Existing production labels are used for deleted/unnamed entities, but no identity is reconstructed.
- A 90-day view makes up to three sequential requests per API surface through the existing client. Cancellation and cross-chunk partial success are not exposed by that helper: a failed chunk fails the full query.
- The production bundle grew because the foundation Analytics is currently eager-loaded. Route-level lazy loading can be considered during canonical cutover, but was outside this migration's no-refactor boundary.
- Live authenticated aggregate verification remains blocked by the absence of a local authenticated account session.

## Next Screen Recommendation

Migrate API Keys next under `console-foundation`. Its production token list and mutation contracts already exist, but the migration must preserve secret reveal confirmation, mutation invalidation, quota units, batch behavior, and 401/403 handling without copying prototype keys or simulated lifecycle states. Keep `/$locale/console/keys` canonical until the same authentication, focus, responsive, and full-E2E gates pass.

R51 stops here.
