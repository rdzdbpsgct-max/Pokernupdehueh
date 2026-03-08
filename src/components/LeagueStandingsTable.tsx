import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { League, ExtendedLeagueStanding, GameDay } from '../domain/types';
import { formatLeagueStandingsAsText, formatLeagueStandingsAsCSV, encodeLeagueStandingsForQR } from '../domain/logic';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme';

const LeaguePlayerDetail = lazy(() => import('./LeaguePlayerDetail').then(m => ({ default: m.LeaguePlayerDetail })));

type SortKey = 'rank' | 'name' | 'points' | 'tournaments' | 'wins' | 'cashes' | 'avgPlace' | 'bestPlace' | 'knockouts' | 'totalCost' | 'totalPayout' | 'netBalance' | 'participationRate';
type SortDir = 'asc' | 'desc';

interface Props {
  league: League;
  standings: ExtendedLeagueStanding[];
  gameDays: GameDay[];
  onUpdatePointSystem: (leagueId: string, place: number, points: number) => void;
  onAddCorrection?: () => void;
}

export function LeagueStandingsTable({ league, standings, gameDays, onUpdatePointSystem, onAddCorrection }: Props) {
  const { t } = useTranslation();
  const { resolved: theme } = useTheme();
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [copied, setCopied] = useState(false);
  const [showPointSystem, setShowPointSystem] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    const copy = [...standings];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'rank': cmp = a.rank - b.rank; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'points': cmp = a.points - b.points; break;
        case 'tournaments': cmp = a.tournaments - b.tournaments; break;
        case 'wins': cmp = a.wins - b.wins; break;
        case 'cashes': cmp = a.cashes - b.cashes; break;
        case 'avgPlace': cmp = a.avgPlace - b.avgPlace; break;
        case 'bestPlace': cmp = a.bestPlace - b.bestPlace; break;
        case 'knockouts': cmp = a.knockouts - b.knockouts; break;
        case 'totalCost': cmp = a.totalCost - b.totalCost; break;
        case 'totalPayout': cmp = a.totalPayout - b.totalPayout; break;
        case 'netBalance': cmp = a.netBalance - b.netBalance; break;
        case 'participationRate': cmp = a.participationRate - b.participationRate; break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [standings, sortKey, sortDir]);

  const handleCopyText = useCallback(async () => {
    const text = formatLeagueStandingsAsText(league, standings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [league, standings]);

  const handleDownloadCSV = useCallback(() => {
    const csv = formatLeagueStandingsAsCSV(standings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${league.name.replace(/\s+/g, '_')}_standings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [league.name, standings]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const qrValue = useMemo(() => {
    if (standings.length === 0) return '';
    const base = window.location.origin + window.location.pathname;
    return base + encodeLeagueStandingsForQR(league, standings);
  }, [league, standings]);

  const renderSortHeader = (k: SortKey, label: string, className?: string) => (
    <th
      key={k}
      onClick={() => handleSort(k)}
      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${className ?? ''}`}
    >
      {label}
      {sortKey === k && (
        <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  );

  const medal = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  return (
    <div className="space-y-3">
      <div className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/40 shadow-lg shadow-gray-300/30 dark:shadow-black/20 overflow-hidden">
        {/* Export buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/40">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('league.tabs.standings')}</h3>
          <div className="flex items-center gap-2">
            {onAddCorrection && (
              <button
                onClick={onAddCorrection}
                className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ±{t('league.correction.title')}
              </button>
            )}
            <button
              onClick={() => setShowPointSystem(!showPointSystem)}
              className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('league.standings.pointSystem')}
            </button>
            <button
              onClick={handleCopyText}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
            >
              {copied ? '✓' : t('league.standings.copyText')}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
            >
              {t('league.standings.downloadCSV')}
            </button>
            <button
              onClick={handlePrint}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
              title={t('league.standings.print')}
            >
              🖨️
            </button>
            {standings.length > 0 && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
                title={t('league.standings.qrCode')}
              >
                QR
              </button>
            )}
          </div>
        </div>

        {/* QR Code */}
        {showQR && qrValue && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/40 flex flex-col items-center gap-2">
            <QRCodeSVG
              value={qrValue}
              size={160}
              bgColor={theme === 'dark' ? '#1f2937' : '#f9fafb'}
              fgColor={theme === 'dark' ? '#e5e7eb' : '#111827'}
              level="L"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('league.standings.qrHint')}</p>
          </div>
        )}

        {/* Point system editor */}
        {showPointSystem && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/40">
            <div className="flex flex-wrap gap-3">
              {league.pointSystem.entries.map((e) => (
                <div key={e.place} className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{e.place}.</span>
                  <input
                    type="number"
                    value={e.points}
                    onChange={(ev) => onUpdatePointSystem(league.id, e.place, parseInt(ev.target.value, 10) || 0)}
                    className="w-12 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded px-1.5 py-0.5 text-center text-sm focus:ring-2 focus:outline-none"
                    min={0}
                  />
                  <span className="text-gray-400 dark:text-gray-500 text-xs">Pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standings table */}
        {standings.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {t('league.standings.noData')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/40">
                  {renderSortHeader('rank', '#', 'w-10')}
                  {renderSortHeader('name', t('league.standings.name'))}
                  {renderSortHeader('points', t('league.standings.points'))}
                  {renderSortHeader('tournaments', t('league.standings.gameDays'))}
                  {renderSortHeader('wins', t('league.standings.wins'))}
                  {renderSortHeader('cashes', t('league.standings.itm'))}
                  {renderSortHeader('avgPlace', t('league.standings.avgPlace'))}
                  {renderSortHeader('totalCost', t('league.standings.cost'))}
                  {renderSortHeader('totalPayout', t('league.standings.payout'))}
                  {renderSortHeader('netBalance', t('league.standings.balance'))}
                  {renderSortHeader('participationRate', t('league.standings.participation'))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr
                    key={s.name}
                    className="border-b border-gray-100 dark:border-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-2 py-2 font-medium text-gray-500 dark:text-gray-400">
                      {medal(s.rank)}
                    </td>
                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-white">
                      <button
                        onClick={() => setSelectedPlayer(s.name)}
                        className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                        title={t('league.playerDetail.viewDetails')}
                      >
                        {s.name}
                      </button>
                      {s.corrections !== 0 && (
                        <span className={`ml-1 text-xs ${s.corrections > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          ({s.corrections > 0 ? '+' : ''}{s.corrections})
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-bold" style={{ color: 'var(--accent-600)' }}>
                      {s.points}
                    </td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.tournaments}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.wins}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.cashes}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.avgPlace}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.totalCost.toFixed(0)} €</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{s.totalPayout.toFixed(0)} €</td>
                    <td className={`px-2 py-2 font-medium ${s.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {s.netBalance >= 0 ? '+' : ''}{s.netBalance.toFixed(0)} €
                    </td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                      {(s.participationRate * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Player Detail Modal */}
      {selectedPlayer && (
        <Suspense fallback={null}>
          <LeaguePlayerDetail
            playerName={selectedPlayer}
            gameDays={gameDays}
            onClose={() => setSelectedPlayer(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
