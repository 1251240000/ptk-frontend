# R4.7 cross-page i18n, API, QA, and cleanup

Depends on: R4.1 through R4.6
Purpose: prove the integrated application preserves the approved design, production contracts, security boundaries, and maintainability after old-code removal

## 1. Integration inventory

Create a machine-reviewable route matrix covering every included route, its design-lab source, production component, auth requirement, API/local data dependencies, locale ownership, screenshots, E2E scenarios, and cleanup status.

Required route families:

- Public/content: 9 pages.
- Authentication: 7 flows.
- Console data: 4 pages.
- Account: Wallet plus 4 Profile tasks.
- Playground: list/empty and conversation detail.
- Image Studio: project list/empty and project detail.

The `#system` design showcase and unimported duplicate files remain outside product-route counts.

## 2. Visual parity gate

### 2.1 Comparison matrix

For each route family, capture paired design-lab and production screenshots with the same:

- Viewport: `1440x900`, `1024x768`, `768x900`, `390x844`, `320x720`.
- Theme: light and dark.
- Locale: baseline English or Simplified Chinese plus targeted long-copy captures.
- State: default success plus family-specific loading, empty, error, overlay, and mobile-navigation states.

Compare page composition, bounding geometry, spacing, typography, control size, colors/tokens, borders/radii, responsive ordering, overlays, and content fit. Pixel differences caused only by real dynamic data must still preserve the same structural geometry and hierarchy.

### 2.2 Deviation process

Do not silently accept a mismatch. Record:

```text
Route/state/viewport:
Design-lab behavior:
Production constraint:
Smallest proposed adjustment:
Security/accessibility/API reason:
Before/after evidence:
Product-owner decision:
```

Unapproved material deviations block the route from completion.

## 3. i18n completion gate

