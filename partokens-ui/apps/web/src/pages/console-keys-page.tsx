import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Copy,
  Ellipsis,
  Eye,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Badge,
  Button,
  Calendar,
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
  Popover,
  PopoverAnchor,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
  useSidebar,
} from '@partokens/design-system/components'
import {
  createToken,
  deleteToken,
  deleteTokens,
  getToken,
  getTokens,
  getUserGroupsWithSignal,
  revealToken,
  searchTokens,
  updateToken,
  updateTokenStatus,
  type ApiEnvelope,
  type TokenInput,
} from '@partokens/api-client'
import { isAppLocale, type AppLocale } from '@partokens/i18n'

import {
  asConsoleRequestError,
  ConsoleContractError,
  consoleErrorMessage,
  consoleErrorStatus,
  consoleQueryKeys,
  invalidateConsoleQueries,
} from '@/lib/console-query'
import { formatQuota, quotaDollarsToUnits, quotaUnitsToDollars } from '@/lib/format'
import { useSessionStore } from '@/stores/session'

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

type GroupOption = {
  name: string
  ratio?: number | string
}

class KeyContractError extends ConsoleContractError {
  constructor(message: string) {
    super(message)
    this.name = 'KeyContractError'
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

function withApiKeyPrefix(value: string): string {
  return value.startsWith('sk-') ? value : `sk-${value}`
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

async function projectEnvelope<T>(request: () => Promise<ApiEnvelope<unknown>>, project: (data: unknown) => T): Promise<T> {
  try {
    const response = await request()
    if (!response || response.success !== true) throw asConsoleRequestError(null, 'The API key request failed.')
    return project(response.data)
  } catch (error) {
    throw asConsoleRequestError(error, 'The API key request failed.')
  }
}

function projectRevealedKey(data: unknown): string {
  const key = sourceObject(data)?.key
  if (typeof key !== 'string' || key.length < 8 || key.length > 512 || /[\u0000-\u001f\u007f]/.test(key)) {
    throw new KeyContractError('The reveal response did not include a valid key.')
  }
  return withApiKeyPrefix(key)
}

function fetchRevealedKey(id: number): Promise<string> {
  return projectEnvelope(() => revealToken(id), projectRevealedKey)
}

function supportsDeferredClipboardWrite(): boolean {
  return typeof ClipboardItem !== 'undefined'
    && typeof navigator !== 'undefined'
    && typeof navigator.clipboard?.write === 'function'
}

function copyRevealedKey(id: number): Promise<void> {
  const key = fetchRevealedKey(id)
  const item = new ClipboardItem({
    'text/plain': key.then((value) => new Blob([value], { type: 'text/plain' })),
  })
  return navigator.clipboard.write([item])
}

function errorMessage(error: unknown, fallbackKey: string, t: TFunction): string {
  const status = consoleErrorStatus(error)
  const fallback = t(fallbackKey)
  if (status === 401) return t('Your session expired. Sign in again.')
  if (status === 403) return t('Your account cannot manage API keys.')
  if (status === 404) return fallbackKey === 'Unable to load API keys.'
    ? t('The API key list is unavailable.')
    : t('This API key does not exist or is not visible to your account.')
  return consoleErrorMessage(error, {
    authentication: t('Your session expired. Sign in again.'),
    authorization: t('Your account cannot manage API keys.'),
    availability: fallback,
  })
}

function parsePage(data: unknown) {
  const source = sourceObject(data)
  if (!source) throw new KeyContractError('The API key list response has no paginated data.')
  if (!Array.isArray(source.items)) throw new KeyContractError('The API key list response has no items array.')
  const total = nonNegativeNumber(source.total)
  if (total == null || !Number.isInteger(total)) throw new KeyContractError('The API key list response has no valid total.')
  return { items: source.items, total }
}

async function fetchPage(keyword: string, page: number, signal?: AbortSignal) {
  return projectEnvelope(
    () => keyword
      ? searchTokens({ keyword, p: page, size: requestPageSize }, signal)
      : getTokens({ p: page, size: requestPageSize }, signal),
    parsePage,
  )
}

async function fetchKeys(keyword: string, signal?: AbortSignal): Promise<KeyListResult> {
  const first = await fetchPage(keyword, 1, signal)
  const reportedPages = Math.ceil(first.total / requestPageSize)
  const pages = Math.min(Math.max(1, reportedPages), maxTokenPages)
  const rawItems = [...first.items]
  for (let page = 2; page <= pages; page += 1) {
    const next = await fetchPage(keyword, page, signal)
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

function safeGroupOptions(input: unknown): GroupOption[] {
  const source = sourceObject(input)
  const entries = Array.isArray(input)
    ? input.map((name) => [name, undefined] as const)
    : source
      ? Object.entries(source)
      : null
  if (!entries) throw new KeyContractError('The supporting options response is incomplete.')

  const groups = new Map<string, GroupOption>()
  for (const [rawName, rawGroup] of entries) {
    const name = safeLabel(rawName, 64)
    if (!name || groups.has(name)) continue
    const rawRatio = sourceObject(rawGroup)?.ratio
    const numericRatio = nonNegativeNumber(rawRatio)
    const stringRatio = safeLabel(rawRatio, 32)
    groups.set(name, {
      name,
      ...(numericRatio != null ? { ratio: numericRatio } : stringRatio ? { ratio: stringRatio } : {}),
    })
    if (groups.size >= 500) break
  }
  if (entries.length > 0 && groups.size === 0) throw new KeyContractError('The supporting options response has no safe labels.')
  return [...groups.values()]
}

function projectSearch(value: string): { blocked: boolean; value: string } {
  const keyword = value.trim()
  if (!keyword) return { blocked: false, value: '' }
  if (keyword.length > 64 || /[\u0000-\u001f\u007f]/.test(keyword) || sensitiveShape(keyword)) return { blocked: true, value: '' }
  return { blocked: false, value: keyword }
}

function statusLabel(status: number | undefined, t: TFunction) {
  if (status === 1) return t('Enabled')
  if (status === 2) return t('Disabled')
  if (status === 3) return t('Expired')
  if (status === 4) return t('Exhausted')
  return t('Unavailable')
}

function StatusBadge({ status }: { status?: number }) {
  const { t } = useTranslation()
  if (status === 1) return <Badge>{statusLabel(status, t)}</Badge>
  if (status === 3 || status === 4) return <Badge variant="destructive">{statusLabel(status, t)}</Badge>
  return <Badge variant="secondary">{statusLabel(status, t)}</Badge>
}

function GroupValue({ group, ratio }: { group?: string; ratio?: number | string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate" title={group || undefined}>{group || '—'}</span>
      {ratio != null ? (
        <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
          {typeof ratio === 'number' ? `${ratio}x ${t('Ratio')}` : `${t('Automatic')} ${t('Ratio')}`}
        </Badge>
      ) : null}
    </div>
  )
}

function StatePanel({ kind, message, onRetry, onClear }: { kind: 'error' | 'empty' | 'contract'; message: string; onRetry?: () => void; onClear?: () => void }) {
  const { t } = useTranslation()
  const filtered = kind === 'empty' && Boolean(onClear)
  return (
    <div role={kind === 'empty' ? undefined : 'alert'} className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40">
        {kind === 'empty' ? <KeyRound className="size-5 text-muted-foreground" /> : <AlertTriangle className="size-5 text-destructive" />}
      </div>
      <h2 className="text-sm font-semibold">{kind === 'empty' ? filtered ? t('No matching API keys') : t('No API keys yet') : kind === 'contract' ? t('API key contract is incomplete') : t('API keys are unavailable')}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}><RefreshCw />{t('Retry')}</Button> : null}
      {onClear ? <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>{t('Clear filters')}</Button> : null}
    </div>
  )
}

function ListSkeleton() {
  const { t } = useTranslation()
  return (
    <div aria-label={t('Loading API keys')} aria-busy="true">
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
  expiration: '1' | '7' | '30' | 'never' | 'custom'
  expiresAt: string
  quota: string
  models: string[]
  allowIps: string
  crossGroupRetry: boolean
}

type EditorErrors = {
  name?: string
  group?: string
  quota?: string
  expiry?: string
}

function toDateInput(timestamp?: number) {
  if (!timestamp || timestamp < 0) return ''
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInput(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day, 12)
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : undefined
}

function dateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function expirationAtEndOfDay(value: string): number {
  const date = parseDateInput(value)
  if (!date) return Number.NaN
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime()
}

function formatKeyDate(timestamp: number | undefined, locale: AppLocale): string {
  if (timestamp == null || timestamp < 0) return '—'
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(timestamp * 1000))
}

function formatCustomExpiration(value: string, locale: AppLocale): string | null {
  const date = parseDateInput(value)
  return date ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date) : null
}

function defaultEditorForm(token: KeyRecord | null, defaultGroup: string): EditorForm {
  const group = token?.group || defaultGroup
  const quota = token?.unlimitedQuota ? 0 : quotaUnitsToDollars(token?.remainQuota)
  return {
    name: token?.name || '',
    group: group && group !== 'default' ? group : '',
    expiration: token == null || token.expiredTime === -1 ? 'never' : 'custom',
    expiresAt: toDateInput(token?.expiredTime),
    quota: quota === 0 ? '' : String(quota),
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
      {pending ? t('Saving') : editing ? t('Save changes') : t('Create key')}
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
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-visible sm:max-w-xl" onCloseAutoFocus={closeAutoFocus}>
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
  groups,
  groupsUnavailable,
  returnFocus,
  onClose,
  onSaved,
}: {
  token: KeyRecord | null
  defaultGroup: string
  groups: GroupOption[]
  groupsUnavailable: boolean
  returnFocus: RefObject<HTMLElement | null>
  onClose: () => void
  onSaved: (result: { created: boolean; id?: number; name: string }) => void
}) {
  const { t } = useTranslation()
  const locale = usePageLocale()
  const { isMobile } = useSidebar()
  const client = useQueryClient()
  const [form, setForm] = useState(() => defaultEditorForm(token, defaultGroup))
  const [errors, setErrors] = useState<EditorErrors>({})
  const [customExpiryOpen, setCustomExpiryOpen] = useState(false)
  const customExpiryRequested = useRef(false)
  const customExpiryOpening = useRef(false)
  const editorFieldsRef = useRef<HTMLDivElement>(null)
  const seeded = useRef(token == null)

  const detail = useQuery({
    queryKey: consoleQueryKeys.apiKeys.detail(token?.id),
    queryFn: ({ signal }) => projectEnvelope(
      () => getToken(token!.id, signal),
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

  const groupOptions = useMemo(() => {
    const options = new Map(groups.filter((group) => group.name !== 'default').map((group) => [group.name, group]))
    if (form.group && form.group !== 'default' && !options.has(form.group)) options.set(form.group, { name: form.group })
    return [...options.values()]
  }, [form.group, groups])
  const selectedGroup = groupOptions.find((group) => group.name === form.group)

  const invalidate = async () => {
    await invalidateConsoleQueries(client, consoleQueryKeys.apiKeys.all, consoleQueryKeys.overview.tokens())
  }

  const save = useMutation({
    mutationFn: async () => {
      const nextErrors: typeof errors = {}
      const name = form.name.trim()
      const quota = form.quota.trim() === '' ? 0 : Number(form.quota)
      const customExpiry = form.expiration === 'custom' ? expirationAtEndOfDay(form.expiresAt) : -1
      if (!name) nextErrors.name = t('Name is required')
      else if (name.length > 50) nextErrors.name = t('Use 50 characters or fewer.')
      else if (!safeLabel(name, 50)) nextErrors.name = t('Enter a name without credentials, URLs, or control characters.')
      if (!form.group || form.group === 'default') nextErrors.group = t('Select a group')
      if (!Number.isFinite(quota) || quota < 0 || quota > 10_000_000) nextErrors.quota = t('Quota must be between $0 and $10,000,000.')
      if (form.expiration === 'custom' && (!form.expiresAt || !Number.isFinite(customExpiry))) nextErrors.expiry = t('Enter a valid expiration date.')
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length) throw new KeyContractError(t('Fix the highlighted fields before saving.'))

      const presetDays = form.expiration === 'never' || form.expiration === 'custom' ? 0 : Number(form.expiration)
      const expiredTime = form.expiration === 'never'
        ? -1
        : form.expiration === 'custom'
          ? Math.floor(customExpiry / 1000)
          : Math.floor(Date.now() / 1000) + presetDays * 86_400
      const unlimitedQuota = quota === 0
      const payload: TokenInput = {
        name,
        remain_quota: unlimitedQuota ? 0 : quotaDollarsToUnits(quota),
        expired_time: expiredTime,
        unlimited_quota: unlimitedQuota,
        model_limits_enabled: form.models.length > 0,
        model_limits: form.models.join(','),
        allow_ips: form.allowIps,
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
    onSuccess: async (result) => {
      await invalidate()
      onSaved(result)
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Unable to save key', t), { duration: 6000 })
    },
  })

  useEffect(() => {
    if (detail.isError) toast.error(errorMessage(detail.error, 'Unable to load API key details.', t), { duration: 6000 })
  }, [detail.error, detail.isError, t])

  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => setForm((current) => ({ ...current, [key]: value }))
  const requestCustomExpiryCalendar = () => {
    customExpiryRequested.current = true
  }
  const openCustomExpiryCalendar = () => {
    customExpiryOpening.current = true
    setCustomExpiryOpen(true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => { customExpiryOpening.current = false })
    })
  }
  const changeCustomExpiryOpen = (open: boolean) => {
    if (!open && customExpiryOpening.current) return
    setCustomExpiryOpen(open)
  }
  const finishExpirationMenuClose = (event: Event) => {
    if (!customExpiryRequested.current) return
    event.preventDefault()
    customExpiryRequested.current = false
    window.setTimeout(openCustomExpiryCalendar, 0)
  }
  const selectExpiration = (value: string) => {
    setErrors((current) => ({ ...current, expiry: undefined }))
    if (value === 'custom') {
      requestCustomExpiryCalendar()
      return
    }
    setCustomExpiryOpen(false)
    update('expiration', value as EditorForm['expiration'])
  }
  const selectedCustomDate = parseDateInput(form.expiresAt)
  const today = new Date()
  const calendarStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const calendarEnd = new Date(today.getFullYear() + 10, 11, 31)
  const detailBlocked = token != null && (detail.isPending || detail.isError)
  const title = token ? t('Edit API key') : t('Create API key')
  const description = token ? t('Create and inspect scoped credentials. Full keys are never shown by default.') : t('Configure access, expiration, and a spending limit.')

  const fields = (
    <div ref={editorFieldsRef} className="grid gap-5">
      {token && detail.isPending ? <div aria-label={t('Loading API key details')} className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div> : null}
      {!detailBlocked ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="console-key-name">{t('Name')}</Label>
            <Input id="console-key-name" autoFocus maxLength={50} placeholder={t('e.g. Production API')} value={form.name} aria-invalid={Boolean(errors.name)} onChange={(event) => { update('name', event.target.value); setErrors((current) => ({ ...current, name: undefined })) }} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="console-key-group">{t('Group')}</Label>
            <Select value={form.group} onValueChange={(value) => { update('group', value); setErrors((current) => ({ ...current, group: undefined })) }}>
              <SelectTrigger id="console-key-group" className="w-full" aria-invalid={Boolean(errors.group)}>
                <SelectValue placeholder={t('Select a group')}>
                  {selectedGroup ? <GroupValue group={selectedGroup.name} ratio={selectedGroup.ratio} /> : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-popover shadow-lg">
                {groupOptions.map((group) => (
                  <SelectItem key={group.name} value={group.name} className="min-h-9">
                    <GroupValue group={group.name} ratio={group.ratio} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.group ? <p className="text-xs text-destructive">{errors.group}</p> : null}
            {groupsUnavailable ? <p role="status" className="text-xs text-muted-foreground">{t('Group options are unavailable; the current value is preserved.')}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor="console-key-quota">{t('Quota limit')}</Label>
              <Input
                id="console-key-quota"
                type="number"
                min="0"
                max="10000000"
                step="0.01"
                placeholder={t('Unlimited')}
                value={form.quota}
                aria-invalid={Boolean(errors.quota)}
                onBlur={() => { if (Number(form.quota) === 0) update('quota', '') }}
                onChange={(event) => { update('quota', event.target.value); setErrors((current) => ({ ...current, quota: undefined })) }}
              />
              {errors.quota ? <p className="text-xs text-destructive">{errors.quota}</p> : null}
            </div>

            <div className="grid content-start gap-2">
              <Label htmlFor="console-key-expiration">{t('Expiration time')}</Label>
              <Popover open={customExpiryOpen} onOpenChange={changeCustomExpiryOpen}>
                <PopoverAnchor asChild>
                  <div>
                    <Select value={form.expiration} onValueChange={selectExpiration}>
                      <SelectTrigger id="console-key-expiration" className="w-full bg-background dark:bg-input/30" aria-invalid={Boolean(errors.expiry)}>
                        <SelectValue>{form.expiration === 'custom' ? <><CalendarDays />{formatCustomExpiration(form.expiresAt, locale) || t('Custom time')}</> : undefined}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover shadow-lg" onCloseAutoFocus={finishExpirationMenuClose}>
                        <SelectItem value="never" className="min-h-9">{t('No expiration')}</SelectItem>
                        <SelectItem value="1" className="min-h-9">{t('1 day')}</SelectItem>
                        <SelectItem value="7" className="min-h-9">{t('7 days')}</SelectItem>
                        <SelectItem value="30" className="min-h-9">{t('30 days')}</SelectItem>
                        <SelectSeparator />
                        <SelectItem value="custom" className="min-h-9" onPointerDownCapture={requestCustomExpiryCalendar} onKeyDownCapture={(event) => { if (event.key === 'Enter' || event.key === ' ') requestCustomExpiryCalendar() }}><CalendarDays />{t('Custom time')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  container={editorFieldsRef.current}
                  className="w-auto max-w-[calc(100vw-2rem)] p-0"
                  aria-label={t('Custom time')}
                  onEscapeKeyDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setCustomExpiryOpen(false)
                  }}
                >
                  <div data-custom-expiration-calendar>
                    <Calendar
                      mode="single"
                      required
                      captionLayout="dropdown"
                      localeCode={locale}
                      selected={selectedCustomDate}
                      defaultMonth={selectedCustomDate || calendarStart}
                      startMonth={calendarStart}
                      endMonth={calendarEnd}
                      disabled={{ before: calendarStart }}
                      onSelect={(date) => {
                        if (!date) return
                        setForm((current) => ({ ...current, expiresAt: dateInputValue(date), expiration: 'custom' }))
                        setErrors((current) => ({ ...current, expiry: undefined }))
                        setCustomExpiryOpen(false)
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {errors.expiry ? <p className="text-xs text-destructive">{errors.expiry}</p> : null}
            </div>
          </div>
        </>
      ) : null}
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
        <DropdownMenuLabel>{t('API key')}</DropdownMenuLabel>
        <DropdownMenuItem disabled={busy || !apiKey.editable} onSelect={() => defer(onEdit)}><Pencil />{t('Edit')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={() => defer(onReveal)}><Eye />{t('Reveal')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy || apiKey.status == null || (apiKey.status !== 1 && apiKey.status !== 2)} onSelect={() => defer(onToggle)}><ShieldCheck />{apiKey.status === 1 ? t('Disable') : t('Enable')}</DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={onSelection}><Check />{selected ? t('Remove from selection') : t('Select for batch')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={busy} variant="destructive" onSelect={() => defer(onDelete)}><Trash2 />{t('Delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function KeyValue({ apiKey, onReveal }: { apiKey: KeyRecord; onReveal: (trigger: HTMLButtonElement) => void }) {
  const { t } = useTranslation()
  const copy = useMutation({
    mutationFn: () => copyRevealedKey(apiKey.id),
    onSuccess: () => toast.success(t('API key copied.')),
    onError: (error) => toast.error(errorMessage(error, 'Unable to copy key', t), { duration: 6000 }),
  })

  return (
    <div className="flex min-w-0 items-center gap-1">
      <code className="min-w-0 truncate font-mono text-xs text-muted-foreground">{apiKey.maskedKey ? withApiKeyPrefix(apiKey.maskedKey) : t('Unavailable')}</code>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={`${t('Copy key')} ${apiKey.name}`}
            disabled={copy.isPending}
            onClick={(event) => {
              if (supportsDeferredClipboardWrite()) copy.mutate()
              else onReveal(event.currentTarget)
            }}
          >
            {copy.isPending ? <LoaderCircle className="animate-spin" /> : <Copy />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Copy key')}</TooltipContent>
      </Tooltip>
    </div>
  )
}

function safeCopy(value: string, onCopied: (copied: boolean) => void) {
  void navigator.clipboard.writeText(value).then(() => onCopied(true), () => onCopied(false))
}

export function ConsoleKeysPage() {
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
  const returnFocus = useRef<HTMLElement | null>(null)
  const createTrigger = useRef<HTMLButtonElement>(null)
  const batchTrigger = useRef<HTMLButtonElement>(null)
  const mounted = useRef(true)
  const sessionRevision = useSessionStore((state) => state.revision)
  const previousSessionRevision = useRef(sessionRevision)

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

  const list = useQuery({ queryKey: consoleQueryKeys.apiKeys.list(keyword), queryFn: ({ signal }) => fetchKeys(keyword, signal), retry: false })
  const groups = useQuery({
    queryKey: consoleQueryKeys.apiKeys.groups(),
    queryFn: ({ signal }) => projectEnvelope(() => getUserGroupsWithSignal(signal), safeGroupOptions),
    retry: false,
  })
  const groupRatios = useMemo(() => new Map((groups.data || []).map((group) => [group.name, group.ratio])), [groups.data])
  const allRecords = list.data?.records || []
  const filtered = useMemo(() => status === 'all' ? allRecords : allRecords.filter((record) => record.status === Number(status)), [allRecords, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allVisibleSelected = visible.length > 0 && visible.every((record) => selected.includes(record.id))
  const someVisibleSelected = visible.some((record) => selected.includes(record.id))
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
    await invalidateConsoleQueries(client, consoleQueryKeys.apiKeys.all, consoleQueryKeys.overview.tokens())
  }
  const toggle = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: number }) => projectEnvelope(() => updateTokenStatus(id, nextStatus), () => undefined),
    onSuccess: async (_, variables) => {
      setStatusTarget(null)
      toast.success(variables.nextStatus === 1 ? t('API key enabled.') : t('API key disabled.'), { duration: 6000 })
      await invalidate()
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Unable to update key status', t), { duration: 6000 })
    },
  })
  const remove = useMutation({
    mutationFn: (id: number) => projectEnvelope(() => deleteToken(id), () => undefined),
    onSuccess: async () => {
      setDeleteTarget(null)
      toast.success(t('API key deleted.'), { duration: 6000 })
      await invalidate()
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Unable to delete API key.', t), { duration: 6000 })
    },
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
    onSuccess: async ({ deleted, requested }) => {
      setBatchOpen(false)
      if (deleted === requested) setSelected([])
      toast.success(deleted === requested ? t('Selected API keys deleted.') : t('The server deleted {{deleted}} of {{requested}} selected API keys.', { deleted, requested }), { duration: 6000 })
      await invalidate()
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Unable to delete selected API keys.', t), { duration: 6000 })
    },
  })
  const reveal = useMutation({
    mutationFn: async (id: number) => {
      const key = await fetchRevealedKey(id)
      if (mounted.current) setSecret(key)
    },
    gcTime: 0,
    onError: (error) => {
      toast.error(errorMessage(error, 'Unable to reveal key', t), { duration: 6000 })
    },
  })

  useEffect(() => {
    if (!secret) return
    const timer = window.setTimeout(() => {
      setSecret(null)
      setCopied(false)
      reveal.reset()
    }, 60_000)
    return () => window.clearTimeout(timer)
  }, [secret])

  useEffect(() => {
    if (previousSessionRevision.current === sessionRevision) return
    previousSessionRevision.current = sessionRevision
    setRevealTarget(null)
    setSecret(null)
    setCopied(false)
    reveal.reset()
  }, [reveal, sessionRevision])

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
          <h1 id="console-title" className="text-2xl font-bold tracking-tight">{t('API keys')}</h1>
          <p className="text-muted-foreground">{t('Create scoped credentials and control access to the Partokens API.')}</p>
        </div>
        <Button ref={createTrigger} onClick={() => createTrigger.current && openEdit(null, createTrigger.current)}><Plus />{t('Create key')}</Button>
      </header>

      <section aria-label={t('API key filters')} className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 lg:max-w-sm">
          <div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by name or key...')} aria-label={t('Search API keys')} aria-invalid={searchBlocked} className="ps-9" /></div>
          {searchBlocked ? <p role="alert" className="mt-1 text-xs text-destructive">{t('Credentials and URLs cannot be used as search terms.')}</p> : null}
        </div>
        <div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40" aria-label={t('Filter by status')}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('All statuses')}</SelectItem><SelectItem value="1">{t('Enabled')}</SelectItem><SelectItem value="2">{t('Disabled')}</SelectItem><SelectItem value="3">{t('Expired')}</SelectItem><SelectItem value="4">{t('Exhausted')}</SelectItem></SelectContent>
          </Select>
        </div>
        {hasFilters ? <Button variant="ghost" size="sm" className="self-start lg:self-auto" onClick={clearFilters}>{t('Clear')}</Button> : null}
      </section>

      {selected.length ? <div className="flex min-h-12 flex-col gap-3 rounded-md border bg-muted/20 px-4 py-2 sm:flex-row sm:items-center"><span className="text-sm">{t('Selected')}: {selected.length} / {maxBatchSize}</span><Button ref={batchTrigger} variant="destructive" size="sm" className="sm:ms-auto" onClick={() => { returnFocus.current = batchTrigger.current; setBatchOpen(true); batchRemove.reset() }}><Trash2 />{t('Delete selected')}</Button></div> : null}

      <section aria-label={t('API keys')} className="overflow-hidden rounded-md border">
        {list.isPending ? <ListSkeleton /> : list.isError ? <StatePanel kind="error" message={errorMessage(list.error, 'Unable to load API keys.', t)} onRetry={() => void list.refetch()} /> : contractBlocked ? <StatePanel kind="contract" message={t('Returned records do not expose a usable numeric id and safe name.')} /> : emptyFiltered ? <StatePanel kind="empty" message={hasFilters ? t('Try a different search term or clear the current filters.') : t('Create a key to authenticate your first API request.')} onClear={hasFilters ? clearFilters : undefined} /> : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table className={selected.length ? 'min-w-[1090px]' : 'min-w-[1030px]'}>
                <TableHeader><TableRow className="hover:bg-transparent">
                  {selected.length ? <TableHead className="w-10 ps-4"><Checkbox aria-label={t('Select page')} checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} disabled={!allVisibleSelected && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked === true ? selectRecords(visible) : setSelected((current) => current.filter((id) => !visible.some((record) => record.id === id)))} /></TableHead> : null}
                  <TableHead className={selected.length ? undefined : 'ps-4'}>{t('Name')}</TableHead><TableHead>{t('Key')}</TableHead><TableHead>{t('Group')}</TableHead><TableHead>{t('Status')}</TableHead><TableHead>{t('Quota')}</TableHead><TableHead>{t('Created')}</TableHead><TableHead>{t('Last used')}</TableHead><TableHead>{t('Expires')}</TableHead><TableHead><span className="sr-only">{t('Actions')}</span></TableHead>
                </TableRow></TableHeader>
                <TableBody>{visible.map((record) => (
                  <TableRow key={record.id}>
                    {selected.length ? <TableCell className="ps-4"><Checkbox aria-label={`${t('Select')} ${record.name}`} checked={selected.includes(record.id)} disabled={!selected.includes(record.id) && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked ? selectRecords([record]) : setSelected((current) => current.filter((id) => id !== record.id))} /></TableCell> : null}
                    <TableCell className={`max-w-48 font-medium ${selected.length ? '' : 'ps-4'}`}><span className="block truncate" title={record.name}>{record.name}</span></TableCell>
                    <TableCell className="max-w-56"><KeyValue apiKey={record} onReveal={(trigger) => openReveal(record, trigger)} /></TableCell>
                    <TableCell className="max-w-52"><GroupValue group={record.group} ratio={record.group ? groupRatios.get(record.group) : undefined} /></TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell className="font-mono text-xs">{record.unlimitedQuota ? t('Unlimited') : formatQuota(record.remainQuota, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatKeyDate(record.createdTime, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatKeyDate(record.accessedTime, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{record.expiredTime === -1 ? t('Never expires') : formatKeyDate(record.expiredTime, locale)}</TableCell>
                    <TableCell className="pe-3 text-end">{keyActions(record)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>

            <div className="divide-y lg:hidden">{visible.map((record) => (
              <article key={record.id} className="space-y-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  {selected.length ? <Checkbox className="mt-1" aria-label={`${t('Select')} ${record.name}`} checked={selected.includes(record.id)} disabled={!selected.includes(record.id) && selected.length >= maxBatchSize} onCheckedChange={(checked) => checked ? selectRecords([record]) : setSelected((current) => current.filter((id) => id !== record.id))} /> : null}
                  <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-medium">{record.name}</h2><div className="mt-1"><KeyValue apiKey={record} onReveal={(trigger) => openReveal(record, trigger)} /></div></div>
                  {keyActions(record)}
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={record.status} /></div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="col-span-2 min-w-0"><dt className="text-xs text-muted-foreground">{t('Group')}</dt><dd className="mt-1"><GroupValue group={record.group} ratio={record.group ? groupRatios.get(record.group) : undefined} /></dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Quota')}</dt><dd className="mt-1 truncate font-mono text-xs">{record.unlimitedQuota ? t('Unlimited') : formatQuota(record.remainQuota, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Created')}</dt><dd className="mt-1 truncate">{formatKeyDate(record.createdTime, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Last used')}</dt><dd className="mt-1 truncate">{formatKeyDate(record.accessedTime, locale)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t('Expires')}</dt><dd className="mt-1 truncate">{record.expiredTime === -1 ? t('Never expires') : formatKeyDate(record.expiredTime, locale)}</dd></div>
                </dl>
              </article>
            ))}</div>
          </>
        )}

        {!list.isPending && !list.isError && !contractBlocked ? <footer className="flex min-h-12 items-center justify-between gap-4 border-t px-4 py-2 text-sm text-muted-foreground"><span>{t('{{visible}} of {{total}} keys', { visible: filtered.length, total: list.data?.reportedTotal ?? filtered.length })}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('Previous')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>{t('Next')}</Button></div></footer> : null}
      </section>

      {editing !== undefined ? <KeyEditor token={editing} defaultGroup={safeLabel(user?.group, 64) || 'default'} groups={groups.data || []} groupsUnavailable={groups.isError} returnFocus={returnFocus} onClose={() => setEditing(undefined)} onSaved={(result) => {
        setEditing(undefined)
        toast.success(result.created ? t('API key created.') : t('API key updated.'), { duration: 6000 })
        if (result.created && result.id) setRevealTarget({ id: result.id, name: result.name, maskedKey: null, partial: true, editable: false })
      }} /> : null}

      <Dialog open={revealTarget != null} onOpenChange={(open) => !open && closeReveal()}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{secret ? t('Key revealed') : t('Reveal full key?')}</DialogTitle><DialogDescription>{secret ? t('Close this window when you have stored the key securely.') : t('Anyone with this value can use your quota. Confirm that nobody else can see your screen.')}</DialogDescription></DialogHeader>
          {secret ? <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-md border bg-muted/40 p-3"><code className="min-w-0 break-all font-mono text-xs">{secret}</code><Button variant="outline" size="icon" aria-label={t('Copy')} onClick={() => safeCopy(secret, setCopied)}>{copied ? <Check /> : <Copy />}</Button></div> : null}
          {secret ? <div className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>{t('Store it in a secret manager. Do not commit it to source control.')}</p></div> : null}
          <DialogFooter><Button variant="outline" onClick={closeReveal}>{t('Close')}</Button>{!secret ? <Button disabled={reveal.isPending} onClick={() => revealTarget && reveal.mutate(revealTarget.id)}>{reveal.isPending ? <LoaderCircle className="animate-spin" /> : <Eye />}{reveal.isPending ? t('Loading') : t('Confirm reveal')}</Button> : null}</DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusTarget != null} onOpenChange={(open) => !open && !toggle.isPending && setStatusTarget(null)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{statusTarget?.status === 1 ? t('Disable this API key?') : t('Enable this API key?')}</DialogTitle><DialogDescription>{statusTarget?.status === 1 ? t('Requests using {{name}} will fail until the key is enabled again.', { name: statusTarget?.name || t('this key') }) : t('{{name}} will be allowed to make requests again if its quota and expiration permit it.', { name: statusTarget?.name || t('This key') })}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" disabled={toggle.isPending} onClick={() => setStatusTarget(null)}>{t('Cancel')}</Button><Button disabled={toggle.isPending} onClick={() => statusTarget && toggle.mutate({ id: statusTarget.id, nextStatus: statusTarget.status === 1 ? 2 : 1 })}>{toggle.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}{statusTarget?.status === 1 ? t('Disable key') : t('Enable key')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && !remove.isPending && setDeleteTarget(null)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{t('Delete this key?')}</DialogTitle><DialogDescription>{t('{{name}}. This action cannot be undone.', { name: deleteTarget?.name })}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setDeleteTarget(null)}>{t('Cancel')}</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>{remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{t('Delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={(open) => !open && !batchRemove.isPending && setBatchOpen(false)}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus() }}>
          <DialogHeader><DialogTitle>{t('Delete selected keys?')}</DialogTitle><DialogDescription>{t('{{count}} selected API keys will be permanently removed.', { count: selected.length })}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" disabled={batchRemove.isPending} onClick={() => setBatchOpen(false)}>{t('Cancel')}</Button><Button variant="destructive" disabled={batchRemove.isPending} onClick={() => batchRemove.mutate(selected)}>{batchRemove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{t('Delete selected')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
