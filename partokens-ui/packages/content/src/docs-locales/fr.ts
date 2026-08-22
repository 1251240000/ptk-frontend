import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const frDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "Choisissez une méthode d'intégration, préparez le compte, la clé API et l'ID de modèle actuel, puis effectuez un appel minimal.",
    "sections": [
      {
        "id": "choose-path",
        "title": "Choisissez un chemin d'intégration",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Chaque méthode d'intégration utilise le même accès au compte, la même clé API, le même ID de modèle et la même Base URL compatible OpenAI. Choisissez le chemin le plus court pour la tâche en cours."
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL : premiers contrôles de connectivité et reproductions.",
              "OpenAI JavaScript ou Python SDK : services, scripts et projets SDK existants.",
              "Un client avec un OpenAI Base URL personnalisé : outils existants qui exposent Base URL, la clé Bearer et les paramètres d'ID de modèle.",
              "Espaces de travail de la console : accès direct aux fonctionnalités de chat ou d’image actuellement disponibles pour le compte."
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "Préparer le compte et la clé",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Créer une clé API",
                "body": "Connectez-vous à la console, ouvrez les clés API, créez une clé et stockez-la en toute sécurité sous le nom `<YOUR_PARTOKENS_API_KEY>`."
              },
              {
                "title": "Copier un ID de modèle actuel",
                "body": "Appelez le point de terminaison des modèles avec cette clé, puis copiez l'ID actuel exact sous `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Stocker les détails de connexion",
                "body": "Conservez la clé dans une variable d'environnement ou un gestionnaire de secrets ; ne le placez pas dans un référentiel, URL, un journal ou un code de navigateur."
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
        "title": "Terminer le premier appel",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ouvrir le premier guide d'intégration",
                "body": "Accédez à Démarrage rapide : première intégration et choisissez l'exemple Shell, JavaScript ou Python."
              },
              {
                "title": "Remplacer les valeurs de connexion",
                "body": "Conservez la Base URL commune et fournissez `<YOUR_PARTOKENS_API_KEY>` et `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Confirmer le résultat",
                "body": "Envoyez la requête minimale, vérifiez d'abord l'statut HTTP et confirmez que la réponse contient un résultat lisible. Conservez l’heure, le statut et l’ID de la requête en cas d’échec."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "Vérifiez d'abord le minimum",
            "body": "Une fois la requête minimale réussie, connectez l'application et ajoutez les paramètres facultatifs un par un. Cette page ne répète pas l'exemple de requête complet."
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "Continuer avec la documentation",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Comprendre la portée du service : Qu'est-ce que Partokens ?",
              "Gérer les informations d'identification : gestion des clés API.",
              "Choisissez les modèles et vérifiez les prix : Modèles et prix et Modèles API.",
              "Configurez un SDK ou un client : configuration SDK, clients pris en charge ou configuration Codex et CLI.",
              "Analyser les requêtes et les prélèvements : consultez Connexion, limites et nouvelles tentatives ainsi que Journaux d’utilisation.",
              "Obtenez de l'aide après les contrôles en libre-service : contactez l'assistance."
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens fournit un accès API compatible OpenAI aux modèles et fonctionnalités actuellement disponibles pour un compte.",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "Confirmer la portée du service",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens fournit une Base URL commune compatible OpenAI, une console de compte et une documentation API publique. Les applications peuvent envoyer des requêtes via HTTPS, les SDK OpenAI ou des clients avec une Base URL personnalisée."
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "La compatibilité n'est pas une identité",
            "body": "La compatibilité avec OpenAI permet de réutiliser les méthodes de connexion et les formats de requête courants. Elle ne rend pas disponibles tous les comptes, modèles, points de terminaison ou paramètres facultatifs."
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "Choisissez un point d'entrée API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Afficher les modèles : appelez `GET /v1/models` avec la même clé.",
              "Envoyer une requête de modèle : choisissez le point de terminaison qui correspond à la capacité actuelle du modèle sur la page API appropriée, puis commencez par les champs obligatoires uniquement.",
              "Utilisez un SDK ou un client compatible : définissez la Base URL sur `https://partokens.com/v1`, puis fournissez la clé Bearer Partokens et l'ID de modèle exact.",
              "Essayez directement une fonctionnalité : connectez-vous à la console et utilisez un espace de travail de discussion ou d'image actuellement disponible."
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "Vérifier les informations en direct",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Vérifier les modèles et les points de terminaison",
                "body": "Utilisez la liste de modèles renvoyée avec la même clé."
              },
              {
                "title": "Vérifiez les prix et les quotas",
                "body": "Utilisez les informations du compte courant, journaux d’utilisation après l'appel et la débit réelle."
              },
              {
                "title": "Vérifier les paramètres",
                "body": "Utilisez la page API appropriée et la réponse réelle du modèle cible. Ne déduisez pas l’assistance d’un nom de modèle ou d’un autre service."
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "verify-compatibility",
        "title": "Vérifier la compatibilité",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Confirmer les paramètres client",
                "body": "Confirmez que le client expose les paramètres Base URL, Bearer et l'ID de modèle exact."
              },
              {
                "title": "Exécuter une requête minimale sur le point de terminaison cible",
                "body": "Utilisez `<YOUR_PARTOKENS_API_KEY>` et `<YOUR_MODEL_ID>` avec uniquement les champs principaux du point de terminaison."
              },
              {
                "title": "Ajoutez des fonctionnalités une par une",
                "body": "Une fois le minimum réussi, ajoutez des paramètres facultatifs individuellement et utilisez chaque réponse réelle pour confirmer la prise en charge."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Utiliser la réponse réelle",
            "body": "Un modèle visible ou un client configurable ne fait que confirmer une condition préalable à l'intégration. La réponse du modèle cible sur le point de terminaison et les paramètres cibles constitue le résultat de compatibilité."
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "Préparez une clé API, une Base URL et un ID de modèle, envoyez une requête de chat minimale, puis vérifiez le texte renvoyé.",
    "prerequisites": [
      "A Partokens API clé",
      "Un identifiant de modèle disponible pour le compte"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "Préparer l'intégration",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Préparez la clé API `<YOUR_PARTOKENS_API_KEY>`.",
              "Utilisez la Base URL `https://partokens.com/v1`.",
              "Copiez l'ID de modèle disponible exact `<YOUR_MODEL_ID>` à partir de la liste des modèles de compte."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Définir les variables d'environnement",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "Envoyer la requête",
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
        "title": "Lire la réponse",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Vérifiez l'état de HTTP avant d'analyser JSON.",
              "Lisez le premier texte de discussion de `choices[0].message.content`.",
              "Traitez un tableau `choices` vide ou un texte vide comme un résultat non utilisable."
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "Gérer les échecs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 : vérifiez que la clé Bearer est complète, valide et issue de l'environnement prévu.",
              "400 : utilisez `error.message` pour corriger les champs modèle, messages ou JSON.",
              "429 : attendez `Retry-After` ; en cas d'absence, utilisez un recul exponentiel instable.",
              "5xx : nouvelle tentative avec interruption, nombre maximal de tentatives et délai total.",
              "Erreur de connexion ou délai d'attente : vérifiez si une réponse HTTP est arrivée ; ne renvoyez pas une requête de chat sans condition."
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "Choisissez Shell, un SDK OpenAI ou un client avec une Base URL personnalisée, puis vérifiez l'appel avec les mêmes paramètres de connexion.",
    "prerequisites": [
      "A Partokens API clé",
      "Un ID de modèle disponible"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "Choisissez un client",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL : contrôles de connectivité, scripts d'automatisation et reproductions.",
              "OpenAI JavaScript SDK : services et scripts Node.js.",
              "OpenAI Python SDK : services et scripts Python.",
              "Codex : tâches de codage avec un modèle prenant en charge le Responses API.",
              "Un client compatible OpenAI avec une Base URL personnalisée : tout client existant qui permet de configurer la Base URL, la clé Bearer et l'ID de modèle."
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configurer la connexion",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Envoyez la clé Bearer `<YOUR_PARTOKENS_API_KEY>` sous le nom `Authorization: Bearer ...`.",
              "Utilisez l’ID de modèle de compte exact `<YOUR_MODEL_ID>`.",
              "Découvrez les modèles avec `GET /v1/models` ; Shell, les SDK et les clients compatibles vérifient le chat avec `POST /v1/chat/completions`, tandis que Codex utilise `POST /v1/responses`."
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "Vérifier l'appel",
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
              "Pour un autre client compatible, exécutez `GET https://partokens.com/v1/models`, puis envoyez la requête de chat avec la même clé et le même ID de modèle.",
              "Pour les clients Shell, JavaScript, Python et compatibles, confirmez une réponse HTTP réussie et un `choices[0].message.content` lisible.",
              "Après avoir configuré son Base URL, sa clé et son modèle, vérifiez Codex avec `codex exec \"Reply only with: connection successful\"`."
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "Dépanner",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Erreur de configuration du client : aucune requête n’est envoyée, ou l’URL, l’en-tête Bearer ou le modèle est incorrect ; corrigez le réglage avant de réessayer.",
              "Erreur réseau : aucun statut HTTP n'est arrivé ; vérifiez DNS, TLS, le proxy et le délai d'expiration de la connexion.",
              "API : un statut HTTP et un statut JSON `error` sont arrivés ; gérez 401, 400, 429 ou 5xx comme un résultat API, et non comme un crash client."
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "Créez une clé API dans la console, configurez-la dans un environnement d'exécution sécurisé et faites pivoter ou révoquez les anciennes clés dans l'ordre.",
    "prerequisites": [
      "Accès à la console Partokens"
    ],
    "sections": [
      {
        "id": "create",
        "title": "Créer une clé",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Gestion des clés ouvertes",
                "body": "Connectez-vous à la console, ouvrez les clés API et choisissez Créer une clé."
              },
              {
                "title": "Définir les options requises",
                "body": "Entrez un nom et sélectionnez un groupe ; définissez une limite de quota et une expiration si nécessaire."
              },
              {
                "title": "Enregistrer les informations d'identification",
                "body": "Après la soumission, utilisez Révéler ou Copier dans la liste des clés et placez immédiatement les informations d'identification dans un environnement d'exécution sécurisé."
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configurer la clé",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Utiliser une variable d'environnement ou un gestionnaire de secrets côté serveur ; ne placez jamais la clé dans un référentiel, URL, un journal ou un code de navigateur.",
              "Envoyez-le sous le nom `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Définir la variable d'environnement",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "Faire pivoter et révoquer",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Créer le remplacement",
                "body": "Créez une clé de remplacement pour la même application et stockez-la en toute sécurité."
              },
              {
                "title": "Vérifiez-le d'abord",
                "body": "Modifiez un environnement contrôlé et appelez `GET /v1/models` pour confirmer les travaux de remplacement."
              },
              {
                "title": "Remplacer chaque utilisation",
                "body": "Mettez à jour les services, les tâches et les valeurs du gestionnaire de secrets, puis confirmez que la nouvelle configuration est active."
              },
              {
                "title": "Désactiver l'ancienne clé",
                "body": "Dans la liste des actions de clés, choisissez Désactiver pour mettre en pause ou Supprimer pour supprimer l'ancienne clé."
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "Gérer les exceptions",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 : vérifiez la variable d'environnement, l'en-tête Bearer et l'état de la clé ; assurez-vous qu'une ancienne valeur n'est pas utilisée.",
              "403 : vérifiez le groupe de clés, la portée d'accès et l'état activé avant de réessayer.",
              "Exposition suspectée : désactivez ou supprimez la clé immédiatement, créez et vérifiez un remplacement, puis mettez à jour chaque utilisation.",
              "Clé expirée, désactivée ou épuisée : ne réessayez pas à plusieurs reprises ; créez un remplacement et vérifiez-le."
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "Vérifiez le solde, les forfaits et l'utilisation dans la console, choisissez une source de facturation et récupérez en cas de quota insuffisant.",
    "prerequisites": [
      "Accès à la console Partokens"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "Afficher le solde et le plan",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Portefeuille ouvert",
                "body": "Connectez-vous à la console et sélectionnez Portefeuille sous Compte dans la barre latérale."
              },
              {
                "title": "Vérifier l'état du compte",
                "body": "En haut de la page, vérifiez le solde du compte, l'utilisation totale et le nombre de forfaits actifs."
              },
              {
                "title": "Réviser le quota du plan",
                "body": "Dans Choisir un plan, sélectionnez Afficher actif et vérifiez le statut de chaque plan, le quota total, le quota restant et le pourcentage utilisé."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Le solde du compte affiche le solde actuellement disponible.",
              "L'utilisation totale indique l'utilisation déjà enregistrée pour le compte.",
              "Les détails du plan actif affichent les plans qui peuvent encore être utilisés et leur quota restant."
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "Choisissez une source de facturation",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Trouver la préférence",
                "body": "Au bas de Choisir un forfait sur Wallet, recherchez les préférences de facturation d'utilisation. Vous pouvez le modifier tant qu’un forfait actif est disponible."
              },
              {
                "title": "Choisissez la préférence actuelle",
                "body": "Sélectionnez d'abord Abonnement, Solde d'abord, Abonnement uniquement ou Solde uniquement, puis attendez la confirmation de la mise à jour avant d'appeler l'API."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Abonnement en premier et Balance en premier sélectionnent la source à essayer en premier.",
              "uniquement et le solde limitent uniquement l'utilisation à cette source.",
              "Confirmez que la source sélectionnée est actuellement disponible avant de modifier la préférence."
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "Examiner l'utilisation de",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ouvrir les journaux d’utilisation",
                "body": "Dans la barre latérale de la console, sélectionnez journaux d’utilisation sous Général."
              },
              {
                "title": "Affinez l'heure et le modèle",
                "body": "Sélectionnez une plage qui couvre l'appel, puis sélectionnez le modèle. Pour une recherche exacte, remplacez le champ de recherche par ID de requête et saisissez l'ID de requête complet."
              },
              {
                "title": "Comparez l'appel et la débit",
                "body": "Ouvrez l'enregistrement correspondant et examinez son heure, son type, son modèle, son erreur, son utilisation, son coût et son ID de requête, puis comparez-le avec le solde ou le quota restant du plan dans Wallet."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "Résoudre le quota insuffisant",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Solde insuffisant : vérifiez Wallet et utilisez l'option de recharge actuellement disponible, ou passez à un forfait avec quota disponible.",
              "Plan insuffisant ou indisponible : ouvrez les détails du plan actif et vérifiez son statut et son quota restant ; choisissez un forfait actuellement disponible ou modifiez les préférences de facturation en une source disponible.",
              "Requête rejetée : conservez le statut, l'erreur et l'ID de la requête HTTP, puis recherchez un enregistrement dans journaux d’utilisation. Pour 401 ou 403, vérifiez également l'état et l'accès de la clé API.",
              "Après avoir corrigé le solde, le forfait, la préférence de facturation ou la clé, envoyez d'abord une requête minimale. Ne soumettez pas à nouveau les requêtes inchangées."
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "Recherchez les modèles actuellement disponibles, examinez leurs capacités et leurs tarifs, choisissez l'API correspondante et résolvez les erreurs de modèle.",
    "prerequisites": [
      "Accès à un compte Partokens",
      "La clé API `<YOUR_PARTOKENS_API_KEY>` lors d'une requête via API"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "Trouver des modèles",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Interroger les modèles du compte",
                "body": "Appelez le point de terminaison des modèles avec la clé API actuelle pour voir les modèles renvoyés pour ce compte."
              },
              {
                "title": "Modèles de requête pour une clé",
                "body": "Vous pouvez également appeler le point de terminaison des modèles avec `<YOUR_PARTOKENS_API_KEY>` pour voir les modèles actuellement renvoyés pour cette clé."
              },
              {
                "title": "Copiez l'ID du modèle",
                "body": "Copiez l'ID de modèle exact de la réponse de la liste des modèles ou `data[].id` et utilisez-le tel quel comme `<YOUR_MODEL_ID>` dans les requêtes ultérieures."
              }
            ]
          },
          {
            "type": "endpoint",
            "method": "GET",
            "label": "",
            "path": "https://partokens.com/v1/models"
          }
        ]
      },
      {
        "id": "check-capability-price",
        "title": "Vérifier les capacités et le prix",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Utilisez la réponse de la liste des modèles pour confirmer `<YOUR_MODEL_ID>` et consultez la documentation de l’API concernée avant l’appel. La facturation et les tarifs sont ceux renvoyés actuellement par le service.",
              "Lorsque les informations sur la capacité ou le prix sont absentes, ne les déduisez pas du nom du modèle ou d'un nom similaire.",
              "Avant l'appel, vérifiez que l'API cible apparaît dans les capacités actuelles du modèle. Utilisez les données de compte affichées à ce moment-là pour choisir le tarif.",
              "Après l'appel, vérifiez l'utilisation réelle et les prélèvements dans les journaux d’utilisation."
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "Choisissez un API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions : lorsque le modèle prend explicitement en charge Chat Completions, envoyez une liste de messages à `POST /v1/chat/completions`.",
              "Responses : lorsque le modèle prend explicitement en charge Responses, utilisez `POST /v1/responses` ; les connexions Codex natives utilisent cette API.",
              "Image API : lorsque le modèle prend explicitement en charge les images, utilisez `POST /v1/images/generations` pour générer une image. Studio d’images utilise l'édition d'image API lorsqu'une image de référence est fournie.",
              "Un modèle peut ne pas prendre en charge toutes les API ni tous les paramètres facultatifs. Commencez par une requête minimale vers l'API cible."
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "Résoudre les problèmes de modèle",
        "blocks": [
          {
            "type": "list",
            "items": [
              "non visible : actualiser les modèles. Lorsque vous utilisez API, confirmez que `GET /v1/models` a réussi et vérifiez si `data` est vide.",
              "non appelable : utilisez l'ID exact renvoyé et interrogez à nouveau la liste de modèles avec la même clé API. Ne devinez pas un identifiant lorsque cette clé reçoit une liste vide.",
              "Paramètre incompatible ou 400 : lisez `error.message`, supprimez les paramètres facultatifs et réessayez avec les champs minimaux pour l'API cible.",
              "403 : lisez l'erreur, puis vérifiez l'état de la clé API, l'accès au modèle et le solde ou le plan avant de réessayer.",
              "visible mais toujours en échec : conservez l'heure de la requête, l'ID du modèle, le statut HTTP et l'ID de la requête, puis recherchez l'enregistrement dans journaux d’utilisation."
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "Connectez Codex natif à Partokens avec une configuration de fournisseur de modèle et vérifiez l'appel Responses avec une commande minimale.",
    "prerequisites": [
      "La clé API `<YOUR_PARTOKENS_API_KEY>`",
      "A ID de modèle compatible Responses `<YOUR_MODEL_ID>`",
      "Codex installé et exécutable"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "Préparer Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Exécutez `codex --version` et confirmez que Codex démarre dans le terminal actuel.",
              "Copiez le `<YOUR_MODEL_ID>` exact depuis `GET https://partokens.com/v1/models` et confirmez qu'il prend en charge Responses.",
              "Préparez la clé Partokens API `<YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Définir la variable d'environnement",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "Configurer la connexion",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ouvrir la configuration utilisateur",
                "body": "Modifiez `~/.codex/config.toml` et conservez tous les autres paramètres dont vous avez encore besoin."
              },
              {
                "title": "Ajouter le fournisseur Partokens",
                "body": "Ajoutez le modèle et la configuration du fournisseur ci-dessous. `env_key` lit la variable d'environnement définie ci-dessus."
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
        "title": "Vérifier l'appel",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Vérification minimale",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Un résultat `connection successful` normal confirme que Codex a envoyé et terminé la requête via cette configuration.",
              "Vous pouvez ensuite rechercher l'appel dans journaux d’utilisation par son heure, son modèle et son ID de requête."
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Gérer les échecs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Erreur de configuration : si Codex ne peut pas lire le fichier ou utilise un modèle inattendu, vérifiez la syntaxe TOML, `model_provider` et `<YOUR_MODEL_ID>` et confirmez que la variable d'environnement est définie dans le même terminal.",
              "Erreur de connexion : si aucun statut HTTP n’est reçu, vérifiez le réseau, le proxy, DNS, TLS et que `base_url` vaut `https://partokens.com/v1`.",
              "HTTP/API : pour 400, 401, 403, 429 ou 5xx, conservez l'état, l'erreur et l'ID de requête. Corrigez les paramètres, la clé, l'accès ou le quota avant de décider de réessayer.",
              "ne prend pas en charge Responses : sélectionnez un modèle actuellement répertorié qui prend explicitement en charge Responses. Ne remplacez pas `wire_api` par une autre valeur."
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "Installez le SDK OpenAI pour JavaScript ou Python, configurez la Base URL Partokens et la clé, puis lisez le texte d'une requête de chat minimale.",
    "prerequisites": [
      "Un environnement d'exécution Node.js ou Python",
      "A Partokens API clé",
      "A ID de modèle"
    ],
    "sections": [
      {
        "id": "install",
        "title": "Installer le SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Installez le SDK OpenAI pris en charge dans un projet côté serveur."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Installer et définir les variables",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Configurer le client",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript utilise `apiKey` et `baseURL`.",
              "Python utilise `api_key` et `base_url`.",
              "Définissez les deux SDK sur `https://partokens.com/v1` ; fournissez `<YOUR_MODEL_ID>` via la variable d'environnement du modèle."
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
        "title": "Envoyer et lire une requête",
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
        "title": "Gérer les erreurs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Erreur de connexion : vérifiez DNS, TLS, le proxy et le réseau avant de réessayer.",
              "HTTP : lire l'état, `error.message` et `X-Oneapi-Request-Id` ; corrigez d'abord 400, 401 ou 403.",
              "429 : suivez `Retry-After` ou utilisez un recul exponentiel instable.",
              "5xx : réessayez avec un nombre maximum de tentatives et un délai total.",
              "Timeout : définissez un délai d'expiration SDK ; une requête de chat a peut-être déjà été exécutée, alors vérifiez les enregistrements d'utilisation avant de réessayer."
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "Ouvrez Studio d’images depuis la console, sélectionnez un modèle et une clé actuels, générez ou modifiez des images et enregistrez les résultats dont vous avez besoin.",
    "prerequisites": [
      "Accès à la console Partokens",
      "Un modèle d'image disponible et une clé API"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "Ouvrir l'espace de travail",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ouvrir la console",
                "body": "Connectez-vous à Partokens et ouvrez la console."
              },
              {
                "title": "Ouvrir le Studio d’images",
                "body": "Dans la barre latérale, sélectionnez Studio d’images sous Workspace."
              },
              {
                "title": "Vérifier l'espace de travail",
                "body": "se trouvent à gauche et le jeu de résultats actuel est à droite."
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "Sélectionnez un modèle et une clé",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Sélectionnez un modèle",
                "body": "Dans Modèle, choisissez un modèle d'image dans la liste actuelle et utilisez cette valeur exacte comme `<YOUR_MODEL_ID>`. Ne devinez pas le nom d'un modèle."
              },
              {
                "title": "Sélectionnez une clé API",
                "body": "Sur la première génération, choisissez une clé active compatible avec le modèle dans la boîte de dialogue Clé API requise, puis continuez la génération."
              },
              {
                "title": "Lorsqu'aucune clé n'est disponible",
                "body": "Utilisez Créer une clé dans la boîte de dialogue ou ouvrez les clés API et créez une clé pour le modèle sélectionné avant de revenir à Studio d’images."
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "Générer ou modifier des images",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Entrez une invite",
                "body": "Décrivez l'image à générer ou à modifier dans l'invite."
              },
              {
                "title": "Définir la sortie",
                "body": "Choisissez la qualité, la taille de l'image et le nombre d'images parmi les options affichées."
              },
              {
                "title": "Ajouter une référence si nécessaire",
                "body": "Téléchargez une image PNG, JPG ou WebP pour la modifier, ou choisissez Utiliser comme référence sur un résultat généré."
              },
              {
                "title": "Démarrer la tâche",
                "body": "Sélectionnez Générer et attendez les images dans Résultats. Si le modèle rejette un paramètre, choisissez l'une des options actuellement proposées pour ce modèle."
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "Enregistrer et gérer les échecs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Enregistrer un résultat : choisissez Télécharger l'image sur chaque image que vous devez conserver. La génération suivante remplace l'ensemble de résultats affiché.",
              "Échec de génération ou paramètre non pris en charge : lisez l'erreur de page, choisissez une qualité, une taille ou un nombre proposé pour le modèle actuel et supprimez les paramètres incompatibles.",
              "401 : vérifier que la clé API sélectionnée est toujours valide. 403 : vérifiez la clé d'accès au modèle et au solde ou au plan du compte. Ne pas régénérer jusqu'à ce que cela soit corrigé.",
              "429 : attendez comme indiqué avant de réessayer. Pour 5xx, conservez les détails de la requête et utilisez un délai d'attente limité avec une date limite totale."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Vérifier les journaux après annulation ou expiration du délai",
            "body": "Après avoir quitté une génération active et confirmé l'arrêt, ou après un délai d'attente, vérifiez d'abord journaux d’utilisation par heure, modèle et ID de requête pour un enregistrement et une débit, puis décidez si vous souhaitez réessayer."
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "Envoyez des requêtes HTTPS avec la Base URL Partokens et une clé API Bearer, puis traitez le résultat selon le statut HTTP et le corps de la réponse.",
    "prerequisites": [
      "A Partokens API clé",
      "Un ID de modèle copié à partir de la liste de modèles"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Envoyer une requête",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Envoyer `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Les requêtes avec une carrosserie JSON nécessitent également `Content-Type: application/json`.",
              "Ne placez jamais la clé API dans un URL, un code côté client ou des journaux."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Exécuter une requête minimale",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model` : un identifiant de modèle exact renvoyé par la liste de modèles.",
              "`messages` : les messages ordonnés envoyés au modèle.",
              "`messages[].role` : utilisez `user` pour une requête de texte minimale.",
              "`messages[].content` : texte non vide."
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
        "title": "Lire la réponse",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Vérifiez d'abord l'état du HTTP ; un statut 2xx indique une réponse HTTP réussie.",
              "Analysez le corps JSON et lisez le résultat du point de terminaison, tel que `choices` pour le chat, `data` pour les images ou `data` pour les modèles.",
              "Pour une réponse non-2xx, lisez `error.message` et enregistrez `error.code` lorsqu'il est présent."
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Gérer les erreurs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400 : corrigez les champs JSON ou requête avant de le renvoyer.",
              "401 / 403 : vérifiez la clé et l'accès API ; ne réessayez pas les informations d’identification inchangées.",
              "429 : attendez `Retry-After` lorsqu'il est présent, sinon utilisez un intervalle exponentiel avec gigue.",
              "5xx : nouvelle tentative avec un délai exponentiel, un nombre maximum de tentatives et un délai total.",
              "Erreur réseau ou délai d'attente : déterminez si une réponse HTTP est arrivée avant de décider de réessayer."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Réessayez en toute sécurité",
            "body": "GET peuvent être réessayées dans un délai total ; réessayez automatiquement le chat et les requêtes d'image POST uniquement lorsque l'application accepte des résultats et une utilisation en double."
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "Envoyez un tableau de messages pour générer une réponse de chat, puis lisez le texte de `choices[0].message.content`.",
    "prerequisites": [
      "A Partokens API clé",
      "Un ID de modèle compatible chat copié à partir de la liste de modèles",
      "Le OpenAI SDK pour les exemples JavaScript et Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Envoyer une requête",
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
              "Envoyer `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Envoyer `Content-Type: application/json`.",
              "Pour un SDK, définissez la base URL sur `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Remplissez la requête",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model` : un identifiant de modèle exact renvoyé par la liste de modèles.",
              "`messages` : les messages ordonnés envoyés au modèle.",
              "`messages[].role` : utilisez `user` pour une requête de texte minimale.",
              "`messages[].content` : texte non vide du message."
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
        "title": "Lire la réponse",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content` : texte du premier candidat.",
              "`choices[0].finish_reason` : pourquoi ce candidat s'est arrêté.",
              "`usage` : nombre total de jetons d’entrée, de sortie et lors du retour."
            ]
          },
          {
            "type": "paragraph",
            "text": "Traitez un tableau `choices` vide ou un premier candidat sans texte comme une réponse sans résultat de discussion utilisable."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Gérer les erreurs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400 : utilisez `error.message` pour corriger `model`, `messages` ou un champ de message.",
              "401 / 403 : vérifiez la clé et l'accès API ; ne réessayez pas les informations d’identification inchangées.",
              "429 : attendez `Retry-After` lorsqu'il est présent, sinon utilisez un intervalle exponentiel avec gigue.",
              "5xx : nouvelle tentative avec un délai exponentiel, un nombre maximum de tentatives et un délai total.",
              "Erreur réseau ou timeout : la requête a peut-être été exécutée ; ne le renvoyez pas immédiatement."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Éviter les générations en double",
            "body": "Réessayez automatiquement les requêtes de discussion uniquement lorsque l'application accepte les réponses et les utilisations en double et que le client définit un délai d'attente et un nombre maximum de tentatives."
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "Envoyez une invite pour générer une image, puis enregistrez le résultat à partir de `data[0].url` ou `data[0].b64_json`.",
    "prerequisites": [
      "A Partokens API clé",
      "Un ID de modèle compatible avec l'image copié à partir de la liste de modèles",
      "cURL, jq et OpenSSL pour Shell ; le OpenAI SDK pour JavaScript et Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Envoyer une requête",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "Envoyer `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Envoyer `Content-Type: application/json`.",
              "Pour un SDK, définissez la base URL sur `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Remplissez la requête",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model` : un identifiant de modèle d'image exact renvoyé par la liste de modèles.",
              "`prompt` : une description textuelle non vide de l'image."
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
        "title": "Lire la réponse",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Confirmez que le tableau `data` n'est pas vide.",
              "Lorsque `data[0].url` est présent, téléchargez la ressource et vérifiez le statut HTTP du téléchargement.",
              "Lorsqu'aucun URL n'est présent mais que `data[0].b64_json` existe, décodez la valeur Base64 dans un fichier binaire.",
              "Traitez un résultat sans aucun champ comme une réponse sans image utilisable."
            ]
          },
          {
            "type": "paragraph",
            "text": "N'écrivez pas les données d'image Base64 complètes dans les journaux d'application."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Gérer les erreurs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400 : utilisez `error.message` pour corriger `model` ou `prompt`.",
              "401 / 403 : vérifiez la clé et l'accès API ; ne réessayez pas les informations d’identification inchangées.",
              "429 : attendez `Retry-After` lorsqu'il est présent, sinon utilisez un intervalle exponentiel avec gigue.",
              "5xx : nouvelle tentative avec un délai d'attente exponentiel, un nombre maximum de tentatives et un délai total.",
              "Erreur réseau ou timeout : la requête a peut-être été exécutée ; ne pas générer à nouveau immédiatement.",
              "Échec du téléchargement de l'image : réessayez le téléchargement sans renvoyer la requête de génération."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Éviter les générations en double",
            "body": "Réessayez automatiquement la génération d'images uniquement lorsque l'application accepte les images et l'utilisation en double et que le client définit un délai d'attente et un nombre maximum de tentatives."
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "Lisez les modèles disponibles pour la clé API actuelle et réutilisez un ID de modèle exact renvoyé dans d'autres requêtes.",
    "prerequisites": [
      "A Partokens API clé",
      "cURL et jq pour Shell ; le OpenAI SDK pour JavaScript et Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Envoyer une requête",
        "blocks": [
          {
            "type": "endpoint",
            "method": "GET",
            "label": "",
            "path": "https://partokens.com/v1/models"
          },
          {
            "type": "list",
            "items": [
              "Envoyer `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Cette requête GET n'a pas de corps de requête."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Exécuter une requête minimale",
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
        "title": "Lire la réponse",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "",
              "Signification"
            ],
            "rows": [
              [
                "`object`",
                "La valeur `list` identifie une liste de modèles."
              ],
              [
                "`data`",
                "Le tableau de modèles ; un tableau vide signifie que la clé n'a actuellement aucun modèle disponible."
              ],
              [
                "`data[].id`",
                "Copiez la valeur exacte dans le champ `model` d'une autre requête."
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Ne modifiez pas la casse des lettres d'un ID de modèle et n'ajoutez ou ne supprimez pas de préfixe."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Gérer les erreurs",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403 : vérifiez la clé et l'accès API ; ne réessayez pas les informations d’identification inchangées.",
              "429 : attendez `Retry-After` ou utilisez un intervalle exponentiel avec instabilité.",
              "5xx, erreur réseau ou délai d'attente : réessayez avec un nombre maximum de tentatives et un délai total.",
              "2xx avec `data` vide : vérifiez les modèles disponibles pour la clé ; ne devinez pas l'identifiant du modèle."
            ]
          },
          {
            "type": "paragraph",
            "text": "La liste de modèles est une requête GET et peut être réessayée en toute sécurité dans un délai total ; définir un délai d'attente et limiter le nombre de tentatives."
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "Réponses aux questions d'intégration, de compte, de modèle, d'utilisation et d'échec courant, avec les sources en direct à vérifier.",
    "sections": [
      {
        "id": "choose-integration",
        "title": "Choisissez une méthode d'intégration",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Puis-je continuer à utiliser un OpenAI SDK ?",
                "answer": "Oui. Définissez Base URL sur `https://partokens.com/v1`, utilisez une clé Partokens API et fournissez l'ID de modèle exact actuellement renvoyé pour le compte."
              },
              {
                "question": "Dois-je utiliser Shell, un SDK ou un client compatible ?",
                "answer": "Utilisez Shell pour des vérifications et des reproductions minimales, un SDK pour les services et les scripts et un client existant uniquement lorsqu'il expose les paramètres Base URL, Bearer et l'ID de modèle."
              },
              {
                "question": "Où se trouvent les exemples complets de requêtes ?",
                "answer": "Utilisez Démarrage rapide : première intégration pour un premier appel, et la page API correspondante pour les champs et les formes de réponse."
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "Gérer les clés et le compte",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Où dois-je stocker la clé API ?",
                "answer": "Stockez `<YOUR_PARTOKENS_API_KEY>` dans une variable d'environnement ou un gestionnaire de secrets. Ne le placez pas dans un référentiel, URL, un journal ou un code de navigateur."
              },
              {
                "question": "Comment faire pivoter une clé ?",
                "answer": "Créez et vérifiez d'abord un remplacement, mettez à jour chaque consommateur, puis désactivez ou supprimez l'ancienne clé dans la console. Agissez immédiatement sur l’ancienne clé si une exposition est suspectée."
              },
              {
                "question": "Où puis-je vérifier le solde, les forfaits et le quota disponible ?",
                "answer": "Utilisez les pages du compte courant, la réponse réelle de la requête, journaux d’utilisation et la débit réelle."
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "Vérifier les modèles et l'utilisation",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Quel ID de modèle dois-je utiliser ?",
                "answer": "Copiez l'ID actuel exact dans la réponse de `GET /v1/models` et utilisez-le tel quel comme `<YOUR_MODEL_ID>`. Ne devinez pas le nom d'un modèle."
              },
              {
                "question": "Un modèle répertorié prend-il en charge chaque point de terminaison et paramètre ?",
                "answer": "Ne faites pas cette hypothèse. Vérifiez la capacité actuelle du modèle et vérifiez chaque point de terminaison et paramètre cible avec une requête minimale et sa réponse réelle."
              },
              {
                "question": "Un enregistrement du journal d'utilisation signifie-t-il que l'appel a réussi ?",
                "answer": "Pas nécessairement. Examinez également le type d'enregistrement, le statut HTTP et l'erreur conservés par le client, les jetons, le coût et la durée."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "Résoudre les pannes courantes",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Que dois-je vérifier en premier lorsqu’une requête échoue ?",
                "answer": "Utilisez `GET https://partokens.com/v1/models` pour vérifier la connexion et l'authentification, puis corrigez la requête en fonction de 400, 401, 403, 429 ou 5xx. Conservez l’heure, le fuseau horaire, le point de terminaison, le modèle et l’ID de requête."
              },
              {
                "question": "Chaque échec peut-il être réessayé immédiatement ?",
                "answer": "Non. Corrigez d'abord 400, 401 et 403. Suivez `Retry-After` ou reculez pour 429. Réessayez 5xx seulement un nombre limité de fois et uniquement lorsque la relecture est sûre."
              },
              {
                "question": "Que dois-je faire après une annulation ou un délai d'attente ?",
                "answer": "Recherchez d'abord journaux d’utilisation par heure, modèle, nom de clé et ID de requête et examinez toute débit, puis décidez de réessayer."
              },
              {
                "question": "Quand dois-je contacter l’assistance ?",
                "answer": "Après avoir effectué les vérifications dans Connexion, limites et tentatives et journaux d’utilisation, utilisez Contacter le support pour préparer les informations de diagnostic expurgées."
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "Exécutez d'abord une requête de modèles minimaux, puis utilisez le statut HTTP pour choisir une stratégie de correction et réessayer.",
    "prerequisites": [
      "A Partokens API clé",
      "Accès à l'statut HTTP de la commande, aux en-têtes de réponse et au corps de la réponse"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "Exécuter une vérification minimale",
        "blocks": [
          {
            "type": "paragraph",
            "text": "La requête `GET /v1/models` ci-dessous ne démarre pas de tâche de génération. Utilisez-le pour vérifier DNS, TLS, les paramètres de proxy, le Base URL et l'authentification. La commande affiche également les en-têtes de réponse afin que vous puissiez conserver l'ID de la requête."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Contrôle de connexion et d'authentification",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "Résoudre les problèmes par statut",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Erreur de connexion : lorsqu'aucun statut HTTP n'arrive, vérifiez le réseau, DNS, TLS, le proxy, le délai de connexion et que le URL est exactement `https://partokens.com/v1/models`.",
              "400 : utilisez l'erreur renvoyée pour corriger JSON, les champs obligatoires, l'ID de modèle ou le point de terminaison cible. Ne répétez pas la requête inchangée.",
              "401 : confirmez que la variable d'environnement est définie, que l'en-tête Bearer est complet, que la clé n'est pas tronquée et que la clé reste activée dans la console.",
              "403 : utilisez l'erreur renvoyée pour vérifier l'accès à la clé, la disponibilité du modèle et le solde ou le forfait actuel du compte, puis corrigez le problème avant de réessayer.",
              "429 : suit `Retry-After` lorsqu'il est présent. Sinon, réduisez la concurrence et utilisez un recul exponentiel instable.",
              "5xx : conservez l'ID de la requête et utilisez l'intervalle d'attente limité uniquement lorsque la requête peut être rejouée en toute sécurité."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "est le point de départ",
            "body": "Le même état peut avoir des causes différentes. Utilisez le corps de la réponse, l'ID de la requête, les informations du compte courant et journaux d’utilisation pour le diagnostic final."
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "Décidez si vous souhaitez réessayer",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Réessayer : échec de connexion temporaire pour `GET /v1/models`, 429 après l’attente requise ou erreur 5xx temporaire. Définissez un délai total et un nombre maximal de tentatives.",
              "Corrigez en premier : 400, 401, 403 et les échecs clairement causés par un modèle, un point de terminaison, un paramètre, une clé ou un état de compte.",
              "Vérifiez d'abord les journaux : l'annulation ou l'expiration du client ne prouve pas qu'une requête n'a pas été exécutée. Recherchez journaux d’utilisation par heure, modèle, nom de clé et ID de requête, puis examinez toute débit.",
              "Évitez les travaux en double : réessayez automatiquement le chat, la génération d'images ou les modifications d'images uniquement lorsque les résultats et l'utilisation en double sont acceptables."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Ne pas relire immédiatement après une annulation ou une expiration du délai",
            "body": "Si journaux d’utilisation affiche une exécution ou une débit, examinez d'abord le résultat et l'ID de la requête. Lorsque le résultat reste incertain, préparez les informations de diagnostic et contactez l’assistance."
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Préparer les diagnostics",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Enregistrer la requête",
                "body": "Conservez l'heure et le fuseau horaire exacts, le modèle, le point de terminaison, le statut HTTP et l'ID de requête."
              },
              {
                "title": "Conserver une erreur expurgée",
                "body": "Conservez suffisamment de texte d'erreur pour expliquer le problème et supprimer les informations d'identification, les informations personnelles, les invites complètes et les fichiers privés."
              },
              {
                "title": "Examen journaux d’utilisation",
                "body": "Indiquez si un enregistrement correspondant a été trouvé et conservez la plage horaire, le modèle, le nom de clé et l'ID de requête utilisés pour la recherche."
              },
              {
                "title": "Écrire une reproduction minimale",
                "body": "Répertoriez le nombre minimum d'étapes, le résultat attendu et le résultat réel, puis utilisez Contacter l'assistance pour sélectionner un canal officiel."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Ne pas soumettre les informations d'identification",
            "body": "ne doivent pas contenir de clé API complète, de mot de passe, de code de vérification ou de jeton de session."
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "Recherchez les appels dans la console et examinez le type, les erreurs, les tokens, le coût, la durée et les prélèvements.",
    "sections": [
      {
        "id": "open-logs",
        "title": "Ouvrir les journaux d’utilisation",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ouvrir la console",
                "body": "Connectez-vous à Partokens et ouvrez la console."
              },
              {
                "title": "Ouvrir les journaux d’utilisation",
                "body": "Dans la section Général de la barre latérale, sélectionnez journaux d’utilisation."
              },
              {
                "title": "Actualiser les données actuelles",
                "body": "Sélectionnez Actualiser lorsque vous devez récupérer les enregistrements actuels, puis démarrez à partir de l'heure de la requête."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "journaux d’utilisation aide à corréler les appels et les événements du compte. Conservez également le statut HTTP, les en-têtes de réponse et l'erreur expurgée reçue par le client."
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "Filtrer les requêtes",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Choisissez une plage horaire",
                "body": "Choisissez une plage qui inclut l'heure de la requête et confirmez le fuseau horaire utilisé par le journal et les horodatages du client."
              },
              {
                "title": "Choisissez un modèle",
                "body": "Utilisez le filtre de modèle pour affiner les résultats. L'ID du modèle doit correspondre exactement à la valeur de la requête."
              },
              {
                "title": "Recherche par nom de clé",
                "body": "Ouvrez le menu du champ de recherche exact, choisissez le nom de clé API et entrez le nom affiché dans le journal. N'entrez pas la valeur clé."
              },
              {
                "title": "Recherche par ID de requête",
                "body": "Ouvrez le menu du champ de recherche exact, choisissez ID de requête et saisissez l'ID de requête complet."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Utilisez uniquement les conditions nécessaires pour localiser l'enregistrement. S'il n'y a aucun résultat, vérifiez d'abord la plage horaire, le fuseau horaire et les valeurs exactes.",
              "Effacez les filtres qui ne s'appliquent pas avant de lancer une nouvelle recherche afin qu'une ancienne condition n'exclue pas l'enregistrement."
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "Examiner les résultats et les prélèvements",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Type et erreur : utilisez Type pour distinguer les événements d'utilisation et d'erreur. Pour un événement d'erreur, corrélez son heure et son ID de requête avec le statut HTTP et l'erreur rédigée conservée par le client.",
              "Tokens : examinez les tokens d’entrée, de sortie et mis en cache. Ne calculez pas les champs absents ou non applicables.",
              "Coût : examinez le coût enregistré et le coût total filtré, puis comparez-les avec la débit du compte.",
              "Durée : révision de la durée totale. Les appels en streaming peuvent également afficher l’heure jusqu’au premier jeton.",
              "Détails : ouvrez l’enregistrement correspondant et confirmez que l’ID de requête, l’heure, le modèle, le nom de la clé, les tokens, le coût et la durée appartiennent au même appel."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Un record n'est pas une preuve de succès",
            "body": "peuvent contenir des événements d'utilisation, d'erreur ou d'autres événements de compte. Utilisez ensemble le type, le résultat du client et la débit réelle pour déterminer le résultat."
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Gérer les échecs et les délais d'attente",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Corréler l'enregistrement ayant échoué",
                "body": "Utilisez l'heure exacte, le modèle, le nom de clé et l'ID de requête, puis comparez l'enregistrement avec le statut HTTP du client et l'erreur expurgée."
              },
              {
                "title": "Vérifier si l'utilisation a été enregistrée",
                "body": "Examinez les tokens, le coût et la durée pour déterminer si la requête a laissé des enregistrements d'exécution et de prélèvement."
              },
              {
                "title": "Traitez soigneusement l'annulation ou le délai d'attente",
                "body": "L'annulation ou l'expiration du délai ne prouve pas que le traitement s'est arrêté. Examinez les journaux et les prélèvements avant de réessayer."
              },
              {
                "title": "Préparer les informations d'assistance",
                "body": "Si le résultat reste incertain, conservez la plage horaire, le fuseau horaire et les filtres de recherche, puis ouvrez Contacter l'assistance."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Ne pas rechercher avec un secret",
            "body": "Filtrer par nom de clé, et non par clé API complète. Avant de signaler un problème, supprimez les informations d'identification, les informations personnelles, les invites complètes et les fichiers privés."
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "Après les vérifications en libre-service, envoyez un rapport corrélable et rédigé via l'assistance Partokens par e-mail ou Telegram.",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "Vérifications complètes avant contact",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Reproduire le minimum",
                "body": "Pour un problème API, exécutez la vérification minimale dans Connexion, limites et tentatives et enregistrez l'état réel de HTTP."
              },
              {
                "title": "Vérifiez le modèle et le compte",
                "body": "Confirmez que le modèle provient de la liste actuelle, puis vérifiez l'état de la clé, l'accès et les informations du compte actuel."
              },
              {
                "title": "Recherche journaux d’utilisation",
                "body": "Recherchez par heure, modèle, nom de clé et ID de requête, puis examinez les jetons, le coût et la durée."
              },
              {
                "title": "Confirmez que de l'aide est toujours nécessaire",
                "body": "Indiquez les contrôles déjà effectués, le résultat attendu et le résultat réel au lieu de signaler uniquement que quelque chose n'est pas disponible."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Problème de connexion ou de compte : conservez la page, l'heure et le fuseau horaire exacts, ainsi que l'erreur expurgée.",
              "API : conserver le point de terminaison, le modèle, le statut HTTP et l’ID de requête.",
              "Annulation ou timeout : indiquez d'abord si journaux d’utilisation contient un enregistrement et une débit."
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Préparer les informations de diagnostic",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Heure exacte et fuseau horaire de la requête ou du problème.",
              "ID de modèle exact utilisé par la requête.",
              "API ou page de console où le problème s'est produit.",
              "Statut HTTP réel ou déclaration claire indiquant qu'aucune réponse n'est arrivée.",
              "ID de requête complet ou une déclaration claire indiquant qu'aucun n'a été renvoyé.",
              "Une erreur rédigée qui préserve la signification de l'échec.",
              "Étapes de reproduction minimales, résultat attendu et résultat réel.",
              "Si un enregistrement de journal d'utilisation correspondant a été trouvé, y compris les jetons, le coût et la durée examinés."
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "Supprimer les données sensibles",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Ne soumettez pas de clé API ou tout autre identifiant d'accès.",
              "Ne soumettez pas de mots de passe, de codes de vérification, de codes de récupération, de cookies ou de jetons de session.",
              "Ne soumettez pas de noms, d'adresses e-mail, de numéros de téléphone, d'adresses, de détails d'identité ou d'autres informations personnelles.",
              "Ne soumettez pas d'invites complètes, de corps de requête complets ou de contenu brut sans rapport avec la reproduction.",
              "Ne soumettez pas de fichiers privés, d'URL de téléchargement privées, de valeurs Base64 volumineuses ou d'exportations de journaux non vérifiées."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Tournez une touche avant de signaler une exposition suspectée",
            "body": "Désactivez ou supprimez immédiatement la clé concernée, créez et vérifiez un remplacement, puis mettez à jour chaque consommateur. N'envoyez pas l'ancienne clé à un canal d'assistance."
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "Utiliser les canaux d'assistance officiels",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Choisissez l’un des canaux d’assistance publique ci-dessous et incluez les informations de diagnostic minimales expurgées dans le premier message. La documentation ne promet pas de temps de réponse ou de résolution."
          },
          {
            "type": "links",
            "items": [
              {
                "label": "Assistance par e-mail",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
