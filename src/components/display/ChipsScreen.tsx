import type { ChipConfig, ChipDenomination, Level } from '../../domain/types';
import { getRemovedDenomIds, getNextColorUpLevel } from '../../domain/logic';
import { useTranslation } from '../../i18n';

interface Props {
  chipConfig: ChipConfig;
  colorUpMap: Map<number, ChipDenomination[]>;
  currentLevelIndex: number;
  levels: Level[];
}

export function ChipsScreen({ chipConfig, colorUpMap, currentLevelIndex, levels }: Props) {
  const { t } = useTranslation();
  const removedIds = getRemovedDenomIds(colorUpMap, currentLevelIndex);
  const nextColorUpLevel = getNextColorUpLevel(colorUpMap, currentLevelIndex);
  const sorted = [...chipConfig.denominations].sort((a, b) => a.value - b.value);

  return (
    <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.chips')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 overflow-hidden">
        {sorted.map((denom) => {
          const isRemoved = removedIds.has(denom.id);
          return (
            <div
              key={denom.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base transition-all ${
                isRemoved
                  ? 'opacity-30 bg-gray-900/30'
                  : 'bg-gray-800/60 border border-gray-700/40'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full shrink-0 border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: denom.color }}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate text-sm ${isRemoved ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                  {denom.label}
                </p>
                <p className={`font-mono text-xs ${isRemoved ? 'line-through text-gray-600' : 'text-gray-400'}`}>
                  {denom.value.toLocaleString()}
                </p>
              </div>
              {isRemoved && <span className="text-red-400/60 text-sm">✕</span>}
            </div>
          );
        })}
      </div>

      {/* Next color-up */}
      {chipConfig.colorUpEnabled && nextColorUpLevel !== null && (
        <div className="mt-2 text-center">
          <p className="text-amber-400/80 text-sm font-medium">
            {t('chipSidebar.nextColorUp')}:{' '}
            {(() => {
              const targetLevel = levels[nextColorUpLevel];
              const isBreak = targetLevel?.type === 'break';
              const playLevelNumber = levels
                .slice(0, nextColorUpLevel + 1)
                .filter((l) => l.type === 'level').length;
              const denoms = colorUpMap.get(nextColorUpLevel) ?? [];
              return (
                <span>
                  {isBreak
                    ? t('chipSidebar.atBreak', { level: playLevelNumber })
                    : t('chipSidebar.atLevel', { level: playLevelNumber })}
                  {' ('}
                  {denoms.map((d) => d.label).join(', ')}
                  {')'}
                </span>
              );
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
