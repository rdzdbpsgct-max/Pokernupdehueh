import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './theme'
import { LanguageProvider } from './i18n'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <App />
          <Analytics />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
