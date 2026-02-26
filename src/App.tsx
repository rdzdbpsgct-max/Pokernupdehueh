import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TournamentConfig, Settings } from './domain/types';
import {
  createPreset,
  defaultSettings,
  saveConfig,
  loadConfig,
  saveSettings,
  loadSettings,
  stripAnteFromLevels,
  applyDefaultAntes,
  isRebuyActive,
  computeTournamentElapsedSeconds,
  computeNextPlacement,
  defaultPayoutForPlayerCount,
  validatePayoutConfig,
  validateConfig,
  snapSpinnerValue,
  computeAverageStack,
  computeColorUps,
} from './domain/logic';
import { useTimer } from './hooks/useTimer';
import { useTranslation } from './i18n';
import { playVictorySound } from './domain/sounds';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { LevelPreview } from './components/LevelPreview';
import { ConfigEditor } from './components/ConfigEditor';
import { PresetPicker } from './components/PresetPicker';
import { SettingsPanel } from './components/SettingsPanel';
import { ImportExportModal } from './components/ImportExportModal';
import { PlayerManager } from './components/PlayerManager';
import { PayoutEditor } from './components/PayoutEditor';
import { RebuyEditor } from './components/RebuyEditor';
import { RebuyStatus } from './components/RebuyStatus';
import { PlayerPanel } from './components/PlayerPanel';
import { AddOnEditor } from './components/AddOnEditor';
import { BountyEditor } from './components/BountyEditor';
import { ChipEditor } from './components/ChipEditor';
import { ChipSidebar } from './components/ChipSidebar';
import { TournamentFinished } from './components/TournamentFinished';
import { LanguageSwitcher } from './components/LanguageSwitcher';

type Mode = 'setup' | 'game';

