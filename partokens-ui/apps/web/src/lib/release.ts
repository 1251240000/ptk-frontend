export function normalizePublicSourceUrl(value: string | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export const publicSourceUrl = normalizePublicSourceUrl(import.meta.env.PUBLIC_PARTOKENS_SOURCE_URL)
