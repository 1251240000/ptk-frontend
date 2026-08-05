# R4.3 console data pages

Depends on: `00-scope-and-foundation.md`, authenticated session boundary
Design baseline: active design-lab Console shell, Overview, Analytics, API Keys, and Usage Logs screens
Production routes: canonical localized Console routes only

## 1. Scope

| Page | Canonical route |
| --- | --- |
| Overview | `/{locale}/console/overview` |
| Analytics | `/{locale}/console/analytics` |
| API keys | `/{locale}/console/keys` |
| Usage logs | `/{locale}/console/usage-logs` |

The current production pages already contain substantial API, cancellation, authorization, state, and E2E behavior. Preserve those contracts while replacing any remaining old presentation with the approved design-lab shell and screen composition.

## 2. Design lock

- Port the active `ShadcnConsoleShell` desktop sidebar, top tools, account summary, theme/language menus, mobile sidebar, and mobile bottom navigation.
- Keep design-lab navigation grouping and active states. Security, Connections, and Notifications remain Profile subtasks rather than independent sidebar entries.
- Preserve each screen's information order, header density, controls, tabs, tables/record layouts, drawers/dialogs, empty/error surfaces, and distinctive route visualization.
- Use continuous bordered surfaces, restrained separators, stable table geometry, and the approved radius scale. Do not reintroduce old nested panels or metric-card grids.
- At mobile widths, use the exact design-lab reflow, overlay, and bottom-navigation behavior rather than compressing desktop tables.

## 3. Shared shell task

1. Make the design-lab Console shell the single authenticated shell used by all Console page families.
2. Preserve lazy leaf routes, loading/error recovery, locale, complete path/search state, focus restoration, and administrator routing.
3. Map account summary values from the authenticated user and query data; never retain design sample numbers.
4. Keep the shell stable while leaf routes load or fail.
5. Retain route-level bundle splitting and current bundle budgets.
6. Remove old Console shell/styles only after Overview, Analytics, Keys, Logs, Wallet, Profile, Playground, and Studio have adopted the new shell.

## 4. Overview

### API inputs

| Need | Source |
| --- | --- |
| Account quota/usage/group | current user/session and self data |
| Service/version/config | `GET /api/status` |
| Key readiness | `GET /api/token/?p=&size=` |
| Recent account events | `GET /api/log/self` |
| Usage summary | `GET /api/log/self/stat` and/or self quota data as validated |
| Model/pricing readiness | `GET /api/pricing`, user model/group endpoints |

### Subtasks

1. Reproduce the design-lab readiness hierarchy, quick actions, service route, metric strip, recent usage, and request path exactly.
2. Derive readiness from validated API facts; do not infer success from nonempty sample data.
3. Keep independently useful sections visible when another contract is partial or unavailable.
4. Link actions to real localized routes and preserve the user's current locale.
5. Cover initial loading, no keys, no activity, partial status, pricing unavailable, logs unavailable, offline refresh, and session expiry.

## 5. Analytics

### API inputs

| Need | Source |
| --- | --- |
| Time-series usage | `GET /api/data/self` |
| Key/model flow | `GET /api/data/flow/self` |
| Optional performance | New API performance endpoints when user-visible and permitted |

### Subtasks

1. Preserve design-lab period, granularity, and measure controls plus Trend, Models, and Routes views.
2. Normalize timestamps, quota, token, request, model, group, and key dimensions in the API adapter.
3. Feature-detect success/latency/performance dimensions; unavailable is not zero.
4. Provide the approved accessible data-detail surface for every visualization.
5. Keep export actions aligned with only validated aggregate rows.
6. Cancel obsolete filtered requests and prevent stale results from replacing current filters.
7. Preserve usable current data when comparison periods or flow data fail.

## 6. API keys

### API inputs

Use the existing API client contracts for list/search/detail, create, update, status-only update, delete, batch delete, group/model options, and explicit single-key reveal.

### Subtasks

1. Reproduce the approved design-lab search, filters, column menu, table/record layout, selection, create/edit surface, status action, reveal, copy, and delete confirmation.
2. Preserve all validated key fields: name, state, expiry, remaining/unlimited quota, used quota, group, model restrictions, IP restrictions, creation, and last use.
3. Keep the full secret hidden by default. Reveal only after explicit confirmation and clear it when the surface closes, route changes, session changes, or timeout policy expires.
4. Never store or log the revealed secret, and never include it in query keys, error copy, analytics, screenshots, or browser history.
5. Preserve server-authoritative group/model options and existing restrictions when optional option queries fail.
6. Prevent duplicate mutations and perform one targeted invalidation/refetch.
7. Preserve current cancellation, stale-search, owner-scope, `401`, and feature-local `403` behavior.

## 7. Usage logs

### API inputs

Use `GET /api/log/self`, `GET /api/log/self/stat`, and the validated search behavior. Treat the stream as mixed API consumption, login, system, error, and other account events.

### Subtasks

1. Reproduce the design-lab search kind, type/model/time/group/key filters, summary, list, responsive records, details drawer, and export menu.
2. Do not assume every record contains model, tokens, cost, latency, key, or request IDs.
3. Redact raw metadata and sensitive fields at the adapter boundary before a record reaches the view.
4. Preserve filter/search parameters where the production route contract supports them.
5. Keep list and stats failures independent, retain usable results, and explain unsupported filtered statistics truthfully.
6. Cancel obsolete filter requests and prevent stale pages from replacing active results.
7. Add real export only for safe, available fields or retain the design-lab disabled state with accurate localized wording.

## 8. i18n and formatting

- Merge approved Console copy into all seven permanent locale resources.
- Use locale-aware date, time, integer, decimal, currency, token, and quota formatters without changing server values.
- Preserve technical identifiers in a selectable monospace treatment with safe wrapping.
- Keep status text and icons; never encode state by color alone.
- Validate filter controls, tables, summaries, dialogs, drawers, and errors in the longest locales.

## 9. File ownership and cleanup

Expected production areas:

```text
apps/web/src/components/console-shell.tsx
apps/web/src/components/console-route-state.tsx
apps/web/src/pages/console-overview-page.tsx
apps/web/src/pages/console-analytics-page.tsx
apps/web/src/pages/console-keys-page.tsx
apps/web/src/pages/console-usage-logs-page.tsx
apps/web/src/features/console-data/*
apps/web/src/lib/console-query.ts
apps/web/src/lib/console-usage-contract.ts
packages/api-client/src/*
packages/i18n/src/*
packages/design-system/src/*
```

Remove replaced Console shell/page markup, duplicate normalization helpers, dead compatibility presentation, and obsolete CSS after all canonical Console routes pass. Keep documented compatibility redirects unless separately approved for removal.

## 10. Acceptance

- All four canonical routes exactly follow their active design-lab compositions at the required viewports and themes.
- Initial, empty, partial, error, offline, stale-request, `401`, `403`, and mutation states preserve layout and truthful data.
- Owner/self scopes remain enforced; no sensitive payload or secret leaks into UI or storage.
- Tables and detail surfaces are keyboard operable, named, focus-managed, and usable at 320px without page overflow.
- Analytics visualizations have accessible underlying data.
- Seven locales pass completeness and long-copy visual checks.
- Existing concurrency, lazy-route, deep-link, bundle, contract, and E2E protections remain green.
- Old Console presentation code is removed after the canonical cutover.
