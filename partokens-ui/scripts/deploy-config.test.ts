import { describe, expect, test } from 'bun:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const deployFile = (name: string) => readFileSync(join(projectRoot, 'deploy', name), 'utf8')

describe('frontend-only deployment', () => {
  test('Compose contains one Web service and no managed backend or data services', () => {
    const compose = deployFile('docker-compose.yml')

    expect(compose).toContain('services:\n  web:')
    expect(compose).toContain('PARTOKENS_API_ORIGIN: ${PARTOKENS_API_ORIGIN:?')
    for (const forbidden of ['\n  new-api:', '\n  postgres:', '\n  redis:', 'POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'SESSION_SECRET']) {
      expect(compose).not.toContain(forbidden)
    }
  })

  test('the image packages and verifies release metadata', () => {
    const dockerfile = deployFile('Dockerfile')

    expect(dockerfile).toContain('bun run release:package')
    expect(dockerfile).toContain('bun run release:verify')
    expect(dockerfile).toContain('COPY compatibility.json tsconfig.base.json ./')
    expect(dockerfile).toContain('COPY --from=web-builder /app/release/web')
    expect(dockerfile).toContain('setcap -r /usr/bin/caddy')
  })

  test('the runtime requires an external API origin and stores no backend credentials', () => {
    const caddyfile = deployFile('Caddyfile')
    const environment = deployFile('.env.example')

    expect(caddyfile).toContain('reverse_proxy {$PARTOKENS_API_ORIGIN}')
    expect(caddyfile).not.toContain('PARTOKENS_API_ORIGIN:http')
    expect(environment).toContain('PARTOKENS_API_ORIGIN=http://host.docker.internal:3000')
    for (const forbidden of ['POSTGRES_', 'REDIS_', 'SESSION_SECRET', 'NEW_API_']) {
      expect(environment).not.toContain(forbidden)
    }
  })

  test('payment return routes remain owned by the Web SPA', () => {
    const caddyfile = deployFile('Caddyfile')

    expect(caddyfile).toContain('/wallet/return/?')
    expect(caddyfile).toContain('|topup)')
    expect(caddyfile).toContain('/payment/return /wallet /usage-logs')
  })

  test('production listener is HTTP-only on port 8080 and cannot auto-upgrade to HTTPS', () => {
    const compose = deployFile('docker-compose.yml')
    const caddyfile = deployFile('Caddyfile')
    const environment = deployFile('.env.example')

    expect(compose).toContain('PARTOKENS_HTTP_PORT:-8080}:8080')
    expect(compose).not.toContain('PARTOKENS_HTTPS_')
    expect(environment).toContain('PARTOKENS_SITE_ADDRESS=http://:8080')
    expect(environment).toContain('PARTOKENS_HTTP_PORT=8080')
    expect(caddyfile).toContain('explicit http:// scheme')
    expect(caddyfile).not.toContain('Strict-Transport-Security')
  })
})
