import { useEffect, useRef } from 'react';
import type { Player, Table } from '../domain/types';
import { useTranslation } from '../i18n';

interface Props {
  tables: Table[];
  players: Player[];
  onDismiss: () => void;
}

export function SeatingOverlay({ tables, players, onDismiss }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>('button');
    btn?.focus();
  }, []);

  const activeTables = tables.filter((tbl) => tbl.status === 'active');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl shadow-gray-300/40 dark:shadow-black/40 animate-scale-in"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 text-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('seating.title')}
          </h2>
        </div>

        {/* Table grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTables.map((tbl) => {
              const seatPlayers = tbl.seats.map((seat) => {
                const player = seat.playerId
                  ? players.find((p) => p.id === seat.playerId)
                  : null;
                return { seatNumber: seat.seatNumber, player };
              });
              const activeCount = seatPlayers.filter(
                (s) => s.player != null,
              ).length;

              return (
                <div
                  key={tbl.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700/40 bg-gray-50/80 dark:bg-gray-800/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--accent-500)' }}>
                      {tbl.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('multiTable.playerCount', { n: activeCount })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {seatPlayers.map(({ seatNumber, player }) => (
                      <div
                        key={seatNumber}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                          player
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        <span className="font-mono text-gray-400 dark:text-gray-500 w-5 shrink-0">
                          {seatNumber}
                        </span>
                        {player ? (
                          <span className="font-medium truncate">
                            {player.name}
                          </span>
                        ) : (
                          <span>&mdash;</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <div className="px-6 pb-5 pt-2">
          <button
            onClick={onDismiss}
            className="w-full px-6 py-3 btn-accent-gradient text-white rounded-xl text-base font-bold transition-all duration-200 active:scale-[0.97]"
          >
            {t('seating.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
