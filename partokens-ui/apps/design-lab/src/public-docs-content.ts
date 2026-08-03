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
    code: `set -u
: "\${PARTOKENS_API_KEY:?请先设置 PARTOKENS_API_KEY}"

body_file="$(mktemp)"
headers_file="$(mktemp)"
trap 'rm -f "$body_file" "$headers_file"' EXIT

if ! status="$(curl --silent --show-error \\
  --output "$body_file" \\
  --dump-header "$headers_file" \\
  --write-out "%{http_code}" \\
  https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY")"; then
  printf '%s\n' "网络请求失败；API 密钥未写入日志" >&2
  exit 1
fi

request_id="$(tr -d '\r' < "$headers_file" \\
  | sed -n 's/^[Xx]-[Oo]neapi-[Rr]equest-[Ii]d:[[:space:]]*//p' \\
  | tail -n 1)"

if ! jq -e 'type == "object"' "$body_file" >/dev/null 2>&1; then
  printf 'HTTP %s 返回了非 JSON 响应，请求 ID %s\n' \\
    "$status" "\${request_id:-未返回}" >&2
  exit 1
fi

if [ "$status" -lt 200 ] || [ "$status" -ge 300 ] \\
  || jq -e '.success == false' "$body_file" >/dev/null; then
  message="$(jq -r '.error.message // .message // "未知错误"' "$body_file")"
  printf '模型列表失败，HTTP %s，请求 ID %s：%s\n' \\
    "$status" "\${request_id:-未返回}" "$message" >&2
  exit 1
fi

count="$(jq '.data | if type == "array" then length else 0 end' "$body_file")"
if [ "$count" -eq 0 ]; then
  printf '%s\n' "账户当前没有返回可用模型" >&2
  exit 1
fi

jq -r '.data[]?.id | select(type == "string" and length > 0)' "$body_file"`,
  },
  {
    language: 'javascript',
    label: 'JavaScript / Node.js',
    code: `const apiKey = process.env.PARTOKENS_API_KEY;
if (!apiKey) throw new Error("请先设置 PARTOKENS_API_KEY");

try {
  const response = await fetch("https://partokens.com/v1/models", {
    headers: { Authorization: "Bearer " + apiKey },
  });
  const requestId =
    response.headers.get("x-oneapi-request-id") ?? "未返回";

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "HTTP " + response.status + " 返回了非 JSON 响应，请求 ID " + requestId,
    );
  }

  if (!response.ok || body?.success === false) {
    const message = body?.error?.message ?? body?.message ?? "未知错误";
    throw new Error(
      "HTTP " + response.status + "，请求 ID " + requestId + "：" + message,
    );
  }

  const models = Array.isArray(body?.data) ? body.data : [];
  const ids = models
    .map((item) => item?.id)
    .filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) throw new Error("账户当前没有返回可用模型");

  for (const id of ids) console.log(id);
} catch (error) {
  console.error(error instanceof Error ? error.message : "未知错误");
  process.exitCode = 1;
}`,
  },
  {
    language: 'python',
    label: 'Python 标准库',
    code: `import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

api_key = os.environ.get("PARTOKENS_API_KEY")
if not api_key:
    raise RuntimeError("请先设置 PARTOKENS_API_KEY")

request = Request(
    "https://partokens.com/v1/models",
    headers={"Authorization": f"Bearer {api_key}"},
)

try:
    with urlopen(request, timeout=30) as response:
        request_id = response.headers.get("X-Oneapi-Request-Id", "未返回")
        payload = json.load(response)
except HTTPError as error:
    request_id = error.headers.get("X-Oneapi-Request-Id", "未返回")
    try:
        payload = json.loads(error.read().decode("utf-8"))
        message = payload.get("error", {}).get("message") or payload.get("message")
    except (UnicodeDecodeError, json.JSONDecodeError):
        message = "非 JSON 错误响应"
    print(
        f"模型列表失败，HTTP {error.code}，请求 ID {request_id}："
        f"{message or '未知错误'}",
        file=sys.stderr,
    )
    raise SystemExit(1) from error
except URLError as error:
    print(f"无法连接 Partokens：{error.reason}", file=sys.stderr)
    raise SystemExit(1) from error
except json.JSONDecodeError as error:
    print(f"响应不是有效 JSON：{error}", file=sys.stderr)
    raise SystemExit(1) from error

if payload.get("success") is False:
    print(
        f"模型列表失败，请求 ID {request_id}："
        f"{payload.get('message', '未知错误')}",
        file=sys.stderr,
    )
    raise SystemExit(1)

models = payload.get("data")
ids = [
    item.get("id")
    for item in models if isinstance(item, dict) and item.get("id")
] if isinstance(models, list) else []
if not ids:
    print("账户当前没有返回可用模型", file=sys.stderr)
    raise SystemExit(1)

for model_id in ids:
    print(model_id)`,
  },
]

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
          { type: 'callout', tone: 'warning', title: '以实时配置为准', body: '模型、价格、限额与可用性以账户实时配置和服务端实际响应为准；文档不会把尚未确认的值写成固定承诺。' },
        ],
      },
      {
        id: 'reading-map',
        title: '按目标继续阅读',
        blocks: [
          { type: 'table', columns: ['当前目标', '建议文档'], rows: [
            ['完成最小接入', '“Partokens 是什么” → “API 密钥管理” → “模型与定价” → “快速开始：完成首次接入”'],
            ['配置现有客户端或 SDK', '“支持的客户端总览” → “SDK 配置”或“Codex 与 CLI 配置”'],
            ['使用图像能力', '“生图工作台”用于理解控制台交互；“图像生成 API”用于代码接入'],
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
          { type: 'callout', tone: 'warning', title: '确认边界', body: '路由存在不代表每个账户或模型都支持同一组能力。提供商路由规则、跨模型参数兼容矩阵和数据保留说明如未在对应文档明确列出，仍待产品或后端确认。' },
        ],
      },
      {
        id: 'product-surfaces',
        title: '区分控制台、API 与设计样例',
        blocks: [
          { type: 'table', columns: ['层级', '用途', '判断依据'], rows: [
            ['控制台', '管理账户、密钥、模型配置，并查看部署中实际提供的工作区与日志入口', '以当前账户界面和服务端返回为准'],
            ['OpenAI 兼容 API', '由应用、SDK 或工具通过 HTTPS 发起请求', '以已确认路由、目标模型实际响应和请求 ID 为准'],
            ['design-lab 设计样例', '演示界面、交互状态和文档结构', '其中的模型、价格、用量、日志、图片和账户数据都不是真实账户数据或产品承诺'],
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
          { type: 'callout', tone: 'info', title: '轮换与撤销边界', body: '撤销后的生效时间、密钥数量限制和自动轮换能力尚待产品或后端确认，本页不对这些行为作固定承诺。' },
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
          { type: 'table', columns: ['后续目标', '对应文档'], rows: [
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
          { type: 'callout', tone: 'warning', title: 'design-lab 仅是设计样例', body: 'design-lab 中显示的模型名称、模型价格、货币符号、余额、套餐额度、输入输出用量和请求记录全部是设计样例，不代表真实账户数据，也不构成 Partokens 的价格或可用性承诺。' },
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
          { type: 'callout', tone: 'warning', title: '不要从名称猜能力', body: '不能仅根据模型名称推断上下文长度、图像能力、工具调用能力、参数支持、价格或可用性。完整上下文与参数兼容矩阵仍待产品或后端确认。' },
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
            ['`quota`', '使用记录中的服务端最终结算额度', '可用于核对单次请求；显示单位、换算关系和精度待产品或后端确认'],
            ['`model_name` / `request_id`', '把结算记录关联到模型与请求', '与请求时间、HTTP 响应头一起用于排查和账单核对'],
          ] },
          { type: 'callout', tone: 'warning', title: '待产品或后端确认', body: '价格字段的对外命名、货币或额度单位、倍率是否向用户展示、结算换算关系、舍入精度和最低收费均未形成可写入文档的 Partokens 长期契约。不要从 design-lab 的货币符号或小数位推断真实规则。' },
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
    summary: '按当前控制台界面完成一次生图工作台操作，同时分清前端设计样例、浏览器本地状态、Image API 请求与服务端使用记录。',
    prerequisites: ['可以进入 Partokens 控制台', '准备从账户实时配置确认支持图像生成的模型', '已了解生成请求可能产生用量，且超时不代表服务端未执行'],
    sections: [
      {
        id: 'open-studio',
        title: '从控制台进入生图工作台',
        blocks: [
          { type: 'steps', items: [
            { title: '打开控制台', body: '进入控制台后，在当前侧栏的 `Workspace` 分组找到 `Image studio`。' },
            { title: '确认地址', body: '当前 design-lab 使用 `#console-studio` hash 路由；刷新该地址仍会回到生图工作台。' },
            { title: '先确认界面性质', body: '当前页面是可交互的设计样例，不会读取真实账户模型，也不会向 Partokens 或上游发出图像生成请求。' },
          ] },
          { type: 'callout', tone: 'warning', title: '当前“生成”不会产生真实图片或费用', body: '源码使用约 1.8 秒的本地计时器和四张内置图片模拟加载、成功与失败状态。以下界面说明用于认识当前交互，不代表生产工作台已经接通后端。' },
        ],
      },
      {
        id: 'current-controls',
        title: '当前真实可操作的控件',
        blocks: [
          { type: 'table', columns: ['界面控件', '当前可以做什么', '产品边界'], rows: [
            ['`Prompt`', '输入并编辑提示词；设计页限制为 1200 个字符，空内容时禁用生成', '仅保存在当前 React 页面状态；1200 字符不是 Image API 或模型的长期限制承诺'],
            ['`Reference image`', '选择、预览、替换或移除本地图片；选择器提示 PNG、JPG、WebP', '浏览器只创建临时 Object URL；文件没有上传，也没有进入生成请求，格式与文件大小支持待产品或后端确认'],
            ['`Model`', '在三个静态样例名称之间切换', '不是账户实时列表；这些名称只属于设计样例，不能据此判断 Partokens 可用性或图像能力'],
            ['`Quality`', '在 `Standard` 与 `High` 样例值之间切换', '只改变本地设置对象，不会发送给后端；真实模型支持待确认'],
            ['`Image size`', '在正方形、横向和纵向三个带尺寸文字的样例项之间切换', '只改变结果占位比例与标签；所示分辨率不是 Partokens 能力承诺'],
            ['`Number of images`', '选择 1、2、3 或 4，并改变骨架屏与内置结果数量', '只作用于本地模拟；不能作为真实 API 的数量范围或计费规则'],
            ['`Generate` / `Cancel`', '启动或停止本地计时器；生成期间锁定输入', '`Cancel` 不能取消服务端或上游任务，因为当前没有真实请求'],
            ['`Retry`', '模拟失败后重新运行本地计时器', '不是可直接照搬到真实生成请求的重试策略'],
          ] },
          { type: 'callout', tone: 'info', title: '只从账户实时配置选择模型', body: '生产流程必须从账户当前模型配置或实时模型列表取得精确模型 ID，并单独确认它支持图像生成。不能从名称、厂商前缀或 design-lab 样例猜测模型能力、参数或价格。' },
        ],
      },
      {
        id: 'workflow',
        title: '按当前界面完成一次工作流',
        blocks: [
          { type: 'steps', items: [
            { title: '选择或确认模型', body: '在设计页可以切换静态模型项；生产使用前必须改为账户实时模型，并确认目标模型支持图像生成端点。' },
            { title: '输入提示词', body: '在 `Prompt` 中写入非空描述。不要把示例默认提示词当成已保存的项目内容。' },
            { title: '添加可选参考内容', body: '当前控件只会在本浏览器预览一张本地图片。它没有上传、编辑或发送能力，正式参考图流程待产品与后端确认。' },
            { title: '调整现有选项', body: '可操作项只有当前页面展示的 `Model`、`Quality`、`Image size` 和 `Number of images`；这些值目前都是设计状态。页面没有风格、种子、变体或编辑控件。' },
            { title: '发起生成', body: '点击 `Generate` 后查看加载状态，必要时可点击 `Cancel` 停止本地模拟。真实接入后，发起操作应对应一次明确的 Image API 请求并保留响应头中的请求 ID。' },
            { title: '查看结果', body: '当前结果区按所选数量显示内置图片，并标出序号和样例尺寸；每次生成会替换当前结果集。' },
            { title: '整理与下载', body: '当前源码没有结果选择、重排、删除、归档或下载按钮，也没有批次历史。不要把结果网格描述成已完成的整理或下载功能；正式流程待产品确认。' },
          ] },
        ],
      },
      {
        id: 'state-boundaries',
        title: '区分工作台、API、本地状态和服务端记录',
        blocks: [
          { type: 'table', columns: ['层级', '当前已确认行为', '不能据此推断'], rows: [
            ['工作台交互', '显示表单、加载、取消、失败、重试和结果网格', '不表示已经调用任一真实模型'],
            ['Image API', 'new-api 注册 `POST /v1/images/generations`，并接收 `model`、`prompt` 及一组可选字段', '路由与 DTO 存在不代表某账户模型支持每个可选参数；工作台当前没有调用该路由'],
            ['浏览器本地状态', '提示词、选项、临时参考图 URL、状态和结果数组只存在于当前页面内存', '刷新、关闭页面或离开路由后不保证恢复；没有发现 localStorage、IndexedDB 或服务端保存'],
            ['服务端保存', '真实 API 调用可能按服务端配置形成使用或错误日志', '没有确认画布、提示词、参考图、生成图片或工作台批次会长期保存'],
            ['设计样例资源', '模型名称、参数、图片和模拟结果随 design-lab 源码提供', '不是真实账户数据、可用模型、价格、用量或生成历史'],
          ] },
          { type: 'callout', tone: 'warning', title: '编辑与变体不属于当前工作台合同', body: 'new-api 通用后端还存在图像编辑路由，但当前工作台没有对应请求；图像变体路由在该后端明确为未实现。Partokens 是否启用编辑、参考图或其他图像能力仍待产品或后端确认。' },
        ],
      },
      {
        id: 'results-and-storage',
        title: '结果、下载与保存边界',
        blocks: [
          { type: 'list', items: [
            '当前成功结果来自 `/image-studio/` 下的内置 WebP 设计资源，不是模型返回内容。',
            '结果网格只支持查看；源码没有下载命令、文件名处理、格式识别或保存位置选择。',
            '新增生成会替换当前结果数组；页面没有批次列表或撤销恢复。',
            '参考图 Object URL 会在替换、移除或组件卸载时释放；这不是文件持久化。',
            '正式 Image API 结果可能通过 URL 或 Base64 返回，安全读取方式见“图像生成 API”；不要从工作台样例推断格式、分辨率、文件大小或 URL 有效期。',
          ] },
        ],
      },
      {
        id: 'timeouts-and-billing',
        title: '生成超时后核对执行与结算',
        blocks: [
          { type: 'paragraph', text: '真实图像生成可能在客户端等待超时后继续由服务端或上游执行，并可能产生用量。超时只说明客户端没有按时收到完整结果，不能证明请求未到达或未结算。' },
          { type: 'steps', items: [
            { title: '先停止无条件重试', body: '保留准确时间、时区、模型 ID、API 路径、HTTP 状态和已有的 `X-Oneapi-Request-Id`。' },
            { title: '打开使用日志', body: '从控制台 `General > Usage logs` 进入 `#console-logs`，按时间、模型和请求 ID 查找对应记录。当前 design-lab 日志页仍是设计样例，生产查询能力以真实部署为准。' },
            { title: '核对执行与用量', body: '分别查看日志类型、输入与输出用量、最终 `quota`、服务端耗时和错误信息；有日志不自动等于成功。' },
            { title: '核对余额或套餐变化', body: '以账户当前余额、套餐状态与服务端最终结算为准；不能用工作台样例金额或数量自行换算。' },
            { title: '仍无法判断时联系支持', body: '提交脱敏后的请求 ID 与诊断字段，不要发送完整密钥、参考图、大段 Base64 或不必要的完整提示词。' },
          ] },
        ],
      },
      {
        id: 'reading-map',
        title: '继续阅读',
        blocks: [
          { type: 'table', columns: ['目标', '对应文档'], rows: [
            ['直接调用生成端点并读取 URL 或 Base64 结果', '“图像生成 API”'],
            ['从实时账户配置选择模型并理解最终结算', '“模型与定价”'],
            ['处理连接、429、5xx、客户端超时和安全重试', '“连接、限额与重试”'],
            ['按时间、模型和请求 ID 核对执行与额度', '“使用日志”'],
          ] },
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
          { type: 'callout', tone: 'warning', title: '参数支持取决于模型', body: '不要仅根据其他 OpenAI 兼容服务或模型名称推断某个高级参数一定可用。先使用对应端点的核心字段，再根据目标模型的实际响应逐项验证可选参数。' },
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
          { type: 'table', columns: ['检查层级', '应检查的内容', '为什么'], rows: [
            ['连接', '是否取得 HTTP 响应；DNS、TLS、代理或客户端超时', '没有状态码时先定位传输层，不能直接归因于 API 业务错误'],
            ['HTTP', '状态码与 `Retry-After` 等响应头', '2xx、4xx 与 5xx 的处理方式不同；429 应优先遵循服务端等待提示'],
            ['业务正文', '成功结果，或 `error.code` 与脱敏后的 `error.message`', '有 HTTP 响应不代表正文一定包含可用结果'],
            ['请求关联', '`X-Oneapi-Request-Id`、准确时间与时区、模型 ID', '用于将客户端现象与服务端记录关联'],
            ['用量与结算', '使用日志中的输入、输出用量与最终额度', '响应中的 token 用量不应替代服务端最终结算记录'],
          ] },
          { type: 'list', items: ['只对可安全重放的请求执行自动重试；遇到 429 时优先遵循 `Retry-After`，其他可重试失败使用带抖动的指数退避。', '客户端超时只表示未按时收到完整结果；生成请求可能已经到达、执行并产生用量，应先查使用日志再决定是否重试。'] },
          { type: 'callout', tone: 'info', title: '查看完整排查说明', body: '“连接、限额与重试”列出了统一 relay 错误结构、常见 HTTP 状态、最小诊断请求和重试边界。' },
        ],
      },
      {
        id: 'reading-map',
        title: '继续阅读',
        blocks: [
          { type: 'table', columns: ['目标', '对应文档'], rows: [
            ['实时取得可用模型 ID', '“模型列表 API”'],
            ['发送和解析聊天补全', '“聊天补全 API”'],
            ['调用图像生成并处理结果', '“图像生成 API”'],
            ['处理连接、状态码、限额和重试', '“连接、限额与重试”'],
            ['按请求 ID 核对用量与结算', '“使用日志”'],
          ] },
        ],
      },
    ],
  },
  'models-api': {
    id: 'models-api',
    summary: '使用 Bearer API 密钥读取当前账户可见的模型列表，检查响应和空列表，并把返回的模型 ID 用于其他 API 的 `model` 字段。',
    prerequisites: ['已创建且仍有效的 Partokens API 密钥', 'Shell 示例需要 cURL 和 jq；JavaScript 需要支持 `fetch` 的 Node.js；Python 使用标准库'],
    sections: [
      {
        id: 'request',
        title: '请求与鉴权',
        blocks: [
          { type: 'endpoint', method: 'GET', label: 'Models', path: 'https://partokens.com/v1/models' },
          { type: 'paragraph', text: '该路由在 new-api 中经过令牌鉴权。Partokens 文档统一使用 `Authorization: Bearer <API_KEY>`；请求不需要正文。不要把 API 密钥放在 URL、查询参数或日志中。' },
          { type: 'callout', tone: 'info', title: '列表与账户和密钥相关', body: '服务端会结合账户分组、密钥模型限制、已启用模型和计费配置生成结果。不同账户或密钥可能看到不同列表。' },
        ],
      },
      {
        id: 'response',
        title: '成功响应结构',
        blocks: [
          { type: 'code-samples', samples: [{ language: 'shell', label: '当前可观察的 JSON 结构', code: `{
  "object": "list",
  "success": true,
  "data": [
    {
      "id": "your-model",
      "object": "model",
      "created": 1626777600,
      "owned_by": "current-route-owner",
      "supported_endpoint_types": []
    }
  ]
}` }] },
          { type: 'table', columns: ['位置', '当前字段', '使用建议'], rows: [
            ['顶层', '`object`', '当前值为 `list`；用于识别列表响应'],
            ['顶层', '`success`', '当前成功值为 `true`；仍应同时检查 HTTP 状态'],
            ['顶层', '`data`', '模型条目数组；允许为空，应显式处理空列表'],
            ['模型条目', '`id`', '模型 ID；这是传给其他 API `model` 字段的核心值'],
            ['模型条目', '`object`', '当前值为 `model`'],
            ['模型条目', '`created`', '当前由后端生成的整数时间值，不应据此推断模型发布时间'],
            ['模型条目', '`owned_by`', '当前路由所有者标识，可能来自后端路由选择，不应作为稳定供应商合同'],
            ['模型条目', '`supported_endpoint_types`', '当前可观察的端点类型元数据；可能为空，也不保证所有参数可用'],
          ] },
          { type: 'callout', tone: 'warning', title: '非稳定字段只描述当前行为', body: '`created`、`owned_by` 和 `supported_endpoint_types` 受后端实现与元数据影响。客户端应优先依赖 `data[].id`，不要把其他字段固化成长期业务规则。' },
        ],
      },
      {
        id: 'examples',
        title: 'Shell、JavaScript 与 Python 示例',
        blocks: [
          { type: 'paragraph', text: '三个示例都检查网络或 HTTP 错误、读取 `X-Oneapi-Request-Id`、处理 `success: false` 与空数组，并只输出模型 ID。错误日志不会输出 API 密钥。' },
          { type: 'code-samples', samples: modelsApiSamples },
        ],
      },
      {
        id: 'use-model-id',
        title: '把模型 ID 用于其他 API',
        blocks: [
          { type: 'paragraph', text: '从 `data[].id` 选择一个精确值，原样写入其他请求的 `model` 字段。不要改写大小写、添加供应商前缀或根据名称猜测能力。' },
          { type: 'code-samples', samples: [{ language: 'shell', label: '在 Chat Completions 中使用返回的 ID', code: `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-from-v1-models",
    "messages": [{"role": "user", "content": "Hello"}]
  }'` }] },
          { type: 'callout', tone: 'warning', title: '出现在列表中仍不是成功保证', body: '模型出现在列表中，不代表当前请求一定有可用路由、不代表支持所有 API、不代表支持所有参数，也不代表价格固定不变。目标 API、能力、路由和价格仍需分别核对。' },
        ],
      },
      {
        id: 'errors',
        title: 'HTTP 错误与请求标识',
        blocks: [
          { type: 'paragraph', text: '全局请求中间件会把请求标识写入 `X-Oneapi-Request-Id` 响应头。鉴权中间件的失败通常返回 OpenAI 风格 `error` 对象；部分内部模型列表失败当前也可能以 HTTP 200 返回 `success: false` 和 `message`，因此示例同时检查 HTTP 状态与正文。' },
          { type: 'table', columns: ['状态或信号', '常见含义', '处理方式'], rows: [
            ['401', 'Bearer 密钥缺失、无效或已不可用', '修正或替换密钥后再请求；不要原样重试'],
            ['403', '账户、IP、分组或密钥权限不允许访问', '检查账户状态和密钥限制；修正权限前不要重试'],
            ['429', '服务端或边缘限流', '有 `Retry-After` 时遵循它；控制并发并使用带抖动退避'],
            ['5xx', '服务端、数据库或上游短暂失败', '保留请求 ID；该 GET 请求可在总时限内退避重试'],
            ['HTTP 200 + `success: false`', '当前模型列表控制器内部读取账户分组失败', '视为失败，记录请求 ID 和 `message` 后联系支持'],
            ['HTTP 200 + 空 `data`', '当前密钥没有返回可用模型', '检查分组、模型限制、计费配置和账户状态，不要随意猜模型名'],
          ] },
          { type: 'callout', tone: 'info', title: '继续使用故障排查文档', body: '“连接、限额与重试”提供 401、403、429、5xx 的统一处理方式、最小诊断请求和支持信息清单。' },
        ],
      },
      {
        id: 'no-query-contract',
        title: '没有已确认的查询参数合同',
        blocks: [
          { type: 'paragraph', text: '当前 Partokens 入口只确认 `GET /v1/models`。本文不声明分页、筛选、排序或额外查询参数，也不建议客户端根据未记录字段实现增量同步。' },
        ],
      },
    ],
  },
  'chat-completions': {
    id: 'chat-completions',
    summary: '使用 `POST /v1/chat/completions` 发送由角色和内容组成的消息列表，并通过 OpenAI 兼容 SDK 读取生成结果。',
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
        id: 'response',
        title: '读取成功响应',
        blocks: [
          { type: 'table', columns: ['字段', '用途与边界'], rows: [
            ['`id`', '本次聊天补全结果的标识；不要与响应头中的 `X-Oneapi-Request-Id` 混淆'],
            ['`object`、`created`、`model`', '响应元数据；`model` 可能反映服务端或上游返回值，不应代替请求日志中的关联信息'],
            ['`choices[]`', '候选结果数组；读取前先检查数组非空'],
            ['`choices[].message.content`', '常见文本结果位置；应用必须允许内容为空或不是单一文本的情况'],
            ['`choices[].finish_reason`', '结果结束原因；不能只凭该字段判断计费或服务端结算'],
            ['`usage.prompt_tokens`、`usage.completion_tokens`、`usage.total_tokens`', '响应包含 `usage` 时可用于理解本次 token 用量；最终额度仍以服务端结算与使用日志为准'],
          ] },
          { type: 'callout', tone: 'info', title: '保留两类标识', body: '响应 JSON 的 `id` 标识生成结果；`X-Oneapi-Request-Id` 用于关联 Partokens 请求链路。排查问题时优先保留请求 ID，并可同时提供脱敏后的结果 ID。' },
        ],
      },
      {
        id: 'streaming',
        title: '流式响应与高级参数',
        blocks: [
          { type: 'paragraph', text: '不同模型可能支持不同的上下文长度、采样参数、工具调用或多模态输入。' },
          { type: 'callout', tone: 'warning', title: '按目标模型逐项验证', body: 'Partokens 不对所有模型统一承诺流式响应、分块细节或高级参数。先完成非流式最小请求，再依据账户实时配置、对应 API 说明和目标模型实际响应验证；尚未确认的能力视为待产品或后端确认。' },
        ],
      },
      {
        id: 'failures-and-usage',
        title: '失败、超时与用量核对',
        blocks: [
          { type: 'list', items: [
            '同时检查 HTTP 状态和错误正文；保留 `error.code`、脱敏后的 `error.message` 与 `X-Oneapi-Request-Id`。',
            '客户端超时不证明服务端未执行。不要无条件重复生成，应先按准确时间、时区、模型和请求 ID 查询使用日志。',
            '使用日志存在不自动等于请求成功；还要结合日志类型、HTTP 或业务结果、输入输出用量、最终额度和错误信息。',
            '响应中的 `usage` 用于理解 token 用量，余额、套餐变化和最终费用以账户状态与服务端结算记录为准。',
          ] },
          { type: 'table', columns: ['接下来要做什么', '对应文档'], rows: [
            ['确认通用请求、响应与重试边界', '“API 基础”与“连接、限额与重试”'],
            ['核对模型可用性与价格', '“模型列表 API”与“模型与定价”'],
            ['按请求 ID 核对执行和结算', '“使用日志”'],
          ] },
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
      {
        id: 'reading-map',
        title: '继续阅读',
        blocks: [
          { type: 'table', columns: ['目标', '对应文档'], rows: [
            ['了解控制台内当前生图交互与设计样例边界', '“生图工作台”'],
            ['从实时账户配置选择模型并核对价格', '“模型与定价”'],
            ['处理生成超时、429、5xx 与安全重试', '“连接、限额与重试”'],
            ['按时间、模型和请求 ID 核对执行与最终结算', '“使用日志”'],
          ] },
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
            { question: '如何轮换或撤销密钥？', answer: '按“API 密钥管理”先创建替代密钥并验证，再停止旧密钥并使用控制台当前提供的撤销或替换操作。撤销生效时间、数量限制和自动轮换能力尚待产品或后端确认。' },
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
            { question: '没有找到日志就代表请求未执行吗？', answer: '不能直接判断。先检查时间范围、时区、搜索词和筛选条件，再考虑日志写入边界；日志保留期限、实时性和完整性尚待产品或后端确认。' },
            { question: 'API 请求的数据如何保存？', answer: 'API 请求需要发送到服务端才能完成模型调用。具体日志、提供商处理和数据保留规则尚待产品或后端确认。' },
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
    summary: '在控制台按时间、模型和请求 ID 定位一次调用，区分请求结果与使用记录，并以服务端日志核对用量和最终结算额度。',
    prerequisites: ['可以登录 Partokens 控制台', '保留了请求发生的准确时间与时区', '能够从客户端读取 HTTP 状态、错误正文或 `X-Oneapi-Request-Id` 中的至少一项'],
    sections: [
      {
        id: 'open-logs',
        title: '进入使用日志',
        blocks: [
          { type: 'steps', items: [
            { title: '打开控制台', body: '在当前侧栏的 `General` 分组选择 `Usage logs`。' },
            { title: '确认地址', body: '当前 design-lab 使用 `#console-logs` hash 路由；刷新该地址仍会回到使用日志页。' },
            { title: '先缩小时间范围', body: '从请求发生的准确时间与时区开始，再结合模型和请求 ID 定位，避免先用宽泛关键词判断结果。' },
          ] },
          { type: 'callout', tone: 'warning', title: '当前页面展示的是设计样例', body: 'design-lab 的日志数组、请求 ID、模型、密钥名称、Token、金额、耗时、错误和上游 ID 都是内置样例，不是真实账户数据。当前页面也没有调用 new-api 日志接口。' },
        ],
      },
      {
        id: 'field-map',
        title: '界面字段与后端字段如何对应',
        blocks: [
          { type: 'table', columns: ['控制台概念', 'new-api 当前字段', '解释与边界'], rows: [
            ['请求时间', '`created_at`', '后端记录 Unix 秒；design-lab 的 `time` 是无时区的静态英文日期。生产界面采用哪个显示时区仍待确认，提交支持请求时必须另写时区'],
            ['请求 ID', '`request_id`', '与响应头 `X-Oneapi-Request-Id` 对应，是关联客户端与日志的首选字段；日志的数字 `id` 只是展示行序号，不是请求 ID'],
            ['上游请求 ID', '`upstream_request_id`', '可能从上游响应头取得；不是每条记录都有，也不能替代 Partokens 请求 ID'],
            ['模型名', '`model_name`', '记录本次服务端处理使用的模型名；应与请求中的精确模型 ID 一起核对'],
            ['API 密钥', '`token_name` / `token_id`', '用于关联密钥名称或内部标识；不要向支持团队提交完整密钥值'],
            ['日志或请求类型', '`type`', '当前数值类别包含消费、系统、错误、退款、登录等；它不是 HTTP 状态或 API 路径'],
            ['API 路径', '`other.request_path`', '消费日志的附加信息当前可记录请求路径；不是每类日志都保证存在，对外展示契约待确认'],
            ['输入用量', '`prompt_tokens`', '服务端记录的输入计量；图像或不同上游的计量语义可能与纯文本 Token 不同'],
            ['输出用量', '`completion_tokens`', '服务端记录的输出计量；应结合目标 API、响应 usage 和后端适配结果理解'],
            ['最终结算额度', '`quota`', '该条消费记录的服务端最终结算额度；对外单位、货币换算、精度与 UI 命名仍待产品或后端确认'],
            ['响应耗时', '`use_time`', '当前记录的是服务端使用的整数秒值；不等同于浏览器网络面板总耗时，design-lab 的 `latency` 字符串只是样例'],
            ['流式请求', '`is_stream`', '表示服务端将该请求作为流式处理；不证明流已经正常结束'],
            ['分组', '`group`', '记录路由或密钥使用的分组；具体可见性和业务含义依账户配置而定'],
            ['结果或错误', '`type`、`content`、`other`', '错误日志可记录错误内容与附加信息，但 `Log` 当前没有统一 `http_status` 字段；HTTP 状态和 `error.code` 应从客户端响应保留'],
          ] },
          { type: 'callout', tone: 'info', title: '“Cost”不是已确认的后端字段名', body: 'design-lab 表格用 `Cost` 和美元样例展示本地 `cost`。new-api 用户日志的核心结算字段是 `quota`；Partokens 是否以及如何把它显示为费用、货币或额度，仍待产品或后端确认。' },
        ],
      },
      {
        id: 'locate-request',
        title: '按时间、模型和请求 ID 定位调用',
        blocks: [
          { type: 'steps', items: [
            { title: '统一时间与时区', body: '记录客户端事件的完整日期、时分秒和 UTC 偏移，例如 `UTC+08:00`。如果界面时间没有时区，先确认浏览器或账户显示规则。' },
            { title: '输入精确请求 ID', body: '优先使用响应头中的 `X-Oneapi-Request-Id`。new-api 的用户日志查询支持精确 `request_id`，不要把显示行 `id` 当作请求标识。' },
            { title: '核对模型名', body: '使用请求体中的精确模型 ID，并与日志 `model_name` 对照；不要只按相似名称搜索。' },
            { title: '扩大范围前清除冲突筛选', body: '检查日志类型、密钥名称、分组、模型和时间范围是否同时限制了结果；跨午夜或跨时区时尤其要扩大开始与结束时间。' },
            { title: '必要时使用上游请求 ID', body: '如果只有 `upstream_request_id`，后端也支持精确筛选；但支持请求仍应优先提供 Partokens 请求 ID。' },
          ] },
          { type: 'paragraph', text: 'new-api 当前用户日志数据路由为 `GET /api/log/self`，可接收 `type`、`start_timestamp`、`end_timestamp`、`token_name`、`model_name`、`group`、`request_id` 与 `upstream_request_id` 等查询字段并分页返回。旧的 `/api/log/self/search` 已被标记为废弃；这些是后端现状，不表示 design-lab 当前已经接入。' },
        ],
      },
      {
        id: 'result-boundaries',
        title: '区分超时、HTTP 失败、上游失败和已执行',
        blocks: [
          { type: 'table', columns: ['观察结果', '可以说明什么', '下一步'], rows: [
            ['客户端超时，未收到 HTTP 状态', '客户端在自己的时限内没有得到完整响应', '不能断定服务端未执行；按时间、模型和请求 ID 查日志与结算，生成请求不要无条件重试'],
            ['收到 4xx 或 5xx', '网关、服务端或上游返回了 HTTP 失败', '保留状态、`error.code`、脱敏的 `error.message` 和请求 ID；再查看是否有错误或消费记录'],
            ['上游失败', '请求可能已经通过 Partokens 鉴权和路由，但上游没有完成预期响应', '检查错误日志、上游请求 ID、用量与 `quota`；不同上游失败点的结算边界可能不同'],
            ['服务端已执行但客户端未收到结果', '断连、超时或下载失败可能发生在服务端处理之后', '使用消费记录、最终额度与余额或套餐变化确认；不要仅因客户端无结果重复生成'],
            ['找到一条日志', '请求到达了某个日志写入点', '不等于成功；必须结合 `type`、错误内容、用量、`quota` 和客户端 HTTP 结果'],
            ['没有找到日志', '当前筛选和当前可见范围内没有匹配记录', '不等于未执行；检查时间范围、时区、筛选、请求 ID、写入延迟与日志配置边界'],
          ] },
        ],
      },
      {
        id: 'verify-usage',
        title: '核对用量、结算和账户变化',
        blocks: [
          { type: 'steps', items: [
            { title: '确认是否到达服务端', body: '收到 `X-Oneapi-Request-Id` 表明网关为该响应分配了请求标识；在日志中找到同一 `request_id` 可以进一步关联服务端记录。没有日志仍不能单独排除执行。' },
            { title: '确认日志类型', body: '区分消费记录与错误记录。错误记录可能显示零用量和零额度；消费记录也不能脱离客户端结果单独解释为业务成功。' },
            { title: '核对输入和输出用量', body: '读取 `prompt_tokens` 与 `completion_tokens`，并与响应 usage 比较。计量差异可能来自 API 类型、上游返回或服务端适配，不能自行按文本 Token 规则修正。' },
            { title: '核对最终额度', body: '以日志 `quota` 和服务端最终结算为准。不要使用 design-lab 的美元金额、模型名或样例 Token 估算真实扣减。' },
            { title: '核对余额或套餐', body: '比较请求前后的账户余额或当前套餐用量。后端附加信息可表达 `billing_source`、`subscription_consumed` 或 `wallet_quota_deducted`，但 Partokens 是否向用户展示这些字段以及显示口径仍待确认。' },
          ] },
          { type: 'callout', tone: 'warning', title: '保留结算争议的关联证据', body: '记录请求时间和时区、模型、请求 ID、日志类型、输入输出用量、最终 `quota` 以及余额或套餐变化。不要提交真实密钥或包含敏感输入的完整日志导出。' },
        ],
      },
      {
        id: 'current-ui',
        title: '当前搜索、筛选、刷新、详情和导出能力',
        blocks: [
          { type: 'table', columns: ['操作', 'design-lab 当前行为', '生产边界'], rows: [
            ['搜索', '在内置数组中匹配请求 ID、密钥名称、模型和上游请求 ID', '没有请求后端；占位文字未列出上游 ID，但代码会匹配它'],
            ['筛选', '按事件类型、静态模型、最近 24 小时/7 天/30 天和分组过滤样例', '时间依赖内置 `ageHours`，不是服务端时间查询；选项也不是账户实时数据'],
            ['刷新', '等待约 700 毫秒后修改“更新时间”文字并显示提示', '没有重新获取日志；不代表实时性或写入延迟'],
            ['详情', '在桌面 Dialog 或移动 Sheet 展示样例请求、Token、Cost、Latency、上游 ID和错误代码', '字段来自本地对象；其中 `Cost` 不是已确认的后端字段名'],
            ['CSV 导出', '把当前筛选后的本地样例转换为 CSV 并在浏览器下载', '没有导出真实账户数据；格式、字段顺序、编码与长期支持待产品确认'],
            ['JSON 导出', '把当前筛选后的本地样例对象序列化为 JSON 并下载', '不是 new-api 日志响应合同，也不代表生产页面会支持 JSON 导出'],
            ['分页', '`Previous` 和 `Next` 按钮固定禁用', '后端接口支持分页，但当前 design-lab 没有实现分页交互'],
          ] },
        ],
      },
      {
        id: 'retention-and-privacy',
        title: '日志保留、完整性与隐私边界',
        blocks: [
          { type: 'list', items: [
            'Partokens 尚未确认面向用户的日志保留期限、删除周期、实时性或完整性保证。',
            'new-api 可以通过配置关闭消费日志，日志写入也可能失败；Partokens 当前部署策略仍待后端确认。',
            '后端 `Log` 结构存在 `content`、`other` 和可选 IP 记录能力，但不表示 Partokens 会长期保存完整提示词、个人信息或 IP。',
            '用户日志会移除部分仅管理员可见的附加信息；不要把用户界面字段视为完整审计轨迹。',
            '当前没有足够依据承诺审计合规、不可篡改、固定保留期或完整提示词检索能力。',
          ] },
        ],
      },
      {
        id: 'support-evidence',
        title: '可以安全提交给支持团队的日志信息',
        blocks: [
          { type: 'table', columns: ['可以提交', '提交前处理'], rows: [
            ['准确时间与时区、模型 ID、API 路径或客户端、HTTP 状态', '只保留定位所需范围'],
            ['`X-Oneapi-Request-Id`、必要时的 `upstream_request_id`', '核对没有把 API 密钥误当成请求 ID'],
            ['日志 `type`、输入输出用量、最终 `quota`、`use_time`', '说明字段来自哪条记录；不要自行改写单位'],
            ['`error.code` 与 `error.message`', '移除密钥、个人信息、完整提示词、私有 URL 和其他敏感内容'],
            ['余额或套餐是否发生变化', '只描述变化，不提交支付凭据或不必要的账户信息'],
          ] },
          { type: 'callout', tone: 'warning', title: '不要发送原始敏感数据', body: '禁止提交完整 API 密钥、密码、验证码、会话令牌、未脱敏个人信息、不必要的完整提示词、大段 Base64 或私有文件。完整清单和可复制模板见“联系支持”。' },
        ],
      },
      {
        id: 'reading-map',
        title: '继续阅读',
        blocks: [
          { type: 'table', columns: ['需要解决的问题', '对应文档'], rows: [
            ['理解模型价格、用量和 `quota` 的结算关系', '“模型与定价”'],
            ['区分 401、403、429、5xx、超时与重试', '“连接、限额与重试”'],
            ['核对余额、套餐和计费来源', '“余额、套餐与额度”'],
            ['提交脱敏且足够的诊断信息', '“联系支持”'],
          ] },
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
        if (block.type === 'links') return block.items.flatMap((item) => [item.label, item.href])
        if (block.type === 'table') return [...block.columns, ...block.rows.flat()]
        if (block.type === 'faq') return block.items.flatMap((item) => [item.question, item.answer])
        return block.samples.flatMap((sample) => [sample.label, sample.code])
      }),
    ]),
  ].join(' ')
}
