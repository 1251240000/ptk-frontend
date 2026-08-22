import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const jaDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "統合方法を選び、アカウント、API キー、現在のモデル ID を準備して、最小構成の呼び出しを 1 回完了します。",
    "sections": [
      {
        "id": "choose-path",
        "title": "統合パスの選択",
        "blocks": [
          {
            "type": "paragraph",
            "text": "すべての統合方法は、同じアカウント アクセス、API キー、モデル ID、および OpenAI 互換の Base URL を使用します。現在のタスクの最短パスを選択します。"
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL: 最初の接続チェックと再現。",
              "OpenAI JavaScript または Python SDK: サービス、スクリプト、および既存の SDK プロジェクト。",
              "カスタム OpenAI Base URL を持つクライアント: Base URL、Bearer キー、およびモデル ID 設定を公開する既存のツール。",
              "コンソール ワークスペース: アカウントで現在利用可能なチャットまたは画像機能に直接アクセスします。"
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "アカウントとキーを準備する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "API キーを作成します",
                "body": "コンソールにサインインし、API キーを開いてキーを作成し、それを `<YOUR_PARTOKENS_API_KEY>` として安全に保存します。"
              },
              {
                "title": "現在のモデル ID をコピーします",
                "body": "そのキーでモデル エンドポイントを呼び出し、正確な現在の ID を `<YOUR_MODEL_ID>` としてコピーします。"
              },
              {
                "title": "接続の詳細を保存します",
                "body": "キーを環境変数またはシークレット マネージャーに保存します。リポジトリ、URL、ログ、ブラウザ コードには置かないでください。"
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
        "title": "最初の呼び出しを完了する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "最初の統合ガイドを開く",
                "body": "[クイック スタート: 最初の統合] に移動し、Shell、JavaScript、または Python の例を選択します。"
              },
              {
                "title": "接続値を置き換えます",
                "body": "共通の Base URL を保持し、`<YOUR_PARTOKENS_API_KEY>` および `<YOUR_MODEL_ID>` を提供します。"
              },
              {
                "title": "結果を確認する",
                "body": "最小限のリクエストを送信し、最初に HTTP ステータスを確認し、応答に読み取り可能な結果が含まれていることを確認します。失敗した場合でも、リクエストの時刻、ステータス、リクエスト ID を保持します。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "最初に最小構成を確認してください",
            "body": "最小限のリクエストが成功したら、アプリケーションに接続し、オプションのパラメーターを一度に 1 つずつ追加します。このページでは、完全なリクエスト例を繰り返しません。"
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "ドキュメントを続けます",
        "blocks": [
          {
            "type": "list",
            "items": [
              "サービス範囲を理解する: Partokens とは何ですか?",
              "資格情報の管理: API キー管理。",
              "モデルを選択して価格を確認します: モデルと価格およびモデル API。",
              "SDK またはクライアントを構成します: SDK セットアップ、サポートされているクライアント、または Codex および CLI セットアップ。",
              "リクエストと差し引きを調査します: 接続、制限、再試行と 使用状況ログ。",
              "セルフチェック後にサポートを受ける：サポートへの連絡を参照してください。"
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens は、アカウントで現在利用可能なモデルと機能への OpenAI 互換の API アクセスを提供します。",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "サービス範囲の確認",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens は、共通の OpenAI 互換の Base URL、アカウント コンソール、および API の公開ドキュメントを提供します。アプリケーションは、HTTPS、OpenAI SDK、またはカスタム Base URL を使用するクライアントを通じてリクエストを送信できます。"
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "互換性は同一性ではありません",
            "body": "OpenAI との互換性により、一般的な接続方法とリクエスト形式を再利用できます。すべてのアカウント、モデル、エンドポイント、またはオプションのパラメーターが使用可能になるわけではありません。"
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "API エントリ ポイントを選択してください",
        "blocks": [
          {
            "type": "list",
            "items": [
              "モデルの表示: 同じキーで `GET /v1/models` を呼び出します。",
              "モデル リクエストを送信します。関連する API ページからモデルの現在の機能に一致するエンドポイントを選択し、必須フィールドのみから開始します。",
              "SDK または互換性のあるクライアントを使用します。Base URL を `https://partokens.com/v1` に設定し、Partokens Bearer キーと正確なモデル ID を指定します。",
              "機能を直接試してください: コンソールにサインインし、現在利用可能なチャットまたはイメージ ワークスペースを使用します。"
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "ライブ情報をチェック",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "モデルとエンドポイントを確認する",
                "body": "同じキーで返されたモデル リストを使用します。"
              },
              {
                "title": "価格と割り当てを確認する",
                "body": "現在のアカウント情報、呼び出し後の 使用状況ログ、および実際の差し引きを使用します。"
              },
              {
                "title": "パラメータを確認してください",
                "body": "該当する API ページと対象モデルの実際の応答を使用してください。モデル名や別のサービスからサポートを推測しないでください。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "モデル",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "verify-compatibility",
        "title": "互換性を確認する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "クライアント設定の確認",
                "body": "クライアントが Base URL、Bearer キー、および正確なモデル ID 設定を公開していることを確認します。"
              },
              {
                "title": "ターゲット エンドポイントで最小限のリクエストを実行します",
                "body": "エンドポイントのコア フィールドのみで `<YOUR_PARTOKENS_API_KEY>` および `<YOUR_MODEL_ID>` を使用します。"
              },
              {
                "title": "機能を一度に 1 つずつ追加します",
                "body": "最小構成が成功したら、オプションのパラメーターを個別に追加し、実際の各応答を使用してサポートを確認します。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "実際の応答を使用する",
            "body": "表示されるモデルまたは構成可能なクライアントは、統合の前提条件を確認するだけです。ターゲット エンドポイントおよびパラメーターに対するターゲット モデルの応答が互換性の結果です。"
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "API キー、Base URL、モデル ID を準備し、最小構成のチャットリクエストを 1 回送信して、返されたテキストを確認します。",
    "prerequisites": [
      "Partokens API キー",
      "アカウントで使用できるモデル ID"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "統合の準備",
        "blocks": [
          {
            "type": "list",
            "items": [
              "API キー `<YOUR_PARTOKENS_API_KEY>` を準備します。",
              "Base URL `https://partokens.com/v1` を使用します。",
              "アカウント モデル リストから利用可能な正確なモデル ID `<YOUR_MODEL_ID>` をコピーします。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "環境変数を設定する",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "リクエストを送信する",
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
        "title": "応答を読む",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JSON を解析する前に、HTTP ステータスを確認してください。",
              "`choices[0].message.content` からの最初のチャット テキストを読みます。",
              "空の `choices` 配列または空のテキストを使用可能な結果として扱いません。"
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "エラーに対処する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: Bearer キーが完全で有効であり、意図した環境のものであることを確認します。",
              "400: `error.message` を使用して、モデル、メッセージ、または JSON フィールドを修正します。",
              "429: `Retry-After` を待ちます。存在しない場合は、ジッター指数バックオフを使用します。",
              "5xx: バックオフ、最大試行回数、合計期限を指定して再試行します。",
              "接続エラーまたはタイムアウト: HTTP 応答が到着したかどうかを確認します。無条件にチャットリクエストを再送信しないでください。"
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "Shell、OpenAI SDK、またはカスタム Base URL を持つクライアントを選択し、同じ接続設定で呼び出しを確認します。",
    "prerequisites": [
      "Partokens API キー",
      "利用可能なモデル ID"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "クライアントを選択してください",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL: 接続チェック、自動化スクリプト、および複製。",
              "OpenAI JavaScript SDK: Node.js サービスとスクリプト。",
              "OpenAI Python SDK: Python サービスとスクリプト。",
              "Codex: Responses API をサポートするモデルを使用してタスクをコーディングします。",
              "カスタム Base URL を備えた OpenAI 互換クライアント: Base URL、Bearer キー、およびモデル ID 設定を公開する既存のクライアント。"
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "接続を構成する",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Bearer キー `<YOUR_PARTOKENS_API_KEY>` を `Authorization: Bearer ...` として送信します。",
              "正確なアカウント モデル ID `<YOUR_MODEL_ID>` を使用します。",
              "`GET /v1/models` のモデルを検索します。 Shell、SDK、および互換性のあるクライアントは、`POST /v1/chat/completions` とのチャットを検証しますが、Codex は `POST /v1/responses` を使用します。"
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "呼び出しを確認する",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
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
              "ほかの互換クライアントでは、`GET https://partokens.com/v1/models` を実行してから、同じキーとモデル ID でチャットリクエストを送信します。",
              "Shell、JavaScript、Python、および互換性のあるクライアントの場合は、成功した HTTP 応答と読み取り可能な `choices[0].message.content` を確認します。",
              "Base URL、キー、モデルを設定した後、Codex を `codex exec \"Reply only with: connection successful\"` で検証します。"
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "のトラブルシューティング",
        "blocks": [
          {
            "type": "list",
            "items": [
              "クライアント構成エラー: リクエストがないか、URL、Bearer ヘッダー、またはモデルが無効です。再試行する前に設定を修正してください。",
              "ネットワーク エラー: HTTP ステータスが到着しませんでした。 DNS、TLS、プロキシ、接続タイムアウトを確認してください。",
              "API エラー: HTTP ステータスと JSON `error` が到着しました。 401、400、429、または 5xx を、クライアントのクラッシュとしてではなく、API の結果として処理します。"
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "コンソールで API キーを作成し、安全なランタイムで構成し、古いキーを順番にローテーションまたは取り消します。",
    "prerequisites": [
      "Partokens コンソールへのアクセス"
    ],
    "sections": [
      {
        "id": "create",
        "title": "キーを作成する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "オープンキー管理",
                "body": "コンソールにサインインし、API キーを開き、[キーの作成] を選択します。"
              },
              {
                "title": "必要なオプションを設定します",
                "body": "名前を入力し、グループを選択します。必要に応じてクォータ制限と有効期限を設定します。"
              },
              {
                "title": "認証情報を保存します",
                "body": "送信後、キー リストで [表示] または [コピー] を使用し、資格情報を安全なランタイムに直ちに設定します。"
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "キーを設定する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "サーバー側の環境変数またはシークレット マネージャーを使用します。キーをリポジトリ、URL、ログ、またはブラウザ コードに決して置かないでください。",
              "`Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` として送信します。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "環境変数を設定します",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "回転および取り消し",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "代替品を作成する",
                "body": "同じアプリケーションの代替キーを作成し、安全に保管します。"
              },
              {
                "title": "まず確認してください",
                "body": "1 つの制御された環境を変更し、`GET /v1/models` を呼び出して、置き換えが機能することを確認します。"
              },
              {
                "title": "使用するたびに交換してください",
                "body": "サービス、ジョブ、および Secret-manager の値を更新し、新しい構成がアクティブであることを確認します。"
              },
              {
                "title": "古いキーを無効にする",
                "body": "キー リストのアクションから、[無効化] を選択して一時停止するか、[削除] を選択して古いキーを削除します。"
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "例外を処理します",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: 環境変数、Bearer ヘッダー、およびキーのステータスを確認します。古い値が使用されていないことを確認してください。",
              "403: 再試行する前に、キー グループ、アクセス スコープ、有効な状態を確認してください。",
              "漏洩の疑い: キーを直ちに無効化または削除し、代替キーを作成して確認し、使用するたびに更新します。",
              "キーが期限切れ、無効、または使い果たされました: 繰り返し再試行しないでください。代替品を作成して確認します。"
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "コンソールで残高、プラン、使用量を確認し、請求元を選択して、不足している割り当てを回復します。",
    "prerequisites": [
      "Partokens コンソールへのアクセス"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "残高とプランを表示する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "オープンウォレット",
                "body": "コンソールにサインインし、サイドバーの「アカウント」の下にある「ウォレット」を選択します。"
              },
              {
                "title": "アカウントのステータスを確認する",
                "body": "ページの上部で、アカウント残高、合計使用量、有効なプラン数を確認します。"
              },
              {
                "title": "プランの割り当てを確認する",
                "body": "[プランの選択] で [アクティブな表示] を選択し、各プランのステータス、合計クォータ、残りのクォータ、および使用済みの割合を確認します。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "アカウント残高には、現在利用可能な残高が表示されます。",
              "合計使用量は、アカウントに対してすでに記録されている使用量を示します。",
              "アクティブなプランの詳細には、まだ使用できるプランとその残りの割り当てが表示されます。"
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "請求元を選択してください",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "好みを探す",
                "body": "[ウォレットでプランを選択] の下部で、[使用量の請求設定] を見つけます。有効なプランが利用可能な場合は変更できます。"
              },
              {
                "title": "現在の設定を選択してください",
                "body": "[サブスクリプションを最初に]、[バランスを最初に]、[サブスクリプションのみ]、または [バランスのみ] を選択し、アップデートが成功するまで待ってから、API を呼び出します。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "サブスクリプションが最初、バランスが最初にどのソースを最初に試行するかを選択します。",
              "サブスクリプションのみおよびバランスのみは、そのソースへの使用を制限します。",
              "設定を変更する前に、選択したソースが現在利用可能であることを確認してください。"
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "使用方法を確認する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "使用状況ログを開く",
                "body": "コンソールのサイドバーで、[全般] の下の [使用状況ログ] を選択します。"
              },
              {
                "title": "時間と車種を絞り込む",
                "body": "呼び出しをカバーする範囲を選択し、モデルを選択します。正確な検索を行うには、検索フィールドをリクエスト ID に変更し、完全なリクエスト ID を入力します。"
              },
              {
                "title": "呼び出しと差し引き額を比較する",
                "body": "一致するレコードを開き、時刻、種類、モデル、エラー、使用量、費用、リクエスト ID を確認して、ウォレット残高またはプランの残りクォータと比較します。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "不足しているクォータを解決します",
        "blocks": [
          {
            "type": "list",
            "items": [
              "残高が不十分です: ウォレットを確認し、現在利用可能なチャージ オプションを使用するか、利用可能な割り当てがあるプランに切り替えてください。",
              "プランが不十分または利用不可: アクティブなプランの詳細を開いて、そのステータスと残りのクォータを確認します。現在利用可能なプランを選択するか、請求設定を利用可能なソースに変更します。",
              "拒否されたリクエスト: HTTP ステータス、エラー、リクエスト ID を保持し、使用状況ログ のレコードを確認します。 401 または 403 の場合は、API キーのステータスとアクセスも確認してください。",
              "残高、プラン、請求設定、またはキーを修正した後、最初に最小限のリクエストを 1 つ送信します。変更されていないリクエストを再送信しないでください。"
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "現在利用できるモデルを検索し、機能と価格情報を確認して、対応する API を選択し、モデルエラーを解決します。",
    "prerequisites": [
      "Partokens アカウントへのアクセス",
      "API を通じてクエリする場合の API キー `<YOUR_PARTOKENS_API_KEY>`"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "モデルを探す",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "アカウントのモデルを問い合わせる",
                "body": "現在の API キーでモデル エンドポイントを呼び出し、そのアカウントに返されたモデルを確認します。"
              },
              {
                "title": "モデルにキーを問い合わせる",
                "body": "`<YOUR_PARTOKENS_API_KEY>` を使用してモデル エンドポイントを呼び出して、そのキーに対して現在返されているモデルを確認することもできます。"
              },
              {
                "title": "モデルIDをコピーします",
                "body": "モデル一覧のレスポンスまたは `data[].id` から正確なモデル ID をコピーし、後のリクエストで `<YOUR_MODEL_ID>` として変更せずに使用します。"
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "モデル",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "check-capability-price",
        "title": "機能と価格を確認する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "モデル一覧のレスポンスで `<YOUR_MODEL_ID>` を確認し、呼び出す前に関連する API ドキュメントを確認します。請求と価格はサービスが現在返すアカウントデータを基準にします。",
              "機能や価格の情報が存在しない場合は、モデル名または類似の名前から推測しないでください。",
              "呼び出す前に、対象の API がモデルの現在の機能情報に表示されていることを確認してください。価格選択にはその時点で表示されるアカウントデータを使用します。",
              "呼び出し後、使用状況ログ で実際の使用量と差し引きを確認します。"
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "API を選択してください",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions: モデルがチャット完了を明示的にサポートする場合、メッセージ リストを `POST /v1/chat/completions` に送信します。",
              "Responses: モデルが明示的に Responses をサポートする場合は、`POST /v1/responses` を使用します。ネイティブ Codex 接続は、この API を使用します。",
              "画像 API：モデルが画像を明示的にサポートしている場合は、`POST /v1/images/generations` で画像を生成します。画像スタジオでは、参照画像を指定すると画像編集 API を使用します。",
              "モデルは、すべての API またはオプションのパラメーターをサポートしているわけではありません。ターゲット API への最小限のリクエストから始めます。"
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "モデルの問題を解決する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "モデルが表示されません: モデルを更新してください。 API を使用する場合は、`GET /v1/models` が成功したことを確認し、`data` が空かどうかを確認します。",
              "モデルを呼び出すことができません: 返された正確な ID を使用し、同じ API キーでモデル リストを再度クエリします。キーが空のリストを受け取った場合は、ID を推測しないでください。",
              "互換性のないパラメータまたは 400: `error.message` を読み取り、オプションのパラメータを削除し、ターゲット API の最小限のフィールドで再試行します。",
              "403: エラーを読み取り、API キーのステータス、モデル アクセス、およびバランスまたはプランを確認してから、再試行してください。",
              "モデルは表示されていますが、まだ失敗しています。リクエスト時間、モデル ID、HTTP ステータス、およびリクエスト ID を保持し、使用状況ログ でレコードを見つけます。"
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "モデル プロバイダー構成を使用してネイティブ Codex を Partokens に接続し、最小限のコマンドで Responses 呼び出しを検証します。",
    "prerequisites": [
      "API キー `<YOUR_PARTOKENS_API_KEY>`",
      "Responses 対応モデル ID `<YOUR_MODEL_ID>`",
      "Codex がインストールされ、実行可能"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "Codex を準備する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`codex --version` を実行し、現在の端末で Codex が起動することを確認します。",
              "`GET https://partokens.com/v1/models` から正確な `<YOUR_MODEL_ID>` をコピーし、それが Responses をサポートしていることを確認します。",
              "Partokens API キー `<YOUR_PARTOKENS_API_KEY>` を用意します。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "環境変数を設定します",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "接続を構成する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "ユーザー構成を開く",
                "body": "`~/.codex/config.toml` を編集し、必要なその他の設定はそのままにしておきます。"
              },
              {
                "title": "Partokens プロバイダーを追加します",
                "body": "以下のモデルとプロバイダー構成を追加します。 `env_key` は、上記で設定された環境変数を読み取ります。"
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
        "title": "呼び出しを確認する",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "最小限の検証",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "通常の `connection successful` 結果は、Codex がこの構成を通じてリクエストを送信し、完了したことを確認します。",
              "その後、時間、モデル、リクエスト ID によって 使用状況ログ 内のコールを検索できます。"
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "エラーに対処する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "構成エラー: Codex がファイルを読み取れない場合、または予期しないモデルを使用している場合は、TOML 構文、`model_provider`、および `<YOUR_MODEL_ID>` を確認し、環境変数が同じ端末に設定されていることを確認してください。",
              "接続エラー: HTTP ステータスが到着しない場合は、ネットワーク、プロキシ、DNS、TLS、および `base_url` が `https://partokens.com/v1` であることを確認してください。",
              "HTTP/API エラー: 400、401、403、429、または 5xx の場合は、ステータス、エラー、リクエスト ID を保持します。再試行するかどうかを決定する前に、パラメータ、キー、アクセス、またはクォータを修正してください。",
              "モデルは Responses をサポートしていません: Responses を明示的にサポートする現在リストされているモデルを選択してください。 `wire_api` を別の値に変更しないでください。"
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "OpenAI JavaScript または Python SDK をインストールし、Partokens の Base URL とキーを設定して、最小構成のチャットリクエストからテキストを読み取ります。",
    "prerequisites": [
      "Node.js または Python ランタイム",
      "Partokens API キー",
      "モデルID"
    ],
    "sections": [
      {
        "id": "install",
        "title": "SDK をインストールする",
        "blocks": [
          {
            "type": "paragraph",
            "text": "サポートされている OpenAI SDK をサーバー側プロジェクトにインストールします。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "変数のインストールと設定",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "クライアントの構成",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript は、`apiKey` および `baseURL` を使用します。",
              "Python は、`api_key` および `base_url` を使用します。",
              "両方の SDK を `https://partokens.com/v1` に設定します。モデル環境変数を通じて `<YOUR_MODEL_ID>` を提供します。"
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
        "title": "リクエストの送信と読み取り",
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
        "title": "エラーの処理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "接続エラー: 再試行する前に、DNS、TLS、プロキシ、ネットワークを確認してください。",
              "HTTP エラー: ステータス、`error.message`、および `X-Oneapi-Request-Id` を読み取ります。最初に 400、401、または 403 を修正してください。",
              "429: `Retry-After` に従うか、ジッター指数バックオフを使用します。",
              "5xx: 最大試行回数と合計期限を指定して再試行します。",
              "タイムアウト：SDK のタイムアウトを設定します。チャットリクエストがすでに実行されている可能性があるため、再試行前に使用状況ログを確認してください。"
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "コンソールから画像スタジオを開き、現在のモデルとキーを選択して画像を生成または編集し、必要な結果を保存します。",
    "prerequisites": [
      "Partokens コンソールへのアクセス",
      "利用可能な画像モデルと API キー"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "ワークスペースを開く",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "コンソールを開く",
                "body": "Partokens にサインインし、コンソールを開きます。"
              },
              {
                "title": "画像スタジオを開く",
                "body": "サイドバーで、「ワークスペース」の下の「画像スタジオ」を選択します。"
              },
              {
                "title": "ワークスペースを確認する",
                "body": "生成設定が左側にあり、現在の結果セットが右側にあります。"
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "モデルとキーを選択してください",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "モデルを選択してください",
                "body": "[モデル] で、現在のリストからイメージ モデルを選択し、その正確な値を `<YOUR_MODEL_ID>` として使用します。モデル名を推測しないでください。"
              },
              {
                "title": "API キーを選択します",
                "body": "初回の生成では、API キーを求めるダイアログでモデルに対応する有効なキーを選択し、生成を続けます。"
              },
              {
                "title": "使用可能なキーがない場合",
                "body": "ダイアログでキーの作成を使用するか、API キーを開いて選択したモデルのキーを作成してから、画像スタジオ に戻ります。"
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "画像の生成または編集",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "プロンプトを入力してください",
                "body": "プロンプトに生成または編集する画像を記述します。"
              },
              {
                "title": "出力を設定する",
                "body": "表示されるオプションから品質、画像サイズ、画像の数を選択します。"
              },
              {
                "title": "必要に応じて参照を追加します",
                "body": "PNG、JPG、または WebP 画像をアップロードして編集するか、生成された結果の参照として使用を選択します。"
              },
              {
                "title": "タスクを開始する",
                "body": "[生成] を選択し、結果で画像が表示されるまで待ちます。モデルが設定を拒否する場合は、そのモデルに現在提供されているオプションの 1 つを選択します。"
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "失敗を保存して処理する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "結果を保存する：保存する画像ごとに［画像をダウンロード］を選択します。表示中の結果は次の生成で置き換えられます。",
              "生成失敗またはサポートされていないパラメーター: ページ エラーを読み取り、現在のモデルに提供されている品質、サイズ、または数を選択し、互換性のない設定を削除します。",
              "401: 選択した API キーがまだ有効であることを確認します。 403: モデルへのキー アクセスとアカウント残高またはプランを確認します。修正されるまで再生成しないでください。",
              "429: 指示に従って待ってから再試行してください。 5xx の場合は、リクエストの詳細を保持し、合計期限を指定した制限付きバックオフを使用します。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "キャンセルまたはタイムアウト後のログの確認",
            "body": "実行中の生成を終了して停止を確認した後、またはタイムアウト後は、まず使用状況ログを時刻、モデル、リクエスト ID で検索し、記録と差し引き額を確認してから再試行を判断します。"
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "Partokens ベース URL および Bearer API キーを使用して HTTPS リクエストを送信し、HTTP ステータスと応答本文によって結果を処理します。",
    "prerequisites": [
      "Partokens API キー",
      "モデルリストからコピーされたモデル ID"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "リクエストを送信する",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "`Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` を送信します。",
              "JSON ボディを持つリクエストには、`Content-Type: application/json` も必要です。",
              "API キーを URL、クライアント側コード、またはログに決して設定しないでください。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "最小限のリクエストを実行します",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: モデル リストによって返される正確なモデル ID。",
              "`messages`: モデルに送信される順序付けされたメッセージ。",
              "`messages[].role`: 最小限のテキストリクエストには `user` を使用します。",
              "`messages[].content`: 空ではないテキスト。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
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
        "title": "応答を読む",
        "blocks": [
          {
            "type": "list",
            "items": [
              "最初に HTTP ステータスを確認します。 2xx ステータスは、HTTP 応答が成功したことを示します。",
              "JSON 本文を解析し、チャットの場合は `choices`、画像の場合は `data`、モデルの場合は `data` などのエンドポイントの結果を読み取ります。",
              "2xx 以外の応答の場合、`error.message` を読み取り、存在する場合は `error.code` を記録します。"
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "エラーの処理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: 再送信する前に、JSON またはリクエストフィールドを修正してください。",
              "401 / 403: API キーを確認してアクセスします。変更されていない認証情報を再試行しないでください。",
              "429: `Retry-After` が存在する場合は待機します。それ以外の場合は、ジッターを伴う指数バックオフを使用します。",
              "5xx: 指数バックオフ、最大試行回数、合計期限を指定して再試行します。",
              "ネットワーク エラーまたはタイムアウト: 再試行を決定する前に、HTTP 応答が到着したかどうかを確認します。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "安全に再試行してください",
            "body": "GET リクエストは合計期限内に再試行できます。アプリケーションが重複した結果と使用法を受け入れた場合にのみ、チャットとイメージ POST リクエストを自動的に再試行します。"
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "メッセージ配列を送信してチャット応答を生成し、`choices[0].message.content` からテキストを読み取ります。",
    "prerequisites": [
      "Partokens API キー",
      "モデル リストからコピーされたチャット対応モデル ID",
      "OpenAI JavaScript および Python の例の SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "リクエストを送信する",
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
              "`Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` を送信します。",
              "`Content-Type: application/json` を送信します。",
              "SDK の場合、ベース URL を `https://partokens.com/v1` に設定します。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "リクエストを記入してください",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: モデル リストによって返される正確なモデル ID。",
              "`messages`: モデルに送信される順序付けされたメッセージ。",
              "`messages[].role`: 最小限のテキストリクエストには `user` を使用します。",
              "`messages[].content`: メッセージの空ではないテキスト。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
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
        "title": "応答を読む",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`: 最初の候補からのテキスト。",
              "`choices[0].finish_reason`: なぜその候補者はやめたのか。",
              "`usage`: 返されたときの入力、出力、および合計トークン数。"
            ]
          },
          {
            "type": "paragraph",
            "text": "空の `choices` 配列、またはテキストのない最初の候補を、使用可能なチャット結果のない応答として扱います。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "エラーの処理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: `error.message` を使用して、`model`、`messages`、またはメッセージ フィールドを修正します。",
              "401 / 403: API キーを確認してアクセスします。変更されていない認証情報を再試行しないでください。",
              "429: `Retry-After` が存在する場合は待機します。それ以外の場合は、ジッターを伴う指数バックオフを使用します。",
              "5xx: 指数バックオフ、最大試行回数、合計期限を指定して再試行します。",
              "ネットワーク エラーまたはタイムアウト: リクエストが実行された可能性があります。すぐに再送しないでください。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "重複生成を避ける",
            "body": "アプリケーションが重複した返信と使用を受け入れ、クライアントがタイムアウトと最大試行回数を設定した場合にのみ、チャット リクエストを自動的に再試行します。"
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "画像を生成するプロンプトを送信し、`data[0].url` または `data[0].b64_json` からの結果を保存します。",
    "prerequisites": [
      "Partokens API キー",
      "モデル リストからコピーされたイメージ対応モデル ID",
      "Shell の cURL、jq、および OpenSSL。 JavaScript および Python の場合は、OpenAI SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "リクエストを送信する",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "イメージの生成",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "`Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` を送信します。",
              "`Content-Type: application/json` を送信します。",
              "SDK の場合、ベース URL を `https://partokens.com/v1` に設定します。"
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "リクエストを記入してください",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: モデル リストによって返される正確なイメージ モデル ID。",
              "`prompt`: 画像の空ではないテキストの説明。"
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Shell / cURL",
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
        "title": "応答を読む",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`data` 配列が空でないことを確認します。",
              "`data[0].url` が存在する場合は、それをダウンロードし、HTTP のダウンロード ステータスを確認します。",
              "URL は存在しないが、`data[0].b64_json` は存在する場合、Base64 値をバイナリ ファイルにデコードします。",
              "どちらのフィールドも含まない結果を、使用可能な画像のない応答として扱います。"
            ]
          },
          {
            "type": "paragraph",
            "text": "完全な Base64 イメージ データをアプリケーション ログに書き込まないでください。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "エラーの処理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: `error.message` を使用して、`model` または `prompt` を修正します。",
              "401 / 403: API キーを確認してアクセスします。変更されていない認証情報を再試行しないでください。",
              "429: `Retry-After` が存在する場合は待機します。それ以外の場合は、ジッターを伴う指数バックオフを使用します。",
              "5xx: 指数バックオフ、最大試行回数、合計期限を指定して再試行します。",
              "ネットワーク エラーまたはタイムアウト: リクエストが実行された可能性があります。すぐに再生成しないでください。",
              "イメージのダウンロード失敗: 生成リクエストを再送信せずにダウンロードを再試行します。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "重複生成を避ける",
            "body": "アプリケーションが重複したイメージと使用を受け入れ、クライアントがタイムアウトと最大試行回数を設定した場合にのみ、イメージ生成を自動的に再試行します。"
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "現在の API キーで利用可能なモデルを読み取り、返された正確なモデル ID を他のリクエストで再利用します。",
    "prerequisites": [
      "Partokens API キー",
      "Shell の cURL と jq。 JavaScript および Python の場合は、OpenAI SDK"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "リクエストを送信する",
        "blocks": [
          {
            "type": "endpoint",
            "method": "GET",
            "label": "モデル",
            "path": "https://partokens.com/v1/models"
          },
          {
            "type": "list",
            "items": [
              "`Authorization: Bearer <YOUR_PARTOKENS_API_KEY>` を送信します。",
              "この GET リクエストにはリクエスト本文がありません。"
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "最小限のリクエストを実行します",
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
        "title": "応答を読む",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "フィールド",
              "意味"
            ],
            "rows": [
              [
                "`object`",
                "`list` の値はモデル リストを識別します。"
              ],
              [
                "`data`",
                "モデル配列。空の配列は、キーに現在使用可能なモデルがないことを意味します。"
              ],
              [
                "`data[].id`",
                "正確な値を別のリクエストの `model` フィールドにコピーします。"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "モデル ID の大文字と小文字を変更したり、プレフィックスを追加または削除したりしないでください。"
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "エラーの処理",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403: API キーを確認してアクセスします。変更されていない認証情報を再試行しないでください。",
              "429: `Retry-After` を待つか、ジッターのある指数バックオフを使用します。",
              "5xx、ネットワーク エラー、またはタイムアウト: 最大試行回数と合計期限を指定して再試行します。",
              "2xx (空の `data`): キーで利用可能なモデルを確認します。モデル ID を推測しないでください。"
            ]
          },
          {
            "type": "paragraph",
            "text": "モデル リストは GET リクエストであり、期限内に安全に再試行できます。タイムアウトを設定し、試行回数を制限します。"
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "統合、アカウント、モデル、使用状況、よくあるエラーについての回答と、確認すべき最新情報源をまとめています。",
    "sections": [
      {
        "id": "choose-integration",
        "title": "統合方法の選択",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "OpenAI SDK を使い続けることはできますか?",
                "answer": "はい。 Base URL を `https://partokens.com/v1` に設定し、Partokens API キーを使用して、アカウントに対して現在返されている正確なモデル ID を指定します。"
              },
              {
                "question": "Shell、SDK、または互換性のあるクライアントを使用する必要がありますか?",
                "answer": "最小限のチェックと再現には Shell を使用し、サービスとスクリプトには SDK を使用し、Base URL、Bearer キー、およびモデル ID 設定を公開する場合にのみ既存のクライアントを使用します。"
              },
              {
                "question": "完全なリクエストの例はどこにありますか?",
                "answer": "クイック スタート: 最初の呼び出しでは最初の統合を使用し、フィールドと応答形状については関連する API ページを使用します。"
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "キーとアカウントの管理",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "API キーはどこに保存すればよいですか?",
                "answer": "`<YOUR_PARTOKENS_API_KEY>` を環境変数またはシークレット マネージャーに保存します。リポジトリ、URL、ログ、ブラウザ コードには置かないでください。"
              },
              {
                "question": "キーをローテーションするにはどうすればよいですか?",
                "answer": "まず代替キーを作成して確認し、すべてのコンシューマーを更新してから、コンソールで古いキーを無効にするか削除します。漏洩が疑われる場合は、古いキーに直ちに対処してください。"
              },
              {
                "question": "残高、プラン、利用可能な割り当てはどこで確認できますか?",
                "answer": "現在のアカウント ページ、リクエストの実際の応答、使用状況ログ、および実際の差し引きを使用します。"
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "機種と使い方を確認する",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "どのモデル ID を使用すればよいですか?",
                "answer": "モデルまたは `GET /v1/models` から正確な現在の ID をコピーし、変更せずに `<YOUR_MODEL_ID>` として使用します。モデル名を推測しないでください。"
              },
              {
                "question": "リストされているモデルはすべてのエンドポイントとパラメーターをサポートしていますか?",
                "answer": "そのような仮定をしないでください。モデルの現在の機能を確認し、最小限のリクエストと実際のレスポンスで各ターゲット エンドポイントとパラメータを検証します。"
              },
              {
                "question": "使用状況ログの記録は、呼び出しが成功したことを意味しますか?",
                "answer": "必ずしもそうではありません。また、レコード タイプ、クライアントによって保持される HTTP ステータスとエラー、トークン、コスト、および期間も確認します。"
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "一般的な障害を解決する",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "リクエストが失敗した場合、最初に何を確認すればよいですか?",
                "answer": "`GET https://partokens.com/v1/models` を使用して接続と認証を確認し、400、401、403、429、または 5xx に従ってリクエストを修正します。時刻、タイムゾーン、エンドポイント、モデル、リクエスト ID を保持します。"
              },
              {
                "question": "すべての失敗をすぐに再試行できますか?",
                "answer": "いいえ。最初に 400、401、および 403 を修正します。 `Retry-After` をフォローするか、429 に戻ってください。 5xx の再試行は、再試行が安全な場合にのみ、限られた回数だけ行ってください。"
              },
              {
                "question": "キャンセルまたはタイムアウトした後はどうすればよいですか?",
                "answer": "まず、時間、モデル、キー名、リクエスト ID で 使用状況ログ を検索し、推測を確認してから、再試行するかどうかを決定します。"
              },
              {
                "question": "いつサポートに連絡すればよいですか?",
                "answer": "［接続、制限、再試行］と使用状況ログの確認後、［サポートへの連絡］を参照し、機密情報を除いた診断情報を準備します。"
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "最初に最小モデル リクエストを実行し、次に HTTP ステータスを使用して修正ポリシーと再試行ポリシーを選択します。",
    "prerequisites": [
      "Partokens API キー",
      "コマンドの HTTP ステータス、応答ヘッダー、および応答本文へのアクセス"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "最小限のチェックを実行します",
        "blocks": [
          {
            "type": "paragraph",
            "text": "以下の `GET /v1/models` リクエストは生成タスクを開始しません。 DNS、TLS、プロキシ設定、Base URL、認証を確認するために使用します。このコマンドでは応答ヘッダーも表示されるため、要求 ID を保持できます。"
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "接続と認証のチェック",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "ステータスごとに問題を修正する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "接続エラー: HTTP ステータスが到着しない場合は、ネットワーク、DNS、TLS、プロキシ、接続タイムアウト、および URL が正確に `https://partokens.com/v1/models` であることを確認してください。",
              "400: 返されたエラーを使用して、JSON、必須フィールド、モデル ID、またはターゲット エンドポイントを修正します。リクエストを変更せずに繰り返さないでください。",
              "401: 環境変数が設定されていること、Bearer ヘッダーが完全であること、キーが切り捨てられていないこと、キーがコンソールで有効なままであることを確認します。",
              "403: 返されたエラーを使用して、キー アクセス、モデルの可用性、アカウントの現在の残高またはプランを確認し、再試行する前に問題を修正します。",
              "429: `Retry-After` がある場合はこれに従います。それ以外の場合は、同時実行性を減らし、ジッターのある指数バックオフを使用します。",
              "5xx: リクエスト ID を保持し、リクエストを安全に再実行できる場合にのみ制限付きバックオフを使用します。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "ステータスが出発点です",
            "body": "同じステータスでも原因が異なる場合があります。最終的な診断には、応答本文、リクエスト ID、現在のアカウント情報、および 使用状況ログ を使用します。"
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "再試行するかどうかの決定",
        "blocks": [
          {
            "type": "list",
            "items": [
              "再試行: 必要な待機後の `GET /v1/models`、429、または一時的な 5xx の一時的な接続障害。合計期限と最大試行回数を設定します。",
              "最初に正解: 400、401、403、および明らかにモデル、エンドポイント、パラメーター、キー、またはアカウントの状態によって引き起こされた障害。",
              "まずログを確認してください。クライアントのキャンセルやタイムアウトは、リクエストが実行されなかったことを証明するものではありません。 使用状況ログ を時間、モデル、キー名、リクエスト ID で検索し、差し引きを確認します。",
              "重複作業を回避します。重複した結果と使用が許容される場合にのみ、チャット、画像生成、または画像編集を自動的に再試行します。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "キャンセルまたはタイムアウトの直後に再生しない",
            "body": "使用状況ログ が実行または減点を示した場合は、最初に結果とリクエスト ID を確認します。結果が不明瞭な場合は、診断情報を準備してサポートに連絡してください。"
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "診断の準備",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "リクエストを記録します",
                "body": "正確な時刻とタイムゾーン、モデル、エンドポイント、HTTP ステータス、リクエスト ID を保持します。"
              },
              {
                "title": "機密情報を除いたエラーを保存する",
                "body": "問題を説明するのに十分なエラー テキストを保存し、資格情報、個人情報、完全なプロンプト、およびプライベート ファイルを削除します。"
              },
              {
                "title": "レビュー 使用状況ログ",
                "body": "一致するレコードが見つかったかどうかを示し、検索に使用された時間範囲、モデル、キー名、およびリクエスト ID を保持します。"
              },
              {
                "title": "最小限の複製を書く",
                "body": "最小限の手順、期待される結果、実際の結果をリストし、[サポートへのお問い合わせ] を使用して公式チャネルを選択します。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "認証情報を送信しないでください",
            "body": "サポート情報には、完全な API キー、パスワード、確認コード、またはセッション トークンが含まれていてはなりません。"
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "コンソールで呼び出しを検索し、種類、エラー、トークン、費用、処理時間、差し引き額を確認します。",
    "sections": [
      {
        "id": "open-logs",
        "title": "使用状況ログを開く",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "コンソールを開く",
                "body": "Partokens にサインインし、コンソールを開きます。"
              },
              {
                "title": "使用状況ログを開く",
                "body": "サイドバーの「全般」セクションで、「使用状況ログ」を選択します。"
              },
              {
                "title": "現在のデータを更新",
                "body": "現在のレコードを取得する必要がある場合は、[更新] を選択し、要求時刻から開始します。"
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "使用状況ログ は、アカウントの呼び出しとイベントを関連付けるのに役立ちます。また、HTTP ステータス、応答ヘッダー、およびクライアントが受信した編集されたエラーも保持します。"
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "フィルターリクエスト",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "時間範囲を選択してください",
                "body": "リクエスト時間を含む範囲を選択し、ログとクライアントのタイムスタンプで使用されるタイムゾーンを確認します。"
              },
              {
                "title": "モデルを選択してください",
                "body": "モデル フィルターを使用して結果を絞り込みます。モデル ID はリクエスト値と正確に一致する必要があります。"
              },
              {
                "title": "キー名で検索",
                "body": "完全一致検索フィールド メニューを開き、API キー名を選択し、ログに表示される名前を入力します。キー値は入力しないでください。"
              },
              {
                "title": "リクエストIDで検索",
                "body": "完全検索フィールド メニューを開き、[リクエスト ID] を選択して、完全なリクエスト ID を入力します。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "レコードを見つけるために必要な条件のみを使用します。結果が得られない場合は、まず時間範囲、タイムゾーン、および正確な値を確認してください。",
              "古い条件によってレコードが除外されないように、再度検索する前に適用されないフィルターをクリアします。"
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "レビュー結果と減点",
        "blocks": [
          {
            "type": "list",
            "items": [
              "タイプとエラー: 使用状況イベントとエラー イベントを区別するには、タイプを使用します。エラー イベントの場合、その時刻とリクエスト ID を、クライアントが保持する HTTP ステータスおよび編集されたエラーと関連付けます。",
              "トークン: 入力、出力、およびキャッシュされたトークンを確認します。存在しないフィールドまたは適用できないフィールドは計算しないでください。",
              "コスト: レコードコストとフィルタリングされたコスト合計を確認し、アカウント差し引きと比較します。",
              "期間: 合計期間を確認します。ストリーミング呼び出しでは、最初のトークンまでの時間が表示される場合もあります。",
              "詳細: 一致するレコードを開いて、リクエスト ID、時間、モデル、キー名、トークン、コスト、および期間が同じ呼び出しに属していることを確認します。"
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "記録は成功の証拠ではありません",
            "body": "ログには、使用状況、エラー、またはその他のアカウント イベントが含まれる場合があります。タイプ、クライアントの結果、および実際の差し引きを組み合わせて使用​​して、結果を決定します。"
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "失敗とタイムアウトの処理",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "失敗したレコードを関連付ける",
                "body": "正確な時刻、モデル、キー名、およびリクエスト ID を使用して、レコードをクライアントの HTTP ステータスおよび編集されたエラーと比較します。"
              },
              {
                "title": "使用状況が記録されているかどうかを確認する",
                "body": "トークン、コスト、および期間を確認して、リクエストが実行記録と差し引き記録を残したかどうかを判断します。"
              },
              {
                "title": "キャンセルまたはタイムアウトは慎重に処理してください",
                "body": "キャンセルまたはタイムアウトは、処理が停止したことを証明するものではありません。再試行する前に、ログと推論を確認してください。"
              },
              {
                "title": "サポート情報の準備",
                "body": "結果が不明瞭な場合は、検索時間範囲、タイムゾーン、およびフィルターを維持してから、「サポートに問い合わせ」を開きます。"
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "シークレットを使用して検索しないでください",
            "body": "完全な API キーではなく、キー名でフィルターします。問題を報告する前に、資格情報、個人情報、完全なプロンプト、およびプライベート ファイルを削除してください。"
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "セルフチェック後、Partokens のメールまたは Telegram サポートから、追跡に必要な情報を含み機密情報を除いたレポートを送信します。",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "接触前チェックを完了する",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "ミニマムを再現",
                "body": "API の問題の場合は、接続、制限、および再試行で最小限のチェックを実行し、実際の HTTP ステータスを記録します。"
              },
              {
                "title": "機種とアカウントを確認する",
                "body": "モデルが現在のリストにあることを確認し、キーのステータス、アクセス、および現在のアカウント情報を確認します。"
              },
              {
                "title": "検索 使用状況ログ",
                "body": "時間、モデル、キー名、リクエスト ID で検索し、トークン、コスト、期間を確認します。"
              },
              {
                "title": "まだ助けが必要であることを確認します",
                "body": "何かが利用できないことだけを報告するのではなく、すでに完了したチェック、予想される結果、実際の結果を述べます。"
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "サインインまたはアカウントの問題: ページ、正確な時刻とタイムゾーン、および編集されたエラーを保持します。",
              "API 問題: エンドポイント、モデル、HTTP ステータス、リクエスト ID を保持します。",
              "キャンセルまたはタイムアウト: 最初に、使用状況ログ にレコードと差し引きが含まれているかどうかを示します。"
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "診断情報の準備",
        "blocks": [
          {
            "type": "list",
            "items": [
              "リクエストまたは問題の正確な時刻とタイムゾーン。",
              "リクエストで使用される正確なモデル ID。",
              "API 問題が発生したエンドポイントまたはコンソール ページ。",
              "実際の HTTP ステータス、または応答が到着していないという明確なステートメント。",
              "完全なリクエスト ID、または何も返されなかったという明確なステートメント。",
              "失敗の意味を保持する編集されたエラー。",
              "最小限の再現手順、期待される結果、および実際の結果。",
              "トークン、コスト、レビューされた期間など、一致する使用状況ログ レコードが見つかったかどうか。"
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "機密データを削除する",
        "blocks": [
          {
            "type": "list",
            "items": [
              "API キーまたはその他のアクセス資格情報を送信しないでください。",
              "パスワード、検証コード、リカバリ コード、Cookie、またはセッション トークンを送信しないでください。",
              "名前、電子メール アドレス、電話番号、住所、身元情報、その他の個人情報を送信しないでください。",
              "完全なプロンプト、完全なリクエスト本文、または複製に関係のない生のコンテンツを送信しないでください。",
              "プライベート ファイル、プライベート ダウンロード URL、大きな Base64 値、または未レビューのログ エクスポートを送信しないでください。"
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "暴露の疑いを報告する前にキーをローテーションしてください",
            "body": "影響を受けるキーを直ちに無効化または削除し、代替キーを作成して確認してから、すべてのコンシューマーを更新します。古いキーをサポート チャネルに送信しないでください。"
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "公式サポート チャネルを使用する",
        "blocks": [
          {
            "type": "paragraph",
            "text": "以下のいずれかのパブリック サポート チャネルを選択し、最小限の編集された診断情報を最初のメッセージに含めます。ドキュメントは、応答時間や解決時間を約束するものではありません。"
          },
          {
            "type": "links",
            "items": [
              {
                "label": "メールサポート",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "電報サポートボット",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
