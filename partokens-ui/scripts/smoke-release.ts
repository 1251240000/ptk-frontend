const origin = (process.env.PARTOKENS_SMOKE_ORIGIN || 'http://127.0.0.1:8080').replace(/\/$/, '')
const requireProduction = process.env.PARTOKENS_SMOKE_REQUIRE_PRODUCTION === 'true'

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

await check('standalone web', async () => {
  const response = await request('/zh-CN/')
  const body = await response.text()
  assert(response.status === 200, `Expected 200, received ${response.status}`)
  assert(response.headers.get('content-type')?.includes('text/html'), 'Standalone web did not return HTML')
  assert(body.includes('id="root"'), 'Standalone web shell was not returned')
  assert(response.headers.get('content-security-policy'), 'Standalone web is missing Content-Security-Policy')
  assert(response.headers.get('x-content-type-options') === 'nosniff', 'Standalone web is missing nosniff')
  if (requireProduction) assert(response.headers.get('strict-transport-security'), 'Production response is missing HSTS')
  return `${response.status} HTML with security headers`
})

await check('web health', async () => {
  const response = await request('/_ui/healthz')
  assert(response.status === 204, `Expected 204, received ${response.status}`)
  return '204'
})

await check('docs health', async () => {
  const response = await request('/_docs/healthz')
  const body = await response.json() as { service?: string; status?: string }
  assert(response.status === 200 && body.service === 'partokens-docs' && body.status === 'ok', 'Docs health response is invalid')
  return '200 JSON'
})

await check('localized docs', async () => {
  const response = await request('/zh-CN/docs')
  const body = await response.text()
  assert(response.status === 200, `Expected 200, received ${response.status}`)
  assert(response.headers.get('content-type')?.includes('text/html'), 'Docs did not return HTML')
  assert(body.includes('Partokens'), 'Docs application marker is missing')
  return '200 HTML'
})

await check('backend status', async () => {
  const response = await request('/api/status')
  const body = await response.json() as { success?: boolean; data?: { version?: string } }
  assert(response.status === 200 && body.success && body.data?.version, 'Backend status response is invalid')
  assert(response.headers.get('content-type')?.includes('application/json'), 'Backend status did not remain JSON')
  return `200 JSON ${body.data.version}`
})

await check('backend 404 ownership', async () => {
  const response = await request('/api/partokens-phase4-not-found')
  const body = await response.text()
  assert(response.status === 404, `Expected 404, received ${response.status}`)
  assert(response.headers.get('content-type')?.includes('application/json'), 'Backend 404 was captured by an HTML application')
  assert(!body.includes('id="root"'), 'Backend 404 returned the standalone SPA')
  return '404 JSON'
})

await check('docs 404 ownership', async () => {
  const response = await request('/zh-CN/docs/partokens-phase4-not-found')
  assert(response.status === 404, `Expected 404, received ${response.status}`)
  assert(response.headers.get('content-type')?.includes('text/html'), 'Docs 404 did not remain HTML')
  return '404 HTML'
})

await check('native administrator ownership', async () => {
  const response = await request('/channels')
  assert(response.status === 200, `Expected 200, received ${response.status}`)
  assert(response.headers.get('content-type')?.includes('text/html'), 'Administrator route did not return HTML')
  assert(response.headers.get('x-new-api-version'), 'Administrator route was not served by New API')
  return `200 native ${response.headers.get('x-new-api-version')}`
})

const webShell = await (await request('/zh-CN/')).text()
const assetPath = webShell.match(/(?:src|href)="(\/_ui\/[^\"]+)"/)?.[1]
assert(assetPath, 'Unable to find a standalone web asset')
await check('web asset ownership', async () => {
  const response = await request(assetPath)
  assert(response.status === 200, `Expected 200, received ${response.status}`)
  const cache = response.headers.get('cache-control') || ''
  if (requireProduction) assert(cache.includes('immutable'), 'Production web asset is not immutable')
  else assert(cache.includes('no-store'), 'Development web asset is not marked no-store')
  return `${response.status} ${cache}`
})

for (const result of results) console.log(`PASS ${result.name}: ${result.detail}`)
console.log(`Release smoke passed: ${results.length} checks against ${origin}`)
