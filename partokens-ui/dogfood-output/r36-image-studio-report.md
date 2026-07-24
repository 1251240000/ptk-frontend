# Dogfood Report: Partokens R3.6 Image Studio

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/#console-studio` |
| **Session** | `partokens-r36-studio` |
| **Scope** | Local projects, node canvas, generation states, credential boundary, responsive/i18n behavior |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.6 prototype. Corrections during QA included a reframed default canvas, mobile project creation, touch-safe project action menus, explicit menu stacking, non-overlapping node placement, and offset result versions.

## Verification Matrix

| Area | Result |
|---|---|
| Design-lab TypeScript and production build | Passed |
| Project create, select, rename, duplicate, delete | Passed |
| Project persistence after cold reload | Passed |
| JSON export and validated import | Passed |
| Add prompt/note and local source-image path | Passed |
| Node selection, movement, connection and disconnect | Passed |
| Undo/redo and fit/zoom controls | Passed |
| Model/group/size/count/quality controls | Passed |
| Existing-key confirmation and explicit lock | Passed |
| Dedicated finite-quota/model-restricted confirmation | Passed |
| Full key absent from IndexedDB/local/session storage | Passed |
| Reload returns credential state to locked | Passed |
| Simulated success, failure, retry and cancellation | Passed |
| Stable node dimensions across generation states | Passed |
| Local history and storage disclosure | Passed |
| Mobile projects and inspector sheets | Passed |
| `1440 x 960` desktop light | Passed |
| `1024 x 820` workspace reflow | Passed |
| `768 x 900` mobile navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 720` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven studio locales | Complete |
| Theme and locale persistence | Passed |
| Browser runtime errors | 0 |

## Resolved Findings

### ISSUE-001: Default desktop viewport hid too much of the result path

The initial zoom focused on prompt editing but placed most of the result behind the inspector. Seed framing now includes source, prompt, result and note in the first desktop viewport, while mobile framing prioritizes prompt-to-result continuity.

Verification: `screenshots/r36/studio-1440-light-final.png`, `screenshots/r36/studio-fr-390-dark.png`

### ISSUE-002: Mobile project actions depended on hover

The first project rail used hover/focus visibility for rename, duplicate and delete. It now uses an explicit per-project menu state, includes a mobile new-project command, and raises the open row above following items.

Verification: `screenshots/r36/studio-fr-390-projects-sheet.png`, `screenshots/r36/studio-ru-320-project-actions.png`

### ISSUE-003: Added nodes and result versions could overlap exactly

Prompt, note and source additions now choose the nearest unoccupied candidate using node bounds and a stable gap. Generated versions use an intentional small vertical offset, preserving a visible version stack and separate generation paths.

Verification: `screenshots/r36/studio-generation-failed.png`, `screenshots/r36/studio-generation-retry-success.png`

### ISSUE-004: Project action menu could be visible underneath the next row

Explicit menu-open stacking and removal of residual focus-only visibility prevent following project rows from covering touch targets after duplicate or rename operations.

Verification: `screenshots/r36/studio-ru-320-project-actions.png`

## Credential Audit

After existing-key unlock, dedicated-key creation, lock and reload:

```json
{
  "projectCount": 3,
  "hasFullSecret": false,
  "storageKeys": {
    "local": ["partokens-theme", "partokens-locale"],
    "session": []
  }
}
```

Prototype project data contains a token ID and display alias only. The full-key value is not represented by the R3.6 data model and cannot enter IndexedDB exports.

## Evidence

- `screenshots/r36/studio-1440-light-final.png`
- `screenshots/r36/studio-1024-light.png`
- `screenshots/r36/studio-768-light.png`
- `screenshots/r36/studio-fr-390-dark.png`
- `screenshots/r36/studio-fr-390-projects-sheet.png`
- `screenshots/r36/studio-fr-390-inspector-sheet.png`
- `screenshots/r36/studio-ru-320-dark.png`
- `screenshots/r36/studio-ru-320-project-actions.png`
- `screenshots/r36/studio-unlock-confirm.png`
- `screenshots/r36/studio-dedicated-key-confirm.png`
- `screenshots/r36/studio-generation-pending.png`
- `screenshots/r36/studio-generation-failed.png`
- `screenshots/r36/studio-generation-retry-success.png`
- `screenshots/r36/studio-generation-cancelled.png`

## Remaining Product Work

R3.6 is ready for product review. Real `/v1/images/generations` and `/v1/images/edits` traffic, live model/group/key loading, formal controlled AGPL fork integration, API error mapping, formal `apps/web` migration, Caddy publication and production release remain out of scope for this checkpoint.
