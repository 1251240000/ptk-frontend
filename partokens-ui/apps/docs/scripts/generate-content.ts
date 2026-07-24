import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPageCopy, pageDefinitions, uiCopy } from '../src/content/catalog'
import { locales } from '../src/lib/locales'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputRoot = join(scriptDirectory, '..', 'content', 'docs')
let updatedFileCount = 0

async function writeIfChanged(path: string, contents: string) {
  try {
    if (await readFile(path, 'utf8') === contents) return
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  }
  await writeFile(path, contents)
  updatedFileCount += 1
}

function mdxFor(locale: (typeof locales)[number], pageId: (typeof pageDefinitions)[number]['id']) {
  const copy = getPageCopy(locale, pageId)
  return `---
title: ${JSON.stringify(copy.title)}
description: ${JSON.stringify(copy.description)}
---

import { DocumentContent } from '@/components/document-content'

<DocumentContent locale=${JSON.stringify(locale)} pageId=${JSON.stringify(pageId)} />
`
}

for (const locale of locales) {
  const localeRoot = join(outputRoot, locale)
  const ui = uiCopy[locale]
  const meta = {
    title: ui.brand,
    pages: ['index', 'getting-started', 'guides', 'api'],
  }
  const sectionMeta = {
    'getting-started': { title: ui.groupStart, pages: ['authentication', 'first-request'] },
    guides: { title: ui.groupGuides, pages: ['models-and-groups', 'chat', 'images', 'errors-and-limits'] },
    api: { title: ui.groupApi, pages: ['chat-completions', 'responses', 'embeddings', 'image-generations', 'image-edits', 'audio-transcriptions', 'models'] },
  }

  await mkdir(localeRoot, { recursive: true })
  await writeIfChanged(join(localeRoot, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  for (const [folder, value] of Object.entries(sectionMeta)) {
    const folderPath = join(localeRoot, folder)
    await mkdir(folderPath, { recursive: true })
    await writeIfChanged(join(folderPath, 'meta.json'), `${JSON.stringify(value, null, 2)}\n`)
  }

  for (const page of pageDefinitions) {
    const relativePath = page.slug ? `${page.slug}.mdx` : 'index.mdx'
    const outputPath = join(localeRoot, relativePath)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeIfChanged(outputPath, mdxFor(locale, page.id))
  }
}

console.log(`Generated ${pageDefinitions.length * locales.length} localized documentation pages (${updatedFileCount} files updated).`)
