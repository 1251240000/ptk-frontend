# Partokens SMTP Brevo Proxy

该服务在本地提供一个受限 SMTP 入口，接收 New API 生成的邮箱验证与密码重置邮件，从 MIME 正文中解析 6 位十六进制验证码或受信任的重置链接，渲染 Partokens 英文邮件模板，再通过 Brevo Transactional Email API 发送。

示例输入正文：

```text
您好，你正在进行Partokens邮箱验证。

您的验证码为: ffa926

验证码 10 分钟内有效，如果不是本人操作，请忽略。
```

最终主题为：

```text
ffa926 is your Partokens verification code
```

验证码位于主题开头，用户无需打开邮件即可看到。

密码重置邮件支持 New API 当前生成的 `/user/reset?email=...&token=...` 格式。代理会保留完整链接并生成主题 `Reset your Partokens password`，但仅接受 `http/https`、32 位十六进制 token、固定路径和已配置主机的链接。

## 部署

1. 在 Brevo 中验证发件域名或发件邮箱。
2. 创建 Brevo Transactional Email API Key。
3. 复制配置并填写真实值：

```bash
cp .env.example .env
```

4. 启动服务：

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f smtp-brevo-proxy
```

默认只发布到宿主机 `127.0.0.1:2525`，不要将未认证的 SMTP 端口直接暴露到公网。

## New API 配置

New API 直接运行在宿主机时：

| 配置 | 值 |
| --- | --- |
| SMTP Server | `127.0.0.1` |
| SMTP Port | `2525` |
| SMTP From | `no-reply@partokens.com` |
| SMTP Account | 留空 |
| SMTP Token | 留空 |
| SMTP SSL | 关闭 |
| SMTP STARTTLS | 关闭 |

`SMTP From` 的域名必须包含在 `SMTP_ALLOWED_SENDER_DOMAINS` 中。

New API 运行在 Docker 容器时，将它连接到本项目创建的 `smtp-proxy` 网络：

```bash
docker network connect smtp-proxy <new-api-container>
```

随后将 SMTP Server 配置为 `smtp-brevo-proxy`，端口仍为 `2525`。也可以在 New API 的 Compose 文件中直接声明同名 external network。

## 配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `BREVO_API_KEY` | 无 | 必填，Brevo API Key |
| `BREVO_SENDER_EMAIL` | 无 | 必填，Brevo 已验证发件邮箱 |
| `BREVO_SENDER_NAME` | `Partokens` | 发件人名称 |
| `SMTP_ALLOWED_SENDER_DOMAINS` | `partokens.com` | 允许的 envelope sender 域名，逗号分隔 |
| `SMTP_MAX_RECIPIENTS` | `1` | 单封邮件最大 envelope 收件人数 |
| `SMTP_MAX_MESSAGE_BYTES` | `1048576` | 最大 SMTP DATA 字节数 |
| `PASSWORD_RESET_ALLOWED_HOSTS` | `partokens.com` | 允许出现在密码重置链接中的精确主机名，逗号分隔；预发布环境需加入其独立主机名 |
| `EMAIL_SUBJECT_TEMPLATE` | `{code} is your Partokens verification code` | 英文主题，必须包含 `{code}` |
| `BREVO_TIMEOUT_SECONDS` | `10` | Brevo API 超时 |
| `LOG_LEVEL` | `INFO` | 日志级别 |

## SMTP 响应语义

- 无法解析验证码/受信任的重置链接、非法发件域名或收件人数超限：返回永久错误 `550`。
- Brevo 网络错误、限流或 5xx：返回临时错误 `451`，上游 SMTP 客户端可重试。
- Brevo 成功接受：返回 `250`。

日志不记录验证码、API Key 或完整收件地址。

## 本地验证

安装依赖并运行测试：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m unittest discover -s tests -v
```

服务启动后，可发送一封与 New API 格式一致的样例邮件：

```bash
python3 scripts/send_sample.py --to you@example.com
```

该命令会触发真实 Brevo 发送，请使用可接收测试邮件的地址。

发送与 New API 当前格式一致的密码重置样例：

```bash
python3 scripts/send_sample.py --kind password-reset --to you@example.com
```

该命令同样会触发真实 Brevo 发送。样例链接使用 `partokens.com` 和固定的非生产 token，仅用于验证代理重写流程。

## 客服通知邮件

`templates/customer-service-notice.html` 和对应的纯文本模板用于服务恢复及账户补偿通知。推送脚本默认从项目根目录的 `.env` 读取 Brevo 配置，并使用 `$100`、`8 hours`、`August 4, 2026` 作为模板参数：

```bash
.venv/bin/python scripts/send_customer_notice.py --to user@example.com
```

该脚本直接调用 Brevo Transactional Email API，不经过只接受验证码邮件的本地 SMTP 入口。可通过 `--subject`、`--credit`、`--duration` 和 `--date` 覆盖默认通知内容；执行命令会真实发送邮件。
