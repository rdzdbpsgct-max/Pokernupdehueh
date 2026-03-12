interface InitSentryOptions {
  dsn: string;
  environment: string;
}

/**
 * Keep Sentry out of the initial app path and load only browser runtime features.
 */
export async function initSentry({ dsn, environment }: InitSentryOptions): Promise<void> {
  const Sentry = await import('@sentry/browser');
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment,
  });
}
