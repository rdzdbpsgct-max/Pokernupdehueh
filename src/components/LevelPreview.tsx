import type { Level, TimerState } from '../domain/types';
import { getLevelLabel, getBlindsText, formatTime } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  timerState: TimerState;
  levels: Level[];
}

export function LevelPreview({ timerState, levels }: Props) {
  const { t } = useTranslation();
  const nextIndex = timerState.currentLevelIndex + 1;

  return (
    <div className="w-full max-w-xl">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t('levelPreview.title')}</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {levels.map((level, i) => {
          const isCurrent = i === timerState.currentLevelIndex;
          const isPast = i < timerState.currentLevelIndex;
          const isNext = i === nextIndex;

          return (
            <div
              key={level.id}
              className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                isCurrent
                  ? 'bg-emerald-900/50 border border-emerald-600 text-white'
                  : isNext
                  ? 'bg-gray-800 border border-gray-600 text-gray-200'
                  : isPast
                  ? 'bg-gray-900/30 text-gray-600 line-through'
                  : 'bg-gray-900/50 text-gray-400'
              }`}
            >
              <span className="flex items-center gap-2">
                {isCurrent && <span className="text-emerald-400">▸</span>}
                {isNext && <span className="text-gray-400">▸</span>}
                <span>{getLevelLabel(level, i, levels)}</span>
                {level.type === 'level' && (
                  <span className="text-gray-500">{getBlindsText(level)}</span>
                )}
              </span>
              <span className="text-gray-500 font-mono text-xs">
                {formatTime(level.durationSeconds)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
