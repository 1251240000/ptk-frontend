import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  FileUp,
  History,
  Info,
  MessageSquare,
  PanelLeft,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'

import { resources, type AppLocale } from '@partokens/i18n'

import { useDialogBehavior } from './console-dialog-behavior'
import { translateConsolePlayground } from './console-playground-copy'
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

type ConsolePlaygroundPrototypeProps = {
  locale: AppLocale
  notify: (message: string) => void
}

type DialogState =
  | { kind: 'parameters' }
  | { kind: 'local-data' }
  | { kind: 'delete-conversation'; id: string }
  | { kind: 'clear-all' }
  | { kind: 'edit-message'; id: string }
  | { kind: 'delete-message'; id: string }
  | null

type Translate = (key: string) => string

function translate(locale: AppLocale, key: string) {
  const local = translateConsolePlayground(locale, key)
  return local === key ? (resources[locale].translation as Record<string, string>)[key] ?? key : local
}

function IconButton({ label, children, onClick, disabled = false, className = '' }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button type="button" className={`pt-icon-button ${className}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}>{children}</button>
}

function Modal({ active, title, t, onClose, children, footer }: { active: boolean; title: string; t: Translate; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  const ref = useDialogBehavior<HTMLElement>(active, onClose)
  if (!active) return null
  return <div className="r33-dialog-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={onClose} /><section ref={ref} tabIndex={-1} className="r33-dialog r35-dialog" role="dialog" aria-modal="true" aria-labelledby="r35-dialog-title"><header><div><span>PLAYGROUND</span><h2 id="r35-dialog-title">{title}</h2></div><IconButton label={t('Close')} onClick={onClose}><X size={17} /></IconButton></header><div>{children}</div><footer>{footer}</footer></section></div>
}

function routeTitle(conversation: PrototypeConversation, t: Translate) {
  return conversation.titleKey ? t(conversation.titleKey) : conversation.title
}

function displayMessage(message: PrototypeChatMessage, t: Translate) {
  return message.copyKey ? t(message.copyKey) : message.content
}

function formatBytes(bytes: number, locale: AppLocale) {
  if (bytes < 1024) return `${new Intl.NumberFormat(locale).format(bytes)} B`
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
}

function MessageRoute({ model, t }: { model: string; t: Translate }) {
  const steps: Array<{ icon: LucideIcon; label: string; value: string; tone: string }> = [
    { icon: Database, label: 'Stored on this device', value: 'Local IndexedDB', tone: 'local' },
    { icon: Route, label: 'Transported when sent', value: 'Partokens Gateway', tone: 'gateway' },
    { icon: Bot, label: 'Response returns here', value: model || 'gpt-4.1-mini', tone: 'provider' },
  ]
  return <section className="r35-message-route" aria-label={t('Message route')}><span className="r35-route-label">{t('Message route')}</span><div>{steps.map(({ icon: Icon, label, value, tone }, index) => <div className="r35-route-node" data-tone={tone} key={label}><span><Icon size={15} /></span><small>{t(label)}</small><strong>{value === 'Local IndexedDB' ? t(value) : value}</strong>{index < steps.length - 1 ? <i><ArrowRight size={13} /></i> : null}</div>)}</div></section>
}

function ConversationRail({ conversations, currentId, query, busy, locale, t, onQuery, onNew, onSelect, onDelete, onLocalData, mobile = false }: {
  conversations: PrototypeConversation[]
  currentId: string | null
  query: string
  busy: boolean
  locale: AppLocale
  t: Translate
  onQuery: (value: string) => void
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onLocalData: () => void
  mobile?: boolean
}) {
  const matches = conversations.filter((conversation) => routeTitle(conversation, t).toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)))
  const today = matches.filter((item) => Date.now() - item.updatedAt < 24 * 60 * 60_000)
  const earlier = matches.filter((item) => Date.now() - item.updatedAt >= 24 * 60 * 60_000)
  const renderGroup = (label: string, items: PrototypeConversation[]) => items.length ? <section className="r35-history-group"><header><span>{t(label)}</span><small>{items.length}</small></header>{items.map((item) => <div className={item.id === currentId ? 'r35-history-item active' : 'r35-history-item'} key={item.id}><button type="button" disabled={busy} onClick={() => onSelect(item.id)}><span><MessageSquare size={14} /></span><strong>{routeTitle(item, t)}</strong><small>{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }).format(item.updatedAt)}</small></button><IconButton label={t('Delete conversation')} disabled={busy} onClick={() => onDelete(item.id)}><Trash2 size={14} /></IconButton></div>)}</section> : null
  return <aside className={mobile ? 'r35-conversation-rail mobile' : 'r35-conversation-rail'} aria-label={t('Local conversations')}>
    <button type="button" className="pt-button r35-new-chat" data-variant="primary" disabled={busy} onClick={onNew}><span><Plus size={16} />{t('New chat')}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
    <label className="r35-history-search"><Search size={15} /><input value={query} onChange={(event) => onQuery(event.target.value)} aria-label={t('Search conversations')} placeholder={t('Search conversations')} /></label>
    <div className="r35-history-list">{renderGroup('Today', today)}{renderGroup('Previous 7 days', earlier)}{!matches.length ? <div className="r35-history-empty"><History size={18} /><span>{t(query ? 'No matching conversations' : 'No conversations yet')}</span></div> : null}</div>
    <button type="button" className="r35-local-button" onClick={onLocalData}><span><Database size={16} /></span><div><strong>{t('Stored locally')}</strong><small>{formatBytes(prototypeConversationBytes(conversations), locale)}</small></div><ArrowRight size={14} /></button>
    <p className="r35-local-note"><ShieldCheck size={14} />{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p>
  </aside>
}

export function ConsolePlaygroundPage({ locale, notify }: ConsolePlaygroundPrototypeProps) {
  const t = (key: string) => translate(locale, key)
  const [conversations, setConversations] = useState<PrototypeConversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [parameterDraft, setParameterDraft] = useState<PrototypeChatParameters>({ ...defaultPrototypeParameters })
  const [editDraft, setEditDraft] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const conversationsRef = useRef<PrototypeConversation[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const streamTimers = useRef<number[]>([])
  const streamRef = useRef<HTMLDivElement>(null)
  const historyRef = useDialogBehavior<HTMLElement>(historyOpen, () => setHistoryOpen(false))
  const current = conversations.find((conversation) => conversation.id === currentId) ?? null

  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt), [conversations])

  useEffect(() => {
    let active = true
    void loadPrototypeConversations().then((items) => {
      if (!active) return
      conversationsRef.current = items
      setConversations(items)
      setCurrentId(items[0]?.id ?? null)
      setLoaded(true)
    })
    return () => { active = false; streamTimers.current.forEach((timer) => window.clearTimeout(timer)) }
  }, [])

  useEffect(() => {
    setTitleDraft(current ? routeTitle(current, t) : '')
  }, [current?.id, locale])

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [current?.messages.length, busy])

  const replaceConversation = (id: string, update: (conversation: PrototypeConversation) => PrototypeConversation) => {
    let saved: PrototypeConversation | null = null
    const next = conversationsRef.current.map((conversation) => {
      if (conversation.id !== id) return conversation
      saved = update(conversation)
      return saved
    })
    conversationsRef.current = next
    setConversations(next)
    if (saved) void savePrototypeConversation(saved)
    return saved
  }

  const createChat = () => {
    const now = Date.now()
    const conversation: PrototypeConversation = {
      id: crypto.randomUUID(), ownerNamespace: prototypeOwnerNamespace, title: 'New conversation', titleKey: 'New conversation', createdAt: now, updatedAt: now,
      model: current?.model || 'gpt-4.1-mini', group: current?.group || 'default', parameters: { ...(current?.parameters || defaultPrototypeParameters) }, messages: [], schemaVersion: 1,
    }
    const next = [conversation, ...conversationsRef.current]
    conversationsRef.current = next
    setConversations(next)
    setCurrentId(conversation.id)
    setHistoryOpen(false)
    void savePrototypeConversation(conversation)
    return conversation
  }

  const saveTitle = () => {
    if (!current) return
    const title = titleDraft.trim() || t('New conversation')
    replaceConversation(current.id, (conversation) => ({ ...conversation, title, titleKey: undefined, updatedAt: Date.now() }))
    notify(t('Draft saved'))
  }

  const updateSelection = (patch: Partial<Pick<PrototypeConversation, 'model' | 'group'>>) => {
    if (!current) return
    replaceConversation(current.id, (conversation) => ({ ...conversation, ...patch, updatedAt: Date.now() }))
  }

  const clearStream = () => {
    streamTimers.current.forEach((timer) => window.clearTimeout(timer))
    streamTimers.current = []
  }

  const streamAnswer = (conversationId: string, assistantId: string) => {
    clearStream()
    setBusy(true)
    const answer = t('Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.')
    const characters = Array.from(answer)
    const chunkSize = Math.max(1, Math.ceil(characters.length / 5))
    const chunks = Array.from({ length: 5 }, (_, index) => characters.slice(index * chunkSize, (index + 1) * chunkSize).join('')).filter(Boolean)
    chunks.forEach((chunk, index) => {
      const timer = window.setTimeout(() => {
        replaceConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: Date.now(),
          messages: conversation.messages.map((message) => message.id === assistantId ? { ...message, content: `${message.content}${chunk}`, status: index === chunks.length - 1 ? 'complete' : 'streaming' } : message),
        }))
        if (index === chunks.length - 1) { setBusy(false); streamTimers.current = [] }
      }, 240 + index * 260)
      streamTimers.current.push(timer)
    })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || busy) return
    const conversation = current || createChat()
    const prompt = draft.trim()
    const now = Date.now()
    const userMessage: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete', createdAt: now }
    const assistantMessage: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming', createdAt: now + 1 }
    setDraft('')
    setTitleDraft(conversation.messages.length ? routeTitle(conversation, t) : prompt.slice(0, 52))
    replaceConversation(conversation.id, (item) => ({ ...item, title: item.messages.length ? item.title : prompt.slice(0, 52), titleKey: item.messages.length ? item.titleKey : undefined, updatedAt: now, messages: [...item.messages, userMessage, assistantMessage] }))
    streamAnswer(conversation.id, assistantMessage.id)
  }

  const stopGeneration = () => {
    if (!current) return
    clearStream()
    replaceConversation(current.id, (conversation) => ({ ...conversation, messages: conversation.messages.map((message) => message.status === 'streaming' ? { ...message, status: 'stopped' } : message) }))
    setBusy(false)
    notify(t('Generation stopped.'))
  }

  const regenerate = (messageId: string) => {
    if (!current || busy) return
    replaceConversation(current.id, (conversation) => ({ ...conversation, messages: conversation.messages.map((message) => message.id === messageId ? { ...message, content: '', copyKey: undefined, reasoningKey: undefined, status: 'streaming' } : message), updatedAt: Date.now() }))
    streamAnswer(current.id, messageId)
  }

  const confirmDialog = async () => {
    if (!dialog) return
    if (dialog.kind === 'delete-conversation') {
      await deletePrototypeConversation(dialog.id)
      const remaining = conversationsRef.current.filter((item) => item.id !== dialog.id)
      conversationsRef.current = remaining
      setConversations(remaining)
      if (currentId === dialog.id) setCurrentId(remaining[0]?.id ?? null)
      notify(t('Conversation deleted'))
    }
    if (dialog.kind === 'clear-all') {
      await clearPrototypeConversations()
      conversationsRef.current = []
      setConversations([])
      setCurrentId(null)
      notify(t('All conversations cleared'))
    }
    if (dialog.kind === 'delete-message' && current) {
      replaceConversation(current.id, (conversation) => ({ ...conversation, messages: conversation.messages.filter((message) => message.id !== dialog.id), updatedAt: Date.now() }))
    }
    setDialog(null)
  }

  const openParameters = () => {
    setParameterDraft({ ...(current?.parameters || defaultPrototypeParameters) })
    setDialog({ kind: 'parameters' })
  }

  const saveParameters = () => {
    if (current) replaceConversation(current.id, (conversation) => ({ ...conversation, parameters: { ...parameterDraft }, updatedAt: Date.now() }))
    setDialog(null)
    notify(t('Parameters saved'))
  }

  const openEdit = (message: PrototypeChatMessage) => {
    setEditDraft(displayMessage(message, t))
    setDialog({ kind: 'edit-message', id: message.id })
  }

  const saveEdit = () => {
    if (!current || dialog?.kind !== 'edit-message' || !editDraft.trim()) return
    const index = current.messages.findIndex((message) => message.id === dialog.id)
    if (index < 0) return
    const edited = { ...current.messages[index]!, content: editDraft.trim(), copyKey: undefined, status: 'complete' as const }
    const assistant: PrototypeChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', status: 'streaming', createdAt: Date.now() }
    replaceConversation(current.id, (conversation) => ({ ...conversation, messages: [...conversation.messages.slice(0, index), edited, assistant], updatedAt: Date.now() }))
    setDialog(null)
    streamAnswer(current.id, assistant.id)
  }

  const exportConversations = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'partokens-local-conversations.json'
    anchor.click()
    URL.revokeObjectURL(url)
    notify(t('Local conversations exported.'))
  }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const value = JSON.parse(await file.text()) as unknown
      if (!Array.isArray(value) || !value.every((item) => item && typeof item === 'object' && Array.isArray((item as PrototypeConversation).messages))) throw new Error('invalid')
      await importPrototypeConversations(value as PrototypeConversation[])
      const items = await loadPrototypeConversations()
      conversationsRef.current = items
      setConversations(items)
      setCurrentId(items[0]?.id ?? null)
      setDialog(null)
      notify(t('Import complete'))
    } catch {
      notify(t('This file does not contain valid Partokens conversations.'))
    }
  }

  const composerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const currentTitle = current ? routeTitle(current, t) : t('New conversation')
  const messageCount = current?.messages.length ?? 0
  const activeDialogTitle = dialog?.kind === 'parameters' ? t('Generation parameters') : dialog?.kind === 'local-data' ? t('Local conversation data') : dialog?.kind === 'edit-message' ? t('Edit and regenerate') : dialog?.kind === 'delete-message' ? t('Delete message') : dialog?.kind === 'delete-conversation' ? t('Delete conversation') : t('Clear all')

  return <div className="r35-playground">
    <ConversationRail conversations={sortedConversations} currentId={currentId} query={query} busy={busy} locale={locale} t={t} onQuery={setQuery} onNew={createChat} onSelect={(id) => { setCurrentId(id); setHistoryOpen(false) }} onDelete={(id) => setDialog({ kind: 'delete-conversation', id })} onLocalData={() => setDialog({ kind: 'local-data' })} />

    <section className="r35-workspace">
      <header className="r35-chat-toolbar">
        <IconButton className="r35-history-trigger" label={t('Local conversations')} onClick={() => setHistoryOpen(true)}><PanelLeft size={18} /></IconButton>
        <input className="r35-title-input" aria-label={t('Conversation name')} value={titleDraft} disabled={!current || busy} placeholder={currentTitle} onChange={(event) => setTitleDraft(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} />
        <div className="r35-toolbar-controls">
          <label><Bot size={15} /><span className="sr-only">{t('Model')}</span><select aria-label={t('Model')} value={current?.model || ''} disabled={!current || busy} onChange={(event) => updateSelection({ model: event.target.value })}><option value="gpt-4.1-mini">gpt-4.1-mini</option><option value="claude-3.7-sonnet">claude-3.7-sonnet</option><option value="gemini-2.5-flash">gemini-2.5-flash</option></select><ChevronDown size={13} /></label>
          <label><span className="sr-only">{t('Group')}</span><select aria-label={t('Group')} value={current?.group || 'default'} disabled={!current || busy} onChange={(event) => updateSelection({ group: event.target.value })}><option value="default">default</option><option value="trial">trial</option></select><ChevronDown size={13} /></label>
          <IconButton label={t('Generation parameters')} onClick={openParameters}><Settings2 size={17} /></IconButton>
          <IconButton label={t('Local data')} onClick={() => setDialog({ kind: 'local-data' })}><Database size={17} /></IconButton>
        </div>
      </header>

      <MessageRoute model={current?.model || 'gpt-4.1-mini'} t={t} />

      <div ref={streamRef} className="r35-message-stream" aria-live="polite">
        {!loaded ? <div className="r35-empty-chat"><span><Sparkles size={22} /></span><p>{t('Loading')}</p></div> : null}
        {loaded && !messageCount ? <div className="r35-empty-chat"><span><Sparkles size={22} /></span><h1>{t('Start with a question')}</h1><p>{t('Messages are sent through Partokens to the selected model provider when you submit them.')}</p><div>{['Plan a model rollout', 'Compare prompt costs', 'Draft an incident update'].map((suggestion) => <button type="button" key={suggestion} onClick={() => setDraft(t(suggestion))}>{t(suggestion)}<ArrowRight size={13} /></button>)}</div></div> : null}
        {current?.messages.map((message) => <article className={`r35-message ${message.role}`} key={message.id}>
          <header><div><span>{message.role === 'user' ? t('You') : 'Partokens'}</span><small data-status={message.status}>{t(message.status === 'streaming' ? 'Streaming' : message.status === 'stopped' ? 'Stopped' : message.status === 'error' ? 'Failed' : 'Complete')}</small></div><div><IconButton label={t('Copy message')} onClick={() => { void navigator.clipboard?.writeText(displayMessage(message, t)); notify(t('Copied')) }}><Copy size={14} /></IconButton>{message.role === 'user' ? <IconButton label={t('Edit and regenerate')} disabled={busy} onClick={() => openEdit(message)}><Pencil size={14} /></IconButton> : <IconButton label={t('Regenerate response')} disabled={busy} onClick={() => regenerate(message.id)}><RotateCcw size={14} /></IconButton>}<IconButton label={t('Delete message')} disabled={busy} onClick={() => setDialog({ kind: 'delete-message', id: message.id })}><Trash2 size={14} /></IconButton></div></header>
          {message.reasoningKey ? <details className="r35-reasoning"><summary>{t('Reasoning')}</summary><p>{t(message.reasoningKey)}</p></details> : null}
          {displayMessage(message, t) ? <p>{displayMessage(message, t)}</p> : message.status === 'streaming' ? <div className="r35-streaming"><i /><span>{t('New answer streaming')}</span></div> : null}
        </article>)}
      </div>

      <form className="r35-composer" onSubmit={submit}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={composerKeyDown} rows={3} aria-label={t('Message')} placeholder={t('Start with a question')} />
        <footer><span><Info size={13} />{current?.parameters.stream === false ? t('Streaming is off') : t('Streaming is on')} · {t('Sent through Partokens')}</span>{busy ? <button type="button" className="pt-button" data-variant="secondary" onClick={stopGeneration}><Square size={15} />{t('Stop')}</button> : <button type="submit" className="pt-button" data-variant="primary" disabled={!draft.trim()}><Send size={16} />{t('Send')}</button>}</footer>
      </form>
    </section>

    {historyOpen ? <div className="r35-history-layer"><button type="button" tabIndex={-1} className="r33-scrim" aria-label={t('Close')} onClick={() => setHistoryOpen(false)} /><section ref={historyRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('Local conversations')}><header><strong>{t('Local conversations')}</strong><IconButton label={t('Close')} onClick={() => setHistoryOpen(false)}><X size={17} /></IconButton></header><ConversationRail mobile conversations={sortedConversations} currentId={currentId} query={query} busy={busy} locale={locale} t={t} onQuery={setQuery} onNew={createChat} onSelect={(id) => { setCurrentId(id); setHistoryOpen(false) }} onDelete={(id) => { setHistoryOpen(false); setDialog({ kind: 'delete-conversation', id }) }} onLocalData={() => { setHistoryOpen(false); setDialog({ kind: 'local-data' }) }} /></section></div> : null}

    <Modal key={dialog?.kind ?? 'closed'} active={Boolean(dialog)} title={activeDialogTitle} t={t} onClose={() => setDialog(null)} footer={dialog?.kind === 'parameters' ? <><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" onClick={saveParameters}><Check size={15} />{t('Save parameters')}</button></> : dialog?.kind === 'local-data' ? <button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Close')}</button> : dialog?.kind === 'edit-message' ? <><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="primary" disabled={!editDraft.trim()} onClick={saveEdit}><RotateCcw size={15} />{t('Save and regenerate')}</button></> : <><button type="button" className="pt-button" data-variant="secondary" onClick={() => setDialog(null)}>{t('Cancel')}</button><button type="button" className="pt-button" data-variant="danger" onClick={() => void confirmDialog()}><Trash2 size={15} />{dialog?.kind === 'clear-all' ? t('Clear all') : t('Delete')}</button></>}>
      {dialog?.kind === 'parameters' ? <div className="r35-parameter-form"><label className="r35-switch-row"><span><strong>{t('Streaming')}</strong><small>{t('Show the response as it arrives')}</small></span><button type="button" className="pt-switch" role="switch" aria-checked={parameterDraft.stream} onClick={() => setParameterDraft((value) => ({ ...value, stream: !value.stream }))}><span /></button></label>{([
        ['temperature', 'Temperature', 0, 2, .1], ['topP', 'Top P', 0, 1, .1], ['frequencyPenalty', 'Frequency penalty', -2, 2, .1], ['presencePenalty', 'Presence penalty', -2, 2, .1],
      ] as const).map(([key, label, min, max, step]) => <label className="r35-range" key={key}><span><strong>{t(label)}</strong><code>{parameterDraft[key]}</code></span><input type="range" min={min} max={max} step={step} value={parameterDraft[key]} onChange={(event) => setParameterDraft((value) => ({ ...value, [key]: Number(event.target.value) }))} /></label>)}<div className="r35-number-fields"><label className="pt-field"><span>{t('Max tokens')}</span><span className="pt-field-control"><input type="number" min="1" max="200000" value={parameterDraft.maxTokens} onChange={(event) => setParameterDraft((value) => ({ ...value, maxTokens: Number(event.target.value) || 1 }))} /></span></label><label className="pt-field"><span>{t('Seed')}</span><span className="pt-field-control"><input type="number" min="0" value={parameterDraft.seed ?? ''} placeholder={t('Not set')} onChange={(event) => setParameterDraft((value) => ({ ...value, seed: event.target.value ? Number(event.target.value) : null }))} /></span></label></div></div> : null}
      {dialog?.kind === 'local-data' ? <div className="r35-local-data"><dl><div><dt>{t('Conversations')}</dt><dd>{conversations.length}</dd></div><div><dt>{t('Conversation data')}</dt><dd>{formatBytes(prototypeConversationBytes(conversations), locale)}</dd></div><div><dt>{t('Browser storage')}</dt><dd>{t('Local IndexedDB')}</dd></div></dl><p><ShieldCheck size={15} />{t('Conversation history is stored only in this browser. Partokens does not store your conversation history.')}</p><div><button type="button" className="pt-button" data-variant="secondary" disabled={!conversations.length} onClick={exportConversations}><Download size={15} />{t('Export conversations')}</button><button type="button" className="pt-button" data-variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={15} />{t('Import conversations')}</button><button type="button" className="pt-button" data-variant="danger" disabled={!conversations.length || busy} onClick={() => setDialog({ kind: 'clear-all' })}><Trash2 size={15} />{t('Clear all')}</button></div></div> : null}
      {dialog?.kind === 'edit-message' ? <label className="pt-field r35-edit-field"><span>{t('Message')}</span><span className="pt-field-control"><textarea rows={7} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} /></span></label> : null}
      {dialog?.kind === 'delete-conversation' ? <p>{t('Delete this conversation from this browser?')}</p> : null}
      {dialog?.kind === 'delete-message' ? <p>{t('Delete this message from the local conversation?')}</p> : null}
      {dialog?.kind === 'clear-all' ? <p>{t('Clear all local conversations for this account?')}</p> : null}
    </Modal>

    <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} />
  </div>
}
