# Dogfood Report: Partokens R3.2 Authentication

| Field | Value |
|---|---|
| **Date** | 2026-07-22 |
| **App URL** | `http://127.0.0.1:4180/` |
| **Session** | `partokens-r32-auth` |
| **Scope** | Sign-in, sign-up, email verification, recovery, OAuth callback, 2FA |

## Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Open total** | **0** |

No reproducible issue remains open in the tested R3.2 authentication page set. Findings corrected during QA include one Chinese authentication copy fallback, OAuth heading spacing, a callback state that did not complete, clipboard fallback and visible copy feedback, and four pixels of unnecessary desktop sign-up scrolling.

## Verification Matrix

| Area | Result |
|---|---|
| TypeScript and production build | Passed |
| Password sign-in consent gate | Passed |
| GitHub, LinuxDO, Google consent gate | Passed |
| Registration code send and disabled state | Passed |
| Password mismatch alert | Passed |
| Email verification handoff | Passed |
| Recovery anti-enumeration response | Passed |
| Generated password and copy feedback | Passed |
| OAuth loading, confirmed route, and console handoff | Passed |
| Authenticator and backup-code switch | Passed |
| `1440 x 900` desktop light | Passed, no page scroll on sign-up |
| `1024 x 768` workspace | Passed |
| `768 x 900` navigation transition | Passed |
| `390 x 844` mobile dark, French | Passed |
| `320 x 720` minimum dark, Russian | Passed |
| Page-level horizontal overflow | None |
| Seven authentication locales | Complete |
| Theme and locale persistence after reload | Passed |
| Form labels and autocomplete semantics | Passed |
| Visible keyboard focus | Passed, 2px Relay Blue outline |
| Clean browser runtime errors | 0 |

## Evidence

- `screenshots/r32/signin-desktop-light.png`
- `screenshots/r32/signin-fr-390-dark.png`
- `screenshots/r32/signin-ru-320-dark.png`
- `screenshots/r32/signup-desktop-light-final-settled.png`
- `screenshots/r32/signup-1024-light.png`
- `screenshots/r32/signup-768-light.png`
- `screenshots/r32/oauth-callback-complete-desktop-light.png`
- `screenshots/r32/oauth-callback-ru-320-dark.png`

## Remaining Product Work

R3.2 is ready for product review. The seven-locale authentication copy still requires the planned owner review before formal migration. Live New API authentication, role-based administrator routing, formal `apps/web` migration, Caddy publication, and production release remain out of scope for this checkpoint.
