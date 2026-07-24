import {
  Copy,
  Ellipsis,
  KeyRound,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useSidebar,
} from '@partokens/design-system/components'

import { ConsoleShell, type ConsoleScreenProps } from './shadcn-console-shell'

type KeyStatus = 'active' | 'expired' | 'revoked'
type KeyPermission = 'full' | 'read-write' | 'read-only'

type ApiKeyRecord = {
  id: string
  name: string
  prefix: string
  permission: KeyPermission
  status: KeyStatus
  quota: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string
}

type ShadcnApiKeysScreenProps = ConsoleScreenProps

const initialKeys: ApiKeyRecord[] = [
  {
    id: 'key-production',
    name: 'Production API',
    prefix: 'ptk_live_7J4M',
    permission: 'full',
    status: 'active',
    quota: '$500.00',
    createdAt: 'Jul 12, 2026',
    lastUsedAt: '3 minutes ago',
    expiresAt: 'Jul 12, 2027',
  },
  {
    id: 'key-staging',
    name: 'Staging services',
    prefix: 'ptk_test_Q8LN',
    permission: 'read-write',
    status: 'active',
    quota: '$100.00',
    createdAt: 'Jun 28, 2026',
    lastUsedAt: '2 hours ago',
    expiresAt: 'Oct 21, 2026',
  },
  {
    id: 'key-observability',
    name: 'Usage exporter',
    prefix: 'ptk_live_K2PW',
    permission: 'read-only',
    status: 'active',
    quota: '$25.00',
    createdAt: 'May 19, 2026',
    lastUsedAt: 'Yesterday',
    expiresAt: 'Never',
  },
  {
    id: 'key-local',
    name: 'Local development',
    prefix: 'ptk_test_A6RX',
    permission: 'read-write',
    status: 'expired',
    quota: '$20.00',
    createdAt: 'Mar 04, 2026',
    lastUsedAt: 'May 30, 2026',
    expiresAt: 'Jun 01, 2026',
  },
  {
    id: 'key-legacy',
    name: 'Legacy worker',
    prefix: 'ptk_live_C9HT',
    permission: 'full',
    status: 'revoked',
    quota: '$250.00',
    createdAt: 'Jan 16, 2026',
    lastUsedAt: 'Apr 11, 2026',
    expiresAt: 'Revoked',
  },
]

const permissionLabels: Record<KeyPermission, string> = {
  full: 'Full access',
  'read-write': 'Read & write',
  'read-only': 'Read only',
}

function StatusBadge({ status }: { status: KeyStatus }) {
  if (status === 'active') return <Badge>Active</Badge>
  if (status === 'expired') return <Badge variant='secondary'>Expired</Badge>
  return <Badge variant='destructive'>Revoked</Badge>
}

function PermissionBadge({ permission }: { permission: KeyPermission }) {
  return <Badge variant='outline'>{permissionLabels[permission]}</Badge>
}

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(successMessage)
  } catch {
    toast.error('Copy failed', { description: 'Allow clipboard access and try again.' })
  }
}

