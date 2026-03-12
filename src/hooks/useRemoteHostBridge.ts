import { useCallback, useEffect, useRef } from 'react';
import type { SetStateAction } from 'react';
import type { RemoteCommand } from '../domain/remote';
import type { Settings, TimerState, TournamentConfig } from '../domain/types';
import type { TranslationKey } from '../i18n';
import { useRemoteControl } from './useRemoteControl';

type AppMode = 'setup' | 'game' | 'league';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface TimerControls {
  toggleStartPause: () => void;
  start: () => void;
  pause: () => void;
  nextLevel: () => void;
  previousLevel: () => void;
  resetLevel: () => void;
}

interface UseRemoteHostBridgeParams {
  mode: AppMode;
  config: TournamentConfig;
  settings: Settings;
  timerState: TimerState;
  timerControls: TimerControls;
  activePlayerCount: number;
  bubbleActive: boolean;
  onAdvanceDealer: () => void;
  setShowCallTheClock: (value: SetStateAction<boolean>) => void;
  setSettings: (value: SetStateAction<Settings>) => void;
  t: Translate;
}

export function useRemoteHostBridge({
  mode,
  config,
  settings,
  timerState,
  timerControls,
  activePlayerCount,
  bubbleActive,
  onAdvanceDealer,
  setShowCallTheClock,
  setSettings,
  t,
}: UseRemoteHostBridgeParams) {
  const handleRemoteCommand = useCallback((cmd: RemoteCommand) => {
    switch (cmd.action) {
      case 'toggle':
        timerControls.toggleStartPause();
        break;
      case 'play':
        timerControls.start();
        break;
      case 'pause':
        timerControls.pause();
        break;
      case 'next':
        timerControls.nextLevel();
        break;
      case 'prev':
        timerControls.previousLevel();
        break;
      case 'reset':
        timerControls.resetLevel();
        break;
      case 'call-the-clock':
        setShowCallTheClock((value) => !value);
        break;
      case 'advanceDealer':
        onAdvanceDealer();
        break;
      case 'toggleSound':
        setSettings((prev) => ({
          ...prev,
          soundEnabled: !prev.soundEnabled,
          voiceEnabled: !prev.voiceEnabled,
        }));
        break;
    }
  }, [timerControls, onAdvanceDealer, setShowCallTheClock, setSettings]);

  const {
    hostRef: remoteHostRef,
    hostStatus: remoteHostStatus,
    showRemoteModal: showRemoteControl,
    setShowRemoteModal: setShowRemoteControl,
    isControllerMode,
    controllerPeerId,
    controllerSecret,
    startHost: startRemoteHost,
  } = useRemoteControl({
    onCommand: handleRemoteCommand,
    enabled: mode === 'game',
  });

  const remoteStateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const host = remoteHostRef.current;
    if (!host || !host.connected || mode !== 'game') return;

    const sendRemoteState = () => {
      const currentLevel = config.levels[timerState.currentLevelIndex];
      const levelLabel = currentLevel?.type === 'break'
        ? (currentLevel.label || t('config.break'))
        : `Level ${config.levels.slice(0, timerState.currentLevelIndex + 1).filter((level) => level.type === 'level').length}`;

      const smallBlind = currentLevel?.type === 'level' ? currentLevel.smallBlind : 0;
      const bigBlind = currentLevel?.type === 'level' ? currentLevel.bigBlind : 0;
      const ante = currentLevel?.type === 'level' ? currentLevel.ante : undefined;

      host.sendState({
        timerStatus: timerState.status === 'running' ? 'running' : 'paused',
        remainingSeconds: timerState.remainingSeconds,
        currentLevelIndex: timerState.currentLevelIndex,
        levelLabel,
        smallBlind: smallBlind ?? 0,
        bigBlind: bigBlind ?? 0,
        ante,
        activePlayerCount,
        totalPlayerCount: config.players.length,
        isBubble: bubbleActive,
        tournamentName: config.name,
        soundEnabled: settings.soundEnabled,
      });
    };

    sendRemoteState();

    if (remoteStateIntervalRef.current) clearInterval(remoteStateIntervalRef.current);
    if (timerState.status === 'running') {
      remoteStateIntervalRef.current = setInterval(sendRemoteState, 1000);
    }

    return () => {
      if (remoteStateIntervalRef.current) {
        clearInterval(remoteStateIntervalRef.current);
        remoteStateIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- remainingSeconds intentionally excluded: interval handles periodic sync
  }, [
    mode,
    timerState.status,
    timerState.currentLevelIndex,
    config.levels,
    config.players,
    config.name,
    activePlayerCount,
    bubbleActive,
    settings.soundEnabled,
    t,
    remoteHostRef,
  ]);

  return {
    remoteHostRef,
    remoteHostStatus,
    showRemoteControl,
    setShowRemoteControl,
    isControllerMode,
    controllerPeerId,
    controllerSecret,
    startRemoteHost,
  };
}
