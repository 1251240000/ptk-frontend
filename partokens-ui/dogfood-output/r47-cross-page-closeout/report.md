# R4.7 Cross-Page Closeout Report

| Field | Value |
| --- | --- |
| Date | 2026-08-07 |
| Branch | `dev` |
| Production target | `apps/web` |
| Design authority | active `apps/design-lab` imports |
| Upstream references | read-only `new-api`, `new-api-docs-v1` |
| Route inventory | 29 entries in `route-matrix.json` |

## Outcome

This pass fixed one persisted-data loss race in Image Studio, consolidated the duplicated OAuth/registration transient-state implementation, and updated the authentication visual contract to the currently active design-lab image element. No upstream reference file was edited.

R4.7 is not marked complete. The automated functional, locale, bundle, and existing Console visual matrices pass after the fixes, but a new paired design-lab/production screenshot matrix is still incomplete for several Public, Authentication, Account, Playground, and Studio states listed in `route-matrix.json`.

## Fixed Findings

### R47-001: Studio result could disappear after reload

- Severity: high
- Cause: the debounced prompt/settings write captured a pre-generation project and could overwrite the newer generation transaction after it had persisted result nodes and assets.
- Fix: the delayed write now reads `projectRef.current` when it executes, so it cannot write an obsolete project snapshot over a completed generation.
- Proof: the focused Image Studio E2E generates a Blob-backed result, verifies no credential persistence, reloads, restores the result from IndexedDB, and requires a new in-memory key unlock.

### R47-002: OAuth callback used a different state format than its contract tests

- Severity: medium
- Cause: `auth-flow.ts` stored one structured session object while runtime `oauth.ts` and `auth-utils.ts` still used distributed legacy keys.
- Fix: runtime now uses `auth-flow.ts`; the duplicate `oauth.ts` was removed. A one-release reader migrates old login/bind keys, and registration email/cooldown uses the existing structured context with legacy migration. Passwords, codes, bearer tokens, and provider credentials remain excluded.
- Proof: structured callback visual test, legacy-key callback E2E, popup-origin/state unit tests, and locale/return-path tests pass.

### R47-003: Authentication visual test asserted a retired asset mechanism

- Severity: low
- Cause: the test inspected `background-image` for old homepage AVIF assets although both production and active design-lab render `/auth/auth-routing-{theme}.jpg` as `.r32-auth-rail-background`.
- Fix: the contract now checks the current image path, responsive visibility, completed load, and natural image width in both applications.

## API And Local Data Boundaries

| Area | Server authority | Browser-local boundary |
| --- | --- | --- |
| Auth | status, login, 2FA, OAuth state/exchange, reset, current user | registration email/cooldown and OAuth state/locale/return path in session storage only |
| Console data | self-scoped usage, analytics, tokens, logs | transient filters and non-sensitive preferences only |
| Account | self, billing, subscriptions, security, bindings, notification settings | transient confirmation values only |
| Playground | groups/models and `/pg/chat/completions` | conversations/messages/parameters in IndexedDB by `ownerNamespace` |
| Studio | groups/models, token list/reveal, image generation/edit | projects, nodes, settings, and retained image Blobs in IndexedDB by `ownerNamespace`; revealed key in module memory only |

Contract decisions retained from the executable New API behavior:

- Playground uses session-authenticated `/pg/chat/completions`; it never creates or reveals an API key.
- Studio has no `/pg/images/*` contract. It explicitly reveals one selected key and sends it only as an in-memory Bearer credential to the compatible image endpoint.
- Pricing metadata remains advisory and does not suppress a model returned by authenticated model availability.
- Wallet preset amounts and payable values remain server-authored; no client default amount is introduced.

## I18n And Accessibility

- Required locales: `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, `vi`.
- Static translation-key enumeration, dictionary parity, and Account/Playground/Studio non-English fallback checks pass.
- The seven-locale canonical Console E2E passes.
- French 320px Public and Auth captures have no page-level horizontal overflow.
- Account task tabs, mobile sheets, OAuth callback state, Console overlays, and Studio credential dialog have focused keyboard/focus-restoration coverage.

## Sensitive Data Audit

- Studio generation E2E scans localStorage, sessionStorage, and every IndexedDB store and finds no revealed key.
- Notification tests prove redacted secrets remain absent from form values and unchanged payloads.
- API key tests cover reveal expiry and prevent secret retention in filters, URLs, or persisted stores.
- OAuth and registration migration stores contain only intent, provider, state, locale, return path, email, and cooldown timestamp.

## Cleanup

Removed:

- `apps/web/src/features/auth/oauth.ts`, replaced by the canonical structured `auth-flow.ts` implementation.
- Duplicate OAuth and registration storage helpers from `auth-utils.ts`.

Retained intentionally:

- One-release legacy OAuth and registration key readers, because an in-flight callback or registration may cross a deployment.
- Localized `console-security`, `console-connections`, and `console-notifications` redirects.
- Existing IndexedDB schema and owner namespaces.

Eight `apps/design-lab/src/* 2.tsx` files have no import/reference match in design-lab, Web, or shared packages. They were not deleted because the R4 specification requires an exact proposal and product-owner decision before removing design-lab evidence:

- `shadcn-connections-screen 2.tsx`
- `shadcn-image-studio-screen 2.tsx`
- `shadcn-notifications-screen 2.tsx`
- `shadcn-overview-screen 2.tsx`
- `shadcn-playground-screen 2.tsx`
- `shadcn-profile-screen 2.tsx`
- `shadcn-security-screen 2.tsx`
- `shadcn-wallet-screen 2.tsx`

## Verification

Final verification after the fixes:

- Workspace typecheck: passed.
- Workspace unit/contract tests: Web 142/142, Docs 3/3, and release contract 5/5 passed.
- Web production build and Console bundle budgets: passed.
- Docs production build: 102 static pages generated; passed with an existing stale `baseline-browser-mapping` warning.
- Focused Account/Playground/Studio E2E: 14/14 passed.
- Post-fix focused Auth/OAuth/Studio E2E: 4/4 passed.
- Final full Chromium E2E: 164/164 passed.
- `agent-browser` Public/Auth exploratory pass: no console/page errors and no 320px horizontal overflow.
- `route-matrix.json`: valid JSON with 29 route/flow entries.
- `git diff --check`: passed.

The earlier full E2E run exposed R47-001 through R47-003; the final full run passed after those fixes.

## Remaining Risks

- Paired visual evidence is complete for Console and the sign-in baseline, but not yet for every Public/Authentication/Account/Playground/Studio route, theme, viewport, and state combination required by the R4.7 specification.
- Real staging OAuth, payment, WebAuthn, key reveal, and provider image-generation acceptance still requires isolated test identities and deployment configuration.
- The retained legacy transient-key migration should be removed only after the supported deployment window closes.
