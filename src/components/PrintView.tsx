import type { TournamentConfig } from '../domain/types';
import { getLevelLabel, formatTime } from '../domain/logic';
import { useTranslation } from '../i18n';

interface Props {
  config: TournamentConfig;
}

export function PrintView({ config }: Props) {
  const { t } = useTranslation();

  const tournamentName = config.name || t('app.title');

  return (
    <div className="print-view hidden print:block p-8 bg-white text-black text-sm font-sans">
      {/* Header */}
      <h1 className="text-2xl font-bold text-center mb-1">{tournamentName}</h1>
      <h2 className="text-lg font-semibold text-center mb-6 text-gray-600">{t('print.title')}</h2>

      {/* Blind Structure Table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1 px-2">{t('config.level')}</th>
            <th className="text-right py-1 px-2">SB</th>
            <th className="text-right py-1 px-2">BB</th>
            {config.anteEnabled && <th className="text-right py-1 px-2">{t('timer.ante')}</th>}
            <th className="text-right py-1 px-2">{t('config.min')}</th>
          </tr>
        </thead>
        <tbody>
          {config.levels.map((level, idx) => {
            if (level.type === 'break') {
              return (
                <tr key={level.id || idx} className="bg-gray-100 border-b border-gray-300">
                  <td colSpan={config.anteEnabled ? 5 : 4} className="py-1 px-2 font-medium text-gray-600 italic">
                    {level.label || t('config.break')} — {formatTime(level.durationSeconds)}
                  </td>
                </tr>
              );
            }
            const label = getLevelLabel(level, idx, config.levels);
            return (
              <tr key={level.id || idx} className="border-b border-gray-200">
                <td className="py-1 px-2">{label}</td>
                <td className="text-right py-1 px-2 font-mono">{level.smallBlind ?? 0}</td>
                <td className="text-right py-1 px-2 font-mono">{level.bigBlind ?? 0}</td>
                {config.anteEnabled && (
                  <td className="text-right py-1 px-2 font-mono">{level.ante ?? '—'}</td>
                )}
                <td className="text-right py-1 px-2">{Math.round(level.durationSeconds / 60)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Chip Denominations (if enabled) */}
      {config.chips.enabled && config.chips.denominations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-2 border-b border-black pb-1">{t('app.chips')}</h3>
          <table className="w-auto border-collapse">
            <tbody>
              {[...config.chips.denominations]
                .sort((a, b) => a.value - b.value)
                .map((chip) => (
                  <tr key={chip.id} className="border-b border-gray-200">
                    <td className="py-1 px-2">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-gray-400 mr-2 align-middle"
                        style={{ backgroundColor: chip.color }}
                      />
                      {chip.label}
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{chip.value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payout Table (if configured) */}
      {config.payout.entries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-2 border-b border-black pb-1">{t('app.payout')}</h3>
          <table className="w-auto border-collapse">
            <tbody>
              {config.payout.entries.map((entry) => (
                <tr key={entry.place} className="border-b border-gray-200">
                  <td className="py-1 px-2">{t('payoutEditor.placeN', { n: entry.place })}</td>
                  <td className="py-1 px-2 text-right font-mono">
                    {config.payout.mode === 'percent' ? `${entry.value}%` : `${entry.value} EUR`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      <div className="text-xs text-gray-400 text-center mt-8">
        Buy-In: {config.buyIn} EUR &middot; {t('app.startingChips')}: {config.startingChips.toLocaleString()}
        {config.rebuy.enabled && ' \u00b7 Rebuy'}
        {config.addOn.enabled && ' \u00b7 Add-On'}
        {config.bounty.enabled && ` \u00b7 Bounty: ${config.bounty.amount} EUR`}
      </div>
    </div>
  );
}
