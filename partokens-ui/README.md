# Partokens UI

Single-service Partokens public and ordinary-user frontend. The sibling `new-api/` and `new-api-docs-v1/` repositories are read-only compatibility inputs and are never imported as application packages.

## Capabilities

- React 19 + TypeScript + Rsbuild user interface.
- BCP-47 locale routes for Simplified Chinese, Traditional Chinese, English, Japanese, Russian, French, and Vietnamese.
- Public, authentication, legal, documentation, and ordinary-user console routes.
- Light, dark, and system themes.
- Session-aware adapters for dashboard data, scoped API key management, filtered usage logs, wallet data, and profile settings.
- Chunked 90-day analytics compatible with New API's 30-day per-request limit.
- Fixed-value top-up, subscriptions, billing history, redemption, and affiliate rewards with explicit purchase confirmation.
- Email/OAuth bindings, daily check-in, 2FA, Passkey, access-token, password, and account-deletion flows.
- Local-first Playground history with explicit on-device storage disclosure.
- Native New API management route handoff for administrators.
- Local-first Image Studio with project import/export, pan and zoom, draggable and resizable nodes, connections, notes, undo/redo, and local image history.
- Real `/v1/images/generations` and `/v1/images/edits` adapter boundary with model-aware controls and abort support.
- Documentation rendered inside the Web SPA with the same navigation, theme, assets, and release lifecycle as every other public route.
- Curated ordinary-user guides and field-level API references for chat, responses, embeddings, images, audio transcription, and model discovery.
- The retired standalone docs runtime is not part of releases; upstream docs remain an audit-only compatibility input.

## Security Boundaries

- Image Studio projects and image blobs are stored only in the browser's IndexedDB and are removed through project deletion or browser storage controls.
- Revealed API key material is held only in an in-memory module slot. It is cleared on logout, Studio teardown, and page reload, and must not enter web storage, IndexedDB, React Query, application state, logs, exports, or test artifacts.
- Existing keys require explicit confirmation before a one-session reveal. Dedicated image keys require explicit confirmation and are restricted to a finite quota and compatible models.
- Payment, credential, and account-security mutations always require explicit user confirmation.

## Development

```bash
bun install
bun run dev
```

The development proxy uses `https://partokens.com` by default for same-origin API compatibility. Override it when running a local New API instance:

```bash
PARTOKENS_API_TARGET=http://localhost:3000 bun run dev
```

Payment actions accept only backend-provided fixed amounts and require explicit confirmation. Image Studio calls same-origin New API-compatible image endpoints after the user unlocks a key for the current page session.

## Local Caddy

Run the single Web development server, then start the validated local proxy:

```bash
bun run dev
caddy run --config Caddyfile.dev
```

Open `http://127.0.0.1:8080/`. All locale-prefixed public, documentation, authentication, and Console routes are owned by the Web SPA. API, relay, official assets, and native administrator routes remain proxied to the unchanged New API instance.

For a built deployment, publish the corresponding source, set `PUBLIC_PARTOKENS_SOURCE_URL` to an anonymously readable HTTPS URL pinned to `git rev-parse HEAD`, and run `bun run release`. The release command validates the source URL, executes the quality gate, and assembles one static Web artifact plus deployment files under `release/`.

Production deployment uses [`deploy/docker-compose.yml`](deploy/docker-compose.yml) with [`deploy/.env.example`](deploy/.env.example). It builds and runs one immutable UI/Caddy container. The existing API is supplied only as `PARTOKENS_API_ORIGIN`; the UI deployment does not create or manage API, database, or cache services. Follow [`deploy/README.md`](deploy/README.md) for build provenance, HTTPS, smoke checks, upgrades, and rollback.

## Documentation Updates

Partokens documentation uses shared types and lazy locale loading in `packages/content/src/public-docs-content.ts`, one complete article module per locale in `packages/content/src/docs-locales/`, and localized navigation in `packages/content/src/public-docs-copy.ts`. The single Web SPA renders all seven complete bodies on `/{locale}/docs`; English is loaded only as a defensive fallback when a locale module is unexpectedly incomplete. The retired standalone docs runtime is not packaged; `new-api-docs-v1` is audit-only and is never started or copied into a release. Web tests require every catalog article in all seven locale modules, reject normal-path fallback, compare structural and technical literals with English, and verify that every locale chunk is present in the release.

New API compatibility is also checked against the pinned sibling checkout. The check compares every required HTTP method/path pair with New API's registered Go routes and requires direct frontend request literals to be present in the manifest:

```bash
bun run compatibility:upstream
```

After pulling a newer New API revision, audit it without changing the accepted pin:

```bash
bun run compatibility:upstream:candidate
```

When the candidate passes and its behavioral changes have been reviewed, update `newApi.commit` and `newApi.productionVersion` in `compatibility.json`, then run the full `bun run check` gate. Neither compatibility command modifies the upstream checkout.

## License And Upstream

This repository is licensed under `AGPL-3.0-only`. The Image Studio contains a narrow adaptation informed by `basketikun/infinite-canvas`; the reviewed commit and included/excluded scope are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `compatibility.json`.

Before a public network deployment, publish this repository's complete corresponding source at the packaged commit on an anonymously readable host and keep the source-code link available in the deployed interface.
