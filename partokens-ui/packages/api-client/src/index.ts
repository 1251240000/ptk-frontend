import axios from 'axios'
import { z } from 'zod'

export type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}

export type PartokensStatus = {
  system_name?: string
  logo?: string
  version?: string
  register_enabled?: boolean
  email_verification?: boolean
  turnstile_check?: boolean
  turnstile_site_key?: string
  github_client_id?: string
  linuxdo_client_id?: string
  oidc_client_id?: string
  oidc_authorization_endpoint?: string
  custom_oauth_providers?: Array<{
    id: number
    name: string
    slug: string
    client_id: string
    authorization_endpoint: string
    scopes?: string
  }>
  [key: string]: unknown
}

export type CurrentUser = {
  id: number
  username: string
  display_name?: string
  email?: string
  role: number
  group?: string
  quota?: number
  used_quota?: number
  request_count?: number
  aff_quota?: number
  aff_history_quota?: number
  aff_count?: number
  aff_code?: string
  setting?: string
  settings?: string
  github_id?: string
  linux_do_id?: string
  oidc_id?: string
  status?: number
  [key: string]: unknown
}

export type PlaygroundMessageInput = {
  role: 'user' | 'assistant'
  content: string
}

export type PlaygroundCompletionInput = {
  model: string
  group: string
  messages: PlaygroundMessageInput[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  frequency_penalty?: number
  presence_penalty?: number
  seed?: number | null
}

export type PlaygroundStreamUpdate = {
  type: 'content' | 'reasoning'
  chunk: string
}

export type PlaygroundSseEvent = {
  done: boolean
  updates: PlaygroundStreamUpdate[]
  error?: { code?: string; message: string }
}

export class PlaygroundRequestError extends Error {
  status?: number
  code?: string

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message)
    this.name = 'PlaygroundRequestError'
    this.status = options.status
    this.code = options.code
  }
}

export type TokenSummary = {
  id: number
  name: string
  key?: string
  status?: number
  remain_quota?: number
  used_quota?: number
  unlimited_quota?: boolean
  group?: string
  models?: string
  expired_time?: number
  created_time?: number
  accessed_time?: number
  model_limits_enabled?: boolean
  model_limits?: string
  allow_ips?: string
  cross_group_retry?: boolean
  [key: string]: unknown
}

export type TokenInput = {
  name: string
  remain_quota: number
  expired_time: number
  unlimited_quota: boolean
  model_limits_enabled: boolean
  model_limits: string
  allow_ips: string
  group: string
  cross_group_retry: boolean
}

export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type TopupInfo = {
  amount_options: number[]
  discount: Record<string, number>
  pay_methods: PaymentMethod[]
  enable_online_topup: boolean
  enable_stripe_topup: boolean
  min_topup?: number
  stripe_min_topup?: number
  topup_link?: string
  enable_creem_topup?: boolean
  creem_products?: CreemProduct[]
  enable_waffo_topup?: boolean
  waffo_pay_methods?: WaffoPaymentMethod[]
  waffo_min_topup?: number
  enable_waffo_pancake_topup?: boolean
  waffo_pancake_min_topup?: number
  enable_redemption?: boolean
  payment_compliance_confirmed?: boolean
  payment_compliance_terms_version?: string
  [key: string]: unknown
}

export type PaymentMethod = {
  name: string
  type: string
  min_topup?: number
  icon?: string
}

export type CreemProduct = {
  name: string
  productId: string
  price: number
  quota: number
  currency: 'USD' | 'EUR'
}

export type WaffoPaymentMethod = {
  name: string
  icon?: string
  payMethodType?: string
  payMethodName?: string
}

export type QuotaDataPoint = {
  model_name?: string
  created_at?: number
  quota?: number
  token_used?: number
  request_count?: number
  [key: string]: unknown
}

export type FlowQuotaDataPoint = {
  token_id?: number
  token_name?: string
  use_group?: string
  model_name?: string
  token_used?: number
  count?: number
  quota?: number
}

