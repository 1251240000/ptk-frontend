# Dogfood Report: Partokens UI Phase 1

| Field | Value |
|---|---|
| Date | 2026-07-21 |
| App URL | `http://127.0.0.1:8080` |
| Session | `partokens-phase1`, `partokens-auth`, `partokens-phase1b`, `partokens-phase1c`, `partokens-phase1-final`, `partokens-phase1-final-fix` |
| Scope | Public/auth routes, role guard, console shell, Playground, Studio, analytics, key management, usage logs, wallet/subscriptions, profile/security, seven locales, themes, mobile layouts, and Caddy ownership |

## Summary

Ten issues were found during implementation QA and fixed before handoff. No open critical, high, medium, or low issue remains in the tested phase-one surface.

| Severity | Found | Open |
|---|---:|---:|
| Critical | 1 | 0 |
| High | 1 | 0 |
| Medium | 5 | 0 |
| Low | 3 | 0 |
| Total | 10 | 0 |

## Resolved Issues

### ISSUE-001: Development Caddy returned HTML for UI scripts

| Field | Value |
|---|---|
| Severity | Critical |
| Category | Functional / console |
| Status | Fixed |

The localized HTML loaded, but `/_ui/*` requests fell through to the native upstream and returned HTML, producing `Unexpected token '<'` and a blank page. A dedicated `/_ui/*` handler now precedes both SPA and native fallbacks. Browser errors are clear and the homepage renders correctly.

Verification: [desktop homepage](screenshots/home-desktop.png), [mobile dark homepage](screenshots/home-mobile-dark.png)

### ISSUE-002: First profile request after login lacked `New-Api-User`

| Field | Value |
|---|---|
| Severity | High |
| Category | Authentication |
| Status | Fixed |

Password authentication succeeded, but `/api/user/self` was rejected because the login response user ID had not yet been stored for the request interceptor. The login flow now stores the returned ID before resolving the full session and applying the role redirect.

Verification: [redacted console overview](screenshots/console-overview-desktop-redacted.png)

### ISSUE-003: Mobile bottom navigation omitted Wallet and More

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Navigation / responsive UI |
| Status | Fixed |

The initial mobile bar used the first five desktop links, which excluded Wallet and offered no route to the complete console navigation. It now uses Overview, Playground, Studio, Wallet, and More. More opens the complete grouped navigation sheet.

Verification: [redacted mobile navigation sheet](screenshots/console-mobile-more-redacted.png)

### ISSUE-004: Studio size option was clipped

| Field | Value |
|---|---|
| Severity | Low |
| Category | Visual |
| Status | Fixed |

The Studio inspector allocated equal width to size and count, clipping `1024 x 1024`. The inspector and field ratio now reserve more width for size.

Verification: [redacted Studio](screenshots/studio-desktop-redacted.png)

### ISSUE-005: Development HMR WebSocket used the native fallback

| Field | Value |
|---|---|
| Severity | Low |
| Category | Developer experience / console |
| Status | Fixed |

Rsbuild's `/rsbuild-hmr` WebSocket initially reached the native upstream. The browser recovered through a direct connection, but logged a failed connection first. The development Caddyfile now routes the HMR path to the local Rsbuild server.

## Coverage Notes

- Password login was tested with the development account; credentials and user-specific values were excluded from retained artifacts.
- Registration email, password-reset email, API key mutations, payment submission, Playground model calls, and image generation were intentionally not triggered.
- Caddy content types were checked for API, localized UI, OAuth/reset technical routes, and native administrator routes.

## Phase 1B Regression

The API key editor, explicit reveal confirmation, usage-log filters and detail drawer, profile settings, and password form were exercised with isolated browser fixtures. No new open issue was found. Production mutations and secret reveal requests were not sent.

Verification: [key editor desktop](screenshots/phase1b-key-editor-desktop.png), [reveal confirmation](screenshots/phase1b-key-reveal-confirm.png), [usage logs desktop](screenshots/phase1b-logs-desktop.png), [redacted log detail](screenshots/phase1b-log-detail-desktop.png), [profile desktop](screenshots/phase1b-profile-desktop.png), [key editor mobile](screenshots/phase1b-key-editor-mobile-viewport.png), [profile mobile dark](screenshots/phase1b-profile-mobile-dark.png)

### ISSUE-006: 90-day analytics exceeds the backend query limit

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Functional / interface compatibility |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/analytics` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

The analytics page sends a single 90-day request when `90D` is selected. Both New API endpoints reject any time span longer than one month, so the trend and flow sections enter their error states and the summary totals reset to zero. The `7D` and `30D` options continue to work.

Reproduction:

1. Open analytics with the working 30-day view. [Initial state](screenshots/issue-006-step-1-ready.png)
2. Select `90D`.
3. Observe both analytics requests fail with `时间跨度不能超过 1 个月`, and both sections show retry actions. [Result](screenshots/issue-006-result.png)

The API adapter now splits ranges at the backend's 30-day boundary, advances the next range by one second to avoid overlap, and merges the results. A 90-day browser regression produced three trend requests and three flow requests, all within the accepted range, with no browser error. [Fixed state](screenshots/issue-006-fixed.png)

### ISSUE-007: Billing history formats top-up dollars as internal quota

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Content / interface compatibility |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/wallet` |
| Repro Video | N/A (static issue) |

