import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@partokens/design-system/tokens.css'
import '@partokens/design-system/primitives.css'
import '@/features/public/public-theme.css'
import '@/features/public/public.css'
import '@/features/auth/auth.css'
import '@/styles.css'
import '@/lib/i18n'
import { publicSourceUrl } from '@/lib/release'
import { router } from '@/router'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
})

const root = document.getElementById('root')
if (!root) throw new Error('Application root is missing')

if (publicSourceUrl) document.documentElement.dataset.partokensSource = publicSourceUrl

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
