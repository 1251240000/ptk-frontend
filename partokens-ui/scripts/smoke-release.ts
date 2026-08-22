import { canonicalConsoleRoutes, consoleLocales, isProductionHostname, type ReleaseManifest } from './release-contract'

const origin = (process.env.PARTOKENS_SMOKE_ORIGIN || 'http://127.0.0.1:8080').replace(/\/$/, '')
const environment = process.env.PARTOKENS_SMOKE_ENVIRONMENT?.trim() || 'development'
const requireProduction = process.env.PARTOKENS_SMOKE_REQUIRE_PRODUCTION === 'true'
const expectedCandidate = process.env.PARTOKENS_SMOKE_RELEASE_CANDIDATE?.trim()
const requireDeployedRelease = environment === 'staging' || environment === 'production' || Boolean(expectedCandidate)
const requireSecureHeaders = requireProduction || environment === 'staging' || environment === 'production'
const allowDirtyLocal = process.env.PARTOKENS_SMOKE_ALLOW_DIRTY_LOCAL === 'true'

if (!['development', 'staging', 'production'].includes(environment)) {
  throw new Error('PARTOKENS_SMOKE_ENVIRONMENT must be development, staging, or production')
}

const parsedOrigin = new URL(origin)
if (allowDirtyLocal && !['localhost', '127.0.0.1', '::1'].includes(parsedOrigin.hostname)) {
  throw new Error('PARTOKENS_SMOKE_ALLOW_DIRTY_LOCAL is restricted to loopback origins')
}
if (environment === 'staging') {
  if (parsedOrigin.protocol !== 'https:') throw new Error('Staging smoke requires an HTTPS origin')
  if (isProductionHostname(parsedOrigin.hostname, process.env.PARTOKENS_PRODUCTION_ORIGIN)) {
    throw new Error('Staging smoke refuses to target the production origin')
  }
  if (!expectedCandidate) throw new Error('Staging smoke requires PARTOKENS_SMOKE_RELEASE_CANDIDATE')
}

type Result = { name: string; detail: string }
const results: Result[] = []

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function request(path: string) {
  return fetch(`${origin}${path}`, { redirect: 'manual', headers: { Accept: '*/*' } })
}

async function check(name: string, run: () => Promise<string>) {
  const detail = await run()
  results.push({ name, detail })
}

