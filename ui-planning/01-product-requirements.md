# Product And Requirements

## Product Definition

Partokens is a user-facing AI model access and operations console for individual developers and small teams. Its primary job is to make four facts immediately clear: what can be called, how to call it, what it costs, and whether the account is ready to continue.

The new UI replaces the public and ordinary-user experience while preserving the official New API management experience for administrators.

## Users And Roles

| Role | New UI outcome |
| --- | --- |
| Visitor | Understand Partokens, compare models, read docs/legal pages, and sign in |
| User (`role = 1`) | Enter the standalone console after sign-in |
| Admin (`role = 10`) | Enter the official New API management UI after sign-in |
| Super admin (`role = 100`) | Enter the official New API management UI after sign-in |

The backend role value is authoritative. Caddy path routing is not an authorization boundary.

## Product Goals

- Reduce time from sign-in to first successful request.
- Make remaining quota, recent consumption, and service health continuously visible.
- Preserve all requested ordinary-user account, key, wallet, analytics, and log capabilities.
- Add useful local-first chat history without requiring a backend change.
- Add an image creation workspace using existing token-authenticated image APIs.
- Keep the frontend replaceable and testable as New API continues to release versions.
- Provide consistent light/dark themes and seven-locale application, public-content, legal, notice, and documentation experiences.

## Non-Goals

- Reimplementing or reskinning administrator management features.
- Changing New API routes, request/response formats, authentication, billing, or database schema.
- Server-side chat synchronization.
- A server-side asset library for the image studio.
- A server-synchronized per-user notification inbox.
- Consuming administrator-provided homepage, About, legal, notice, HTML, or CSS at runtime.

## Scope And Priority

### P0: Public And Authentication

- Homepage.
- Sign-in with username/email and password.
- OAuth sign-in for GitHub, LinuxDO, and the production Google custom OAuth/OIDC provider.
- Registration with email verification code when required by `/api/status`.
- Legal consent checkbox before any sign-in method begins.
- Two-factor verification after password/OAuth login when required.
- OAuth callback, forgot password, reset password, and registration support pages required by the auth flow.
- Model marketplace.
- Usage documentation entry page.
- Independently maintained About, User Agreement, Terms of Service, and Privacy Policy pages.
- Light, dark, and system theme modes.
- Seven UI locales: Simplified Chinese, Traditional Chinese, English, Japanese, Russian, French, and Vietnamese.

Email verification codes are used only for registration and account binding. The sign-in page has no email-code mode.

### P0: Console Shell

Top navigation:

- Home
- Console
- Model marketplace
- Documentation
- About
- Release-managed platform notices
- Language
- Theme
- User menu

Sidebar:

- Chat: Playground
- Chat: Image studio
- General: Overview
- General: Analytics
- General: API keys
- General: Usage logs
- Personal: Wallet
- Personal: Profile

Explicit removals:

- Task logs from ordinary-user navigation.
- Profile user ID display.
- The entire "left sidebar personal settings" feature.
- Custom wallet top-up amount input.

The bottom-left usage rail is fixed inside the expanded sidebar and shows remaining balance plus consumption. In the collapsed sidebar it becomes a compact quota gauge with a tooltip.

### P0: Playground

- Start a new conversation.
- Display and reopen recent local conversations.
- Auto-title from the first user message, with manual rename.
- Search, delete one, and clear all local conversations.
- Model and group selection from existing APIs.
- Streaming and non-streaming responses.
- Edit, retry/regenerate, copy, stop, and delete message actions.
- Persist model parameters and conversation data locally.
- Clearly state that browser-local conversations do not sync between devices.
- Display: "Conversation history is stored only in this browser. Partokens does not store your conversation history."
- Explain that sent messages still pass through the Partokens gateway and selected model provider for generation.

### P0: Image Studio MVP

- Create, rename, duplicate, import, export, and delete local canvas projects.
- Pan, zoom, selection, move, resize, connect, undo, and redo.
- Prompt node, source image node, generated image node, and note node.
- Text-to-image through `/v1/images/generations`.
- Image edit through `/v1/images/edits` when the chosen model supports it.
- Model, group/key, size, quality, background, and output-count controls, capability-gated by model.
- Generation progress, cancel where possible, error details, retry, cost/log deep link, and local result history.
- Store project metadata and user-imported/generated image blobs locally.
- Never persist a plaintext API key in localStorage or IndexedDB.

Video, audio, remote plugins, MCP control, multi-agent control, and public sharing from `infinite-canvas` are deferred until the image-only workflow is stable.

### P0: Overview

Preserve existing user-visible capabilities while simplifying layout:

- First-use setup checklist.
- Remaining balance, total consumption, recent consumption, and request count.
- Preferred/available API key state.
- Current route/domain and sample request.
- Available model summary.
- Current release-managed platform notice.
- Uptime/service health when configured.
- Direct actions to create a key, add balance, open Playground, inspect logs, and view pricing.

### P0: Analytics

- Time range and granularity filters.
- Model call trend.
- Consumption distribution.
- Model call ranking.
- Requests, tokens, and cost measures.
- Chart/table toggle or accessible data table equivalent.
- Empty, loading, partial-data, and error states.
- Flow analysis only when `/api/data/flow/self` returns usable data.

### P0: API Keys

