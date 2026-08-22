# Seven-locale documentation acceptance report

## Outcome

The single Web SPA now publishes complete document bodies for `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi`. All 18 IDs from `docsCatalog` exist in all seven locales: 126 localized documents. Normal published content never uses fallback.

Deployment is not fully release-ready only because a valid anonymous `PUBLIC_PARTOKENS_SOURCE_URL` is unavailable. `release:verify` correctly fails on that requirement. All implementation, build, package structure, smoke, E2E, and real-browser checks otherwise pass.

## Content and loading architecture

- `public-docs-content.ts` keeps stable types, dynamic locale loaders, a retry-safe promise cache, search extraction, and an English-only defensive fallback.
- `docs-locales/<locale>.ts` owns each locale's complete bodies. The docs page loads only the requested locale chunk; English loads in addition only if a requested document is absent.
- `PublicDocsPage` has localized loading/error/retry states and ignores stale async results during rapid locale switches.
- Search is built from the same loaded locale document object. Switching locale retains `#docs/<document-id>`.
- Release and bundle checks require all seven independent locale chunks, so a missing chunk blocks build/package validation.

## Translation policy

English is the semantic baseline. A shared glossary standardizes API key, quota, usage log, model, request, response, and retry. Product names, URLs, endpoints, methods, headers, JSON fields, identifiers, environment variables, placeholders, IDs, routes, model IDs, error codes, and command-line parameters remain unchanged. Unit tests compare technical literals and executable example structure against English.

The five added translations are engineering/machine-assisted translations with terminology and visible-language cleanup. They have not been reviewed by native-language human reviewers; production publication should still schedule native review for `zh-TW`, `ja`, `ru`, `fr`, and `vi`.

## Bundle comparison

| Asset | Before raw/gzip | After raw/gzip | Change raw/gzip |
| --- | ---: | ---: | ---: |
| Entry | 499,283 / 142,985 | 499,506 / 143,108 | +223 / +123 |
| Initial JS | 1,319,210 / 383,685 | 1,319,433 / 383,808 | +223 / +123 |
| Previous combined docs chunk | 202,731 / 60,935 | removed | n/a |
| Docs route shell | n/a | 37,855 / 13,453 | lazy |

Final locale chunks (raw/gzip bytes): zh-CN 54,241/14,202; zh-TW 53,886/14,752; en 56,553/13,314; ja 73,815/15,843; ru 92,406/18,216; fr 66,054/15,526; vi 69,343/14,943. No locale docs chunk is in initial JS, and bundle budgets were not loosened to hide growth.

## Verification

- `bun install`: passed, no dependency changes required.
- `bun run typecheck`: passed.
- `bun run test`: 5 release contract tests plus 190 Web tests passed; docs localization suite is 20/20.
- Affected Web E2E: 12/12 passed with an HTML report.
- `bun run build`: passed, including entry/initial/route and locale chunk budgets.
- `bun run release:package`: passed; single Web release rebuilt.
- `bun run release:verify`: executed and blocked only by missing `PUBLIC_PARTOKENS_SOURCE_URL`.
- `bun run release:smoke`: 11/11 checks passed against the packaged release through Caddy.
- Real browser: seven locale homes and deep documents, localized search, hash-preserving switch, legacy deep links, light/dark persistence, mobile sidebar, Models table, code tabs/copy, and horizontal overflow checks passed. Final console and page-error arrays are empty.

## Files

Primary additions are `packages/content/src/docs-locales/*.ts`, `packages/content/DOCS_LOCALIZATION.md`, and this evidence directory. Primary changes cover `public-docs-content.ts`, `public-docs-copy.ts`, `public-docs-page.tsx`, docs CSS/tests/E2E, bundle checks, release contract/package/verify/smoke scripts, and README. `packages/docs-sync` remains intact; `apps/docs` was not restored and no second frontend runtime was added.

Evidence is in this directory: final command logs, Playwright report, before/after bundle data, 126-document matrix, route/search checks, release structure, console/page errors, and desktop/mobile screenshots.