export type QuotaDataRange = {
  start_timestamp: number
  end_timestamp: number
  default_time?: string
}

export type TopupRecord = {
  id: number
  amount: number
  money: number
  trade_no: string
  payment_method: string
  create_time: number
  complete_time?: number
  status: 'success' | 'pending' | 'expired' | string
}

export type SubscriptionPlan = {
  id: number
  title: string
  subtitle?: string
  price_amount: number
  currency: string
  duration_unit: 'year' | 'month' | 'day' | 'hour' | 'custom'
  duration_value: number
  custom_seconds?: number
  quota_reset_period: 'never' | 'daily' | 'weekly' | 'monthly' | 'custom'
  quota_reset_custom_seconds?: number
  enabled: boolean
  sort_order: number
  allow_balance_pay?: boolean
  allow_wallet_overflow?: boolean
  max_purchase_per_user: number
  total_amount: number
  upgrade_group?: string
  stripe_price_id?: string
  creem_product_id?: string
  waffo_pancake_product_id?: string
}

export type SubscriptionPlanRecord = { plan: SubscriptionPlan }

export type UserSubscription = {
  id: number
  plan_id: number
  status: string
  source?: string
  start_time: number
  end_time: number
  amount_total: number
  amount_used: number
  next_reset_time?: number
}

export type UserSubscriptionRecord = { subscription: UserSubscription }

export type SelfSubscriptionData = {
  billing_preference: string
  subscriptions: UserSubscriptionRecord[]
  all_subscriptions: UserSubscriptionRecord[]
}

export type CheckoutData = {
  pay_link?: string
  checkout_url?: string
  payment_url?: string
  session_id?: string
  expires_at?: number | string
  order_id?: string
  token?: string
  token_expires_at?: number | string
  [key: string]: unknown
}

export type CheckoutEnvelope = ApiEnvelope<CheckoutData | string> & { url?: string }

export type OAuthBinding = {
  provider_id: string
  provider_name: string
  external_id?: string
}

export type TwoFactorStatus = {
  enabled: boolean
  locked: boolean
  backup_codes_remaining?: number
}

export type TwoFactorSetup = {
  secret: string
  qr_code_data: string
  backup_codes: string[]
}

export type PasskeyStatus = {
  enabled: boolean
  last_used_at?: string | null
  backup_eligible?: boolean
  backup_state?: boolean
}

export type PasskeyOptionsPayload = {
  options?: unknown
  publicKey?: unknown
  response?: unknown
  Response?: unknown
}

export type CheckinRecord = {
  checkin_date: string
  quota_awarded: number
}

export type CheckinStatus = {
  enabled: boolean
  stats: {
    checked_in_today: boolean
    total_checkins: number
    total_quota: number
    checkin_count: number
    records: CheckinRecord[]
  }
}

export type UsageLog = {
  id?: number
  created_at?: number
  type?: number
  token_name?: string
  model_name?: string
  prompt_tokens?: number
  completion_tokens?: number
  quota?: number
  use_time?: number
  is_stream?: boolean
  content?: string
  group?: string
  request_id?: string
  upstream_request_id?: string
  other?: string
  [key: string]: unknown
}

export type UsageLogQuery = {
  p?: number
  page_size?: number
  type?: number
  token_name?: string
  model_name?: string
  start_timestamp?: number
  end_timestamp?: number
  group?: string
  request_id?: string
  upstream_request_id?: string
}

export type UsageLogStats = {
  quota: number
  rpm: number
  tpm: number
}

export type UserSettingsInput = {
  notify_type?: string
  quota_warning_threshold?: number
  webhook_url?: string
  webhook_secret?: string
  notification_email?: string
  bark_url?: string
  gotify_url?: string
  gotify_token?: string
  gotify_priority?: number
  accept_unset_model_ratio_model?: boolean
  record_ip_log?: boolean
}

const envelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown(),
})

export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-store',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userId = window.localStorage.getItem('partokens-user-id')
    if (userId) config.headers.set('New-Api-User', userId)
  }
  return config
})

