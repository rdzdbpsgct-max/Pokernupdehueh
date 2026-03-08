import { useEffect, useRef, useCallback } from 'react';
import type { TournamentConfig, Settings, TimerState, ChipDenomination } from '../domain/types';
import type { TranslationKey } from '../i18n/translations';
import {
  announceLevelChange,
  announceBreakStart,
  announceBreakWarning,
  announceBreakOver,
  announceAddOn,
  announceRebuyEnded,
  announceColorUp,
  announceColorUpWarning,
  announceBounty,
  announceElimination,
  announceRebuyAvailable,
  announceFiveMinutes,
  announceThreeRemaining,
  announcePlayersRemaining,
  announceHeadsUp,
  announceTimerPaused,
  announceTimerResumed,
} from '../domain/speech';

interface Params {
  mode: 'setup' | 'game' | 'league';
  settings: Settings;
  config: TournamentConfig;
  timerState: TimerState;
  colorUpMap: Map<number, ChipDenomination[]>;
  activePlayerCount: number;
  paidPlaces: number;
  bubbleActive: boolean;
  inTheMoney: boolean;
  addOnWindowOpen: boolean;
  rebuyActive: boolean;
  tournamentFinished: boolean;
  onLevelChange: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function useVoiceAnnouncements({
  mode,
  settings,
  config,
  timerState,
  colorUpMap,
  activePlayerCount,
  paidPlaces,
  addOnWindowOpen,
  rebuyActive,
  tournamentFinished,
  onLevelChange,
  t,
}: Params) {
  // Voice: Level change announcement
  const prevLevelIdxVoiceRef = useRef(timerState.currentLevelIndex);
  useEffect(() => {
    if (mode !== 'game' || !settings.voiceEnabled) return;
    const idx = timerState.currentLevelIndex;
    if (idx === prevLevelIdxVoiceRef.current) return;
    const prevIdx = prevLevelIdxVoiceRef.current;
    prevLevelIdxVoiceRef.current = idx;
    onLevelChange();

    const level = config.levels[idx];
    if (!level) return;

    if (level.type === 'break') {
      const minutes = Math.round(level.durationSeconds / 60);
      announceBreakStart(minutes, t, level.label);
    } else {
      const prevLevel = config.levels[prevIdx];
      if (prevLevel?.type === 'break') {
        announceBreakOver(t);
      }

      const playLevelNum = config.levels.slice(0, idx + 1).filter(l => l.type === 'level').length;
      announceLevelChange(playLevelNum, level.smallBlind ?? 0, level.bigBlind ?? 0, level.ante, t);

      // Color-up warning: next level is a break with color-up event
      if (config.chips.enabled && config.chips.colorUpEnabled) {
        const nextLevel = config.levels[idx + 1];
        if (nextLevel?.type === 'break') {
          const nextColorUpChips = colorUpMap.get(idx + 1);
          if (nextColorUpChips && nextColorUpChips.length > 0) {
            announceColorUpWarning(t);
          }
        }
      }
    }

    // Color-up announcement — queued after the level/break announcement
    if (config.chips.enabled && config.chips.colorUpEnabled) {
      const colorUpChips = colorUpMap.get(idx);
      if (colorUpChips && colorUpChips.length > 0) {
        const labels = colorUpChips.map((d: { label: string }) => d.label).join(', ');
        announceColorUp(labels, t);
      }
    }
  }, [mode, timerState.currentLevelIndex, config.levels, config.chips, colorUpMap, settings.voiceEnabled, onLevelChange, t]);

  // Voice: Break warning (30 seconds remaining in break)
  const breakWarningRef = useRef(false);
  useEffect(() => {
    if (mode !== 'game' || !settings.voiceEnabled) return;
    const level = config.levels[timerState.currentLevelIndex];
    if (!level || level.type !== 'break') {
      breakWarningRef.current = false;
      return;
    }
    const remaining = timerState.remainingSeconds;
    if (remaining <= 30 && remaining > 28 && !breakWarningRef.current) {
      breakWarningRef.current = true;
      announceBreakWarning(t);
    }
    if (remaining > 30) {
      breakWarningRef.current = false;
    }
  }, [mode, settings.voiceEnabled, config.levels, timerState.currentLevelIndex, timerState.remainingSeconds, t]);

  // Voice: Five-minute warning (play levels > 5 min only)
  const fiveMinWarningRef = useRef(false);
  useEffect(() => {
    if (mode !== 'game' || !settings.voiceEnabled) return;
    const level = config.levels[timerState.currentLevelIndex];
    if (!level || level.type !== 'level' || level.durationSeconds <= 300) {
      fiveMinWarningRef.current = false;
      return;
    }
    const remaining = timerState.remainingSeconds;
    if (remaining <= 300 && remaining > 298 && !fiveMinWarningRef.current) {
      fiveMinWarningRef.current = true;
      announceFiveMinutes(t);
    }
    if (remaining > 300) {
      fiveMinWarningRef.current = false;
    }
  }, [mode, settings.voiceEnabled, config.levels, timerState.currentLevelIndex, timerState.remainingSeconds, t]);

  // Voice: Player elimination + Bounty collected
  const prevPlayersRef = useRef(config.players);
  useEffect(() => {
    if (mode !== 'game' || !settings.voiceEnabled) return;
    const prev = prevPlayersRef.current;
    prevPlayersRef.current = config.players;
    for (const player of config.players) {
      if (player.status === 'eliminated' && player.placement !== null) {
        const prevPlayer = prev.find(p => p.id === player.id);
        if (prevPlayer && prevPlayer.status === 'active') {
          announceElimination(t);
          if (config.bounty.enabled) announceBounty(t);
          if (rebuyActive) announceRebuyAvailable(t);
          break;
        }
      }
    }
  }, [mode, config.players, settings.voiceEnabled, config.bounty.enabled, rebuyActive, t]);

  // Voice: Player count milestones (dynamic based on paidPlaces) + Heads-Up
  const prevActiveCountRef = useRef(activePlayerCount);
  useEffect(() => {
    if (mode === 'game' && settings.voiceEnabled) {
      const prev = prevActiveCountRef.current;
      if (activePlayerCount < prev) {
        if (activePlayerCount === 2) {
          announceHeadsUp(t);
        } else if (activePlayerCount === 3) {
          announceThreeRemaining(t);
        } else if (activePlayerCount >= 4 && activePlayerCount <= paidPlaces) {
          announcePlayersRemaining(activePlayerCount, t);
        }
      }
    }
    prevActiveCountRef.current = activePlayerCount;
  }, [mode, activePlayerCount, paidPlaces, settings.voiceEnabled, t]);

  // Voice: Timer paused/resumed (user-initiated only, not on tournament finish)
  const prevTimerStatusRef = useRef(timerState.status);
  useEffect(() => {
    const status = timerState.status;
    const prevStatus = prevTimerStatusRef.current;
    prevTimerStatusRef.current = status;

    if (mode !== 'game' || !settings.voiceEnabled || tournamentFinished) return;

    if (status === 'paused' && prevStatus === 'running') {
      announceTimerPaused(t);
    }
    if (status === 'running' && prevStatus === 'paused') {
      announceTimerResumed(t);
    }
  }, [mode, settings.voiceEnabled, timerState.status, tournamentFinished, t]);

  // Voice: Rebuy ended + Add-On available when addOnWindowOpen becomes true
  const prevAddOnWindowRef = useRef(false);
  useEffect(() => {
    if (addOnWindowOpen && !prevAddOnWindowRef.current && settings.voiceEnabled && mode === 'game') {
      announceRebuyEnded(t);
      announceAddOn(t);
    }
    prevAddOnWindowRef.current = addOnWindowOpen;
  }, [addOnWindowOpen, settings.voiceEnabled, mode, t]);

  // Voice: Rebuy ended (without add-on)
  const prevRebuyForVoice = useRef(rebuyActive);
  useEffect(() => {
    if (prevRebuyForVoice.current && !rebuyActive && !config.addOn.enabled && config.rebuy.enabled
        && settings.voiceEnabled && mode === 'game') {
      announceRebuyEnded(t);
    }
    prevRebuyForVoice.current = rebuyActive;
  }, [rebuyActive, config.addOn.enabled, config.rebuy.enabled, settings.voiceEnabled, mode, t]);

  // Reset function for switchToSetup
  const reset = useCallback(() => {
    fiveMinWarningRef.current = false;
    breakWarningRef.current = false;
  }, []);

  return { reset };
}
