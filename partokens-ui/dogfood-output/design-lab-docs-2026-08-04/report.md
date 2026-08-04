# Dogfood Report: Partokens Design Lab Documentation

| Field | Value |
|-------|-------|
| **Date** | 2026-08-04 |
| **App URL** | http://127.0.0.1:4180/ |
| **Session** | partokens-design-lab-docs |
| **Scope** | Documentation-stage completeness: content, navigation, search, locale/theme controls, key links, console health, and responsive layout |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Issues

No reproducible issues recorded.

## Acceptance Result

The documentation experience is complete enough for the design-lab stage. All 18 catalog articles opened with the expected title, search handled matching and empty results, previous/next navigation remained connected, and code-copy controls produced no application errors. Desktop and mobile navigation, light and dark themes, and all seven locale selectors were exercised. Untranslated article bodies are explicitly disclosed before the Simplified Chinese source, which is an acceptable prototype boundary for this stage.

The shared documentation entry was then verified on public and console headers. Desktop order is Notices, Documentation, Language. The public mobile menu exposes Notices then Documentation before the language control. Console layouts were visually checked at 390px and 320px; the 320px breadcrumb is intentionally hidden so the five header tools remain unobstructed.

## Evidence

- `screenshots/docs-desktop.png`: documentation desktop layout and catalog
- `screenshots/docs-search-codex.png`: matching search state
- `screenshots/docs-mobile-nav.png`: mobile documentation drawer
- `screenshots/docs-dark.png`: dark theme
- `screenshots/links-home-desktop.png`: public header order
- `screenshots/links-console-desktop.png`: console header order
- `screenshots/links-console-mobile.png`: console header at 390px
- `screenshots/links-console-mobile-320-final.png`: console header at 320px
- `screenshots/links-home-mobile-menu.png`: public mobile menu order
