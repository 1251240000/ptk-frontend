# Dogfood Report: Partokens UI Phase 4

## Session

| Field | Value |
| --- | --- |
| Date | 2026-07-21 |
| Target | `http://127.0.0.1:8080/` with live `https://partokens.com` New API |
| Session | `partokens-phase4-release`, `partokens-phase4-production` |
| Viewports | 1440x900 desktop, 390x844 mobile |
| Scope | Production routing, security headers, live ordinary-user authentication and read-only console flows, responsive release regression |

## Summary

Phase-four release hardening and browser acceptance are complete. Four issues were found and fixed: two medium-severity accessibility defects and two low-severity localization/runtime-polish defects. No open critical, high, medium, or low issue remains in the tested release surface.

The packaged production UI passed a cold-load regression with an empty browser console and no runtime page errors. Credentials, account identifiers, balances, API key fragments, logs, and user-generated content are excluded or redacted from report evidence.

## Automated Release Checks

- Web tests: 23 passed across 6 files.
- Documentation tests: 3 passed across 1 file.
- Web and documentation TypeScript checks passed.
- Web and Next standalone documentation production builds passed.
- Documentation generation produced 98 localized content pages and 102 Next routes.
- Upstream documentation drift check passed against pinned commit `f7d8f97338f8db84b0b967e5ea179b` with 102 tracked source files and no changes.
- Development and production Caddy configurations validated.
- Development and production route smoke suites each passed 9 ownership, health, security-header, and cache checks.
- Production cold load returned an empty browser console and no page errors. Verification: [final production cold load](screenshots/phase4-production-final-cold-load.png).
- `new-api` and `new-api-docs-v1` remain unchanged at their pinned commits.

## Findings

### ISSUE-001: Console dialogs did not isolate the background or own keyboard focus

**Severity:** Medium  
**Area:** API keys, usage logs, wallet, and profile dialogs

Opening the create-key drawer produced an element with `role="dialog"` and `aria-modal="true"`, but browser inspection showed that focus remained outside the dialog and the application root was neither inert nor hidden from assistive technology. The same hand-built backdrop pattern was shared by credential reveal, log detail, payment confirmation, 2FA, Passkey, access-token, and account-deletion dialogs.

The shared `Modal` primitive now portals dialogs outside the application root, marks the background inert and `aria-hidden`, moves focus to the declared initial control, traps Tab within the dialog, closes on Escape when allowed, and restores the trigger focus on close. A browser retest of the create-key drawer reported the name input as active, `rootInert: true`, `rootHidden: true`, and `dialogModal: true`. Verification: [fixed accessible key drawer](screenshots/phase4-issue-001-fixed.png).

### ISSUE-002: Mobile console “More” sheet had no focus or modal semantics

**Severity:** Medium  
**Area:** Mobile console navigation

At 390x844, opening the bottom navigation’s “More” sheet visually covered the main console but left focus on the trigger, exposed no dialog or menu role, did not make the background inert, and could not be dismissed with Escape. Verification of the original visible state: [mobile More sheet audit](screenshots/phase4-mobile-more-audit.png).

The sheet now uses the shared modal behavior while retaining its existing bottom-sheet composition. Browser retesting reported `dialog: "更多"`, focus on the Close control, `rootInert: true`, no horizontal overflow, Escape dismissal, and focus restoration to the More trigger. Verification: [fixed mobile More sheet](screenshots/phase4-issue-002-fixed.png).

### ISSUE-003: Navigation and Playground control labels bypassed i18n

**Severity:** Low  
**Area:** Global navigation, console navigation, Playground, and analytics accessibility labels

Several control and landmark labels were hard-coded in English, including mobile Menu/Close, primary/mobile/console navigation, sidebar expansion, local-conversation actions, and the usage chart label. Chinese browser snapshots therefore exposed English assistive text inside an otherwise localized interface.

All affected controls now use the shared seven-locale resources. The top navigation also exposes localized `aria-expanded` and `aria-controls` disclosure state. A Simplified Chinese retest reported `topMenu: "菜单"`, `consoleNav: "控制台导航"`, and `close: "关闭"`. Verification: [localized mobile controls](screenshots/phase4-issue-003-fixed.png).

### ISSUE-004: Production console contained an i18next support promotion

**Severity:** Low  
**Area:** Production runtime diagnostics

The first packaged production load had no application errors or warnings, but i18next emitted its managed-localization support promotion in the browser console. The runtime now explicitly disables that optional support notice. The final fresh-process cold-load regression produced no console output and no runtime errors.

## Release Gate

- Phase-four implementation and local acceptance: **passed**.
- Public release preflight: **waiting for operator input**. `PUBLIC_PARTOKENS_SOURCE_URL` must be the real HTTPS location of the complete corresponding source; the check intentionally rejects a missing or placeholder value.
- The current local package records `sourceCodeUrl: null` and is suitable for local acceptance only. It must be rebuilt with `PUBLIC_PARTOKENS_SOURCE_URL=https://<published-repository>` before public deployment.
