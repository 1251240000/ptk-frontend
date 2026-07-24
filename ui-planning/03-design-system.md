# Design System Direction

## Subject And Job

Subject: a precise operations surface for people who actively spend money and quota on AI model calls.  
Audience: developers and small teams who need confidence, not decoration.  
Single job: let a user judge service readiness and take the next action without hunting for state.

## Direction: Signal Ledger

The visual language combines the current Partokens grid/terminal character with the clarity of an operations ledger. Information is organized in ruled bands, compact tables, request traces, and explicit states. The interface should feel measured and observable rather than futuristic.

Keep from the current site:

- Partokens blue brand mark.
- Orthogonal grid as a structural device.
- Terminal/telemetry vocabulary.
- Green, amber, and red service-state signals.
- Plain claims around model access, status, quota, and price.

Change from the current site:

- No radial or linear gradient backgrounds.
- No glassmorphism or backdrop-blur as a primary surface style.
- No nested cards, large rounded containers, or card grids for page sections.
- No split hero with copy on one side and a terminal card on the other.
- No server-injected page CSS that fails theme switching.
- Reduce simultaneous accent colors inside analytics and overview surfaces.

## Signature Element

The system is remembered by the request trace: a thin, orthogonal line with small state ticks that connects status, usage, and actions. It appears once per important view:

- Homepage: live request pulses cross the full-bleed service field.
- Overview: a readiness trace connects key, balance, route, and first request.
- Sidebar footer: the trace becomes the quota rail.
- Image studio: node edges use the same state ticks.

It encodes real state; it is not decorative. This is the one expressive device. Everything around it remains restrained.

## Color Tokens

### Light

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F7F9FB` | Page background |
| `surface` | `#FFFFFF` | Tables, dialogs, repeated items |
| `ink` | `#13161A` | Primary text |
| `muted` | `#626D79` | Secondary text |
| `line` | `#DCE2E8` | Rules and borders |
| `brand` | `#147DFF` | Primary action and focus |
| `healthy` | `#168A5B` | Healthy/available |
| `warning` | `#B87700` | Warning/degraded |
| `danger` | `#C73E46` | Error/destructive |

### Dark

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#0D0F12` | Page background |
| `surface` | `#15181D` | Tables, dialogs, repeated items |
| `ink` | `#F2F5F8` | Primary text |
| `muted` | `#9BA6B2` | Secondary text |
| `line` | `#2B3139` | Rules and borders |
| `brand` | `#57A4FF` | Primary action and focus |
| `healthy` | `#38D996` | Healthy/available |
| `warning` | `#F4BF4F` | Warning/degraded |
| `danger` | `#FF737A` | Error/destructive |

Charts add violet and cyan only when series count requires them. Semantic red/green never encode chart series that are not failure/success. Color is always paired with text, icon, shape, or pattern.

## Typography

- Brand/display and Latin/Cyrillic/Vietnamese UI: IBM Plex Sans.
- Simplified Chinese: Noto Sans SC.
- Traditional Chinese: Noto Sans TC.
- Japanese: Noto Sans JP.
- Telemetry, code, keys, request IDs, and tabular figures: IBM Plex Mono.
- System sans fallbacks remain available when web fonts fail.

Locale-specific Noto subsets load only for the active locale. Numeric metrics use tabular numerals. Letter spacing remains `0`.

Type scale:

| Role | Size / line | Weight |
| --- | --- | --- |
| Public H1 brand | 56 / 60 desktop, 40 / 44 mobile | 650 |
| Page title | 24 / 32 | 600 |
| Section title | 16 / 24 | 600 |
| Body | 14 / 22 | 400 |
| Compact UI | 13 / 18 | 450 |
| Caption/data label | 12 / 16 | 500 |
| Metric | 28 / 32 | 600 mono |

Font sizes do not scale continuously with viewport width.

## Geometry And Layout

