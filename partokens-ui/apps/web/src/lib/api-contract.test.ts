import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import {
  api,
  beginPasskeyRegistration,
  bindEmail,
  calculateTopupAmount,
  deleteAccount,
  deleteTokens,
  getAffiliateCode,
  getBillingHistory,
  getCheckinStatus,
  getFlowQuotaData,
  getQuotaData,
  getLogStats,
  getLogs,
  getOAuthBindings,
  getPasskeyStatus,
  getSelfSubscriptions,
  getSubscriptionPlans,
  getToken,
  getTwoFactorStatus,
  performCheckin,
  redeemTopupCode,
  requestSubscriptionPayment,
  requestTopupPayment,
  revealToken,
  searchTokens,
  setupTwoFactor,
  transferAffiliateQuota,
  updateToken,
  updateSubscriptionPreference,
  updateUserSettings,
  verifySensitiveAction,
} from '@partokens/api-client'

const originalAdapter = api.defaults.adapter
const requests: InternalAxiosRequestConfig[] = []

const adapter: AxiosAdapter = async (config) => {
  requests.push(config)
  return {
    config,
    data: {
      success: true,
      data: {
        id: 17,
        key: 'sk-contract-test',
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        quota: 0,
        rpm: 0,
        tpm: 0,
      },
    },
    headers: {},
    status: 200,
    statusText: 'OK',
  }
}

beforeEach(() => {
  requests.length = 0
  api.defaults.adapter = adapter
})

afterAll(() => {
  api.defaults.adapter = originalAdapter
})

