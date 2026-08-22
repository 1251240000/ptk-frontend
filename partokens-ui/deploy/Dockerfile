# Build the production SPA into an immutable Caddy image.
# This path is independent of the repository's release/ packaging workflow.
FROM oven/bun:1.3.14 AS web-builder

WORKDIR /app
COPY . .

ARG PUBLIC_PARTOKENS_SOURCE_URL=
ENV PUBLIC_PARTOKENS_SOURCE_URL=${PUBLIC_PARTOKENS_SOURCE_URL}

RUN bun install --frozen-lockfile \
  && bun run build

FROM caddy:2.11.4-alpine

COPY --from=web-builder /app/apps/web/dist /srv/partokens-ui/current/web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
