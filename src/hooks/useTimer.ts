import { useState, useRef, useCallback, useEffect } from 'react';
import type { Level, TimerState, Settings } from '../domain/types';
import {
  computeRemaining,
  advanceLevel,
  previousLevel as prevLevel,
  resetCurrentLevel,
  restartTournament,
} from '../domain/logic';

const TICK_INTERVAL_MS = 100;

export function useTimer(levels: Level[], settings: Settings) {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    restartTournament(levels),
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownAudioRef = useRef<AudioContext | null>(null);
  const lastCountdownSecRef = useRef<number | null>(null);
  const levelEndAudioPlayedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Play a beep using Web Audio API
  const playBeep = useCallback(
    (frequency: number, durationMs: number) => {
      if (!settings.soundEnabled) return;
      try {
        if (!countdownAudioRef.current) {
          countdownAudioRef.current = new AudioContext();
        }
        const ctx = countdownAudioRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
      } catch {
        // audio not available
      }
    },
    [settings.soundEnabled],
  );

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
          playBeep(1000, 500);
        }

        if (settings.autoAdvance) {
          const next = advanceLevel(prev, levels);
          lastCountdownSecRef.current = null;
          levelEndAudioPlayedRef.current = false;
          if (next.status === 'stopped' && next.currentLevelIndex > prev.currentLevelIndex) {
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
  }, [levels, settings.autoAdvance, settings.countdownEnabled, settings.soundEnabled, playBeep]);

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
  const [prevLevels, setPrevLevels] = useState(levels);
  if (levels !== prevLevels) {
    setPrevLevels(levels);
    setTimerState(restartTournament(levels));
    // clearTick will happen via the status-based useEffect above
    // since restartTournament returns status='stopped'
  }

  const start = useCallback(() => {
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
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => {
      const next = advanceLevel(prev, levels);
      // Auto-start the timer when jumping to a new level
      if (next.remainingSeconds > 0) {
        const now = Date.now();
        return { ...next, status: 'running', startedAt: now, remainingAtStart: next.remainingSeconds };
      }
      return next;
    });
  }, [levels, clearTick]);

  const previousLevel = useCallback(() => {
    clearTick();
    lastCountdownSecRef.current = null;
    levelEndAudioPlayedRef.current = false;
    setTimerState((prev) => {
      const next = prevLevel(prev, levels);
      // Auto-start the timer when jumping to a previous level
      if (next.remainingSeconds > 0) {
        const now = Date.now();
        return { ...next, status: 'running', startedAt: now, remainingAtStart: next.remainingSeconds };
      }
      return next;
    });
  }, [levels, clearTick]);

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
  };
}
