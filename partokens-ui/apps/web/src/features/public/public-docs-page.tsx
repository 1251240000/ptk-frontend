import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Globe2,
  House,
  Info,
  Languages,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  completedDocsOrder,
  docsCatalog,
  getDocsDocument,
  getDocsSearchText,
  hasLocalizedDocsDocument,
  publicDocsCopy,
  type DocsCodeSample,
  type DocsContentBlock,
  type DocsItemId,
  type DocsItemTarget,
} from '@partokens/content/public-ui'
import type { AppLocale } from '@partokens/i18n'

import type { PublicTarget } from './public-pages'

type DocsDetailLabels = {
  prerequisites: string
  onThisPage: string
  previous: string
  next: string
  copyCode: string
  copied: string
  codeLanguage: string
  directory: string
  fallback: string
}

const docsDetailLabels: Record<AppLocale, DocsDetailLabels> = {
  'zh-CN': { prerequisites: '前置条件', onThisPage: '本页内容', previous: '上一篇', next: '下一篇', copyCode: '复制代码', copied: '已复制', codeLanguage: '代码语言', directory: '文档目录', fallback: '本页正文暂未翻译，当前显示简体中文版本。' },
  'zh-TW': { prerequisites: '前置條件', onThisPage: '本頁內容', previous: '上一篇', next: '下一篇', copyCode: '複製程式碼', copied: '已複製', codeLanguage: '程式語言', directory: '文件目錄', fallback: '本頁正文暫未翻譯，目前顯示簡體中文版本。' },
  en: { prerequisites: 'Prerequisites', onThisPage: 'On this page', previous: 'Previous', next: 'Next', copyCode: 'Copy code', copied: 'Copied', codeLanguage: 'Code language', directory: 'Documentation index', fallback: 'This article is not translated yet. The Simplified Chinese source is shown below.' },
  ja: { prerequisites: '前提条件', onThisPage: 'このページ', previous: '前へ', next: '次へ', copyCode: 'コードをコピー', copied: 'コピーしました', codeLanguage: 'コード言語', directory: 'ドキュメント一覧', fallback: 'この記事は未翻訳のため、簡体字中国語の原文を表示しています。' },
  ru: { prerequisites: 'Предварительные условия', onThisPage: 'На этой странице', previous: 'Назад', next: 'Далее', copyCode: 'Копировать код', copied: 'Скопировано', codeLanguage: 'Язык кода', directory: 'Содержание документации', fallback: 'Перевод пока недоступен. Ниже показана версия на упрощенном китайском.' },
  fr: { prerequisites: 'Prérequis', onThisPage: 'Sur cette page', previous: 'Précédent', next: 'Suivant', copyCode: 'Copier le code', copied: 'Copié', codeLanguage: 'Langage du code', directory: 'Sommaire', fallback: 'Cet article n’est pas encore traduit. La version source en chinois simplifié est affichée.' },
  vi: { prerequisites: 'Điều kiện tiên quyết', onThisPage: 'Trong trang này', previous: 'Trước', next: 'Tiếp', copyCode: 'Sao chép mã', copied: 'Đã sao chép', codeLanguage: 'Ngôn ngữ mã', directory: 'Mục lục tài liệu', fallback: 'Bài viết chưa được dịch. Phiên bản tiếng Trung giản thể được hiển thị bên dưới.' },
}

const docsItems = docsCatalog.flatMap((group) => group.items)
const docsItemIds = docsItems.map((item) => item.id)

function docsItemFromHash(): DocsItemId {
  const [root, item] = window.location.hash.replace(/^#/, '').split('/')
  if (root === 'docs' && docsItemIds.includes(item as DocsItemId)) return item as DocsItemId
  return 'welcome'
}

function DocsInlineText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={`${part}-${index}`}>{part.slice(1, -1)}</code> : part)}</>
}

function CodeBlock({ code, label, copyLabel, copiedLabel }: { code: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code)
    else {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }
  return <div className="r3-code-block"><header><span>{label}</span><button type="button" className="pt-icon-button" data-size="small" aria-label={copyLabel} title={copyLabel} onClick={() => void copy()}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></header><pre><code>{code}</code></pre><span className="sr-only" role="status">{copied ? copiedLabel : ''}</span></div>
}

