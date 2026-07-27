# Dogfood Report: Partokens R4.1 Playground

| Field | Value |
|---|---|
| Date | 2026-07-25 |
| App URL | `http://127.0.0.1:4180/#console-playground` |
| Scope | shadcn-admin/New York Playground migration, local conversations, simulated generation, responsive overlays |
| Result | Passed |

## Summary

`#console-playground` now uses `ConsoleShell` with `activeRoute='console-playground'`. The implementation reuses the existing R3.5 IndexedDB store and schema without modifying the old Playground prototype, copy, CSS, or storage files. Desktop uses a history rail and message workspace; mobile replaces the rail and complex overlays with standard Sheets.

No critical, high, medium, or low issue remains open in this scope. Browser checks completed with zero application console errors after stubbing the unrelated `/api/status` development endpoint.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 |

The production build emits the existing chunk-size advisory for the 1.2 MB design-lab bundle; it does not fail the build.

## Verification Matrix

| Area | Result |
|---|---|
| 1440px desktop light and dark | Passed |
| 1024px two-column workspace reflow | Passed |
| 390px light/dark and 320px light | Passed, no horizontal overflow |
| New, select, search, rename, delete conversations | Passed |
| Today / Previous 7 days grouping and search empty state | Passed |
| First message, automatic title, model, group, parameters after reload | Passed |
| Enter send, Shift+Enter newline, IME composition guard | Passed |
| Simulated stream, immediate stop, refresh recovery, regenerate | Passed |
| Edit and regenerate, copy, delete message | Passed |
| Current-conversation delete fallback | Passed |
| Clear all remains empty after reload | Passed |
| Local disclosure, byte count, valid import/export, invalid JSON | Passed |
| Loading, storage error with Retry, empty, disabled, Toast | Passed |
| Desktop Dialog and mobile Sheet Escape/focus behavior | Passed |
| Mobile History Sheet to delete Dialog handoff | Passed, one modal surface |
| Browser application console | Passed, 0 errors |
| Required route regression set | Passed |

## Corrections During QA

### Menu-to-overlay modal handoff

Opening a Dialog synchronously from a Radix DropdownMenu could leave the page pointer lock active after the Dialog closed. Menu-launched overlays now wait for the menu to finish closing before mounting the next modal surface. The mobile message action menu uses the same handoff.

### Persistence completion signal

Rename, model/group, and parameter success Toasts now follow the completed IndexedDB write. An immediate refresh after the completion signal reliably restores the saved values.

### Mobile toolbar and Escape behavior

The mobile toolbar uses two explicit rows so the conversation title is not compressed by controls. Route labels wrap without horizontal overflow. The complex mobile Sheet handles Escape directly and restores focus to its trigger; the History Sheet deletion transition closes before the destructive Dialog opens.

## Evidence

- `screenshots/desktop-light.png`
- `screenshots/desktop-dark.png`
- `screenshots/tablet-light.png`
- `screenshots/mobile-light.png`
- `screenshots/mobile-dark.png`
- `screenshots/mobile-320-light.png`
- `screenshots/stream-recovered.png`
- `screenshots/search-empty.png`
- `screenshots/loading.png`
- `screenshots/storage-error.png`
- `screenshots/mobile-delete-handoff.png`

Automated browser flows are retained in `functional.mjs`; viewport and overflow capture is retained in `dogfood.mjs`.

## Route Regression

The following hashes rendered non-empty pages at their expected routes without application runtime errors: `#system`, `#console`, `#console-analytics`, `#console-keys`, `#console-logs`, `#console-studio`, `#console-wallet`, and `#home`.

Live API chat traffic remains intentionally out of scope. Generation continues to use the existing stoppable simulated response behavior.
