# Architecture And Deployment

## Proposed Repository Boundary

Future sibling directory:

```text
partokens/
├── new-api/                 # upstream, read-only
├── new-api-docs-v1/         # upstream, read-only
├── partokens-ui/             # new standalone project
│   ├── apps/
│   │   ├── web/              # public/auth/console SPA
│   │   ├── studio/           # separately loaded image workbench
│   │   └── docs/             # seven-locale full reference docs
│   ├── packages/
│   │   ├── api-client/       # New API adapters and schemas
│   │   ├── content/          # public/legal/notice source and translations
│   │   ├── design-system/    # tokens and primitives
│   │   ├── i18n/             # seven locales
│   │   ├── docs-sync/         # read-only upstream snapshot/diff tooling
│   │   └── test-contracts/   # redacted fixtures and compatibility tests
│   └── compatibility.json
└── ui-planning/
```

`partokens-ui` should be its own Git repository. Neither upstream repository is a package dependency; their route/types are reference inputs only.

## Technology Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Runtime | React 19 + TypeScript | Matches current upstream frontend generation |
| Build | Rsbuild | Matches New API frontend, fast route splitting, configurable `/_ui/` asset prefix |
| Routing | TanStack Router | Typed routes and route guards |
| Server state | TanStack Query | Cache, retries, invalidation, background refresh |
| HTTP | Axios adapter | Same-origin credentials and normalized errors |
| Local UI state | Zustand | Theme/session shell and studio UI state |
| Forms | React Hook Form + Zod | Typed validation and server error mapping |
| Styling | Tailwind CSS 4 + semantic CSS variables | Theme consistency without copying upstream CSS |
| Primitives | Base UI where needed | Accessible unstyled foundations |
| Icons | Lucide React | One coherent icon set |
| Tables | TanStack Table + Virtual | Keys/log density and scalable rows |
| Charts | VisActor VChart | Aligns with current analytics behavior |
| Dates | Day.js + Intl | Existing ecosystem plus locale-aware output |
| i18n | i18next + react-i18next | Seven locale runtime switching |
| Reference docs | Next 16 + Fumadocs 16 in isolated `apps/docs` | Preserves the current docs structure, OpenAPI rendering, and update workflow without modifying upstream |
| Local chats | Dexie/IndexedDB | Versioned multi-conversation schema and migrations |
| Canvas persistence | localForage/IndexedDB in studio package | Blob/project storage and upstream canvas compatibility |
| Tests | Vitest, Testing Library, MSW, Playwright | Unit, adapter, flow, and visual coverage |
| Package manager | Bun | Matches current upstream frontend conventions |

The web/studio runtime does not add both Radix and Base UI or multiple chart libraries without a measured need. Fumadocs dependencies remain isolated in the docs deployment and do not enter the user-console bundle.

## Application Layers

```text
Routes and features
        ↓
Domain hooks (auth, quota, keys, logs, billing, chat, studio)
        ↓
Typed API adapters + runtime schemas
        ↓
Axios/session transport or OpenAI bearer transport
        ↓
Caddy
        ↓
Unmodified New API
```

The bearer transport is isolated to the studio. Full API keys never enter global stores, query caches, logs, error telemetry, or persistent browser storage.

## Caddy Routing

The current official New API `web/default` SPA has no supported router basename/base-path, so administrators use its native, unprefixed management paths. The deployed New API theme must be configured to the current default frontend rather than classic. The standalone experience is separated by locale prefixes rather than attempting role-dependent routing at the same URL:

- `/{locale}/*` belongs to the standalone user experience, where locale is one of the seven supported BCP-47 IDs.
- `/channels`, `/models/*`, `/users`, `/redemption-codes`, `/subscriptions`, `/system-info`, and `/system-settings/*` belong to the official New API UI.
- `/` is a standalone locale-negotiation entry.
- `/oauth/:provider` and `/user/reset` are standalone technical entries required by existing external/backend callbacks.
- No compatibility redirects are added for old public, user, or legal routes. Unknown unprefixed paths fall through to unchanged New API.
- API and relay paths always proxy before either SPA fallback.
- Official `/assets/*` build assets remain owned by New API.
- Standalone web assets use `/_ui/*`; the isolated docs app uses `/_docs/*` for its Next assets and internal search/proxy/chat endpoints.

Illustrative Caddyfile (to be validated against the real container names and document roots):

