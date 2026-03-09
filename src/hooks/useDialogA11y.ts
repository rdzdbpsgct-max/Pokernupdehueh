import { useRef, useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';

/**
 * Accessibility hook for modal dialogs.
 * - Focuses the first focusable element on mount
 * - Traps focus within the dialog (Tab / Shift+Tab cycle)
 * - Returns focus to the previously focused element on unmount
 * - Closes on Escape key press
 * Returns a ref to attach to the dialog's content container.
 */
export function useDialogA11y(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Remember the element that was focused before the dialog opened
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const el = dialogRef.current;
    if (!el) return;

    // Focus the first interactive element inside the dialog
    const focusable = el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: cycle Tab within dialog
      if (e.key === 'Tab') {
        const focusableElements = Array.from(
          el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      // Return focus to the previously focused element
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return dialogRef;
}