function KeyActions({
  apiKey,
  onStatus,
  onDelete,
}: {
  apiKey: ApiKeyRecord
  onStatus: (id: string, status: KeyStatus) => void
  onDelete: (id: string) => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [confirmation, setConfirmation] = useState<'revoke' | 'delete' | null>(null)
  const isRevoke = confirmation === 'revoke'

  const confirm = () => {
    if (isRevoke) {
      onStatus(apiKey.id, 'revoked')
      toast.success('API key revoked', { description: `${apiKey.name} can no longer make requests.` })
    } else {
      onDelete(apiKey.id)
      toast.success('API key deleted')
    }
    setConfirmation(null)
  }

  const openConfirmation = (kind: 'revoke' | 'delete') => {
    window.setTimeout(() => setConfirmation(kind), 0)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} variant='ghost' size='icon' className='size-8' aria-label={`Actions for ${apiKey.name}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          <DropdownMenuLabel>API key</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => void copyText(apiKey.prefix, 'Key prefix copied')}>
            <Copy />Copy prefix
          </DropdownMenuItem>
          <DropdownMenuItem disabled={apiKey.status !== 'active'} onSelect={() => openConfirmation('revoke')}>
            <ShieldCheck />Revoke key
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onSelect={() => openConfirmation('delete')}>
            <Trash2 />Delete key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmation !== null} onOpenChange={(open) => !open && setConfirmation(null)}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>{isRevoke ? 'Revoke this API key?' : 'Delete this API key?'}</DialogTitle>
            <DialogDescription>
              {isRevoke
                ? `Requests using ${apiKey.name} will fail immediately. This cannot be undone.`
                : `${apiKey.name} will be removed from this list. Audit records are retained.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmation(null)}>Cancel</Button>
            <Button variant='destructive' onClick={confirm}>
              {isRevoke ? 'Revoke key' : 'Delete key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type CreateErrors = { name?: string; quota?: string }

function CreateKeyControl({ onCreate }: { onCreate: (key: ApiKeyRecord) => void }) {
  const { isMobile } = useSidebar()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [permission, setPermission] = useState<KeyPermission>('read-write')
  const [expiry, setExpiry] = useState('90')
  const [quota, setQuota] = useState('25')
  const [errors, setErrors] = useState<CreateErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<{ name: string; value: string } | null>(null)

  const resetForm = () => {
    setName('')
    setPermission('read-write')
    setExpiry('90')
    setQuota('25')
    setErrors({})
    setSubmitError('')
  }

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen && submitting) return
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  const validate = () => {
    const nextErrors: CreateErrors = {}
    if (name.trim().length < 3) nextErrors.name = 'Enter a name with at least 3 characters.'
    const quotaValue = Number(quota)
    if (!Number.isFinite(quotaValue) || quotaValue < 1 || quotaValue > 10000) {
      nextErrors.quota = 'Set a quota between $1 and $10,000.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const createKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      const randomPart = crypto.randomUUID().replaceAll('-', '')
      const secret = `ptk_live_${randomPart}`
      const expiryLabels: Record<string, string> = {
        '30': 'Aug 22, 2026',
        '90': 'Oct 21, 2026',
        '365': 'Jul 23, 2027',
        never: 'Never',
      }

      onCreate({
        id: `key-${crypto.randomUUID()}`,
        name: name.trim(),
        prefix: secret.slice(0, 17),
        permission,
        status: 'active',
        quota: `$${Number(quota).toFixed(2)}`,
        createdAt: 'Jul 23, 2026',
        lastUsedAt: 'Never',
        expiresAt: expiryLabels[expiry] ?? 'Never',
      })
      setSubmitting(false)
      setOpen(false)
      window.setTimeout(() => setCreatedSecret({ name: name.trim(), value: secret }), 220)
    } catch {
      setSubmitting(false)
      setSubmitError('The key could not be created. Check your connection and try again.')
    }
  }

  const formFields = (
    <div className='grid gap-5'>
      <div className='grid gap-2'>
        <Label htmlFor='create-key-name'>Name</Label>
        <Input
          id='create-key-name'
          autoFocus
          value={name}
          maxLength={48}
          placeholder='e.g. Production API'
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'create-key-name-error' : undefined}
          onChange={(event) => {
            setName(event.target.value)
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
          }}
        />
        {errors.name ? <p id='create-key-name-error' className='text-xs text-destructive'>{errors.name}</p> : null}
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='create-key-permission'>Permissions</Label>
        <Select value={permission} onValueChange={(value) => setPermission(value as KeyPermission)}>
          <SelectTrigger id='create-key-permission' className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Access level</SelectLabel>
              <SelectItem value='full'>Full access</SelectItem>
              <SelectItem value='read-write'>Read & write</SelectItem>
              <SelectItem value='read-only'>Read only</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className='text-xs text-muted-foreground'>Choose the smallest access level this integration needs.</p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='grid gap-2'>
          <Label htmlFor='create-key-expiry'>Expires</Label>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger id='create-key-expiry' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='30'>In 30 days</SelectItem>
              <SelectItem value='90'>In 90 days</SelectItem>
              <SelectItem value='365'>In 1 year</SelectItem>
              <SelectItem value='never'>No expiration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='create-key-quota'>Quota (USD)</Label>
          <Input
            id='create-key-quota'
            type='number'
            min='1'
            max='10000'
            step='1'
            value={quota}
            aria-invalid={Boolean(errors.quota)}
            aria-describedby={errors.quota ? 'create-key-quota-error' : undefined}
            onChange={(event) => {
              setQuota(event.target.value)
              if (errors.quota) setErrors((current) => ({ ...current, quota: undefined }))
            }}
          />
          {errors.quota ? <p id='create-key-quota-error' className='text-xs text-destructive'>{errors.quota}</p> : null}
        </div>
      </div>

      {submitError ? (
        <div role='alert' className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {submitError}
        </div>
      ) : null}
    </div>
  )

  const trigger = (
    <Button ref={triggerRef}>
      <Plus />Create key
    </Button>
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={changeOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side='right' className='w-full sm:max-w-md'>
            <form className='flex min-h-0 flex-1 flex-col' onSubmit={createKey} noValidate>
              <SheetHeader>
                <SheetTitle>Create API key</SheetTitle>
                <SheetDescription>Configure access, expiration, and a spending limit.</SheetDescription>
              </SheetHeader>
              <div className='min-h-0 flex-1 overflow-y-auto px-4 py-2'>{formFields}</div>
              <SheetFooter className='border-t'>
                <Button type='submit' disabled={submitting}>
                  {submitting ? <LoaderCircle className='animate-spin' /> : <Plus />}
                  {submitting ? 'Creating...' : 'Create key'}
                </Button>
                <Button type='button' variant='outline' disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className='sm:max-w-xl'>
            <form className='grid gap-5' onSubmit={createKey} noValidate>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Configure access, expiration, and a spending limit.</DialogDescription>
              </DialogHeader>
              {formFields}
              <DialogFooter>
                <Button type='button' variant='outline' disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={submitting}>
                  {submitting ? <LoaderCircle className='animate-spin' /> : <Plus />}
                  {submitting ? 'Creating...' : 'Create key'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={createdSecret !== null} onOpenChange={(nextOpen) => !nextOpen && setCreatedSecret(null)}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              Copy this key now. For security, it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <div className='grid min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-md border bg-muted/40 p-3'>
              <code className='min-w-0 break-all font-mono text-xs'>{createdSecret?.value}</code>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label='Copy API key'
                    onClick={() => createdSecret && void copyText(createdSecret.value, 'API key copied')}
                  >
                    <Copy />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy API key</TooltipContent>
              </Tooltip>
            </div>
            <div className='flex gap-2 text-sm text-muted-foreground'>
              <ShieldCheck className='mt-0.5 size-4 shrink-0' />
              <p>Store it in a secret manager. Do not commit it to source control.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedSecret(null)}>I've saved the key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className='flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center'>
      <div className='mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/40'>
        <KeyRound className='size-5 text-muted-foreground' />
      </div>
      <h2 className='text-sm font-semibold'>{filtered ? 'No matching API keys' : 'No API keys yet'}</h2>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {filtered ? 'Try a different search term or clear the current filters.' : 'Create a key to authenticate your first API request.'}
      </p>
      {filtered ? <Button variant='outline' size='sm' className='mt-4' onClick={onClear}>Clear filters</Button> : null}
    </div>
  )
}

export function ShadcnApiKeysScreen({ theme, onTheme, onNavigate }: ShadcnApiKeysScreenProps) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [permissionFilter, setPermissionFilter] = useState('all')

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase()
    return keys.filter((key) => {
      const matchesSearch = !query || key.name.toLowerCase().includes(query) || key.prefix.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || key.status === statusFilter
      const matchesPermission = permissionFilter === 'all' || key.permission === permissionFilter
      return matchesSearch && matchesStatus && matchesPermission
    })
  }, [keys, permissionFilter, search, statusFilter])

  const hasFilters = Boolean(search.trim()) || statusFilter !== 'all' || permissionFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPermissionFilter('all')
  }
  const updateStatus = (id: string, status: KeyStatus) => {
    setKeys((current) => current.map((key) => key.id === id ? { ...key, status, expiresAt: status === 'revoked' ? 'Revoked' : key.expiresAt } : key))
  }
  const deleteKey = (id: string) => setKeys((current) => current.filter((key) => key.id !== id))

  return (
    <ConsoleShell activeRoute='console-keys' theme={theme} onTheme={onTheme} onNavigate={onNavigate}>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                  <h1 className='text-2xl font-bold tracking-tight'>API keys</h1>
                  <p className='text-muted-foreground'>Create scoped credentials and control access to the Partokens API.</p>
                </div>
                <CreateKeyControl onCreate={(key) => setKeys((current) => [key, ...current])} />
              </div>

              <section aria-label='API key filters' className='flex flex-col gap-3 lg:flex-row lg:items-center'>
                <div className='relative min-w-0 flex-1 lg:max-w-sm'>
                  <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Search by name or prefix...'
                    aria-label='Search API keys'
                    className='ps-9'
                  />
                </div>
                <div className='grid grid-cols-2 gap-3 sm:flex'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-full sm:w-40' aria-label='Filter by status'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All statuses</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='expired'>Expired</SelectItem>
                      <SelectItem value='revoked'>Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                    <SelectTrigger className='w-full sm:w-44' aria-label='Filter by permission'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All permissions</SelectItem>
                      <SelectItem value='full'>Full access</SelectItem>
                      <SelectItem value='read-write'>Read & write</SelectItem>
                      <SelectItem value='read-only'>Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasFilters ? <Button variant='ghost' size='sm' className='self-start lg:self-auto' onClick={clearFilters}>Clear</Button> : null}
              </section>

              <section aria-label='API keys' className='overflow-hidden rounded-md border'>
                {filteredKeys.length ? (
                  <>
                    <div className='hidden lg:block'>
                      <Table className='min-w-[980px]'>
                        <TableHeader>
                          <TableRow className='hover:bg-transparent'>
                            <TableHead className='ps-4'>Name</TableHead>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Quota</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last used</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead><span className='sr-only'>Actions</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredKeys.map((apiKey) => (
                            <TableRow key={apiKey.id}>
                              <TableCell className='ps-4 font-medium'>{apiKey.name}</TableCell>
                              <TableCell><code className='font-mono text-xs text-muted-foreground'>{apiKey.prefix}</code></TableCell>
                              <TableCell><PermissionBadge permission={apiKey.permission} /></TableCell>
                              <TableCell><StatusBadge status={apiKey.status} /></TableCell>
                              <TableCell className='font-mono text-xs'>{apiKey.quota}</TableCell>
                              <TableCell className='text-muted-foreground'>{apiKey.createdAt}</TableCell>
                              <TableCell className='text-muted-foreground'>{apiKey.lastUsedAt}</TableCell>
                              <TableCell className='text-muted-foreground'>{apiKey.expiresAt}</TableCell>
                              <TableCell className='pe-3 text-end'>
                                <KeyActions apiKey={apiKey} onStatus={updateStatus} onDelete={deleteKey} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className='divide-y lg:hidden'>
                      {filteredKeys.map((apiKey) => (
                        <article key={apiKey.id} className='space-y-4 p-4'>
                          <div className='flex min-w-0 items-start gap-3'>
                            <div className='min-w-0 flex-1'>
                              <h2 className='truncate text-sm font-medium'>{apiKey.name}</h2>
                              <code className='mt-1 block truncate font-mono text-xs text-muted-foreground'>{apiKey.prefix}</code>
                            </div>
                            <KeyActions apiKey={apiKey} onStatus={updateStatus} onDelete={deleteKey} />
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <StatusBadge status={apiKey.status} />
                            <PermissionBadge permission={apiKey.permission} />
                          </div>
                          <dl className='grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                            <div className='min-w-0'>
                              <dt className='text-xs text-muted-foreground'>Quota</dt>
                              <dd className='mt-1 font-mono text-xs'>{apiKey.quota}</dd>
                            </div>
                            <div className='min-w-0'>
                              <dt className='text-xs text-muted-foreground'>Created</dt>
                              <dd className='mt-1 truncate'>{apiKey.createdAt}</dd>
                            </div>
                            <div className='min-w-0'>
                              <dt className='text-xs text-muted-foreground'>Last used</dt>
                              <dd className='mt-1 truncate'>{apiKey.lastUsedAt}</dd>
                            </div>
                            <div className='min-w-0'>
                              <dt className='text-xs text-muted-foreground'>Expires</dt>
                              <dd className='mt-1 truncate'>{apiKey.expiresAt}</dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState filtered={hasFilters} onClear={clearFilters} />
                )}

                <footer className='flex min-h-12 items-center justify-between gap-4 border-t px-4 py-2 text-sm text-muted-foreground'>
                  <span>{filteredKeys.length} of {keys.length} keys</span>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' disabled>Previous</Button>
                    <Button variant='outline' size='sm' disabled>Next</Button>
                  </div>
                </footer>
              </section>
    </ConsoleShell>
  )
}
