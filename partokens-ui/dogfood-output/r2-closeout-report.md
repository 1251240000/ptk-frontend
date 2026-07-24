# Dogfood Report: Partokens R2 Design System

> 此 R2.0 报告已被 R2.1 视觉修订取代。当前结果见 `r21-closeout-report.md`。

| Field | Value |
|-------|-------|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/#system` |
| **Sessions** | `r2-system-qa`, `r2-system-mobile`, `r2-system-narrow`, `r2-system-dialog` |
| **Scope** | R2 tokens, primitives, language specimens, responsive rules, overlays, keyboard and reduced motion |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Verification

- `bun --filter @partokens/design-lab typecheck`: passed.
- Existing `@partokens/web` and `@partokens/docs` typechecks: passed; docs generated 98 pages with 0 files updated.
- `bun --filter @partokens/design-lab build`: passed.
- Production bundle total: `355.6 kB`, gzip `100.6 kB`.
- Local design-lab returned HTTP `200`.
- Tested `1440x900`, `1024x768`, `768x900`, `390x844`, and `320x720`.
- No page-level horizontal overflow at any target width.
- Light and dark themes rendered correctly.
- Seven locale specimens rendered: `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, `vi`.
- Menu, switch, segmented control, Toast, drawer, and native modal interactions passed.
- Drawer initial focus, Tab loop, Escape close, and body-scroll restore passed.
- Native dialog reported `:modal`, received initial focus, and closed on Escape.
- Reduced-motion simulation reported `.01ms` for `--pt-motion-base`; spinner animation reported `none`.
- Key semantic text/background contrast ratios ranged from `4.70:1` to `17.17:1`.
- Browser errors: none. Console output contained only Rsbuild and React development messages after the development server restart.

Resolved during verification: the custom drawer received an explicit focus loop and background-scroll lock before closeout.

## Evidence

- Final desktop cold-start: `screenshots/r2-system-final-desktop-light.png`
- Desktop light: `screenshots/r2-system-zh-desktop-light-v2.png`
- Desktop light full page: `screenshots/r2-system-zh-desktop-light-v2-full.png`
- Mobile dark: `screenshots/r2-system-zh-mobile-dark.png`
- Mobile dark full page: `screenshots/r2-system-zh-mobile-dark-full.png`
- Mobile drawer dark: `screenshots/r2-system-mobile-drawer-dark.png`
- Native dialog light: `screenshots/r2-system-dialog-light.png`
- 320px light: `screenshots/r2-system-zh-320-light.png`
- 320px light full page: `screenshots/r2-system-zh-320-light-full.png`

## Issues

No open R2 closeout issues.
