# Dogfood Report: Partokens R3.4 Account Pages

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/` |
| **Session** | `partokens-r34-account` |
| **Scope** | Wallet, profile, security, account connections, notifications |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.4 page set. Corrections during QA included localized account-connection and result labels, mobile wrapping for long Russian trust labels, and responsive rearrangement of the balance route, security forms, bindings, and billing records.

## Verification Matrix

| Area | Result |
|---|---|
| Design-lab TypeScript and production build | Passed |
| Preset amount selection, discount, payment method, and confirmation | Passed |
| No custom top-up amount input | Passed |
| Subscription billing preference, redemption, rewards, history | Passed |
| Profile save, no user ID, and daily check-in | Passed |
| Email/GitHub/LinuxDO/Google connection states | Passed |
| 2FA setup, Passkey confirmation, token generation/copy | Passed |
| Password and typed account-deletion confirmation | Passed |
| Notification channel fields and behavior switches | Passed |
| `1440 x 900` desktop light | Passed |
| `1024 x 900` wallet reflow | Passed |
| `768 x 900` security and mobile navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 740` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven account-page locales | Complete |
| Theme and locale persistence after reload | Passed |
| Dialog focus loop, Escape, and restore | Passed |
| Browser runtime errors | 0 |

## Evidence

- `dogfood-output/r34-wallet-1440.png`
- `dogfood-output/r34-profile-1440.png`
- `dogfood-output/r34-wallet-1024.png`
- `dogfood-output/r34-security-768.png`
- `dogfood-output/r34-wallet-fr-dark-390.png`
- `dogfood-output/r34-profile-ru-dark-320.png`

## Remaining Product Work

R3.4 is ready for product review. All displayed account data remains prototype-only. Live API adapters, real payment/OAuth/WebAuthn operations, Turnstile/error states, formal `apps/web` migration, Caddy publication, and production release remain out of scope for this checkpoint. After approval, the next prototype family is R3.5 local multi-conversation chat.
