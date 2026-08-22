# Partokens UI Production Deployment

This deployment owns one service: the Partokens Web SPA served by Caddy. It does
not create, configure, health-check, upgrade, or persist an API, database, cache,
or any other backend service.

Caddy forwards same-origin API and unprefixed administrator requests to the
required `PARTOKENS_API_ORIGIN`. That endpoint must already exist and must be
reachable from the Web container.

## Requirements

- A clean, committed Partokens UI checkout.
- Docker Engine with the Docker Compose plugin.
- An existing API endpoint reachable from Docker.
- A public DNS record pointing at this host.
- Public TCP ports 80 and 443; UDP 443 is optional but enables HTTP/3.
- An anonymously readable HTTPS source URL pinned to the deployed Git commit.

## Configure

Create the untracked production environment file:

```bash
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
```

Get the exact source commit, then put the same 40-character value in
`PARTOKENS_SOURCE_COMMIT`, `PUBLIC_PARTOKENS_SOURCE_URL`, and the immutable image
tag in `deploy/.env`:

```bash
git status --short
git rev-parse HEAD
```

Do not build when `git status --short` reports application or deployment changes.
The Docker build rejects malformed or mismatched source metadata and embeds the
verified release identity at `/_ui/release.json`.

The required runtime values are:

| Variable | Purpose | Example |
| --- | --- | --- |
| `PARTOKENS_SITE_ADDRESS` | Public hostname handled by Caddy | `partokens.com` |
| `PARTOKENS_API_ORIGIN` | Existing API origin reachable from the container | `http://host.docker.internal:3000` |
| `PARTOKENS_UI_IMAGE` | Immutable image tag for this release | `partokens-ui:2026-08-22.1` |
| `PARTOKENS_SOURCE_COMMIT` | Full commit built into the image | 40-character Git SHA |
| `PUBLIC_PARTOKENS_SOURCE_URL` | Public source URL containing that SHA | Repository tree URL |

For an API published on the same Docker host, use
`http://host.docker.internal:<port>`. Compose maps that hostname to the Linux host
gateway. For an API on another host, use its internal HTTP or HTTPS origin. Do
not use `127.0.0.1` for a host service because that address points back to the Web
container itself.

## Validate And Deploy

Run these commands from the repository root:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml config --quiet
docker compose --env-file deploy/.env -f deploy/docker-compose.yml build --pull web
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-build --remove-orphans web
```

Only the `web` container and the two Caddy certificate/configuration volumes are
created. Caddy obtains and renews the public certificate automatically when the
DNS record and public ports are correct.

Inspect the result:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs --tail=200 web
curl -fsSI https://partokens.com/_ui/healthz
curl -fsS https://partokens.com/_ui/release.json
curl -fsSI https://partokens.com/zh-CN/
```

`/_ui/healthz` must return 204. The release metadata must report the configured
production commit and a clean source state.

Run the frontend-only production smoke gate from the checkout:

```bash
PARTOKENS_SMOKE_ORIGIN=https://partokens.com \
PARTOKENS_SMOKE_ENVIRONMENT=production \
bun run release:smoke
```

This gate verifies the release identity, localized deep links, static assets,
lazy chunks, caching rules, and security headers. It deliberately does not test
or identify the separately operated API.

## Update

1. Keep the current image tag available for rollback.
2. Check out the next clean, reviewed commit.
3. Change `PARTOKENS_UI_IMAGE`, `PARTOKENS_SOURCE_COMMIT`, and
   `PUBLIC_PARTOKENS_SOURCE_URL` together.
4. Build the new image and rerun `up` with the commands above.
5. Run the production smoke gate before removing any old image.

Caddy certificate state stays in `caddy_data` across image replacements. A Web
update never restarts or mutates the API.

## Roll Back

Set `PARTOKENS_UI_IMAGE` in `deploy/.env` back to the previous immutable image
tag, then recreate only the Web container:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-build web
```

Run the smoke gate again and confirm `/_ui/release.json` reports the previous
commit. Do not use `docker compose down -v`; deleting the Caddy volumes discards
locally stored certificate and account state and is not part of a rollback.

## Deploy A Registry Image

CI may build and push the same image under an immutable tag or digest. A
production host then needs only `docker-compose.yml`, `.env`, and registry access:

```bash
docker compose --env-file .env -f docker-compose.yml pull web
docker compose --env-file .env -f docker-compose.yml up -d --no-build --remove-orphans web
```

Pin `PARTOKENS_UI_IMAGE` to an immutable tag or digest. Never use `latest` for a
production release.