- List, search by name/key, filter status, paginate, and change visible columns.
- Create, edit, enable/disable, delete, and batch delete.
- Reveal/copy one key only after explicit user confirmation. The current server route verifies the session and key ownership and is rate-limited, but it does not require password/2FA step-up.
- Preserve quota, expiry, model allowlist, group, and IP restriction fields.
- Provide copyable SDK/CLI configuration after creation without exposing keys again by default.

### P0: Usage Logs

- Time range, type, model, group, key/token, and request-related filters supported by the API.
- Summary statistics from `/api/log/self/stat`.
- Columns for time, type, token/key, model, streaming, tokens, cost, latency, and details.
- Detail drawer for billing multipliers, request metadata, errors, and generated media links when present.
- No Task Logs route in the new user UI.

### P0: Wallet

- Current balance, total use, subscription allowance, and priority preference.
- Subscription plans and purchase flows already enabled by the backend.
- Online top-up payment methods returned by the backend.
- Preset amount selection only, sourced verbatim from `amount_options`.
- Discount display sourced from `discount`; payment amount remains server-authoritative through the amount calculation endpoint.
- Redemption code.
- Order history.
- Affiliate link, earnings, and transfer to balance.
- Compliance-disabled and payment-disabled states from `GET /api/user/topup/info`.

The client must reject any amount not present in the latest `amount_options`, even if a user alters form state in developer tools. If the array is empty, the client shows that preset top-up is not configured and does not synthesize fallback amounts. The backend remains the final validator.

### P0: Profile

- Display name and email/account summary without user ID.
- Email, GitHub, LinuxDO, Google/custom OAuth, and other enabled binding states.
- Language preference synced through existing user settings.
- Password change, access token, Passkey, 2FA, account deletion.
- Notification preferences, quota threshold, email/webhook/Bark/Gotify settings, and IP logging where enabled.
- Check-in only when enabled by system configuration.
- No sidebar module customization controls or persistence calls.

### P1

- Import/export chat history.
- Optional browser-side encrypted local chat database.
- Studio project thumbnails and storage-usage management.
- Cross-tab synchronization through `BroadcastChannel`.
- Local command palette.
- Installable PWA shell after storage and update behavior is proven.

## Functional Acceptance Rules

- All feature visibility is driven by `/api/status`, `/api/user/self`, and feature-specific responses, not hard-coded production assumptions.
- All mutations show pending, success, and recoverable failure states.
- A 401 clears cached user state and returns to sign-in with a validated same-origin return path.
- Role `>= 10` is redirected to the native official management entry `/channels` after successful password, OAuth, Passkey, or 2FA authentication; ordinary users enter `/{locale}/console/overview`.
- All standalone pages use one of the seven allowed BCP-47 locale prefixes. Official management pages remain unprefixed.
- `/oauth/:provider` and `/user/reset` are the only unprefixed standalone technical entries required by current callbacks and reset emails.
- No page reveals a full API key by default.
- Theme changes do not flash the wrong theme on first paint.
- Changing locale updates all mounted UI immediately and persists to the account when logged in.
- Mobile layouts preserve all workflows; wide tables may switch to rows/detail drawers rather than forcing unreadable compression.
- Legal consent is a real checkbox, unchecked by default, and gates OAuth as well as password sign-in.

## Non-Functional Requirements

### Accessibility

- WCAG 2.1 AA contrast.
- Full keyboard navigation and visible focus.
- Semantic landmarks, labels, table headers, dialogs, and live regions.
- Reduced-motion support.
- Charts have equivalent summaries/tables.

### Performance

- Route-level code splitting.
- Public landing and sign-in routes do not load chart, editor, or canvas bundles.
- Image studio is a separately loaded build/package.
- Target compressed initial JS for public routes: under 250 KB excluding fonts.
- Avoid layout shifts in navbar, sidebar, tables, and quota rail.

### Security And Privacy

- Same-origin API calls with credentials.
- Preserve Turnstile, 2FA, Passkey, and server verification behavior.
- Render only repository-owned structured content/MDX for homepage, About, legal pages, and notices; never execute embedded scripts.
- Do not log passwords, session cookies, full keys, OAuth codes, image payloads, or chat content.
- Namespace local data by stable user identity and clear sensitive in-memory key material on logout.
- Explain local-only storage before users rely on it.

### Internationalization

- No user-facing string outside locale resources.
- Locale-aware dates, numbers, currencies, pluralization, and relative time.
- Conditional CJK font loading and sufficient space for French/Russian labels.
- Avoid concatenated translated fragments.
- UI keys use stable semantic names, not source-language sentences.
- Localized URLs use `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, or `vi`; locale switching updates the path without losing the current destination.
- Quick-start and full reference documentation must be complete in all seven locales before launch.
- Simplified Chinese is the drafting source; machine-assisted translations retain draft/review metadata until owner approval.

## Release Definition Of Done

- Contract tests pass against the pinned local New API version.
- End-to-end tests cover password login, registration email verification, OAuth callback simulation, 2FA routing, role redirect, locale routing, key lifecycle, wallet preset validation, logs, chat persistence/disclosure, and image generation with mocked upstream responses.
- Desktop and mobile visual regression screenshots pass in light and dark themes and all seven locales for high-risk layouts.
- Caddy routing tests prove user routes reach the standalone UI, admin routes reach official New API UI, and APIs never fall back to an SPA document.
- Translation completeness checks pass for application content and full documentation in all seven locales; legal content receives product-owner review before production publication.
- No tracked change exists inside either upstream repository.
