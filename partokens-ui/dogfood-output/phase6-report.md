# Dogfood Report: Partokens UI Phase 6

## Session

| Field | Value |
| --- | --- |
| Date | 2026-07-21 |
| Targets | `http://127.0.0.1:8080`, isolated browser fixtures, and the pinned sibling `new-api` checkout |
| Browser sessions | `phase6-80638d72171f`, Playwright Chromium |
| Viewports | 1440x900 desktop and 390x844 mobile |
| Scope | Repeatable critical-user-flow tests, New API route drift detection, wallet submission boundaries, local Playground durability, Image Studio credential/persistence boundaries, seven-locale mobile smoke, and live Caddy regression |

## Summary

Phase-six implementation and acceptance are complete. Three medium-severity defects were found and fixed. No open critical, high, medium, or low issue remains in the tested scope.

| Severity | Found | Open |
| --- | ---: | ---: |
| Critical | 0 | 0 |
| High | 0 | 0 |
| Medium | 3 | 0 |
| Low | 0 | 0 |
| **Total** | **3** | **0** |

## Automated Coverage

- Web unit tests: 29 passed across eight files; documentation tests: three passed. Web and Docs TypeScript checks and both production builds passed.
- Seven Playwright flows cover legal-consent gating, password/OAuth availability, registration email verification, ordinary-user and administrator routing, fixed-value wallet submission, streamed local Playground persistence, Image Studio generation, and all seven mobile authentication locales.
- Image Studio tests verify that the revealed fixture credential is used only in the request header, is absent from localStorage, sessionStorage, and every IndexedDB store, and returns to locked state after reload.
- Web unit tests include exact-match and stale-option rejection for wallet `amount_options`; browser coverage confirms that no custom numeric amount control exists.
- New API compatibility checks match 71 required HTTP method/path contracts against 293 registered routes in eight read-only Go router files at commit `5a6c53d4966b2e34690ab49f3dd19be01c88fdbe`.
- Fifty-six direct request literals in the API and Studio adapters must be registered in `compatibility.json`; candidate mode can audit a pulled upstream commit without changing the accepted pin.
- Live Caddy checks covered an authenticated ordinary-user overview, Russian mobile sign-in, French mobile image API documentation, long-text overflow, docs modal isolation, and browser console output. No production payment, key reveal, model, or image mutation was sent.
- Both development and production Caddy configurations validated; the development route smoke passed all nine web, docs, backend, administrator, asset, health, 404-ownership, and security-header checks.
- Documentation generation produced 98 localized content pages and 102 Next routes. All seven UI dictionaries contain 526 keys with zero missing entries.

## Findings

### ISSUE-001: Wallet trusted UI-only amount state and hid checkout failures behind the confirmation dialog

**Severity:** Medium  
**Area:** Wallet payment boundary and error recovery

The wallet rendered only backend-provided presets, but its mutation accepted the selected state without checking it against the latest `amount_options`. A stale or developer-modified state could therefore reach the payment adapter. Separately, when the payment request failed, the page-level error was updated while the modal remained open and kept the background inert, making the error invisible.

Submission now rejects every non-exact current preset, stale selections reset when options change, and payment failure closes the confirmation dialog before exposing the alert. The fixture never opens a real checkout. Verification: [visible fixed failure state](screenshots/phase6-issue-001-fixed.png).

### ISSUE-002: Image generation reported success before the canvas project was durable

**Severity:** Medium  
**Area:** Image Studio local persistence

Generated blobs were written to IndexedDB immediately, but the project node and history update relied on the 350 ms autosave. Reloading as soon as the success message appeared could therefore restore the old project without the generated result.

The completed project is now committed to IndexedDB before the success state is shown. A browser test generates an image, reloads immediately, restores the generated node and local blob, and confirms that the session key was cleared. Verification: [generated result restored after reload](screenshots/phase6-issue-002-fixed.png).

### ISSUE-003: Concurrent initializers created duplicate default canvases

**Severity:** Medium  
**Area:** Image Studio project initialization

Concurrent development-mode mounts could both observe an empty project table and independently add an untitled canvas. The first Studio session then showed duplicate empty projects, and another could appear after reload.

Default creation now runs in a read-write IndexedDB transaction and checks again inside that transaction. The browser gate asserts exactly one project before generation and exactly one after reload; the phase-six Studio verification screenshot shows the single retained project.

## Release Gate

- Phase-six implementation and local acceptance: **passed**.
- Public release remains blocked only by the operator-owned `PUBLIC_PARTOKENS_SOURCE_URL`. The value must be the real HTTPS location of the complete corresponding source and is intentionally not invented in this checkout.
