# Partokens User UI Discovery Pack

Status: discovery, R1, and R2 complete; R3.6 awaiting product review  
Snapshot date: 2026-07-22 (Asia/Shanghai)

The original `Signal Ledger` and subsequent `Model Switchboard` concepts were rejected after implementation review. Product scope, API contracts, security boundaries, locale routing, and deployment ownership remain valid. The active visual brief is [Partokens redesign brief: AI Product Workspace](./07-redesign-brief.md), with delivery sequencing in [Redesign execution plan](./08-redesign-execution-plan.md).

This directory contains the product, requirement, design, API, and deployment baseline for a new standalone Partokens user frontend. It is intentionally outside both upstream repositories.

## Hard Boundaries

- Do not modify `new-api/` backend or frontend source.
- Do not modify `new-api-docs-v1/`.
- The future UI is a separately built and deployed frontend that consumes existing New API contracts.
- New API remains the authority for authentication, authorization, quota, billing, model availability, and logs.
- Caddy owns path routing between the standalone user UI and the official New API management UI.

## Audited Baselines

| Source | Revision | Date | Notes |
| --- | --- | --- | --- |
| `new-api` | `5a6c53d4966b2e34690ab49f3dd19be01c88fdbe` | 2026-07-18 | `main`; React 19 user/admin frontend and Go APIs |
| `new-api-docs-v1` | `f7d8f97338f8db84c61c54da84b0b967e5ea179b` | 2026-07-19 | `main`; Apifox-derived API docs |
| Production | `https://partokens.com/` | 2026-07-20 | Response header reported `v1.0.0-rc.21` |
| `basketikun/infinite-canvas` | GitHub default branch | 2026-07-20 | v0.1.0, AGPL-3.0, active but explicitly development-stage |

No credential values or user-specific production data are recorded in these documents.

## Confirmed Product Decisions

- Use an independent React 19 + TypeScript application with an API compatibility layer.
- Put standalone pages under BCP-47 locale prefixes such as `/zh-CN/*` and `/zh-TW/*`; keep official management routes at native, unprefixed New API paths.
- Keep precise cost, quota, request, and route presentation while replacing the original grid/terminal-heavy visual direction.
- Use the approved AI Product Workspace direction and a product-first homepage; avoid gradients, glass effects, oversized radii, and nested dashboard cards.
- Store multiple Playground conversations locally in IndexedDB, namespaced by user.
- Display that conversation history stays in the browser and Partokens does not store that history.
- Treat the image studio as a separately buildable, controlled AGPL fork, not copied into the main dashboard feature tree.
- Use preset wallet amounts returned by `amount_options`; never render a custom amount field.
- Redirect roles `10` and `100` to official management routes after authentication.
- Ship application UI, public content, legal content, notices, quick-start docs, and full reference docs in all seven locales.
- Keep homepage, About, legal documents, and notices in the standalone project; administrator-configured HTML is reference-only.

## Documents

1. [Product and requirements](./01-product-requirements.md)
2. [Information architecture and flows](./02-information-architecture.md)
3. [Design system direction](./03-design-system.md)
4. [API contract matrix](./04-api-contracts.md)
5. [Architecture and deployment](./05-architecture-deployment.md)
6. [Confirmed decision record](./06-open-decisions.md)
7. [Redesign brief: AI Product Workspace](./07-redesign-brief.md)
8. [Redesign execution plan](./08-redesign-execution-plan.md)
9. [R1 clickable prototype review](./09-r1-prototype-review.md)
10. [R2 design system candidate](./10-r2-design-system.md)
11. [R3.1 public and content pages](./11-r3-public-content.md)
12. [R3.2 authentication pages](./12-r32-authentication.md)
13. [R3.3 console data pages](./13-r33-console-data.md)
14. [R3.4 account pages](./14-r34-account.md)
15. [R3.5 Playground](./15-r35-playground.md)
16. [R3.6 image studio](./16-r36-image-studio.md)
17. [R3.7 homepage refresh and image assets](./17-r37-homepage-refresh.md)
18. [R4 implementation tasks](./r4-implementation-tasks/00-scope-and-foundation.md)
19. [R4 development session prompt](./r4-implementation-tasks/SESSION-PROMPT.md)

## Confirmed Capability Findings

| Request | Finding |
| --- | --- |
| Password login | Supported by `POST /api/user/login` |
| GitHub, LinuxDO, Google OAuth | GitHub and LinuxDO are first-class; Google is currently configured as custom OAuth/OIDC in production |
| Email verification code | Used for registration and account binding; it is not a sign-in method |
| Multiple recent chats | Pure frontend implementation is feasible; upstream already persists one Playground conversation locally |
| Image generation | Supported through token-authenticated `/v1/images/generations` and `/v1/images/edits` |
| Session-authenticated image studio | No `/pg/images/*` endpoint exists; the studio must use a user API key or a new backend capability |
| Preset top-up amounts and discounts | Supported by `GET /api/user/topup/info`; an empty `amount_options` disables preset top-up rather than authorizing client-generated values |
| Per-user notification inbox | Not supported; the new UI uses versioned localized notices with browser-local read state |
| Legal/public content APIs | Existing HTML endpoints are reference-only; the standalone UI owns its content and translations |

## Exit Criteria For Discovery

Discovery is complete and all product decisions are recorded. Low-fidelity prototypes and the independent `partokens-ui/` scaffold can begin when requested.
