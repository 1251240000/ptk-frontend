import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  Copy,
  Database,
  Download,
  Ellipsis,
  History,
  Info,
  LoaderCircle,
  MessageSquare,
  PanelLeft,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import {
  Button,
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
  useSidebar,
} from '@partokens/design-system/components'

import {
  clearPrototypeConversations,
  defaultPrototypeParameters,
  deletePrototypeConversation,
  importPrototypeConversations,
  loadPrototypeConversations,
  prototypeConversationBytes,
  prototypeOwnerNamespace,
  savePrototypeConversation,
  type PrototypeChatMessage,
  type PrototypeChatParameters,
  type PrototypeConversation,
} from './console-playground-store'
import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type OverlayState =
  | { kind: 'parameters' }
  | { kind: 'local-data' }
  | { kind: 'edit-message'; id: string }
  | { kind: 'delete-message'; id: string }
  | { kind: 'delete-conversation'; id: string }
  | { kind: 'clear-all' }
  | null

type DataState = 'live' | 'loading' | 'error'

const models = ['gpt-4.1-mini', 'claude-3.7-sonnet', 'gemini-2.5-flash']
const groups = ['default', 'trial']
const suggestedPrompts = ['Plan a model rollout', 'Compare prompt costs', 'Draft an incident update']
const simulatedAnswer = 'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.'

function messageText(message: PrototypeChatMessage) {
  if (message.content) return message.content
  if (message.copyKey) return message.copyKey
  return ''
}

