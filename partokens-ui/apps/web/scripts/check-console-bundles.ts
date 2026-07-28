import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

type Limit = { maxBytes: number; maxGzipBytes: number }
type Budgets = {
  entry: Limit & { maxInitialBytes: number; maxInitialGzipBytes: number }
  routes: Record<string, Limit>
}
type Manifest = {
  entries?: { index?: { initial?: { js?: string[] }; async?: { js?: string[] } } }
}

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = join(appRoot, 'dist')
const budgets = JSON.parse(readFileSync(join(appRoot, 'bundle-budgets.json'), 'utf8')) as Budgets
const manifest = JSON.parse(readFileSync(join(distRoot, 'manifest.json'), 'utf8')) as Manifest
const initial = manifest.entries?.index?.initial?.js ?? []
const asyncAssets = manifest.entries?.index?.async?.js ?? []

function assetPath(asset: string) {
  return join(distRoot, asset.replace(/^\//, ''))
}

function size(asset: string) {
  const path = assetPath(asset)
  return { bytes: statSync(path).size, gzipBytes: gzipSync(readFileSync(path)).byteLength }
}

function assertWithin(label: string, actual: ReturnType<typeof size>, limit: Limit) {
  if (actual.bytes > limit.maxBytes || actual.gzipBytes > limit.maxGzipBytes) {
    throw new Error(`${label} exceeds its bundle budget: ${actual.bytes}/${limit.maxBytes} bytes, ${actual.gzipBytes}/${limit.maxGzipBytes} gzip bytes`)
  }
}

const entryAsset = initial.find((asset) => /\/_ui\/js\/index\.[^.]+\.js$/.test(asset))
if (!entryAsset) throw new Error('The Web entry asset is missing from the build manifest')
assertWithin('entry', size(entryAsset), budgets.entry)

const initialSize = initial.reduce((total, asset) => {
  const current = size(asset)
  return { bytes: total.bytes + current.bytes, gzipBytes: total.gzipBytes + current.gzipBytes }
}, { bytes: 0, gzipBytes: 0 })
assertWithin('initial JavaScript', initialSize, {
  maxBytes: budgets.entry.maxInitialBytes,
  maxGzipBytes: budgets.entry.maxInitialGzipBytes,
})

const rows = [`entry ${size(entryAsset).bytes} bytes`, `initial ${initialSize.bytes} bytes`]
for (const [route, limit] of Object.entries(budgets.routes)) {
  const matches = asyncAssets.filter((asset) => asset.includes(`/async/${route}.`))
  if (matches.length !== 1) throw new Error(`${route} must emit exactly one independent async chunk; found ${matches.length}`)
  if (initial.includes(matches[0]!)) throw new Error(`${route} was included in the initial bundle`)
  const actual = size(matches[0]!)
  assertWithin(route, actual, limit)
  rows.push(`${route} ${actual.bytes} bytes`)
}

console.log(`Console bundle budgets passed\n${rows.join('\n')}`)
