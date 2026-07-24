# Production Deployment

This directory deploys the standalone user interface beside an unchanged New API service. Locale-prefixed user routes belong to Partokens UI; native, unprefixed administrator routes remain owned by New API.

## 1. Build And Package

Publish the complete corresponding source first, then build with its stable HTTPS URL:

```bash
PUBLIC_PARTOKENS_SOURCE_URL=https://code.example/your-org/partokens-ui bun run release
```

The command rejects missing or placeholder source URLs, runs all checks and both production builds, then creates `release/`. The docs package includes the Next standalone server and its separately copied static assets.

## 2. Install The Release

Keep versioned release directories and point `/srv/partokens-ui/current` at the active release. Configure Caddy with:

```bash
PARTOKENS_SITE_ADDRESS=partokens.com
PARTOKENS_UI_ROOT=/srv/partokens-ui/current/web
PARTOKENS_DOCS_ORIGIN=http://127.0.0.1:3001
PARTOKENS_API_ORIGIN=http://127.0.0.1:3000
```

Start the isolated docs process from the packaged docs root:

```bash
NODE_ENV=production HOSTNAME=127.0.0.1 PORT=3001 node apps/docs/server.js
```

Validate and reload Caddy only after the docs health endpoint responds:

```bash
curl --fail http://127.0.0.1:3001/healthz
caddy validate --config /srv/partokens-ui/current/deploy/Caddyfile
caddy reload --config /srv/partokens-ui/current/deploy/Caddyfile
```

## 3. Verify

Run the release smoke suite against the public origin:

```bash
PARTOKENS_SMOKE_ORIGIN=https://partokens.com \
PARTOKENS_SMOKE_REQUIRE_PRODUCTION=true \
bun run release:smoke
```

Then complete authenticated desktop and mobile checks for sign-in, overview, analytics, API keys, logs, wallet, profile, Playground, and Image Studio. Do not submit payments, rotate credentials, change security settings, or generate billable model traffic during a smoke test.

## Rollback

Keep the previous release directory and docs process definition. Point the `current` symlink back to that version, restart the docs process, validate Caddy, reload it, and rerun the smoke suite. New API is not rebuilt or rolled back with this frontend.
