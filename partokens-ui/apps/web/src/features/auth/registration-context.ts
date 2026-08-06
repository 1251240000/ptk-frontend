const registrationContextKey = 'partokens-auth-registration-context'

export type RegistrationContext = {
  email: string
  sentAt: number
}

export function readRegistrationContext(): RegistrationContext | null {
  const raw = window.sessionStorage.getItem(registrationContextKey)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<RegistrationContext>
    if (typeof value.email !== 'string' || typeof value.sentAt !== 'number' || !Number.isFinite(value.sentAt)) return null
    return { email: value.email, sentAt: value.sentAt }
  } catch {
    return null
  }
}

export function writeRegistrationContext(context: RegistrationContext) {
  window.sessionStorage.setItem(registrationContextKey, JSON.stringify(context))
}

export function clearRegistrationContext() {
  window.sessionStorage.removeItem(registrationContextKey)
}

export function registrationCooldown(context: RegistrationContext | null, now = Date.now()) {
  if (!context) return 0
  return Math.max(0, 60 - Math.floor((now - context.sentAt) / 1000))
}
