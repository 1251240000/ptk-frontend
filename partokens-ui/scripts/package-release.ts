import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const releaseRoot = resolve(projectRoot, 'release')
const stageRoot = resolve(projectRoot, 'release.tmp')

function requirePath(path: string) {
  if (!existsSync(path)) throw new Error(`Required build artifact is missing: ${path}`)
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
requirePath(join(docsStandalone, 'apps/docs/server.js'))
requirePath(docsStatic)

resetGeneratedDirectory(stageRoot, 'release.tmp')
mkdirSync(stageRoot, { recursive: true })
mkdirSync(join(stageRoot, 'web'), { recursive: true })
cpSync(join(webBuild, 'index.html'), join(stageRoot, 'web/index.html'))
cpSync(join(webBuild, '_ui'), join(stageRoot, 'web/_ui'), { recursive: true })
cpSync(docsStandalone, join(stageRoot, 'docs'), { recursive: true })
cpSync(docsStatic, join(stageRoot, 'docs/apps/docs/.next/static'), { recursive: true })
if (existsSync(docsPublic)) cpSync(docsPublic, join(stageRoot, 'docs/apps/docs/public'), { recursive: true })
cpSync(join(projectRoot, 'deploy'), join(stageRoot, 'deploy'), { recursive: true })

const compatibility = JSON.parse(readFileSync(join(projectRoot, 'compatibility.json'), 'utf8')) as {
  newApi: { commit: string; productionVersion: string }
  docs: { commit: string }
}
const manifest = {
  schemaVersion: 1,
  packagedAt: new Date().toISOString(),
  sourceCodeUrl: process.env.PUBLIC_PARTOKENS_SOURCE_URL?.trim() || null,
  newApiCommit: compatibility.newApi.commit,
  newApiVersion: compatibility.newApi.productionVersion,
  docsCommit: compatibility.docs.commit,
  entrypoints: {
    web: 'web/index.html',
    docs: 'docs/apps/docs/server.js',
    caddy: 'deploy/Caddyfile',
  },
}
writeFileSync(join(stageRoot, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

resetGeneratedDirectory(releaseRoot, 'release')
renameSync(stageRoot, releaseRoot)
console.log(`Packaged release at ${releaseRoot}`)
