import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const zhTWDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "選擇一種整合方法，準備帳戶、API 金鑰和目前可用的模型 ID，然後完成一次最小呼叫。",
    "sections": [
      {
        "id": "choose-path",
        "title": "選擇整合路徑",
        "blocks": [
          {
            "type": "paragraph",
            "text": "每種整合方法都使用相同的帳戶存取權、API 金鑰、模型 ID 和 OpenAI 相容的 Base URL。選擇目前任務的最短路徑。"
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL：首次連線檢查與問題重現。",
              "OpenAI JavaScript 或 Python SDK：服務、腳本和現有 SDK 專案。",
              "具有自訂 OpenAI Base URL 的用戶端：公開 Base URL、Bearer 金鑰和模型 ID 設定的現有工具。",
              "控制台工作區：直接存取帳戶目前可用的聊天或影像功能。"
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "準備帳戶和金鑰",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "建立 API 金鑰",
                "body": "登入控制台，開啟 API 金鑰，建立金鑰，並將其安全地儲存為 `<YOUR_PARTOKENS_API_KEY>`。"
              },
              {
                "title": "複製目前的模型 ID",
                "body": "使用該金鑰呼叫模型端點，然後將準確的目前 ID 複製為 `<YOUR_MODEL_ID>`。"
              },
              {
                "title": "儲存連線詳細資訊",
                "body": "將金鑰保存在環境變數或機密管理工具中；請勿將其放入儲存庫、URL、記錄或瀏覽器程式碼中。"
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
        "title": "完成第一次呼叫",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開啟第一個整合指南",
                "body": "前往快速啟動：首次整合並選擇 Shell、JavaScript 或 Python 範例。"
              },
              {
                "title": "替換連線值",
                "body": "保留常用的Base URL，提供`<YOUR_PARTOKENS_API_KEY>`和`<YOUR_MODEL_ID>`。"
              },
              {
                "title": "確認結果",
                "body": "傳送最小請求，先檢查HTTP狀態，並確認回應中包含可讀結果。失敗時保留請求時間、狀態和請求 ID。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "先驗證最小值",
            "body": "最小請求成功後，連線應用程式並一次新增一個可選參數。本頁不重複完整的請求範例。"
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "繼續查看文件",
        "blocks": [
          {
            "type": "list",
            "items": [
              "了解服務範圍：什麼是Partokens？",
              "管理憑證：API 金鑰管理。",
              "選擇模型並檢查價格：模型和定價以及模型 API。",
              "設定 SDK 或客戶端：SDK 設定、支援的客戶端或 Codex 和 CLI 設定。",
              "調查請求和扣款：請參閱連線、限制與重試以及使用記錄。",
              "自助檢查後取得協助：聯絡支援人員。"
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens 提供與 OpenAI 相容的 API 存取帳戶目前可用的模型和功能。",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "確認服務範圍",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens 提供與 OpenAI 相容的通用 Base URL、帳戶控制台和公開 API 文件。應用程式可以透過 HTTPS、OpenAI SDK 或可自訂 Base URL 的用戶端傳送請求。"
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "相容性並非同一性",
            "body": "OpenAI 相容性可讓您重複使用常見的連線方法和請求形狀。它不會使每個帳戶、模型、端點或可選參數都可用。"
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "選擇 API 入口點",
        "blocks": [
          {
            "type": "list",
            "items": [
              "查看模型：使用相同金鑰呼叫 `GET /v1/models`。",
              "傳送模型請求：從相關的 API 頁面中選擇與模型目前功能相符的端點，然後僅從必填欄位開始。",
              "使用 SDK 或相容客戶端：將 Base URL 設定為 `https://partokens.com/v1` 並提供 Partokens Bearer 金鑰和準確的模型 ID。",
              "直接嘗試一項功能：登入控制台並使用目前可用的聊天或影像工作區。"
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "查看即時資訊",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "檢查模型和端點",
                "body": "使用相同金鑰傳回的模型清單。"
              },
              {
                "title": "查看價格與配額",
                "body": "使用目前帳戶訊息，呼叫後使用記錄，並實際扣款。"
              },
              {
                "title": "檢視參數",
                "body": "使用相關的 API 頁面和目標模型的實際回應。請勿從模型名稱或其他服務推斷支援。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "模型",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "verify-compatibility",
        "title": "驗證相容性",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "確認客戶端設置",
                "body": "確認客戶端公開 Base URL、Bearer 金鑰和準確的模型 ID 設定。"
              },
              {
                "title": "在目標端點上執行最小請求",
                "body": "僅使用帶有端點核心欄位的 `<YOUR_PARTOKENS_API_KEY>` 和 `<YOUR_MODEL_ID>`。"
              },
              {
                "title": "一次新增一項功能",
                "body": "最小成功後，單獨新增選用參數並使用每個實際回應來確認支援。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "使用實際回應",
            "body": "看得到模型或能設定用戶端，只代表已具備整合的先決條件。目標模型對指定端點與參數的實際回應，才是相容性判斷依據。"
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "準備 API 金鑰、Base URL 和模型 ID，傳送一個最小聊天請求，並確認傳回的文字。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "帳戶可用的模型 ID"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "準備整合",
        "blocks": [
          {
            "type": "list",
            "items": [
              "準備API金鑰`<YOUR_PARTOKENS_API_KEY>`。",
              "使用 Base URL `https://partokens.com/v1`。",
              "從帳戶模型清單中複製準確的可用模型 ID `<YOUR_MODEL_ID>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "設定環境變數",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "傳送請求",
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
                "label": "Shell / 捲曲",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"Introduce Partokens in one sentence.\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"The response contains no chat text\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"The response contains no chat text\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read",
        "title": "閱讀回應",
        "blocks": [
          {
            "type": "list",
            "items": [
              "在解析 JSON 之前檢查 HTTP 狀態。",
              "讀取 `choices[0].message.content` 的第一個聊天文字。",
              "將空 `choices` 陣列或空白文字視為無可用結果。"
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "處理故障",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401：檢查 Bearer 金鑰是否完整、有效且來自預期環境。",
              "400：使用 `error.message` 修正模型、訊息或 JSON 欄位。",
              "429：等待`Retry-After`；不存在時，請使用抖動指數退避。",
              "5xx：帶回退、最大嘗試計數和總截止時間的重試。",
              "連線錯誤或逾時：確認HTTP回應是否到達；不要無條件重新發送聊天要求。"
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "選擇 Shell、OpenAI SDK 或具有自訂 Base URL 的客戶端，然後使用相同的連線設定驗證呼叫。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "可用的模型 ID"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "選擇客戶",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL：連線檢查、自動化腳本和複製。",
              "OpenAI JavaScript SDK：Node.js 服務與腳本。",
              "OpenAI Python SDK：Python 服務與腳本。",
              "Codex：使用支援 Responses API 的模型進行編碼任務。",
              "具有自訂 Base URL 的 OpenAI 相容客戶端：公開 Base URL、Bearer 金鑰和模型 ID 設定的現有客戶端。"
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "設定連線",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "將 Bearer 金鑰 `<YOUR_PARTOKENS_API_KEY>` 傳送為 `Authorization: Bearer ...`。",
              "使用確切的帳戶模型 ID `<YOUR_MODEL_ID>`。",
              "發現具有 `GET /v1/models` 的模型； Shell、SDK 和相容客戶端驗證與 `POST /v1/chat/completions` 的聊天，而 Codex 使用 `POST /v1/responses`。"
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "驗證呼叫",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / 捲曲",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"Introduce Partokens in one sentence.\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"The response contains no chat text\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"The response contains no chat text\")\nprint(text)"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "對於其他相容用戶端，執行 `GET https://partokens.com/v1/models`，然後使用相同的金鑰和模型 ID 傳送聊天請求。",
              "對於 Shell、JavaScript、Python 和相容客戶端，確認 HTTP 回應成功且可讀取 `choices[0].message.content`。",
              "設定其 Base URL、金鑰和模型後，用 `codex exec \"Reply only with: connection successful\"` 驗證 Codex。"
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "故障排除",
        "blocks": [
          {
            "type": "list",
            "items": [
              "用戶端設定錯誤：無請求或無效的 URL、Bearer 標頭或模型；重試之前更正設定。",
              "網路錯誤：無HTTP狀態到達；檢查DNS、TLS、代理程式和連線逾時。",
              "API錯誤：HTTP狀態和JSON `error`到達；將 401、400、429Z 或 ZX"
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "在控制台中建立 API 金鑰，於安全的執行環境中設定金鑰，然後依序輪替或撤銷舊金鑰。",
    "prerequisites": [
      "存取 Partokens 控制台"
    ],
    "sections": [
      {
        "id": "create",
        "title": "建立金鑰",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開放式金鑰管理",
                "body": "登入控制台，開啟 API 金鑰，然後選擇建立金鑰。"
              },
              {
                "title": "設定所需選項",
                "body": "輸入名稱並選擇群組；需要時設定配額限制和到期時間。"
              },
              {
                "title": "保存憑證",
                "body": "提交後，在金鑰清單中使用 Reveal 或 Copy，並立即將憑證放入安全的執行環境。"
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "設定金鑰",
        "blocks": [
          {
            "type": "list",
            "items": [
              "使用伺服器端環境變數或機密管理工具；切勿將金鑰放入儲存庫、URL、記錄或瀏覽器程式碼中。",
              "將其傳送為 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "設定環境變數",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "輪換撤銷",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "建立替換",
                "body": "為相同應用程式建立替換金鑰並安全儲存。"
              },
              {
                "title": "先驗證一下",
                "body": "先在一個受控環境中切換金鑰，並呼叫 `GET /v1/models` 確認替換金鑰可用。"
              },
              {
                "title": "每次使用時更換",
                "body": "更新服務、作業和機密管理器值，然後確認新設定處於活動狀態。"
              },
              {
                "title": "停用舊金鑰",
                "body": "從金鑰清單操作中，選擇停用以暫停或選擇刪除以刪除舊金鑰。"
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "異常處理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401：檢查環境變數、Bearer頭和金鑰狀態；確保舊值未使用。",
              "403：在重試之前檢查金鑰組、存取範圍和啟用狀態。",
              "疑似暴露：立即停用或刪除金鑰，建立並驗證替換項，然後更新每次使用。",
              "過期、停用或耗盡的金鑰：請勿重複重試；建立一個替換並驗證它。"
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "在控制台中查看餘額、方案與用量，選擇計費來源，並處理額度不足的情況。",
    "prerequisites": [
      "存取 Partokens 控制台"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "查看餘額和計劃",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開放式皮夾",
                "body": "登入控制台，選擇側邊欄「帳戶」下的「錢包」。"
              },
              {
                "title": "查看帳戶狀態",
                "body": "在頁面頂部，查看帳戶餘額、總使用量和活動計劃計數。"
              },
              {
                "title": "審核計畫配額",
                "body": "在「選擇計畫」中，選擇「檢視活動」並檢查每個計畫狀態、總配額、剩餘配額和已使用百分比。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "帳戶餘額顯示目前可用餘額。",
              "總使用量顯示該帳戶已記錄的使用量。",
              "活動計畫詳細資料顯示仍可使用的計畫及其剩餘配額。"
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "選擇計費來源",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "找偏好",
                "body": "在「皮夾選擇套餐」底部，找到「使用情況計費首選項」。您可以在有效計劃可用時更改它。"
              },
              {
                "title": "選擇目前首選項",
                "body": "選擇先訂閱、先結餘、僅訂閱或僅餘額，然後等待更新成功再呼叫 API。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "訂閱優先和餘額優先選擇先嘗試哪個來源。",
              "僅限訂閱和僅限餘額會將用量限制在該來源。",
              "在變更首選項之前，請確認所選來源目前可用。"
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "回顧使用情況",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開啟使用記錄",
                "body": "在控制台側邊欄中，選擇常規下的 使用記錄。"
              },
              {
                "title": "縮小時間與模型",
                "body": "選擇涵蓋呼叫的範圍，然後選擇模型。若要進行精確查找，請將搜尋欄位變更為請求 ID 並輸入完整的請求 ID。"
              },
              {
                "title": "比較呼叫與扣除",
                "body": "開啟匹配記錄並查看其時間、類型、模型、錯誤、使用情況、費用和請求 ID，然後將其與錢包中的餘額或剩餘計劃配額進行比較。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "解決配額不足",
        "blocks": [
          {
            "type": "list",
            "items": [
              "餘額不足：檢查錢包並使用目前可用的儲值選項，或切換到有可用額度的套餐。",
              "計劃不足或不可用：開啟活動計劃詳細資訊並檢查其狀態和剩餘配額；選擇目前可用的計劃或將計費首選項變更為可用來源。",
              "被拒絕的請求：保留 HTTP 的狀態、錯誤和請求 ID，然後檢查 使用記錄 的記錄。對於 401 或 403，也要檢查 API 金鑰狀態和存取權。",
              "更正餘額、計劃、計費首選項或金鑰後，首先發送一個最小請求。不要重新提交未更改的請求。"
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "尋找目前可用的模型，查看功能和定價訊息，選擇匹配的 API，並解決模型錯誤。",
    "prerequisites": [
      "存取 Partokens 帳戶",
      "透過 API 查詢時的 API 金鑰 `<YOUR_PARTOKENS_API_KEY>`"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "找模型",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "查看帳戶模型",
                "body": "使用目前 API 金鑰呼叫模型端點，以查看目前為帳戶傳回的模型。"
              },
              {
                "title": "查詢某一key的模型",
                "body": "您也可以使用 `<YOUR_PARTOKENS_API_KEY>` 呼叫模型端點來查看目前為該金鑰傳回的模型。"
              },
              {
                "title": "複製模型 ID",
                "body": "從模型清單回應或其中的 `data[].id` 複製準確的模型 ID，並在以後的請求中將其原封不動地用作 `<YOUR_MODEL_ID>`。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "模型",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "check-capability-price",
        "title": "查看功能和價格",
        "blocks": [
          {
            "type": "list",
            "items": [
              "使用模型清單回應確認 `<YOUR_MODEL_ID>`，並在呼叫前查看相關 API 文件；計費與定價以服務傳回的目前帳戶資料為準。",
              "當功能或價格資訊不存在時，請勿從模型名稱或類似名稱推斷。",
              "呼叫前請確認目標API出現在模型目前能力資訊中。使用當時顯示的帳戶資料進行價格選擇。",
              "呼叫後在使用記錄中查看實際使用情況和扣費情況。"
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "選擇 API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions：當模型明確支援聊天完成時，發送訊息清單到`POST /v1/chat/completions`。",
              "Responses：當模型明確支援Responses時，使用`POST /v1/responses`；本機 Codex 連線使用此 API。",
              "影像 API：當模型明確支援影像時，使用 `POST /v1/images/generations` 產生影像。當提供參考影像時，生圖工作台 使用影像編輯 API。",
              "模型可能不支援每個 API 或選購參數。從對目標 API 的最小請求開始。"
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "解決模型問題",
        "blocks": [
          {
            "type": "list",
            "items": [
              "模型不可見：刷新模型。使用API時，確認`GET /v1/models`成功，並檢查`data`是否為空。",
              "模型無法呼叫：使用準確的回傳 ID 並使用相同的 API 金鑰再次查詢模型清單。當該鍵收到空列表時，請勿猜測 ID。",
              "不相容參數或 400：讀取 `error.message`，刪除選用參數，然後使用目標 API 的最小欄位重試。",
              "403：讀取錯誤，然後檢查 API 金鑰狀態、模型存取以及餘額或計劃，然後重試。",
              "模型可見但仍然失敗：保留請求時間、模型 ID、HTTP 狀態和請求 ID，然後在 使用記錄 中尋找記錄。"
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "使用模型提供者設定將本機 Codex 連線到 Partokens，並使用最少的命令驗證 Responses 呼叫。",
    "prerequisites": [
      "API 金鑰 `<YOUR_PARTOKENS_API_KEY>`",
      "支援 Responses 的模型 ID `<YOUR_MODEL_ID>`",
      "Codex 安裝並可運作"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "準備Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "運行`codex --version`，確認Codex在目前終端啟動。",
              "從 `GET https://partokens.com/v1/models` 複製準確的 `<YOUR_MODEL_ID>`，並確認其支援 Responses。",
              "準備Partokens API 金鑰`<YOUR_PARTOKENS_API_KEY>`。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "設定環境變數",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "設定連線",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開啟使用者設定",
                "body": "編輯 `~/.codex/config.toml` 並保留您仍需要的任何其他設定。"
              },
              {
                "title": "新增 Partokens 供應商",
                "body": "新增下面的模型和提供者設定。 `env_key`讀取上面設定的環境變數。"
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
        "title": "驗證呼叫",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "最小驗證",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "正常的 `connection successful` 結果確認 Codex 透過此設定發送並完成了請求。",
              "然後您可以在 使用記錄 中按時間、模型和請求 ID 找到該呼叫。"
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "處理故障",
        "blocks": [
          {
            "type": "list",
            "items": [
              "設定錯誤：如果 Codex 無法讀取檔案或使用非預期模型，請檢查 TOML 語法、`model_provider` 和 `<YOUR_MODEL_ID>`，並確認在相同終端中設定環境變數。",
              "連線錯誤：當沒有 HTTP 狀態到達時，檢查網路、代理、DNS、TLS，`base_url` 為 `https://partokens.com/v1`。",
              "HTTP/API 錯誤：對於 400、401、403、429 或 5xx，保留狀態、錯誤和要求 ID。在決定是否重試之前，請先更正參數、金鑰、存取權限或配額。",
              "模型不支援 Responses：選擇目前列出的明確支援 Responses 的模型。請勿將 `wire_api` 變更為其他值。"
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "安裝 OpenAI JavaScript 或 Python SDK，設定 Partokens Base URL 和金鑰，並從最小聊天請求中讀取文字。",
    "prerequisites": [
      "Node.js 或 Python 執行環境",
      "A Partokens API 鑰匙",
      "A 模型 ID"
    ],
    "sections": [
      {
        "id": "install",
        "title": "安裝 SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "在伺服器端專案中安裝支援的OpenAI SDK。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "安裝並設定變量",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "設定客戶端",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript 使用 `apiKey` 和 `baseURL`。",
              "Python 使用 `api_key` 和 `base_url`。",
              "將兩個SDK設定為`https://partokens.com/v1`；透過模型環境變數提供`<YOUR_MODEL_ID>`。"
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
        "title": "發送並讀取請求",
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
        "title": "處理錯誤",
        "blocks": [
          {
            "type": "list",
            "items": [
              "連線錯誤：重試前檢查 DNS、TLS、代理程式和網路。",
              "HTTP錯誤：讀取狀態，`error.message`和`X-Oneapi-Request-Id`；先修正 400、401 或 403。",
              "429：遵循`Retry-After`，或使用抖動指數退避。",
              "5xx：以最大嘗試次數和總截止時間重試。",
              "逾時：設定 SDK 逾時；聊天請求可能已經執行，因此請在重試前檢查使用記錄。"
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "從控制台開啟 生圖工作台，選擇目前模型和金鑰，產生或編輯影像，然後儲存所需的結果。",
    "prerequisites": [
      "存取 Partokens 控制台",
      "可用的影像模型和 API 金鑰"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "開啟工作區",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開啟控制台",
                "body": "登入Partokens並開啟控制台。"
              },
              {
                "title": "開啟 生圖工作台",
                "body": "在側邊欄中，選擇「工作空間」下的「Image studio」。"
              },
              {
                "title": "檢查工作空間",
                "body": "產生設定位於左側，目前結果集位於右側。"
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "選擇模型和金鑰",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "選擇模型",
                "body": "在模型中，從目前清單中選擇一個影像模型，並使用該精確值作為 `<YOUR_MODEL_ID>`。不要猜測模型名稱。"
              },
              {
                "title": "選擇 API 金鑰",
                "body": "第一代時，在「API 金鑰需求」對話方塊中選擇與此模型相容的活動金鑰，然後繼續產生。"
              },
              {
                "title": "免鑰匙可用時",
                "body": "使用對話方塊中的建立金鑰，或開啟 API 金鑰並為所選模型建立金鑰，然後傳回 生圖工作台。"
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "產生或編輯影像",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "輸入提示",
                "body": "描述在提示中產生或編輯的影像。"
              },
              {
                "title": "設定輸出",
                "body": "從顯示的選項中選擇品質、影像尺寸和影像數量。"
              },
              {
                "title": "需要時加入參考",
                "body": "上傳 PNG、JPG 或 WebP 影像進行編輯，或選擇用作產生結果的參考。"
              },
              {
                "title": "啟動任務",
                "body": "選擇產生並等待結果中的影像。如果模型拒絕某個設置，請選擇目前為該模型提供的選項之一。"
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "儲存並處理故障",
        "blocks": [
          {
            "type": "list",
            "items": [
              "儲存結果：在您需要保留的每個影像上選擇「下載影像」。下一代將取代顯示的結果集。",
              "產生失敗或參數不受支援：讀取頁面錯誤，選擇為目前模型提供的品質、尺寸或數量，並刪除不相容的設定。",
              "401：檢查所選的 API 金鑰是否仍然有效。403：檢查金鑰是否有權存取模型，以及帳戶餘額或方案是否可用。修正前不要重新生成。",
              "429：按照指示等待，然後再試一次。對於 5xx，保留請求詳細資訊並使用有總期限的有界退避。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "取消或逾時後查看記錄",
            "body": "離開進行中的生成工作並確認停止後，或發生逾時後，先按時間、模型與請求 ID 檢查使用記錄及扣款，再決定是否重試。"
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "使用 Partokens 基礎 URL 和 Bearer API 金鑰傳送 HTTPS 請求，然後透過 HTTP 狀態和回應正文處理結果。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "從模型清單複製的模型 ID"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "發送請求",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "發送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。",
              "具有 JSON 正文的請求也需要 `Content-Type: application/json`。",
              "切勿將 API 金鑰放置在 URL、客戶端程式碼或記錄中。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "運行最小請求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：模型清單傳回的確切模型ID。",
              "`messages`：傳送到模型的有序訊息。",
              "`messages[].role`：使用 `user` 進行最小文字請求。",
              "`messages[].content`：非空白文字。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / 捲曲",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"Introduce Partokens in one sentence.\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"The response contains no chat text\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"The response contains no chat text\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "閱讀回應",
        "blocks": [
          {
            "type": "list",
            "items": [
              "先檢查HTTP狀態；2xx 狀態表示 HTTP 回應成功。",
              "解析 JSON 正文並讀取端點結果，例如用於聊天的 `choices`、用於圖像的 `data` 或用於模型的 `data`。",
              "對於非 2xx 回應，讀取 `error.message` 並記錄 `error.code`（如果存在）。"
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "處理錯誤",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：在再次發送之前更正 JSON 或請求欄位。",
              "401 / 403：檢查API金鑰並存取；不要重試未更改的憑證。",
              "429：等待 `Retry-After`（如果存在），否則使用有抖動的指數退避。",
              "5xx：使用指數退避、最大嘗試計數和總截止時間重試。",
              "網路錯誤或逾時：在決定重試之前確定 HTTP 回應是否到達。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "安全重試",
            "body": "GET 請求可以在總期限內重試；僅當應用程式接受重複的結果和使用時，才會自動重試聊天和圖像 POST 請求。"
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "傳送訊息陣列以產生聊天回應，然後從 `choices[0].message.content` 讀取文字。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "從模型清單複製的具有聊天功能的模型 ID",
      "OpenAI SDK 用於 JavaScript 和 Python 範例"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "發送請求",
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
              "發送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。",
              "發送 `Content-Type: application/json`。",
              "對於 SDK，將底座 URL 設定為 `https://partokens.com/v1`。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "填寫需求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：模型清單傳回的確切模型ID。",
              "`messages`：傳送到模型的有序訊息。",
              "`messages[].role`：使用 `user` 進行最小文字請求。",
              "`messages[].content`：訊息的非空文字。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / 捲曲",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --fail-with-body https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"messages\": [\n      {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"}\n    ]\n  }'"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"<YOUR_MODEL_ID>\",\n  messages: [\n    { role: \"user\", content: \"Introduce Partokens in one sentence.\" },\n  ],\n});\n\nconst text = response.choices[0]?.message?.content;\nif (!text) throw new Error(\"The response contains no chat text\");\nconsole.log(text);"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"<YOUR_MODEL_ID>\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"Introduce Partokens in one sentence.\"},\n    ],\n)\n\ntext = response.choices[0].message.content\nif not text:\n    raise RuntimeError(\"The response contains no chat text\")\nprint(text)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "閱讀回應",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`：來自第一位候選人的文字。",
              "`choices[0].finish_reason`：為什麼那個候選人停止了。",
              "`usage`：傳回時的輸入、輸出和總Token計數。"
            ]
          },
          {
            "type": "paragraph",
            "text": "將空 `choices` 陣列或沒有文字的第一個候選者視為沒有可用聊天結果的回應。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "處理錯誤",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：使用`error.message`修正`model`、`messages`或訊息欄位。",
              "401 / 403：檢查API金鑰並存取；不要重試未更改的憑證。",
              "429：等待 `Retry-After`（如果存在），否則使用具有抖動的指數退避。",
              "5xx：使用指數退避、最大嘗試計數和總截止時間重試。",
              "網路錯誤或逾時：請求可能已運作；請勿立即重新傳送。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "避免重複生成",
            "body": "只有當應用程式接受重複回覆和使用且用戶端設定逾時和最大嘗試計數時，才會自動重試聊天要求。"
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "傳送產生影像的提示，然後儲存 `data[0].url` 或 `data[0].b64_json` 的結果。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "從模型清單複製的具有影像功能的模型 ID",
      "cURL、jq 和 OpenSSL 適用於 Shell；OpenAI SDK 適用於 JavaScript 和 Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "發送請求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "影像生成",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "發送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。",
              "發送 `Content-Type: application/json`。",
              "對於 SDK，將底座 URL 設定為 `https://partokens.com/v1`。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "填寫需求",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`：模型清單傳回的精確影像模型ID。",
              "`prompt`：影像的非空白文字描述。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / 捲曲",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nset -euo pipefail\n\nresponse=\"$(curl --silent --show-error --fail-with-body \\\n  https://partokens.com/v1/images/generations \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"model\": \"<YOUR_MODEL_ID>\",\n    \"prompt\": \"A glass paperweight on a white table in soft natural light\"\n  }')\"\n\nimage_url=\"$(printf '%s' \"$response\" | jq -r '.data[0].url // empty')\"\nif [ -n \"$image_url\" ]; then\n  curl --fail --location \"$image_url\" --output image-result\nelse\n  printf '%s' \"$response\" | jq -er '.data[0].b64_json' \\\n    | openssl base64 -d -A > image-result\nfi"
              },
              {
                "language": "javascript",
                "label": "JavaScript",
                "code": "// PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" node example.mjs\nimport { writeFile } from \"node:fs/promises\";\nimport OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.PARTOKENS_API_KEY,\n  baseURL: \"https://partokens.com/v1\",\n});\n\nconst result = await client.images.generate({\n  model: \"<YOUR_MODEL_ID>\",\n  prompt: \"A glass paperweight on a white table in soft natural light\",\n});\n\nconst image = result.data?.[0];\nif (!image) throw new Error(\"The response contains no image result\");\n\nif (image.url) {\n  const download = await fetch(image.url);\n  if (!download.ok) throw new Error(\"Download failed: \" + download.status);\n  await writeFile(\"image-result\", Buffer.from(await download.arrayBuffer()));\n} else if (image.b64_json) {\n  await writeFile(\"image-result\", Buffer.from(image.b64_json, \"base64\"));\n} else {\n  throw new Error(\"The response contains neither url nor b64_json\");\n}"
              },
              {
                "language": "python",
                "label": "Python",
                "code": "# PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\" python example.py\nimport base64\nimport os\nfrom urllib.request import urlopen\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"PARTOKENS_API_KEY\"],\n    base_url=\"https://partokens.com/v1\",\n)\n\nresult = client.images.generate(\n    model=\"<YOUR_MODEL_ID>\",\n    prompt=\"A glass paperweight on a white table in soft natural light\",\n)\n\nif not result.data:\n    raise RuntimeError(\"The response contains no image result\")\n\nimage = result.data[0]\nif image.url:\n    with urlopen(image.url) as download:\n        content = download.read()\nelif image.b64_json:\n    content = base64.b64decode(image.b64_json, validate=True)\nelse:\n    raise RuntimeError(\"The response contains neither url nor b64_json\")\n\nwith open(\"image-result\", \"wb\") as output:\n    output.write(content)"
              }
            ]
          }
        ]
      },
      {
        "id": "read-response",
        "title": "閱讀回應",
        "blocks": [
          {
            "type": "list",
            "items": [
              "確認 `data` 陣列不為空。",
              "當 `data[0].url` 存在時，下載它並檢查下載 HTTP 狀態。",
              "當不存在 URL 但存在 `data[0].b64_json` 時，將 Base64 值解碼為二進位。",
              "將沒有任何欄位的結果視為沒有可用影像的回應。"
            ]
          },
          {
            "type": "paragraph",
            "text": "請勿將完整的 Base64 影像資料寫入應用程式記錄。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "處理錯誤",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400：使用`error.message`校正`model`或`prompt`。",
              "401 / 403：檢查API金鑰並存取；不要重試未更改的憑證。",
              "429：等待 `Retry-After`（如果存在），否則使用有抖動的指數退避。",
              "5xx：使用指數退避、最大嘗試計數和總截止時間重試。",
              "網路錯誤或逾時：要求可能已運作；不要立即再次產生。",
              "圖片下載失敗：重試下載，無需重新傳送產生請求。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "避免重複生成",
            "body": "僅當應用程式接受重複影像和使用情況並且用戶端設定逾時和最大嘗試計數時，才會自動重試圖像生成。"
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "讀取目前 API 金鑰可用的模型，並在其他要求中重複使用精確傳回的模型 ID。",
    "prerequisites": [
      "A Partokens API 鑰匙",
      "cURL 和 jq 為 Shell; OpenAI SDK 適用於 JavaScript 和 Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "發送請求",
        "blocks": [
          {
            "type": "endpoint",
            "method": "GET",
            "label": "模型",
            "path": "https://partokens.com/v1/models"
          },
          {
            "type": "list",
            "items": [
              "發送 `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`。",
              "此 GET 請求沒有請求正文。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "運行最小請求",
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
        "title": "閱讀回應",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "現場",
              "意義"
            ],
            "rows": [
              [
                "`object`",
                "`list` 的值標識模型清單。"
              ],
              [
                "`data`",
                "模型陣列；空陣列表示該金鑰目前沒有可用模型。"
              ],
              [
                "`data[].id`",
                "將準確值複製到另一個要求的 `model` 欄位中。"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "請勿變更模型 ID 的字母大小寫或新增或刪除前綴。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "處理錯誤",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403：檢查API金鑰並存取；不要重試未更改的憑證。",
              "429：等待`Retry-After`，或使用有抖動的指數退避。",
              "5xx、網路錯誤或逾時：以最大嘗試次數和總截止時間重試。",
              "2xx 帶空 `data`：檢查鑰匙可用的模型；不要猜測模型 ID。"
            ]
          },
          {
            "type": "paragraph",
            "text": "模型清單是 GET 請求，可在總期限內安全重試；設定逾時並限制嘗試次數。"
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "回答整合、帳戶、模型、使用和常見故障問題，並提供即時來源以供檢查。",
    "sections": [
      {
        "id": "choose-integration",
        "title": "選擇整合方法",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "我可以繼續使用 OpenAI SDK 嗎？",
                "answer": "是的。將 Base URL 設定為 `https://partokens.com/v1`，使用 Partokens API 金鑰，並提供目前為帳戶傳回的確切模型 ID。"
              },
              {
                "question": "我應該使用 Shell、SDK 還是相容客戶端？",
                "answer": "使用 Shell 進行最少的檢查和複製，使用 SDK 用於服務和腳本，以及僅在現有客戶端公開 Base URL、Bearer 金鑰和模型 ID 設定時。"
              },
              {
                "question": "完整的請求範例在哪裡？",
                "answer": "首次呼叫請參閱「快速開始：完成首次接入」；欄位與回應格式請參閱對應的 API 頁面。"
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "管理金鑰與帳戶",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "我應該在哪裡儲存 API 金鑰？",
                "answer": "將 `<YOUR_PARTOKENS_API_KEY>` 儲存在環境變數或機密管理工具中。請勿將其放入儲存庫、URL、記錄或瀏覽器程式碼中。"
              },
              {
                "question": "如何輪換金鑰？",
                "answer": "先建立並驗證替代金鑰，更新每個使用端，然後在控制台中停用或刪除舊金鑰。如果懷疑金鑰外洩，請立即停用舊金鑰。"
              },
              {
                "question": "在哪裡查看餘額、計劃和可用配額？",
                "answer": "查看目前的帳戶頁面、請求的實際回應、使用記錄和實際扣款。"
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "查看類型及用途",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "我應該使用哪個模型 ID？",
                "answer": "從模型或 `GET /v1/models` 複製準確的當前 ID，並將其用作 `<YOUR_MODEL_ID>`。不要猜測模型名稱。"
              },
              {
                "question": "列出的模型是否支援每個端點和參數？",
                "answer": "不要做這樣的假設。檢查模型的當前功能，並使用最小的請求及其實際回應來驗證每個目標端點和參數。"
              },
              {
                "question": "使用記錄記錄是否表示呼叫成功？",
                "answer": "不一定。也要檢查記錄類型、客戶端保存的 HTTP 狀態和錯誤、Token、成本和持續時間。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "解決常見故障",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "請求失敗時首先應該檢查什麼？",
                "answer": "使用 `GET https://partokens.com/v1/models` 檢查連線和驗證，然後根據 400、401、403、429 或 5xx 更正請求。保留時間、時區、端點、模型和請求 ID。"
              },
              {
                "question": "每次失敗都可以立即重試嗎？",
                "answer": "編號。首先修正 400、401 和 403。跟隨 `Retry-After` 或後退至 429。僅在重播安全的情況下重試 5xx 的次數有限。"
              },
              {
                "question": "取消或逾時後該怎麼辦？",
                "answer": "先依時間、模型、金鑰名稱與請求 ID 搜尋使用記錄並查看是否有扣款，再決定是否重試。"
              },
              {
                "question": "我該什麼時候聯絡支援人員？",
                "answer": "完成連線、限制與重試以及使用記錄中的檢查後，前往聯絡支援準備已移除敏感內容的診斷資訊。"
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "先執行最小模型清單請求，再依 HTTP 狀態選擇修正與重試策略。",
    "prerequisites": [
      "一組 Partokens API 金鑰",
      "可查看命令的 HTTP 狀態、回應 header 與回應正文"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "執行最小檢查",
        "blocks": [
          {
            "type": "paragraph",
            "text": "下方的 `GET /v1/models` 請求不會啟動生成任務。請用它檢查 DNS、TLS、代理設定、Base URL 與身分驗證。命令也會顯示回應 header，方便保留請求 ID。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "連線與驗證檢查",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "按狀態修復問題",
        "blocks": [
          {
            "type": "list",
            "items": [
              "連線錯誤：若未收到 HTTP 狀態，請檢查網路、DNS、TLS、代理與連線逾時，並確認 URL 正是 `https://partokens.com/v1/models`。",
              "400：依傳回的錯誤修正 JSON、必填欄位、模型 ID 或目標 endpoint。請勿原封不動地重複請求。",
              "401：確認環境變數已設定、Bearer header 完整、金鑰未遭截斷，且金鑰在控制台中仍為啟用狀態。",
              "403：依傳回的錯誤檢查金鑰存取權、模型可用性，以及帳戶目前的餘額或方案；修正問題後再重試。",
              "429：若有 `Retry-After`，請依其指示等待；否則降低並行數並使用帶有隨機抖動的指數退避。",
              "5xx：僅當請求可以安全重播時才保留請求 ID 並使用有界退避。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "狀態是起點",
            "body": "相同狀態可能有不同原因。請綜合回應正文、請求 ID、帳戶目前資訊與使用記錄完成診斷。"
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "決定是否重試",
        "blocks": [
          {
            "type": "list",
            "items": [
              "重試：`GET /v1/models`、429 在所需等待後暫時連線失敗，或 5xx 暫時連線失敗。設定總期限和最大嘗試次數。",
              "首先修正：400、401、403 以及明顯由模型、端點、參數、金鑰或帳戶狀態所造成的故障。",
              "先檢查記錄：用戶端取消或逾時並不能證明請求沒有執行。依時間、模型、金鑰名稱和請求 ID 搜尋使用記錄，然後查看任何扣款。",
              "避免重複工作：僅當重複結果和使用可接受時，自動重試聊天、影像產生或影像編輯。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "取消或逾時後不立即重播",
            "body": "如果使用記錄顯示請求已執行或已扣款，請先查看結果和請求 ID。結果仍不清楚時，請準備診斷資訊並聯絡支援人員。"
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "準備診斷",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "記錄請求",
                "body": "保留準確的時間和時區、模型、端點、HTTP 狀態和請求 ID。"
              },
              {
                "title": "保留已編輯的錯誤",
                "body": "保留足夠的錯誤文字來解釋問題並刪除憑證、個人資訊、完整提示和私人文件。"
              },
              {
                "title": "檢查使用記錄",
                "body": "說明是否找到符合的記錄，並保留用於搜尋的時間範圍、模型、金鑰名稱和請求ID。"
              },
              {
                "title": "整理最小重現步驟",
                "body": "列出最少步驟、預期結果與實際結果，再透過「聯絡支援」選擇官方管道。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "不提交憑證",
            "body": "支援資訊不得包含完整的 API 金鑰、密碼、驗證碼或工作階段 Token。"
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "在控制台中尋找呼叫並查看類型、錯誤、Token、成本、持續時間和扣除額。",
    "sections": [
      {
        "id": "open-logs",
        "title": "開啟使用記錄",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "開啟控制台",
                "body": "登入Partokens並開啟控制台。"
              },
              {
                "title": "開啟使用記錄",
                "body": "在側邊欄的常規部分中，選擇 使用記錄。"
              },
              {
                "title": "刷新目前數據",
                "body": "當需要擷取目前記錄時，選擇刷新，然後從請求時間開始。"
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "使用記錄 協助關聯帳戶呼叫和事件。也要保留客戶端收到的 HTTP 狀態、回應標頭和經過編輯的錯誤。"
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "過濾請求",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "選擇時間範圍",
                "body": "選擇包含請求時間的範圍，並確認記錄和用戶端時間戳記使用的時區。"
              },
              {
                "title": "選擇模型",
                "body": "使用模型濾鏡縮小結果範圍。模型 ID 必須與請求值完全相符。"
              },
              {
                "title": "按鍵名稱搜尋",
                "body": "開啟精確搜尋欄位選單，選擇 API 鍵名稱，然後輸入記錄中顯示的名稱。不要輸入鍵值。"
              },
              {
                "title": "按請求 ID 搜尋",
                "body": "開啟精確搜尋欄位選單，選擇請求 ID，然後輸入完整的請求 ID。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "僅使用尋找記錄所需的條件。如果沒有結果，請先檢查時間範圍、時區和精確值。",
              "在再次搜尋之前清除不適用的篩選器，以便舊條件不會排除該記錄。"
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "審核結果及扣分",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Type和error：使用Type來區分使用事件和錯誤事件。對於錯誤事件，將其時間和請求 ID 與客戶端保留的 HTTP 狀態和編輯錯誤相關聯。",
              "Token：檢查輸入、輸出和快取的Token。不要計算不存在或不適用的欄位。",
              "成本：查看記錄成本和過濾後的成本總計，然後將其與帳戶扣除額進行比較。",
              "持續時間：查看總持續時間。串流呼叫也可能顯示第一個Token的時間。",
              "詳情：開啟符合記錄，確認請求ID、時間、模型、金鑰名稱、代幣、費用、時長屬於同一個呼叫。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "記錄並不能證明成功",
            "body": "記錄可以包含使用情況、錯誤或其他帳戶事件。結合使用類型、客戶結果和實際扣除額來確定結果。"
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "處理失敗與逾時",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "關聯失敗記錄",
                "body": "使用準確的時間、模型、金鑰名稱和請求 ID，然後將記錄與客戶端 HTTP 狀態和編輯錯誤進行比較。"
              },
              {
                "title": "檢查是否記錄使用情況",
                "body": "審核代幣、費用、時長，判斷該請求是否留下執行和扣費記錄。"
              },
              {
                "title": "謹慎對待取消或超時",
                "body": "取消或逾時並不能證明處理已停止。在重試之前查看記錄和扣除。"
              },
              {
                "title": "準備支援訊息",
                "body": "如果結果仍不清楚，請保留搜尋時間範圍、時區和過濾器，然後開啟聯絡支援人員。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "不要使用秘密進行搜索",
            "body": "按金鑰名稱過濾，而不是完整的 API 金鑰。在報告問題之前，請刪除憑證、個人資訊、完整提示和私人文件。"
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "完成自助檢查後，透過 Partokens 電子郵件或 Telegram 支援傳送可供追查且已移除敏感內容的報告。",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "完成接觸前檢查",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "重現最小值",
                "body": "對於 API 問題，請在連線、限制和重試中執行最少檢查，並記錄實際的 HTTP 狀態。"
              },
              {
                "title": "查看模型和帳戶",
                "body": "確認該模型來自目前列表，然後檢查金鑰狀態、存取權限和目前帳戶資訊。"
              },
              {
                "title": "搜尋 使用記錄",
                "body": "按時間、模型、金鑰名稱和請求 ID 搜索，然後查看Token、成本和持續時間。"
              },
              {
                "title": "確認仍需要協助",
                "body": "說明已完成的檢查、預期結果和實際結果，而不是只報告某些內容不可用。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "登入或帳戶問題：保留頁面、準確時間和時區以及已編輯的錯誤。",
              "API 問題：保留端點、模型、HTTP 狀態和請求 ID。",
              "取消或逾時：首先說明使用記錄 是否有記錄和扣除。"
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "準備診斷訊息",
        "blocks": [
          {
            "type": "list",
            "items": [
              "請求或問題的確切時間和時區。",
              "要求使用的確切模型 ID。",
              "API 發生問題的端點或控制台頁面。",
              "HTTP 實際狀態，或明確聲明沒有回應到達。",
              "完整的請求 ID，或明確聲明未傳回任何內容。",
              "已編輯的錯誤，保留了失敗的含義。",
              "最小重現步驟、預期結果和實際結果。",
              "是否找到相符的使用記錄，包括已核對的 Token、費用與處理時間。"
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "刪除敏感數據",
        "blocks": [
          {
            "type": "list",
            "items": [
              "請勿提交 API 金鑰或任何其他存取憑證。",
              "請勿提交密碼、驗證碼、恢復代碼、cookie 或會話Token。",
              "請勿提交姓名、電子郵件地址、電話號碼、地址、身分詳細資料或其他個人資料。",
              "請勿提交完整的提示、完整的請求內文或與複製無關的原始內容。",
              "不要提交私人檔案、私人下載 URL、大型 Base64 值或未經審核的記錄匯出。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "在報告可疑暴露之前旋轉按鍵",
            "body": "立即停用或刪除受影響的金鑰，建立並驗證替換項，然後更新每位使用者。不要將舊金鑰發送到支援渠道。"
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "使用官方支援管道",
        "blocks": [
          {
            "type": "paragraph",
            "text": "選擇下方任一公開支援管道，並在第一則訊息中提供最少且已移除敏感內容的診斷資訊。本文不承諾回應或解決時間。"
          },
          {
            "type": "links",
            "items": [
              {
                "label": "電子郵件支援",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "Telegram 支援機器人",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
