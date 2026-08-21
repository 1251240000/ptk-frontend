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
const integrationDocumentIds = ['first-request', 'clients', 'api-keys', 'sdk'] as const
const launchDocumentIds = ['billing', 'models-pricing', 'codex', 'image-studio'] as const
const supportDocumentIds = ['welcome', 'overview', 'faq', 'troubleshooting', 'usage-logs', 'contact-support'] as const

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

  it('publishes the six support guides with synchronized four-section structures', () => {
    const expected = {
      welcome: ['choose-path', 'prepare-access', 'complete-first-call', 'continue-reading'],
      overview: ['confirm-scope', 'choose-entry', 'check-live-data', 'verify-compatibility'],
      faq: ['choose-integration', 'manage-account', 'check-model-usage', 'resolve-common-failures'],
      troubleshooting: ['run-minimal-check', 'fix-by-status', 'decide-retry', 'prepare-diagnostics'],
      'usage-logs': ['open-logs', 'filter-requests', 'review-results', 'handle-failures'],
      'contact-support': ['check-before-contact', 'prepare-diagnostics', 'remove-sensitive-data', 'use-official-channels'],
    } as const
    const expectedTitles = {
      'zh-CN': {
        welcome: ['选择接入路径', '准备账户与密钥', '完成首次调用', '继续阅读文档'],
        overview: ['确认服务范围', '选择调用入口', '核对实时信息', '验证兼容性'],
        faq: ['选择接入方式', '管理密钥与账户', '核对模型与用量', '处理常见失败'],
        troubleshooting: ['运行最小检查', '根据状态修正', '决定是否重试', '准备排障信息'],
        'usage-logs': ['打开使用日志', '筛选调用记录', '核对结果与扣减', '处理失败与超时'],
        'contact-support': ['完成联系前检查', '准备诊断信息', '移除敏感内容', '使用正式支持渠道'],
      },
      en: {
        welcome: ['Choose an integration path', 'Prepare the account and key', 'Complete the first call', 'Continue with the docs'],
        overview: ['Confirm the service scope', 'Choose an API entry point', 'Check live information', 'Verify compatibility'],
        faq: ['Choose an integration method', 'Manage keys and account', 'Check models and usage', 'Resolve common failures'],
        troubleshooting: ['Run a minimal check', 'Fix issues by status', 'Decide whether to retry', 'Prepare diagnostics'],
        'usage-logs': ['Open Usage logs', 'Filter requests', 'Review results and deductions', 'Handle failures and timeouts'],
        'contact-support': ['Complete pre-contact checks', 'Prepare diagnostic information', 'Remove sensitive data', 'Use official support channels'],
      },
    } as const

    for (const id of supportDocumentIds) {
      const chinese = getDocsDocument(id, 'zh-CN')
      const english = getDocsDocument(id, 'en')
      expect(chinese.sections.map((section) => section.id)).toEqual([...expected[id]])
      expect(english.sections.map((section) => section.id)).toEqual([...expected[id]])
      expect(english.sections.map((section) => section.blocks.map((block) => block.type)))
        .toEqual(chinese.sections.map((section) => section.blocks.map((block) => block.type)))

      for (const [locale, document] of [['zh-CN', chinese], ['en', english]] as const) {
        expect(document.sections).toHaveLength(4)
        expect(document.sections.map((section) => section.title)).toEqual([...expectedTitles[locale][id]])
        expect(document.sections.every((section) => section.blocks.length <= 2)).toBe(true)
        expect(document.sections.flatMap((section) => section.blocks).some((block) => block.type === 'table')).toBe(false)
      }
    }
  })

  it('keeps support guide endpoints, placeholders, statuses, logs, and channels exact', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      const documents = Object.fromEntries(supportDocumentIds.map((id) => [id, getDocsDocument(id, locale)]))
      const contactSupport = getDocsDocument('contact-support', locale)
      const text = JSON.stringify(documents)
      const troubleshooting = JSON.stringify(documents.troubleshooting)
      const logs = JSON.stringify(documents['usage-logs'])

      expect(text).toContain('https://partokens.com/v1')
      expect(text).toContain('<YOUR_PARTOKENS_API_KEY>')
      expect(text).toContain('<YOUR_MODEL_ID>')
      expect(troubleshooting).toContain('export PARTOKENS_API_KEY=\\"<YOUR_PARTOKENS_API_KEY>\\"')
      expect(troubleshooting).toContain('https://partokens.com/v1/models')
      for (const status of ['400', '401', '403', '429', '5xx']) expect(troubleshooting).toContain(status)
      expect(troubleshooting.toLowerCase()).toContain(locale === 'zh-CN' ? '取消' : 'cancellation')
      expect(troubleshooting.toLowerCase()).toContain(locale === 'zh-CN' ? '超时' : 'timeout')

      expect(logs).toContain(locale === 'zh-CN' ? '时间范围' : 'time range')
      expect(logs).toContain(locale === 'zh-CN' ? '模型' : 'model')
      expect(logs).toContain(locale === 'zh-CN' ? 'API 密钥名称' : 'API key name')
      expect(logs).toContain(locale === 'zh-CN' ? '请求 ID' : 'Request ID')
      expect(logs).toContain('Token')
      expect(logs).not.toMatch(/最近\s*(?:24\s*小时|7\s*天|30\s*天)|Last\s+(?:24\s+hours|7\s+days|30\s+days)|每页\s*\d+|\d+\s+records per page/i)

      const channelBlocks = contactSupport.sections
        .flatMap((section) => section.blocks)
        .filter((block) => block.type === 'links')
      expect(channelBlocks).toEqual([{
        type: 'links',
        items: [
          { label: locale === 'zh-CN' ? 'Email 支持' : 'Email support', href: 'mailto:support@partokens.com' },
          { label: locale === 'zh-CN' ? 'Telegram 支持机器人' : 'Telegram support bot', href: 'https://t.me/PartokensSupportBot' },
        ],
      }])
    }
  })

  it('keeps fixed values, named tools, and implementation language out of support guides', () => {
    const text = (['zh-CN', 'en'] as const)
      .flatMap((locale) => supportDocumentIds.map((id) => getDocsSearchText(id, locale)))
      .join(' ')
    const normalized = text.toLowerCase()
    const forbiddenTerms = [
      '研发', '设计阶段', '内部字段', '源码', '后端', '前端', '控制器', '中间件', '模拟状态', '未来规划',
      'implementation analysis', 'design stage', 'internal field', 'source code', 'backend', 'frontend', 'controller', 'middleware', 'mock state', 'future plan',
      'relay', 'dto', 'new_api_error', 'codex++', 'cc switch',
      '固定模型', '固定价格', '固定金额', '固定额度', '有效期', '重置周期', '保留期限',
      'fixed model', 'fixed price', 'fixed amount', 'fixed quota', 'validity period', 'reset cycle', 'retention period',
    ]

    for (const term of forbiddenTerms) expect(normalized).not.toContain(term)
    expect(text).not.toMatch(/(?:[$¥€£]\s*\d|\d+(?:\.\d+)?\s*(?:美元|人民币|元|usd|cny|dollars?))/i)
    expect(text).not.toMatch(/\b(?:gpt|claude|gemini|deepseek|dall-e|sora)[-_\w.]*/i)
    expect(text).not.toMatch(/\bsk-[a-z0-9_-]{8,}\b/i)
    expect(new Set(text.match(/<[^>]+>/g) ?? []))
      .toEqual(new Set(['<YOUR_PARTOKENS_API_KEY>', '<YOUR_MODEL_ID>']))
  })

  it('publishes the four launch guides with synchronized task-oriented structure', () => {
    const expectedTitles = {
      'zh-CN': {
        billing: ['查看余额与套餐', '选择计费来源', '核对用量', '处理额度不足'],
        'models-pricing': ['查找模型', '核对能力与价格', '选择调用接口', '处理模型问题'],
        codex: ['准备 Codex', '配置连接', '验证调用', '处理失败'],
        'image-studio': ['打开工作台', '选择模型与密钥', '生成或编辑图像', '保存与处理失败'],
      },
      en: {
        billing: ['View balance and plan', 'Choose a billing source', 'Review usage', 'Resolve insufficient quota'],
        'models-pricing': ['Find models', 'Check capabilities and price', 'Choose an API', 'Resolve model issues'],
        codex: ['Prepare Codex', 'Configure the connection', 'Verify the call', 'Handle failures'],
        'image-studio': ['Open the workspace', 'Select a model and key', 'Generate or edit images', 'Save and handle failures'],
      },
    } as const

    for (const id of launchDocumentIds) {
      const chinese = getDocsDocument(id, 'zh-CN')
      const english = getDocsDocument(id, 'en')
      expect(english.sections.map((section) => section.id)).toEqual(chinese.sections.map((section) => section.id))
      expect(english.sections.map((section) => section.blocks.map((block) => block.type)))
        .toEqual(chinese.sections.map((section) => section.blocks.map((block) => block.type)))
    }

    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of launchDocumentIds) {
        const document = getDocsDocument(id, locale)
        expect(document.sections).toHaveLength(4)
        expect(document.sections.map((section) => section.title)).toEqual([...expectedTitles[locale][id]])
        expect(document.sections.every((section) => section.blocks.length <= 2)).toBe(true)
      }
    }
  })

  it('keeps launch guide routes, endpoints, placeholders, and Codex commands exact', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      const billing = JSON.stringify(getDocsDocument('billing', locale))
      const models = JSON.stringify(getDocsDocument('models-pricing', locale))
      const codex = JSON.stringify(getDocsDocument('codex', locale))
      const studio = JSON.stringify(getDocsDocument('image-studio', locale))

      expect(billing).toContain(locale === 'zh-CN' ? '钱包' : 'Wallet')
      expect(billing).toContain(locale === 'zh-CN' ? '使用日志' : 'Usage logs')
      expect(billing).toContain(locale === 'zh-CN' ? '套餐优先' : 'Subscription first')
      expect(billing).toContain(locale === 'zh-CN' ? '仅余额' : 'Balance only')

      expect(models).toContain('https://partokens.com/v1/models')
      expect(models).toContain('<YOUR_PARTOKENS_API_KEY>')
      expect(models).toContain('<YOUR_MODEL_ID>')
      expect(models).toContain('/v1/chat/completions')
      expect(models).toContain('/v1/responses')
      expect(models).toContain('/v1/images/generations')
      expect(models).toContain('400')
      expect(models).toContain('403')

      expect(codex).toContain('https://partokens.com/v1')
      expect(codex).toContain('model_provider = \\"partokens\\"')
      expect(codex).toContain('env_key = \\"PARTOKENS_API_KEY\\"')
      expect(codex).toContain('wire_api = \\"responses\\"')
      expect(codex).toContain('model = \\"<YOUR_MODEL_ID>\\"')
      expect(codex).toContain('export PARTOKENS_API_KEY=\\"<YOUR_PARTOKENS_API_KEY>\\"')
      expect(codex).toContain('codex exec \\"Reply only with: connection successful\\"')

      expect(studio).toContain('<YOUR_MODEL_ID>')
      expect(studio).toContain('PNG')
      expect(studio).toContain('JPG')
      expect(studio).toContain('WebP')
      for (const status of ['401', '403', '429', '5xx']) expect(studio).toContain(status)

      const codexSamples = getDocsDocument('codex', locale).sections
        .flatMap((section) => section.blocks.flatMap((block) => block.type === 'code-samples' ? block.samples : []))
      expect(new Set(codexSamples.map((sample) => sample.language))).toEqual(new Set(['shell']))
    }
  })

  it('keeps fixed commercial values, credentials, and internal language out of launch guides', () => {
    const text = (['zh-CN', 'en'] as const)
      .flatMap((locale) => launchDocumentIds.map((id) => getDocsSearchText(id, locale)))
      .join(' ')
    const normalized = text.toLowerCase()
    const forbiddenTerms = [
      '当前实现', '已确认行为', '兼容边界分析', '后端', '前端', 'dto', '控制器', '中间件', '源码', '内部字段映射',
      '未实现', '缺失控件', '未来规划', '占位说明', 'design lab', 'design-lab', '设计样例', '静态数据', '模拟状态',
      'current implementation', 'confirmed behavior', 'compatibility boundary analysis', 'backend', 'frontend', 'controller', 'middleware',
      'source code', 'internal field mapping', 'not implemented', 'missing control', 'future plan', 'design sample', 'static data', 'mock state',
      'subscription_first', 'wallet_first', 'subscription_only', 'wallet_only', 'amount_total', 'amount_used', 'quota_type',
      'model_ratio', 'model_price', 'supported_endpoint_types', 'new-api', 'codex++', 'cc switch',
      '固定价格', '固定金额', '固定额度', '保留期限', '一个月', '周期重置',
      'fixed price', 'fixed amount', 'fixed quota', 'retention period', 'monthly reset',
    ]

    for (const term of forbiddenTerms) expect(normalized).not.toContain(term)
    expect(text).not.toMatch(/(?:[$¥€£]\s*\d|\d+(?:\.\d+)?\s*(?:美元|人民币|元|usd|cny|dollars?))/i)
    expect(text).not.toMatch(/\bsk-[a-z0-9_-]{8,}\b/i)

    const placeholders = new Set(text.match(/<[^>]+>/g) ?? [])
    expect(placeholders).toEqual(new Set(['<YOUR_PARTOKENS_API_KEY>', '<YOUR_MODEL_ID>']))
  })

  it('publishes the four integration guides with the required concise structure', () => {
    const expectedTitles = {
      'zh-CN': {
        'first-request': ['准备接入', '发送请求', '读取响应', '处理失败'],
        clients: ['选择客户端', '配置连接', '验证调用', '处理问题'],
        'api-keys': ['创建密钥', '配置密钥', '轮换与撤销', '处理异常'],
        sdk: ['安装 SDK', '配置客户端', '发送并读取请求', '处理错误'],
      },
      en: {
        'first-request': ['Prepare the integration', 'Send the request', 'Read the response', 'Handle failures'],
        clients: ['Choose a client', 'Configure the connection', 'Verify the call', 'Troubleshoot'],
        'api-keys': ['Create a key', 'Configure the key', 'Rotate and revoke', 'Handle exceptions'],
        sdk: ['Install the SDK', 'Configure the client', 'Send and read a request', 'Handle errors'],
      },
    } as const

    for (const id of integrationDocumentIds) {
      const chinese = getDocsDocument(id, 'zh-CN')
      const english = getDocsDocument(id, 'en')
      expect(english.sections.map((section) => section.id)).toEqual(chinese.sections.map((section) => section.id))
      expect(english.sections.map((section) => section.blocks.map((block) => block.type)))
        .toEqual(chinese.sections.map((section) => section.blocks.map((block) => block.type)))
    }

    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of integrationDocumentIds) {
        const document = getDocsDocument(id, locale)
        expect(document.sections).toHaveLength(4)
        expect(document.sections.map((section) => section.title)).toEqual([...expectedTitles[locale][id]])
        expect(document.sections.every((section) => section.blocks.length <= 2)).toBe(true)
      }
    }
  })

  it('keeps integration endpoints, placeholders, fields, and sample languages aligned', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      for (const id of integrationDocumentIds) {
        const document = getDocsDocument(id, locale)
        const text = JSON.stringify(document)
        expect(text).toContain('<YOUR_PARTOKENS_API_KEY>')
        expect(text).not.toContain('your-model')
        expect(text).not.toContain('replace-with-your-key')

        if (id !== 'api-keys') {
          expect(text).toContain('<YOUR_MODEL_ID>')
          expect(text).toContain('https://partokens.com/v1')
        }
        if (id === 'first-request' || id === 'clients' || id === 'sdk') {
          expect(text).toContain('/v1/chat/completions')
          expect(text).toContain('choices[0].message.content')
          expect(text).toContain('messages')
          expect(text).toContain('model')
        }
        if (id === 'clients') {
          expect(text).toContain('Codex')
          expect(text).toContain('/v1/responses')
          expect(text).toContain('codex exec')
        }
        if (id === 'api-keys') {
          expect(text).toContain('GET /v1/models')
          expect(text).toContain('401')
          expect(text).toContain('403')
        }

        const samples = document.sections.flatMap((section) => section.blocks.flatMap((block) => block.type === 'code-samples' ? block.samples : []))
        if (id === 'first-request' || id === 'clients') {
          expect(new Set(samples.map((sample) => sample.language))).toEqual(new Set(['shell', 'javascript', 'python']))
        }
        if (id === 'sdk') {
          expect(samples.some((sample) => sample.code.includes('npm install openai'))).toBe(true)
          expect(samples.some((sample) => sample.code.includes('python -m pip install openai'))).toBe(true)
          expect(samples.some((sample) => sample.language === 'javascript' && sample.code.includes('baseURL'))).toBe(true)
          expect(samples.some((sample) => sample.language === 'python' && sample.code.includes('base_url'))).toBe(true)
        }
      }
    }
  })

  it('removes implementation, design-stage, and placeholder language from the four integration guides', () => {
    const text = (['zh-CN', 'en'] as const)
      .flatMap((locale) => integrationDocumentIds.map((id) => getDocsSearchText(id, locale)))
      .join(' ')
      .toLowerCase()
    const forbiddenTerms = [
      '当前实现', '已确认行为', '兼容边界分析', '后端', '前端', 'dto', '控制器', '中间件', '源码', '内部字段映射',
      '未实现', '缺失控件', '未来规划', '占位说明', 'design lab', 'design-lab', '设计样例', '静态数据', '模拟状态',
      'current implementation', 'confirmed behavior', 'compatibility boundary analysis', 'backend', 'frontend', 'controller', 'middleware',
      'source code', 'internal field mapping', 'not implemented', 'missing control', 'future plan', 'design sample', 'static data', 'mock state',
      '待确认', '尚未确认', 'pending review', 'placeholder',
    ]

    for (const term of forbiddenTerms) expect(text).not.toContain(term)
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
        expect(documentText).not.toContain('<YOUR_IMAGE_MODEL_ID>')
        if (id === 'api-basics' || id === 'chat-completions' || id === 'image-api') {
          expect(documentText).toContain('<YOUR_MODEL_ID>')
        }
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
