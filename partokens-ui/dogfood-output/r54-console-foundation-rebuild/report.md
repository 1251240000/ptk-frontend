# Dogfood Report: Partokens R54 Console Foundation Rebuild

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| Design authority | `http://127.0.0.1:4180`, `apps/design-lab/src` |
| Production preview | `http://127.0.0.1:4174` |
| Production routes | `/$locale/console-foundation/overview`, `/analytics`, `/keys`, `/logs` |
| Screenshot evidence | 74 files in `dogfood-output/r54-console-foundation-rebuild/screenshots/` |
| Result | R54 passed for the parallel Foundation boundary; canonical cutover remains blocked pending authenticated staging validation |

## Rebuild Reason

R49-R53 proved the production API wiring and safety boundaries, but their visual implementations had drifted too far from design-lab in shell geometry, information density, control composition, table layout, mobile stacking, overlays, and state presentation. R54 replaces those page compositions as a unit instead of applying incremental CSS fixes. Design-lab remains the authority for layout and interaction; new-api and the existing Partokens client infrastructure remain the authorities for business semantics and transport.

No prototype values, timers, simulated success states, provider routes, keys, or log records are used by the production pages. Playwright fixtures are used only for deterministic browser verification and are not production fallbacks.

## Source Review

The production rebuild was mapped from the complete design-lab sources:

- `apps/design-lab/src/shadcn-console-shell.tsx`
- `apps/design-lab/src/shadcn-overview-screen.tsx`
- `apps/design-lab/src/shadcn-analytics-screen.tsx`
- `apps/design-lab/src/shadcn-api-keys-screen.tsx`
- `apps/design-lab/src/shadcn-usage-logs-screen.tsx`

Business behavior was checked against:

- `new-api/web/default/src/features/keys`
- `new-api/web/default/src/features/dashboard`
- `new-api/web/default/src/features/usage-logs`, especially `api.ts`, `types.ts`, `constants.ts`, the provider/filter utilities, compact header/filter/stat components, desktop table, mobile card, and details dialog
- `new-api/controller/token.go`, `model/token.go`, and `router/api-router.go`
- `new-api/controller/log.go` and `model/log.go`
- `new-api/controller/usedata.go`, `model/usedata.go`, and `model/usedata_flow.go`

The reviewed backend confirms UserAuth ownership for token, self-log, self-stat, self-usage, and self-flow endpoints; exact request/upstream trace filtering for self logs; a 30-day maximum self-aggregate range; server-side token batch deletion counts; and a separately rate-limited, no-cache full-key reveal endpoint.

## Page Mapping

| Surface | Design-lab controls and composition | Real API and Query keys | Local / Store state | Invalidation, permission, and contract gaps |
|---|---|---|---|---|
| ConsoleShell | 256px desktop rail, collapsible icon rail, 64px top bar, grouped nav, active row, account footer, theme menu, mobile sheet | No feature Query; route guard resolves session before shell | Session user/sign-out from `useSessionStore`; theme and desktop collapse from `usePreferenceStore`; mobile open/focus remains transient in the design-system Sidebar | User authentication is required; administrators still leave for native management. No new cookie or persistence was introduced, and the design-system sidebar cookie is explicitly cleared. Protected, unmigrated nav entries retain their positions in a disabled state. |
| Overview | Dense header actions, four-metric strip, readiness, API service, request route, recent usage, footer timestamp, details overlay | `getStatus`, `getTokens`, `getPricing`, `getLogStats`, `getLogs` under `['console-foundation','overview', ...]` | Session account/quota/request fields; local fixed 30-day range, refresh state, timestamp, and safe selected log row | Refresh refetches the Overview root. Status is public; account data requires UserAuth. Provider route and response availability are not exposed by the contract, so their design-lab positions show `Not exposed` and `Not observed`. |
| Analytics | Header, range/granularity controls, summary, measure tabs, chart, ranking, route flow, details, period footer | Current/previous `getQuotaData` at `['console-foundation','analytics','usage',range,granularity]`; flow at `['console-foundation','analytics','flow',range,granularity]` | Applied/draft range and granularity, measure, view tab, safe detail surface; no Store | Self-scoped UserAuth data; ranges over 30 days are chunked by the existing API client. Usage and flow failures remain independent. Success rate, latency, and endpoint dimensions are not in the aggregate contract and remain unavailable/contract-blocked. |
| API Keys | Compact toolbar, search/status/permission filters, desktop table/mobile cards, conditional batch selection, row menu, editor, confirmations, reveal | Root `['console-foundation','keys']`; list/search/detail/groups/models plus create/update/status/delete/batch/reveal mutations | Session user; draft editor, selected ids, overlays, notices, and full secret are component-local | Mutations invalidate Foundation keys, Foundation tokens, and legacy `['tokens']`. UserAuth and ownership are server-enforced. Permission semantics are not exposed, so the filter and badges stay in place as unavailable. Reveal uses mutation `gcTime: 0`; create without an id triggers list revalidation rather than fabricated success data. |
| Usage Logs | Compact actions, inline filters, summary strip, dense desktop table, mobile list, footer pagination, menu, adaptive detail | List `['console-foundation','logs','list',params]`; stats `['console-foundation','log-stats',statParams]`; `getLogs` and `getLogStats` | Draft/applied filters, application timestamp, server page, safe detail row, validation message; session only through route guard | Both Query roots are invalidated on refresh. UserAuth and self scope are enforced. Request id and upstream request id are distinct exact filters. Trace filters disable unsupported stats. Full safe filtered export is not available, so the retained export menu is disabled. |

