import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Ellipsis,
  Eye,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  useSidebar,
} from '@partokens/design-system/components'
import {
  createToken,
  deleteToken,
  deleteTokens,
  getToken,
  getTokens,
  getUserGroups,
  getUserModels,
  revealToken,
  searchTokens,
  updateToken,
  updateTokenStatus,
  type ApiEnvelope,
  type TokenInput,
} from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import { formatQuota, quotaDollarsToUnits, quotaUnitsToDollars } from '@/lib/format'
import { useSessionStore } from '@/stores/session'

const queryRoot = ['console-foundation', 'keys'] as const
const pageSize = 20
const requestPageSize = 100
const maxTokenPages = 10
const maxBatchSize = 100

type KeyRecord = {
  id: number
  name: string
  maskedKey: string | null
  status?: number
  remainQuota?: number
  unlimitedQuota?: boolean
  group?: string
  createdTime?: number
  accessedTime?: number
  expiredTime?: number
  modelLimitsEnabled?: boolean
  modelLimits?: string
  allowIps?: string
  crossGroupRetry?: boolean
  partial: boolean
  editable: boolean
}

type KeyListResult = {
  records: KeyRecord[]
  invalidCount: number
  reportedTotal: number
  truncated: boolean
}

class KeyContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KeyContractError'
  }
}

class SafeKeyError extends Error {
  status?: number

  constructor(status?: number) {
    super('The API key request failed.')
    this.name = 'SafeKeyError'
    this.status = status
  }
}

function usePageLocale(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string }
  return isAppLocale(params.locale) ? params.locale : 'zh-CN'
}

function sensitiveShape(value: string): boolean {
  return /https?:\/\/|\bBearer\s+|(?:api[-_ ]?key|token)\s*[:=]|\b(?:sk|ptk)[-_][A-Za-z0-9._-]{8,}/i.test(value)
}

function safeLabel(value: unknown, limit = 100): string | undefined {
  if (typeof value !== 'string') return undefined
  const label = value.trim()
  if (!label || label.length > limit || /[\u0000-\u001f\u007f]/.test(label) || sensitiveShape(label)) return undefined
  return label
}

function sourceObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function nonNegativeNumber(value: unknown): number | undefined {
  const number = finiteNumber(value)
  return number != null && number >= 0 ? number : undefined
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function safeStatus(value: unknown): number | undefined {
  const status = finiteNumber(value)
  return status != null && Number.isInteger(status) && status >= 1 && status <= 4 ? status : undefined
}

function safeTimestamp(value: unknown, allowNever = false): number | undefined {
  const timestamp = finiteNumber(value)
  if (timestamp == null || !Number.isInteger(timestamp)) return undefined
  if (allowNever && timestamp === -1) return timestamp
  return timestamp >= 0 ? timestamp : undefined
}

function maskedCredential(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 64 || sensitiveShape(value)) return null
  return /^[A-Za-z0-9._-]{0,32}\*{3,}[A-Za-z0-9._-]{0,16}$/.test(value) ? value : null
}

function safeModelLimits(value: unknown): string | undefined {
  if (value === '') return ''
  if (typeof value !== 'string' || value.length > 4_000) return undefined
  const rawModels = value.split(',').map((model) => model.trim()).filter(Boolean)
  if (rawModels.length > 200) return undefined
  const models = rawModels.map((model) => safeLabel(model, 120))
  return models.some((model) => !model) ? undefined : [...new Set(models as string[])].join(',')
}

function safeIpAllowlist(value: unknown): string | undefined {
  if (value === '') return ''
  if (typeof value !== 'string' || value.length > 8_000 || sensitiveShape(value)) return undefined
  const entries = value.split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean)
  if (entries.length > 200 || entries.some((entry) => entry.length > 64 || !/^[0-9a-f:.]+(?:\/\d{1,3})?$/i.test(entry))) return undefined
  return entries.join('\n')
}

function sanitizeToken(input: unknown): KeyRecord | null {
  const source = sourceObject(input)
  if (!source) return null
  const id = finiteNumber(source.id)
  const name = safeLabel(source.name)
  if (!id || !Number.isInteger(id) || !name) return null

  const maskedKey = maskedCredential(source.key)
  const status = safeStatus(source.status)
  const remainQuota = nonNegativeNumber(source.remain_quota)
  const unlimitedQuota = optionalBoolean(source.unlimited_quota)
  const group = source.group === '' ? '' : safeLabel(source.group, 64)
  const createdTime = safeTimestamp(source.created_time)
  const accessedTime = safeTimestamp(source.accessed_time)
  const expiredTime = safeTimestamp(source.expired_time, true)
  const modelLimitsEnabled = optionalBoolean(source.model_limits_enabled)
  const modelLimits = safeModelLimits(source.model_limits)
  const allowIps = safeIpAllowlist(source.allow_ips)
  const crossGroupRetry = optionalBoolean(source.cross_group_retry)
  const editable = remainQuota != null && unlimitedQuota != null && group != null && expiredTime != null
    && modelLimitsEnabled != null && modelLimits != null && allowIps != null && crossGroupRetry != null
  const partial = maskedKey == null || status == null || createdTime == null || accessedTime == null || !editable

  return {
    id,
    name,
    maskedKey,
    status,
    remainQuota,
    unlimitedQuota,
    group,
    createdTime,
    accessedTime,
    expiredTime,
    modelLimitsEnabled,
    modelLimits,
    allowIps,
    crossGroupRetry,
    partial,
    editable,
  }
}

