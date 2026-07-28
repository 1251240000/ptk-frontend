# Dogfood Report: Partokens R4.3 Wallet

| Field | Value |
|---|---|
| Date | 2026-07-26 |
| App URL | `http://127.0.0.1:4180/#console-wallet` |
| Scope | Compact account funding workspace using shadcn-admin/New York and `ConsoleShell` |
| Result | Passed |

## Summary

`#console-wallet` now renders `ShadcnWalletScreen` inside `ConsoleShell` with `activeRoute='console-wallet'`. The screen contains the account balance summary, current subscription and renewal date, usage billing preference, fixed-amount top-up, redemption code, affiliate reward transfer, and billing history with details.

All behavior is component-local and simulated. No real payment or API integration, payment-platform navigation, wallet address, cryptocurrency, invoice management, auto top-up, coupon system, card management, local persistence, JSON import/export, or account Store was added. The old account prototype, CSS, copy, Stores, `ConsoleShell`, and other screens remain unchanged.

## Build Verification

| Command | Result |
|---|---|
| `bun --filter @partokens/design-lab typecheck` | Passed, exit 0 |
| `bun --filter @partokens/design-lab build` | Passed, exit 0 |

The host does not expose a global `bun` binary, so both commands were run with Bun 1.3.14 through `npx --yes bun@1.3.14`. The production build emits the existing design-lab chunk-size advisory and completes successfully.

## Funding And Billing Verification

| Area | Result |
|---|---|
| Fixed top-up amounts | Passed: $10 / $25 / $50 / $100 |
| Existing discounts | Passed: 0% / 4% / 8% / 12%; paid values $10 / $24 / $46 / $88 |
| Payment methods | Passed: Stripe / Alipay / WeChat Pay |
| Payment preview | Passed: amount, discount, paid, method, and resulting balance |
| Top-up confirmation | Passed: Dialog on desktop, bottom Sheet below 640px |
| Top-up cancellation | Passed: balance and billing history remain unchanged |
| Top-up processing | Passed: confirmation, cancellation, amount, method, and related controls are disabled |
| Top-up success | Passed: balance increases by face value and one matching record is prepended |
| Billing record consistency | Passed: Amount, Paid, Payment method, and Status match the confirmed snapshot |
| Usage billing preference | Passed: all four values selectable with success Toast |

## Redemption And Rewards Verification

| Area | Result |
|---|---|
| Empty redemption code | Passed: Redeem button disabled |
| `PT-DEMO-2026` | Passed: adds $10, clears input, records success, and shows Toast |
| Invalid redemption code | Passed: inline Error and error Toast; no balance change |
| Reward transfer confirmation | Passed: Dialog on desktop and Sheet on mobile |
| Reward transfer cancellation | Passed: rewards and balance remain unchanged; focus restored |
| Reward transfer success | Passed: Pending rewards becomes $0 and $12.80 is added to balance |
| Duplicate protection | Passed: confirm is disabled while processing and operation IDs are booked once |
| Post-transfer disabled state | Passed: transfer action remains disabled at $0 pending rewards |

The full success flow moved the sample balance from $82.40 to $130.20: $25 top-up, $10 redemption, and $12.80 reward transfer.

## History And State Verification

| Area | Result |
|---|---|
| Ready / sample | Passed |
| Skeleton loading | Passed |
| Empty billing history | Passed |
| Error and Retry | Passed |
| Refresh success | Passed |
| Refresh cancellation | Passed: prior state restored and no late completion |
| Processing / Success / Disabled | Passed |
| Toast feedback | Passed |
| New records at top | Passed for top-up, redemption, and affiliate transfer |
| Billing details | Passed on desktop and mobile |
| State preview menu | Passed: Sample / Loading / Empty / Error in page-header More menu |

Top-up, redemption, and refresh timers are cleared on re-operation and component unmount. Operation timers are also cleared when an unprocessed confirmation overlay is cancelled; refresh has an explicit cancellable loading action. Waiting beyond each simulation delay produced no duplicate or late credit.

## Accessibility And Responsive Verification

| Viewport | Theme | Result |
|---|---|---|
| 1440 x 1000 | Light | Passed |
| 1440 x 1000 | Dark | Passed |
| 1024 x 900 | Light | Passed |
| 390 x 844 | Light | Passed; single-column layout and structured billing rows |
| 320 x 720 | Dark | Passed; single-column layout and structured billing rows |

For every viewport, `documentElement.scrollWidth` and `body.scrollWidth` were at or below `window.innerWidth`. Visual review found no horizontal overflow, clipping, incoherent text wrapping, control overlap, or layout shift.

Dialog and Sheet checks passed for Escape, close/cancel behavior, viewport bounds, keyboard operation, and focus restoration to the initiating control. During processing, Escape/outside dismissal is blocked and related controls are disabled.

## Browser And Route Regression

The complete Playwright flow finished with `failures=[]`, `consoleErrors=[]`, and `pageErrors=[]` after stubbing the unrelated `/api/status` development endpoint.

The following routes rendered non-empty pages without runtime errors after the Wallet switch: `#console`, `#console-analytics`, `#console-keys`, `#console-logs`, `#console-playground`, `#console-studio`, `#console-profile`, `#system`, and `#home`.

## Evidence

- `screenshots/wallet-1440-light.png`
- `screenshots/wallet-1440-dark.png`
- `screenshots/wallet-1440-light-success.png`
- `screenshots/wallet-1024-light.png`
- `screenshots/wallet-390-light.png`
- `screenshots/wallet-320-dark.png`

The Vite development server remains available on port 4180.