## API And Query Contracts

| Operation | Existing client / backend route | Production behavior |
|---|---|---|
| Status | `getStatus` -> `GET /api/status` | Projects only a bounded version field for the readiness surface. |
| Pricing | `getPricing` -> `GET /api/pricing` | Uses only validated catalog count for Playground readiness; deployment-level auth failure is isolated. |
| Token list/search/detail | `GET /api/token/`, `/search`, `/:id` | Validates the envelope, total/page records, numeric ids/status/quota/timestamps, masked key shape, bounded labels, groups, models, and optional editor fields before cache insertion. |
| Token create/update/status/delete | `POST/PUT/DELETE /api/token` | Handles mutation envelopes with missing `data`; create-without-id invalidates and reloads. Server errors are projected to safe 401/403/generic/contract states. |
| Token batch | `POST /api/token/batch` | Accepts at most the backend-supported batch size, validates returned deleted count, and reports partial success without clearing undeleted selections. |
| Token reveal | `POST /api/token/:id/key` | Validates a bounded control-character-free key into transient component state only. |
| Self logs | `getLogs` -> `GET /api/log/self` | Uses server paging (`page_size=20`) and type/model/key/group/time/request/upstream filters. It validates total/page metadata and projects each row before returning from the Query function. |
| Self log stats | `getLogStats` -> `GET /api/log/self/stat` | Keeps quota, RPM, and TPM semantics separate. Trace filters are not sent because the endpoint does not accept them. Prompt/completion totals are not inferred. |
| Self analytics | `GET /api/data/self`, `/api/data/flow/self` | Validates timestamps, model/key/group dimensions, requests/count, token usage, and quota independently. Current and previous periods are queried separately. Quota, token, and request counts are never substituted for each other. |

The API client adds the aggregate `count` field used by the official flow contract and tolerates successful create/delete responses that omit `data`; it does not add an endpoint or weaken ordinary response validation. Token quota conversion remains the existing backend unit convention. E2E verifies `$3.50` becomes `1,750,000` internal quota units.

## Safety Boundary

All target Query functions validate and project responses before returning to React Query. Raw feature envelopes are not placed in the feature caches.

- Keys cache only masked credentials and validated editor/list fields. Full keys never enter a Query key, Query cache, Store, URL, toast, console, screenshot, report, localStorage, IndexedDB, or persistence layer.
- Reveal data exists only in `secret` component state, uses mutation `gcTime: 0`, and is cleared on close, Escape, navigation/unmount, and before another reveal.
- Logs allow only row id, timestamp, event type, bounded key/model/group labels, token counts, quota, latency, stream flag, request id, and upstream request id.
- Log `content`, `other`, metadata, user/channel/IP fields, unknown fields, and raw URLs are discarded before cache insertion. Allowed labels redact Bearer values, credential assignments, key-shaped strings, and URLs.
- Credential-shaped or URL-shaped key/log filters are rejected before they can enter a Query key or request URL.
- Backend messages are never rendered directly. Status-only safe errors distinguish 401, 403, ordinary transport failure, and local contract failure. E2E explicitly injects secret-shaped backend messages and confirms they do not render.
- Detail surfaces display only already-projected rows. Unsafe metadata sections keep their structural position as contract-blocked/unavailable rather than retaining hidden raw values.
- Export remains disabled because the existing API cannot prove a complete, strictly projected export across all filtered pages.

## Modified Files By Surface

