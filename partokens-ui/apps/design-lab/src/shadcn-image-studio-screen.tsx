import {
  AlertTriangle,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  toast,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type GenerationStatus = 'idle' | 'loading' | 'success' | 'error'
type ImageSize = 'square' | 'landscape' | 'portrait'

type GenerationSettings = {
  prompt: string
  model: string
  quality: string
  size: ImageSize
  count: number
}

const resultImages = [
  '/image-studio/architecture-01.webp',
  '/image-studio/architecture-02.webp',
  '/image-studio/architecture-03.webp',
  '/image-studio/architecture-04.webp',
]

const sizeLabels: Record<ImageSize, string> = {
  square: '1024 x 1024',
  landscape: '1536 x 1024',
  portrait: '1024 x 1536',
}

const aspectClasses: Record<ImageSize, string> = {
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
  portrait: 'aspect-[2/3]',
}

function StudioEmpty({ cancelled }: { cancelled: boolean }) {
  return (
    <div className='flex min-h-80 flex-col items-center justify-center px-4 py-14 text-center'>
      <div className='mb-4 flex size-11 items-center justify-center rounded-md border bg-background'>
        <ImageIcon className='size-5 text-muted-foreground' />
      </div>
      <h2 className='text-sm font-semibold'>{cancelled ? 'Generation cancelled' : 'No images yet'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {cancelled ? 'Your previous request was stopped before any images were created.' : 'Set your prompt and generation options, then create your first image set.'}
      </p>
    </div>
  )
}

function StudioLoading({ count, size }: Pick<GenerationSettings, 'count' | 'size'>) {
  return (
    <div className={`grid gap-3 ${count === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[380px]:grid-cols-2'}`} aria-label='Generating images' aria-live='polite'>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className='overflow-hidden rounded-md border bg-background'>
          <Skeleton className={`${aspectClasses[size]} w-full rounded-none`} />
          <div className='flex items-center gap-2 border-t px-3 py-2.5'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='ms-auto h-3 w-20' />
          </div>
        </div>
      ))}
    </div>
  )
}

function StudioError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex min-h-80 flex-col items-center justify-center px-4 py-14 text-center' role='alert'>
      <div className='mb-4 flex size-11 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive'>
        <AlertTriangle className='size-5' />
      </div>
      <h2 className='text-sm font-semibold'>Image generation failed</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>The simulated image service could not complete this request.</p>
      <Button className='mt-5' variant='outline' onClick={onRetry}><RefreshCw />Retry</Button>
    </div>
  )
}