function assertBaseSecurityHeaders(response: Response) {
  assert(response.headers.get('x-content-type-options') === 'nosniff', 'Response is missing nosniff')
  assert(response.headers.get('x-frame-options') === 'DENY', 'Response is missing frame denial')
  assert(response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Response has an unexpected referrer policy')
  assert(response.headers.get('cross-origin-opener-policy') === 'same-origin', 'Response is missing same-origin opener isolation')
  assert(response.headers.get('cross-origin-resource-policy') === 'same-origin', 'Response is missing same-origin resource isolation')
  if (requireSecureHeaders) assert(response.headers.get('strict-transport-security'), 'Secure response is missing HSTS')
  if (environment === 'staging') {
    const robots = response.headers.get('x-robots-tag')?.toLowerCase() || ''
    assert(robots.includes('noindex') && robots.includes('nofollow'), 'Staging response is indexable')
  }
}

let deployedManifest: ReleaseManifest | null = null
if (requireDeployedRelease) {
  await check('release identity', async () => {
    const response = await request('/_ui/release.json')
    assert(response.status === 200, `Expected release metadata 200, received ${response.status}`)
    assert(response.headers.get('content-type')?.includes('application/json'), 'Release metadata did not return JSON')
    assert((response.headers.get('cache-control') || '').includes('no-store'), 'Release metadata is cacheable')
    deployedManifest = await response.json() as ReleaseManifest
    assert(deployedManifest.schemaVersion === 2, 'Release metadata has the wrong schema')
    assert(deployedManifest.releaseChannel === environment, 'Release metadata channel does not match the smoke environment')
    if (expectedCandidate) assert(deployedManifest.releaseCandidate === expectedCandidate, 'Deployed release candidate does not match the expected candidate')
    if (!allowDirtyLocal) assert(deployedManifest.sourceTreeState === 'clean', 'Deployed release candidate was built from a dirty source tree')
    assert(deployedManifest.build.publicSourceMaps === 'disabled', 'Deployed release enables public source maps')
    return `${deployedManifest.releaseCandidate} ${deployedManifest.sourceCommit.slice(0, 12)}`
  })
}

await check('canonical Console deep links', async () => {
  let checked = 0
  for (const locale of consoleLocales) {
    for (const route of canonicalConsoleRoutes) {
      const response = await request(`/${locale}/console/${route}?r60=staging-smoke`)
      const body = await response.text()
      assert(response.status === 200, `Expected /${locale}/console/${route} 200, received ${response.status}`)
      assert(response.headers.get('content-type')?.includes('text/html'), `/${locale}/console/${route} did not return HTML`)
      assert(body.includes('id="root"'), `/${locale}/console/${route} did not return the Web shell`)
      assert(response.headers.get('content-security-policy'), `/${locale}/console/${route} is missing Content-Security-Policy`)
      assert((response.headers.get('cache-control') || '').includes('no-store'), `/${locale}/console/${route} is cacheable`)
      assertBaseSecurityHeaders(response)
      checked += 1
    }
  }
  return `${checked} locale/route combinations returned the secured no-store shell`
})

await check('web health', async () => {
  const response = await request('/_ui/healthz')
  assert(response.status === 204, `Expected 204, received ${response.status}`)
  assert((response.headers.get('cache-control') || '').includes('no-store'), 'Web health response is cacheable')
  return '204 no-store'
})

await check('localized Web docs', async () => {
  for (const locale of consoleLocales) {
    const response = await request(`/${locale}/docs`)
    const body = await response.text()
    assert(response.status === 200, `Expected /${locale}/docs 200, received ${response.status}`)
    assert(response.headers.get('content-type')?.includes('text/html'), `/${locale}/docs did not return HTML`)
    assert(body.includes('id="root"'), `/${locale}/docs did not return the Web shell`)
    assert(response.headers.get('content-security-policy'), `/${locale}/docs is missing Content-Security-Policy`)
    assert((response.headers.get('cache-control') || '').includes('no-store'), `/${locale}/docs is cacheable`)
    assertBaseSecurityHeaders(response)
  }
  return `${consoleLocales.length} locales returned the secured no-store Web shell`
})

await check('legacy docs deep links', async () => {
  for (const path of ['/en/docs/guides/image-studio', '/zh-CN/docs/guides/usage-logs']) {
    const response = await request(path)
    const body = await response.text()
    assert(response.status === 200, `${path} did not return the compatibility Web shell`)
    assert(body.includes('id="root"'), `${path} did not return the Web shell`)
    assert((response.headers.get('cache-control') || '').includes('no-store'), `${path} is cacheable`)
    assertBaseSecurityHeaders(response)
  }
  return '2 legacy deep links returned the Web shell'
})

await check('unknown docs 404 ownership', async () => {
  const response = await request('/en/docs/not-a-real-document')
  const body = await response.text()
  assert(response.status === 404, `Expected unknown docs path to return 404, received ${response.status}`)
  assert(body.includes('id="root"'), 'Unknown docs path did not return the unified Web shell')
  assertBaseSecurityHeaders(response)
  return '404 unified Web shell'
})

const webShell = await (await request('/zh-CN/')).text()
const assetPath = webShell.match(/(?:src|href)="(\/_ui\/[^\"]+)"/)?.[1]
assert(assetPath, 'Unable to find a standalone Web asset')
await check('web asset ownership', async () => {
  const response = await request(assetPath)
  assert(response.status === 200, `Expected 200, received ${response.status}`)
  const cache = response.headers.get('cache-control') || ''
  if (requireSecureHeaders) assert(cache.includes('immutable'), 'Deployed Web asset is not immutable')
  else assert(cache.includes('no-store'), 'Development Web asset is not marked no-store')
  return `${response.status} ${cache}`
})

if (deployedManifest) {
  await check('lazy Console chunks', async () => {
    for (const route of canonicalConsoleRoutes) {
      const chunk = deployedManifest!.build.consoleChunks[route]
      assert(chunk, `Release metadata is missing the ${route} chunk`)
      const response = await request(chunk.path)
      const body = await response.text()
      assert(response.status === 200, `${route} chunk returned ${response.status}`)
      assert((response.headers.get('cache-control') || '').includes('immutable'), `${route} chunk is not immutable`)
      assert(!body.includes('sourceMappingURL='), `${route} chunk exposes a source map reference`)
      assert(new TextEncoder().encode(body).byteLength === chunk.bytes, `${route} chunk size does not match release metadata`)
    }
    return `${canonicalConsoleRoutes.length} independently versioned chunks are immutable and map-free`
  })
  await check('localized documentation chunks', async () => {
    for (const locale of consoleLocales) {
      const chunk = deployedManifest!.build.docsChunks[locale]
      assert(chunk, `Release metadata is missing the ${locale} documentation chunk`)
      const response = await request(chunk.path)
      const body = await response.text()
      assert(response.status === 200, `${locale} documentation chunk returned ${response.status}`)
      assert((response.headers.get('cache-control') || '').includes('immutable'), `${locale} documentation chunk is not immutable`)
      assert(!body.includes('sourceMappingURL='), `${locale} documentation chunk exposes a source map reference`)
      assert(new TextEncoder().encode(body).byteLength === chunk.bytes, `${locale} documentation chunk size does not match release metadata`)
    }
    return `${consoleLocales.length} localized documentation chunks are immutable and map-free`
  })
}

for (const result of results) console.log(`PASS ${result.name}: ${result.detail}`)
console.log(`Release smoke passed: ${results.length} checks against ${origin}`)
