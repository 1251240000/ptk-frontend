# R60 Canonical Console Staging Release Validation

| Field | Result |
| --- | --- |
| Date | 2026-07-29 |
| R59 source commit | `d0c84e70c7a6105e2c96a1b6336ad6f48774e043` |
| Local release validation | **PASSED** |
| Real staging deployment and acceptance | **BLOCKED / NOT EXECUTED** |
| Production deployment | **PROHIBITED / NOT EXECUTED** |
| Decision | **NOT APPROVED FOR STAGING SIGN-OFF** |

## Result

R60 established a traceable release-manifest schema, staging-only preflight, deployed release identity endpoint, security/cache/source-map gates, expanded smoke coverage, self-contained Chromium orchestration, isolated R60 evidence, and a rollback runbook. Typecheck, unit, production build, bundle budgets, package verification, complete Chromium E2E, Caddy validation, local packaged HTTPS smoke, and anonymous black-box browser validation pass.

Real staging validation cannot be signed off. No staging DNS name resolves, no staging deploy target or environment is configured, no dedicated ordinary-user A / ordinary-user B / administrator credentials are available, and the proposed corresponding-source URL returns HTTP 404. The working tree also contains the R60 implementation and is intentionally dirty; the new preflight correctly rejects it. No remote staging deployment was attempted and production was not modified.

## Release Candidate

The locally generated candidate is useful for validating the package contract but is deliberately not deployable:

| Field | Value |
| --- | --- |
| Candidate | `r60-d0c84e7.local.1` |
| Manifest schema | `2` |
| Channel | `staging` |
| Application version | `0.1.0` |
| UI commit | `d0c84e70c7a6105e2c96a1b6336ad6f48774e043` |
| Source tree | `dirty` |
| R59 contract | Seven locales; `overview`, `analytics`, `keys`, `usage-logs` |
| Public source maps | `disabled` |
| Web artifact SHA-256 | `e29323de6311d94b499e8e07d2de0b04d7b14c38a59a20d080b0b9c9023d7d5f` |
| Web index SHA-256 | `f7e6aac8001ff918481322d925e41200b963b091d28d9482157b92650ac54eab` |
| Corresponding source | Proposed commit-pinned GitHub URL returns HTTP 404 anonymously |

`release/release-manifest.json` and `release/web/_ui/release.json` contain the same identity and artifact contract. Package verification checks the UI commit, channel, candidate, R59 locale/route set, budget-file digest, Web tree digest, index digest, four lazy chunk digests/sizes, source URL embedding, source-map absence, and required Caddy routes.

The staging gate requires a clean tree and an HTTPS corresponding-source URL pinned to the full current commit. The local candidate records `dirty`, and strict preflight fails as intended. A deployable RC must be regenerated after the R60 changes are committed and the corresponding source is published.

## Staging Configuration And Security

Added `deploy/staging.environment.example` and `bun run release:staging:preflight`. The preflight rejects:

- Any release channel other than `staging` or candidate outside `r60-<identifier>`.
- HTTP staging origins, production Web/API hosts, mismatched Caddy site address, or a non-staging API declaration.
- Credentials embedded in URLs, an unidentified deploy host, an unversioned release root, or a UI root that does not use the rollback-safe `current/web` symlink.
- A staging hostname that does not resolve, or a source URL that is not HTTPS, commit-pinned, and HTTP-reachable.
- A deploy environment not explicitly tagged `staging`, or a deploy host shared with production.
- An indexable staging robots policy or a dirty source tree.

Caddy now serves `/_ui/release.json` with `Cache-Control: no-store`; fingerprinted `/_ui/*` assets remain `public, max-age=31536000, immutable`. HTML remains `no-store`. The validated response headers include CSP, HSTS, nosniff, frame denial, strict referrer policy, permissions policy, COOP, CORP, cross-domain policy denial, and staging `noindex, nofollow, noarchive`. The package rejects public `.map` files and `sourceMappingURL` references.

## Deployment Discovery

