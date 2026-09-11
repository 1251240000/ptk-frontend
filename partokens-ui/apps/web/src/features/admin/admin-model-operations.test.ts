import { describe, expect, it } from 'vitest'

import type { AdminLogicalChannel, AdminModelTestResult } from '@partokens/api-client'
import { channelModelResults, formatCostRatio, modelStatusLabel, modelTagState } from './admin-operations-page'

describe('admin model operations copy and formatting', () => {
  it('renders cost ratios with exact thousandth precision', () => {
    expect(formatCostRatio(1.125)).toBe('1.125x')
    expect(formatCostRatio(0.875)).toBe('0.875x')
    expect(formatCostRatio(1)).toBe('1.000x')
    expect(formatCostRatio(null)).toBe('未登记')
  })

  it('never exposes backend model status enums to the Chinese UI', () => {
    expect(modelStatusLabel('available')).toBe('可用')
    for (const status of ['unavailable', 'timeout', 'rate_limited', 'unauthorized', 'server_error', 'unknown', 'unexpected']) {
      expect(modelStatusLabel(status)).toBe('异常')
      expect(modelTagState({ status } as AdminModelTestResult).label).toBe('异常')
      expect(modelTagState({ status } as AdminModelTestResult).tone).toBe('failed')
    }
    expect(modelStatusLabel('running')).toBe('测试中')
    expect(modelStatusLabel('untested')).toBe('未测试')
    expect(modelTagState({ status: 'available', latency_ms: 4000 } as AdminModelTestResult).label).toBe('可用')
    for (const status of ['available', 'untested', 'running']) {
      expect(modelTagState({ status } as AdminModelTestResult).tone).not.toBe('failed')
    }
    expect(modelTagState().tone).not.toBe('failed')
  })

  it('overlays active retries on historical results and clears cancelled results consistently', () => {
    const channel = {
      latest_model_results: [{ model_id: 'retry', status: 'unavailable' }, { model_id: 'other', status: 'available' }],
      latest_model_test: { status: 'running', results: [{ model_id: 'retry', status: 'untested' }] },
    } as AdminLogicalChannel
    expect(modelTagState(channelModelResults(channel).get('retry')).label).toBe('测试中')
    expect(modelTagState(channelModelResults(channel).get('other')).label).toBe('可用')
    channel.latest_model_test!.status = 'cancelled'
    expect(modelTagState(channelModelResults(channel).get('retry')).label).toBe('未测试')
  })
})
