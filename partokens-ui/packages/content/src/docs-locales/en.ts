import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const enDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "Choose an integration method, prepare the account, API key, and live model ID, then complete one minimal call.",
    "sections": [
      {
        "id": "choose-path",
        "title": "Choose an integration path",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Every integration method uses the same account access, API key, model ID, and OpenAI-compatible Base URL. Choose the shortest path for the current task."
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL: first connectivity checks and reproductions.",
              "OpenAI JavaScript or Python SDK: services, scripts, and existing SDK projects.",
              "A client with a custom OpenAI Base URL: existing tools that expose Base URL, Bearer key, and model ID settings.",
              "Console workspaces: direct access to the chat or image capabilities currently available to the account."
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "Prepare the account and key",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Create an API key",
                "body": "Sign in to the console, open API keys, create a key, and store it securely as `<YOUR_PARTOKENS_API_KEY>`."
              },
              {
                "title": "Copy a live model ID",
                "body": "Call the models endpoint with that key, then copy the exact current ID as `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Store the connection details",
                "body": "Keep the key in an environment variable or secret manager; do not put it in a repository, URL, log, or browser code."
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
        "title": "Complete the first call",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open the first integration guide",
                "body": "Go to Quick start: first integration and choose the Shell, JavaScript, or Python example."
              },
              {
                "title": "Replace the connection values",
                "body": "Keep the common Base URL and provide `<YOUR_PARTOKENS_API_KEY>` and `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Confirm the result",
                "body": "Send the minimal request, check the HTTP status first, and confirm that the response contains a readable result. Keep the request time, status, and request ID on failure."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "Verify the minimum first",
            "body": "After the minimal request succeeds, connect the application and add optional parameters one at a time. This page does not repeat the full request example."
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "Continue with the docs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Understand the service scope: What is Partokens?",
              "Manage credentials: API key management.",
              "Choose models and check prices: Models and pricing and Models API.",
              "Configure an SDK or client: SDK setup, Supported clients, or Codex and CLI setup.",
              "Investigate requests and deductions: Connection, limits, and retries and Usage logs.",
              "Get help after self-service checks: Contact support."
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens provides OpenAI-compatible API access to the models and capabilities currently available to an account.",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "Confirm the service scope",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens provides a common OpenAI-compatible Base URL, an account console, and public API documentation. Applications can send requests through HTTPS, OpenAI SDKs, or clients with a custom Base URL."
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Compatibility is not identity",
            "body": "OpenAI compatibility lets you reuse common connection methods and request shapes. It does not make every account, model, endpoint, or optional parameter available."
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "Choose an API entry point",
        "blocks": [
          {
            "type": "list",
            "items": [
              "View models: call `GET /v1/models` with the same key.",
              "Send a model request: choose the endpoint that matches the model's current capability from the relevant API page, then start with required fields only.",
              "Use an SDK or compatible client: set the Base URL to `https://partokens.com/v1` and provide a Partokens Bearer key and exact model ID.",
              "Try a capability directly: sign in to the console and use a currently available chat or image workspace."
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "Check live information",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Check models and endpoints",
                "body": "Use the model list returned with the same key."
              },
              {
                "title": "Check prices and quota",
                "body": "Use current account information, Usage logs after the call, and the actual deduction."
              },
              {
                "title": "Check parameters",
                "body": "Use the relevant API page and the target model's actual response. Do not infer support from a model name or another service."
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
        "title": "Verify compatibility",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Confirm the client settings",
                "body": "Confirm that the client exposes Base URL, Bearer key, and exact model ID settings."
              },
              {
                "title": "Run a minimal request on the target endpoint",
                "body": "Use `<YOUR_PARTOKENS_API_KEY>` and `<YOUR_MODEL_ID>` with only the endpoint's core fields."
              },
              {
                "title": "Add capabilities one at a time",
                "body": "After the minimum succeeds, add optional parameters individually and use each actual response to confirm support."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Use the actual response",
            "body": "A visible model or configurable client only confirms an integration prerequisite. The target model's response on the target endpoint and parameters is the compatibility result."
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "Prepare an API key, Base URL, and model ID, send one minimal chat request, and confirm the returned text.",
    "prerequisites": [
      "A Partokens API key",
      "A model ID available to the account"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "Prepare the integration",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Prepare the API key `<YOUR_PARTOKENS_API_KEY>`.",
              "Use the Base URL `https://partokens.com/v1`.",
              "Copy the exact available model ID `<YOUR_MODEL_ID>` from the account model list."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Set environment variables",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "Send the request",
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
        "title": "Read the response",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Check the HTTP status before parsing JSON.",
              "Read the first chat text from `choices[0].message.content`.",
              "Treat an empty `choices` array or empty text as no usable result."
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "Handle failures",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: check that the Bearer key is complete, valid, and from the intended environment.",
              "400: use `error.message` to correct the model, messages, or JSON fields.",
              "429: wait for `Retry-After`; when absent, use jittered exponential backoff.",
              "5xx: retry with backoff, a maximum attempt count, and a total deadline.",
              "Connection error or timeout: confirm whether an HTTP response arrived; do not resend a chat request unconditionally."
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "Choose Shell, an OpenAI SDK, or a client with a custom Base URL, then verify the call with the same connection settings.",
    "prerequisites": [
      "A Partokens API key",
      "An available model ID"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "Choose a client",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL: connectivity checks, automation scripts, and reproductions.",
              "OpenAI JavaScript SDK: Node.js services and scripts.",
              "OpenAI Python SDK: Python services and scripts.",
              "Codex: coding tasks with a model that supports the Responses API.",
              "An OpenAI-compatible client with a custom Base URL: existing clients that expose Base URL, Bearer key, and model ID settings."
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configure the connection",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Send the Bearer key `<YOUR_PARTOKENS_API_KEY>` as `Authorization: Bearer ...`.",
              "Use the exact account model ID `<YOUR_MODEL_ID>`.",
              "Discover models with `GET /v1/models`; Shell, SDKs, and compatible clients verify chat with `POST /v1/chat/completions`, while Codex uses `POST /v1/responses`."
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "Verify the call",
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
              "For another compatible client, run `GET https://partokens.com/v1/models`, then send the chat request with the same key and model ID.",
              "For Shell, JavaScript, Python, and compatible clients, confirm a successful HTTP response and readable `choices[0].message.content`.",
              "After configuring its Base URL, key, and model, verify Codex with `codex exec \"Reply only with: connection successful\"`."
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "Troubleshoot",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Client configuration error: no request or an invalid URL, Bearer header, or model; correct the setting before retrying.",
              "Network error: no HTTP status arrived; check DNS, TLS, proxy, and connection timeout.",
              "API error: an HTTP status and JSON `error` arrived; handle 401, 400, 429, or 5xx as an API result, not as a client crash."
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "Create an API key in the console, configure it in a secure runtime, and rotate or revoke old keys in order.",
    "prerequisites": [
      "Access to the Partokens console"
    ],
    "sections": [
      {
        "id": "create",
        "title": "Create a key",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open key management",
                "body": "Sign in to the console, open API keys, and choose Create key."
              },
              {
                "title": "Set the required options",
                "body": "Enter a name and select a group; set a quota limit and expiration when needed."
              },
              {
                "title": "Save the credential",
                "body": "After submitting, use Reveal or Copy in the key list and place the credential in a secure runtime immediately."
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configure the key",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Use a server-side environment variable or secret manager; never put the key in a repository, URL, log, or browser code.",
              "Send it as `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Set the environment variable",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "Rotate and revoke",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Create the replacement",
                "body": "Create a replacement key for the same application and store it securely."
              },
              {
                "title": "Verify it first",
                "body": "Change one controlled environment and call `GET /v1/models` to confirm the replacement works."
              },
              {
                "title": "Replace every use",
                "body": "Update services, jobs, and secret-manager values, then confirm the new configuration is active."
              },
              {
                "title": "Disable the old key",
                "body": "From the key list actions, choose Disable to pause or Delete to remove the old key."
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "Handle exceptions",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: check the environment variable, Bearer header, and key status; make sure an old value is not in use.",
              "403: check the key group, access scope, and enabled state before trying again.",
              "Suspected exposure: disable or delete the key immediately, create and verify a replacement, then update every use.",
              "Expired, disabled, or exhausted key: do not retry repeatedly; create a replacement and verify it."
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "Review balance, plans, and usage in the console, choose a billing source, and recover from insufficient quota.",
    "prerequisites": [
      "Access to the Partokens console"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "View balance and plan",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open Wallet",
                "body": "Sign in to the console and select Wallet under Account in the sidebar."
              },
              {
                "title": "Review account status",
                "body": "At the top of the page, review the account balance, total usage, and active plan count."
              },
              {
                "title": "Review plan quota",
                "body": "In Choose a plan, select View active and check each plan status, total quota, remaining quota, and used percentage."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Account balance shows the currently available balance.",
              "Total usage shows usage already recorded for the account.",
              "Active plan details show plans that can still be used and their remaining quota."
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "Choose a billing source",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Find the preference",
                "body": "At the bottom of Choose a plan on Wallet, find Usage billing preference. You can change it while an active plan is available."
              },
              {
                "title": "Choose the current preference",
                "body": "Select Subscription first, Balance first, Subscription only, or Balance only, then wait for the update to succeed before calling the API."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Subscription first and Balance first select which source is tried first.",
              "Subscription only and Balance only restrict usage to that source.",
              "Confirm that the selected source is currently available before changing the preference."
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "Review usage",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open Usage logs",
                "body": "In the console sidebar, select Usage logs under General."
              },
              {
                "title": "Narrow the time and model",
                "body": "Select a range that covers the call, then select the model. For an exact lookup, change the search field to Request ID and enter the complete request ID."
              },
              {
                "title": "Compare the call and deduction",
                "body": "Open the matching record and review its time, type, model, error, usage, cost, and request ID, then compare it with the balance or remaining plan quota in Wallet."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "Resolve insufficient quota",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Insufficient balance: check Wallet and use the currently available top-up option, or switch to a plan with available quota.",
              "Insufficient or unavailable plan: open active plan details and check its status and remaining quota; choose a currently available plan or change the billing preference to an available source.",
              "Rejected request: keep the HTTP status, error, and request ID, then check Usage logs for a record. For 401 or 403, also check the API key status and access.",
              "After correcting the balance, plan, billing preference, or key, send one minimal request first. Do not resubmit unchanged requests."
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "Find currently available models, review capability and pricing information, choose the matching API, and resolve model errors.",
    "prerequisites": [
      "Access to a Partokens account",
      "The API key `<YOUR_PARTOKENS_API_KEY>` when querying through the API"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "Find models",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Query account models",
                "body": "Call the models endpoint with the current API key to see the models returned for that account."
              },
              {
                "title": "Query models for a key",
                "body": "You can also call the models endpoint with `<YOUR_PARTOKENS_API_KEY>` to see the models currently returned for that key."
              },
              {
                "title": "Copy the model ID",
                "body": "Copy the exact model ID from the model-list response or `data[].id`, and use it unchanged as `<YOUR_MODEL_ID>` in later requests."
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
        "title": "Check capabilities and price",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Use the model-list response to confirm `<YOUR_MODEL_ID>` and check the relevant API documentation before calling it. Treat billing and pricing as current account data returned by the service.",
              "When capability or price information is absent, do not infer it from the model name or a similar name.",
              "Before calling, confirm that the target API appears in the model's current capability information. Use the account data shown at that time for price selection.",
              "Review actual usage and deductions in Usage logs after the call."
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "Choose an API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions: when the model explicitly supports chat completions, send a message list to `POST /v1/chat/completions`.",
              "Responses: when the model explicitly supports Responses, use `POST /v1/responses`; native Codex connections use this API.",
              "Image API: when the model explicitly supports images, use `POST /v1/images/generations` to generate an image. Image Studio uses the image edit API when a reference image is supplied.",
              "A model may not support every API or optional parameter. Start with a minimal request to the target API."
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "Resolve model issues",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Model not visible: call `GET /v1/models` again with the same key and check whether the response succeeded or `data` is empty.",
              "Model not callable: use the exact returned ID and query the model list again with the same API key. Do not guess an ID when that key receives an empty list.",
              "Incompatible parameter or 400: read `error.message`, remove optional parameters, and retry with the minimum fields for the target API.",
              "403: read the error, then check the API key status, model access, and balance or plan before trying again.",
              "Model returned but still failing: keep the request time, model ID, HTTP status, and request ID, then find the record in Usage logs."
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "Connect native Codex to Partokens with a model provider configuration and verify the Responses call with a minimal command.",
    "prerequisites": [
      "The API key `<YOUR_PARTOKENS_API_KEY>`",
      "A Responses-capable model ID `<YOUR_MODEL_ID>`",
      "Codex installed and runnable"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "Prepare Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Run `codex --version` and confirm that Codex starts in the current terminal.",
              "Copy the exact `<YOUR_MODEL_ID>` from `GET https://partokens.com/v1/models`, and confirm that it supports Responses.",
              "Prepare the Partokens API key `<YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Set the environment variable",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "Configure the connection",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open user configuration",
                "body": "Edit `~/.codex/config.toml` and keep any other settings you still need."
              },
              {
                "title": "Add the Partokens provider",
                "body": "Add the model and provider configuration below. `env_key` reads the environment variable set above."
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
        "title": "Verify the call",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Minimal verification",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "A normal `connection successful` result confirms that Codex sent and completed the request through this configuration.",
              "You can then find the call in Usage logs by its time, model, and request ID."
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Handle failures",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Configuration error: if Codex cannot read the file or uses an unexpected model, check the TOML syntax, `model_provider`, and `<YOUR_MODEL_ID>`, and confirm that the environment variable is set in the same terminal.",
              "Connection error: when no HTTP status arrives, check the network, proxy, DNS, TLS, and that `base_url` is `https://partokens.com/v1`.",
              "HTTP/API error: for 400, 401, 403, 429, or 5xx, keep the status, error, and request ID. Correct parameters, key, access, or quota before deciding whether to retry.",
              "Model does not support Responses: select a currently listed model that explicitly supports Responses. Do not change `wire_api` to another value."
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "Install the OpenAI JavaScript or Python SDK, configure the Partokens Base URL and key, and read text from a minimal chat request.",
    "prerequisites": [
      "A Node.js or Python runtime",
      "A Partokens API key",
      "A model ID"
    ],
    "sections": [
      {
        "id": "install",
        "title": "Install the SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Install the supported OpenAI SDK in a server-side project."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Install and set variables",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configure the client",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript uses `apiKey` and `baseURL`.",
              "Python uses `api_key` and `base_url`.",
              "Set both SDKs to `https://partokens.com/v1`; provide `<YOUR_MODEL_ID>` through the model environment variable."
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
        "title": "Send and read a request",
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
        "title": "Handle errors",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Connection error: check DNS, TLS, proxy, and network before retrying.",
              "HTTP error: read the status, `error.message`, and `X-Oneapi-Request-Id`; fix 400, 401, or 403 first.",
              "429: follow `Retry-After`, or use jittered exponential backoff.",
              "5xx: retry with a maximum attempt count and total deadline.",
              "Timeout: set an SDK timeout; a chat request may already have run, so check usage records before retrying."
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "Open Image Studio from the console, select a current model and key, generate or edit images, and save the results you need.",
    "prerequisites": [
      "Access to the Partokens console",
      "An available image model and API key"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "Open the workspace",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open the console",
                "body": "Sign in to Partokens and open the console."
              },
              {
                "title": "Open Image Studio",
                "body": "In the sidebar, select Image studio under Workspace."
              },
              {
                "title": "Check the workspace",
                "body": "Generation settings are on the left and the current result set is on the right."
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "Select a model and key",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Select a model",
                "body": "In Model, choose an image model from the current list and use that exact value as `<YOUR_MODEL_ID>`. Do not guess a model name."
              },
              {
                "title": "Select an API key",
                "body": "On the first generation, choose an active key compatible with the model in the API key required dialog, then continue generating."
              },
              {
                "title": "When no key is available",
                "body": "Use Create key in the dialog, or open API keys and create a key for the selected model before returning to Image Studio."
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "Generate or edit images",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Enter a prompt",
                "body": "Describe the image to generate or edit in Prompt."
              },
              {
                "title": "Set the output",
                "body": "Choose quality, image size, and number of images from the options shown."
              },
              {
                "title": "Add a reference when needed",
                "body": "Upload a PNG, JPG, or WebP image to edit it, or choose Use as reference on a generated result."
              },
              {
                "title": "Start the task",
                "body": "Select Generate and wait for images in Results. If the model rejects a setting, choose one of the options currently provided for that model."
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "Save and handle failures",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Save a result: choose Download image on every image you need to keep. The next generation replaces the displayed result set.",
              "Generation failure or unsupported parameter: read the page error, choose a quality, size, or count offered for the current model, and remove incompatible settings.",
              "401: check that the selected API key is still valid. 403: check key access to the model and the account balance or plan. Do not regenerate until corrected.",
              "429: wait as directed before retrying. For 5xx, keep the request details and use bounded backoff with a total deadline."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Check logs after cancellation or timeout",
            "body": "After leaving an active generation and confirming Stop, or after a timeout, first check Usage logs by time, model, and request ID for a record and deduction, then decide whether to retry."
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "Send HTTPS requests with the Partokens base URL and a Bearer API key, then handle the result by HTTP status and response body.",
    "prerequisites": [
      "A Partokens API key",
      "A model ID copied from the model list"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Send a request",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Requests with a JSON body also require `Content-Type: application/json`.",
              "Never place the API key in a URL, client-side code, or logs."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Run a minimal request",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: an exact model ID returned by the model list.",
              "`messages`: the ordered messages sent to the model.",
              "`messages[].role`: use `user` for a minimal text request.",
              "`messages[].content`: non-empty text."
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
        "title": "Read the response",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Check the HTTP status first; a 2xx status indicates a successful HTTP response.",
              "Parse the JSON body and read the endpoint result, such as `choices` for chat, `data` for images, or `data` for models.",
              "For a non-2xx response, read `error.message` and record `error.code` when it is present."
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Handle errors",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: correct the JSON or request fields before sending it again.",
              "401 / 403: check the API key and access; do not retry unchanged credentials.",
              "429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.",
              "5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.",
              "Network error or timeout: determine whether an HTTP response arrived before deciding to retry."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Retry safely",
            "body": "GET requests can be retried within a total deadline; retry chat and image POST requests automatically only when the application accepts duplicate results and usage."
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "Send a message array to generate a chat reply, then read the text from `choices[0].message.content`.",
    "prerequisites": [
      "A Partokens API key",
      "A chat-capable model ID copied from the model list",
      "The OpenAI SDK for the JavaScript and Python examples"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Send a request",
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
              "Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Send `Content-Type: application/json`.",
              "For an SDK, set the base URL to `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Fill in the request",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: an exact model ID returned by the model list.",
              "`messages`: the ordered messages sent to the model.",
              "`messages[].role`: use `user` for a minimal text request.",
              "`messages[].content`: non-empty text for the message."
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
        "title": "Read the response",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`: text from the first candidate.",
              "`choices[0].finish_reason`: why that candidate stopped.",
              "`usage`: input, output, and total token counts when returned."
            ]
          },
          {
            "type": "paragraph",
            "text": "Treat an empty `choices` array or a first candidate without text as a response with no usable chat result."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Handle errors",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: use `error.message` to correct `model`, `messages`, or a message field.",
              "401 / 403: check the API key and access; do not retry unchanged credentials.",
              "429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.",
              "5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.",
              "Network error or timeout: the request may have run; do not resend it immediately."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Avoid duplicate generations",
            "body": "Retry chat requests automatically only when the application accepts duplicate replies and usage and the client sets a timeout and maximum attempt count."
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "Send a prompt to generate an image, then save the result from `data[0].url` or `data[0].b64_json`.",
    "prerequisites": [
      "A Partokens API key",
      "An image-capable model ID copied from the model list",
      "cURL, jq, and OpenSSL for Shell; the OpenAI SDK for JavaScript and Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Send a request",
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
              "Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Send `Content-Type: application/json`.",
              "For an SDK, set the base URL to `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Fill in the request",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: an exact image model ID returned by the model list.",
              "`prompt`: a non-empty text description of the image."
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
        "title": "Read the response",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Confirm that the `data` array is not empty.",
              "When `data[0].url` is present, download it and check the download HTTP status.",
              "When no URL is present but `data[0].b64_json` exists, decode the Base64 value into a binary file.",
              "Treat a result with neither field as a response with no usable image."
            ]
          },
          {
            "type": "paragraph",
            "text": "Do not write complete Base64 image data to application logs."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Handle errors",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: use `error.message` to correct `model` or `prompt`.",
              "401 / 403: check the API key and access; do not retry unchanged credentials.",
              "429: wait for `Retry-After` when present, otherwise use exponential backoff with jitter.",
              "5xx: retry with exponential backoff, a maximum attempt count, and a total deadline.",
              "Network error or timeout: the request may have run; do not generate again immediately.",
              "Image download failure: retry the download without resending the generation request."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Avoid duplicate generations",
            "body": "Retry image generation automatically only when the application accepts duplicate images and usage and the client sets a timeout and maximum attempt count."
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "Read the models available to the current API key and reuse an exact returned model ID in other requests.",
    "prerequisites": [
      "A Partokens API key",
      "cURL and jq for Shell; the OpenAI SDK for JavaScript and Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Send a request",
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
              "Send `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "This GET request has no request body."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Run a minimal request",
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
        "title": "Read the response",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "Field",
              "Meaning"
            ],
            "rows": [
              [
                "`object`",
                "A value of `list` identifies a model list."
              ],
              [
                "`data`",
                "The model array; an empty array means the key currently has no available models."
              ],
              [
                "`data[].id`",
                "Copy the exact value into the `model` field of another request."
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Do not change the letter case of a model ID or add or remove a prefix."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Handle errors",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403: check the API key and access; do not retry unchanged credentials.",
              "429: wait for `Retry-After`, or use exponential backoff with jitter.",
              "5xx, network error, or timeout: retry with a maximum attempt count and a total deadline.",
              "2xx with empty `data`: check the models available to the key; do not guess a model ID."
            ]
          },
          {
            "type": "paragraph",
            "text": "The model list is a GET request and can be retried safely within a total deadline; set a timeout and limit the number of attempts."
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "Answers to integration, account, model, usage, and common failure questions, with the live sources to check.",
    "sections": [
      {
        "id": "choose-integration",
        "title": "Choose an integration method",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Can I keep using an OpenAI SDK?",
                "answer": "Yes. Set the Base URL to `https://partokens.com/v1`, use a Partokens API key, and provide the exact model ID currently returned for the account."
              },
              {
                "question": "Should I use Shell, an SDK, or a compatible client?",
                "answer": "Use Shell for minimal checks and reproductions, an SDK for services and scripts, and an existing client only when it exposes Base URL, Bearer key, and model ID settings."
              },
              {
                "question": "Where are the complete request examples?",
                "answer": "Use Quick start: first integration for a first call, and the relevant API page for fields and response shapes."
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "Manage keys and account",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Where should I store the API key?",
                "answer": "Store `<YOUR_PARTOKENS_API_KEY>` in an environment variable or secret manager. Do not put it in a repository, URL, log, or browser code."
              },
              {
                "question": "How do I rotate a key?",
                "answer": "Create and verify a replacement first, update every consumer, then disable or delete the old key in the console. Act on the old key immediately if exposure is suspected."
              },
              {
                "question": "Where do I check balance, plans, and available quota?",
                "answer": "Use the current account pages, the request's actual response, Usage logs, and the actual deduction."
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "Check models and usage",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Which model ID should I use?",
                "answer": "Copy the exact current ID from `GET /v1/models` and use it unchanged as `<YOUR_MODEL_ID>`. Do not guess a model name."
              },
              {
                "question": "Does a listed model support every endpoint and parameter?",
                "answer": "Do not make that assumption. Check the model's current capability and verify each target endpoint and parameter with a minimal request and its actual response."
              },
              {
                "question": "Does a Usage log record mean the call succeeded?",
                "answer": "Not necessarily. Also review the record type, the HTTP status and error kept by the client, tokens, cost, and duration."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "Resolve common failures",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "What should I check first when a request fails?",
                "answer": "Use `GET https://partokens.com/v1/models` to check connection and authentication, then correct the request according to 400, 401, 403, 429, or 5xx. Keep the time, timezone, endpoint, model, and request ID."
              },
              {
                "question": "Can every failure be retried immediately?",
                "answer": "No. Correct 400, 401, and 403 first. Follow `Retry-After` or back off for 429. Retry 5xx only a limited number of times and only when replay is safe."
              },
              {
                "question": "What should I do after cancellation or timeout?",
                "answer": "First search Usage logs by time, model, key name, and request ID and review any deduction, then decide whether to retry."
              },
              {
                "question": "When should I contact support?",
                "answer": "After completing the checks in Connection, limits, and retries and Usage logs, use Contact support to prepare redacted diagnostic information."
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "Run a minimal models request first, then use the HTTP status to choose a correction and retry policy.",
    "prerequisites": [
      "A Partokens API key",
      "Access to the command's HTTP status, response headers, and response body"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "Run a minimal check",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The `GET /v1/models` request below does not start a generation task. Use it to check DNS, TLS, proxy settings, the Base URL, and authentication. The command also shows response headers so you can keep the request ID."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Connection and authentication check",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "Fix issues by status",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Connection error: when no HTTP status arrives, check the network, DNS, TLS, proxy, connection timeout, and that the URL is exactly `https://partokens.com/v1/models`.",
              "400: use the returned error to correct JSON, required fields, model ID, or target endpoint. Do not repeat the request unchanged.",
              "401: confirm that the environment variable is set, the Bearer header is complete, the key is not truncated, and the key remains enabled in the console.",
              "403: use the returned error to check key access, model availability, and the account's current balance or plan, then correct the issue before retrying.",
              "429: follow `Retry-After` when present. Otherwise reduce concurrency and use jittered exponential backoff.",
              "5xx: keep the request ID and use bounded backoff only when the request is safe to replay."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Status is the starting point",
            "body": "The same status can have different causes. Use the response body, request ID, current account information, and Usage logs for the final diagnosis."
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "Decide whether to retry",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Retry: a temporary connection failure for `GET /v1/models`, 429 after the required wait, or a temporary 5xx. Set a total deadline and maximum attempt count.",
              "Correct first: 400, 401, 403, and failures clearly caused by a model, endpoint, parameter, key, or account state.",
              "Check logs first: client cancellation or timeout does not prove that a request did not run. Search Usage logs by time, model, key name, and request ID, then review any deduction.",
              "Avoid duplicate work: automatically retry chat, image generation, or image edits only when duplicate results and usage are acceptable."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Do not replay immediately after cancellation or timeout",
            "body": "If Usage logs show execution or a deduction, review the result and request ID first. When the outcome remains unclear, prepare diagnostic information and contact support."
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Prepare diagnostics",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Record the request",
                "body": "Keep the exact time and timezone, model, endpoint, HTTP status, and request ID."
              },
              {
                "title": "Keep a redacted error",
                "body": "Preserve enough error text to explain the issue and remove credentials, personal information, complete prompts, and private files."
              },
              {
                "title": "Review Usage logs",
                "body": "State whether a matching record was found and keep the time range, model, key name, and request ID used to search."
              },
              {
                "title": "Write a minimal reproduction",
                "body": "List the fewest steps, expected result, and actual result, then use Contact support to select an official channel."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Do not submit credentials",
            "body": "Support information must not contain a complete API key, password, verification code, or session token."
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "Find calls in the console and review type, errors, tokens, cost, duration, and deductions.",
    "sections": [
      {
        "id": "open-logs",
        "title": "Open Usage logs",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Open the console",
                "body": "Sign in to Partokens and open the console."
              },
              {
                "title": "Open Usage logs",
                "body": "In the General section of the sidebar, select Usage logs."
              },
              {
                "title": "Refresh current data",
                "body": "Select Refresh when you need to retrieve current records, then start from the request time."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "Usage logs help correlate account calls and events. Also keep the HTTP status, response headers, and redacted error received by the client."
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "Filter requests",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Choose a time range",
                "body": "Choose a range that includes the request time and confirm the timezone used by the log and client timestamps."
              },
              {
                "title": "Choose a model",
                "body": "Use the model filter to narrow the results. The model ID must exactly match the request value."
              },
              {
                "title": "Search by key name",
                "body": "Open the exact search field menu, choose API key name, and enter the name shown in the log. Do not enter the key value."
              },
              {
                "title": "Search by request ID",
                "body": "Open the exact search field menu, choose Request ID, and enter the complete request ID."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Use only the conditions needed to locate the record. If there is no result, check the time range, timezone, and exact values first.",
              "Clear filters that do not apply before searching again so an old condition does not exclude the record."
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "Review results and deductions",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Type and error: use Type to distinguish usage and error events. For an error event, correlate its time and request ID with the HTTP status and redacted error kept by the client.",
              "Tokens: review input, output, and cached tokens. Do not calculate fields that are absent or not applicable.",
              "Cost: review the record cost and the filtered cost total, then compare them with the account deduction.",
              "Duration: review total duration. Streaming calls may also show time to first token.",
              "Details: open the matching record and confirm that request ID, time, model, key name, tokens, cost, and duration belong to the same call."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "A record is not proof of success",
            "body": "Logs can contain usage, error, or other account events. Use the type, client result, and actual deduction together to determine the outcome."
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Handle failures and timeouts",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Correlate the failed record",
                "body": "Use the exact time, model, key name, and request ID, then compare the record with the client HTTP status and redacted error."
              },
              {
                "title": "Check whether usage was recorded",
                "body": "Review tokens, cost, and duration to determine whether the request left execution and deduction records."
              },
              {
                "title": "Treat cancellation or timeout carefully",
                "body": "Cancellation or timeout does not prove that processing stopped. Review logs and deductions before retrying."
              },
              {
                "title": "Prepare support information",
                "body": "If the outcome remains unclear, keep the search time range, timezone, and filters, then open Contact support."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Do not search with a secret",
            "body": "Filter by key name, not the complete API key. Before reporting a problem, remove credentials, personal information, complete prompts, and private files."
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "After self-service checks, send a correlatable and redacted report through Partokens Email or Telegram support.",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "Complete pre-contact checks",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Reproduce the minimum",
                "body": "For an API issue, run the minimal check in Connection, limits, and retries and record the actual HTTP status."
              },
              {
                "title": "Check the model and account",
                "body": "Confirm that the model comes from the current list, then check the key status, access, and current account information."
              },
              {
                "title": "Search Usage logs",
                "body": "Search by time, model, key name, and request ID, then review tokens, cost, and duration."
              },
              {
                "title": "Confirm that help is still needed",
                "body": "State the checks already completed, expected result, and actual result instead of reporting only that something is unavailable."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Sign-in or account issue: keep the page, exact time and timezone, and redacted error.",
              "API issue: keep the endpoint, model, HTTP status, and request ID.",
              "Cancellation or timeout: first state whether Usage logs contain a record and deduction."
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Prepare diagnostic information",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Exact time and timezone of the request or issue.",
              "Exact model ID used by the request.",
              "API endpoint or console page where the issue occurred.",
              "Actual HTTP status, or a clear statement that no response arrived.",
              "Complete request ID, or a clear statement that none was returned.",
              "A redacted error that preserves the meaning of the failure.",
              "Minimal reproduction steps, expected result, and actual result.",
              "Whether a matching Usage log record was found, including the tokens, cost, and duration reviewed."
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "Remove sensitive data",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Do not submit an API key or any other access credential.",
              "Do not submit passwords, verification codes, recovery codes, cookies, or session tokens.",
              "Do not submit names, email addresses, phone numbers, addresses, identity details, or other personal information.",
              "Do not submit complete prompts, complete request bodies, or raw content unrelated to the reproduction.",
              "Do not submit private files, private download URLs, large Base64 values, or unreviewed log exports."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Rotate a key before reporting suspected exposure",
            "body": "Disable or delete the affected key immediately, create and verify a replacement, then update every consumer. Do not send the old key to a support channel."
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "Use official support channels",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Choose either public support channel below and include the minimum redacted diagnostic information in the first message. The documentation does not promise a response or resolution time."
          },
          {
            "type": "links",
            "items": [
              {
                "label": "Email support",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "Telegram support bot",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
