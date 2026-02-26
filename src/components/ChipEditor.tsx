import { useState, useMemo } from 'react';
import type { ChipConfig, ChipDenomination, Level } from '../domain/types';
import {
  generateChipId,
  chipPresets,
  applyChipPreset,
  CHIP_COLORS,
  computeColorUps,
} from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  chips: ChipConfig;
  onChange: (chips: ChipConfig) => void;
  levels: Level[];
}

/** Sort denominations by value (ascending) and return new config. */
function sortedChipConfig(config: ChipConfig): ChipConfig {
  const sorted = [...config.denominations].sort((a, b) => a.value - b.value);
  // Only create new object if order actually changed
  const changed = sorted.some((d, i) => d.id !== config.denominations[i].id);
  return changed ? { ...config, denominations: sorted } : config;
}

export function ChipEditor({ chips, onChange, levels }: Props) {
  const { t, language } = useTranslation();
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  // Auto-sort wrapper: every change automatically sorts by value
  const emitChange = (config: ChipConfig) => {
    onChange(sortedChipConfig(config));
  };

  const toggle = () => {
    const newEnabled = !chips.enabled;
    if (newEnabled && chips.denominations.length === 0) {
      emitChange(applyChipPreset(chipPresets[1]));
    } else {
      emitChange({ ...chips, enabled: newEnabled });
    }
  };

  const updateDenomination = (id: string, partial: Partial<ChipDenomination>) => {
    emitChange({
      ...chips,
      denominations: chips.denominations.map((d) =>
        d.id === id ? { ...d, ...partial } : d,
      ),
    });
  };

  const removeDenomination = (id: string) => {
    emitChange({
      ...chips,
      denominations: chips.denominations.filter((d) => d.id !== id),
    });
    if (editingColorId === id) setEditingColorId(null);
  };

  const addDenomination = () => {
    const usedColors = new Set(chips.denominations.map((d) => d.color));
    const available = CHIP_COLORS.find((c) => !usedColors.has(c.hex));
    const color = available ?? CHIP_COLORS[0];
    const maxVal = chips.denominations.reduce((m, d) => Math.max(m, d.value), 0);
    emitChange({
      ...chips,
      denominations: [
        ...chips.denominations,
        {
          id: generateChipId(),
          value: maxVal > 0 ? maxVal * 2 : 25,
          color: color.hex,
          label: language === 'de' ? color.de : color.en,
        },
      ],
    });
  };

  // Detect duplicate colors
  const duplicateColors = useMemo(() => {
    const colorCount = new Map<string, number>();
    for (const d of chips.denominations) {
      colorCount.set(d.color, (colorCount.get(d.color) ?? 0) + 1);
    }
    const dupes = new Set<string>();
    for (const [color, count] of colorCount) {
      if (count > 1) dupes.add(color);
    }
    return dupes;
  }, [chips.denominations]);

  // Display sorted (chips.denominations is already sorted after emitChange, but
  // on first render it may not be — use a sorted view just in case)
  const sorted = [...chips.denominations].sort((a, b) => a.value - b.value);

  const presetKeys = ['4', '5', '6'] as const;

  return (
    <div className="space-y-3">
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          chips.enabled
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
        }`}
      >
        {chips.enabled ? t('chipEditor.enabled') : t('chipEditor.disabled')}
      </button>

      {chips.enabled && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-800">
          <p className="text-xs text-gray-500">{t('chipEditor.description')}</p>

          {/* Preset buttons */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">
              {t('chipEditor.presets')}
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {chipPresets.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => emitChange(applyChipPreset(p))}
                  className="flex flex-col items-start px-3 py-2 bg-gray-800 hover:bg-gray-700
                             border border-gray-700 hover:border-emerald-600 rounded-lg
                             transition-colors text-left"
                >
                  <span className="text-white font-medium text-xs">
                    {t(`chipEditor.preset${presetKeys[i]}` as const)}
                  </span>
                  <span className="text-gray-400 text-xs mt-0.5">
                    {t(`chipEditor.preset${presetKeys[i]}Desc` as const)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Duplicate color warning */}
          {duplicateColors.size > 0 && (
            <div className="px-3 py-2 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-amber-300 text-xs font-medium">
                {t('chipEditor.duplicateColor')}
              </p>
            </div>
          )}

          {/* Denomination list */}
          <div className="space-y-1">
            {sorted.map((denom) => {
              const isDuplicate = duplicateColors.has(denom.color);
              return (
              <div key={denom.id}>
                <div className={`flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded ${
                  isDuplicate ? 'ring-1 ring-amber-600/50' : ''
                }`}>
                  {/* Color swatch */}
                  <button
                    onClick={() =>
                      setEditingColorId(editingColorId === denom.id ? null : denom.id)
                    }
                    className={`w-6 h-6 rounded-full border-2 shrink-0 hover:border-gray-400 transition-colors ${
                      isDuplicate ? 'border-amber-500' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: denom.color }}
                    title={denom.label}
                  />

                  {/* Label */}
                  <span className="text-xs text-gray-400 w-14 truncate">{denom.label}</span>

                  {/* Value input */}
                  <input
                    type="number"
                    min={1}
                    value={denom.value}
                    onChange={(e) =>
                      updateDenomination(denom.id, {
                        value: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded
                               text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                  />

                  {/* Remove button */}
                  <button
                    onClick={() => removeDenomination(denom.id)}
                    className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-300
                               text-xs font-medium transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Inline color palette */}
                {editingColorId === denom.id && (
                  <div className="flex flex-wrap gap-1.5 pl-8 py-1">
                    {CHIP_COLORS.map((c) => {
                      const isUsedByOther = chips.denominations.some(
                        (d) => d.id !== denom.id && d.color === c.hex,
                      );
                      return (
                        <button
                          key={c.hex}
                          onClick={() => {
                            updateDenomination(denom.id, {
                              color: c.hex,
                              label: language === 'de' ? c.de : c.en,
                            });
                            setEditingColorId(null);
                          }}
                          className={`w-7 h-7 rounded-full border-2 transition-colors relative ${
                            denom.color === c.hex
                              ? 'border-emerald-400 ring-1 ring-emerald-400'
                              : isUsedByOther
                                ? 'border-amber-500/50 opacity-50'
                                : 'border-gray-600 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={language === 'de' ? c.de : c.en}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {/* Add denomination button */}
          {chips.denominations.length < 10 && (
            <button
              onClick={addDenomination}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400
                         rounded text-sm transition-colors"
            >
              {t('chipEditor.addDenomination')}
            </button>
          )}

          {/* Color-Up toggle + preview */}
          {chips.denominations.length >= 2 && (
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => emitChange({ ...chips, colorUpEnabled: !chips.colorUpEnabled })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  chips.colorUpEnabled
                    ? 'bg-amber-700/50 hover:bg-amber-700/70 text-amber-200'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                }`}
              >
                {chips.colorUpEnabled ? t('chipEditor.colorUpEnabled') : t('chipEditor.colorUpDisabled')}
              </button>
              {chips.colorUpEnabled && (
                <div className="mt-2">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t('chipEditor.colorUpPreview')}
                  </h4>
                  <ColorUpPreview levels={levels} denominations={chips.denominations} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ColorUpPreview({
  levels,
  denominations,
}: {
  levels: Level[];
  denominations: ChipDenomination[];
}) {
  const { t } = useTranslation();
  const colorUpMap = computeColorUps(levels, denominations);

  if (colorUpMap.size === 0) {
    return <p className="text-xs text-gray-500">{t('chipEditor.noColorUps')}</p>;
  }

  const entries = [...colorUpMap.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-1">
      {entries.map(([levelIdx, denoms]) => {
        const targetLevel = levels[levelIdx];
        const isBreak = targetLevel?.type === 'break';
        const playLevelNumber = levels
          .slice(0, levelIdx + 1)
          .filter((l) => l.type === 'level').length;
        const chipNames = denoms.map((d) => d.label).join(', ');
        return (
          <div key={levelIdx} className="flex items-center gap-2 text-xs">
            {denoms.map((d) => (
              <span
                key={d.id}
                className="w-4 h-4 rounded-full inline-block border border-gray-600"
                style={{ backgroundColor: d.color }}
              />
            ))}
            <span className="text-amber-400">
              {isBreak
                ? t('chipEditor.colorUpAtBreak', { level: playLevelNumber, chips: chipNames })
                : t('chipEditor.colorUpAtLevel', { level: playLevelNumber, chips: chipNames })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
