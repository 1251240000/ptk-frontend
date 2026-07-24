import { brandLogoUrl } from '@partokens/content'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <img src={brandLogoUrl} alt="" width={30} height={30} />
      {compact ? null : <span>Partokens</span>}
    </span>
  )
}

