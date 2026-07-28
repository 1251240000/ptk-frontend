# Dogfood Report: Partokens R52 Console API Keys Production

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Production migration URL | `http://127.0.0.1:4174/en/console-foundation/keys` |
| Protected design-lab URL | `http://127.0.0.1:4180/` |
| Scope | Design-lab API Keys composition migrated into the parallel production `ConsoleShell` boundary |
| Result | Passed; canonical Keys and every other Console screen remain on their prior routes |

## Summary

R52 adds production API key management only at `/$locale/console-foundation/keys`. The screen preserves the prototype's work-focused header, filters, responsive list, compact actions, create/edit surface, confirmations, and empty state while replacing every prototype record, permission, lifecycle simulation, timeout, and generated secret with existing token endpoints and React Query.

`/$locale/console/keys` still renders the existing `KeysPage` under `LegacyConsoleShell`. No canonical cutover, legacy-shell removal, Store, persistence, production dependency, design-system change, prototype edit, or other Console screen migration was made.

## Architecture Choices

- The new screen is a sibling of foundation Overview and Analytics under the existing `ConsoleFoundationGuard`, `ConsoleShell`, locale boundary, shared QueryClient, session Store, and preference/theme Store.
- The list uses `['console-foundation', 'keys', 'list', keyword]`; detail, group, and model options use child keys under the same root. All queries use `retry: false` so mutations and authentication failures are never replayed implicitly.
- Search uses the server search endpoint. Results are fetched in 100-record pages and status-filtered locally because the existing token API has no status query parameter. The loop is capped at 1,000 records, matching the backend's default per-user maximum; that backend setting is configurable, so a larger reported total becomes an explicit partial state.
- List responses are normalized into an explicit `KeyRecord` before entering Query cache. Unknown fields are discarded. A `key` value is retained only when it is already server-masked with `*`; an unexpected unmasked value is discarded and rendered as a generic mask.
- Form, selection, notice, confirmation, and revealed-secret state are component-local and transient. No new Store or persisted preference was added.
- Every mutation invalidates foundation Keys, foundation Overview's token summary, and the existing canonical `['tokens']` family. Detail/supporting queries remain under the Keys root and are invalidated with it.
- Dialogs opened from the modal action menu are deferred one event turn so Radix can release the menu pointer lock before establishing the dialog focus trap. Escape closes the dialog and returns focus to the originating action.

## API And Query Contract

| Operation | Existing API client / route | R52 behavior |
|---|---|---|
| List | `getTokens` -> `GET /api/token/` | Validates envelope, paginated object, items array, total, core numeric id, and non-empty name. |
| Search | `searchTokens` -> `GET /api/token/search` | Debounced server query; no local name or key fabrication. |
| Detail | `getToken` -> `GET /api/token/:id` | Editing is blocked unless every field needed for a lossless update is present. |
| Create | `createToken` -> `POST /api/token/` | Converts USD to quota units and accepts the backend's success response without `data`; then invalidates and refetches. |
| Edit | `updateToken` -> `PUT /api/token/` | Sends only the established token input fields. Missing group/model option queries preserve current values. |
| Enable / disable | `updateTokenStatus` -> `PUT /api/token/?status_only=true` | Maps enabled to status 1 and disabled to status 2; expired/exhausted enable attempts remain server-authoritative. |
| Delete | `deleteToken` -> `DELETE /api/token/:id` | Requires confirmation; accepts the backend's success response without `data`. |
| Batch delete | `deleteTokens` -> `POST /api/token/batch` | Applies a conservative 100-record UI selection cap and validates the returned deleted count. A lower count is reported as partial success. The delete endpoint itself documents no numeric maximum. |
| Reveal | `revealToken` -> `POST /api/token/:id/key` | Requires an explicit confirmation and validates a non-empty string key. |
| Supporting options | `getUserGroups`, `getUserModels` | Independent non-retrying queries; failures do not invent groups or models and do not discard existing restrictions. |

The shared API client now narrowly normalizes missing `data` only for create and single-delete token mutations. This matches the current backend controller without weakening ordinary envelope validation. A contract unit test covers both responses.

## Secret And Quota Boundaries

- Full keys are never requested during list, search, detail, create, edit, status, or delete flows. The default list always renders a server mask or a generic mask.
- Reveal is a separate confirmed action. The full value is assigned directly to dialog state inside the mutation function; it is not returned as mutation data and therefore is not stored in React Query's mutation cache.
- Closing by button, backdrop, Escape, target change, navigation, or component unmount clears the dialog state. The reveal mutation uses `gcTime: 0` and is reset on close.
- Full keys are never written to localStorage, IndexedDB, a Store, URL, log, toast, report, screenshot, or production fixture. Clipboard access occurs only after the user presses Copy.
- The backend does not expose password/2FA step-up for token reveal. R52 does not simulate one and relies on the existing authenticated session and server authorization.
- Quota input is USD, converted with the established `500,000 quota units = USD 1.00` helper. Lists use `formatQuota`; unlimited quota remains a distinct boolean state. E2E verifies USD 3.50 is sent as 1,750,000 units.

## State Handling

