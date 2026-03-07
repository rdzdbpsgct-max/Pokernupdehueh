import type { Level } from '../../domain/types';
import { getLevelLabel, getBlindsText, formatTime } from '../../domain/logic';
import { useTranslation } from '../../i18n';

interface Props {
  levels: Level[];
  currentLevelIndex: number;
}

export function ScheduleScreen({ levels, currentLevelIndex }: Props) {
  const { t } = useTranslation();
  const visibleCount = 8;
  const start = Math.max(0, currentLevelIndex - 1);
  const end = Math.min(levels.length, start + visibleCount);
  const visible = levels.slice(start, end);

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.schedule')}
      </h2>
      <div className="space-y-1 flex-1 overflow-hidden">
        {visible.map((level, vi) => {
          const i = start + vi;
          const isCurrent = i === currentLevelIndex;
          const isPast = i < currentLevelIndex;
          const levelLabel = getLevelLabel(level, i, levels);

          return (
            <div
              key={level.id}
              className={`flex items-center justify-between px-4 py-1.5 rounded-lg text-sm sm:text-base transition-all ${
                isCurrent
                  ? level.type === 'break'
                    ? 'bg-amber-900/40 border border-amber-500/70 text-amber-200 shadow-lg shadow-amber-900/20'
                    : 'bg-emerald-900/40 border border-emerald-500/70 text-white shadow-lg shadow-emerald-900/20'
                  : isPast
                  ? 'bg-gray-900/30 text-gray-600 line-through'
                  : level.type === 'break'
                  ? 'bg-amber-950/20 text-amber-400/70 border border-amber-800/30'
                  : 'bg-gray-900/40 text-gray-400 border border-gray-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                {isCurrent && <span className="text-emerald-400 text-base">▸</span>}
                <span className="font-medium">{levelLabel}</span>
                {level.type === 'level' && (
                  <span className={isCurrent ? 'text-gray-300' : 'text-gray-500'}>{getBlindsText(level)}</span>
                )}
                {level.type === 'level' && level.ante != null && level.ante > 0 && (
                  <span className={`text-xs ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                    (Ante {level.ante})
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-gray-500">{formatTime(level.durationSeconds)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
