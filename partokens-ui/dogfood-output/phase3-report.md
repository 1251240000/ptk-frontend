# Dogfood Report: Partokens UI Phase 3

| Field | Value |
|---|---|
| Date | 2026-07-21 |
| App URL | `http://127.0.0.1:8080/zh-CN/docs` |
| Session | `partokens-phase3-docs` |
| Scope | Independent docs runtime, seven locales, API references, navigation, themes, responsive layouts, Caddy ownership, and browser console |

## Summary

Five issues were found during phase-three QA and fixed before handoff. No open critical, high, medium, or low issue remains in the tested documentation surface.

| Severity | Found | Open |
|---|---:|---:|
| Critical | 0 | 0 |
| High | 0 | 0 |
| Medium | 4 | 0 |
| Low | 1 | 0 |
| Total | 5 | 0 |

## Acceptance Coverage

- Content parity: 14 documentation topics in each of seven locales, producing 98 localized pages and 101 total static Next routes.
- Guides: quick start, authentication, first request, models/groups, chat/streaming, images, and errors/retries.
- API reference: Chat Completions, Responses, embeddings, image generation/editing, audio transcription, and model discovery with field tables, curl examples, response examples, and model-availability boundaries.
- Localization: Simplified Chinese, Traditional Chinese, English, Japanese, Russian, French, and Vietnamese deep links return 200; language switching preserves the current semantic page.
- Responsive and themes: 1440 x 900 desktop and 390 x 844 mobile, light/dark persistence, long French/Russian/Vietnamese layouts, mobile tables, code overflow, navigation drawer, and no page-level horizontal overflow.
- Accessibility: localized framework controls, keyboard-visible focus, modal mobile navigation with inert background and focus restoration, table semantics, page landmarks, and reduced-motion styles.
- Product decisions: documentation search remains absent; non-Simplified-Chinese translations are visibly marked pending owner review.
- Caddy ownership: localized docs and `/_docs/*` reach Next, other localized routes reach the standalone web UI, API 404s remain JSON, and `/channels` remains native New API.
- Upstream compatibility: 102 read-only documentation inputs at the pinned commit, 14 curated source mappings, no added/changed/removed inputs, and both upstream repositories clean.
- Verification: Web and Docs TypeScript passed, 23 Vitest tests passed, both production builds passed, 101 static documentation routes rendered, both Caddy configurations validated, and the final browser cold load contained no application errors or warnings.

## Resolved Issues

### ISSUE-001: Built-in documentation controls remain English on localized pages

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Content / accessibility |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/docs` |
| Repro Video | N/A (visible on load) |

The Simplified Chinese page renders the visible search placeholder as `Search`, while the search, sidebar, language, and theme controls expose English accessible names. The document body and navigation are localized, so these framework controls create a mixed-language experience and incomplete screen-reader localization.

Verification: [annotated localized-control issue](screenshots/phase3-issue-001-search-not-localized.png)

The Fumadocs/Next dependencies are now pinned to the reviewed versions, the localized provider is applied to the layout, and the framework's hard-coded desktop and mobile control labels are localized at the integration boundary. Verification: [fixed Simplified Chinese controls](screenshots/phase3-issue-001-fixed-final.png), [French mobile trigger before the final adapter extension](screenshots/phase3-issue-001-mobile-sidebar-label.png).

### ISSUE-002: Smooth-scroll ownership emits a Next.js console warning

| Field | Value |
|---|---|
| Severity | Low |
| Category | Console |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/zh-CN/docs/api/chat-completions` |
| Repro Video | N/A (console-only issue) |

Navigating from the docs overview to an API reference emitted Next.js's `missing-data-scroll-behavior` warning because global CSS enables smooth scrolling without declaring that behavior on the root element. The localized root now carries `data-scroll-behavior="smooth"`, allowing the router to handle transitions without warning.

Verification page: [chat API reference](screenshots/phase3-api-chat-desktop.png)

### ISSUE-003: Mobile documentation drawer lacks modal and close semantics

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Accessibility |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/fr/docs/api/chat-completions` |
| Repro Video | N/A (semantic issue visible after opening navigation) |

At 390 x 844, opening the documentation sidebar produced a visually correct drawer, but the `<aside>` had no dialog role or `aria-modal`, the underlying article remained keyboard-accessible, and the control inside the open drawer was still named `Open Sidebar`. The integration needs to identify the drawer as modal navigation, make the underlying page inert, move focus into it, and expose a localized close name.

Verification: [open French mobile drawer](screenshots/phase3-mobile-navigation-fr.png)

The integration now assigns a localized modal-dialog label, makes the underlying page and mobile header inert, moves focus into the drawer, exposes a localized close action, and returns focus to the opener after close. Verification: [fixed modal drawer](screenshots/phase3-issue-003-fixed.png).

### ISSUE-004: Mobile pages render duplicate previous and next navigation

| Field | Value |
|---|---|
| Severity | Medium |
| Category | UX |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/vi/docs/guides/errors-and-limits` |
| Repro Video | N/A (visible on load at the page footer) |

The full mobile page displayed the Partokens-localized previous/next controls followed immediately by Fumadocs' automatic previous/next cards. The four cards repeat the same two destinations and make the document order ambiguous. The framework footer is now disabled so the project-owned localized navigation is the sole sequence control.

Verification: [Vietnamese full-page footer before fix](screenshots/phase3-guide-errors-vi-mobile-light-full.png)

The Fumadocs footer is disabled for these pages. Verification: [single localized footer navigation](screenshots/phase3-issue-004-fixed.png).

### ISSUE-005: Search entry opens an empty, out-of-scope dialog

| Field | Value |
|---|---|
| Severity | Medium |
| Category | Functional / UX |
| Status | Fixed |
| URL | `http://127.0.0.1:8080/vi/docs/guides/errors-and-limits` |
| Repro Video | N/A (`ffmpeg` is unavailable in the acceptance environment) |

The accepted product decisions defer documentation search, but Fumadocs rendered its default search trigger. Activating it opened a localized input with no configured index or results, exposing a non-functional capability. The layout now disables both desktop and mobile search triggers.

Reproduction:

1. Open a localized mobile documentation page. [Page before search](screenshots/phase3-issue-005-step-1.png)
2. Activate the search icon and observe an empty search dialog. [Empty search result](screenshots/phase3-issue-005-result.png)

The documented layout disables `searchToggle`; the integration stylesheet also removes Fumadocs' invisible desktop collapsed-toolbar trigger from layout and the accessibility tree. Browser verification found zero search triggers on mobile and no discoverable search action on desktop. Verification: [page after search removal](screenshots/phase3-issue-005-fixed.png).
