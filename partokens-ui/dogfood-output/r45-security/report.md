# Dogfood Report: Partokens R45 Security

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-security` |
| Scope | Compact Security workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-security` now renders `ShadcnSecurityScreen` inside `ConsoleShell` with `activeRoute='console-security'`. The screen provides a compact security overview plus local-only simulations for two-factor authentication, passkeys, password changes, and a system access token.

All sensitive values are inert demo data held in component memory. The screen does not call an API, WebAuthn, TOTP, or password service; it does not create credentials; and it does not use `localStorage`, `sessionStorage`, IndexedDB, or an account Store. Reloading/remounting restores the initial Security sample.

## Modified Files

- `apps/design-lab/src/shadcn-security-screen.tsx` (new)
- `apps/design-lab/src/App.tsx` (`#console-security` switch only; existing R40-R44 changes preserved)
- `apps/design-lab/src/shadcn-console-shell.tsx` (minimal `console-security` route union and breadcrumb label only)
- `dogfood-output/r45-security/report.md` (new)
- `dogfood-output/r45-security/screenshots/*.png` (14 new evidence files)

`ConsoleShell` did not previously accept `console-security`. Compilation therefore required the permitted minimal type extension and corresponding `routeLabels` entry. No Shell layout, behavior, navigation structure, or shared component was refactored.

## Protected Scope

No R45 changes were made to:

- `apps/design-lab/src/console-account-prototype.tsx`
- `apps/design-lab/src/console-account-prototype.css`
- `apps/design-lab/src/console-account-copy.ts`
- Any legacy Store
- Any design-system component
- Profile, Wallet, Overview, Playground, Image Studio, Analytics, API Keys, Usage Logs, System, auth, or public screens
- Connections or Notifications pages

The existing uncommitted R40-R44 files, reports, public assets, and unrelated sibling directories remain in the worktree. They were not submitted, cleaned, reverted, or modified by R45.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 through Bun 1.3.14 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 through Bun 1.3.14 |
| `git diff --check -- apps/design-lab/src/App.tsx apps/design-lab/src/shadcn-console-shell.tsx apps/design-lab/src/shadcn-security-screen.tsx` | Passed |

The host does not expose a global `bun` binary, so the requested commands were executed with `npx --yes bun@1.3.14`. The production build completed successfully and emitted only the existing design-lab chunk-size advisory.

## Security Overview

| Check | Result |
|---|---|
| Two-factor status | Passed; Disabled/Enabled stays aligned with the action section |
| Passkey status | Passed; Not registered/Registered stays aligned with the action section |
| Password update time | Passed; monospaced, tabular timestamp updates only after confirmation |
| Current session | Passed; active demo device ID and session time use monospaced tabular text |
| Ready / Loading / Empty / Error | Passed through the More state menu |
| Retry | Passed; controlled processing, disabled Retry, Ready recovery, and one Toast |

## Two-Factor Authentication

- Setup uses inert text secret `DEMO-TOTP-...`; no QR, SVG placeholder, or real TOTP integration is present.
- Empty/non-six-digit and incorrect codes cannot start success processing. Incorrect `111111` produced a clear inline error; `246810` was accepted.
- Processing disables the code input, confirmation controls, and state menu. Synchronous double confirmation completed once.
- Success updates the overview and action area, opens six one-time demo recovery codes, and emits one success Toast.
- Recovery codes exist only in component state, copy successfully with Toast feedback, and are cleared when the recovery layer closes.
- Disable requires confirmation. Cancel preserved Enabled; confirm changed the summary/action to Disabled once.

## Passkey

- Register and Remove are local simulations and never invoke WebAuthn or create a credential.
- Register requires confirmation; Cancel preserved the unregistered state.
- Confirm showed Processing, disabled confirmation, blocked dismissal, completed once, updated the summary/action, and showed one success Toast.
- Remove requires destructive confirmation. Cancel preserved Registered; confirm returned the overview/action to the unregistered state.

## Password

| Validation | Result |
|---|---|
| Empty current/new/confirm | Passed with field-specific inline errors |
| New password below 12 characters | Passed |
| New password equals current | Passed |
| New password and confirmation differ | Passed |
| Invalid submit opening confirmation | Prevented |
| Confirmation Cancel | Preserved the draft and did not change the committed update time |
| Confirmed update | Completed once, updated the summary timestamp, cleared all three fields, and showed one Toast |

