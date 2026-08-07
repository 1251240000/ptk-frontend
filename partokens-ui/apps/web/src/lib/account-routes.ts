export const profileTasks = ['profile', 'security', 'connections', 'notifications'] as const
export type ProfileTask = (typeof profileTasks)[number]

const profileTaskAliases: Record<string, ProfileTask> = {
  account: 'profile',
  preferences: 'notifications',
  'console-profile': 'profile',
  'console-security': 'security',
  'console-connections': 'connections',
  'console-notifications': 'notifications',
}

export function resolveProfileTask(searchValue?: string | null, hashValue?: string | null): ProfileTask {
  const raw = (searchValue || hashValue || '').replace(/^#/, '')
  if (profileTaskAliases[raw]) return profileTaskAliases[raw]
  return profileTasks.includes(raw as ProfileTask) ? raw as ProfileTask : 'profile'
}

export function profileTaskSearch(task: ProfileTask): string {
  return task === 'profile' ? '' : `?tab=${task}`
}