| Check | Result |
| --- | --- |
| `staging.partokens.com` | No A/AAAA record |
| `api-staging.partokens.com` | No A/AAAA record |
| `staging-api.partokens.com` | No A/AAAA record |
| `test.partokens.com` | No A/AAAA record |
| Repository staging workflow/environment | No local workflow configuration or staging environment variables found; GitHub CLI unavailable |
| Deploy host | No SSH alias identified as Partokens staging |
| Browser auth vault | No saved auth profiles |
| Corresponding-source URL | HTTP 404 anonymously |
| Dedicated test accounts | Not provided/discoverable |

The deployment boundary therefore remained closed. No DNS, SSH target, symlink, Caddy instance, remote docs process, New API instance, Git branch, or production service was changed.

## Smoke And Navigation

The packaged release was exercised locally with HTTPS Caddy on `localhost`, the packaged Next docs runtime, and an isolated mock API. Caddy's local CA was supplied as an additional trust root; TLS verification was not disabled. The local-only dirty override is hard-restricted to loopback origins.

`release:smoke` passed 11 grouped checks:

- Deployed RC identity and commit.
- All 28 combinations of seven locales and four canonical Console deep links, including query strings, secured HTML, and `no-store` behavior.
- Web and docs health, localized docs, backend status, backend/docs 404 ownership, and native administrator route ownership.
- Fingerprinted entry asset ownership/cache policy.
- Four independently versioned Console lazy chunks, immutable caching, exact manifest sizes, and no source-map references.

Black-box Chromium visited anonymous canonical deep links for all seven locales. Every locale rendered the correctly localized sign-in page and preserved the complete original route/query in `redirect`. Full refresh preserved the Japanese sign-in return path. Browser console and page-error collections were empty. Representative evidence:

- `screenshots/local-anonymous-deep-link.png`
- `screenshots/local-history-refresh-ja.png`

Authenticated back/forward, refresh restoration, and lazy retry are covered by final E2E fixtures, but they remain unverified against a real staging session.

## Role Matrix

| Identity / boundary | Real staging | Local automated evidence | Final status |
| --- | --- | --- | --- |
| Anonymous | Not available remotely | Seven-locale deep-link redirect and return path passed in packaged browser | **LOCAL PASS** |
| Ordinary user A | No dedicated account | Owner/self routes, 401 refresh, feature-local 403, four Console pages covered by fixtures | **BLOCKED** |
| Ordinary user B | No second account | Non-owner and sensitive-data isolation contracts covered by fixtures | **BLOCKED** |
| Administrator | No dedicated staging admin | Native management handoff and ordinary-user boundary covered by fixtures | **BLOCKED** |
| 401 / 403 | No real staging API | 401 one-refresh/retry and local 403 isolation pass in Chromium | **BLOCKED FOR REAL ACCEPTANCE** |

Fixture coverage cannot prove tenant isolation, backend role assignment, cookie policy, or deployed API authorization. These rows must be rerun in three independent real browser sessions after staging accounts exist.

## API Key And Usage Logs

The full Chromium suite passes fixture-based API Key create, edit, disable, reveal, delete, permission failures, one-refetch invalidation, stale search cancellation, secret non-persistence, Usage Logs self scope, filtering, pagination, statistics, redaction, and detail focus.

No real staging Key was created because no staging API/account exists. No production Key or Usage Log resource was read, created, revealed, mutated, or deleted. Real lifecycle cleanup and cross-account visibility remain blocked.

## Console, Network, Performance, Cache, And Bundle

| Area | Result |
| --- | --- |
| Browser console/errors | Empty in packaged anonymous black-box run |
| Expected local mock failures | Auth refresh and fallback favicon returned mock 404; no production API was used |
| Local Web Vitals | TTFB `0.4 ms`, FCP `64 ms`, LCP `64 ms` on `h1`, CLS `0`; INP unavailable without interaction |
| HTML cache | `no-store` |
| Release metadata cache | `no-store` |
| Fingerprinted assets/chunks | `public, max-age=31536000, immutable`; zstd observed |
| Public source maps | 0 `.map` files and 0 `sourceMappingURL` references |
| Visual evidence | 76 R60 screenshots across 1440/390/320, light/dark, production/design/state surfaces |

The source-identified RC build remains within all budgets:

