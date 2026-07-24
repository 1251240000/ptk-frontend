# Dogfood Report: Partokens R2.1 Design System

| Field | Value |
|-------|-------|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/#system` |
| **Sessions** | `r21-system-qa`, `r21-system-interactions` |
| **Scope** | Route Capsule, workflow color bands, light/dark themes, responsive layout and overlays |

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
- `bun --filter @partokens/design-lab build`: passed.
- Production bundle total: `362.7 kB`, gzip `101.8 kB`.
- Local design-lab returned HTTP `200`.
- `1440x900`, `1024x768`, `768x900`, `390x844`, and `320x720` passed visual review.
- `320px` document and body scroll widths both matched the `320px` viewport.
- Desktop controls measured `42px` for Route Capsule commands and fields, and `40px` for regular, danger and icon buttons.
- Mobile commands measured `44px`; fields remained `42px` at `390px` and `320px`.
- Soft-fill field, route focus and danger error states rendered correctly in light and dark themes.
- Menu open and Escape close passed.
- Drawer open, initial focus and Escape close remained available after the visual revision.
- Browser errors: none. Console contained only Rsbuild and React development messages.
- Key text/action contrast pairs measured from `4.59:1` to `17.93:1`.
- No gradients, glass effects, decorative blobs, nested cards or upstream project changes were introduced.

## Palette Contract

- Command Ink anchors deterministic actions.
- Relay Blue marks routing, focus, selection and command endpoints.
- Prompt Lilac, Canvas Mint and Result Coral are reserved for broad workflow bands.
- Inputs, data tables and tool buttons remain neutral so the color system retains meaning.

## Evidence

- Desktop light: `screenshots/r21-system-desktop-light.png`
- Desktop light full page: `screenshots/r21-system-desktop-light-full.png`
- Desktop command and field components: `screenshots/r21-controls-desktop-light.png`
- Workspace width: `screenshots/r21-system-1024-light.png`
- Navigation width: `screenshots/r21-system-768-light.png`
- Mobile dark: `screenshots/r21-system-mobile-dark.png`
- Mobile controls light: `screenshots/r21-controls-mobile-light-v2.png`
- Mobile fields light: `screenshots/r21-inputs-mobile-light.png`
- Mobile fields dark: `screenshots/r21-inputs-mobile-dark.png`
- Narrow light: `screenshots/r21-system-320-light-v2.png`
- Mobile menu: `screenshots/r21-system-menu-mobile-light.png`
- Mobile drawer: `screenshots/r21-system-drawer-mobile-light.png`

## Issues

No open R2.1 closeout issues.
