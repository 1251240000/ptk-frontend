import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type SyncManifest = {
  schemaVersion: 1
  upstreamCommit: string
  trackedRoots: string[]
  curatedInputs: Record<string, string[]>
  files: Record<string, string>
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..', '..', '..')
const workspaceRoot = resolve(projectRoot, '..')
const upstreamRoot = join(workspaceRoot, 'new-api-docs-v1')
const manifestPath = join(projectRoot, 'docs-sync-manifest.json')
const reportPath = join(projectRoot, 'dogfood-output', 'phase3-upstream-report.json')
const compatibilityPath = join(projectRoot, 'compatibility.json')
const writeMode = process.argv.includes('--write')

const trackedRoots = [
  'content/docs/zh/api/ai-model',
  'content/docs/zh/guide/feature-guide/user',
  'content/docs/zh/guide/console',
]

const curatedInputs: Record<string, string[]> = {
  overview: ['content/docs/zh/guide/feature-guide/user/api.mdx'],
  authentication: ['content/docs/zh/guide/feature-guide/user/auth.mdx', 'content/docs/zh/guide/feature-guide/user/token.mdx'],
  'first-request': ['content/docs/zh/guide/feature-guide/user/api.mdx', 'content/docs/zh/guide/feature-guide/user/token.mdx'],
  'models-and-groups': ['content/docs/zh/guide/feature-guide/user/pricing.mdx'],
  'chat-guide': ['content/docs/zh/guide/console/chat.mdx', 'content/docs/zh/guide/console/playground.mdx'],
  'image-guide': ['content/docs/zh/api/ai-model/images/openai/post-v1-images-generations.mdx', 'content/docs/zh/api/ai-model/images/openai/post-v1-images-edits.mdx'],
  'errors-and-limits': ['content/docs/zh/guide/feature-guide/user/log.mdx'],
  'api-chat-completions': ['content/docs/zh/api/ai-model/chat/openai/createchatcompletion.mdx'],
  'api-responses': ['content/docs/zh/api/ai-model/chat/openai/createresponse.mdx'],
  'api-embeddings': ['content/docs/zh/api/ai-model/embeddings/createembedding.mdx'],
  'api-image-generations': ['content/docs/zh/api/ai-model/images/openai/post-v1-images-generations.mdx'],
  'api-image-edits': ['content/docs/zh/api/ai-model/images/openai/post-v1-images-edits.mdx'],
  'api-audio-transcriptions': ['content/docs/zh/api/ai-model/audio/openai/createtranscription.mdx'],
  'api-models': ['content/docs/zh/api/ai-model/models/list/listmodels.mdx'],
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return walk(path)
    return entry.isFile() && (entry.name.endsWith('.mdx') || entry.name === 'meta.json') ? [path] : []
  }))
  return files.flat()
}

async function snapshot(): Promise<Record<string, string>> {
  const paths = (await Promise.all(trackedRoots.map((root) => walk(join(upstreamRoot, root))))).flat().sort()
  const entries = await Promise.all(paths.map(async (path) => {
    const contents = await readFile(path)
    return [relative(upstreamRoot, path), createHash('sha256').update(contents).digest('hex')] as const
  }))
  return Object.fromEntries(entries)
}

function git(...args: string[]): string {
  return execFileSync('git', ['-C', upstreamRoot, ...args], { encoding: 'utf8' }).trim()
}

function diffFiles(previous: Record<string, string>, current: Record<string, string>) {
  const added = Object.keys(current).filter((path) => !(path in previous))
  const removed = Object.keys(previous).filter((path) => !(path in current))
  const changed = Object.keys(current).filter((path) => path in previous && current[path] !== previous[path])
  return { added, changed, removed }
}

const upstreamStatus = git('status', '--short')
if (upstreamStatus) throw new Error('new-api-docs-v1 must remain clean before documentation synchronization.')

const upstreamCommit = git('rev-parse', 'HEAD')
const currentFiles = await snapshot()
const compatibility = JSON.parse(await readFile(compatibilityPath, 'utf8')) as { docs: { commit: string } }

if (writeMode) {
  if (compatibility.docs.commit !== upstreamCommit) {
    throw new Error(`compatibility.json pins ${compatibility.docs.commit}, but the docs checkout is ${upstreamCommit}. Review compatibility before updating the snapshot.`)
  }
  const manifest: SyncManifest = { schemaVersion: 1, upstreamCommit, trackedRoots, curatedInputs, files: currentFiles }
  const report = {
    generatedAt: new Date().toISOString(),
    status: 'baseline-updated',
    upstreamCommit,
    trackedFileCount: Object.keys(currentFiles).length,
    curatedPageCount: Object.keys(curatedInputs).length,
    diff: { added: [], changed: [], removed: [] },
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Recorded ${report.trackedFileCount} upstream files at ${upstreamCommit}.`)
  process.exit(0)
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as SyncManifest
const diff = diffFiles(manifest.files, currentFiles)
const commitChanged = manifest.upstreamCommit !== upstreamCommit
const compatibilityChanged = compatibility.docs.commit !== upstreamCommit
const clean = !commitChanged && !compatibilityChanged && !diff.added.length && !diff.changed.length && !diff.removed.length
const report = {
  status: clean ? 'clean' : 'review-required',
  manifestCommit: manifest.upstreamCommit,
  upstreamCommit,
  compatibilityCommit: compatibility.docs.commit,
  trackedFileCount: Object.keys(currentFiles).length,
  curatedPageCount: Object.keys(manifest.curatedInputs).length,
  diff,
}

console.log(JSON.stringify(report, null, 2))
if (!clean) process.exit(1)
