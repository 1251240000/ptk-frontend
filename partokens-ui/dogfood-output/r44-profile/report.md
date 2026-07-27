# Dogfood Report: Partokens R44 Profile

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-profile` |
| Scope | Compact Profile workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-profile` now renders `ShadcnProfileScreen` inside `ConsoleShell` with `activeRoute='console-profile'`. The screen includes editable display name, email, username, timezone, and interface language fields; read-only account creation date and account ID; and email verification, session, and API access status.

The page uses component-local state and simulated timers only. It does not call a real API, persist profile data, add an account Store, add route navigation, or migrate Security, Connections, or Notifications.

## Modified Files

- `apps/design-lab/src/shadcn-profile-screen.tsx` (new)
- `apps/design-lab/src/App.tsx` (`#console-profile` switch only; existing R40-R43 edits preserved)
- `dogfood-output/r44-profile/report.md` (new)
- `dogfood-output/r44-profile/screenshots/*.png` (new evidence)

## Protected Scope

No R44 changes were made to:

- `apps/design-lab/src/console-account-prototype.tsx`
- `apps/design-lab/src/console-account-prototype.css`
- `apps/design-lab/src/console-account-copy.ts`
- Any legacy Store
- `apps/design-lab/src/shadcn-console-shell.tsx`
- Wallet, Overview, Playground, Image Studio, Analytics, API Keys, or Usage Logs screens
- Security, Connections, or Notifications implementations

The pre-existing uncommitted R40-R43 files and reports remain in the worktree.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 through Bun 1.3.14 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 through Bun 1.3.14 |
| `git diff --check -- apps/design-lab/src/App.tsx apps/design-lab/src/shadcn-profile-screen.tsx` | Passed |

The host does not expose a global `bun` binary, so the requested Bun commands were run with `npx --yes bun@1.3.14`. The production build emits the existing design-lab chunk-size advisory and completes successfully.

## State And Interaction Verification

| Area | Result |
|---|---|
| Ready / Sample | Passed: all profile, locale, account record, and status fields render |
| Skeleton Loading | Passed |
| Empty | Passed with Restore sample action |
| Error | Passed with Retry action |
| Retry | Passed: cancellable simulated load, disabled retry control, and success Toast |
| Disabled | Passed: unchanged/invalid Save is disabled |
| Save confirmation | Passed: confirmed snapshot lists changed fields before commit |
| Cancel | Passed: committed profile is unchanged, draft remains available, and focus is restored |
| Processing | Passed: inputs, selects, Save, confirmation controls, and state menu are disabled |
| Success | Passed: confirmed snapshot becomes the current component state |
| Toast | Passed: one `Profile updated` Toast per successful operation |
| Duplicate protection | Passed: synchronous double confirmation creates one completion and one Toast |
| Timer cleanup | Passed: retry and save timers produce no late feedback after component unmount |

No profile state is written to `localStorage`, `sessionStorage`, IndexedDB, or a Store. Reloading/remounting restores the sample state as intended.

## Dialog And Sheet Verification

| Interaction | Desktop Dialog | Mobile Sheet |
|---|---|---|
| Escape | Passed | Passed |
| Close button | Passed | Passed |
| Outside click | Passed | Passed |
| Focus restoration | Passed | Passed |
| Keyboard operation | Passed | Passed |
| Processing dismissal guard | Passed | Passed by controlled open state; related actions disabled |

Desktop confirmation uses Dialog. Viewports below 640px use a bottom Sheet. During processing, dismissal cannot interrupt or duplicate the operation.

## Responsive Verification

| Viewport | Theme | Width Result | Visual Result |
|---|---|---|---|
| 1440 x 1000 | Light | document/body/main at or below viewport | Passed |
| 1440 x 1000 | Dark | document/body/main at or below viewport | Passed |
| 1024 x 900 | Light | document/body/main at or below viewport | Passed; form, account record, and status hierarchy remain clear |
| 390 x 844 | Light | `390 / 390` document width | Passed; single-column layout |
| 320 x 720 | Dark | `320 / 320` document width | Passed; single-column layout |

Visual review found no horizontal overflow, text truncation, control overlap, incoherent wrapping, or layout jump. Account ID and creation date use monospaced tabular text, and the account ID wraps safely at narrow widths.

## Route Regression

All requested routes rendered non-empty content without page errors:

- `#console`
- `#console-analytics`
- `#console-keys`
- `#console-logs`
- `#console-playground`
- `#console-studio`
- `#console-wallet`
- `#console-security`
- `#console-connections`
- `#console-notifications`
- `#system`
- `#home`

## Browser Console

The final Playwright run completed with `consoleErrors=[]` and `pageErrors=[]` after stubbing only the unrelated `/api/status` development endpoint. No profile API was added or called.

## Screenshots

- `screenshots/profile-1440-light.png`
- `screenshots/profile-1440-dark.png`
- `screenshots/profile-1024-light.png`
- `screenshots/profile-390-light.png`
- `screenshots/profile-320-dark.png`
- `screenshots/profile-loading.png`
- `screenshots/profile-empty.png`
- `screenshots/profile-error.png`
- `screenshots/profile-dialog.png`
- `screenshots/profile-sheet.png`
- `screenshots/profile-success-toast.png`

The Vite development server remains available on port 4180. R45 Security, Connections, and Notifications migration is intentionally excluded and should be planned as a separate stage.
