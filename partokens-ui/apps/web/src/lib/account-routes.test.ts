import { describe, expect, it } from 'vitest'

import { profileTaskSearch, resolveProfileTask } from './account-routes'

describe('profile task routing', () => {
  it.each([
    ['security', '', 'security'],
    ['connections', '', 'connections'],
    ['', '#console-notifications', 'notifications'],
    ['account', '', 'profile'],
    ['preferences', '', 'notifications'],
    ['unknown', '', 'profile'],
  ] as const)('resolves search %s and hash %s to %s', (search, hash, expected) => {
    expect(resolveProfileTask(search, hash)).toBe(expected)
  })

  it('uses the profile route as the canonical default', () => {
    expect(profileTaskSearch('profile')).toBe('')
    expect(profileTaskSearch('security')).toBe('?tab=security')
  })
})
