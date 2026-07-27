# Dogfood Report: Partokens R47 Notifications

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-notifications` |
| Scope | Compact Notifications preference workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-notifications` now renders `ShadcnNotificationsScreen` inside `ConsoleShell` with `activeRoute='console-notifications'`. The page has a committed four-cell overview, a draft delivery form for Email, Webhook, Bark, and Gotify, a separately emphasized private-behavior section, and local-only Save/Test confirmation flows.

No notification, email, webhook, Bark, Gotify, or model request is sent. Configuration exists only in component memory and returns to the initial sample after reload/remount. Seed data uses `alerts@example.invalid` and `.invalid` demo endpoints. Secret/token fields are password inputs; their values are not echoed in summaries, Toasts, browser storage, or logs.

## Modified Files

- `apps/design-lab/src/shadcn-notifications-screen.tsx` (new)
- `apps/design-lab/src/App.tsx` (`#console-notifications` switch only; existing R40-R46 changes preserved)
- `apps/design-lab/src/shadcn-console-shell.tsx` (minimal `console-notifications` route union and breadcrumb label only)
- `dogfood-output/r47-notifications/report.md` (new)
- `dogfood-output/r47-notifications/screenshots/*.png` (14 evidence files)

`ConsoleShell` did not previously accept `console-notifications`, so compilation required the permitted route type and `routeLabels` additions. Shell layout, navigation structure, and behavior were not changed.

## Protected Scope

R47 did not modify:

- `apps/design-lab/src/console-account-prototype.tsx`, its CSS, copy, or Store
- Any design-system component or production dependency
- `ConsoleShell` layout, navigation entries, or runtime behavior
- Overview, Analytics, API Keys, Usage Logs, Playground, Image Studio, Wallet, Profile, Security, or Connections screens
- Any other legacy, public, authentication, or production page

All existing uncommitted R40-R46 and unrelated workspace changes were preserved. Nothing was committed, reverted, cleaned, or deleted.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 through Bun 1.3.14 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 through Bun 1.3.14 |
| `git diff --check -- apps/design-lab/src/App.tsx apps/design-lab/src/shadcn-console-shell.tsx apps/design-lab/src/shadcn-notifications-screen.tsx` | Passed |
| `http://127.0.0.1:4180/#console-notifications` | HTTP 200; screen rendered |

The host has no global `bun`, so the requested commands were executed with `npx --yes bun@1.3.14`. Vite transformed 1,798 modules and emitted only the existing chunk-size advisory.

## Overview And Page States

| Check | Result |
|---|---|
| Active delivery channel | Passed; reads committed state and updates after confirmed Save |
| Balance warning threshold | Passed; monospaced USD amount updates after Save |
| Pricing fallback | Passed; remains Blocked until a sensitive draft is confirmed and saved |
| Request IP logging | Passed; remains Disabled until a sensitive draft is confirmed and saved |
| Ready / Skeleton Loading / Empty / Error | Passed through the More menu |
| Retry | Passed with immediate Disabled state, duplicate guard, Ready recovery, and one Toast |

State preview changes close pending overlays, clear errors and processing state, and clear every timer/guard before rendering the requested preview.

## Delivery Preferences

- Email shows the explicit demo destination `alerts@example.invalid` and validates required/email format.
- Webhook shows a monospaced `.invalid` endpoint and masked signing-secret field.
- Bark shows a monospaced `.invalid` endpoint and masked device-token field.
- Gotify shows a monospaced `.invalid` endpoint and masked application-token field.
- Switching channels renders only the relevant configuration fields without resizing the surrounding structure incoherently.
- Test and Save both validate the active channel plus balance threshold before opening confirmation.
- No endpoint, destination, secret, or token is sent to a service.

## Validation

| Input | Result |
|---|---|
| Email | Required and format validation passed; invalid input did not open confirmation |
| Webhook/Bark/Gotify URL | Required HTTP/HTTPS URL validation passed for every channel |
| Secret/token | Required and minimum 8-character validation passed; all fields remained `type='password'` |
| Balance warning | Required numeric validation passed; `0` rejected and `0.01` accepted |
| Privacy data | Secret values were absent from visible text, confirmation summary, Toast, storage inspection, and console output |

Inline errors use `role='alert'`, `aria-invalid`, and field-specific descriptions. Invalid forms never opened a success confirmation or changed committed state.

## Save And Test

- The form keeps independent draft and committed objects. Overview reads only committed values.
- Initial Save is Disabled. Any draft change enables it and shows `Unsaved changes`.
- Save opens a redacted change summary. The exercised Email-to-Webhook save summarized channel, threshold, and masked credential status without exposing the credential.
- Cancel, Escape, close button, and outside click all closed the confirmation without submitting or changing Overview.
- Confirmed Save normalized fields, synchronized Overview and form, returned Save to Disabled, and displayed exactly one success Toast.
- Send test notification requires confirmation, is fully simulated, displays one Toast, and does not mutate committed preferences.

