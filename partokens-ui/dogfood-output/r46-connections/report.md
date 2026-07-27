# Dogfood Report: Partokens R46 Connections

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-connections` |
| Scope | Compact Connections workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-connections` now renders `ShadcnConnectionsScreen` inside `ConsoleShell` with `activeRoute='console-connections'`. It includes a four-cell provider overview and structured Email, GitHub, LinuxDO, and Google rows with local-only Details, Connect, Disconnect, and Primary actions.

No OAuth flow, API, credential, private account value, Store, or browser persistence was added. Provider state and demo identifiers exist only in component memory and return to the initial sample after reload/remount.

## Modified Files

- `apps/design-lab/src/shadcn-connections-screen.tsx` (new)
- `apps/design-lab/src/App.tsx` (`#console-connections` switch only; existing R40-R45 changes preserved)
- `apps/design-lab/src/shadcn-console-shell.tsx` (minimal `console-connections` route union and breadcrumb label only)
- `dogfood-output/r46-connections/report.md` (new)
- `dogfood-output/r46-connections/screenshots/*.png` (14 evidence files)

`ConsoleShell` did not previously accept `console-connections`, so compilation required the permitted route type and `routeLabels` additions. No Shell layout, navigation structure, or behavior was changed.

## Protected Scope

R46 did not modify:

- `apps/design-lab/src/console-account-prototype.tsx`
- `apps/design-lab/src/console-account-prototype.css`
- `apps/design-lab/src/console-account-copy.ts`
- Any legacy Store or design-system component
- Overview, Analytics, API Keys, Usage Logs, Playground, Image Studio, Wallet, Profile, or Security screens
- Notifications or any other legacy/public/auth screen

All existing uncommitted R40-R45 and unrelated workspace changes were preserved.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 through Bun 1.3.14 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 through Bun 1.3.14 |
| `git diff --check -- apps/design-lab/src/App.tsx apps/design-lab/src/shadcn-console-shell.tsx apps/design-lab/src/shadcn-connections-screen.tsx` | Passed |

The host has no global `bun`, so the requested commands were executed with `npx --yes bun@1.3.14`. Build output contained only the existing chunk-size advisory.

## Overview And States

| Check | Result |
|---|---|
| Connected providers | Passed; changes immediately after Connect/Disconnect |
| Available providers | Passed; remains the inverse of connected count |
| Primary sign-in | Passed; starts as Email and updates after confirmation |
| Last connection update | Passed; monospaced timestamp changes only after confirmed mutations |
| Ready / Skeleton Loading / Empty / Error | Passed through the More menu |
| Retry | Passed with disabled processing control, Ready recovery, and one Toast |

## Provider Management

- Email starts Connected and Primary using the inert ID `email_demo_primary_01`.
- GitHub starts Connected; LinuxDO and Google start Available.
- Connect requires confirmation, supports Cancel, disables controls during Processing, updates row/overview consistently, and shows one success Toast.
- New connection IDs use the explicit `*_demo_R46_CONNECTED` form. No OAuth window, credential, token, email address, or private profile value is created.
- Disconnect uses destructive confirmation. Cancel preserves the connection; confirm removes only component-local ID/time state and updates the overview.
- Rapid double confirmation for Connect and Disconnect completed once.

## Provider Details

Desktop uses Dialog and mobile uses a bottom Sheet. Connected provider details show only demo provider ID, demo connection time, status, and a concise permission summary. Available providers show `Not assigned` and `Not connected` instead of fabricated credentials.

Details are read-only and do not start a timer or mutate provider state.

## Primary Sign-In

- Connected non-primary providers expose `Make primary`; the current Primary action is disabled.
- Primary changes require confirmation and support Cancel.
- Confirmed changes update the overview, both affected provider rows, timestamp, and Toast exactly once.
- Attempting to disconnect the current Primary does not open confirmation and displays a clear inline Error.
- After GitHub became Primary, Email could be disconnected. The remaining GitHub Primary was then protected from disconnect, preserving at least one primary sign-in method.

## Dialog, Sheet, And Keyboard

| Interaction | Desktop Dialog | Mobile bottom Sheet |
|---|---|---|
| Escape | Passed | Passed |
| Close button | Passed | Passed |
| Outside click | Passed | Passed |
| Trigger focus restoration | Passed | Passed |
| Tab focus containment | Passed across 6 steps | Passed across 5 steps |
| Enter activation | Passed | Passed through native controls |
| Processing Escape/outside guard | Passed | Passed |
| Processing confirm disabled | Passed | Passed |

Cancel, Escape, close, and outside click never submitted an operation. During Processing the state menu, related actions, confirm/cancel, and overlay dismissal were disabled or blocked.

## Timer And Duplicate Protection

- Retry, Connect, Disconnect, and Primary use separate timer refs.
- State preview changes, Restore sample, and unmount clear all timer refs and synchronous guards.
- Every mutation uses a synchronous per-kind guard plus a unique processed-operation ID.
- Double confirmation was exercised for Connect, Disconnect, and Primary with one completion and one feedback event.
- A Google Connect operation was started and the component immediately unmounted. After 1.1 seconds there was no delayed Toast or state update; remount restored Google Available and Email Primary.
- Static and browser checks found no connection/provider state in `localStorage`, `sessionStorage`, or IndexedDB.

## Responsive Verification

| Viewport | Theme | Width Result | Visual Result |
|---|---|---|---|
| 1440 x 1000 | Light | `1440 / 1440 / 1440` viewport/document/body | Passed |
| 1440 x 1000 | Dark | `1440 / 1440 / 1440` | Passed |
| 1024 x 900 | Light | `1024 / 1024 / 1024` | Passed; overview remains a clear 2x2 grid |
| 390 x 844 | Light | `390 / 390 / 390` | Passed; single-column provider rows and full-width actions |
| 320 x 720 | Light | `320 / 320 / 320` | Passed; single-column provider rows and full-width actions |

Visual review found no horizontal overflow, text truncation, overlapping controls, hidden actions, incoherent wrapping, or layout jump.

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

Notifications remains on its legacy implementation for R47.

## Browser Console

The main Chrome/Playwright run passed 69 assertions, and the focused mobile Processing Sheet run passed 4 more. Final results were `consoleErrors=[]` and `pageErrors=[]`. Only the unrelated `/api/status` development endpoint was stubbed; Connections made no API request.

## Screenshots

- `screenshots/connections-1440-light.png`
- `screenshots/connections-1440-dark.png`
- `screenshots/connections-1024.png`
- `screenshots/connections-390.png`
- `screenshots/connections-320.png`
- `screenshots/connections-loading.png`
- `screenshots/connections-empty.png`
- `screenshots/connections-error.png`
- `screenshots/connections-connect-confirmation.png`
- `screenshots/connections-disconnect-confirmation.png`
- `screenshots/connections-provider-details.png`
- `screenshots/connections-primary-confirmation.png`
- `screenshots/connections-inline-error.png`
- `screenshots/connections-success-toast.png`

The Vite development server remains available on port 4180. R46 stops here; Notifications was not migrated.
