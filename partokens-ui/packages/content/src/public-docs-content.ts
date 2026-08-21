import type { AppLocale } from '@partokens/i18n'
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
  | { type: 'links'; items: Array<{ label: string; href: string }> }
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
    code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"

curl --fail-with-body https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<YOUR_MODEL_ID>",
    "messages": [
      {"role": "user", "content": "用一句话介绍 Partokens"}
    ]
  }'`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" node example.mjs
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const response = await client.chat.completions.create({
  model: "<YOUR_MODEL_ID>",
  messages: [
    { role: "user", content: "用一句话介绍 Partokens" },
  ],
});

const text = response.choices[0]?.message?.content;
if (!text) throw new Error("响应中没有聊天文本");
console.log(text);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" python example.py
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

response = client.chat.completions.create(
    model="<YOUR_MODEL_ID>",
    messages=[
        {"role": "user", "content": "用一句话介绍 Partokens"},
    ],
)

text = response.choices[0].message.content
if not text:
    raise RuntimeError("响应中没有聊天文本")
print(text)`,
  },
]

const firstRequestSamplesEn: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"

curl --fail-with-body https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<YOUR_MODEL_ID>",
    "messages": [
      {"role": "user", "content": "Introduce Partokens in one sentence."}
    ]
  }'`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" node example.mjs
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const response = await client.chat.completions.create({
  model: "<YOUR_MODEL_ID>",
  messages: [
    { role: "user", content: "Introduce Partokens in one sentence." },
  ],
});

const text = response.choices[0]?.message?.content;
if (!text) throw new Error("The response contains no chat text");
console.log(text);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" python example.py
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

response = client.chat.completions.create(
    model="<YOUR_MODEL_ID>",
    messages=[
        {"role": "user", "content": "Introduce Partokens in one sentence."},
    ],
)

text = response.choices[0].message.content
if not text:
    raise RuntimeError("The response contains no chat text")
print(text)`,
  },
]

const chatSamples = firstRequestSamples
const chatSamplesEn = firstRequestSamplesEn

const imageGenerationSamples: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
set -euo pipefail

response="$(curl --silent --show-error --fail-with-body \\
  https://partokens.com/v1/images/generations \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<YOUR_MODEL_ID>",
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
    code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" node example.mjs
import { writeFile } from "node:fs/promises";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const result = await client.images.generate({
  model: "<YOUR_MODEL_ID>",
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
    code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" python example.py
import base64
import os
from urllib.request import urlopen
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

result = client.images.generate(
    model="<YOUR_MODEL_ID>",
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

const imageGenerationSamplesEn: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL',
    code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
set -euo pipefail

response="$(curl --silent --show-error --fail-with-body \\
  https://partokens.com/v1/images/generations \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<YOUR_MODEL_ID>",
    "prompt": "A glass paperweight on a white table in soft natural light"
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
    code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" node example.mjs
import { writeFile } from "node:fs/promises";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const result = await client.images.generate({
  model: "<YOUR_MODEL_ID>",
  prompt: "A glass paperweight on a white table in soft natural light",
});

const image = result.data?.[0];
if (!image) throw new Error("The response contains no image result");

if (image.url) {
  const download = await fetch(image.url);
  if (!download.ok) throw new Error("Download failed: " + download.status);
  await writeFile("image-result", Buffer.from(await download.arrayBuffer()));
} else if (image.b64_json) {
  await writeFile("image-result", Buffer.from(image.b64_json, "base64"));
} else {
  throw new Error("The response contains neither url nor b64_json");
}`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" python example.py
import base64
import os
from urllib.request import urlopen
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

result = client.images.generate(
    model="<YOUR_MODEL_ID>",
    prompt="A glass paperweight on a white table in soft natural light",
)

if not result.data:
    raise RuntimeError("The response contains no image result")

image = result.data[0]
if image.url:
    with urlopen(image.url) as download:
        content = download.read()
elif image.b64_json:
    content = base64.b64decode(image.b64_json, validate=True)
else:
    raise RuntimeError("The response contains neither url nor b64_json")

with open("image-result", "wb") as output:
    output.write(content)`,
  },
]

const sdkJavaScriptSample: DocsCodeSample = {
  language: 'javascript',
  label: 'JavaScript / Node.js',
  code: `import OpenAI from "openai";

const apiKey = process.env.PARTOKENS_API_KEY;
const model = process.env.PARTOKENS_MODEL;
if (!apiKey || !model) {
  throw new Error("请设置 PARTOKENS_API_KEY 和 PARTOKENS_MODEL");
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://partokens.com/v1",
});

try {
  const models = await client.models.list();
  const modelIds = models.data.map((item) => item.id).filter(Boolean);
  if (modelIds.length === 0) {
    throw new Error("账户当前没有返回可用模型");
  }
  if (!modelIds.includes(model)) {
    throw new Error("PARTOKENS_MODEL 不在当前模型列表中");
  }

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: "只回复：连接成功" }],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("响应中没有聊天文本");
  console.log(text);
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    const requestId =
      error.headers?.get("x-oneapi-request-id") ?? "未返回";
    console.error(
      "Partokens 请求失败，HTTP " +
        (error.status ?? "未知") +
        "，请求 ID " +
        requestId +
        "：" +
        error.message,
    );
  } else {
    console.error(error instanceof Error ? error.message : "未知错误");
  }
  process.exitCode = 1;
}`,
}

const sdkPythonSample: DocsCodeSample = {
  language: 'python',
  label: 'Python',
  code: `import os
import sys

from openai import APIConnectionError, APIStatusError, OpenAI

api_key = os.environ.get("PARTOKENS_API_KEY")
model = os.environ.get("PARTOKENS_MODEL")
if not api_key or not model:
    raise RuntimeError("请设置 PARTOKENS_API_KEY 和 PARTOKENS_MODEL")

client = OpenAI(
    api_key=api_key,
    base_url="https://partokens.com/v1",
)

try:
    models = client.models.list()
    model_ids = [item.id for item in models.data if item.id]
    if not model_ids:
        raise RuntimeError("账户当前没有返回可用模型")
    if model not in model_ids:
        raise RuntimeError("PARTOKENS_MODEL 不在当前模型列表中")

    completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "只回复：连接成功"}],
    )
    text = completion.choices[0].message.content
    if not text:
        raise RuntimeError("响应中没有聊天文本")
    print(text)
except APIStatusError as error:
    request_id = error.response.headers.get("X-Oneapi-Request-Id", "未返回")
    print(
        f"Partokens 请求失败，HTTP {error.status_code}，"
        f"请求 ID {request_id}：{error}",
        file=sys.stderr,
    )
    raise SystemExit(1) from error
except APIConnectionError as error:
    print(f"无法连接 Partokens：{error}", file=sys.stderr)
    raise SystemExit(1) from error
except RuntimeError as error:
    print(str(error), file=sys.stderr)
    raise SystemExit(1) from error`,
}

const modelsApiSamples: DocsCodeSample[] = [
  {
    language: 'shell',
    label: 'Shell / cURL + jq',
    code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
set -o pipefail

curl --silent --show-error --fail-with-body \\
  https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  | jq -er '.data[].id'`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" node example.mjs
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});

const result = await client.models.list();
for (const model of result.data) console.log(model.id);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" python example.py
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)

