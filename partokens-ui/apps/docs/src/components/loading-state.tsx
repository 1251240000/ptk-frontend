'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingRegion, Skeleton } from '@partokens/design-system/components'

const labels: Record<string, string> = {
  'zh-CN': '正在加载页面',
  'zh-TW': '正在載入頁面',
  en: 'Loading page',
  ja: 'ページを読み込み中',
  ru: 'Загрузка страницы',
  fr: 'Chargement de la page',
  vi: 'Đang tải trang',
}

export function DocsLoadingState() {
  const pathname = usePathname()
  const [label, setLabel] = useState('Loading page')

  useEffect(() => {
    const locale = pathname?.split('/').filter(Boolean)[0]
    if (locale && labels[locale]) setLabel(labels[locale])
  }, [pathname])

  return (
    <main className="docs-loading-state" role="status" aria-live="polite">
      <LoadingRegion label={label}>
        <div className="docs-loading-state__body">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4 max-w-xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-5/6 max-w-xl" />
          <div className="docs-loading-state__columns">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </LoadingRegion>
    </main>
  )
}