function parseEnvelope<T>(input: unknown): ApiEnvelope<T> {
  const parsed = envelopeSchema.parse(input)
  return parsed as ApiEnvelope<T>
}

export async function getStatus(): Promise<ApiEnvelope<PartokensStatus>> {
  const response = await api.get('/api/status')
  return parseEnvelope<PartokensStatus>(response.data)
}

export async function getSelf(): Promise<ApiEnvelope<CurrentUser>> {
  const response = await api.get('/api/user/self')
  return parseEnvelope<CurrentUser>(response.data)
}

export async function login(input: {
  username: string
  password: string
  turnstile?: string
}): Promise<ApiEnvelope<CurrentUser & { require_2fa?: boolean }>> {
  const query = input.turnstile
    ? `?turnstile=${encodeURIComponent(input.turnstile)}`
    : ''
  const response = await api.post(`/api/user/login${query}`, {
    username: input.username,
    password: input.password,
  })
  return parseEnvelope(response.data)
}

export async function logout(): Promise<void> {
  await api.get('/api/user/logout')
}

export async function loginTwoFactor(code: string): Promise<ApiEnvelope<CurrentUser>> {
  const response = await api.post('/api/user/login/2fa', { code })
  return parseEnvelope(response.data)
}

export async function getOAuthState(): Promise<string> {
  const response = await api.get('/api/oauth/state', {
    params: { aff: window.localStorage.getItem('aff') || '' },
  })
  const envelope = parseEnvelope<string>(response.data)
  return envelope.success ? envelope.data : ''
}

export async function sendEmailVerification(input: {
  email: string
  turnstile?: string
}): Promise<ApiEnvelope<unknown>> {
  const response = await api.get('/api/verification', { params: input })
  return parseEnvelope(response.data)
}

export async function register(input: Record<string, string>): Promise<ApiEnvelope<unknown>> {
  const { turnstile, ...body } = input
  const response = await api.post('/api/user/register', body, {
    params: turnstile ? { turnstile } : undefined,
  })
  return parseEnvelope(response.data)
}

export async function sendPasswordReset(email: string, turnstile?: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.get('/api/reset_password', { params: { email, turnstile } })
  return parseEnvelope(response.data)
}

export async function confirmPasswordReset(input: { email: string; token: string }): Promise<ApiEnvelope<string>> {
  const response = await api.post('/api/user/reset', input)
  return parseEnvelope<string>(response.data)
}

export async function exchangeOAuth(
  provider: string,
  params: { code: string; state?: string },
): Promise<ApiEnvelope<CurrentUser | { action: 'bind' } | null>> {
  const response = await api.get(`/api/oauth/${encodeURIComponent(provider)}`, {
    params,
  })
  return parseEnvelope(response.data)
}

export async function getPricing(): Promise<ApiEnvelope<unknown>> {
  const response = await api.get('/api/pricing')
  return parseEnvelope(response.data)
}

export async function getTokens(input: { p?: number; size?: number } = {}): Promise<ApiEnvelope<PaginatedData<TokenSummary>>> {
  const response = await api.get('/api/token/', { params: { p: input.p ?? 1, size: input.size ?? 20 } })
  return parseEnvelope<PaginatedData<TokenSummary>>(response.data)
}

export async function searchTokens(input: {
  keyword?: string
  token?: string
  p?: number
  size?: number
}): Promise<ApiEnvelope<PaginatedData<TokenSummary>>> {
  const response = await api.get('/api/token/search', { params: input })
  return parseEnvelope<PaginatedData<TokenSummary>>(response.data)
}

export async function getToken(id: number): Promise<ApiEnvelope<TokenSummary>> {
  const response = await api.get(`/api/token/${id}`)
  return parseEnvelope<TokenSummary>(response.data)
}

export async function getLogs(input: UsageLogQuery = {}): Promise<ApiEnvelope<PaginatedData<UsageLog>>> {
  const response = await api.get('/api/log/self', {
    params: { p: input.p ?? 1, page_size: input.page_size ?? 20, ...input },
  })
  return parseEnvelope<PaginatedData<UsageLog>>(response.data)
}