result = client.models.list()
for model in result.data:
    print(model.id)`,
  },
]

const modelsApiSamplesEn = modelsApiSamples

export const completedDocsOrder: DocsItemId[] = [
  'welcome',
  'overview',
  'first-request',
  'clients',
  'api-keys',
  'billing',
  'models-pricing',
  'codex',
  'sdk',
  'image-studio',
  'api-basics',
  'models-api',
  'chat-completions',
  'image-api',
  'faq',
  'troubleshooting',
  'usage-logs',
  'contact-support',
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
          { type: 'callout', tone: 'warning', title: '以实时配置为准', body: '模型、价格、限额与可用性以账户实时配置和服务端实际响应为准。' },
        ],
      },
      {
        id: 'reading-map',
        title: '按目标继续阅读',
        blocks: [
          { type: 'table', columns: ['当前目标', '建议文档'], rows: [
            ['完成最小接入', '“Partokens 是什么” → “API 密钥管理” → “模型与定价” → “快速开始：完成首次接入”'],
            ['配置现有客户端或 SDK', '“支持的客户端总览” → “SDK 配置”或“Codex 与 CLI 配置”'],
            ['使用图像能力', '“生图工作台”用于控制台生成与编辑；“图像生成 API”用于代码接入'],
            ['定位请求与结算', '“连接、限额与重试” → “使用日志”'],
            ['自助排查后提交问题', '“常见问题” → “联系支持”'],
          ] },
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
              ['具体参数支持', '对应 API 文档与目标模型的实际响应；不根据模型名称或其他兼容服务推断'],
            ],
          },
          { type: 'callout', tone: 'warning', title: '按模型能力调用', body: '路由存在不代表每个账户或模型都支持同一组能力。请以账户能力标记和目标模型的实际响应为准。' },
        ],
      },
      {
        id: 'product-surfaces',
        title: '产品入口',
        blocks: [
          { type: 'table', columns: ['入口', '用途'], rows: [
            ['控制台', '管理账户、密钥和模型，使用工作台并查看调用记录'],
            ['OpenAI 兼容 API', '通过应用、SDK 或工具发起模型请求'],
          ] },
          { type: 'paragraph', text: '准备首次调用时继续阅读“快速开始：完成首次接入”；需要选择具体接入工具时查看“支持的客户端总览”。' },
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
        title: '准备环境',
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
        title: '发送聊天补全请求',
        blocks: [
          { type: 'paragraph', text: '将示例中的 `your-model` 替换为账户当前可用的模型名。三种示例调用的是同一个端点。' },
          { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          { type: 'code-samples', samples: firstRequestSamples },
        ],
      },
      {
        id: 'verify',
        title: '验证结果',
        blocks: [
          { type: 'list', items: ['先检查 HTTP 状态，再确认正文中存在可读取的 `choices` 结果；HTTP 返回不等于业务正文一定可用。', 'SDK 示例应能读取 `choices[0].message.content`；应用仍要处理空数组、空内容和异常。', '记录响应头中的 `X-Oneapi-Request-Id`，并保留准确请求时间、时区和模型 ID。', '在“使用日志”中按时间、模型和请求 ID 核对是否形成记录、输入输出用量与最终结算额度。'] },
          { type: 'callout', tone: 'success', title: '首次接入链路已验证', body: '当同一组凭据、Base URL 和模型 ID 能返回可读取结果后，再把最小配置接入应用，并逐项增加高级参数。' },
          { type: 'callout', tone: 'warning', title: '不要猜测失败原因', body: '如调用失败，请保留 HTTP 状态、`error.code`、脱敏后的 `error.message`、`X-Oneapi-Request-Id`、准确时间与时区和模型 ID。不要在日志或支持请求中发送完整 API 密钥。' },
        ],
      },
      {
        id: 'reading-map',
        title: '下一步',
        blocks: [
          { type: 'table', columns: ['目标', '对应文档'], rows: [
            ['理解 Base URL、Bearer 头和统一错误处理', '“API 基础”'],
            ['复制更完整的 SDK 初始化与错误处理', '“SDK 配置”'],
            ['核对聊天请求与响应字段', '“聊天补全 API”'],
            ['排查 401、403、429、5xx 或超时', '“连接、限额与重试”'],
            ['核对本次调用的执行、用量和结算', '“使用日志”'],
          ] },
        ],
      },
    ],
  },
  clients: {
    id: 'clients',
    summary: '按命令行与编码代理、官方 SDK、OpenAI 兼容客户端和直接 HTTP 请求四类入口，选择适合当前场景的 Partokens 接入方式。',
    prerequisites: ['已创建 Partokens API 密钥', '准备从账户或 `/v1/models` 实时选择模型'],
    sections: [
      {
        id: 'choose-a-path',
        title: '先按使用场景选择入口',
        blocks: [
          { type: 'table', columns: ['类别', '已核对路径', '适合场景'], rows: [
            ['命令行与编码代理', 'Codex 原生配置、Codex++、CC Switch', '在终端或 Codex 桌面端中执行编码任务'],
            ['官方 SDK', 'OpenAI JavaScript SDK、OpenAI Python SDK', '服务端应用、脚本和已有 OpenAI SDK 项目'],
            ['OpenAI 兼容客户端', '未点名的兼容候选', '现有客户端明确允许自定义 OpenAI Base URL 时评估迁移'],
            ['直接 HTTP 请求', 'Shell / cURL', '连通性诊断、自动化脚本和不需要 SDK 的调用'],
          ] },
          { type: 'callout', tone: 'info', title: '兼容入口不等于完整验证', body: '一个客户端支持自定义 OpenAI Base URL，只能说明具备接入前提；只有在目标版本、目标模型和目标 API 上完成实际请求，才能确认 Partokens 兼容性。无法确认的客户端应标记为“待实际客户端验证”。' },
        ],
      },
      {
        id: 'coding-agents',
        title: '命令行与编码代理',
        blocks: [
          { type: 'table', columns: ['路径', '适用场景', '配置入口', '协议或 API', 'Base URL', '模型与密钥'], rows: [
            ['Codex 原生配置', '直接使用 Codex CLI 或桌面端', '用户级 `~/.codex/config.toml`', 'Responses API', '需要设置 `https://partokens.com/v1`', '模型来自账户或 `/v1/models`，并确认支持 Responses；密钥优先通过 `PARTOKENS_API_KEY` 提供'],
            ['Codex++', '需要为 Codex Desktop 加载本地 tweak', 'Partokens provider 仍在原生 `~/.codex/config.toml` 中配置', '由 Codex 使用 Responses API；Codex++ 本身不是 API provider', '需要，由 Codex 原生配置提供', '模型和密钥与原生 Codex 相同；Partokens 端到端兼容性待实际客户端验证'],
            ['CC Switch', '希望在图形界面管理并切换 Codex provider', 'CC Switch 的 Codex 页面中添加自定义 provider', '为 Codex 选择 Responses 格式', '需要填写 `https://partokens.com/v1`', '模型来自实时列表；密钥在工具的自定义 provider 配置中提供；Partokens 端到端兼容性待实际客户端验证'],
          ] },
          { type: 'callout', tone: 'warning', title: '第三方开源工具', body: 'Codex++（`github.com/b-nnett/codex-plusplus`）和 CC Switch（`github.com/farion1231/cc-switch`）是独立第三方开源项目，不由 Partokens 维护。版本、权限、升级和配置写入行为应以各自当前官方仓库为准。' },
          { type: 'paragraph', text: '完整的原生 provider、Codex++ 职责边界、CC Switch 操作和回滚步骤，请继续阅读“Codex 与 CLI 配置”。' },
        ],
      },
      {
        id: 'official-sdks',
        title: '官方 SDK',
        blocks: [
          { type: 'table', columns: ['路径', '适用场景', '配置入口', '协议或 API', 'Base URL', '模型与密钥'], rows: [
            ['OpenAI JavaScript SDK', 'Node.js 服务、脚本和后端任务', '`new OpenAI({ ... })`', 'Models 与 Chat Completions；Responses 仅在所选模型支持时使用', '通过官方字段 `baseURL` 自定义', '模型来自账户或 `client.models.list()`；密钥通过服务端环境变量传给 `apiKey`'],
            ['OpenAI Python SDK', 'Python 服务、脚本和数据流程', '`OpenAI(...)`', 'Models 与 Chat Completions；Responses 仅在所选模型支持时使用', '通过官方字段 `base_url` 自定义', '模型来自账户或 `client.models.list()`；密钥通过服务端环境变量传给 `api_key`'],
          ] },
          { type: 'paragraph', text: '安装、完整初始化、实时模型列表、最小聊天请求和错误处理集中在“SDK 配置”；通用 Bearer 鉴权与路径规则见“API 基础”。' },
          { type: 'callout', tone: 'warning', title: '只在可信运行环境使用长期密钥', body: '不要把长期 Partokens API 密钥嵌入浏览器前端，也不要为了绕过 SDK 的浏览器保护而默认开启危险配置。浏览器应用应通过你控制的服务端调用 Partokens。' },
        ],
      },
      {
        id: 'compatible-clients',
        title: 'OpenAI 兼容客户端',
        blocks: [
          { type: 'paragraph', text: '本期不列出尚未通过当前官方文档或仓库核对的具体客户端。对于未点名的客户端，只有同时提供自定义 OpenAI Base URL、Bearer API 密钥和模型名入口时，才可作为兼容候选。' },
          { type: 'table', columns: ['检查项', '要求'], rows: [
            ['配置入口', '以该客户端当前官方文档为准；不要猜测 provider 名称或字段'],
            ['协议或 API', '确认客户端实际调用的 API 与目标模型支持的 API 一致'],
            ['Base URL', '必须能够设置为 `https://partokens.com/v1`，且不会重复追加 `/v1`'],
            ['模型名', '必须允许使用账户或 `/v1/models` 返回的模型 ID'],
            ['密钥', '必须能安全提供 Bearer 密钥，且不会写入公开日志或同步到不可信位置'],
            ['验证状态', '在真实版本上完成列出模型和最小请求前，一律标记为“待实际客户端验证”'],
          ] },
        ],
      },
      {
        id: 'direct-http',
        title: '直接 HTTP 请求',
        blocks: [
          { type: 'table', columns: ['路径', '适用场景', '配置入口', '协议或 API', 'Base URL', '模型与密钥'], rows: [
            ['Shell / cURL', '最小连通性检查、CI 脚本和问题复现', '终端命令与环境变量', '直接调用 Models、Chat Completions 或其他已确认路由', '在每个完整 URL 中使用 `https://partokens.com/v1`', '先调用 `/v1/models`；请求头使用 `Authorization: Bearer $PARTOKENS_API_KEY`'],
          ] },
          { type: 'paragraph', text: '完整请求约定见“API 基础”，模型列表的三语言错误处理见“模型列表 API”。遇到 401、403、429、5xx、连接超时或生成超时时，转到“连接、限额与重试”。' },
        ],
      },
      {
        id: 'reading-map',
        title: '从总览继续阅读',
        blocks: [
          { type: 'table', columns: ['接下来要做什么', '对应文档'], rows: [
            ['创建、保存和撤销访问凭据', '“API 密钥管理”'],
            ['选择实时模型并核对价格', '“模型与定价”'],
            ['配置 Codex、Codex++ 或 CC Switch', '“Codex 与 CLI 配置”'],
            ['复制 JavaScript 或 Python 完整示例', '“SDK 配置”'],
            ['确认 Base URL、Bearer 头和 JSON 约定', '“API 基础”'],
            ['实时取得模型 ID', '“模型列表 API”'],
            ['处理连接、限额、超时与重试', '“连接、限额与重试”'],
          ] },
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
          { type: 'callout', tone: 'warning', title: '以当前控制台为准', body: '密钥是否只显示一次、是否支持权限范围或过期时间等行为尚未形成已确认的长期合同。创建时只使用当前界面实际提供的选项，不要依据其他服务推断。' },
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
          { type: 'callout', tone: 'info', title: '安全轮换密钥', body: '先创建并验证替代密钥，再更新应用配置并撤销旧密钥。可创建数量和有效期以控制台当前设置为准。' },
        ],
      },
      {
        id: 'rotate-and-verify',
        title: '替换密钥并验证',
        blocks: [
          { type: 'steps', items: [
            { title: '先创建替代密钥', body: '在当前控制台允许时，为明确的环境或应用创建新密钥，并安全保存。' },
            { title: '更新一个受控环境', body: '只修改目标服务的密钥来源，避免同时改动 Base URL、模型或其他参数。' },
            { title: '运行只读诊断请求', body: '优先使用 `GET /v1/models` 验证鉴权和可见模型；记录 HTTP 状态与 `X-Oneapi-Request-Id`。' },
            { title: '停止旧密钥', body: '确认新密钥可用后，停止所有客户端使用旧密钥，并执行控制台当前提供的撤销或替换操作。' },
            { title: '检查残留调用', body: '在使用日志中按时间和模型核对是否仍有预期之外的请求；日志保留与实时性边界以实际部署为准。' },
          ] },
        ],
      },
      {
        id: 'suspected-exposure',
        title: '怀疑密钥泄露时',
        blocks: [
          { type: 'callout', tone: 'warning', title: '先处置，再联系支持', body: '立即停止使用疑似泄露的密钥，并在控制台撤销或替换。之后按准确时间、时区、模型、请求 ID 和使用日志记录核对异常调用；不要把完整密钥发送给任何支持渠道。' },
          { type: 'table', columns: ['目标', '对应文档'], rows: [
            ['验证新密钥和最小请求', '“快速开始：完成首次接入”与“模型列表 API”'],
            ['核对异常请求和额度变化', '“使用日志”与“模型与定价”'],
            ['准备脱敏材料并提交问题', '“联系支持”'],
          ] },
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
            ['充值', '增加账户余额', '使用控制台提供的渠道，并在提交前确认金额与到账说明'],
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
          { type: 'callout', tone: 'warning', title: '确认当前计费偏好', body: '套餐与余额之间是否回退取决于账户当前设置和可用额度。发送请求前，请在控制台确认计费偏好。' },
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
          { type: 'callout', tone: 'info', title: '以控制台记录为准', body: '充值金额、套餐额度、订单状态和实际扣减以当前账户页面与使用记录为准。' },
        ],
      },
    ],
  },
  'models-pricing': {
    id: 'models-pricing',
    summary: '从账户实时模型配置中选择模型，核对能力、价格和额度来源，并以使用记录中的服务端最终结算为准。',
    prerequisites: ['可以登录 Partokens 控制台的账户', '需要为一次实际调用选择模型'],
    sections: [
      {
        id: 'live-contract',
        title: '模型和价格属于实时账户配置',
        blocks: [
          { type: 'paragraph', text: 'Partokens 不在文档中维护固定模型清单或固定价格表。可见模型、密钥权限、可用路由、支持的 API、价格和额度状态都会随账户与服务端配置变化，应在调用前查看当前账户。' },
          { type: 'callout', tone: 'info', title: '调用前重新确认', body: '模型能力、价格和可用性可能调整。发送请求前，请查看当前账户中的最新信息。' },
        ],
      },
      {
        id: 'concepts',
        title: '六个概念如何关联',
        blocks: [
          { type: 'table', columns: ['概念', '作用', '应当从哪里确认'], rows: [
            ['模型 ID', '作为请求体 `model` 字段的精确字符串', '账户模型界面或 `GET /v1/models`'],
            ['模型能力', '描述模型可能处理的任务和当前标注的 API 类型', '账户当前能力标记、`supported_endpoint_types` 的当前可观察值和实际请求'],
            ['输入与输出用量', '后端使用 `prompt_tokens` 与 `completion_tokens` 记录文本请求的输入、输出计量', '响应 usage 与账户使用记录；二者语义可能随 API 或上游而变化'],
            ['模型价格', '把一次调用或计量用量映射到计费额度', '账户模型价格界面的当前展示'],
            ['账户余额或套餐额度', '决定请求可以从哪个已确认的额度来源结算', '账户或钱包区域以及当前计费偏好'],
            ['最终结算', '服务端在实际用量已知后记录本次请求的最终扣减', '使用记录中的模型、输入输出用量、最终费用或额度与请求 ID'],
          ] },
          { type: 'paragraph', text: '关系可以概括为：请求提交模型 ID 和输入，服务端按实际模型路由取得用量，再结合该账户当前价格与额度来源完成结算，最终结果写入使用记录。模型名称本身不携带这些合同信息。' },
        ],
      },
      {
        id: 'availability-layers',
        title: '区分可见、可调用、API 支持和路由',
        blocks: [
          { type: 'table', columns: ['状态', '它能说明什么', '它不能说明什么'], rows: [
            ['模型可见', '控制台目录当前展示该模型', '不保证你的密钥可调用，也不保证任一 API 可用'],
            ['模型可调用', '模型出现在当前密钥的 `/v1/models` 结果中，并具备调用前提', '不保证此刻一定有健康路由，也不保证所有请求参数可用'],
            ['模型支持某个 API', '账户元数据或实际响应表明该模型支持目标端点类型', '不代表同名模型支持其他 API，也不代表全部高级参数可用'],
            ['模型有可用路由', '某次真实请求在当时成功分配到服务端路由', '不构成未来持续可用或固定价格承诺'],
          ] },
          { type: 'callout', tone: 'warning', title: '不要从名称猜能力', body: '不能仅根据模型名称推断上下文长度、图像能力、工具调用能力、参数支持、价格或可用性。请查看账户中的能力标记，并用最小请求验证。' },
        ],
      },
      {
        id: 'billing-contract',
        title: '已核对的计费与结算字段',
        blocks: [
          { type: 'paragraph', text: 'new-api 当前通用计费层可以按文本输入输出用量和倍率计算，也可以保存按次价格；Partokens 是否为某个模型启用哪一种方式，只能由账户实时价格和实际使用记录确认。本文不把 new-api 的全部通用能力写成 Partokens 已启用功能。' },
          { type: 'table', columns: ['后端字段或概念', '当前含义', 'Partokens 文档边界'], rows: [
            ['`prompt_tokens`', '文本请求的输入用量记录', '控制台使用记录可展示输入用量；具体计量语义以目标 API 和服务端为准'],
            ['`completion_tokens`', '文本请求的输出用量记录', '控制台使用记录可展示输出用量；具体计量语义以目标 API 和服务端为准'],
            ['`model_ratio` / `completion_ratio`', '通用后端可用于输入与输出的计费倍率', '只有账户界面实际展示并启用时才对当前账户有意义；不在文档中给出固定倍率'],
            ['`model_price` / `quota_type`', '通用后端可表达按次价格或按用量模式', 'Partokens 各模型采用的模式待账户实时配置确认'],
            ['`quota`', '使用记录中的服务端最终结算额度', '用于核对单次请求；金额与精度以控制台展示为准'],
            ['`model_name` / `request_id`', '把结算记录关联到模型与请求', '与请求时间、HTTP 响应头一起用于排查和账单核对'],
          ] },
          { type: 'callout', tone: 'info', title: '以最终结算为准', body: '调用前显示的价格用于选择模型，实际扣减以账户使用记录和服务端最终结算为准。' },
        ],
      },
      {
        id: 'selection-workflow',
        title: '在控制台选择模型并核对价格',
        blocks: [
          { type: 'steps', items: [
            { title: '登录并打开模型目录', body: '从 Partokens 控制台或模型入口查看当前账户可见的模型；未登录页面不会给出真实账户价格。' },
            { title: '记录精确模型 ID', body: '复制界面显示的模型 ID，不要根据类似名称手工拼写。也可以用 `/v1/models` 核对当前 API 密钥返回的 ID。' },
            { title: '核对目标 API 与能力标记', body: '确认模型对 Chat Completions、Responses、图像或其他目标 API 的当前支持；标记缺失时先用最小请求验证。' },
            { title: '读取当前价格与计费方式', body: '以账户界面当时展示的输入、输出、按次价格或倍率说明为准；字段缺失时不要自行换算。' },
            { title: '确认余额、套餐与计费偏好', body: '在账户或钱包区域确认可用余额、有效套餐和当前计费来源，避免把模型可见误判为额度充足。' },
            { title: '发送最小请求并核对最终结算', body: '成功调用后在使用记录中按时间、模型和请求 ID 查找该请求，对照输入输出用量、最终费用或额度以及余额或套餐变化。' },
          ] },
          { type: 'callout', tone: 'info', title: '最终以服务端记录为准', body: '调用前价格用于选择和预估，真实扣减以服务端结算与账户使用记录为准。对不上时保留请求 ID，并按“连接、限额与重试”准备诊断信息。' },
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
  sdk: {
    id: 'sdk',
    summary: '使用当前 OpenAI JavaScript 或 Python SDK，把 Base URL 指向 Partokens，实时取得模型列表并发送带错误处理的最小聊天请求。',
    prerequisites: ['Node.js 或 Python 服务端运行环境', '已创建的 Partokens API 密钥', '准备从账户或 `/v1/models` 选择模型'],
    sections: [
      {
        id: 'install-and-environment',
        title: '安装并设置环境变量',
        blocks: [
          { type: 'paragraph', text: '安装当前发布的官方 OpenAI SDK，不固定未经必要验证的版本号。下面使用独立的 Partokens 环境变量，避免覆盖其他 OpenAI 配置。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '安装与环境变量', code: `# JavaScript / Node.js
npm install openai

# Python
python -m pip install openai

# 当前终端会话
export PARTOKENS_API_KEY="replace-with-your-key"
export PARTOKENS_MODEL="your-model"` }] },
          { type: 'callout', tone: 'warning', title: '模型占位符必须替换', body: '`your-model` 不是可调用模型。请从账户或 `GET /v1/models` 实时选择精确模型 ID，并确认它支持准备调用的 API。' },
          { type: 'callout', tone: 'warning', title: '不要把长期密钥放进浏览器', body: '这些示例面向 Node.js、Python 等可信后端环境。不要把长期 API 密钥打包到浏览器前端，也不要为了让 SDK 在浏览器运行而默认启用危险配置。' },
        ],
      },
      {
        id: 'javascript',
        title: 'JavaScript 完整示例',
        blocks: [
          { type: 'paragraph', text: 'OpenAI 官方 JavaScript SDK 的自定义基础地址字段为 `baseURL`。示例先通过 `client.models.list()` 验证实时模型列表，再发送最小 Chat Completions 请求并读取第一条回复。' },
          { type: 'code-samples', samples: [sdkJavaScriptSample] },
          { type: 'callout', tone: 'info', title: '错误中保留请求 ID', body: 'SDK 的 `APIError` 提供 HTTP 状态和响应头。Partokens 请求 ID 位于 `X-Oneapi-Request-Id`，提交支持请求时应保留它，但不要记录 API 密钥。' },
        ],
      },
      {
        id: 'python',
        title: 'Python 完整示例',
        blocks: [
          { type: 'paragraph', text: 'OpenAI 官方 Python SDK 的自定义基础地址字段为 `base_url`。示例分别处理 HTTP 状态错误、连接错误和本地校验错误。' },
          { type: 'code-samples', samples: [sdkPythonSample] },
          { type: 'callout', tone: 'info', title: '读取原始 Partokens 请求 ID', body: 'Python SDK 的 `APIStatusError` 可访问原始响应。示例从响应头读取 `X-Oneapi-Request-Id`；不依赖只为 OpenAI 官方服务生成的请求 ID 字段。' },
        ],
      },
      {
        id: 'api-choice',
        title: '选择 Chat Completions 或 Responses',
        blocks: [
          { type: 'paragraph', text: '本地 new-api 当前同时注册了 `POST /v1/chat/completions` 和 `POST /v1/responses`，但路由存在不代表每个账户模型同时支持两个 API。' },
          { type: 'table', columns: ['SDK 方法', 'Partokens 路径', '选择边界'], rows: [
            ['`client.models.list()`', '`GET /v1/models`', '取得当前密钥可见的模型 ID 和当前可观察元数据'],
            ['`client.chat.completions.create(...)`', '`POST /v1/chat/completions`', '适合已有消息列表集成；必须选择支持 Chat Completions 的模型'],
            ['`client.responses.create(...)`', '`POST /v1/responses`', '适合需要 Responses 请求形态的集成；必须选择支持 Responses 的模型'],
          ] },
          { type: 'callout', tone: 'warning', title: '不要自动在两个 API 之间切换', body: '若某模型在一个 API 上失败，不要把请求无条件改发到另一个 API。输入结构、响应结构、能力与计费可能不同，应先查看账户能力标记并执行目标 API 的最小验证。' },
        ],
      },
      {
        id: 'retries-and-timeouts',
        title: '重试、超时与排查边界',
        blocks: [
          { type: 'paragraph', text: 'OpenAI 官方 SDK 当前文档说明客户端自带自动重试与请求超时行为。JavaScript 以 `github.com/openai/openai-node#retries` 和 `#timeouts` 为准；Python 以 `github.com/openai/openai-python#retries` 和 `#timeouts` 为准。默认值可能随 SDK 版本变化，本文不固定次数或时长。' },
          { type: 'list', items: ['列出模型是只读请求，短暂网络失败或 5xx 可以在有总时限的前提下重试。', '聊天、Responses 或图像生成在客户端超时时，服务端或上游可能已经收到并执行请求，甚至已经产生用量。', '不要对生成请求执行无条件重试；先使用请求时间、模型、请求 ID 和使用记录确认是否已经执行。', '401、权限或额度相关 403、参数 400 应先修正配置；429 优先遵循服务端返回的 `Retry-After`。'] },
          { type: 'callout', tone: 'info', title: '配置失败时继续排查', body: '遇到 Base URL、密钥、模型、限额、超时或 5xx 问题，请使用“连接、限额与重试”中的最小诊断请求和状态处理表。' },
        ],
      },
    ],
  },
  'image-studio': {
    id: 'image-studio',
    summary: '在控制台生成或编辑图像，并管理项目、参考图与生成结果。',
    sections: [
      {
        id: 'start',
        title: '开始生成',
        blocks: [
          { type: 'steps', items: [
            { title: '打开生图工作台', body: '进入控制台，在工作区中选择“生图工作台”。' },
            { title: '选择模型与密钥', body: '选择支持图像能力的模型和 Image 分组 API 密钥；也可以为所选模型创建专用密钥。' },
            { title: '填写生成内容', body: '输入提示词，并按需要设置质量、尺寸、背景和生成数量。' },
          ] },
          { type: 'callout', tone: 'info', title: '参数取决于模型', body: '工作台会根据所选模型提供可用选项。不同模型支持的尺寸、质量和背景设置可能不同。' },
        ],
      },
      {
        id: 'reference',
        title: '使用参考图',
        blocks: [
          { type: 'paragraph', text: '上传 PNG、JPG 或 WebP 图片后，工作台会根据提示词编辑参考图。未上传参考图时，将直接根据提示词生成新图像；生成结果也可以继续作为参考图。' },
        ],
      },
      {
        id: 'results',
        title: '查看与保存结果',
        blocks: [
          { type: 'list', items: ['点击结果上的下载操作，将图片保存到本地。', '新任务会替换画布中正在显示的结果，重要图片应及时下载。', '项目、参考图和最近生成记录保存在当前浏览器中，不会自动同步到其他设备。'] },
        ],
      },
      {
        id: 'security',
        title: '密钥与异常处理',
        blocks: [
          { type: 'paragraph', text: '完整 API 密钥只用于当前工作台会话，不会随项目保存。不要在提示词或参考图中提交不必要的敏感信息。' },
          { type: 'callout', tone: 'warning', title: '取消后先核对使用记录', body: '取消或超时会停止当前浏览器请求，但上游任务可能已经执行。再次生成前，请先在使用日志中核对本次请求。' },
        ],
      },
    ],
  },
  'api-basics': {
    id: 'api-basics',
    summary: '使用 Partokens Base URL 和 Bearer API 密钥发送 HTTPS 请求，并按 HTTP 状态和响应正文处理结果。',
    prerequisites: ['已创建 Partokens API 密钥', '已从模型列表复制要调用的模型 ID'],
    sections: [
      {
        id: 'send-request',
        title: '发送请求',
        blocks: [
          { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          { type: 'list', items: ['在请求头中发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。', '带 JSON 正文的请求同时发送 `Content-Type: application/json`。', '不要把 API 密钥写入 URL、客户端代码或日志。'] },
        ],
      },
      {
        id: 'run-request',
        title: '运行最小请求',
        blocks: [
          { type: 'list', items: ['`model`：填写模型列表返回的精确模型 ID。', '`messages`：填写按顺序发送给模型的消息数组。', '`messages[].role`：最小文本请求使用 `user`。', '`messages[].content`：填写非空文本。'] },
          { type: 'code-samples', samples: firstRequestSamples },
        ],
      },
      {
        id: 'read-response',
        title: '读取响应',
        blocks: [
          { type: 'list', items: ['先检查 HTTP 状态；2xx 表示 HTTP 请求成功。', '解析 JSON 后，按对应接口读取结果字段，例如聊天的 `choices`、图像的 `data` 或模型列表的 `data`。', '非 2xx 响应读取 `error.message`，并在返回时同时记录 `error.code`。'] },
        ],
      },
      {
        id: 'handle-errors',
        title: '处理错误',
        blocks: [
          { type: 'list', items: ['400：修正 JSON 或请求字段后再发送。', '401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。', '429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。', '5xx：在有限次数和总时限内使用指数退避重试。', '网络错误或超时：先确认是否收到 HTTP 响应，再决定是否重试。'] },
          { type: 'callout', tone: 'warning', title: '安全重试', body: 'GET 请求可以在总时限内重试；聊天和图像 POST 只有在应用可以接受重复结果和重复用量时才自动重试。' },
        ],
      },
    ],
  },
  'models-api': {
    id: 'models-api',
    summary: '读取当前 API 密钥可用的模型列表，并把返回的模型 ID 原样用于其他 API 请求。',
    prerequisites: ['已创建 Partokens API 密钥', 'Shell 示例需要 cURL 和 jq；JavaScript 与 Python 示例需要 OpenAI SDK'],
    sections: [
      {
        id: 'send-request',
        title: '发送请求',
        blocks: [
          { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          { type: 'list', items: ['发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。', '该 GET 请求不需要请求正文。'] },
        ],
      },
      {
        id: 'run-request',
        title: '运行最小请求',
        blocks: [
          { type: 'code-samples', samples: modelsApiSamples },
        ],
      },
      {
        id: 'read-response',
        title: '读取响应',
        blocks: [
          { type: 'list', items: ['`object`：值为 `list` 时表示模型列表。', '`data`：模型对象数组；空数组表示该密钥当前没有可用模型。', '`data[].id`：复制精确值，并写入其他请求的 `model` 字段。'] },
          { type: 'paragraph', text: '不要改写模型 ID 的大小写，也不要添加或删除前缀。' },
        ],
      },
      {
        id: 'handle-errors',
        title: '处理错误',
        blocks: [
          { type: 'list', items: ['401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。', '429：等待 `Retry-After` 指定的时间，或使用带随机抖动的指数退避。', '5xx、网络错误或超时：在有限次数和总时限内重试。', '2xx + 空 `data`：检查 API 密钥可访问的模型，不要猜测模型 ID。'] },
          { type: 'paragraph', text: '模型列表是 GET 请求，可以在总时限内安全重试；每次重试都应设置超时并限制次数。' },
        ],
      },
    ],
  },
  'chat-completions': {
    id: 'chat-completions',
    summary: '发送消息数组生成聊天回复，并从 `choices[0].message.content` 读取文本结果。',
    prerequisites: ['已创建 Partokens API 密钥', '已从模型列表复制支持聊天补全的模型 ID', 'JavaScript 与 Python 示例需要 OpenAI SDK'],
    sections: [
      {
        id: 'send-request',
        title: '发送请求',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          { type: 'list', items: ['发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。', '发送 `Content-Type: application/json` 请求头。', '使用 SDK 时将 Base URL 设置为 `https://partokens.com/v1`。'] },
        ],
      },
      {
        id: 'fill-request',
        title: '填写请求',
        blocks: [
          { type: 'list', items: ['`model`：填写模型列表返回的精确模型 ID。', '`messages`：填写按顺序发送给模型的消息数组。', '`messages[].role`：最小文本请求使用 `user`。', '`messages[].content`：填写该条消息的非空文本。'] },
          { type: 'code-samples', samples: chatSamples },
        ],
      },
      {
        id: 'read-response',
        title: '读取响应',
        blocks: [
          { type: 'list', items: ['`choices[0].message.content`：读取第一条候选的文本回复。', '`choices[0].finish_reason`：读取该候选的结束原因。', '`usage`：响应返回时可读取输入、输出和总 Token 数。'] },
          { type: 'paragraph', text: '如果 `choices` 为空或第一条结果没有文本，应将该响应视为没有可用聊天结果。' },
        ],
      },
      {
        id: 'handle-errors',
        title: '处理错误',
        blocks: [
          { type: 'list', items: ['400：根据 `error.message` 修正 `model`、`messages` 或消息字段。', '401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。', '429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。', '5xx：在有限次数和总时限内使用指数退避重试。', '网络错误或超时：请求可能已经执行；不要立即重复发送。'] },
          { type: 'callout', tone: 'warning', title: '避免重复生成', body: '只有在应用可以接受重复回复和重复用量，并且已设置超时和最大尝试次数时，才自动重试聊天请求。' },
        ],
      },
    ],
  },
  'image-api': {
    id: 'image-api',
    summary: '发送提示词生成图像，并从 `data[0].url` 或 `data[0].b64_json` 保存结果。',
    prerequisites: ['已创建 Partokens API 密钥', '已从模型列表复制支持图像生成的模型 ID', 'Shell 示例需要 cURL、jq 和 OpenSSL；JavaScript 与 Python 示例需要 OpenAI SDK'],
    sections: [
      {
        id: 'send-request',
        title: '发送请求',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Image Generations', path: 'https://partokens.com/v1/images/generations' },
          { type: 'list', items: ['发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。', '发送 `Content-Type: application/json` 请求头。', '使用 SDK 时将 Base URL 设置为 `https://partokens.com/v1`。'] },
        ],
      },
      {
        id: 'fill-request',
        title: '填写请求',
        blocks: [
          { type: 'list', items: ['`model`：填写模型列表返回的精确图像模型 ID。', '`prompt`：填写要生成图像的非空文本描述。'] },
          { type: 'code-samples', samples: imageGenerationSamples },
        ],
      },
      {
        id: 'read-response',
        title: '读取响应',
        blocks: [
          { type: 'list', items: ['先确认 `data` 数组不为空。', '存在 `data[0].url` 时下载该 URL，并检查下载请求的 HTTP 状态。', '不存在 URL 但存在 `data[0].b64_json` 时，将 Base64 解码为二进制文件。', '两种字段都不存在时，将响应视为没有可用图像结果。'] },
          { type: 'paragraph', text: '不要把完整 Base64 图片数据写入应用日志。' },
        ],
      },
      {
        id: 'handle-errors',
        title: '处理错误',
        blocks: [
          { type: 'list', items: ['400：根据 `error.message` 修正 `model` 或 `prompt`。', '401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。', '429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。', '5xx：在有限次数和总时限内使用指数退避重试。', '网络错误或超时：请求可能已经执行；不要立即重复生成。', '图片下载失败：单独重试下载；不要重新发送生成请求。'] },
          { type: 'callout', tone: 'warning', title: '避免重复生成', body: '只有在应用可以接受重复图片和重复用量，并且已设置超时和最大尝试次数时，才自动重试图像生成请求。' },
        ],
      },
    ],
  },
  faq: {
    id: 'faq',
    summary: '集中回答接入过程中最常见的问题，并指出模型、价格、限额、日志和数据边界应当以哪些实时依据为准。',
    sections: [
      {
        id: 'integration',
        title: '接入与兼容性',
        blocks: [
          { type: 'faq', items: [
            { question: '可以继续使用 OpenAI SDK 吗？', answer: '可以。创建 OpenAI 客户端时，把 API 密钥替换为 Partokens 密钥，并把 Base URL 设置为 `https://partokens.com/v1`。' },
            { question: '应该填写哪个模型名？', answer: '使用账户当前展示的可用模型名。文档不维护一份可能过期的固定模型清单。' },
            { question: '为什么示例只使用少量参数？', answer: '最小示例更适合验证鉴权、路由和模型名。高级参数的支持范围取决于目标模型，应从核心字段开始，再依据对应 API 文档和实际响应逐项验证。' },
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
            { question: '如何轮换或撤销密钥？', answer: '先创建替代密钥并完成验证，再更新应用配置并从控制台撤销旧密钥。' },
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
            { question: '使用日志中有记录就代表请求成功吗？', answer: '不代表。日志可以记录成功、失败或已经执行但客户端未收到结果的请求；应同时核对日志类型、HTTP 或业务结果、错误信息、输入输出用量和最终额度。' },
            { question: '没有找到日志就代表请求未执行吗？', answer: '不能直接判断。先检查时间范围、时区、搜索词和筛选条件，再使用模型或请求 ID 重新查询。' },
            { question: 'API 请求的数据如何处理？', answer: '请求内容会通过 Partokens 发送给所选模型服务。只提交完成任务所必需的信息，不要加入无关的敏感数据。' },
          ] },
          { type: 'callout', tone: 'info', title: '仍需协助时', body: '先按“连接、限额与重试”和“使用日志”完成自助核对，再前往“联系支持”准备脱敏诊断信息和正式联系方式。' },
        ],
      },
      {
        id: 'reading-map',
        title: '按问题继续阅读',
        blocks: [
          { type: 'table', columns: ['问题', '对应文档'], rows: [
            ['密钥、鉴权或疑似泄露', '“API 密钥管理”'],
            ['模型不可见、不可调用或价格疑问', '“模型列表 API”与“模型与定价”'],
            ['401、403、429、5xx 或超时', '“连接、限额与重试”'],
            ['执行状态、输入输出用量与最终结算', '“使用日志”'],
            ['自助排查后仍需提交问题', '“联系支持”'],
          ] },
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
        title: '转交支持',
        blocks: [
          { type: 'paragraph', text: '如果按上述步骤仍无法判断原因，先到“使用日志”按准确时间、时区、模型和请求 ID 核对执行与最终额度，再进入“联系支持”。该文档提供按问题类型整理的前置检查、正式渠道、脱敏规则和可复制模板。' },
          { type: 'table', columns: ['下一步', '对应文档'], rows: [
            ['确认请求是否形成记录、是否产生用量和最终额度', '“使用日志”'],
            ['准备完整诊断清单并使用正式渠道提交', '“联系支持”'],
          ] },
          { type: 'callout', tone: 'warning', title: '先移除敏感内容', body: '不要提交完整 API 密钥、密码、验证码、会话令牌、未脱敏个人信息、不必要的完整提示词、大段 Base64 或私有文件。怀疑密钥泄露时，先停止使用并在控制台撤销或替换，再联系支持。' },
        ],
      },
    ],
  },
  'usage-logs': {
    id: 'usage-logs',
    summary: '查询账户调用记录，核对请求状态、Token、费用和耗时。',
    sections: [
      {
        id: 'search',
        title: '查找请求',
        blocks: [
          { type: 'steps', items: [
            { title: '打开使用日志', body: '进入控制台，在侧栏中选择“使用日志”。' },
            { title: '选择时间范围', body: '选择最近 24 小时、7 天或 30 天，并确认请求发生时使用的时区。' },
            { title: '添加筛选条件', body: '可按事件类型、模型、分组和 API 密钥名称筛选；请求 ID 与上游请求 ID 需要精确匹配。' },
          ] },
        ],
      },
      {
        id: 'read',
        title: '查看用量与费用',
        blocks: [
          { type: 'table', columns: ['区域', '内容'], rows: [
            ['统计', '筛选范围内的费用、记录数、输入 Token、输出 Token 和缓存 Token'],
            ['列表', '时间、类型、分组、密钥名称、模型、流式状态、Token、费用和耗时'],
            ['详情', '请求 ID、上游请求 ID、错误信息和计价信息'],
          ] },
          { type: 'paragraph', text: '点击“刷新”重新获取数据。日志每页显示 20 条，可使用上一页和下一页继续浏览。' },
        ],
      },
      {
        id: 'diagnose',
        title: '排查失败或超时',
        blocks: [
          { type: 'steps', items: [
            { title: '记录请求信息', body: '保留请求时间与时区、模型、HTTP 状态和请求 ID。' },
            { title: '定位日志', body: '先使用请求 ID 精确查询；没有请求 ID 时，再按时间、模型和密钥缩小范围。' },
            { title: '核对结果', body: '结合日志类型、错误信息、Token、费用和耗时判断请求是否执行。客户端超时不代表上游任务一定停止。' },
          ] },
          { type: 'callout', tone: 'warning', title: '避免重复请求', body: '生成或编辑任务超时后，先检查使用日志和费用，再决定是否重试。' },
        ],
      },
      {
        id: 'support',
        title: '提交排障信息',
        blocks: [
          { type: 'table', columns: ['可以提供', '不要提供'], rows: [
            ['时间与时区、模型、请求 ID、HTTP 状态、脱敏后的错误信息', '完整 API 密钥、密码、验证码、会话令牌、完整提示词或私有文件'],
          ] },
          { type: 'paragraph', text: '联系支持前，请复制相关请求 ID，并说明问题发生的时间、模型和客户端。' },
        ],
      },
    ],
  },
  'contact-support': {
    id: 'contact-support',
    summary: '完成对应文档中的自助检查后，通过 Partokens 正式 Email 或 Telegram 支持机器人提交足够、可关联且已经脱敏的诊断信息。',
    prerequisites: ['已完成与问题类型对应的最小自助检查', '已准备准确时间、时区和可用的请求标识', '已从信息中移除密钥、凭据、个人信息和不必要的原始内容'],
    sections: [
      {
        id: 'before-contact',
        title: '按问题类型完成联系前检查',
        blocks: [
          { type: 'table', columns: ['问题类型', '联系前先检查', '对应文档'], rows: [
            ['登录或账户访问', '确认使用正确入口，记录页面错误与发生时间；不要发送密码、验证码或会话令牌', '“欢迎使用 Partokens”“常见问题”'],
            ['API 密钥和鉴权', '核对 Bearer 头、密钥状态、Base URL 与密钥限制；401 修正前不要重复请求', '“API 密钥管理”“API 基础”“连接、限额与重试”'],
            ['模型不可见或不可调用', '用账户实时配置或 `/v1/models` 核对精确模型 ID、密钥权限与目标 API', '“模型与定价”“模型列表 API”'],
            ['余额、套餐和结算', '记录请求前后变化，并用时间、模型、请求 ID、用量和 `quota` 找到对应记录', '“余额、套餐与额度”“模型与定价”“使用日志”'],
            ['401、403、429 和 5xx', '保留 HTTP 状态、`error.code`、脱敏消息、`Retry-After` 与请求 ID；按状态决定是否重试', '“连接、限额与重试”“API 基础”'],
            ['客户端超时或生成超时', '确认客户端时限与是否收到响应头；先查使用日志和结算，生成请求不要无条件重试', '“连接、限额与重试”“生图工作台”“图像生成 API”“使用日志”'],
            ['Codex++、CC Switch 等第三方工具', '先用最小 Partokens 请求区分服务端与工具问题，再记录工具名、版本、配置入口和官方仓库', '“支持的客户端总览”“Codex 与 CLI 配置”“连接、限额与重试”'],
          ] },
          { type: 'callout', tone: 'info', title: '先把问题缩小到一个层级', body: '说明问题发生在账户登录、Partokens API、模型路由、计费、网络，还是第三方工具。不要只提交“不可用”或一张缺少时间与请求 ID 的截图。' },
        ],
      },
      {
        id: 'diagnostic-checklist',
        title: '准备支持信息清单',
        blocks: [
          { type: 'table', columns: ['信息', '如何准备'], rows: [
            ['请求发生的准确时间和时区', '写完整日期、时分秒与 UTC 偏移，例如 `UTC+08:00`'],
            ['模型 ID', '使用请求体或实时模型列表中的精确字符串，不写相似名称'],
            ['API 路径或使用的客户端', '例如 `/v1/chat/completions`，或客户端/SDK/工具名称'],
            ['HTTP 状态', '填写实际状态；客户端未收到响应时明确写“未收到 HTTP 响应”'],
            ['`error.code`', '原样填写已返回的代码；没有时写“未返回”'],
            ['脱敏后的 `error.message`', '保留错误语义和请求 ID，移除密钥、个人信息、提示词和私有 URL'],
            ['`X-Oneapi-Request-Id`', '优先从响应头复制完整值；未收到时写“未返回”'],
            ['是否在使用日志中找到记录', '写“已找到”或“未找到”，并附查询时间范围、时区和所用筛选'],
            ['是否发生余额或套餐变化', '只描述是否变化及观察时间，不提交支付凭据'],
            ['客户端、SDK 或工具版本', '提供可复现问题的精确版本；第三方工具同时提供官方仓库 URL'],
            ['可复现的最小步骤', '从最少输入开始，逐步列出动作、预期和实际结果'],
          ] },
        ],
      },
      {
        id: 'secret-safety',
        title: '提交前移除敏感内容',
        blocks: [
          { type: 'list', items: [
            '禁止提交完整 API 密钥，即使密钥看似已经失效。',
            '禁止提交密码、验证码、恢复码、Cookie、会话令牌或 OAuth 令牌。',
            '禁止提交未脱敏的姓名、邮箱、电话、地址、身份信息或其他个人信息。',
            '不要提交与定位无关的完整提示词；只保留最小、脱敏的复现输入或问题描述。',
            '不要粘贴大段 Base64、私有文件、私有下载 URL 或整份未经审查的日志导出。',
          ] },
          { type: 'callout', tone: 'warning', title: '怀疑密钥泄露时先处置再联系', body: '立即停止使用相关密钥，并在控制台撤销或替换它；更新所有仍在使用旧密钥的服务后，再通过正式渠道说明泄露时间范围和已完成的处置。不要把疑似泄露的完整密钥发给支持团队。' },
        ],
      },
      {
        id: 'third-party-tools',
        title: '第三方工具问题的额外信息',
        blocks: [
          { type: 'paragraph', text: 'Codex++ 与 CC Switch 是独立第三方开源工具，不由 Partokens 维护。Partokens 可以协助核对自身 API、账户、模型、请求标识和结算，但不能承诺第三方工具的版本行为、修复、发布或兼容结果。' },
          { type: 'list', items: [
            '提供工具准确名称与版本。',
            '提供该工具的官方仓库 URL，避免同名分支或非官方构建造成歧义。',
            '说明使用的 provider、API 格式和 Base URL；密钥只说明来源，不提交值。',
            '分别复现工具内失败与最小 Partokens API 请求，帮助判断问题位于工具还是服务端。',
            '涉及工具自身崩溃、安装、更新或 UI 行为时，同时向该工具的官方维护者报告。',
          ] },
        ],
      },
      {
        id: 'official-channels',
        title: '使用正式支持渠道',
        blocks: [
          { type: 'paragraph', text: '请选择以下任一正式渠道，并在首条消息中提供已脱敏的最小信息。本文不承诺响应时间、服务时间、退款、赔偿、恢复时间或问题一定解决。' },
          { type: 'links', items: [
            { label: 'Email 支持', href: 'mailto:support@partokens.com' },
            { label: 'Telegram 支持机器人', href: 'https://t.me/PartokensSupportBot' },
          ] },
          { type: 'callout', tone: 'info', title: '只使用已确认渠道', body: '正式 Email 为 `support@partokens.com`；Telegram 为 `https://t.me/PartokensSupportBot`。不要把密钥、密码或验证码发送给任何渠道。' },
        ],
      },
      {
        id: 'support-template',
        title: '可复制的支持请求模板',
        blocks: [
          { type: 'paragraph', text: '复制后替换尖括号中的占位符；不适用的字段写“未返回”或“不适用”，不要编造值。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '支持请求模板', code: `问题类型：<登录 / 鉴权 / 模型 / 结算 / HTTP / 超时 / 第三方工具>
发生时间（含时区）：<YYYY-MM-DD HH:mm:ss UTC+08:00>
模型 ID：<精确模型 ID / 不适用>
API 路径或客户端：<API 路径、客户端、SDK 或工具名称>
HTTP 状态：<状态码 / 未收到 HTTP 响应>
error.code：<错误代码 / 未返回>
error.message（已脱敏）：<最小错误说明 / 未返回>
X-Oneapi-Request-Id：<完整请求 ID / 未返回>
使用日志：<已找到 / 未找到；查询时间范围、时区与筛选>
余额或套餐变化：<无 / 有；观察到的变化时间>
客户端、SDK 或工具版本：<精确版本>
第三方工具官方仓库：<官方仓库 URL / 不适用>

最小复现步骤：
1. <第一步>
2. <第二步>
3. <实际结果与预期结果>

已确认移除：API 密钥、密码、验证码、会话令牌、个人信息、
不必要的完整提示词、大段 Base64 和私有文件。` }] },
        ],
      },
    ],
  },
}

/**
 * English is the canonical fallback for the public docs until the remaining
 * locales have their own editorial pass. The compact factory keeps the
 * localized shell and all document topics in the same language without
 * inflating the application entry bundle with repeated object boilerplate.
 */
type EnglishSection = [id: string, title: string, text: string, tone?: DocsCalloutTone]

function englishDoc(id: DocsItemId, summary: string, sections: EnglishSection[], prerequisites?: string[]): DocsDocument {
  return {
    id,
    summary,
    prerequisites,
    sections: sections.map(([sectionId, title, text, tone]) => ({
      id: sectionId,
      title,
      blocks: tone
        ? [{ type: 'callout' as const, tone, title, body: text }]
        : [{ type: 'paragraph' as const, text }],
    })),
  }
}

const englishDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  welcome: englishDoc('welcome', 'Start with the documentation map, confirm the compatible boundary, and move from a new key to a working request.', [
    ['start-here', 'Start here', 'For a first integration, understand the service boundary, create an API key, choose a live model, and send one small request.'],
    ['base-url', 'One access address', 'Use the OpenAI-compatible base URL https://partokens.com/v1. Clients that support baseURL or base_url can point requests at Partokens.'],
    ['boundary', 'Live configuration wins', 'Models, prices, limits, and availability come from the current account configuration and server response.'],
  ]),
  overview: englishDoc('overview', 'Partokens provides one OpenAI-compatible API entry point for the models currently available to your account.', [
    ['what-it-is', 'What Partokens provides', 'Partokens keeps the OpenAI request shape while the account controls model access, billing, and quota.'],
    ['boundary', 'Compatibility boundary', 'A compatible client can send the supported request to the matching endpoint. It does not guarantee that every model accepts every parameter or API.', 'info'],
  ]),
  'first-request': englishDoc('first-request', 'Prepare an API key and an account model, then verify the integration with one compatible request.', [
    ['checklist', 'Integration checklist', 'Create PARTOKENS_API_KEY, read GET /v1/models, copy an exact model ID, and send a minimal request to https://partokens.com/v1.'],
    ['diagnostics', 'Keep the request ID', 'Record X-Oneapi-Request-Id with the status, endpoint, and model so failures can be diagnosed quickly.', 'success'],
  ], ['A Partokens API key stored outside source control', 'A model ID returned by the current account model list', 'A client that supports a custom OpenAI base URL']),
  clients: englishDoc('clients', 'Choose an entry point for command-line tools, coding agents, official SDKs, compatible clients, or direct HTTPS.', [
    ['choose', 'Choose an entry point', 'Use Shell or cURL for connectivity checks, an OpenAI SDK for applications, a configurable provider for agents, or direct HTTPS for custom runtimes.'],
    ['selection', 'Validate compatibility', 'The client must accept a custom OpenAI base URL, a Bearer key, and the API used by the target model. Add advanced options one at a time.', 'warning'],
  ]),
  'api-keys': englishDoc('api-keys', 'Create and manage API credentials while keeping long-lived keys in an environment variable or secret store.', [
    ['create', 'Create a key', 'Open API key management, create a key with a clear purpose and smallest practical quota, then export it before running a request.'],
    ['hygiene', 'Key hygiene', 'Never commit keys, expose them in browser code, or paste them into logs. Use separate keys per environment and rotate suspected exposures.', 'warning'],
  ]),
  billing: englishDoc('billing', 'Understand how balance, plans, quota, and model usage relate, then reconcile charges with current console data.', [
    ['terms', 'Billing vocabulary', 'Balance is available account value; plan or quota is the active allowance; model price is live route metadata; usage logs are server records.'],
    ['reconcile', 'Reconcile a charge', 'Keep the request time, model, endpoint, status, and request ID. Compare the client result with usage logs and escalate discrepancies with redacted details.', 'info'],
  ]),
  'models-pricing': englishDoc('models-pricing', 'Select a model from live account metadata, verify its capabilities and price, and treat server usage records as final.', [
    ['model-record', 'Read a model record', 'Copy the exact id, check supported_endpoint_types, and use the current price or ratio only as billing context.'],
    ['selection', 'Before you call', 'Confirm the target API matches the model capability, start with the smallest request, and use usage logs for final cost.'],
  ]),
  codex: englishDoc('codex', 'Point Codex Responses requests at Partokens through native configuration or a separately maintained open-source tool.', [
    ['provider', 'Configure a provider', 'Use https://partokens.com/v1, PARTOKENS_API_KEY, and a model copied from the current account list. Confirm Responses support before testing.'],
    ['safety', 'Keep local config safe', 'Restrict Codex config and credential files, prefer environment variables, back up before third-party changes, and restore the backup after a failed test.', 'warning'],
  ], ['Codex installed and runnable', 'A Partokens API key', 'A current model that supports the Responses API']),
  sdk: englishDoc('sdk', 'Use the current OpenAI JavaScript or Python SDK with the Partokens base URL, live model discovery, and explicit error handling.', [
    ['setup', 'SDK setup', 'Install the SDK in a trusted server environment, read a live model ID, and set baseURL or base_url to https://partokens.com/v1.'],
    ['errors', 'Handle failures', 'Separate network failures from HTTP errors, keep X-Oneapi-Request-Id, and start with a non-streaming request before optional features.', 'warning'],
  ]),
  'image-studio': englishDoc('image-studio', 'Generate or edit images in the console and manage projects, references, and results.', [
    ['start', 'Start a generation', 'Open Image Studio, select an image-capable model and Image-group API key, enter a prompt, and choose the available quality, size, background, and result count.'],
    ['reference', 'Use a reference image', 'Upload a PNG, JPG, or WebP image to edit it from your prompt. A generated result can also become the reference for the next request.'],
    ['results', 'Save your results', 'Download results you need to keep. New requests replace the displayed result set, while projects and recent history remain in the current browser.'],
    ['security', 'Handle keys and interruptions', 'The full key is not stored with a project. After a cancellation or timeout, check Usage logs before retrying because upstream processing may have continued.', 'warning'],
  ]),
  'api-basics': {
    id: 'api-basics',
    summary: 'Send HTTPS requests with the Partokens base URL and a Bearer API key, then handle the result by HTTP status and response body.',
    prerequisites: ['A Partokens API key', 'A model ID copied from the model list'],
    sections: [
      {
        id: 'send-request',
        title: 'Send a request',
        blocks: [
          { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          { type: 'list', items: ['Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.', 'Requests with a JSON body also require `Content-Type: application/json`.', 'Never place the API key in a URL, client-side code, or logs.'] },
        ],
      },
      {
        id: 'run-request',
        title: 'Run a minimal request',
        blocks: [
          { type: 'list', items: ['`model`: an exact model ID returned by the model list.', '`messages`: the ordered messages sent to the model.', '`messages[].role`: use `user` for a minimal text request.', '`messages[].content`: non-empty text.'] },
          { type: 'code-samples', samples: firstRequestSamplesEn },
        ],
      },
      {
        id: 'read-response',
        title: 'Read the response',
        blocks: [
          { type: 'list', items: ['Check the HTTP status first; a 2xx status indicates a successful HTTP response.', 'Parse the JSON body and read the endpoint result, such as `choices` for chat, `data` for images, or `data` for models.', 'For a non-2xx response, read `error.message` and record `error.code` when it is present.'] },
        ],
      },
      {
        id: 'handle-errors',
        title: 'Handle errors',
        blocks: [
          { type: 'list', items: ['400: correct the JSON or request fields before sending it again.', '401 / 403: check the API key and access; do not retry unchanged credentials.', '429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.', '5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.', 'Network error or timeout: determine whether an HTTP response arrived before deciding to retry.'] },
          { type: 'callout', tone: 'warning', title: 'Retry safely', body: 'GET requests can be retried within a total deadline; retry chat and image POST requests automatically only when the application accepts duplicate results and usage.' },
        ],
      },
    ],
  },
  'chat-completions': {
    id: 'chat-completions',
    summary: 'Send a message array to generate a chat reply, then read the text from `choices[0].message.content`.',
    prerequisites: ['A Partokens API key', 'A chat-capable model ID copied from the model list', 'The OpenAI SDK for the JavaScript and Python examples'],
    sections: [
      {
        id: 'send-request',
        title: 'Send a request',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          { type: 'list', items: ['Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.', 'Send `Content-Type: application/json`.', 'For an SDK, set the base URL to `https://partokens.com/v1`.'] },
        ],
      },
      {
        id: 'fill-request',
        title: 'Fill in the request',
        blocks: [
          { type: 'list', items: ['`model`: an exact model ID returned by the model list.', '`messages`: the ordered messages sent to the model.', '`messages[].role`: use `user` for a minimal text request.', '`messages[].content`: non-empty text for the message.'] },
          { type: 'code-samples', samples: chatSamplesEn },
        ],
      },
      {
        id: 'read-response',
        title: 'Read the response',
        blocks: [
          { type: 'list', items: ['`choices[0].message.content`: text from the first candidate.', '`choices[0].finish_reason`: why that candidate stopped.', '`usage`: input, output, and total token counts when returned.'] },
          { type: 'paragraph', text: 'Treat an empty `choices` array or a first candidate without text as a response with no usable chat result.' },
        ],
      },
      {
        id: 'handle-errors',
        title: 'Handle errors',
        blocks: [
          { type: 'list', items: ['400: use `error.message` to correct `model`, `messages`, or a message field.', '401 / 403: check the API key and access; do not retry unchanged credentials.', '429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.', '5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.', 'Network error or timeout: the request may have run; do not resend it immediately.'] },
          { type: 'callout', tone: 'warning', title: 'Avoid duplicate generations', body: 'Retry chat requests automatically only when the application accepts duplicate replies and usage and the client sets a timeout and maximum attempt count.' },
        ],
      },
    ],
  },
  'image-api': {
    id: 'image-api',
    summary: 'Send a prompt to generate an image, then save the result from `data[0].url` or `data[0].b64_json`.',
    prerequisites: ['A Partokens API key', 'An image-capable model ID copied from the model list', 'cURL, jq, and OpenSSL for Shell; the OpenAI SDK for JavaScript and Python'],
    sections: [
      {
        id: 'send-request',
        title: 'Send a request',
        blocks: [
          { type: 'endpoint', method: 'POST', label: 'Image Generations', path: 'https://partokens.com/v1/images/generations' },
          { type: 'list', items: ['Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.', 'Send `Content-Type: application/json`.', 'For an SDK, set the base URL to `https://partokens.com/v1`.'] },
        ],
      },
      {
        id: 'fill-request',
        title: 'Fill in the request',
        blocks: [
          { type: 'list', items: ['`model`: an exact image model ID returned by the model list.', '`prompt`: a non-empty text description of the image.'] },
          { type: 'code-samples', samples: imageGenerationSamplesEn },
        ],
      },
      {
        id: 'read-response',
        title: 'Read the response',
        blocks: [
          { type: 'list', items: ['Confirm that the `data` array is not empty.', 'When `data[0].url` is present, download it and check the download HTTP status.', 'When no URL is present but `data[0].b64_json` exists, decode the Base64 value into a binary file.', 'Treat a result with neither field as a response with no usable image.'] },
          { type: 'paragraph', text: 'Do not write complete Base64 image data to application logs.' },
        ],
      },
      {
        id: 'handle-errors',
        title: 'Handle errors',
        blocks: [
          { type: 'list', items: ['400: use `error.message` to correct `model` or `prompt`.', '401 / 403: check the API key and access; do not retry unchanged credentials.', '429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.', '5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.', 'Network error or timeout: the request may have run; do not generate again immediately.', 'Image download failure: retry the download without resending the generation request.'] },
          { type: 'callout', tone: 'warning', title: 'Avoid duplicate generations', body: 'Retry image generation automatically only when the application accepts duplicate images and usage and the client sets a timeout and maximum attempt count.' },
        ],
      },
    ],
  },
  'models-api': {
    id: 'models-api',
    summary: 'Read the models available to the current API key and reuse an exact returned model ID in other requests.',
    prerequisites: ['A Partokens API key', 'cURL and jq for Shell; the OpenAI SDK for JavaScript and Python'],
    sections: [
      {
        id: 'send-request',
        title: 'Send a request',
        blocks: [
          { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          { type: 'list', items: ['Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.', 'This GET request has no request body.'] },
        ],
      },
      {
        id: 'run-request',
        title: 'Run a minimal request',
        blocks: [
          { type: 'code-samples', samples: modelsApiSamplesEn },
        ],
      },
      {
        id: 'read-response',
        title: 'Read the response',
        blocks: [
          { type: 'list', items: ['`object`: a value of `list` identifies a model list.', '`data`: the model array; an empty array means the key currently has no available models.', '`data[].id`: copy the exact value into the `model` field of another request.'] },
          { type: 'paragraph', text: 'Do not change the letter case of a model ID or add or remove a prefix.' },
        ],
      },
      {
        id: 'handle-errors',
        title: 'Handle errors',
        blocks: [
          { type: 'list', items: ['401 / 403: check the API key and access; do not retry unchanged credentials.', '429: wait for `Retry-After`, or use exponential backoff with jitter.', '5xx, network error, or timeout: retry with a maximum attempt count and a total deadline.', '2xx with empty `data`: check the models available to the key; do not guess a model ID.'] },
          { type: 'paragraph', text: 'The model list is a GET request and can be retried safely within a total deadline; set a timeout and limit the number of attempts.' },
        ],
      },
    ],
  },
  faq: englishDoc('faq', 'Answers to common integration questions, with a clear source of truth for live models, prices, limits, logs, and data boundaries.', [
    ['sdk', 'Can I keep using the OpenAI SDK?', 'Yes. Set the key to a Partokens key and the base URL to https://partokens.com/v1.'],
    ['model', 'Where do I find a model name?', 'Read GET /v1/models and copy the exact id. Visibility does not guarantee every route or parameter.'],
    ['browser', 'Can I put the key in a browser app?', 'No. Route browser requests through a server you control so long-lived keys stay private.', 'warning'],
  ]),
  troubleshooting: englishDoc('troubleshooting', 'Start with the smallest diagnostic request, identify the failing layer, and decide whether a retry is safe.', [
    ['sequence', 'Diagnostic sequence', 'Check transport, access, model, parameters, balance, quota, and server response in that order.'],
    ['retry', 'Retry deliberately', 'Keep time, model, status, endpoint, and X-Oneapi-Request-Id. A timeout may mean the upstream already processed the request.', 'warning'],
  ]),
  'usage-logs': englishDoc('usage-logs', 'Find account requests and review status, tokens, cost, and duration.', [
    ['search', 'Find a request', 'Choose a time range, then filter by event type, model, group, or API key name. Request ID and upstream request ID use exact matches.'],
    ['read', 'Review usage', 'The page shows filtered totals and 20 log records per page. Open a record to view request IDs, errors, and pricing details.'],
    ['diagnose', 'Investigate failures', 'Keep the request time and timezone, model, HTTP status, and request ID. A client timeout does not prove that upstream processing stopped.', 'warning'],
    ['support', 'Prepare a support report', 'Share the time, model, request ID, HTTP status, and redacted error. Never share a full API key, password, session token, prompt, or private file.'],
  ]),
  'contact-support': englishDoc('contact-support', 'After self-service checks, send a useful, correlatable, and redacted report through Partokens Email or Telegram support.', [
    ['channels', 'Support channels', 'Email support@partokens.com or use the official Partokens Telegram support bot.'],
    ['report', 'Include enough context', 'Include time and timezone, model, endpoint, HTTP status, request ID, redacted error, minimal reproduction, and client version. Remove all secrets.', 'warning'],
  ]),
}

const conciseSdkJavaScriptSample: DocsCodeSample = {
  language: 'javascript',
  label: 'JavaScript / Node.js',
  code: `// PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" PARTOKENS_MODEL="<YOUR_MODEL_ID>" node example.mjs
import OpenAI from "openai";

const apiKey = process.env.PARTOKENS_API_KEY;
const model = process.env.PARTOKENS_MODEL;
if (!apiKey || !model) throw new Error("Set PARTOKENS_API_KEY and PARTOKENS_MODEL");

const client = new OpenAI({
  apiKey,
  baseURL: "https://partokens.com/v1",
});

const response = await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: "Reply with: connection successful" }],
});

const text = response.choices[0]?.message?.content;
if (!text) throw new Error("The response contains no chat text");
console.log(text);`,
}

const conciseSdkPythonSample: DocsCodeSample = {
  language: 'python',
  label: 'Python',
  code: `# PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>" PARTOKENS_MODEL="<YOUR_MODEL_ID>" python example.py
import os
from openai import OpenAI

api_key = os.environ.get("PARTOKENS_API_KEY")
model = os.environ.get("PARTOKENS_MODEL")
if not api_key or not model:
    raise RuntimeError("Set PARTOKENS_API_KEY and PARTOKENS_MODEL")

client = OpenAI(
    api_key=api_key,
    base_url="https://partokens.com/v1",
)

response = client.chat.completions.create(
    model=model,
    messages=[{"role": "user", "content": "Reply with: connection successful"}],
)

text = response.choices[0].message.content
if not text:
    raise RuntimeError("The response contains no chat text")
print(text)`,
}

const conciseDocsDocuments: Record<'zh-CN' | 'en', Partial<Record<DocsItemId, DocsDocument>>> = {
  'zh-CN': {
    welcome: {
      id: 'welcome',
      summary: '选择合适的接入方式，准备账户、API 密钥和实时模型 ID，然后完成一次最小调用。',
      sections: [
        {
          id: 'choose-path',
          title: '选择接入路径',
          blocks: [
            { type: 'paragraph', text: '所有接入方式使用同一组账户权限、API 密钥、模型 ID 和 OpenAI 兼容 Base URL。按当前任务选择最短路径。' },
            { type: 'list', items: ['Shell / cURL：用于首次连通性检查和问题复现。', 'OpenAI JavaScript 或 Python SDK：用于服务、脚本和已有 SDK 项目。', '支持自定义 OpenAI Base URL 的客户端：用于已有工具；配置前确认客户端可以填写 Base URL、Bearer 密钥和模型 ID。', '控制台工作台：用于直接体验当前账户提供的聊天或图像能力。'] },
          ],
        },
        {
          id: 'prepare-access',
          title: '准备账户与密钥',
          blocks: [
            { type: 'steps', items: [
              { title: '创建 API 密钥', body: '登录控制台，打开“API 密钥”，创建密钥并将其安全保存为 `<YOUR_PARTOKENS_API_KEY>`。' },
              { title: '复制实时模型 ID', body: '打开顶部导航中的“模型”，或使用该密钥调用模型列表，复制当前返回的精确 ID `<YOUR_MODEL_ID>`。' },
              { title: '保存连接信息', body: '将密钥放入环境变量或密钥管理系统；不要写入仓库、URL、日志或浏览器代码。' },
            ] },
            { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          ],
        },
        {
          id: 'complete-first-call',
          title: '完成首次调用',
          blocks: [
            { type: 'steps', items: [
              { title: '打开首次接入文档', body: '前往“快速开始：完成首次接入”，选择 Shell、JavaScript 或 Python 示例。' },
              { title: '替换连接参数', body: '保留统一 Base URL，并填入 `<YOUR_PARTOKENS_API_KEY>` 和 `<YOUR_MODEL_ID>`。' },
              { title: '确认结果', body: '发送最小请求，先检查 HTTP 状态，再确认响应中有可读取结果；失败时保留请求时间、状态和请求 ID。' },
            ] },
            { type: 'callout', tone: 'success', title: '先验证最小请求', body: '最小请求成功后，再接入应用并逐项增加可选参数。本文不重复完整请求示例。' },
          ],
        },
        {
          id: 'continue-reading',
          title: '继续阅读文档',
          blocks: [
            { type: 'list', items: ['了解服务范围：阅读“Partokens 是什么”。', '管理凭据：阅读“API 密钥管理”。', '选择模型与核对价格：阅读“模型与定价”和“模型列表 API”。', '配置 SDK 或客户端：阅读“SDK 配置”“支持的客户端总览”或“Codex 与 CLI 配置”。', '排查请求与扣减：阅读“连接、限额与重试”和“使用日志”。', '自助检查后仍需帮助：阅读“联系支持”。'] },
          ],
        },
      ],
    },
    overview: {
      id: 'overview',
      summary: 'Partokens 提供 OpenAI 兼容 API 入口，用于访问当前账户可用的模型和能力。',
      sections: [
        {
          id: 'confirm-scope',
          title: '确认服务范围',
          blocks: [
            { type: 'paragraph', text: 'Partokens 提供统一的 OpenAI 兼容 Base URL、账户控制台和公开 API 文档。应用可以通过 HTTPS、OpenAI SDK 或支持自定义 Base URL 的客户端发起请求。' },
            { type: 'callout', tone: 'info', title: '兼容不代表完全相同', body: 'OpenAI 兼容说明可复用常见的连接方式和请求结构，不表示每个账户、模型、端点或可选参数都可用。' },
          ],
        },
        {
          id: 'choose-entry',
          title: '选择调用入口',
          blocks: [
            { type: 'list', items: ['查看模型：打开账户“模型”页面，或调用 `GET /v1/models`。', '发送模型请求：从目标 API 页面选择与模型当前能力一致的端点，并从最小必填字段开始。', '使用 SDK 或兼容客户端：将 Base URL 设置为 `https://partokens.com/v1`，使用 Partokens Bearer 密钥和精确模型 ID。', '直接体验：登录控制台后使用当前提供的聊天或图像工作台。'] },
          ],
        },
        {
          id: 'check-live-data',
          title: '核对实时信息',
          blocks: [
            { type: 'steps', items: [
              { title: '核对模型与端点', body: '以账户“模型”页面或同一密钥调用模型列表得到的当前结果为准。' },
              { title: '核对价格与额度', body: '以当前账户显示的信息、调用后的使用日志和实际扣减为准。' },
              { title: '核对参数', body: '以对应 API 文档和目标模型的实际响应为准；不要根据模型名称或其他服务推断。' },
            ] },
            { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          ],
        },
        {
          id: 'verify-compatibility',
          title: '验证兼容性',
          blocks: [
            { type: 'steps', items: [
              { title: '确认客户端设置', body: '确认可以设置 Base URL、Bearer 密钥和精确模型 ID。' },
              { title: '运行目标端点的最小请求', body: '使用 `<YOUR_PARTOKENS_API_KEY>` 和 `<YOUR_MODEL_ID>`，只发送该端点要求的核心字段。' },
              { title: '逐项增加能力', body: '最小请求成功后再逐个加入可选参数，并以每次实际响应确认支持情况。' },
            ] },
            { type: 'callout', tone: 'warning', title: '以实际响应为准', body: '模型可见或客户端可配置，只表示具备接入条件；目标模型对目标端点和参数的实际响应才是兼容性依据。' },
          ],
        },
      ],
    },
    faq: {
      id: 'faq',
      summary: '回答接入、账户、模型、用量和常见失败问题，并指出应核对的实时依据。',
      sections: [
        {
          id: 'choose-integration',
          title: '选择接入方式',
          blocks: [{ type: 'faq', items: [
            { question: '可以继续使用 OpenAI SDK 吗？', answer: '可以。将 Base URL 设置为 `https://partokens.com/v1`，使用 Partokens API 密钥，并填写账户当前返回的精确模型 ID。' },
            { question: '应该选择 Shell、SDK 还是兼容客户端？', answer: 'Shell 适合最小检查和复现；SDK 适合服务与脚本；已有客户端只有在可以自定义 Base URL、Bearer 密钥和模型 ID 时才具备接入条件。' },
            { question: '在哪里查看完整请求示例？', answer: '首次调用请阅读“快速开始：完成首次接入”；字段与响应结构请查看对应 API 页面。' },
          ] }],
        },
        {
          id: 'manage-account',
          title: '管理密钥与账户',
          blocks: [{ type: 'faq', items: [
            { question: 'API 密钥应该保存在哪里？', answer: '将 `<YOUR_PARTOKENS_API_KEY>` 保存在环境变量或密钥管理系统中，不要写入仓库、URL、日志或浏览器代码。' },
            { question: '如何轮换密钥？', answer: '先创建并验证替代密钥，更新所有使用方，再从控制台停用或删除旧密钥。怀疑泄露时立即处置旧密钥。' },
            { question: '余额、套餐和可用额度以哪里为准？', answer: '以当前账户页面、请求的实际响应、使用日志和实际扣减为准。' },
          ] }],
        },
        {
          id: 'check-model-usage',
          title: '核对模型与用量',
          blocks: [{ type: 'faq', items: [
            { question: '应该填写哪个模型 ID？', answer: '从账户“模型”页面或 `GET /v1/models` 复制当前返回的精确 ID，并原样用作 `<YOUR_MODEL_ID>`。不要猜测模型名。' },
            { question: '模型出现在列表中就支持所有端点和参数吗？', answer: '不支持这样推断。请核对模型当前显示的能力，并通过目标端点的最小请求和实际响应逐项验证。' },
            { question: '使用日志中有记录就代表调用成功吗？', answer: '不一定。还要核对记录类型、客户端收到的 HTTP 状态和错误、Token、费用与耗时。' },
          ] }],
        },
        {
          id: 'resolve-common-failures',
          title: '处理常见失败',
          blocks: [{ type: 'faq', items: [
            { question: '请求失败时先检查什么？', answer: '先用 `GET https://partokens.com/v1/models` 检查连接和鉴权，再根据 400、401、403、429 或 5xx 修正请求；保留时间、时区、端点、模型和请求 ID。' },
            { question: '所有失败都可以直接重试吗？', answer: '不可以。400、401 和 403 应先修正；429 遵循 `Retry-After` 或退避等待；5xx 只对可安全重放的请求进行有限重试。' },
            { question: '取消或超时后应该怎么做？', answer: '先在“使用日志”按时间、模型、密钥名称和请求 ID 查找记录并核对扣减，再决定是否重试。' },
            { question: '什么时候联系支持？', answer: '完成“连接、限额与重试”和“使用日志”的自助检查后，如仍无法定位，请按“联系支持”准备脱敏诊断信息。' },
          ] }],
        },
      ],
    },
    troubleshooting: {
      id: 'troubleshooting',
      summary: '先运行最小模型列表请求，再按 HTTP 状态判断修正方式和重试条件。',
      prerequisites: ['已创建 Partokens API 密钥', '可以查看命令返回的 HTTP 状态、响应头和响应正文'],
      sections: [
        {
          id: 'run-minimal-check',
          title: '运行最小检查',
          blocks: [
            { type: 'paragraph', text: '下面的 `GET /v1/models` 不会发起生成任务，可用于检查域名解析、TLS、代理、Base URL 和鉴权。命令同时显示响应头，便于记录请求 ID。' },
            { type: 'code-samples', samples: [{ language: 'shell', label: '连接与鉴权检查', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"

curl --silent --show-error --include \\
  https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY"` }] },
          ],
        },
        {
          id: 'fix-by-status',
          title: '根据状态修正',
          blocks: [
            { type: 'list', items: ['连接错误：未收到 HTTP 状态时，检查网络、DNS、TLS、代理、连接超时，以及 URL 是否准确为 `https://partokens.com/v1/models`。', '400：根据返回的错误修正 JSON、必填字段、模型 ID 或目标端点；修正前不要重复请求。', '401：确认环境变量已设置、Bearer 头完整、密钥未被截断，并在控制台检查密钥状态。', '403：根据返回的错误核对密钥访问范围、模型可用性以及账户当前余额或套餐；修正后再请求。', '429：优先遵循 `Retry-After`；未提供时减少并发并使用带随机抖动的指数退避。', '5xx：保留请求 ID；仅对可以安全重放的请求进行有限退避重试。'] },
            { type: 'callout', tone: 'info', title: '状态是排查起点', body: '同一状态可能有不同原因。最终判断应结合响应正文、请求 ID、账户当前信息和使用日志。' },
          ],
        },
        {
          id: 'decide-retry',
          title: '决定是否重试',
          blocks: [
            { type: 'list', items: ['可以重试：`GET /v1/models` 的短暂连接错误、429 等待完成后，或短暂 5xx；设置总时限和最大尝试次数。', '修正后再试：400、401、403，以及明确由模型、端点、参数、密钥或账户状态导致的失败。', '先查日志：客户端取消或超时无法证明请求未执行。先按时间、模型、密钥名称和请求 ID 核对使用日志及扣减。', '避免重复执行：聊天、图像生成或编辑请求只有在可以接受重复结果和重复用量时，才进行自动重试。'] },
            { type: 'callout', tone: 'warning', title: '取消或超时后不要立即重放', body: '如果使用日志显示请求已执行或产生扣减，请先核对结果和请求 ID；如仍无法判断，准备诊断信息后联系支持。' },
          ],
        },
        {
          id: 'prepare-diagnostics',
          title: '准备排障信息',
          blocks: [
            { type: 'steps', items: [
              { title: '记录请求', body: '保留准确时间与时区、模型、端点、HTTP 状态和请求 ID。' },
              { title: '保留脱敏错误', body: '保留足以说明问题的错误内容，并移除凭据、个人信息、完整提示词和私有文件。' },
              { title: '核对使用日志', body: '说明是否找到对应记录，并记录所用时间范围、模型、密钥名称和请求 ID。' },
              { title: '整理最小复现', body: '列出最少步骤、预期结果和实际结果，再按“联系支持”选择正式渠道。' },
            ] },
            { type: 'callout', tone: 'warning', title: '不要提交凭据', body: '支持信息中不得包含完整 API 密钥、密码、验证码或会话令牌。' },
          ],
        },
      ],
    },
    'usage-logs': {
      id: 'usage-logs',
      summary: '在控制台查找调用记录，并核对类型、错误、Token、费用、耗时和扣减。',
      sections: [
        {
          id: 'open-logs',
          title: '打开使用日志',
          blocks: [
            { type: 'steps', items: [
              { title: '进入控制台', body: '登录 Partokens 并打开控制台。' },
              { title: '打开使用日志', body: '在侧栏“常规”区域选择“使用日志”。' },
              { title: '刷新当前数据', body: '需要重新获取记录时选择“刷新”，再按请求发生时间开始查找。' },
            ] },
            { type: 'paragraph', text: '使用日志用于核对账户调用和事件；客户端收到的 HTTP 状态、响应头和脱敏错误也应同时保留。' },
          ],
        },
        {
          id: 'filter-requests',
          title: '筛选调用记录',
          blocks: [
            { type: 'steps', items: [
              { title: '选择时间范围', body: '选择覆盖请求发生时间的范围，并确认记录时间与客户端时间使用的时区。' },
              { title: '选择模型', body: '使用页面的模型筛选缩小结果；模型 ID 应与请求中使用的值完全一致。' },
              { title: '按密钥名称查找', body: '打开精确搜索字段菜单，选择“API 密钥名称”，输入日志中显示的密钥名称，不要输入密钥值。' },
              { title: '按请求 ID 查找', body: '打开精确搜索字段菜单，选择“请求 ID”，输入完整请求 ID。' },
            ] },
            { type: 'list', items: ['一次只使用足以定位记录的条件；没有结果时先检查时间范围、时区和精确值。', '清除不适用的筛选后重新查询，避免旧条件排除目标记录。'] },
          ],
        },
        {
          id: 'review-results',
          title: '核对结果与扣减',
          blocks: [
            { type: 'list', items: ['类型与错误：使用“类型”区分用量和错误事件；遇到错误事件时，用时间和请求 ID 对照客户端保存的 HTTP 状态与脱敏错误。', 'Token：核对输入、输出和缓存 Token；缺失或不适用的字段不要自行推算。', '费用：核对记录费用和筛选范围内的费用汇总，再与账户扣减变化对照。', '耗时：核对总耗时；流式请求还可核对首个 Token 的耗时。', '详情：打开目标记录，确认请求 ID、时间、模型、密钥名称、Token、费用和耗时属于同一次调用。'] },
            { type: 'callout', tone: 'info', title: '记录不等于成功', body: '日志可能包含用量、错误或其他账户事件。应结合类型、客户端结果和实际扣减判断调用结果。' },
          ],
        },
        {
          id: 'handle-failures',
          title: '处理失败与超时',
          blocks: [
            { type: 'steps', items: [
              { title: '关联失败记录', body: '用准确时间、模型、密钥名称和请求 ID 查找目标记录，并对照客户端 HTTP 状态与脱敏错误。' },
              { title: '核对是否产生用量', body: '查看 Token、费用和耗时，判断该请求是否留下执行与扣减记录。' },
              { title: '谨慎处理取消或超时', body: '取消或超时不代表请求一定停止；确认日志和扣减后再决定是否重试。' },
              { title: '准备支持信息', body: '仍无法判断时，记录查询时间范围、时区和筛选条件，并前往“联系支持”。' },
            ] },
            { type: 'callout', tone: 'warning', title: '不要用敏感值搜索', body: '筛选时使用密钥名称，不要粘贴完整 API 密钥；提交问题前移除凭据、个人信息、完整提示词和私有文件。' },
          ],
        },
      ],
    },
    'contact-support': {
      id: 'contact-support',
      summary: '完成自助检查后，通过 Partokens Email 或 Telegram 提交可关联且已经脱敏的问题报告。',
      sections: [
        {
          id: 'check-before-contact',
          title: '完成联系前检查',
          blocks: [
            { type: 'steps', items: [
              { title: '复现最小请求', body: 'API 问题先按“连接、限额与重试”运行最小检查，并记录实际 HTTP 状态。' },
              { title: '核对模型与账户', body: '确认模型来自当前列表，并检查密钥状态、访问范围和账户当前信息。' },
              { title: '查找使用日志', body: '按时间、模型、密钥名称和请求 ID 查找记录，核对 Token、费用和耗时。' },
              { title: '确认仍需协助', body: '说明已完成的检查、预期结果和实际结果，避免只提交“不可用”。' },
            ] },
            { type: 'list', items: ['登录或账户问题：记录页面、准确时间与时区和脱敏错误。', 'API 问题：记录端点、模型、HTTP 状态和请求 ID。', '取消或超时：先说明使用日志中是否存在记录和扣减。'] },
          ],
        },
        {
          id: 'prepare-diagnostics',
          title: '准备诊断信息',
          blocks: [
            { type: 'list', items: ['请求或问题发生的准确时间与时区。', '请求使用的精确模型 ID。', 'API 端点或发生问题的控制台页面。', '实际 HTTP 状态；未收到响应时明确说明。', '完整请求 ID；未返回时明确说明。', '保留错误含义的脱敏错误信息。', '从最少输入开始的复现步骤、预期结果和实际结果。', '使用日志中是否找到记录，以及核对到的 Token、费用和耗时。'] },
          ],
        },
        {
          id: 'remove-sensitive-data',
          title: '移除敏感内容',
          blocks: [
            { type: 'list', items: ['禁止提交 API 密钥或其他访问凭据。', '禁止提交密码、验证码、恢复码、Cookie 或会话令牌。', '禁止提交姓名、邮箱、电话、地址、身份信息或其他个人信息。', '禁止提交完整提示词、完整请求正文或与复现无关的原始内容。', '禁止提交私有文件、私有下载地址、大段 Base64 或未经检查的日志导出。'] },
            { type: 'callout', tone: 'warning', title: '疑似泄露时先轮换密钥', body: '立即停用或删除相关密钥，创建并验证替代密钥，再更新所有使用方。不要向支持渠道发送旧密钥。' },
          ],
        },
        {
          id: 'use-official-channels',
          title: '使用正式支持渠道',
          blocks: [
            { type: 'paragraph', text: '请选择以下任一公开支持渠道，并在首条消息中提供已脱敏的最小诊断信息。文档不承诺响应时间或解决时限。' },
            { type: 'links', items: [
              { label: 'Email 支持', href: 'mailto:support@partokens.com' },
              { label: 'Telegram 支持机器人', href: 'https://t.me/PartokensSupportBot' },
            ] },
          ],
        },
      ],
    },
    billing: {
      id: 'billing',
      summary: '在控制台查看余额、套餐和用量，选择计费来源，并在额度不足时完成检查和恢复。',
      prerequisites: ['可以登录 Partokens 控制台'],
      sections: [
        {
          id: 'view-balance-plan',
          title: '查看余额与套餐',
          blocks: [
            { type: 'steps', items: [
              { title: '打开钱包', body: '登录控制台，在侧栏的“账户”中选择“钱包”。' },
              { title: '查看账户状态', body: '在页面顶部查看账户余额、总用量和有效套餐数量。' },
              { title: '查看套餐额度', body: '在“选择套餐”区域选择“查看有效套餐”，核对每个套餐的状态、总额度、剩余额度和已用比例。' },
            ] },
            { type: 'list', items: ['账户余额显示当前可用余额。', '总用量显示账户已经产生的用量。', '有效套餐详情显示当前仍可使用的套餐及其剩余额度。'] },
          ],
        },
        {
          id: 'choose-billing-source',
          title: '选择计费来源',
          blocks: [
            { type: 'steps', items: [
              { title: '找到计费偏好', body: '在“钱包”的“选择套餐”区域底部找到“用量计费偏好”。存在有效套餐时可以修改该设置。' },
              { title: '选择当前偏好', body: '按需要选择“套餐优先”“余额优先”“仅套餐”或“仅余额”；保存成功后再发起调用。' },
            ] },
            { type: 'list', items: ['“套餐优先”和“余额优先”用于指定首先尝试的来源。', '“仅套餐”和“仅余额”将调用限制为对应来源。', '更改前先确认所选来源当前可用。'] },
          ],
        },
        {
          id: 'review-usage',
          title: '核对用量',
          blocks: [
            { type: 'steps', items: [
              { title: '打开使用日志', body: '在控制台侧栏的“常规”中选择“使用日志”。' },
              { title: '缩小时间与模型范围', body: '选择覆盖调用发生时间的范围，再选择模型；需要精确定位时，将搜索字段切换为“请求 ID”并输入完整请求 ID。' },
              { title: '核对调用和扣减', body: '打开对应记录，核对请求时间、类型、模型、错误信息、用量、费用和请求 ID，再与钱包中的余额或套餐剩余额度变化对照。' },
            ] },
          ],
        },
        {
          id: 'resolve-insufficient-quota',
          title: '处理额度不足',
          blocks: [
            { type: 'list', items: ['余额不足：在“钱包”确认余额，使用当前可用的充值入口增加余额，或改用有可用额度的套餐。', '套餐额度不足或套餐不可用：打开有效套餐详情核对状态和剩余额度；选择当前可购买的套餐，或将计费偏好改为可用来源。', '请求被拒绝：保留 HTTP 状态、错误信息和请求 ID，在使用日志确认是否产生记录；401 或 403 还需检查 API 密钥状态和访问权限。', '修正余额、套餐、计费偏好或密钥后，先发送一次最小请求验证；未修正前不要重复提交。'] },
          ],
        },
      ],
    },
    'models-pricing': {
      id: 'models-pricing',
      summary: '查找当前可用模型，核对能力和价格信息，为任务选择对应接口并处理模型错误。',
      prerequisites: ['可以登录 Partokens 账户', '使用 API 查询时已准备 `<YOUR_PARTOKENS_API_KEY>`'],
      sections: [
        {
          id: 'find-models',
          title: '查找模型',
          blocks: [
            { type: 'steps', items: [
              { title: '查看账户模型', body: '登录后打开顶部导航中的“模型”，查看当前账户显示的模型。' },
              { title: '查询密钥可用模型', body: '也可以使用 `<YOUR_PARTOKENS_API_KEY>` 调用模型列表接口，查看该密钥当前返回的模型。' },
              { title: '复制模型 ID', body: '从页面或响应的 `data[].id` 复制精确模型 ID，并在后续请求中原样使用 `<YOUR_MODEL_ID>`。' },
            ] },
            { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          ],
        },
        {
          id: 'check-capability-price',
          title: '核对能力与价格',
          blocks: [
            { type: 'list', items: ['在模型页面核对 `<YOUR_MODEL_ID>` 当前显示的端点、计费方式和价格信息。', '能力和价格缺失时不要根据模型名称补全，也不要从相似名称推测。', '调用前确认目标接口出现在该模型的当前能力信息中；价格选择以页面当时显示的账户数据为准。', '调用后的实际用量和扣减在控制台“使用日志”中核对。'] },
          ],
        },
        {
          id: 'choose-api',
          title: '选择调用接口',
          blocks: [
            { type: 'list', items: ['Chat Completions：模型明确支持聊天补全时，使用 `POST /v1/chat/completions` 发送消息列表。', 'Responses：模型明确支持 Responses 时，使用 `POST /v1/responses`；Codex 原生连接使用此接口。', '图像接口：模型明确支持图像能力时，使用 `POST /v1/images/generations` 生成图像；使用参考图编辑时由生图工作台调用图像编辑接口。', '同一模型不一定支持所有接口或可选参数；先用目标接口的最小请求验证。'] },
          ],
        },
        {
          id: 'resolve-model-errors',
          title: '处理模型问题',
          blocks: [
            { type: 'list', items: ['模型不可见：刷新模型页面；使用 API 时，确认 `GET /v1/models` 返回成功，并查看 `data` 是否为空。', '模型不可调用：确认请求使用了返回的精确 ID，并用同一 API 密钥重新查询模型列表；该密钥的列表中没有模型时不要猜测 ID。', '参数不兼容或 400：读取 `error.message`，移除非必要参数，按目标接口的最小字段重新请求。', '403：读取错误信息，检查 API 密钥状态、模型访问权限以及余额或套餐；修正后再请求。', '模型页面可见但调用仍失败：保留请求时间、模型 ID、HTTP 状态和请求 ID，再到使用日志核对记录。'] },
          ],
        },
      ],
    },
    codex: {
      id: 'codex',
      summary: '使用 Codex 原生 model provider 配置连接 Partokens，并通过最小命令验证 Responses 调用。',
      prerequisites: ['已创建 API 密钥 `<YOUR_PARTOKENS_API_KEY>`', '已取得支持 Responses 的模型 ID `<YOUR_MODEL_ID>`', 'Codex 已安装并可以运行'],
      sections: [
        {
          id: 'prepare-codex',
          title: '准备 Codex',
          blocks: [
            { type: 'list', items: ['运行 `codex --version`，确认当前终端可以启动 Codex。', '从账户模型页面或 `GET https://partokens.com/v1/models` 复制精确的 `<YOUR_MODEL_ID>`，并确认它支持 Responses。', '准备 Partokens API 密钥 `<YOUR_PARTOKENS_API_KEY>`。'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: '设置环境变量', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"` }] },
          ],
        },
        {
          id: 'configure-connection',
          title: '配置连接',
          blocks: [
            { type: 'steps', items: [
              { title: '打开用户配置', body: '编辑 `~/.codex/config.toml`，并保留其中仍需要的其他设置。' },
              { title: '添加 Partokens provider', body: '写入以下模型与 provider 配置；`env_key` 读取刚才设置的环境变量。' },
            ] },
            { type: 'code-samples', samples: [{ language: 'shell', label: '~/.codex/config.toml', code: `model = "<YOUR_MODEL_ID>"
model_provider = "partokens"

[model_providers.partokens]
name = "Partokens"
base_url = "https://partokens.com/v1"
env_key = "PARTOKENS_API_KEY"
wire_api = "responses"` }] },
          ],
        },
        {
          id: 'verify-call',
          title: '验证调用',
          blocks: [
            { type: 'code-samples', samples: [{ language: 'shell', label: '最小验证', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
codex exec "Reply only with: connection successful"` }] },
            { type: 'list', items: ['命令正常返回 `connection successful` 表示 Codex 已通过配置发送并完成请求。', '随后可在控制台“使用日志”按时间、模型和请求 ID 核对这次调用。'] },
          ],
        },
        {
          id: 'handle-failures',
          title: '处理失败',
          blocks: [
            { type: 'list', items: ['配置错误：Codex 无法读取配置或未使用预期模型时，检查 TOML 语法、`model_provider`、`<YOUR_MODEL_ID>`，并确认环境变量在运行命令的同一终端中已设置。', '连接错误：未收到 HTTP 状态时，检查网络、代理、DNS、TLS，以及 `base_url` 是否为 `https://partokens.com/v1`。', 'HTTP/API 错误：收到 400、401、403、429 或 5xx 时，保留状态、错误信息和请求 ID；先修正参数、密钥、权限或额度，再按错误类型决定是否重试。', '模型不支持 Responses：从当前模型列表重新选择明确支持 Responses 的模型；不要把 `wire_api` 改为其他值。'] },
          ],
        },
      ],
    },
    'image-studio': {
      id: 'image-studio',
      summary: '从控制台打开生图工作台，选择当前模型和密钥，生成或编辑图像并保存需要的结果。',
      prerequisites: ['可以登录 Partokens 控制台', '账户中有可用的图像模型和 API 密钥'],
      sections: [
        {
          id: 'open-studio',
          title: '打开工作台',
          blocks: [
            { type: 'steps', items: [
              { title: '进入控制台', body: '登录 Partokens，打开控制台。' },
              { title: '打开生图工作台', body: '在侧栏的“工作区”中选择“生图工作台”。' },
              { title: '确认工作区', body: '左侧为生成设置，右侧为本次生成结果。' },
            ] },
          ],
        },
        {
          id: 'select-model-key',
          title: '选择模型与密钥',
          blocks: [
            { type: 'steps', items: [
              { title: '选择模型', body: '在“模型”中选择当前列表提供的图像模型，并将该精确值作为 `<YOUR_MODEL_ID>`；不要手动猜写模型名。' },
              { title: '选择 API 密钥', body: '首次生成时，在“需要 API 密钥”窗口选择与该模型兼容的有效密钥，然后继续生成。' },
              { title: '没有可用密钥时', body: '使用窗口中的“创建密钥”，或打开“API 密钥”页面后创建可用于所选模型的密钥，再返回工作台。' },
            ] },
          ],
        },
        {
          id: 'generate-edit',
          title: '生成或编辑图像',
          blocks: [
            { type: 'steps', items: [
              { title: '填写提示词', body: '在“提示词”中描述需要生成或编辑的图像。' },
              { title: '设置输出', body: '从界面提供的选项中选择质量、图像尺寸和生成数量。' },
              { title: '按需添加参考图', body: '上传 PNG、JPG 或 WebP 参考图进行编辑；也可以对生成结果选择“用作参考图”。' },
              { title: '开始任务', body: '选择“生成”，等待结果区域显示图像；若模型不接受某项设置，改用该模型当前提供的选项后再试。' },
            ] },
          ],
        },
        {
          id: 'save-handle-failures',
          title: '保存与处理失败',
          blocks: [
            { type: 'list', items: ['保存结果：在需要保留的图像上选择下载；下一次生成会替换当前显示的结果。', '生成失败或参数不支持：读取页面错误，改用当前模型提供的质量、尺寸或数量，并移除不兼容设置。', '401：检查所选 API 密钥是否仍然有效；403：检查密钥对模型的访问、账户余额和套餐。修正前不要重复生成。', '429：按响应提示等待后再重试；5xx：保留请求信息，仅在有限次数和总时限内退避重试。'] },
            { type: 'callout', tone: 'warning', title: '取消或超时后先查日志', body: '离开生成中的页面并确认停止，或等待超时后，先到控制台“使用日志”按时间、模型和请求 ID 核对是否形成记录和扣减，再决定是否重试。' },
          ],
        },
      ],
    },
    'first-request': {
      id: 'first-request',
      summary: '准备 API 密钥、Base URL 和模型 ID，发送一次最小聊天请求并确认返回文本。',
      prerequisites: ['已创建 Partokens API 密钥', '已从账户模型列表取得可用模型 ID'],
      sections: [
        {
          id: 'prepare',
          title: '准备接入',
          blocks: [
            { type: 'list', items: ['准备 API 密钥 `<YOUR_PARTOKENS_API_KEY>`。', '使用 Base URL `https://partokens.com/v1`。', '从账户模型列表复制准确的模型 ID `<YOUR_MODEL_ID>`。'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: '设置环境变量', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
export PARTOKENS_MODEL="<YOUR_MODEL_ID>"` }] },
          ],
        },
        {
          id: 'send',
          title: '发送请求',
          blocks: [
            { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
            { type: 'code-samples', samples: firstRequestSamples },
          ],
        },
        {
          id: 'read',
          title: '读取响应',
          blocks: [{ type: 'list', items: ['先检查 HTTP 状态，再解析 JSON。', '读取第一条聊天文本：`choices[0].message.content`。', '如果 `choices` 为空或文本为空，将响应视为没有可用结果。'] }],
        },
        {
          id: 'failures',
          title: '处理失败',
          blocks: [{ type: 'list', items: ['401：检查 Bearer 密钥是否完整、有效且来自当前环境。', '400：根据 `error.message` 修正模型、消息或 JSON 字段。', '429：等待 `Retry-After`；未提供时使用带抖动的指数退避。', '5xx：在有限次数和总时限内退避重试。', '连接错误或超时：先确认是否收到 HTTP 响应；聊天请求不要无条件重复发送。'] }],
        },
      ],
    },
    clients: {
      id: 'clients',
      summary: '按使用场景选择 Shell、OpenAI SDK 或支持自定义 Base URL 的兼容客户端，并用同一组连接参数验证调用。',
      prerequisites: ['已创建 Partokens API 密钥', '已取得可用模型 ID'],
      sections: [
        {
          id: 'choose',
          title: '选择客户端',
          blocks: [{ type: 'list', items: ['Shell / cURL：用于连通性检查、自动化脚本和问题复现。', 'OpenAI JavaScript SDK：用于 Node.js 服务和脚本。', 'OpenAI Python SDK：用于 Python 服务和脚本。', 'Codex：用于编码任务，调用支持 Responses API 的模型。', '支持自定义 OpenAI Base URL 的兼容客户端：用于已有客户端迁移；客户端必须提供 Base URL、Bearer 密钥和模型 ID 设置。'] }],
        },
        {
          id: 'configure',
          title: '配置连接',
          blocks: [
            { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
            { type: 'list', items: ['Bearer 密钥使用 `<YOUR_PARTOKENS_API_KEY>`，通过 `Authorization: Bearer ...` 发送。', '模型填写账户返回的精确 ID `<YOUR_MODEL_ID>`。', '模型发现调用 `GET /v1/models`；Shell、SDK 和兼容客户端使用 `POST /v1/chat/completions` 验证聊天，Codex 使用 `POST /v1/responses`。'] },
          ],
        },
        {
          id: 'verify',
          title: '验证调用',
          blocks: [
            { type: 'code-samples', samples: firstRequestSamples },
            { type: 'list', items: ['兼容客户端先执行 `GET https://partokens.com/v1/models`，再用同一密钥和模型 ID 发送聊天请求。', 'Shell、JavaScript、Python 和兼容客户端确认 HTTP 成功且能读取 `choices[0].message.content`。', 'Codex 完成 Base URL、密钥和模型配置后运行 `codex exec "只回复：连接成功"`。'] },
          ],
        },
        {
          id: 'troubleshoot',
          title: '处理问题',
          blocks: [{ type: 'list', items: ['客户端配置错误：请求未发出，或 URL、Bearer 头、模型字段不正确；修正配置后重试。', '网络错误：没有收到 HTTP 状态，检查 DNS、TLS、代理和连接超时。', 'API 错误：收到 HTTP 状态和 JSON `error`；按 401、400、429 或 5xx 处理，不要把 API 错误当作客户端崩溃。'] }],
        },
      ],
    },
    'api-keys': {
      id: 'api-keys',
      summary: '在控制台创建 API 密钥，安全配置到运行环境，并按顺序轮换或撤销旧密钥。',
      prerequisites: ['可以登录 Partokens 控制台'],
      sections: [
        {
          id: 'create',
          title: '创建密钥',
          blocks: [{ type: 'steps', items: [
            { title: '打开密钥管理', body: '登录控制台，进入 API 密钥页面并选择“创建密钥”。' },
            { title: '填写必要设置', body: '填写名称并选择分组；按需要设置额度上限和过期时间。' },
            { title: '保存密钥', body: '提交后在密钥列表使用“显示完整值”或“复制”获取凭据，并立即放入安全的运行环境。' },
          ] }],
        },
        {
          id: 'configure',
          title: '配置密钥',
          blocks: [
            { type: 'list', items: ['服务端优先使用环境变量或密钥管理系统，不要写入仓库、URL、日志或浏览器代码。', '请求头使用 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: '设置环境变量', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"` }] },
          ],
        },
        {
          id: 'rotate',
          title: '轮换与撤销',
          blocks: [{ type: 'steps', items: [
            { title: '创建新密钥', body: '为同一应用创建替代密钥，并安全保存。' },
            { title: '先验证新密钥', body: '只替换一个受控环境，调用 `GET /v1/models` 确认新密钥可用。' },
            { title: '替换所有使用方', body: '更新服务、任务和密钥管理系统中的旧值，确认新配置已生效。' },
            { title: '停用旧密钥', body: '在密钥列表的操作菜单中选择“禁用”暂停，或选择“删除”移除旧密钥。' },
          ] }],
        },
        {
          id: 'exceptions',
          title: '处理异常',
          blocks: [{ type: 'list', items: ['401：检查环境变量、Bearer 头和密钥状态；确认没有使用旧值。', '403：检查密钥所属分组、访问范围或可用状态；修正后再请求。', '疑似泄露：立即停用或删除疑似密钥，创建并验证新密钥，再替换所有使用方。', '密钥失效、停用或耗尽后：不要反复重试，创建替代密钥并重新验证。'] }],
        },
      ],
    },
    sdk: {
      id: 'sdk',
      summary: '安装 OpenAI JavaScript 或 Python SDK，配置 Partokens Base URL 和密钥，发送最小聊天请求并读取文本。',
      prerequisites: ['Node.js 或 Python 运行环境', '已创建 Partokens API 密钥', '已取得模型 ID'],
      sections: [
        {
          id: 'install',
          title: '安装 SDK',
          blocks: [
            { type: 'paragraph', text: '在服务端项目中安装当前支持的 OpenAI SDK。' },
            { type: 'code-samples', samples: [{ language: 'shell', label: '安装与环境变量', code: `npm install openai
python -m pip install openai

export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
export PARTOKENS_MODEL="<YOUR_MODEL_ID>"` }] },
          ],
        },
        {
          id: 'configure',
          title: '配置客户端',
          blocks: [
            { type: 'list', items: ['JavaScript 使用 `apiKey` 和 `baseURL`。', 'Python 使用 `api_key` 和 `base_url`。', '两个 SDK 的 Base URL 都设置为 `https://partokens.com/v1`，模型使用 `<YOUR_MODEL_ID>` 对应的环境变量值。'] },
            { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          ],
        },
        {
          id: 'send-read',
          title: '发送并读取请求',
          blocks: [{ type: 'code-samples', samples: [conciseSdkJavaScriptSample, conciseSdkPythonSample] }],
        },
        {
          id: 'errors',
          title: '处理错误',
          blocks: [{ type: 'list', items: ['连接错误：检查 DNS、TLS、代理和网络后再重试。', 'HTTP 错误：读取状态、`error.message` 和 `X-Oneapi-Request-Id`，先修正 400、401 或 403。', '429：遵循 `Retry-After`，否则使用带抖动的指数退避。', '5xx：设置最大次数和总时限后退避重试。', '超时：设置 SDK 超时时间；聊天请求可能已经执行，确认使用记录后再决定是否重试。'] }],
        },
      ],
    },
  },
  en: {
    welcome: {
      id: 'welcome',
      summary: 'Choose an integration method, prepare the account, API key, and live model ID, then complete one minimal call.',
      sections: [
        {
          id: 'choose-path',
          title: 'Choose an integration path',
          blocks: [
            { type: 'paragraph', text: 'Every integration method uses the same account access, API key, model ID, and OpenAI-compatible Base URL. Choose the shortest path for the current task.' },
            { type: 'list', items: ['Shell / cURL: first connectivity checks and reproductions.', 'OpenAI JavaScript or Python SDK: services, scripts, and existing SDK projects.', 'A client with a custom OpenAI Base URL: existing tools that expose Base URL, Bearer key, and model ID settings.', 'Console workspaces: direct access to the chat or image capabilities currently available to the account.'] },
          ],
        },
        {
          id: 'prepare-access',
          title: 'Prepare the account and key',
          blocks: [
            { type: 'steps', items: [
              { title: 'Create an API key', body: 'Sign in to the console, open API keys, create a key, and store it securely as `<YOUR_PARTOKENS_API_KEY>`.' },
              { title: 'Copy a live model ID', body: 'Open Models in the top navigation, or call the models endpoint with that key, then copy the exact current ID as `<YOUR_MODEL_ID>`.' },
              { title: 'Store the connection details', body: 'Keep the key in an environment variable or secret manager; do not put it in a repository, URL, log, or browser code.' },
            ] },
            { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
          ],
        },
        {
          id: 'complete-first-call',
          title: 'Complete the first call',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open the first integration guide', body: 'Go to Quick start: first integration and choose the Shell, JavaScript, or Python example.' },
              { title: 'Replace the connection values', body: 'Keep the common Base URL and provide `<YOUR_PARTOKENS_API_KEY>` and `<YOUR_MODEL_ID>`.' },
              { title: 'Confirm the result', body: 'Send the minimal request, check the HTTP status first, and confirm that the response contains a readable result. Keep the request time, status, and request ID on failure.' },
            ] },
            { type: 'callout', tone: 'success', title: 'Verify the minimum first', body: 'After the minimal request succeeds, connect the application and add optional parameters one at a time. This page does not repeat the full request example.' },
          ],
        },
        {
          id: 'continue-reading',
          title: 'Continue with the docs',
          blocks: [
            { type: 'list', items: ['Understand the service scope: What is Partokens?', 'Manage credentials: API key management.', 'Choose models and check prices: Models and pricing and Models API.', 'Configure an SDK or client: SDK setup, Supported clients, or Codex and CLI setup.', 'Investigate requests and deductions: Connection, limits, and retries and Usage logs.', 'Get help after self-service checks: Contact support.'] },
          ],
        },
      ],
    },
    overview: {
      id: 'overview',
      summary: 'Partokens provides OpenAI-compatible API access to the models and capabilities currently available to an account.',
      sections: [
        {
          id: 'confirm-scope',
          title: 'Confirm the service scope',
          blocks: [
            { type: 'paragraph', text: 'Partokens provides a common OpenAI-compatible Base URL, an account console, and public API documentation. Applications can send requests through HTTPS, OpenAI SDKs, or clients with a custom Base URL.' },
            { type: 'callout', tone: 'info', title: 'Compatibility is not identity', body: 'OpenAI compatibility lets you reuse common connection methods and request shapes. It does not make every account, model, endpoint, or optional parameter available.' },
          ],
        },
        {
          id: 'choose-entry',
          title: 'Choose an API entry point',
          blocks: [
            { type: 'list', items: ['View models: open Models for the account or call `GET /v1/models`.', 'Send a model request: choose the endpoint that matches the model\'s current capability from the relevant API page, then start with required fields only.', 'Use an SDK or compatible client: set the Base URL to `https://partokens.com/v1` and provide a Partokens Bearer key and exact model ID.', 'Try a capability directly: sign in to the console and use a currently available chat or image workspace.'] },
          ],
        },
        {
          id: 'check-live-data',
          title: 'Check live information',
          blocks: [
            { type: 'steps', items: [
              { title: 'Check models and endpoints', body: 'Use the current account Models page or the model list returned with the same key.' },
              { title: 'Check prices and quota', body: 'Use current account information, Usage logs after the call, and the actual deduction.' },
              { title: 'Check parameters', body: 'Use the relevant API page and the target model\'s actual response. Do not infer support from a model name or another service.' },
            ] },
            { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          ],
        },
        {
          id: 'verify-compatibility',
          title: 'Verify compatibility',
          blocks: [
            { type: 'steps', items: [
              { title: 'Confirm the client settings', body: 'Confirm that the client exposes Base URL, Bearer key, and exact model ID settings.' },
              { title: 'Run a minimal request on the target endpoint', body: 'Use `<YOUR_PARTOKENS_API_KEY>` and `<YOUR_MODEL_ID>` with only the endpoint\'s core fields.' },
              { title: 'Add capabilities one at a time', body: 'After the minimum succeeds, add optional parameters individually and use each actual response to confirm support.' },
            ] },
            { type: 'callout', tone: 'warning', title: 'Use the actual response', body: 'A visible model or configurable client only confirms an integration prerequisite. The target model\'s response on the target endpoint and parameters is the compatibility result.' },
          ],
        },
      ],
    },
    faq: {
      id: 'faq',
      summary: 'Answers to integration, account, model, usage, and common failure questions, with the live sources to check.',
      sections: [
        {
          id: 'choose-integration',
          title: 'Choose an integration method',
          blocks: [{ type: 'faq', items: [
            { question: 'Can I keep using an OpenAI SDK?', answer: 'Yes. Set the Base URL to `https://partokens.com/v1`, use a Partokens API key, and provide the exact model ID currently returned for the account.' },
            { question: 'Should I use Shell, an SDK, or a compatible client?', answer: 'Use Shell for minimal checks and reproductions, an SDK for services and scripts, and an existing client only when it exposes Base URL, Bearer key, and model ID settings.' },
            { question: 'Where are the complete request examples?', answer: 'Use Quick start: first integration for a first call, and the relevant API page for fields and response shapes.' },
          ] }],
        },
        {
          id: 'manage-account',
          title: 'Manage keys and account',
          blocks: [{ type: 'faq', items: [
            { question: 'Where should I store the API key?', answer: 'Store `<YOUR_PARTOKENS_API_KEY>` in an environment variable or secret manager. Do not put it in a repository, URL, log, or browser code.' },
            { question: 'How do I rotate a key?', answer: 'Create and verify a replacement first, update every consumer, then disable or delete the old key in the console. Act on the old key immediately if exposure is suspected.' },
            { question: 'Where do I check balance, plans, and available quota?', answer: 'Use the current account pages, the request\'s actual response, Usage logs, and the actual deduction.' },
          ] }],
        },
        {
          id: 'check-model-usage',
          title: 'Check models and usage',
          blocks: [{ type: 'faq', items: [
            { question: 'Which model ID should I use?', answer: 'Copy the exact current ID from Models or `GET /v1/models` and use it unchanged as `<YOUR_MODEL_ID>`. Do not guess a model name.' },
            { question: 'Does a listed model support every endpoint and parameter?', answer: 'Do not make that assumption. Check the model\'s current capability and verify each target endpoint and parameter with a minimal request and its actual response.' },
            { question: 'Does a Usage log record mean the call succeeded?', answer: 'Not necessarily. Also review the record type, the HTTP status and error kept by the client, tokens, cost, and duration.' },
          ] }],
        },
        {
          id: 'resolve-common-failures',
          title: 'Resolve common failures',
          blocks: [{ type: 'faq', items: [
            { question: 'What should I check first when a request fails?', answer: 'Use `GET https://partokens.com/v1/models` to check connection and authentication, then correct the request according to 400, 401, 403, 429, or 5xx. Keep the time, timezone, endpoint, model, and request ID.' },
            { question: 'Can every failure be retried immediately?', answer: 'No. Correct 400, 401, and 403 first. Follow `Retry-After` or back off for 429. Retry 5xx only a limited number of times and only when replay is safe.' },
            { question: 'What should I do after cancellation or timeout?', answer: 'First search Usage logs by time, model, key name, and request ID and review any deduction, then decide whether to retry.' },
            { question: 'When should I contact support?', answer: 'After completing the checks in Connection, limits, and retries and Usage logs, use Contact support to prepare redacted diagnostic information.' },
          ] }],
        },
      ],
    },
    troubleshooting: {
      id: 'troubleshooting',
      summary: 'Run a minimal models request first, then use the HTTP status to choose a correction and retry policy.',
      prerequisites: ['A Partokens API key', 'Access to the command\'s HTTP status, response headers, and response body'],
      sections: [
        {
          id: 'run-minimal-check',
          title: 'Run a minimal check',
          blocks: [
            { type: 'paragraph', text: 'The `GET /v1/models` request below does not start a generation task. Use it to check DNS, TLS, proxy settings, the Base URL, and authentication. The command also shows response headers so you can keep the request ID.' },
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Connection and authentication check', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"

curl --silent --show-error --include \\
  https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY"` }] },
          ],
        },
        {
          id: 'fix-by-status',
          title: 'Fix issues by status',
          blocks: [
            { type: 'list', items: ['Connection error: when no HTTP status arrives, check the network, DNS, TLS, proxy, connection timeout, and that the URL is exactly `https://partokens.com/v1/models`.', '400: use the returned error to correct JSON, required fields, model ID, or target endpoint. Do not repeat the request unchanged.', '401: confirm that the environment variable is set, the Bearer header is complete, the key is not truncated, and the key remains enabled in the console.', '403: use the returned error to check key access, model availability, and the account\'s current balance or plan, then correct the issue before retrying.', '429: follow `Retry-After` when present. Otherwise reduce concurrency and use jittered exponential backoff.', '5xx: keep the request ID and use bounded backoff only when the request is safe to replay.'] },
            { type: 'callout', tone: 'info', title: 'Status is the starting point', body: 'The same status can have different causes. Use the response body, request ID, current account information, and Usage logs for the final diagnosis.' },
          ],
        },
        {
          id: 'decide-retry',
          title: 'Decide whether to retry',
          blocks: [
            { type: 'list', items: ['Retry: a temporary connection failure for `GET /v1/models`, 429 after the required wait, or a temporary 5xx. Set a total deadline and maximum attempt count.', 'Correct first: 400, 401, 403, and failures clearly caused by a model, endpoint, parameter, key, or account state.', 'Check logs first: client cancellation or timeout does not prove that a request did not run. Search Usage logs by time, model, key name, and request ID, then review any deduction.', 'Avoid duplicate work: automatically retry chat, image generation, or image edits only when duplicate results and usage are acceptable.'] },
            { type: 'callout', tone: 'warning', title: 'Do not replay immediately after cancellation or timeout', body: 'If Usage logs show execution or a deduction, review the result and request ID first. When the outcome remains unclear, prepare diagnostic information and contact support.' },
          ],
        },
        {
          id: 'prepare-diagnostics',
          title: 'Prepare diagnostics',
          blocks: [
            { type: 'steps', items: [
              { title: 'Record the request', body: 'Keep the exact time and timezone, model, endpoint, HTTP status, and request ID.' },
              { title: 'Keep a redacted error', body: 'Preserve enough error text to explain the issue and remove credentials, personal information, complete prompts, and private files.' },
              { title: 'Review Usage logs', body: 'State whether a matching record was found and keep the time range, model, key name, and request ID used to search.' },
              { title: 'Write a minimal reproduction', body: 'List the fewest steps, expected result, and actual result, then use Contact support to select an official channel.' },
            ] },
            { type: 'callout', tone: 'warning', title: 'Do not submit credentials', body: 'Support information must not contain a complete API key, password, verification code, or session token.' },
          ],
        },
      ],
    },
    'usage-logs': {
      id: 'usage-logs',
      summary: 'Find calls in the console and review type, errors, tokens, cost, duration, and deductions.',
      sections: [
        {
          id: 'open-logs',
          title: 'Open Usage logs',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open the console', body: 'Sign in to Partokens and open the console.' },
              { title: 'Open Usage logs', body: 'In the General section of the sidebar, select Usage logs.' },
              { title: 'Refresh current data', body: 'Select Refresh when you need to retrieve current records, then start from the request time.' },
            ] },
            { type: 'paragraph', text: 'Usage logs help correlate account calls and events. Also keep the HTTP status, response headers, and redacted error received by the client.' },
          ],
        },
        {
          id: 'filter-requests',
          title: 'Filter requests',
          blocks: [
            { type: 'steps', items: [
              { title: 'Choose a time range', body: 'Choose a range that includes the request time and confirm the timezone used by the log and client timestamps.' },
              { title: 'Choose a model', body: 'Use the model filter to narrow the results. The model ID must exactly match the request value.' },
              { title: 'Search by key name', body: 'Open the exact search field menu, choose API key name, and enter the name shown in the log. Do not enter the key value.' },
              { title: 'Search by request ID', body: 'Open the exact search field menu, choose Request ID, and enter the complete request ID.' },
            ] },
            { type: 'list', items: ['Use only the conditions needed to locate the record. If there is no result, check the time range, timezone, and exact values first.', 'Clear filters that do not apply before searching again so an old condition does not exclude the record.'] },
          ],
        },
        {
          id: 'review-results',
          title: 'Review results and deductions',
          blocks: [
            { type: 'list', items: ['Type and error: use Type to distinguish usage and error events. For an error event, correlate its time and request ID with the HTTP status and redacted error kept by the client.', 'Tokens: review input, output, and cached tokens. Do not calculate fields that are absent or not applicable.', 'Cost: review the record cost and the filtered cost total, then compare them with the account deduction.', 'Duration: review total duration. Streaming calls may also show time to first token.', 'Details: open the matching record and confirm that request ID, time, model, key name, tokens, cost, and duration belong to the same call.'] },
            { type: 'callout', tone: 'info', title: 'A record is not proof of success', body: 'Logs can contain usage, error, or other account events. Use the type, client result, and actual deduction together to determine the outcome.' },
          ],
        },
        {
          id: 'handle-failures',
          title: 'Handle failures and timeouts',
          blocks: [
            { type: 'steps', items: [
              { title: 'Correlate the failed record', body: 'Use the exact time, model, key name, and request ID, then compare the record with the client HTTP status and redacted error.' },
              { title: 'Check whether usage was recorded', body: 'Review tokens, cost, and duration to determine whether the request left execution and deduction records.' },
              { title: 'Treat cancellation or timeout carefully', body: 'Cancellation or timeout does not prove that processing stopped. Review logs and deductions before retrying.' },
              { title: 'Prepare support information', body: 'If the outcome remains unclear, keep the search time range, timezone, and filters, then open Contact support.' },
            ] },
            { type: 'callout', tone: 'warning', title: 'Do not search with a secret', body: 'Filter by key name, not the complete API key. Before reporting a problem, remove credentials, personal information, complete prompts, and private files.' },
          ],
        },
      ],
    },
    'contact-support': {
      id: 'contact-support',
      summary: 'After self-service checks, send a correlatable and redacted report through Partokens Email or Telegram support.',
      sections: [
        {
          id: 'check-before-contact',
          title: 'Complete pre-contact checks',
          blocks: [
            { type: 'steps', items: [
              { title: 'Reproduce the minimum', body: 'For an API issue, run the minimal check in Connection, limits, and retries and record the actual HTTP status.' },
              { title: 'Check the model and account', body: 'Confirm that the model comes from the current list, then check the key status, access, and current account information.' },
              { title: 'Search Usage logs', body: 'Search by time, model, key name, and request ID, then review tokens, cost, and duration.' },
              { title: 'Confirm that help is still needed', body: 'State the checks already completed, expected result, and actual result instead of reporting only that something is unavailable.' },
            ] },
            { type: 'list', items: ['Sign-in or account issue: keep the page, exact time and timezone, and redacted error.', 'API issue: keep the endpoint, model, HTTP status, and request ID.', 'Cancellation or timeout: first state whether Usage logs contain a record and deduction.'] },
          ],
        },
        {
          id: 'prepare-diagnostics',
          title: 'Prepare diagnostic information',
          blocks: [
            { type: 'list', items: ['Exact time and timezone of the request or issue.', 'Exact model ID used by the request.', 'API endpoint or console page where the issue occurred.', 'Actual HTTP status, or a clear statement that no response arrived.', 'Complete request ID, or a clear statement that none was returned.', 'A redacted error that preserves the meaning of the failure.', 'Minimal reproduction steps, expected result, and actual result.', 'Whether a matching Usage log record was found, including the tokens, cost, and duration reviewed.'] },
          ],
        },
        {
          id: 'remove-sensitive-data',
          title: 'Remove sensitive data',
          blocks: [
            { type: 'list', items: ['Do not submit an API key or any other access credential.', 'Do not submit passwords, verification codes, recovery codes, cookies, or session tokens.', 'Do not submit names, email addresses, phone numbers, addresses, identity details, or other personal information.', 'Do not submit complete prompts, complete request bodies, or raw content unrelated to the reproduction.', 'Do not submit private files, private download URLs, large Base64 values, or unreviewed log exports.'] },
            { type: 'callout', tone: 'warning', title: 'Rotate a key before reporting suspected exposure', body: 'Disable or delete the affected key immediately, create and verify a replacement, then update every consumer. Do not send the old key to a support channel.' },
          ],
        },
        {
          id: 'use-official-channels',
          title: 'Use official support channels',
          blocks: [
            { type: 'paragraph', text: 'Choose either public support channel below and include the minimum redacted diagnostic information in the first message. The documentation does not promise a response or resolution time.' },
            { type: 'links', items: [
              { label: 'Email support', href: 'mailto:support@partokens.com' },
              { label: 'Telegram support bot', href: 'https://t.me/PartokensSupportBot' },
            ] },
          ],
        },
      ],
    },
    billing: {
      id: 'billing',
      summary: 'Review balance, plans, and usage in the console, choose a billing source, and recover from insufficient quota.',
      prerequisites: ['Access to the Partokens console'],
      sections: [
        {
          id: 'view-balance-plan',
          title: 'View balance and plan',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open Wallet', body: 'Sign in to the console and select Wallet under Account in the sidebar.' },
              { title: 'Review account status', body: 'At the top of the page, review the account balance, total usage, and active plan count.' },
              { title: 'Review plan quota', body: 'In Choose a plan, select View active and check each plan status, total quota, remaining quota, and used percentage.' },
            ] },
            { type: 'list', items: ['Account balance shows the currently available balance.', 'Total usage shows usage already recorded for the account.', 'Active plan details show plans that can still be used and their remaining quota.'] },
          ],
        },
        {
          id: 'choose-billing-source',
          title: 'Choose a billing source',
          blocks: [
            { type: 'steps', items: [
              { title: 'Find the preference', body: 'At the bottom of Choose a plan on Wallet, find Usage billing preference. You can change it while an active plan is available.' },
              { title: 'Choose the current preference', body: 'Select Subscription first, Balance first, Subscription only, or Balance only, then wait for the update to succeed before calling the API.' },
            ] },
            { type: 'list', items: ['Subscription first and Balance first select which source is tried first.', 'Subscription only and Balance only restrict usage to that source.', 'Confirm that the selected source is currently available before changing the preference.'] },
          ],
        },
        {
          id: 'review-usage',
          title: 'Review usage',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open Usage logs', body: 'In the console sidebar, select Usage logs under General.' },
              { title: 'Narrow the time and model', body: 'Select a range that covers the call, then select the model. For an exact lookup, change the search field to Request ID and enter the complete request ID.' },
              { title: 'Compare the call and deduction', body: 'Open the matching record and review its time, type, model, error, usage, cost, and request ID, then compare it with the balance or remaining plan quota in Wallet.' },
            ] },
          ],
        },
        {
          id: 'resolve-insufficient-quota',
          title: 'Resolve insufficient quota',
          blocks: [
            { type: 'list', items: ['Insufficient balance: check Wallet and use the currently available top-up option, or switch to a plan with available quota.', 'Insufficient or unavailable plan: open active plan details and check its status and remaining quota; choose a currently available plan or change the billing preference to an available source.', 'Rejected request: keep the HTTP status, error, and request ID, then check Usage logs for a record. For 401 or 403, also check the API key status and access.', 'After correcting the balance, plan, billing preference, or key, send one minimal request first. Do not resubmit unchanged requests.'] },
          ],
        },
      ],
    },
    'models-pricing': {
      id: 'models-pricing',
      summary: 'Find currently available models, review capability and pricing information, choose the matching API, and resolve model errors.',
      prerequisites: ['Access to a Partokens account', 'The API key `<YOUR_PARTOKENS_API_KEY>` when querying through the API'],
      sections: [
        {
          id: 'find-models',
          title: 'Find models',
          blocks: [
            { type: 'steps', items: [
              { title: 'View account models', body: 'After signing in, open Models from the top navigation to see the models currently shown for the account.' },
              { title: 'Query models for a key', body: 'You can also call the models endpoint with `<YOUR_PARTOKENS_API_KEY>` to see the models currently returned for that key.' },
              { title: 'Copy the model ID', body: 'Copy the exact model ID from the page or `data[].id`, and use it unchanged as `<YOUR_MODEL_ID>` in later requests.' },
            ] },
            { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          ],
        },
        {
          id: 'check-capability-price',
          title: 'Check capabilities and price',
          blocks: [
            { type: 'list', items: ['On the Models page, review the endpoints, billing mode, and pricing information currently shown for `<YOUR_MODEL_ID>`.', 'When capability or price information is absent, do not infer it from the model name or a similar name.', 'Before calling, confirm that the target API appears in the model\'s current capability information. Use the account data shown at that time for price selection.', 'Review actual usage and deductions in Usage logs after the call.'] },
          ],
        },
        {
          id: 'choose-api',
          title: 'Choose an API',
          blocks: [
            { type: 'list', items: ['Chat Completions: when the model explicitly supports chat completions, send a message list to `POST /v1/chat/completions`.', 'Responses: when the model explicitly supports Responses, use `POST /v1/responses`; native Codex connections use this API.', 'Image API: when the model explicitly supports images, use `POST /v1/images/generations` to generate an image. Image Studio uses the image edit API when a reference image is supplied.', 'A model may not support every API or optional parameter. Start with a minimal request to the target API.'] },
          ],
        },
        {
          id: 'resolve-model-errors',
          title: 'Resolve model issues',
          blocks: [
            { type: 'list', items: ['Model not visible: refresh Models. When using the API, confirm that `GET /v1/models` succeeded and check whether `data` is empty.', 'Model not callable: use the exact returned ID and query the model list again with the same API key. Do not guess an ID when that key receives an empty list.', 'Incompatible parameter or 400: read `error.message`, remove optional parameters, and retry with the minimum fields for the target API.', '403: read the error, then check the API key status, model access, and balance or plan before trying again.', 'Model visible but still failing: keep the request time, model ID, HTTP status, and request ID, then find the record in Usage logs.'] },
          ],
        },
      ],
    },
    codex: {
      id: 'codex',
      summary: 'Connect native Codex to Partokens with a model provider configuration and verify the Responses call with a minimal command.',
      prerequisites: ['The API key `<YOUR_PARTOKENS_API_KEY>`', 'A Responses-capable model ID `<YOUR_MODEL_ID>`', 'Codex installed and runnable'],
      sections: [
        {
          id: 'prepare-codex',
          title: 'Prepare Codex',
          blocks: [
            { type: 'list', items: ['Run `codex --version` and confirm that Codex starts in the current terminal.', 'Copy the exact `<YOUR_MODEL_ID>` from the account Models page or `GET https://partokens.com/v1/models`, and confirm that it supports Responses.', 'Prepare the Partokens API key `<YOUR_PARTOKENS_API_KEY>`.'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Set the environment variable', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"` }] },
          ],
        },
        {
          id: 'configure-connection',
          title: 'Configure the connection',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open user configuration', body: 'Edit `~/.codex/config.toml` and keep any other settings you still need.' },
              { title: 'Add the Partokens provider', body: 'Add the model and provider configuration below. `env_key` reads the environment variable set above.' },
            ] },
            { type: 'code-samples', samples: [{ language: 'shell', label: '~/.codex/config.toml', code: `model = "<YOUR_MODEL_ID>"
model_provider = "partokens"

[model_providers.partokens]
name = "Partokens"
base_url = "https://partokens.com/v1"
env_key = "PARTOKENS_API_KEY"
wire_api = "responses"` }] },
          ],
        },
        {
          id: 'verify-call',
          title: 'Verify the call',
          blocks: [
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Minimal verification', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
codex exec "Reply only with: connection successful"` }] },
            { type: 'list', items: ['A normal `connection successful` result confirms that Codex sent and completed the request through this configuration.', 'You can then find the call in Usage logs by its time, model, and request ID.'] },
          ],
        },
        {
          id: 'handle-failures',
          title: 'Handle failures',
          blocks: [
            { type: 'list', items: ['Configuration error: if Codex cannot read the file or uses an unexpected model, check the TOML syntax, `model_provider`, and `<YOUR_MODEL_ID>`, and confirm that the environment variable is set in the same terminal.', 'Connection error: when no HTTP status arrives, check the network, proxy, DNS, TLS, and that `base_url` is `https://partokens.com/v1`.', 'HTTP/API error: for 400, 401, 403, 429, or 5xx, keep the status, error, and request ID. Correct parameters, key, access, or quota before deciding whether to retry.', 'Model does not support Responses: select a currently listed model that explicitly supports Responses. Do not change `wire_api` to another value.'] },
          ],
        },
      ],
    },
    'image-studio': {
      id: 'image-studio',
      summary: 'Open Image Studio from the console, select a current model and key, generate or edit images, and save the results you need.',
      prerequisites: ['Access to the Partokens console', 'An available image model and API key'],
      sections: [
        {
          id: 'open-studio',
          title: 'Open the workspace',
          blocks: [
            { type: 'steps', items: [
              { title: 'Open the console', body: 'Sign in to Partokens and open the console.' },
              { title: 'Open Image Studio', body: 'In the sidebar, select Image studio under Workspace.' },
              { title: 'Check the workspace', body: 'Generation settings are on the left and the current result set is on the right.' },
            ] },
          ],
        },
        {
          id: 'select-model-key',
          title: 'Select a model and key',
          blocks: [
            { type: 'steps', items: [
              { title: 'Select a model', body: 'In Model, choose an image model from the current list and use that exact value as `<YOUR_MODEL_ID>`. Do not guess a model name.' },
              { title: 'Select an API key', body: 'On the first generation, choose an active key compatible with the model in the API key required dialog, then continue generating.' },
              { title: 'When no key is available', body: 'Use Create key in the dialog, or open API keys and create a key for the selected model before returning to Image Studio.' },
            ] },
          ],
        },
        {
          id: 'generate-edit',
          title: 'Generate or edit images',
          blocks: [
            { type: 'steps', items: [
              { title: 'Enter a prompt', body: 'Describe the image to generate or edit in Prompt.' },
              { title: 'Set the output', body: 'Choose quality, image size, and number of images from the options shown.' },
              { title: 'Add a reference when needed', body: 'Upload a PNG, JPG, or WebP image to edit it, or choose Use as reference on a generated result.' },
              { title: 'Start the task', body: 'Select Generate and wait for images in Results. If the model rejects a setting, choose one of the options currently provided for that model.' },
            ] },
          ],
        },
        {
          id: 'save-handle-failures',
          title: 'Save and handle failures',
          blocks: [
            { type: 'list', items: ['Save a result: choose Download image on every image you need to keep. The next generation replaces the displayed result set.', 'Generation failure or unsupported parameter: read the page error, choose a quality, size, or count offered for the current model, and remove incompatible settings.', '401: check that the selected API key is still valid. 403: check key access to the model and the account balance or plan. Do not regenerate until corrected.', '429: wait as directed before retrying. For 5xx, keep the request details and use bounded backoff with a total deadline.'] },
            { type: 'callout', tone: 'warning', title: 'Check logs after cancellation or timeout', body: 'After leaving an active generation and confirming Stop, or after a timeout, first check Usage logs by time, model, and request ID for a record and deduction, then decide whether to retry.' },
          ],
        },
      ],
    },
    'first-request': {
      id: 'first-request',
      summary: 'Prepare an API key, Base URL, and model ID, send one minimal chat request, and confirm the returned text.',
      prerequisites: ['A Partokens API key', 'A model ID available to the account'],
      sections: [
        {
          id: 'prepare',
          title: 'Prepare the integration',
          blocks: [
            { type: 'list', items: ['Prepare the API key `<YOUR_PARTOKENS_API_KEY>`.', 'Use the Base URL `https://partokens.com/v1`.', 'Copy the exact available model ID `<YOUR_MODEL_ID>` from the account model list.'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Set environment variables', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
export PARTOKENS_MODEL="<YOUR_MODEL_ID>"` }] },
          ],
        },
        {
          id: 'send',
          title: 'Send the request',
          blocks: [
            { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
            { type: 'code-samples', samples: firstRequestSamplesEn },
          ],
        },
        {
          id: 'read',
          title: 'Read the response',
          blocks: [{ type: 'list', items: ['Check the HTTP status before parsing JSON.', 'Read the first chat text from `choices[0].message.content`.', 'Treat an empty `choices` array or empty text as no usable result.'] }],
        },
        {
          id: 'failures',
          title: 'Handle failures',
          blocks: [{ type: 'list', items: ['401: check that the Bearer key is complete, valid, and from the intended environment.', '400: use `error.message` to correct the model, messages, or JSON fields.', '429: wait for `Retry-After`; when absent, use jittered exponential backoff.', '5xx: retry with backoff, a maximum attempt count, and a total deadline.', 'Connection error or timeout: confirm whether an HTTP response arrived; do not resend a chat request unconditionally.'] }],
        },
      ],
    },
    clients: {
      id: 'clients',
      summary: 'Choose Shell, an OpenAI SDK, or a client with a custom Base URL, then verify the call with the same connection settings.',
      prerequisites: ['A Partokens API key', 'An available model ID'],
      sections: [
        {
          id: 'choose',
          title: 'Choose a client',
          blocks: [{ type: 'list', items: ['Shell / cURL: connectivity checks, automation scripts, and reproductions.', 'OpenAI JavaScript SDK: Node.js services and scripts.', 'OpenAI Python SDK: Python services and scripts.', 'Codex: coding tasks with a model that supports the Responses API.', 'An OpenAI-compatible client with a custom Base URL: existing clients that expose Base URL, Bearer key, and model ID settings.'] }],
        },
        {
          id: 'configure',
          title: 'Configure the connection',
          blocks: [
            { type: 'endpoint', label: 'Base URL', path: 'https://partokens.com/v1' },
            { type: 'list', items: ['Send the Bearer key `<YOUR_PARTOKENS_API_KEY>` as `Authorization: Bearer ...`.', 'Use the exact account model ID `<YOUR_MODEL_ID>`.', 'Discover models with `GET /v1/models`; Shell, SDKs, and compatible clients verify chat with `POST /v1/chat/completions`, while Codex uses `POST /v1/responses`.'] },
          ],
        },
        {
          id: 'verify',
          title: 'Verify the call',
          blocks: [
            { type: 'code-samples', samples: firstRequestSamplesEn },
            { type: 'list', items: ['For another compatible client, run `GET https://partokens.com/v1/models`, then send the chat request with the same key and model ID.', 'For Shell, JavaScript, Python, and compatible clients, confirm a successful HTTP response and readable `choices[0].message.content`.', 'After configuring its Base URL, key, and model, verify Codex with `codex exec "Reply only with: connection successful"`.'] },
          ],
        },
        {
          id: 'troubleshoot',
          title: 'Troubleshoot',
          blocks: [{ type: 'list', items: ['Client configuration error: no request or an invalid URL, Bearer header, or model; correct the setting before retrying.', 'Network error: no HTTP status arrived; check DNS, TLS, proxy, and connection timeout.', 'API error: an HTTP status and JSON `error` arrived; handle 401, 400, 429, or 5xx as an API result, not as a client crash.'] }],
        },
      ],
    },
    'api-keys': {
      id: 'api-keys',
      summary: 'Create an API key in the console, configure it in a secure runtime, and rotate or revoke old keys in order.',
      prerequisites: ['Access to the Partokens console'],
      sections: [
        {
          id: 'create',
          title: 'Create a key',
          blocks: [{ type: 'steps', items: [
            { title: 'Open key management', body: 'Sign in to the console, open API keys, and choose Create key.' },
            { title: 'Set the required options', body: 'Enter a name and select a group; set a quota limit and expiration when needed.' },
            { title: 'Save the credential', body: 'After submitting, use Reveal or Copy in the key list and place the credential in a secure runtime immediately.' },
          ] }],
        },
        {
          id: 'configure',
          title: 'Configure the key',
          blocks: [
            { type: 'list', items: ['Use a server-side environment variable or secret manager; never put the key in a repository, URL, log, or browser code.', 'Send it as `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.'] },
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Set the environment variable', code: `export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"` }] },
          ],
        },
        {
          id: 'rotate',
          title: 'Rotate and revoke',
          blocks: [{ type: 'steps', items: [
            { title: 'Create the replacement', body: 'Create a replacement key for the same application and store it securely.' },
            { title: 'Verify it first', body: 'Change one controlled environment and call `GET /v1/models` to confirm the replacement works.' },
            { title: 'Replace every use', body: 'Update services, jobs, and secret-manager values, then confirm the new configuration is active.' },
            { title: 'Disable the old key', body: 'From the key list actions, choose Disable to pause or Delete to remove the old key.' },
          ] }],
        },
        {
          id: 'exceptions',
          title: 'Handle exceptions',
          blocks: [{ type: 'list', items: ['401: check the environment variable, Bearer header, and key status; make sure an old value is not in use.', '403: check the key group, access scope, and enabled state before trying again.', 'Suspected exposure: disable or delete the key immediately, create and verify a replacement, then update every use.', 'Expired, disabled, or exhausted key: do not retry repeatedly; create a replacement and verify it.'] }],
        },
      ],
    },
    sdk: {
      id: 'sdk',
      summary: 'Install the OpenAI JavaScript or Python SDK, configure the Partokens Base URL and key, and read text from a minimal chat request.',
      prerequisites: ['A Node.js or Python runtime', 'A Partokens API key', 'A model ID'],
      sections: [
        {
          id: 'install',
          title: 'Install the SDK',
          blocks: [
            { type: 'paragraph', text: 'Install the supported OpenAI SDK in a server-side project.' },
            { type: 'code-samples', samples: [{ language: 'shell', label: 'Install and set variables', code: `npm install openai
python -m pip install openai

export PARTOKENS_API_KEY="<YOUR_PARTOKENS_API_KEY>"
export PARTOKENS_MODEL="<YOUR_MODEL_ID>"` }] },
          ],
        },
        {
          id: 'configure',
          title: 'Configure the client',
          blocks: [
            { type: 'list', items: ['JavaScript uses `apiKey` and `baseURL`.', 'Python uses `api_key` and `base_url`.', 'Set both SDKs to `https://partokens.com/v1`; provide `<YOUR_MODEL_ID>` through the model environment variable.'] },
            { type: 'endpoint', method: 'POST', label: 'Chat Completions', path: 'https://partokens.com/v1/chat/completions' },
          ],
        },
        {
          id: 'send-read',
          title: 'Send and read a request',
          blocks: [{ type: 'code-samples', samples: [conciseSdkJavaScriptSample, conciseSdkPythonSample] }],
        },
        {
          id: 'errors',
          title: 'Handle errors',
          blocks: [{ type: 'list', items: ['Connection error: check DNS, TLS, proxy, and network before retrying.', 'HTTP error: read the status, `error.message`, and `X-Oneapi-Request-Id`; fix 400, 401, or 403 first.', '429: follow `Retry-After`, or use jittered exponential backoff.', '5xx: retry with a maximum attempt count and total deadline.', 'Timeout: set an SDK timeout; a chat request may already have run, so check usage records before retrying.'] }],
        },
      ],
    },
  },
}

export function hasLocalizedDocsDocument(id: DocsItemId, locale: AppLocale) {
  return locale === 'zh-CN' || (locale === 'en' && Boolean(englishDocsDocuments[id]))
}

export function getDocsDocument(id: DocsItemId, locale: AppLocale = 'zh-CN') {
  const document = conciseDocsDocuments[locale === 'en' ? 'en' : 'zh-CN'][id]
    ?? (locale === 'en' ? (englishDocsDocuments[id] ?? zhCnDocsDocuments[id]) : zhCnDocsDocuments[id])
  if (!document) throw new Error(`Missing published documentation: ${locale}/${id}`)
  return document
}

export function getDocsSearchText(id: DocsItemId, locale: AppLocale = 'zh-CN') {
  const document = getDocsDocument(id, locale)
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
        if (block.type === 'links') return block.items.flatMap((item) => [item.label, item.href])
        if (block.type === 'table') return [...block.columns, ...block.rows.flat()]
        if (block.type === 'faq') return block.items.flatMap((item) => [item.question, item.answer])
        return block.samples.flatMap((sample) => [sample.label, sample.code])
      }),
    ]),
  ].join(' ')
}
