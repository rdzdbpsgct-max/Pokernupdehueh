import { useState, useMemo, useCallback } from 'react';
import type { TournamentConfig, Table, TableMove } from '../domain/types';
import { balanceTables, getActivePlayersPerTable } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  config: TournamentConfig;
  onUpdateTables: (tables: Table[]) => void;
  onTableMoves: (moves: TableMove[]) => void;
}

export function MultiTablePanel({ config, onUpdateTables, onTableMoves }: Props) {
  const { t } = useTranslation();
  const [recentMoves, setRecentMoves] = useState<TableMove[]>([]);

  const tables = useMemo(() => config.tables ?? [], [config.tables]);

  const activeCountMap = useMemo(
    () => getActivePlayersPerTable(tables, config.players),
    [tables, config.players],
  );

  // Check if tables are unbalanced (max diff > 1)
  const isUnbalanced = useMemo(() => {
    const counts = tables.map(tbl => activeCountMap.get(tbl.id) ?? 0);
    if (counts.length < 2) return false;
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    return max - min > 1;
  }, [tables, activeCountMap]);

  const isFinalTable = tables.length === 1;

  const handleBalance = useCallback(() => {
    const result = balanceTables(tables, config.players);
    onUpdateTables(result.tables);
    setRecentMoves(result.moves);
    if (result.moves.length > 0) {
      onTableMoves(result.moves);
    }
  }, [tables, config.players, onUpdateTables, onTableMoves]);

  // Map player IDs to player names
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    config.players.forEach(p => map.set(p.id, p.name));
    return map;
  }, [config.players]);

  if (tables.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t('multiTable.tables')}
        </h3>
        {isFinalTable && (
          <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
            {t('multiTable.finalTable')}
          </span>
        )}
      </div>

      {/* Table list */}
      <div className="space-y-2">
        {tables.map((tbl) => {
          const activeCount = activeCountMap.get(tbl.id) ?? 0;
          const tablePlayers = tbl.playerIds
            .map(id => ({ id, name: playerNameMap.get(id) ?? id }))
            .filter(p => config.players.find(pl => pl.id === p.id)?.status === 'active');

          return (
            <div
              key={tbl.id}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/40 rounded-lg p-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {tbl.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('multiTable.playerCount', { n: activeCount })} / {tbl.seats} {t('multiTable.seats')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tablePlayers.map(p => (
                  <span
                    key={p.id}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {p.name}
                  </span>
                ))}
                {tablePlayers.length === 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance button */}
      {tables.length > 1 && (
        <button
          onClick={handleBalance}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isUnbalanced
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30 active:scale-[0.97]'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('multiTable.balance')}
        </button>
      )}

      {/* Recent moves */}
      {recentMoves.length > 0 && (
        <div className="space-y-1 animate-fade-in">
          {recentMoves.map((move, i) => (
            <div
              key={`${move.playerId}-${i}`}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/40 rounded-lg text-xs text-amber-700 dark:text-amber-300"
            >
              {t('multiTable.moveAnnouncement', { player: move.playerName, table: move.toTableName })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
