import { useRef, useEffect } from 'react';

/**
 * Accessibility hook for modal dialogs.
 * - Focuses the first focusable element on mount
 * - Closes on Escape key press
 * Returns a ref to attach to the dialog's content container.
 */
export function useDialogA11y(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    // Focus the first interactive element inside the dialog
    const focusable = el.querySelector<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return dialogRef;
}