```caddyfile
partokens.com {
  encode zstd gzip

  @docsInternal path /_docs/*
  handle @docsInternal {
    uri strip_prefix /_docs
    reverse_proxy partokens-docs:3000
  }

  @backend path /api/* /v1/* /v1beta/* /pg/* /mj/* /*/mj/* /suno/* /kling/* /jimeng /jimeng/* /dashboard/billing/*
  handle @backend {
    reverse_proxy new-api:3000
  }

  @officialAssets path /assets/*
  handle @officialAssets {
    reverse_proxy new-api:3000
  }

  @officialAdmin path /channels /channels/* /models /models/* /users /users/* /redemption-codes /redemption-codes/* /subscriptions /subscriptions/* /system-info /system-info/* /system-settings /system-settings/*
  handle @officialAdmin {
    reverse_proxy new-api:3000
  }

  @uiAssets path /_ui/*
  handle @uiAssets {
    root * /srv/partokens-ui
    file_server
  }

  @localizedDocs path_regexp localizedDocs ^/(zh-CN|zh-TW|en|ja|ru|fr|vi)/docs(/.*)?$
  handle @localizedDocs {
    reverse_proxy partokens-docs:3000
  }

  @localizedUI path_regexp localizedUI ^/(zh-CN|zh-TW|en|ja|ru|fr|vi)(/.*)?$
  handle @localizedUI {
    root * /srv/partokens-ui
    try_files {path} /index.html
    file_server
  }

  @technicalUI path / /oauth /oauth/* /user/reset
  handle @technicalUI {
    root * /srv/partokens-ui
    try_files {path} /index.html
    file_server
  }

  handle {
    reverse_proxy new-api:3000
  }
}
```

Important corrections for implementation:

- `/oauth/:provider` in the standalone UI is a frontend callback, while `/api/oauth/:provider` is backend. Only the `/api/*` form is proxied. The callback resumes the locale stored before leaving for the provider.
- `/user/reset` must remain a standalone entry because current reset emails are generated with that unprefixed URL.
- Configure the controlled docs app with `assetPrefix: '/_docs'` and change its internal calls from `/api/{search,proxy,chat}` to `/_docs/api/{search,proxy,chat}`. Caddy strips `/_docs` before proxying to the docs service.
- Add every enabled relay prefix from the deployed New API router before SPA fallback.
- Payment callback paths and webhooks remain backend-owned.
- Use route tests that assert content type; an API 404 must never return `text/html` from the SPA.
- The example deliberately falls back to New API for unknown unprefixed paths. This preserves native administrator routing and upstream compatibility without maintaining or redirecting old pages in the standalone project.

## Role Redirect

After any completed auth path:

```text
login/password/OAuth/Passkey/2FA
              ↓
        GET /api/user/self
              ↓
     role >= 10 ?
       yes          no
       ↓            ↓
window.location   validated same-locale return path
.assign('/channels') or '/{locale}/console/overview'
```

Use a hard navigation for administrators so Caddy selects the official UI. Backend authorization still protects management APIs and routes.

## Image Studio Strategy

### Recommended: Controlled, Narrow Fork

Use `basketikun/infinite-canvas` as a separately buildable starting point, then narrow it to the Partokens image workflow.

Reasons:

- It already covers multi-project canvas, nodes, links, local persistence, import/export, image generation, and New API-compatible endpoints.
- Its React 19/Tailwind/Zustand stack is compatible enough for shared design tokens.
- Keeping it separate contains its Ant Design dependency and faster-moving storage schema.

Required changes in the fork:

- Configure the localized `/{locale}/console/studio` route and `/_ui/studio/` assets.
- Replace local API key persistence with an injected in-memory credential provider.
- Remove remote plugin installation, MCP/Agent, audio/video, ads/sponsors, and unrelated settings from P0.
- Replace or theme Ant Design surfaces to match the Partokens design system.
- Add seven-locale UI resources.
- Pin and migrate local storage schema.
- Preserve AGPL-3.0 notices, original author attribution, source availability, and modification notices.

Risk: the upstream README explicitly says the project is in development, storage compatibility is not guaranteed, and it is not currently recommended for public multi-user deployment. Treat upstream updates as reviewed merges, not automatic pulls.

### Alternative: MIT Primitive Build

Build the narrower studio from React canvas primitives and Partokens components. This reduces license/storage/upstream volatility but costs substantially more implementation time for selection, transforms, connections, history, import/export, and accessibility. It is the fallback if the controlled fork cannot meet security or attribution requirements.

## Studio Credential Boundary

The existing image relay requires a bearer API key. Recommended flow:

- Let the user select or create a dedicated image-only key with finite quota and model allowlist.
- Reveal it through the existing key endpoint only after explicit user confirmation. The endpoint checks the session and key ownership and is rate-limited, but currently has no password/2FA step-up.
- Store it in a closure/in-memory credential service, not Zustand persistence or Query cache.
- Add `Authorization` at request time.
- Redact request headers and payloads from client diagnostics.
- Clear on logout, lock, inactivity, and page teardown.

This is less safe than a session-authenticated `/pg/images` backend endpoint, but it is the viable path under the no-backend-change constraint.

## Licensing

