import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const zhCNDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "选择合适的接入方式，准备账户、API 密钥和实时模型 ID，然后完成一次最小调用。",
    "sections": [
      {
        "id": "choose-path",
        "title": "选择接入路径",
        "blocks": [
          {
            "type": "paragraph",
            "text": "所有接入方式使用同一组账户权限、API 密钥、模型 ID 和 OpenAI 兼容 Base URL。按当前任务选择最短路径。"
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL：用于首次连通性检查和问题复现。",
              "OpenAI JavaScript 或 Python SDK：用于服务、脚本和已有 SDK 项目。",
              "支持自定义 OpenAI Base URL 的客户端：用于已有工具；配置前确认客户端可以填写 Base URL、Bearer 密钥和模型 ID。",
              "控制台工作台：用于直接体验当前账户提供的聊天或图像能力。"
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "准备账户与密钥",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "创建 API 密钥",
                "body": "登录控制台，打开“API 密钥”，创建密钥并将其安全保存为 `<YOUR_PARTOKENS_API_KEY>`。"
              },
              {
                "title": "复制实时模型 ID",
                "body": "使用该密钥调用模型列表，复制当前返回的精确 ID `<YOUR_MODEL_ID>`。"
              },
              {
                "title": "保存连接信息",
                "body": "将密钥放入环境变量或密钥管理系统；不要写入仓库、URL、日志或浏览器代码。"
              }
            ]
          },
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          }
        ]
      },
      {
        "id": "complete-first-call",
        "title": "完成首次调用",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "打开首次接入文档",
                "body": "前往“快速开始：完成首次接入”，选择 Shell、JavaScript 或 Python 示例。"
              },
              {
                "title": "替换连接参数",
                "body": "保留统一 Base URL，并填入 `<YOUR_PARTOKENS_API_KEY>` 和 `<YOUR_MODEL_ID>`。"
              },
              {
                "title": "确认结果",
                "body": "发送最小请求，先检查 HTTP 状态，再确认响应中有可读取结果；失败时保留请求时间、状态和请求 ID。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "先验证最小请求",
            "body": "最小请求成功后，再接入应用并逐项增加可选参数。本文不重复完整请求示例。"
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "继续阅读文档",
        "blocks": [
          {
            "type": "list",
            "items": [
              "了解服务范围：阅读“Partokens 是什么”。",
              "管理凭据：阅读“API 密钥管理”。",
              "选择模型与核对价格：阅读“模型与定价”和“模型列表 API”。",
              "配置 SDK 或客户端：阅读“SDK 配置”“支持的客户端总览”或“Codex 与 CLI 配置”。",
              "排查请求与扣减：阅读“连接、限额与重试”和“使用日志”。",
              "自助检查后仍需帮助：阅读“联系支持”。"
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens 提供 OpenAI 兼容 API 入口，用于访问当前账户可用的模型和能力。",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "确认服务范围",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens 提供统一的 OpenAI 兼容 Base URL、账户控制台和公开 API 文档。应用可以通过 HTTPS、OpenAI SDK 或支持自定义 Base URL 的客户端发起请求。"
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "兼容不代表完全相同",
            "body": "OpenAI 兼容说明可复用常见的连接方式和请求结构，不表示每个账户、模型、端点或可选参数都可用。"
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "选择调用入口",
        "blocks": [
          {
            "type": "list",
            "items": [
              "查看模型：使用同一密钥调用 `GET /v1/models`。",
              "发送模型请求：从目标 API 页面选择与模型当前能力一致的端点，并从最小必填字段开始。",
              "使用 SDK 或兼容客户端：将 Base URL 设置为 `https://partokens.com/v1`，使用 Partokens Bearer 密钥和精确模型 ID。",
              "直接体验：登录控制台后使用当前提供的聊天或图像工作台。"
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "核对实时信息",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "核对模型与端点",
                "body": "以同一密钥调用模型列表得到的当前结果为准。"
              },
              {
                "title": "核对价格与额度",
                "body": "以当前账户显示的信息、调用后的使用日志和实际扣减为准。"
              },
              {
                "title": "核对参数",
                "body": "以对应 API 文档和目标模型的实际响应为准；不要根据模型名称或其他服务推断。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Models",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "verify-compatibility",
        "title": "验证兼容性",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "确认客户端设置",
                "body": "确认可以设置 Base URL、Bearer 密钥和精确模型 ID。"
              },
              {
                "title": "运行目标端点的最小请求",
                "body": "使用 `<YOUR_PARTOKENS_API_KEY>` 和 `<YOUR_MODEL_ID>`，只发送该端点要求的核心字段。"
              },
              {
                "title": "逐项增加能力",
                "body": "最小请求成功后再逐个加入可选参数，并以每次实际响应确认支持情况。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "以实际响应为准",
            "body": "模型可见或客户端可配置，只表示具备接入条件；目标模型对目标端点和参数的实际响应才是兼容性依据。"
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "准备 API 密钥、Base URL 和模型 ID，发送一次最小聊天请求并确认返回文本。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "已从账户模型列表取得可用模型 ID"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "准备接入",
        "blocks": [
          {
            "type": "list",
            "items": [
              "准备 API 密钥 `<YOUR_PARTOKENS_API_KEY>`。",
              "使用 Base URL `https://partokens.com/v1`。",
              "从账户模型列表复制准确的模型 ID `<YOUR_MODEL_ID>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "设置环境变量",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "发送请求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Chat Completions",
            "path": "https://partokens.com/v1/chat/completions"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"用一句话介绍 Partokens\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"响应中没有聊天文本\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"响应中没有聊天文本\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read",
        "title": "读取响应",
        "blocks": [
          {
            "type": "list",
            "items": [
              "先检查 HTTP 状态，再解析 JSON。",
              "读取第一条聊天文本：`choices[0].message.content`。",
              "如果 `choices` 为空或文本为空，将响应视为没有可用结果。"
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "处理失败",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401：检查 Bearer 密钥是否完整、有效且来自当前环境。",
              "400：根据 `error.message` 修正模型、消息或 JSON 字段。",
              "429：等待 `Retry-After`；未提供时使用带抖动的指数退避。",
              "5xx：在有限次数和总时限内退避重试。",
              "连接错误或超时：先确认是否收到 HTTP 响应；聊天请求不要无条件重复发送。"
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "按使用场景选择 Shell、OpenAI SDK 或支持自定义 Base URL 的兼容客户端，并用同一组连接参数验证调用。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "已取得可用模型 ID"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "选择客户端",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL：用于连通性检查、自动化脚本和问题复现。",
              "OpenAI JavaScript SDK：用于 Node.js 服务和脚本。",
              "OpenAI Python SDK：用于 Python 服务和脚本。",
              "Codex：用于编码任务，调用支持 Responses API 的模型。",
              "支持自定义 OpenAI Base URL 的兼容客户端：用于已有客户端迁移；客户端必须提供 Base URL、Bearer 密钥和模型 ID 设置。"
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "配置连接",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Bearer 密钥使用 `<YOUR_PARTOKENS_API_KEY>`，通过 `Authorization: Bearer ...` 发送。",
              "模型填写账户返回的精确 ID `<YOUR_MODEL_ID>`。",
              "模型发现调用 `GET /v1/models`；Shell、SDK 和兼容客户端使用 `POST /v1/chat/completions` 验证聊天，Codex 使用 `POST /v1/responses`。"
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "验证调用",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"用一句话介绍 Partokens\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"响应中没有聊天文本\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"响应中没有聊天文本\")\nprint(text)"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "兼容客户端先执行 `GET https://partokens.com/v1/models`，再用同一密钥和模型 ID 发送聊天请求。",
              "Shell、JavaScript、Python 和兼容客户端确认 HTTP 成功且能读取 `choices[0].message.content`。",
              "Codex 完成 Base URL、密钥和模型配置后运行 `codex exec \"只回复：连接成功\"`。"
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "处理问题",
        "blocks": [
          {
            "type": "list",
            "items": [
              "客户端配置错误：请求未发出，或 URL、Bearer 头、模型字段不正确；修正配置后重试。",
              "网络错误：没有收到 HTTP 状态，检查 DNS、TLS、代理和连接超时。",
              "API 错误：收到 HTTP 状态和 JSON `error`；按 401、400、429 或 5xx 处理，不要把 API 错误当作客户端崩溃。"
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "在控制台创建 API 密钥，安全配置到运行环境，并按顺序轮换或撤销旧密钥。",
    "prerequisites": [
      "可以登录 Partokens 控制台"
    ],
    "sections": [
      {
        "id": "create",
        "title": "创建密钥",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "打开密钥管理",
                "body": "登录控制台，进入 API 密钥页面并选择“创建密钥”。"
              },
              {
                "title": "填写必要设置",
                "body": "填写名称并选择分组；按需要设置额度上限和过期时间。"
              },
              {
                "title": "保存密钥",
                "body": "提交后在密钥列表使用“显示完整值”或“复制”获取凭据，并立即放入安全的运行环境。"
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "配置密钥",
        "blocks": [
          {
            "type": "list",
            "items": [
              "服务端优先使用环境变量或密钥管理系统，不要写入仓库、URL、日志或浏览器代码。",
              "请求头使用 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "设置环境变量",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "轮换与撤销",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "创建新密钥",
                "body": "为同一应用创建替代密钥，并安全保存。"
              },
              {
                "title": "先验证新密钥",
                "body": "只替换一个受控环境，调用 `GET /v1/models` 确认新密钥可用。"
              },
              {
                "title": "替换所有使用方",
                "body": "更新服务、任务和密钥管理系统中的旧值，确认新配置已生效。"
              },
              {
                "title": "停用旧密钥",
                "body": "在密钥列表的操作菜单中选择“禁用”暂停，或选择“删除”移除旧密钥。"
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "处理异常",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401：检查环境变量、Bearer 头和密钥状态；确认没有使用旧值。",
              "403：检查密钥所属分组、访问范围或可用状态；修正后再请求。",
              "疑似泄露：立即停用或删除疑似密钥，创建并验证新密钥，再替换所有使用方。",
              "密钥失效、停用或耗尽后：不要反复重试，创建替代密钥并重新验证。"
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "在控制台查看余额、套餐和用量，选择计费来源，并在额度不足时完成检查和恢复。",
    "prerequisites": [
      "可以登录 Partokens 控制台"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "查看余额与套餐",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "打开钱包",
                "body": "登录控制台，在侧栏的“账户”中选择“钱包”。"
              },
              {
                "title": "查看账户状态",
                "body": "在页面顶部查看账户余额、总用量和有效套餐数量。"
              },
              {
                "title": "查看套餐额度",
                "body": "在“选择套餐”区域选择“查看有效套餐”，核对每个套餐的状态、总额度、剩余额度和已用比例。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "账户余额显示当前可用余额。",
              "总用量显示账户已经产生的用量。",
              "有效套餐详情显示当前仍可使用的套餐及其剩余额度。"
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "选择计费来源",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "找到计费偏好",
                "body": "在“钱包”的“选择套餐”区域底部找到“用量计费偏好”。存在有效套餐时可以修改该设置。"
              },
              {
                "title": "选择当前偏好",
                "body": "按需要选择“套餐优先”“余额优先”“仅套餐”或“仅余额”；保存成功后再发起调用。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "“套餐优先”和“余额优先”用于指定首先尝试的来源。",
              "“仅套餐”和“仅余额”将调用限制为对应来源。",
              "更改前先确认所选来源当前可用。"
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "核对用量",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "打开使用日志",
                "body": "在控制台侧栏的“常规”中选择“使用日志”。"
              },
              {
                "title": "缩小时间与模型范围",
                "body": "选择覆盖调用发生时间的范围，再选择模型；需要精确定位时，将搜索字段切换为“请求 ID”并输入完整请求 ID。"
              },
              {
                "title": "核对调用和扣减",
                "body": "打开对应记录，核对请求时间、类型、模型、错误信息、用量、费用和请求 ID，再与钱包中的余额或套餐剩余额度变化对照。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "处理额度不足",
        "blocks": [
          {
            "type": "list",
            "items": [
              "余额不足：在“钱包”确认余额，使用当前可用的充值入口增加余额，或改用有可用额度的套餐。",
              "套餐额度不足或套餐不可用：打开有效套餐详情核对状态和剩余额度；选择当前可购买的套餐，或将计费偏好改为可用来源。",
              "请求被拒绝：保留 HTTP 状态、错误信息和请求 ID，在使用日志确认是否产生记录；401 或 403 还需检查 API 密钥状态和访问权限。",
              "修正余额、套餐、计费偏好或密钥后，先发送一次最小请求验证；未修正前不要重复提交。"
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "查找当前可用模型，核对能力和价格信息，为任务选择对应接口并处理模型错误。",
    "prerequisites": [
      "可以登录 Partokens 账户",
      "使用 API 查询时已准备 `<YOUR_PARTOKENS_API_KEY>`"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "查找模型",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "查询账户模型",
                "body": "使用当前 API 密钥调用模型列表接口，查看该账户返回的模型。"
              },
              {
                "title": "查询密钥可用模型",
                "body": "也可以使用 `<YOUR_PARTOKENS_API_KEY>` 调用模型列表接口，查看该密钥当前返回的模型。"
              },
              {
                "title": "复制模型 ID",
                "body": "从模型列表响应或其中的 `data[].id` 复制精确模型 ID，并在后续请求中原样使用 `<YOUR_MODEL_ID>`。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Models",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "check-capability-price",
        "title": "核对能力与价格",
        "blocks": [
          {
            "type": "list",
            "items": [
              "使用模型列表响应确认 `<YOUR_MODEL_ID>`，并在调用前查看对应 API 文档；计费与价格以服务返回的当前账户数据为准。",
              "能力和价格缺失时不要根据模型名称补全，也不要从相似名称推测。",
              "调用前确认目标接口出现在该模型的当前能力信息中；价格选择以服务当时返回的账户数据为准。",
              "调用后的实际用量和扣减在控制台“使用日志”中核对。"
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "选择调用接口",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions：模型明确支持聊天补全时，使用 `POST /v1/chat/completions` 发送消息列表。",
              "Responses：模型明确支持 Responses 时，使用 `POST /v1/responses`；Codex 原生连接使用此接口。",
              "图像接口：模型明确支持图像能力时，使用 `POST /v1/images/generations` 生成图像；使用参考图编辑时由生图工作台调用图像编辑接口。",
              "同一模型不一定支持所有接口或可选参数；先用目标接口的最小请求验证。"
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "处理模型问题",
        "blocks": [
          {
            "type": "list",
            "items": [
              "模型不可见：使用同一密钥再次调用 `GET /v1/models`，确认请求成功，并查看 `data` 是否为空。",
              "模型不可调用：确认请求使用了返回的精确 ID，并用同一 API 密钥重新查询模型列表；该密钥的列表中没有模型时不要猜测 ID。",
              "参数不兼容或 400：读取 `error.message`，移除非必要参数，按目标接口的最小字段重新请求。",
              "403：读取错误信息，检查 API 密钥状态、模型访问权限以及余额或套餐；修正后再请求。",
              "模型已返回但调用仍失败：保留请求时间、模型 ID、HTTP 状态和请求 ID，再到使用日志核对记录。"
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "使用 Codex 原生 model provider 配置连接 Partokens，并通过最小命令验证 Responses 调用。",
    "prerequisites": [
      "已创建 API 密钥 `<YOUR_PARTOKENS_API_KEY>`",
      "已取得支持 Responses 的模型 ID `<YOUR_MODEL_ID>`",
      "Codex 已安装并可以运行"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "准备 Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "运行 `codex --version`，确认当前终端可以启动 Codex。",
              "从 `GET https://partokens.com/v1/models` 复制精确的 `<YOUR_MODEL_ID>`，并确认它支持 Responses。",
              "准备 Partokens API 密钥 `<YOUR_PARTOKENS_API_KEY>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "设置环境变量",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "配置连接",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "打开用户配置",
                "body": "编辑 `~/.codex/config.toml`，并保留其中仍需要的其他设置。"
              },
              {
                "title": "添加 Partokens provider",
                "body": "写入以下模型与 provider 配置；`env_key` 读取刚才设置的环境变量。"
              }
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "~/.codex/config.toml",
                "code": "model = \"<YOUR_MODEL_ID>\"\nmodel_provider = \"partokens\"\n\n[model_providers.partokens]\nname = \"Partokens\"\nbase_url = \"https://partokens.com/v1\"\nenv_key = \"PARTOKENS_API_KEY\"\nwire_api = \"responses\""
              }
            ]
          }
        ]
      },
      {
        "id": "verify-call",
        "title": "验证调用",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "最小验证",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "命令正常返回 `connection successful` 表示 Codex 已通过配置发送并完成请求。",
              "随后可在控制台“使用日志”按时间、模型和请求 ID 核对这次调用。"
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "处理失败",
        "blocks": [
          {
            "type": "list",
            "items": [
              "配置错误：Codex 无法读取配置或未使用预期模型时，检查 TOML 语法、`model_provider`、`<YOUR_MODEL_ID>`，并确认环境变量在运行命令的同一终端中已设置。",
              "连接错误：未收到 HTTP 状态时，检查网络、代理、DNS、TLS，以及 `base_url` 是否为 `https://partokens.com/v1`。",
              "HTTP/API 错误：收到 400、401、403、429 或 5xx 时，保留状态、错误信息和请求 ID；先修正参数、密钥、权限或额度，再按错误类型决定是否重试。",
              "模型不支持 Responses：从当前模型列表重新选择明确支持 Responses 的模型；不要把 `wire_api` 改为其他值。"
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "安装 OpenAI JavaScript 或 Python SDK，配置 Partokens Base URL 和密钥，发送最小聊天请求并读取文本。",
    "prerequisites": [
      "Node.js 或 Python 运行环境",
      "已创建 Partokens API 密钥",
      "已取得模型 ID"
    ],
    "sections": [
      {
        "id": "install",
        "title": "安装 SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "在服务端项目中安装当前支持的 OpenAI SDK。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "安装与环境变量",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "配置客户端",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript 使用 `apiKey` 和 `baseURL`。",
              "Python 使用 `api_key` 和 `base_url`。",
              "两个 SDK 的 Base URL 都设置为 `https://partokens.com/v1`，模型使用 `<YOUR_MODEL_ID>` 对应的环境变量值。"
            ]
          },
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Chat Completions",
            "path": "https://partokens.com/v1/chat/completions"
          }
        ]
      },
      {
        "id": "send-read",
        "title": "发送并读取请求",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "javascript",
                "label": "JavaScript / Node.js",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst apiKey = process.env.PARTOKENS_API_KEY;\nconst model = process.env.PARTOKENS_MODEL;\nif (!apiKey || !model) throw new Error(\"Set PARTOKENS_API_KEY and PARTOKENS_MODEL\");\n\nconst client = new OpenAI({\n  apiKey,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model,\n  messages: [{ role: \"user\", content: \"Reply with: connection successful\" }],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"The response contains no chat text\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\" python example.py\nimport os\nfrom openai import OpenAI\n\napi_key = os.environ.get(\"PARTOKENS_API_KEY\")\nmodel = os.environ.get(\"PARTOKENS_MODEL\")\nif not api_key or not model:\n    raise RuntimeError(\"Set PARTOKENS_API_KEY and PARTOKENS_MODEL\")\n\nclient = OpenAI(\n    api_key=api_key,\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=model,\n    messages=[{\"role\": \"user\", \"content\": \"Reply with: connection successful\"}],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"The response contains no chat text\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "errors",
        "title": "处理错误",
        "blocks": [
          {
            "type": "list",
            "items": [
              "连接错误：检查 DNS、TLS、代理和网络后再重试。",
              "HTTP 错误：读取状态、`error.message` 和 `X-Oneapi-Request-Id`，先修正 400、401 或 403。",
              "429：遵循 `Retry-After`，否则使用带抖动的指数退避。",
              "5xx：设置最大次数和总时限后退避重试。",
              "超时：设置 SDK 超时时间；聊天请求可能已经执行，确认使用记录后再决定是否重试。"
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "从控制台打开生图工作台，选择当前模型和密钥，生成或编辑图像并保存需要的结果。",
    "prerequisites": [
      "可以登录 Partokens 控制台",
      "账户中有可用的图像模型和 API 密钥"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "打开工作台",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "进入控制台",
                "body": "登录 Partokens，打开控制台。"
              },
              {
                "title": "打开生图工作台",
                "body": "在侧栏的“工作区”中选择“生图工作台”。"
              },
              {
                "title": "确认工作区",
                "body": "左侧为生成设置，右侧为本次生成结果。"
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "选择模型与密钥",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "选择模型",
                "body": "在“模型”中选择当前列表提供的图像模型，并将该精确值作为 `<YOUR_MODEL_ID>`；不要手动猜写模型名。"
              },
              {
                "title": "选择 API 密钥",
                "body": "首次生成时，在“需要 API 密钥”窗口选择与该模型兼容的有效密钥，然后继续生成。"
              },
              {
                "title": "没有可用密钥时",
                "body": "使用窗口中的“创建密钥”，或打开“API 密钥”页面后创建可用于所选模型的密钥，再返回工作台。"
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "生成或编辑图像",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "填写提示词",
                "body": "在“提示词”中描述需要生成或编辑的图像。"
              },
              {
                "title": "设置输出",
                "body": "从界面提供的选项中选择质量、图像尺寸和生成数量。"
              },
              {
                "title": "按需添加参考图",
                "body": "上传 PNG、JPG 或 WebP 参考图进行编辑；也可以对生成结果选择“用作参考图”。"
              },
              {
                "title": "开始任务",
                "body": "选择“生成”，等待结果区域显示图像；若模型不接受某项设置，改用该模型当前提供的选项后再试。"
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "保存与处理失败",
        "blocks": [
          {
            "type": "list",
            "items": [
              "保存结果：在需要保留的图像上选择下载；下一次生成会替换当前显示的结果。",
              "生成失败或参数不支持：读取页面错误，改用当前模型提供的质量、尺寸或数量，并移除不兼容设置。",
              "401：检查所选 API 密钥是否仍然有效；403：检查密钥对模型的访问、账户余额和套餐。修正前不要重复生成。",
              "429：按响应提示等待后再重试；5xx：保留请求信息，仅在有限次数和总时限内退避重试。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "取消或超时后先查日志",
            "body": "离开生成中的页面并确认停止，或等待超时后，先到控制台“使用日志”按时间、模型和请求 ID 核对是否形成记录和扣减，再决定是否重试。"
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "使用 Partokens Base URL 和 Bearer API 密钥发送 HTTPS 请求，并按 HTTP 状态和响应正文处理结果。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "已从模型列表复制要调用的模型 ID"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "发送请求",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "在请求头中发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。",
              "带 JSON 正文的请求同时发送 `Content-Type: application/json`。",
              "不要把 API 密钥写入 URL、客户端代码或日志。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "运行最小请求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：填写模型列表返回的精确模型 ID。",
              "`messages`：填写按顺序发送给模型的消息数组。",
              "`messages[].role`：最小文本请求使用 `user`。",
              "`messages[].content`：填写非空文本。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"用一句话介绍 Partokens\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"响应中没有聊天文本\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"响应中没有聊天文本\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "读取响应",
        "blocks": [
          {
            "type": "list",
            "items": [
              "先检查 HTTP 状态；2xx 表示 HTTP 请求成功。",
              "解析 JSON 后，按对应接口读取结果字段，例如聊天的 `choices`、图像的 `data` 或模型列表的 `data`。",
              "非 2xx 响应读取 `error.message`，并在返回时同时记录 `error.code`。"
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "处理错误",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：修正 JSON 或请求字段后再发送。",
              "401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。",
              "429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。",
              "5xx：在有限次数和总时限内使用指数退避重试。",
              "网络错误或超时：先确认是否收到 HTTP 响应，再决定是否重试。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "安全重试",
            "body": "GET 请求可以在总时限内重试；聊天和图像 POST 只有在应用可以接受重复结果和重复用量时才自动重试。"
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "发送消息数组生成聊天回复，并从 `choices[0].message.content` 读取文本结果。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "已从模型列表复制支持聊天补全的模型 ID",
      "JavaScript 与 Python 示例需要 OpenAI SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "发送请求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Chat Completions",
            "path": "https://partokens.com/v1/chat/completions"
          },
          {
            "type": "list",
            "items": [
              "发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。",
              "发送 `Content-Type: application/json` 请求头。",
              "使用 SDK 时将 Base URL 设置为 `https://partokens.com/v1`。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "填写请求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：填写模型列表返回的精确模型 ID。",
              "`messages`：填写按顺序发送给模型的消息数组。",
              "`messages[].role`：最小文本请求使用 `user`。",
              "`messages[].content`：填写该条消息的非空文本。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"用一句话介绍 Partokens\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"响应中没有聊天文本\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"用一句话介绍 Partokens\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"响应中没有聊天文本\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "读取响应",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`：读取第一条候选的文本回复。",
              "`choices[0].finish_reason`：读取该候选的结束原因。",
              "`usage`：响应返回时可读取输入、输出和总 Token 数。"
            ]
          },
          {
            "type": "paragraph",
            "text": "如果 `choices` 为空或第一条结果没有文本，应将该响应视为没有可用聊天结果。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "处理错误",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：根据 `error.message` 修正 `model`、`messages` 或消息字段。",
              "401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。",
              "429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。",
              "5xx：在有限次数和总时限内使用指数退避重试。",
              "网络错误或超时：请求可能已经执行；不要立即重复发送。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "避免重复生成",
            "body": "只有在应用可以接受重复回复和重复用量，并且已设置超时和最大尝试次数时，才自动重试聊天请求。"
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "发送提示词生成图像，并从 `data[0].url` 或 `data[0].b64_json` 保存结果。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "已从模型列表复制支持图像生成的模型 ID",
      "Shell 示例需要 cURL、jq 和 OpenSSL；JavaScript 与 Python 示例需要 OpenAI SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "发送请求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Image Generations",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。",
              "发送 `Content-Type: application/json` 请求头。",
              "使用 SDK 时将 Base URL 设置为 `https://partokens.com/v1`。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "填写请求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：填写模型列表返回的精确图像模型 ID。",
              "`prompt`：填写要生成图像的非空文本描述。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nset -euo pipefail\n\nresponse=\"$(curl --silent --show-error --fail-with-body \\\n  https://partokens.com/v1/images/generations \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"prompt\": \"一枚放在白色桌面上的玻璃纸镇，柔和自然光\"\n  }')\"\n\nimage_url=\"$(printf '%s' \"$response\" | jq -r '.data[0].url // empty')\"\nif [ -n \"$image_url\" ]; then\n  curl --fail --location \"$image_url\" --output image-result\nelse\n  printf '%s' \"$response\" | jq -er '.data[0].b64_json' \\\n    | openssl base64 -d -A > image-result\nfi"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport { writeFile } from \"node:fs/promises\";\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst result = await client.images.generate({\n  model: \"<YOUR_MODEL_ID>\",\n  prompt: \"一枚放在白色桌面上的玻璃纸镇，柔和自然光\",\n});\n\nconst image = result.data?.[0];\nif (!image) throw new Error(\"响应中没有图片结果\");\n\nif (image.url) {\n  const download = await fetch(image.url);\n  if (!download.ok) throw new Error(\"下载失败：\" + download.status);\n  await writeFile(\"image-result\", Buffer.from(await download.arrayBuffer()));\n} else if (image.b64_json) {\n  await writeFile(\"image-result\", Buffer.from(image.b64_json, \"base64\"));\n} else {\n  throw new Error(\"响应既没有 url，也没有 b64_json\");\n}"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport base64\nimport os\nfrom urllib.request import urlopen\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresult = client.images.generate(\n    model=\"<YOUR_MODEL_ID>\",\n    prompt=\"一枚放在白色桌面上的玻璃纸镇，柔和自然光\",\n)\n\nif not result.data:\n    raise RuntimeError(\"响应中没有图片结果\")\n\nimage = result.data[0]\nif image.url:\n    with urlopen(image.url) as download:\n        content = download.read()\nelif image.b64_json:\n    content = base64.b64decode(image.b64_json, validate=True)\nelse:\n    raise RuntimeError(\"响应既没有 url，也没有 b64_json\")\n\nwith open(\"image-result\", \"wb\") as output:\n    output.write(content)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "读取响应",
        "blocks": [
          {
            "type": "list",
            "items": [
              "先确认 `data` 数组不为空。",
              "存在 `data[0].url` 时下载该 URL，并检查下载请求的 HTTP 状态。",
              "不存在 URL 但存在 `data[0].b64_json` 时，将 Base64 解码为二进制文件。",
              "两种字段都不存在时，将响应视为没有可用图像结果。"
            ]
          },
          {
            "type": "paragraph",
            "text": "不要把完整 Base64 图片数据写入应用日志。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "处理错误",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：根据 `error.message` 修正 `model` 或 `prompt`。",
              "401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。",
              "429：优先等待 `Retry-After` 指定的时间，否则使用带随机抖动的指数退避。",
              "5xx：在有限次数和总时限内使用指数退避重试。",
              "网络错误或超时：请求可能已经执行；不要立即重复生成。",
              "图片下载失败：单独重试下载；不要重新发送生成请求。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "避免重复生成",
            "body": "只有在应用可以接受重复图片和重复用量，并且已设置超时和最大尝试次数时，才自动重试图像生成请求。"
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "读取当前 API 密钥可用的模型列表，并把返回的模型 ID 原样用于其他 API 请求。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "Shell 示例需要 cURL 和 jq；JavaScript 与 Python 示例需要 OpenAI SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "发送请求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Models",
            "path": "https://partokens.com/v1/models"
          },
          {
            "type": "list",
            "items": [
              "发送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` 请求头。",
              "该 GET 请求不需要请求正文。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "运行最小请求",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL + jq",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nset -o pipefail\n\ncurl --silent --show-error --fail-with-body \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  | jq -er '.data[].id'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst result = await client.models.list();\nfor (const model of result.data) console.log(model.id);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresult = client.models.list()\nfor model in result.data:\n    print(model.id)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "读取响应",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "字段",
              "说明"
            ],
            "rows": [
              [
                "`object`",
                "值为 `list` 时表示模型列表。"
              ],
              [
                "`data`",
                "模型对象数组；空数组表示该密钥当前没有可用模型。"
              ],
              [
                "`data[].id`",
                "复制精确值，并写入其他请求的 `model` 字段。"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "不要改写模型 ID 的大小写，也不要添加或删除前缀。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "处理错误",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403：检查 API 密钥和访问权限；配置未修正前不要重试。",
              "429：等待 `Retry-After` 指定的时间，或使用带随机抖动的指数退避。",
              "5xx、网络错误或超时：在有限次数和总时限内重试。",
              "2xx + 空 `data`：检查 API 密钥可访问的模型，不要猜测模型 ID。"
            ]
          },
          {
            "type": "paragraph",
            "text": "模型列表是 GET 请求，可以在总时限内安全重试；每次重试都应设置超时并限制次数。"
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "回答接入、账户、模型、用量和常见失败问题，并指出应核对的实时依据。",
    "sections": [
      {
        "id": "choose-integration",
        "title": "选择接入方式",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "可以继续使用 OpenAI SDK 吗？",
                "answer": "可以。将 Base URL 设置为 `https://partokens.com/v1`，使用 Partokens API 密钥，并填写账户当前返回的精确模型 ID。"
              },
              {
                "question": "应该选择 Shell、SDK 还是兼容客户端？",
                "answer": "Shell 适合最小检查和复现；SDK 适合服务与脚本；已有客户端只有在可以自定义 Base URL、Bearer 密钥和模型 ID 时才具备接入条件。"
              },
              {
                "question": "在哪里查看完整请求示例？",
                "answer": "首次调用请阅读“快速开始：完成首次接入”；字段与响应结构请查看对应 API 页面。"
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "管理密钥与账户",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "API 密钥应该保存在哪里？",
                "answer": "将 `<YOUR_PARTOKENS_API_KEY>` 保存在环境变量或密钥管理系统中，不要写入仓库、URL、日志或浏览器代码。"
              },
              {
                "question": "如何轮换密钥？",
                "answer": "先创建并验证替代密钥，更新所有使用方，再从控制台停用或删除旧密钥。怀疑泄露时立即处置旧密钥。"
              },
              {
                "question": "余额、套餐和可用额度以哪里为准？",
                "answer": "以当前账户页面、请求的实际响应、使用日志和实际扣减为准。"
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "核对模型与用量",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "应该填写哪个模型 ID？",
                "answer": "从 `GET /v1/models` 复制当前返回的精确 ID，并原样用作 `<YOUR_MODEL_ID>`。不要猜测模型名。"
              },
              {
                "question": "模型出现在列表中就支持所有端点和参数吗？",
                "answer": "不支持这样推断。请核对模型当前显示的能力，并通过目标端点的最小请求和实际响应逐项验证。"
              },
              {
                "question": "使用日志中有记录就代表调用成功吗？",
                "answer": "不一定。还要核对记录类型、客户端收到的 HTTP 状态和错误、Token、费用与耗时。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "处理常见失败",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "请求失败时先检查什么？",
                "answer": "先用 `GET https://partokens.com/v1/models` 检查连接和鉴权，再根据 400、401、403、429 或 5xx 修正请求；保留时间、时区、端点、模型和请求 ID。"
              },
              {
                "question": "所有失败都可以直接重试吗？",
                "answer": "不可以。400、401 和 403 应先修正；429 遵循 `Retry-After` 或退避等待；5xx 只对可安全重放的请求进行有限重试。"
              },
              {
                "question": "取消或超时后应该怎么做？",
                "answer": "先在“使用日志”按时间、模型、密钥名称和请求 ID 查找记录并核对扣减，再决定是否重试。"
              },
              {
                "question": "什么时候联系支持？",
                "answer": "完成“连接、限额与重试”和“使用日志”的自助检查后，如仍无法定位，请按“联系支持”准备脱敏诊断信息。"
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "先运行最小模型列表请求，再按 HTTP 状态判断修正方式和重试条件。",
    "prerequisites": [
      "已创建 Partokens API 密钥",
      "可以查看命令返回的 HTTP 状态、响应头和响应正文"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "运行最小检查",
        "blocks": [
          {
            "type": "paragraph",
            "text": "下面的 `GET /v1/models` 不会发起生成任务，可用于检查域名解析、TLS、代理、Base URL 和鉴权。命令同时显示响应头，便于记录请求 ID。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "连接与鉴权检查",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "根据状态修正",
        "blocks": [
          {
            "type": "list",
            "items": [
              "连接错误：未收到 HTTP 状态时，检查网络、DNS、TLS、代理、连接超时，以及 URL 是否准确为 `https://partokens.com/v1/models`。",
              "400：根据返回的错误修正 JSON、必填字段、模型 ID 或目标端点；修正前不要重复请求。",
              "401：确认环境变量已设置、Bearer 头完整、密钥未被截断，并在控制台检查密钥状态。",
              "403：根据返回的错误核对密钥访问范围、模型可用性以及账户当前余额或套餐；修正后再请求。",
              "429：优先遵循 `Retry-After`；未提供时减少并发并使用带随机抖动的指数退避。",
              "5xx：保留请求 ID；仅对可以安全重放的请求进行有限退避重试。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "状态是排查起点",
            "body": "同一状态可能有不同原因。最终判断应结合响应正文、请求 ID、账户当前信息和使用日志。"
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "决定是否重试",
        "blocks": [
          {
            "type": "list",
            "items": [
              "可以重试：`GET /v1/models` 的短暂连接错误、429 等待完成后，或短暂 5xx；设置总时限和最大尝试次数。",
              "修正后再试：400、401、403，以及明确由模型、端点、参数、密钥或账户状态导致的失败。",
              "先查日志：客户端取消或超时无法证明请求未执行。先按时间、模型、密钥名称和请求 ID 核对使用日志及扣减。",
              "避免重复执行：聊天、图像生成或编辑请求只有在可以接受重复结果和重复用量时，才进行自动重试。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "取消或超时后不要立即重放",
            "body": "如果使用日志显示请求已执行或产生扣减，请先核对结果和请求 ID；如仍无法判断，准备诊断信息后联系支持。"
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "准备排障信息",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "记录请求",
                "body": "保留准确时间与时区、模型、端点、HTTP 状态和请求 ID。"
              },
              {
                "title": "保留脱敏错误",
                "body": "保留足以说明问题的错误内容，并移除凭据、个人信息、完整提示词和私有文件。"
              },
              {
                "title": "核对使用日志",
                "body": "说明是否找到对应记录，并记录所用时间范围、模型、密钥名称和请求 ID。"
              },
              {
                "title": "整理最小复现",
                "body": "列出最少步骤、预期结果和实际结果，再按“联系支持”选择正式渠道。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "不要提交凭据",
            "body": "支持信息中不得包含完整 API 密钥、密码、验证码或会话令牌。"
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "在控制台查找调用记录，并核对类型、错误、Token、费用、耗时和扣减。",
    "sections": [
      {
        "id": "open-logs",
        "title": "打开使用日志",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "进入控制台",
                "body": "登录 Partokens 并打开控制台。"
              },
              {
                "title": "打开使用日志",
                "body": "在侧栏“常规”区域选择“使用日志”。"
              },
              {
                "title": "刷新当前数据",
                "body": "需要重新获取记录时选择“刷新”，再按请求发生时间开始查找。"
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "使用日志用于核对账户调用和事件；客户端收到的 HTTP 状态、响应头和脱敏错误也应同时保留。"
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "筛选调用记录",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "选择时间范围",
                "body": "选择覆盖请求发生时间的范围，并确认记录时间与客户端时间使用的时区。"
              },
              {
                "title": "选择模型",
                "body": "使用页面的模型筛选缩小结果；模型 ID 应与请求中使用的值完全一致。"
              },
              {
                "title": "按密钥名称查找",
                "body": "打开精确搜索字段菜单，选择“API 密钥名称”，输入日志中显示的密钥名称，不要输入密钥值。"
              },
              {
                "title": "按请求 ID 查找",
                "body": "打开精确搜索字段菜单，选择“请求 ID”，输入完整请求 ID。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "一次只使用足以定位记录的条件；没有结果时先检查时间范围、时区和精确值。",
              "清除不适用的筛选后重新查询，避免旧条件排除目标记录。"
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "核对结果与扣减",
        "blocks": [
          {
            "type": "list",
            "items": [
              "类型与错误：使用“类型”区分用量和错误事件；遇到错误事件时，用时间和请求 ID 对照客户端保存的 HTTP 状态与脱敏错误。",
              "Token：核对输入、输出和缓存 Token；缺失或不适用的字段不要自行推算。",
              "费用：核对记录费用和筛选范围内的费用汇总，再与账户扣减变化对照。",
              "耗时：核对总耗时；流式请求还可核对首个 Token 的耗时。",
              "详情：打开目标记录，确认请求 ID、时间、模型、密钥名称、Token、费用和耗时属于同一次调用。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "记录不等于成功",
            "body": "日志可能包含用量、错误或其他账户事件。应结合类型、客户端结果和实际扣减判断调用结果。"
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "处理失败与超时",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "关联失败记录",
                "body": "用准确时间、模型、密钥名称和请求 ID 查找目标记录，并对照客户端 HTTP 状态与脱敏错误。"
              },
              {
                "title": "核对是否产生用量",
                "body": "查看 Token、费用和耗时，判断该请求是否留下执行与扣减记录。"
              },
              {
                "title": "谨慎处理取消或超时",
                "body": "取消或超时不代表请求一定停止；确认日志和扣减后再决定是否重试。"
              },
              {
                "title": "准备支持信息",
                "body": "仍无法判断时，记录查询时间范围、时区和筛选条件，并前往“联系支持”。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "不要用敏感值搜索",
            "body": "筛选时使用密钥名称，不要粘贴完整 API 密钥；提交问题前移除凭据、个人信息、完整提示词和私有文件。"
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "完成自助检查后，通过 Partokens Email 或 Telegram 提交可关联且已经脱敏的问题报告。",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "完成联系前检查",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "复现最小请求",
                "body": "API 问题先按“连接、限额与重试”运行最小检查，并记录实际 HTTP 状态。"
              },
              {
                "title": "核对模型与账户",
                "body": "确认模型来自当前列表，并检查密钥状态、访问范围和账户当前信息。"
              },
              {
                "title": "查找使用日志",
                "body": "按时间、模型、密钥名称和请求 ID 查找记录，核对 Token、费用和耗时。"
              },
              {
                "title": "确认仍需协助",
                "body": "说明已完成的检查、预期结果和实际结果，避免只提交“不可用”。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "登录或账户问题：记录页面、准确时间与时区和脱敏错误。",
              "API 问题：记录端点、模型、HTTP 状态和请求 ID。",
              "取消或超时：先说明使用日志中是否存在记录和扣减。"
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "准备诊断信息",
        "blocks": [
          {
            "type": "list",
            "items": [
              "请求或问题发生的准确时间与时区。",
              "请求使用的精确模型 ID。",
              "API 端点或发生问题的控制台页面。",
              "实际 HTTP 状态；未收到响应时明确说明。",
              "完整请求 ID；未返回时明确说明。",
              "保留错误含义的脱敏错误信息。",
              "从最少输入开始的复现步骤、预期结果和实际结果。",
              "使用日志中是否找到记录，以及核对到的 Token、费用和耗时。"
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "移除敏感内容",
        "blocks": [
          {
            "type": "list",
            "items": [
              "禁止提交 API 密钥或其他访问凭据。",
              "禁止提交密码、验证码、恢复码、Cookie 或会话令牌。",
              "禁止提交姓名、邮箱、电话、地址、身份信息或其他个人信息。",
              "禁止提交完整提示词、完整请求正文或与复现无关的原始内容。",
              "禁止提交私有文件、私有下载地址、大段 Base64 或未经检查的日志导出。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "疑似泄露时先轮换密钥",
            "body": "立即停用或删除相关密钥，创建并验证替代密钥，再更新所有使用方。不要向支持渠道发送旧密钥。"
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "使用正式支持渠道",
        "blocks": [
          {
            "type": "paragraph",
            "text": "请选择以下任一公开支持渠道，并在首条消息中提供已脱敏的最小诊断信息。文档不承诺响应时间或解决时限。"
          },
          {
            "type": "links",
            "items": [
              {
                "label": "Email 支持",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "Telegram 支持机器人",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