export async function getLogStats(input: Omit<UsageLogQuery, 'p' | 'page_size'> = {}): Promise<ApiEnvelope<UsageLogStats>> {
  const response = await api.get('/api/log/self/stat', { params: input })
  return parseEnvelope<UsageLogStats>(response.data)
}

export async function getTopupInfo(): Promise<ApiEnvelope<TopupInfo>> {
  const response = await api.get('/api/user/topup/info')
  return parseEnvelope<TopupInfo>(response.data)
}

const MAX_SELF_QUOTA_RANGE_SECONDS = 30 * 24 * 60 * 60

function splitSelfQuotaRange(input: QuotaDataRange): QuotaDataRange[] {
  const ranges: QuotaDataRange[] = []
  let start = input.start_timestamp

  while (start <= input.end_timestamp) {
    const end = Math.min(start + MAX_SELF_QUOTA_RANGE_SECONDS, input.end_timestamp)
    ranges.push({ ...input, start_timestamp: start, end_timestamp: end })
    start = end + 1
  }

  return ranges
}

async function getChunkedQuotaData<T>(path: string, input: QuotaDataRange): Promise<ApiEnvelope<T[]>> {
  const ranges = splitSelfQuotaRange(input)
  if (ranges.length === 1) {
    const response = await api.get(path, { params: ranges[0] })
    return parseEnvelope<T[]>(response.data)
  }

  const data: T[] = []
  for (const range of ranges) {
    const response = await api.get(path, { params: range })
    const envelope = parseEnvelope<T[]>(response.data)
    if (!envelope.success) throw new Error(envelope.message || 'Unable to load quota data')
    if (Array.isArray(envelope.data)) data.push(...envelope.data)
  }
  return { success: true, message: '', data }
}

export async function getQuotaData(input: QuotaDataRange): Promise<ApiEnvelope<QuotaDataPoint[]>> {
  return getChunkedQuotaData<QuotaDataPoint>('/api/data/self', input)
}

export async function getFlowQuotaData(input: QuotaDataRange): Promise<ApiEnvelope<FlowQuotaDataPoint[]>> {
  return getChunkedQuotaData<FlowQuotaDataPoint>('/api/data/flow/self', input)
}

export async function getUserModels(group = 'default'): Promise<ApiEnvelope<unknown>> {
  const response = await api.get('/api/user/models', { params: { group } })
  return parseEnvelope(response.data)
}

export async function getUserGroups(): Promise<ApiEnvelope<unknown>> {
  const response = await api.get('/api/user/self/groups')
  return parseEnvelope(response.data)
}

export async function playgroundCompletion(
  input: PlaygroundCompletionInput,
  signal?: AbortSignal,
): Promise<{ choices?: Array<{ message?: { content?: string; reasoning_content?: string } }> }> {
  const response = await api.post('/pg/chat/completions', { ...input, stream: false }, { signal })
  return response.data as { choices?: Array<{ message?: { content?: string; reasoning_content?: string } }> }
}

export function parsePlaygroundSseEvent(rawEvent: string): PlaygroundSseEvent | null {
  const data = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim()

  if (!data) return null
  if (data === '[DONE]') return { done: true, updates: [] }

  let parsed: {
    error?: { code?: string; message?: string }
    choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>
  }
  try {
    parsed = JSON.parse(data) as typeof parsed
  } catch {
    throw new PlaygroundRequestError('The streaming response could not be parsed')
  }
  if (parsed.error) {
    return {
      done: false,
      updates: [],
      error: {
        code: parsed.error.code,
        message: parsed.error.message || 'The model request failed',
      },
    }
  }

  const delta = parsed.choices?.[0]?.delta
  const updates: PlaygroundStreamUpdate[] = []
  if (delta?.reasoning_content) updates.push({ type: 'reasoning', chunk: delta.reasoning_content })
  if (delta?.content) updates.push({ type: 'content', chunk: delta.content })
  return { done: false, updates }
}

