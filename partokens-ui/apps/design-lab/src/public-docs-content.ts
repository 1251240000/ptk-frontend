import type { DocsItemId } from './public-docs-copy'

export type DocsCalloutTone = 'info' | 'warning' | 'success'

export type DocsCodeSample = {
  language: 'shell' | 'javascript' | 'python'
  label: string
  code: string
}

export type DocsContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'steps'; items: Array<{ title: string; body: string }> }
  | { type: 'callout'; tone: DocsCalloutTone; title: string; body: string }
  | { type: 'endpoint'; method?: string; path: string; label: string }
  | { type: 'code-samples'; samples: DocsCodeSample[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'faq'; items: Array<{ question: string; answer: string }> }

export type DocsContentSection = {
  id: string
  title: string
  blocks: DocsContentBlock[]
}

export type DocsDocument = {
  id: DocsItemId
  summary: string
  prerequisites?: string[]
  sections: DocsContentSection[]
}

const firstRequestSamples: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "messages": [
      {"role": "user", "content": "用一句话介绍 Partokens"}
    ]
  }'`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const response = await client.chat.completions.create({
  model: "your-model",
  messages: [
    { role: "user", content: "用一句话介绍 Partokens" },
  ],
});

console.log(response.choices[0]?.message?.content);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

response = client.chat.completions.create(
    model="your-model",
    messages=[
        {"role": "user", "content": "用一句话介绍 Partokens"},
    ],
)

print(response.choices[0].message.content)`,
  },
]

const chatSamples: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "messages": [
      {"role": "system", "content": "回答保持简洁。"},
      {"role": "user", "content": "给我三个 API 接入检查项。"}
    ]
  }'`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const completion = await client.chat.completions.create({
  model: "your-model",
  messages: [
    { role: "system", content: "回答保持简洁。" },
    { role: "user", content: "给我三个 API 接入检查项。" },
  ],
});

console.log(completion.choices[0]?.message?.content);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

completion = client.chat.completions.create(
    model="your-model",
    messages=[
        {"role": "system", "content": "回答保持简洁。"},
        {"role": "user", "content": "给我三个 API 接入检查项。"},
    ],
)

print(completion.choices[0].message.content)`,
  },
]

const imageGenerationSamples: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `set -euo pipefail

response="$(curl --silent --show-error --fail-with-body \\
  https://partokens.com/v1/images/generations \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-image-model",
    "prompt": "一枚放在白色桌面上的玻璃纸镇，柔和自然光"
  }')"

image_url="$(printf '%s' "$response" | jq -r '.data[0].url // empty')"
if [ -n "$image_url" ]; then
  curl --fail --location "$image_url" --output image-result
else
  printf '%s' "$response" | jq -er '.data[0].b64_json' \\
    | openssl base64 -d -A > image-result
fi`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `import { writeFile } from "node:fs/promises";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const result = await client.images.generate({
  model: "your-image-model",
  prompt: "一枚放在白色桌面上的玻璃纸镇，柔和自然光",
});

const image = result.data?.[0];
if (!image) throw new Error("响应中没有图片结果");

if (image.url) {
  const download = await fetch(image.url);
  if (!download.ok) throw new Error("下载失败：" + download.status);
  await writeFile("image-result", Buffer.from(await download.arrayBuffer()));
} else if (image.b64_json) {
  await writeFile("image-result", Buffer.from(image.b64_json, "base64"));
} else {
  throw new Error("响应既没有 url，也没有 b64_json");
}`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `import base64
import os
from urllib.request import urlopen
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

result = client.images.generate(
    model="your-image-model",
    prompt="一枚放在白色桌面上的玻璃纸镇，柔和自然光",
)

if not result.data:
    raise RuntimeError("响应中没有图片结果")

image = result.data[0]
if image.url:
    with urlopen(image.url) as download:
        content = download.read()
elif image.b64_json:
    content = base64.b64decode(image.b64_json, validate=True)
else:
    raise RuntimeError("响应既没有 url，也没有 b64_json")

