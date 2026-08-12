import { AlertTriangle, Download, Image as ImageIcon, ImagePlus, RefreshCw, Upload, X } from 'lucide-react'

import { Button, Skeleton, Tooltip, TooltipContent, TooltipTrigger } from '@partokens/design-system/components'

export type StudioGenerationSnapshot = {
  prompt: string
  model: string
  quality: string
  size: string
  count: number
}

export type StudioImageDimensions = {
  width: number
  height: number
}

export type StudioResultView = {
  id: string
  source: string
  mimeType?: string
  dimensions?: StudioImageDimensions
  revisedPrompt?: string
  retained: boolean
}

type Translate = (key: string, values?: Record<string, string | number>) => string

function aspectClass(size: string): string {
  const match = /^(\d+)x(\d+)$/.exec(size)
  if (!match) return 'aspect-square'
  const width = Number(match[1])
  const height = Number(match[2])
  if (width > height) return 'aspect-[3/2]'
  if (height > width) return 'aspect-[2/3]'
  return 'aspect-square'
}

export function studioSizeLabel(size: string, t: Translate): string {
  if (size === 'auto') return t('Automatic')
  const dimensions = size.replace('x', ' x ')
  if (size === '1024x1024' || size === '512x512' || size === '256x256') return `${t('Square')} · ${dimensions}`
  const match = /^(\d+)x(\d+)$/.exec(size)
  if (!match) return size
  return `${Number(match[1]) > Number(match[2]) ? t('Landscape') : t('Portrait')} · ${dimensions}`
}

export function studioImageDimensionsLabel(dimensions: StudioImageDimensions | undefined, t: Translate): string {
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) return t('Size unavailable')
  const orientation = dimensions.width === dimensions.height
    ? t('Square')
    : dimensions.width > dimensions.height ? t('Landscape') : t('Portrait')
  return `${orientation} · ${dimensions.width} x ${dimensions.height}`
}

export function StudioEmpty({ cancelled, t }: { cancelled: boolean; t: Translate }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-md border bg-background">
        <ImageIcon className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-sm font-semibold">{cancelled ? t('Generation cancelled') : t('No images yet')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {cancelled
          ? t('Your previous request was stopped before any images were created.')
          : t('Set your prompt and generation options, then create your first image set.')}
      </p>
    </div>
  )
}

export function StudioLoading({ count, size, t }: Pick<StudioGenerationSnapshot, 'count' | 'size'> & { t: Translate }) {
  return (
    <div
      className={`grid gap-3 ${count === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[380px]:grid-cols-2'}`}
      aria-label={t('Generating images')}
      aria-live="polite"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-md border bg-background">
          <Skeleton className={`${aspectClass(size)} w-full rounded-none`} />
          <div className="flex items-center gap-2 border-t px-3 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="ms-auto h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StudioError({ message, onRetry, t }: { message: string; onRetry: () => void; t: Translate }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 py-14 text-center" role="alert">
      <div className="mb-4 flex size-11 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-sm font-semibold">{t('Image generation failed')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message || t('The image service could not complete this request.')}</p>
      <Button className="mt-5" variant="outline" onClick={onRetry}><RefreshCw />{t('Retry')}</Button>
    </div>
  )
}

export function StudioResultGrid({
  results,
  settings,
  t,
  onUseAsReference,
  onImageDimensions,
}: {
  results: StudioResultView[]
  settings: StudioGenerationSnapshot
  t: Translate
  onUseAsReference: (result: StudioResultView, index: number) => void
  onImageDimensions?: (resultId: string, dimensions: StudioImageDimensions) => void
}) {
  return (
    <div className={`grid gap-3 ${results.length === 1 ? 'mx-auto max-w-2xl grid-cols-1' : 'grid-cols-1 min-[380px]:grid-cols-2'}`}>
      {results.map((result, index) => (
        <figure key={result.id} className="group relative min-w-0 overflow-hidden rounded-md border bg-background shadow-xs">
          <img
            src={result.source}
            alt={`${settings.prompt}, ${t('Variation {{number}}', { number: index + 1 })}`}
            className={`${aspectClass(result.dimensions ? `${result.dimensions.width}x${result.dimensions.height}` : settings.size)} block w-full scroll-mt-20 object-cover`}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget
              if (!result.dimensions && naturalWidth > 0 && naturalHeight > 0) onImageDimensions?.(result.id, { width: naturalWidth, height: naturalHeight })
            }}
          />
          <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md border bg-background/90 p-1 opacity-100 shadow-sm backdrop-blur transition-opacity sm:pointer-events-none sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="size-8 scroll-mt-20">
                  <a
                    href={result.source}
                    download={`partokens-image-${index + 1}.${result.mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'png'}`}
                    aria-label={t('Download image')}
                  >
                    <Download />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Download image')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 scroll-mt-20"
                  aria-label={t('Use as reference')}
                  onClick={() => onUseAsReference(result, index)}
                >
                  <ImagePlus />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Use as reference')}</TooltipContent>
            </Tooltip>
          </div>
          <figcaption className="flex min-w-0 items-center gap-2 border-t px-3 py-2.5 text-xs">
            <span className="truncate font-medium">{t('Variation {{number}}', { number: index + 1 })}</span>
            <span className="ms-auto shrink-0 text-muted-foreground">{studioImageDimensionsLabel(result.dimensions, t)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function StudioReferenceImage({
  url,
  disabled,
  onPick,
  onRemove,
  t,
}: {
  url: string | null
  disabled: boolean
  onPick: () => void
  onRemove: () => void
  t: Translate
}) {
  if (!url) {
    return (
      <button
        type="button"
        className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-5 text-sm transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onPick}
        disabled={disabled}
      >
        <Upload className="size-5 text-muted-foreground" />
        <span className="font-medium">{t('Upload reference')}</span>
        <span className="text-xs text-muted-foreground">{t('PNG, JPG or WebP')}</span>
      </button>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-md border bg-muted">
      <img src={url} alt={t('Reference preview')} className="aspect-[3/2] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 border-t bg-background/95 p-2 backdrop-blur">
        <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={disabled}><Upload />{t('Replace')}</Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t('Remove reference image')}
          onClick={onRemove}
          disabled={disabled}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
