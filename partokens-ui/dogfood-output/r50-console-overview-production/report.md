# Dogfood Report: Partokens R50 Console Overview Production

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Production migration URL | `http://127.0.0.1:4174/en/console-foundation/overview` |
| Protected design-lab URL | `http://127.0.0.1:4180/` |
| Scope | Design-lab Overview composition migrated into the parallel production `ConsoleShell` boundary |
| Result | Passed; canonical Console route was not changed |

## Summary

R50 replaces the R49 foundation placeholder with a production Overview. The page keeps the design-lab information architecture (summary metrics, request readiness, service readiness, endpoint guidance, request route, and recent usage) while sourcing every account value from the existing session/API contracts. Prototype fixtures, delayed refreshes, state-preview controls, simulated success/error states, and new business state were not copied.

The page remains reachable only through `/$locale/console-foundation/overview`. Existing `/$locale/console/overview` continues to render `OverviewPage` under `LegacyConsoleShell`; no canonical route cutover or legacy-shell removal was made.

## Architecture And Data Contract

| Surface | Existing production contract | R50 use |
|---|---|---|
| Identity and authorization | `useSessionStore`, `AuthenticatedUserBoundary`, `getSelf` | Reads the already-resolved authenticated user. Anonymous users and administrators retain the R49 redirects. |
| React Query | Existing workspace `QueryClient` with 15-second stale time | Five foundation-scoped queries, all `retry: false`: status, tokens, pricing, 30-day log stats, and five recent self logs. Envelope failures are converted to query errors without adding an API helper. |
| Account summary | `CurrentUser.quota`, `used_quota`, `request_count` | Balance, lifetime usage, and first-request readiness use real session fields. |
| API key readiness | `getTokens()` / `TokenSummary` | Uses active token status and last accessed time. A failed or forbidden token query stops the key-specific readiness body and offers retry instead of recommending a key. |
| Model count | `getPricing()` | Counts only returned pricing items. Missing/failed pricing is rendered as unavailable and does not block other sections. |
| Usage summary | `getLogStats({ start_timestamp, end_timestamp })` | Uses the existing self-scoped 30-day quota statistic. |
| Recent usage | `getLogs({ p: 1, page_size: 5, start_timestamp, end_timestamp })` | Uses real `UsageLog` fields for time, model, key, token count, quota, latency, and request detail dialog. |
| Service | `getStatus()` | Uses the real status envelope and version. Status error/401/403 has an alert and retry. |

The backend `UsageLog` type does not expose a success/error outcome or provider route. R50 therefore does not invent a status column or claim that a response was probed. The route card leaves provider route/response as `—`, and mobile records are labeled `Recorded` solely because a log was returned. A future migration can fill those fields only after an existing backend contract exposes them.

## State Handling

- Loading: the summary strip uses stable skeleton dimensions; recent usage has its own loading skeleton; service status shows a checking badge.
- Error: each query remains independently usable. A failed status, token, or recent-log request has a `role="alert"` message and retry action. Envelope `{ success: false }` responses are handled the same as transport errors.
- Empty: zero pricing items display `0`; no token records leave API-key readiness incomplete; an empty recent-log response renders a no-usage state.
- Partial data: status, pricing, token, stats, and logs do not gate one another. Missing metrics remain `—`; a compact page note identifies unavailable account data while available cards remain interactive.
- No permission: 401/403 responses are detected from the existing Axios error shape and stop that feature's body/action surface with the localized existing unavailable copy. Session-level anonymous/admin behavior remains owned by the R49 authentication boundary.

## UX And Responsive Verification

- Locale boundary remains owned by `LocaleBoundary`; links use the active locale and existing canonical paths for unmigrated screens.
- Existing preference Store/theme menu and foundation shell keyboard behavior are unchanged.
- Request detail uses the existing design-system Dialog and local transient selection only; no persistence or business Store was introduced.
- 1440px desktop screenshot: `screenshots/overview-1440.png`.
- 390px mobile navigation screenshot: `screenshots/navigation-390.png`.
- A Playwright smoke with the same real-shaped API responses checked 1440, 390, and 320px: `scrollWidth <= innerWidth`, Overview heading visible, `consoleErrors=[]`, and `pageErrors=[]` at all widths.
- Existing foundation E2E covered keyboard sidebar toggling, Escape close/focus restoration, theme switching, no `sidebar_state` Cookie, and mobile overflow.

## Modified Files

- `apps/web/src/pages/console-foundation-page.tsx`
  - Replaced the R49 placeholder with the production Overview composition, React Query calls, typed contract mapping, independent state surfaces, canonical links for unmigrated screens, and real request detail rendering.
- `dogfood-output/r50-console-overview-production/report.md`
- `dogfood-output/r50-console-overview-production/screenshots/overview-1440.png`
- `dogfood-output/r50-console-overview-production/screenshots/navigation-390.png`

No API client, React Query provider, Store, persistence implementation, dependency manifest, lockfile, design-system source, i18n dictionary, design-lab source, R37-R48 screen, canonical Console route, or `LegacyConsoleShell` was modified for R50. All pre-existing dirty files and generated artifacts were preserved.

## Verification

| Command / check | Result |
|---|---|
| `npm run typecheck` in `apps/web` | Passed |
| `npm run test` in `apps/web` | Passed: 9 files, 31 tests |
| `npm run build` in `apps/web` | Passed: Rsbuild 2.1.6, 1,363.7 kB total / 388.9 kB gzip |
| `npm run test:e2e` in `apps/web` | Passed: 18 Chromium tests |
| Foundation E2E (`e2e/console-foundation.spec.ts`) | Passed: 5 tests |
| Public/auth/canonical Console regression | Passed in full 18-test E2E; browser console/page errors remained empty in the foundation smoke |
| `git diff --check -- apps/web` | Passed |
| 1440 / 390 / 320 responsive smoke | Passed; no horizontal overflow |
| Live `4174` API boundary without a session | `GET /api/user/self` and `/api/pricing` returned 401; localized auth redirect remains intact |

The first test invocation hit the pre-existing Node x64 versus Bun arm64 optional-native dependency mismatch for Rollup/esbuild/Rspack. Matching x64 bindings were installed only into disposable `/tmp` directories and linked from ignored `node_modules`; no repository dependency or lockfile changed. The final commands above ran green.

The available local production service had no authenticated browser session for a manual live-account read. Its unauthenticated 401 response was verified directly; authenticated-shaped real envelopes and all data states were exercised through the existing R49 Playwright API harness. The page itself calls the production API client directly when a real session is present.

## Protected Scope And Risks

- Two Console shells still coexist intentionally. The foundation route is not linked from public TopNav and is an acceptance/migration boundary.
- Unmigrated actions link to the existing canonical keys, Playground, usage logs, wallet, models, and docs screens; those screens were not duplicated in foundation.
- Usage-log success/error and provider-route data are contract gaps, recorded above. R50 stops those claims rather than fabricating values.
- The overview currently requests the first page of token records and five recent logs, matching the existing client contracts. Pagination/detail expansion belongs to the Usage Logs migration.
- The existing `system` theme Store limitation and R49 shell behavior remain unchanged.

## Next Screen Recommendation

Migrate Analytics next. It is read-only and already has a production `getQuotaData` contract with established range chunking and React Query patterns. Keep it under `console-foundation`, preserve the canonical Analytics route until parity and full E2E pass, and explicitly document any aggregate fields the backend does not provide before rendering prototype chart states.

R50 stops here.
