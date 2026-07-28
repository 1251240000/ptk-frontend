# Dogfood Report: Partokens R4.2 Image Studio

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-studio` |
| Scope | Focused image generation workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-studio` now renders the new `ShadcnImageStudioScreen` inside `ConsoleShell` with `activeRoute='console-studio'`. The screen contains only prompt input, one replaceable/removable reference image, model, quality, size, Count 1-4, Generate/Cancel, and a regular result grid.

The old Studio prototype, CSS, copy, store, and all other route implementations remain unchanged. Four 1200 x 1200 local WebP photographs are served from `apps/design-lab/public/image-studio/`; the result UI uses no SVG, gradient, CSS illustration, canvas, node, connector, project, Inspector, history, persistence, or import/export implementation.

No issue remains open in this scope.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 |

The host did not expose a global `bun` binary, so both commands were executed with the repository-declared Bun 1.3.14 through `npx --yes bun@1.3.14`. The production build emits the existing design-lab chunk-size advisory and completes successfully.

## State And Behavior Verification

| Area | Result |
|---|---|
| Empty state | Passed |
| Skeleton loading state | Passed; skeleton image count equals Count |
| Success and local raster rendering | Passed |
| Error and Retry | Passed; the standalone words `error` or `fail` trigger the simulated error, Retry succeeds |
| Disabled controls | Passed during generation and with an empty prompt |
| Toast feedback | Passed for upload, replace, remove, Generate, Cancel, Error, and Retry |
| Reference upload / replace / remove | Passed |
| Reference Object URL cleanup | Passed on replacement, removal, and component unmount |
| Model / quality / size / Count | Passed |
| Count 1-4 | Passed; result and skeleton DOM counts match the selected value |
| Replace previous results | Passed; a new Count 1 request replaced an existing Count 4 set |
| Cancel | Passed; no late result appears after waiting beyond the generation delay |
| Generation timer cleanup | Passed on Cancel and component unmount |

## Responsive Verification

| Viewport | Theme | Layout | Result |
|---|---|---|---|
| 1440 x 1000 | Light | Two columns, success grid | Passed |
| 1440 x 1000 | Dark | Two columns | Passed |
| 1024 x 900 | Light | Two columns with expanded sidebar | Passed |
| 390 x 844 | Light | Settings above results | Passed |
| 320 x 720 | Dark | Settings and results single-column | Passed |

For every viewport, both `documentElement.scrollWidth` and `body.scrollWidth` were at or below `window.innerWidth`. Visual review found no overlap, clipping, incoherent wrapping, or horizontal overflow.

## Browser And Route Regression

The full browser flow completed with zero application console errors and zero page errors after stubbing the unrelated `/api/status` development endpoint. Without that stub, the standalone 4180 Vite server logs the existing `/api/status` 404 on every application route because no API service is attached; the Studio itself produces no resource or runtime error.

The following routes rendered non-empty pages after the Studio switch: `#console`, `#console-analytics`, `#console-keys`, `#console-logs`, `#console-playground`, `#console-wallet`, `#console-profile`, `#system`, and `#home`.

## Evidence

- `screenshots/studio-1440-light-empty.png`
- `screenshots/studio-1440-light-success.png`
- `screenshots/studio-1440-dark.png`
- `screenshots/studio-1024-light.png`
- `screenshots/studio-390-light.png`
- `screenshots/studio-320-dark.png`

The app reuses the Vite server already listening on port 4180.
