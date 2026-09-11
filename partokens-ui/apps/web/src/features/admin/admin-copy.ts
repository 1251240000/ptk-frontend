import type { AppLocale } from '@partokens/i18n'

const zhCN = {
  section: '管理员',
  channels: '渠道',
  routes: '分组路由',
  monitoring: '监控',
  changes: '变更记录',
  nativeSection: '原生管理',
  nativeModels: '模型',
  nativeUsers: '用户',
  nativeRedemptions: '兑换码',
  nativeSubscriptions: '订阅',
  nativeSystemInfo: '系统信息',
  nativeSystemSettings: '系统设置',
  stepStatus: {
    pending: '等待执行',
    running: '执行中',
    success: '已完成',
    failed: '执行失败',
  },
} as const

// The administrator surface ships in Simplified Chinese first. Keeping copy
// behind this resolver avoids scattering a second localization mechanism.
export function adminCopy(_locale?: AppLocale) {
  return zhCN
}
