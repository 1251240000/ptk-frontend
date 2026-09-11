import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

export const consoleLocales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ru', 'fr', 'vi'] as const
export const canonicalConsoleRoutes = ['overview', 'analytics', 'keys', 'usage-logs'] as const
export const consoleChunkNames: Record<(typeof canonicalConsoleRoutes)[number], string> = {
  overview: 'console-overview',
  analytics: 'console-analytics',
  keys: 'console-api-keys',
  'usage-logs': 'console-usage-logs',
}

export type ReleaseChannel = 'staging' | 'production'

export type ReleaseManifest = {
  schemaVersion: 2
  releaseCandidate: string
  releaseChannel: ReleaseChannel
  packagedAt: string
  sourceCodeUrl: string | null
  sourceCommit: string
  sourceTreeState: 'clean' | 'dirty'
  applicationVersion: string
  contract: {
    name: 'canonical-console-r59'
    locales: readonly string[]
    routes: readonly string[]
    bundleBudgetsSha256: string
  }
  build: {
    bunVersion: string
    nodeVersion: string
    publicSourceMaps: 'disabled'
    webArtifactSha256: string
    webIndexSha256: string
    consoleChunks: Record<string, { path: string; bytes: number; sha256: string }>
    docsChunks: Record<string, { path: string; bytes: number; sha256: string }>
  }
  compatibility: {
    newApiCommit: string
    newApiVersion: string
    docsCommit: string
  }
  entrypoints: {
    web: string
    caddy: string
    publicReleaseMetadata: string
  }
}

export type StagingEnvironment = {
  releaseCandidate: string
  stagingOrigin: URL
  siteAddress: string
  apiOrigin: URL
  adminApiOrigin: URL
  deployHost: string
  releaseRoot: string
  uiRoot: string
  sourceCodeUrl: URL
}

function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim()
  if (!value) throw new Error(`${name} is required for a staging release`)
  return value
}

