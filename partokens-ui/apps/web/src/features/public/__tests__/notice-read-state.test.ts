import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isNoticeSeen,
  markNoticeSeen,
  noticeContentVersion,
  subscribeNoticeRead,
} from '../notice-read-state'

function createWindowStub() {
  const values = new Map<string, string>()
  const listeners = new Set<() => void>()
  return {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    },
    addEventListener: (event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'partokens:public-notice-read') listeners.add(listener as () => void)
    },
    removeEventListener: (event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'partokens:public-notice-read') listeners.delete(listener as () => void)
    },
    dispatchEvent: (event: Event) => {
      if (event.type === 'partokens:public-notice-read') listeners.forEach((listener) => listener())
      return true
    },
  } as unknown as Window
}

describe('public notice read state', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('creates a stable version hash and changes it when content changes', () => {
    const notice = { id: 'release', version: '2026-07-20.1' }
    expect(noticeContentVersion(notice)).toBe(noticeContentVersion({ ...notice }))
    expect(noticeContentVersion(notice)).not.toBe(noticeContentVersion({ ...notice, version: '2026-07-21.1' }))
  })

  it('persists only the current notice version and notifies shell subscribers', () => {
    const windowStub = createWindowStub()
    vi.stubGlobal('window', windowStub)
    const notice = { id: 'release', version: '2026-07-20.1' }
    let updates = 0
    const unsubscribe = subscribeNoticeRead(() => { updates += 1 })

    expect(isNoticeSeen(notice)).toBe(false)
    markNoticeSeen(notice)
    expect(isNoticeSeen(notice)).toBe(true)
    expect(updates).toBe(1)
    expect(isNoticeSeen({ ...notice, version: '2026-07-21.1' })).toBe(false)

    unsubscribe()
    markNoticeSeen(notice)
    expect(updates).toBe(1)
  })
})
