import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  onClose: () => void;
  /** ARIA label id for the dialog title */
  ariaLabelledBy: string;
  /** Max width for desktop centered modal (default: max-w-2xl) */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * Responsive modal wrapper:
 * - **Mobile (<768px)**: Slide-up bottom sheet, rounded top, swipe-to-dismiss via drag handle
 * - **Desktop (≥768px)**: Traditional centered modal (existing pattern, unchanged)
 *
 * `useDialogA11y` provides focus-trap, Escape-to-close, and auto-focus.
 */
export function BottomSheet({ onClose, ariaLabelledBy, maxWidth = 'max-w-2xl', children }: Props) {
  const dialogRef = useDialogA11y(onClose);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const translateYRef = useRef(0);

  // Swipe-to-dismiss (pointer events on drag handle, mobile only)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    translateYRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartYRef.current === null) return;
    const dy = e.clientY - dragStartYRef.current;
    if (dy > 0) {
      translateYRef.current = dy;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${dy}px)`;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    if (translateYRef.current > 100) {
      // Dismiss
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(100%)';
        sheetRef.current.style.transition = 'transform 0.2s ease-out';
      }
      setTimeout(onClose, 200);
    } else {
      // Snap back
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
        sheetRef.current.style.transition = 'transform 0.2s ease-out';
      }
    }
    translateYRef.current = 0;
  }, [onClose]);

  // Reset transition after snap animation
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handleTransitionEnd = () => { sheet.style.transition = ''; };
    sheet.addEventListener('transitionend', handleTransitionEnd);
    return () => sheet.removeEventListener('transitionend', handleTransitionEnd);
  }, []);

  const maxWidthClass = maxWidth === 'max-w-md' ? 'md:max-w-md' : 'md:max-w-2xl';

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 md:flex md:items-center md:justify-center md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Outer sheet div for swipe tracking (mobile) */}
      <div
        ref={sheetRef}
        className={`bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 shadow-2xl shadow-gray-300/40 dark:shadow-black/40 flex flex-col fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] animate-[slide-up_0.3s_ease-out] md:static md:rounded-2xl md:max-h-[85vh] md:w-full md:animate-scale-in ${maxWidthClass}`}
      >
        {/* Drag handle — mobile only */}
        <div
          className="md:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Inner dialog div for focus-trap (useDialogA11y) */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