## Private Behavior

Both `Allow models without configured pricing` and `Record request IP in logs` use design-system Switch controls. Enabling either requires a warning confirmation; disabling a draft option is immediate. Cancel leaves both draft and committed values unchanged.

The pricing fallback flow was confirmed on desktop and remained Blocked in Overview until Save. Request IP logging was confirmed in the mobile Sheet, remained Disabled before Save, and changed to Enabled only after the mobile Save confirmation.

## Dialog, Sheet, And Keyboard

| Interaction | Desktop Dialog | Mobile bottom Sheet |
|---|---|---|
| Save / Test / sensitive confirmation | Passed | Passed |
| Cancel / Escape / close / outside click | Passed without submission | Passed without submission |
| Trigger focus restoration | Passed | Passed |
| Tab focus containment | Passed across 8 steps | Passed across 6 steps |
| Enter/native button activation | Passed | Passed |
| Processing Escape/outside guard | Passed | Passed through shared overlay behavior |
| Processing confirm/cancel Disabled | Passed | Passed |

The 390px confirmation measured as a bottom-anchored Sheet after its entry animation. Processing hides or disables the close affordance, disables footer actions, prevents Escape/outside dismissal, and blocks repeated confirmation.

## Timers And Duplicate Protection

- Retry, Save, Test, and sensitive setting operations use four independent timer refs.
- Every asynchronous action has a synchronous per-kind guard and unique operation ID; processed IDs cannot complete twice.
- Rapid double activation was exercised for Retry, Save, Test, and sensitive setting confirmation. Each completed once.
- State preview changes and Restore sample clear all timers, operations, guards, validation errors, and processing state.
- Unmount clears all timers and marks the component inactive before any callback can update state or emit a Toast.
- A Test operation was started, the screen was immediately unmounted, and the browser waited beyond the timer duration. No delayed Toast or state update appeared; remount restored Email and the initial sample.

## Persistence And Network

Static inspection found no `fetch`, API client, `localStorage`, `sessionStorage`, IndexedDB, or console logging in the Notifications screen. Browser inspection after all interactions found only the app's pre-existing `partokens-theme` and `partokens-locale` keys, an empty `sessionStorage`, and no IndexedDB databases. No notification field or test credential appeared in persisted data.

The browser run stubbed only the unrelated existing `/api/status` request. Notifications made no service request.

## Responsive Verification

| Viewport | Theme | Width Result | Visual Result |
|---|---|---|---|
| 1440 x 1000 | Light | `1440 / 1440 / 1440` viewport/document/body | Passed |
| 1440 x 1000 | Dark | `1440 / 1440 / 1440` | Passed |
| 1024 x 900 | Light | `1024 / 1024 / 1024` | Passed; overview is a stable 2x2 grid |
| 390 x 844 | Light | `390 / 390 / 390` | Passed; single-column form, full-width actions, bottom Sheet |
| 320 x 720 | Light | `320 / 320 / 320` | Passed; longest labels wrap without clipping |

Visual review found no horizontal overflow, truncation, overlapping settings, hidden actions, layout jump, or incoherent wrapping. Thresholds, timestamps, and demo endpoints use monospaced tabular text. No gradient, illustration, decorative orb, Hero, or nested Card pattern was introduced.

## Route Regression

The final browser run verified non-empty rendering without page errors for:

- `#console`
- `#console-analytics`
- `#console-keys`
- `#console-logs`
- `#console-playground`
- `#console-studio`
- `#console-wallet`
- `#console-profile`
- `#console-security`
- `#console-connections`
- `#console-notifications`
- `#system`
- `#home`

## Browser Console

The final Chrome/Playwright run passed 97 assertions. Final results were `consoleErrors=[]` and `pageErrors=[]`. No notification delivery request was observed.

## Screenshots

- `screenshots/notifications-1440-light.png`
- `screenshots/notifications-1440-dark.png`
- `screenshots/notifications-1024.png`
- `screenshots/notifications-390.png`
- `screenshots/notifications-320.png`
- `screenshots/notifications-loading.png`
- `screenshots/notifications-empty.png`
- `screenshots/notifications-error.png`
- `screenshots/notifications-email-preferences.png`
- `screenshots/notifications-webhook-validation.png`
- `screenshots/notifications-save-confirmation.png`
- `screenshots/notifications-sensitive-confirmation.png`
- `screenshots/notifications-mobile-sheet.png`
- `screenshots/notifications-success-toast.png`

The Vite development server remains available on port 4180. R47 stops here.
