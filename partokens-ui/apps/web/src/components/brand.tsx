import { PartokensMark } from '@partokens/design-system/components'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <PartokensMark size={30} />
      {compact ? null : <span>Partokens</span>}
    </span>
  )
}
