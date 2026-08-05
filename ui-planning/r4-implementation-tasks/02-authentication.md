# R4.2 authentication pages

Depends on: `00-scope-and-foundation.md`, public theme/locale foundation from R4.1
Design baseline: active `auth-prototype.tsx` and `auth-prototype.css`
Production authority: New API authentication and role contracts

## 1. Scope

| Flow | Production route/entry |
| --- | --- |
| Sign in | `/{locale}/auth/sign-in` |
| Sign up | `/{locale}/auth/sign-up` |
| Email verification | localized registration verification step/route |
| Forgot password | `/{locale}/auth/forgot-password` |
| Reset password | `/{locale}/auth/reset` and technical `/user/reset` |
| OAuth callback | technical `/oauth/:provider` |
| 2FA challenge | `/{locale}/auth/otp` |

Email verification may share state with sign-up, but it must have the approved design-lab step composition and a reload-safe, non-sensitive recovery rule. Do not add email-code sign-in because New API has no such session contract.

## 2. Design lock

- Preserve the design-lab `Identity -> Session -> Workspace` structure.
- Keep the account boundary rail and the single, unframed authentication task. Do not restore the current generic authentication card layout.
- Preserve field sizes, Route Capsule primary actions, OAuth control order, service state, support information, responsive content order, and fixed OAuth callback geometry.
- At widths below the approved breakpoint, show the task first and boundary context second.
- State changes may replace content inside the approved task container but must not move the overall layout.

## 3. API contract map

| Interaction | Contract |
| --- | --- |
| Service flags, registration/OAuth/Turnstile visibility | `GET /api/status` |
| Password login | `POST /api/user/login` with optional Turnstile query |
| 2FA completion | `POST /api/user/login/2fa` |
| Session resolution and role | `GET /api/user/self` plus the existing auth refresh contract |
| OAuth state | `POST /api/oauth/state` as implemented by the current API client |
| OAuth exchange | `GET /api/oauth/:provider` adapter |
| Send registration verification | `GET /api/verification` |
| Register | `POST /api/user/register` |
| Request password reset | `GET /api/reset_password` |
| Confirm reset | `POST /api/user/reset` |

The current New API route/controller and its frontend behavior are authoritative when generated documentation is incomplete.

## 4. Subtasks

### 4.1 Shared authentication frame

1. Port the design-lab rail, task surface, brand, theme/language controls, status line, and mobile order.
2. Centralize field, password reveal, consent, OAuth, inline error, live status, and Route Capsule components without weakening native form semantics.
3. Keep theme and locale persistent. Keep credentials and challenges out of persistent storage.
4. Preserve the complete validated return path for ordinary-user sign-in.

### 4.2 Sign-in and role routing

1. Drive OAuth visibility and Turnstile from `/api/status`.
2. Require legal consent before password or OAuth submission if that remains the approved design behavior.
3. Handle direct success, 2FA challenge, invalid credentials, Turnstile failure, rate limiting, session refresh, and network failure in the fixed task container.
4. Route ordinary users to the validated localized return path or console overview.
5. Hard-navigate roles `>= 10` to the native New API management entry.

### 4.3 Registration and email verification

1. Respect `register_enabled` and `email_verification` feature flags.
2. Preserve the design-lab registration and verification step layouts, cooldown, validation, and consent behavior.
3. Keep only the minimum email/flow context in `sessionStorage`; never persist password or verification code.
4. Prevent duplicate send/register requests and retain actionable errors without account enumeration.

### 4.4 Password recovery

1. Use one non-enumerating success response for reset requests.
2. Parse and validate reset parameters without logging or persisting them.
3. Keep password validation, confirmation, expiry, invalid-token, success, and retry states in the approved reset layout.
4. Preserve the locale across the unprefixed `/user/reset` technical entry.

### 4.5 OAuth callback and 2FA

1. Restore the saved locale and intent at the technical callback.
2. Validate state/provider/result through the existing API adapter.
3. Preserve login and account-binding distinctions and popup behavior.
4. Implement authenticator and backup-code modes within the approved 2FA composition.
5. Clear transient challenge state after completion, cancellation, or terminal error.

## 5. i18n and accessibility

- Move all design-lab authentication copy into the permanent seven-locale resources without changing approved wording.
- Every field needs a visible label, correct `autocomplete`, error association, and input mode.
- Errors use alert semantics; status, send-code, copy, OAuth, and redirect progress use appropriate live-region semantics.
- Password reveal controls have localized accessible names and do not change input dimensions.
- Keyboard focus remains visible; pending states do not strand focus; reduced motion removes nonessential transitions.

## 6. Security and privacy acceptance

- No password, code, flow token, OAuth response, API token, or raw authentication envelope appears in localStorage, IndexedDB, URL history beyond required provider/reset parameters, console logs, telemetry, or screenshots.
- Return paths are same-origin localized user routes only.
- One authentication failure does not produce duplicate requests or loops.
- A feature-local `403` after login is not handled as an authentication refresh.
- Logout and terminal auth failures clear all in-memory credentials, including Studio credentials.

## 7. File ownership and cleanup

Expected production areas:

```text
apps/web/src/pages/auth-pages.tsx
apps/web/src/features/auth/*
apps/web/src/stores/session.ts
apps/web/src/lib/auth-session.test.ts
apps/web/src/router.tsx
packages/api-client/src/*
packages/i18n/src/*
```

After cutover, remove replaced generic auth frame markup, obsolete auth styles, duplicate OAuth helpers, and unreachable state branches. Keep technical callback/reset routes and tested compatibility behavior.

## 8. Acceptance

- All seven flows match the corresponding design-lab composition in light/dark desktop and mobile states.
- Feature flags alter availability without shifting or redesigning the task surface.
- Login, registration, verification, recovery, callback, and 2FA primary/error paths pass contract and E2E tests.
- Direct links, refreshes, return paths, locale restoration, role routing, and browser back/forward behavior are correct.
- Seven locales have complete copy with no fallback, clipping, overlap, or control resizing.
- Screen reader labels, focus order, initial focus, live feedback, and reduced motion pass.
- Old authentication presentation code is deleted after canonical route acceptance.
