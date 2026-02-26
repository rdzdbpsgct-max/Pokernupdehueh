import { useState, useMemo } from 'react';
import type { Level, ChipConfig } from '../domain/types';
import type { BlindSpeed } from '../domain/logic';
import { generateBlindStructure, estimateAllDurations, formatTime } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  startingChips: number;
  anteEnabled: boolean;
  playerCount: number;
  chipConfig: ChipConfig;
  onApply: (levels: Level[]) => void;
}

export function BlindGenerator({ startingChips, anteEnabled, playerCount, chipConfig, onApply }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
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
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-200">
          {t('blindGenerator.title')}
        </span>
        <span className="text-gray-500 text-xs">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-gray-900/50">
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
                      ? 'bg-emerald-700/50 border border-emerald-600 text-white'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{speed.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{speed.desc}</span>
                  {estimate && (
                    <span className={`text-xs mt-1 ${isSelected ? 'text-emerald-300' : 'text-gray-500'}`}>
                      {formatDuration(estimate.totalSeconds)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Level count info */}
          <p className="text-xs text-gray-500">
            {t('blindGenerator.levels', { n: previewPlayLevels.length, b: previewBreaks.length })}
          </p>

          {/* Preview table */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">
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
                        className="flex items-center px-2 py-1 bg-amber-900/20 rounded text-xs"
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
                      className="flex items-center px-2 py-1 bg-gray-800/50 rounded text-xs"
                    >
                      <span className="text-gray-500 w-12">L{playNum}</span>
                      <span className="text-white font-mono">
                        {level.smallBlind}/{level.bigBlind}
                      </span>
                      {anteEnabled && level.ante != null && level.ante > 0 && (
                        <span className="text-gray-500 ml-2">
                          (Ante {level.ante})
                        </span>
                      )}
                      <span className="text-gray-500 ml-auto">
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
            onClick={() => {
              onApply(preview);
              setOpen(false);
            }}
            className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('blindGenerator.apply')}
          </button>
        </div>
      )}
    </div>
  );
}
