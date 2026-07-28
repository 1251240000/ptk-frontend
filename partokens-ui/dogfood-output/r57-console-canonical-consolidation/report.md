# R57 Canonical Console Consolidation

| Field | Result |
| --- | --- |
| Date | 2026-07-28 |
| Scope | Local development and testing only |
| Canonical surface | `/$locale/console/*` |
| Compatibility surface | `/$locale/console-foundation/*` redirects only |
| Deployment | Not executed |
| Decision | **PASSED** |

## Result

R57 is complete. The production Console shell, Overview, Analytics, API Keys, Usage Logs, their unit coverage, and their Chromium coverage now use canonical Console names. The previous Legacy Console shell and the unconsumed old Overview, Analytics, Keys, and Logs implementations were removed.

The `console-foundation` surface remains only as a compatibility route. It replace-navigates to the matching canonical route while preserving locale and search parameters. No user-visible link or primary test flow points to the compatibility surface.

No staging or production requests, account validation, resource mutations outside local fixtures, release packaging, or deployment actions were performed.

## Canonical Modules

| Responsibility | Canonical module |
| --- | --- |
| Shell | `apps/web/src/components/console-shell.tsx` |
| Overview | `apps/web/src/pages/console-overview-page.tsx` |
| Analytics | `apps/web/src/pages/console-analytics-page.tsx` |
| API Keys | `apps/web/src/pages/console-keys-page.tsx` |
| Usage Logs | `apps/web/src/pages/console-usage-logs-page.tsx` |
| Functional E2E | `apps/web/e2e/console.spec.ts` |
| Visual/state E2E | `apps/web/e2e/console-visual.spec.ts` |

The active shell uses the canonical `console-root` / `console-portal` style scope, canonical query keys, and canonical component exports. Old Foundation file names, component names, test descriptions, CSS scopes, form ids, and main-path query keys were removed.

## Safe Cleanup

The following unconsumed implementations were removed after checking the router/import graph:

- `apps/web/src/components/console-shell.tsx` Legacy implementation, replaced in place by the canonical shell.
- `apps/web/src/pages/analytics-page.tsx`.
- `apps/web/src/pages/console-pages.tsx`, including the old Overview, Analytics, Keys, and Usage Logs exports.
- The former `console-foundation-*` production module and test names after their canonical replacements were established.
- Redundant Foundation source and E2E copies with a ` 2` filename suffix, which otherwise remained visible to source scanning.

Wallet and Profile remain in their dedicated canonical page modules. Shared styles still used by those pages were retained.

## Central Route Map

`apps/web/src/lib/routes.ts` now owns the Console base, compatibility base, canonical segment, canonical route template, localized path, active-page resolution, and compatibility segment.

| Page key | Canonical route | Compatibility entry |
| --- | --- | --- |
| `overview` | `/$locale/console/overview` | `/$locale/console-foundation` and `/overview` |
| `analytics` | `/$locale/console/analytics` | `/$locale/console-foundation/analytics` |
| `keys` | `/$locale/console/keys` | `/$locale/console-foundation/keys` |
| `usageLogs` | `/$locale/console/usage-logs` | `/$locale/console-foundation/logs` |

Playground, Studio, Wallet, and Profile use the same map for shell navigation and internal links. The `logs` to `usage-logs` translation exists only as compatibility metadata in this map; runtime navigation uses the semantic `usageLogs` key.

## Contract Preservation

| Contract | Verification |
| --- | --- |
| Anonymous direct access | Localized sign-in receives the full canonical return path |
| Password, OAuth, and 2FA | Ordinary users default to canonical Overview |
| Refresh recovery | Direct visits and child queries retain the R55 single-refresh behavior |
| Administrator role | Role `>= 10` still exits to `/channels` |
| HTTP 401 | Refresh and retry remain active; invalid sessions return to sign-in |
| HTTP 403 | Remains feature-local and does not trigger refresh |
| Owner/self scope | Keys use owner token APIs; analytics and logs use self-scoped APIs |
| Sensitive data | Key and log response secrets are neither rendered nor persisted |

## Automated Verification

| Command | Final result |
| --- | --- |
| `bun run typecheck` | Passed: Web and Docs; 98 localized docs pages generated, 0 updated |
| `bun run test` | Passed: Web 11 files / 88 tests; Docs 1 file / 3 tests |
| `bun run build` | Passed: Web production bundle and Docs build; 102 static docs pages |
| `bun run test:e2e` | **Passed: Chromium 96/96, 1 worker, 0 retry, 2.7 minutes** |

The i18n source-volume guard was recalibrated from 600 to 500 literal keys after removing the duplicate Legacy pages. The meaningful checks remain unchanged: every literal key must exist in every locale, and all seven dictionaries must retain exact key parity.

Chromium coverage includes canonical direct access and reload, all compatibility redirects with locale/search retention, all seven authentication locales, 1440/390/320 layouts, light/dark themes, mobile Escape/navigation focus restoration, keyboard overlays, loading/empty/partial/contract states, API key lifecycle, Usage Logs redaction, Playground/Studio workflows, 401 refresh, 403 isolation, owner scope, administrator routing, and sensitive-data persistence checks.

R57 screenshots were written to `dogfood-output/r57-console-canonical-consolidation/screenshots/`.

## Gate

**Canonical Console Consolidation: PASSED.** Canonical naming and route ownership are unified, the old Console implementations are removed, compatibility redirects remain intact, R55/R56 authentication and data-safety contracts show no regression, and the complete requested local validation matrix passes. Production deployment remains out of scope and was not executed.