export function consumePlaygroundSseBuffer(
  input: string,
  final = false,
): { events: string[]; remainder: string } {
  let buffer = input.replace(/\r\n/g, '\n')
  const events: string[] = []
  let boundary = buffer.indexOf('\n\n')
  while (boundary >= 0) {
    events.push(buffer.slice(0, boundary))
    buffer = buffer.slice(boundary + 2)
    boundary = buffer.indexOf('\n\n')
  }
  if (final && buffer.trim()) {
    events.push(buffer)
    buffer = ''
  }
  return { events, remainder: buffer }
}

async function playgroundFetchError(response: Response): Promise<PlaygroundRequestError> {
  let message = `Model request failed with HTTP ${response.status}`
  let code: string | undefined
  try {
    const body = await response.json() as {
      message?: string
      error?: { code?: string; message?: string }
    }
    message = body.error?.message || body.message || message
    code = body.error?.code
  } catch {
    // Preserve the status-based fallback for non-JSON proxy errors.
  }
  return new PlaygroundRequestError(message, { status: response.status, code })
}

export async function streamPlaygroundCompletion(
  input: PlaygroundCompletionInput,
  options: {
    signal?: AbortSignal
    onUpdate: (update: PlaygroundStreamUpdate) => void
  },
): Promise<void> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  }
  if (typeof window !== 'undefined') {
    const userId = window.localStorage.getItem('partokens-user-id')
    if (userId) headers['New-Api-User'] = userId
  }

  const response = await fetch('/pg/chat/completions', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ ...input, stream: true }),
    signal: options.signal,
  })
  if (!response.ok) throw await playgroundFetchError(response)
  if (!response.body) throw new PlaygroundRequestError('The streaming response had no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const processEvent = (rawEvent: string) => {
    const event = parsePlaygroundSseEvent(rawEvent)
    if (!event) return false
    if (event.error) throw new PlaygroundRequestError(event.error.message, { code: event.error.code })
    event.updates.forEach(options.onUpdate)
    return event.done
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const decoded = consumePlaygroundSseBuffer(buffer, done)
      buffer = decoded.remainder
      for (const event of decoded.events) {
        if (processEvent(event)) {
          await reader.cancel()
          return
        }
      }
      if (done) return
    }
  } finally {
    reader.releaseLock()
  }
}

export async function createToken(input: TokenInput): Promise<ApiEnvelope<TokenSummary>> {
  const response = await api.post('/api/token/', input)
  return parseEnvelope<TokenSummary>(response.data)
}

export async function updateToken(input: TokenInput & { id: number }): Promise<ApiEnvelope<TokenSummary>> {
  const response = await api.put('/api/token/', input)
  return parseEnvelope<TokenSummary>(response.data)
}

export async function updateTokenStatus(id: number, status: number): Promise<ApiEnvelope<TokenSummary>> {
  const response = await api.put('/api/token/?status_only=true', { id, status })
  return parseEnvelope<TokenSummary>(response.data)
}

export async function deleteToken(id: number): Promise<ApiEnvelope<unknown>> {
  const response = await api.delete(`/api/token/${id}`)
  return parseEnvelope(response.data)
}

export async function deleteTokens(ids: number[]): Promise<ApiEnvelope<number>> {
  const response = await api.post('/api/token/batch', { ids })
  return parseEnvelope<number>(response.data)
}

export async function revealToken(id: number): Promise<ApiEnvelope<{ key: string }>> {
  const response = await api.post(`/api/token/${id}/key`)
  return parseEnvelope<{ key: string }>(response.data)
}

export async function updateProfile(input: Record<string, unknown>): Promise<ApiEnvelope<unknown>> {
  const response = await api.put('/api/user/self', input)
  return parseEnvelope(response.data)
}

export async function updateUserSettings(input: UserSettingsInput): Promise<ApiEnvelope<unknown>> {
  const response = await api.put('/api/user/setting', input)
  return parseEnvelope(response.data)
}

