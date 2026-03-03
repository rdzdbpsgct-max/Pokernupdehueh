import { useState, useMemo } from 'react';
import type { Level, ChipConfig } from '../domain/types';
import type { BlindSpeed } from '../domain/logic';
import { generateBlindStructure, estimateAllDurations, formatTime } from '../domain/logic';
import { useTranslation } from '../i18n';
import { CollapsibleSubSection } from './CollapsibleSubSection';

interface Props {
  startingChips: number;
  anteEnabled: boolean;
  playerCount: number;
  chipConfig: ChipConfig;
  onApply: (levels: Level[]) => void;
}

export function BlindGenerator({ startingChips, anteEnabled, playerCount, chipConfig, onApply }: Props) {
  const { t } = useTranslation();
  const [selectedSpeed, setSelectedSpeed] = useState<BlindSpeed>('normal');

  // When chips are enabled, use smallest denomination as rounding base
  const smallestChip = useMemo(() => {
    if (!chipConfig.enabled || chipConfig.denominations.length === 0) return undefined;
    return Math.min(...chipConfig.denominations.map((d) => d.value));
  }, [chipConfig.enabled, chipConfig.denominations]);

  const estimates = useMemo(
    () => estimateAllDurations(startingChips, anteEnabled, playerCount, smallestChip),
    [startingChips, anteEnabled, playerCount, smallestChip],
  );

  const preview = useMemo(
    () => generateBlindStructure({ startingChips, speed: selectedSpeed, anteEnabled, smallestChip }),
    [startingChips, selectedSpeed, anteEnabled, smallestChip],
  );

  const previewPlayLevels = preview.filter((l) => l.type === 'level');
  const previewBreaks = preview.filter((l) => l.type === 'break');

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.round((totalSeconds % 3600) / 60);
    return t('blindGenerator.duration', { h, m });
  };

  const speeds: { key: BlindSpeed; label: string; desc: string }[] = [
    { key: 'fast', label: t('blindGenerator.fast'), desc: t('blindGenerator.fastDesc') },
    { key: 'normal', label: t('blindGenerator.normal'), desc: t('blindGenerator.normalDesc') },
    { key: 'slow', label: t('blindGenerator.slow'), desc: t('blindGenerator.slowDesc') },
  ];

  return (
    <CollapsibleSubSection title={t('blindGenerator.title')} defaultOpen={false}>
      <div className="space-y-4">
        {/* Speed selection with duration estimates */}
        <div className="flex flex-wrap gap-2">
          {speeds.map((speed) => {
            const estimate = estimates.find((e) => e.speed === speed.key);
            const isSelected = selectedSpeed === speed.key;
            return (
              <button
                key={speed.key}
                onClick={() => setSelectedSpeed(speed.key)}
                className={`flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors flex-1 min-w-[100px] ${
                  isSelected
                    ? 'bg-emerald-700/40 border border-emerald-500/60 text-gray-900 dark:text-white shadow-md shadow-emerald-900/20'
                    : 'bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/40 hover:border-gray-300 dark:hover:border-gray-600/70 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80'
                }`}
              >
                <span className="text-sm font-medium">{speed.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{speed.desc}</span>
                {estimate && (
                  <span className={`text-xs mt-1 ${isSelected ? 'text-emerald-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatDuration(estimate.totalSeconds)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Level count info */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('blindGenerator.levels', { n: previewPlayLevels.length, b: previewBreaks.length })}
        </p>

        {/* Preview table */}
        <div>
          <h4 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            {t('blindGenerator.preview')}
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {(() => {
              let playNum = 0;
              return preview.map((level, idx) => {
                if (level.type === 'break') {
                  return (
                    <div
                      key={level.id || idx}
                      className="flex items-center px-2 py-1 bg-amber-900/15 rounded-lg text-xs border border-amber-800/20"
                    >
                      <span className="text-amber-400 font-medium w-12">
                        {t('blindGenerator.break')}
                      </span>
                      <span className="text-amber-500/70 ml-auto">
                        {formatTime(level.durationSeconds)}
                      </span>
                    </div>
                  );
                }
                playNum++;
                return (
                  <div
                    key={level.id || idx}
                    className="flex items-center px-2 py-1 bg-gray-100/80 dark:bg-gray-800/40 rounded-lg text-xs border border-gray-200 dark:border-gray-700/20"
                  >
                    <span className="text-gray-400 dark:text-gray-500 w-12">L{playNum}</span>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {level.smallBlind}/{level.bigBlind}
                    </span>
                    {anteEnabled && level.ante != null && level.ante > 0 && (
                      <span className="text-gray-400 dark:text-gray-500 ml-2">
                        (Ante {level.ante})
                      </span>
                    )}
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">
                      {formatTime(level.durationSeconds)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Apply button */}
        <button
          onClick={() => onApply(preview)}
          className="w-full px-4 py-2 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-emerald-900/20 active:scale-[0.98]"
        >
          {t('blindGenerator.apply')}
        </button>
      </div>
    </CollapsibleSubSection>
  );
}
