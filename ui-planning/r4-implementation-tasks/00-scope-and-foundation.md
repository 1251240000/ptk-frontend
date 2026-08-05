# R4 implementation scope and foundation

Status: confirmed task specification
Target: `partokens-ui/apps/web`
Visual source of truth: `partokens-ui/apps/design-lab`
API references: read-only `new-api` and `new-api-docs-v1`

## 1. Objective

Move every approved user-facing design-lab page family into the production Web application while preserving the design-lab composition, visual language, responsive behavior, light/dark themes, and interaction hierarchy. Replace design-only data with existing production API contracts or explicitly local data without redesigning the page around the old Web implementation.

This is a presentation-layer rebuild with contract integration. It is not a new visual exploration and it does not authorize changes to either upstream reference project.

## 2. Non-negotiable boundaries

1. The active files imported by `apps/design-lab/src/App.tsx` are the visual and layout authority.
2. Do not reinterpret, simplify, modernize, or restyle an approved design-lab page.
3. Any necessary deviation must be documented with the affected viewport/state, technical reason, proposed smallest adjustment, and visual evidence, then approved by the product owner before implementation.
4. Do not modify `new-api/` or `new-api-docs-v1/`. Use their routes, DTOs, controller behavior, frontend usage, and generated documentation only as contract references.
5. Keep New API authoritative for authentication, authorization, roles, model access, quota, billing, payments, logs, and upstream results.
6. Keep repository-owned homepage, About, notices, legal, and documentation content independent from New API HTML content endpoints.
7. Do not persist passwords, verification codes, OAuth credentials, revealed API keys, bearer tokens, or raw sensitive responses.
8. Roles `>= 10` continue to hard-navigate to the native New API management UI. Ordinary users remain in localized standalone routes.
9. Existing production behavior may be reused only when it conforms to the design-lab layout and the current contract. Existing Web visuals are not an alternative design source.

## 3. Included page families

| Task | Family | Included surfaces |
| --- | --- | --- |
| R4.1 | Public and content | Home, models, docs, About, notices, service status, User Agreement, Terms of Service, Privacy Policy |
| R4.2 | Authentication | Sign in, sign up, email verification, forgot password, reset password, OAuth callback, 2FA |
| R4.3 | Console data | Overview, analytics, API keys, usage logs |
| R4.4 | Account | Wallet, profile, security, connections, notifications |
| R4.5 | Playground | Local conversation rail, conversation workspace, parameters, streaming, local data management |
| R4.6 | Image Studio | Local projects, node canvas, credential selection, generation/editing, result persistence |
| R4.7 | Cross-page closeout | i18n, state coverage, accessibility, responsive visual parity, contract tests, cleanup |

The design-system showcase at `#system`, files not imported by the live design-lab application, and duplicate `shadcn-* 2.tsx` files are not product pages.

## 4. Canonical source map

Before changing a page family, record the exact design-lab source files, current production files, route entry, API client functions, shared stores, and tests. At minimum, use:

- Design tokens and primitives: `packages/design-system` and `apps/design-lab/src/design-lab-theme.css`.
- Public/auth sources: `public-prototype.tsx`, `public-prototype.css`, `public-home-copy.ts`, `auth-prototype.tsx`, and `auth-prototype.css`.
- Console shell: `shadcn-console-shell.tsx` and `shadcn-admin.css`.
- Approved console screens: active `shadcn-*-screen.tsx` files imported by `App.tsx`.
- Prototype workflow contracts: `console-*-copy.ts`, `console-*-store.ts`, and the R3 planning documents.
- Production routes: `apps/web/src/router.tsx` and `apps/web/src/lib/routes.ts`.
- API boundary: `packages/api-client/src/index.ts` and `ui-planning/04-api-contracts.md`.
- Local data boundaries: `apps/web/src/db.ts`, `packages/studio`, and existing Playground/Studio contract tests.

## 5. Implementation architecture

### 5.1 Page-family ownership

Use permanent semantic folders when a current monolithic page would otherwise mix route composition, API adaptation, dialogs, and complex state. Do not create an `r4`, `new`, `v2`, or `redesign` runtime namespace.

Recommended shape:

```text
apps/web/src/pages/<route-entry>.tsx
apps/web/src/features/public/*
apps/web/src/features/auth/*
apps/web/src/features/console-data/*
apps/web/src/features/account/*
apps/web/src/features/playground/*
apps/web/src/features/studio/*
```

