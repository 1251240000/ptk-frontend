# API Contract Matrix

## Sources And Confidence

Contracts were cross-checked against:

- Current user frontend wrappers in `new-api/web/default/src/features/*/api.ts`.
- Go route registration in `new-api/router/api-router.go` and `new-api/router/relay-router.go`.
- Generated fragments under `new-api-docs-v1/openapi/generated/`.
- Read-only production navigation and network observation on 2026-07-20.

The generated docs are useful but incomplete in several response schemas. The Go routes and current frontend behavior take precedence when they disagree.

## Authentication Conventions

| Contract | Rule |
| --- | --- |
| Management/user APIs | Cookie session plus `New-Api-User` header after login, matching the official frontend |
| Playground chat | Cookie session through `/pg/chat/completions` |
| Relay/image APIs | Bearer API key through `/v1/*` |
| Public data | No login unless the configured module requires it |
| Response envelope | Usually `{ success, message, data }`; relay APIs use OpenAI-compatible response/error shapes |

All requests are same-origin in production. The client uses `withCredentials: true`, `Cache-Control: no-store` for private state, and an allowlisted return path on auth redirects.

## Public Data And Reference-Only Content

| Method | Endpoint | Consumer | Notes |
| --- | --- | --- | --- |
| GET | `/api/status` | Entire app | Brand/config, login methods, Turnstile, locale/display settings, docs link, feature flags |
| GET | `/api/uptime/status` | Home, overview | Optional Uptime Kuma grouping |
| GET | `/api/pricing` | Model marketplace | Pricing, vendor/meta, group ratios, supported endpoint types |
| GET | `/api/notice` | Research reference only | Existing configured notice; not consumed by the standalone UI |
| GET | `/api/about` | Research reference only | Existing configured HTML |
| GET | `/api/home_page_content` | Research reference only | Existing configured HTML with embedded CSS in production |
| GET | `/api/user-agreement` | Research reference only | Existing configured HTML |
| GET | `/api/privacy-policy` | Research reference only | Existing configured HTML |

Homepage, About, User Agreement, Terms of Service, Privacy Policy, and notices are versioned and translated in the standalone repository. None of the configured HTML endpoints above is a runtime dependency.

## Authentication

| Method | Endpoint | Purpose | Key inputs/outputs |
| --- | --- | --- | --- |
| POST | `/api/user/login?turnstile=` | Password login | `{ username, password }`; may return `require_2fa` |
| POST | `/api/user/login/2fa` | Complete 2FA login | `{ code }` |
| GET | `/api/user/logout` | End session | Clear all client auth/key memory afterward |
| GET | `/api/user/self` | Resolve session and role | Source of role, quota, usage, group, bindings, settings |
| GET | `/api/oauth/state` | OAuth CSRF state | Include affiliate code when present |
| GET | `/api/oauth/:provider` | OAuth callback exchange | Provider-specific query parameters |
| GET | `/api/verification` | Send email code | Registration/email binding only; not login |
| GET | `/api/reset_password` | Send password reset email | Email + optional Turnstile |
| POST | `/api/user/reset` | Reset password | Reset flow payload |
| POST | `/api/user/register` | Registration | Username/password, optional email/code/affiliate/Turnstile |
| POST | `/api/user/passkey/login/begin` | Start Passkey login | Public |
| POST | `/api/user/passkey/login/finish` | Finish Passkey login | Public |

OAuth provider visibility and URLs are derived from `/api/status`. Production showed GitHub, LinuxDO, and Google, where Google is represented through custom OAuth/OIDC configuration rather than a dedicated `google_oauth` backend route.

### Confirmed Email-Code Scope

`/api/verification` supplies codes for registration and binding. There is no email-code session endpoint, so sign-in offers password and OAuth only. Registration consumes the email code when required by current status configuration.