function toSafeKeyError(error: unknown): SafeKeyError | KeyContractError {
  if (error instanceof KeyContractError || error instanceof SafeKeyError) return error
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  return new SafeKeyError(status)
}

async function projectEnvelope<T>(request: () => Promise<ApiEnvelope<unknown>>, project: (data: unknown) => T): Promise<T> {
  try {
    const response = await request()
    if (!response || response.success !== true) throw new SafeKeyError()
    return project(response.data)
  } catch (error) {
    throw toSafeKeyError(error)
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof KeyContractError) return error.message
  const status = error instanceof SafeKeyError ? error.status : (error as { response?: { status?: number } } | null)?.response?.status
  if (status === 401) return 'Your session expired. Sign in again.'
  if (status === 403) return 'Your account cannot manage API keys.'
  return fallback
}

function parsePage(data: unknown) {
  const source = sourceObject(data)
  if (!source) throw new KeyContractError('The API key list response has no paginated data.')
  if (!Array.isArray(source.items)) throw new KeyContractError('The API key list response has no items array.')
  const total = nonNegativeNumber(source.total)
  if (total == null || !Number.isInteger(total)) throw new KeyContractError('The API key list response has no valid total.')
  return { items: source.items, total }
}

async function fetchPage(keyword: string, page: number) {
  return projectEnvelope(
    () => keyword
      ? searchTokens({ keyword, p: page, size: requestPageSize })
      : getTokens({ p: page, size: requestPageSize }),
    parsePage,
  )
}

async function fetchKeys(keyword: string): Promise<KeyListResult> {
  const first = await fetchPage(keyword, 1)
  const reportedPages = Math.ceil(first.total / requestPageSize)
  const pages = Math.min(Math.max(1, reportedPages), maxTokenPages)
  const rawItems = [...first.items]
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchPage(keyword, page)
    rawItems.push(...next.items)
  }

  const byId = new Map<number, KeyRecord>()
  let invalidCount = 0
  for (const raw of rawItems) {
    const record = sanitizeToken(raw)
    if (record) byId.set(record.id, record)
    else invalidCount += 1
  }
  return {
    records: [...byId.values()],
    invalidCount,
    reportedTotal: first.total,
    truncated: reportedPages > maxTokenPages,
  }
}

function safeStringList(input: unknown): string[] {
  const source = Array.isArray(input) ? input : sourceObject(input) ? Object.keys(input as Record<string, unknown>) : null
  if (!source) throw new KeyContractError('The supporting options response is incomplete.')
  const values = source.map((value) => safeLabel(value, 120)).filter((value): value is string => Boolean(value))
  if (source.length > 0 && values.length === 0) throw new KeyContractError('The supporting options response has no safe labels.')
  return [...new Set(values)].slice(0, 500)
}

function projectSearch(value: string): { blocked: boolean; value: string } {
  const keyword = value.trim()
  if (!keyword) return { blocked: false, value: '' }
  if (keyword.length > 64 || /[\u0000-\u001f\u007f]/.test(keyword) || sensitiveShape(keyword)) return { blocked: true, value: '' }
  return { blocked: false, value: keyword }
}

function statusLabel(status: number | undefined, t: (value: string) => string) {
  if (status === 1) return t('Enabled')
  if (status === 2) return t('Disabled')
  if (status === 3) return 'Expired'
  if (status === 4) return 'Exhausted'
  return 'Unavailable'
}

function StatusBadge({ status }: { status?: number }) {
  const { t } = useTranslation()
  if (status === 1) return <Badge>{statusLabel(status, t)}</Badge>
  if (status === 3 || status === 4) return <Badge variant="destructive">{statusLabel(status, t)}</Badge>
  return <Badge variant="secondary">{statusLabel(status, t)}</Badge>
}

function PermissionBadge() {
  return <Badge variant="outline" title="The token API does not expose permission levels.">Unavailable</Badge>
}

function StatePanel({ kind, message, onRetry, onClear }: { kind: 'error' | 'empty' | 'contract'; message: string; onRetry?: () => void; onClear?: () => void }) {
  const filtered = kind === 'empty' && Boolean(onClear)
  return (
    <div role={kind === 'empty' ? undefined : 'alert'} className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40">
        {kind === 'empty' ? <KeyRound className="size-5 text-muted-foreground" /> : <AlertTriangle className="size-5 text-destructive" />}
      </div>
      <h2 className="text-sm font-semibold">{kind === 'empty' ? filtered ? 'No matching API keys' : 'No API keys yet' : kind === 'contract' ? 'API key contract is incomplete' : 'API keys are unavailable'}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}><RefreshCw />Retry</Button> : null}
      {onClear ? <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>Clear filters</Button> : null}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-label="Loading API keys" aria-busy="true">
      <div className="hidden space-y-px p-1 lg:block">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-sm" />)}
      </div>
      <div className="divide-y lg:hidden">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-4 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-16 w-full" /></div>)}
      </div>
    </div>
  )
}

