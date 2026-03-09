import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './theme'
import { LanguageProvider } from './i18n'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.tsx'
import { TVDisplayWindow } from './components/display'

const isDisplayWindow = window.location.hash === '#display';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          {isDisplayWindow ? (
            <TVDisplayWindow />
          ) : (
            <>
              <App />
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
