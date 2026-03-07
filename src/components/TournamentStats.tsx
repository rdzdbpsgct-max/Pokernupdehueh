import type { Player, Level } from '../domain/types';
import { formatElapsedTime, computeAverageStackInBB } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  players: Player[];
  levels: Level[];
  currentLevelIndex: number;
  averageStack: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
  prizePool: number;
  rebuyPot?: number;
}

export function TournamentStats({
  players,
  levels,
  currentLevelIndex,
  averageStack,
  elapsedSeconds,
  estimatedRemainingSeconds,
  prizePool,
  rebuyPot,
}: Props) {
  const { t } = useTranslation();
  const activePlayers = players.filter((p) => p.status === 'active').length;
  const totalPlayers = players.length;

  const currentLevel = levels[currentLevelIndex];
  const currentBB = currentLevel?.type === 'level' ? (currentLevel.bigBlind ?? 0) : 0;
  const avgStackBB = computeAverageStackInBB(averageStack, currentBB);

  return (
    <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-2 bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl text-xs border border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-200/30 dark:shadow-black/10">
      <StatItem label={t('stats.players')} value={`${activePlayers}/${totalPlayers}`} />
      <StatItem label={t('stats.prizePool')} value={`${prizePool} ${t('unit.eur')}`} />
      {rebuyPot != null && rebuyPot > 0 && (
        <StatItem label={t('rebuy.separatePotLabel')} value={`${rebuyPot} ${t('unit.eur')}`} />
      )}
      {currentBB > 0 && (
        <StatItem label={t('stats.avgStackBB')} value={`${avgStackBB} BB`} />
      )}
      <StatItem label={t('stats.elapsed')} value={formatElapsedTime(elapsedSeconds)} />
      <StatItem label={t('stats.remaining')} value={`~${formatElapsedTime(estimatedRemainingSeconds)}`} />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-500 dark:text-gray-500">{label}:</span>
      <span className="text-gray-800 dark:text-gray-100 font-medium font-mono">{value}</span>
    </div>
  );
}