function DocsCodeSamples({ samples, labels }: { samples: DocsCodeSample[]; labels: DocsDetailLabels }) {
  const [language, setLanguage] = useState(samples[0]?.language ?? 'shell')
  const selected = samples.find((sample) => sample.language === language) ?? samples[0]
  if (!selected) return null
  return <div className="r3-docs-code-samples">
    {samples.length > 1 ? <div className="pt-segmented r3-sdk-tabs" aria-label={labels.codeLanguage}>{samples.map((sample) => <button type="button" key={sample.language} aria-pressed={selected.language === sample.language} onClick={() => setLanguage(sample.language)}>{sample.language === 'shell' ? 'Shell' : sample.language === 'javascript' ? 'JavaScript' : 'Python'}</button>)}</div> : null}
    <CodeBlock code={selected.code} label={selected.label} copyLabel={`${labels.copyCode}: ${selected.label}`} copiedLabel={labels.copied} />
  </div>
}

function DocsContent({ block, labels }: { block: DocsContentBlock; labels: DocsDetailLabels }) {
  if (block.type === 'paragraph') return <p className="r3-docs-paragraph"><DocsInlineText text={block.text} /></p>
  if (block.type === 'list') {
    const List = block.ordered ? 'ol' : 'ul'
    return <List className="r3-docs-list">{block.items.map((item) => <li key={item}><DocsInlineText text={item} /></li>)}</List>
  }
  if (block.type === 'steps') return <ol className="r3-docs-steps">{block.items.map((item, index) => <li key={item.title}><code>{String(index + 1).padStart(2, '0')}</code><div><strong>{item.title}</strong><p><DocsInlineText text={item.body} /></p></div></li>)}</ol>
  if (block.type === 'callout') {
    const Icon = block.tone === 'warning' ? AlertTriangle : block.tone === 'success' ? CheckCircle2 : Info
    return <aside className="r3-docs-callout" data-tone={block.tone}><Icon size={19} /><div><strong>{block.title}</strong><p><DocsInlineText text={block.body} /></p></div></aside>
  }
  if (block.type === 'endpoint') return <div className="r3-docs-detail-endpoint"><span>{block.method ? <code>{block.method}</code> : <Globe2 size={16} />}{block.label}</span><code>{block.path}</code><CheckCircle2 size={16} /></div>
  if (block.type === 'links') return <div className="r3-docs-links">{block.items.map((item) => {
    const external = item.href.startsWith('https://')
    return <a key={item.href} href={item.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}><span>{item.label}</span><code>{item.href.replace(/^mailto:/, '')}</code>{external ? <ExternalLink size={15} /> : <MessageSquare size={15} />}</a>
  })}</div>
  if (block.type === 'code-samples') return <DocsCodeSamples samples={block.samples} labels={labels} />
  if (block.type === 'table') return <div className="r3-docs-table-wrap"><table><thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}><DocsInlineText text={cell} /></td>)}</tr>)}</tbody></table></div>
  return <div className="r3-docs-faq-list">{block.items.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><ChevronDown size={18} /></summary><p><DocsInlineText text={item.answer} /></p></details>)}</div>
}

