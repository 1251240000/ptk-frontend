import {
  ArrowRight,
  Database,
  Download,
  History,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  Button,
  Input,
  Label,
  Skeleton,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@partokens/design-system/components'

import type { LocalConversation, PlaygroundParameters } from '@/db'
import { formatLocalBytes } from '@/lib/playground'

export type PlaygroundTranslate = (key: string) => string

export function PlaygroundMessageContent({ content }: { content: string }) {
  return (
    <div className="mt-2 break-words text-sm leading-6 [&>*+*]:mt-3 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_li]:ms-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:bg-muted/50 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function PlaygroundIconButton({ label, children, onClick, disabled, className = '' }: {
  label: string
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className={className} aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

type ConversationRailProps = {
  conversations: LocalConversation[]
  currentId: string | null
  query: string
  busy: boolean
  locale: string
  bytes: number
  t: PlaygroundTranslate
  onQuery: (query: string) => void
  onNew: () => void
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string, trigger: HTMLElement) => void
  onLocalData: (trigger: HTMLElement) => void
}

export function ConversationRail({ conversations, currentId, query, busy, locale, bytes, t, onQuery, onNew, onSelect, onRename, onDelete, onLocalData }: ConversationRailProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const cancelRenameRef = useRef(false)
  const normalizedQuery = query.trim().toLocaleLowerCase(locale)
  const matches = conversations.filter((conversation) => conversation.title.toLocaleLowerCase(locale).includes(normalizedQuery))
  const today = matches.filter((conversation) => Date.now() - conversation.updatedAt < 24 * 60 * 60_000)
  const previous = matches.filter((conversation) => Date.now() - conversation.updatedAt >= 24 * 60 * 60_000)

  useEffect(() => {
    if (editingId) renameInputRef.current?.select()
  }, [editingId])

  const finishRename = (conversation: LocalConversation, value: string) => {
    setEditingId(null)
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false
      return
    }
    const title = value.trim() || t('New conversation')
    if (title !== conversation.title) onRename(conversation.id, title)
  }

  const group = (label: string, items: LocalConversation[]) => items.length ? (
    <section className="space-y-1" key={label}>
      <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground">
        <span>{t(label)}</span><span>{items.length}</span>
      </div>
      {items.map((conversation) => (
        <div className={`group relative rounded-md ${conversation.id === currentId ? 'bg-accent' : 'hover:bg-muted/60'}`} key={conversation.id}>
          {editingId === conversation.id ? (
            <div className="grid min-h-[58px] w-full min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 px-2 py-2 pe-9">
              <Pencil className="size-4 text-muted-foreground" />
              <Input
                ref={renameInputRef}
                className="h-8 min-w-0 px-2 text-sm"
                value={renameDraft}
                aria-label={t('Rename conversation')}
                onChange={(event) => setRenameDraft(event.target.value)}
                onBlur={(event) => finishRename(conversation, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') {
                    cancelRenameRef.current = true
                    event.currentTarget.blur()
                  }
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              className="grid w-full min-w-0 grid-cols-[auto_1fr] gap-x-2 px-2 py-2.5 pe-16 text-start"
              disabled={busy}
              onClick={() => onSelect(conversation.id)}
            >
              <MessageSquare className="mt-0.5 size-4 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium" title={conversation.title}>{conversation.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(conversation.updatedAt)}</span>
              </span>
            </button>
          )}
          {editingId !== conversation.id ? (
            <>
              <PlaygroundIconButton
                className="absolute end-8 top-2 size-7 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                label={t('Rename conversation')}
                disabled={busy}
                onClick={() => {
                  cancelRenameRef.current = false
                  setEditingId(conversation.id)
                  setRenameDraft(conversation.title)
                }}
              >
                <Pencil className="size-3.5" />
              </PlaygroundIconButton>
              <PlaygroundIconButton
                className="absolute end-1 top-2 size-7 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                label={t('Delete conversation')}
                disabled={busy}
                onClick={() => {
                  const trigger = document.activeElement
                  if (trigger instanceof HTMLElement) onDelete(conversation.id, trigger)
                }}
              >
                <Trash2 className="size-3.5" />
              </PlaygroundIconButton>
            </>
          ) : null}
        </div>
      ))}
    </section>
  ) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b p-3">
        <Button className="w-full justify-start" disabled={busy} onClick={onNew}><Plus />{t('New chat')}</Button>
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-8" value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t('Search conversations')} aria-label={t('Search conversations')} />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-2">
        {group('Today', today)}
        {group('Previous 7 days', previous)}
        {!matches.length ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground">
            <History className="mb-3 size-5" />
            <p className="font-medium text-foreground">{t(query ? 'No matching conversations' : 'No conversations yet')}</p>
            <p className="mt-1 text-xs">{t(query ? 'Try another search term.' : 'Create a chat to begin.')}</p>
          </div>
        ) : null}
      </div>
      <div className="border-t p-3">
        <button type="button" className="flex w-full items-center gap-3 rounded-md p-2 text-start hover:bg-muted" onClick={(event) => onLocalData(event.currentTarget)}>
          <Database className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{t('Stored locally')}</span>
            <span className="block text-xs text-muted-foreground">{formatLocalBytes(bytes, locale)}</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </button>
        <p className="mt-2 flex gap-2 px-2 text-[0.6875rem] leading-4 text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p>
      </div>
    </div>
  )
}

