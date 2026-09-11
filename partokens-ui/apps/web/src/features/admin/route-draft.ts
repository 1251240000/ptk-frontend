import type { AdminRouteInput, AdminRouteLayer } from '@partokens/api-client'

export type RouteBinding = { logical_id: string; priority: string; weight: string; draft_id?: string }
export type RouteDraft = { rows: RouteBinding[]; baseline: RouteBinding[]; revision: number }

export function newRouteBinding(): RouteBinding {
  return { draft_id: crypto.randomUUID(), logical_id: '', priority: '1000', weight: '100' }
}

export function routeBindings(layers: AdminRouteLayer[] = []): RouteBinding[] {
  return layers.flatMap((layer, index) => layer.members.map((member) => ({ logical_id: member.logical_id, priority: String(layer.priority ?? 1000 - index * 100), weight: String(member.weight) })))
}

export function compareBindings(a: RouteBinding, b: RouteBinding) {
  return Number(b.priority) - Number(a.priority) || Number(b.weight) - Number(a.weight) || a.logical_id.localeCompare(b.logical_id)
}

export function draftDirty(draft: RouteDraft) {
  const normalize = (rows: RouteBinding[]) => JSON.stringify([...rows].sort((a, b) => a.logical_id.localeCompare(b.logical_id)).map(({ logical_id, priority, weight }) => ({ logical_id, priority, weight })))
  return normalize(draft.rows) !== normalize(draft.baseline)
}

export function integerValid(value: string, min: number, max: number) {
  return /^-?\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max
}

export function routeError(rows: RouteBinding[], retryTimes: number) {
  if (rows.some((row) => !row.logical_id)) return '新增行尚未选择渠道，请选择渠道或移除该行'
  if (new Set(rows.map((row) => row.logical_id)).size !== rows.length) return '同一分组不能重复绑定渠道'
  if (rows.some((row) => !integerValid(row.priority, -2147483648, 2147483647))) return '优先级必须为 -2147483648 至 2147483647 的整数'
  if (rows.some((row) => !integerValid(row.weight, 1, 1000000))) return '权重必须为 1 至 1000000 的正整数'
  const count = new Set(rows.map((row) => Number(row.priority))).size
  if (count > retryTimes + 1) return `${count} 个优先级超过全局重试 ${retryTimes} 次允许的 ${retryTimes + 1} 个优先级`
  return ''
}

export function routeInput(draft: RouteDraft, confirmEmpty = false): AdminRouteInput {
  const error = routeError(draft.rows, Number.MAX_SAFE_INTEGER)
  if (error) throw new Error(error)
  const byPriority = new Map<number, AdminRouteLayer>()
  for (const row of [...draft.rows].sort(compareBindings)) {
    const priority = Number(row.priority)
    const layer = byPriority.get(priority) ?? { priority, members: [] }
    layer.members.push({ logical_id: row.logical_id, weight: Number(row.weight) })
    byPriority.set(priority, layer)
  }
  return { layers: [...byPriority.values()], expected_revision: draft.revision, acknowledge_nonstandard: false, confirm_empty: confirmEmpty }
}