## User And Profile

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/user/self` | Profile, balance, usage, role, bindings, settings |
| PUT | `/api/user/self` | Display name/password/language and supported self fields |
| PUT | `/api/user/setting` | Notification and preference settings |
| DELETE | `/api/user/self` | Delete account |
| GET | `/api/user/token` | Generate/regenerate system access token |
| GET | `/api/verification` | Email verification code |
| POST | `/api/oauth/email/bind` | Bind verified email |
| GET | `/api/user/oauth/bindings` | List custom OAuth bindings |
| DELETE | `/api/user/oauth/bindings/:providerId` | Unbind custom OAuth |
| GET/POST | `/api/user/checkin` | Optional check-in |
| GET | `/api/user/passkey` | Passkey status |
| POST | `/api/user/passkey/register/begin` | Begin Passkey registration |
| POST | `/api/user/passkey/register/finish` | Finish Passkey registration |
| DELETE | `/api/user/passkey` | Remove Passkey |
| GET | `/api/user/2fa/status` | 2FA status |
| POST | `/api/user/2fa/setup` | 2FA setup |
| POST | `/api/user/2fa/enable` | Enable with code |
| POST | `/api/user/2fa/disable` | Disable with code |
| POST | `/api/user/2fa/backup_codes` | Regenerate backup codes |

Do not render `id` even though it is required internally for the `New-Api-User` header and local storage namespace.

## Overview And Analytics

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/data/self` | User quota/call data for range and granularity |
| GET | `/api/data/flow/self` | User flow analysis when enabled |
| GET | `/api/perf-metrics/summary` | Model success/latency summary where pricing nav access permits |
| GET | `/api/perf-metrics` | Detailed model performance metrics |
| GET | `/api/uptime/status` | Service groups/status |
| GET | `/api/token/?p=&size=` | Key readiness/list preview |
| GET | `/api/user/models?group=` | Available model names |
| GET | `/api/user/self/groups` | Usable groups with description/ratio |

Filters use Unix timestamps and the backend-supported `default_time` granularity. Analytics adapters must tolerate empty arrays and feature-disabled responses without turning the entire page into an error.

## API Keys

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/token/?p=&size=` | List |
| GET | `/api/token/search` | Search by keyword/token |
| GET | `/api/token/:id` | Detail |
| POST | `/api/token/` | Create |
| PUT | `/api/token/` | Update |
| PUT | `/api/token/?status_only=true` | Enable/disable |
| DELETE | `/api/token/:id` | Delete |
| POST | `/api/token/batch` | Batch delete |
| POST | `/api/token/:id/key` | Reveal one real key; session-authenticated and rate-limited, with no password/2FA step-up |
| POST | `/api/token/batch/keys` | Reveal multiple real keys; avoid in ordinary UI unless required |

Key fields to preserve include name, status, expiry, remaining/unlimited quota, used quota, group, model allowlist, IP allowlist, creation time, and last-used time.

## Usage Logs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/log/self` | User log page |
| GET | `/api/log/self/stat` | Filtered summary |
| GET | `/api/log/self/search` | Search variant in documented API |

The generic log stream includes API consumption plus login and system events. The UI should preserve event type and not assume every row has model/token/cost fields.

Task endpoints `/api/task/self` and `/api/mj/self` remain available but are intentionally omitted from the ordinary-user navigation per product scope. Generated media links found in generic log detail may still be previewed.

## Wallet And Subscriptions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/user/topup/info` | Enabled gateways, presets, discounts, minimums, redemption/compliance flags |
| POST | `/api/user/amount` | Server-calculated regular payment amount |
| POST | `/api/user/stripe/amount` | Server-calculated Stripe amount |
| POST | `/api/user/waffo-pancake/amount` | Server-calculated Waffo Pancake amount |
| POST | `/api/user/pay` | Regular payment |
| POST | `/api/user/stripe/pay` | Stripe payment |
| POST | `/api/user/creem/pay` | Creem payment |
| POST | `/api/user/waffo/pay` | Waffo payment |
| POST | `/api/user/waffo-pancake/pay` | Waffo Pancake payment |
| POST | `/api/user/topup` | Redeem code |
| GET | `/api/user/topup/self` | User order history |
| GET | `/api/user/aff` | Affiliate code |
| POST | `/api/user/aff_transfer` | Transfer affiliate quota |
| GET | `/api/subscription/plans` | Available plans |
| GET | `/api/subscription/self` | Current subscriptions |
| PUT | `/api/subscription/self/preference` | Billing preference |
| POST | `/api/subscription/{balance,epay,stripe,creem,waffo-pancake}/pay` | Plan payment variants |

