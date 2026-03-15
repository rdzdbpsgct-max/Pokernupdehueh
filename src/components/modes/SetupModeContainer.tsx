import type { Dispatch, SetStateAction } from 'react';
import type { TournamentConfig, TournamentCheckpoint, Settings } from '../../domain/types';
import { SetupPage } from '../SetupPage';

interface Props {
  config: TournamentConfig;
  setConfig: Dispatch<SetStateAction<TournamentConfig>>;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  onShowCustomAudio: () => void;
  pendingCheckpoint: TournamentCheckpoint | null;
  onRestoreCheckpoint: () => void;
  onDismissCheckpoint: () => void;
  onSwitchToGame: () => void;
  onConfirm: (title: string, message: string, confirmLabel: string, onConfirm: () => void) => void;
  startErrors: string[];
}

export function SetupModeContainer({
  config,
  setConfig,
  settings,
  onSettingsChange,
  onShowCustomAudio,
  pendingCheckpoint,
  onRestoreCheckpoint,
  onDismissCheckpoint,
  onSwitchToGame,
  onConfirm,
  startErrors,
}: Props) {
  return (
    <SetupPage
      config={config}
      setConfig={setConfig}
      settings={settings}
      onSettingsChange={onSettingsChange}
      onShowCustomAudio={onShowCustomAudio}
      pendingCheckpoint={pendingCheckpoint}
      onRestoreCheckpoint={onRestoreCheckpoint}
      onDismissCheckpoint={onDismissCheckpoint}
      onSwitchToGame={onSwitchToGame}
      onConfirm={onConfirm}
      startErrors={startErrors}
    />
  );
}
