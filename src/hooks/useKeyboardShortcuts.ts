import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  mode: 'setup' | 'game' | 'league';
  onToggleStartPause: () => void;
  onNextLevel: () => void;
  onPreviousLevel: () => void;
  onResetLevel: () => void;
  onToggleCleanView: () => void;
  onLastHand: () => void;
  onToggleTVWindow: () => void;
  onHandForHand: () => void;
  onCallTheClock: () => void;
}

/**
 * Game-mode keyboard shortcuts.
 * Space = play/pause, N = next, V = previous, R = reset,
 * F = clean view, L = last hand, T = TV display, H = hand-for-hand, C = call the clock
 */
export function useKeyboardShortcuts({
  mode,
  onToggleStartPause,
  onNextLevel,
  onPreviousLevel,
  onResetLevel,
  onToggleCleanView,
  onLastHand,
  onToggleTVWindow,
  onHandForHand,
  onCallTheClock,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'game') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Ignore keyboard shortcuts when modifier keys are held (e.g. Ctrl+C, Cmd+R)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onToggleStartPause();
          break;
        case 'KeyN':
          onNextLevel();
          break;
        case 'KeyV':
          onPreviousLevel();
          break;
        case 'KeyR':
          onResetLevel();
          break;
        case 'KeyF':
          onToggleCleanView();
          break;
        case 'KeyL':
          onLastHand();
          break;
        case 'KeyT':
          onToggleTVWindow();
          break;
        case 'KeyH':
          onHandForHand();
          break;
        case 'KeyC':
          onCallTheClock();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onToggleStartPause, onNextLevel, onPreviousLevel, onResetLevel, onToggleCleanView, onLastHand, onToggleTVWindow, onHandForHand, onCallTheClock]);
}
