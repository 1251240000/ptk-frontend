import { describe, expect, test } from 'bun:test'

import { isProductionHostname, validateStagingEnvironment } from './release-contract'

const commit = 'd0c84e70c7a6105e2c96a1b6336ad6f48774e043'

function stagingEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    PARTOKENS_RELEASE_CHANNEL: 'staging',
    PARTOKENS_RELEASE_CANDIDATE: 'r60-d0c84e7.1',
    PARTOKENS_STAGING_ORIGIN: 'https://staging.partokens.test',
    PARTOKENS_SITE_ADDRESS: 'staging.partokens.test',
    PARTOKENS_API_ORIGIN: 'http://127.0.0.1:3000',
    PARTOKENS_API_ENVIRONMENT: 'staging',
    PARTOKENS_DOCS_ORIGIN: 'http://127.0.0.1:3001',
    PARTOKENS_DEPLOY_HOST: 'partokens-staging',
    PARTOKENS_DEPLOY_ENVIRONMENT: 'staging',
    PARTOKENS_PRODUCTION_DEPLOY_HOST: 'partokens-production',
    PARTOKENS_RELEASE_ROOT: '/srv/partokens-ui/releases/r60-d0c84e7.1',
    PARTOKENS_UI_ROOT: '/srv/partokens-ui/current/web',
    PUBLIC_PARTOKENS_SOURCE_URL: `https://code.partokens.test/partokens-ui/tree/${commit}`,
    PARTOKENS_ROBOTS_HEADER: 'noindex, nofollow, noarchive',
    ...overrides,
  }
}

describe('staging release contract', () => {
  test('accepts an isolated, commit-pinned staging environment', () => {
    const result = validateStagingEnvironment(stagingEnvironment(), commit)
    expect(result.releaseCandidate).toBe('r60-d0c84e7.1')
    expect(result.stagingOrigin.hostname).toBe('staging.partokens.test')
  })

  test('rejects production web and API targets', () => {
    expect(() => validateStagingEnvironment(stagingEnvironment({ PARTOKENS_STAGING_ORIGIN: 'https://partokens.com', PARTOKENS_SITE_ADDRESS: 'partokens.com' }), commit)).toThrow('must not target production')
    expect(() => validateStagingEnvironment(stagingEnvironment({ PARTOKENS_API_ORIGIN: 'https://partokens.com' }), commit)).toThrow('must not target the production API')
  })

  test('rejects unpinned source and a non-versioned release directory', () => {
    expect(() => validateStagingEnvironment(stagingEnvironment({ PUBLIC_PARTOKENS_SOURCE_URL: 'https://code.partokens.test/partokens-ui' }), commit)).toThrow('full current Git commit')
    expect(() => validateStagingEnvironment(stagingEnvironment({ PARTOKENS_RELEASE_ROOT: '/srv/partokens-ui/current' }), commit)).toThrow('versioned directory')
  })

  test('rejects a production-tagged or shared deploy host', () => {
    expect(() => validateStagingEnvironment(stagingEnvironment({ PARTOKENS_DEPLOY_ENVIRONMENT: 'production' }), commit)).toThrow('must be staging')
    expect(() => validateStagingEnvironment(stagingEnvironment({ PARTOKENS_DEPLOY_HOST: 'partokens-production' }), commit)).toThrow('must differ')
  })

  test('recognizes only the canonical production hosts', () => {
    expect(isProductionHostname('partokens.com')).toBe(true)
    expect(isProductionHostname('www.partokens.com')).toBe(true)
    expect(isProductionHostname('staging.partokens.com')).toBe(false)
  })
})
