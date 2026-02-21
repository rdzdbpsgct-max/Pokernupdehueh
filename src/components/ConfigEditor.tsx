import { useState } from 'react';
import type { Level, TournamentConfig } from '../domain/types';
import { generateId, validateConfig, formatTime } from '../domain/logic';

interface Props {
  config: TournamentConfig;
  onChange: (config: TournamentConfig) => void;
  anteEnabled: boolean;
}

export function ConfigEditor({ config, onChange, anteEnabled }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const firstLevelMinutes = Math.round(
    (config.levels.find((l) => l.type === 'level')?.durationSeconds ?? 600) / 60,
  );
  const [globalMinutes, setGlobalMinutes] = useState(firstLevelMinutes);

  const applyGlobalDuration = () => {
    const seconds = Math.max(60, globalMinutes * 60);
    const newLevels = config.levels.map((l) =>
      l.type === 'level' ? { ...l, durationSeconds: seconds } : l,
    );
    onChange({ ...config, levels: newLevels });
  };

  const updateLevel = (index: number, partial: Partial<Level>) => {
    const newLevels = config.levels.map((l, i) =>
      i === index ? { ...l, ...partial } : l,
    );
    const newConfig = { ...config, levels: newLevels };
    onChange(newConfig);
    setErrors(validateConfig(newConfig).map((e) => e.message));
  };

  const addLevel = () => {
    const last = config.levels[config.levels.length - 1];
    const newLevel: Level = {
      id: generateId(),
      type: 'level',
      durationSeconds: last?.durationSeconds ?? 900,
      smallBlind: last?.bigBlind ?? 50,
      bigBlind: (last?.bigBlind ?? 50) * 2,
      ante: last?.ante ?? 0,
    };
    onChange({ ...config, levels: [...config.levels, newLevel] });
  };

  const addBreak = () => {
    const newBreak: Level = {
      id: generateId(),
      type: 'break',
      durationSeconds: 600,
      label: 'Break',
    };
    onChange({ ...config, levels: [...config.levels, newBreak] });
  };

  const duplicateLevel = (index: number) => {
    const dup = { ...config.levels[index], id: generateId() };
    const newLevels = [...config.levels];
    newLevels.splice(index + 1, 0, dup);
    onChange({ ...config, levels: newLevels });
  };

  const removeLevel = (index: number) => {
    if (config.levels.length <= 1) return;
    onChange({ ...config, levels: config.levels.filter((_, i) => i !== index) });
  };

  const moveLevel = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= config.levels.length) return;
    const newLevels = [...config.levels];
    [newLevels[index], newLevels[newIndex]] = [newLevels[newIndex], newLevels[index]];
    onChange({ ...config, levels: newLevels });
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          {errors.map((e, i) => (
            <p key={i} className="text-red-400 text-xs">{e}</p>
          ))}
        </div>
      )}

      {/* Global duration */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
        <label className="text-gray-400 text-xs whitespace-nowrap">Alle Levels:</label>
        <input
          type="number"
          min={1}
          value={globalMinutes}
          onChange={(e) => setGlobalMinutes(Math.max(1, Number(e.target.value)))}
          className="w-16 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
        />
        <span className="text-gray-500 text-xs">Min</span>
        <button
          onClick={applyGlobalDuration}
          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded text-xs font-medium transition-colors"
        >
          Übernehmen
        </button>
      </div>

      {/* Levels */}
      <div className="space-y-2">
        {config.levels.map((level, i) => (
          <div
            key={level.id}
            className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${
              level.type === 'break'
                ? 'bg-amber-900/20 border-amber-800'
                : 'bg-gray-800/50 border-gray-700'
            }`}
          >
            {/* Index */}
            <span className="text-gray-500 text-xs w-6 text-center">{i + 1}</span>

            {/* Type badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                level.type === 'break'
                  ? 'bg-amber-800 text-amber-200'
                  : 'bg-emerald-800 text-emerald-200'
              }`}
            >
              {level.type === 'break' ? 'Break' : 'Level'}
            </span>

            {/* Duration */}
            <div className="flex items-center gap-1">
              <label className="text-gray-500 text-xs">Min:</label>
              <input
                type="number"
                min={1}
                value={Math.round(level.durationSeconds / 60)}
                onChange={(e) =>
                  updateLevel(i, { durationSeconds: Math.max(60, Number(e.target.value) * 60) })
                }
                className="w-16 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
              />
              <span className="text-gray-600 text-xs font-mono">{formatTime(level.durationSeconds)}</span>
            </div>

            {/* Blinds (only for level type) */}
            {level.type === 'level' && (
              <>
                <div className="flex items-center gap-1">
                  <label className="text-gray-500 text-xs">SB:</label>
                  <input
                    type="number"
                    min={1}
                    value={level.smallBlind ?? 0}
                    onChange={(e) => updateLevel(i, { smallBlind: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-gray-500 text-xs">BB:</label>
                  <input
                    type="number"
                    min={1}
                    value={level.bigBlind ?? 0}
                    onChange={(e) => updateLevel(i, { bigBlind: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {anteEnabled && (
                  <div className="flex items-center gap-1">
                    <label className="text-gray-500 text-xs">Ante:</label>
                    <input
                      type="number"
                      min={0}
                      value={level.ante ?? 0}
                      onChange={(e) => updateLevel(i, { ante: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </>
            )}

            {/* Break label */}
            {level.type === 'break' && (
              <div className="flex items-center gap-1">
                <label className="text-gray-500 text-xs">Label:</label>
                <input
                  type="text"
                  value={level.label ?? 'Break'}
                  onChange={(e) => updateLevel(i, { label: e.target.value })}
                  className="w-24 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => moveLevel(i, -1)}
                disabled={i === 0}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
                title="Nach oben"
              >
                ▲
              </button>
              <button
                onClick={() => moveLevel(i, 1)}
                disabled={i === config.levels.length - 1}
                className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
                title="Nach unten"
              >
                ▼
              </button>
              <button
                onClick={() => duplicateLevel(i)}
                className="p-1 text-gray-500 hover:text-blue-400 text-xs"
                title="Duplizieren"
              >
                ⧉
              </button>
              <button
                onClick={() => removeLevel(i)}
                disabled={config.levels.length <= 1}
                className="p-1 text-gray-500 hover:text-red-400 disabled:opacity-30 text-xs"
                title="Löschen"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          onClick={addLevel}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-lg text-sm font-medium transition-colors"
        >
          + Level
        </button>
        <button
          onClick={addBreak}
          className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-200 rounded-lg text-sm font-medium transition-colors"
        >
          + Break
        </button>
      </div>
    </div>
  );
}
