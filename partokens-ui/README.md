# Partokens UI

Standalone Partokens public and ordinary-user frontend. The sibling `new-api/` and `new-api-docs-v1/` repositories are read-only compatibility inputs and are never imported as application packages.

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
- Independent Next/Fumadocs documentation runtime with 98 generated pages across seven locales.
- Curated ordinary-user guides and field-level API references for chat, responses, embeddings, images, audio transcription, and model discovery.
- Read-only upstream documentation inventory that fails checks when the pinned source changes.

## Security Boundaries

- Image Studio projects and image blobs are stored only in the browser's IndexedDB and are removed through project deletion or browser storage controls.
- Revealed API key material is held only in an in-memory module slot. It is cleared on logout, Studio teardown, and page reload, and must not enter web storage, IndexedDB, React Query, application state, logs, exports, or test artifacts.
- Existing keys require explicit confirmation before a one-session reveal. Dedicated image keys require explicit confirmation and are restricted to a finite quota and compatible models.
- Payment, credential, and account-security mutations always require explicit user confirmation.

## Development

```bash
bun install
bun run dev
bun run dev:docs
```

The development proxy uses `https://partokens.com` by default for same-origin API compatibility. Override it when running a local New API instance:

```bash
PARTOKENS_API_TARGET=http://localhost:3000 bun run dev
```

Payment actions accept only backend-provided fixed amounts and require explicit confirmation. Image Studio calls same-origin New API-compatible image endpoints after the user unlocks a key for the current page session.

## Local Caddy

Run the web and documentation development servers first, then start the validated local proxy:

```bash
bun run dev
bun run dev:docs
caddy run --config Caddyfile.dev
```

Open `http://127.0.0.1:8080/`. Localized documentation routes reach the isolated docs runtime, other localized user routes and technical OAuth/reset entries reach the web UI, and API, relay, asset, and native administrator routes are proxied to the unchanged deployed New API instance.

For a built deployment, publish the corresponding source and run `PUBLIC_PARTOKENS_SOURCE_URL=https://your-source.example/partokens-ui bun run release`. The release command validates the source URL, executes the full quality gate, and assembles the web, complete Next standalone runtime, and deployment files under `release/`. Follow `deploy/README.md` to start the docs service, configure Caddy, run route smoke checks, and roll back. User routes stay locale-prefixed; native administrator routes stay unprefixed.

## Documentation Updates

Partokens documentation is independently authored and translated; `new-api-docs-v1` is a read-only compatibility input. The generated application content lives under `apps/docs/content/docs`, while `docs-sync-manifest.json` records the upstream files reviewed for the current version.

```bash
bun run docs:upstream
bun run docs:upstream:update
```

The first command is read-only and fails when the upstream commit or tracked documentation changes. The update command records a new baseline only when `compatibility.json` already pins the reviewed commit. All seven translations are marked `draft` pending product-owner review.

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

Before a public network deployment, publish this repository's complete corresponding source and expose a stable, prominent source-code link in the deployed interface. The final public repository URL is an operator-owned release input and is intentionally not invented in this development checkout.