Required locales: `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, `vi`.

1. Enumerate every runtime translation key used by Web and shared design-system/product components.
2. Fail tests for missing locale keys, empty required values, or accidental English fallback.
3. Detect visible hard-coded interface strings while allowing reviewed technical/user content.
4. Verify routes, `document.lang`, language preference, and server language mutation behavior.
5. Run full-page long-copy checks for Russian, French, Japanese, Vietnamese, and both Chinese variants.
6. Check labels, buttons, menus, tabs, toasts, errors, placeholders, validation, loading/empty states, dialogs, drawers, tooltips, table headings, chart detail, and accessibility names.
7. Keep legal/content review metadata and do not promote draft legal translations to approved.

No required page is complete while it relies on fallback copy.

## 4. API contract gate

### 4.1 Reference procedure

For every new or changed API adapter:

1. Inspect the corresponding New API route registration.
2. Inspect controller/service/DTO behavior and current New API frontend usage.
3. Cross-check generated `new-api-docs-v1` material.
4. Record discrepancies and follow executable backend/current-frontend behavior when docs are incomplete.
5. Add sanitized fixtures and contract tests without modifying either reference project.

### 4.2 Required behavior

- Same-origin credentials and existing auth headers/runtime.
- Response validation and normalization before page rendering.
- Optional/unknown field tolerance without invented values.
- AbortSignal propagation for replaceable reads.
- Stable React Query keys, targeted cancellation, and single invalidation/refetch.
- Cached-data retention on refresh/offline failures.
- One controlled authentication refresh for eligible `401` responses.
- Feature-local `403` isolation.
- Redaction of credentials, secrets, internal IDs, raw metadata, and sensitive payloads.
- Explicit pending/success/error state for every mutation.

## 5. Cross-page workflow E2E

At minimum, automate:

1. Anonymous localized public navigation, theme/language switching, notices/status/legal/docs deep links.
2. Sign-in return path, registration flags, email verification, recovery, OAuth callback, 2FA, session refresh, ordinary/admin routing, and logout.
3. Console deep links, lazy route recovery, back/forward, search/filter persistence, offline refresh, `401`, and feature-local `403`.
4. API key create/edit/disable/reveal/copy/delete with secret non-persistence.
5. Usage/analytics filters, stale-request cancellation, details, partial contracts, and safe exports.
6. Wallet presets, server calculation, payment confirmation, redemption, subscriptions, affiliate transfer, and empty/disabled capabilities.
7. Profile save, email binding, check-in, password, 2FA, Passkey, system token, OAuth binding, notification settings, and account-delete confirmation.
8. Playground local namespace isolation, streaming/stop/retry, refresh interruption, import/export, and sign-in expiry.
9. Studio namespace isolation, project migration, key reveal/clear, generation/edit, URL/base64 result retention, cancel/retry, asset/import validation, and sign-out clearing.

Use sanitized mocks/fixtures for destructive, payment, OAuth, security, and provider operations unless an isolated staging environment and dedicated test identities are explicitly provided.

## 6. Accessibility and responsive gate

- One logical heading structure and main landmark per route.
- Visible focus, predictable tab order, and no keyboard traps outside active modal/sheet behavior.
- Initial focus, focus containment, safe Escape, background inert/scroll lock, and focus restoration for overlays.
- Named icon controls and useful tooltips for unfamiliar tools.
- Form labels, descriptions, errors, autocomplete, input modes, and switch/radio/tab semantics.
- Non-color status indicators and sufficient text/control/focus contrast in both themes.
- Live-region behavior that announces meaningful changes without streaming spam.
- Reduced-motion behavior for page reveals, route transitions, canvas motion, charts, and overlays.
- No page-level horizontal overflow or incoherent overlap at any required viewport/locale.
- Stable dimensions for tables, toolbars, counters, canvas nodes, composer, loading states, and dynamic labels.

## 7. Performance and release gate

1. Preserve lazy Console leaf chunks and enforce reviewed raw/gzip budgets.
2. Avoid loading Studio/Playground heavy dependencies on public/auth routes.
3. Verify image asset formats, dimensions, theme pairing, fallback, and layout-shift behavior.
4. Check public first-load behavior, route transitions, long Console sessions, object URL cleanup, and IndexedDB write pressure.
5. Run typecheck, unit/contract tests, E2E, production build, bundle checks, compatibility checks, and release packaging checks applicable to the repository.
6. Review browser console, page errors, failed network calls, source-map policy, route ownership, and security headers in the packaged build.

This task does not authorize staging or production deployment. Real staging acceptance remains a separate gate requiring an isolated environment and dedicated roles.

## 8. Old-code and duplicate cleanup

Perform cleanup only after all canonical routes pass their page-family gates.

1. Use imports, route registration, tests, and production bundles to prove replaced files/rules are unused.
2. Remove old `apps/web` page implementations, visual wrappers, duplicate feature helpers, obsolete global CSS blocks, sample-only state branches, and temporary migration code that is no longer required.
3. Preserve explicit data migrations needed by existing browser data until the supported migration window ends.
4. Preserve localized compatibility redirects with documented external use.
5. Audit unimported design-lab duplicate files such as `shadcn-* 2.tsx`. Propose exact deletion targets with proof before deleting them; keep the active design-lab reference intact.
6. Run `rg` checks for `legacy`, `old`, `v2`, `redesign`, temporary feature flags, dead translation keys, duplicate CSS selectors, and unused API wrappers. Review findings rather than deleting by name alone.
7. Do not remove historical planning or dogfood evidence as part of code cleanup.

## 9. Final evidence package

Store new implementation evidence in a new, clearly dated/task-named directory under `partokens-ui/dogfood-output`; do not overwrite R1-R60 evidence.

Include:

- Route and contract matrix.
- Paired design-lab/production screenshots.
- Locale completeness result.
- API contract discrepancies and resolutions.
- Automated command results.
- Accessibility/responsive findings.
- Sensitive-data audit.
- Removed files/rules and retained compatibility items.
- Known risks, approved deviations, and remaining staging-only checks.

## 10. Final definition of done

- Every included production route strictly follows the active design-lab design and has no unapproved material deviation.
- All server-supported interactions use New API-compatible adapters; confirmed local-only data stays local.
- Seven locales are complete without fallback-dependent completion.
- Authentication, authorization, billing, key, security, and local data boundaries remain intact.
- Required visual, state, responsive, accessibility, contract, bundle, and E2E matrices pass.
- Replaced production code is deleted, no runtime old/new implementation fork remains, and upstream reference projects have no changes.