New API's billing history returns `amount` as the top-up amount in USD for the standard payment providers. The wallet passed that value to the internal quota formatter, so a `$50` top-up and a `$20` top-up both rendered as `US$0.00` in the Amount column. The Paid column remained correct.

Verification: [incorrect billing amount](screenshots/issue-007.png)

The wallet now formats the field as USD instead of passing it through the internal quota conversion. Browser regression confirms the two records render as `US$50.00` and `US$20.00`. [Fixed state](screenshots/issue-007-fixed.png)

### ISSUE-008: Root hot-update manifests bypass the development proxy

| Field | Value |
|---|---|
| Severity | Low |
| Category | Developer experience / console |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/index.*.hot-update.json` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

The HMR WebSocket is correctly proxied, but Rspack also requests root-level `/*.hot-update.json` and `/*.hot-update.js` assets. These paths fell through to the native upstream, returned HTML with status 200, and caused `Unexpected token '<'` followed by a full-page reload.

The development Caddy matcher now owns both hot-update asset suffixes. The captured manifest returns `application/json` through Caddy and its body exactly matches the direct Rsbuild response.

### ISSUE-009: Four locale dictionaries omit account and key-management copy

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Content / i18n |
| Status | Fixed |
| URL | Locale-prefixed key, wallet, and profile routes |
| Repro Video | N/A (static dictionary audit) |

Japanese, Russian, French, and Vietnamese each omitted 47 phase-one strings covering key restrictions, error feedback, wallet confirmations, Passkey guidance, and account deletion. Runtime fallback kept the UI functional but displayed English inside otherwise localized pages.

All seven locale dictionaries now expose the same 370 keys with no missing entries. Russian and French mobile documentation routes were also checked at 390px in both light and dark themes without page-level horizontal overflow.

### ISSUE-010: Documentation key link escapes the localized user UI

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Navigation / deployment routing |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/fr/docs` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

The documentation used the relative target `../console/keys`. From a locale-prefixed docs route this resolves to the unprefixed `/console/keys`, which is owned by the native New API frontend in Caddy. Opening or refreshing that URL leaves the independent user UI and returns the native 404 page.

Reproduction:

1. Open the French documentation and inspect the create-key action. [Initial state](screenshots/issue-010-docs-create-key-link.png)
2. Follow the action, then directly open or refresh `/console/keys`. [Native 404](screenshots/issue-010-result-native-404.png)

The action now uses the active locale explicitly, for example `/fr/console/keys`. A route-helper regression test covers the generated URL, and a browser refresh remains inside the localized user UI. [Fixed state](screenshots/issue-010-fixed-localized-sign-in.png)

## Phase 1C Regression

- Analytics range, granularity, metric, chart/table, ranking, and request-flow states were exercised with isolated fixtures. The 90-day path now uses three non-overlapping requests per endpoint.
- Key status filters, column visibility, batch selection, post-create setup, and volatile secret handling were verified without production mutations.
- Log metadata only exposes allowlisted billing and stream fields; bearer values are redacted and unknown fields are omitted. Mobile logs use card layout.
- Fixed top-up options, discounts, subscription plans, confirmations, redemption availability, billing history, and affiliate rewards were verified without completing financial actions.
- Account, check-in, bindings, preferences, 2FA setup, Passkey verification, access-token confirmation, and account deletion confirmation were covered on desktop and mobile.
- Every documentation locale route loaded translated content. Russian and French long labels fit at 390px; light, dark, and system themes were exercised.
- A mocked administrator hard-navigated from the locale-prefixed console to native `/channels`.

Verification: [analytics](screenshots/phase1c-analytics-desktop.png), [key setup](screenshots/phase1c-key-setup-hidden.png), [safe log detail](screenshots/phase1c-log-safe-detail.png), [mobile logs](screenshots/phase1c-logs-mobile.png), [top-up confirmation](screenshots/phase1c-wallet-topup-confirm.png), [subscription confirmation](screenshots/phase1c-wallet-subscription-confirm.png), [2FA setup](screenshots/phase1c-profile-2fa-setup.png), [Passkey confirmation](screenshots/phase1c-profile-passkey-confirm.png), [mobile profile](screenshots/phase1c-profile-security-mobile.png), [Russian docs dark](screenshots/phase1c-docs-ru-mobile-dark.png), [French docs dark](screenshots/phase1c-docs-fr-mobile-dark.png)
