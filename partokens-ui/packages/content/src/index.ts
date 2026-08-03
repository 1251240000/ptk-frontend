import type { AppLocale } from '@partokens/i18n'

export const brandLogoUrl = 'https://oss.partokens.com/assets/icons/favicon-96x96.png'

export type ReviewState = 'draft' | 'reviewed'
export type LegalKind = 'user-agreement' | 'service-agreement' | 'privacy-policy'

export type LegalDocument = {
  kind: LegalKind
  title: string
  summary: string
  effectiveDate: string
  reviewState: ReviewState
  sections: Array<{ title: string; paragraphs: string[] }>
}

type LocaleContent = {
  aboutTitle: string
  aboutLead: string
  aboutBody: string
  noticeTitle: string
  noticeBody: string
  legal: Record<LegalKind, Omit<LegalDocument, 'kind' | 'effectiveDate' | 'reviewState'>>
}

const content: Record<AppLocale, LocaleContent> = {
  'zh-CN': {
    aboutTitle: '让模型调用变得可度量',
    aboutLead: 'Partokens 为开发者提供统一的模型访问入口，并把价格、状态、额度与调用记录放在同一个操作界面中。',
    aboutBody: '我们关注请求是否能够成功、实际消耗了多少，以及账户是否可以继续稳定运行。新用户端与 New API 管理后台相互独立，服务端仍负责认证、计费、额度与模型路由。',
    noticeTitle: '新版用户端正在独立构建',
    noticeBody: '第一阶段包含新的公开页面、认证流程和统一控制台体验。现有 API 服务不受影响。',
    legal: {
      'user-agreement': {
        title: '用户协议',
        summary: '本协议适用于你访问或使用 Partokens 的网站、账号、API Key、模型路由、支付、额度、管理后台以及相关服务功能。',
        sections: [
          { title: '接受条款与适用范围', paragraphs: [
            '本服务条款适用于你访问或使用 Partokens 的网站、账号、API Key、模型路由、支付、额度、管理后台以及相关服务功能。你注册、登录、创建 API Key、充值、购买套餐或实际使用服务，即表示你同意本条款。',
            '如果你代表组织、公司或其他主体使用 Partokens，你确认自己有权代表该主体接受本条款；如果你不同意本条款或无权代表该主体，请停止使用服务。',
          ] },
          { title: '服务内容与上游能力', paragraphs: [
            'Partokens 提供 AI 访问与管理层能力，可能根据配置将请求转发至第三方模型提供商、云平台、支付渠道、身份服务商或其他基础设施。',
            '第三方模型、API、支持区域、价格、安全策略、限流规则、文档和可用性由其提供方控制。上游变更、故障、模型下线、策略拦截、价格调整或服务暂停，都可能影响你对 Partokens 的使用。',
          ] },
          { title: '支持的地区范围', paragraphs: [
            'Partokens 当前仅面向以下地区范围内的用户提供服务。我们可能根据适用法律法规、上游提供方政策、支付渠道要求、合规审查结果或风险控制需要，随时调整、限制或暂停特定地区的访问或使用。',
            '阿尔巴尼亚、阿尔及利亚、安道尔、安哥拉、安提瓜和巴布达、阿根廷、亚美尼亚、澳大利亚、奥地利、阿塞拜疆、巴哈马、巴林、孟加拉国、巴巴多斯、比利时、伯利兹、贝宁、不丹、玻利维亚、波斯尼亚和黑塞哥维那、博茨瓦纳、巴西、文莱、保加利亚、布基纳法索、布隆迪、佛得角、柬埔寨、喀麦隆、加拿大、乍得、智利、哥伦比亚、科摩罗、刚果（布拉柴维尔）、哥斯达黎加、科特迪瓦、克罗地亚、塞浦路斯、捷克、丹麦、吉布提、多米尼克、多米尼加共和国、厄瓜多尔、埃及、萨尔瓦多、赤道几内亚、爱沙尼亚、斯威士兰、斐济、芬兰、法国、加蓬、冈比亚、格鲁吉亚、德国、加纳、希腊、格林纳达、危地马拉、几内亚、几内亚比绍、圭亚那、海地、洪都拉斯、匈牙利、冰岛、印度、印度尼西亚、伊拉克、爱尔兰、以色列、意大利、牙买加、日本、约旦、哈萨克斯坦、肯尼亚、基里巴斯、科威特、吉尔吉斯斯坦、老挝、拉脱维亚、黎巴嫩、莱索托、利比里亚、列支敦士登、立陶宛、卢森堡、马达加斯加、马拉维、马来西亚、马尔代夫、马耳他、马绍尔群岛、毛里塔尼亚、毛里求斯、墨西哥、密克罗尼西亚、摩尔多瓦、摩纳哥、蒙古、黑山、摩洛哥、莫桑比克、纳米比亚、瑙鲁、尼泊尔、荷兰、新西兰、尼日尔、尼日利亚、北马其顿、挪威、阿曼、巴基斯坦、帕劳、巴勒斯坦、巴拿马、巴布亚新几内亚、巴拉圭、秘鲁、菲律宾、波兰、葡萄牙、卡塔尔、罗马尼亚、卢旺达、圣基茨和尼维斯、圣卢西亚、圣文森特和格林纳丁斯、萨摩亚、圣马力诺、圣多美和普林西比、沙特阿拉伯、塞内加尔、塞尔维亚、塞舌尔、塞拉利昂、新加坡、斯洛伐克、斯洛文尼亚、所罗门群岛、南非、韩国、西班牙、斯里兰卡、苏里南、瑞典、瑞士、中国台湾、塔吉克斯坦、坦桑尼亚、泰国、东帝汶、多哥、汤加、特立尼达和多巴哥、突尼斯、土耳其、土库曼斯坦、图瓦卢、乌干达、乌克兰（除克里米亚、顿涅茨克、赫尔松、卢甘斯克和扎波罗热地区外）、阿拉伯联合酋长国、英国、美利坚合众国、乌拉圭、乌兹别克斯坦、瓦努阿图、梵蒂冈城、越南、赞比亚、津巴布韦。',
          ] },
          { title: '账号、凭据与用户责任', paragraphs: [
            '你需要对自己账号、组织、API Key、访问令牌、受邀用户和集成应用下发生的全部活动负责。请妥善保管凭据；如发现泄露、未授权访问或异常使用，应及时联系服务运营方。',
            '管理员可以配置套餐、额度、分组、模型权限、计费规则和用户权限。你有责任确保你的用户、员工、承包商、客户和下游集成方遵守本条款。',
          ] },
          { title: '客户内容与 AI 输出', paragraphs: [
            '你保留对通过服务提交的提示词、文件、消息、代码、指令及其他内容依法享有的权利。在遵守本条款和适用法律的前提下，你可以使用基于你提交内容生成的输出。',
            'Partokens 不主张拥有你提交内容或生成输出的所有权。为计费、安全、故障排查、合规和审计目的，系统可能保留模型名称、token 用量、费用、时间戳、账号标识、请求状态、错误信息等运行元数据。',
            'AI 输出可能不准确、不完整、过时、不安全或不适合你的具体场景。你在依赖、发布、投产或用于影响权利、安全、财务、法律义务、健康等事项前，应自行审查并承担判断责任。',
          ] },
          { title: '可接受使用', paragraphs: [
            '你只能将 Partokens 用于合法、授权且符合平台政策的目的。不得利用服务生成、传播或协助制作色情/NSFW、性剥削、暴力血腥、恐怖主义或极端主义、仇恨或歧视、骚扰威胁、儿童不安全内容、自残诱导、诈骗钓鱼、违法交易、恶意代码、绕过安全措施、侵犯隐私或人肉搜索等内容。',
            '不得利用 Partokens 生成深度伪造、冒充他人、误导性身份或未经授权的肖像、声音、商标、版权作品、商业秘密或其他侵权内容；不得提交违法、侵权、欺诈、骚扰、滥用、侵犯隐私、危害安全或可能损害他人权益的内容。',
            '你不得绕过访问控制、规避限流、探测或干扰系统、抓取或批量提取服务行为、逆向工程受保护组件、共享未授权凭据，或在未经书面许可的情况下利用服务构建、训练、蒸馏、评测、对标或改进竞争模型或竞争服务。',
            '如果你将 Partokens 嵌入自己的产品、机器人、插件、工作流、网站或面向用户的服务，你需要向用户提供必要披露、内容审核和投诉处置机制，并对下游用户的使用和合规负责。',
            '如我们合理认为存在违规、滥用或安全风险，可以拒绝或过滤请求、限制模型或通道、暂停 API Key、封禁账号、收回或清零违规相关额度、拒绝退款、保留审计证据，并在法律要求时向主管机关或权利人报告。',
          ] },
          { title: '费用、余额与退款', paragraphs: [
            '付费功能可能消耗预付余额、订阅额度、兑换权益或其他套餐权益。除非另有书面约定，服务中展示的用量记录、模型价格、套餐限制、支付说明和账号余额，是计费与结算的主要依据。',
            '价格、支付方式、汇率或换算规则、赠送额度和套餐权益可能向后调整。除非明确说明，税费、银行费用、链上转账费用、拒付成本及其他第三方费用由你自行承担。',
            '退款申请将按具体情况审核。已消耗用量、已过期权益、促销额度、赠送额度、因金额错误、地址错误或网络错误造成的损失、违反政策、滥用服务或因违约被限制账号产生的费用，通常不予退还。处理退款前，我们可能要求你提供付款凭证、身份验证材料以及与付款人一致的收款信息。',
          ] },
          { title: '可用性、安全与变更', paragraphs: [
            '为提升可靠性、保护安全、遵守法律或上游政策、管理容量、处理事故，或适应上游模型和业务变化，Partokens 可能更新、维护、限制、暂停或移除部分功能。',
            '我们会努力保持服务稳定，但不保证服务绝对不中断、延迟固定、特定模型永久可用、输出绝对无误，也不保证服务始终兼容所有客户端、地区、上游或集成方式。',
          ] },
          { title: '暂停与终止', paragraphs: [
            '如果我们合理认为存在安全风险、违法活动、违反政策、付款失败、异常用量、凭据泄露、上游限制，或对 Partokens、用户、上游提供方、第三方造成风险的其他情形，可以限制、降速、过滤、暂停或终止账号、API Key、请求、通道或功能访问。',
            '你可以随时停止使用服务。服务终止不影响已经产生的付款义务、用量费用、审计记录、合规责任、保密义务，以及按性质应继续有效的条款。',
          ] },
          { title: '知识产权与反馈', paragraphs: [
            '除为提供服务所必需的有限使用权外，本条款不转让任何一方的商标、代码、接口、文档、服务设计或其他知识产权。',
            '如果你向 Partokens 提供建议、需求、缺陷反馈或其他意见，除非另有书面约定，Partokens 可以将其用于改进服务，且无需向你支付费用或承担额外义务。',
          ] },
          { title: '保密与隐私', paragraphs: [
            '通过服务披露的非公开技术、业务、账号、安全、价格和客户信息，应被视为保密信息，并仅可在授权的服务目的范围内使用。',
            '个人信息和服务数据将根据《隐私政策》及适用法律处理。你向服务提交个人信息、保密信息、受监管数据或第三方数据前，应确保已取得必要权利、授权、同意和告知。',
          ] },
          { title: '免责声明与责任限制', paragraphs: [
            '在法律允许的最大范围内，Partokens 按“现状”和“可用”状态提供服务。除法律不允许排除的责任外，我们不对适销性、特定用途适用性、不侵权、持续可用或输出准确性作出默示保证。',
            '在法律允许的最大范围内，Partokens 及其运营方不对因使用服务产生的间接、偶然、特殊、惩罚性、利润损失、数据损失、业务中断、替代服务采购或第三方提供商相关损害承担责任。',
          ] },
          { title: '条款更新、通知与争议', paragraphs: [
            '我们可能不时更新本条款。重大变更将在发布或另行通知后向后适用；但因法律、安全、上游政策或服务完整性需要立即调整的除外。',
            '服务通知可以通过网站、账号控制台、电子邮件、站内消息或其他合理电子方式发送。发生争议时，各方应先与服务运营方善意沟通；无法解决的，除强制性法律另有规定外，按适用法律由服务运营方所在地有管辖权的机构或法院处理。',
          ] },
          { title: '联系我们', paragraphs: [
            '使用服务前，请先阅读公开法律文档。',
            'support@partokens.com',
          ] },
        ],
      },
      'service-agreement': {
        title: '服务协议',
        summary: '本协议说明 Partokens 的服务内容、交付方式、计费规则、可用性边界与支持流程。',
        sections: [
          { title: '协议定位与适用范围', paragraphs: [
            '本服务协议适用于 Partokens 向你提供的网站、控制台、API Key、模型路由、额度管理、支付结算、调用记录及相关服务功能。你使用上述功能，即表示你同意按照本协议接受服务。',
            '本协议是《用户协议》的补充文件。《用户协议》规定账号责任、可接受使用、知识产权、免责声明与责任限制；《隐私政策》说明个人信息和服务数据的处理方式。三份文件共同构成你使用 Partokens 的服务规则。',
          ] },
          { title: '服务内容与交付方式', paragraphs: [
            'Partokens 提供 AI 访问与管理层能力，包括统一 API 网关、模型路由、API Key 管理、额度与余额展示、用量记录、支付或兑换入口，以及对话、生图等用户工具。具体开放功能以你的账号权限和服务实时配置为准。',
            '服务通过网站、账号控制台和 API 提供。不同账号、分组、套餐、地区或接入方式可获得的模型、限额、并发、速率和功能可能不同；控制台与接口返回的当前配置是判断可用范围的主要依据。',
          ] },
          { title: '上游模型与第三方依赖', paragraphs: [
            'Partokens 可能根据配置将请求转发至第三方模型提供商、云平台、支付渠道、身份服务商、邮件或消息服务及其他基础设施。相关第三方不因本协议成为你的代理人或 Partokens 的雇员。',
            '第三方模型、API、支持地区、价格、安全策略、限流规则和可用性由其提供方控制。上游故障、模型下线、策略拦截、价格调整、区域限制或服务暂停，可能导致请求失败、延迟增加、能力变化或暂时不可用。',
          ] },
          { title: '账号、API Key 与访问控制', paragraphs: [
            '你应使用自己的账号访问服务，并妥善保管密码、API Key、访问令牌和其他凭据。API Key 应按实际用途设置模型范围、额度、有效期和其他可用限制，不应以公开代码、客户端日志或其他不安全方式披露。',
            '账号管理员可以配置成员、分组、套餐、额度、模型权限和计费规则。账号或组织下发起的请求、产生的用量与费用，由相应账号持有人或组织管理员负责；发现凭据泄露、异常请求或未授权使用时，应立即轮换凭据并联系服务运营方。',
          ] },
          { title: '模型路由、请求与输出', paragraphs: [
            '系统会依据请求参数、账号权限、模型可用性、上游状态和服务配置选择路由。模型名称相同并不保证始终由同一上游、同一版本或同一基础设施处理；实际路由和响应以服务端记录为准。',
            '你应确保提示词、文件、消息、代码和其他输入内容合法且已取得必要权利。AI 输出可能不准确、不完整、过时或不适合特定用途，你应在发布、投产或用于影响权利、安全、财务、法律义务和健康等事项前自行审查。',
            '请求可能因内容安全、上游政策、地区限制、账号权限、余额不足、速率限制、参数错误或系统风险被拒绝、过滤、降级或中止。此类处理不保证能够识别全部违法、不当或不安全内容。',
          ] },
          { title: '额度、计费与结算', paragraphs: [
            '付费请求可能消耗预付余额、订阅额度、兑换权益或其他套餐权益。费用通常按照实际路由、模型价格、输入与输出 token、图片或任务数量、倍率及其他计量单位计算。',
            '控制台展示的价格、倍率和估算仅用于帮助你理解成本；最终用量、费用、余额变动和结算结果以服务端记录为准。因网络重试、流式响应、中止请求或上游计量规则产生的费用，按实际已处理用量计算。',
            '你应及时核对用量和余额记录。如认为存在明显计费错误，应在发现后尽快提供请求标识、发生时间和相关证据，以便服务运营方核查。',
          ] },
          { title: '充值、套餐与退款', paragraphs: [
            '充值金额、套餐价格、支付方式、汇率或换算规则、赠送额度、有效期和使用限制，以支付确认页、订单记录和服务端结果为准。税费、银行费用、链上转账费用、拒付成本及其他第三方费用，除非另有明确说明，由你自行承担。',
            '退款申请按具体情况审核。已消耗用量、已过期权益、促销或赠送额度、因金额错误、地址错误或网络错误造成的损失，以及违反政策、滥用服务或违约产生的费用，通常不予退还。',
            '处理退款、拒付或账务争议前，我们可能要求付款凭证、身份验证材料、订单信息和与付款人一致的收款资料。退款完成时间还可能受支付渠道处理周期影响。',
          ] },
          { title: '可用性、维护与服务状态', paragraphs: [
            '我们会采取合理措施维护服务稳定与安全，但不承诺服务绝对不中断、延迟固定、特定模型永久可用、输出绝对无误，或始终兼容所有客户端、地区、上游和集成方式。',
            '为维护系统、处理故障、管理容量、修复安全问题、遵守法律或上游政策，Partokens 可以安排维护、调整路由、限制流量、暂时关闭部分能力或进行紧急变更。紧急情况下可能无法提前通知。',
            '公开状态页面仅反映状态接口当时能够确认的信息，不构成历史可用率、恢复时间、单个模型状态或服务等级承诺。',
          ] },
          { title: '安全、风控与异常处理', paragraphs: [
            '为保护用户、平台和上游提供方，Partokens 可以进行身份验证、访问控制、速率限制、滥用检测、内容安全审查、欺诈防范、异常请求分析和审计留痕。',
            '如果我们合理认为存在凭据泄露、攻击、违法活动、付款风险、异常用量、违反政策或其他安全风险，可以拒绝或过滤请求、限制模型或通道、降速、暂停 API Key、冻结部分功能或要求额外验证。',
            '发生安全事件或服务故障时，你应保留相关请求标识、错误信息和发生时间，并避免重复提交可能扩大损失的请求。双方应在合理范围内配合调查、止损和恢复。',
          ] },
          { title: '数据处理与隐私边界', paragraphs: [
            '为提供鉴权、路由、计费、安全、故障排查、合规和审计能力，系统可能处理账号标识、模型名称、token 用量、费用、时间戳、请求状态、错误信息、网络与设备安全信号等必要数据。具体处理规则以《隐私政策》为准。',
            '当你调用第三方 AI 模型、支付或身份服务时，请求内容、输入文件、用量元数据、订单信息或账号标识可能会发送给相应提供方。你应在提交个人信息、保密信息、受监管数据或第三方数据前取得必要权利、授权、同意和告知。',
            '产品明确标注为本地保存的对话或画布数据，默认保存在当前设备或浏览器；当你发起模型请求时，必要输入仍会通过服务网关传输至所选模型提供方。',
          ] },
          { title: '服务变更、暂停与终止', paragraphs: [
            'Partokens 可以根据业务、技术、法律、安全、容量或上游变化更新、增加、限制、暂停或移除部分服务功能，并可以调整模型目录、路由、价格、倍率、限额和支持地区。对你产生重大影响的变更，将通过合理方式发布或通知。',
            '如出现安全风险、违法活动、违反政策、付款失败、异常用量、凭据泄露、上游限制或其他可能损害 Partokens、用户或第三方的情形，我们可以暂停或终止账号、API Key、请求、通道或功能访问。',
            '服务暂停或终止不影响已经产生的付款义务、用量费用、审计记录、合规责任、保密义务，以及根据其性质应继续有效的用户协议或服务协议条款。',
          ] },
          { title: '服务支持与问题处理', paragraphs: [
            '你可以通过公开支持渠道咨询账号访问、计费记录、API 接入、异常请求和服务故障。为定位问题，我们可能要求你提供账号标识、请求标识、发生时间、错误信息和可复现步骤，但请勿发送完整 API Key、密码或不必要的敏感数据。',
            '支持响应时间会受到问题复杂度、请求量、上游协作和安全审查影响。除非另有书面服务等级协议，支持渠道和预计响应时间不构成固定时限承诺。',
            '联系邮箱：support@partokens.com。',
          ] },
          { title: '协议更新与文件关系', paragraphs: [
            '我们可能不时更新本协议。重大变更将在发布或另行通知后向后适用；但因法律、安全、上游政策或服务完整性需要立即调整的除外。继续使用服务前，你可以查看新的生效日期和变更内容。',
            '本协议未约定的账号责任、使用限制、知识产权、免责声明、责任限制、通知和争议事项，适用《用户协议》；个人信息和服务数据处理事项适用《隐私政策》。如不同文件对同一事项有特别约定，以针对该事项更具体且依法有效的约定为准。',
          ] },
        ],
      },
      'privacy-policy': {
        title: '隐私政策',
        summary: '本政策说明 Partokens 如何处理账号访问、服务使用和基本合规要求。',
        sections: [
          { title: '我们收集的信息', paragraphs: [
            'Partokens 可能收集你主动提交的姓名或显示名称、邮箱、用户名、账号密码认证信息（以哈希等安全形式保存）、联系方式、支持工单内容，以及注册、登录、邀请、账号设置和安全验证过程中产生的信息。',
            '为提供服务和计费结算，我们可能处理 API Key 标识、请求时间、模型名称、token 用量、费用、余额变动、订单号、支付状态、交易流水号、付款渠道返回的必要信息、设备与浏览器信号、IP 地址、登录记录、风控记录和错误日志。我们通常不会直接保存完整银行卡号等敏感支付凭据；此类信息由支付服务商按其规则处理。',
            '当你使用 AI 模型路由、文本生成、生图或其他接口时，系统可能处理提示词、输入文件、请求参数、响应状态、模型输出、上游错误信息和运行日志。请勿提交无权处理的个人信息、保密信息或受监管数据。',
          ] },
          { title: '信息的使用方式', paragraphs: [
            '我们使用个人信息和服务数据完成用户注册、登录鉴权、账号安全、API 访问控制、模型路由、额度扣减、订阅和订单处理、通知发送、客户支持、故障排查、账务核对和服务改进。',
            '我们也会使用运行数据进行风控、滥用检测、内容安全审查、欺诈防范、审计留痕、合规响应以及履行法律法规、监管要求或有效法律程序。',
          ] },
          { title: '存储、保护与保留', paragraphs: [
            'Partokens 仅在实现服务、计费、安全、审计和合规所需的期限内保存数据。账号、订单、用量、日志和风控记录会按业务和法律需要保留；超过必要期限后，我们会删除、匿名化或以其他合理方式处理。',
            '我们通过访问控制、最小权限、加密传输、凭据保护、日志审计、备份和内部授权管理保护数据安全。互联网服务无法保证绝对安全；如发现账号或 API Key 泄露，请立即更换凭据并联系我们。',
          ] },
          { title: '共享与委托处理', paragraphs: [
            '我们不会出售个人信息。仅在提供服务所必需或法律允许的范围内，向云基础设施、数据库、缓存、支付渠道、邮件或消息服务、风控安全、客户支持、审计合规和 AI 上游模型提供方共享或委托处理必要数据。',
            '当你调用第三方 AI 模型、支付或身份服务时，请求内容、用量元数据、订单信息或账号标识可能会被发送给相应提供方。我们会要求合作方按合同、平台政策和适用法律保护数据。',
          ] },
          { title: '你的权利与选择', paragraphs: [
            '在适用法律允许的范围内，你可以申请查阅、复制、更正、补充或删除个人信息，也可以申请撤回同意、注销账号、限制部分处理活动，或咨询个人信息处理规则。',
            '你可以在账号控制台更新部分资料、删除或轮换 API Key、停止使用服务，或通过 support@partokens.com 联系我们处理数据权利请求。为保护账号安全，处理查阅、更正、删除或注销前，我们可能要求进行身份验证。',
            '账号注销后，我们会停止提供账号服务，并按法律、账务、安全、争议处理和审计需要保留必要记录；不再需要保留的个人信息将被删除或匿名化。',
          ] },
        ],
      },
    },
  },
  'zh-TW': {
    aboutTitle: '讓模型呼叫變得可衡量',
    aboutLead: 'Partokens 為開發者提供統一的模型存取入口，並將價格、狀態、額度與呼叫記錄放在同一個操作介面中。',
    aboutBody: '我們關注請求能否成功、實際消耗多少，以及帳戶能否持續穩定運作。新使用者端與 New API 管理後台彼此獨立，伺服器仍負責驗證、計費、額度與模型路由。',
    noticeTitle: '新版使用者端正在獨立建置',
    noticeBody: '第一階段包含新的公開頁面、驗證流程與統一控制台體驗。現有 API 服務不受影響。',
    legal: {
      'user-agreement': { title: '使用者協議', summary: '本協議說明帳戶註冊、安全責任與使用 Partokens 時應遵守的基本規則。', sections: [
        { title: '帳戶與安全', paragraphs: ['你應提供真實有效的註冊資訊，並妥善保管密碼、API 金鑰與其他存取憑證。'] },
        { title: '合理使用', paragraphs: ['不得利用服務從事違法活動、侵害他人權益、規避服務限制或未經授權轉售上游能力。'] },
        { title: '協議更新', paragraphs: ['重大變更會透過版本化通知發布，並標示新的生效日期與變更內容。'] },
      ] },
      'service-agreement': { title: '服務協議', summary: '本協議說明模型存取、計費、可用性與服務支援的邊界。', sections: [
        { title: '服務範圍', paragraphs: ['Partokens 提供統一 API 閘道、帳戶額度管理、呼叫記錄與相關使用者工具。'] },
        { title: '計費與儲值', paragraphs: ['請求費用依實際路由、模型、倍率與用量計算，最終金額以伺服器計算為準。'] },
        { title: '可用性', paragraphs: ['模型能力依賴上游供應商，不承諾任何單一模型永久可用或完全不中斷。'] },
      ] },
      'privacy-policy': { title: '隱私權政策', summary: '本政策說明帳戶資料、呼叫資料與瀏覽器本機資料的處理方式。', sections: [
        { title: '帳戶與運行資料', paragraphs: ['為提供驗證、計費、安全與稽核能力，服務會處理必要的帳戶與呼叫統計資料。'] },
        { title: '本機對話記錄', paragraphs: ['對話歷史僅儲存在目前瀏覽器中。傳送訊息時，內容會經由閘道傳輸至所選模型供應商。'] },
        { title: '你的選擇', paragraphs: ['你可以管理個人資料、安全設定與本機對話資料，並依適用規則申請刪除帳戶。'] },
      ] },
    },
  },
  en: {
    aboutTitle: 'Model access you can measure',
    aboutLead: 'Partokens gives developers one model-access endpoint and puts price, status, quota, and request history in one operational surface.',
    aboutBody: 'The product centers on whether a request can succeed, what it actually consumed, and whether the account is ready to continue. The standalone user UI is independent from New API management; the server remains authoritative for authentication, billing, quota, and routing.',
    noticeTitle: 'The standalone user experience is in development',
    noticeBody: 'Phase one introduces new public pages, authentication flows, and a unified Console experience. Existing API service is unaffected.',
    legal: {
      'user-agreement': { title: 'User Agreement', summary: 'This agreement covers registration, account security, and the baseline rules for using Partokens.', sections: [
        { title: 'Account and security', paragraphs: ['Provide accurate registration information and protect passwords, API keys, and other credentials. Activity under an account is treated as activity of its holder.'] },
        { title: 'Acceptable use', paragraphs: ['Do not use the service for unlawful activity, infringement, circumvention of service limits, or unauthorized resale of upstream capabilities.'] },
        { title: 'Updates', paragraphs: ['Material changes are published as versioned notices with a new effective date and a readable description of the change.'] },
      ] },
      'service-agreement': { title: 'Terms of Service', summary: 'These terms describe the boundaries of model access, billing, availability, and support.', sections: [
        { title: 'Service scope', paragraphs: ['Partokens provides a unified API gateway, quota management, request records, and related user tools. Available models depend on live configuration.'] },
        { title: 'Billing and top-up', paragraphs: ['Request charges depend on actual routing, model, multipliers, and usage. Payment amounts are determined by the server confirmation result.'] },
        { title: 'Availability', paragraphs: ['Model capabilities depend on upstream providers. No individual model is guaranteed to remain permanently available or uninterrupted.'] },
      ] },
      'privacy-policy': { title: 'Privacy Policy', summary: 'This policy describes how account, request, and browser-local data are handled.', sections: [
        { title: 'Account and operational data', paragraphs: ['The service processes necessary account, usage, network, and security data for authentication, billing, safety, and audit functions.'] },
        { title: 'Local conversation history', paragraphs: ['Playground history stays in this browser and is not stored by Partokens. Submitted messages pass through the gateway to the selected model provider.'] },
        { title: 'Your choices', paragraphs: ['You can manage profile, security, and local conversation data and may request account deletion where applicable.'] },
      ] },
    },
  },
  ja: {
    aboutTitle: '測定できるモデルアクセス',
    aboutLead: 'Partokens はモデルへの統一された入口を提供し、料金、状態、割り当て、リクエスト履歴を一つの操作画面にまとめます。',
    aboutBody: 'リクエストが成功できるか、何を消費したか、アカウントが継続利用できるかを重視します。認証、課金、割り当て、ルーティングは引き続きサーバーが管理します。',
    noticeTitle: '新しいユーザー画面を独立して構築中です',
    noticeBody: '第1段階では公開ページ、認証フロー、統合されたコンソール体験を導入します。既存の API サービスには影響しません。',
    legal: {
      'user-agreement': { title: 'ユーザー契約', summary: '登録、アカウントの安全、Partokens 利用時の基本ルールを定めます。', sections: [
        { title: 'アカウントと安全', paragraphs: ['正確な登録情報を提供し、パスワード、API キー、その他の認証情報を適切に管理してください。'] },
        { title: '適正利用', paragraphs: ['違法行為、権利侵害、制限回避、上流機能の無断再販にサービスを使用してはいけません。'] },
        { title: '更新', paragraphs: ['重要な変更は、新しい施行日と変更内容を含むバージョン付き通知として公開します。'] },
      ] },
      'service-agreement': { title: 'サービス契約', summary: 'モデルアクセス、課金、可用性、サポートの範囲を説明します。', sections: [
        { title: 'サービス範囲', paragraphs: ['統一 API ゲートウェイ、割り当て管理、リクエスト履歴、関連ツールを提供します。'] },
        { title: '課金とチャージ', paragraphs: ['料金は実際のルート、モデル、倍率、使用量に基づき、サーバーの確認結果が最終値です。'] },
        { title: '可用性', paragraphs: ['モデル機能は上流提供者に依存し、永続的または中断のない提供を保証しません。'] },
      ] },
      'privacy-policy': { title: 'プライバシーポリシー', summary: 'アカウント、リクエスト、ブラウザ内データの扱いを説明します。', sections: [
        { title: 'アカウントと運用データ', paragraphs: ['認証、課金、安全、監査に必要なアカウント情報と利用統計を処理します。'] },
        { title: 'ローカル会話履歴', paragraphs: ['履歴はこのブラウザにのみ保存されます。送信内容は選択したモデル提供者へ転送されます。'] },
        { title: '利用者の選択', paragraphs: ['プロフィール、安全設定、ローカル履歴を管理し、適用条件に従って削除を申請できます。'] },
      ] },
    },
  },
  ru: {
    aboutTitle: 'Измеримый доступ к моделям',
    aboutLead: 'Partokens объединяет доступ к моделям и показывает стоимость, состояние, квоту и историю запросов в одном рабочем интерфейсе.',
    aboutBody: 'В центре внимания успешность запроса, фактический расход и готовность аккаунта продолжать работу. Сервер остаётся источником истины для входа, оплаты, квот и маршрутизации.',
    noticeTitle: 'Новый пользовательский интерфейс разрабатывается отдельно',
    noticeBody: 'Первый этап включает публичные страницы, вход и единую консоль. Работа существующего API не изменяется.',
    legal: {
      'user-agreement': { title: 'Пользовательское соглашение', summary: 'Правила регистрации, безопасности аккаунта и использования Partokens.', sections: [
        { title: 'Аккаунт и безопасность', paragraphs: ['Указывайте достоверные данные и защищайте пароль, ключи API и другие учётные данные.'] },
        { title: 'Допустимое использование', paragraphs: ['Запрещены незаконные действия, нарушение прав, обход ограничений и несанкционированная перепродажа возможностей.'] },
        { title: 'Обновления', paragraphs: ['Существенные изменения публикуются с номером версии, новой датой вступления и описанием.'] },
      ] },
      'service-agreement': { title: 'Условия обслуживания', summary: 'Границы доступа к моделям, оплаты, доступности и поддержки.', sections: [
        { title: 'Состав сервиса', paragraphs: ['Partokens предоставляет единый шлюз API, управление квотами, журнал запросов и пользовательские инструменты.'] },
        { title: 'Оплата', paragraphs: ['Стоимость зависит от маршрута, модели, коэффициентов и использования; итог определяет сервер.'] },
        { title: 'Доступность', paragraphs: ['Возможности зависят от внешних поставщиков, поэтому постоянная бесперебойная доступность не гарантируется.'] },
      ] },
      'privacy-policy': { title: 'Политика конфиденциальности', summary: 'Обработка данных аккаунта, запросов и локальных данных браузера.', sections: [
        { title: 'Данные аккаунта и работы', paragraphs: ['Для входа, оплаты, безопасности и аудита обрабатываются необходимые данные аккаунта и статистика.'] },
        { title: 'Локальная история диалогов', paragraphs: ['История хранится только в браузере. Отправленные сообщения передаются выбранному поставщику модели.'] },
        { title: 'Ваш выбор', paragraphs: ['Можно управлять профилем, безопасностью и локальной историей, а также запросить удаление аккаунта.'] },
      ] },
    },
  },
  fr: {
    aboutTitle: 'Un accès aux modèles que vous pouvez mesurer',
    aboutLead: 'Partokens réunit l’accès aux modèles et affiche prix, état, quota et historique dans une même interface opérationnelle.',
    aboutBody: 'Nous mettons en avant la réussite d’une requête, sa consommation réelle et la capacité du compte à continuer. Le serveur reste l’autorité pour l’authentification, la facturation, les quotas et le routage.',
    noticeTitle: 'La nouvelle expérience utilisateur est développée indépendamment',
    noticeBody: 'La première phase apporte les pages publiques, l’authentification et une expérience Console unifiée. Le service API existant reste inchangé.',
    legal: {
      'user-agreement': { title: 'Contrat utilisateur', summary: 'Règles d’inscription, de sécurité du compte et d’utilisation de Partokens.', sections: [
        { title: 'Compte et sécurité', paragraphs: ['Fournissez des informations exactes et protégez votre mot de passe, vos clés API et vos autres identifiants.'] },
        { title: 'Utilisation acceptable', paragraphs: ['Les activités illégales, les atteintes aux droits, le contournement des limites et la revente non autorisée sont interdits.'] },
        { title: 'Mises à jour', paragraphs: ['Les changements importants sont publiés avec une version, une date d’effet et une description lisible.'] },
      ] },
      'service-agreement': { title: 'Conditions de service', summary: 'Limites de l’accès aux modèles, de la facturation, de la disponibilité et du support.', sections: [
        { title: 'Périmètre du service', paragraphs: ['Partokens fournit une passerelle API, la gestion des quotas, l’historique des requêtes et des outils utilisateur.'] },
        { title: 'Facturation', paragraphs: ['Le coût dépend du routage, du modèle, des multiplicateurs et de l’usage ; le calcul du serveur fait foi.'] },
        { title: 'Disponibilité', paragraphs: ['Les capacités dépendent de fournisseurs externes et aucune disponibilité permanente sans interruption n’est garantie.'] },
      ] },
      'privacy-policy': { title: 'Politique de confidentialité', summary: 'Traitement des données du compte, des requêtes et des données locales du navigateur.', sections: [
        { title: 'Données du compte et d’exploitation', paragraphs: ['Les données nécessaires sont traitées pour l’authentification, la facturation, la sécurité et l’audit.'] },
        { title: 'Historique local', paragraphs: ['L’historique reste dans ce navigateur. Les messages envoyés sont transmis au fournisseur du modèle choisi.'] },
        { title: 'Vos choix', paragraphs: ['Vous pouvez gérer votre profil, la sécurité et l’historique local, et demander la suppression du compte selon les règles applicables.'] },
      ] },
    },
  },
  vi: {
    aboutTitle: 'Truy cập mô hình với số liệu rõ ràng',
    aboutLead: 'Partokens hợp nhất quyền truy cập mô hình và hiển thị giá, trạng thái, hạn mức cùng lịch sử yêu cầu trên một giao diện vận hành.',
    aboutBody: 'Sản phẩm tập trung vào khả năng thành công, mức tiêu thụ thực tế và khả năng tiếp tục của tài khoản. Máy chủ vẫn quyết định xác thực, tính phí, hạn mức và định tuyến.',
    noticeTitle: 'Trải nghiệm người dùng mới đang được xây dựng độc lập',
    noticeBody: 'Giai đoạn một gồm các trang công khai, luồng xác thực và trải nghiệm Console thống nhất. Dịch vụ API hiện tại không bị ảnh hưởng.',
    legal: {
      'user-agreement': { title: 'Thỏa thuận người dùng', summary: 'Quy tắc đăng ký, bảo mật tài khoản và sử dụng Partokens.', sections: [
        { title: 'Tài khoản và bảo mật', paragraphs: ['Cung cấp thông tin chính xác và bảo vệ mật khẩu, khóa API cùng các thông tin truy cập khác.'] },
        { title: 'Sử dụng hợp lý', paragraphs: ['Không dùng dịch vụ cho hoạt động trái pháp luật, xâm phạm quyền, né giới hạn hoặc bán lại trái phép.'] },
        { title: 'Cập nhật', paragraphs: ['Thay đổi quan trọng được công bố theo phiên bản, kèm ngày hiệu lực và nội dung thay đổi.'] },
      ] },
      'service-agreement': { title: 'Điều khoản dịch vụ', summary: 'Phạm vi truy cập mô hình, tính phí, khả dụng và hỗ trợ.', sections: [
        { title: 'Phạm vi dịch vụ', paragraphs: ['Partokens cung cấp cổng API thống nhất, quản lý hạn mức, lịch sử yêu cầu và công cụ người dùng.'] },
        { title: 'Tính phí', paragraphs: ['Chi phí phụ thuộc định tuyến, mô hình, hệ số và mức dùng; kết quả máy chủ là giá trị cuối cùng.'] },
        { title: 'Khả dụng', paragraphs: ['Khả năng mô hình phụ thuộc nhà cung cấp bên ngoài và không được bảo đảm luôn liên tục.'] },
      ] },
      'privacy-policy': { title: 'Chính sách quyền riêng tư', summary: 'Cách xử lý dữ liệu tài khoản, yêu cầu và dữ liệu cục bộ trong trình duyệt.', sections: [
        { title: 'Dữ liệu tài khoản và vận hành', paragraphs: ['Dữ liệu cần thiết được xử lý cho xác thực, tính phí, an toàn và kiểm toán.'] },
        { title: 'Lịch sử trò chuyện cục bộ', paragraphs: ['Lịch sử chỉ nằm trong trình duyệt này. Tin nhắn gửi đi được chuyển đến nhà cung cấp mô hình đã chọn.'] },
        { title: 'Lựa chọn của bạn', paragraphs: ['Bạn có thể quản lý hồ sơ, bảo mật, lịch sử cục bộ và yêu cầu xóa tài khoản theo quy định.'] },
      ] },
    },
  },
}

export function getLocaleContent(locale: AppLocale): LocaleContent {
  return content[locale]
}

export function getLegalDocument(locale: AppLocale, kind: LegalKind): LegalDocument {
  return {
    kind,
    effectiveDate: '2026-07-20',
    reviewState: 'draft',
    ...content[locale].legal[kind],
  }
}

export function getCurrentNotice(locale: AppLocale) {
  const localeContent = content[locale]
  return {
    id: 'standalone-ui-phase-1',
    version: '2026-07-20.1',
    title: localeContent.noticeTitle,
    body: localeContent.noticeBody,
  }
}
