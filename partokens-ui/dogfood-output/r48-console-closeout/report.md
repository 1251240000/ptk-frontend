# Dogfood Report: Partokens R48 Console Closeout

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/` |
| Scope | Shared `ConsoleShell` navigation closeout and full route regression |
| Result | Passed |

## Summary

Security, Connections, and Notifications now have first-class entries in the shared Account navigation. Notifications is also reachable from the header account menu and the sidebar user menu. All eleven migrated Console screens remain in the existing `ConsoleShell` layout and report the correct active navigation item.

Mobile route selection closes the sidebar and restores focus to the sidebar trigger on the newly mounted route. Sidebar dropdown navigation is deferred by one animation frame so Radix can finish closing the nested menu before the route replaces the Shell; this prevents stale modal pointer-event locks. The header account menu is non-modal because it is a pure navigation menu and is not nested in the mobile Sheet.

The now-unreachable `ConsoleDataPrototype` dispatch was removed from `App.tsx`. Hash recognition still uses the complete typed `ConsoleRoute` list, and no legacy implementation file was changed or deleted.

## Modified Files

- `apps/design-lab/src/shadcn-console-shell.tsx`
  - Added Security, Connections, and Notifications to Account navigation.
  - Connected both Notifications menu items to `#console-notifications`.
  - Unified mobile close-and-navigate behavior and restored focus after route remount.
  - Preserved the existing Shell structure, dimensions, theme, groups, and desktop behavior.
- `apps/design-lab/src/App.tsx`
  - Removed only the unreachable `ConsoleDataPrototype` import and render branch.
  - Uses `ConsoleRoute` as the typed source for the existing eleven hash routes.
- `dogfood-output/r48-console-closeout/report.md`
- `dogfood-output/r48-console-closeout/screenshots/*.png`

## Protected Scope

R48 did not modify any R37-R47 screen implementation, old prototype implementation, CSS, copy, design-system component, API client, Store, persistence layer, or production dependency. No file was committed, cleaned, reverted, or deleted. All pre-existing uncommitted and unrelated workspace changes were preserved.

Static inspection found no new `fetch`, API, Store, `localStorage`, `sessionStorage`, or IndexedDB use in `ConsoleShell`.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 with Bun 1.3.14 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 with Bun 1.3.14 |
| `git diff --check -- apps/design-lab/src/App.tsx apps/design-lab/src/shadcn-console-shell.tsx` | Passed |

The host shell did not expose Bun on `PATH`, so the same commands were executed with the existing Bun 1.3.14 absolute binary. Vite 8.1.5 transformed 1,788 modules and completed in 623 ms. The only build message was the pre-existing chunk-size advisory.

## Navigation Verification

The following routes were exercised on desktop and mobile, rendered non-empty content, and showed exactly the expected current navigation item:

- `#console` - Overview
- `#console-analytics` - Analytics
- `#console-keys` - API keys
- `#console-logs` - Usage logs
- `#console-playground` - Playground
- `#console-studio` - Image studio
- `#console-wallet` - Wallet
- `#console-profile` - Profile
- `#console-security` - Security
- `#console-connections` - Connections
- `#console-notifications` - Notifications

Desktop navigation clicked all eleven shared sidebar entries in sequence. At 390px, all eleven entries were also clicked in sequence; each selection updated the hash, closed the Sheet, kept the target active on reopening, and focused the new route's sidebar trigger. The sidebar user menu reached Profile and Notifications correctly. Header Notifications was activated with the keyboard and reached `#console-notifications`.

## Keyboard And Focus

| Check | Result |
|---|---|
| Header account menu: Enter and Notifications activation | Passed |
| Mobile sidebar trigger: Enter | Passed |
| Mobile navigation item: Enter | Passed |
| Mobile sidebar: Escape close and focus restoration | Passed on all eleven routes |
| Mobile sidebar: `Ctrl+B` open/close and focus restoration | Passed |
| Mobile Sheet focus containment | Passed across 18 Tab steps |
| Nested user-menu route cleanup | Passed; no pointer-event lock remained |

## Responsive Verification

| Viewport | Coverage | Result |
|---|---|---|
| 1440 x 1000 | All Console routes, Account navigation, header and user menus | Passed |
| 390 x 844 | All Console routes, active items, route clicks, close/focus behavior | Passed |
| 320 x 720 | All Console routes plus open Account navigation | Passed |

For every Console route at 1440px, 390px, and 320px, `documentElement.scrollWidth` and `body.scrollWidth` did not exceed `window.innerWidth`. Stable screenshots were reviewed after Sheet animation completion. No horizontal overflow, clipping, text truncation, overlap, incoherent wrapping, or layout jump was observed. The 320px navigation retains all eleven entries and the user footer within the viewport.

## Route Regression

Browser smoke coverage confirmed non-empty rendering and no page-level horizontal overflow for all primary public, authentication, and system routes:

- Public: `#home`, `#models`, `#docs`, `#about`, `#notices`, `#legal-user`, `#legal-service`, `#legal-privacy`
- Authentication: `#signin`, `#signup`, `#verify-email`, `#forgot-password`, `#reset-password`, `#oauth-callback`, `#auth-otp`
- Component lab: `#system`

The unrelated existing `/api/status` request was stubbed with a successful local response during browser verification. No new service request was introduced by R48.

## Browser Console

Three final Chrome/Playwright runs passed 213 assertions in total: 168 full route/navigation/responsive assertions, 22 keyboard/focus assertions, and 23 all-route mobile navigation assertions. Final results were `consoleErrors=[]` and `pageErrors=[]` in every run.

## Screenshots

- `screenshots/console-account-navigation-1440.png`
- `screenshots/header-notifications-menu-1440.png`
- `screenshots/console-navigation-390.png`
- `screenshots/console-navigation-320.png`
- `screenshots/console-notifications-390.png`
- `screenshots/console-notifications-320.png`

The Vite development server remains available on port 4180. R48 stops here.
