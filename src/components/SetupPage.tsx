import { useCallback, useMemo, useState } from 'react';
import type { TournamentConfig, TournamentCheckpoint, League } from '../domain/types';
import {
  stripAnteFromLevels,
  applyDefaultAntes,
  defaultPayoutForPlayerCount,
  snapSpinnerValue,
  checkBlindChipCompatibility,
  computeBlindStructureSummary,
  loadLeagues,
} from '../domain/logic';
import { useTranslation } from '../i18n';
import { ConfigEditor } from './ConfigEditor';
import { PlayerManager } from './PlayerManager';
import { PayoutEditor } from './PayoutEditor';
import { RebuyEditor } from './RebuyEditor';
import { AddOnEditor } from './AddOnEditor';
import { BountyEditor } from './BountyEditor';
import { ChipEditor } from './ChipEditor';
import { BlindGenerator } from './BlindGenerator';
import { CollapsibleSection } from './CollapsibleSection';
import { CollapsibleSubSection } from './CollapsibleSubSection';
import { NumberStepper } from './NumberStepper';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  config: TournamentConfig;
  setConfig: React.Dispatch<React.SetStateAction<TournamentConfig>>;
  pendingCheckpoint: TournamentCheckpoint | null;
  onRestoreCheckpoint: () => void;
  onDismissCheckpoint: () => void;
  onSwitchToGame: () => void;
  startErrors: string[];
  theme: 'light' | 'dark';
}

