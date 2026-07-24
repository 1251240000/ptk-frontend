export function base64UrlToArrayBuffer(value?: string | null): ArrayBuffer {
  if (!value) return new ArrayBuffer(0)
  const base64 = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binary = window.atob(base64)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}

export function arrayBufferToBase64Url(buffer?: ArrayBuffer | ArrayBufferLike | null): string {
  if (!buffer) return ''
  const binary = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join('')
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

type JsonRecord = Record<string, unknown>

function extractPublicKey(payload: unknown): JsonRecord {
  if (!payload || typeof payload !== 'object') throw new Error('Passkey options are missing')
  const record = payload as JsonRecord
  const wrapped = record.options ?? record
  const wrapper = wrapped && typeof wrapped === 'object' ? wrapped as JsonRecord : record
  const options = wrapper.publicKey ?? wrapper.PublicKey ?? wrapper.response ?? wrapper.Response ?? wrapped
  if (!options || typeof options !== 'object') throw new Error('Passkey options are invalid')
  return options as JsonRecord
}

export function prepareCredentialCreationOptions(payload: unknown): PublicKeyCredentialCreationOptions {
  const options = extractPublicKey(payload)
  const user = options.user && typeof options.user === 'object' ? options.user as JsonRecord : {}
  const publicKey = {
    ...options,
    challenge: base64UrlToArrayBuffer(String(options.challenge || '')),
    user: { ...user, id: base64UrlToArrayBuffer(String(user.id || '')) },
  } as unknown as PublicKeyCredentialCreationOptions & JsonRecord
  if (Array.isArray(options.excludeCredentials)) {
    publicKey.excludeCredentials = options.excludeCredentials.map((item) => {
      const credential = item as JsonRecord
      return { ...credential, id: base64UrlToArrayBuffer(String(credential.id || '')) }
    }) as PublicKeyCredentialDescriptor[]
  }
  if (Array.isArray(publicKey.attestationFormats) && publicKey.attestationFormats.length === 0) {
    delete publicKey.attestationFormats
  }
  return publicKey
}

export function prepareCredentialRequestOptions(payload: unknown): PublicKeyCredentialRequestOptions {
  const options = extractPublicKey(payload)
  const publicKey = {
    ...options,
    challenge: base64UrlToArrayBuffer(String(options.challenge || '')),
  } as unknown as PublicKeyCredentialRequestOptions
  if (Array.isArray(options.allowCredentials)) {
    publicKey.allowCredentials = options.allowCredentials.map((item) => {
      const credential = item as JsonRecord
      return { ...credential, id: base64UrlToArrayBuffer(String(credential.id || '')) }
    }) as PublicKeyCredentialDescriptor[]
  }
  return publicKey
}

export function buildRegistrationResult(credential: PublicKeyCredential | null): JsonRecord | null {
  if (!credential) return null
  const response = credential.response as AuthenticatorAttestationResponse & { getTransports?: () => string[] }
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      transports: response.getTransports?.(),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

export function buildAssertionResult(credential: PublicKeyCredential | null): JsonRecord | null {
  if (!credential) return null
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.PublicKeyCredential && navigator.credentials)
}
