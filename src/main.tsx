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
import { initStorage } from './domain/storage'

// Sentry error tracking — only active when VITE_SENTRY_DSN env var is set (Vercel production)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0,
      environment: import.meta.env.MODE,
    });
  }).catch(() => { /* Sentry init failed silently */ });
}

const isDisplayWindow = window.location.hash === '#display';

function renderApp() {
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
}

// Initialize IndexedDB storage before mounting React.
// Typically completes in <50ms. Falls back to localStorage if unavailable.
initStorage().then(renderApp).catch(renderApp)
