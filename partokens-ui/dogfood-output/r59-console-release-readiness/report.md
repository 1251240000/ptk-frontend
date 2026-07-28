# R59 Canonical Console Release Readiness

| Field | Result |
| --- | --- |
| Date | 2026-07-28 |
| Scope | Local development and testing only |
| Canonical surface | `/$locale/console/*` |
| Deployment | Not executed |
| Decision | **PASSED** |

## Result

R59 is complete. The Canonical Console shell and its Overview, Analytics, API Keys, and Usage Logs pages now use complete seven-locale UI copy, route chunks have automated raw and gzip budgets, lazy-route loading and retry states preserve navigation context, and Console reads consistently support cancellation. Refresh and mutation invalidation now cancel stale work, merge equivalent operations, and avoid duplicate refetches.

The final local suite passes with no open release-readiness findings. R55-R58 authentication, authorization, owner/self scope, canonical routing, and sensitive-data contracts remain covered and passing.

No staging or production deployment, release rollout, real-user acceptance, dual-account validation, or administrator acceptance was performed. Browser tests used fictional local fixtures only.

## Localization

- Migrated visible hard-coded English from the Console shell and all four Canonical Console pages to the shared i18n resources.
- Added 228 Console translation keys for `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi`.
- Kept exact key parity across all seven dictionaries without restoring Legacy Console translation keys.
- Added static coverage that rejects missing values and detects full English-sentence fallback in non-English Console resources.
- Chromium visited every one of the four canonical pages in every locale, verified localized headings, descriptions, main-region names, and the document `lang`, and rejected the corresponding English description on non-English pages.
- Localized page loading, chunk failure, retry, refresh success/failure, filters, actions, dialogs, empty states, partial states, contract failures, and accessibility labels.

## Bundle Budgets

`apps/web/bundle-budgets.json` is enforced by the Web production build. The checker reads the generated manifest, measures both raw and gzip bytes, and fails if a named Console route is absent, duplicated, over budget, or included in the initial JavaScript graph.

| Asset | Final raw | Raw budget | Final gzip | Gzip budget |
| --- | ---: | ---: | ---: | ---: |
| Entry | 396,186 B | 425,000 B | 116,084 B | 125,000 B |
| Initial JavaScript | 1,090,905 B | 1,160,000 B | 330,111 B | 350,000 B |
| Overview | 29,420 B | 40,000 B | 8,023 B | 11,000 B |
| Analytics | 35,380 B | 48,000 B | 9,159 B | 13,000 B |
| API Keys | 40,871 B | 58,000 B | 12,153 B | 16,000 B |
| Usage Logs | 26,115 B | 36,000 B | 8,089 B | 11,000 B |

All four Canonical Console page chunks are independently named asynchronous assets and remain outside the initial bundle.

## Lazy Route Recovery

All Canonical Console leaves share one pending and error contract:

- A localized `role="status"` loading surface announces route loading and reserves stable page geometry.
- A localized `role="alert"` failure surface provides a direct retry action.
- Retry records the complete pathname and search string in session storage before reloading the same route.
- The Console shell consumes the retry marker only for the matching location and restores focus to the localized main region after the page loads.
- Locale, deep-link route, search parameters, authentication restoration, browser history, and return paths remain intact.
- Reduced-motion mode collapses Console animations to one near-zero-duration frame.

Chromium deliberately failed the Analytics chunk, observed both pending and error states, retried, and verified the original French locale, search string, page content, and main focus.

## Request Concurrency And Offline Behavior

- Console API reads now accept and forward React Query's `AbortSignal` through the shared API client.
- Filter changes use distinct stable query keys, allowing obsolete reads to be aborted instead of updating the active result.
- `refreshConsoleQueries` cancels active matching reads before one error-propagating refetch and merges simultaneous refreshes for the same key.
- `invalidateConsoleQueries` deduplicates query roots, cancels their active reads, performs one active invalidation per root, and merges equivalent concurrent invalidations.
- API Key mutations no longer perform duplicate success/settled invalidation.
- Browser-offline refresh fails immediately instead of treating React Query's paused request as a successful refresh; cached page data stays visible and a later online refresh recovers normally.
- Analytics and Usage Logs refresh actions surface localized failure feedback instead of leaking rejected promises.

Regression coverage delays an obsolete API Key search until after a newer result, verifies that the old response cannot overwrite current state, and confirms one list refetch for a key mutation.

## Navigation, Failure, And Contract Coverage

| Area | Final coverage |
| --- | --- |
| History and deep links | Locale, route, and search survive direct entry, back, forward, full refresh, and lazy retry. |
| Slow and cancelled reads | Delayed stale filters cannot replace the latest state; active refresh and invalidation cancel prior work. |
| Offline recovery | Failed refresh keeps cached content, reports failure, and succeeds after connectivity returns. |
| Local failures | Loading, empty, partial, contract, 401, 403, and availability states remain isolated to the correct surface. |
| Authentication | Session restoration, localized sign-in return paths, one 401 refresh/retry, and administrator routing remain intact. |
| Authorization and scope | Owner token routes and self-scoped analytics/log routes remain enforced; feature-local 403 responses do not refresh the session. |
| Sensitive data | Key secrets, bearer values, credential-shaped filters, raw log metadata, and backend payloads remain excluded from UI/storage. |

## Responsive And Accessibility Review

- Rechecked the Canonical Console shell and all four pages at 320px, 390px, and 1440px in light and dark themes.
- API Key filters now stack to one column at 320px and return to two columns from 360px, eliminating the narrow-screen collision.
- Verified no horizontal page overflow in the responsive Chromium assertions.
- Verified visible-order keyboard traversal, named controls, sidebar Escape/navigation focus restoration, page dialog/sheet focus restoration, and lazy-retry main focus.
- Loading and data states retain polite live-region announcements; route failures use an alert.
- Reviewed text, muted text, controls, focus rings, status colors, and destructive states against their light/dark surfaces; no contrast blocker was found.
- Verified `prefers-reduced-motion: reduce` for the Console animation utility.

Representative evidence is in `screenshots/`, including:

- `overview-production-light-320.png`
- `keys-production-light-320.png`
- `shell-production-mobile-navigation-390.png`
- `analytics-production-dark-1440.png`
- `logs-production-light-1440.png`

## Automated Verification

| Command | Final result |
| --- | --- |
| `bun run typecheck` | Passed: Web and Docs; 98 localized documentation pages generated, 0 updated. |
| `bun run test` | Passed: Web 13 files / 100 tests; Docs 1 file / 3 tests. |
| `bun run build` | Passed: Web production build, Console bundle budgets, and Docs production build with 102 static pages. |
| `bun run test:e2e` | **Passed: Chromium 105/105, 1 worker, 0 retry, approximately 3.5 minutes.** |
| `git diff --check` | Passed. |

The Docs build emitted an informational warning that `baseline-browser-mapping` data is more than two months old; compilation, TypeScript validation, and static generation all completed successfully.

## Gate

**Canonical Console Release Readiness: PASSED.** Seven-locale copy is complete, bundle separation has automatic regression limits, lazy loading and retry preserve user context, stale and duplicate request paths are controlled, responsive/accessibility checks pass, and the complete local validation suite is green. Deployment and real-user role acceptance remain intentionally out of scope.
