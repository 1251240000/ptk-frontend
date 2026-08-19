import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  canonicalConsoleRoutes,
  consoleChunkNames,
  consoleLocales,
  readGitMetadata,
  sha256,
  type ReleaseChannel,
  type ReleaseManifest,
} from './release-contract'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const releaseRoot = resolve(projectRoot, 'release')
const stageRoot = resolve(projectRoot, 'release.tmp')

function requirePath(path: string) {
  if (!existsSync(path)) throw new Error(`Required build artifact is missing: ${path}`)
}

function walkFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    return statSync(path).isDirectory() ? walkFiles(path) : [path]
  })
}

function treeSha256(root: string) {
  const hash = createHash('sha256')
  for (const path of walkFiles(root).sort()) {
    hash.update(relative(root, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function resetGeneratedDirectory(path: string, expectedName: string) {
  if (dirname(path) !== projectRoot || path.split('/').at(-1) !== expectedName) {
    throw new Error(`Refusing to replace unexpected path: ${path}`)
  }
  rmSync(path, { recursive: true, force: true })
}

const webBuild = join(projectRoot, 'apps/web/dist')
const docsBuild = join(projectRoot, 'apps/docs/.next')
const docsStandalone = join(docsBuild, 'standalone')
const docsStatic = join(docsBuild, 'static')
const docsPublic = join(projectRoot, 'apps/docs/public')

requirePath(join(webBuild, 'index.html'))
requirePath(join(webBuild, 'public-content/manifest.json'))
requirePath(join(docsStandalone, 'apps/docs/server.js'))
requirePath(docsStatic)

resetGeneratedDirectory(stageRoot, 'release.tmp')
mkdirSync(stageRoot, { recursive: true })
mkdirSync(join(stageRoot, 'web'), { recursive: true })
cpSync(join(webBuild, 'index.html'), join(stageRoot, 'web/index.html'))
cpSync(join(webBuild, '_ui'), join(stageRoot, 'web/_ui'), { recursive: true })
cpSync(join(webBuild, 'public-content'), join(stageRoot, 'web/public-content'), { recursive: true })
cpSync(docsStandalone, join(stageRoot, 'docs'), { recursive: true })
cpSync(docsStatic, join(stageRoot, 'docs/apps/docs/.next/static'), { recursive: true })
if (existsSync(docsPublic)) cpSync(docsPublic, join(stageRoot, 'docs/apps/docs/public'), { recursive: true })
cpSync(join(projectRoot, 'deploy'), join(stageRoot, 'deploy'), { recursive: true })

const compatibility = JSON.parse(readFileSync(join(projectRoot, 'compatibility.json'), 'utf8')) as {
  newApi: { commit: string; productionVersion: string }
  docs: { commit: string }
}
const appPackage = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as { version: string }
const buildManifest = JSON.parse(readFileSync(join(webBuild, 'manifest.json'), 'utf8')) as {
  entries?: { index?: { async?: { js?: string[] } } }
}
const git = readGitMetadata(projectRoot)
const releaseChannel = (process.env.PARTOKENS_RELEASE_CHANNEL?.trim() || 'production') as ReleaseChannel
if (!['staging', 'production'].includes(releaseChannel)) throw new Error('PARTOKENS_RELEASE_CHANNEL must be staging or production')
const releaseCandidate = process.env.PARTOKENS_RELEASE_CANDIDATE?.trim() || `${releaseChannel}-${appPackage.version}-${git.sourceCommit.slice(0, 12)}`
if (releaseChannel === 'staging' && !/^r60-[a-z0-9][a-z0-9.-]*$/i.test(releaseCandidate)) {
  throw new Error('Staging packages require PARTOKENS_RELEASE_CANDIDATE in r60-<identifier> format')
}

const publicMaps = walkFiles(join(stageRoot, 'web')).filter((path) => path.endsWith('.map'))
if (publicMaps.length) throw new Error(`Public Web source maps are forbidden: ${publicMaps.join(', ')}`)

const asyncAssets = buildManifest.entries?.index?.async?.js ?? []
const consoleChunks = Object.fromEntries(canonicalConsoleRoutes.map((route) => {
  const matches = asyncAssets.filter((asset) => asset.includes(`/async/${consoleChunkNames[route]}.`))
  if (matches.length !== 1) throw new Error(`Unable to identify the ${route} release chunk`)
  const asset = matches[0]!
  const path = join(stageRoot, 'web', asset.replace(/^\//, ''))
  requirePath(path)
  return [route, { path: asset, bytes: statSync(path).size, sha256: sha256(path) }]
}))

const manifest: ReleaseManifest = {
  schemaVersion: 2,
  releaseCandidate,
  releaseChannel,
  packagedAt: new Date().toISOString(),
  sourceCodeUrl: process.env.PUBLIC_PARTOKENS_SOURCE_URL?.trim() || null,
  sourceCommit: git.sourceCommit,
  sourceTreeState: git.sourceTreeState,
  applicationVersion: appPackage.version,
  contract: {
    name: 'canonical-console-r59',
    locales: consoleLocales,
    routes: canonicalConsoleRoutes,
    bundleBudgetsSha256: sha256(join(projectRoot, 'apps/web/bundle-budgets.json')),
  },
  build: {
    bunVersion: Bun.version,
    nodeVersion: process.version,
    publicSourceMaps: 'disabled',
    webArtifactSha256: treeSha256(join(stageRoot, 'web')),
    webIndexSha256: sha256(join(stageRoot, 'web/index.html')),
    consoleChunks,
  },
  compatibility: {
    newApiCommit: compatibility.newApi.commit,
    newApiVersion: compatibility.newApi.productionVersion,
    docsCommit: compatibility.docs.commit,
  },
  entrypoints: {
    web: 'web/index.html',
    docs: 'docs/apps/docs/server.js',
    caddy: 'deploy/Caddyfile',
    publicReleaseMetadata: 'web/_ui/release.json',
  },
}
const serializedManifest = `${JSON.stringify(manifest, null, 2)}\n`
writeFileSync(join(stageRoot, 'release-manifest.json'), serializedManifest)
writeFileSync(join(stageRoot, manifest.entrypoints.publicReleaseMetadata), serializedManifest)

resetGeneratedDirectory(releaseRoot, 'release')
renameSync(stageRoot, releaseRoot)
console.log(`Packaged release at ${releaseRoot}`)