| Surface | Files |
|---|---|
| Shared shell/routing | `apps/web/src/components/console-foundation/console-shell.tsx`, `apps/web/src/router.tsx`, `apps/web/src/styles.css` |
| Overview | `apps/web/src/pages/console-foundation-page.tsx` |
| Analytics | `apps/web/src/pages/console-foundation-analytics-page.tsx`, `packages/api-client/src/index.ts` |
| API Keys | `apps/web/src/pages/console-foundation-keys-page.tsx`, `packages/api-client/src/index.ts` |
| Usage Logs | `apps/web/src/pages/console-foundation-logs-page.tsx`, `apps/web/src/pages/console-foundation-logs-page.test.ts` |
| Canonical design-lab copy already missing in production | `packages/i18n/src/index.ts` (minimal shell/page labels only) |
| E2E and visual evidence | `apps/web/e2e/mock-api.ts`, `apps/web/e2e/console-foundation.spec.ts`, `apps/web/e2e/r54-console-foundation-visual.spec.ts`, this report, and `screenshots/` |

R54 does not depend on modifications to design-lab or design-system source. Existing dirty/untracked work in those areas was preserved and treated as user-owned reference material.

## Visual Comparison

The screenshot set contains all four pages in design-lab and production at 1440x1000, 390x844, and 320x844 in both light and dark themes. It also contains dedicated shell comparisons and the required overlays and states.

| Surface | Evidence | Result and remaining visible differences |
|---|---|---|
| ConsoleShell | 1440/390/320 light pairs, dark shell visible in every dark page pair, mobile navigation sheet | Sidebar width, collapsed behavior, top-bar height, content origin, group order, icons, account footer, and mobile sheet align. Production shows the authenticated fixture identity and mutes protected unmigrated destinations; design-lab shows prototype identity and active prototype destinations. Geometry is unchanged. |
| Overview | 12 paired viewport/theme images; mobile details overlay; loading and partial images | Header baseline, action order, metric grid, readiness/service split, route strip, recent usage, and mobile stacking align. Values differ by source. Production intentionally shows `Not exposed`/`Not observed` instead of prototype provider/response success and may have fewer real rows. |
| Analytics | 12 paired images; desktop dialog, mobile sheet, loading and contract images | Header, filter density, metric strip, tabs, chart/ranking/flow workspace, footer and mobile proportions align. Unsupported success/latency/endpoint dimensions remain unavailable rather than using prototype data. |
| API Keys | 12 paired images; desktop dialog, mobile sheet, reveal confirmation, loading/partial/contract images | Toolbar, column geometry, table density, footer, mobile cards, row menu and adaptive editor align. Production permission controls are disabled/unavailable; real status vocabulary, record count, totals and dates differ. Batch selection appears only after selection starts, preserving design-lab's default geometry. |
| Usage Logs | 12 paired images; export menu, desktop dialog, mobile sheet, loading/partial/contract images | Compact header/actions, inline filter rail, summary strip, desktop table, mobile rows, footer and pagination align. Prompt/completion aggregates and trace-filtered stats remain unavailable because the stat contract cannot support them. |

Manual comparison covered shell width/top-bar height, content maximum width, header baselines, section order, control heights, grid columns, padding/gaps, type scale, borders/radii, table density, summary strips, footer pagination, mobile stacking, overlay size/focus, and sticky/overflow behavior. No remaining composition-level mismatch was found. The listed differences are real data, permission, or explicit contract states and do not reflow the design-lab structure.

## Functional State Verification

| State / behavior | Result |
|---|---|
| Loading / processing | Stable, same-geometry skeletons and disabled controls verified; Overview loading artifact is held deterministically until screenshot completion. |
| Error / 401 / 403 | List/stat and usage/flow failures remain independent; Overview child Queries also remain independent after the route session is established. Safe messages only. |
| Empty / partial / contract-blocked | Distinguished on every applicable data surface. Usable projected rows remain visible; fully invalid non-empty payloads stop as contract failures rather than appearing empty. |
| Filtering / pagination / refresh | Exact filters, server pagination, page reset, unsupported-stat behavior, root invalidation/refetch, and disabled export verified. |
| Analytics statistics | Current/previous comparisons, range/granularity, chart measures, model ranking and flow dimensions use validated aggregate fields only. |
| Details | Desktop dialogs and mobile sheets use projected data, close with Escape/backdrop/button, trap focus, and restore the originating trigger. |
| Key CRUD/status/batch/reveal | Create (including missing id), edit, enable/disable, delete, partial batch, quota conversion, reveal validation/copy/cleanup and permission errors verified. |
| Locale / theme | Locale routes and light/dark/system preference behavior verified; theme uses the existing preference Store. |
| Shell keyboard/mobile | Control+B collapse, Escape, navigation close, mobile trigger focus restoration, active item, account menu and theme menu verified. |
| Browser integrity | No page error or unexpected console error in authenticated-shaped flows; no horizontal page overflow at 1440/390/320. |
| Canonical protection | `/$locale/console/*` remains on the existing pages and `LegacyConsoleShell`; Foundation CSS is absent there. |
| Sensitive inspection | Raw log fields and full secrets are absent from DOM, Query cache, URL/request filters, storage, toast and screenshots; secret-shaped backend errors do not render. |

