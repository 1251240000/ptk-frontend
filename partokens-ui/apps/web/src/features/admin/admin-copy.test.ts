import { describe, expect, it } from 'vitest'

import { adminCopy } from './admin-copy'

describe('adminCopy', () => {
  it('keeps backend step states behind the admin localization seam', () => {
    expect(adminCopy().stepStatus).toEqual({
      pending: '等待执行',
      running: '执行中',
      success: '已完成',
      failed: '执行失败',
    })
  })
})
