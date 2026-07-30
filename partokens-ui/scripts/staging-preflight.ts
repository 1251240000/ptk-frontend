import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lookup } from 'node:dns/promises'

import { readGitMetadata, validateStagingEnvironment } from './release-contract'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const git = readGitMetadata(projectRoot)
const staging = validateStagingEnvironment(process.env, git.sourceCommit)

if (git.sourceTreeState !== 'clean') {
  throw new Error(`Staging releases require a clean source tree:\n${git.status}`)
}

let stagingAddresses: { address: string; family: number }[]
try {
  stagingAddresses = await lookup(staging.stagingOrigin.hostname, { all: true })
} catch {
  throw new Error(`PARTOKENS_STAGING_ORIGIN hostname does not resolve: ${staging.stagingOrigin.hostname}`)
}
if (!stagingAddresses.length) throw new Error(`PARTOKENS_STAGING_ORIGIN hostname does not resolve: ${staging.stagingOrigin.hostname}`)

const sourceResponse = await fetch(staging.sourceCodeUrl, { method: 'HEAD', redirect: 'follow' })
if (!sourceResponse.ok) {
  throw new Error(`PUBLIC_PARTOKENS_SOURCE_URL is not reachable: HTTP ${sourceResponse.status}`)
}

console.log(`Staging release candidate: ${staging.releaseCandidate}`)
console.log(`Source commit: ${git.sourceCommit}`)
console.log(`Staging origin: ${staging.stagingOrigin.origin}`)
console.log(`Staging addresses: ${stagingAddresses.map(({ address }) => address).join(', ')}`)
console.log(`Staging API origin: ${staging.apiOrigin.origin}`)
console.log(`Deploy host: ${staging.deployHost}`)
console.log(`Versioned release root: ${staging.releaseRoot}`)
console.log('Staging preflight passed')