export function PlaygroundLoading({ t }: { t: PlaygroundTranslate }) {
  return (
    <div className="flex h-full flex-col gap-4 p-5" aria-label={t('Loading conversations')}>
      <div className="flex gap-3"><Skeleton className="h-9 w-44" /><Skeleton className="ms-auto h-9 w-28" /></div>
      <div className="flex flex-1 flex-col justify-center gap-4">
        <Skeleton className="ms-auto h-16 w-2/3 max-w-md" />
        <Skeleton className="h-24 w-3/4 max-w-lg" />
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  )
}

export function PlaygroundStorageError({ t, onRetry }: { t: PlaygroundTranslate; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-96 flex-col items-center justify-center p-8 text-center" role="alert">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive"><Database className="size-5" /></div>
      <h2 className="text-sm font-semibold">{t('Could not read local conversations')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('IndexedDB is unavailable or the stored data could not be opened.')}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}><RotateCcw />{t('Retry')}</Button>
    </div>
  )
}

export function PlaygroundParametersForm({ value, t, onChange }: { value: PlaygroundParameters; t: PlaygroundTranslate; onChange: (value: PlaygroundParameters) => void }) {
  const sliders: Array<{ key: 'temperature' | 'topP' | 'frequencyPenalty' | 'presencePenalty'; label: string; min: number; max: number; step: number }> = [
    { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1 },
    { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.1 },
    { key: 'frequencyPenalty', label: 'Frequency penalty', min: -2, max: 2, step: 0.1 },
    { key: 'presencePenalty', label: 'Presence penalty', min: -2, max: 2, step: 0.1 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div><Label htmlFor="stream-response">{t('Streaming')}</Label><p className="text-xs text-muted-foreground">{t('Show the response as it arrives')}</p></div>
        <Switch id="stream-response" checked={value.stream} onCheckedChange={(stream) => onChange({ ...value, stream })} />
      </div>
      {sliders.map((slider) => (
        <div className="space-y-2" key={slider.key}>
          <div className="flex items-center justify-between"><Label htmlFor={`parameter-${slider.key}`}>{t(slider.label)}</Label><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{value[slider.key].toFixed(1)}</code></div>
          <input
            id={`parameter-${slider.key}`}
            type="range"
            className="h-2 w-full cursor-pointer accent-foreground"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={value[slider.key]}
            onChange={(event) => onChange({ ...value, [slider.key]: Number(event.target.value) })}
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="max-tokens">{t('Max tokens')}</Label><Input id="max-tokens" type="number" min={1} max={200000} value={value.maxTokens} onChange={(event) => onChange({ ...value, maxTokens: Math.max(1, Math.min(200000, Number(event.target.value) || 1)) })} /></div>
        <div className="space-y-2"><Label htmlFor="seed">{t('Seed')}</Label><Input id="seed" type="number" min={0} max={2147483647} value={value.seed ?? ''} placeholder={t('Not set')} onChange={(event) => onChange({ ...value, seed: event.target.value === '' ? null : Math.max(0, Math.min(2147483647, Number(event.target.value) || 0)) })} /></div>
      </div>
    </div>
  )
}

export function PlaygroundLocalData({ conversations, bytes, browserStorage, busy, importing, locale, t, onExport, onImport, onClear }: {
  conversations: LocalConversation[]
  bytes: number
  browserStorage: { usage: number; quota: number } | null
  busy: boolean
  importing: boolean
  locale: string
  t: PlaygroundTranslate
  onExport: () => void
  onImport: () => void
  onClear: () => void
}) {
  const rows: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Conversations', value: new Intl.NumberFormat(locale).format(conversations.length), icon: MessageSquare },
    { label: 'Conversation data', value: formatLocalBytes(bytes, locale), icon: Database },
    { label: 'Browser storage used', value: browserStorage ? formatLocalBytes(browserStorage.usage, locale) : '—', icon: Database },
    { label: 'Browser storage limit', value: browserStorage?.quota ? formatLocalBytes(browserStorage.quota, locale) : '—', icon: Database },
  ]

  return (
    <div className="space-y-4">
      <dl className="divide-y rounded-md border">
        {rows.map(({ label, value }) => <div className="flex justify-between gap-4 px-3 py-2.5 text-sm" key={label}><dt className="text-muted-foreground">{t(label)}</dt><dd className="break-all font-medium">{value}</dd></div>)}
      </dl>
      <div className="flex gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p></div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="outline" disabled={!conversations.length || importing} onClick={onExport}><Download />{t('Export conversations')}</Button>
        <Button variant="outline" disabled={importing} onClick={onImport}>{importing ? <LoaderCircle className="animate-spin" /> : <Upload />}{t('Import conversations')}</Button>
        <Button variant="destructive" disabled={!conversations.length || busy || importing} onClick={onClear}><Trash2 />{t('Clear all')}</Button>
      </div>
    </div>
  )
}
