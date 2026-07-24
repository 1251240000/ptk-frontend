# Dogfood Report: Partokens R1 Design Lab

| Field | Value |
|-------|-------|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/` |
| **Session** | `r1-close-qa`, `r1-final-closeout` |
| **Scope** | R1 homepage, sign-in, console overview; light/dark, zh-CN/fr/ru, desktop/tablet/mobile |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Verification

R1 internal verification is complete.

- `bun --filter @partokens/design-lab typecheck`: passed.
- `bun --filter @partokens/design-lab build`: passed; production bundle total `298.2 kB`, gzip `88.7 kB`.
- Local entry point returned HTTP `200` throughout the closeout pass.
- Tested at `1440x900`, `1024x768`, `390x844`, and `320x720`.
- Tested simplified Chinese light mode, French dark mode, and Russian dark mode.
- Home, sign-in, and console reported no horizontal overflow at the tested widths.
- Consent keeps password and OAuth actions disabled until checked; checking it enables all login actions.
- Password visibility, prototype sign-in navigation, sidebar collapse, mobile navigation, locale switching, theme switching, and endpoint copy feedback were exercised successfully.
- Mobile console navigation exposes language and theme controls.
- Browser errors: none. Console output contained only Rsbuild and React development messages.

## Evidence

- Home desktop and full page: `screenshots/redesign-r1-home-zh-desktop-light-v2.png`, `screenshots/redesign-r1-home-zh-desktop-light-v2-full.png`
- Home mobile and full page: `screenshots/redesign-r1-home-fr-mobile-dark-v2.png`, `screenshots/redesign-r1-home-fr-mobile-dark-v2-full.png`
- Sign-in desktop and mobile: `screenshots/redesign-r1-signin-zh-desktop-light-v2.png`, `screenshots/redesign-r1-signin-fr-mobile-dark-v2.png`
- Console desktop and mobile: `screenshots/redesign-r1-console-zh-desktop-light-v2.png`, `screenshots/redesign-r1-console-fr-mobile-dark-v2.png`
- Mobile console navigation: `screenshots/redesign-r1-console-fr-mobile-sidebar-dark-v2.png`
- Russian desktop stress test: `screenshots/redesign-r1-console-ru-desktop-dark-v2.png`

## Issues

No open R1 closeout issues.
