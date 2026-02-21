import type { RebuyConfig } from '../domain/types';
import { formatTime } from '../domain/logic';

interface Props {
  active: boolean;
  rebuy: RebuyConfig;
  currentPlayLevel: number;
  elapsedSeconds: number;
}

export function RebuyStatus({ active, rebuy, currentPlayLevel, elapsedSeconds }: Props) {
  if (!rebuy.enabled) return null;

  if (active) {
    let detail = '';
    if (rebuy.limitType === 'levels') {
      detail = `bis Level ${rebuy.levelLimit} (aktuell ${currentPlayLevel})`;
    } else {
      const remaining = Math.max(0, rebuy.timeLimit - elapsedSeconds);
      detail = `noch ${formatTime(remaining)}`;
    }

    return (
      <div className="px-4 py-2 bg-emerald-900/40 border border-emerald-700 rounded-lg text-center">
        <span className="text-emerald-400 text-sm font-medium">
          ♻ Rebuy aktiv
        </span>
        <span className="text-emerald-500/70 text-xs ml-2">({detail})</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
      <span className="text-gray-500 text-sm">Rebuy beendet</span>
    </div>
  );
}