- Base spacing unit: 4 px.
- Content max width: 1440 px for data pages, 1180 px for public/legal pages.
- Top bar: 56 px desktop, 52 px mobile.
- Sidebar: 216 px expanded, 56 px collapsed.
- Standard control height: 36 px; prominent auth/primary controls: 40 px.
- Card/item radius: 6 px default, 8 px maximum.
- Dialog radius: 8 px.
- Borders: 1 px.
- Fixed-format charts, boards, toolbars, and tables use explicit min/max dimensions so dynamic labels do not move surrounding content.

Page sections are unframed bands separated by rules. Cards are reserved for repeatable entities such as plan options, model results, or conversation items. A card never contains another card.

## Homepage Composition

The H1 is `Partokens`; the value proposition is supporting copy. The hero uses a full-bleed, real live-status scene backed by public status data. It is not a decorative SVG and not a terminal card beside text. The bottom of the first viewport reveals the next section on common mobile and desktop heights.

When live data is unavailable, render a truthful unavailable state or a recent static product screenshot, not fabricated healthy metrics.

## Content Ownership

Homepage, About, User Agreement, Terms of Service, Privacy Policy, and notices are structured, versioned content in the standalone repository. Administrator-configured HTML is never mounted into the new visual system. Content components share the same typography, spacing, theme tokens, locale metadata, and review-state treatment as the rest of the application.

## Component Language

- Icons: Lucide, 16 or 18 px in most controls.
- Icon-only buttons for familiar commands such as undo, redo, copy, reveal, download, zoom, and close; include tooltips.
- Segmented controls for measures, auth modes, and chart modes.
- Switches/checkboxes only for binary settings.
- Menus for option sets; do not show rows of text pills when a menu is clearer.
- Swatches for colors and thumbnails for image assets.
- Badges only for state, plan recommendation, group, or discount; not decoration.
- Inline banners for platform/feature state; toasts for transient mutation feedback.

## Tables And Charts

- Tables are the primary tool for keys and logs.
- Sticky header, clear row hover/focus, column controls, and detail drawers.
- Avoid horizontal scroll on mobile by changing to row summaries.
- Charts share one legend and one filter bar per dataset.
- Chart colors meet contrast on both themes.
- Always provide exact values in tooltip and accessible table/summary.

## Motion

One orchestrated moment is allowed: the request trace progresses once when a page first receives real data. Other motion is functional and 140-180 ms. No ambient floating shapes, parallax, repeated reveal cascades, or animation that implies a request is active when it is not.

`prefers-reduced-motion` removes trace progression, scrolling animation, and nonessential transitions.

## Theme Behavior

- Theme modes: Light, Dark, System.
- An inline pre-hydration script applies the stored/system theme before paint.
- All colors derive from semantic CSS variables.
- Repository-owned legal, documentation, and notice content uses the same semantic variables and cannot bring global styles or scripts.
- Canvas, charts, code blocks, dialogs, and browser-native color scheme update together.

## International Layout Rules

- Navigation items have stable icon columns and allow labels to wrap only in mobile sheets, not desktop sidebar rows.
- Buttons grow horizontally or wrap label/icon groups; they never truncate critical commands.
- Russian and French are used as stress-test locales during development.
- CJK line breaking uses native language rules.
- Dates and currency are formatted from semantic values, not interpolated strings.
- Legal content exposes locale and effective-date metadata.
- Locale switching preserves the current semantic destination while changing the BCP-47 path prefix.

## Accessibility Baseline

- Minimum body contrast 4.5:1.
- Focus ring: 2 px `brand`, 2 px offset.
- Minimum pointer target 40 x 40 px on touch layouts.
- Do not rely on hover for key actions.
- Dialog focus is trapped and restored.
- Canvas provides keyboard selection/movement, a node list, and non-canvas property editing.

## Self-Critique

The first direction risked becoming a generic dark developer dashboard. It was revised around three Partokens-specific facts: routed model status, quota consumption, and the first successful API request. The request trace now ties those facts together, while the palette keeps operational green/amber/red alongside the existing blue brand instead of making the entire product blue or slate. The public hero uses actual service state rather than a generic code screenshot.

The second risk is excessive telemetry styling. Monospace is therefore limited to data and code, the body remains humanist sans, and dense bands are balanced with plain-language actions.
