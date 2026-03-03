import { useState, useRef, useCallback, useEffect } from 'react';
import type { Level, TimerState, Settings } from '../domain/types';
import {
  computeRemaining,
  advanceLevel,
  previousLevel as prevLevel,
  resetCurrentLevel,
  restartTournament,
} from '../domain/logic';
import { initAudio, playBeep } from '../domain/sounds';

const TICK_INTERVAL_MS = 100;

export function useTimer(levels: Level[], settings: Settings, pauseAtLevelIndex?: number) {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    restartTournament(levels),
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountdownSecRef = useRef<number | null>(null);
  const levelEndAudioPlayedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick function: compute remaining from wall clock
  const tick = useCallback(() => {
    setTimerState((prev) => {
      if (prev.status !== 'running' || prev.startedAt === null || prev.remainingAtStart === null) {
        return prev;
      }

      const now = Date.now();
      const remaining = computeRemaining(prev.startedAt, prev.remainingAtStart, now);

      // Countdown beeps for last 10 seconds
      if (settings.countdownEnabled && settings.soundEnabled) {
        const sec = Math.ceil(remaining);
        if (sec <= 10 && sec > 0 && sec !== lastCountdownSecRef.current) {
          lastCountdownSecRef.current = sec;
          playBeep(sec <= 3 ? 880 : 660, 100);
        }
      }

      if (remaining <= 0) {
        // Level ended
        if (!levelEndAudioPlayedRef.current) {
          levelEndAudioPlayedRef.current = true;
          if (settings.soundEnabled) playBeep(1000, 500);
        }

        if (settings.autoAdvance) {
          const next = advanceLevel(prev, levels);
          lastCountdownSecRef.current = null;
          levelEndAudioPlayedRef.current = false;
          if (next.status === 'stopped' && next.currentLevelIndex > prev.currentLevelIndex) {
            // Pause instead of auto-start when reaching add-on level (no break)
            if (pauseAtLevelIndex !== undefined && next.currentLevelIndex === pauseAtLevelIndex) {
              return { ...next, status: 'paused' };
            }
            // Auto-start the next level
            return {
              ...next,
              status: 'running',
              startedAt: now,
              remainingAtStart: next.remainingSeconds,
            };
          }
          return next;
        }

        return {
          ...prev,
          remainingSeconds: 0,
          status: 'stopped',
          startedAt: null,
          remainingAtStart: null,
        };
      }

      return { ...prev, remainingSeconds: remaining };
    });
  }, [levels, settings.autoAdvance, settings.countdownEnabled, settings.soundEnabled, pauseAtLevelIndex]);

  // Start the interval when running
  useEffect(() => {
    if (timerState.status === 'running') {
      clearTick();
      intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    } else {
      clearTick();
    }
    return clearTick;
  }, [timerState.status, tick, clearTick]);

  // Reset timer state when levels change externally (e.g. preset switch)
  // This is a legitimate prop→state sync — setState is needed to reset the timer.
  const prevLevelsRef = useRef(levels);
  useEffect(() => {
    if (levels !== prevLevelsRef.current) {
      prevLevelsRef.current = levels;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimerState(restartTournament(levels));
      // clearTick will happen via the status-based useEffect above
      // since restartTournament returns status='stopped'
    }
  }, [levels]);

  const start = useCallback(() => {
    initAudio(); // Unlock AudioContext from user gesture (required by Safari)
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => {
      if (prev.status === 'running') return prev;
      const now = Date.now();
      return {
        ...prev,
        status: 'running',
        startedAt: now,
        remainingAtStart: prev.remainingSeconds,
      };
    });
  }, []);

  const pause = useCallback(() => {
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => {
      if (prev.status !== 'running' || prev.startedAt === null || prev.remainingAtStart === null) return prev;
      const remaining = computeRemaining(prev.startedAt, prev.remainingAtStart, Date.now());
      return {
        ...prev,
        status: 'paused',
        remainingSeconds: remaining,
        startedAt: null,
        remainingAtStart: null,
      };
    });
  }, []);

  const toggleStartPause = useCallback(() => {
    initAudio(); // Unlock AudioContext from user gesture (required by Safari)
    setTimerState((prev) => {
      if (prev.status === 'running') {
        // Pause
        lastCountdownSecRef.current = null;
        levelEndAudioPlayedRef.current = false;
        if (prev.startedAt === null || prev.remainingAtStart === null) return prev;
        const remaining = computeRemaining(prev.startedAt, prev.remainingAtStart, Date.now());
        return {
          ...prev,
          status: 'paused',
          remainingSeconds: remaining,
          startedAt: null,
          remainingAtStart: null,
        };
      } else {
        // Start / Resume
        if (prev.remainingSeconds <= 0) return prev;
        lastCountdownSecRef.current = null;
        levelEndAudioPlayedRef.current = false;
        const now = Date.now();
        return {
          ...prev,
          status: 'running',
          startedAt: now,
          remainingAtStart: prev.remainingSeconds,
        };
      }
    });
  }, []);

  const nextLevel = useCallback(() => {
    initAudio(); // Unlock AudioContext from user gesture
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    const now = Date.now();
    setTimerState((prev) => {
      const next = advanceLevel(prev, levels);
      if (next.remainingSeconds > 0) {
        return { ...next, status: 'running', startedAt: now, remainingAtStart: next.remainingSeconds };
      }
      return next;
    });
    // Eagerly restart the tick interval — when status was already 'running',
    // the useEffect won't re-fire (no status change), so we must restart here.
    // If the level has no time left, the tick is a no-op and useEffect cleans up.
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
  }, [levels, clearTick, tick]);

  const previousLevel = useCallback(() => {
    initAudio(); // Unlock AudioContext from user gesture
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    const now = Date.now();
    setTimerState((prev) => {
      const next = prevLevel(prev, levels);
      if (next.remainingSeconds > 0) {
        return { ...next, status: 'running', startedAt: now, remainingAtStart: next.remainingSeconds };
      }
      return next;
    });
    // Eagerly restart the tick interval (same reason as nextLevel above)
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
  }, [levels, clearTick, tick]);

  const resetLevel = useCallback(() => {
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => resetCurrentLevel(prev, levels));
  }, [levels, clearTick]);

  const restart = useCallback(() => {
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState(restartTournament(levels));
  }, [levels, clearTick]);

  const setRemainingSeconds = useCallback((seconds: number) => {
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => ({
      ...prev,
      remainingSeconds: Math.max(0, Math.min(seconds, levels[prev.currentLevelIndex]?.durationSeconds ?? 0)),
      status: 'paused' as const,
      startedAt: null,
      remainingAtStart: null,
    }));
  }, [levels, clearTick]);

  const restoreLevel = useCallback((levelIndex: number, remaining: number) => {
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    const clamped = Math.max(0, Math.min(levelIndex, levels.length - 1));
    setTimerState({
      currentLevelIndex: clamped,
      remainingSeconds: Math.max(0, remaining),
      status: 'paused',
      startedAt: null,
      remainingAtStart: null,
    });
  }, [levels, clearTick]);

  return {
    timerState,
    start,
    pause,
    toggleStartPause,
    nextLevel,
    previousLevel,
    resetLevel,
    restart,
    setRemainingSeconds,
    restoreLevel,
  };
}
