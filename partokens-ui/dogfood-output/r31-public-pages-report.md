# Dogfood Report: Partokens R3.1 Public Pages

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/` |
| **Session** | `partokens-r31` / `partokens-r31-clean` |
| **Scope** | Home, models, docs, about, legal, notices, shared public shell |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.1 page set. Findings corrected during QA include untranslated labels, a theme-reversing footer token, missing mobile navigation focus containment, homepage runtime translation fallbacks, and first-viewport handoff at 1024px and 320px.

## Verification Matrix

| Area | Result |
|---|---|
| TypeScript and production build | Passed |
| `1440 x 900` desktop light | Passed |
| `1024 x 768` workspace | Passed |
| `768 x 900` navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 720` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven locale resources used by R3.1 | Complete |
| Language change retains destination | Passed |
| Theme and locale persistence after reload | Passed |
| Homepage first viewport reveals Get started content | Passed at 1440, 1024, 768, 390, and 320px |
| Homepage FAQ and public navigation | Passed |
| SDK tabs and copy feedback | Passed |
| Mobile menu focus loop / Escape / restore | Passed |
| Visible keyboard focus | Passed, 2px Relay Blue outline |
| Clean browser runtime errors | 0 |

## Evidence

- `screenshots/r31/models-desktop-light.png`
- `screenshots/r31/models-mobile-dark-fr.png`
- `screenshots/r31/docs-desktop-light.png`
- `screenshots/r31/docs-minimum-dark-ru.png`
- `screenshots/r31/about-desktop-light.png`
- `screenshots/r31/legal-service-desktop-light.png`
- `screenshots/r31/legal-navigation-light.png`
- `screenshots/r31/notices-desktop-light.png`
- `screenshots/r31/home-desktop-light-reviewed.png`
- `screenshots/r31/home-workspace-light-final.png`
- `screenshots/r31/home-mobile-dark-fr.png`
- `screenshots/r31/home-minimum-dark-ru-reviewed.png`

## Remaining Product Work

R3.1 is ready for product review. The seven-locale copy still requires the planned owner review before formal migration. R3.2 authentication prototypes, formal `web/docs` migration, Caddy publication, and production release remain out of scope for this checkpoint.