with open("image-result", "wb") as output:
    output.write(content)`,
  },
]

export const completedDocsOrder: DocsItemId[] = [
  'welcome',
  'overview',
  'first-request',
  'api-keys',
  'billing',
  'codex',
  'api-basics',
  'chat-completions',
  'image-api',
  'faq',
  'troubleshooting',
]

export const zhCnDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  welcome: {
    id: 'welcome',
    summary: '从文档地图开始，了解 Partokens 的兼容边界，并找到创建密钥、选择模型和发送请求的最短路径。',
    sections: [
      {
        id: 'start-here',
        title: '从这里开始',
        blocks: [
          { type: 'paragraph', text: '如果你第一次使用 Partokens，建议按下面的顺序完成接入。每一步都对应一篇可以独立使用的文档。' },
          {
            type: 'steps',
            items: [
              { title: '了解服务边界', body: '先阅读“Partokens 是什么”，确认兼容入口与动态配置的边界。' },
              { title: '准备访问凭据', body: '在控制台创建 API 密钥，并把密钥放入本地环境变量。' },
              { title: '完成首次请求', body: '选择账户当前可用的模型，通过 Shell、JavaScript 或 Python 发送聊天补全请求。' },
            ],
          },
        ],
      },
      {
        id: 'base-url',
        title: '统一接入地址',
        blocks: [
          { type: 'paragraph', text: 'Partokens 当前文档统一使用下面的 OpenAI 兼容基础地址。具体 API 路径会追加在该地址之后。' },
          { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          { type: 'callout', tone: 'success', title: '可以沿用熟悉的 SDK', body: '支持自定义 `baseURL` 或 `base_url` 的 OpenAI 兼容客户端，可以把请求指向 Partokens。' },
        ],
      },
      {
        id: 'documentation-boundary',
        title: '如何理解本文档',
        blocks: [
          { type: 'paragraph', text: '文档负责说明已确认的入口、通用调用方式和客户端示例。账户中的可用模型、价格以及具体参数支持情况属于动态信息。' },
          { type: 'callout', tone: 'warning', title: '以实时配置为准', body: '模型、价格、限额与可用性以账户实时配置和服务端实际响应为准；文档不会把尚未确认的值写成固定承诺。' },
        ],
      },
    ],
  },
  overview: {
    id: 'overview',
    summary: 'Partokens 提供统一的 OpenAI 兼容 API 入口，让应用通过熟悉的 SDK 和请求格式访问账户当前可用的模型。',
    sections: [
      {
        id: 'positioning',
        title: '服务定位',
        blocks: [
          { type: 'paragraph', text: 'Partokens 位于你的应用或 SDK 与模型服务之间。客户端把请求发送到 `https://partokens.com/v1`，Partokens 根据账户和服务端的当前配置处理请求。' },
          { type: 'callout', tone: 'info', title: '兼容不等于完全相同', body: 'OpenAI 兼容表示可以复用常见的客户端和调用形态；每个模型实际支持的参数与能力仍需以实时结果为准。' },
        ],
      },
      {
        id: 'request-flow',
        title: '一次调用如何经过 Partokens',
        blocks: [
          {
            type: 'steps',
            items: [
              { title: '应用构造请求', body: '使用 OpenAI SDK 或标准 HTTPS 请求，提供 API 密钥、模型名和输入内容。' },
              { title: '请求进入统一入口', body: '客户端使用 Partokens Base URL，并调用相应的兼容 API 路径。' },
              { title: '服务端返回结果', body: '应用读取兼容响应；实际路由、可用性和用量结果由服务端决定。' },
            ],
          },
        ],
      },
      {
        id: 'live-data',
        title: '哪些信息是动态的',
        blocks: [
          {
            type: 'table',
            columns: ['信息', '应当查看的位置'],
            rows: [
              ['可用模型', '账户实时配置或模型页面'],
              ['模型价格', '账户中展示的当前价格信息'],
              ['调用结果与用量', '服务端响应及账户使用记录'],
              ['具体参数支持', '目标模型的实际响应；详细兼容表待补充'],
            ],
          },
          { type: 'callout', tone: 'warning', title: '仍待确认', body: '完整的提供商路由规则、参数兼容矩阵和数据保留说明尚待产品或后端补充。' },
        ],
      },
    ],
  },
  'first-request': {
    id: 'first-request',
    summary: '准备 API 密钥和一个账户当前可用的模型名，然后通过任意一种 OpenAI 兼容调用完成首次接入。',
    prerequisites: ['可以登录 Partokens 控制台的账户', '已创建的 API 密钥', '账户当前可用的模型名称'],
    sections: [
      {
        id: 'prepare',
        title: '1. 准备环境',
        blocks: [
          { type: 'paragraph', text: '把密钥保存在环境变量中，不要直接写进源代码、提交记录或前端 bundle。' },
          {
            type: 'code-samples',
            samples: [
              { language: 'shell', label: 'Shell', code: `export PARTOKENS_API_KEY="replace-with-your-key"` },
              { language: 'javascript', label: 'JavaScript', code: `// 在运行环境中设置 PARTOKENS_API_KEY，代码通过：
process.env.PARTOKENS_API_KEY` },
              { language: 'python', label: 'Python', code: `# 在运行环境中设置 PARTOKENS_API_KEY，代码通过：
os.environ["PARTOKENS_API_KEY"]` },
            ],
          },
        ],
      },
      {
        id: 'send-request',
        title: '2. 发送聊天补全请求',
        blocks: [
          { type: 'paragraph', text: '将示例中的 `your-model` 替换为账户当前可用的模型名。三种示例调用的是同一个端点。' },
          { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          { type: 'code-samples', samples: firstRequestSamples },
        ],
      },
      {
        id: 'verify',
        title: '3. 验证结果',
        blocks: [
          { type: 'list', items: ['HTTP 请求成功返回，而不是网络或鉴权失败。', '响应中包含聊天补全结果，SDK 示例可以读取第一条消息内容。', '如账户提供使用记录，可用请求时间和模型名核对本次调用。'] },
          { type: 'callout', tone: 'success', title: '首次接入完成', body: '当同一组凭据、Base URL 和模型名能稳定返回结果后，就可以把这些配置接入你的应用。' },
          { type: 'callout', tone: 'warning', title: '不要猜测失败原因', body: '如调用失败，请保留 HTTP 状态、完整响应正文、请求时间和模型名。正式错误码目录与请求标识字段仍待补充。' },
        ],
      },
    ],
  },
  'api-keys': {
    id: 'api-keys',
    summary: '在控制台创建并管理用于 API 调用的密钥，同时采用环境变量、最小暴露和定期替换等基本安全措施。',
    prerequisites: ['可以登录 Partokens 控制台的账户'],
    sections: [
      {
        id: 'create-key',
        title: '创建密钥',
        blocks: [
          { type: 'steps', items: [
            { title: '进入 API 密钥页面', body: '登录控制台后打开 API 密钥管理。' },
            { title: '创建用于接入的密钥', body: '使用便于识别用途的名称；页面实际提供的配置项以当前界面为准。' },
            { title: '保存并配置客户端', body: '把密钥放入安全的服务端环境变量或密钥管理系统。' },
          ] },
          { type: 'callout', tone: 'warning', title: '密钥展示规则待确认', body: '密钥是否只显示一次、是否支持范围或过期时间等行为，需要以后端和控制台的最终实现为准。' },
        ],
      },
      {
        id: 'use-key',
        title: '在请求中使用密钥',
        blocks: [
          { type: 'paragraph', text: 'OpenAI 兼容请求通过 `Authorization` 请求头携带密钥。SDK 会根据 `apiKey` 或 `api_key` 配置生成该请求头。' },
          { type: 'code-samples', samples: [
            { language: 'shell', label: 'Shell', code: `export PARTOKENS_API_KEY="replace-with-your-key"

curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'` },
            { language: 'javascript', label: 'JavaScript', code: `const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});` },
            { language: 'python', label: 'Python', code: `client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)` },
          ] },
        ],
      },
      {
        id: 'key-safety',
        title: '安全使用建议',
        blocks: [
          { type: 'list', items: ['不要把 API 密钥提交到 Git 仓库或粘贴到公开日志。', '不要在浏览器前端、移动端安装包等可被最终用户读取的代码中嵌入长期密钥。', '为不同环境或应用使用不同密钥，便于定位暴露范围。', '怀疑密钥泄露时，先停止客户端继续使用该密钥，再在控制台执行当前可用的撤销或替换操作。'] },
          { type: 'callout', tone: 'info', title: '轮换与撤销流程待补充', body: '撤销后的生效时间、密钥数量限制和自动轮换能力尚未确认，本页不对这些行为作固定承诺。' },
        ],
      },
    ],
  },
  billing: {
    id: 'billing',
    summary: '理解账户余额、套餐额度与模型用量如何关联，并按控制台的实时数据完成充值、购买套餐和用量核对。',
    prerequisites: ['可以登录 Partokens 控制台的账户'],
    sections: [
      {
        id: 'concepts',
        title: '余额、套餐与用量的关系',
        blocks: [
          { type: 'paragraph', text: '账户可以充值余额，也可以用余额购买套餐。模型请求产生的用量会按照账户的计费偏好，从可用套餐额度或余额中扣减；两者都不足时请求不会透支执行。' },
          { type: 'table', columns: ['概念', '作用', '已确认边界'], rows: [
            ['账户余额', '可用于模型调用，也可用于购买套餐', '不会周期性重置；不足时不能透支'],
            ['充值', '增加账户余额', '具体渠道、支付方式与到账规则待产品或后端确认'],
            ['套餐', '购买后创建一份有开始和结束时间的套餐实例', 'Partokens 套餐有效期为一个月，过期后失效'],
            ['套餐额度', '套餐实例中的总额度减去已用额度', '不会在有效期内周期性重置，也不会延续到过期后'],
            ['模型用量', '一次模型调用对应的计费用量', '以账户实时价格、服务端结算和使用记录为准'],
          ] },
        ],
      },
      {
        id: 'billing-order',
        title: '消耗顺序',
        blocks: [
          { type: 'paragraph', text: '后端将未识别的计费偏好归一为 `subscription_first`。账户界面可展示四种偏好；实际请求始终需要所选来源有足够额度，不会把负数余额视为可用额度。' },
          { type: 'table', columns: ['偏好值', '处理顺序'], rows: [
            ['`subscription_first`', '先查找适用的有效套餐；套餐不可用或不足时，只有在服务端允许余额回退时才改用余额'],
            ['`wallet_first`', '先使用账户余额；余额不足并返回 `insufficient_user_quota` 时，再尝试适用的有效套餐'],
            ['`subscription_only`', '只使用适用的有效套餐，不回退到账户余额'],
            ['`wallet_only`', '只使用账户余额，不消耗套餐额度'],
          ] },
          { type: 'callout', tone: 'warning', title: '余额回退仍待确认', body: '`subscription_first` 下是否为 Partokens 账户开启 `allow_wallet_overflow`，以及 `wallet_first` 的精确回退条件，仍待后端确认。不要仅凭界面选项推断某次请求会自动切换来源。' },
        ],
      },
      {
        id: 'lifecycle',
        title: '有效期与状态',
        blocks: [
          { type: 'paragraph', text: '套餐购买成功并创建套餐实例时，以数据库当前时间记录 `start_time`；Partokens 的月套餐以该时间向后计算一个月作为 `end_time`，不是按自然月或首次调用时间起算。' },
          { type: 'table', columns: ['字段或状态', '含义'], rows: [
            ['`amount_total`', '套餐实例的总额度'],
            ['`amount_used`', '该实例已经使用的额度'],
            ['`start_time` / `end_time`', '有效期开始与结束时间'],
            ['`active`', '当前有效'],
            ['`expired`', '已过有效期'],
            ['`cancelled`', '已取消'],
          ] },
          { type: 'callout', tone: 'info', title: '没有周期重置', body: '账户余额和套餐额度都不会周期性重置。套餐过期是实例失效，不是额度恢复；过期额度不会继续用于新请求。' },
        ],
      },
      {
        id: 'workflow',
        title: '查看余额、购买套餐并核对用量',
        blocks: [
          { type: 'steps', items: [
            { title: '查看实时余额与套餐', body: '登录控制台，进入账户或钱包区域，记录当前余额、套餐状态、已用额度和结束时间。页面实际命名以当前界面为准。' },
            { title: '按需充值', body: '使用控制台当前提供的充值入口增加余额。提交前以页面展示的金额、到账说明和订单状态为准。' },
            { title: '购买套餐', body: '从控制台当前可购买的套餐中选择并确认。后端会先检查账户余额；余额不足时不会完成购买。' },
            { title: '设置并确认计费偏好', body: '在账户设置中核对套餐优先、余额优先或仅使用单一来源的选择，并保存当前界面支持的选项。' },
            { title: '核对模型用量', body: '完成请求后，在使用记录中按请求时间和模型筛选，对照计费用量以及余额或套餐已用额度的变化。' },
          ] },
          { type: 'callout', tone: 'warning', title: '设计样例不是真实账单', body: 'design-lab 展示的是已确认的产品能力，但其中的金额、套餐额度、请求记录和模型价格都是设计样例，不代表你的真实账户数据，也不构成价格承诺。' },
          { type: 'callout', tone: 'warning', title: '待产品或后端确认', body: '充值渠道、支付方式、退款规则、套餐具体价格、订单状态流转以及部分页面名称尚未确认，请以正式控制台和后续公告为准。' },
        ],
      },
    ],
  },
  codex: {
    id: 'codex',
    summary: '通过 Codex 原生配置或独立开源工具，把 Codex 的 Responses 请求安全地指向 Partokens。',
    prerequisites: ['已安装并可以运行 Codex', '已创建 Partokens API 密钥', '已从账户实时模型列表确认一个支持 Responses 的模型'],
    sections: [
      {
        id: 'prepare',
        title: '配置前准备',
        blocks: [
          { type: 'paragraph', text: 'Codex 的用户配置位于 `~/.codex/config.toml`，项目配置可位于仓库中的 `.codex/config.toml`。重定向 provider、鉴权和 Base URL 的设置应写在用户配置中，不要交给不受信任的项目文件。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '备份、保护密钥并确认模型', code: `mkdir -p ~/.codex
[ ! -f ~/.codex/config.toml ] || \\
  cp -p ~/.codex/config.toml ~/.codex/config.toml.partokens.bak
chmod 700 ~/.codex
[ ! -f ~/.codex/config.toml ] || chmod 600 ~/.codex/config.toml

export PARTOKENS_API_KEY="replace-with-your-key"

curl https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY"` }] },
          { type: 'callout', tone: 'warning', title: '模型名必须来自实时账户', body: '下面的 `your-current-model` 是占位符。请从 Partokens 账户当前可用模型或 `/v1/models` 响应中选择，并确认该模型支持 Codex 使用的 Responses API。' },
        ],
      },
      {
        id: 'native-codex',
        title: '路径一：原生 Codex 配置',
        blocks: [
          { type: 'paragraph', text: '下面使用当前 Codex 支持的自定义 model provider 格式。`partokens` 只是本地配置中的自定义标识，不是 Codex 内置或 Partokens 预注册的 provider 名称。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '~/.codex/config.toml', code: `model = "your-current-model"
model_provider = "partokens"

[model_providers.partokens]
name = "Partokens"
base_url = "https://partokens.com/v1"
env_key = "PARTOKENS_API_KEY"
wire_api = "responses"` }] },
          { type: 'paragraph', text: '如果你明确希望继续使用 Codex 内置 OpenAI provider，也可以在用户配置顶层设置 `openai_base_url = "https://partokens.com/v1"`；自定义 provider 更便于使用独立的 `PARTOKENS_API_KEY` 环境变量。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '验证 Codex', code: `codex exec "只回复：连接成功"` }] },
        ],
      },
      {
        id: 'codex-plusplus',
        title: '路径二：Codex++',
        blocks: [
          { type: 'paragraph', text: 'Codex++（`github.com/b-nnett/codex-plusplus`）是独立开源的 Codex 桌面端 tweak loader，不是 API provider 管理器，也不由 Partokens 维护。安装后仍按上一节编辑原生 `~/.codex/config.toml` 并设置 `PARTOKENS_API_KEY`。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: 'Codex++ 官方 macOS 安装命令', code: `brew install b-nnett/codex-plusplus/codexplusplus
codexplusplus install` }] },
          { type: 'table', columns: ['系统', 'Codex++ 用户数据目录'], rows: [
            ['macOS', '`~/Library/Application Support/codex-plusplus/`'],
            ['Windows', '`%APPDATA%/codex-plusplus/`'],
            ['Linux', '`$XDG_DATA_HOME/codex-plusplus/` 或 `~/.local/share/codex-plusplus/`'],
          ] },
          { type: 'callout', tone: 'info', title: '配置职责保持分离', body: 'Codex++ 的安装不会替你创建 Partokens provider。不要假设存在 Partokens 专用 tweak、表单或额外配置字段。' },
        ],
      },
      {
        id: 'cc-switch',
        title: '路径三：CC Switch',
        blocks: [
          { type: 'paragraph', text: 'CC Switch（`github.com/farion1231/cc-switch`，官方站点 `ccswitch.io`）是独立开源的 provider 切换工具，不由 Partokens 维护。它会修改 `~/.codex/auth.json` 和 `~/.codex/config.toml`，操作前应先备份这两个文件。' },
          { type: 'steps', items: [
            { title: '选择 Codex 并添加 provider', body: '在 CC Switch 中选择 Codex，点击 `+ / Add Provider`，然后选择 `Custom`。' },
            { title: '填写实时配置', body: '填写 Partokens API Key、Base URL `https://partokens.com/v1`，以及账户当前可用的默认模型。' },
            { title: '选择 Responses 格式', body: '将上游格式设为 `Responses`。Partokens 已提供 Responses 路由，不需要额外开启 Chat Completions 本地路由。' },
            { title: '启用并重启', body: '点击 `Enable`，然后重启终端和 Codex，使新环境变量与配置生效。' },
          ] },
          { type: 'code-samples', samples: [{ language: 'shell', label: 'CC Switch 写入结果示例', code: `# ~/.codex/auth.json
{
  "OPENAI_API_KEY": "your-api-key"
}

# ~/.codex/config.toml
model_provider = "custom"
model = "your-current-model"

[model_providers.custom]
name = "custom"
base_url = "https://partokens.com/v1"
wire_api = "responses"
requires_openai_auth = true` }] },
        ],
      },
      {
        id: 'security-rollback',
        title: '密钥保护与回滚',
        blocks: [
          { type: 'list', items: ['将 `~/.codex/config.toml`、`~/.codex/auth.json` 及备份文件权限限制为当前用户可读写；不要把它们提交到仓库。', '优先通过环境变量提供密钥；终端历史、截图、问题反馈和日志中不得出现完整 API 密钥。', '第三方工具可能读取或改写 Codex 配置，安装前检查其当前官方仓库、发行说明和权限范围。', '验证失败时先关闭 Codex，恢复 `.partokens.bak` 备份，重新打开终端和 Codex，再确认原 provider 已恢复。'] },
          { type: 'callout', tone: 'warning', title: '第三方工具边界', body: 'Codex++ 与 CC Switch 都是独立开源项目。其版本、下载、升级和兼容性由各自项目维护；Partokens 不对第三方工具作官方维护承诺。' },
        ],
      },
    ],
  },
  'api-basics': {
    id: 'api-basics',
    summary: '所有示例都从统一 Base URL 发起 HTTPS JSON 请求，并使用 Bearer API 密钥和账户当前可用的模型名。',
    prerequisites: ['已创建的 Partokens API 密钥', '一个账户当前可用的模型名称'],
    sections: [
      {
        id: 'base-url',
        title: 'Base URL 与路径',
        blocks: [
          { type: 'paragraph', text: '将 OpenAI 客户端的基础地址替换为 Partokens 入口。具体资源路径由 SDK 方法或你的 HTTP 请求追加。' },
          { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          { type: 'callout', tone: 'info', title: '避免重复 `/v1`', body: 'SDK 的 `baseURL` 或 `base_url` 已包含 `/v1` 时，不要在同一配置中再次追加。' },
        ],
      },
      {
        id: 'request-conventions',
        title: '请求约定',
        blocks: [
          { type: 'table', columns: ['部分', '用法'], rows: [
            ['协议', '使用 HTTPS'],
            ['鉴权', '`Authorization: Bearer <API_KEY>`'],
            ['请求体', '需要正文的接口使用 JSON'],
            ['Content-Type', '`application/json`'],
            ['模型名', '使用账户当前展示的可用模型名'],
          ] },
          { type: 'callout', tone: 'warning', title: '参数支持取决于模型', body: '不要仅根据其他 OpenAI 兼容服务推断某个高级参数一定可用。完整参数兼容矩阵仍待补充。' },
        ],
      },
      {
        id: 'minimal-request',
        title: '最小请求',
        blocks: [
          { type: 'paragraph', text: '下面的请求只使用聊天补全所需的核心字段，适合作为连通性检查。' },
          { type: 'code-samples', samples: firstRequestSamples },
        ],
      },
      {
        id: 'responses-and-failures',
        title: '响应与失败处理',
        blocks: [
          { type: 'list', items: ['先记录 HTTP 状态、`X-Oneapi-Request-Id` 响应头和脱敏后的响应正文。', '同时保留请求时间、目标模型和调用端环境，便于在使用记录中核对。', '只对可安全重放的请求执行自动重试；遇到 429 时优先遵循 `Retry-After`，其他可重试失败使用带抖动的指数退避。'] },
          { type: 'callout', tone: 'info', title: '查看完整排查说明', body: '“连接、限额与重试”列出了统一 relay 错误结构、常见 HTTP 状态、最小诊断请求和重试边界。' },
        ],
      },
    ],
  },
  'chat-completions': {
    id: 'chat-completions',
    summary: '使用 `POST /chat/completions` 发送由角色和内容组成的消息列表，并通过 OpenAI 兼容 SDK 读取生成结果。',
    prerequisites: ['已配置 Partokens API 密钥', '一个支持聊天补全的可用模型名称'],
    sections: [
      {
        id: 'endpoint',
        title: '请求端点',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          { type: 'paragraph', text: '使用 SDK 时，把 Base URL 配置为 `https://partokens.com/v1`，然后调用客户端提供的聊天补全方法。' },
        ],
      },
      {
        id: 'request-body',
        title: '核心请求字段',
        blocks: [
          { type: 'table', columns: ['字段', '说明'], rows: [
            ['`model`', '账户当前可用、且支持聊天补全的模型名'],
            ['`messages`', '按顺序提供给模型的消息数组'],
            ['`messages[].role`', '示例使用 `system` 和 `user`'],
            ['`messages[].content`', '该条消息的文本内容'],
          ] },
          { type: 'callout', tone: 'info', title: '从核心字段开始', body: '先用 `model` 和 `messages` 完成连通性验证，再按目标模型的实际支持情况增加其他参数。' },
        ],
      },
      {
        id: 'examples',
        title: '完整示例',
        blocks: [
          { type: 'code-samples', samples: chatSamples },
          { type: 'callout', tone: 'success', title: '读取第一条结果', body: '示例使用 OpenAI SDK 的兼容对象读取 `choices[0].message.content`。应用代码仍应处理结果为空或请求失败的情况。' },
        ],
      },
      {
        id: 'streaming',
        title: '流式响应与高级参数',
        blocks: [
          { type: 'paragraph', text: '不同模型可能支持不同的上下文长度、采样参数、工具调用或多模态输入。' },
          { type: 'callout', tone: 'warning', title: '待后端确认', body: '流式响应的可用范围、分块格式以及各高级参数的兼容情况尚待确认，因此本页暂不提供固定示例。' },
        ],
      },
    ],
  },
  'image-api': {
    id: 'image-api',
    summary: '通过 OpenAI 兼容的图像生成端点提交提示词，并安全处理 URL 或 Base64 图片结果。',
    prerequisites: ['已配置 Partokens API 密钥', '已从账户实时配置确认一个支持图像生成的模型'],
    sections: [
      {
        id: 'endpoint',
        title: '请求端点',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Images Generations', path: 'https://partokens.com/v1/images/generations' },
          { type: 'paragraph', text: '接口采用标准 OpenAI 兼容调用方式。示例中的 `your-image-model` 必须替换为 Partokens 账户当前可用、且支持图像生成的模型名。' },
        ],
      },
      {
        id: 'request-fields',
        title: '请求字段与兼容边界',
        blocks: [
          { type: 'table', columns: ['字段', '说明'], rows: [
            ['`model`', '图像生成模型名；从账户实时模型列表选择'],
            ['`prompt`', '要生成图片的核心文本描述；应提供非空内容'],
            ['其他可选字段', '后端 DTO 可接收 `n`、`size`、`quality`、`response_format`、`style`、`user`、`background`、`output_format`、`stream` 等字段'],
          ] },
          { type: 'callout', tone: 'warning', title: '参数兼容范围待后端确认', body: '可选字段是否生效取决于目标模型、上游协议和适配器。官方接口将 `prompt` 标为必填，但 Partokens 本地解析路径对空值的最终错误行为仍待后端确认。当前没有对尺寸、质量、数量、返回格式或所有可选字段作全局保证；请从非空的 `model` 与 `prompt` 开始，并根据实际响应逐项验证。' },
        ],
      },
      {
        id: 'examples',
        title: 'Shell、JavaScript 与 Python 示例',
        blocks: [
          { type: 'code-samples', samples: imageGenerationSamples },
          { type: 'callout', tone: 'info', title: '保存时不要猜文件格式', body: '示例故意保存为无扩展名的 `image-result`。只有在响应、下载头或实际文件内容确认格式后，再添加正确扩展名。' },
        ],
      },
      {
        id: 'response',
        title: '读取响应结果',
        blocks: [
          { type: 'paragraph', text: '成功响应包含 `created` 和 `data`。每个图片条目可能提供 `url`、`b64_json` 或 `revised_prompt` 中的一部分，不应假设这些字段会同时出现。部分上游还可能返回用量字段。' },
          { type: 'code-samples', samples: [{ language: 'javascript', label: '响应结构示意', code: `{
  "created": 0,
  "data": [
    {
      "url": "https://...",
      "b64_json": "...",
      "revised_prompt": "..."
    }
  ]
}` }] },
          { type: 'list', items: ['先确认 `data` 非空，再读取第一项。', '存在 `url` 时检查下载 HTTP 状态，并处理重定向。', '不存在 URL 但存在 `b64_json` 时，执行严格的 Base64 解码并以二进制写入。', '两种结果都不存在时视为不可用响应，保留脱敏后的正文和请求标识用于排查。'] },
        ],
      },
      {
        id: 'download-boundary',
        title: '下载、临时保存与错误边界',
        blocks: [
          { type: 'paragraph', text: 'URL 的有效期尚未由 Partokens 确认。应用应在收到结果后尽快下载到自己控制的临时目录或对象存储，并自行设置访问控制、清理周期和容量限制。' },
          { type: 'list', items: ['API 请求成功不等于图片下载一定成功；下载阶段仍需处理 3xx、4xx、5xx、超时和内容为空。', 'Base64 结果会增加 JSON 大小和内存占用；避免在日志中输出整段图片数据。', '生成请求超时后，上游可能已经执行并计费；在没有幂等保证时不要盲目重试。', '内容限制、URL 有效期和持久化责任的精确规则仍待产品或后端确认。'] },
        ],
      },
    ],
  },
  faq: {
    id: 'faq',
    summary: '集中回答接入过程中最常见的问题；涉及模型、价格、限额和错误结构时，始终区分已确认信息与待补充信息。',
    sections: [
      {
        id: 'integration',
        title: '接入与兼容性',
        blocks: [
          { type: 'faq', items: [
            { question: '可以继续使用 OpenAI SDK 吗？', answer: '可以。创建 OpenAI 客户端时，把 API 密钥替换为 Partokens 密钥，并把 Base URL 设置为 `https://partokens.com/v1`。' },
            { question: '应该填写哪个模型名？', answer: '使用账户当前展示的可用模型名。文档不维护一份可能过期的固定模型清单。' },
            { question: '为什么示例只使用少量参数？', answer: '最小示例更适合验证鉴权、路由和模型名。高级参数的支持范围取决于目标模型，完整兼容矩阵待补充。' },
          ] },
        ],
      },
      {
        id: 'keys-and-accounts',
        title: '密钥与账户',
        blocks: [
          { type: 'faq', items: [
            { question: 'API 密钥放在哪里？', answer: '服务端应用应优先使用环境变量或专用密钥管理系统。不要把长期密钥嵌入浏览器前端、公开仓库或日志。' },
            { question: '价格、余额和套餐额度以哪里为准？', answer: '以账户实时配置、服务端结算和使用记录为准。余额、套餐与额度文档说明了已确认的消耗偏好和有效期；具体价格不在文档中写死。' },
            { question: '如何轮换或撤销密钥？', answer: '请使用控制台当前提供的密钥管理操作。撤销生效时间、数量限制和自动轮换能力尚待确认。' },
          ] },
        ],
      },
      {
        id: 'failures-and-data',
        title: '失败排查与数据边界',
        blocks: [
          { type: 'faq', items: [
            { question: '请求失败时应该先提供什么？', answer: '保留请求时间、模型、HTTP 状态、`X-Oneapi-Request-Id` 和脱敏后的响应正文。不要发送完整 API 密钥。' },
            { question: '可以对所有失败请求直接重试吗？', answer: '不可以。401、权限或额度相关的 403、参数 400 应在修正后再请求；429 优先遵循 `Retry-After`。生成请求超时后可能已经执行，不能盲目重放。' },
            { question: 'API 请求的数据如何保存？', answer: 'API 请求需要发送到服务端才能完成模型调用。具体日志、提供商处理和数据保留规则尚待产品或后端确认。' },
          ] },
          { type: 'callout', tone: 'info', title: '没有找到答案？', body: '联系支持时请避免发送完整 API 密钥，并附上可用于定位问题的时间、模型和响应信息。' },
        ],
      },
    ],
  },
  troubleshooting: {
    id: 'troubleshooting',
    summary: '从最小诊断请求开始，按网络、鉴权、模型、参数、额度、限额和服务端层级定位失败，并决定是否可以安全重试。',
    prerequisites: ['已创建 Partokens API 密钥', '可以查看客户端收到的 HTTP 状态、响应头和响应正文'],
    sections: [
      {
        id: 'minimal-diagnostic',
        title: '先运行最小诊断请求',
        blocks: [
          { type: 'paragraph', text: '`GET /v1/models` 不会发起生成任务，适合先验证 DNS、TLS、Base URL 和鉴权。`--include` 会同时显示响应头，便于保留请求标识和限额信息。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '最小诊断请求', code: `curl --silent --show-error --include \\
  https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY"` }] },
          { type: 'steps', items: [
            { title: '确认连接层', body: '检查域名是否为 `partokens.com`、Base URL 是否只包含一次 `/v1`，并记录 DNS、TLS、代理或连接超时信息。' },
            { title: '确认鉴权层', body: '检查请求是否携带 Bearer 密钥，密钥前后没有空格或引号，并在控制台确认该密钥仍可用。' },
            { title: '确认模型与参数', body: '从模型列表选择账户当前可用模型，先移除非必要参数，再用最小请求复现。' },
            { title: '确认账户与限额', body: '核对余额、有效套餐、计费偏好和使用记录，同时查看 429 是否带有 `Retry-After`。' },
            { title: '保留可关联证据', body: '记录请求时间、模型、HTTP 状态、请求 ID 以及脱敏后的响应内容，再联系正式支持渠道。' },
          ] },
        ],
      },
      {
        id: 'error-shape',
        title: '错误 JSON 与请求标识',
        blocks: [
          { type: 'paragraph', text: 'Partokens 后端在 relay 层生成的错误使用 OpenAI 风格的 `error` 对象。`message` 末尾会附加 `(request id: ...)`，响应头同时使用 `X-Oneapi-Request-Id`。' },
          { type: 'code-samples', samples: [{ language: 'javascript', label: '统一 relay 错误结构', code: `{
  "error": {
    "message": "错误说明 (request id: ...)",
    "type": "new_api_error",
    "param": "",
    "code": "错误代码"
  }
}` }] },
          { type: 'callout', tone: 'warning', title: '同时检查状态、头与正文', body: '并非所有失败都保证有同一正文。部分内存限流或边缘限流可能只返回 429 和空响应体；上游错误也可能携带不同细节。请求 ID 优先从响应头获取，正文可作为补充。' },
        ],
      },
      {
        id: 'failure-map',
        title: '按失败类型定位',
        blocks: [
          { type: 'table', columns: ['类型', '常见信号', '下一步'], rows: [
            ['网络连接', '无 HTTP 状态、DNS/TLS/代理/连接超时', '检查域名、网络、代理和证书；用最小诊断请求复现'],
            ['鉴权', '常见为 401', '检查 Bearer 头和密钥状态；修正前不要重试'],
            ['模型不可用', '常见为 400 或 403', '从账户实时模型列表重新选择，并确认密钥所属分组可访问'],
            ['参数不兼容', '常见为 400', '只保留端点核心字段，再逐项添加可选参数'],
            ['余额或套餐不足', '403，错误代码可为 `insufficient_user_quota`', '充值、购买有效套餐或调整计费偏好后再请求；不支持透支'],
            ['限额', '429，可能带 `Retry-After`', '停止并发放大；存在 `Retry-After` 时按该秒数等待'],
            ['服务端或上游失败', '5xx', '保留请求 ID；仅在请求可安全重放时退避重试'],
          ] },
          { type: 'callout', tone: 'info', title: '状态只是起点', body: '同一状态可能来自不同检查层。最终判断应结合 `error.code`、`error.message`、请求 ID、账户实时状态和使用记录。' },
        ],
      },
      {
        id: 'retry-safety',
        title: '区分可安全重试与不可直接重试',
        blocks: [
          { type: 'table', columns: ['请求或失败', '重试建议'], rows: [
            ['`GET /v1/models` 的短暂网络失败或 5xx', '可安全重试'],
            ['连接建立失败且请求正文尚未发送', '通常可重试；客户端仍应确认实际发送状态'],
            ['429', '有 `Retry-After` 时遵循它；没有时使用带抖动的指数退避'],
            ['部分 5xx', '仅在请求本身可安全重放时使用带抖动的指数退避'],
            ['401、权限或额度相关 403、参数 400', '不可直接重试；先修正凭据、权限、额度、模型或参数'],
            ['聊天或图像生成超时', '不可盲目重试；上游可能已经执行并产生用量'],
          ] },
          { type: 'paragraph', text: 'Partokens 当前没有确认统一的最大重试次数或固定等待秒数，因此本文不写死次数。自动重试应设置总时限、并发上限和取消机制，并在每次失败后增加等待时间与随机抖动。' },
        ],
      },
      {
        id: 'contact-support',
        title: '联系支持前准备',
        blocks: [
          { type: 'list', items: ['请求发生的准确时间与时区', '使用的模型名和 API 路径', 'HTTP 状态与 `X-Oneapi-Request-Id`', '移除密钥、个人信息、完整提示词和大段 Base64 后的响应内容', '是否发生扣费、是否在使用记录中看到对应请求'] },
          { type: 'callout', tone: 'warning', title: '绝不发送完整 API 密钥', body: '正式支持渠道为 `support@partokens.com` 和 Telegram 支持机器人。支持人员定位问题不需要你的完整 API 密钥；如怀疑泄露，应立即在控制台撤销或替换密钥。' },
        ],
      },
    ],
  },
}

export function getDocsDocument(id: DocsItemId) {
  return zhCnDocsDocuments[id]
}

export function getDocsSearchText(id: DocsItemId) {
  const document = zhCnDocsDocuments[id]
  if (!document) return ''
  return [
    document.summary,
    ...(document.prerequisites ?? []),
    ...document.sections.flatMap((section) => [
      section.title,
      ...section.blocks.flatMap((block) => {
        if (block.type === 'paragraph') return [block.text]
        if (block.type === 'list') return block.items
        if (block.type === 'steps') return block.items.flatMap((item) => [item.title, item.body])
        if (block.type === 'callout') return [block.title, block.body]
        if (block.type === 'endpoint') return [block.label, block.path]
        if (block.type === 'table') return [...block.columns, ...block.rows.flat()]
        if (block.type === 'faq') return block.items.flatMap((item) => [item.question, item.answer])
        return block.samples.flatMap((sample) => [sample.label, sample.code])
      }),
    ]),
  ].join(' ')
}
