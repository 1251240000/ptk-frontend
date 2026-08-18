import { PartokensAvatar } from '@partokens/design-system/components'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <PartokensAvatar size={30} alt="" />
      {compact ? null : <span>Partokens</span>}
    </span>
  )
}
