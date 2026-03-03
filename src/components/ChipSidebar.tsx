import { useState } from 'react';
import type { ChipConfig, ChipDenomination, Level } from '../domain/types';
import { getRemovedDenomIds, getNextColorUpLevel } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  chipConfig: ChipConfig;
  colorUpMap: Map<number, ChipDenomination[]>;
  currentLevelIndex: number;
  levels: Level[];
}

export function ChipSidebar({ chipConfig, colorUpMap, currentLevelIndex, levels }: Props) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const removedIds = getRemovedDenomIds(colorUpMap, currentLevelIndex);
  const nextColorUpLevel = getNextColorUpLevel(colorUpMap, currentLevelIndex);

  const sorted = [...chipConfig.denominations].sort((a, b) => a.value - b.value);

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">
          {t('chipSidebar.title')}
        </h3>
        <span className="text-gray-500 text-xs">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-1">
          {sorted.map((denom) => {
            const isRemoved = removedIds.has(denom.id);
            return (
              <div
                key={denom.id}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm ${
                  isRemoved ? 'opacity-40' : 'bg-gray-800/40 border border-gray-700/20'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full shrink-0 border ${
                    isRemoved ? 'border-gray-600' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: denom.color }}
                />
                <span
                  className={`flex-1 ${
                    isRemoved ? 'line-through text-gray-500' : 'text-gray-300'
                  }`}
                >
                  {denom.label}
                </span>
                <span
                  className={`font-mono text-xs ${
                    isRemoved ? 'line-through text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {denom.value.toLocaleString()}
                </span>
                {isRemoved && <span className="text-xs text-red-400/70">✕</span>}
              </div>
            );
          })}

          {/* Next color-up info (only when color-up is enabled) */}
          {chipConfig.colorUpEnabled && (
            <div className="pt-1 border-t border-gray-700/40 mt-2">
              {nextColorUpLevel !== null ? (
                <div className="text-xs text-amber-400/80">
                  <span className="font-medium">{t('chipSidebar.nextColorUp')}: </span>
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
                </div>
              ) : (
                <p className="text-xs text-gray-500">{t('chipSidebar.noMore')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
