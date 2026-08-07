import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Database,
  Ellipsis,
  LoaderCircle,
  PanelLeft,
  Pencil,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  UserRound,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import {
  getUserGroupsWithSignal,
  getUserModels,
  playgroundCompletion,
  streamPlaygroundCompletion,
} from '@partokens/api-client'
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from '@partokens/design-system/components'
import { isAppLocale } from '@partokens/i18n'

import {
  ConversationRail,
  PlaygroundIconButton,
  PlaygroundLoading,
  PlaygroundLocalData,
  PlaygroundMessageContent,
  PlaygroundParametersForm,
  PlaygroundStorageError,
} from '@/features/playground/playground-ui'
import {
  createConversation,
  database,
  defaultPlaygroundParameters,
  ownerNamespace,
  type LocalConversation,
  type LocalMessage,
  type PlaygroundParameters,
} from '@/db'
import { extractItems } from '@/lib/format'
import {
  buildPlaygroundCompletionInput,
  createPlaygroundExport,
  normalizePlaygroundParameters,
  normalizeStoredConversation,
  parsePlaygroundImport,
  playgroundRequestCategory,
  resolvePlaygroundTitle,
} from '@/lib/playground'
import { canonicalConsolePath } from '@/lib/routes'
import { useSessionStore } from '@/stores/session'

const PERSIST_DELAY_MS = 80
const MAX_IMPORT_BYTES = 5 * 1024 * 1024
const suggestedPrompts = ['Plan a model rollout', 'Compare prompt costs', 'Draft an incident update']

type PlaygroundDataState = 'loading' | 'live' | 'error'
type PlaygroundOverlay =
  | { kind: 'selection' }
  | { kind: 'parameters' }
  | { kind: 'local-data' }
  | { kind: 'edit-message'; id: string }
  | { kind: 'delete-message'; id: string }
  | { kind: 'delete-conversation'; id: string }
  | { kind: 'clear-all' }
  | null

function mergeStreamChunk(current: string, chunk: string): string {
  if (current && chunk.startsWith(current)) return chunk
  return current + chunk
}

function safeFilename(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'partokens-chats'
}

