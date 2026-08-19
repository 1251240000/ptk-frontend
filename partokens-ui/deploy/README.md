# Partokens UI Deployment

This directory deploys the standalone user interface beside an unchanged New API service. Locale-prefixed user routes belong to Partokens UI; native, unprefixed administrator routes remain owned by New API.

Production and staging must use different public origins, API environments, deploy hosts, test accounts, and release directories. A staging command must never point at `partokens.com` or its API.

## Staging Release Candidate

1. Copy `staging.environment.example` to a secret-managed location outside the repository and replace every placeholder. The corresponding-source URL must be HTTPS, available to reviewers, and pinned to the full current Git commit.
2. Keep the source tree clean, then load the environment and run:

```bash
bun run release:staging
```

The staging preflight rejects production origins, a production API, an unversioned install directory, an indexable staging response policy, an unpinned source URL, and a dirty source tree. The release command runs typecheck, unit tests, complete Chromium E2E, both builds, upstream compatibility checks, package generation, and package verification.

The generated `release/release-manifest.json` and `release/web/_ui/release.json` identify the RC, UI commit, source state, R59 Console contract, upstream versions, artifact hashes, lazy chunks, and source map policy. Public Web source maps and `sourceMappingURL` references are rejected.

The release also contains `web/public-content/`. Caddy serves these JSON files from `/public-content/*` with `Cache-Control: no-store`; the web app loads the manifest first and shows a retryable localized error instead of stale legal content if runtime loading fails. Validate content with `python3 scripts/manage_content.py --validate` before packaging. To publish content without rebuilding JavaScript, update the complete `public-content` directory in a versioned release candidate and deploy it through the same atomic release/rollback flow. Do not replace individual files in the active `current` directory.

## Staging Install

Upload `release/` to the exact `PARTOKENS_RELEASE_ROOT` on `PARTOKENS_DEPLOY_HOST`. Do not overwrite `current` and do not reuse a production host or API. Record the previous symlink target before making changes.

Start the candidate docs process from its versioned release root:

```bash
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3001 node apps/docs/server.js
```

Wait for `http://127.0.0.1:3001/healthz`, validate the candidate Caddy configuration with the staging environment, then atomically point `/srv/partokens-ui/current` at the versioned candidate. Reload Caddy only after validation succeeds.

Run the HTTP smoke gate against staging:

```bash
bun run release:staging:smoke
```

The smoke gate checks deployed RC identity, 28 canonical Console locale/deep-link combinations, security and no-index headers, health routes, route ownership, immutable assets, lazy chunk availability, and the absence of public source map references.

## Authenticated Staging Matrix

Use three dedicated staging identities with independent browser sessions. Do not reuse production cookies or accounts.

| Identity | Required checks |
| --- | --- |
| Ordinary user A | Sign-in restoration, all four canonical pages, self analytics/logs, own API Key list and lifecycle |
| Ordinary user B | Cannot read, reveal, mutate, filter by, or infer user A resources; feature-local 403 preserves the session |
| Administrator | Native admin handoff works; ordinary-user owner/self scope does not widen; no credential material appears in browser storage or diagnostics |

Also verify anonymous 401 handling, authenticated 403 handling without refresh loops, locale switching across all seven locales, direct deep links, full refresh, back/forward, lazy chunk loads, console errors, failed requests, Web Vitals, and responsive layouts. Create only clearly prefixed test API Keys; revoke/delete them and confirm zero residue before closing sessions.

## Staging Rollback

1. Stop new validation actions and record the failing RC plus the previous `current` target.
2. Atomically repoint `/srv/partokens-ui/current` to the previous versioned release.
3. Restore/restart the previous docs process definition.
4. Validate Caddy, reload it, and run `bun run release:staging:smoke` with the previous candidate ID.
5. Confirm the release metadata endpoint reports the previous RC, then retain the failed candidate for investigation. Do not roll back or mutate New API as part of a frontend rollback.

## Production

Production uses `environment.example` and the existing `bun run release` flow. Production deployment requires separate approval and is intentionally not implied by successful staging validation.
