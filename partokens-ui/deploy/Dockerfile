FROM oven/bun:1.3.14 AS web-builder

WORKDIR /app

# Install from package manifests first so dependency installation remains cached
# when only application source changes.
COPY package.json bun.lock ./
COPY apps/design-lab/package.json apps/design-lab/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/design-system/package.json packages/design-system/package.json
COPY packages/docs-sync/package.json packages/docs-sync/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/studio/package.json packages/studio/package.json
RUN bun install --frozen-lockfile

COPY apps/web apps/web
COPY packages packages
COPY config config
COPY deploy deploy
COPY scripts scripts
COPY compatibility.json tsconfig.base.json ./

ARG PUBLIC_PARTOKENS_SOURCE_URL
ARG PARTOKENS_SOURCE_COMMIT
ENV PUBLIC_PARTOKENS_SOURCE_URL=${PUBLIC_PARTOKENS_SOURCE_URL} \
    PARTOKENS_BUILD_METADATA_MODE=external \
    PARTOKENS_SOURCE_COMMIT=${PARTOKENS_SOURCE_COMMIT} \
    PARTOKENS_SOURCE_TREE_STATE=clean \
    PARTOKENS_RELEASE_CHANNEL=production

RUN test -n "${PUBLIC_PARTOKENS_SOURCE_URL}" \
  && echo "${PARTOKENS_SOURCE_COMMIT}" | grep -Eq '^[0-9a-f]{40}$' \
  && case "${PUBLIC_PARTOKENS_SOURCE_URL}" in *"${PARTOKENS_SOURCE_COMMIT}"*) ;; *) exit 1 ;; esac \
  && bun run build \
  && bun run release:package \
  && bun run release:verify

FROM caddy:2.11.4-alpine

ARG PUBLIC_PARTOKENS_SOURCE_URL
ARG PARTOKENS_SOURCE_COMMIT
LABEL org.opencontainers.image.source="${PUBLIC_PARTOKENS_SOURCE_URL}" \
      org.opencontainers.image.revision="${PARTOKENS_SOURCE_COMMIT}"

COPY --from=web-builder /app/release/web /srv/partokens-ui/web
COPY deploy/Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
