import { Server } from 'lucide-react'

import { ModelProviderIcon } from '../../components/model-provider-badge'

const channelProviders: Record<number, { className: string; path: string }> = {
  3: { className: 'text-sky-600 dark:text-sky-400', path: 'M13.05 4.24 6.56 17.42l11.42-1.32L13.05 4.24ZM11.97 0 4.64 6.35 0 18.02h5.59L11.97 0ZM14.18 1.53 24 22.47H5.35l16.83-2.97L14.18 1.53Z' },
  14: { className: 'text-foreground', path: 'M13.827 3.52h3.603L24 20.48h-3.603ZM6.57 3.52h3.765l6.57 16.96H13.23l-1.343-3.562H5.013L3.67 20.48H0Zm-.363 10.244h4.49L8.452 7.8Z' },
  24: { className: 'text-blue-600 dark:text-blue-400', path: 'M12 0C10.667 6.667 6.667 10.667 0 12c6.667 1.333 10.667 5.333 12 12 1.333-6.667 5.333-10.667 12-12C17.333 10.667 13.333 6.667 12 0Z' },
}

export function ChannelProviderIcon({ type }: { type: number }) {
  if (type === 1 || type === 43) return <ModelProviderIcon name={type === 1 ? 'OpenAI' : 'DeepSeek'} />
  if (type === 60) return <img src="/brand/new-api.png" alt="" className="size-5 object-contain" />
  const provider = channelProviders[type]
  return provider ? <svg viewBox="0 0 24 24" className={`size-5 ${provider.className}`} fill="currentColor" aria-hidden="true"><path d={provider.path} /></svg> : <Server className="size-5 text-muted-foreground" aria-hidden="true" />
}