function absoluteUrl(name: string, value: string) {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL`)
  }
  if (parsed.username || parsed.password) throw new Error(`${name} must not contain credentials`)
  return parsed
}

export function isProductionHostname(hostname: string, productionOrigin = 'https://partokens.com') {
  const productionHost = absoluteUrl('PARTOKENS_PRODUCTION_ORIGIN', productionOrigin).hostname.toLowerCase()
  const candidate = hostname.toLowerCase()
  return candidate === productionHost || candidate === `www.${productionHost}`
}

export function validateStagingEnvironment(env: NodeJS.ProcessEnv, sourceCommit: string): StagingEnvironment {
  const releaseChannel = required(env, 'PARTOKENS_RELEASE_CHANNEL')
  if (releaseChannel !== 'staging') throw new Error('PARTOKENS_RELEASE_CHANNEL must be staging')

  const releaseCandidate = required(env, 'PARTOKENS_RELEASE_CANDIDATE')
  if (!/^r60-[a-z0-9][a-z0-9.-]*$/i.test(releaseCandidate)) {
    throw new Error('PARTOKENS_RELEASE_CANDIDATE must use the r60-<identifier> format')
  }

  const productionOrigin = env.PARTOKENS_PRODUCTION_ORIGIN?.trim() || 'https://partokens.com'
  const stagingOrigin = absoluteUrl('PARTOKENS_STAGING_ORIGIN', required(env, 'PARTOKENS_STAGING_ORIGIN'))
  if (stagingOrigin.protocol !== 'https:') throw new Error('PARTOKENS_STAGING_ORIGIN must use HTTPS')
  if (stagingOrigin.pathname !== '/' || stagingOrigin.search || stagingOrigin.hash) {
    throw new Error('PARTOKENS_STAGING_ORIGIN must not contain a path, query, or fragment')
  }
  if (isProductionHostname(stagingOrigin.hostname, productionOrigin)) {
    throw new Error('PARTOKENS_STAGING_ORIGIN must not target production')
  }

  const siteAddress = required(env, 'PARTOKENS_SITE_ADDRESS')
  const normalizedSite = absoluteUrl('PARTOKENS_SITE_ADDRESS', siteAddress.includes('://') ? siteAddress : `https://${siteAddress}`)
  if (normalizedSite.hostname !== stagingOrigin.hostname) {
    throw new Error('PARTOKENS_SITE_ADDRESS must match PARTOKENS_STAGING_ORIGIN')
  }

  const apiOrigin = absoluteUrl('PARTOKENS_API_ORIGIN', required(env, 'PARTOKENS_API_ORIGIN'))
  if (!['http:', 'https:'].includes(apiOrigin.protocol)) throw new Error('PARTOKENS_API_ORIGIN must use HTTP or HTTPS')
  if (isProductionHostname(apiOrigin.hostname, productionOrigin)) {
    throw new Error('PARTOKENS_API_ORIGIN must not target the production API')
  }
  if (required(env, 'PARTOKENS_API_ENVIRONMENT') !== 'staging') {
    throw new Error('PARTOKENS_API_ENVIRONMENT must be staging')
  }

  const adminApiOrigin = absoluteUrl('PARTOKENS_ADMIN_API_ORIGIN', required(env, 'PARTOKENS_ADMIN_API_ORIGIN'))
  if (!['http:', 'https:'].includes(adminApiOrigin.protocol)) throw new Error('PARTOKENS_ADMIN_API_ORIGIN must use HTTP or HTTPS')
  if (isProductionHostname(adminApiOrigin.hostname, productionOrigin)) {
    throw new Error('PARTOKENS_ADMIN_API_ORIGIN must not target production')
  }

  const deployHost = required(env, 'PARTOKENS_DEPLOY_HOST')
  if (isProductionHostname(deployHost, productionOrigin)) throw new Error('PARTOKENS_DEPLOY_HOST must not target production')
  if (required(env, 'PARTOKENS_DEPLOY_ENVIRONMENT') !== 'staging') {
    throw new Error('PARTOKENS_DEPLOY_ENVIRONMENT must be staging')
  }
  const productionDeployHost = env.PARTOKENS_PRODUCTION_DEPLOY_HOST?.trim()
  if (productionDeployHost && deployHost === productionDeployHost) {
    throw new Error('PARTOKENS_DEPLOY_HOST must differ from PARTOKENS_PRODUCTION_DEPLOY_HOST')
  }

  const releaseRoot = required(env, 'PARTOKENS_RELEASE_ROOT')
  if (!releaseRoot.startsWith('/') || !releaseRoot.endsWith(`/releases/${releaseCandidate}`)) {
    throw new Error('PARTOKENS_RELEASE_ROOT must be an absolute versioned directory ending in /releases/<release-candidate>')
  }

  const uiRoot = required(env, 'PARTOKENS_UI_ROOT')
  if (!uiRoot.startsWith('/') || !uiRoot.endsWith('/current/web')) {
    throw new Error('PARTOKENS_UI_ROOT must point at the rollback-safe current/web symlink')
  }

  const sourceCodeUrl = absoluteUrl('PUBLIC_PARTOKENS_SOURCE_URL', required(env, 'PUBLIC_PARTOKENS_SOURCE_URL'))
  if (sourceCodeUrl.protocol !== 'https:') throw new Error('PUBLIC_PARTOKENS_SOURCE_URL must use HTTPS')
  if (!sourceCodeUrl.toString().includes(sourceCommit)) {
    throw new Error('PUBLIC_PARTOKENS_SOURCE_URL must be pinned to the full current Git commit')
  }

  const robots = required(env, 'PARTOKENS_ROBOTS_HEADER').toLowerCase()
  if (!robots.includes('noindex') || !robots.includes('nofollow')) {
    throw new Error('PARTOKENS_ROBOTS_HEADER must disable indexing and following in staging')
  }

  return {
    releaseCandidate,
    stagingOrigin,
    siteAddress,
    apiOrigin,
    adminApiOrigin,
    deployHost,
    releaseRoot,
    uiRoot,
    sourceCodeUrl,
  }
}

export function readGitMetadata(projectRoot: string, env: NodeJS.ProcessEnv = process.env) {
  const metadataMode = env.PARTOKENS_BUILD_METADATA_MODE?.trim()
  if (metadataMode && metadataMode !== 'external') {
    throw new Error('PARTOKENS_BUILD_METADATA_MODE must be external when set')
  }
  if (metadataMode === 'external') {
    const suppliedCommit = env.PARTOKENS_SOURCE_COMMIT?.trim()
    if (!suppliedCommit) throw new Error('PARTOKENS_SOURCE_COMMIT is required for external build metadata')
    if (!/^[0-9a-f]{40}$/.test(suppliedCommit)) {
      throw new Error('PARTOKENS_SOURCE_COMMIT must be a full lowercase Git commit')
    }
    const suppliedState = env.PARTOKENS_SOURCE_TREE_STATE?.trim()
    if (suppliedState !== 'clean' && suppliedState !== 'dirty') {
      throw new Error('PARTOKENS_SOURCE_TREE_STATE must be clean or dirty')
    }
    return {
      sourceCommit: suppliedCommit,
      sourceTreeState: suppliedState,
      status: suppliedState === 'dirty' ? 'Source state supplied by the build environment' : '',
    } as const
  }

  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim()
  const status = execFileSync('git', [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
    '--',
    '.',
    ':(exclude)release/**',
    ':(exclude)release.tmp/**',
    ':(exclude)dogfood-output/**',
  ], { cwd: projectRoot, encoding: 'utf8' }).trim()
  return { sourceCommit, sourceTreeState: status ? 'dirty' as const : 'clean' as const, status }
}

export function sha256(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
