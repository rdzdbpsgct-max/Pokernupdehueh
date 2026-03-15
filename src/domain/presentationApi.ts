/**
 * Presentation API — progressive enhancement for second-screen display.
 *
 * The Presentation API allows a web app to open a URL on a connected external
 * display (Chromecast, HDMI, wireless display) directly from the browser.
 * Supported in Chrome/Edge on desktop and Android. Not supported in Safari/Firefox.
 *
 * We use this as an optional enhancement — never the only path.
 */

export function isPresentationApiAvailable(): boolean {
  try {
    return typeof navigator !== 'undefined' && 'presentation' in navigator && typeof PresentationRequest !== 'undefined';
  } catch {
    return false;
  }
}

export function buildPresentationUrl(peerId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#display=${peerId}`;
}

/**
 * Start a Presentation API session — opens the display URL on an external screen.
 * Returns the PresentationConnection or null if cancelled/failed.
 */
export async function startPresentation(peerId: string): Promise<unknown> {
  if (!isPresentationApiAvailable()) return null;

  const url = buildPresentationUrl(peerId);
  try {
    const request = new PresentationRequest([url]);
    const connection = await request.start();
    return connection;
  } catch (err: unknown) {
    // User cancelled or no displays available — this is expected
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return null;
    }
    console.warn('[PresentationAPI] Failed to start:', err);
    return null;
  }
}