Route entries should remain small. Shared visual primitives belong in `packages/design-system` only when they express a stable cross-family primitive already present in design-lab. Business-specific components stay inside their feature.

### 5.2 Data flow

```text
Route -> page-family query/mutation hook -> @partokens/api-client -> New API
      -> local repository/store when the confirmed contract is browser-local
```

- Pages must not call raw Axios or construct upstream URLs directly.
- Validate critical response shapes at the adapter boundary.
- Use React Query cancellation signals for filterable or replaceable reads.
- Keep stable query keys and invalidate only affected roots after mutations.
- Preserve usable cached data when refresh fails.
- Convert API failures into localized, actionable page states without exposing raw payloads.

### 5.3 Visual fidelity

Fidelity includes DOM composition, information order, container widths, grid tracks, spacing, typography roles, surface treatment, borders, radii, shadows, icons, color roles, control sizes, overlays, responsive reflow, and motion. A page is not visually complete merely because it uses the same tokens.

Production data may change text length, row count, availability, and status. Adapt content within the approved containers. Do not solve fit problems by shrinking fonts, truncating required information, changing the page hierarchy, or adding nested cards.

### 5.4 Internationalization

All visible interface copy must support `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi` through the existing `@partokens/i18n` and content packages.

- Use stable English source keys for interface copy.
- Do not use translated text as React keys or business identifiers.
- Technical identifiers, endpoint paths, model names, provider names, code, and user data remain untranslated where appropriate.
- Long translations must wrap naturally without changing control dimensions or causing page overflow.
- English fallback is not completion for any required locale.

## 6. Old-code cleanup and cutover

Each page-family task must end with one canonical production implementation.

1. Build the replacement within the semantic page-family boundary.
2. Keep the existing route active until API, visual, responsive, and accessibility acceptance passes.
3. Switch the canonical route once, without a runtime feature flag unless a deployment requirement is separately approved.
4. Delete replaced page components, obsolete visual wrappers, duplicated CSS rules, dead imports, unused test fixtures, and temporary adapters.
5. Preserve only compatibility redirects that have a documented external route requirement.
6. Do not delete active design-lab reference files during page implementation.
7. In R4.7, prove that duplicate design-lab `* 2.tsx` files and other legacy variants are unreferenced before proposing their deletion.

No cleanup task may remove user-created IndexedDB data, authentication state, release evidence, or compatibility behavior without a migration and explicit approval.

## 7. Required states for every server-backed surface

- Initial loading with stable geometry.
- Success with representative short and long data.
- Empty result with a relevant next action.
- Partial or optional-contract response where supported.
- Network/server error with retry.
- Offline refresh while retaining cached data.
- Authentication expiry and preserved return path.
- Feature-local `403` without treating it as session expiry.
- Mutation pending, success, validation failure, server failure, and retry-safe behavior.

Sensitive operations additionally require explicit confirmation, initial focus, focus trap, Escape behavior where cancellation is safe, focus restoration, and duplicate-submit prevention.

## 8. Verification contract

Every page family must pass:

- TypeScript typecheck and relevant unit/contract tests.
- Production build and route-level bundle check where applicable.
- Chromium E2E for primary API and local-data workflows.
- Screenshot comparison against design-lab at `1440x900`, `1024x768`, `768x900`, `390x844`, and `320x720` in both themes where the page is theme-aware.
- Seven-locale completeness and long-copy checks, especially Russian, French, Japanese, and Vietnamese.
- Keyboard, focus, semantic labels, live regions, reduced motion, and no page-level horizontal overflow.
- Browser console and page-error review.

Visual comparison must pair the same page, theme, viewport, and interaction state. A material mismatch blocks completion even when automated tests pass.

## 9. Execution order

1. Foundation and shared shell contract.
2. Public/content and authentication.
3. Console data and account.
4. Playground and Image Studio.
5. Cross-page QA, cleanup, compatibility, and release readiness.

Page families may be implemented independently only after their shared shell and token dependencies are stable. Do not merge parallel work that edits the same shell or global stylesheet without an ownership plan.

## 10. Definition of done

R4 is complete only when every included route uses the approved design-lab composition, all real interactions use the correct API or confirmed local boundary, seven locales are complete, obsolete production implementations are removed, upstream projects remain unmodified, and the cross-page acceptance matrix passes.
