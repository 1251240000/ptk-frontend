type VersionedNotice = {
  id: string
  version: string
}

const noticeSeenKey = 'partokens:public-notice-seen:v1'
const noticeReadEvent = 'partokens:public-notice-read'

export function noticeContentVersion(notice: VersionedNotice): string {
  const source = `${notice.id}\u0000${notice.version}`
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function isNoticeSeen(notice: VersionedNotice): boolean {
  return window.localStorage.getItem(noticeSeenKey) === noticeContentVersion(notice)
}

export function markNoticeSeen(notice: VersionedNotice): void {
  window.localStorage.setItem(noticeSeenKey, noticeContentVersion(notice))
  window.dispatchEvent(new CustomEvent(noticeReadEvent))
}

export function subscribeNoticeRead(listener: () => void): () => void {
  window.addEventListener(noticeReadEvent, listener)
  return () => window.removeEventListener(noticeReadEvent, listener)
}
