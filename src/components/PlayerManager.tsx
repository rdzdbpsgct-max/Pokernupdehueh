import { useState } from 'react';
import type { Player } from '../domain/types';
import { generatePlayerId } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  players: Player[];
  onChange: (players: Player[]) => void;
}

/**
 * Inner component that owns countInput state.
 * Re-keyed externally when players.length changes to reset the input.
 */
function PlayerManagerInner({ players, onChange }: Props) {
  const { t } = useTranslation();
  const [countInput, setCountInput] = useState(String(players.length));

  const setPlayerCount = (count: number) => {
    const clamped = Math.max(2, Math.min(20, count));
    if (clamped > players.length) {
      const newPlayers = [...players];
      for (let i = players.length; i < clamped; i++) {
        newPlayers.push({ id: generatePlayerId(), name: t('playerManager.playerN', { n: i + 1 }), rebuys: 0, status: 'active', placement: null, eliminatedBy: null, knockouts: 0 });
      }
      onChange(newPlayers);
    } else if (clamped < players.length) {
      onChange(players.slice(0, clamped));
    }
  };

  const applyCountInput = () => {
    const n = Number(countInput);
    if (!isNaN(n) && n >= 2 && n <= 20) {
      setPlayerCount(n);
    } else {
      setCountInput(String(players.length));
    }
  };

  const updateName = (index: number, name: string) => {
    const updated = players.map((p, i) => (i === index ? { ...p, name } : p));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Player count */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400 uppercase tracking-wider">{t('playerManager.count')}</label>
        <input
          type="number"
          min={2}
          max={20}
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          onBlur={applyCountInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Player list */}
      {players.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.map((player, i) => (
            <div key={player.id} className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-5 text-right">{i + 1}.</span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={t('playerManager.playerN', { n: i + 1 })}
                className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper that re-keys the inner component when players.length changes,
 * resetting the countInput state without useEffect + setState.
 */
export function PlayerManager({ players, onChange }: Props) {
  return (
    <PlayerManagerInner
      key={players.length}
      players={players}
      onChange={onChange}
    />
  );
}
