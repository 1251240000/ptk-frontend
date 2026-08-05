# R4.4 account pages

Depends on: `00-scope-and-foundation.md`, R4.3 shared Console shell
Design baseline: active design-lab Wallet and Profile family, including Profile tabs for Security, Connections, and Notifications
Production authority: New API self, billing, subscription, security, binding, and settings contracts

## 1. Scope and navigation

```text
Console sidebar
|- Wallet      /{locale}/console/wallet
`- Profile     /{locale}/console/profile
   |- Profile
   |- Security
   |- Connections
   `- Notifications
```

Wallet and Profile remain sidebar destinations. Security, Connections, and Notifications are deep-linkable Profile tasks using the approved horizontal task tabs, not disabled sidebar items and not a restored secondary sidebar.

Define a stable query/hash/search representation for the active Profile tab so direct links, reload, browser history, and legacy `console-security`, `console-connections`, and `console-notifications` intents resolve to the correct tab without duplicating the page implementation.

## 2. Design lock

- Preserve design-lab Wallet composition, Balance Route, preset selection, estimated payment path, subscription/order sections, continuous surfaces, and confirmation layers.
- Preserve design-lab Profile family header, Account Trust path, horizontal task tabs, forms, security status, connection rows, notification channel fields, and mobile reflow.
- Do not merge the four Profile tasks into the current production account/security/preferences presentation if that changes design-lab grouping or order.
- Do not expose internal user IDs.
- Do not replace radio amounts, switches, icon actions, dialogs, or tabs with generic text buttons.

## 3. Wallet contracts

| Capability | API client/New API source |
| --- | --- |
| Balance/usage/affiliate quota | current user/session |
| Top-up flags, presets, discounts, methods, minimums | `GET /api/user/topup/info` |
| Server-calculated payable amount | provider-specific amount endpoint |
| Payment creation | provider-specific user payment endpoint |
| Redemption | `POST /api/user/topup` |
| Billing history | `GET /api/user/topup/self` |
| Affiliate code/transfer | `/api/user/aff`, `/api/user/aff_transfer` |
| Plans/subscriptions/preference/payment | `/api/subscription/*` |

### Wallet subtasks

1. Render only amounts returned in `amount_options`. An empty list disables preset top-up; it never enables custom input or client defaults.
2. Treat discount data as a multiplier and the server calculation as the payable-value authority.
3. Reproduce the approved Balance Route and confirmation dialog with selected amount, provider, discount/estimate, and resulting action.
4. Feature-detect gateways, compliance, redemption, subscriptions, and affiliate capabilities from current responses.
5. Preserve safe external checkout URL validation and open the payment surface only after explicit confirmation.
6. Implement loading, disabled, empty, calculation failure, payment failure, cancellation, return, history, and refresh states without sample values.
7. Prevent duplicate purchase/redemption/transfer mutations and refetch only affected data.

## 4. Profile contracts and subtasks

| Capability | Source |
| --- | --- |
| Identity, quota, usage, bindings, settings | `GET /api/user/self` |
| Display name/password/language | `PUT /api/user/self` |
| Email code/binding | `/api/verification`, `/api/oauth/email/bind` |
| Daily check-in | `GET/POST /api/user/checkin` |

1. Map real identity and trust facts into the approved Profile and Account Trust layout.
2. Keep username and bound identity fields read-only where the backend does not support mutation.
3. Save only supported fields, show field-level/server errors, and reconcile session state after success.
4. Preserve email verification cooldown, Turnstile, and non-persistence of codes.
5. Keep check-in feature-disabled, calendar, already-completed, Turnstile, award, and error states truthful.

## 5. Security contracts and subtasks

| Capability | Source |
| --- | --- |
| Password change | supported self-profile update |
| 2FA status/setup/enable/disable/backup codes | `/api/user/2fa/*` |
| Passkey status/registration/verification/delete | `/api/user/passkey/*` |
| Sensitive-action verification | existing verification endpoint/adapter |
| System access token | `GET /api/user/token` |
| Account deletion | `DELETE /api/user/self` |

