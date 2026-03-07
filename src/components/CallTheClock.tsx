import { useState, useEffect, useRef, useCallback } from 'react';
import { playBeep } from '../domain/sounds';
import { announceCallTheClock, announceCallTheClockExpired } from '../domain/speech';
import { useTranslation } from '../i18n';

interface Props {
  durationSeconds: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onClose: () => void;
}

export function CallTheClock({ durationSeconds, soundEnabled, voiceEnabled, onClose }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(durationSeconds);
  const startRef = useRef(0);
  const lastBeepRef = useRef(-1);

  // Drift-free countdown using wall-clock
  useEffect(() => {
    startRef.current = Date.now();
    if (voiceEnabled) announceCallTheClock(durationSeconds, t);
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const r = Math.max(0, durationSeconds - elapsed);
      setRemaining(r);
      if (r <= 0) return;
      rafId = requestAnimationFrame(tick);
    };
    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationSeconds, voiceEnabled, t]);

  // Tension beeps in last 10 seconds
  useEffect(() => {
    const secs = Math.ceil(remaining);
    if (soundEnabled && secs <= 10 && secs > 0 && secs !== lastBeepRef.current) {
      lastBeepRef.current = secs;
      playBeep(secs <= 3 ? 880 : 660, 80);
    }
  }, [remaining, soundEnabled]);

  // Auto-close at 0
  useEffect(() => {
    if (remaining <= 0) {
      if (soundEnabled) {
        playBeep(440, 500);
      }
      if (voiceEnabled) announceCallTheClockExpired(t);
      const timeout = setTimeout(onClose, 1500);
      return () => clearTimeout(timeout);
    }
  }, [remaining, soundEnabled, voiceEnabled, t, onClose]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Escape' || e.code === 'KeyC') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const displaySeconds = Math.ceil(remaining);
  const progress = remaining / durationSeconds;
  const isUrgent = displaySeconds <= 10;
  const isExpired = displaySeconds <= 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 p-8 rounded-2xl bg-gray-900 border border-gray-700/40 shadow-2xl animate-scale-in text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">
          {t('callTheClock.title')}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{t('callTheClock.subtitle')}</p>

        {/* Large countdown */}
        <div className={`text-8xl font-mono font-bold tabular-nums mb-6 transition-colors ${
          isExpired ? 'text-red-500 animate-countdown-pulse' :
          isUrgent ? 'text-red-400' : 'text-white'
        }`}>
          {isExpired ? t('callTheClock.timeUp') : displaySeconds}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isUrgent ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(0, progress * 100)}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('callTheClock.dismiss')}
        </button>

        {/* Hint */}
        <p className="text-xs text-gray-600 mt-3">
          <kbd className="px-1.5 py-0.5 bg-gray-800/80 rounded-md border border-gray-700/50 text-gray-500 shadow-sm shadow-black/10">C</kbd>
          {' '}{t('callTheClock.shortcutHint')}
        </p>
      </div>
    </div>
  );
}
