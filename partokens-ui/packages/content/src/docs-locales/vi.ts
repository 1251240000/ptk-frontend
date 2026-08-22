import type { DocsDocument, DocsItemId } from '../public-docs-content'

export const viDocsDocuments: Partial<Record<DocsItemId, DocsDocument>> = {
  "welcome": {
    "id": "welcome",
    "summary": "Chọn phương thức tích hợp, chuẩn bị tài khoản, khóa API và ID mô hình đang khả dụng, sau đó hoàn thành một lệnh gọi tối thiểu.",
    "sections": [
      {
        "id": "choose-path",
        "title": "Chọn đường dẫn tích hợp",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Mọi phương thức tích hợp đều sử dụng cùng một quyền truy cập tài khoản, khóa API, ID mô hình và Base URL tương thích với OpenAI. Chọn đường đi ngắn nhất cho nhiệm vụ hiện tại."
          },
          {
            "type": "list",
            "items": [
              "Shell / cURL: kiểm tra và tái tạo kết nối đầu tiên.",
              "OpenAI JavaScript hoặc Python SDK: dịch vụ, tập lệnh và các dự án SDK hiện có.",
              "Một ứng dụng khách có OpenAI Base URL tùy chỉnh: các công cụ hiện có hiển thị khóa Base URL, Bearer và cài đặt ID mô hình.",
              "Không gian làm việc trên bảng điều khiển: truy cập trực tiếp các tính năng trò chuyện hoặc hình ảnh hiện có của tài khoản."
            ]
          }
        ]
      },
      {
        "id": "prepare-access",
        "title": "Chuẩn bị tài khoản và khóa",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Tạo khóa API",
                "body": "Đăng nhập vào bảng điều khiển, mở các khóa API, tạo khóa và lưu trữ an toàn dưới dạng `<YOUR_PARTOKENS_API_KEY>`."
              },
              {
                "title": "Sao chép ID mô hình đang khả dụng",
                "body": "Gọi điểm cuối của mô hình bằng khóa đó, sau đó sao chép ID hiện tại chính xác là `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Lưu trữ chi tiết kết nối",
                "body": "Giữ khóa trong biến môi trường hoặc trình quản lý bí mật; không đặt nó vào kho lưu trữ, URL, nhật ký hoặc mã trình duyệt."
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
        "title": "Hoàn thành lệnh gọi đầu tiên",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Mở hướng dẫn tích hợp đầu tiên",
                "body": "Chuyển đến Bắt đầu nhanh: tích hợp đầu tiên và chọn ví dụ Shell, JavaScript hoặc Python."
              },
              {
                "title": "Thay thế các giá trị kết nối",
                "body": "Giữ Base URL chung và cung cấp `<YOUR_PARTOKENS_API_KEY>` và `<YOUR_MODEL_ID>`."
              },
              {
                "title": "Xác nhận kết quả",
                "body": "Gửi yêu cầu tối thiểu, trước tiên hãy kiểm tra trạng thái HTTP và xác nhận rằng phản hồi có chứa kết quả có thể đọc được. Giữ thời gian, trạng thái và ID yêu cầu khi không thành công."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "success",
            "title": "Xác minh mức tối thiểu đầu tiên",
            "body": "Sau khi yêu cầu tối thiểu thành công, hãy kết nối ứng dụng và thêm từng tham số tùy chọn. Trang này không lặp lại ví dụ về yêu cầu đầy đủ."
          }
        ]
      },
      {
        "id": "continue-reading",
        "title": "Tiếp tục với tài liệu",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Hiểu phạm vi dịch vụ: Partokens là gì?",
              "Quản lý thông tin xác thực: Quản lý khóa API.",
              "Chọn model và kiểm tra giá: Model và giá cả và Model API.",
              "Định cấu hình SDK hoặc ứng dụng khách: Thiết lập SDK, Ứng dụng khách được hỗ trợ hoặc thiết lập Codex và CLI.",
              "Điều tra các yêu cầu và khấu trừ: Kết nối, giới hạn và số lần thử lại cũng như nhật ký sử dụng.",
              "Nhận trợ giúp sau khi tự kiểm tra: Liên hệ với bộ phận hỗ trợ."
            ]
          }
        ]
      }
    ]
  },
  "overview": {
    "id": "overview",
    "summary": "Partokens cung cấp quyền truy cập API tương thích với OpenAI vào các mô hình và khả năng hiện có sẵn cho một tài khoản.",
    "sections": [
      {
        "id": "confirm-scope",
        "title": "Xác nhận phạm vi dịch vụ",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Partokens cung cấp Base URL chung tương thích với OpenAI, bảng điều khiển tài khoản và tài liệu API công khai. Ứng dụng có thể gửi yêu cầu qua HTTPS, OpenAI SDK hoặc ứng dụng khách có Base URL tùy chỉnh."
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Khả năng tương thích không phải là danh tính",
            "body": "Khả năng tương thích với OpenAI cho phép sử dụng lại các phương thức kết nối và định dạng yêu cầu phổ biến. Điều này không đồng nghĩa mọi tài khoản, mô hình, endpoint hoặc tham số tùy chọn đều khả dụng."
          }
        ]
      },
      {
        "id": "choose-entry",
        "title": "Chọn điểm vào API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Xem mô hình: gọi `GET /v1/models` bằng cùng một khóa.",
              "Gửi yêu cầu mô hình: chọn điểm cuối phù hợp với khả năng hiện tại của mô hình từ trang API có liên quan, sau đó chỉ bắt đầu với các trường bắt buộc.",
              "Sử dụng SDK hoặc ứng dụng khách tương thích: đặt Base URL thành `https://partokens.com/v1` và cung cấp khóa Partokens Bearer cũng như ID mô hình chính xác.",
              "Hãy thử trực tiếp một khả năng: đăng nhập vào bảng điều khiển và sử dụng không gian làm việc hình ảnh hoặc trò chuyện hiện có."
            ]
          }
        ]
      },
      {
        "id": "check-live-data",
        "title": "Kiểm tra thông tin hiện tại",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Kiểm tra mô hình và điểm cuối",
                "body": "Sử dụng danh sách mô hình được trả về với cùng một khóa."
              },
              {
                "title": "Kiểm tra giá và hạn ngạch",
                "body": "Sử dụng thông tin tài khoản hiện tại, nhật ký sử dụng sau lệnh gọi và khoản khấu trừ thực tế."
              },
              {
                "title": "Kiểm tra thông số",
                "body": "Sử dụng trang API có liên quan và phản hồi thực tế của mô hình mục tiêu. Không suy luận hỗ trợ từ tên model hoặc dịch vụ khác."
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
        "title": "Xác minh tính tương thích",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Xác nhận cài đặt máy khách",
                "body": "Xác nhận rằng máy khách hiển thị khóa Base URL, Bearer và cài đặt ID mô hình chính xác."
              },
              {
                "title": "Chạy yêu cầu tối thiểu trên điểm cuối đích",
                "body": "Sử dụng `<YOUR_PARTOKENS_API_KEY>` và `<YOUR_MODEL_ID>` chỉ với các trường cốt lõi của điểm cuối."
              },
              {
                "title": "Thêm từng khả năng một",
                "body": "Sau khi đạt được mức tối thiểu, hãy thêm các tham số tùy chọn riêng lẻ và sử dụng từng phản hồi thực tế để xác nhận hỗ trợ."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Sử dụng phản hồi thực tế",
            "body": "Một mô hình hiển thị hoặc máy khách có thể định cấu hình chỉ xác nhận một điều kiện tiên quyết về tích hợp. Phản hồi của mô hình đích về điểm cuối và các tham số đích là kết quả tương thích."
          }
        ]
      }
    ]
  },
  "first-request": {
    "id": "first-request",
    "summary": "Chuẩn bị khóa API, Base URL và ID mô hình, gửi một yêu cầu trò chuyện tối thiểu và xác nhận văn bản được trả về.",
    "prerequisites": [
      "Khóa API Partokens",
      "ID mô hình có sẵn cho tài khoản"
    ],
    "sections": [
      {
        "id": "prepare",
        "title": "Chuẩn bị tích hợp",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chuẩn bị khóa API `<YOUR_PARTOKENS_API_KEY>`.",
              "Sử dụng Base URL `https://partokens.com/v1`.",
              "Sao chép ID mô hình chính xác có sẵn `<YOUR_MODEL_ID>` từ danh sách mẫu tài khoản."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Đặt biến môi trường",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "send",
        "title": "Gửi yêu cầu",
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
        "title": "Đọc phản hồi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Kiểm tra trạng thái HTTP trước khi phân tích cú pháp JSON.",
              "Đọc văn bản trò chuyện đầu tiên từ `choices[0].message.content`.",
              "Coi mảng `choices` trống hoặc văn bản trống là không có kết quả có thể sử dụng được."
            ]
          }
        ]
      },
      {
        "id": "failures",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: kiểm tra xem khóa Bearer có đầy đủ, hợp lệ và từ môi trường dự định hay không.",
              "400: sử dụng `error.message` để sửa mô hình, thông báo hoặc các trường JSON.",
              "429: chờ `Retry-After`; khi vắng mặt, hãy sử dụng thời gian lùi theo cấp số nhân bị dao động.",
              "5xx: thử lại với thời gian chờ, số lần thử tối đa và tổng thời hạn.",
              "Lỗi kết nối hoặc hết thời gian chờ: xác nhận xem có phản hồi HTTP hay không; không gửi lại yêu cầu trò chuyện vô điều kiện."
            ]
          }
        ]
      }
    ]
  },
  "clients": {
    "id": "clients",
    "summary": "Chọn Shell, OpenAI SDK hoặc ứng dụng khách có Base URL tùy chỉnh, sau đó xác minh lệnh gọi bằng cùng cài đặt kết nối.",
    "prerequisites": [
      "Khóa API Partokens",
      "ID mô hình có sẵn"
    ],
    "sections": [
      {
        "id": "choose",
        "title": "Chọn khách hàng",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Shell / cURL: kiểm tra kết nối, tập lệnh tự động hóa và sao chép.",
              "OpenAI JavaScript SDK: các dịch vụ và tập lệnh Node.js.",
              "OpenAI Python SDK: các dịch vụ và tập lệnh Python.",
              "Codex: tác vụ mã hóa bằng mô hình hỗ trợ Responses API.",
              "Máy khách tương thích OpenAI với Base URL tùy chỉnh: các máy khách hiện có hiển thị khóa Base URL, khóa Bearer và cài đặt ID mô hình."
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Định cấu hình kết nối",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Gửi khóa Bearer `<YOUR_PARTOKENS_API_KEY>` dưới dạng `Authorization: Bearer ...`.",
              "Sử dụng ID mô hình tài khoản chính xác `<YOUR_MODEL_ID>`.",
              "Khám phá các mô hình với `GET /v1/models`; Shell, SDK và các ứng dụng khách tương thích xác minh trò chuyện với `POST /v1/chat/completions`, trong khi Codex sử dụng `POST /v1/responses`."
            ]
          }
        ]
      },
      {
        "id": "verify",
        "title": "Xác minh lệnh gọi",
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
              "Đối với một ứng dụng khách tương thích khác, hãy chạy `GET https://partokens.com/v1/models`, sau đó gửi yêu cầu trò chuyện bằng cùng khóa và ID mô hình.",
              "Đối với Shell, JavaScript, Python và các máy khách tương thích, hãy xác nhận phản hồi HTTP thành công và `choices[0].message.content` có thể đọc được.",
              "Sau khi định cấu hình Base URL, khóa và mô hình, hãy xác minh Codex bằng `codex exec \"Reply only with: connection successful\"`."
            ]
          }
        ]
      },
      {
        "id": "troubleshoot",
        "title": "Khắc phục sự cố",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Lỗi cấu hình ứng dụng khách: không có yêu cầu nào được gửi, hoặc URL, header Bearer hay mô hình không hợp lệ; sửa cài đặt trước khi thử lại.",
              "Lỗi mạng: không có trạng thái HTTP; kiểm tra DNS, TLS, proxy và thời gian chờ kết nối.",
              "API: trạng thái HTTP và JSON `error` đã đến; xử lý 401, 400, 429 hoặc 5xx dưới dạng kết quả API chứ không phải dưới dạng sự cố máy khách."
            ]
          }
        ]
      }
    ]
  },
  "api-keys": {
    "id": "api-keys",
    "summary": "Tạo khóa API trong bảng điều khiển, cấu hình khóa trong môi trường thực thi an toàn, rồi lần lượt xoay hoặc thu hồi các khóa cũ.",
    "prerequisites": [
      "Truy cập vào bảng điều khiển Partokens"
    ],
    "sections": [
      {
        "id": "create",
        "title": "Tạo khóa",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Quản lý khóa mở",
                "body": "Đăng nhập vào bảng điều khiển, mở các khóa API và chọn Tạo khóa."
              },
              {
                "title": "Đặt các tùy chọn bắt buộc",
                "body": "Nhập tên và chọn một nhóm; đặt giới hạn hạn ngạch và hết hạn khi cần thiết."
              },
              {
                "title": "Lưu thông tin xác thực",
                "body": "Sau khi gửi, dùng Hiển thị hoặc Sao chép trong danh sách khóa và đưa thông tin xác thực vào môi trường thực thi an toàn ngay lập tức."
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Định cấu hình khóa",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Sử dụng biến môi trường phía máy chủ hoặc trình quản lý bí mật; không bao giờ đặt khóa vào kho lưu trữ, URL, nhật ký hoặc mã trình duyệt.",
              "Gửi dưới dạng `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Đặt biến môi trường",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "rotate",
        "title": "Xoay và thu hồi",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Tạo",
                "body": "Tạo khóa thay thế cho cùng một ứng dụng và lưu trữ khóa đó một cách an toàn."
              },
              {
                "title": "Hãy xác minh trước",
                "body": "Thay đổi một môi trường được kiểm soát và gọi `GET /v1/models` để xác nhận việc thay thế hoạt động."
              },
              {
                "title": "Thay thế mỗi lần sử dụng",
                "body": "Cập nhật các giá trị dịch vụ, công việc và trình quản lý bí mật, sau đó xác nhận cấu hình mới đang hoạt động."
              },
              {
                "title": "Vô hiệu hóa khóa cũ",
                "body": "Từ thao tác danh sách khóa, chọn Tắt để tạm dừng hoặc Xóa để xóa khóa cũ."
              }
            ]
          }
        ]
      },
      {
        "id": "exceptions",
        "title": "Xử lý các ngoại lệ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401: kiểm tra biến môi trường, tiêu đề Bearer và trạng thái khóa; đảm bảo giá trị cũ không được sử dụng.",
              "403: kiểm tra nhóm khóa, phạm vi truy cập và trạng thái kích hoạt trước khi thử lại.",
              "Nguy cơ bị lộ: vô hiệu hóa hoặc xóa khóa ngay lập tức, tạo và xác minh khóa thay thế, sau đó cập nhật mỗi lần sử dụng.",
              "Khóa hết hạn, bị vô hiệu hóa hoặc cạn kiệt: không thử lại nhiều lần; tạo một sự thay thế và xác minh nó."
            ]
          }
        ]
      }
    ]
  },
  "billing": {
    "id": "billing",
    "summary": "Xem lại số dư, gói và mức sử dụng trong bảng điều khiển, chọn nguồn thanh toán và khôi phục khi không đủ hạn ngạch.",
    "prerequisites": [
      "Truy cập vào bảng điều khiển Partokens"
    ],
    "sections": [
      {
        "id": "view-balance-plan",
        "title": "Xem số dư và kế hoạch",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ví mở",
                "body": "Đăng nhập vào bảng điều khiển và chọn Ví trong Tài khoản ở thanh bên."
              },
              {
                "title": "Xem lại trạng thái tài khoản",
                "body": "Ở đầu trang, hãy xem lại số dư tài khoản, tổng mức sử dụng và số lượng gói đang hoạt động."
              },
              {
                "title": "Xem lại hạn ngạch kế hoạch",
                "body": "Trong Chọn gói, chọn Xem hoạt động và kiểm tra từng trạng thái gói, tổng hạn ngạch, hạn ngạch còn lại và tỷ lệ phần trăm đã sử dụng."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Số dư tài khoản hiển thị số dư hiện có.",
              "Tổng mức sử dụng hiển thị mức sử dụng đã được ghi lại cho tài khoản.",
              "Chi tiết gói đang hoạt động hiển thị các gói vẫn có thể được sử dụng và hạn mức còn lại của chúng."
            ]
          }
        ]
      },
      {
        "id": "choose-billing-source",
        "title": "Chọn nguồn thanh toán",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Tìm tùy chọn",
                "body": "Ở cuối phần Chọn gói trên Ví, hãy tìm tùy chọn Thanh toán sử dụng. Bạn có thể thay đổi nó trong khi có sẵn gói hoạt động."
              },
              {
                "title": "Chọn tùy chọn hiện tại",
                "body": "Chọn Đăng ký trước, Số dư trước, Chỉ đăng ký hoặc Chỉ số dư, sau đó đợi cập nhật thành công trước khi gọi API."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Đăng ký trước và Cân bằng trước chọn nguồn nào được thử trước.",
              "Chỉ đăng ký và Số dư chỉ hạn chế việc sử dụng nguồn đó.",
              "Xác nhận rằng nguồn đã chọn hiện có sẵn trước khi thay đổi tùy chọn."
            ]
          }
        ]
      },
      {
        "id": "review-usage",
        "title": "Xem lại cách sử dụng",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Mở nhật ký sử dụng",
                "body": "Trong thanh bên của bảng điều khiển, chọn nhật ký sử dụng trong phần Chung."
              },
              {
                "title": "Thu hẹp thời gian và mô hình",
                "body": "Chọn phạm vi bao gồm lệnh gọi, sau đó chọn mô hình. Để tra cứu chính xác, hãy thay đổi trường tìm kiếm thành ID yêu cầu và nhập ID yêu cầu đầy đủ."
              },
              {
                "title": "So sánh lệnh gọi và khấu trừ",
                "body": "Mở bản ghi trùng khớp và xem xét thời gian, loại, mô hình, lỗi, mức sử dụng, chi phí và ID yêu cầu, sau đó so sánh bản ghi đó với số dư hoặc hạn ngạch gói còn lại trong Ví."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-insufficient-quota",
        "title": "Giải quyết không đủ hạn ngạch",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Số dư không đủ: kiểm tra Ví và sử dụng tùy chọn nạp tiền hiện có hoặc chuyển sang gói có hạn mức khả dụng.",
              "Gói không đủ hoặc không có sẵn: mở chi tiết gói đang hoạt động và kiểm tra trạng thái cũng như hạn ngạch còn lại của gói đó; chọn gói hiện có hoặc thay đổi tùy chọn thanh toán thành nguồn có sẵn.",
              "Yêu cầu bị từ chối: giữ nguyên trạng thái, lỗi và ID yêu cầu của HTTP, sau đó kiểm tra nhật ký sử dụng để tìm bản ghi. Đối với 401 hoặc 403, hãy kiểm tra cả trạng thái và quyền truy cập của khóa API.",
              "Sau khi sửa số dư, gói, tùy chọn thanh toán hoặc khóa, trước tiên hãy gửi một yêu cầu tối thiểu. Không gửi lại các yêu cầu không thay đổi."
            ]
          }
        ]
      }
    ]
  },
  "models-pricing": {
    "id": "models-pricing",
    "summary": "Tìm các mẫu hiện có, xem lại thông tin về khả năng và giá cả, chọn API phù hợp và giải quyết các lỗi của mẫu.",
    "prerequisites": [
      "Truy cập vào tài khoản Partokens",
      "Phím API `<YOUR_PARTOKENS_API_KEY>` khi truy vấn thông qua API"
    ],
    "sections": [
      {
        "id": "find-models",
        "title": "Tìm mô hình",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Truy vấn mô hình tài khoản",
                "body": "Gọi điểm cuối mô hình bằng khóa API hiện tại để xem các mô hình được trả về cho tài khoản đó."
              },
              {
                "title": "Mô hình truy vấn cho khóa",
                "body": "Bạn cũng có thể gọi điểm cuối của mô hình bằng `<YOUR_PARTOKENS_API_KEY>` để xem các mô hình hiện được trả về cho khóa đó."
              },
              {
                "title": "Sao chép ID mô hình",
                "body": "Sao chép ID mô hình chính xác từ phản hồi danh sách mô hình hoặc `data[].id` và sử dụng ID đó không thay đổi dưới dạng `<YOUR_MODEL_ID>` trong các yêu cầu sau này."
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
        "title": "Kiểm tra khả năng và giá",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Dùng phản hồi danh sách mô hình để xác nhận `<YOUR_MODEL_ID>` và xem tài liệu API liên quan trước khi gọi. Dữ liệu thanh toán và giá hiện tại do dịch vụ trả về là nguồn quyết định.",
              "Khi không có thông tin về khả năng hoặc giá cả, đừng suy ra thông tin đó từ tên mẫu máy hoặc tên tương tự.",
              "Trước khi gọi, hãy xác nhận rằng API mục tiêu xuất hiện trong thông tin khả năng hiện tại của mô hình. Sử dụng dữ liệu tài khoản hiển thị tại thời điểm đó để lựa chọn giá.",
              "Xem lại mức sử dụng thực tế và các khoản khấu trừ trong nhật ký sử dụng sau lệnh gọi."
            ]
          }
        ]
      },
      {
        "id": "choose-api",
        "title": "Chọn một API",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chat Completions: khi mô hình hỗ trợ rõ ràng việc hoàn thành trò chuyện, hãy gửi danh sách tin nhắn tới `POST /v1/chat/completions`.",
              "Responses: khi mô hình hỗ trợ rõ ràng Responses, hãy sử dụng `POST /v1/responses`; các kết nối Codex gốc sử dụng API này.",
              "Hình ảnh API: khi mô hình hỗ trợ rõ ràng hình ảnh, hãy sử dụng `POST /v1/images/generations` để tạo hình ảnh. Xưởng hình ảnh sử dụng tính năng chỉnh sửa hình ảnh API khi hình ảnh tham chiếu được cung cấp.",
              "Một mô hình có thể không hỗ trợ mọi API hoặc tham số tùy chọn. Bắt đầu với yêu cầu tối thiểu đối với API mục tiêu."
            ]
          }
        ]
      },
      {
        "id": "resolve-model-errors",
        "title": "Giải quyết các vấn đề về mô hình",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Model không hiển thị: làm mới Model. Khi sử dụng API, hãy xác nhận rằng `GET /v1/models` đã thành công và kiểm tra xem `data` có trống không.",
              "không thể gọi được: sử dụng ID được trả về chính xác và truy vấn lại danh sách mô hình bằng cùng một khóa API. Đừng đoán ID khi khóa đó nhận được danh sách trống.",
              "Tham số không tương thích hoặc 400: đọc `error.message`, xóa các tham số tùy chọn và thử lại với các trường tối thiểu cho API đích.",
              "403: đọc lỗi, sau đó kiểm tra trạng thái khóa API, quyền truy cập mô hình và cân bằng hoặc kế hoạch trước khi thử lại.",
              "hiển thị nhưng vẫn không thành công: giữ nguyên thời gian yêu cầu, ID mô hình, trạng thái HTTP và ID yêu cầu, sau đó tìm bản ghi trong nhật ký sử dụng."
            ]
          }
        ]
      }
    ]
  },
  "codex": {
    "id": "codex",
    "summary": "Kết nối Codex gốc với Partokens bằng cấu hình của nhà cung cấp mô hình và xác minh lệnh gọi Responses bằng một lệnh tối thiểu.",
    "prerequisites": [
      "Khóa API `<YOUR_PARTOKENS_API_KEY>`",
      "A ID mô hình có khả năng Responses `<YOUR_MODEL_ID>`",
      "Codex đã được cài đặt và có thể chạy được"
    ],
    "sections": [
      {
        "id": "prepare-codex",
        "title": "Chuẩn bị Codex",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Chạy `codex --version` và xác nhận rằng Codex khởi động trong thiết bị đầu cuối hiện tại.",
              "Sao chép chính xác `<YOUR_MODEL_ID>` từ `GET https://partokens.com/v1/models` và xác nhận rằng nó hỗ trợ Responses.",
              "Chuẩn bị khóa Partokens API `<YOUR_PARTOKENS_API_KEY>`."
            ]
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Đặt biến môi trường",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure-connection",
        "title": "Định cấu hình kết nối",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Mở cấu hình người dùng",
                "body": "Chỉnh sửa `~/.codex/config.toml` và giữ mọi cài đặt khác mà bạn vẫn cần."
              },
              {
                "title": "Thêm nhà cung cấp Partokens",
                "body": "Thêm cấu hình mô hình và nhà cung cấp bên dưới. `env_key` đọc biến môi trường được đặt ở trên."
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
        "title": "Xác minh lệnh gọi",
        "blocks": [
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Xác minh tối thiểu",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\ncodex exec \"Reply only with: connection successful\""
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Kết quả `connection successful` bình thường xác nhận rằng Codex đã gửi và hoàn thành yêu cầu thông qua cấu hình này.",
              "Sau đó, bạn có thể tìm thấy lệnh gọi trong nhật ký sử dụng theo thời gian, mô hình và ID yêu cầu."
            ]
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Lỗi cấu hình: nếu Codex không thể đọc tệp hoặc sử dụng sai mô hình, hãy kiểm tra cú pháp TOML, `model_provider` và `<YOUR_MODEL_ID>`, đồng thời xác nhận biến môi trường được đặt trong cùng terminal.",
              "Lỗi kết nối: khi không có trạng thái HTTP, hãy kiểm tra mạng, proxy, DNS, TLS và `base_url` đó có phải là `https://partokens.com/v1` hay không.",
              "HTTP/API: đối với 400, 401, 403, 429 hoặc 5xx, giữ nguyên trạng thái, lỗi và ID yêu cầu. Chỉnh sửa các tham số, khóa, quyền truy cập hoặc hạn mức trước khi quyết định có thử lại hay không.",
              "không hỗ trợ Responses: chọn một mẫu hiện được liệt kê có hỗ trợ rõ ràng Responses. Không thay đổi `wire_api` sang giá trị khác."
            ]
          }
        ]
      }
    ]
  },
  "sdk": {
    "id": "sdk",
    "summary": "Cài đặt OpenAI SDK cho JavaScript hoặc Python, cấu hình Base URL Partokens và khóa API, rồi đọc văn bản từ một yêu cầu trò chuyện tối thiểu.",
    "prerequisites": [
      "Thời gian chạy Node.js hoặc Python",
      "Khóa API Partokens",
      "ID mô hình"
    ],
    "sections": [
      {
        "id": "install",
        "title": "Cài đặt SDK",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Cài đặt OpenAI SDK được hỗ trợ trong dự án phía máy chủ."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Cài đặt và đặt biến",
                "code": "npm install openai\npython -m pip install openai\n\nexport PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\nexport PARTOKENS_MODEL=\"<YOUR_MODEL_ID>\""
              }
            ]
          }
        ]
      },
      {
        "id": "configure",
        "title": "Định cấu hình máy khách",
        "blocks": [
          {
            "type": "list",
            "items": [
              "JavaScript sử dụng `apiKey` và `baseURL`.",
              "Python sử dụng `api_key` và `base_url`.",
              "Đặt cả hai SDK thành `https://partokens.com/v1`; cung cấp `<YOUR_MODEL_ID>` thông qua biến môi trường mô hình."
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
        "title": "Gửi và đọc yêu cầu",
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
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Lỗi kết nối: kiểm tra DNS, TLS, proxy và mạng trước khi thử lại.",
              "HTTP: đọc trạng thái, `error.message` và `X-Oneapi-Request-Id`; trước tiên hãy sửa 400, 401 hoặc 403.",
              "429: tuân theo `Retry-After` hoặc sử dụng thời gian chờ theo cấp số nhân bị dao động.",
              "5xx: thử lại với số lần thử tối đa và tổng thời hạn.",
              "Hết thời gian chờ: đặt timeout cho SDK; yêu cầu trò chuyện có thể đã chạy, vì vậy hãy kiểm tra nhật ký sử dụng trước khi thử lại."
            ]
          }
        ]
      }
    ]
  },
  "image-studio": {
    "id": "image-studio",
    "summary": "Mở Xưởng hình ảnh từ bảng điều khiển, chọn mô hình và khóa hiện tại, tạo hoặc chỉnh sửa hình ảnh và lưu kết quả bạn cần.",
    "prerequisites": [
      "Truy cập vào bảng điều khiển Partokens",
      "Một mẫu hình ảnh có sẵn và khóa API"
    ],
    "sections": [
      {
        "id": "open-studio",
        "title": "Mở không gian làm việc",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Mở bảng điều khiển",
                "body": "Đăng nhập vào Partokens và mở bảng điều khiển."
              },
              {
                "title": "Mở Xưởng hình ảnh",
                "body": "Trong thanh bên, chọn Studio hình ảnh trong Không gian làm việc."
              },
              {
                "title": "Kiểm tra không gian làm việc",
                "body": "ở bên trái và tập kết quả hiện tại ở bên phải."
              }
            ]
          }
        ]
      },
      {
        "id": "select-model-key",
        "title": "Chọn model và khóa",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Chọn mẫu",
                "body": "Trong Mô hình, chọn một mô hình hình ảnh từ danh sách hiện tại và sử dụng giá trị chính xác đó làm `<YOUR_MODEL_ID>`. Đừng đoán tên mẫu."
              },
              {
                "title": "Chọn khóa API",
                "body": "Ở thế hệ đầu tiên, chọn khóa hoạt động tương thích với mô hình trong hộp thoại yêu cầu khóa API, sau đó tiếp tục tạo."
              },
              {
                "title": "Khi không có khóa",
                "body": "Sử dụng khóa Tạo trong hộp thoại hoặc mở các khóa API và tạo khóa cho mô hình đã chọn trước khi quay lại Xưởng hình ảnh."
              }
            ]
          }
        ]
      },
      {
        "id": "generate-edit",
        "title": "Tạo hoặc chỉnh sửa hình ảnh",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Nhập lời nhắc",
                "body": "Mô tả hình ảnh cần tạo hoặc chỉnh sửa trong Lời nhắc."
              },
              {
                "title": "Đặt đầu ra",
                "body": "Chọn chất lượng, kích thước hình ảnh và số lượng hình ảnh từ các tùy chọn được hiển thị."
              },
              {
                "title": "Thêm tài liệu tham khảo khi cần",
                "body": "Tải lên hình ảnh PNG, JPG hoặc WebP để chỉnh sửa hoặc chọn Sử dụng làm tham chiếu trên kết quả được tạo."
              },
              {
                "title": "Bắt đầu nhiệm vụ",
                "body": "Chọn Tạo và đợi hình ảnh trong Kết quả. Nếu mô hình từ chối một cài đặt, hãy chọn một trong các tùy chọn hiện được cung cấp cho mô hình đó."
              }
            ]
          }
        ]
      },
      {
        "id": "save-handle-failures",
        "title": "Lưu và xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Lưu kết quả: chọn Tải xuống hình ảnh trên mọi hình ảnh bạn cần giữ lại. Thế hệ tiếp theo sẽ thay thế tập kết quả được hiển thị.",
              "Lỗi thế hệ hoặc tham số không được hỗ trợ: đọc lỗi trang, chọn chất lượng, kích thước hoặc số lượng được cung cấp cho mô hình hiện tại và xóa các cài đặt không tương thích.",
              "401: kiểm tra xem khóa API đã chọn có còn hiệu lực hay không. 403: kiểm tra quyền truy cập chính vào mô hình và số dư tài khoản hoặc gói. Không tái sinh cho đến khi sửa chữa.",
              "429: đợi theo hướng dẫn trước khi thử lại. Đối với 5xx, hãy giữ lại chi tiết yêu cầu và sử dụng thời gian chờ có giới hạn với tổng thời hạn."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Kiểm tra nhật ký sau khi hủy hoặc hết thời gian chờ",
            "body": "Sau khi rời khỏi thế hệ đang hoạt động và xác nhận Dừng hoặc sau khi hết thời gian chờ, trước tiên hãy kiểm tra nhật ký sử dụng theo thời gian, mô hình và ID yêu cầu để biết bản ghi và khấu trừ, sau đó quyết định xem có thử lại hay không."
          }
        ]
      }
    ]
  },
  "api-basics": {
    "id": "api-basics",
    "summary": "Gửi các yêu cầu HTTPS với cơ sở Partokens URL và khóa Bearer API, sau đó xử lý kết quả theo trạng thái HTTP và nội dung phản hồi.",
    "prerequisites": [
      "Khóa API Partokens",
      "ID mô hình được sao chép từ danh sách mẫu"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Gửi yêu cầu",
        "blocks": [
          {
            "type": "endpoint",
            "label": "Base URL",
            "path": "https://partokens.com/v1"
          },
          {
            "type": "list",
            "items": [
              "Gửi `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Các yêu cầu có nội dung JSON cũng yêu cầu `Content-Type: application/json`.",
              "Không bao giờ đặt khóa API trong URL, mã phía máy khách hoặc nhật ký."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Chạy yêu cầu tối thiểu",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: ID mô hình chính xác được danh sách mẫu trả về.",
              "`messages`: tin nhắn đặt hàng gửi về model.",
              "`messages[].role`: sử dụng `user` cho yêu cầu văn bản tối thiểu.",
              "`messages[].content`: văn bản không trống."
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
        "title": "Đọc phản hồi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Trước tiên hãy kiểm tra trạng thái HTTP; trạng thái 2xx cho biết phản hồi HTTP thành công.",
              "Phân tích nội dung JSON và đọc kết quả điểm cuối, chẳng hạn như `choices` cho trò chuyện, `data` cho hình ảnh hoặc `data` cho mô hình.",
              "Để có phản hồi không phải 2xx, hãy đọc `error.message` và ghi lại `error.code` khi nó xuất hiện."
            ]
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: sửa JSON hoặc yêu cầu các trường trước khi gửi lại.",
              "401 / 403: kiểm tra khóa API và truy cập; không thử lại thông tin đăng nhập không thay đổi.",
              "429: đợi `Retry-After` khi xuất hiện, nếu không thì sử dụng độ trễ hàm mũ với jitter.",
              "5xx: thử lại với thời gian chờ theo cấp số nhân, số lần thử tối đa và tổng thời hạn.",
              "Lỗi mạng hoặc hết thời gian chờ: xác định xem phản hồi HTTP có đến hay không trước khi quyết định thử lại."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Thử lại an toàn",
            "body": "GET có thể được thử lại trong tổng thời hạn; thử lại trò chuyện và hình ảnh POST chỉ tự động yêu cầu khi ứng dụng chấp nhận kết quả và cách sử dụng trùng lặp."
          }
        ]
      }
    ]
  },
  "chat-completions": {
    "id": "chat-completions",
    "summary": "Gửi một mảng tin nhắn để tạo câu trả lời trò chuyện, sau đó đọc văn bản từ `choices[0].message.content`.",
    "prerequisites": [
      "Khóa API Partokens",
      "ID mô hình máy có khả năng trò chuyện được sao chép từ danh sách mẫu",
      "OpenAI SDK dành cho các ví dụ JavaScript và Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Gửi yêu cầu",
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
              "Gửi `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Gửi `Content-Type: application/json`.",
              "Đối với SDK, đặt URL cơ sở thành `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Điền yêu cầu",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: ID mô hình chính xác được danh sách mẫu trả về.",
              "`messages`: tin nhắn đặt hàng gửi đến model.",
              "`messages[].role`: sử dụng `user` cho yêu cầu văn bản tối thiểu.",
              "`messages[].content`: văn bản không trống cho tin nhắn."
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
        "title": "Đọc phản hồi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`choices[0].message.content`: tin nhắn từ ứng cử viên đầu tiên.",
              "`choices[0].finish_reason`: tại sao ứng viên đó lại dừng lại.",
              "`usage`: số lượng đầu vào, đầu ra và tổng số mã thông báo khi được trả về."
            ]
          },
          {
            "type": "paragraph",
            "text": "Coi mảng `choices` trống hoặc ứng cử viên đầu tiên không có văn bản làm phản hồi và không có kết quả trò chuyện có thể sử dụng được."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: sử dụng `error.message` để sửa `model`, `messages` hoặc trường thông báo.",
              "401 / 403: kiểm tra khóa API và truy cập; không thử lại thông tin đăng nhập không thay đổi.",
              "429: đợi `Retry-After` khi xuất hiện, nếu không thì sử dụng thời gian lùi hàm mũ với jitter.",
              "5xx: thử lại với thời gian chờ theo cấp số nhân, số lần thử tối đa và tổng thời hạn.",
              "Lỗi mạng hoặc hết thời gian chờ: yêu cầu có thể đã chạy; đừng gửi lại nó ngay lập tức."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Tránh các thế hệ trùng lặp",
            "body": "Chỉ tự động thử lại các yêu cầu trò chuyện khi ứng dụng chấp nhận các phản hồi và cách sử dụng trùng lặp, đồng thời khách hàng đặt thời gian chờ và số lần thử tối đa."
          }
        ]
      }
    ]
  },
  "image-api": {
    "id": "image-api",
    "summary": "Gửi lời nhắc tạo hình ảnh, sau đó lưu kết quả từ `data[0].url` hoặc `data[0].b64_json`.",
    "prerequisites": [
      "Khóa API Partokens",
      "ID mô hình máy có khả năng chụp ảnh được sao chép từ danh sách mẫu",
      "cURL, jq và OpenSSL cho Shell; OpenAI SDK dành cho JavaScript và Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Gửi yêu cầu",
        "blocks": [
          {
            "type": "endpoint",
            "method": "POST",
            "label": "Thế hệ hình ảnh",
            "path": "https://partokens.com/v1/images/generations"
          },
          {
            "type": "list",
            "items": [
              "Gửi `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Gửi `Content-Type: application/json`.",
              "Đối với SDK, đặt URL cơ sở thành `https://partokens.com/v1`."
            ]
          }
        ]
      },
      {
        "id": "fill-request",
        "title": "Điền yêu cầu",
        "blocks": [
          {
            "type": "list",
            "items": [
              "`model`: ID mô hình hình ảnh chính xác được danh sách mẫu trả về.",
              "`prompt`: mô tả văn bản không trống của hình ảnh."
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
        "title": "Đọc phản hồi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Xác nhận rằng mảng `data` không trống.",
              "Khi có `data[0].url`, hãy tải xuống và kiểm tra trạng thái tải xuống HTTP.",
              "Khi không có URL nhưng `data[0].b64_json` tồn tại, hãy giải mã giá trị Base64 thành tệp nhị phân.",
              "Coi kết quả không có trường nào là phản hồi không có hình ảnh có thể sử dụng được."
            ]
          },
          {
            "type": "paragraph",
            "text": "Không ghi dữ liệu hình ảnh Base64 hoàn chỉnh vào nhật ký ứng dụng."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "400: sử dụng `error.message` để sửa `model` hoặc `prompt`.",
              "401 / 403: kiểm tra khóa API và truy cập; không thử lại thông tin đăng nhập không thay đổi.",
              "429: đợi `Retry-After` khi xuất hiện, nếu không thì sử dụng độ trễ hàm mũ với jitter.",
              "5xx: thử lại với thời gian chờ theo cấp số nhân, số lần thử tối đa và tổng thời hạn.",
              "Lỗi mạng hoặc hết thời gian chờ: yêu cầu có thể đã chạy; không tạo lại ngay lập tức.",
              "Lỗi tải xuống hình ảnh: thử tải xuống lại mà không gửi lại yêu cầu tạo."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Tránh các thế hệ trùng lặp",
            "body": "Chỉ tự động thử lại việc tạo hình ảnh khi ứng dụng chấp nhận hình ảnh và cách sử dụng trùng lặp, đồng thời khách hàng đặt thời gian chờ và số lần thử tối đa."
          }
        ]
      }
    ]
  },
  "models-api": {
    "id": "models-api",
    "summary": "Đọc các mô hình có sẵn cho khóa API hiện tại và sử dụng lại ID mô hình được trả về chính xác trong các yêu cầu khác.",
    "prerequisites": [
      "Khóa API Partokens",
      "cURL và jq cho Shell; OpenAI SDK dành cho JavaScript và Python"
    ],
    "sections": [
      {
        "id": "send-request",
        "title": "Gửi yêu cầu",
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
              "Gửi `Authorization: Bearer <YOUR_PARTOKENS_API_KEY>`.",
              "Yêu cầu GET này không có nội dung yêu cầu."
            ]
          }
        ]
      },
      {
        "id": "run-request",
        "title": "Chạy yêu cầu tối thiểu",
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
        "title": "Đọc phản hồi",
        "blocks": [
          {
            "type": "table",
            "columns": [
              "",
              "Ý nghĩa"
            ],
            "rows": [
              [
                "`object`",
                "Giá trị của `list` xác định danh sách model."
              ],
              [
                "`data`",
                "Mảng mô hình; một mảng trống có nghĩa là khóa hiện không có sẵn mẫu nào."
              ],
              [
                "`data[].id`",
                "Sao chép giá trị chính xác vào trường `model` của một yêu cầu khác."
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Không thay đổi kiểu chữ cái của ID mô hình hoặc thêm hoặc xóa tiền tố."
          }
        ]
      },
      {
        "id": "handle-errors",
        "title": "Xử lý lỗi",
        "blocks": [
          {
            "type": "list",
            "items": [
              "401 / 403: kiểm tra khóa API và truy cập; không thử lại thông tin đăng nhập không thay đổi.",
              "429: đợi `Retry-After` hoặc sử dụng độ trễ hàm mũ với jitter.",
              "5xx, lỗi mạng hoặc hết thời gian chờ: thử lại với số lần thử tối đa và tổng thời hạn.",
              "2xx với `data` trống: kiểm tra các mẫu có sẵn cho khóa; đừng đoán ID mô hình."
            ]
          },
          {
            "type": "paragraph",
            "text": "Danh sách mô hình là một yêu cầu GET và có thể được thử lại một cách an toàn trong tổng thời hạn; đặt thời gian chờ và giới hạn số lần thử."
          }
        ]
      }
    ]
  },
  "faq": {
    "id": "faq",
    "summary": "Câu trả lời cho các câu hỏi về tích hợp, tài khoản, mô hình, cách sử dụng và lỗi thường gặp bằng các nguồn trực tiếp để kiểm tra.",
    "sections": [
      {
        "id": "choose-integration",
        "title": "Chọn phương thức tích hợp",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Tôi có thể tiếp tục sử dụng OpenAI SDK không?",
                "answer": "Có. Đặt Base URL thành `https://partokens.com/v1`, sử dụng khóa Partokens API và cung cấp ID mô hình chính xác hiện được trả về cho tài khoản."
              },
              {
                "question": "Tôi có nên sử dụng Shell, SDK hoặc ứng dụng khách tương thích không?",
                "answer": "Sử dụng Shell để kiểm tra và sao chép ở mức tối thiểu, SDK cho các dịch vụ và tập lệnh và chỉ ứng dụng khách hiện có khi nó hiển thị cài đặt Base URL, khóa Bearer và ID mô hình."
              },
              {
                "question": "Ví dụ về yêu cầu đầy đủ ở đâu?",
                "answer": "Sử dụng Bắt đầu nhanh: tích hợp đầu tiên cho lệnh gọi đầu tiên và trang API có liên quan cho các trường và hình dạng phản hồi."
              }
            ]
          }
        ]
      },
      {
        "id": "manage-account",
        "title": "Quản lý khóa và tài khoản",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Tôi nên lưu trữ khóa API ở đâu?",
                "answer": "Lưu trữ `<YOUR_PARTOKENS_API_KEY>` trong biến môi trường hoặc trình quản lý bí mật. Không đặt nó trong kho lưu trữ, URL, nhật ký hoặc mã trình duyệt."
              },
              {
                "question": "Làm cách nào để xoay khóa?",
                "answer": "Trước tiên, hãy tạo và xác minh bản thay thế, cập nhật mọi người tiêu dùng, sau đó tắt hoặc xóa khóa cũ trong bảng điều khiển. Hành động trên khóa cũ ngay lập tức nếu nghi ngờ có sự lộ lọt."
              },
              {
                "question": "Tôi kiểm tra số dư, gói và hạn ngạch hiện có ở đâu?",
                "answer": "Sử dụng các trang tài khoản hiện tại, phản hồi thực tế của yêu cầu, nhật ký sử dụng và khoản khấu trừ thực tế."
              }
            ]
          }
        ]
      },
      {
        "id": "check-model-usage",
        "title": "Kiểm tra mô hình và cách sử dụng",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Tôi nên sử dụng ID mô hình nào?",
                "answer": "Sao chép ID hiện tại chính xác từ phản hồi của `GET /v1/models` và sử dụng nó không thay đổi dưới dạng `<YOUR_MODEL_ID>`. Đừng đoán tên mẫu."
              },
              {
                "question": "Mô hình được liệt kê có hỗ trợ mọi điểm cuối và tham số không?",
                "answer": "Đừng đưa ra giả định đó. Kiểm tra khả năng hiện tại của mô hình và xác minh từng điểm cuối cũng như tham số mục tiêu với yêu cầu tối thiểu cũng như phản hồi thực tế của nó."
              },
              {
                "question": "Bản ghi nhật ký sử dụng có nghĩa là lệnh gọi đã thành công không?",
                "answer": "Không nhất thiết. Đồng thời xem lại loại bản ghi, trạng thái HTTP và lỗi do khách hàng lưu giữ, mã thông báo, chi phí và thời lượng."
              }
            ]
          }
        ]
      },
      {
        "id": "resolve-common-failures",
        "title": "Giải quyết các lỗi thường gặp",
        "blocks": [
          {
            "type": "faq",
            "items": [
              {
                "question": "Tôi nên kiểm tra điều gì đầu tiên khi yêu cầu không thành công?",
                "answer": "Sử dụng `GET https://partokens.com/v1/models` để kiểm tra kết nối và xác thực, sau đó sửa yêu cầu theo 400, 401, 403, 429 hoặc 5xx. Giữ thời gian, múi giờ, điểm cuối, mô hình và ID yêu cầu."
              },
              {
                "question": "Mọi lỗi có thể được thử lại ngay lập tức không?",
                "answer": "Số. Đúng 400, 401 và 403 trước. Theo dõi `Retry-After` hoặc quay lại 429. Chỉ thử lại 5xx với số lần giới hạn và chỉ khi việc chơi lại an toàn."
              },
              {
                "question": "Tôi nên làm gì sau khi hủy hoặc hết thời gian chờ?",
                "answer": "Trước tiên hãy tìm kiếm nhật ký sử dụng theo thời gian, mô hình, tên khóa và ID yêu cầu rồi xem xét mọi khoản khấu trừ, sau đó quyết định xem có thử lại hay không."
              },
              {
                "question": "Khi nào tôi nên liên hệ với bộ phận hỗ trợ?",
                "answer": "Sau khi hoàn tất các bước trong Kết nối, giới hạn và thử lại cũng như nhật ký sử dụng, hãy mở phần Liên hệ hỗ trợ để chuẩn bị thông tin chẩn đoán đã ẩn dữ liệu nhạy cảm."
              }
            ]
          }
        ]
      }
    ]
  },
  "troubleshooting": {
    "id": "troubleshooting",
    "summary": "Trước tiên hãy chạy yêu cầu mô hình tối thiểu, sau đó sử dụng trạng thái HTTP để chọn chính sách sửa và thử lại.",
    "prerequisites": [
      "Khóa API Partokens",
      "Truy cập vào trạng thái HTTP của lệnh, tiêu đề phản hồi và nội dung phản hồi"
    ],
    "sections": [
      {
        "id": "run-minimal-check",
        "title": "Chạy kiểm tra tối thiểu",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Yêu cầu `GET /v1/models` bên dưới không bắt đầu tác vụ tạo. Sử dụng nó để kiểm tra DNS, TLS, cài đặt proxy, Base URL và xác thực. Lệnh cũng hiển thị tiêu đề phản hồi để bạn có thể giữ ID yêu cầu."
          },
          {
            "type": "code-samples",
            "samples": [
              {
                "language": "shell",
                "label": "Kiểm tra kết nối và xác thực",
                "code": "export PARTOKENS_API_KEY=\"<YOUR_PARTOKENS_API_KEY>\"\n\ncurl --silent --show-error --include \\\n  https://partokens.com/v1/models \\\n  -H \"Authorization: Bearer $PARTOKENS_API_KEY\""
              }
            ]
          }
        ]
      },
      {
        "id": "fix-by-status",
        "title": "Khắc phục sự cố theo trạng thái",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Lỗi kết nối: khi không có trạng thái HTTP, hãy kiểm tra mạng, DNS, TLS, proxy, hết thời gian kết nối và URL chính xác là `https://partokens.com/v1/models`.",
              "400: sử dụng lỗi trả về để sửa JSON, các trường bắt buộc, ID mô hình hoặc điểm cuối đích. Đừng lặp lại yêu cầu không thay đổi.",
              "401: xác nhận rằng biến môi trường đã được đặt, tiêu đề Bearer đã hoàn tất, khóa không bị cắt bớt và khóa vẫn được bật trong bảng điều khiển.",
              "403: sử dụng lỗi được trả về để kiểm tra quyền truy cập khóa, tính khả dụng của mẫu cũng như số dư hoặc gói hiện tại của tài khoản, sau đó khắc phục sự cố trước khi thử lại.",
              "429: theo dõi `Retry-After` khi có mặt. Ngược lại, hãy giảm tính đồng thời và sử dụng thời gian chờ theo cấp số nhân bị dao động.",
              "5xx: giữ ID yêu cầu và chỉ sử dụng thời gian chờ có giới hạn khi yêu cầu được phát lại an toàn."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Trạng thái là điểm bắt đầu",
            "body": "Cùng một trạng thái có thể có những nguyên nhân khác nhau. Sử dụng nội dung phản hồi, ID yêu cầu, thông tin tài khoản hiện tại và nhật ký sử dụng để chẩn đoán cuối cùng."
          }
        ]
      },
      {
        "id": "decide-retry",
        "title": "Quyết định có thử lại",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Thử lại: lỗi kết nối tạm thời đối với `GET /v1/models`, 429 sau thời gian chờ bắt buộc hoặc 5xx tạm thời. Đặt tổng thời hạn và số lần thử tối đa.",
              "Sửa trước: 400, 401, 403 và các lỗi rõ ràng do mô hình, điểm cuối, tham số, khóa hoặc trạng thái tài khoản gây ra.",
              "Kiểm tra nhật ký trước: việc hủy hoặc hết thời gian chờ của ứng dụng khách không chứng minh được rằng yêu cầu không chạy. Tìm kiếm nhật ký sử dụng theo thời gian, mô hình, tên khóa và ID yêu cầu, sau đó xem xét mọi khoản khấu trừ.",
              "Tránh làm việc trùng lặp: chỉ tự động thử lại trò chuyện, tạo hình ảnh hoặc chỉnh sửa hình ảnh khi chấp nhận được kết quả và cách sử dụng trùng lặp."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Không phát lại ngay sau khi hủy hoặc hết thời gian chờ",
            "body": "Nếu nhật ký sử dụng hiển thị việc thực thi hoặc khấu trừ, trước tiên hãy xem lại kết quả và ID yêu cầu. Khi kết quả vẫn chưa rõ ràng, hãy chuẩn bị thông tin chẩn đoán và liên hệ với bộ phận hỗ trợ."
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Chuẩn bị chẩn đoán",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Ghi lại yêu cầu",
                "body": "Giữ chính xác thời gian và múi giờ, mô hình, điểm cuối, trạng thái HTTP và ID yêu cầu."
              },
              {
                "title": "Lưu lỗi đã ẩn dữ liệu nhạy cảm",
                "body": "Giữ lại đủ văn bản lỗi để giải thích sự cố và xóa thông tin xác thực, thông tin cá nhân, lời nhắc đầy đủ và các tệp riêng tư."
              },
              {
                "title": "nhật ký sử dụng",
                "body": "Cho biết liệu có tìm thấy bản ghi trùng khớp hay không và giữ lại phạm vi thời gian, mô hình, tên khóa và ID yêu cầu được sử dụng để tìm kiếm."
              },
              {
                "title": "Viết bản sao tối thiểu",
                "body": "Liệt kê các bước ít nhất, kết quả mong đợi và kết quả thực tế, sau đó sử dụng Liên hệ hỗ trợ để chọn kênh chính thức."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Không gửi thông tin xác thực",
            "body": "không được chứa khóa, mật khẩu, mã xác minh hoặc mã thông báo phiên hoàn chỉnh của API."
          }
        ]
      }
    ]
  },
  "usage-logs": {
    "id": "usage-logs",
    "summary": "Tìm lệnh gọi trong bảng điều khiển và xem xét loại, lỗi, mã thông báo, chi phí, thời lượng và các khoản khấu trừ.",
    "sections": [
      {
        "id": "open-logs",
        "title": "Mở nhật ký sử dụng",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Mở bảng điều khiển",
                "body": "Đăng nhập vào Partokens và mở bảng điều khiển."
              },
              {
                "title": "Mở nhật ký sử dụng",
                "body": "Trong phần Chung của thanh bên, chọn nhật ký sử dụng."
              },
              {
                "title": "Làm mới dữ liệu hiện tại",
                "body": "Chọn Làm mới khi bạn cần truy xuất các bản ghi hiện tại, sau đó bắt đầu từ thời điểm yêu cầu."
              }
            ]
          },
          {
            "type": "paragraph",
            "text": "Nhật ký sử dụng giúp đối chiếu các lệnh gọi và sự kiện của tài khoản. Đồng thời lưu trạng thái HTTP, header phản hồi và lỗi đã ẩn dữ liệu nhạy cảm mà ứng dụng khách nhận được."
          }
        ]
      },
      {
        "id": "filter-requests",
        "title": "Yêu cầu lọc",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Chọn phạm vi thời gian",
                "body": "Chọn một phạm vi bao gồm thời gian yêu cầu và xác nhận múi giờ được sử dụng bởi dấu thời gian của nhật ký và ứng dụng khách."
              },
              {
                "title": "Chọn mẫu",
                "body": "Sử dụng bộ lọc mô hình để thu hẹp kết quả. ID mô hình phải khớp chính xác với giá trị yêu cầu."
              },
              {
                "title": "Tìm kiếm theo tên khóa",
                "body": "Mở menu trường tìm kiếm chính xác, chọn tên khóa API và nhập tên hiển thị trong nhật ký. Không nhập giá trị khóa."
              },
              {
                "title": "Tìm kiếm theo ID yêu cầu",
                "body": "Mở menu trường tìm kiếm chính xác, chọn ID yêu cầu và nhập ID yêu cầu đầy đủ."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Chỉ sử dụng các điều kiện cần thiết để định vị bản ghi. Nếu không có kết quả, trước tiên hãy kiểm tra phạm vi thời gian, múi giờ và giá trị chính xác.",
              "Xóa các bộ lọc không áp dụng trước khi tìm kiếm lại để điều kiện cũ không loại trừ bản ghi."
            ]
          }
        ]
      },
      {
        "id": "review-results",
        "title": "Xem lại kết quả và các khoản khấu trừ",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Loại và lỗi: dùng loại để phân biệt sự kiện sử dụng với sự kiện lỗi. Với sự kiện lỗi, hãy đối chiếu thời gian và ID yêu cầu với trạng thái HTTP và lỗi đã ẩn dữ liệu nhạy cảm do ứng dụng khách lưu giữ.",
              "Token: xem lại token đầu vào, đầu ra và token được lưu trong bộ nhớ đệm. Không tính các trường bị thiếu hoặc không áp dụng.",
              "Chi phí: xem xét chi phí ghi lại và tổng chi phí đã lọc, sau đó so sánh chúng với khoản khấu trừ tài khoản.",
              "Thời lượng: xem lại tổng thời lượng. Lệnh gọi phát trực tuyến cũng có thể hiển thị thời gian đến token đầu tiên.",
              "Chi tiết: mở bản ghi khớp và xác nhận rằng ID yêu cầu, thời gian, mô hình, tên khóa, mã thông báo, chi phí và thời lượng thuộc cùng một lệnh gọi."
            ]
          },
          {
            "type": "callout",
            "tone": "info",
            "title": "Một bản ghi không phải là bằng chứng của sự thành công",
            "body": "Nhật ký có thể chứa sự kiện sử dụng, lỗi hoặc sự kiện tài khoản khác. Hãy kết hợp loại sự kiện, kết quả phía ứng dụng khách và khoản khấu trừ thực tế để xác định kết quả."
          }
        ]
      },
      {
        "id": "handle-failures",
        "title": "Xử lý lỗi và hết thời gian chờ",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Tương quan với bản ghi bị lỗi",
                "body": "Dùng thời gian, mô hình, tên khóa và ID yêu cầu chính xác, sau đó so sánh bản ghi với trạng thái HTTP của ứng dụng khách và lỗi đã ẩn dữ liệu nhạy cảm."
              },
              {
                "title": "Kiểm tra xem việc sử dụng có được ghi lại hay không",
                "body": "Xem lại mã thông báo, chi phí và thời lượng để xác định xem yêu cầu có để lại bản ghi thực thi và khấu trừ hay không."
              },
              {
                "title": "Xử lý việc hủy hoặc hết thời gian một cách cẩn thận",
                "body": "Việc hủy hoặc hết thời gian chờ không chứng tỏ rằng quá trình xử lý đã dừng. Xem lại nhật ký và các khoản khấu trừ trước khi thử lại."
              },
              {
                "title": "Chuẩn bị thông tin hỗ trợ",
                "body": "Nếu kết quả vẫn chưa rõ ràng, hãy giữ nguyên phạm vi thời gian, múi giờ và bộ lọc tìm kiếm, sau đó mở Liên hệ hỗ trợ."
              }
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Không tìm kiếm với",
            "body": "Lọc theo tên khóa, không phải khóa API hoàn chỉnh. Trước khi báo cáo sự cố, hãy xóa thông tin xác thực, thông tin cá nhân, lời nhắc đầy đủ và các tệp riêng tư."
          }
        ]
      }
    ]
  },
  "contact-support": {
    "id": "contact-support",
    "summary": "Sau khi tự kiểm tra, hãy gửi báo cáo có thể đối chiếu và đã ẩn dữ liệu nhạy cảm qua kênh hỗ trợ Email hoặc Telegram của Partokens.",
    "sections": [
      {
        "id": "check-before-contact",
        "title": "Hoàn thành kiểm tra trước khi tiếp xúc",
        "blocks": [
          {
            "type": "steps",
            "items": [
              {
                "title": "Tái tạo",
                "body": "Đối với sự cố API, hãy chạy kiểm tra tối thiểu trong Kết nối, giới hạn và thử lại, đồng thời ghi lại trạng thái HTTP thực tế."
              },
              {
                "title": "Kiểm tra mô hình và tài khoản",
                "body": "Xác nhận rằng mô hình đến từ danh sách hiện tại, sau đó kiểm tra trạng thái khóa, quyền truy cập và thông tin tài khoản hiện tại."
              },
              {
                "title": "Tìm kiếm nhật ký sử dụng",
                "body": "Tìm kiếm theo thời gian, mô hình, tên khóa và ID yêu cầu, sau đó xem xét mã thông báo, chi phí và thời lượng."
              },
              {
                "title": "Xác nhận rằng vẫn cần trợ giúp",
                "body": "Nêu rõ các bước kiểm tra đã hoàn thành, kết quả mong đợi và kết quả thực tế thay vì chỉ báo cáo rằng có điều gì đó không khả dụng."
              }
            ]
          },
          {
            "type": "list",
            "items": [
              "Sự cố đăng nhập hoặc tài khoản: lưu lại trang, thời gian và múi giờ chính xác cùng lỗi đã ẩn dữ liệu nhạy cảm.",
              "API: giữ điểm cuối, mô hình, trạng thái HTTP và ID yêu cầu.",
              "Hủy hoặc hết thời gian chờ: trước tiên nêu rõ liệu nhật ký sử dụng có chứa bản ghi và khoản khấu trừ hay không."
            ]
          }
        ]
      },
      {
        "id": "prepare-diagnostics",
        "title": "Chuẩn bị thông tin chẩn đoán",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Thời gian và múi giờ chính xác của yêu cầu hoặc vấn đề.",
              "ID mô hình chính xác được yêu cầu sử dụng.",
              "API nơi xảy ra sự cố.",
              "Trạng thái HTTP thực tế hoặc một tuyên bố rõ ràng rằng không có phản hồi nào.",
              "ID yêu cầu hoàn chỉnh hoặc một tuyên bố rõ ràng rằng không có yêu cầu nào được trả lại.",
              "Nội dung lỗi đã ẩn dữ liệu nhạy cảm nhưng vẫn giữ nguyên ý nghĩa sự cố.",
              "Các bước tái tạo tối thiểu, kết quả mong đợi và kết quả thực tế.",
              "Liệu có tìm thấy bản ghi nhật ký Sử dụng phù hợp hay không, bao gồm mã thông báo, chi phí và thời lượng được xem xét."
            ]
          }
        ]
      },
      {
        "id": "remove-sensitive-data",
        "title": "Xóa dữ liệu nhạy cảm",
        "blocks": [
          {
            "type": "list",
            "items": [
              "Không gửi khóa API hoặc bất kỳ thông tin xác thực truy cập nào khác.",
              "Không gửi mật khẩu, mã xác minh, mã khôi phục, cookie hoặc mã thông báo phiên.",
              "Không gửi tên, địa chỉ email, số điện thoại, địa chỉ, chi tiết danh tính hoặc thông tin cá nhân khác.",
              "Không gửi lời nhắc hoàn chỉnh, nội dung yêu cầu hoàn chỉnh hoặc nội dung thô không liên quan đến việc sao chép.",
              "Không gửi tệp riêng tư, URL tải xuống riêng tư, giá trị Base64 lớn hoặc xuất nhật ký chưa được xem xét."
            ]
          },
          {
            "type": "callout",
            "tone": "warning",
            "title": "Xoay khóa trước khi báo cáo nghi ngờ phơi nhiễm",
            "body": "Vô hiệu hóa hoặc xóa khóa bị ảnh hưởng ngay lập tức, tạo và xác minh khóa thay thế, sau đó cập nhật mọi dịch vụ đang dùng khóa. Không gửi khóa cũ đến kênh hỗ trợ."
          }
        ]
      },
      {
        "id": "use-official-channels",
        "title": "Sử dụng các kênh hỗ trợ chính thức",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Chọn kênh hỗ trợ công cộng bên dưới và bao gồm thông tin chẩn đoán tối thiểu đã được biên tập lại trong tin nhắn đầu tiên. Tài liệu không hứa hẹn phản hồi hoặc thời gian giải quyết."
          },
          {
            "type": "links",
            "items": [
              {
                "label": "Email hỗ trợ",
                "href": "mailto:support@partokens.com"
              },
              {
                "label": "bot hỗ trợ Telegram",
                "href": "https://t.me/PartokensSupportBot"
              }
            ]
          }
        ]
      }
    ]
  }
}