export async function updateUserLanguage(language: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.put('/api/user/self', { language })
  return parseEnvelope(response.data)
}

export async function calculateTopupAmount(amount: number, provider: 'epay' | 'stripe' | 'waffo-pancake'): Promise<ApiEnvelope<string>> {
  const path = provider === 'stripe'
    ? '/api/user/stripe/amount'
    : provider === 'waffo-pancake'
      ? '/api/user/waffo-pancake/amount'
      : '/api/user/amount'
  const response = await api.post(path, { amount })
  return parseEnvelope<string>(response.data)
}

export async function requestTopupPayment(input: {
  provider: 'epay' | 'stripe' | 'creem' | 'waffo' | 'waffo-pancake'
  amount?: number
  payment_method?: string
  product_id?: string
  pay_method_index?: number
}): Promise<CheckoutEnvelope> {
  const paths = {
    epay: '/api/user/pay',
    stripe: '/api/user/stripe/pay',
    creem: '/api/user/creem/pay',
    waffo: '/api/user/waffo/pay',
    'waffo-pancake': '/api/user/waffo-pancake/pay',
  } as const
  const { provider, ...body } = input
  const response = await api.post(paths[provider], body)
  const envelope = parseEnvelope<CheckoutData | string>(response.data) as CheckoutEnvelope
  const raw = response.data as { url?: unknown }
  if (typeof raw.url === 'string') envelope.url = raw.url
  return envelope
}

export async function redeemTopupCode(key: string): Promise<ApiEnvelope<number>> {
  const response = await api.post('/api/user/topup', { key })
  return parseEnvelope<number>(response.data)
}

export async function getBillingHistory(input: { p?: number; page_size?: number; keyword?: string } = {}): Promise<ApiEnvelope<PaginatedData<TopupRecord>>> {
  const response = await api.get('/api/user/topup/self', {
    params: { p: input.p ?? 1, page_size: input.page_size ?? 20, keyword: input.keyword || undefined },
  })
  return parseEnvelope<PaginatedData<TopupRecord>>(response.data)
}

export async function getAffiliateCode(): Promise<ApiEnvelope<string>> {
  const response = await api.get('/api/user/aff')
  return parseEnvelope<string>(response.data)
}

export async function transferAffiliateQuota(quota: number): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/user/aff_transfer', { quota })
  return parseEnvelope(response.data)
}

export async function getSubscriptionPlans(): Promise<ApiEnvelope<SubscriptionPlanRecord[]>> {
  const response = await api.get('/api/subscription/plans')
  return parseEnvelope<SubscriptionPlanRecord[]>(response.data)
}

export async function getSelfSubscriptions(): Promise<ApiEnvelope<SelfSubscriptionData>> {
  const response = await api.get('/api/subscription/self')
  return parseEnvelope<SelfSubscriptionData>(response.data)
}

export async function updateSubscriptionPreference(billing_preference: string): Promise<ApiEnvelope<{ billing_preference?: string }>> {
  const response = await api.put('/api/subscription/self/preference', { billing_preference })
  return parseEnvelope<{ billing_preference?: string }>(response.data)
}

export async function requestSubscriptionPayment(input: {
  provider: 'balance' | 'epay' | 'stripe' | 'creem' | 'waffo-pancake'
  plan_id: number
  payment_method?: string
}): Promise<CheckoutEnvelope> {
  const paths = {
    balance: '/api/subscription/balance/pay',
    epay: '/api/subscription/epay/pay',
    stripe: '/api/subscription/stripe/pay',
    creem: '/api/subscription/creem/pay',
    'waffo-pancake': '/api/subscription/waffo-pancake/pay',
  } as const
  const { provider, ...body } = input
  const response = await api.post(paths[provider], body)
  const envelope = parseEnvelope<CheckoutData | string>(response.data) as CheckoutEnvelope
  const raw = response.data as { url?: unknown }
  if (typeof raw.url === 'string') envelope.url = raw.url
  return envelope
}

