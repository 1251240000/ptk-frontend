import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { canonicalConsoleRoutes, consoleLocales, localizedDocsPaths, readGitMetadata, sha256, type ReleaseManifest } from './release-contract'

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

function treeSha256(root: string, excluded: string[] = []) {
  const hash = createHash('sha256')
  for (const path of walkFiles(root).filter((path) => !excluded.includes(relative(root, path))).sort()) {
    hash.update(relative(root, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
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
    'web/_ui/release.json',
    'docs/apps/docs/.next/prerender-manifest.json',
  ]
  for (const relative of required) {
    if (!existsSync(join(root, relative))) fail(`Packaged release is missing ${relative}`)
  }

  const docsPrerenderManifest = JSON.parse(readFileSync(join(root, 'docs/apps/docs/.next/prerender-manifest.json'), 'utf8')) as {
    routes?: Record<string, unknown>
  }
  const missingDocsRoutes = localizedDocsPaths.filter((route) => !docsPrerenderManifest.routes?.[route])
  if (missingDocsRoutes.length) fail(`Packaged docs release is missing ${missingDocsRoutes.length} localized routes: ${missingDocsRoutes.join(', ')}`)

  const docsPackage = JSON.parse(readFileSync(join(root, 'docs/apps/docs/package.json'), 'utf8')) as {
    scripts?: { start?: string }
  }
  if (docsPackage.scripts?.start !== 'node server.js') fail('Packaged docs start script must launch the standalone server')

  const manifestPath = join(root, 'release-manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ReleaseManifest
  assertManifest(manifest)
  const expectedSourceUrl = sourceUrl()
  if (manifest.sourceCodeUrl !== expectedSourceUrl) fail('Packaged source URL does not match the release environment')
  if (!expectedSourceUrl.includes(manifest.sourceCommit)) fail('Packaged source URL is not pinned to the packaged Git commit')

  const git = readGitMetadata(projectRoot)
  if (manifest.sourceCommit !== git.sourceCommit) fail('Packaged Git commit does not match the current source commit')
  if (process.env.PARTOKENS_REQUIRE_CLEAN_SOURCE === 'true' && manifest.sourceTreeState !== 'clean') {
    fail('Packaged release was created from a dirty source tree')
  }

  const expectedChannel = process.env.PARTOKENS_RELEASE_CHANNEL?.trim() || 'production'
  if (manifest.releaseChannel !== expectedChannel) fail('Packaged release channel does not match PARTOKENS_RELEASE_CHANNEL')
  const expectedCandidate = process.env.PARTOKENS_RELEASE_CANDIDATE?.trim()
  if (expectedCandidate && manifest.releaseCandidate !== expectedCandidate) fail('Packaged release candidate does not match PARTOKENS_RELEASE_CANDIDATE')

  const publicManifestPath = join(root, manifest.entrypoints.publicReleaseMetadata)
  if (readFileSync(publicManifestPath, 'utf8') !== readFileSync(manifestPath, 'utf8')) {
    fail('Public release metadata does not match the packaged manifest')
  }

  const publicWebFiles = walkFiles(join(root, 'web'))
  const publicMaps = publicWebFiles.filter((path) => path.endsWith('.map'))
  if (publicMaps.length) fail(`Packaged Web release contains public source maps: ${publicMaps.join(', ')}`)
  const sourceMapReferences = publicWebFiles
    .filter((path) => /\.(?:js|css)$/.test(path))
    .filter((path) => readFileSync(path, 'utf8').includes('sourceMappingURL='))
  if (sourceMapReferences.length) fail(`Packaged Web assets reference source maps: ${sourceMapReferences.join(', ')}`)

  const webRoot = join(root, 'web')
  const publicContentRoot = join(webRoot, 'public-content')
  const publicContentManifestPath = join(publicContentRoot, 'manifest.json')
  if (!existsSync(publicContentManifestPath)) fail('Packaged Web release is missing public-content/manifest.json')
  const publicContentManifest = JSON.parse(readFileSync(publicContentManifestPath, 'utf8')) as {
    schemaVersion?: number
    files?: Record<string, string>
  }
  if (publicContentManifest.schemaVersion !== 1 || !publicContentManifest.files) {
    fail('Packaged public-content manifest is invalid')
  }
  for (const [kind, relativePath] of Object.entries(publicContentManifest.files)) {
    if (!/^(?:legal\/)?[a-z0-9-]+\.json$/.test(relativePath)) fail(`Packaged public-content path is invalid for ${kind}`)
    if (!existsSync(join(publicContentRoot, relativePath))) fail(`Packaged public-content file is missing: ${relativePath}`)
  }
  if (sha256(join(webRoot, 'index.html')) !== manifest.build.webIndexSha256) fail('Packaged Web index checksum does not match the manifest')
  if (treeSha256(webRoot, ['_ui/release.json']) !== manifest.build.webArtifactSha256) fail('Packaged Web artifact checksum does not match the manifest')
  for (const route of canonicalConsoleRoutes) {
    const chunk = manifest.build.consoleChunks[route]
    if (!chunk) fail(`Packaged manifest is missing the ${route} Console chunk`)
    const path = join(webRoot, chunk.path.replace(/^\//, ''))
    if (!existsSync(path) || statSync(path).size !== chunk.bytes || sha256(path) !== chunk.sha256) {
      fail(`Packaged ${route} Console chunk does not match its manifest`)
    }
  }

  const bundleContainsSource = walkFiles(join(root, 'web/_ui/js'))
    .filter((path) => path.endsWith('.js'))
    .some((path) => readFileSync(path, 'utf8').includes(expectedSourceUrl))
  if (!bundleContainsSource) fail('Web bundle does not contain the configured corresponding-source URL; rebuild with PUBLIC_PARTOKENS_SOURCE_URL set')

  const caddy = readFileSync(join(root, 'deploy/Caddyfile'), 'utf8')
  for (const requiredRoute of ['@backend', '@officialAdmin', '@uiRelease', '@localizedDocs', '@localizedUI', '@technicalUI']) {
    if (!caddy.includes(requiredRoute)) fail(`Caddy release configuration is missing ${requiredRoute}`)
  }
  console.log(`Release package verified at ${root}`)
}

function assertManifest(manifest: ReleaseManifest) {
  if (manifest.schemaVersion !== 2) fail('Packaged release manifest must use schema version 2')
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit)) fail('Packaged release manifest has an invalid Git commit')
  if (!manifest.releaseCandidate) fail('Packaged release manifest is missing a release candidate')
  if (!['staging', 'production'].includes(manifest.releaseChannel)) fail('Packaged release manifest has an invalid release channel')
  if (manifest.contract.name !== 'canonical-console-r59') fail('Packaged release does not declare the R59 Console contract')
  if (JSON.stringify(manifest.contract.locales) !== JSON.stringify(consoleLocales)) fail('Packaged release locale contract is incomplete')
  if (JSON.stringify(manifest.contract.routes) !== JSON.stringify(canonicalConsoleRoutes)) fail('Packaged release route contract is incomplete')
  if (manifest.build.publicSourceMaps !== 'disabled') fail('Packaged release must disable public source maps')
}

if (mode === 'environment') checkEnvironment()
else if (mode === 'package') checkPackage()
else fail('Usage: bun scripts/release-check.ts <environment|package>')
