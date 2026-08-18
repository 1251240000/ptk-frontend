# Dogfood Report: Partokens Wallet Adjustments

| Field | Value |
|-------|-------|
| **Date** | 2026-08-17 |
| **App URL** | http://127.0.0.1:4174/en/console/wallet |
| **Session** | partokens-wallet-r62 |
| **Scope** | Wallet adjustments, desktop/mobile, light/dark, purchase overlay |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Issues

No reproducible issues found in the scoped validation.

## Validation

- Desktop light and dark themes at 1440 px: wallet layout, subscription action alignment, starter recommendation, redemption/referral cards, and billing table inspected with no overlap or clipping.
- Mobile light and dark themes at 390 px: no document-level horizontal overflow; card content, controls, and localized labels remain readable.
- Simplified Chinese at 390 px: `入门推荐`, `立即充值`, and the `转入余额` icon action render without document-level horizontal overflow.
- Top-up confirmation: selecting $50 shows a 10% discount, `You pay` of $45, and a projected balance of $54 from the message-only amount response.
- Browser console: no application errors observed during the scoped flow.
- Automated checks: 153 Web unit tests passed; Web and Design Lab typechecks passed; 3 targeted wallet Playwright tests passed.
- Production compile completed. The post-build entry bundle guard remains over budget at 459,156 / 425,000 bytes (134,004 / 125,000 gzip). The recovery checkpoint `bc50c06` reproduces the same pre-existing guard failure at 457,871 / 425,000 bytes (133,576 / 125,000 gzip).

## Evidence

- `screenshots/desktop-light.png`
- `screenshots/desktop-dark.png`
- `screenshots/mobile-light.png`
- `screenshots/mobile-dark.png`
- `screenshots/mobile-zh-CN-light.png`
- `screenshots/top-up-confirm-light.png`