function conversationTitle(conversation: PrototypeConversation) {
  return conversation.title || conversation.titleKey || 'New conversation'
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes.toLocaleString('en-US')} B`
  return `${(bytes / 1024).toLocaleString('en-US', { maximumFractionDigits: 1 })} KB`
}

function formatConversationTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

function isImportableConversation(value: unknown): value is PrototypeConversation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PrototypeConversation>
  return typeof candidate.title === 'string'
    && typeof candidate.model === 'string'
    && typeof candidate.group === 'string'
    && Boolean(candidate.parameters && typeof candidate.parameters === 'object')
    && Array.isArray(candidate.messages)
    && candidate.messages.every((message) => Boolean(
      message
      && typeof message.id === 'string'
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && ['complete', 'streaming', 'stopped', 'error'].includes(message.status),
    ))
}

function IconButton({ label, children, onClick, disabled, className = '' }: {
  label: string
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type='button' variant='ghost' size='icon' className={className} aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function RouteStrip({ model }: { model: string }) {
  const steps = [
    { icon: Database, label: 'Local IndexedDB', detail: 'Stored on this device' },
    { icon: ArrowRight, label: 'Partokens gateway', detail: 'Transported when sent' },
    { icon: Bot, label: model, detail: 'Model response' },
  ]

  return (
    <div className='grid grid-cols-3 border-b bg-muted/20' aria-label='Message route'>
      {steps.map(({ icon: Icon, label, detail }, index) => (
        <div className={`flex min-w-0 flex-col items-start gap-1 px-2 py-2.5 sm:flex-row sm:items-center sm:gap-2 sm:px-3 ${index ? 'border-s' : ''}`} key={label}>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-md border bg-background'><Icon className='size-3.5' /></div>
          <div className='min-w-0'>
            <p className='break-words text-[11px] font-medium leading-4 sm:text-xs'>{label}</p>
            <p className='hidden truncate text-[11px] text-muted-foreground @xl/content:block'>{detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

type RailProps = {
  conversations: PrototypeConversation[]
  currentId: string | null
  query: string
  busy: boolean
  onQuery: (query: string) => void
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string, trigger: HTMLElement) => void
  onLocalData: (trigger: HTMLElement) => void
}

function ConversationRail({ conversations, currentId, query, busy, onQuery, onNew, onSelect, onDelete, onLocalData }: RailProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US')
  const matches = conversations.filter((conversation) => conversationTitle(conversation).toLocaleLowerCase('en-US').includes(normalizedQuery))
  const today = matches.filter((conversation) => Date.now() - conversation.updatedAt < 24 * 60 * 60_000)
  const previous = matches.filter((conversation) => Date.now() - conversation.updatedAt >= 24 * 60 * 60_000)

  const group = (label: string, items: PrototypeConversation[]) => items.length ? (
    <section className='space-y-1' key={label}>
      <div className='flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground'>
        <span>{label}</span><span>{items.length}</span>
      </div>
      {items.map((conversation) => (
        <div className={`group relative rounded-md ${conversation.id === currentId ? 'bg-accent' : 'hover:bg-muted/60'}`} key={conversation.id}>
          <button
            type='button'
            className='grid w-full min-w-0 grid-cols-[auto_1fr] gap-x-2 px-2 py-2.5 pe-9 text-start'
            disabled={busy}
            onClick={() => onSelect(conversation.id)}
          >
            <MessageSquare className='mt-0.5 size-4 text-muted-foreground' />
            <span className='min-w-0'>
              <span className='block truncate text-sm font-medium'>{conversationTitle(conversation)}</span>
              <span className='block truncate text-xs text-muted-foreground'>{formatConversationTime(conversation.updatedAt)}</span>
            </span>
          </button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute end-1 top-2 size-7 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
            aria-label={`Delete ${conversationTitle(conversation)}`}
            disabled={busy}
            onClick={(event) => onDelete(conversation.id, event.currentTarget)}
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
      ))}
    </section>
  ) : null

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='space-y-3 border-b p-3'>
        <Button className='w-full justify-start' disabled={busy} onClick={onNew}><Plus />New chat</Button>
        <div className='relative'>
          <Search className='absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input className='ps-8' value={query} onChange={(event) => onQuery(event.target.value)} placeholder='Search conversations' aria-label='Search conversations' />
        </div>
      </div>
      <div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-2'>
        {group('Today', today)}
        {group('Previous 7 days', previous)}
        {!matches.length ? (
          <div className='flex min-h-40 flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground'>
            <History className='mb-3 size-5' />
            <p className='font-medium text-foreground'>{query ? 'No matching conversations' : 'No conversations yet'}</p>
            <p className='mt-1 text-xs'>{query ? 'Try another search term.' : 'Create a chat to begin.'}</p>
          </div>
        ) : null}
      </div>
      <div className='border-t p-3'>
        <button type='button' className='flex w-full items-center gap-3 rounded-md p-2 text-start hover:bg-muted' onClick={(event) => onLocalData(event.currentTarget)}>
          <Database className='size-4 shrink-0' />
          <span className='min-w-0 flex-1'>
            <span className='block text-sm font-medium'>Stored locally</span>
            <span className='block text-xs text-muted-foreground'>{formatBytes(prototypeConversationBytes(conversations))}</span>
          </span>
          <ArrowRight className='size-4 text-muted-foreground' />
        </button>
        <p className='mt-2 flex gap-2 px-2 text-[11px] leading-4 text-muted-foreground'><ShieldCheck className='mt-0.5 size-3.5 shrink-0' />History stays in this browser.</p>
      </div>
    </div>
  )
}

function LoadingWorkspace() {
  return (
    <div className='flex h-full flex-col gap-4 p-5' aria-label='Loading conversations'>
      <div className='flex gap-3'><Skeleton className='h-9 w-44' /><Skeleton className='ms-auto h-9 w-28' /></div>
      <div className='flex flex-1 flex-col justify-center gap-4'>
        <Skeleton className='ms-auto h-16 w-2/3 max-w-md' />
        <Skeleton className='h-24 w-3/4 max-w-lg' />
      </div>
      <Skeleton className='h-28 w-full' />
    </div>
  )
}

function ErrorWorkspace({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex h-full min-h-96 flex-col items-center justify-center p-8 text-center' role='alert'>
      <div className='mb-4 flex size-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive'><AlertTriangle className='size-5' /></div>
      <h2 className='text-sm font-semibold'>Could not read local conversations</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>IndexedDB is unavailable or the stored data could not be opened.</p>
      <Button variant='outline' className='mt-4' onClick={onRetry}><RotateCcw />Retry</Button>
    </div>
  )
}

function ParametersForm({ value, onChange }: { value: PrototypeChatParameters; onChange: (value: PrototypeChatParameters) => void }) {
  const sliders: Array<{ key: 'temperature' | 'topP' | 'frequencyPenalty' | 'presencePenalty'; label: string; min: number; max: number; step: number }> = [
    { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1 },
    { key: 'topP', label: 'Top P', min: 0, max: 1, step: 0.1 },
    { key: 'frequencyPenalty', label: 'Frequency penalty', min: -2, max: 2, step: 0.1 },
    { key: 'presencePenalty', label: 'Presence penalty', min: -2, max: 2, step: 0.1 },
  ]

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-4 rounded-md border p-3'>
        <div><Label htmlFor='stream-response'>Streaming</Label><p className='text-xs text-muted-foreground'>Show the response as it arrives.</p></div>
        <Switch id='stream-response' checked={value.stream} onCheckedChange={(stream) => onChange({ ...value, stream })} />
      </div>
      {sliders.map((slider) => (
        <div className='space-y-2' key={slider.key}>
          <div className='flex items-center justify-between'><Label htmlFor={`parameter-${slider.key}`}>{slider.label}</Label><code className='rounded bg-muted px-1.5 py-0.5 text-xs'>{value[slider.key].toFixed(1)}</code></div>
          <input
            id={`parameter-${slider.key}`}
            type='range'
            className='h-2 w-full cursor-pointer accent-foreground'
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={value[slider.key]}
            onChange={(event) => onChange({ ...value, [slider.key]: Number(event.target.value) })}
          />
        </div>
      ))}
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-2'><Label htmlFor='max-tokens'>Max tokens</Label><Input id='max-tokens' type='number' min={1} max={200000} value={value.maxTokens} onChange={(event) => onChange({ ...value, maxTokens: Math.max(1, Number(event.target.value) || 1) })} /></div>
        <div className='space-y-2'><Label htmlFor='seed'>Seed</Label><Input id='seed' type='number' min={0} value={value.seed ?? ''} placeholder='Not set' onChange={(event) => onChange({ ...value, seed: event.target.value ? Number(event.target.value) : null })} /></div>
      </div>
    </div>
  )
}

function LocalDataPanel({ conversations, busy, importing, onExport, onImport, onClear }: {
  conversations: PrototypeConversation[]
  busy: boolean
  importing: boolean
  onExport: () => void
  onImport: () => void
  onClear: () => void
}) {
  return (
    <div className='space-y-4'>
      <dl className='divide-y rounded-md border'>
        <div className='flex justify-between gap-4 px-3 py-2.5 text-sm'><dt className='text-muted-foreground'>Conversations</dt><dd className='font-medium'>{conversations.length}</dd></div>
        <div className='flex justify-between gap-4 px-3 py-2.5 text-sm'><dt className='text-muted-foreground'>Conversation data</dt><dd className='font-medium'>{formatBytes(prototypeConversationBytes(conversations))}</dd></div>
        <div className='flex justify-between gap-4 px-3 py-2.5 text-sm'><dt className='text-muted-foreground'>Browser storage</dt><dd className='font-medium'>Local IndexedDB</dd></div>
      </dl>
      <div className='flex gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'><ShieldCheck className='mt-0.5 size-4 shrink-0' /><p>Conversation history is stored only in this browser. Partokens does not store your conversation history.</p></div>
      <div className='grid gap-2 sm:grid-cols-3'>
        <Button variant='outline' disabled={!conversations.length || importing} onClick={onExport}><Download />Export</Button>
        <Button variant='outline' disabled={importing} onClick={onImport}>{importing ? <LoaderCircle className='animate-spin' /> : <Upload />}Import</Button>
        <Button variant='destructive' disabled={!conversations.length || busy || importing} onClick={onClear}><Trash2 />Clear all</Button>
      </div>
    </div>
  )
}

function PlaygroundContent() {
  const { isMobile } = useSidebar()
  const [conversations, setConversations] = useState<PrototypeConversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [editDraft, setEditDraft] = useState('')
  const [parameterDraft, setParameterDraft] = useState<PrototypeChatParameters>({ ...defaultPrototypeParameters })
  const [overlay, setOverlay] = useState<OverlayState>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [dataState, setDataState] = useState<DataState>('loading')
  const [busy, setBusy] = useState(false)
  const [importing, setImporting] = useState(false)
  const conversationsRef = useRef<PrototypeConversation[]>([])
  const streamTimers = useRef<number[]>([])
  const streamRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const historyTriggerRef = useRef<HTMLButtonElement>(null)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)
  const overlayTriggerRef = useRef<HTMLElement | null>(null)
  const current = conversations.find((conversation) => conversation.id === currentId) ?? null
  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt), [conversations])

  const load = async () => {
    setDataState('loading')
    try {
      const items = await loadPrototypeConversations()
      conversationsRef.current = items
      setConversations(items)
      setCurrentId((selected) => items.some((item) => item.id === selected) ? selected : items[0]?.id ?? null)
      setDataState('live')
    } catch {
      setDataState('error')
    }
  }

  useEffect(() => {
    void load()
    return () => streamTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    setTitleDraft(current ? conversationTitle(current) : '')
  }, [current?.id])

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [current?.messages.length, busy])

  const replaceConversation = (id: string, update: (conversation: PrototypeConversation) => PrototypeConversation) => {
    let saved: PrototypeConversation | undefined
    const next = conversationsRef.current.map((conversation) => {
      if (conversation.id !== id) return conversation
      saved = update(conversation)
      return saved
    })
    conversationsRef.current = next
    setConversations(next)
    if (saved) void savePrototypeConversation(saved).catch(() => toast.error('Conversation could not be saved'))
    return saved
  }

  const createChat = () => {
    const now = Date.now()
    const conversation: PrototypeConversation = {
      id: crypto.randomUUID(),
      ownerNamespace: prototypeOwnerNamespace,
      title: 'New conversation',
      titleKey: undefined,
      createdAt: now,
      updatedAt: now,
      model: current?.model || 'gpt-4.1-mini',
      group: current?.group || 'default',
      parameters: { ...(current?.parameters || defaultPrototypeParameters) },
      messages: [],
      schemaVersion: 1,
    }
    const next = [conversation, ...conversationsRef.current]
    conversationsRef.current = next
    setConversations(next)
    setCurrentId(conversation.id)
    setHistoryOpen(false)
    void savePrototypeConversation(conversation).catch(() => toast.error('Conversation could not be saved'))
    return conversation
  }

  const updateSelection = async (patch: Partial<Pick<PrototypeConversation, 'model' | 'group'>>) => {
    if (!current) return
    const updated = replaceConversation(current.id, (conversation) => ({ ...conversation, ...patch, updatedAt: Date.now() }))
    if (updated) await savePrototypeConversation(updated)
    toast.success('Conversation settings saved')
  }

  const saveTitle = async () => {
    if (!current || busy) return
    const title = titleDraft.trim() || 'New conversation'
    if (title === conversationTitle(current)) return
    const updated = replaceConversation(current.id, (conversation) => ({ ...conversation, title, titleKey: undefined, updatedAt: Date.now() }))
    if (updated) await savePrototypeConversation(updated)
    toast.success('Conversation renamed')
  }

  const clearStream = () => {
    streamTimers.current.forEach((timer) => window.clearTimeout(timer))
    streamTimers.current = []
  }

  const streamAnswer = (conversationId: string, assistantId: string, stream: boolean) => {
    clearStream()
    setBusy(true)
    const chunks = stream
      ? simulatedAnswer.match(new RegExp(`.{1,${Math.ceil(simulatedAnswer.length / 6)}}`, 'g')) ?? [simulatedAnswer]
      : [simulatedAnswer]
    chunks.forEach((chunk, index) => {
      const timer = window.setTimeout(() => {
        replaceConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: Date.now(),
          messages: conversation.messages.map((message) => message.id === assistantId ? {
            ...message,
            content: `${message.content}${chunk}`,
            status: index === chunks.length - 1 ? 'complete' : 'streaming',
          } : message),
        }))
        if (index === chunks.length - 1) {
          streamTimers.current = []
          setBusy(false)
        }
      }, stream ? 180 + index * 220 : 700)
      streamTimers.current.push(timer)
    })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || busy || dataState !== 'live') return
    const conversation = current || createChat()
    const prompt = draft.trim()
    const now = Date.now()
    const userMessage: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete', createdAt: now }
    const assistantMessage: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming', createdAt: now + 1 }
    const automaticTitle = conversation.messages.length ? conversation.title : prompt.slice(0, 52)
    setDraft('')
    setTitleDraft(automaticTitle)
    replaceConversation(conversation.id, (item) => ({
      ...item,
      title: automaticTitle,
      titleKey: conversation.messages.length ? item.titleKey : undefined,
      updatedAt: now,
      messages: [...item.messages, userMessage, assistantMessage],
    }))
    streamAnswer(conversation.id, assistantMessage.id, conversation.parameters.stream)
  }

  const stopGeneration = () => {
    if (!current) return
    clearStream()
    replaceConversation(current.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => message.status === 'streaming' ? { ...message, status: 'stopped' } : message),
    }))
    setBusy(false)
    toast.success('Generation stopped')
  }

  const regenerate = (messageId: string) => {
    if (!current || busy) return
    replaceConversation(current.id, (conversation) => ({
      ...conversation,
      updatedAt: Date.now(),
      messages: conversation.messages.map((message) => message.id === messageId ? { ...message, content: '', copyKey: undefined, reasoningKey: undefined, status: 'streaming' } : message),
    }))
    streamAnswer(current.id, messageId, current.parameters.stream)
  }

  const openOverlay = (next: Exclude<OverlayState, null>, trigger?: HTMLElement) => {
    overlayTriggerRef.current = trigger ?? document.activeElement as HTMLElement | null
    setOverlay(next)
  }

  const openOverlayAfterMenu = (next: Exclude<OverlayState, null>, trigger?: HTMLElement) => {
    overlayTriggerRef.current = trigger ?? document.activeElement as HTMLElement | null
    window.setTimeout(() => setOverlay(next), 150)
  }

  const closeOverlay = () => setOverlay(null)

  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    window.setTimeout(() => {
      const trigger = overlayTriggerRef.current
      if (trigger?.isConnected) trigger.focus()
      else historyTriggerRef.current?.focus()
    })
  }

  const deleteConversationFromRail = (id: string, trigger: HTMLElement) => {
    overlayTriggerRef.current = trigger
    if (!historyOpen) {
      setOverlay({ kind: 'delete-conversation', id })
      return
    }
    setHistoryOpen(false)
    window.setTimeout(() => setOverlay({ kind: 'delete-conversation', id }), 350)
  }

  const localDataFromRail = (trigger: HTMLElement) => {
    overlayTriggerRef.current = trigger
    if (!historyOpen) {
      setOverlay({ kind: 'local-data' })
      return
    }
    setHistoryOpen(false)
    window.setTimeout(() => setOverlay({ kind: 'local-data' }), 350)
  }

  const confirmDestructive = async () => {
    if (!overlay) return
    if (overlay.kind === 'delete-conversation') {
      await deletePrototypeConversation(overlay.id)
      const remaining = conversationsRef.current.filter((conversation) => conversation.id !== overlay.id).sort((a, b) => b.updatedAt - a.updatedAt)
      conversationsRef.current = remaining
      setConversations(remaining)
      if (currentId === overlay.id) setCurrentId(remaining[0]?.id ?? null)
      toast.success('Conversation deleted')
    }
    if (overlay.kind === 'delete-message' && current) {
      replaceConversation(current.id, (conversation) => ({ ...conversation, updatedAt: Date.now(), messages: conversation.messages.filter((message) => message.id !== overlay.id) }))
      toast.success('Message deleted')
    }
    if (overlay.kind === 'clear-all') {
      clearStream()
      setBusy(false)
      await clearPrototypeConversations()
      conversationsRef.current = []
      setConversations([])
      setCurrentId(null)
      toast.success('All conversations cleared')
    }
    closeOverlay()
  }

  const saveParameters = async () => {
    const updated = current ? replaceConversation(current.id, (conversation) => ({ ...conversation, parameters: { ...parameterDraft }, updatedAt: Date.now() })) : undefined
    if (updated) await savePrototypeConversation(updated)
    closeOverlay()
    toast.success('Parameters saved')
  }

  const saveEdit = () => {
    if (!current || overlay?.kind !== 'edit-message' || !editDraft.trim()) return
    const index = current.messages.findIndex((message) => message.id === overlay.id)
    if (index < 0) return
    const edited: PrototypeChatMessage = { ...current.messages[index]!, content: editDraft.trim(), copyKey: undefined, status: 'complete' }
    const assistant: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming', createdAt: Date.now() }
    replaceConversation(current.id, (conversation) => ({ ...conversation, updatedAt: Date.now(), messages: [...conversation.messages.slice(0, index), edited, assistant] }))
    closeOverlay()
    streamAnswer(current.id, assistant.id, current.parameters.stream)
  }

  const copyMessage = async (message: PrototypeChatMessage) => {
    try {
      await navigator.clipboard.writeText(messageText(message))
      toast.success('Message copied')
    } catch {
      toast.error('Message could not be copied')
    }
  }

  const exportConversations = () => {
    if (!conversations.length) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'partokens-local-conversations.json'
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Local conversations exported')
  }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      if (!Array.isArray(parsed) || !parsed.every(isImportableConversation)) throw new Error('invalid')
      await importPrototypeConversations(parsed)
      const items = await loadPrototypeConversations()
      conversationsRef.current = items
      setConversations(items)
      setCurrentId(items[0]?.id ?? null)
      closeOverlay()
      toast.success('Import complete')
    } catch {
      toast.error('This file does not contain valid Partokens conversations')
    } finally {
      setImporting(false)
    }
  }

  const composerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const railProps: RailProps = {
    conversations: sortedConversations,
    currentId,
    query,
    busy,
    onQuery: setQuery,
    onNew: createChat,
    onSelect: (id) => { setCurrentId(id); setHistoryOpen(false) },
    onDelete: deleteConversationFromRail,
    onLocalData: localDataFromRail,
  }

  const overlayTitle = overlay?.kind === 'parameters' ? 'Generation parameters'
    : overlay?.kind === 'local-data' ? 'Local conversation data'
      : overlay?.kind === 'edit-message' ? 'Edit and regenerate'
        : overlay?.kind === 'delete-message' ? 'Delete message'
          : overlay?.kind === 'delete-conversation' ? 'Delete conversation'
            : 'Clear all conversations'

  const overlayDescription = overlay?.kind === 'parameters' ? 'Tune this conversation without changing other chats.'
    : overlay?.kind === 'local-data' ? 'Manage the IndexedDB data stored by this browser.'
      : overlay?.kind === 'edit-message' ? 'Messages after this point will be replaced by a new response.'
        : overlay?.kind === 'delete-message' ? 'Delete this message from the local conversation?'
          : overlay?.kind === 'delete-conversation' ? 'Delete this conversation from this browser?'
            : 'Clear every local conversation for this account? This cannot be undone.'

  const complexOverlay = overlay?.kind === 'parameters' || overlay?.kind === 'local-data' || overlay?.kind === 'edit-message'
  const overlayBody = overlay?.kind === 'parameters' ? <ParametersForm value={parameterDraft} onChange={setParameterDraft} />
    : overlay?.kind === 'local-data' ? <LocalDataPanel conversations={conversations} busy={busy} importing={importing} onExport={exportConversations} onImport={() => fileRef.current?.click()} onClear={() => setOverlay({ kind: 'clear-all' })} />
      : overlay?.kind === 'edit-message' ? <div className='space-y-2'><Label htmlFor='edit-message'>Message</Label><Textarea id='edit-message' rows={8} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} /></div>
        : null

  const overlayFooter = overlay?.kind === 'parameters' ? (
    <><Button variant='outline' onClick={closeOverlay}>Cancel</Button><Button onClick={saveParameters}><Check />Save parameters</Button></>
  ) : overlay?.kind === 'edit-message' ? (
    <><Button variant='outline' onClick={closeOverlay}>Cancel</Button><Button disabled={!editDraft.trim()} onClick={saveEdit}><RotateCcw />Save and regenerate</Button></>
  ) : overlay?.kind === 'local-data' ? <Button variant='outline' onClick={closeOverlay}>Close</Button>
    : <><Button variant='outline' onClick={closeOverlay}>Cancel</Button><Button variant='destructive' onClick={() => void confirmDestructive()}><Trash2 />{overlay?.kind === 'clear-all' ? 'Clear all' : 'Delete'}</Button></>

  return (
    <>
      <div className='overflow-hidden rounded-md border bg-background shadow-xs md:grid md:h-[calc(100svh-7rem)] md:min-h-[620px] md:grid-cols-[248px_minmax(0,1fr)]'>
        <aside className='hidden min-h-0 border-e bg-muted/10 md:block' aria-label='Local conversations'><ConversationRail {...railProps} /></aside>
        <section className='flex min-h-[calc(100svh-7rem)] min-w-0 flex-col md:min-h-0'>
          <header className='grid min-h-14 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b px-2 py-2 sm:flex sm:flex-wrap sm:px-3'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button ref={historyTriggerRef} type='button' variant='ghost' size='icon' className='md:hidden' aria-label='Open conversation history' onClick={() => setHistoryOpen(true)}><PanelLeft /></Button>
              </TooltipTrigger>
              <TooltipContent>Open conversation history</TooltipContent>
            </Tooltip>
            <Input
              className='min-w-0 flex-1 border-0 bg-transparent px-2 font-medium shadow-none focus-visible:ring-0 sm:min-w-44'
              value={titleDraft}
              aria-label='Conversation name'
              placeholder='New conversation'
              disabled={!current || busy}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
            />
            <div className='col-span-2 flex min-w-0 items-center justify-end gap-1 sm:ms-auto'>
              <Select value={current?.model || ''} disabled={!current || busy} onValueChange={(model) => void updateSelection({ model })}>
                <SelectTrigger className='w-[132px] sm:w-[168px]' aria-label='Model'><Bot className='size-4' /><SelectValue placeholder='Model' /></SelectTrigger>
                <SelectContent>{models.map((model) => <SelectItem value={model} key={model}>{model}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={current?.group || ''} disabled={!current || busy} onValueChange={(group) => void updateSelection({ group })}>
                <SelectTrigger className='hidden w-[104px] sm:flex' aria-label='Group'><SelectValue placeholder='Group' /></SelectTrigger>
                <SelectContent>{groups.map((group) => <SelectItem value={group} key={group}>{group}</SelectItem>)}</SelectContent>
              </Select>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label='Generation parameters'
                title='Generation parameters'
                disabled={!current || busy}
                onClick={() => { setParameterDraft({ ...(current?.parameters || defaultPrototypeParameters) }); openOverlay({ kind: 'parameters' }) }}
              >
                <Settings2 />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button ref={moreTriggerRef} variant='ghost' size='icon' aria-label='More Playground actions'><Ellipsis /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuLabel>Playground</DropdownMenuLabel>
                  <DropdownMenuItem className='sm:hidden' disabled={!current || busy} onSelect={() => { if (current) void updateSelection({ group: current.group === 'default' ? 'trial' : 'default' }) }}>Group: {current?.group || 'none'}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openOverlayAfterMenu({ kind: 'local-data' }, moreTriggerRef.current ?? undefined)}><Database />Local data</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Preview data state</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => setDataState('live')}><Check className={dataState === 'live' ? '' : 'invisible'} />Live data</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDataState('loading')}><LoaderCircle />Loading</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDataState('error')}><AlertTriangle />Storage error</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <RouteStrip model={current?.model || 'gpt-4.1-mini'} />

          {dataState === 'loading' ? <LoadingWorkspace /> : dataState === 'error' ? <ErrorWorkspace onRetry={() => void load()} /> : (
            <>
              <div ref={streamRef} className='min-h-0 flex-1 overflow-y-auto' aria-live='polite'>
                {!current?.messages.length ? (
                  <div className='flex min-h-full flex-col items-center justify-center px-5 py-12 text-center'>
                    <div className='mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40'><Sparkles className='size-5 text-muted-foreground' /></div>
                    <h1 className='text-base font-semibold'>Start with a question</h1>
                    <p className='mt-1 max-w-md text-sm text-muted-foreground'>Messages are sent through Partokens to the selected model provider when you submit them.</p>
                    <div className='mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-3'>
                      {suggestedPrompts.map((prompt) => <Button variant='outline' className='h-auto min-h-10 whitespace-normal px-3 py-2 text-xs' key={prompt} onClick={() => setDraft(prompt)}>{prompt}</Button>)}
                    </div>
                  </div>
                ) : (
                  <div className='mx-auto w-full max-w-3xl divide-y px-3 sm:px-6'>
                    {current.messages.map((message) => (
                      <article className='group py-5' key={message.id}>
                        <header className='mb-2 flex items-start gap-3'>
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {message.role === 'assistant' ? <Bot className='size-4' /> : <UserRound className='size-4' />}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                              <span className='text-sm font-medium'>{message.role === 'assistant' ? 'Partokens' : 'You'}</span>
                              <span className={`text-xs ${message.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>{message.status === 'streaming' ? 'Streaming' : message.status === 'stopped' ? 'Stopped' : message.status === 'error' ? 'Failed' : 'Complete'}</span>
                            </div>
                            <p className='mt-2 whitespace-pre-wrap break-words text-sm leading-6'>{messageText(message) || (message.status === 'streaming' ? 'New answer streaming...' : '')}</p>
                            {message.reasoningKey ? <details className='mt-3 rounded-md border bg-muted/30 p-3 text-sm'><summary className='cursor-pointer font-medium'>Reasoning</summary><p className='mt-2 text-muted-foreground'>{message.reasoningKey}</p></details> : null}
                          </div>
                          <div className='hidden shrink-0 items-center sm:flex'>
                            <IconButton label='Copy message' onClick={() => void copyMessage(message)}><Copy className='size-4' /></IconButton>
                            {message.role === 'user'
                              ? <IconButton label='Edit and regenerate' disabled={busy} onClick={() => { setEditDraft(messageText(message)); openOverlay({ kind: 'edit-message', id: message.id }) }}><Pencil className='size-4' /></IconButton>
                              : <IconButton label='Regenerate response' disabled={busy} onClick={() => regenerate(message.id)}><RotateCcw className='size-4' /></IconButton>}
                            <IconButton label='Delete message' disabled={busy} onClick={() => openOverlay({ kind: 'delete-message', id: message.id })}><Trash2 className='size-4' /></IconButton>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='shrink-0 sm:hidden' aria-label='Message actions'><Ellipsis /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onSelect={() => void copyMessage(message)}><Copy />Copy</DropdownMenuItem>
                              {message.role === 'user'
                                ? <DropdownMenuItem disabled={busy} onSelect={() => { setEditDraft(messageText(message)); openOverlayAfterMenu({ kind: 'edit-message', id: message.id }) }}><Pencil />Edit and regenerate</DropdownMenuItem>
                                : <DropdownMenuItem disabled={busy} onSelect={() => regenerate(message.id)}><RotateCcw />Regenerate</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant='destructive' disabled={busy} onSelect={() => openOverlayAfterMenu({ kind: 'delete-message', id: message.id })}><Trash2 />Delete message</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </header>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <form className='border-t bg-background p-3 sm:p-4' onSubmit={submit}>
                <div className='mx-auto max-w-3xl rounded-md border bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring/50'>
                  <Textarea
                    className='min-h-20 resize-none border-0 shadow-none focus-visible:ring-0'
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={composerKeyDown}
                    placeholder='Message the selected model...'
                    aria-label='Message'
                    disabled={dataState !== 'live'}
                  />
                  <div className='flex items-center gap-2 border-t px-2 py-2'>
                    <span className='min-w-0 flex-1 text-xs text-muted-foreground'><Info className='me-1 inline size-3' />{current?.parameters.stream === false ? 'Streaming off' : 'Streaming on'}<span className='hidden sm:inline'> · Sent through Partokens</span></span>
                    {busy ? <Button type='button' variant='outline' size='sm' onClick={stopGeneration}><Square />Stop</Button> : <Button type='submit' size='sm' disabled={!draft.trim()}><Send />Send</Button>}
                  </div>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side='left' className='w-[min(90vw,320px)] gap-0 p-0' onCloseAutoFocus={(event) => { event.preventDefault(); historyTriggerRef.current?.focus() }}>
          <SheetHeader className='border-b pe-12'><SheetTitle>Conversation history</SheetTitle><SheetDescription>Local conversations stored in this browser.</SheetDescription></SheetHeader>
          <div className='min-h-0 flex-1'><ConversationRail {...railProps} /></div>
        </SheetContent>
      </Sheet>

      {overlay && complexOverlay && isMobile ? (
        <Sheet open onOpenChange={(open) => !open && closeOverlay()}>
          <SheetContent
            className='w-full sm:max-w-md'
            onCloseAutoFocus={closeAutoFocus}
            onEscapeKeyDown={(event) => {
              event.preventDefault()
              closeOverlay()
            }}
          >
            <SheetHeader><SheetTitle>{overlayTitle}</SheetTitle><SheetDescription>{overlayDescription}</SheetDescription></SheetHeader>
            <div className='min-h-0 flex-1 overflow-y-auto px-4 py-2'>{overlayBody}</div>
            <SheetFooter className='border-t'>{overlayFooter}</SheetFooter>
          </SheetContent>
        </Sheet>
      ) : overlay ? (
        <Dialog open onOpenChange={(open) => !open && closeOverlay()}>
          <DialogContent key={overlay.kind} className={complexOverlay ? 'max-h-[90svh] overflow-y-auto sm:max-w-xl' : 'sm:max-w-md'} onCloseAutoFocus={closeAutoFocus}>
            <DialogHeader><DialogTitle>{overlayTitle}</DialogTitle><DialogDescription>{overlayDescription}</DialogDescription></DialogHeader>
            {overlayBody}
            <DialogFooter>{overlayFooter}</DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <input ref={fileRef} hidden type='file' accept='application/json,.json' onChange={(event) => void importFile(event)} />
    </>
  )
}

export function ShadcnPlaygroundScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  return (
    <ConsoleShell activeRoute='console-playground' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <PlaygroundContent />
    </ConsoleShell>
  )
}
