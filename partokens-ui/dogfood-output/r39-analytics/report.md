# Dogfood Report: Partokens Analytics

| Field | Value |
|-------|-------|
| **Date** | 2026-07-24 |
| **App URL** | http://127.0.0.1:4180/#console-analytics |
| **Session** | r39-analytics |
| **Scope** | Analytics filters, usage measures, data inspection, responsive layout, feedback states, overlays, and route regression |

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

- [Desktop Light](screenshots/analytics-desktop-light.png)
- [Desktop Dark](screenshots/analytics-desktop-dark.png)
- [Mobile Light](screenshots/analytics-mobile-light.png)
- [Error state](screenshots/analytics-error.png)
- [Empty state](screenshots/analytics-empty.png)

## Verification

- `bun --filter @partokens/design-lab typecheck` passed.
- `bun --filter @partokens/design-lab build` passed. Vite reported only the existing chunk-size advisory.
- The 1440px Light and Dark views have no clipping, overlap, or unintended horizontal overflow.
- At 390px, the viewport, document, and body remain 390px wide; the analytics data switches to a scan-friendly mobile layout.
- Time range and granularity Select controls update pending filters; Apply filters is disabled until a filter changes.
- Requests, Tokens, and Cost measure tabs update the analytics summaries and data presentation.
- Trend, Models, and Routes tabs expose the corresponding aggregate views.
- The Export Dropdown supports Escape and disables export while data is unavailable or empty.
- Preview data state can trigger ready, Loading, Error, and Empty paths. Error and Empty states expose recovery actions.
- Refresh exposes Skeleton loading and disabled actions, then resolves through a success Toast.
- Apply filters, Refresh, Export, Empty, and Error actions produce verifiable Toast feedback.
- View data opens a Dialog on desktop and a Sheet at 390px. Both constrain focus, close with Escape, and return focus to the View data trigger.
- The mobile Sidebar constrains focus, closes with Escape, and returns focus to Toggle Sidebar.
- Previous and Next remain disabled when the current aggregate data fits on one page.
- Browser error logs are empty after target-page and mobile overlay interactions.
- `#system`, `#console-keys`, `#console-logs`, `#console-wallet`, `#console-playground`, `#home`, and `#console-analytics` load successfully with no browser errors.