| Asset | Raw | Raw budget | Gzip | Gzip budget |
| --- | ---: | ---: | ---: | ---: |
| Entry | 396,283 B | 425,000 B | approximately 114.5 kB | 125,000 B |
| Initial JavaScript | 1,091,002 B | 1,160,000 B | within 350,000 B | 350,000 B |
| Overview | 29,420 B | 40,000 B | approximately 8.0 kB | 11,000 B |
| Analytics | 35,380 B | 48,000 B | approximately 9.1 kB | 13,000 B |
| API Keys | 40,871 B | 58,000 B | approximately 12.1 kB | 16,000 B |
| Usage Logs | 26,115 B | 36,000 B | approximately 8.0 kB | 11,000 B |

CDN behavior, geographic latency, real API latency, real INP, long-session memory, and edge-cache revalidation cannot be inferred from localhost and remain staging acceptance items.

## Rollback

The runbook in `deploy/README.md` requires versioned release directories and an atomic `current` symlink:

1. Stop new validation actions and record the failing RC plus the previous symlink target.
2. Repoint `/srv/partokens-ui/current` atomically to the previous versioned release.
3. Restore/restart the previous packaged docs process.
4. Validate and reload Caddy, then rerun staging smoke with the previous candidate ID.
5. Confirm `/_ui/release.json` reports the previous RC and retain the failed candidate for investigation.

New API is not rebuilt, mutated, or rolled back as part of the frontend rollback.

## Automated Verification

| Command / gate | Final result |
| --- | --- |
| `bun run typecheck` | Passed: Web and Docs; 98 localized docs pages, 0 updated |
| `bun run test` | Passed: R60 release contract 5/5; Web 100/100; Docs 3/3 |
| `bun run build` | Passed: Web bundle budgets and Docs production build with 102 static pages |
| Source-identified Web RC build | Passed; entry/initial/routes remain within budgets |
| `bun run test:e2e` | **Passed: Chromium 105/105, 1 worker, 0 retry, approximately 3.6 minutes** |
| Caddy validate | Passed with staging headers/environment |
| `release:package` + `release:verify` | Passed for local dirty candidate; strict clean deployment intentionally not claimed |
| Local packaged staging smoke | Passed: 11 grouped checks, including 28 locale/route combinations and 4 lazy chunks |
| `agent-browser` packaged black-box | Passed anonymous locale/redirect/header/error/performance checks |
| `git diff --check` | Passed |

The first E2E attempt recorded 81 passes and 24 immediate `ERR_CONNECTION_REFUSED` failures because Playwright did not start the design-lab service used by visual comparisons. The root cause was fixed by declaring both Web and design-lab in `webServer`; two subsequent complete runs passed 105/105. The original failed-test IDs are preserved in `initial-e2e-failure.json`.

## Known Risks And Blockers

1. No real staging origin, DNS record, deploy host, API instance, or secret-managed environment exists.
2. No dedicated user A, user B, or administrator account exists for staging role acceptance.
3. Corresponding source is not anonymously accessible, and the current R60 source tree is uncommitted/dirty; the staging preflight must remain red.
4. Local mock/fixture validation cannot prove deployed owner/self scope, tenant isolation, cookie behavior, real 401/403 semantics, or sensitive backend payload isolation.
5. Performance and cache evidence is localhost-only; no CDN, real-network, long-session, or real API measurements were possible.
6. The manifest pins New API compatibility to `v1.0.0-rc.21`; the eventual staging API version must be checked before deployment.

## Cleanup

- Closed the dedicated `agent-browser` session; preserved an unrelated pre-existing default session.
- Stopped local Caddy, packaged docs, mock API, Web, and design-lab processes; validation ports have no listeners.
- Browser residue after anonymous validation: one locale key, one scroll-restoration key, zero cookies, zero auth state.
- Real test resources created: `0`; real test resources remaining: `0`.
- Production deployments, server changes, account changes, and business-resource mutations: `0`.
- R60 evidence is isolated under this directory; historical R59 and phase6 screenshots were restored after the suite exposed their old hard-coded output paths.

## Gate

**Local R60 release validation: PASSED. Real Canonical Console staging validation: BLOCKED.** Do not treat the local candidate as deployable and do not proceed to production. The next valid action is to provision an isolated staging origin/API/host and three test identities, publish commit-pinned corresponding source, commit the R60 changes, generate a clean RC, deploy only that RC to staging, and rerun this role and resource matrix.
