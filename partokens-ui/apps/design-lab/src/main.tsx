import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { ConsoleLanguageProvider } from './shadcn-console-shell'
import '@partokens/design-system/tokens.css'
import '@partokens/design-system/primitives.css'
import './design-lab-theme.css'
import './styles.css'
import './public-prototype.css'
import './auth-prototype.css'
import './console-data-prototype.css'
import './console-account-prototype.css'
import './console-playground-prototype.css'
import './console-studio-prototype.css'
import './shadcn-admin.css'

const root = document.getElementById('root')
if (!root) throw new Error('Design lab root is missing')

createRoot(root).render(
  <StrictMode>
    <ConsoleLanguageProvider>
      <App />
    </ConsoleLanguageProvider>
  </StrictMode>,
)
