import type { Player } from '../../domain/types';
import { findChipLeader } from '../../domain/logic';
import { useTranslation } from '../../i18n';

interface Props {
  players: Player[];
}

export function PlayersScreen({ players }: Props) {
  const { t } = useTranslation();
  const chipLeaderId = findChipLeader(players);
  const activePlayers = players.filter((p) => p.status === 'active');
  const eliminatedPlayers = [...players]
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0));

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
        {t('display.players')} ({activePlayers.length}/{players.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 flex-1 overflow-hidden">
        {activePlayers.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/40 text-sm"
          >
            <span className="text-gray-500 font-mono text-xs w-5 shrink-0">{i + 1}</span>
            <span className="text-gray-200 font-medium truncate flex-1">{p.name}</span>
            {p.id === chipLeaderId && (
              <span className="text-amber-400 text-xs font-bold shrink-0">{t('display.chipLeaderBadge')}</span>
            )}
            {p.rebuys > 0 && (
              <span className="text-emerald-400/70 text-xs shrink-0">R{p.rebuys}</span>
            )}
          </div>
        ))}
      </div>
      {eliminatedPlayers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 justify-center">
          {eliminatedPlayers.map((p) => (
            <span key={p.id} className="text-gray-600 text-xs">
              {p.placement ?? '?'}. {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