- Loading: stable list and detail skeletons preserve layout while real requests are pending.
- Error: list, detail, save, status, delete, batch, and reveal failures have scoped `role="alert"` surfaces and retry only where safe.
- Empty: successful empty data and filter-empty data are distinct; neither is inferred from an error.
- Partial data: usable rows remain visible with unavailable values shown as a dash. Invalid rows, missing fields, duplicate/short totals, and truncation produce an explicit status notice.
- Contract blocked: non-empty responses without a usable id and name stop the list; incomplete detail data stops editing rather than overwriting unknown restrictions.
- 401: the route guard redirects a genuinely anonymous session to localized sign-in. A feature-level 401 after session resolution remains in-page and asks for a new sign-in.
- 403: list and mutation authorization failures remain in-page and do not clear or fabricate data.

## Modified Files

- `apps/web/src/pages/console-foundation-keys-page.tsx`
  - New foundation Keys production composition, strict normalization, full CRUD/status/batch/reveal handling, responsive layouts, focus restoration, and all data states.
- `apps/web/src/components/console-foundation/console-shell.tsx`
  - Added only the foundation API Keys navigation item and active title.
- `apps/web/src/router.tsx`
  - Registered only `/$locale/console-foundation/keys` under the existing foundation route.
- `packages/api-client/src/index.ts`
  - Added narrow missing-`data` normalization for the existing create and single-delete token functions.
- `apps/web/src/lib/api-contract.test.ts`
  - Added coverage for successful create/delete responses without `data`.
- `apps/web/e2e/mock-api.ts`
  - Completed masked token fixtures and added an explicit real-create-contract option without changing canonical test defaults.
- `apps/web/e2e/console-foundation.spec.ts`
  - Added R52 lifecycle, invalidation, secret, quota, 401/403, loading/error/empty/partial/contract, canonical protection, theme, focus, console, and responsive coverage.
- `dogfood-output/r52-console-api-keys-production/report.md`
- `dogfood-output/r52-console-api-keys-production/screenshots/keys-1440.png`
- `dogfood-output/r52-console-api-keys-production/screenshots/keys-390.png`

No design-lab source, i18n copy, design-system source, dependency manifest, lockfile, Store, persistence implementation, global production style, R37-R51 screen implementation, canonical `KeysPage`, canonical Console route, or `LegacyConsoleShell` was modified for R52. All pre-existing dirty and untracked work was preserved.

## Verification

| Command / check | Result |
|---|---|
| `npm run typecheck` in `apps/web` | Passed |
| `npm run test` in `apps/web` | Passed: 9 files, 32 tests |
| `npm run build` in `apps/web` | Passed: Rsbuild 2.1.6, 1,465.0 kB total / 412.9 kB gzip |
| `npm run test:e2e` in `apps/web` | Passed: 29 Chromium tests |
| Foundation E2E | Passed: 16 tests, including R49-R52 regressions |
| `git diff --check -- apps/web packages/api-client` | Passed |
| 1440 / 390 / 320 responsive checks | Passed; `scrollWidth <= innerWidth` at every width |
| Locale and theme | Passed on Chinese mobile routes; system/light and dark transitions retained |
| Keyboard and focus | Passed for shell shortcuts, mobile sidebar, action menus, reveal dialog Escape, and trigger focus restoration |
| Authenticated-shaped browser errors | `consoleErrors=[]`, `pageErrors=[]` |
| Production preview on 4174 | Built route returned 200; real self/list/create/status/delete/batch/reveal boundaries all returned 401 without a session |
| Live anonymous browser route | Redirected to `/en/auth/sign-in`; `pageErrors=[]`, no horizontal overflow |

The live unauthenticated 401 produces the browser's expected failed-resource console entry. No local authenticated real-account session was available, so successful and partial authenticated workflows were exercised with existing-endpoint, backend-controller-shaped Playwright responses; no fixture row or secret is claimed as live account data.

## Protected Scope

- `/$locale/console/keys` remains canonical and unchanged under `LegacyConsoleShell`.
- `/$locale/console-foundation/overview`, Analytics, and every R37-R51 production/prototype screen retain their prior implementations.
- The foundation shell now exposes only migrated Overview, Analytics, and API Keys links. No placeholder route was added.
- Existing token functions, QueryClient, session Store, theme Store, and quota formatting remain the sources of truth.
- Generated Playwright report churn and all unrelated dirty files were left intact.

## Risks And Contract Blockers

- Current backend create success does not return the created token or id. R52 safely refetches the list and reports that reveal must be started from the refreshed row; it does not identify a sensitive credential by a non-unique name or timing guess. Returning the created masked token id would enable an immediate, correctly bound reveal confirmation.
- Token reveal has no password, passkey, or 2FA step-up contract. Session authorization is the only available protection.
- Status filtering is not supported server-side. R52 loads at most 1,000 tokens before filtering, which covers the backend default but not deployments configured above that value; a future server status parameter would reduce requests and remove the cap coupling.
- Token fields remain optional in the shared client type although the backend's current schema makes them required. R52 keeps defensive partial handling until that contract is formally guaranteed.
- The batch-delete contract has no documented request-size maximum or per-id failure detail. R52 uses a conservative 100-id UI cap and reports a returned short count; deployments that want larger atomic batches need an explicit backend guarantee before that cap can be raised safely.
- Live authenticated CRUD/reveal validation remains blocked by the absence of a local authenticated real-account session.

## Next Screen Recommendation

Migrate Usage Logs next under `console-foundation`. It is the next adjacent operational screen and can reuse the existing self-scoped log/stat Query contracts, but should retain strict redaction, independent list/stat errors, request-id filtering, detail focus restoration, and canonical route protection.

R52 stops here.
