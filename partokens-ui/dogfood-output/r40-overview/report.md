# Dogfood Report: Partokens Console Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-07-25 |
| **App URL** | http://127.0.0.1:4180/#console |
| **Session** | r40-overview |
| **Scope** | Overview content, service readiness, recent usage, responsive layout, feedback states, overlays, focus management, navigation, and route regression |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

No unresolved issues were found in this run.

## Screenshots

- [Desktop Light](screenshots/overview-desktop-light.png)
- [Desktop Dark](screenshots/overview-desktop-dark.png)
- [Mobile Light](screenshots/overview-mobile-light.png)
- [Desktop request Dialog](screenshots/overview-desktop-dialog.png)
- [Mobile request Sheet](screenshots/overview-mobile-details.png)
- [Mobile Sidebar](screenshots/overview-mobile-sidebar.png)
- [Loading and disabled state](screenshots/overview-loading.png)
- [Error state](screenshots/overview-error.png)
- [Empty state](screenshots/overview-empty.png)

## Verification

- `bun --filter @partokens/design-lab typecheck` passed.
- `bun --filter @partokens/design-lab build` passed. Vite reported only the existing chunk-size advisory.
- The 1440px Light and Dark views preserve the shadcn-admin/New York shell, density, spacing, typography, borders, and control language used by the migrated console screens.
- Account balance, recent usage, total usage, request count, 3/3 request readiness, API availability, deployed version, compatible endpoint, request route, and recent usage records are present.
- At 390px, viewport, document, and body widths are all 390px. No horizontal overflow, clipping, overlap, or unintended truncation was found.
- Recent usage uses a standard Table on desktop and switches to a scan-friendly record list on mobile.
- Create a key, Open Playground, Notices, Inspect logs, and View all navigate to `#console-keys`, `#console-playground`, `#notices`, and `#console-logs` as expected.
- Refresh exposes Skeleton loading, disables conflicting actions, updates API service status, and resolves through a success Toast.
- Preview recent usage can trigger Ready, Empty, and Error paths. Empty and Error states expose working recovery actions and Toast feedback.
- Request details open in a Dialog on desktop and a full-width Sheet on mobile. Both constrain focus, close with Escape, and return focus to the originating details trigger.
- The mobile Sidebar constrains focus, closes with Escape, and returns focus to Toggle Sidebar.
- The browser console and page error logs remained empty throughout target-page and regression testing.
- `#system`, `#console-keys`, `#console-logs`, `#console-analytics`, `#console-wallet`, `#console-playground`, and `#home` loaded successfully. Wallet and Playground remain on their existing unmigrated implementations.
