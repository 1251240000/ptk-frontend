const registrationContextKey = 'partokens-auth-registration-context'
const legacyRegistrationEmailKey = 'partokens-auth-registration-email'
const legacyRegistrationSentAtKey = 'partokens-auth-registration-sent-at'

export type RegistrationContext = {
  email: string
  sentAt: number
}

export function readRegistrationContext(): RegistrationContext | null {
  const raw = window.sessionStorage.getItem(registrationContextKey)
  if (raw) {
    try {
      const value = JSON.parse(raw) as Partial<RegistrationContext>
      if (typeof value.email === 'string' && typeof value.sentAt === 'number' && Number.isFinite(value.sentAt)) {
        return { email: value.email, sentAt: value.sentAt }
      }
    } catch {
      // Fall through to the legacy migration below.
    }
  }
  const email = window.sessionStorage.getItem(legacyRegistrationEmailKey)
  const sentAt = Number(window.sessionStorage.getItem(legacyRegistrationSentAtKey) || 0)
  if (!email || !Number.isFinite(sentAt)) return null
  const context = { email, sentAt }
  writeRegistrationContext(context)
  window.sessionStorage.removeItem(legacyRegistrationEmailKey)
  window.sessionStorage.removeItem(legacyRegistrationSentAtKey)
  return context
}

export function writeRegistrationContext(context: RegistrationContext) {
  window.sessionStorage.setItem(registrationContextKey, JSON.stringify(context))
}

export function clearRegistrationContext() {
  window.sessionStorage.removeItem(registrationContextKey)
  window.sessionStorage.removeItem(legacyRegistrationEmailKey)
  window.sessionStorage.removeItem(legacyRegistrationSentAtKey)
}

export function registrationCooldown(context: RegistrationContext | null, now = Date.now()) {
  if (!context) return 0
  return Math.max(0, 60 - Math.floor((now - context.sentAt) / 1000))
}
