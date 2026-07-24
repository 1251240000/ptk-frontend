import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const mode = process.argv[2]

function fail(message: string): never {
  throw new Error(message)
}

function sourceUrl() {
  const value = process.env.PUBLIC_PARTOKENS_SOURCE_URL?.trim()
  if (!value) fail('PUBLIC_PARTOKENS_SOURCE_URL is required for a public release')
  let parsed: URL
  try { parsed = new URL(value) } catch { fail('PUBLIC_PARTOKENS_SOURCE_URL must be an absolute URL') }
  if (parsed.protocol !== 'https:') fail('PUBLIC_PARTOKENS_SOURCE_URL must use HTTPS')
  if (parsed.hostname === 'example.com' || parsed.hostname.endsWith('.invalid')) fail('PUBLIC_PARTOKENS_SOURCE_URL must not be a placeholder')
  return parsed.toString()
}

function walkFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    return statSync(path).isDirectory() ? walkFiles(path) : [path]
  })
}

function checkEnvironment() {
  const url = sourceUrl()
  console.log(`Release source URL: ${url}`)
}

function checkPackage() {
  const root = resolve(projectRoot, 'release')
  const required = [
    'web/index.html',
    'docs/apps/docs/server.js',
    'docs/apps/docs/.next/static',
    'deploy/Caddyfile',
    'deploy/README.md',
    'release-manifest.json',
  ]
  for (const relative of required) {
    if (!existsSync(join(root, relative))) fail(`Packaged release is missing ${relative}`)
  }

  const manifest = JSON.parse(readFileSync(join(root, 'release-manifest.json'), 'utf8')) as { sourceCodeUrl?: string | null }
  const expectedSourceUrl = sourceUrl()
  if (manifest.sourceCodeUrl !== expectedSourceUrl) fail('Packaged source URL does not match the release environment')

  const bundleContainsSource = walkFiles(join(root, 'web/_ui/js'))
    .filter((path) => path.endsWith('.js'))
    .some((path) => readFileSync(path, 'utf8').includes(expectedSourceUrl))
  if (!bundleContainsSource) fail('Web bundle does not contain the configured corresponding-source URL; rebuild with PUBLIC_PARTOKENS_SOURCE_URL set')

  const caddy = readFileSync(join(root, 'deploy/Caddyfile'), 'utf8')
  for (const requiredRoute of ['@backend', '@officialAdmin', '@localizedDocs', '@localizedUI', '@technicalUI']) {
    if (!caddy.includes(requiredRoute)) fail(`Caddy release configuration is missing ${requiredRoute}`)
  }
  console.log(`Release package verified at ${root}`)
}

if (mode === 'environment') checkEnvironment()
else if (mode === 'package') checkPackage()
else fail('Usage: bun scripts/release-check.ts <environment|package>')
