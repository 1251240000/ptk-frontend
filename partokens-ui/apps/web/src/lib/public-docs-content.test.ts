import { describe, expect, it } from 'vitest'

import {
  docsCatalog,
  getDocsDocument,
  getDocsSearchText,
  hasLocalizedDocsDocument,
  publicDocsCopy,
} from '@partokens/content/public'

const documentIds = docsCatalog.flatMap((group) => group.items.map((item) => item.id))
const apiDocumentIds = ['api-basics', 'chat-completions', 'image-api', 'models-api'] as const

describe('published documentation', () => {
  it('publishes every catalog page in Chinese and English', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of documentIds) {
        const document = getDocsDocument(id, locale)
        expect(hasLocalizedDocsDocument(id, locale)).toBe(true)
        expect(document.id).toBe(id)
        expect(document.summary.trim()).not.toBe('')
        expect(document.sections.length).toBeGreaterThan(0)
        expect(new Set(document.sections.map((section) => section.id)).size).toBe(document.sections.length)
      }
    }
  })

  it('keeps product guides concise', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of ['image-studio', 'usage-logs'] as const) {
        const document = getDocsDocument(id, locale)
        expect(document.sections).toHaveLength(4)
        expect(document.sections.every((section) => section.blocks.length <= 2)).toBe(true)
      }
    }
  })

  it('publishes concise task-oriented API documentation in Chinese and English', () => {
    const expectedTitles = {
      'zh-CN': {
        'api-basics': ['发送请求', '运行最小请求', '读取响应', '处理错误'],
        'chat-completions': ['发送请求', '填写请求', '读取响应', '处理错误'],
        'image-api': ['发送请求', '填写请求', '读取响应', '处理错误'],
        'models-api': ['发送请求', '运行最小请求', '读取响应', '处理错误'],
      },
      en: {
        'api-basics': ['Send a request', 'Run a minimal request', 'Read the response', 'Handle errors'],
        'chat-completions': ['Send a request', 'Fill in the request', 'Read the response', 'Handle errors'],
        'image-api': ['Send a request', 'Fill in the request', 'Read the response', 'Handle errors'],
        'models-api': ['Send a request', 'Run a minimal request', 'Read the response', 'Handle errors'],
      },
    } as const

    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of apiDocumentIds) {
        const document = getDocsDocument(id, locale)
        expect(document.sections).toHaveLength(4)
        expect(document.sections.map((section) => section.title)).toEqual([...expectedTitles[locale][id]])
        expect(document.sections.every((section) => section.blocks.length <= 2)).toBe(true)

        const samples = document.sections.flatMap((section) => section.blocks.flatMap((block) => block.type === 'code-samples' ? block.samples : []))
        expect(new Set(samples.map((sample) => sample.language))).toEqual(new Set(['shell', 'javascript', 'python']))
        for (const sample of samples) expect(sample.code).toContain('<YOUR_PARTOKENS_API_KEY>')

        const documentText = JSON.stringify(document)
        if (id === 'api-basics' || id === 'chat-completions') expect(documentText).toContain('<YOUR_MODEL_ID>')
        if (id === 'image-api') expect(documentText).toContain('<YOUR_IMAGE_MODEL_ID>')
      }
    }
  })

  it('keeps API examples aligned with the published request and response contract', () => {
    const expectedContent = {
      'api-basics': ['https://partokens.com/v1', '/v1/chat/completions', '`model`', '`messages`', '`error.message`'],
      'chat-completions': ['https://partokens.com/v1/chat/completions', '`model`', '`messages`', '`choices[0].message.content`', '`error.message`'],
      'image-api': ['https://partokens.com/v1/images/generations', '`model`', '`prompt`', '`data[0].url`', '`data[0].b64_json`'],
      'models-api': ['https://partokens.com/v1/models', '`data`', '`data[].id`'],
    } as const

    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of apiDocumentIds) {
        const documentText = JSON.stringify(getDocsDocument(id, locale))
        for (const value of expectedContent[id]) expect(documentText).toContain(value)
        expect(documentText).not.toContain('your-model')
        expect(documentText).not.toContain('your-image-model')
      }
    }
  })

  it('removes implementation and design-stage language from the API pages', () => {
    const apiText = (['zh-CN', 'en'] as const)
      .flatMap((locale) => apiDocumentIds.map((id) => getDocsSearchText(id, locale)))
      .join(' ')
      .toLowerCase()
    const forbiddenTerms = [
      '当前实现',
      '已确认行为',
      '兼容边界分析',
      '后端',
      '前端',
      'dto',
      '控制器',
      '中间件',
      '源码',
      '内部字段映射',
      '未实现',
      '缺失控件',
      '未来规划',
      '占位说明',
      'design lab',
      '设计样例',
      '静态数据',
      '模拟状态',
      'current implementation',
      'confirmed behavior',
      'compatibility boundary analysis',
      'backend',
      'frontend',
      'controller',
      'middleware',
      'source code',
      'internal field mapping',
      'not implemented',
      'missing control',
      'future plan',
      'design sample',
      'static data',
      'mock state',
    ]

    for (const term of forbiddenTerms) expect(apiText).not.toContain(term)
  })

  it('blocks design-stage and internal implementation language from public documentation', () => {
    const publishedText = [
      ...(['zh-CN', 'en'] as const).flatMap((locale) => documentIds.map((id) => getDocsSearchText(id, locale))),
      JSON.stringify(publicDocsCopy),
    ].join(' ').toLowerCase()
    const forbiddenTerms = [
      'design-lab',
      'design lab',
      '设计样例',
      '設計樣例',
      '当前真实可操作的控件',
      '内置样例',
      '本地计时器',
      '内容待补充',
      '待产品',
      '待后端',
      '待确认',
      '尚未确认',
      '后端 dto',
      'backend dto',
      'later batch',
      'content pending',
    ]

    for (const term of forbiddenTerms) expect(publishedText).not.toContain(term)
  })
})