Important top-up response fields:

```ts
type TopupInfo = {
  amount_options: number[]
  discount: Record<number, number>
  pay_methods: Array<{ name: string; type: string; min_topup?: number }>
  enable_online_topup: boolean
  enable_stripe_topup: boolean
  enable_creem_topup?: boolean
  enable_waffo_topup?: boolean
  enable_waffo_pancake_topup?: boolean
  enable_redemption?: boolean
  payment_compliance_confirmed?: boolean
}
```

`discount[amount]` is a multiplier. The production snapshot contained multipliers such as `0.05`, displayed as 95% off, but the server calculation endpoint is the authority for the payable value.

## Playground

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/pg/chat/completions` | Cookie session | OpenAI-compatible chat completion with optional stream |
| GET | `/api/user/models?group=` | Cookie session | Model options |
| GET | `/api/user/self/groups` | Cookie session | Group options and ratios |

The backend creates a temporary Playground token context. The frontend sends messages and generation parameters but does not need to create or reveal an API key.

Multiple conversations, names, search, and retention are local IndexedDB concerns and have no server contract.

The UI states that conversation history is stored only in the current browser and is not stored by Partokens. This describes persistence, not transport: sent messages still pass through the Partokens gateway and selected model provider.

## Image Studio

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/v1/images/generations` | Bearer API key | JSON text-to-image request |
| POST | `/v1/images/edits` | Bearer API key | Multipart image edit request |
| GET | `/api/user/models?group=` | Cookie session | Candidate models by group |
| GET | `/api/pricing` | Public/auth by config | Capabilities and cost hints |
| GET | `/api/token/` | Cookie session | Select a key |
| POST | `/api/token/:id/key` | Cookie session + rate limit | Reveal selected key for runtime after explicit UI confirmation |

Generation request baseline:

```ts
type ImageGenerationRequest = {
  model?: string
  prompt: string
  n?: number
  size?: string
  background?: 'transparent' | 'opaque' | 'auto'
  moderation?: 'low' | 'auto'
  quality?: string
  stream?: boolean
  style?: string
  user?: string
}
```

The response may include `url` or `b64_json` per image plus optional usage. The adapter must support both and should immediately materialize expiring URLs into local blobs when the user elects to keep a project.

### Confirmed Studio Gaps/Risks

- There is no session-authenticated `/pg/images/*` equivalent.
- The key-reveal route verifies session ownership and rate-limits requests, but it has no password/2FA step-up contract. The studio must not imply otherwise.
- Production pricing metadata listed an image model but the endpoint-type filter reported zero image endpoints. Group membership/model naming may be more reliable than pricing endpoint metadata until configuration is corrected.
- Model-specific parameter support varies. The UI requires a capability registry with safe defaults and per-model overrides rather than sending every field to every model.
- `/v1/images/edits` documentation is narrower than several modern model implementations; runtime errors must remain visible and actionable.

## Independent Public And Legal Content

No new content API is required. User Agreement, Terms of Service, Privacy Policy, About, homepage copy, and notices are repository-owned localized content. Existing New API HTML responses remain reference-only and are deliberately absent from the required adapter contract.

## Compatibility Layer Rules

- Feature code imports domain adapters, never raw Axios.
- Validate critical runtime responses with Zod at the adapter boundary.
- Normalize envelope and OpenAI-style errors into one UI error type.
- Preserve unknown response fields for forward compatibility.
- Feature-detect optional fields; do not branch on a single production version string.
- Record the tested New API commit/version in a compatibility manifest.
- Contract fixtures remove all credentials and user-specific values.
