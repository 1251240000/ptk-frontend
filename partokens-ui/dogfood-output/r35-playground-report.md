# Dogfood Report: Partokens R3.5 Playground

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/#console-playground` |
| **Session** | `partokens-r35-playground`, `partokens-r35-qa2` |
| **Scope** | Local conversations, message workflow, generation controls, local data, responsive/i18n behavior |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.5 page. Corrections during QA included reliable first-message persistence, normalization of interrupted streams after reload, persistent clear-all state, mobile sheet/modal handoff, dialog focus on nested confirmation, and localized copy feedback.

## Verification Matrix

| Area | Result |
|---|---|
| Design-lab TypeScript and production build | Passed |
| New chat, first-message title, reload persistence | Passed |
| Search and no-results state | Passed |
| Rename and reload persistence | Passed |
| Simulated streaming, immediate stop, regenerate | Passed |
| Edit-and-regenerate and message deletion | Passed |
| Conversation deletion and selection fallback | Passed |
| Model, group, stream, max-token and seed persistence | Passed |
| Local storage disclosure and byte count | Passed |
| JSON export and validated import | Passed |
| Clear-all confirmation and empty state after reload | Passed |
| Create/send after a persistent clear-all | Passed |
| Interrupted stream normalized to stopped after reload | Passed |
| Mobile history sheet selection and focus | Passed |
| Sheet-to-delete-confirm transition uses one dialog | Passed |
| `1440 x 1000` desktop light | Passed |
| `1024 x 900` workspace reflow | Passed |
| `768 x 900` mobile navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 760` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven Playground locales | Complete |
| Theme and locale persistence after reload | Passed |
| Browser runtime errors | 0 |

## Resolved Findings

### ISSUE-001: First send after creating an empty conversation could miss persistence

State updates previously attempted to capture the updated conversation from inside a React state updater. A synchronous current-state reference now computes the next collection before rendering and writes the exact updated conversation to IndexedDB.

Verification: `screenshots/r35/playground-first-message-reloaded.png`, `screenshots/r35/playground-post-clear-first-message-reloaded.png`

### ISSUE-002: Refreshing during streaming left an orphaned generating state

The partial assistant message could remain marked `streaming` after the browser had discarded its timers. Loading now normalizes interrupted records to `stopped`, preserves partial content, writes the recovered state back, and keeps regenerate available.

Verification: `screenshots/r35/playground-stream-recovered.png`

### ISSUE-003: Clearing all conversations allowed prototype seeds to return

The prototype originally treated an empty table as first use. A dedicated IndexedDB initialization record now separates first use from a deliberate empty collection, so clear-all survives reload.

Verification: `screenshots/r35/playground-clear-all-empty.png`, `screenshots/r35/playground-clear-all-reloaded-empty.png`

### ISSUE-004: Mobile history actions could stack the sheet and confirmation modal

Delete and local-data actions now close the mobile history sheet before opening the next modal. The clear-all confirmation remounts its dialog surface, establishing a fresh focus target. QA observed one active dialog and focus on its close control.

Verification: `screenshots/r35/playground-fr-390-history-sheet.png`, `screenshots/r35/playground-fr-390-delete-confirm.png`, `screenshots/r35/playground-clear-confirm.png`

## Evidence

- `screenshots/r35/playground-1440-light-initial.png`
- `screenshots/r35/playground-1024-light.png`
- `screenshots/r35/playground-768-light-reloaded.png`
- `screenshots/r35/playground-fr-390-dark.png`
- `screenshots/r35/playground-ru-320-dark.png`
- `screenshots/r35/playground-search-empty.png`
- `screenshots/r35/playground-generation-stopped-immediate.png`
- `screenshots/r35/playground-regenerated.png`
- `screenshots/r35/playground-edit-dialog.png`
- `screenshots/r35/playground-parameters-reloaded.png`
- `screenshots/r35/playground-local-data.png`
- `screenshots/r35/playground-import-complete.png`
- `screenshots/r35/playground-message-deleted.png`
- `screenshots/r35/playground-conversation-deleted.png`
- `screenshots/r35/playground-vi-320-copied.png`

## Remaining Product Work

R3.5 is ready for product review. Live `/pg/chat/completions` traffic, real model/group loading, stream parsing and cancellation, API errors, formal `apps/web` migration, Caddy publication, and production release remain out of scope for this checkpoint. After approval, the next prototype family is R3.6 image studio.