function ResultGrid({ images, settings }: { images: string[]; settings: GenerationSettings }) {
  return (
    <div className={`grid gap-3 ${images.length === 1 ? 'mx-auto max-w-2xl grid-cols-1' : 'grid-cols-1 min-[380px]:grid-cols-2'}`}>
      {images.map((source, index) => (
        <figure key={source} className='min-w-0 overflow-hidden rounded-md border bg-background shadow-xs'>
          <img
            src={source}
            alt={`${settings.prompt}, variation ${index + 1}`}
            className={`${aspectClasses[settings.size]} block w-full object-cover`}
          />
          <figcaption className='flex min-w-0 items-center gap-2 border-t px-3 py-2.5 text-xs'>
            <span className='truncate font-medium'>Variation {index + 1}</span>
            <span className='ms-auto shrink-0 text-muted-foreground'>{sizeLabels[settings.size]}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function ReferenceImage({
  url,
  disabled,
  onPick,
  onRemove,
}: {
  url: string | null
  disabled: boolean
  onPick: () => void
  onRemove: () => void
}) {
  if (!url) {
    return (
      <button
        type='button'
        className='flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-4 py-5 text-sm transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
        onClick={onPick}
        disabled={disabled}
      >
        <Upload className='size-5 text-muted-foreground' />
        <span className='font-medium'>Upload reference</span>
        <span className='text-xs text-muted-foreground'>PNG, JPG or WebP</span>
      </button>
    )
  }

  return (
    <div className='relative overflow-hidden rounded-md border bg-muted'>
      <img src={url} alt='Reference preview' className='aspect-[3/2] w-full object-cover' />
      <div className='absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 border-t bg-background/95 p-2 backdrop-blur'>
        <Button type='button' variant='outline' size='sm' onClick={onPick} disabled={disabled}><Upload />Replace</Button>
        <Button type='button' variant='ghost' size='icon' className='size-8' aria-label='Remove reference image' onClick={onRemove} disabled={disabled}><X /></Button>
      </div>
    </div>
  )
}

function ImageStudioContent() {
  const [prompt, setPrompt] = useState('A quiet coastal landscape at first light, editorial photography, natural colors')
  const [model, setModel] = useState('gpt-image-1')
  const [quality, setQuality] = useState('high')
  const [size, setSize] = useState<ImageSize>('square')
  const [count, setCount] = useState(2)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [results, setResults] = useState<string[]>([])
  const [resultSettings, setResultSettings] = useState<GenerationSettings | null>(null)
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const referenceUrlRef = useRef<string | null>(null)
  const generationTimerRef = useRef<number | null>(null)
  const requestRef = useRef(0)

  useEffect(() => () => {
    if (generationTimerRef.current !== null) window.clearTimeout(generationTimerRef.current)
    if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current)
  }, [])

  const clearTimer = () => {
    if (generationTimerRef.current === null) return
    window.clearTimeout(generationTimerRef.current)
    generationTimerRef.current = null
  }

  const setReference = (nextUrl: string | null) => {
    if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current)
    referenceUrlRef.current = nextUrl
    setReferenceUrl(nextUrl)
  }

  const pickReference = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  const changeReference = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Unsupported reference image', { description: 'Choose a PNG, JPG, or WebP image.' })
      event.target.value = ''
      return
    }
    const replacing = referenceUrlRef.current !== null
    setReference(URL.createObjectURL(file))
    toast.success(replacing ? 'Reference image replaced' : 'Reference image added')
  }

  const removeReference = () => {
    setReference(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('Reference image removed')
  }

  const generate = (retry = false) => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) return

    clearTimer()
    requestRef.current += 1
    const requestId = requestRef.current
    const settings: GenerationSettings = { prompt: cleanPrompt, model, quality, size, count }
    setCancelled(false)
    setResults([])
    setResultSettings(settings)
    setStatus('loading')

    generationTimerRef.current = window.setTimeout(() => {
      generationTimerRef.current = null
      if (requestRef.current !== requestId) return

      const shouldFail = !retry && /(^|\s)(error|fail)(\s|$)/i.test(cleanPrompt)
      if (shouldFail) {
        setStatus('error')
        toast.error('Generation failed', { description: 'The simulated image service returned an error.' })
        return
      }

      setResults(resultImages.slice(0, settings.count))
      setStatus('success')
      toast.success(`${settings.count} image${settings.count === 1 ? '' : 's'} generated`, { description: 'The new result set replaced the previous one.' })
    }, 1800)
  }

  const cancel = () => {
    if (status !== 'loading') return
    requestRef.current += 1
    clearTimer()
    setStatus('idle')
    setResults([])
    setCancelled(true)
    toast.info('Generation cancelled')
  }

  const busy = status === 'loading'

  return (
    <>
      <div className='min-w-0'>
        <h1 className='text-2xl font-bold tracking-tight'>Image studio</h1>
        <p className='mt-1 text-muted-foreground'>Create a focused set of images from a prompt and an optional reference.</p>
      </div>

      <div className='grid min-w-0 overflow-hidden rounded-md border bg-background lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]'>
        <section className='min-w-0 p-4 sm:p-5 lg:border-e' aria-labelledby='generation-settings-title'>
          <div className='mb-5'>
            <h2 id='generation-settings-title' className='text-sm font-semibold'>Generation settings</h2>
            <p className='mt-1 text-xs text-muted-foreground'>Adjust the inputs for the next result set.</p>
          </div>

          <div className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='studio-prompt'>Prompt</Label>
              <Textarea
                id='studio-prompt'
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder='Describe the image you want to create...'
                className='min-h-28 resize-y'
                maxLength={1200}
                disabled={busy}
              />
              <p className='text-end text-xs text-muted-foreground'>{prompt.length}/1200</p>
            </div>

            <div className='space-y-2'>
              <Label>Reference image</Label>
              <ReferenceImage url={referenceUrl} disabled={busy} onPick={pickReference} onRemove={removeReference} />
              <input ref={fileInputRef} className='hidden' type='file' accept='image/png,image/jpeg,image/webp' onChange={changeReference} />
            </div>

            <div className='grid gap-4 min-[380px]:grid-cols-2 lg:grid-cols-1'>
              <div className='min-w-0 space-y-2'>
                <Label htmlFor='studio-model'>Model</Label>
                <Select value={model} onValueChange={setModel} disabled={busy}>
                  <SelectTrigger id='studio-model' className='w-full'><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='gpt-image-1'>GPT Image 1</SelectItem>
                    <SelectItem value='imagen-3'>Imagen 3</SelectItem>
                    <SelectItem value='flux-1.1-pro'>FLUX 1.1 Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='min-w-0 space-y-2'>
                <Label htmlFor='studio-quality'>Quality</Label>
                <Select value={quality} onValueChange={setQuality} disabled={busy}>
                  <SelectTrigger id='studio-quality' className='w-full'><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='standard'>Standard</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='studio-size'>Image size</Label>
              <Select value={size} onValueChange={(value) => setSize(value as ImageSize)} disabled={busy}>
                <SelectTrigger id='studio-size' className='w-full'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='square'>Square · 1024 x 1024</SelectItem>
                  <SelectItem value='landscape'>Landscape · 1536 x 1024</SelectItem>
                  <SelectItem value='portrait'>Portrait · 1024 x 1536</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <fieldset className='space-y-2'>
              <legend className='text-sm font-medium'>Number of images</legend>
              <div className='grid grid-cols-4 gap-2'>
                {[1, 2, 3, 4].map((value) => (
                  <Button
                    key={value}
                    type='button'
                    variant={count === value ? 'secondary' : 'outline'}
                    className={count === value ? 'border border-foreground/15' : ''}
                    aria-pressed={count === value}
                    disabled={busy}
                    onClick={() => setCount(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t pt-5'>
              <Button type='button' onClick={() => generate()} disabled={busy || !prompt.trim()}>
                {busy ? <LoaderCircle className='animate-spin' /> : <Sparkles />}
                {busy ? 'Generating...' : 'Generate'}
              </Button>
              <Button type='button' variant='outline' onClick={cancel} disabled={!busy}>Cancel</Button>
            </div>
          </div>
        </section>

        <section className='min-w-0 border-t bg-muted/10 p-4 sm:p-5 lg:border-t-0' aria-labelledby='generation-results-title'>
          <div className='mb-5 flex min-w-0 items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 id='generation-results-title' className='text-sm font-semibold'>Results</h2>
              <p className='mt-1 text-xs text-muted-foreground'>Each generation replaces the current result set.</p>
            </div>
            {status === 'success' && resultSettings ? <span className='shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground'>{results.length} of {resultSettings.count}</span> : null}
          </div>

          {status === 'idle' ? <StudioEmpty cancelled={cancelled} /> : null}
          {status === 'loading' && resultSettings ? <StudioLoading count={resultSettings.count} size={resultSettings.size} /> : null}
          {status === 'error' ? <StudioError onRetry={() => generate(true)} /> : null}
          {status === 'success' && resultSettings ? <ResultGrid images={results} settings={resultSettings} /> : null}
        </section>
      </div>
    </>
  )
}

export function ShadcnImageStudioScreen({ theme, onTheme, onNavigate }: ConsoleScreenProps) {
  return (
    <ConsoleShell activeRoute='console-studio' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
      <ImageStudioContent />
    </ConsoleShell>
  )
}