Password inputs remain masked. Their values are never displayed, logged, persisted, or sent to an API.

## System Access Token

- Initial/revoked state is visibly Masked.
- Generate, Regenerate, and Revoke each require confirmation and use independent guarded token processing.
- Cancel was verified for all three actions and did not change the current value/state.
- Generated strings use the explicit `pt_sys_demo_..._TEMPORARY` form and exist only in component memory.
- Copy produced explicit success feedback. Regenerate replaced the demo value; Revoke removed it and restored Masked.
- Reload/remount restored the initial Masked state, and browser storage contained no security state keys.

## Dialog, Sheet, And Keyboard

| Interaction | Desktop Dialog | Mobile bottom Sheet |
|---|---|---|
| Escape | Passed | Passed |
| Close button | Passed | Passed |
| Outside click | Passed | Passed |
| Trigger focus restoration | Passed | Passed |
| Tab focus containment | Passed across 8 focus steps | Passed across 5 focus steps |
| Enter activation | Passed for open, confirm, and close | Passed for open and confirm |
| Processing dismissal guard | Passed for Escape | Passed for outside click |

All controls remain reachable through native keyboard interaction. Processing hides/disables the desktop close button, disables Sheet close interaction, blocks Escape/outside dismissal, and disables confirm/cancel controls.

## Timer And Duplicate Protection

- Retry, 2FA, Passkey, Password, and Token use separate tracked timer refs.
- State preview changes and component cleanup clear every timer and synchronous guard.
- Confirmation is protected by both a synchronous per-operation guard and a unique processed-operation ID.
- Rapid double confirmation was exercised for 2FA enable/disable, Passkey registration, Password, and Token generation; each completed once with one state transition and one Toast.
- A Passkey timer was started and the Security component was immediately unmounted. After 1.1 seconds there was no delayed Toast or state update; remount restored initial state.
- Copy feedback uses an in-flight guard and mounted check, preventing late or duplicated feedback.

## Responsive Verification

| Viewport | Theme | Width Result | Visual Result |
|---|---|---|---|
| 1440 x 1000 | Light | `1440 / 1440 / 1440` viewport/document/body | Passed |
| 1440 x 1000 | Dark | `1440 / 1440 / 1440` viewport/document/body | Passed |
| 1024 x 900 | Light | `1024 / 1024 / 1024` | Passed; overview remains a clear 2x2 grid |
| 390 x 844 | Light | `390 / 390 / 390` | Passed; single-column layout and bottom Sheet |
| 320 x 720 | Light | `320 / 320 / 320` | Passed; single-column layout and full-width actions |

Visual review found no horizontal overflow, clipped text, hidden controls, overlapping content, layout jump, or incoherent wrapping. A first-pass equal-height layout issue that could clip 2FA/Passkey actions was found during visual inspection, fixed with section-level flex sizing, and the full browser suite and screenshots were regenerated afterward.

## Route Regression

The final browser run verified non-empty rendering for every requested route without page errors:

- `#console`
- `#console-analytics`
- `#console-keys`
- `#console-logs`
- `#console-playground`
- `#console-studio`
- `#console-wallet`
- `#console-profile`
- `#console-connections`
- `#console-notifications`
- `#system`
- `#home`

Connections and Notifications remain on their legacy implementations for R46 and R47 respectively.

## Browser Console

The final Chrome/Playwright functional run passed 63 assertions and the focused keyboard run passed 16 assertions. Results were `consoleErrors=[]` and `pageErrors=[]`. Only the unrelated `/api/status` development endpoint was stubbed; no Security endpoint was added or called.

## Screenshots

- `screenshots/security-1440-light.png`
- `screenshots/security-1440-dark.png`
- `screenshots/security-1024.png`
- `screenshots/security-390.png`
- `screenshots/security-320.png`
- `screenshots/security-loading.png`
- `screenshots/security-empty.png`
- `screenshots/security-error.png`
- `screenshots/security-2fa-setup.png`
- `screenshots/security-recovery-codes.png`
- `screenshots/security-passkey-confirmation.png`
- `screenshots/security-password-validation.png`
- `screenshots/security-token-confirmation.png`
- `screenshots/security-success-toast.png`

The Vite development server remains available on port 4180. R45 stops here; Connections and Notifications were not migrated.
