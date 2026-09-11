import { describe, expect, it } from 'vitest'
import { compareBindings, draftDirty, newRouteBinding, routeBindings, routeError, routeInput, type RouteDraft } from './route-draft'

const draft = (): RouteDraft => ({ rows: [], baseline: [], revision: 0 })

describe('group routing drafts', () => {
  it('creates independent empty rows with fixed defaults without touching existing bindings', () => {
    const input = draft()
    input.rows = [{ logical_id: 'old', priority: '1357', weight: '17' }]
    const next = { ...input, rows: [...input.rows, newRouteBinding(), newRouteBinding()] }
    expect(next.rows.map((row) => row.weight)).toEqual(['17', '100', '100'])
    expect(next.rows.map((row) => row.priority)).toEqual(['1357', '1000', '1000'])
    expect(input.rows).toHaveLength(1)
    expect(next.rows[1]!.draft_id).not.toBe(next.rows[2]!.draft_id)
    expect(routeError(next.rows, 2)).toContain('尚未选择渠道')
    expect(() => routeInput(next)).toThrow('尚未选择渠道')
  })
  it('validates integer edits and priority count without coercing incomplete input', () => {
    const rows = [{ logical_id: 'a', priority: '1000', weight: '100' }, { logical_id: 'b', priority: '900', weight: '100' }]
    expect(routeError(rows, 0)).toContain('超过')
    expect(routeError(rows, 1)).toBe('')
    for (const weight of ['', '0', '1.5', '1e2', '-1']) expect(routeError([{ ...rows[0]!, weight }], 2)).toContain('正整数')
    expect(routeError([{ ...rows[0]!, priority: '' }], 2)).toContain('整数')
    expect(routeError([rows[0]!, rows[0]!], 2)).toContain('重复')
  })
  it('round trips arbitrary priorities and positive weights grouped and sorted', () => {
    const input = draft()
    input.rows = [{ logical_id: 'a', priority: '43', weight: '7' }, { logical_id: 'b', priority: '43', weight: '11' }, { logical_id: 'c', priority: '-23', weight: '100' }]
    const plan = routeInput(input)
    expect(plan.layers).toEqual([{ priority: 43, members: [{ logical_id: 'b', weight: 11 }, { logical_id: 'a', weight: 7 }] }, { priority: -23, members: [{ logical_id: 'c', weight: 100 }] }])
    expect(routeBindings(plan.layers)).toEqual([...input.rows].sort(compareBindings))
    expect(routeBindings([{ members: [{ logical_id: 'legacy', weight: 12 }] }])[0]?.priority).toBe('1000')
  })
  it('keeps unconfigured groups empty and treats blank additions as a draft', () => {
    expect(routeBindings()).toEqual([])
    expect(routeInput(draft(), true)).toMatchObject({ layers: [], confirm_empty: true, expected_revision: 0 })
    expect(draftDirty({ ...draft(), rows: [newRouteBinding()] })).toBe(true)
    expect(draftDirty(draft())).toBe(false)
  })
})