Use an AGPL-3.0-compatible license for the independent frontend, with `AGPL-3.0-only` as the default when the repository is created. Publish the modified image-studio source, retain original copyright/license notices, identify modifications, and include a generated third-party notice inventory in releases.

## Internationalization Architecture

App locale IDs:

| UI | BCP-47/Intl |
| --- | --- |
| `zh-CN` | `zh-CN` |
| `zh-TW` | `zh-TW` |
| `en` | `en` |
| `ja` | `ja` |
| `ru` | `ru` |
| `fr` | `fr` |
| `vi` | `vi` |

Use standard BCP-47 identifiers in URLs and Intl APIs. Add an adapter when persisting to New API's current `zhCN`/`zhTW` language values.

Routing rules:

- The locale path segment is authoritative on localized pages.
- `/` chooses saved account preference, then local preference, then browser preference, then `en` fallback.
- Locale switching changes only the locale segment and preserves the semantic destination, query, and safe return path.
- Unprefixed OAuth/reset technical entries restore the locale saved before the external flow.
- Administrator routes remain unprefixed and use the official UI's own language behavior.

## Documentation And Content Translation

`new-api-docs-v1` currently contains full source trees only for `en`, `zh`, and `ja`; it remains read-only. The independent docs app ships all seven locales through this controlled workflow:

1. Record the pinned upstream docs commit.
2. Import a source snapshot into the independent docs workspace without writing to upstream.
3. Generate a changed/new/removed-page report on each upstream update.
4. Produce initial `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi` content and preserve reviewed translations when upstream text is unchanged.
5. Mark changed translations as `draft` until regenerated and reviewed.
6. Fail CI on missing pages, missing headings, broken internal links, invalid code blocks, or untranslated required content.

Simplified Chinese is the drafting source for Partokens-owned homepage, About, legal, and notice content. Codex produces the initial translations; content metadata records locale, source revision, effective date, and `draft` or `reviewed` status. Product-owner review is required before production publication of legal text.

## Upstream Compatibility Process

`compatibility.json` records:

- Tested New API commit.
- Tested New API version header/status value.
- Tested docs commit.
- Required endpoints.
- Optional endpoints/fields.
- Known production overrides.

Upgrade workflow:

1. Fetch/update upstream repositories without editing them.
2. Diff route registration, DTOs, current frontend API wrappers, and generated docs against the recorded baseline.
3. Run adapter contract tests against the updated local backend.
4. Run auth, keys, logs, wallet, Playground, and studio smoke tests.
5. Update adapters behind feature detection.
6. Update `compatibility.json` only after passing tests.

Do not import upstream React components. Reusing their UI would couple releases, styling, route assumptions, and internal state. Reuse contracts and observed behavior through adapters.

## Caching And Persistence

- Public status/pricing: short stale time with visible refresh.
- User/self/quota: private, no persistent HTTP cache.
- Logs: query cache only, scoped to active session.
- Chat: IndexedDB, user namespace, versioned migrations.
- Studio: IndexedDB/localForage for projects and blobs; quota-aware storage management.
- Notice seen state: local hash of repository-owned notice ID/version/content.
- Theme/locale: small local preference plus account sync for locale.
- API keys: never persistent in plaintext.

## Security Controls

- Strict CSP compatible with the selected OAuth/image sources.
- No inline remote HTML style/script execution.
- Repository-owned MDX/structured content only; no administrator-authored public HTML runtime.
- Validate external URLs and use `rel="noopener noreferrer"`.
- Same-origin redirect allowlist.
- Abort controllers for logout and route teardown.
- Redaction tests for auth headers, passwords, OAuth codes, image base64, and prompt/chat content.
- Dependency and license inventory for the controlled canvas fork.
- Translation-source and review-status checks for public/legal content.

## Test Strategy

| Layer | Coverage |
| --- | --- |
| Unit | Formatters, quota/discount math display, locale mapping, capability registry, local migrations |
| Adapter | Zod fixtures for every required endpoint and error normalization |
| Component | Forms, consent gating, tables, filters, responsive rows, key reveal |
| Integration | MSW-backed auth/role, wallet, logs, Playground, studio request flow |
| E2E | Real local New API session and Caddy route ownership |
| Visual | Desktop/mobile, light/dark, seven locale stress pages, nonblank canvas pixel check |
| Content | Seven-locale page parity, internal links, code samples, effective dates, and legal review state |

## Deployment Units

- `partokens-ui-web`: static files.
- `partokens-ui-studio`: separate static chunk/build under the same origin.
- `partokens-ui-docs`: isolated Next/Fumadocs service for seven-locale full reference docs.
- `new-api`: unchanged upstream container/binary.
- `new-api-docs-v1`: unchanged read-only update source; it is not the public Partokens docs runtime.
- `caddy`: only routing/TLS/compression/cache headers.

Rollback replaces only the standalone web/studio release, docs service, and Caddy config. It never requires rebuilding or rolling back New API.