export async function getAccessToken(): Promise<ApiEnvelope<string>> {
  const response = await api.get('/api/user/token')
  return parseEnvelope<string>(response.data)
}

export async function bindEmail(email: string, code: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/oauth/email/bind', { email, code })
  return parseEnvelope(response.data)
}

export async function getOAuthBindings(): Promise<ApiEnvelope<OAuthBinding[]>> {
  const response = await api.get('/api/user/oauth/bindings')
  return parseEnvelope<OAuthBinding[]>(response.data)
}

export async function unbindOAuth(providerId: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.delete(`/api/user/oauth/bindings/${encodeURIComponent(providerId)}`)
  return parseEnvelope(response.data)
}

export async function getTwoFactorStatus(): Promise<ApiEnvelope<TwoFactorStatus>> {
  const response = await api.get('/api/user/2fa/status')
  return parseEnvelope<TwoFactorStatus>(response.data)
}

export async function setupTwoFactor(): Promise<ApiEnvelope<TwoFactorSetup>> {
  const response = await api.post('/api/user/2fa/setup')
  return parseEnvelope<TwoFactorSetup>(response.data)
}

export async function enableTwoFactor(code: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/user/2fa/enable', { code })
  return parseEnvelope(response.data)
}

export async function disableTwoFactor(code: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/user/2fa/disable', { code })
  return parseEnvelope(response.data)
}

export async function regenerateBackupCodes(code: string): Promise<ApiEnvelope<{ backup_codes: string[] }>> {
  const response = await api.post('/api/user/2fa/backup_codes', { code })
  return parseEnvelope<{ backup_codes: string[] }>(response.data)
}

export async function getPasskeyStatus(): Promise<ApiEnvelope<PasskeyStatus>> {
  const response = await api.get('/api/user/passkey')
  return parseEnvelope<PasskeyStatus>(response.data)
}

export async function beginPasskeyRegistration(): Promise<ApiEnvelope<PasskeyOptionsPayload>> {
  const response = await api.post('/api/user/passkey/register/begin')
  return parseEnvelope<PasskeyOptionsPayload>(response.data)
}

export async function finishPasskeyRegistration(payload: Record<string, unknown>): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/user/passkey/register/finish', payload)
  return parseEnvelope(response.data)
}

export async function beginPasskeyVerification(): Promise<ApiEnvelope<PasskeyOptionsPayload>> {
  const response = await api.post('/api/user/passkey/verify/begin')
  return parseEnvelope<PasskeyOptionsPayload>(response.data)
}

export async function finishPasskeyVerification(payload: Record<string, unknown>): Promise<ApiEnvelope<unknown>> {
  const response = await api.post('/api/user/passkey/verify/finish', payload)
  return parseEnvelope(response.data)
}

export async function verifySensitiveAction(method: '2fa' | 'passkey', code?: string): Promise<ApiEnvelope<{ verified: boolean; expires_at?: number }>> {
  const response = await api.post('/api/verify', { method, ...(code ? { code } : {}) })
  return parseEnvelope<{ verified: boolean; expires_at?: number }>(response.data)
}

export async function deletePasskey(): Promise<ApiEnvelope<unknown>> {
  const response = await api.delete('/api/user/passkey')
  return parseEnvelope(response.data)
}

export async function getCheckinStatus(month: string): Promise<ApiEnvelope<CheckinStatus>> {
  const response = await api.get('/api/user/checkin', { params: { month } })
  return parseEnvelope<CheckinStatus>(response.data)
}

export async function performCheckin(turnstile?: string): Promise<ApiEnvelope<{ quota_awarded: number }>> {
  const response = await api.post('/api/user/checkin', undefined, { params: turnstile ? { turnstile } : undefined })
  return parseEnvelope<{ quota_awarded: number }>(response.data)
}

export async function deleteAccount(password?: string): Promise<ApiEnvelope<unknown>> {
  const response = await api.delete('/api/user/self', { data: password ? { password } : undefined })
  return parseEnvelope(response.data)
}
