import { useTranslation } from '../i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface SharedLeagueStanding {
  rank: number;
  name: string;
  points: number;
  tournaments: number;
  wins: number;
  netBalance: number;
}

interface Props {
  leagueName: string;
  standings: SharedLeagueStanding[];
  onClose: () => void;
}

export function SharedLeagueView({ leagueName, standings, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useDialogA11y(onClose);

  const medal = (rank: number) => {
    if (rank === 1) return '\u{1F3C6}';
    if (rank === 2) return '\u{1F948}';
    if (rank === 3) return '\u{1F949}';
    return `${rank}.`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="shared-league-title" className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/40 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800/50">
          <h2 id="shared-league-title" className="text-lg font-bold text-gray-900 dark:text-white">
            {t('shared.leagueTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {leagueName}
          </p>
        </div>

        {/* Standings */}
        <div className="px-5 py-4">
          <div className="bg-white/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/40 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700/40 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-10">#</span>
              <span className="flex-1">{t('league.standings.name')}</span>
              <span className="w-14 text-right">{t('league.standings.points')}</span>
              <span className="w-10 text-right">{t('league.standings.wins')}</span>
              <span className="w-20 text-right">{t('league.standings.balance')}</span>
            </div>

            {standings.map((s) => (
              <div
                key={`${s.name}-${s.rank}`}
                className={`flex items-center px-4 py-2.5 border-b border-gray-100 dark:border-gray-800/30 last:border-b-0 ${
                  s.rank === 1
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-l-amber-400'
                    : s.rank % 2 === 0
                    ? 'bg-gray-50/50 dark:bg-gray-800/20'
                    : ''
                }`}
              >
                <span className={`text-sm font-bold w-10 ${
                  s.rank === 1 ? 'text-amber-500' :
                  s.rank === 2 ? 'text-gray-600 dark:text-gray-300' :
                  s.rank === 3 ? 'text-amber-700' :
                  'text-gray-400 dark:text-gray-500'
                }`}>
                  {medal(s.rank)}
                </span>
                <span className="flex-1 text-sm text-gray-900 dark:text-white font-medium truncate">
                  {s.name}
                </span>
                <span className="w-14 text-right text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
                  {s.points}
                </span>
                <span className="w-10 text-right text-sm text-gray-600 dark:text-gray-300">
                  {s.wins}
                </span>
                <span className={`w-20 text-right text-sm font-medium ${
                  s.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {s.netBalance >= 0 ? '+' : ''}{s.netBalance.toFixed(0)} €
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-3 bg-white/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/40 rounded-xl px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('league.standings.gameDays')}</span>
              <span className="text-gray-900 dark:text-white">{standings.length > 0 ? Math.max(...standings.map(s => s.tournaments)) : 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('finished.players')}</span>
              <span className="text-gray-900 dark:text-white">{standings.length}</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-base font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600/30"
          >
            {t('shared.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
