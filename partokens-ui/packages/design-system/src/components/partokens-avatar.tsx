import type { CSSProperties, HTMLAttributes } from 'react'

export type PartokensAvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  alt: string
  size?: number
}

const lightAsset = '/brand/partokens-avatar-monochrome-light-transparent-64.png'
const darkAsset = '/brand/partokens-avatar-monochrome-dark-transparent-64.png'

export function PartokensAvatar(props: PartokensAvatarProps) {
  const { alt, size: requestedSize, ...spanProps } = props
  const size = requestedSize ?? 24
  const className = ['partokens-avatar', props.className].filter(Boolean).join(' ')
  const style: CSSProperties = { ...props.style, width: size, height: size }
  const accessible = alt.length > 0

  return (
    <span
      {...spanProps}
      className={className}
      style={style}
      role={accessible ? 'img' : undefined}
      aria-label={accessible ? alt : undefined}
      aria-hidden={accessible ? undefined : true}
    >
      <img
        className="partokens-avatar__image partokens-avatar__image--light"
        src={lightAsset}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
      />
      <img
        className="partokens-avatar__image partokens-avatar__image--dark"
        src={darkAsset}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
