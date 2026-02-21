import { useState } from 'react';
import type { PayoutConfig, PayoutMode } from '../domain/types';
import { validatePayoutConfig } from '../domain/logic';

interface Props {
  payout: PayoutConfig;
  onChange: (payout: PayoutConfig) => void;
}

export function PayoutEditor({ payout, onChange }: Props) {
  const [errors, setErrors] = useState<string[]>([]);

  const setMode = (mode: PayoutMode) => {
    const updated = { ...payout, mode };
    onChange(updated);
    setErrors(validatePayoutConfig(updated));
  };

  const updateEntry = (index: number, value: number) => {
    const entries = payout.entries.map((e, i) =>
      i === index ? { ...e, value } : e,
    );
    const updated = { ...payout, entries };
    onChange(updated);
    setErrors(validatePayoutConfig(updated));
  };

  const addPlace = () => {
    const nextPlace = payout.entries.length + 1;
    const updated = {
      ...payout,
      entries: [...payout.entries, { place: nextPlace, value: 0 }],
    };
    onChange(updated);
    setErrors(validatePayoutConfig(updated));
  };

  const removeLastPlace = () => {
    if (payout.entries.length <= 1) return;
    const updated = {
      ...payout,
      entries: payout.entries.slice(0, -1),
    };
    onChange(updated);
    setErrors(validatePayoutConfig(updated));
  };

  const setPlaceCount = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    let entries = [...payout.entries];
    if (clamped > entries.length) {
      for (let i = entries.length; i < clamped; i++) {
        entries.push({ place: i + 1, value: 0 });
      }
    } else {
      entries = entries.slice(0, clamped);
    }
    const updated = { ...payout, entries };
    onChange(updated);
    setErrors(validatePayoutConfig(updated));
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('percent')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            payout.mode === 'percent'
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          % Prozent
        </button>
        <button
          onClick={() => setMode('euro')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            payout.mode === 'euro'
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          € Euro
        </button>
      </div>

      {/* Place count */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Bezahlte Plätze</label>
        <input
          type="number"
          min={1}
          max={10}
          value={payout.entries.length}
          onChange={(e) => setPlaceCount(Number(e.target.value))}
          className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {payout.entries.map((entry, i) => (
          <div key={entry.place} className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-16">Platz {entry.place}</span>
            <input
              type="number"
              min={0}
              step={payout.mode === 'percent' ? 5 : 1}
              value={entry.value}
              onChange={(e) => updateEntry(i, Number(e.target.value))}
              className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-emerald-500"
            />
            <span className="text-gray-500 text-sm">
              {payout.mode === 'percent' ? '%' : '€'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={addPlace}
          disabled={payout.entries.length >= 10}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-xs font-medium transition-colors disabled:opacity-30"
        >
          + Platz
        </button>
        <button
          onClick={removeLastPlace}
          disabled={payout.entries.length <= 1}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-xs font-medium transition-colors disabled:opacity-30"
        >
          − Platz
        </button>
      </div>

      {/* Validation */}
      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-2">
          {errors.map((e, i) => (
            <p key={i} className="text-red-400 text-xs">{e}</p>
          ))}
        </div>
      )}

      {/* Sum display for percent */}
      {payout.mode === 'percent' && (
        <p className="text-xs text-gray-500">
          Summe: {payout.entries.reduce((s, e) => s + e.value, 0)}%
        </p>
      )}
    </div>
  );
}