function App() {
  const { t, language } = useTranslation();
  const [mode, setMode] = useState<Mode>('setup');
  const [config, setConfig] = useState<TournamentConfig>(
    () => loadConfig() ?? createPreset('standard'),
  );
  const [settings, setSettings] = useState<Settings>(
    () => loadSettings() ?? defaultSettings(),
  );
  const [showImportExport, setShowImportExport] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const timer = useTimer(config.levels, settings);

  // Rename default player names when language changes
  const defaultNamePattern = /^(Spieler|Player) (\d+)$/;
  useEffect(() => {
    setConfig((prev) => {
      const updated = prev.players.map((p) => {
        const match = defaultNamePattern.exec(p.name);
        if (match) {
          return { ...p, name: t('playerManager.playerN', { n: Number(match[2]) }) };
        }
        return p;
      });
      if (updated.some((p, i) => p.name !== prev.players[i].name)) {
        return { ...prev, players: updated };
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Persist config & settings
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Keyboard shortcuts (only in game mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'game') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          timer.toggleStartPause();
          break;
        case 'KeyN':
          timer.nextLevel();
          break;
        case 'KeyV':
          timer.previousLevel();
          break;
        case 'KeyR':
          setConfirmAction({
            title: t('confirm.resetLevel.title'),
            message: t('confirm.resetLevel.message'),
            confirmLabel: t('confirm.resetLevel.confirm'),
            onConfirm: timer.resetLevel,
          });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, timer, t]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // --- Ante toggle ---
  const toggleAnte = useCallback(() => {
    setConfig((prev) => {
      const newAnteEnabled = !prev.anteEnabled;
      return {
        ...prev,
        anteEnabled: newAnteEnabled,
        levels: newAnteEnabled
          ? applyDefaultAntes(prev.levels)
          : stripAnteFromLevels(prev.levels),
      };
    });
  }, []);

  // --- Rebuy update handler ---
  const updatePlayerRebuys = useCallback((playerId: string, newCount: number) => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, rebuys: newCount } : p,
      ),
    }));
  }, []);

  // --- Add-on update handler ---
  const updatePlayerAddOn = useCallback((playerId: string, hasAddOn: boolean) => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, addOn: hasAddOn } : p,
      ),
    }));
  }, []);

  // --- Eliminate player handler ---
  const eliminatePlayer = useCallback((playerId: string, eliminatedBy: string | null) => {
    setConfig((prev) => {
      const placement = computeNextPlacement(prev.players);
      return {
        ...prev,
        players: prev.players.map((p) => {
          if (p.id === playerId) {
            return { ...p, status: 'eliminated' as const, placement, eliminatedBy };
          }
          if (eliminatedBy && p.id === eliminatedBy) {
            return { ...p, knockouts: p.knockouts + 1 };
          }
          return p;
        }),
      };
    });
  }, []);

  // --- Reinstate (undo elimination) handler ---
  const reinstatePlayer = useCallback((playerId: string) => {
    setConfig((prev) => {
      const player = prev.players.find((p) => p.id === playerId);
      if (!player || player.status !== 'eliminated') return prev;

      const killedBy = player.eliminatedBy;

      return {
        ...prev,
        players: prev.players.map((p) => {
          // Reset the reinstated player
          if (p.id === playerId) {
            return { ...p, status: 'active' as const, placement: null, eliminatedBy: null };
          }
          // Decrement knockout count of the killer
          if (killedBy && p.id === killedBy) {
            return { ...p, knockouts: Math.max(0, p.knockouts - 1) };
          }
          return p;
        }),
      };
    });
  }, []);

  // --- Computed rebuy state for game mode ---
  const tournamentElapsed = useMemo(
    () =>
      computeTournamentElapsedSeconds(
        config.levels,
        timer.timerState.currentLevelIndex,
        timer.timerState.remainingSeconds,
      ),
    [config.levels, timer.timerState.currentLevelIndex, timer.timerState.remainingSeconds],
  );

  const rebuyActive = useMemo(
    () =>
      isRebuyActive(
        config.rebuy,
        timer.timerState.currentLevelIndex,
        config.levels,
        tournamentElapsed,
      ),
    [config.rebuy, timer.timerState.currentLevelIndex, config.levels, tournamentElapsed],
  );

  const currentPlayLevel = useMemo(() => {
    return config.levels
      .slice(0, timer.timerState.currentLevelIndex + 1)
      .filter((l) => l.type === 'level').length;
  }, [config.levels, timer.timerState.currentLevelIndex]);

  const averageStack = useMemo(
    () =>
      computeAverageStack(
        config.players,
        config.startingChips,
        config.rebuy.enabled ? config.rebuy.rebuyChips : 0,
        config.addOn.enabled ? config.addOn.chips : 0,
      ),
    [config.players, config.startingChips, config.rebuy.enabled, config.rebuy.rebuyChips, config.addOn.enabled, config.addOn.chips],
  );

  const colorUpMap = useMemo(
    () =>
      config.chips.enabled
        ? computeColorUps(config.levels, config.chips.denominations)
        : new Map(),
    [config.chips.enabled, config.chips.denominations, config.levels],
  );

  const tournamentFinished = useMemo(() => {
    if (config.players.length < 2) return false;
    return config.players.filter((p) => p.status === 'active').length === 1;
  }, [config.players]);

  const winner = useMemo(() => {
    if (!tournamentFinished) return null;
    return config.players.find((p) => p.status === 'active') ?? null;
  }, [tournamentFinished, config.players]);

  const startErrors = useMemo(() => {
    const errors: string[] = [];
    if (config.players.length < 2) {
      errors.push(t('app.minPlayersRequired'));
    }
    if (config.payout.entries.length > config.players.length) {
      errors.push(t('app.morePlacesThanPlayers', { places: config.payout.entries.length, players: config.players.length }));
    }
    errors.push(...validatePayoutConfig(config.payout, config.players.length));
    errors.push(...validateConfig(config).map((e) => e.message));
    return errors;
  }, [config, t]);

  // Auto-pause timer and play victory sound when tournament finishes
  const victorySoundPlayedRef = useRef(false);
  useEffect(() => {
    if (mode === 'game' && tournamentFinished) {
      timer.pause();
      if (settings.soundEnabled && !victorySoundPlayedRef.current) {
        victorySoundPlayedRef.current = true;
        playVictorySound();
      }
    }
    if (!tournamentFinished) {
      victorySoundPlayedRef.current = false;
    }
  }, [mode, tournamentFinished, timer, settings.soundEnabled]);

  const switchToGame = () => {
    // Reset all player state when starting a new tournament
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) => ({
        ...p,
        rebuys: 0,
        addOn: false,
        status: 'active' as const,
        placement: null,
        eliminatedBy: null,
        knockouts: 0,
      })),
    }));
    setMode('game');
    timer.restart();
  };

  const switchToSetup = () => {
    timer.restart();
    setMode('setup');
  };

  const confirmBeforeAction = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    setConfirmAction({ title, message, confirmLabel, onConfirm });
  };

  const handleResetLevel = () => {
    confirmBeforeAction(
      t('confirm.resetLevel.title'),
      t('confirm.resetLevel.message'),
      t('confirm.resetLevel.confirm'),
      timer.resetLevel,
    );
  };

  const handleRestart = () => {
    confirmBeforeAction(
      t('confirm.restartTournament.title'),
      t('confirm.restartTournament.message'),
      t('confirm.restartTournament.confirm'),
      timer.restart,
    );
  };

  const handleExitToSetup = () => {
    confirmBeforeAction(
      t('confirm.exitTournament.title'),
      t('confirm.exitTournament.message'),
      t('confirm.exitTournament.confirm'),
      switchToSetup,
    );
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white tracking-tight">
          {mode === 'game' && config.name ? `♠ ♥ ${config.name} ♦ ♣` : t('app.title')}
        </h1>
        <div className="flex items-center gap-2">
          {mode === 'setup' && <LanguageSwitcher />}
          <button
            onClick={() => {
              if (mode === 'game') {
                handleExitToSetup();
              } else {
                setMode('game');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'game'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {mode === 'setup' ? t('app.startGame') : t('app.setup')}
          </button>
          <button
            onClick={() => setShowImportExport(true)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-colors"
          >
            {t('app.importExport')}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        {mode === 'setup' ? (
          /* Setup Mode */
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
              {/* Turnier-Name */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.tournamentName')}
                </h2>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t('app.tournamentNamePlaceholder')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Presets */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.loadPreset')}
                </h2>
                <PresetPicker onSelect={(preset) =>
                  setConfig((prev) => ({
                    ...prev,
                    name: preset.name,
                    levels: preset.levels,
                    anteEnabled: preset.anteEnabled,
                  }))
                } />
              </div>

              {/* Spieler */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.players')}
                </h2>
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
              </div>

              {/* Buy-In & Startchips */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.buyInAndChips')}
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">{t('app.buyIn')}</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={config.buyIn}
                      onChange={(e) => {
                        const newBuyIn = Math.max(1, Number(e.target.value));
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
                      className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-gray-400 text-sm">{t('unit.eur')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">{t('app.startingChips')}</label>
                    <input
                      type="number"
                      min={1}
                      step={1000}
                      value={config.startingChips}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
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
                      className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-gray-400 text-sm">{t('unit.chips')}</span>
                  </div>
                </div>
              </div>

              {/* Chip Values */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.chips')}
                </h2>
                <ChipEditor
                  chips={config.chips}
                  onChange={(chips) => setConfig((prev) => ({ ...prev, chips }))}
                  levels={config.levels}
                />
              </div>

              {/* Ante Toggle + Blind-Struktur */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    {t('app.blindStructure')}
                  </h2>
                  <button
                    onClick={toggleAnte}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      config.anteEnabled
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {config.anteEnabled ? t('app.withAnte') : t('app.withoutAnte')}
                  </button>
                </div>
                <ConfigEditor
                  config={config}
                  onChange={setConfig}
                  anteEnabled={config.anteEnabled}
                />
              </div>

              {/* Auszahlung */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.payout')}
                </h2>
                <PayoutEditor
                  payout={config.payout}
                  onChange={(payout) => setConfig((prev) => ({ ...prev, payout }))}
                  maxPlaces={config.players.length}
                />
              </div>

              {/* Rebuy */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.rebuy')}
                </h2>
                <RebuyEditor
                  rebuy={config.rebuy}
                  onChange={(rebuy) => setConfig((prev) => ({ ...prev, rebuy }))}
                  buyIn={config.buyIn}
                  startingChips={config.startingChips}
                />
              </div>

              {/* Add-On */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.addOn')}
                </h2>
                <AddOnEditor
                  addOn={config.addOn}
                  onChange={(addOn) => setConfig((prev) => ({ ...prev, addOn }))}
                  buyIn={config.buyIn}
                  startingChips={config.startingChips}
                />
              </div>

              {/* Bounty */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('app.bounty')}
                </h2>
                <BountyEditor
                  bounty={config.bounty}
                  onChange={(bounty) => setConfig((prev) => ({ ...prev, bounty }))}
                />
              </div>

              {/* Validation + Start button */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                {startErrors.length > 0 ? (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">{t('app.checkConfig')}</p>
                    {startErrors.map((e, i) => (
                      <p key={i} className="text-red-400 text-sm">• {e}</p>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3">
                    <p className="text-emerald-400 text-sm">{t('app.allReady')}</p>
                  </div>
                )}
                <button
                  onClick={switchToGame}
                  disabled={startErrors.length > 0}
                  className="w-full px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-700"
                >
                  {t('app.startTournament')}
                </button>
              </div>
            </div>
          </div>
        ) : tournamentFinished && winner ? (
          /* Tournament Finished */
          <TournamentFinished
            players={config.players}
            winner={winner}
            buyIn={config.buyIn}
            payout={config.payout}
            bounty={config.bounty}
            rebuy={config.rebuy}
            addOn={config.addOn}
            onBackToSetup={switchToSetup}
          />
        ) : (
          /* Game Mode */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Player Panel (LEFT) */}
            {showPlayerPanel && config.players.length > 0 && (
              <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-gray-800 p-3 sm:p-4 overflow-y-auto max-h-[50vh] lg:max-h-none">
                <PlayerPanel
                  players={config.players}
                  dealerIndex={config.dealerIndex}
                  buyIn={config.buyIn}
                  payout={config.payout}
                  rebuyEnabled={config.rebuy.enabled}
                  rebuyActive={rebuyActive}
                  rebuyConfig={config.rebuy}
                  addOnConfig={config.addOn}
                  bountyConfig={config.bounty}
                  averageStack={averageStack}
                  onUpdateRebuys={updatePlayerRebuys}
                  onUpdateAddOn={updatePlayerAddOn}
                  onEliminatePlayer={eliminatePlayer}
                  onReinstatePlayer={reinstatePlayer}
                />
              </aside>
            )}

            {/* Timer area (CENTER) with edge toggle buttons */}
            <div className="flex-1 flex flex-col relative">
              {/* Desktop: side toggle buttons */}
              {config.players.length > 0 && (
                <button
                  onClick={() => setShowPlayerPanel((v) => !v)}
                  className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 items-center justify-center bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-r-lg text-xs transition-colors"
                  title={showPlayerPanel ? t('app.hidePlayers') : t('app.showPlayers')}
                >
                  {showPlayerPanel ? '\u25C0' : '\u25B6'}
                </button>
              )}
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 items-center justify-center bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-l-lg text-xs transition-colors"
                title={showSidebar ? t('app.hideSidebar') : t('app.showSidebar')}
              >
                {showSidebar ? '\u25B6' : '\u25C0'}
              </button>

              {/* Timer + Controls */}
              <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 gap-3 sm:gap-6">
                <TimerDisplay
                  timerState={timer.timerState}
                  levels={config.levels}
                  largeDisplay={settings.largeDisplay}
                  countdownEnabled={settings.countdownEnabled}
                  onScrub={timer.setRemainingSeconds}
                  chipConfig={config.chips}
                  colorUpMap={colorUpMap}
                />
                <RebuyStatus
                  active={rebuyActive}
                  rebuy={config.rebuy}
                  currentPlayLevel={currentPlayLevel}
                  elapsedSeconds={tournamentElapsed}
                />
                <Controls
                  timerState={timer.timerState}
                  onToggleStartPause={timer.toggleStartPause}
                  onNext={timer.nextLevel}
                  onPrevious={timer.previousLevel}
                  onReset={handleResetLevel}
                  onRestart={handleRestart}
                />
              </div>

              {/* Mobile: toggle buttons row at bottom */}
              <div className="flex lg:hidden justify-center gap-2 px-3 pb-2">
                {config.players.length > 0 && (
                  <button
                    onClick={() => setShowPlayerPanel((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showPlayerPanel
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {showPlayerPanel ? `✓ ${t('app.players')}` : t('app.players')}
                  </button>
                )}
                <button
                  onClick={() => setShowSidebar((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showSidebar
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {showSidebar ? '✓ Sidebar' : 'Sidebar'}
                </button>
              </div>
            </div>

            {/* Sidebar (RIGHT) */}
            {showSidebar && (
              <aside className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-800 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[50vh] lg:max-h-none">
                <LevelPreview timerState={timer.timerState} levels={config.levels} />
                {config.chips.enabled && (
                  <ChipSidebar
                    chipConfig={config.chips}
                    colorUpMap={colorUpMap}
                    currentLevelIndex={timer.timerState.currentLevelIndex}
                    levels={config.levels}
                  />
                )}
                <SettingsPanel
                  settings={settings}
                  onChange={setSettings}
                  onToggleFullscreen={toggleFullscreen}
                />
                <button
                  onClick={handleExitToSetup}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-colors"
                >
                  {t('app.backToSetup')}
                </button>
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExportModal
          config={config}
          onImport={setConfig}
          onClose={() => setShowImportExport(false)}
        />
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">{confirmAction.title}</h3>
            <p className="text-gray-400 text-sm">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