export function SetupPage({
  config,
  setConfig,
  pendingCheckpoint,
  onRestoreCheckpoint,
  onDismissCheckpoint,
  onSwitchToGame,
  startErrors,
  theme,
}: Props) {
  const { t } = useTranslation();

  // Load leagues for the dropdown (refresh when SetupPage mounts)
  const [leagues] = useState<League[]>(() => loadLeagues());

  // --- Section summaries for collapsed CollapsibleSection cards ---
  const chipsSummary = useMemo(() => {
    if (!config.chips.enabled) return t('section.chipsDisabled');
    const count = config.chips.denominations.length;
    const colorUp = config.chips.colorUpEnabled ? `, ${t('section.colorUpActive')}` : '';
    return `${count} Chips${colorUp}`;
  }, [config.chips, t]);

  const payoutSummary = useMemo(() => {
    const mode = config.payout.mode === 'percent' ? t('payoutEditor.percent') : t('payoutEditor.euro');
    return t('section.payoutSummary', { places: config.payout.entries.length, mode });
  }, [config.payout, t]);

  const formatSummary = useMemo(() => {
    const parts: string[] = [];
    if (config.rebuy.enabled) parts.push('Rebuy');
    if (config.addOn.enabled) parts.push('Add-On');
    if (config.bounty.enabled) parts.push(`Bounty: ${config.bounty.amount} €`);
    if (config.lateRegistration?.enabled) parts.push(t('lateReg.short'));
    return parts.length > 0 ? parts.join(', ') : t('section.allDisabled');
  }, [config.rebuy, config.addOn, config.bounty, config.lateRegistration, t]);

  const playersSummary = useMemo(
    () => t('section.playerCount', { n: config.players.length }),
    [config.players.length, t],
  );

  const blindSummary = useMemo(() => {
    const s = computeBlindStructureSummary(config.levels);
    return t('config.summary', { levels: s.levelCount, breaks: s.breakCount, min: s.avgMinutes });
  }, [config.levels, t]);

  // --- Ante toggle ---
  const toggleAnte = useCallback(() => {
    setConfig((prev) => {
      const newAnteEnabled = !prev.anteEnabled;
      return {
        ...prev,
        anteEnabled: newAnteEnabled,
        levels: newAnteEnabled
          ? applyDefaultAntes(prev.levels, prev.anteMode)
          : stripAnteFromLevels(prev.levels),
      };
    });
  }, [setConfig]);

  // Detect blind values that are incompatible with current chip denominations
  const blindChipConflicts = useMemo(
    () =>
      config.chips.enabled
        ? checkBlindChipCompatibility(config.levels, config.chips.denominations)
        : [],
    [config.chips.enabled, config.chips.denominations, config.levels],
  );

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Checkpoint recovery banner */}
        {pendingCheckpoint && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600/50 rounded-xl p-4 space-y-2 shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20 backdrop-blur-sm animate-fade-in">
            <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">{t('checkpoint.found')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {t('checkpoint.details', {
                name: pendingCheckpoint.config.name || 'Tournament',
                date: new Date(pendingCheckpoint.savedAt).toLocaleString(),
              })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onRestoreCheckpoint}
                className="px-4 py-2 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-emerald-900/30 active:scale-[0.97]"
              >
                {t('checkpoint.restore')}
              </button>
              <button
                onClick={onDismissCheckpoint}
                className="px-4 py-2 bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700/40"
              >
                {t('checkpoint.dismiss')}
              </button>
            </div>
          </div>
        )}

        {/* Turnier-Grundlagen (Name + Buy-In + Startchips) */}
        <CollapsibleSection title={t('app.tournamentBasics')}>
          <div className="space-y-3">
            <input
              type="text"
              value={config.name}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t('app.tournamentNamePlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
            />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 dark:text-gray-500">{t('app.buyIn')}</label>
                <NumberStepper
                  value={config.buyIn}
                  onChange={(newBuyIn) => {
                    setConfig((prev) => ({
                      ...prev,
                      buyIn: newBuyIn,
                      rebuy: {
                        ...prev.rebuy,
                        rebuyCost: prev.rebuy.rebuyCost === prev.buyIn ? newBuyIn : prev.rebuy.rebuyCost,
                      },
                      addOn: {
                        ...prev.addOn,
                        cost: prev.addOn.cost === prev.buyIn ? newBuyIn : prev.addOn.cost,
                      },
                    }));
                  }}
                  min={1}
                  step={1}
                />
                <span className="text-gray-500 dark:text-gray-400 text-sm">{t('unit.eur')}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 dark:text-gray-500">{t('app.startingChips')}</label>
                <NumberStepper
                  value={config.startingChips}
                  onChange={(raw) => {
                    setConfig((prev) => {
                      const newChips = snapSpinnerValue(raw, prev.startingChips, 1000);
                      return {
                        ...prev,
                        startingChips: newChips,
                        rebuy: {
                          ...prev.rebuy,
                          rebuyChips: prev.rebuy.rebuyChips === prev.startingChips ? newChips : prev.rebuy.rebuyChips,
                        },
                        addOn: {
                          ...prev.addOn,
                          chips: prev.addOn.chips === prev.startingChips ? newChips : prev.addOn.chips,
                        },
                      };
                    });
                  }}
                  min={1}
                  step={1000}
                  inputClassName="w-24"
                />
                <span className="text-gray-500 dark:text-gray-400 text-sm">{t('unit.chips')}</span>
              </div>
            </div>
            {/* League dropdown */}
            {leagues.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 dark:text-gray-500">{t('league.assignLeague')}</label>
                <select
                  value={config.leagueId ?? ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, leagueId: e.target.value || undefined }))}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
                >
                  <option value="">{t('league.noLeague')}</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>{l.name || l.id}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Spieler */}
        <CollapsibleSection title={t('app.players')} summary={playersSummary}>
          <PlayerManager
            players={config.players}
            dealerIndex={config.dealerIndex}
            onChange={(players, dealerIndex) =>
              setConfig((prev) => ({
                ...prev,
                players,
                dealerIndex,
                payout: defaultPayoutForPlayerCount(players.length),
              }))
            }
          />
        </CollapsibleSection>

        {/* Auszahlung */}
        <CollapsibleSection title={t('app.payout')} summary={payoutSummary} defaultOpen={false}>
          <PayoutEditor
            payout={config.payout}
            onChange={(payout) => setConfig((prev) => ({ ...prev, payout }))}
            maxPlaces={config.players.length}
          />
        </CollapsibleSection>

        {/* Blind-Struktur (Generator + Ante Toggle + Level-Tabelle) */}
        <CollapsibleSection title={t('app.blindStructure')} summary={blindSummary}>
          <div className="space-y-4">
            <BlindGenerator
              startingChips={config.startingChips}
              anteEnabled={config.anteEnabled}
              anteMode={config.anteMode}
              playerCount={config.players.length}
              chipConfig={config.chips}
              onApply={(levels) =>
                setConfig((prev) => ({ ...prev, levels }))
              }
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={toggleAnte}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  config.anteEnabled
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {config.anteEnabled ? t('app.withAnte') : t('app.withoutAnte')}
              </button>
              {config.anteEnabled && (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/40">
                  <button
                    onClick={() => setConfig((prev) => ({
                      ...prev,
                      anteMode: 'standard',
                      levels: applyDefaultAntes(prev.levels, 'standard'),
                    }))}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      config.anteMode === 'standard'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t('app.anteStandard')}
                  </button>
                  <button
                    onClick={() => setConfig((prev) => ({
                      ...prev,
                      anteMode: 'bigBlindAnte',
                      levels: applyDefaultAntes(prev.levels, 'bigBlindAnte'),
                    }))}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      config.anteMode === 'bigBlindAnte'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t('app.anteBBA')}
                  </button>
                </div>
              )}
            </div>
            <CollapsibleSubSection title={t('config.levelTable')} summary={blindSummary} defaultOpen={false}>
              <ConfigEditor
                config={config}
                onChange={setConfig}
                anteEnabled={config.anteEnabled}
              />
            </CollapsibleSubSection>
          </div>
        </CollapsibleSection>

        {/* Turnier-Format: Rebuy + Add-On + Bounty (collapsed by default) */}
        <CollapsibleSection title={t('app.tournamentFormat')} summary={formatSummary} defaultOpen={false}>
          <div className="space-y-4">
            {/* Rebuy */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t('app.rebuy')}
              </h3>
              <RebuyEditor
                rebuy={config.rebuy}
                onChange={(rebuy) => setConfig((prev) => ({
                  ...prev,
                  rebuy,
                  // Auto-disable add-on when rebuy is turned off
                  addOn: !rebuy.enabled ? { ...prev.addOn, enabled: false } : prev.addOn,
                }))}
                buyIn={config.buyIn}
                startingChips={config.startingChips}
              />
            </div>
            {/* Add-On */}
            <div className="border-t border-gray-300 dark:border-gray-700/50 pt-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t('app.addOn')}
              </h3>
              <AddOnEditor
                addOn={config.addOn}
                onChange={(addOn) => setConfig((prev) => ({ ...prev, addOn }))}
                buyIn={config.buyIn}
                startingChips={config.startingChips}
                rebuyEnabled={config.rebuy.enabled}
                onEnableRebuy={() =>
                  setConfig((prev) => ({
                    ...prev,
                    rebuy: { ...prev.rebuy, enabled: true },
                  }))
                }
              />
            </div>
            {/* Bounty */}
            <div className="border-t border-gray-300 dark:border-gray-700/50 pt-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t('app.bounty')}
              </h3>
              <BountyEditor
                bounty={config.bounty}
                onChange={(bounty) => setConfig((prev) => ({ ...prev, bounty }))}
              />
            </div>
            {/* Late Registration */}
            <div className="border-t border-gray-300 dark:border-gray-700/50 pt-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {t('lateReg.title')}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setConfig((prev) => ({
                    ...prev,
                    lateRegistration: {
                      enabled: !prev.lateRegistration?.enabled,
                      levelLimit: prev.lateRegistration?.levelLimit ?? 4,
                    },
                  }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.lateRegistration?.enabled
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {config.lateRegistration?.enabled ? t('lateReg.enabled') : t('lateReg.disabled')}
                </button>
                {config.lateRegistration?.enabled && (
                  <div className="flex items-center gap-2 pl-2 border-l-2 border-emerald-800">
                    <label className="text-sm text-gray-700 dark:text-gray-300">{t('lateReg.untilLevel')}</label>
                    <NumberStepper
                      value={config.lateRegistration.levelLimit}
                      onChange={(v) => setConfig((prev) => ({
                        ...prev,
                        lateRegistration: { ...prev.lateRegistration!, levelLimit: Math.max(1, v) },
                      }))}
                      min={1}
                      max={20}
                      step={1}
                      inputClassName="w-16"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Chip-Werte (collapsed by default) */}
        <CollapsibleSection title={t('app.chips')} summary={chipsSummary} defaultOpen={false}>
          <ChipEditor
            chips={config.chips}
            onChange={(chips) => setConfig((prev) => ({ ...prev, chips }))}
            levels={config.levels}
          />
          {/* Chip-Blind compatibility warning */}
          {blindChipConflicts.length > 0 && (
            <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/40 rounded-lg">
              <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                {t('app.chipBlindConflict', { values: blindChipConflicts.join(', ') })}
              </p>
              <p className="text-amber-600 dark:text-amber-400/60 text-xs mt-1">
                {t('app.chipBlindConflictHint')}
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Validation */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700/40">
          {startErrors.length > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-1">{t('app.checkConfig')}</p>
              {startErrors.map((e, i) => (
                <p key={i} className="text-red-700 dark:text-red-400 text-sm">• {e}</p>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg p-3">
              <p className="text-emerald-700 dark:text-emerald-400 text-sm">{t('app.allReady')}</p>
            </div>
          )}
        </div>

        {/* Start button — sticky on mobile */}
        <div className="sticky bottom-0 pt-3 pb-3 bg-gray-50 dark:bg-gray-900 sm:static sm:bg-transparent sm:pt-0 sm:pb-0">
          <button
            onClick={onSwitchToGame}
            disabled={startErrors.length > 0}
            className="w-full px-6 py-3 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-emerald-900/30 active:scale-[0.98] active:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-emerald-700 disabled:active:scale-100"
          >
            {t('app.startTournament')}
          </button>
        </div>

        {/* QR Code — App link */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-4">
          <QRCodeSVG
            value={`${window.location.origin}${import.meta.env.BASE_URL || '/'}`}
            size={100}
            level="L"
            bgColor={theme === 'dark' ? '#111827' : '#f9fafb'}
            fgColor={theme === 'dark' ? '#e5e7eb' : '#111827'}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {t('finished.qrApp')}
          </span>
        </div>
      </div>
    </div>
  );
}
