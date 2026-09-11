# Pre-launch Final Check

- Target: `partokens-ui` production preview (`http://127.0.0.1:4174`)
- Date: 2026-08-22
- Scope: build gates, release verification, public/auth/docs browser smoke, responsive layout, console errors

## Summary

- Browser UI findings: 0 reproducible defects found.
- Playwright: 187 passed, 0 failed.
- Unit/contract tests: 191 passed, 0 failed; release-contract tests: 5 passed.
- Typecheck and production Web build: passed.
- Release blockers: 3. Compatibility and release-package verification are not currently green.

## ISSUE-001 - Current release artifact is stale (Blocker)

**Repro**

1. Read `release/release-manifest.json`; it declares source commit `bbe74389f4c0959757880d464e743bf0fab97d71`.
2. Current source is `f8e08b15c63c57714be28d1770a82a7316b04225`.
3. Run:

   `PUBLIC_PARTOKENS_SOURCE_URL=https://github.com/1251240000/ptk-frontend/tree/bbe74389f4c0959757880d464e743bf0fab97d71 bun run release:verify`

**Observed**

`Packaged Git commit does not match the current source commit`.

The packaged New API and docs pins are also older than the current `compatibility.json` pins. Do not deploy the existing `release/` directory; rebuild it from the reviewed commit and verify the resulting manifest.

## ISSUE-002 - New API compatibility gate is blocked by a dirty checkout (Blocker)

**Repro**

Run `bun run compatibility:upstream` from `partokens-ui`.

**Observed**

The gate exits with `The New API checkout contains uncommitted changes; compatibility must be checked against a clean source tree.` The checkout contains four untracked production deployment files (`.env.production.example`, `Caddyfile.prod`, `README.production.md`, `docker-compose.prod.yml`). Commit or otherwise remove/move these files before running the compatibility gate; do not bypass the check for release.

## ISSUE-003 - Public release source URL is not configured (Blocker)

**Repro**

Run `bun run release:preflight` or `bun run release:verify` without setting `PUBLIC_PARTOKENS_SOURCE_URL`.

**Observed**

Both commands exit with `PUBLIC_PARTOKENS_SOURCE_URL is required for a public release`. Set this to an anonymously reachable HTTPS URL pinned to the exact packaged commit, rebuild, and rerun release verification.

## Browser Evidence

Screenshots are in `screenshots/`:

- `initial-en.png`: desktop home
- `home-mobile-390.png`: mobile dark home
- `home-mobile-zh-light-closed.png`: mobile Simplified Chinese light home
- `auth-mobile-zh.png`: localized sign-in page
- `auth-invalid-login.png`: server error shown for invalid sign-in
- `docs-nav-mobile.png`: mobile docs navigation

No page errors or unhandled console errors were observed during the browser pass. The local preview intentionally returns a 401 for the unauthenticated session refresh before redirecting to sign-in.

## Check Gaps

- `bun run release:smoke` could not run because the expected Caddy endpoint at `127.0.0.1:8080` was not started.
- The authenticated browser pass used the existing Playwright mock coverage; no production credentials were available for a live account/API mutation check.
