// ---------------------------------------------------------------------------
// Lightweight toast notification system — module-level state, no Context.
// Components call `showToast('message')` to display a toast.
// ---------------------------------------------------------------------------

export interface ToastItem {
  id: number;
  message: string;
}

export type ToastListener = (toasts: ToastItem[]) => void;

let nextId = 0;
let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  for (const listener of listeners) {
    listener([...toasts]);
  }
}

/**
 * Show a toast notification for 3 seconds.
 */
export function showToast(message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, message }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

/**
 * Dismiss a specific toast by ID.
 */
export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/**
 * Subscribe to toast state changes. Returns unsubscribe function.
 */
export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