1. Reproduce the approved Security task order and interaction layers.
2. Never issue setup, verification, regeneration, or deletion requests twice. Pending actions disable duplicate submission.
3. Display QR/manual setup and backup codes only in the active security flow; clear them when the flow ends.
4. Keep WebAuthn browser feature detection, cancellation, timeout, and focus behavior.
5. Generate the system access token only after explicit confirmation; keep the full token in memory only and clear it on exit/session change.
6. Require the server-supported credentials plus the approved typed destructive confirmation before account deletion.
7. Clear all app credentials and local session state after deletion while preserving browser-local user content only according to the separately approved deletion policy.

## 6. Connections contracts and subtasks

1. Build connection rows from `/api/status`, current user binding fields, and `/api/user/oauth/bindings`.
2. Support verified email binding, GitHub, LinuxDO, and configured Google/custom OIDC without hard-coded provider availability.
3. Preserve the approved connect/disconnect confirmation and status layout.
4. Use the existing OAuth popup/callback binding flow and restore the Profile Connections tab after return.
5. Prevent disconnection when the backend rejects removing the required recovery/sign-in method; show the real actionable error.

## 7. Notifications contracts and subtasks

Use `PUT /api/user/setting` and `PUT /api/user/self` language behavior as defined by New API.

1. Reproduce approved channel selection and conditional Email, Webhook, Bark, and Gotify fields.
2. Support balance threshold, unpriced-model permission, and request-IP logging settings where present.
3. Parse existing settings defensively, preserve unknown fields, and submit only owned supported fields.
4. Validate destination URLs, email, secret/token requirements, threshold, and priority before mutation.
5. Never expose stored secret values if the backend redacts them; distinguish “configured” from an empty value.
6. Apply language changes only after the server update succeeds and navigate to the same localized route/tab.

## 8. i18n, accessibility, and security

- Move all Account design-lab copy into seven complete locale resources.
- Use locale-aware money, quota, discount, date, and order formatting while preserving exact values.
- Tabs use correct tab semantics and support keyboard navigation. Direct links restore the selected task.
- Dialogs/sheets enforce initial focus, focus trap, safe Escape rules, scroll lock, and focus restoration.
- Switches, radio amounts, password/token reveal, copy actions, WebAuthn, and payment controls have localized names and status feedback.
- Secrets and sensitive responses are absent from storage, URLs, query keys, logs, screenshots, and error messages.

## 9. File ownership and cleanup

Expected production areas:

```text
apps/web/src/pages/wallet-page.tsx
apps/web/src/pages/profile-page.tsx
apps/web/src/features/account/*
apps/web/src/lib/wallet.ts
apps/web/src/lib/passkey.ts
apps/web/src/stores/session.ts
packages/api-client/src/*
packages/i18n/src/*
packages/design-system/src/*
```

Remove the old Wallet/Profile visual implementation, disabled Security/Connections/Notifications navigation placeholders, duplicate settings parsers, and obsolete style blocks after the design-lab family is canonical. Retain verified API and WebAuthn helpers rather than rewriting them for presentation reasons.

## 10. Acceptance

- Wallet and all four Profile tasks match design-lab at required themes and viewports.
- Profile task deep links, refresh, back/forward, legacy intent mapping, and locale changes retain the correct task.
- Top-up never invents an amount, discount, payment value, method, plan, order, or balance.
- Password, 2FA, Passkey, access-token, connection, settings, and deletion flows pass primary, cancellation, failure, retry, and duplicate-submit tests.
- No internal user ID or sensitive secret is rendered or persisted outside its approved transient surface.
- Seven locales, keyboard interaction, focus management, reduced motion, long values, and 320px layouts pass.
- Replaced Account presentation and disabled placeholder code are removed after cutover.
