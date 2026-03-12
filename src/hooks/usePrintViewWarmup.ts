import { useEffect, useState } from 'react';

export function usePrintViewWarmup(delayMs = 15000): boolean {
  const [printViewReady, setPrintViewReady] = useState(false);

  useEffect(() => {
    const enablePrintView = () => setPrintViewReady(true);

    // Warm up print-only chunk off the critical path.
    const warmupId = window.setTimeout(enablePrintView, delayMs);
    window.addEventListener('beforeprint', enablePrintView);

    const printMedia = window.matchMedia?.('print');
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) enablePrintView();
    };
    printMedia?.addEventListener?.('change', onMediaChange);

    return () => {
      window.clearTimeout(warmupId);
      window.removeEventListener('beforeprint', enablePrintView);
      printMedia?.removeEventListener?.('change', onMediaChange);
    };
  }, [delayMs]);

  return printViewReady;
}
