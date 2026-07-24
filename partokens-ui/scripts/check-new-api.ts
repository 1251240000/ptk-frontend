import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type RequiredEndpoint = { path: string; methods: string[] }
type Compatibility = {
  newApi: { commit: string; productionVersion: string }
  requiredEndpoints: RequiredEndpoint[]
}

type Route = { method: string; path: string; source: string }

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const upstreamRoot = resolve(process.env.PARTOKENS_NEW_API_ROOT || join(projectRoot, '..', 'new-api'))
const compatibility = JSON.parse(readFileSync(join(projectRoot, 'compatibility.json'), 'utf8')) as Compatibility
const candidateMode = process.argv.includes('--candidate')

function fail(message: string): never {
  throw new Error(message)
}

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: upstreamRoot, encoding: 'utf8' }).trim()
}

function normalizePath(path: string) {
  const withoutQuery = (path.split('?')[0] || '/').replace(/(?<!\/)\$\{[^}]+\}$/, '')
  const normalized = withoutQuery
    .replace(/\$\{[^}]+\}|\{[^}]+\}|:[A-Za-z0-9_]+|\*path/g, ':param')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '')
  return normalized || '/'
}

function joinPath(prefix: string, suffix: string) {
  return normalizePath(`${prefix.replace(/\/$/, '')}/${suffix.replace(/^\//, '')}`)
}

function parseGoRoutes(relativePath: string): Route[] {
  const source = readFileSync(join(upstreamRoot, relativePath), 'utf8')
  const groups = new Map<string, string>([['router', '']])
  const assignments = [...source.matchAll(/\b(\w+)\s*:=\s*(\w+)\.Group\(\s*"([^"]*)"\s*\)/g)]

  for (let pass = 0; pass <= assignments.length; pass += 1) {
    let changed = false
    for (const match of assignments) {
      const [, name, parent, segment] = match
      if (!name || !parent || segment == null || groups.has(name) || !groups.has(parent)) continue
      groups.set(name, joinPath(groups.get(parent) || '', segment))
      changed = true
    }
    if (!changed) break
  }

  const routes: Route[] = []
  for (const match of source.matchAll(/\b(\w+)\.(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\(\s*"([^"]*)"/g)) {
    const [, receiver, method, segment] = match
    const prefix = receiver ? groups.get(receiver) : undefined
    if (prefix == null || !method || segment == null) continue
    routes.push({ method, path: joinPath(prefix, segment), source: relativePath })
  }
  return routes
}

function directFrontendContracts() {
  const contracts = new Set<string>()
  const sourceFiles = [
    'packages/api-client/src/index.ts',
    'packages/studio/src/index.ts',
  ]

  for (const relativePath of sourceFiles) {
    const source = readFileSync(join(projectRoot, relativePath), 'utf8')
    for (const match of source.matchAll(/\bapi\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g)) {
      const method = match[1]?.toUpperCase()
      const path = match[3]
      if (method && path?.startsWith('/')) contracts.add(`${method} ${normalizePath(path)}`)
    }
    for (const match of source.matchAll(/\b(?:fetch|fetcher)\(\s*(['"`])([^'"`]+)\1/g)) {
      const path = match[2]
      if (!path?.startsWith('/')) continue
      const call = source.slice(match.index, match.index + 500)
      const method = /\bmethod:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/.exec(call)?.[1] || 'GET'
      contracts.add(`${method} ${normalizePath(path)}`)
    }
  }
  return contracts
}

if (!existsSync(join(upstreamRoot, 'go.mod')) || !existsSync(join(upstreamRoot, 'router'))) {
  fail(`New API checkout was not found at ${upstreamRoot}`)
}

const currentCommit = git('rev-parse', 'HEAD')
if (!candidateMode && currentCommit !== compatibility.newApi.commit) {
  fail(`compatibility.json pins ${compatibility.newApi.commit}, but the New API checkout is ${currentCommit}. Review upstream changes before updating the pin.`)
}

const upstreamStatus = git('status', '--short')
if (upstreamStatus) fail('The New API checkout contains uncommitted changes; compatibility must be checked against a clean source tree.')

const routerFiles = git('ls-files', 'router/*.go')
  .split('\n')
  .filter((path) => path.endsWith('.go') && !path.endsWith('_test.go'))
const routes = routerFiles.flatMap(parseGoRoutes)
const routeKeys = new Set(routes.map((route) => `${route.method} ${normalizePath(route.path)}`))
const requiredKeys = new Set<string>()
const missing: string[] = []

for (const endpoint of compatibility.requiredEndpoints) {
  if (!endpoint.path || !Array.isArray(endpoint.methods) || endpoint.methods.length === 0) {
    fail(`Invalid required endpoint entry: ${JSON.stringify(endpoint)}`)
  }
  for (const method of endpoint.methods) {
    const key = `${method.toUpperCase()} ${normalizePath(endpoint.path)}`
    requiredKeys.add(key)
    if (!routeKeys.has(key)) missing.push(key)
  }
}

if (missing.length > 0) {
  fail(`New API no longer exposes ${missing.length} required contract(s):\n${missing.map((item) => `- ${item}`).join('\n')}`)
}

const directContracts = directFrontendContracts()
const unregistered = [...directContracts].filter((contract) => !requiredKeys.has(contract)).sort()
if (unregistered.length > 0) {
  fail(`Frontend request literals are missing from compatibility.json:\n${unregistered.map((item) => `- ${item}`).join('\n')}`)
}

const contractCount = compatibility.requiredEndpoints.reduce((count, endpoint) => count + endpoint.methods.length, 0)
if (candidateMode && currentCommit !== compatibility.newApi.commit) {
  console.log(`Candidate New API commit ${currentCommit} preserves the contracts pinned at ${compatibility.newApi.commit}.`)
} else {
  console.log(`New API compatibility passed at ${currentCommit}`)
}
console.log(`${contractCount} required method/path contracts matched ${routes.length} registered upstream routes across ${routerFiles.length} router files; ${directContracts.size} direct frontend request literals are registered.`)