describe('New API adapter contracts', () => {
  it('uses the current detail, search, update, and reveal key routes', async () => {
    await searchTokens({ keyword: 'mobile', p: 2, size: 25 })
    await getToken(17)
    await updateToken({
      id: 17,
      name: 'mobile',
      remain_quota: 500_000,
      expired_time: -1,
      unlimited_quota: false,
      model_limits_enabled: true,
      model_limits: 'gpt-4.1-mini',
      allow_ips: '192.0.2.1',
      group: 'default',
      cross_group_retry: false,
    })
    await revealToken(17)

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['get', '/api/token/search'],
      ['get', '/api/token/17'],
      ['put', '/api/token/'],
      ['post', '/api/token/17/key'],
    ])
    expect(requests[0]?.params).toEqual({ keyword: 'mobile', p: 2, size: 25 })
    expect(JSON.parse(String(requests[2]?.data))).toMatchObject({
      id: 17,
      model_limits_enabled: true,
      allow_ips: '192.0.2.1',
    })
  })

  it('keeps user log filters on the self-scoped list and stat routes', async () => {
    const filters = {
      type: 2,
      token_name: 'workbench',
      model_name: 'gpt-4.1-mini',
      start_timestamp: 1_700_000_000,
      end_timestamp: 1_700_003_600,
      request_id: 'req_test',
    }
    await getLogs({ p: 3, page_size: 30, ...filters })
    await getLogStats(filters)

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['get', '/api/log/self'],
      ['get', '/api/log/self/stat'],
    ])
    expect(requests[0]?.params).toMatchObject({ p: 3, page_size: 30, ...filters })
    expect(requests[1]?.params).toEqual(filters)
  })

  it('writes user preferences through the dedicated settings endpoint', async () => {
    await updateUserSettings({
      notify_type: 'email',
      quota_warning_threshold: 500_000,
      notification_email: 'user@example.com',
      accept_unset_model_ratio_model: false,
      record_ip_log: true,
    })

    expect(requests[0]?.method).toBe('put')
    expect(requests[0]?.url).toBe('/api/user/setting')
    expect(JSON.parse(String(requests[0]?.data))).toMatchObject({
      notify_type: 'email',
      quota_warning_threshold: 500_000,
      record_ip_log: true,
    })
  })

  it('uses self-scoped analytics and batch key routes', async () => {
    const range = { start_timestamp: 1_700_000_000, end_timestamp: 1_700_003_600, default_time: 'hour' }
    await getFlowQuotaData(range)
    await deleteTokens([17, 18])

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['get', '/api/data/flow/self'],
      ['post', '/api/token/batch'],
    ])
    expect(requests[0]?.params).toEqual(range)
    expect(JSON.parse(String(requests[1]?.data))).toEqual({ ids: [17, 18] })
  })

  it('splits analytics ranges at the backend 30-day limit without overlapping boundaries', async () => {
    const start = 1_700_000_000
    await getQuotaData({
      start_timestamp: start,
      end_timestamp: start + 90 * 24 * 60 * 60,
      default_time: 'day',
    })

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['get', '/api/data/self'],
      ['get', '/api/data/self'],
      ['get', '/api/data/self'],
    ])
    expect(requests.map(({ params }) => params)).toEqual([
      { start_timestamp: start, end_timestamp: start + 2_592_000, default_time: 'day' },
      { start_timestamp: start + 2_592_001, end_timestamp: start + 5_184_001, default_time: 'day' },
      { start_timestamp: start + 5_184_002, end_timestamp: start + 7_776_000, default_time: 'day' },
    ])
  })

  it('keeps fixed top-up and subscription actions on their user routes', async () => {
    await calculateTopupAmount(20, 'stripe')
    await requestTopupPayment({ provider: 'waffo', amount: 20, pay_method_index: 1 })
    await redeemTopupCode('redeem-test')
    await getBillingHistory({ p: 2, page_size: 10, keyword: 'order' })
    await getAffiliateCode()
    await transferAffiliateQuota(500_000)
    await getSubscriptionPlans()
    await getSelfSubscriptions()
    await updateSubscriptionPreference('subscription')
    await requestSubscriptionPayment({ provider: 'balance', plan_id: 4 })

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['post', '/api/user/stripe/amount'],
      ['post', '/api/user/waffo/pay'],
      ['post', '/api/user/topup'],
      ['get', '/api/user/topup/self'],
      ['get', '/api/user/aff'],
      ['post', '/api/user/aff_transfer'],
      ['get', '/api/subscription/plans'],
      ['get', '/api/subscription/self'],
      ['put', '/api/subscription/self/preference'],
      ['post', '/api/subscription/balance/pay'],
    ])
    expect(JSON.parse(String(requests[1]?.data))).toEqual({ amount: 20, pay_method_index: 1 })
    expect(requests[3]?.params).toEqual({ p: 2, page_size: 10, keyword: 'order' })
    expect(JSON.parse(String(requests[9]?.data))).toEqual({ plan_id: 4 })
  })

  it('adapts profile binding, security, passkey, check-in, and deletion routes', async () => {
    await bindEmail('user@example.com', '123456')
    await getOAuthBindings()
    await getTwoFactorStatus()
    await setupTwoFactor()
    await getPasskeyStatus()
    await beginPasskeyRegistration()
    await verifySensitiveAction('2fa', '654321')
    await getCheckinStatus('2026-07')
    await performCheckin('turnstile-test')
    await deleteAccount('password-test')

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['post', '/api/oauth/email/bind'],
      ['get', '/api/user/oauth/bindings'],
      ['get', '/api/user/2fa/status'],
      ['post', '/api/user/2fa/setup'],
      ['get', '/api/user/passkey'],
      ['post', '/api/user/passkey/register/begin'],
      ['post', '/api/verify'],
      ['get', '/api/user/checkin'],
      ['post', '/api/user/checkin'],
      ['delete', '/api/user/self'],
    ])
    expect(JSON.parse(String(requests[0]?.data))).toEqual({ email: 'user@example.com', code: '123456' })
    expect(JSON.parse(String(requests[6]?.data))).toEqual({ method: '2fa', code: '654321' })
    expect(requests[7]?.params).toEqual({ month: '2026-07' })
    expect(requests[8]?.params).toEqual({ turnstile: 'turnstile-test' })
  })
})
