# R4 开发会话提示词

复制下面内容到新的开发会话，只替换 `本期任务` 和 `任务文档`。

```text
你负责实现 Partokens 本期任务。

本期任务：R4.x <页面组名称>
任务文档：ui-planning/r4-implementation-tasks/<任务文件>.md

执行要求：
1. 先阅读任务文档、00-scope-and-foundation.md，以及对应的 design-lab 活跃实现，再检查 apps/web 当前代码和 API client。
2. design-lab 是唯一视觉与页面布局真源，严格沿用其结构、间距、字体、颜色、组件状态、明暗主题和响应式行为。任何必要调整先说明原因、影响范围和最小方案，等待确认后再改。
3. 只修改 partokens-ui 生产前端及必要的共享包；new-api/ 和 new-api-docs-v1/ 只读，禁止修改。
4. API 调用以 new-api 项目前端和 API 契约为准，通过 packages/api-client 或对应适配层接入，不在页面里直接拼接请求。
5. 所有用户可见文字支持 zh-CN、zh-TW、en、ja、ru、fr、vi 七种语言，不用硬编码英文作为完成状态。
6. 严格区分服务端数据和浏览器本地数据；不得持久化密码、验证码、OAuth 凭证、Bearer token、完整 API key 或敏感原始响应。
7. 保留 loading、success、empty、partial、error、offline、401、403、mutation pending 等真实状态，并保持 design-lab 布局稳定。
8. 完成页面级验收后清理被替换的旧组件、旧样式、重复 helper 和临时分支，不保留长期运行的新旧双版本；不要删除仍被引用的兼容路由或本地数据迁移。

工作顺序：
1. 汇报当前代码状态、设计来源、API 依赖、已有实现和阻塞项。
2. 给出本期最小实施计划，然后直接实现，不做无关重构。
3. 运行类型检查、相关单元/契约测试、生产构建和必要的 E2E/截图检查。
4. 最后汇报修改文件、API 交互、i18n 覆盖、清理内容、验证结果和未解决风险。

本期完成标准以任务文档为准；没有完成验证或发现设计偏差时，不要声称已完成。
```

## 期次示例

```text
本期任务：R4.3 控制台数据页面
任务文档：ui-planning/r4-implementation-tasks/03-console-data.md
```

对应文件：

- R4.1：`01-public-content.md`
- R4.2：`02-authentication.md`
- R4.3：`03-console-data.md`
- R4.4：`04-account.md`
- R4.5：`05-playground.md`
- R4.6：`06-image-studio.md`
- R4.7：`07-cross-page-i18n-and-api-qa.md`
