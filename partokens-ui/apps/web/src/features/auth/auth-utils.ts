export function maskEmail(email: string): string {
  const separator = email.lastIndexOf('@')
  if (separator <= 0) return ''
  const local = email.slice(0, separator)
  const domain = email.slice(separator + 1)
  if (!domain) return ''
  const visible = local.length > 1 ? local.slice(0, 2) : local.slice(0, 1)
  return `${visible}***@${domain}`
}

export function cleanBackupCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
}

export function formatBackupCode(value: string): string {
  const clean = cleanBackupCode(value)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}
