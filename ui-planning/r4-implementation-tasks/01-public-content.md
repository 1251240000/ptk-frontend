# R4.1 public and content pages

Depends on: `00-scope-and-foundation.md`
Design baseline: R3.1 plus the latest R3.7 homepage
Production target: localized public routes in `apps/web`

## 1. Scope

Implement the approved design-lab public shell and these production pages:

| Page | Canonical route |
| --- | --- |
| Home | `/{locale}/` |
| Models | `/{locale}/models` |
| Docs entry | `/{locale}/docs` |
| About | `/{locale}/about` |
| Notices | `/{locale}/notices` |
| Service status | `/{locale}/status` |
| User Agreement | `/{locale}/legal/user-agreement` |
| Terms of Service | `/{locale}/legal/service-agreement` |
| Privacy Policy | `/{locale}/legal/privacy-policy` |

The current production router lacks notices and service-status leaves. Add them without changing the localized route model.

## 2. Design lock

- Use the active `PublicPrototype` composition, public header, mobile sheet, footer, continuous section bands, Route Capsule, typography, tokens, responsive order, and focus behavior.
- Use the latest homepage structure and visual assets from `public-home-copy.ts`, `public-prototype.tsx`, `public-prototype.css`, and `apps/design-lab/public/home`.
- The homepage product workspace remains the primary first-viewport visual. Do not replace it with the current production hero.
- Preserve the “conversation -> creation -> API integration” work path, capability colors, real product previews, task entries, trust matrix, FAQ, and footer.
- Keep model information gated for anonymous visitors exactly as the design-lab layout specifies. Do not show fabricated models, prices, ratios, latency, or uptime.
- Content pages use continuous reading surfaces and stable task navigation, not card grids.

Any visual adjustment caused by real data must follow the deviation approval rule in the foundation document.

## 3. Data and content contracts

| Surface | Source | Behavior |
| --- | --- | --- |
| Global service readiness | `GET /api/status` | Show truthful checking/available/unavailable states and optional version fields only when returned. |
| Authenticated model marketplace | `GET /api/pricing`, user group/model APIs as required | Parse through API client; preserve anonymous gate; never infer unavailable fields. |
| Optional uptime detail | `GET /api/uptime/status` when supported | Feature-detect and retain a truthful unavailable state if disabled or absent. |
| Homepage/About/legal/notices | `@partokens/content` and approved localized copy | Repository-owned, versioned content; no runtime New API HTML injection. |
| Documentation entry | Partokens docs routes/content | Keep API base URL and examples accurate; full reference remains owned by the docs app. |

Do not consume `/api/home_page_content`, `/api/about`, `/api/notice`, `/api/user-agreement`, or `/api/privacy-policy` at runtime.

## 4. Subtasks

### 4.1 Shared public shell

1. Port the design-lab header, theme/language controls, mobile navigation sheet, active states, and footer into production components.
2. Preserve the current locale during navigation and language changes.
3. Keep the mobile sheet focus trap, body scroll lock, Escape close, and trigger-focus restoration.
4. Ensure public theme selection uses the shared preference store and stable theme initialization without flash.
5. Replace old public-shell styles after all public routes adopt the new shell.

### 4.2 Homepage

1. Port the final R3.7 section order and copy model exactly.
2. Wire primary and secondary actions to real localized console/docs routes.
3. Preserve fixed product-preview geometry across tabs, themes, loading, and missing assets.
4. Map service readiness to `/api/status`; do not reinterpret a successful status response as an uptime percentage.
5. Use theme-specific WebP assets and stable fallback boxes with correct alt behavior.
6. Implement the approved reveal and tab motion with a reduced-motion path.

### 4.3 Models and status

1. Preserve the design-lab anonymous gate.
2. For authenticated users, validate and normalize pricing/model data in the API layer before rendering.
3. Represent missing capability, performance, or uptime dimensions as unavailable, not zero.
4. Keep filters, details, and states within the approved layout at long locale lengths.

### 4.4 Docs, About, notices, and legal

1. Port the approved reading layouts and horizontal task navigation behavior below the design breakpoint.
2. Preserve code blocks, copy controls, anchor navigation, legal metadata, effective dates, draft/reviewed status, and notice read state.
3. Store notice seen/unseen state as a local content-version hash; do not imply a server inbox.
4. Keep all content sanitized by construction from owned structured sources; do not inject backend HTML.

## 5. i18n requirements

- Move design-lab-only public and homepage copy into permanent shared content/i18n ownership without changing wording during migration.
- Complete all seven locales before route cutover.
- Keep endpoint paths, SDK names, code samples, and model/provider identifiers technically exact.
- Verify that locale changes retain the current page, section where possible, theme, and non-sensitive interaction state.
- Legal translations retain review metadata and must not be marked owner-approved without product-owner review.

## 6. File ownership and cleanup

Expected production areas:

```text
apps/web/src/router.tsx
apps/web/src/pages/home-page.tsx
apps/web/src/pages/models-page.tsx
apps/web/src/pages/docs-page.tsx
apps/web/src/pages/content-pages.tsx
apps/web/src/features/public/*
packages/content/src/*
packages/i18n/src/*
packages/design-system/src/*
```

After parity, remove replaced public page markup, old top-navigation visuals, obsolete homepage CSS, dead copy tables, and route-specific styles no longer referenced. Do not remove the docs app or repository-owned content sources.

## 7. Acceptance

- Every route above exists, deep-links, reloads, and preserves locale.
- Home matches design-lab in all required viewport/theme pairs and always reveals the beginning of the next section in the first viewport.
- Public navigation, mobile sheet, tabs, FAQ, copy controls, anchors, and footer links are fully operable by keyboard.
- Status/model screens cover loading, anonymous gate, authenticated success, empty, partial, disabled, offline, and retry states without fabricated values.
- Notices remain versioned local content with correct read-state migration.
- Seven locales have no missing keys, unintended fallback, overlap, clipped required copy, or page-level horizontal scrolling.
- Public assets do not cause layout shift, theme flash, unreadable failure states, or incorrect-theme flashes.
- Old public implementation code is removed after the canonical route cutover.
