# Inline Channel Binding Verification

Date: 2026-09-11

## Changes

- Add Channel appends an independent local row with priority 1000 and weight 100.
- Searchable channel selection supports keyboard navigation, unavailable reasons, duplicate prevention, and reselection before save.
- Existing bindings stay read-only by channel identity. Numeric edits stay local and allow empty intermediate input.
- Empty rows block preview and participate in unsaved-change protection.
- Removed selection batches, ordering controls, and automatic priority filling.
- Retained preview, version checks, retry limits, partial execution recovery, verification, and separate clear-all confirmation.
- Popover is mounted in the sheet outside the scroll area; Escape closes the selector without closing the sheet.

## Automated Results

- `bun run typecheck`: passed.
- `bun run test src/features/admin/route-draft.test.ts src/features/admin/admin-model-operations.test.ts src/features/admin/admin-copy.test.ts`: 8 tests passed.
- `bunx playwright test --config playwright.routes.config.ts`: 11 tests passed.
- `.venv/bin/python -m unittest discover -s tests -p test_routing.py -q` in partokens-admin-api: 12 tests passed.
- Legacy interaction search: no remaining matches in routing source or routing E2E tests.

The HTTP integration suite uses the real admin service and database with an isolated in-memory upstream substitute. It verifies saved routes by reading the backend after execution. It does not exercise a live production upstream.

Covered: blank rows, focus, search, keyboard selection, disabled/unready channels, duplicate prevention, reselection, temporarily blank numbers, local-only changes, draft removal, independent groups, background refresh, navigation protection, preview conflicts, partial failure/resume, saved read-only identity, and clear-all confirmation.

## Layout Evidence

Playwright screenshots and DOM assertions cover widths 1440, 1024, 390, and 320 pixels, including 8 consecutive new rows, long channel names, and 160 models. Page, row, and dialog overflow checks pass; row inputs and buttons do not intersect; header/footer remain visible; dropdown is fully inside the viewport.

- `overview-{width}.png`: compact group list.
- `editor-{width}.png`: existing bindings.
- `selector-{width}.png`: dropdown after consecutive additions.
- `drafts-{width}.png`: long channel selection and expanded model list.
- `preview-390.png`: mobile save preview.

Desktop and 320px screenshots were visually inspected. No incoherent overlap or horizontal overflow was found. These checks use Chromium viewport emulation, not physical mobile devices.

## Local Access

http://127.0.0.1:5175/zh-CN/console/admin/routes

The development server is running on port 5175 and uses the existing API proxy configuration. Normal administrator authentication is required. Ports 5173 and 5174 were already occupied and were left alone.
