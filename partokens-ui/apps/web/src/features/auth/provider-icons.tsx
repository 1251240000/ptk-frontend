import { useId, type SVGProps } from 'react'

type ProviderIconProps = Omit<SVGProps<SVGSVGElement>, 'children'>

export function GitHubIcon({ className = '', ...props }: ProviderIconProps) {
  return <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className={`r32-provider-icon ${className}`.trim()}
    data-provider-icon="github"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
  </svg>
}

export function LinuxDoIcon({ className = '', ...props }: ProviderIconProps) {
  const clipId = `linuxdo-logo-${useId().replaceAll(':', '')}`

  return <svg
    viewBox="0 0 120 120"
    width="18"
    height="18"
    className={`r32-provider-icon ${className}`.trim()}
    data-provider-icon="linuxdo"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <defs>
      <clipPath id={clipId}>
        <circle cx="60" cy="60" r="47" />
      </clipPath>
    </defs>
    <circle fill="#f0f0f0" cx="60" cy="60" r="50" />
    <g clipPath={`url(#${clipId})`}>
      <rect fill="#1c1c1e" x="10" y="10" width="100" height="30" />
      <rect fill="#f0f0f0" x="10" y="40" width="100" height="40" />
      <rect fill="#ffb003" x="10" y="80" width="100" height="30" />
    </g>
  </svg>
}

export function GoogleIcon({ className = '', ...props }: ProviderIconProps) {
  return <svg
    viewBox="0 0 48 48"
    width="18"
    height="18"
    className={`r32-provider-icon ${className}`.trim()}
    data-provider-icon="google"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z" />
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691Z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z" />
  </svg>
}
