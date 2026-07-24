# Dogfood Report: Partokens R3.3 Console Data

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/` |
| **Session** | `partokens-r33-data` |
| **Scope** | Overview, analytics, API keys, usage logs, shared console shell |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.3 page set. Findings corrected during QA include twelve untranslated console labels, incorrect edit feedback, non-functional column controls and progressive filters, missing empty states, incomplete overlay focus handling, an oversized single tablet action, and truncated mobile navigation labels.

## Verification Matrix

| Area | Result |
|---|---|
| TypeScript and production build | Passed |
| Overview readiness and request route | Passed |
| Analytics filters, measures, views, and data table | Passed |
| Key create/edit, reveal/copy, status, columns, single/batch delete | Passed |
| Log type/model/group/key filters, mixed events, empty state, detail drawer | Passed |
| `1440 x 900` desktop light | Passed |
| `1024 x 768` workspace and collapsed sidebar | Passed |
| `768 x 900` mobile navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 720` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven console-data locales | Complete |
| Theme and locale persistence after reload | Passed |
| Drawer/dialog focus loop, Escape, and restore | Passed |
| Visible keyboard focus and reduced-motion rule | Passed |
| Clean browser runtime errors | 0 |

## Evidence

- `screenshots/r33/overview-desktop-light-final.png`
- `screenshots/r33/overview-1024-light.png`
- `screenshots/r33/overview-1024-collapsed-light.png`
- `screenshots/r33/analytics-768-light-final.png`
- `screenshots/r33/analytics-768-drawer-light.png`
- `screenshots/r33/analytics-ru-320-dark.png`
- `screenshots/r33/keys-desktop-light-final.png`
- `screenshots/r33/key-reveal-confirm-zh.png`
- `screenshots/r33/key-revealed-copied-zh.png`
- `screenshots/r33/key-edited-toast-zh.png`
- `screenshots/r33/keys-batch-delete-confirm-zh.png`
- `screenshots/r33/keys-fr-390-dark-final.png`
- `screenshots/r33/key-create-drawer-fr-390-dark.png`
- `screenshots/r33/logs-desktop-light-final.png`
- `screenshots/r33/log-error-detail-zh.png`
- `screenshots/r33/logs-empty-state-zh.png`

## Remaining Product Work

R3.3 is ready for product review. All displayed account data remains prototype-only. Live New API adapters, real mutation/error states, formal `apps/web` migration, Caddy publication, and production release remain out of scope for this checkpoint. After approval, the next prototype family is R3.4 account pages.
