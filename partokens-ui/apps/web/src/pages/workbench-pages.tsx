import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Check,
  Copy,
  Download,
  HardDrive,
  LoaderCircle,
  MessageSquare,
  PanelLeft,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
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
  getUserGroups,
  getUserModels,
  playgroundCompletion,
  streamPlaygroundCompletion,
} from '@partokens/api-client'
import { isAppLocale } from '@partokens/i18n'

import { Modal } from '@/components/modal'
import { IconButton } from '@/components/ui'
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
  formatLocalBytes,
  normalizePlaygroundParameters,
  normalizeStoredConversation,
  parsePlaygroundImport,
  playgroundRequestCategory,
  resolvePlaygroundTitle,
} from '@/lib/playground'
import { useSessionStore } from '@/stores/session'

const PERSIST_DELAY_MS = 80
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

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

export function PlaygroundPage() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { locale?: string; chatId?: string }
  const locale = isAppLocale(params.locale) ? params.locale : 'zh-CN'
  const navigate = useNavigate()
  const { user, setUser } = useSessionStore()
  const [conversations, setConversations] = useState<LocalConversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('')
  const [group, setGroup] = useState('default')
  const [parameters, setParameters] = useState<PlaygroundParameters>({ ...defaultPlaygroundParameters })
  const [parameterDraft, setParameterDraft] = useState<PlaygroundParameters>({ ...defaultPlaygroundParameters })
  const [titleDraft, setTitleDraft] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [parametersOpen, setParametersOpen] = useState(false)
  const [localDataOpen, setLocalDataOpen] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [browserStorage, setBrowserStorage] = useState<{ usage: number; quota: number } | null>(null)
  const conversationsRef = useRef<LocalConversation[]>([])
  const currentIdRef = useRef<string | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const persistTimerRef = useRef<number | null>(null)
  const pendingPersistRef = useRef<LocalConversation | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)

  const modelsQuery = useQuery({
    queryKey: ['user-models', group],
    queryFn: () => getUserModels(group),
    enabled: Boolean(user),
    retry: false,
  })
  const groupsQuery = useQuery({
    queryKey: ['user-groups'],
    queryFn: getUserGroups,
    enabled: Boolean(user),
    retry: false,
  })
  const models = Array.isArray(modelsQuery.data?.data)
    ? (modelsQuery.data.data as string[])
    : extractItems<string>(modelsQuery.data?.data)
  const groups = groupsQuery.data?.data && typeof groupsQuery.data.data === 'object'
    ? Object.keys(groupsQuery.data.data as Record<string, unknown>)
    : ['default']

  const replaceConversations = (items: LocalConversation[]) => {
    const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt)
    conversationsRef.current = sorted
    setConversations(sorted)
  }

  const refresh = useCallback(async (preferredId?: string) => {
    if (!user) return []
    const items = (await database.conversations
      .where('ownerNamespace')
      .equals(ownerNamespace(user.id))
      .reverse()
      .sortBy('updatedAt'))
      .map(normalizeStoredConversation)
      .sort((a, b) => b.updatedAt - a.updatedAt)
    replaceConversations(items)
    const candidate = preferredId || params.chatId || currentIdRef.current
    const nextId = items.some((item) => item.id === candidate) ? candidate! : items[0]?.id || null
    setCurrentId(nextId)
    return items
  }, [params.chatId, user])

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

  useEffect(() => { void refresh() }, [user?.id])

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
  }, [user?.id])

  useEffect(() => () => {
    abortRef.current?.abort()
    discardScheduledPersist()
  }, [])

  const current = conversations.find((item) => item.id === currentId) || null
  currentIdRef.current = currentId
  useEffect(() => {
    if (!current) {
      setTitleDraft('')
      return
    }
    setModel(current.model)
    setGroup(current.group || 'default')
    setParameters(normalizePlaygroundParameters(current.parameters))
    setTitleDraft(current.title)
  }, [current?.id])

  useEffect(() => {
    if (groups.length && !groups.includes(group)) setGroup(groups[0]!)
  }, [group, groups])
  useEffect(() => {
    if (!model && models[0]) setModel(models[0])
  }, [model, models])

  useEffect(() => {
    void navigator.storage?.estimate().then((estimate) => {
      setBrowserStorage({ usage: estimate.usage || 0, quota: estimate.quota || 0 })
    })
  }, [conversations])

  const localExport = useMemo(() => createPlaygroundExport(conversations), [conversations])
  const localBytes = useMemo(() => new TextEncoder().encode(JSON.stringify(localExport)).byteLength, [localExport])
  const filtered = conversations.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))

  const routeToConversation = async (id: string | null) => {
    setCurrentId(id)
    setMobileHistoryOpen(false)
    const target = id
      ? `/${locale}/console/playground/${encodeURIComponent(id)}`
      : `/${locale}/console/playground`
    await navigate({ to: target as never })
  }

  const newChat = async () => {
    if (!user || busy) return null
    const created = await createConversation(user.id)
    const next = {
      ...created,
      model,
      group,
      parameters: { ...parameters },
      title: t('New conversation'),
    }
    await persistNow(next)
    replaceConversations([next, ...conversationsRef.current])
    await routeToConversation(next.id)
    return next
  }

  const deleteChat = async (conversation: LocalConversation) => {
    if (busy || !window.confirm(t('Delete this conversation from this browser?'))) return
    await database.conversations.delete(conversation.id)
    announceChange()
    const remaining = conversationsRef.current.filter((item) => item.id !== conversation.id)
    replaceConversations(remaining)
    if (currentId === conversation.id) await routeToConversation(remaining[0]?.id || null)
  }

  const clearAll = async () => {
    if (!user || busy || !window.confirm(t('Clear all local conversations for this account?'))) return
    const keys = await database.conversations
      .where('ownerNamespace')
      .equals(ownerNamespace(user.id))
      .primaryKeys()
    await database.conversations.bulkDelete(keys)
    announceChange()
    replaceConversations([])
    await routeToConversation(null)
    setLocalDataOpen(false)
  }

  const saveConversationSelection = async (patch: Partial<Pick<LocalConversation, 'model' | 'group'>>) => {
    if (!current) return
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, ...patch, updatedAt: Date.now() }))
    if (next) await persistNow(next)
  }

  const saveTitle = async () => {
    if (!current) return
    const title = titleDraft.trim() || t('New conversation')
    if (title === current.title) return
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, title, updatedAt: Date.now() }))
    if (next) await persistNow(next)
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
    return cause instanceof Error ? cause.message : t('The model request failed.')
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
        if (!response) throw new Error(t('The model returned no response content.'))
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
    let conversation = current || await newChat()
    if (!conversation) return
    const userMessage: LocalMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: draft.trim(),
      status: 'complete',
      createdAt: Date.now(),
    }
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
    setTitleDraft(next.title)
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

  const saveEditedMessage = async () => {
    if (!current || !editingMessageId || !editingMessage.trim() || busy) return
    const index = current.messages.findIndex((message) => message.id === editingMessageId && message.role === 'user')
    if (index < 0) return
    const requestMessages = [
      ...current.messages.slice(0, index),
      { ...current.messages[index]!, content: editingMessage.trim(), status: 'complete' as const },
    ]
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, messages: requestMessages, updatedAt: Date.now() }))
    setEditingMessageId(null)
    setEditingMessage('')
    if (!next) return
    await persistNow(next)
    await runCompletion(next, requestMessages)
  }

  const deleteMessage = async (messageId: string) => {
    if (!current || busy || !window.confirm(t('Delete this message from the local conversation?'))) return
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
    setParametersOpen(false)
    if (!current) return
    const next = updateLocal(current.id, (conversation) => ({ ...conversation, parameters: normalized, updatedAt: Date.now() }))
    if (next) await persistNow(next)
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
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        setError(t('The conversation file is too large.'))
        return
      }
      const imported = parsePlaygroundImport(JSON.parse(await file.text()), ownerNamespace(user.id))
      await database.conversations.bulkAdd(imported)
      announceChange()
      await refresh(imported[0]?.id)
      if (imported[0]) await routeToConversation(imported[0].id)
      setNotice(t('Local conversations imported.'))
      setLocalDataOpen(false)
    } catch (cause) {
      setError(t('Unable to import this conversation file.'))
    }
  }

  const composerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const renderConversationSidebar = (mobile = false) => (
    <aside className={mobile ? 'conversation-sidebar mobile' : 'conversation-sidebar'} aria-label={t('Local conversations')}>
      <button className="button primary-button new-chat-button" disabled={busy} onClick={() => void newChat()}>
        <Plus size={16} />
        {t('New chat')}
      </button>
      <label className="search-field">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search conversations')} />
      </label>
      <div className="conversation-heading">
        <span>{t('Local history')}</span>
        <span>{conversations.length}</span>
      </div>
      <div className="conversation-list">
        {filtered.map((item) => (
          <div key={item.id} className={item.id === currentId ? 'conversation-item active' : 'conversation-item'}>
            <button disabled={busy} onClick={() => void routeToConversation(item.id)}>
              <MessageSquare size={15} />
              <span>
                <strong>{item.title}</strong>
                <small>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(item.updatedAt)}</small>
              </span>
            </button>
            <IconButton label={t('Delete conversation')} disabled={busy} onClick={() => void deleteChat(item)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
        {!filtered.length ? <div className="conversation-empty">{t('No conversations yet')}</div> : null}
      </div>
      <button className="local-disclosure local-data-button" onClick={() => setLocalDataOpen(true)}>
        <ShieldLocal />
        <span>
          <strong>{t('Stored locally')}</strong>
          <small>{formatLocalBytes(localBytes, locale)}</small>
        </span>
      </button>
      <p className="local-privacy-copy">{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p>
    </aside>
  )

  return (
    <div className="playground-layout">
      {renderConversationSidebar()}
      <section className="chat-workspace">
        <header className="chat-toolbar">
          <IconButton className="playground-mobile-history" label={t('Local conversations')} onClick={() => setMobileHistoryOpen(true)}>
            <PanelLeft size={18} />
          </IconButton>
          <input
            className="conversation-title-input"
            aria-label={t('Conversation name')}
            value={titleDraft}
            disabled={!current || busy}
            placeholder={t('New conversation')}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={() => void saveTitle()}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
          />
          <div className="chat-toolbar-controls">
            <select
              value={model}
              onChange={(event) => { setModel(event.target.value); void saveConversationSelection({ model: event.target.value }) }}
              aria-label={t('Model')}
              disabled={busy}
            >
              <option value="">{t('Select model')}</option>
              {models.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select
              value={group}
              onChange={(event) => { setGroup(event.target.value); void saveConversationSelection({ group: event.target.value }) }}
              aria-label={t('Group')}
              disabled={busy}
            >
              {groups.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <IconButton label={t('Generation parameters')} disabled={busy} onClick={() => { setParameterDraft(parameters); setParametersOpen(true) }}>
              <SlidersHorizontal size={17} />
            </IconButton>
            <IconButton label={t('Local data')} disabled={busy} onClick={() => setLocalDataOpen(true)}>
              <HardDrive size={17} />
            </IconButton>
          </div>
        </header>

        <div className="message-stream" aria-live="polite">
          {current?.messages.length ? current.messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <header>
                <div>
                  <span>{message.role === 'user' ? t('You') : 'Partokens'}</span>
                  {message.status ? <small className={`message-status ${message.status}`}>{t(message.status === 'streaming' ? 'Streaming' : message.status === 'stopped' ? 'Stopped' : message.status === 'error' ? 'Failed' : 'Complete')}</small> : null}
                </div>
                <div className="message-actions">
                  <IconButton label={t('Copy message')} onClick={() => void navigator.clipboard.writeText(message.content)}><Copy size={14} /></IconButton>
                  {message.role === 'user' ? <IconButton label={t('Edit and regenerate')} disabled={busy} onClick={() => { setEditingMessageId(message.id); setEditingMessage(message.content) }}><Pencil size={14} /></IconButton> : null}
                  {message.role === 'assistant' ? <IconButton label={t('Regenerate response')} disabled={busy} onClick={() => void regenerate(message.id)}><RotateCcw size={14} /></IconButton> : null}
                  <IconButton label={t('Delete message')} disabled={busy} onClick={() => void deleteMessage(message.id)}><Trash2 size={14} /></IconButton>
                </div>
              </header>
              {message.reasoning ? <details className="reasoning-block"><summary>{t('Reasoning')}</summary><p>{message.reasoning}</p></details> : null}
              {message.content ? <p>{message.content}</p> : message.status === 'streaming' ? <div className="stream-cursor"><LoaderCircle className="spin" size={15} />{t('Waiting for the first response chunk')}</div> : null}
              {message.error ? <div className="message-error" role="alert">{message.error}</div> : null}
            </article>
          )) : (
            <div className="empty-chat">
              <div><Sparkles size={24} /></div>
              <h1>{t('Start with a question')}</h1>
              <p>{t('Messages are sent through Partokens to the selected model provider when you submit them.')}</p>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={(event) => void submit(event)}>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          {notice ? <div className="form-success" role="status">{notice}</div> : null}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={composerKeyDown}
            placeholder={t('Start with a question')}
            rows={3}
          />
          <div>
            <span>{parameters.stream ? t('Streaming is on') : t('Streaming is off')} · {t('Messages are sent through Partokens to the selected model provider when you submit them.')}</span>
            {busy ? (
              <button type="button" className="button secondary-button" onClick={() => abortRef.current?.abort()}>
                <Square size={15} />{t('Stop')}
              </button>
            ) : (
              <button className="button primary-button" disabled={!draft.trim() || !model}>
                <Send size={16} />{t('Send')}
              </button>
            )}
          </div>
        </form>
      </section>

      {mobileHistoryOpen ? (
        <Modal label={t('Local conversations')} className="playground-history-sheet" backdropClassName="playground-sheet-backdrop" onClose={() => setMobileHistoryOpen(false)}>
          <header><strong>{t('Local conversations')}</strong><IconButton label={t('Close')} onClick={() => setMobileHistoryOpen(false)}><X size={18} /></IconButton></header>
          {renderConversationSidebar(true)}
        </Modal>
      ) : null}

      {parametersOpen ? (
        <Modal label={t('Generation parameters')} className="dialog playground-settings-dialog" onClose={() => setParametersOpen(false)}>
          <div className="dialog-heading"><div><span className="eyebrow">{t('Request controls')}</span><h2>{t('Generation parameters')}</h2></div><IconButton label={t('Close')} onClick={() => setParametersOpen(false)}><X size={18} /></IconButton></div>
          <label className="toggle-row"><span><strong>{t('Streaming')}</strong><small>{t('Show the response as it arrives')}</small></span><input type="checkbox" checked={parameterDraft.stream} onChange={(event) => setParameterDraft((value) => ({ ...value, stream: event.target.checked }))} /></label>
          {([
            ['temperature', 'Temperature', 0, 2, 0.1],
            ['topP', 'Top P', 0, 1, 0.1],
            ['frequencyPenalty', 'Frequency penalty', -2, 2, 0.1],
            ['presencePenalty', 'Presence penalty', -2, 2, 0.1],
          ] as const).map(([key, label, min, max, step]) => (
            <label className="parameter-row" key={key}>
              <span><strong>{t(label)}</strong><code>{parameterDraft[key]}</code></span>
              <input type="range" min={min} max={max} step={step} value={parameterDraft[key]} onChange={(event) => setParameterDraft((value) => ({ ...value, [key]: Number(event.target.value) }))} />
            </label>
          ))}
          <div className="parameter-number-grid">
            <label><span>{t('Max tokens')}</span><input type="number" min={1} max={200000} value={parameterDraft.maxTokens} onChange={(event) => setParameterDraft((value) => ({ ...value, maxTokens: Math.max(1, Math.min(200000, Number(event.target.value) || 1)) }))} /></label>
            <label><span>{t('Seed')}</span><input type="number" min={0} max={2147483647} value={parameterDraft.seed ?? ''} placeholder={t('Not set')} onChange={(event) => setParameterDraft((value) => ({ ...value, seed: event.target.value === '' ? null : Math.max(0, Math.min(2147483647, Number(event.target.value) || 0)) }))} /></label>
          </div>
          <div className="dialog-actions"><button className="button secondary-button" onClick={() => setParametersOpen(false)}>{t('Cancel')}</button><button className="button primary-button" onClick={() => void saveParameters()}><Check size={15} />{t('Save parameters')}</button></div>
        </Modal>
      ) : null}

      {localDataOpen ? (
        <Modal label={t('Local data')} className="dialog playground-data-dialog" onClose={() => setLocalDataOpen(false)}>
          <div className="dialog-heading"><div><span className="eyebrow">{t('Browser storage')}</span><h2>{t('Local conversation data')}</h2></div><IconButton label={t('Close')} onClick={() => setLocalDataOpen(false)}><X size={18} /></IconButton></div>
          <dl className="local-data-stats">
            <div><dt>{t('Conversations')}</dt><dd>{new Intl.NumberFormat(locale).format(conversations.length)}</dd></div>
            <div><dt>{t('Conversation data')}</dt><dd>{formatLocalBytes(localBytes, locale)}</dd></div>
            <div><dt>{t('Browser storage used')}</dt><dd>{browserStorage ? formatLocalBytes(browserStorage.usage, locale) : '—'}</dd></div>
            <div><dt>{t('Browser storage limit')}</dt><dd>{browserStorage?.quota ? formatLocalBytes(browserStorage.quota, locale) : '—'}</dd></div>
          </dl>
          <div className="local-data-actions">
            <button className="button secondary-button" disabled={!conversations.length} onClick={exportConversations}><Download size={15} />{t('Export conversations')}</button>
            <button className="button secondary-button" onClick={() => importRef.current?.click()}><Upload size={15} />{t('Import conversations')}</button>
            <button className="button secondary-button danger-text" disabled={!conversations.length || busy} onClick={() => void clearAll()}><Trash2 size={15} />{t('Clear all')}</button>
          </div>
          <p className="local-data-note">{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p>
        </Modal>
      ) : null}

      {editingMessageId ? (
        <Modal label={t('Edit and regenerate')} className="dialog edit-message-dialog" onClose={() => setEditingMessageId(null)}>
          <div className="dialog-heading"><h2>{t('Edit and regenerate')}</h2><IconButton label={t('Close')} onClick={() => setEditingMessageId(null)}><X size={18} /></IconButton></div>
          <label><span>{t('Message')}</span><textarea data-modal-initial-focus rows={7} value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} /></label>
          <div className="dialog-actions"><button className="button secondary-button" onClick={() => setEditingMessageId(null)}>{t('Cancel')}</button><button className="button primary-button" disabled={!editingMessage.trim()} onClick={() => void saveEditedMessage()}><RotateCcw size={15} />{t('Save and regenerate')}</button></div>
        </Modal>
      ) : null}

      <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importConversations(event)} />
    </div>
  )
}

function ShieldLocal() {
  return <span className="local-icon" aria-hidden="true">LOCAL</span>
}