type EditorForm = {
  name: string
  group: string
  expiresAt: string
  unlimited: boolean
  quota: string
  models: string[]
  allowIps: string
  crossGroupRetry: boolean
}

function toDateTimeInput(timestamp?: number) {
  if (!timestamp || timestamp < 0) return ''
  const date = new Date(timestamp * 1000)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatKeyDate(timestamp: number | undefined, locale: AppLocale): string {
  if (timestamp == null || timestamp < 0) return '—'
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(timestamp * 1000))
}

function defaultEditorForm(token: KeyRecord | null, defaultGroup: string): EditorForm {
  return {
    name: token?.name || '',
    group: token?.group || defaultGroup || 'default',
    expiresAt: toDateTimeInput(token?.expiredTime),
    unlimited: token?.unlimitedQuota ?? false,
    quota: String(quotaUnitsToDollars(token?.remainQuota)),
    models: token?.modelLimits ? token.modelLimits.split(',').filter(Boolean) : [],
    allowIps: token?.allowIps || '',
    crossGroupRetry: token?.crossGroupRetry ?? false,
  }
}

function EditorFooter({ pending, blocked, editing, mobile = false, onClose }: { pending: boolean; blocked: boolean; editing: boolean; mobile?: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const cancel = <Button type="button" variant="outline" disabled={pending} onClick={onClose}>{t('Cancel')}</Button>
  const submit = (
    <Button type="submit" disabled={pending || blocked}>
      {pending ? <LoaderCircle className="animate-spin" /> : editing ? <Check /> : <Plus />}
      {pending ? t('Saving') : editing ? t('Save changes') : 'Create key'}
    </Button>
  )
  return (
    <>
      {mobile ? submit : cancel}
      {mobile ? cancel : submit}
    </>
  )
}

function AdaptiveEditorSurface({
  mobile,
  title,
  description,
  pending,
  blocked,
  editing,
  returnFocus,
  onClose,
  onSubmit,
  children,
}: {
  mobile: boolean
  title: string
  description: string
  pending: boolean
  blocked: boolean
  editing: boolean
  returnFocus: RefObject<HTMLElement | null>
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}) {
  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    returnFocus.current?.focus()
  }
  const changeOpen = (open: boolean) => {
    if (!open && !pending) onClose()
  }

  if (mobile) {
    return (
      <Sheet open onOpenChange={changeOpen}>
        <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
          <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={onSubmit}>
            <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{children}</div>
            <SheetFooter className="border-t">
              <EditorFooter pending={pending} blocked={blocked} editing={editing} mobile onClose={onClose} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open onOpenChange={changeOpen}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
        <form className="grid gap-5" noValidate onSubmit={onSubmit}>
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
          {children}
          <DialogFooter><EditorFooter pending={pending} blocked={blocked} editing={editing} onClose={onClose} /></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function KeyEditor({
  token,
  defaultGroup,
  returnFocus,
  onClose,
  onSaved,
}: {
  token: KeyRecord | null
  defaultGroup: string
  returnFocus: RefObject<HTMLElement | null>
  onClose: () => void
  onSaved: (result: { created: boolean; id?: number; name: string }) => void
}) {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const client = useQueryClient()
  const [form, setForm] = useState(() => defaultEditorForm(token, defaultGroup))
  const [errors, setErrors] = useState<{ name?: string; quota?: string; expiry?: string; ips?: string }>({})
  const [advanced, setAdvanced] = useState(false)
  const seeded = useRef(token == null)

  const detail = useQuery({
    queryKey: [...queryRoot, 'detail', token?.id],
    queryFn: () => projectEnvelope(
      () => getToken(token!.id),
      (data) => {
        const record = sanitizeToken(data)
        if (!record || !record.editable) throw new KeyContractError('The API key detail response cannot be edited safely.')
        return record
      },
    ),
    enabled: token != null,
    retry: false,
  })

  useEffect(() => {
    if (!detail.data || seeded.current) return
    setForm(defaultEditorForm(detail.data, defaultGroup))
    seeded.current = true
  }, [defaultGroup, detail.data])

  const groups = useQuery({
    queryKey: [...queryRoot, 'groups'],
    queryFn: () => projectEnvelope(() => getUserGroups(), safeStringList),
    retry: false,
  })
  const models = useQuery({
    queryKey: [...queryRoot, 'models', form.group],
    queryFn: () => projectEnvelope(() => getUserModels(form.group), safeStringList),
    retry: false,
  })
  const groupOptions = useMemo(() => [...new Set([form.group, ...(groups.data || [])])].filter(Boolean), [form.group, groups.data])
  const modelOptions = useMemo(() => [...new Set([...form.models, ...(models.data || [])])], [form.models, models.data])

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryRoot }),
      client.invalidateQueries({ queryKey: ['console-foundation', 'tokens'] }),
      client.invalidateQueries({ queryKey: ['tokens'] }),
    ])
  }

  const save = useMutation({
    mutationFn: async () => {
      const nextErrors: typeof errors = {}
      const name = form.name.trim()
      const quota = Number(form.quota)
      const expiry = form.expiresAt ? new Date(form.expiresAt).getTime() : -1
      const safeIps = safeIpAllowlist(form.allowIps)
      if (!name) nextErrors.name = t('Name is required')
      else if (name.length > 50) nextErrors.name = 'Use 50 characters or fewer.'
      else if (!safeLabel(name, 50)) nextErrors.name = 'Enter a name without credentials, URLs, or control characters.'
      if (!form.unlimited && (!Number.isFinite(quota) || quota < 0 || quota > 10_000_000)) nextErrors.quota = 'Quota must be between $0 and $10,000,000.'
      if (form.expiresAt && !Number.isFinite(expiry)) nextErrors.expiry = 'Enter a valid expiration date.'
      if (safeIps == null) nextErrors.ips = 'Use only IP addresses or CIDR ranges, one per line.'
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length) throw new KeyContractError('Fix the highlighted fields before saving.')

      const payload: TokenInput = {
        name,
        remain_quota: form.unlimited ? 0 : quotaDollarsToUnits(quota),
        expired_time: form.expiresAt ? Math.floor(expiry / 1000) : -1,
        unlimited_quota: form.unlimited,
        model_limits_enabled: form.models.length > 0,
        model_limits: form.models.join(','),
        allow_ips: safeIps || '',
        group: form.group,
        cross_group_retry: form.group === 'auto' && form.crossGroupRetry,
      }

      return projectEnvelope(
        () => token ? updateToken({ ...payload, id: token.id }) : createToken(payload),
        (data) => {
          const returnedId = finiteNumber(sourceObject(data)?.id)
          return { created: token == null, id: returnedId && Number.isInteger(returnedId) ? returnedId : undefined, name }
        },
      )
    },
    onSuccess: onSaved,
    onSettled: () => void invalidate(),
  })

  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const detailBlocked = token != null && (detail.isPending || detail.isError)
  const title = token ? t('Edit API key') : 'Create API key'
  const description = token ? t('Create and inspect scoped credentials. Full keys are never shown by default.') : 'Configure access, expiration, and a spending limit.'

  const fields = (
    <div className="grid gap-5">
      {token && detail.isPending ? <div aria-label="Loading API key details" className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div> : null}
      {token && detail.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(detail.error, 'Unable to load API key details.')}</div> : null}
      {!detailBlocked ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="foundation-key-name">{t('Name')}</Label>
            <Input id="foundation-key-name" autoFocus maxLength={50} placeholder="e.g. Production API" value={form.name} aria-invalid={Boolean(errors.name)} onChange={(event) => { update('name', event.target.value); setErrors((current) => ({ ...current, name: undefined })) }} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="foundation-key-permissions">Permissions</Label>
            <Select value="unavailable" disabled>
              <SelectTrigger id="foundation-key-permissions" className="w-full" aria-label="Permissions unavailable"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Access levels are not exposed by the token API.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="foundation-key-expiry">Expires</Label>
              <Input id="foundation-key-expiry" type="datetime-local" value={form.expiresAt} aria-invalid={Boolean(errors.expiry)} onChange={(event) => { update('expiresAt', event.target.value); setErrors((current) => ({ ...current, expiry: undefined })) }} />
              {errors.expiry ? <p className="text-xs text-destructive">{errors.expiry}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="foundation-key-quota">Quota (USD)</Label>
              <Input id="foundation-key-quota" type="number" min="0" max="10000000" step="0.01" disabled={form.unlimited} value={form.quota} aria-invalid={Boolean(errors.quota)} onChange={(event) => { update('quota', event.target.value); setErrors((current) => ({ ...current, quota: undefined })) }} />
              {errors.quota ? <p className="text-xs text-destructive">{errors.quota}</p> : null}
            </div>
          </div>

          <div className="border-t pt-1">
            <Button type="button" variant="ghost" className="w-full justify-between px-0 hover:bg-transparent" aria-expanded={advanced} onClick={() => setAdvanced((value) => !value)}>
              <span className="flex items-center gap-2"><Settings2 />Advanced settings</span>
              <ChevronDown className={advanced ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </Button>
            {advanced ? (
              <div className="grid gap-5 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="foundation-key-group">{t('Group')}</Label>
                    <Select value={form.group} onValueChange={(value) => update('group', value)}>
                      <SelectTrigger id="foundation-key-group" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{groupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent>
                    </Select>
                    {groups.isError ? <p role="status" className="text-xs text-muted-foreground">Group options are unavailable; the current value is preserved.</p> : null}
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                    <div><Label htmlFor="foundation-key-unlimited">{t('Unlimited quota')}</Label><p className="text-xs text-muted-foreground">No spending limit</p></div>
                    <Switch id="foundation-key-unlimited" checked={form.unlimited} onCheckedChange={(checked) => update('unlimited', checked)} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div><p className="text-sm font-medium">{t('Allowed models')}</p><p className="text-xs text-muted-foreground">{t('Limit models and source addresses')}</p></div>
                  {models.isPending ? <Skeleton className="h-16 w-full" /> : modelOptions.length ? (
                    <div className="grid max-h-32 gap-2 overflow-y-auto sm:grid-cols-2">
                      {modelOptions.map((model) => <label key={model} className="flex min-w-0 items-center gap-2 text-sm"><Checkbox checked={form.models.includes(model)} onCheckedChange={(checked) => update('models', checked ? [...form.models, model] : form.models.filter((value) => value !== model))} /><span className="truncate">{model}</span></label>)}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">{t('No model restrictions available')}</p>}
                  {models.isError ? <p role="status" className="text-xs text-muted-foreground">Model options are unavailable; existing restrictions are preserved.</p> : null}
                  {form.models.length ? <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => update('models', [])}>{t('Allow all')}</Button> : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="foundation-key-ips">{t('IP allowlist')}</Label>
                  <Textarea id="foundation-key-ips" rows={3} value={form.allowIps} placeholder={t('One IP or CIDR per line; leave empty to allow all')} aria-invalid={Boolean(errors.ips)} onChange={(event) => { update('allowIps', event.target.value); setErrors((current) => ({ ...current, ips: undefined })) }} />
                  {errors.ips ? <p className="text-xs text-destructive">{errors.ips}</p> : null}
                </div>

                {form.group === 'auto' ? <div className="flex items-center justify-between gap-4"><Label htmlFor="foundation-key-cross-retry">{t('Cross-group retry')}</Label><Switch id="foundation-key-cross-retry" checked={form.crossGroupRetry} onCheckedChange={(checked) => update('crossGroupRetry', checked)} /></div> : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      {save.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(save.error, t('Unable to save key'))}</div> : null}
    </div>
  )

  return (
    <AdaptiveEditorSurface
      mobile={isMobile}
      title={title}
      description={description}
      pending={save.isPending}
      blocked={detailBlocked}
      editing={token != null}
      returnFocus={returnFocus}
      onClose={onClose}
      onSubmit={(event) => { event.preventDefault(); save.mutate() }}
    >
      {fields}
    </AdaptiveEditorSurface>
  )
}

function KeyActions({
  apiKey,
  busy,
  selected,
  onSelection,
  onEdit,
  onReveal,
  onToggle,
  onDelete,
}: {
  apiKey: KeyRecord
  busy: boolean
  selected: boolean
  onSelection: () => void
  onEdit: (trigger: HTMLButtonElement) => void
  onReveal: (trigger: HTMLButtonElement) => void
  onToggle: (trigger: HTMLButtonElement) => void
  onDelete: (trigger: HTMLButtonElement) => void
}) {
  const { t } = useTranslation()
  const trigger = useRef<HTMLButtonElement>(null)
  const defer = (action: (trigger: HTMLButtonElement) => void) => window.setTimeout(() => trigger.current && action(trigger.current), 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button ref={trigger} variant="ghost" size="icon" className="size-8" aria-label={`${t('Actions')} ${apiKey.name}`}><Ellipsis /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>API key</DropdownMenuLabel>
        <DropdownMenuItem disabled={!apiKey.maskedKey} onSelect={() => apiKey.maskedKey && void navigator.clipboard.writeText(apiKey.maskedKey)}><Copy />Copy prefix</DropdownMenuItem>
        <DropdownMenuItem disabled={busy || !apiKey.editable} onSelect={() => defer(onEdit)}><Pencil />{t('Edit')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={() => defer(onReveal)}><Eye />{t('Reveal')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy || apiKey.status == null || (apiKey.status !== 1 && apiKey.status !== 2)} onSelect={() => defer(onToggle)}><ShieldCheck />{apiKey.status === 1 ? t('Disable') : t('Enable')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={onSelection}><Check />{selected ? 'Remove from selection' : 'Select for batch'}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={busy} variant="destructive" onSelect={() => defer(onDelete)}><Trash2 />{t('Delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function safeCopy(value: string, onCopied: (copied: boolean) => void) {
  void navigator.clipboard.writeText(value).then(() => onCopied(true), () => onCopied(false))
}

export function ConsoleFoundationKeysPage() {
  const { t } = useTranslation()
  const locale = usePageLocale()
  const client = useQueryClient()
  const user = useSessionStore((state) => state.user)
  const [search, setSearch] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchBlocked, setSearchBlocked] = useState(false)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [editing, setEditing] = useState<KeyRecord | null | undefined>(undefined)
  const [revealTarget, setRevealTarget] = useState<KeyRecord | null>(null)
  const [statusTarget, setStatusTarget] = useState<KeyRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KeyRecord | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const createTrigger = useRef<HTMLButtonElement>(null)
  const batchTrigger = useRef<HTMLButtonElement>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const projected = projectSearch(search)
      setSearchBlocked(projected.blocked)
      if (!projected.blocked) {
        setKeyword(projected.value)
        setPage(1)
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const list = useQuery({ queryKey: [...queryRoot, 'list', keyword], queryFn: () => fetchKeys(keyword), retry: false })
  const allRecords = list.data?.records || []
  const filtered = useMemo(() => status === 'all' ? allRecords : allRecords.filter((record) => record.status === Number(status)), [allRecords, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allVisibleSelected = visible.length > 0 && visible.every((record) => selected.includes(record.id))
  const hasPartial = Boolean(list.data && (list.data.invalidCount > 0 || list.data.records.some((record) => record.partial) || list.data.truncated || (!list.data.truncated && list.data.records.length !== list.data.reportedTotal)))
  const contractBlocked = Boolean(list.data && list.data.reportedTotal > 0 && list.data.records.length === 0)
  const hasFilters = Boolean(search.trim()) || status !== 'all'

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  useEffect(() => {
    const available = new Set(allRecords.map((record) => record.id))
    setSelected((current) => current.filter((id) => available.has(id)))
  }, [allRecords])

  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryRoot }),
      client.invalidateQueries({ queryKey: ['console-foundation', 'tokens'] }),
      client.invalidateQueries({ queryKey: ['tokens'] }),
    ])
  }
  const mutationSettled = () => void invalidate()

  const toggle = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: number }) => projectEnvelope(() => updateTokenStatus(id, nextStatus), () => undefined),
    onSuccess: (_, variables) => {
      setStatusTarget(null)
      setNotice(variables.nextStatus === 1 ? 'API key enabled.' : 'API key disabled.')
    },
    onSettled: mutationSettled,
  })
  const remove = useMutation({
    mutationFn: (id: number) => projectEnvelope(() => deleteToken(id), () => undefined),
    onSuccess: () => { setDeleteTarget(null); setNotice('API key deleted.') },
    onSettled: mutationSettled,
  })
  const batchRemove = useMutation({
    mutationFn: (ids: number[]) => {
      if (!ids.length || ids.length > maxBatchSize) return Promise.reject(new KeyContractError(`Batch deletion supports 1 to ${maxBatchSize} keys.`))
      return projectEnvelope(
        () => deleteTokens(ids),
        (data) => {
          const deleted = finiteNumber(data)
          if (deleted == null || !Number.isInteger(deleted) || deleted < 0 || deleted > ids.length) throw new KeyContractError('The batch deletion response has no valid deleted count.')
          return { deleted, requested: ids.length }
        },
      )
    },
    onSuccess: ({ deleted, requested }) => {
      setBatchOpen(false)
      if (deleted === requested) setSelected([])
      setNotice(deleted === requested ? 'Selected API keys deleted.' : `The server deleted ${deleted} of ${requested} selected API keys.`)
    },
    onSettled: mutationSettled,
  })
  const reveal = useMutation({
    mutationFn: (id: number) => projectEnvelope(
      () => revealToken(id),
      (data) => {
        const key = sourceObject(data)?.key
        if (typeof key !== 'string' || key.length < 8 || key.length > 512 || /[\u0000-\u001f\u007f]/.test(key)) throw new KeyContractError('The reveal response did not include a valid key.')
        if (mounted.current) setSecret(key)
      },
    ),
    gcTime: 0,
  })

  const clearFilters = () => {
    setSearch('')
    setKeyword('')
    setSearchBlocked(false)
    setStatus('all')
    setPage(1)
  }
  const closeReveal = () => { setRevealTarget(null); setSecret(null); setCopied(false); reveal.reset() }
  const openReveal = (record: KeyRecord, trigger: HTMLElement) => { returnFocus.current = trigger; setSecret(null); setCopied(false); reveal.reset(); setRevealTarget(record) }
  const openEdit = (record: KeyRecord | null, trigger: HTMLElement) => { returnFocus.current = trigger; setEditing(record) }
  const openStatus = (record: KeyRecord, trigger: HTMLElement) => { returnFocus.current = trigger; toggle.reset(); setStatusTarget(record) }
  const openDelete = (record: KeyRecord, trigger: HTMLElement) => { returnFocus.current = trigger; remove.reset(); setDeleteTarget(record) }
  const busyId = toggle.isPending ? toggle.variables?.id : remove.isPending ? remove.variables : undefined
  const emptyFiltered = !list.isPending && !list.isError && !contractBlocked && filtered.length === 0
  const selectRecords = (records: KeyRecord[]) => setSelected((current) => [...new Set([...current, ...records.map((record) => record.id)])].slice(0, maxBatchSize))
  const keyActions = (record: KeyRecord) => (
    <KeyActions
      apiKey={record}
      busy={busyId === record.id}
      selected={selected.includes(record.id)}
      onSelection={() => setSelected((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id].slice(0, maxBatchSize))}
      onEdit={(trigger) => openEdit(record, trigger)}
      onReveal={(trigger) => openReveal(record, trigger)}
      onToggle={(trigger) => openStatus(record, trigger)}
      onDelete={(trigger) => openDelete(record, trigger)}
    />
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 id="console-foundation-title" className="text-2xl font-bold tracking-tight">{t('API keys')}</h1>
          <p className="text-muted-foreground">{locale === 'en' ? 'Create scoped credentials and control access to the Partokens API.' : t('Create and inspect scoped credentials. Full keys are never shown by default.')}</p>
        </div>
        <Button ref={createTrigger} onClick={() => createTrigger.current && openEdit(null, createTrigger.current)}><Plus />{locale === 'en' ? 'Create key' : t('Create a key')}</Button>
      </header>

      {notice ? <div role="status" className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm"><span>{notice}</span><Button variant="ghost" size="sm" onClick={() => setNotice(null)}>Close</Button></div> : null}
      {hasPartial ? <div role="status" className="flex gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>Some API key records or fields are unavailable. Usable records remain visible; incomplete values are not inferred.</span></div> : null}

      <section aria-label="API key filters" className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 lg:max-w-sm">
          <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or prefix..." aria-label="Search API keys" aria-invalid={searchBlocked} className="ps-9" /></div>
          {searchBlocked ? <p role="alert" className="mt-1 text-xs text-destructive">Credentials and URLs cannot be used as search terms.</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('All statuses')}</SelectItem><SelectItem value="1">{t('Enabled')}</SelectItem><SelectItem value="2">{t('Disabled')}</SelectItem><SelectItem value="3">Expired</SelectItem><SelectItem value="4">Exhausted</SelectItem></SelectContent>
          </Select>
          <Select value="unavailable" disabled>
            <SelectTrigger className="w-full sm:w-44" aria-label="Permission filter unavailable"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="unavailable">Permissions unavailable</SelectItem></SelectContent>
          </Select>
        </div>
        {hasFilters ? <Button variant="ghost" size="sm" className="self-start lg:self-auto" onClick={clearFilters}>Clear</Button> : null}
      </section>

      {selected.length ? <div className="flex min-h-12 flex-col gap-3 rounded-md border bg-muted/20 px-4 py-2 sm:flex-row sm:items-center"><span className="text-sm">{t('Selected')}: {selected.length} / {maxBatchSize}</span><Button ref={batchTrigger} variant="destructive" size="sm" className="sm:ms-auto" onClick={() => { returnFocus.current = batchTrigger.current; setBatchOpen(true); batchRemove.reset() }}><Trash2 />{t('Delete selected')}</Button></div> : null}

      <section aria-label="API keys" className="overflow-hidden rounded-md border">
        {list.isPending ? <ListSkeleton /> : list.isError ? <StatePanel kind="error" message={errorMessage(list.error, 'Unable to load API keys.')} onRetry={() => void list.refetch()} /> : contractBlocked ? <StatePanel kind="contract" message="Returned records do not expose a usable numeric id and safe name." /> : emptyFiltered ? <StatePanel kind="empty" message={hasFilters ? 'Try a different search term or clear the current filters.' : 'Create a key to authenticate your first API request.'} onClear={hasFilters ? clearFilters : undefined} /> : (
          <>
            <div className="hidden lg:block">
              <Table className={selected.length ? 'min-w-[1040px]' : 'min-w-[980px]'}>
                <TableHeader><TableRow className="hover:bg-transparent">
                  {selected.length ? <TableHead className="w-10 ps-4"><Checkbox aria-label={t('Select page')} checked={allVisibleSelected} disabled={!allVisibleSelected && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked ? selectRecords(visible) : setSelected((current) => current.filter((id) => !visible.some((record) => record.id === id)))} /></TableHead> : null}
                  <TableHead className={selected.length ? undefined : 'ps-4'}>{t('Name')}</TableHead><TableHead>Prefix</TableHead><TableHead>Permissions</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Quota')}</TableHead><TableHead>Created</TableHead><TableHead>{t('Last used')}</TableHead><TableHead>Expires</TableHead><TableHead><span className="sr-only">{t('Actions')}</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>{visible.map((record) => (
                  <TableRow key={record.id}>
                    {selected.length ? <TableCell className="ps-4"><Checkbox aria-label={`${t('Select')} ${record.name}`} checked={selected.includes(record.id)} disabled={!selected.includes(record.id) && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked ? selectRecords([record]) : setSelected((current) => current.filter((id) => id !== record.id))} /></TableCell> : null}
                    <TableCell className={`max-w-48 font-medium ${selected.length ? '' : 'ps-4'}`}><span className="block truncate" title={record.name}>{record.name}</span></TableCell>
                    <TableCell><code className="font-mono text-xs text-muted-foreground">{record.maskedKey || 'Unavailable'}</code></TableCell>
                    <TableCell><PermissionBadge /></TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell className="font-mono text-xs">{record.unlimitedQuota ? t('Unlimited') : formatQuota(record.remainQuota, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatKeyDate(record.createdTime, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatKeyDate(record.accessedTime, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{record.expiredTime === -1 ? 'Never' : formatKeyDate(record.expiredTime, locale)}</TableCell>
                    <TableCell className="pe-3 text-end">{keyActions(record)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>

            <div className="divide-y lg:hidden">{visible.map((record) => (
              <article key={record.id} className="space-y-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  {selected.length ? <Checkbox className="mt-1" aria-label={`${t('Select')} ${record.name}`} checked={selected.includes(record.id)} disabled={!selected.includes(record.id) && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked ? selectRecords([record]) : setSelected((current) => current.filter((id) => id !== record.id))} /> : null}
                  <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-medium">{record.name}</h2><code className="mt-1 block truncate font-mono text-xs text-muted-foreground">{record.maskedKey || 'Unavailable'}</code></div>
                  {keyActions(record)}
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={record.status} /><PermissionBadge /></div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Quota')}</dt><dd className="mt-1 truncate font-mono text-xs">{record.unlimitedQuota ? t('Unlimited') : formatQuota(record.remainQuota, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 truncate">{formatKeyDate(record.createdTime, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Last used')}</dt><dd className="mt-1 truncate">{formatKeyDate(record.accessedTime, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">Expires</dt><dd className="mt-1 truncate">{record.expiredTime === -1 ? 'Never' : formatKeyDate(record.expiredTime, locale)}</dd></div>
                </dl>
              </article>
            ))}</div>
          </>
        )}

        {!list.isPending && !list.isError && !contractBlocked ? <footer className="flex min-h-12 items-center justify-between gap-4 border-t px-4 py-2 text-sm text-muted-foreground"><span>{filtered.length} of {list.data?.reportedTotal ?? filtered.length} keys</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('Previous')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>{t('Next')}</Button></div></footer> : null}
      </section>

      {editing !== undefined ? <KeyEditor token={editing} defaultGroup={safeLabel(user?.group, 64) || 'default'} returnFocus={returnFocus} onClose={() => setEditing(undefined)} onSaved={(result) => {
        setEditing(undefined)
        setNotice(result.created ? result.id ? 'API key created. Confirm reveal before leaving this session if you need the full value.' : 'API key created. The server did not return its id; reveal it from the refreshed list.' : 'API key updated.')
        if (result.created && result.id) setRevealTarget({ id: result.id, name: result.name, maskedKey: null, partial: true, editable: false })
      }} /> : null}

      <Dialog open={revealTarget != null} onOpenChange={(open) => !open && closeReveal()}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{secret ? t('Key revealed') : t('Reveal full key?')}</DialogTitle><DialogDescription>{secret ? t('Close this window when you have stored the key securely.') : t('Anyone with this value can use your quota. Confirm that nobody else can see your screen.')}</DialogDescription></DialogHeader>
          {secret ? <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-md border bg-muted/40 p-3"><code className="min-w-0 break-all font-mono text-xs">{secret}</code><Button variant="outline" size="icon" aria-label={t('Copy')} onClick={() => safeCopy(secret, setCopied)}>{copied ? <Check /> : <Copy />}</Button></div> : null}
          {secret ? <div className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>Store it in a secret manager. Do not commit it to source control.</p></div> : null}
          {reveal.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(reveal.error, t('Unable to reveal key'))}</div> : null}
          <DialogFooter><Button variant="outline" onClick={closeReveal}>{t('Close')}</Button>{!secret ? <Button disabled={reveal.isPending} onClick={() => revealTarget && reveal.mutate(revealTarget.id)}>{reveal.isPending ? <LoaderCircle className="animate-spin" /> : <Eye />}{reveal.isPending ? t('Loading') : t('Confirm reveal')}</Button> : null}</DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusTarget != null} onOpenChange={(open) => !open && !toggle.isPending && setStatusTarget(null)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{statusTarget?.status === 1 ? 'Disable this API key?' : 'Enable this API key?'}</DialogTitle><DialogDescription>{statusTarget?.status === 1 ? `Requests using ${statusTarget?.name || 'this key'} will fail until the key is enabled again.` : `${statusTarget?.name || 'This key'} will be allowed to make requests again if its quota and expiration permit it.`}</DialogDescription></DialogHeader>
          {toggle.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(toggle.error, t('Unable to update key status'))}</div> : null}
          <DialogFooter><Button variant="outline" disabled={toggle.isPending} onClick={() => setStatusTarget(null)}>{t('Cancel')}</Button><Button disabled={toggle.isPending} onClick={() => statusTarget && toggle.mutate({ id: statusTarget.id, nextStatus: statusTarget.status === 1 ? 2 : 1 })}>{toggle.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}{statusTarget?.status === 1 ? 'Disable key' : 'Enable key'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && !remove.isPending && setDeleteTarget(null)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{t('Delete this key?')}</DialogTitle><DialogDescription>{deleteTarget?.name}. This action cannot be undone.</DialogDescription></DialogHeader>
          {remove.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(remove.error, 'Unable to delete API key.')}</div> : null}
          <DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleteTarget(null)}>{t('Cancel')}</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>{remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{t('Delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={(open) => !open && !batchRemove.isPending && setBatchOpen(false)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{t('Delete selected keys?')}</DialogTitle><DialogDescription>{selected.length} selected API keys will be permanently removed.</DialogDescription></DialogHeader>
          {batchRemove.isError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage(batchRemove.error, 'Unable to delete selected API keys.')}</div> : null}
          <DialogFooter><Button variant="outline" disabled={batchRemove.isPending} onClick={() => setBatchOpen(false)}>{t('Cancel')}</Button><Button variant="destructive" disabled={batchRemove.isPending} onClick={() => batchRemove.mutate(selected)}>{batchRemove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{t('Delete selected')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
