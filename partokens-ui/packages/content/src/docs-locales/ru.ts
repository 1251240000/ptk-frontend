import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const ruDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "Выберите метод интеграции, подготовьте учетную запись, ключ API и идентификатор активной модели, а затем выполните один минимальный вызов.",
    "sections": [
      {
        "id": "choose-path",
        "title": "Выберите путь интеграции",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Каждый метод интеграции использует один и тот же доступ к учетной записи, ключ API, идентификатор модели и Base URL, совместимый с OpenAI. Выберите кратчайший путь для текущей задачи."
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL: первая проверка подключения и воспроизведение.",
              "OpenAI JavaScript или Python SDK: сервисы, сценарии и существующие проекты SDK.",
              "Клиент с пользовательским OpenAI Base URL: существующие инструменты, которые предоставляют Base URL, ключ Bearer и настройки идентификатора модели.",
              "Рабочие области консоли: прямой доступ к возможностям чата или изображений, доступным в данный момент для учетной записи."
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "Подготовьте учетную запись и ключ",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Создайте ключ API",
                "body": "Войдите в консоль, откройте ключи API, создайте ключ и надежно сохраните его как `<YOUR_PARTOKENS_API_KEY>`."
              },
              {
                "title": "Скопируйте идентификатор активной модели",
                "body": "Вызовите конечную точку модели с помощью этого ключа, затем скопируйте точный текущий идентификатор как `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Сохраните сведения о подключении",
                "body": "Храните ключ в переменной среды или в секретном менеджере; не помещайте его в репозиторий, URL, журнал или код браузера."
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
        "title": "Завершить первый вызов",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть первое руководство по интеграции",
                "body": "Перейдите в раздел «Быстрое начало: первая интеграция» и выберите пример Shell, JavaScript или Python."
              },
              {
                "title": "Замените значения подключения",
                "body": "Оставьте общий Base URL и предоставьте `<YOUR_PARTOKENS_API_KEY>` и `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Подтвердить результат",
                "body": "Отправьте минимальный запрос, сначала проверьте статус HTTP и убедитесь, что ответ содержит читаемый результат. Сохраняйте время, статус и идентификатор запроса в случае сбоя."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "Сначала проверьте минимум",
            "body": "После успешного выполнения минимального запроса подключите приложение и добавляйте дополнительные параметры по одному. Эта страница не повторяет полный пример запроса."
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "Продолжить работу с документацией",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Понимание объема услуг: что такое Partokens?",
              "Управление учетными данными: управление ключами API.",
              "Выберите модели и проверьте цены: Модели и цены и Модели API.",
              "Настройте SDK или клиент: настройка SDK, Поддерживаемые клиенты или настройка Codex и CLI.",
              "Исследование запросов и списаний: подключение, ограничения и повторные попытки, а также журнал использования.",
              "Получите помощь после самопроверки: обратитесь в службу поддержки."
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens обеспечивает OpenAI-совместимый API доступ к моделям и возможностям, доступным в настоящее время для учетной записи.",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "Подтвердите объем услуги",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens предоставляет общий OpenAI-совместимый Base URL, консоль учетной записи и общедоступную документацию API. Приложения могут отправлять запросы через HTTPS, OpenAI SDK или клиентов с пользовательским Base URL."
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Совместимость не является тождественностью",
            "body": "Совместимость с OpenAI позволяет повторно использовать распространенные методы подключения и формы запроса. Она не делает доступными все учетные записи, модели, конечные точки или необязательные параметры."
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "Выберите точку входа API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Просмотр моделей: вызовите `GET /v1/models` с тем же ключом.",
              "Отправьте запрос модели: выберите конечную точку, соответствующую текущим возможностям модели, на соответствующей странице API, затем начните с только обязательных полей.",
              "Используйте SDK или совместимый клиент: установите для Base URL значение `https://partokens.com/v1` и укажите ключ Partokens Bearer и точный идентификатор модели.",
              "Попробуйте возможность напрямую: войдите в консоль и используйте доступный в данный момент чат или рабочую область изображений."
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "Проверить актуальную информацию",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Проверьте модели и конечные точки",
                "body": "Используйте список моделей, возвращенный с тем же ключом."
              },
              {
                "title": "Проверить цены и квоты",
                "body": "Используйте информацию о текущем счете, журнал использования после звонка и фактический списание."
              },
              {
                "title": "Проверить параметры",
                "body": "Используйте соответствующую страницу API и фактический ответ целевой модели. Не делайте списание о поддержке по названию модели или другой службе."
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Модели",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "verify-compatibility",
        "title": "Проверьте совместимость",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Подтвердите настройки клиента",
                "body": "Убедитесь, что клиент предоставляет ключ Base URL, Bearer и точные настройки идентификатора модели."
              },
              {
                "title": "Выполнить минимальный запрос на целевой конечной точке",
                "body": "Используйте `<YOUR_PARTOKENS_API_KEY>` и `<YOUR_MODEL_ID>` только с основными полями конечной точки."
              },
              {
                "title": "Добавляйте возможности по одной",
                "body": "После успешного выполнения минимума добавьте дополнительные параметры по отдельности и используйте каждый фактический ответ для подтверждения поддержки."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Использовать фактический ответ",
            "body": "Видимая модель или настраиваемый клиент лишь подтверждают необходимое условие интеграции. Ответ целевой модели на целевую конечную точку и параметры является результатом совместимости."
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "Подготовьте ключ API, Base URL и идентификатор модели, отправьте один минимальный запрос в чат и подтвердите возвращенный текст.",
    "prerequisites": [
      "A Partokens API ключ",
      "Идентификатор модели, доступный для учетной записи"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "Подготовьте интеграцию",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Подготовьте ключ API `<YOUR_PARTOKENS_API_KEY>`.",
              "Используйте Base URL `https://partokens.com/v1`.",
              "Скопируйте точный доступный идентификатор модели `<YOUR_MODEL_ID>` из списка моделей учетной записи."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Установить переменные среды",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "Отправить запрос",
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
        "title": "Прочитать ответ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Проверьте статус HTTP перед анализом JSON.",
              "Прочитайте первый текст чата от `choices[0].message.content`.",
              "Считать пустой массив `choices` или пустой текст непригодным для использования результатом."
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: убедитесь, что ключ Bearer является полным, действительным и находится в предполагаемой среде.",
              "400: используйте `error.message` для исправления модели, сообщений или полей JSON.",
              "429: дождаться `Retry-After`; если его нет, используйте экспоненциальную задержку.",
              "5xx: повтор с отсрочкой, максимальным количеством попыток и общим сроком.",
              "Ошибка соединения или тайм-аут: проверьте, пришел ли ответ HTTP; не отправляйте запрос в чат повторно без каких-либо условий."
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "Выберите Shell, OpenAI SDK или клиент с пользовательским Base URL, затем подтвердите вызов с теми же настройками соединения.",
    "prerequisites": [
      "A Partokens API ключ",
      "Доступный идентификатор модели"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "Выбрать клиента",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL: проверки подключения, сценарии автоматизации и воспроизведения.",
              "OpenAI JavaScript SDK: службы и сценарии Node.js.",
              "OpenAI Python SDK: сервисы и скрипты Python.",
              "Codex: задачи кодирования с помощью модели, поддерживающей Responses API.",
              "OpenAI-совместимый клиент с пользовательским Base URL: существующие клиенты, которые предоставляют Base URL, ключ Bearer и настройки идентификатора модели."
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Настройка соединения",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Отправьте ключ Bearer `<YOUR_PARTOKENS_API_KEY>` как `Authorization: Bearer ...`.",
              "Используйте точный идентификатор модели учетной записи `<YOUR_MODEL_ID>`.",
              "Откройте для себя модели с помощью `GET /v1/models`; Shell, SDK и совместимые клиенты проверяют чат с помощью `POST /v1/chat/completions`, а Codex использует `POST /v1/responses`."
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "Подтвердите вызов",
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
              "Для другого совместимого клиента запустите `GET https://partokens.com/v1/models`, затем отправьте запрос в чат с тем же ключом и идентификатором модели.",
              "Для Shell, JavaScript, Python и совместимых клиентов подтвердите успешный ответ HTTP и читаемый `choices[0].message.content`.",
              "После настройки Base URL, ключа и модели проверьте Codex с помощью `codex exec \"Reply only with: connection successful\"`."
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "Устранение неполадок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Ошибка конфигурации клиента: нет запроса или неверный заголовок URL, Bearer или модель; исправьте настройку перед повторной попыткой.",
              "Сетевая ошибка: статус HTTP не получен; проверьте DNS, TLS, прокси и тайм-аут соединения.",
              "API: прибыл статус HTTP и JSON `error`; обрабатывайте 401, 400, 429 или 5xx как результат API, а не как сбой клиента."
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "Создайте ключ API в консоли, настройте его в безопасной среде выполнения и по порядку чередуйте или отзывайте старые ключи.",
    "prerequisites": [
      "Доступ к консоли Partokens"
    ],
    "sections": [
      {
        "id": "create",
        "title": "Создать ключ",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Управление открытыми ключами",
                "body": "Войдите в консоль, откройте ключи API и выберите «Создать ключ»."
              },
              {
                "title": "Установите необходимые параметры",
                "body": "Введите имя и выберите группу; при необходимости установите предел квоты и срок ее действия."
              },
              {
                "title": "Сохраните учетные данные",
                "body": "После отправки используйте «Показать» или «Копировать» в списке ключей и немедленно поместите учетные данные в безопасную среду выполнения."
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Настройте ключ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Используйте переменную среды на стороне сервера или диспетчер секретов; никогда не помещайте ключ в репозиторий, URL, журнал или код браузера.",
              "Отправьте его как `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Установите переменную среды",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "Поворот и отзыв",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Создайте замену",
                "body": "Создайте запасной ключ для того же приложения и надежно сохраните его."
              },
              {
                "title": "Сначала проверьте",
                "body": "Измените одну контролируемую среду и вызовите `GET /v1/models`, чтобы подтвердить, что замена работает."
              },
              {
                "title": "Заменять при каждом использовании",
                "body": "Обновите службы, задания и значения менеджера секретов, а затем подтвердите, что новая конфигурация активна."
              },
              {
                "title": "Отключить старый ключ",
                "body": "В списке действий ключей выберите «Отключить», чтобы приостановить действие, или «Удалить», чтобы удалить старый ключ."
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "Обработка исключений",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: проверьте переменную среды, заголовок Bearer и состояние ключа; убедитесь, что старое значение не используется.",
              "403: проверьте группу ключей, область доступа и включенное состояние, прежде чем повторить попытку.",
              "Предполагаемое воздействие: немедленно отключите или удалите ключ, создайте и проверьте замену, а затем обновляйте его при каждом использовании.",
              "Срок действия ключа истек, отключен или исчерпан: не повторяйте попытку повторно; создайте замену и проверьте ее."
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "Просмотрите баланс, планы и использование в консоли, выберите источник выставления счетов и выполните восстановление при недостаточной квоте.",
    "prerequisites": [
      "Доступ к консоли Partokens"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "Посмотреть баланс и план",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть кошелек",
                "body": "Войдите в консоль и выберите «Кошелек» в разделе «Учетная запись» на боковой панели."
              },
              {
                "title": "Проверить статус аккаунта",
                "body": "В верхней части страницы просмотрите баланс учетной записи, общий объем использования и количество активных планов."
              },
              {
                "title": "Проверить квоту плана",
                "body": "В разделе «Выбор плана» выберите «Просмотреть активный» и проверьте состояние каждого плана, общую квоту, оставшуюся квоту и процент использования."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Баланс счета показывает доступный на данный момент баланс.",
              "Общее использование показывает использование, уже записанное для учетной записи.",
              "В сведениях об активном плане показаны планы, которые еще можно использовать, и их оставшаяся квота."
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "Выберите источник выставления счетов",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Найдите предпочтение",
                "body": "В нижней части окна «Выбор плана в Кошельке» найдите настройки оплаты за использование. Вы можете изменить его, пока доступен активный план."
              },
              {
                "title": "Выберите текущие предпочтения",
                "body": "Выберите «Сначала подписка», «Сначала баланс», «Только подписка» или «Только баланс», затем дождитесь успешного обновления, прежде чем вызывать API."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "«Сначала подписка» и «Сначала баланс» выбирают, какой источник будет опробован в первую очередь.",
              "Только подписка и только баланс ограничивают использование этого источника.",
              "Прежде чем менять предпочтения, убедитесь, что выбранный источник доступен в данный момент."
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "Проверить использование",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть журнал использования",
                "body": "На боковой панели консоли выберите журнал использования в разделе «Общие»."
              },
              {
                "title": "Ограничьте время и модель",
                "body": "Выберите диапазон, охватывающий вызов, затем выберите модель. Для точного поиска измените поле поиска на «Идентификатор запроса» и введите полный идентификатор запроса."
              },
              {
                "title": "Сравните колл и списание",
                "body": "Откройте соответствующую запись и просмотрите ее время, тип, модель, ошибку, использование, стоимость и идентификатор запроса, а затем сравните ее с балансом или оставшейся квотой плана в Кошельке."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "Устранить недостаточную квоту",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Недостаточный баланс: проверьте Кошелек и воспользуйтесь доступным на данный момент вариантом пополнения или переключитесь на план с доступной квотой.",
              "Недостаточный или недоступный план: откройте сведения об активном плане и проверьте его статус и оставшуюся квоту; выберите доступный в данный момент план или измените настройки выставления счетов на доступный источник.",
              "Отклоненный запрос: сохраните статус HTTP, ошибку и идентификатор запроса, затем проверьте журнал использования на наличие записи. Для 401 или 403 также проверьте состояние ключа API и доступ.",
              "После исправления баланса, плана, платежных предпочтений или ключа сначала отправьте один минимальный запрос. Не отправляйте повторно запросы без изменений."
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "Найдите доступные на данный момент модели, просмотрите информацию о возможностях и ценах, выберите подходящий API и устраните ошибки модели.",
    "prerequisites": [
      "Доступ к учетной записи Partokens",
      "Ключ API `<YOUR_PARTOKENS_API_KEY>` при запросе через API"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "Найти модели",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Запросить модели аккаунта",
                "body": "Вызовите конечную точку моделей с текущим ключом API, чтобы просмотреть модели, возвращенные для этой учетной записи."
              },
              {
                "title": "Модели запроса для ключа",
                "body": "Вы также можете вызвать конечную точку моделей с помощью `<YOUR_PARTOKENS_API_KEY>`, чтобы просмотреть модели, возвращаемые в настоящее время для этого ключа."
              },
              {
                "title": "Скопируйте идентификатор модели",
                "body": "Скопируйте точный идентификатор модели из ответа списка моделей или `data[].id` и используйте его без изменений как `<YOUR_MODEL_ID>` в последующих запросах."
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Модели",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "check-capability-price",
        "title": "Проверить возможности и цену",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Используйте ответ списка моделей, чтобы подтвердить `<YOUR_MODEL_ID>`, и перед вызовом изучите соответствующую документацию API. Текущие данные о расчетах и ценах возвращает сервис.",
              "Если информация о возможностях или цене отсутствует, не делайте списаний об этом из названия модели или аналогичного названия.",
              "Прежде чем звонить, убедитесь, что целевой API отображается в текущей информации о возможностях модели. Используйте данные учетной записи, отображаемые в тот момент, для выбора цены.",
              "Просмотр фактического использования и списаниеов в журнал использования после вызова."
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "Выберите API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions: если модель явно поддерживает завершение чата, отправьте список сообщений на `POST /v1/chat/completions`.",
              "Responses: если модель явно поддерживает Responses, используйте `POST /v1/responses`; родные соединения Codex используют этот API.",
              "Image API: если модель явно поддерживает изображения, используйте `POST /v1/images/generations` для генерации изображения. При добавлении исходного изображения Студия изображений использует API редактирования изображений.",
              "Модель может не поддерживать все API или дополнительные параметры. Начните с минимального запроса к цели API."
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "Устранение проблем с моделью",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Модель не видна: обновите модели. При использовании API убедитесь, что `GET /v1/models` завершился успешно, и проверьте, пуст ли `data`.",
              "Модель не может быть вызвана: используйте точный возвращенный идентификатор и повторно запросите список моделей с тем же ключом API. Не угадывайте идентификатор, если этот ключ получает пустой список.",
              "Несовместимый параметр или 400: прочитайте `error.message`, удалите необязательные параметры и повторите попытку с минимальным количеством полей для целевого API.",
              "403: прочитайте ошибку, затем проверьте состояние ключа API, доступ к модели, а также баланс или план, прежде чем повторить попытку.",
              "Модель видна, но по-прежнему не работает: сохраните время запроса, идентификатор модели, статус HTTP и идентификатор запроса, затем найдите запись в журнал использования."
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "Подключите собственный Codex к Partokens с конфигурацией поставщика модели и проверьте вызов Responses с помощью минимальной команды.",
    "prerequisites": [
      "Ключ API `<YOUR_PARTOKENS_API_KEY>`",
      "A Идентификатор модели с поддержкой Responses `<YOUR_MODEL_ID>`",
      "Codex установлен и работает"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "Подготовьте Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Запустите `codex --version` и убедитесь, что Codex запускается в текущем терминале.",
              "Скопируйте точный `<YOUR_MODEL_ID>` из `GET https://partokens.com/v1/models` и подтвердите, что он поддерживает Responses.",
              "Подготовьте ключ Partokens API `<YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Установите переменную среды",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "Настройка соединения",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть конфигурацию пользователя",
                "body": "Отредактируйте `~/.codex/config.toml` и сохраните все необходимые настройки."
              },
              {
                "title": "Добавьте поставщика Partokens",
                "body": "Добавьте ниже модель и конфигурацию поставщика. `env_key` считывает указанную выше переменную среды."
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
        "title": "Подтвердить вызов",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Минимальная проверка",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Обычный результат `connection successful` подтверждает, что Codex отправил и выполнил запрос через эту конфигурацию.",
              "Затем вы можете найти вызов в журнал использования по его времени, модели и идентификатору запроса."
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Обработка сбоев",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Ошибка конфигурации: если Codex не может прочитать файл или использует непредвиденную модель, проверьте синтаксис TOML, `model_provider` и `<YOUR_MODEL_ID>` и убедитесь, что переменная среды установлена в том же терминале.",
              "Ошибка подключения: когда не поступает статус HTTP, проверьте сеть, прокси, DNS, TLS и что `base_url` — это `https://partokens.com/v1`.",
              "HTTP/API: для 400, 401, 403, 429 или 5xx сохраните статус, ошибку и идентификатор запроса. Исправьте параметры, ключ, доступ или квоту, прежде чем принимать решение о повторной попытке.",
              "Модель не поддерживает Responses: выберите текущую модель из списка, которая явно поддерживает Responses. Не меняйте `wire_api` на другое значение."
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "Установите OpenAI SDK для JavaScript или Python, настройте Base URL Partokens и ключ, затем прочитайте текст из минимального запроса в чат.",
    "prerequisites": [
      "Среда выполнения Node.js или Python",
      "A Partokens API ключ",
      "Идентификатор модели"
    ],
    "sections": [
      {
        "id": "install",
        "title": "Установите SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Установите поддерживаемый OpenAI SDK в серверный проект."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Установить и установить переменные",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Настройка клиента",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript использует `apiKey` и `baseURL`.",
              "Python использует `api_key` и `base_url`.",
              "Установите для обоих SDK значение `https://partokens.com/v1`; укажите `<YOUR_MODEL_ID>` через переменную среды модели."
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
        "title": "Отправить и прочитать запрос",
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
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Ошибка подключения: перед повторной попыткой проверьте DNS, TLS, прокси-сервер и сеть.",
              "HTTP: прочтите статус, `error.message` и `X-Oneapi-Request-Id`; сначала исправьте 400, 401 или 403.",
              "429: следуйте `Retry-After` или используйте экспоненциальную экспоненциальную задержку.",
              "5xx: повторите попытку с максимальным количеством попыток и общим сроком.",
              "Таймаут: установите таймаут SDK; запрос на чат, возможно, уже был выполнен, поэтому перед повторной попыткой проверьте записи об использовании."
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "Откройте Студия изображений из консоли, выберите текущую модель и ключ, сгенерируйте или отредактируйте изображения и сохраните нужные вам результаты.",
    "prerequisites": [
      "Доступ к консоли Partokens",
      "Доступная модель образа и ключ API"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "Открыть рабочую область",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть консоль",
                "body": "Войдите в Partokens и откройте консоль."
              },
              {
                "title": "Открыть Студию изображений",
                "body": "На боковой панели выберите «Студия изображений» в разделе «Рабочая область»."
              },
              {
                "title": "Проверьте рабочее пространство",
                "body": "Настройки генерации находятся слева, а текущий набор результатов — справа."
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "Выберите модель и ключ",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Выберите модель",
                "body": "В разделе «Модель» выберите модель изображения из текущего списка и используйте это точное значение как `<YOUR_MODEL_ID>`. Не угадывайте название модели."
              },
              {
                "title": "Выберите ключ API",
                "body": "В первом поколении выберите активный ключ, совместимый с моделью, в диалоговом окне «Требуется ключ API», затем продолжите генерацию."
              },
              {
                "title": "Если ключ недоступен",
                "body": "Используйте «Создать ключ» в диалоговом окне или откройте ключи API и создайте ключ для выбранной модели, прежде чем вернуться в Студия изображений."
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "Создание или редактирование изображений",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Введите подсказку",
                "body": "Опишите изображение, которое нужно создать или отредактировать, в командной строке."
              },
              {
                "title": "Установите выход",
                "body": "Выберите качество, размер изображения и количество изображений из показанных вариантов."
              },
              {
                "title": "При необходимости добавьте ссылку",
                "body": "Загрузите изображение PNG, JPG или WebP, чтобы отредактировать его, или выберите «Использовать как ссылку» для сгенерированного результата."
              },
              {
                "title": "Запустить задачу",
                "body": "Выберите «Создать» и дождитесь изображений в разделе «Результаты». Если модель отклоняет настройку, выберите один из вариантов, доступных в настоящее время для этой модели."
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "Сохранение и обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Сохраните результат: выберите «Загрузить изображение» для каждого изображения, которое вам нужно сохранить. Следующее поколение заменяет отображаемый набор результатов.",
              "Ошибка генерации или неподдерживаемый параметр: прочитайте ошибку страницы, выберите качество, размер или количество, предлагаемые для текущей модели, и удалите несовместимые настройки.",
              "401: убедитесь, что выбранный ключ API все еще действителен. 403: проверьте ключевой доступ к модели и балансу счета или плану. Не регенерируйте, пока не исправите.",
              "429: подождите, как указано, прежде чем повторять попытку. Для 5xx сохраните детали запроса и используйте ограниченную отсрочку с общим сроком выполнения."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Проверить журналы после отмены или таймаута",
            "body": "После выхода из активной генерации и подтверждения остановки или после таймаута сначала проверьте журнал использования по времени, модели и идентификатору запроса на запись и списание, затем решите, следует ли повторять попытку."
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "Отправьте запросы HTTPS с базой Partokens URL и ключом Bearer API, затем обработайте результат с помощью статуса HTTP и тела ответа.",
    "prerequisites": [
      "A Partokens API ключ",
      "Идентификатор модели, скопированный из списка моделей"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Отправить запрос",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Отправьте `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Запросы с телом JSON также требуют `Content-Type: application/json`.",
              "Никогда не размещайте ключ API в URL, клиентском коде или журналах."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Выполнить минимальный запрос",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: точный идентификатор модели, возвращаемый списком моделей.",
              "`messages`: упорядоченные сообщения, отправленные в модель.",
              "`messages[].role`: используйте `user` для минимального текстового запроса.",
              "`messages[].content`: непустой текст."
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
        "title": "Прочитать ответ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Сначала проверьте статус HTTP; статус 2xx указывает на успешный ответ HTTP.",
              "Проанализируйте тело JSON и прочитайте результат конечной точки, например `choices` для чата, `data` для изображений или `data` для моделей.",
              "Для ответа, отличного от 2xx, прочитайте `error.message` и запишите `error.code`, если он присутствует."
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: исправьте поля JSON или запроса перед повторной отправкой.",
              "401 / 403: проверьте ключ API и доступ; не повторяйте попытки изменить учетные данные.",
              "429: дождитесь `Retry-After`, если он присутствует, в противном случае используйте экспоненциальную задержку с джиттером.",
              "5xx: повторная попытка с экспоненциальной задержкой, максимальным количеством попыток и общим крайним сроком.",
              "Ошибка сети или тайм-аут: определите, пришел ли ответ HTTP, прежде чем принять решение о повторной попытке."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Повторить попытку безопасно",
            "body": "GET можно повторить в течение общего срока; Повторить запрос чата и изображения POST автоматически только тогда, когда приложение принимает повторяющиеся результаты и использование."
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "Отправьте массив сообщений для создания ответа в чате, затем прочитайте текст от `choices[0].message.content`.",
    "prerequisites": [
      "A Partokens API ключ",
      "Идентификатор модели с возможностью общения в чате, скопированный из списка моделей",
      "OpenAI SDK для примеров JavaScript и Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Отправить запрос",
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
              "Отправить `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Отправьте `Content-Type: application/json`.",
              "Для SDK установите базовый URL на `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Заполните запрос",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: точный идентификатор модели, возвращаемый списком моделей.",
              "`messages`: упорядоченные сообщения, отправленные в модель.",
              "`messages[].role`: используйте `user` для минимального текстового запроса.",
              "`messages[].content`: непустой текст сообщения."
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
        "title": "Прочитать ответ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`: текст от первого кандидата.",
              "`choices[0].finish_reason`: почему этот кандидат остановился.",
              "`usage`: количество входных, выходных и общего количества токенов при возврате."
            ]
          },
          {
            "type": "paragraph",
            "text": "Считайте пустой массив `choices` или первого кандидата без текста ответом без какого-либо полезного результата чата."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: используйте `error.message` для исправления `model`, `messages` или поля сообщения.",
              "401 / 403: проверьте ключ API и доступ; не повторяйте попытки изменить учетные данные.",
              "429: дождитесь `Retry-After`, если он присутствует, в противном случае используйте экспоненциальную задержку с джиттером.",
              "5xx: повторная попытка с экспоненциальной задержкой, максимальным количеством попыток и общим крайним сроком.",
              "Сетевая ошибка или тайм-аут: возможно, запрос был выполнен; не отправляйте его повторно немедленно."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Избегайте дублирования поколений",
            "body": "Автоматически повторять запросы чата только в том случае, если приложение принимает повторяющиеся ответы и использование, а клиент устанавливает время ожидания и максимальное количество попыток."
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "Отправьте запрос на создание изображения, затем сохраните результат из `data[0].url` или `data[0].b64_json`.",
    "prerequisites": [
      "A Partokens API ключ",
      "Идентификатор модели с возможностью изображения, скопированный из списка моделей",
      "cURL, jq и OpenSSL для Shell; OpenAI SDK для JavaScript и Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Отправить запрос",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Генерация изображений",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "Отправить `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Отправьте `Content-Type: application/json`.",
              "Для SDK установите базовый URL на `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Заполните запрос",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: точный идентификатор модели изображения, возвращаемый списком моделей.",
              "`prompt`: непустое текстовое описание изображения."
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
        "title": "Прочитать ответ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Убедитесь, что массив `data` не пуст.",
              "Если присутствует `data[0].url`, загрузите его и проверьте статус загрузки HTTP.",
              "Если URL отсутствует, но существует `data[0].b64_json`, декодируйте значение Base64 в двоичный файл.",
              "Считайте результат без полей как ответ без пригодного для использования изображения."
            ]
          },
          {
            "type": "paragraph",
            "text": "Не записывать полные данные образа Base64 в журналы приложений."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: используйте `error.message` для исправления `model` или `prompt`.",
              "401 / 403: проверьте ключ API и доступ; не повторяйте попытки изменить учетные данные.",
              "429: дождитесь `Retry-After`, если он присутствует, в противном случае используйте экспоненциальную задержку с джиттером.",
              "5xx: повторная попытка с экспоненциальной задержкой, максимальным количеством попыток и общим крайним сроком.",
              "Сетевая ошибка или тайм-аут: возможно, запрос был выполнен; не создавайте снова немедленно.",
              "Ошибка загрузки изображения: повторите загрузку без повторной отправки запроса на создание."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Избегайте дублирования поколений",
            "body": "Повторяйте создание образа автоматически только в том случае, если приложение принимает дубликаты изображений и их использование, а клиент устанавливает время ожидания и максимальное количество попыток."
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "Считайте модели, доступные для текущего ключа API, и повторно используйте точный возвращенный идентификатор модели в других запросах.",
    "prerequisites": [
      "A Partokens API ключ",
      "cURL и jq для Shell; OpenAI SDK для JavaScript и Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Отправить запрос",
        "blocks": [
          {
            "type": "endpoint",
            "method": "GET",
            "label": "Модели",
            "path": "https://partokens.com/v1/models"
          },
          {
            "type": "list",
            "items": [
              "Отправьте `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Этот запрос GET не имеет тела запроса."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Выполнить минимальный запрос",
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
        "title": "Прочитать ответ",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "Поле",
              "Значение"
            ],
            "rows": [
              [
                "`object`",
                "Значение `list` идентифицирует список моделей."
              ],
              [
                "`data`",
                "Массив модели; пустой массив означает, что для ключа в настоящее время нет доступных моделей."
              ],
              [
                "`data[].id`",
                "Скопируйте точное значение в поле `model` другого запроса."
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Не изменяйте регистр букв в идентификаторе модели, а также не добавляйте и не удаляйте префикс."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Обработка ошибок",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403: проверьте ключ API и доступ; не повторяйте попытки изменить учетные данные.",
              "429: дождитесь `Retry-After` или используйте экспоненциальную задержку с джиттером.",
              "5xx, сетевая ошибка или тайм-аут: повторите попытку с максимальным количеством попыток и общим сроком.",
              "2xx с пустым `data`: проверьте модели, доступные для ключа; не угадывайте идентификатор модели."
            ]
          },
          {
            "type": "paragraph",
            "text": "Список моделей представляет собой запрос GET, и его можно безопасно повторить в течение общего срока; установите таймаут и ограничьте количество попыток."
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "Ответы на вопросы по интеграции, учетной записи, модели, использованию и типичным сбоям, а также актуальные источники для проверки.",
    "sections": [
      {
        "id": "choose-integration",
        "title": "Выберите метод интеграции",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Могу ли я продолжать использовать OpenAI SDK?",
                "answer": "Да. Установите для Base URL значение `https://partokens.com/v1`, используйте ключ Partokens API и укажите точный идентификатор модели, возвращаемый в настоящее время для учетной записи."
              },
              {
                "question": "Что следует использовать: Shell, SDK или совместимый клиент?",
                "answer": "Используйте Shell для минимальных проверок и воспроизведений, SDK для служб и сценариев и существующего клиента только тогда, когда он предоставляет Base URL, ключ Bearer и настройки идентификатора модели."
              },
              {
                "question": "Где полные примеры запросов?",
                "answer": "Используйте Быстрый старт: первая интеграция для первого звонка и соответствующую страницу API для полей и форм ответов."
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "Управление ключами и учетной записью",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Где следует хранить ключ API?",
                "answer": "Сохраните `<YOUR_PARTOKENS_API_KEY>` в переменной среды или секретном менеджере. Не помещайте его в репозиторий, URL, журнал или код браузера."
              },
              {
                "question": "Как повернуть ключ?",
                "answer": "Сначала создайте и проверьте новый ключ, обновите его во всех клиентах, затем отключите или удалите старый ключ в консоли. При подозрении на утечку немедленно отключите старый ключ."
              },
              {
                "question": "Где я могу проверить баланс, планы и доступную квоту?",
                "answer": "Используйте страницы текущего счета, фактический ответ на запрос журнал использования и фактический списание."
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "Проверьте модели и использование",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Какой идентификатор модели мне следует использовать?",
                "answer": "Скопируйте точный текущий идентификатор из ответа `GET /v1/models` и используйте его без изменений как `<YOUR_MODEL_ID>`. Не угадывайте название модели."
              },
              {
                "question": "Поддерживает ли указанная модель все конечные точки и параметры?",
                "answer": "Не делайте подобных предположений. Проверьте текущие возможности модели и проверьте каждую целевую конечную точку и параметр с минимальным запросом и фактическим ответом."
              },
              {
                "question": "Означает ли запись журнала использования, что вызов прошел успешно?",
                "answer": "Не обязательно. Также проверьте тип записи, статус HTTP и ошибку, сохраняемую клиентом, токены, стоимость и продолжительность."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "Устранение распространенных неисправностей",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Что следует проверить в первую очередь, если запрос не выполнен?",
                "answer": "Используйте `GET https://partokens.com/v1/models` для проверки соединения и аутентификации, затем исправьте запрос в соответствии с 400, 401, 403, 429 или 5xx. Сохраните время, часовой пояс, конечную точку, модель и идентификатор запроса."
              },
              {
                "question": "Можно ли немедленно повторить попытку при каждой ошибке?",
                "answer": "Нет. Сначала исправьте 400, 401 и 403. Следуйте за `Retry-After` или отступите от 429. Повторите попытку 5xx только ограниченное количество раз и только тогда, когда повторное воспроизведение безопасно."
              },
              {
                "question": "Что мне делать после отмены или тайм-аута?",
                "answer": "Сначала выполните поиск в журнал использования по времени, модели, имени ключа и идентификатору запроса и просмотрите все списания, а затем решите, следует ли повторять попытку."
              },
              {
                "question": "Когда мне следует обращаться в службу поддержки?",
                "answer": "После проверок в разделах «Подключение, ограничения и повторы» и «Журнал использования» откройте раздел «Связаться с поддержкой» и подготовьте диагностическую информацию без конфиденциальных данных."
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "Сначала запустите запрос минимальной модели, затем используйте статус HTTP, чтобы выбрать политику исправления и повтора.",
    "prerequisites": [
      "A Partokens API ключ",
      "Доступ к статусу команды HTTP, заголовкам ответа и телу ответа"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "Запустите минимальную проверку",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Приведенный ниже запрос `GET /v1/models` не запускает задачу генерации. Используйте его для проверки DNS, TLS, настроек прокси, Base URL и аутентификации. Команда также показывает заголовки ответов, чтобы вы могли сохранить идентификатор запроса."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Проверка подключения и аутентификации",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "Исправить проблемы по статусу",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Ошибка подключения: когда не поступает статус HTTP, проверьте сеть, DNS, TLS, прокси, тайм-аут соединения и убедитесь, что URL — это именно `https://partokens.com/v1/models`.",
              "400: используйте возвращенную ошибку для исправления JSON, обязательных полей, идентификатора модели или целевой конечной точки. Не повторяйте запрос без изменений.",
              "401: убедитесь, что переменная среды установлена, заголовок Bearer заполнен, ключ не усечен и ключ остается включенным в консоли.",
              "403: используйте возвращенную ошибку, чтобы проверить доступ к ключу, доступность модели и текущий баланс или план учетной записи, затем устраните проблему перед повторной попыткой.",
              "429: следуйте `Retry-After`, если он присутствует. В противном случае уменьшите параллелизм и используйте экспоненциальную отсрочку.",
              "5xx: сохраните идентификатор запроса и используйте ограниченную отсрочку только тогда, когда запрос можно безопасно воспроизвести."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Статус — отправная точка",
            "body": "Одно и то же состояние может иметь разные причины. Используйте тело ответа, идентификатор запроса, информацию о текущей учетной записи и журнал использования для окончательной диагностики."
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "Решите, повторять ли попытку",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Повтор: временный сбой соединения для `GET /v1/models`, 429 после необходимого ожидания или временный 5xx. Установите общий срок и максимальное количество попыток.",
              "Сначала исправьте: 400, 401, 403, а также ошибки, явно вызванные моделью, конечной точкой, параметром, ключом или состоянием учетной записи.",
              "Сначала проверьте журналы: отмена клиента или тайм-аут не доказывают, что запрос не был выполнен. Выполните поиск в журнал использования по времени, модели, названию ключа и идентификатору запроса, а затем просмотрите все списания.",
              "Избегайте дублирования работы: автоматически повторяйте чат, создание изображений или редактирование изображений только тогда, когда повторяющиеся результаты и использование допустимы."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Не воспроизводить сразу после отмены или тайм-аута",
            "body": "Если журнал использования показывает исполнение или списание, сначала просмотрите результат и идентификатор запроса. Если результат остается неясным, подготовьте диагностическую информацию и обратитесь в службу поддержки."
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Подготовка диагностики",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Запишите запрос",
                "body": "Сохраняйте точное время и часовой пояс, модель, конечную точку, статус HTTP и идентификатор запроса."
              },
              {
                "title": "Сохранить ошибку без конфиденциальных данных",
                "body": "Сохраните достаточно текста ошибки, чтобы объяснить проблему, и удалите учетные данные, личную информацию, полные запросы и личные файлы."
              },
              {
                "title": "журнал использования",
                "body": "Укажите, была ли найдена соответствующая запись, и сохраните временной диапазон, модель, имя ключа и идентификатор запроса, использованные для поиска."
              },
              {
                "title": "Напишите минимальное воспроизведение",
                "body": "Укажите наименьшее количество шагов, ожидаемый и фактический результат, а затем воспользуйтесь службой поддержки, чтобы выбрать официальный канал."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Не отправлять учетные данные",
            "body": "Информация о поддержке не должна содержать полный ключ API, пароль, код подтверждения или токен сеанса."
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "Найдите вызовы в консоли и просмотрите тип, ошибки, токены, стоимость, продолжительность и списания.",
    "sections": [
      {
        "id": "open-logs",
        "title": "Открыть журнал использования",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Открыть консоль",
                "body": "Войдите в Partokens и откройте консоль."
              },
              {
                "title": "Открыть журнал использования",
                "body": "В разделе «Общие» на боковой панели выберите журнал использования."
              },
              {
                "title": "Обновить текущие данные",
                "body": "Если вам нужно получить текущие записи, выберите «Обновить», а затем начните со времени запроса."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "Журнал использования помогает сопоставлять вызовы и события учетной записи. Также сохраните статус HTTP, заголовки ответа и текст ошибки без конфиденциальных данных, полученный клиентом."
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "Фильтровать запросы",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Выберите временной диапазон",
                "body": "Выберите диапазон, включающий время запроса, и подтвердите часовой пояс, используемый журналом и временными метками клиента."
              },
              {
                "title": "Выберите модель",
                "body": "Используйте фильтр модели, чтобы сузить результаты. Идентификатор модели должен точно соответствовать значению запроса."
              },
              {
                "title": "Поиск по названию ключа",
                "body": "Откройте меню поля точного поиска, выберите имя ключа API и введите имя, отображаемое в журнале. Не вводите значение ключа."
              },
              {
                "title": "Поиск по идентификатору запроса",
                "body": "Откройте меню поля точного поиска, выберите «Идентификатор запроса» и введите полный идентификатор запроса."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Используйте только те условия, которые необходимы для поиска записи. Если результата нет, сначала проверьте временной диапазон, часовой пояс и точные значения.",
              "Перед повторным поиском очистите неприменимые фильтры, чтобы старое условие не исключало запись."
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "Обзор результатов и списаний",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Тип и ошибка: используйте Тип, чтобы различать события использования и ошибки. Для события ошибки сопоставьте его время и идентификатор запроса со статусом HTTP и отредактированной ошибкой, хранящейся у клиента.",
              "Токены: просмотрите входные, выходные и кэшированные токены. Не вычисляйте поля, которые отсутствуют или неприменимы.",
              "Стоимость: просмотрите учетную стоимость и отфильтрованную общую стоимость, а затем сравните их с списаниеом по счету.",
              "Продолжительность: просмотр общей продолжительности. Потоковые вызовы также могут показывать время до первого токена.",
              "Подробности: откройте соответствующую запись и подтвердите, что идентификатор запроса, время, модель, имя ключа, токены, стоимость и продолжительность принадлежат одному и тому же вызову."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Рекорд не является доказательством успеха",
            "body": "Журналы могут содержать информацию об использовании, ошибках или других событиях учетной записи. Используйте тип, результат клиента и фактический списание вместе, чтобы определить результат."
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Обработка сбоев и тайм-аутов",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Сопоставить неудавшуюся запись",
                "body": "Используйте точное время, модель, имя ключа и идентификатор запроса, затем сравните запись со статусом клиента HTTP и отредактированной ошибкой."
              },
              {
                "title": "Проверьте, было ли записано использование",
                "body": "Просмотрите токены, стоимость и продолжительность, чтобы определить, оставил ли запрос записи выполнения и удержания."
              },
              {
                "title": "Относитесь к отмене или тайм-ауту осторожно",
                "body": "Отмена или тайм-аут не доказывают, что обработка остановлена. Прежде чем повторить попытку, просмотрите журналы и списания."
              },
              {
                "title": "Подготовка информации о поддержке",
                "body": "Если результат остается неясным, сохраните временной диапазон поиска, часовой пояс и фильтры, а затем откройте «Обратиться в службу поддержки»."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Не выполнять поиск по секрету",
            "body": "Фильтровать по имени ключа, а не по полному ключу API. Прежде чем сообщать о проблеме, удалите учетные данные, личную информацию, полные запросы и личные файлы."
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "После самостоятельной проверки отправьте через электронную почту или Telegram поддержки Partokens отчет с данными для сопоставления и без конфиденциальной информации.",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "Завершить предварительные проверки",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Воспроизвести минимум",
                "body": "При возникновении проблемы с API запустите минимальную проверку в разделе «Соединение, ограничения и повторы» и запишите фактический статус HTTP."
              },
              {
                "title": "Проверьте модель и учетную запись",
                "body": "Подтвердите, что модель находится в текущем списке, затем проверьте статус ключа, доступ и информацию о текущей учетной записи."
              },
              {
                "title": "Поиск журнал использования",
                "body": "Выполните поиск по времени, модели, имени ключа и идентификатору запроса, а затем просмотрите токены, стоимость и продолжительность."
              },
              {
                "title": "Подтвердите, что помощь по-прежнему необходима",
                "body": "Укажите уже завершенные проверки, ожидаемый результат и фактический результат вместо того, чтобы сообщать только о том, что что-то недоступно."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Проблема со входом в систему или учетной записью: сохранить страницу, точное время и часовой пояс, а также отредактировать ошибку.",
              "Проблема API: сохранить конечную точку, модель, статус HTTP и идентификатор запроса.",
              "Отмена или тайм-аут: сначала укажите, содержит ли журнал использования запись и списание."
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Подготовка диагностической информации",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Точное время и часовой пояс запроса или проблемы.",
              "Точный идентификатор модели, используемый в запросе.",
              "API конечная точка или страница консоли, на которой возникла проблема.",
              "Фактический статус HTTP или четкое заявление о том, что ответ не получен.",
              "Полный идентификатор запроса или четкое заявление о том, что ни один запрос не был возвращен.",
              "Отредактированная ошибка, сохраняющая смысл сбоя.",
              "Минимальные шаги воспроизведения, ожидаемый результат и фактический результат.",
              "Была ли найдена соответствующая запись журнала использования, включая проверенные токены, стоимость и продолжительность."
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "Удалить конфиденциальные данные",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Не отправляйте ключ API или любые другие учетные данные доступа.",
              "Не отправляйте пароли, коды проверки, коды восстановления, файлы cookie или токены сеанса.",
              "Не указывайте имена, адреса электронной почты, номера телефонов, адреса, личные данные или другую личную информацию.",
              "Не отправляйте полные запросы, полные тела запроса или необработанный контент, не связанный с воспроизведением.",
              "Не отправляйте личные файлы, частные URL-адреса загрузки, большие значения Base64 или непроверенный экспорт журналов."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Поверните ключ, прежде чем сообщить о подозрении на воздействие",
            "body": "Немедленно отключите или удалите затронутый ключ, создайте и проверьте новый, а затем обновите его во всех клиентах. Не отправляйте старый ключ в канал поддержки."
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "Используйте официальные каналы поддержки",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Выберите любой из указанных ниже общедоступных каналов поддержки и включите в первое сообщение минимально необходимую диагностическую информацию без конфиденциальных данных. Документация не устанавливает сроки ответа или решения проблемы."
          },
          {
            "type": "links",
            "items": [
              {
                "label": "Поддержка по электронной почте",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "Бот поддержки Telegram",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