## Verification Results

All commands were run from `apps/web`. Unit tests and the build ran after the final production-code change; typecheck and the complete E2E suite were repeated after the final evidence-only test additions.

| Command / check | Result |
|---|---|
| `npm run typecheck` | Passed (`tsc --noEmit`) |
| `npm run test` | Passed: 10 files, 35 tests |
| `npm run build` | Passed: Rsbuild 2.1.6; 1,556.5 kB total / 435.8 kB gzip |
| `npm run test:e2e` | Passed: 93/93 Chromium tests, one worker, 4.7 minutes |
| Visual spec | Passed: all viewport/theme pairs plus Shell/Overview/Analytics/Keys/Logs overlays and state captures |
| `git diff --check -- apps/web packages/api-client packages/i18n` | Passed |
| Screenshot artifact count | 74; final Shell baseline and all state images regenerated in the last full run |

## Real Anonymous API Boundary

The 4174 development preview proxies `/api` to the configured real target (`https://partokens.com`). Anonymous read-only probes on 2026-07-26 established:

- `GET /api/status`: HTTP 200 with the public deployment envelope and `v1.0.0-rc.21` response header.
- `GET /api/token/`: HTTP 401 without a session.
- `GET /api/log/self`: HTTP 401 without a session.
- `GET /api/data/self`: HTTP 401 without a session.

The browser route guard likewise redirects an anonymous Foundation visit to localized sign-in, while an administrator is redirected to the native management entry. No real credential was used for this report.

## No-Session Limitations

No authenticated real tenant session was available. Successful, partial, contract, permission and mutation workflows were therefore verified with controller-shaped Playwright responses against the real production client code. The anonymous probes prove only public-status reachability and the protected 401 boundary; they do not prove authenticated tenant payload shapes, actual group/model availability, ownership rules for an existing tenant, production mutation permissions, or real aggregate completeness.

No fixture value is claimed as live account data. Screenshots containing fixture-shaped records contain no full credential and are test evidence only.

## Protected Scope

- No `/$locale/console/*` canonical route was switched.
- `LegacyConsoleShell` remains present and canonical Overview, Analytics, API Keys, and Usage Logs retain their prior implementations.
- Wallet, Profile, Security, Connections, Notifications, Playground, and Image Studio were not migrated.
- No production dependency, API endpoint, Store, persistence mechanism, design-system source change, or prototype mutation was added for R54.
- Foundation state remains inside existing React Query, session Store, preference Store, and component state boundaries.
- All unrelated dirty and untracked work was preserved; no reset, checkout, clean, or destructive worktree operation was used.

## Remaining Risks And Contract Gaps

- Analytics cannot provide validated success rate, latency, or endpoint dimensions from current self aggregate/flow payloads.
- Keys do not expose permission/access-level semantics, so permission filtering and badges cannot become functional without a backend contract.
- Logs expose open-ended `content` and `other` fields without a field-level sensitivity guarantee. They remain excluded. A typed server-redacted detail contract is required before expanding details.
- Log statistics do not provide prompt/completion totals and do not support request-id/upstream-request-id filtering. Complete filtered export is also unavailable.
- Generic API envelopes still require page-local field validation. Authenticated production payload drift remains possible until staging is exercised with a real tenant.
- The visual difference for disabled unmigrated navigation entries is intentional under the protected scope; enabling them within Foundation should wait for their own migrations.

## Cutover Decision

R54 is complete for the parallel `console-foundation` routes: all five targets meet the design-lab composition and interaction baseline, all required state and responsive evidence exists, and the requested test suite is green.

Canonical cutover is **not approved yet**. Before changing `/$locale/console/*`, run the same matrix with an authenticated staging tenant and confirm token payloads, groups/models, ownership/permissions, real usage aggregates, log pagination/stat behavior, mutation failures, and secret cleanup under the deployed backend. The explicit contract gaps above should remain visible unless the backend is extended; no front-end inference should be added.

R54 stops here. Canonical routes were not changed.