export default function PublicDocsPage({ locale, go }: { locale: AppLocale; go: (target: PublicTarget) => void }) {
  const copy = publicDocsCopy[locale]
  const labels = docsDetailLabels[locale]
  const [query, setQuery] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<DocsItemId>(docsItemFromHash)
  const [activeSection, setActiveSection] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const documentContent = getDocsDocument(activeItem, locale)
  const activeGroup = docsCatalog.find((group) => group.items.some((item) => item.id === activeItem))
  const navigationOrder = completedDocsOrder.includes(activeItem) ? completedDocsOrder : docsItemIds
  const navigationIndex = navigationOrder.indexOf(activeItem)
  const previousItem = navigationIndex > 0 ? navigationOrder[navigationIndex - 1] : undefined
  const nextItem = navigationIndex >= 0 ? navigationOrder[navigationIndex + 1] : undefined

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale)
    if (!normalized) return docsCatalog
    return docsCatalog.map((group) => ({
      ...group,
      items: group.items.filter((item) => `${copy.items[item.id]} ${getDocsSearchText(item.id, locale)}`.toLocaleLowerCase(locale).includes(normalized)),
    })).filter((group) => group.items.length > 0 || copy.groups[group.id].title.toLocaleLowerCase(locale).includes(normalized))
  }, [copy, locale, query])

  const scrollToSection = (section: string) => {
    document.getElementById(`docs-section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(section)
  }

  const openDocument = (id: DocsItemId) => {
    setActiveItem(id)
    setActiveSection('')
    setQuery('')
    setMobileNavOpen(false)
    window.location.hash = `docs/${id}`
    window.scrollTo({ top: 0 })
  }

  const openItem = (target: DocsItemTarget) => openDocument(target.document)

  useEffect(() => {
    const onHashChange = () => {
      setActiveItem(docsItemFromHash())
      setActiveSection('')
      setMobileNavOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const firstSection = documentContent.sections[0]?.id ?? ''
    setActiveSection(firstSection)
    const sections = documentContent.sections
      .map((section) => document.getElementById(`docs-section-${section.id}`))
      .filter((element): element is HTMLElement => element !== null)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveSection(visible.target.id.replace('docs-section-', ''))
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [documentContent])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setMobileNavOpen(true)
        window.requestAnimationFrame(() => searchRef.current?.focus())
      } else if (event.key === 'Escape') {
        setMobileNavOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return <main className="r3-page r3-docs-page">
    <button type="button" className="r3-docs-mobile-trigger" aria-label={mobileNavOpen ? copy.closeNavigation : copy.mobileNavigation} title={mobileNavOpen ? copy.closeNavigation : copy.mobileNavigation} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>{mobileNavOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}<span>{labels.directory}</span></button>

    <aside className="r3-docs-index" data-open={mobileNavOpen} aria-label={copy.mobileNavigation}>
      <div className="r3-docs-index-head"><span>{copy.eyebrow}</span><button type="button" aria-label={copy.closeNavigation} title={copy.closeNavigation} onClick={() => setMobileNavOpen(false)}><PanelLeftClose size={17} /></button></div>
      <label className="r3-docs-search"><Search size={16} /><span className="sr-only">{copy.searchLabel}</span><input ref={searchRef} type="search" value={query} placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" aria-label={copy.clearSearch} title={copy.clearSearch} onClick={() => { setQuery(''); searchRef.current?.focus() }}><X size={14} /></button> : null}</label>
      <nav className="r3-docs-utility" aria-label={copy.eyebrow}>
        <button type="button" onClick={() => go('home')}><House size={15} />{copy.home}</button>
        <button type="button" onClick={() => go('console')}><Route size={15} />{copy.console}</button>
        <a href="mailto:support@partokens.com"><MessageSquare size={15} />{copy.contactSupport}</a>
      </nav>
      <nav className="r3-docs-tree" aria-label={copy.eyebrow}>
        {filteredCatalog.map((group) => <section key={group.id}>
          <h2>{copy.groups[group.id].title}</h2>
          {group.items.map((item) => <button type="button" key={item.id} aria-current={activeItem === item.id ? 'page' : undefined} onClick={() => openItem(item.target)}>{copy.items[item.id]}</button>)}
        </section>)}
        {filteredCatalog.length === 0 ? <p className="r3-docs-empty"><Search size={16} />{copy.noResults}</p> : null}
      </nav>
    </aside>

    <article className="r3-docs-article" key={activeItem}>
      <header className="r3-docs-hero">
        <span>{activeGroup ? copy.groups[activeGroup.id].title : copy.eyebrow}</span>
        <h1>{copy.items[activeItem]}</h1>
        <p>{documentContent.summary}</p>
        {documentContent.prerequisites?.length ? <div className="r3-docs-prerequisites"><strong><FileCheck2 size={16} />{labels.prerequisites}</strong><ul>{documentContent.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      </header>

      {!hasLocalizedDocsDocument(activeItem, locale) ? <aside className="r3-docs-language-fallback"><Languages size={17} /><p>{labels.fallback}</p></aside> : null}

      <div className="r3-docs-detail-body">{documentContent.sections.map((section) => <section id={`docs-section-${section.id}`} key={section.id} data-doc-section><h2>{section.title}</h2><div>{section.blocks.map((block, index) => <DocsContent key={`${section.id}-${block.type}-${index}`} block={block} labels={labels} />)}</div></section>)}</div>

      <nav className="r3-docs-pagination" aria-label={`${labels.previous} / ${labels.next}`}>
        {previousItem ? <button type="button" data-direction="previous" onClick={() => openDocument(previousItem)}><ChevronRight size={17} /><span><small>{labels.previous}</small><strong>{copy.items[previousItem]}</strong></span></button> : <span />}
        {nextItem ? <button type="button" data-direction="next" onClick={() => openDocument(nextItem)}><span><small>{labels.next}</small><strong>{copy.items[nextItem]}</strong></span><ChevronRight size={17} /></button> : <span />}
      </nav>
    </article>

    <aside className="r3-docs-toc" aria-label={labels.onThisPage}>
      <span>{labels.onThisPage}</span>
      {documentContent.sections.map((section) => <button type="button" key={section.id} aria-current={activeSection === section.id ? 'location' : undefined} onClick={() => scrollToSection(section.id)}>{section.title}</button>)}
    </aside>
  </main>
}
