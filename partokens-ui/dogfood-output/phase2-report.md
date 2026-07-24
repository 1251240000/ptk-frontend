# Dogfood Report: Partokens UI Phase 2

| Field | Value |
|---|---|
| Date | 2026-07-21 |
| App URL | `http://127.0.0.1:8080` |
| Scope | Image Studio project storage, canvas interactions, in-memory credentials, mocked generation/edit flows, localization, responsive layouts, and Caddy development routing |

## Summary

Four issues were found during phase-two QA and fixed before handoff. No open critical, high, medium, or low issue remains in the tested phase-two surface.

| Severity | Found | Open |
|---|---:|---:|
| Critical | 0 | 0 |
| High | 1 | 0 |
| Medium | 3 | 0 |
| Low | 0 | 0 |
| Total | 4 | 0 |

## Acceptance Coverage

- Project lifecycle: create, localized defaults, rename persistence, duplicate, local autosave, and in-browser export/import round trip.
- Canvas: add nodes, collision-free placement, pan, zoom, drag, resize, connect, disconnect, undo, and redo.
- Image transport: mocked `POST /v1/images/generations` and multipart `POST /v1/images/edits`, cancellation, failure feedback, retry, repeated-result placement, and local result history.
- Local persistence: generated image blobs and a 97,092-byte uploaded PNG survived a cold reload; the uploaded PNG decoded to 1280 x 633 after restoration.
- Credential boundary: after unlock, generation, reload, export, and edit flows, no `sk-` key material was found in localStorage, sessionStorage, or any IndexedDB store. Reload returned the key to the locked state.
- Responsive and themes: 1440 x 900 desktop and 390 x 844 mobile layouts, project and inspector drawers, light/dark modes, and Simplified Chinese, French, and Russian long-text visual checks.
- Localization: all seven locales contain 462 keys with zero missing entries.
- Runtime: final cold load had no uncaught page errors or failed application requests; the console contained development-server information only.
- Build: TypeScript, 20 Vitest tests, production build, JSON parsing, both Caddy configurations, and upstream read-only commit checks passed.

## Resolved Issues

### ISSUE-001: Development Caddy omitted the Rsbuild lazy-compilation endpoint

| Field | Value |
|---|---|
| Severity | High |
| Category | Functional / development routing |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/studio` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

The production build emitted the Studio as an independent asynchronous chunk, but the Rsbuild development runtime also posts to `/_rspack/lazy/trigger` before serving that route. The development Caddyfile sent the trigger to the native upstream, leaving the Studio route blank even though the chunk request returned successfully.

Verification: [initial stale development overlay](screenshots/phase2-issue-001-dev-overlay.png), [blank lazy route](screenshots/phase2-issue-001-lazy-route-blank.png)

The development runtime matcher now proxies `/_rspack/lazy/*` to Rsbuild alongside HMR and hot-update assets.

### ISSUE-002: New localized canvases persisted an English default node title

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Content / i18n |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/studio` |
| Repro Video | N/A (static issue) |

The project factory stored `Image prompt` as the first node title. Because node titles are user data and render directly, a newly created Simplified Chinese canvas mixed English into both the canvas and inspector.

Verification: [Chinese canvas with English node title](screenshots/phase2-studio-desktop-initial.png)

New Simplified Chinese canvases now persist `图片提示词`: [fixed localized canvas](screenshots/phase2-issue-002-fixed.png).

### ISSUE-003: Newly added nodes overlap the initial prompt node

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Visual / UX |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/studio` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

On a new canvas, adding a note places it only slightly offset from the initial prompt. The two nodes overlap across most of their content areas, obscuring the prompt and making connection ports difficult to distinguish.

Reproduction:

1. Open a new canvas containing only the initial prompt node. [Initial canvas](screenshots/issue-003-step-1-restored.png)
2. Select **Note** in the canvas toolbar. [Overlapping nodes](screenshots/issue-003-step-2.png)
3. Observe that the note covers a large portion of the prompt node. [Annotated result](screenshots/issue-003-result.png)

The shared placement helper now checks node bounds for text nodes, source images, and generated results before selecting a position. Browser verification measured a 32 px gap between the initial prompt and new note: [fixed placement](screenshots/issue-003-fixed.png).

### ISSUE-004: Sticky generation action covers the session-unlock control

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Visual / UX |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/console/studio` |
| Repro Video | N/A (`ffmpeg` is unavailable in the local acceptance environment) |

At a 1440 x 900 viewport, selecting an existing key places the session-unlock button directly behind the sticky generation action. A click at the unlock control is intercepted by the generation button until the inspector is manually scrolled.

Verification: [overlapping interactive controls](screenshots/phase2-unlock-covered.png), [manual-scroll workaround](screenshots/phase2-unlock-scrolled.png)

The generation action now remains in normal inspector flow. The session-unlock button can be clicked directly at the same viewport without scrolling or pointer interception: [fixed inspector flow](screenshots/issue-004-fixed.png).
