# Dogfood Report: Partokens UI Phase 7

| Field | Value |
| --- | --- |
| Date | 2026-07-21 |
| App URL | `http://127.0.0.1:8080` |
| Session | `partokens-phase7` |
| Scope | P0 gap closure, seven-locale hardening, Overview and model filtering, release-definition browser flows, desktop/mobile layout, and light/dark themes |

## Summary

| Severity | Found | Open |
| --- | ---: | ---: |
| Critical | 0 | 0 |
| High | 1 | 0 |
| Medium | 0 | 0 |
| Low | 0 | 0 |
| **Total** | **1** | **0** |

## Findings

### ISSUE-001: Public model marketplace showed a generic error when pricing requires login

**Severity:** High  
**Category:** Functional  
**URL:** `http://127.0.0.1:8080/fr/models`  
**Status:** Fixed in the standalone UI  
**Repro Video:** N/A

An unauthenticated visit to the public model marketplace sends `GET /api/pricing`. The deployed backend returns HTTP 401. The original UI rendered a generic unavailable state, which did not explain how the visitor could continue.

Reproduction evidence: [public model marketplace after the 401 response](screenshots/phase7-issue-001-public-models-401.png).

The UI now detects HTTP 401, explains that this deployment requires an account before showing real pricing, and provides a locale-preserving sign-in action. Desktop and 390x844 mobile acceptance passed without horizontal overflow or browser exceptions.

Fixed evidence: [desktop](screenshots/phase7-issue-001-fixed.png) and [mobile](screenshots/phase7-issue-001-fixed-mobile.png).

## Deployment Blocker

The product requirement that anonymous visitors can compare real model prices remains blocked by production configuration, not frontend code. New API controls anonymous access to `GET /api/pricing` through `HeaderNavModules.pricing.requireAuth`; the deployed endpoint currently returns HTTP 401. Set pricing visibility to public before production acceptance. Do not work around this with a shared user credential.

## Visual Acceptance

- English public home, 1440x900 light: [screenshot](screenshots/phase7-home-en-desktop.png).
- French authenticated Overview fixture, 1440x900 dark: [screenshot](screenshots/phase7-overview-fr-desktop-dark.png).
- French authenticated Overview fixture, 390x844 light: [screenshot](screenshots/phase7-overview-fr-mobile.png).
- French public model login-required state, 1440x900 and 390x844 light: [desktop](screenshots/phase7-issue-001-fixed.png), [mobile](screenshots/phase7-issue-001-fixed-mobile.png).
- No horizontal document overflow or browser exceptions were observed in the checked desktop/mobile states.

## Verification

- Seven locale dictionaries contain 679 keys each; all literal UI translation keys exist in every dictionary.
- Web unit tests: 31 passed. Docs unit tests: 3 passed.
- Critical Playwright flows: 13 passed, covering consent, seven-locale mobile auth, registration verification, administrator routing, OAuth, 2FA, API key lifecycle, usage logs, Overview, model filtering/error state, wallet, Playground, and Image Studio.
- Web and Docs type checks passed; both production builds passed; 98 localized documentation pages were generated.
- Upstream documentation baseline is clean. New API compatibility passed with 71 required contracts matched against 293 registered routes and 56 frontend request literals verified.
- Development and production Caddy configurations validated. The local release smoke suite passed all 9 route ownership and health checks.

## Release Follow-up

- Product/legal owner reviews all seven translated UI, documentation, and legal drafts.
- Publish the complete AGPL corresponding source and set the stable HTTPS `PUBLIC_PARTOKENS_SOURCE_URL` before packaging.
- Make production pricing public if anonymous model comparison remains a launch requirement.
- Complete production-only acceptance for email delivery, GitHub/LinuxDO/Google OAuth, authenticated user flows, and the final deployed Caddy origin.
