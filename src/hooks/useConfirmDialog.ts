import { useState, useRef, useEffect, useCallback } from 'react';

export interface ConfirmAction {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * Manages a confirm-dialog state with auto-focus and Escape-to-close.
 */
export function useConfirmDialog() {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus first focusable element & close on Escape
  useEffect(() => {
    if (!confirmAction) return;
    const el = dialogRef.current;
    if (el) {
      const focusable = el.querySelector<HTMLElement>('button, input, [tabindex]');
      focusable?.focus();
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmAction(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [confirmAction]);

  const confirm = useCallback(
    (title: string, message: string, confirmLabel: string, onConfirm: () => void) => {
      setConfirmAction({ title, message, confirmLabel, onConfirm });
    },
    [],
  );

  const dismiss = useCallback(() => setConfirmAction(null), []);

  const execute = useCallback(() => {
    if (confirmAction) {
      confirmAction.onConfirm();
      setConfirmAction(null);
    }
  }, [confirmAction]);

  return { confirmAction, dialogRef, confirm, dismiss, execute };
}