function downloadJson(value: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function responseStatus(message: LocalMessage): string {
  if (message.status === 'streaming') return 'Streaming'
  if (message.status === 'stopped') return 'Stopped'
  if (message.status === 'error') return 'Failed'
  return 'Complete'
}

export function PlaygroundPage() {
  const { t } = useTranslation()
  const translate = (key: string) => t(key)
  const params = useParams({ strict: false }) as { locale?: string; chatId?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const { user, setUser } = useSessionStore()
  const [conversations, setConversations] = useState<LocalConversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('')
  const [group, setGroup] = useState('default')
  const [parameters, setParameters] = useState<PlaygroundParameters>({ ...defaultPlaygroundParameters })
  const [parameterDraft, setParameterDraft] = useState<PlaygroundParameters>({ ...defaultPlaygroundParameters })
  const [selectionDraft, setSelectionDraft] = useState({ group: 'default', model: '' })
  const [editDraft, setEditDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [overlay, setOverlay] = useState<PlaygroundOverlay>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [dataState, setDataState] = useState<PlaygroundDataState>('loading')
  const [importing, setImporting] = useState(false)
  const [browserStorage, setBrowserStorage] = useState<{ usage: number; quota: number } | null>(null)
  const conversationsRef = useRef<LocalConversation[]>([])
  const currentIdRef = useRef<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const persistTimerRef = useRef<number | null>(null)
  const pendingPersistRef = useRef<LocalConversation | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)
  const streamRef = useRef<HTMLDivElement>(null)
  const historyTriggerRef = useRef<HTMLButtonElement>(null)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)
  const overlayTriggerRef = useRef<HTMLElement | null>(null)

  const modelsQuery = useQuery({
    queryKey: ['user-models', group],
    queryFn: ({ signal }) => getUserModels(group, signal),
    enabled: Boolean(user),
    retry: false,
  })
  const groupsQuery = useQuery({
    queryKey: ['user-groups'],
    queryFn: ({ signal }) => getUserGroupsWithSignal(signal),
    enabled: Boolean(user),
    retry: false,
  })
  const selectionModelsQuery = useQuery({
    queryKey: ['user-models', selectionDraft.group],
    queryFn: ({ signal }) => getUserModels(selectionDraft.group, signal),
    enabled: Boolean(user && overlay?.kind === 'selection' && selectionDraft.group),
    retry: false,
  })
  const models = Array.isArray(modelsQuery.data?.data)
    ? (modelsQuery.data.data as string[])
    : extractItems<string>(modelsQuery.data?.data)
  const groups = groupsQuery.data?.data && typeof groupsQuery.data.data === 'object'
    ? Object.keys(groupsQuery.data.data as Record<string, unknown>)
    : []
  const selectionModels = Array.isArray(selectionModelsQuery.data?.data)
    ? (selectionModelsQuery.data.data as string[])
    : extractItems<string>(selectionModelsQuery.data?.data)

  const replaceConversations = useCallback((items: LocalConversation[]) => {
    const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt)
    conversationsRef.current = sorted
    setConversations(sorted)
  }, [])

  const announceChange = () => channelRef.current?.postMessage({ type: 'changed' })

  const persistNow = async (conversation: LocalConversation, announce = true) => {
    await database.conversations.put(conversation)
    if (announce) announceChange()
  }

  const updateLocal = (
    id: string,
    update: (conversation: LocalConversation) => LocalConversation,
  ): LocalConversation | null => {
    const existing = conversationsRef.current.find((item) => item.id === id)
    if (!existing) return null
    const next = update(existing)
    replaceConversations(conversationsRef.current.map((item) => item.id === id ? next : item))
    return next
  }

  const schedulePersist = (conversation: LocalConversation) => {
    pendingPersistRef.current = conversation
    if (persistTimerRef.current != null) return
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null
      const pending = pendingPersistRef.current
      pendingPersistRef.current = null
      if (pending) void persistNow(pending, false)
    }, PERSIST_DELAY_MS)
  }

  const discardScheduledPersist = () => {
    if (persistTimerRef.current != null) window.clearTimeout(persistTimerRef.current)
    persistTimerRef.current = null
    pendingPersistRef.current = null
  }

  const refresh = useCallback(async (preferredId?: string) => {
    if (!user) {
      replaceConversations([])
      setCurrentId(null)
      setDataState('live')
      return []
    }
    setDataState((state) => state === 'live' ? state : 'loading')
    try {
      const stored = await database.conversations
        .where('ownerNamespace')
        .equals(ownerNamespace(user.id))
        .reverse()
        .sortBy('updatedAt')
      const items = stored.map(normalizeStoredConversation).sort((a, b) => b.updatedAt - a.updatedAt)
      const recovered = items.filter((item, index) => JSON.stringify(item) !== JSON.stringify(stored[index]))
      if (recovered.length) await database.conversations.bulkPut(recovered)
      replaceConversations(items)
      const candidate = preferredId || params.chatId || currentIdRef.current
      const nextId = items.some((item) => item.id === candidate) ? candidate! : items[0]?.id || null
      setCurrentId(nextId)
      setDataState('live')

      const playgroundPath = canonicalConsolePath(locale, 'playground')
      if (params.chatId !== nextId) {
        const target = nextId ? `${playgroundPath}/${encodeURIComponent(nextId)}` : playgroundPath
        await navigate({ to: target as never, replace: true })
      }
      return items
    } catch {
      setDataState('error')
      return []
    }
  }, [locale, navigate, params.chatId, replaceConversations, user])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!user || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(`partokens-playground:${ownerNamespace(user.id)}`)
    channelRef.current = channel
    channel.onmessage = () => {
      if (!busyRef.current) void refresh()
    }
    return () => {
      channel.close()
      if (channelRef.current === channel) channelRef.current = null
    }
  }, [refresh, user])

  useEffect(() => () => {
    abortRef.current?.abort()
    discardScheduledPersist()
  }, [])

  const current = conversations.find((item) => item.id === currentId) || null
  currentIdRef.current = currentId

  useEffect(() => {
    if (!current) return
    setModel(current.model)
    setGroup(current.group || 'default')
    setParameters(normalizePlaygroundParameters(current.parameters))
  }, [current?.id])

  useEffect(() => {
    if (!groupsQuery.isSuccess || !groups.length) return
    const fallback = groups[0]!
    if (!groups.includes(group)) setGroup(fallback)
    if (!current || groups.includes(current.group)) return
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, group: fallback, model: '', updatedAt: Date.now() }))
    if (next) void persistNow(next)
  }, [current?.group, current?.id, groupsQuery.data, groupsQuery.isSuccess])

  useEffect(() => {
    if (!modelsQuery.isSuccess) return
    const fallback = models[0] || ''
    if (!models.includes(model)) setModel(fallback)
    if (!current || models.includes(current.model)) return
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, model: fallback, updatedAt: Date.now() }))
    if (next) void persistNow(next)
  }, [current?.id, current?.model, modelsQuery.data, modelsQuery.isSuccess])

  useEffect(() => {
    if (overlay?.kind !== 'selection' || !selectionModelsQuery.isSuccess || selectionModels.includes(selectionDraft.model)) return
    setSelectionDraft((value) => ({ ...value, model: selectionModels[0] || '' }))
  }, [overlay?.kind, selectionDraft.model, selectionModelsQuery.data, selectionModelsQuery.isSuccess])

  useEffect(() => {
    void navigator.storage?.estimate().then((estimate) => {
      setBrowserStorage({ usage: estimate.usage || 0, quota: estimate.quota || 0 })
    })
  }, [conversations])

  const latestMessage = current?.messages.at(-1)
  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight })
  }, [current?.id, current?.messages.length, latestMessage?.content])

  const localExport = useMemo(() => createPlaygroundExport(conversations), [conversations])
  const localBytes = useMemo(() => new TextEncoder().encode(JSON.stringify(localExport)).byteLength, [localExport])

  const routeToConversation = async (id: string | null) => {
    setCurrentId(id)
    setHistoryOpen(false)
    const playgroundPath = canonicalConsolePath(locale, 'playground')
    const target = id ? `${playgroundPath}/${encodeURIComponent(id)}` : playgroundPath
    await navigate({ to: target as never })
  }

  const newChat = async (firstMessage?: string) => {
    if (!user || busy) return null
    const created = await createConversation(user.id)
    const next = {
      ...created,
      model,
      group,
      parameters: { ...parameters },
      title: firstMessage?.trim().slice(0, 72) || t('New conversation'),
    }
    await persistNow(next)
    replaceConversations([next, ...conversationsRef.current])
    await routeToConversation(next.id)
    return next
  }

  const renameConversation = async (id: string, title: string) => {
    if (busy) return
    const next = updateLocal(id, (conversation) => ({ ...conversation, title, updatedAt: Date.now() }))
    if (next) await persistNow(next)
    setNotice(t('Conversation renamed'))
  }

  const deleteConversation = async (id: string) => {
    if (busy) return
    await database.conversations.delete(id)
    announceChange()
    const remaining = conversationsRef.current.filter((item) => item.id !== id)
    replaceConversations(remaining)
    if (currentId === id) await routeToConversation(remaining[0]?.id || null)
    setNotice(t('Conversation deleted'))
  }

  const clearAll = async () => {
    if (!user || busy) return
    const keys = await database.conversations
      .where('ownerNamespace')
      .equals(ownerNamespace(user.id))
      .primaryKeys()
    await database.conversations.bulkDelete(keys)
    announceChange()
    replaceConversations([])
    await routeToConversation(null)
    setNotice(t('All conversations cleared'))
  }

  const requestError = (cause: unknown) => {
    const category = playgroundRequestCategory(cause)
    if (category === 'session') {
      setUser(null)
      return t('Your session expired. Sign in again.')
    }
    if (category === 'quota') return t('Your balance or request quota is insufficient.')
    if (category === 'model') return t('The selected model is unavailable for this account group.')
    if (category === 'rate') return t('Too many requests. Try again shortly.')
    return t('The model request failed.')
  }

  const finishAssistant = async (
    conversationId: string,
    messageId: string,
    patch: Partial<LocalMessage>,
  ) => {
    discardScheduledPersist()
    const next = updateLocal(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: Date.now(),
      messages: conversation.messages.map((message) => message.id === messageId ? { ...message, ...patch } : message),
    }))
    if (next) await persistNow(next)
  }

  const runCompletion = async (conversation: LocalConversation, requestMessages: LocalMessage[]) => {
    if (!conversation.model || busyRef.current) return
    const assistantId = crypto.randomUUID()
    const assistant: LocalMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning: '',
      status: 'streaming',
      createdAt: Date.now(),
    }
    const ready = updateLocal(conversation.id, (item) => ({
      ...item,
      messages: [...requestMessages, assistant],
      updatedAt: Date.now(),
    }))
    if (!ready) return
    await persistNow(ready)

    const controller = new AbortController()
    abortRef.current = controller
    busyRef.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const input = buildPlaygroundCompletionInput(ready, requestMessages)
      if (ready.parameters.stream) {
        await streamPlaygroundCompletion(input, {
          signal: controller.signal,
          onUpdate: (update) => {
            const next = updateLocal(ready.id, (item) => ({
              ...item,
              updatedAt: Date.now(),
              messages: item.messages.map((message) => {
                if (message.id !== assistantId) return message
                return update.type === 'reasoning'
                  ? { ...message, reasoning: mergeStreamChunk(message.reasoning || '', update.chunk) }
                  : { ...message, content: mergeStreamChunk(message.content, update.chunk) }
              }),
            }))
            if (next) schedulePersist(next)
          },
        })
        await finishAssistant(ready.id, assistantId, { status: 'complete' })
      } else {
        const result = await playgroundCompletion(input, controller.signal)
        const response = result.choices?.[0]?.message
        if (!response) throw new Error('empty-response')
        await finishAssistant(ready.id, assistantId, {
          content: response.content || '',
          reasoning: response.reasoning_content || '',
          status: 'complete',
        })
      }
    } catch (cause) {
      if (controller.signal.aborted) {
        await finishAssistant(ready.id, assistantId, { status: 'stopped' })
        setNotice(t('Generation stopped.'))
      } else {
        const message = requestError(cause)
        await finishAssistant(ready.id, assistantId, { status: 'error', error: message })
        setError(message)
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      busyRef.current = false
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !draft.trim() || !model || busy) return
    const userMessage: LocalMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: draft.trim(),
      status: 'complete',
      createdAt: Date.now(),
    }
    const conversation = current || await newChat(userMessage.content)
    if (!conversation) return
    const requestMessages = [...conversation.messages, userMessage]
    const next = updateLocal(conversation.id, (item) => ({
      ...item,
      title: resolvePlaygroundTitle(item.title, t('New conversation'), userMessage.content, item.messages.length > 0),
      model,
      group,
      parameters: { ...parameters },
      messages: requestMessages,
      updatedAt: Date.now(),
    }))
    if (!next) return
    setDraft('')
    await persistNow(next)
    await runCompletion(next, requestMessages)
  }

  const regenerate = async (messageId: string) => {
    if (!current || busy) return
    const index = current.messages.findIndex((message) => message.id === messageId)
    if (index < 0) return
    const requestMessages = current.messages.slice(0, index)
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, messages: requestMessages, updatedAt: Date.now() }))
    if (!next) return
    await persistNow(next)
    await runCompletion(next, requestMessages)
  }

  const saveEditedMessage = async (messageId: string) => {
    if (!current || !editDraft.trim() || busy) return
    const index = current.messages.findIndex((message) => message.id === messageId && message.role === 'user')
    if (index < 0) return
    const requestMessages = [
      ...current.messages.slice(0, index),
      { ...current.messages[index]!, content: editDraft.trim(), status: 'complete' as const },
    ]
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, messages: requestMessages, updatedAt: Date.now() }))
    setEditDraft('')
    setOverlay(null)
    if (!next) return
    await persistNow(next)
    await runCompletion(next, requestMessages)
  }

  const deleteMessage = async (messageId: string) => {
    if (!current || busy) return
    const next = updateLocal(current.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => message.id !== messageId),
      updatedAt: Date.now(),
    }))
    if (next) await persistNow(next)
  }

  const saveParameters = async () => {
    const normalized = normalizePlaygroundParameters(parameterDraft)
    setParameters(normalized)
    setOverlay(null)
    if (current) {
      const next = updateLocal(current.id, (conversation) => ({ ...conversation, parameters: normalized, updatedAt: Date.now() }))
      if (next) await persistNow(next)
    }
    setNotice(t('Parameters saved'))
  }

  const saveSelection = async () => {
    if (!current || !selectionDraft.model || !selectionDraft.group) return
    setModel(selectionDraft.model)
    setGroup(selectionDraft.group)
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, ...selectionDraft, updatedAt: Date.now() }))
    if (next) await persistNow(next)
    setOverlay(null)
    setNotice(t('Conversation settings saved'))
  }

  const copyMessage = async (message: LocalMessage) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setNotice(t('Copied'))
    } catch {
      setError(t('Copy failed'))
    }
  }

  const exportConversations = () => {
    downloadJson(localExport, `${safeFilename(user?.username || 'partokens')}-chats.json`)
    setNotice(t('Local conversations exported.'))
  }

  const importConversations = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    setError('')
    setImporting(true)
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('too-large')
      const imported = parsePlaygroundImport(JSON.parse(await file.text()), ownerNamespace(user.id))
      await database.conversations.bulkAdd(imported)
      announceChange()
      await refresh(imported[0]?.id)
      if (imported[0]) await routeToConversation(imported[0].id)
      setNotice(t('Local conversations imported.'))
      setOverlay(null)
    } catch (cause) {
      setError(t(cause instanceof Error && cause.message === 'too-large' ? 'The conversation file is too large.' : 'Unable to import this conversation file.'))
    } finally {
      setImporting(false)
    }
  }

  const composerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const openOverlay = (next: Exclude<PlaygroundOverlay, null>, trigger?: HTMLElement) => {
    overlayTriggerRef.current = trigger ?? document.activeElement as HTMLElement | null
    setOverlay(next)
  }

  const openOverlayAfterMenu = (next: Exclude<PlaygroundOverlay, null>, trigger?: HTMLElement) => {
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

  const openConversationDelete = (id: string, trigger: HTMLElement) => {
    overlayTriggerRef.current = trigger
    if (!historyOpen) {
      setOverlay({ kind: 'delete-conversation', id })
      return
    }
    setHistoryOpen(false)
    window.setTimeout(() => setOverlay({ kind: 'delete-conversation', id }), 350)
  }

  const openLocalData = (trigger: HTMLElement) => {
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
    const action = overlay
    setOverlay(null)
    if (action.kind === 'delete-conversation') await deleteConversation(action.id)
    if (action.kind === 'delete-message') await deleteMessage(action.id)
    if (action.kind === 'clear-all') await clearAll()
  }

  const railProps = {
    conversations,
    currentId,
    query,
    busy,
    locale,
    bytes: localBytes,
    t: translate,
    onQuery: setQuery,
    onNew: () => { void newChat() },
    onSelect: (id: string) => { void routeToConversation(id) },
    onRename: (id: string, title: string) => { void renameConversation(id, title) },
    onDelete: openConversationDelete,
    onLocalData: openLocalData,
  }

  const overlayTitle = overlay?.kind === 'selection' ? t('Model and group')
    : overlay?.kind === 'parameters' ? t('Generation parameters')
      : overlay?.kind === 'local-data' ? t('Local conversation data')
        : overlay?.kind === 'edit-message' ? t('Edit and regenerate')
          : overlay?.kind === 'delete-message' ? t('Delete message')
            : overlay?.kind === 'delete-conversation' ? t('Delete conversation')
              : t('Clear all conversations')

  const overlayDescription = overlay?.kind === 'selection' ? t('Choose the account group and model for this conversation.')
    : overlay?.kind === 'parameters' ? t('Show the response as it arrives')
      : overlay?.kind === 'local-data' ? t('Manage the IndexedDB data stored by this browser.')
        : overlay?.kind === 'edit-message' ? t('Messages after this point will be replaced by a new response.')
          : overlay?.kind === 'delete-message' ? t('Delete this message from the local conversation?')
            : overlay?.kind === 'delete-conversation' ? t('Delete this conversation from this browser?')
              : `${t('Clear every local conversation for this account?')} ${t('This cannot be undone.')}`

  const complexOverlay = overlay?.kind === 'selection'
    || overlay?.kind === 'parameters'
    || overlay?.kind === 'local-data'
    || overlay?.kind === 'edit-message'

  const overlayBody = overlay?.kind === 'selection' ? (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="conversation-group">{t('Group')}</Label>
        <Select
          value={selectionDraft.group}
          onValueChange={(nextGroup) => setSelectionDraft({ group: nextGroup, model: '' })}
          disabled={groupsQuery.isLoading || groupsQuery.isError || !groups.length}
        >
          <SelectTrigger id="conversation-group" className="w-full"><SelectValue placeholder={t('Select group')} /></SelectTrigger>
          <SelectContent>{groups.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="conversation-model">{t('Model')}</Label>
        <Select
          value={selectionDraft.model}
          onValueChange={(nextModel) => setSelectionDraft((value) => ({ ...value, model: nextModel }))}
          disabled={selectionModelsQuery.isLoading || selectionModelsQuery.isError || !selectionModels.length}
        >
          <SelectTrigger id="conversation-model" className="w-full"><SelectValue placeholder={selectionModelsQuery.isLoading ? t('Loading') : t('Select model')} /></SelectTrigger>
          <SelectContent>{selectionModels.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {groupsQuery.isError || selectionModelsQuery.isError ? <p className="text-sm text-destructive" role="alert">{t('Interface data unavailable')}</p> : null}
    </div>
  ) : overlay?.kind === 'parameters' ? (
    <PlaygroundParametersForm value={parameterDraft} t={translate} onChange={setParameterDraft} />
  ) : overlay?.kind === 'local-data' ? (
    <PlaygroundLocalData
      conversations={conversations}
      bytes={localBytes}
      browserStorage={browserStorage}
      busy={busy}
      importing={importing}
      locale={locale}
      t={translate}
      onExport={exportConversations}
      onImport={() => importRef.current?.click()}
      onClear={() => setOverlay({ kind: 'clear-all' })}
    />
  ) : overlay?.kind === 'edit-message' ? (
    <div className="space-y-2"><Label htmlFor="edit-message">{t('Message')}</Label><Textarea id="edit-message" rows={8} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} /></div>
  ) : null

  const overlayFooter = overlay?.kind === 'selection' ? (
    <><Button variant="outline" onClick={closeOverlay}>{t('Cancel')}</Button><Button disabled={!selectionDraft.group || !selectionDraft.model} onClick={() => void saveSelection()}><Check />{t('Save')}</Button></>
  ) : overlay?.kind === 'parameters' ? (
    <><Button variant="outline" onClick={closeOverlay}>{t('Cancel')}</Button><Button onClick={() => void saveParameters()}><Check />{t('Save parameters')}</Button></>
  ) : overlay?.kind === 'edit-message' ? (
    <><Button variant="outline" onClick={closeOverlay}>{t('Cancel')}</Button><Button disabled={!editDraft.trim()} onClick={() => void saveEditedMessage(overlay.id)}><RotateCcw />{t('Save and regenerate')}</Button></>
  ) : overlay?.kind === 'local-data' ? (
    <Button variant="outline" onClick={closeOverlay}>{t('Close')}</Button>
  ) : (
    <><Button variant="outline" onClick={closeOverlay}>{t('Cancel')}</Button><Button variant="destructive" disabled={busy} onClick={() => void confirmDestructive()}><Trash2 />{overlay?.kind === 'clear-all' ? t('Clear all') : t('Delete')}</Button></>
  )

  return (
    <div data-playground-page>
      <div className="h-[calc(100svh-7rem)] min-h-[520px] overflow-hidden rounded-md border bg-background shadow-xs lg:grid lg:min-h-[620px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 border-e bg-muted/10 lg:block" aria-label={t('Local conversations')}><ConversationRail {...railProps} /></aside>
        <section className="flex h-full min-h-0 min-w-0 flex-col">
          <header className="flex min-h-12 items-center justify-between border-b px-2 py-1 sm:px-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button ref={historyTriggerRef} type="button" variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label={t('Open conversation history')} onClick={() => setHistoryOpen(true)}><PanelLeft /></Button>
                </TooltipTrigger>
                <TooltipContent>{t('Open conversation history')}</TooltipContent>
              </Tooltip>
              <h1 className="truncate px-1 text-sm font-medium" title={current?.title}>{current?.title || t('New conversation')}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button ref={moreTriggerRef} className="ms-auto" variant="ghost" size="icon" aria-label={t('More Playground actions')}><Ellipsis /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{t('Playground')}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => openOverlayAfterMenu({ kind: 'local-data' }, moreTriggerRef.current ?? undefined)}><Database />{t('Local data')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {dataState === 'loading' ? <PlaygroundLoading t={translate} /> : dataState === 'error' ? <PlaygroundStorageError t={translate} onRetry={() => void refresh()} /> : (
            <>
              <div ref={streamRef} className="min-h-0 flex-1 overflow-y-auto">
                <div className="sr-only" role="status" aria-live="polite">{busy ? t('Streaming') : ''}</div>
                {!current?.messages.length ? (
                  <div className="flex min-h-full flex-col items-center justify-center px-5 py-12 text-center">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40"><Sparkles className="size-5 text-muted-foreground" /></div>
                    <h2 className="text-base font-semibold">{t('Start with a question')}</h2>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('Messages are sent through Partokens to the selected model provider when you submit them.')}</p>
                    <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-3">
                      {suggestedPrompts.map((prompt) => <Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal px-3 py-2 text-xs" key={prompt} onClick={() => setDraft(t(prompt))}>{t(prompt)}</Button>)}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-3xl divide-y px-3 sm:px-6">
                    {current.messages.map((message) => (
                      <article className={`group py-5 ${message.role === 'assistant' ? 'border-s-2 border-s-primary ps-3 sm:ps-4' : ''}`} key={message.id}>
                        <header className="flex items-start gap-3">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {message.role === 'assistant' ? <Bot className="size-4" /> : <UserRound className="size-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-medium">{message.role === 'assistant' ? 'Partokens' : t('You')}</span>
                              <span className={`text-xs ${message.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>{t(responseStatus(message))}</span>
                            </div>
                            {message.reasoning ? <details className="mt-3 rounded-md border bg-muted/30 p-3 text-sm"><summary className="cursor-pointer font-medium">{t('Reasoning')}</summary><p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{message.reasoning}</p></details> : null}
                            <PlaygroundMessageContent content={message.content || (message.status === 'streaming' ? t('New answer streaming...') : '')} />
                            {message.error ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{message.error}</p> : null}
                          </div>
                          <div className="hidden shrink-0 items-center sm:flex">
                            <PlaygroundIconButton label={t('Copy message')} onClick={() => void copyMessage(message)}><Copy className="size-4" /></PlaygroundIconButton>
                            {message.role === 'user'
                              ? <PlaygroundIconButton label={t('Edit and regenerate')} disabled={busy} onClick={() => { setEditDraft(message.content); openOverlay({ kind: 'edit-message', id: message.id }) }}><Pencil className="size-4" /></PlaygroundIconButton>
                              : <PlaygroundIconButton label={t('Regenerate response')} disabled={busy} onClick={() => void regenerate(message.id)}><RotateCcw className="size-4" /></PlaygroundIconButton>}
                            <PlaygroundIconButton label={t('Delete message')} disabled={busy} onClick={() => openOverlay({ kind: 'delete-message', id: message.id })}><Trash2 className="size-4" /></PlaygroundIconButton>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 sm:hidden" aria-label={t('Message actions')}><Ellipsis /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => void copyMessage(message)}><Copy />{t('Copy')}</DropdownMenuItem>
                              {message.role === 'user'
                                ? <DropdownMenuItem disabled={busy} onSelect={() => { setEditDraft(message.content); openOverlayAfterMenu({ kind: 'edit-message', id: message.id }) }}><Pencil />{t('Edit and regenerate')}</DropdownMenuItem>
                                : <DropdownMenuItem disabled={busy} onSelect={() => void regenerate(message.id)}><RotateCcw />{t('Regenerate response')}</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" disabled={busy} onSelect={() => openOverlayAfterMenu({ kind: 'delete-message', id: message.id })}><Trash2 />{t('Delete message')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </header>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <form className="border-t bg-background p-3 sm:p-4" onSubmit={(event) => void submit(event)}>
                <div className="mx-auto max-w-3xl">
                  {error ? <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive" role="alert">{error}</p> : null}
                  {notice ? <p className="mb-2 rounded-md border bg-muted/30 p-2 text-sm text-muted-foreground" role="status">{notice}</p> : null}
                  <div className="rounded-md border bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring/50">
                    <Textarea
                      className="min-h-20 resize-none border-0 shadow-none focus-visible:ring-0"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={composerKeyDown}
                      placeholder={t('Message the selected model...')}
                      aria-label={t('Message')}
                    />
                    <div className="flex min-w-0 items-center justify-end gap-1.5 border-t px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit min-w-0 max-w-[calc(100%-5.25rem)] flex-none justify-start px-2 text-xs transition-colors hover:bg-muted focus-visible:bg-muted sm:max-w-[210px] sm:text-sm"
                        aria-label={model ? `${t('Model and group')}: ${model}` : t('Select model and group. Current model: none')}
                        disabled={!current || busy}
                        onClick={(event) => {
                          if (!current) return
                          const selectedGroup = groups.includes(current.group) ? current.group : groups[0] || current.group
                          setSelectionDraft({ group: selectedGroup, model: selectedGroup === current.group ? current.model : '' })
                          openOverlay({ kind: 'selection' }, event.currentTarget)
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate text-start">{model || t('Select model')}</span>
                        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label={t('Generation parameters')}
                            disabled={!current || busy}
                            onClick={() => { setParameterDraft({ ...parameters }); openOverlay({ kind: 'parameters' }) }}
                          >
                            <Settings2 />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Generation parameters')}</TooltipContent>
                      </Tooltip>
                      {busy ? (
                        <Button type="button" variant="outline" size="sm" className="shrink-0 px-2 sm:px-3" aria-label={t('Stop generation')} onClick={() => abortRef.current?.abort()}><Square /><span className="hidden sm:inline">{t('Stop')}</span></Button>
                      ) : (
                        <Button type="submit" size="sm" className="shrink-0 px-2 sm:px-3" aria-label={t('Send')} disabled={!draft.trim() || !model}><Send /><span className="hidden sm:inline">{t('Send')}</span></Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="w-[min(90vw,320px)] gap-0 p-0" onCloseAutoFocus={(event) => { event.preventDefault(); historyTriggerRef.current?.focus() }}>
          <SheetHeader className="border-b pe-12"><SheetTitle>{t('Conversation history')}</SheetTitle><SheetDescription>{t('Local conversations stored in this browser.')}</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1"><ConversationRail {...railProps} /></div>
        </SheetContent>
      </Sheet>

      {overlay && complexOverlay && isMobile ? (
        <Sheet open onOpenChange={(open) => !open && closeOverlay()}>
          <SheetContent className="w-full sm:max-w-md" onCloseAutoFocus={closeAutoFocus}>
            <SheetHeader><SheetTitle>{overlayTitle}</SheetTitle><SheetDescription>{overlayDescription}</SheetDescription></SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{overlayBody}</div>
            <SheetFooter className="border-t">{overlayFooter}</SheetFooter>
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

      <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importConversations(event)} />
    </div>
  )
}
