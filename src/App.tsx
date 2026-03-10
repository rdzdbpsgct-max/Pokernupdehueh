import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { TournamentConfig, Settings, TournamentCheckpoint, Table, TableMove, PotResult, PlayerPayout } from './domain/types';
import { serializeColorUpMap } from './domain/displayChannel';
import type { DisplayStatePayload } from './domain/displayChannel';
import {
  defaultConfig,
  defaultSettings,
  saveConfig,
  saveSettings,
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  isRebuyActive,
  isLateRegistrationOpen,
  computeTournamentElapsedSeconds,
  validatePayoutConfig,
  validateConfig,
  computeAverageStack,
  scheduleToColorUpMap,
  isBubble,
  isInTheMoney,
  buildTournamentResult,
  saveTournamentResult,
  decodeResultFromQR,
  decodeLeagueStandingsFromQR,
  distributePlayersToTables,
  loadLeagues,
  createGameDayFromResult,
  computeExtendedStandings,
  loadGameDaysForLeague,
  loadPlayerDatabase,
} from './domain/logic';
import { useTimer } from './hooks/useTimer';
import { useVoiceAnnouncements } from './hooks/useVoiceAnnouncements';
import { useGameEvents } from './hooks/useGameEvents';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTournamentActions } from './hooks/useTournamentActions';
import { useTVDisplay } from './hooks/useTVDisplay';
import { useWakeLock } from './hooks/useWakeLock';
import { useConfirmDialog } from './hooks/useConfirmDialog';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useTranslation } from './i18n';
import { showToast } from './domain/toast';
import {
  setSpeechLanguage,
  initSpeech,
  cancelSpeech,
  announceTournamentStart,
  announceLastHand,
  announceHandForHand,
  announceTableMove,
  announceFinalTable,
  announceLateRegistrationClosed,
  setSpeechVolume,
} from './domain/speech';
import { setMasterVolume } from './domain/sounds';
import { setAudioVolume } from './domain/audioPlayer';
// Setup-mode components (static imports — used immediately on load)
import { SetupPage } from './components/SetupPage';
import { SetupWizard } from './components/SetupWizard';
import { isTourCompleted } from './domain/configPersistence';
import { PrintView } from './components/PrintView';
import { TemplateManager } from './components/TemplateManager';
import { ToastContainer } from './components/Toast';
import { TournamentHistory } from './components/TournamentHistory';
import { LeagueManager } from './components/LeagueManager';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { VoiceSwitcher } from './components/VoiceSwitcher';
import type { RemoteCommand } from './domain/remote';
import { useRemoteControl } from './hooks/useRemoteControl';
import { SectionErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';

// Game-mode components (lazy — only needed after tournament starts)
const TimerDisplay = lazy(() => import('./components/TimerDisplay').then(m => ({ default: m.TimerDisplay })));
const Controls = lazy(() => import('./components/Controls').then(m => ({ default: m.Controls })));
const LevelPreview = lazy(() => import('./components/LevelPreview').then(m => ({ default: m.LevelPreview })));
const PlayerPanel = lazy(() => import('./components/PlayerPanel').then(m => ({ default: m.PlayerPanel })));
const ChipSidebar = lazy(() => import('./components/ChipSidebar').then(m => ({ default: m.ChipSidebar })));
const RebuyStatus = lazy(() => import('./components/RebuyStatus').then(m => ({ default: m.RebuyStatus })));
const BubbleIndicator = lazy(() => import('./components/BubbleIndicator').then(m => ({ default: m.BubbleIndicator })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TournamentFinished = lazy(() => import('./components/TournamentFinished').then(m => ({ default: m.TournamentFinished })));
// DisplayMode is now rendered in a separate TV window via TVDisplayWindow
const SharedResultView = lazy(() => import('./components/SharedResultView').then(m => ({ default: m.SharedResultView })));
const SharedLeagueView = lazy(() => import('./components/SharedLeagueView').then(m => ({ default: m.SharedLeagueView })));
const CallTheClock = lazy(() => import('./components/CallTheClock').then(m => ({ default: m.CallTheClock })));
const MultiTablePanel = lazy(() => import('./components/MultiTablePanel').then(m => ({ default: m.MultiTablePanel })));
const SeatingOverlay = lazy(() => import('./components/SeatingOverlay').then(m => ({ default: m.SeatingOverlay })));
const RemoteHostModal = lazy(() => import('./components/RemoteControl').then(m => ({ default: m.RemoteHostModal })));
const RemoteControllerView = lazy(() => import('./components/RemoteControl').then(m => ({ default: m.RemoteControllerView })));
const LeagueView = lazy(() => import('./components/LeagueView').then(m => ({ default: m.LeagueView })));
const OnboardingTour = lazy(() => import('./components/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const PWAInstallGuide = lazy(() => import('./components/PWAInstallGuide').then(m => ({ default: m.PWAInstallGuide })));

type Mode = 'setup' | 'game' | 'league';

function App() {
  const { t, language } = useTranslation();

  // Sync speech language with app language
  useEffect(() => {
    setSpeechLanguage(language);
  }, [language]);

  const [mode, setMode] = useState<Mode>('setup');
  const [config, setConfig] = useState<TournamentConfig>(
    () => defaultConfig(),
  );
  const [settings, setSettings] = useState<Settings>(
    () => defaultSettings(),
  );
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLeagues, setShowLeagues] = useState(false);
  const [showWizard, setShowWizard] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [sharedResult, setSharedResult] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#r=')) {
      const encoded = decodeURIComponent(hash.slice(3));
      const result = decodeResultFromQR(encoded);
      if (result) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return result;
    }
    return null;
  });
  const [sharedLeague, setSharedLeague] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#ls=')) {
      const result = decodeLeagueStandingsFromQR(hash);
      if (result) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return result;
    }
    return null;
  });
  const [cleanView, setCleanView] = useState(false);
  const [lastHandActive, setLastHandActive] = useState(false);
  const [handForHandActive, setHandForHandActive] = useState(false);
  const [showCallTheClock, setShowCallTheClock] = useState(false);
  const [showDealerBadges, setShowDealerBadges] = useState(true);
  const [sidePotData, setSidePotData] = useState<{ pots: PotResult[]; total: number; payouts?: PlayerPayout[] } | null>(null);
  const [showSeatingOverlay, setShowSeatingOverlay] = useState(false);
  const [recentTableMoves, setRecentTableMoves] = useState<TableMove[]>([]);
  const { confirmAction, dialogRef: confirmDialogRef, confirm: confirmBeforeAction, dismiss: dismissConfirm, execute: executeConfirm } = useConfirmDialog();

  const [pendingCheckpoint, setPendingCheckpoint] = useState<TournamentCheckpoint | null>(() => loadCheckpoint());

  // Clock display in game mode — update every second for reliable sync
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    if (mode !== 'game') return;
    const update = () => setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [mode]);

  // Index of the last rebuy level (for level-based rebuy).
  // Used by addOnPauseLevelIndex, addOnWindowOpen, and voice announcements.
  const lastRebuyLevelIndex = useMemo(() => {
    if (!config.rebuy.enabled || config.rebuy.limitType !== 'levels') return -1;
    let playCount = 0;
    for (let i = 0; i < config.levels.length; i++) {
      if (config.levels[i].type === 'level') {
        playCount++;
        if (playCount === config.rebuy.levelLimit) return i;
      }
    }
    return -1;
  }, [config.rebuy, config.levels]);

  // When add-on is enabled and no break follows the last rebuy level,
  // the timer should pause at that level so players can take their add-on.
  const addOnPauseLevelIndex = useMemo(() => {
    if (!config.addOn.enabled || lastRebuyLevelIndex < 0) return undefined;
    const nextIdx = lastRebuyLevelIndex + 1;
    if (nextIdx >= config.levels.length) return undefined;
    // Only pause if there's NO break — breaks already give players time
    if (config.levels[nextIdx]?.type === 'break') return undefined;
    return nextIdx;
  }, [config.addOn.enabled, lastRebuyLevelIndex, config.levels]);

  const timer = useTimer(config.levels, settings, addOnPauseLevelIndex);

  // Track the level where rebuy ended (for one-level add-on window)
  const [addOnEndLevelIndex, setAddOnEndLevelIndex] = useState<number | null>(null);

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

  // Sync master volume to all audio modules
  useEffect(() => {
    const v = settings.volume / 100;
    setMasterVolume(v);
    setAudioVolume(v);
    setSpeechVolume(v);
  }, [settings.volume]);

  // Auto-save tournament checkpoint in game mode
  // Debounced on config/settings changes (500ms) to avoid blocking during rapid interactions.
  // Level/status changes and periodic saves (running timer) remain immediate.
  const checkpointIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkpointDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode !== 'game') return;
    const doSave = () => {
      saveCheckpoint({
        version: 1,
        config,
        settings,
        timer: {
          currentLevelIndex: timer.timerState.currentLevelIndex,
          remainingSeconds: timer.timerState.remainingSeconds,
        },
        savedAt: new Date().toISOString(),
      });
    };
    // Debounce save to avoid blocking during rapid config mutations (e.g. elimination cascade)
    if (checkpointDebounceRef.current) clearTimeout(checkpointDebounceRef.current);
    checkpointDebounceRef.current = setTimeout(doSave, 500);
    // For running timer: periodic save every 5s (instead of every tick)
    if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current);
    if (timer.timerState.status === 'running') {
      checkpointIntervalRef.current = setInterval(doSave, 5000);
    }
    return () => {
      if (checkpointIntervalRef.current) {
        clearInterval(checkpointIntervalRef.current);
        checkpointIntervalRef.current = null;
      }
      if (checkpointDebounceRef.current) {
        clearTimeout(checkpointDebounceRef.current);
        checkpointDebounceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- remainingSeconds intentionally excluded: interval handles periodic saves
  }, [mode, config, settings, timer.timerState.currentLevelIndex, timer.timerState.status]);

  // Wake Lock: prevent screen from sleeping during active tournament
  useWakeLock(mode === 'game' && timer.timerState.status === 'running');

  // PWA install prompt
  const { canPrompt: canInstallPrompt, isInstalled: isPWAInstalled, promptInstall } = useInstallPrompt();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Online/Offline detection — show toast on status change
  const isOnline = useOnlineStatus();
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (prevOnlineRef.current === isOnline) return;
    prevOnlineRef.current = isOnline;
    showToast(isOnline ? t('app.onlineNotice') : t('app.offlineNotice'));
  }, [isOnline, t]);

  // Toggle clean view: also controls both sidebars
  const toggleCleanView = useCallback(() => {
    setCleanView((prev) => {
      const next = !prev;
      if (next) {
        // Hiding details → also hide both sidebars
        setShowPlayerPanel(false);
        setShowSidebar(false);
      } else {
        // Showing details → also show both sidebars
        setShowPlayerPanel(true);
        setShowSidebar(true);
      }
      return next;
    });
  }, []);

  // Toggle last hand announcement
  const handleLastHand = useCallback(() => {
    setLastHandActive((prev) => {
      if (prev) return false; // toggle off
      const nextIsBreak = config.levels[timer.timerState.currentLevelIndex + 1]?.type === 'break';
      if (settings.voiceEnabled) announceLastHand(nextIsBreak, t);
      return true;
    });
  }, [config.levels, timer.timerState.currentLevelIndex, settings.voiceEnabled, t]);

  // Hand-for-Hand toggle
  const handleHandForHand = useCallback(() => {
    setHandForHandActive((prev) => {
      if (prev) return false;
      timer.pause();
      if (settings.voiceEnabled) announceHandForHand(t);
      return true;
    });
  }, [timer, settings.voiceEnabled, t]);

  const handleNextHand = useCallback(() => {
    timer.start();
  }, [timer]);

  // Tournament actions (eliminate, rebuy, add-on, stacks, late reg, re-entry, dealer)
  const {
    updatePlayerStack,
    initStacks,
    clearStacks,
    updatePlayerRebuys,
    updatePlayerAddOn,
    handleAdvanceDealer,
    addLatePlayer,
    handleReEntry,
    reinstatePlayer,
    eliminatePlayer,
  } = useTournamentActions({
    config,
    setConfig,
    mode,
    settings,
    t,
    setRecentTableMoves,
  });

  // Keyboard shortcuts (only in game mode)
  const handleResetLevelShortcut = useCallback(() => {
    confirmBeforeAction(
      t('confirm.resetLevel.title'),
      t('confirm.resetLevel.message'),
      t('confirm.resetLevel.confirm'),
      timer.resetLevel,
    );
  }, [t, timer.resetLevel, confirmBeforeAction]);


  const toggleFullscreen = useCallback(() => {
    try {
      const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
      const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };

      if (document.fullscreenElement || doc.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen not available
    }
  }, []);

  const handleToggleDealerBadges = useCallback(() => {
    setShowDealerBadges((prev) => !prev);
  }, []);

  // Auto-dismiss recent table moves after 30 seconds
  useEffect(() => {
    if (recentTableMoves.length === 0) return;
    const timerId = setTimeout(() => {
      const cutoff = Date.now() - 30_000;
      setRecentTableMoves(prev => prev.filter(m => m.timestamp > cutoff));
    }, 30_000);
    return () => clearTimeout(timerId);
  }, [recentTableMoves]);

  // --- Computed rebuy state for game mode ---
  // Stable integer-second value — limits useMemo cascade to 1×/sec instead of 4×/sec
  const displaySeconds = Math.floor(timer.timerState.remainingSeconds);

  const tournamentElapsed = useMemo(
    () =>
      computeTournamentElapsedSeconds(
        config.levels,
        timer.timerState.currentLevelIndex,
        displaySeconds,
      ),
    [config.levels, timer.timerState.currentLevelIndex, displaySeconds],
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

  const lateRegOpen = useMemo(
    () => isLateRegistrationOpen(config, timer.timerState.currentLevelIndex, config.levels),
    [config, timer.timerState.currentLevelIndex],
  );

  // Voice: Late registration closed
  const prevLateRegRef = useRef(lateRegOpen);
  useEffect(() => {
    if (mode === 'game' && settings.voiceEnabled && prevLateRegRef.current && !lateRegOpen && config.lateRegistration?.enabled) {
      announceLateRegistrationClosed(t);
    }
    prevLateRegRef.current = lateRegOpen;
  }, [mode, settings.voiceEnabled, lateRegOpen, config.lateRegistration?.enabled, t]);

  // Compute add-on window: show announcement at the END of the last rebuy level
  // (when timer reaches 0) and during the break/next level after it.
  // For time-based rebuy: detect transition reactively.
  const prevRebuyActive = useRef(rebuyActive);
  useEffect(() => {
    // Time-based rebuy: track the level where rebuy ended
    if (prevRebuyActive.current && !rebuyActive && config.addOn.enabled && config.rebuy.enabled
        && config.rebuy.limitType !== 'levels') {
      setAddOnEndLevelIndex(timer.timerState.currentLevelIndex);
    }
    prevRebuyActive.current = rebuyActive;
  }, [rebuyActive, config.addOn.enabled, config.rebuy.enabled, config.rebuy.limitType, timer.timerState.currentLevelIndex]);

  const addOnWindowOpen = useMemo(() => {
    if (!config.addOn.enabled || !config.rebuy.enabled) return false;
    const idx = timer.timerState.currentLevelIndex;

    if (config.rebuy.limitType === 'levels' && lastRebuyLevelIndex >= 0) {
      // Show at the end of the last rebuy level (timer expired, waiting for advance)
      if (idx === lastRebuyLevelIndex && displaySeconds <= 0) return true;
      // Show during the break after the last rebuy level (if any) + next play level
      const nextIdx = lastRebuyLevelIndex + 1;
      if (nextIdx >= config.levels.length) return false;
      if (config.levels[nextIdx]?.type === 'break') {
        // Show only during the break — not in the level after the break
        return idx === nextIdx;
      }
      // No break — show during the next play level only
      return idx === nextIdx;
    }

    // Time-based: use reactive detection (addOnEndLevelIndex)
    return !rebuyActive
      && addOnEndLevelIndex !== null
      && idx === addOnEndLevelIndex;
  }, [config.addOn.enabled, config.rebuy, config.levels, lastRebuyLevelIndex, timer.timerState.currentLevelIndex, displaySeconds, rebuyActive, addOnEndLevelIndex]);

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
      config.chips.enabled && config.chips.colorUpEnabled && config.chips.colorUpSchedule.length > 0
        ? scheduleToColorUpMap(config.chips.colorUpSchedule, config.chips.denominations)
        : new Map(),
    [config.chips.enabled, config.chips.colorUpEnabled, config.chips.colorUpSchedule, config.chips.denominations],
  );

  const activePlayerCount = useMemo(
    () => config.players.filter((p) => p.status === 'active').length,
    [config.players],
  );

  const paidPlaces = config.payout.entries.length;

  const bubbleActive = useMemo(
    () => isBubble(activePlayerCount, paidPlaces),
    [activePlayerCount, paidPlaces],
  );

  const inTheMoney = useMemo(
    () => isInTheMoney(activePlayerCount, paidPlaces),
    [activePlayerCount, paidPlaces],
  );

  // Auto-deactivate Hand-for-Hand when bubble bursts
  const prevBubbleForHfH = useRef(bubbleActive);
  useEffect(() => {
    if (prevBubbleForHfH.current && !bubbleActive) {
      setHandForHandActive(false);
    }
    prevBubbleForHfH.current = bubbleActive;
  }, [bubbleActive]);

  // ---------------------------------------------------------------------------
  // BroadcastChannel: send state to TV display window (placed after computed values)
  // ---------------------------------------------------------------------------

  // Build full-state payload
  // Compute league standings for TV display (only when leagueId is set)
  const leagueDisplayData = useMemo(() => {
    if (!config.leagueId) return undefined;
    const leagues = loadLeagues();
    const league = leagues.find((l) => l.id === config.leagueId);
    if (!league) return undefined;
    const gameDays = loadGameDaysForLeague(league.id);
    if (gameDays.length === 0) return undefined;
    return { name: league.name, standings: computeExtendedStandings(league, gameDays) };
  }, [config.leagueId]);

  // Use ref for timerState in payload to avoid callback recreation every 250ms tick.
  // TV display receives timer updates separately via timer-tick BroadcastChannel messages.
  const timerStateForPayloadRef = useRef(timer.timerState);
  timerStateForPayloadRef.current = timer.timerState;

  const buildFullStatePayload = useCallback((): DisplayStatePayload => ({
    timerState: timerStateForPayloadRef.current,
    levels: config.levels,
    chipConfig: config.chips,
    colorUpSchedule: serializeColorUpMap(colorUpMap),
    tournamentName: config.name,
    activePlayerCount,
    totalPlayerCount: config.players.length,
    isBubble: bubbleActive,
    isLastHand: lastHandActive,
    isHandForHand: handForHandActive,
    players: config.players,
    dealerIndex: config.dealerIndex,
    buyIn: config.buyIn,
    payout: config.payout,
    rebuy: config.rebuy,
    addOn: config.addOn,
    bounty: config.bounty,
    averageStack,
    tournamentElapsed,
    tables: config.tables,
    showDealerBadges,
    leagueName: leagueDisplayData?.name,
    leagueStandings: leagueDisplayData?.standings,
    sidePotData: sidePotData ?? undefined,
  }), [config, colorUpMap, activePlayerCount, bubbleActive, lastHandActive, handForHandActive, averageStack, tournamentElapsed, showDealerBadges, leagueDisplayData, sidePotData]);

  // TV Display: BroadcastChannel sync + window management
  const { tvWindowActive, openTVWindow, closeTVWindow } = useTVDisplay({
    mode,
    buildFullStatePayload,
    remainingSeconds: timer.timerState.remainingSeconds,
    timerStatus: timer.timerState.status,
    currentLevelIndex: timer.timerState.currentLevelIndex,
    showCallTheClock,
    callTheClockSeconds: settings.callTheClockSeconds,
    soundEnabled: settings.soundEnabled,
    voiceEnabled: settings.voiceEnabled,
  });

  const handleToggleTVWindow = useCallback(() => {
    if (tvWindowActive) closeTVWindow();
    else openTVWindow();
  }, [tvWindowActive, closeTVWindow, openTVWindow]);

  useKeyboardShortcuts({
    mode,
    onToggleStartPause: timer.toggleStartPause,
    onNextLevel: timer.nextLevel,
    onPreviousLevel: timer.previousLevel,
    onResetLevel: handleResetLevelShortcut,
    onToggleCleanView: toggleCleanView,
    onLastHand: handleLastHand,
    onToggleTVWindow: handleToggleTVWindow,
    onHandForHand: handleHandForHand,
    onCallTheClock: useCallback(() => setShowCallTheClock((v) => !v), []),
  });

  const tournamentFinished = useMemo(() => {
    if (config.players.length < 2) return false;
    return config.players.filter((p) => p.status === 'active').length === 1;
  }, [config.players]);

  // Clear checkpoint and save result when tournament finishes
  const resultSavedRef = useRef(false);
  useEffect(() => {
    if (mode === 'game' && tournamentFinished) {
      clearCheckpoint();
      if (!resultSavedRef.current) {
        resultSavedRef.current = true;
        const result = buildTournamentResult(config, tournamentElapsed, currentPlayLevel);
        saveTournamentResult(result);
        // Auto-create GameDay when tournament is linked to a league
        if (config.leagueId) {
          const leagues = loadLeagues();
          const league = leagues.find(l => l.id === config.leagueId);
          if (league) {
            const registeredPlayers = loadPlayerDatabase();
            createGameDayFromResult(result, league, registeredPlayers);
          }
        }
      }
    }
    if (!tournamentFinished) {
      resultSavedRef.current = false;
    }
  }, [mode, tournamentFinished, config, tournamentElapsed, currentPlayLevel]);

  // Warn before navigating away during active tournament
  useEffect(() => {
    if (mode !== 'game' || tournamentFinished) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [mode, tournamentFinished]);

  const winner = useMemo(() => {
    if (!tournamentFinished) return null;
    return config.players.find((p) => p.status === 'active') ?? null;
  }, [tournamentFinished, config.players]);

  // Build the tournament result for direct use (avoids localStorage timing issues)
  const finishedResult = useMemo(() => {
    if (!tournamentFinished) return null;
    return buildTournamentResult(config, tournamentElapsed, currentPlayLevel);
  }, [tournamentFinished, config, tournamentElapsed, currentPlayLevel]);

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

  // Game events: victory sound/pause, bubble/ITM effects
  const { showItmFlash, reset: resetGameEvents } = useGameEvents({
    mode,
    settings,
    tournamentFinished,
    bubbleActive,
    inTheMoney,
    winnerName: winner?.name,
    pause: timer.pause,
    t,
  });

  // Voice announcements: level change, break warning, 5-min warning, bounty, milestones, timer pause/resume
  const handleLevelChange = useCallback(() => {
    setLastHandActive(false);
    setShowDealerBadges(false);
  }, []);
  const { reset: resetVoice } = useVoiceAnnouncements({
    mode,
    settings,
    config,
    timerState: timer.timerState,
    colorUpMap,
    activePlayerCount,
    paidPlaces,
    bubbleActive,
    inTheMoney,
    addOnWindowOpen,
    rebuyActive,
    tournamentFinished,
    onLevelChange: handleLevelChange,
    t,
  });

  // --- Multi-table handlers ---
  const prevTableCountRef = useRef<number>(config.tables?.length ?? 0);
  useEffect(() => {
    const tableCount = config.tables?.length ?? 0;
    // Detect final table merge: went from >1 to exactly 1 table
    if (mode === 'game' && prevTableCountRef.current > 1 && tableCount === 1 && settings.voiceEnabled) {
      announceFinalTable(t);
    }
    prevTableCountRef.current = tableCount;
  }, [config.tables?.length, mode, settings.voiceEnabled, t]);

  const handleUpdateTables = useCallback((tables: Table[]) => {
    setConfig((prev) => ({ ...prev, tables }));
  }, []);

  const handleTableMoves = useCallback((moves: TableMove[]) => {
    setRecentTableMoves(prev => [...prev, ...moves]);
    if (!settings.voiceEnabled) return;
    for (const move of moves) {
      announceTableMove(move.playerName, move.toTableName, move.toSeat, t);
    }
  }, [settings.voiceEnabled, t]);

  // --- Remote control ---
  const handleRemoteCommand = useCallback((cmd: RemoteCommand) => {
    switch (cmd.action) {
      case 'toggle': timer.toggleStartPause(); break;
      case 'play': timer.start(); break;
      case 'pause': timer.pause(); break;
      case 'next': timer.nextLevel(); break;
      case 'prev': timer.previousLevel(); break;
      case 'reset': timer.resetLevel(); break;
      case 'call-the-clock': setShowCallTheClock(v => !v); break;
      case 'advanceDealer': handleAdvanceDealer(); break;
      case 'toggleSound':
        setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled, voiceEnabled: !prev.voiceEnabled }));
        break;
    }
  }, [timer, handleAdvanceDealer, setSettings]);

  const {
    hostRef: remoteHostRef,
    hostStatus: remoteHostStatus,
    showRemoteModal: showRemoteControl,
    setShowRemoteModal: setShowRemoteControl,
    isControllerMode,
    controllerPeerId,
    controllerSecret,
    startHost: startRemoteHost,
  } = useRemoteControl({
    onCommand: handleRemoteCommand,
    enabled: mode === 'game',
  });

  // Send state updates to connected remote controller (throttled to 1/sec for running timer)
  const remoteStateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const host = remoteHostRef.current;
    if (!host || !host.connected || mode !== 'game') return;

    const sendRemoteState = () => {
      const currentLevel = config.levels[timer.timerState.currentLevelIndex];
      const levelLabel = currentLevel?.type === 'break'
        ? (currentLevel.label || t('config.break'))
        : `Level ${config.levels.slice(0, timer.timerState.currentLevelIndex + 1).filter(l => l.type === 'level').length}`;

      const sb = currentLevel?.type === 'level' ? currentLevel.smallBlind : 0;
      const bb = currentLevel?.type === 'level' ? currentLevel.bigBlind : 0;
      const levelAnte = currentLevel?.type === 'level' ? currentLevel.ante : undefined;

      host.sendState({
        timerStatus: timer.timerState.status === 'running' ? 'running' : 'paused',
        remainingSeconds: timer.timerState.remainingSeconds,
        currentLevelIndex: timer.timerState.currentLevelIndex,
        levelLabel,
        smallBlind: sb ?? 0,
        bigBlind: bb ?? 0,
        ante: levelAnte,
        activePlayerCount,
        totalPlayerCount: config.players.length,
        isBubble: bubbleActive,
        tournamentName: config.name,
        soundEnabled: settings.soundEnabled,
      });
    };

    // Send immediately on level/status/player changes
    sendRemoteState();

    // For running timer: periodic sync every 1s
    if (remoteStateIntervalRef.current) clearInterval(remoteStateIntervalRef.current);
    if (timer.timerState.status === 'running') {
      remoteStateIntervalRef.current = setInterval(sendRemoteState, 1000);
    }
    return () => {
      if (remoteStateIntervalRef.current) {
        clearInterval(remoteStateIntervalRef.current);
        remoteStateIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- remainingSeconds intentionally excluded: interval handles periodic sync
  }, [mode, timer.timerState.status, timer.timerState.currentLevelIndex, config.levels, config.players, config.name, activePlayerCount, bubbleActive, settings.soundEnabled, t, remoteHostRef]);

  const switchToGame = () => {
    // Reset all player state when starting a new tournament
    setConfig((prev) => {
      const resetPlayers = prev.players.map((p) => ({
        ...p,
        rebuys: 0,
        addOn: false,
        status: 'active' as const,
        placement: null,
        eliminatedBy: null,
        knockouts: 0,
      }));

      // Auto-distribute players to tables if multi-table is enabled
      let updatedTables = prev.tables;
      if (updatedTables && updatedTables.length > 0) {
        const playerIds = resetPlayers.map(p => p.id);
        updatedTables = distributePlayersToTables(playerIds, updatedTables);
        // Set per-table dealers to first occupied seat
        updatedTables = updatedTables.map(t => {
          if (t.status !== 'active') return t;
          const firstOccupied = t.seats.find(s => s.playerId !== null);
          return { ...t, dealerSeat: firstOccupied?.seatNumber ?? null };
        });
      }

      return { ...prev, players: resetPlayers, tables: updatedTables };
    });
    setAddOnEndLevelIndex(null);
    setRecentTableMoves([]);
    // Ensure all panels are visible when starting a game
    setCleanView(false);
    setShowPlayerPanel(true);
    setShowSidebar(true);
    setShowDealerBadges(true);
    setMode('game');
    initSpeech();

    if (config.tables && config.tables.length > 0) {
      // Multi-table: show seating overlay, timer starts when user dismisses
      setShowSeatingOverlay(true);
    } else {
      timer.restart();
      if (settings.voiceEnabled) announceTournamentStart(t);
    }
  };

  const handleDismissSeating = useCallback(() => {
    setShowSeatingOverlay(false);
    timer.restart();
    if (settings.voiceEnabled) announceTournamentStart(t);
  }, [timer, settings.voiceEnabled, t]);

  const switchToSetup = () => {
    cancelSpeech();
    timer.restart();
    setAddOnEndLevelIndex(null);
    setLastHandActive(false);
    setHandForHandActive(false);
    closeTVWindow();
    // Remote control cleanup is handled by useRemoteControl hook (enabled: mode === 'game')
    setShowRemoteControl(false);
    resetGameEvents();
    resetVoice();
    clearCheckpoint();
    setMode('setup');
  };

  const restoreFromCheckpoint = useCallback(() => {
    if (!pendingCheckpoint) return;
    setConfig(pendingCheckpoint.config);
    setSettings(pendingCheckpoint.settings);
    timer.restoreLevel(
      pendingCheckpoint.timer.currentLevelIndex,
      pendingCheckpoint.timer.remainingSeconds,
    );
    setPendingCheckpoint(null);
    setCleanView(false);
    setShowPlayerPanel(true);
    setShowSidebar(true);
    setMode('game');
  }, [pendingCheckpoint, timer]);

  const dismissCheckpoint = useCallback(() => {
    clearCheckpoint();
    setPendingCheckpoint(null);
  }, []);

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
      () => {
        timer.restart();
        // Reset all players to active state
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
            chips: undefined,
          })),
        }));
        // Reset all game state
        setAddOnEndLevelIndex(null);
        setHandForHandActive(false);
        resetGameEvents();
      },
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

  // Remote Controller Mode — render ONLY the controller view, skip all other UI
  if (isControllerMode && controllerPeerId) {
    return (
      <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
        <RemoteControllerView
          hostPeerId={controllerPeerId}
          secret={controllerSecret}
          onClose={() => window.close()}
        />
      </Suspense></SectionErrorBoundary>
    );
  }

  return (
    <>
    <PrintView config={config} result={finishedResult} />
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-300 dark:border-gray-700/30 bg-white/95 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
            {mode === 'game' && config.name ? `♠ ♥ ${config.name} ♦ ♣` : t('app.title')}
          </h1>
          {mode === 'game' && (
            <span className="text-sm text-gray-400 dark:text-gray-500 font-mono tabular-nums">{clockTime}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <VoiceSwitcher settings={settings} onChange={setSettings} />
          {mode === 'game' && !tournamentFinished && (
            <>
              <button
                onClick={startRemoteHost}
                className="relative px-3 py-1.5 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600/30 rounded-lg text-sm font-medium transition-all duration-200"
                title={t('remote.openRemote')}
              >
                {String.fromCodePoint(0x1F4F1)}
                {remoteHostStatus === 'connected' && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800"
                    style={{ backgroundColor: 'var(--accent-500)' }}
                  />
                )}
              </button>
              <button
                onClick={tvWindowActive ? closeTVWindow : openTVWindow}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  tvWindowActive
                    ? 'text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600/30'
                }`}
                style={tvWindowActive ? { backgroundColor: 'var(--accent-600)', borderColor: 'var(--accent-500)', boxShadow: `0 1px 2px var(--accent-900)` } : undefined}
                title={tvWindowActive ? t('display.tvWindowActive') : t('display.activate')}
              >
                📺
              </button>
            </>
          )}
          {mode !== 'game' && (
            <button
              onClick={() => {
                if (mode === 'league') setMode('setup');
                else setMode('game');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'league'
                  ? 'bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600/30'
                  : 'text-white shadow-md'
              }`}
              style={mode === 'setup' ? { background: 'linear-gradient(to bottom, var(--accent-600), var(--accent-700))', boxShadow: `0 4px 6px -1px var(--accent-900)` } : undefined}
              title={mode === 'setup' ? t('app.startGame') : t('app.setup')}
            >
              {mode === 'setup' ? t('app.startGame') : t('app.setup')}
            </button>
          )}
          {mode === 'game' && (
            <button
              onClick={handleExitToSetup}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600/30 rounded-lg text-sm font-medium transition-all duration-200"
              title={t('app.setup')}
            >
              {t('app.setup')}
            </button>
          )}
          {(mode === 'setup' || mode === 'league') && (
            <>
              {mode === 'setup' && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-gray-700/30"
                  title={t('app.templates')}
                  data-tour="templates"
                >
                  {t('app.templates')}
                </button>
              )}
              <button
                onClick={() => setMode(mode === 'league' ? 'setup' : 'league')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border ${
                  mode === 'league'
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700/30'
                }`}
                style={mode === 'league' ? { backgroundColor: 'var(--accent-600)', borderColor: 'var(--accent-500)' } : undefined}
                title={t('app.leagues')}
                data-tour="leagues"
              >
                {t('app.leagues')}
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm transition-all duration-200 border border-gray-300 dark:border-gray-700/30"
                title={t('app.history')}
              >
                {t('app.history')}
              </button>
              {mode === 'setup' && (
                <button
                  onClick={() => setShowInstallGuide(true)}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-700/30"
                  title={t('settings.installApp' as Parameters<typeof t>[0])}
                  aria-label={t('settings.installApp' as Parameters<typeof t>[0])}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 flex">
        {mode === 'league' ? (
          /* League Mode */
          <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
            <LeagueView
              onStartTournament={(leagueId) => {
                setConfig(prev => ({ ...prev, leagueId }));
                setMode('setup');
              }}
            />
          </Suspense></SectionErrorBoundary>
        ) : mode === 'setup' ? (
          /* Setup Mode */
          <SetupPage
            config={config}
            setConfig={setConfig}
            pendingCheckpoint={pendingCheckpoint}
            onRestoreCheckpoint={restoreFromCheckpoint}
            onDismissCheckpoint={dismissCheckpoint}
            onSwitchToGame={switchToGame}
            onConfirm={confirmBeforeAction}
            startErrors={startErrors}
          />
        ) : tournamentFinished && winner ? (
          /* Tournament Finished */
          <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
            <TournamentFinished
              players={config.players}
              winner={winner}
              buyIn={config.buyIn}
              payout={config.payout}
              bounty={config.bounty}
              rebuy={config.rebuy}
              addOn={config.addOn}
              tournamentResult={finishedResult}
              onBackToSetup={switchToSetup}
            />
          </Suspense></SectionErrorBoundary>
        ) : (
          /* Game Mode */
          <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Player Panel (LEFT) */}
            {showPlayerPanel && config.players.length > 0 && (
              <aside className="w-full md:absolute md:left-0 md:top-0 md:bottom-0 md:w-60 lg:w-72 md:z-20 md:shadow-xl md:shadow-black/20 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4 overflow-y-auto max-h-[40vh] sm:max-h-[50vh] md:max-h-none">
                <PlayerPanel
                  players={config.players}
                  dealerIndex={config.dealerIndex}
                  buyIn={config.buyIn}
                  payout={config.payout}
                  rebuyActive={rebuyActive}
                  rebuyConfig={config.rebuy}
                  addOnConfig={config.addOn}
                  addOnWindowOpen={addOnWindowOpen}
                  bountyConfig={config.bounty}
                  averageStack={averageStack}
                  onUpdateRebuys={updatePlayerRebuys}
                  onUpdateAddOn={updatePlayerAddOn}
                  onEliminatePlayer={eliminatePlayer}
                  onReinstatePlayer={reinstatePlayer}
                  onAdvanceDealer={handleAdvanceDealer}
                  showDealerBadges={showDealerBadges}
                  onToggleDealerBadges={handleToggleDealerBadges}
                  onUpdateStack={updatePlayerStack}
                  onInitStacks={initStacks}
                  onClearStacks={clearStacks}
                  lateRegOpen={lateRegOpen}
                  onAddLatePlayer={addLatePlayer}
                  onReEntryPlayer={handleReEntry}
                  tables={config.tables}
                  onSidePotResultChange={setSidePotData}
                />
              </aside>
            )}

            {/* Timer area (CENTER) with edge toggle buttons */}
            <div className="flex-1 flex flex-col relative">
              {/* Desktop: side toggle buttons */}
              {config.players.length > 0 && (
                <button
                  onClick={() => setShowPlayerPanel((v) => !v)}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-7 h-20 items-center justify-center bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-r-lg text-xs transition-all duration-200 border-r border-y border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-300/30 dark:shadow-black/10"
                  title={showPlayerPanel ? t('app.hidePlayers') : t('app.showPlayers')}
                >
                  {showPlayerPanel ? '\u25C0' : '\u25B6'}
                </button>
              )}
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 w-7 h-20 items-center justify-center bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-l-lg text-xs transition-all duration-200 border-l border-y border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-300/30 dark:shadow-black/10"
                title={showSidebar ? t('app.hideSidebar') : t('app.showSidebar')}
              >
                {showSidebar ? '\u25B6' : '\u25C0'}
              </button>

              {/* Timer + Controls */}
              <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 gap-3 sm:gap-6 relative">
                <TimerDisplay
                  timerState={timer.timerState}
                  levels={config.levels}
                  largeDisplay={settings.largeDisplay}
                  countdownEnabled={settings.countdownEnabled}
                  onScrub={timer.setRemainingSeconds}
                  onScrubEnd={timer.start}
                  chipConfig={config.chips}
                  cleanView={cleanView}
                  colorUpMap={colorUpMap}
                  anteMode={config.anteMode}
                />
                <BubbleIndicator
                  isBubble={bubbleActive}
                  showItmFlash={showItmFlash}
                  addOnWindowOpen={addOnWindowOpen}
                  addOnCost={config.addOn.cost}
                  addOnChips={config.addOn.chips}
                  lastHandActive={lastHandActive}
                  handForHandActive={handForHandActive}
                />
                {!cleanView && (
                  <RebuyStatus
                    active={rebuyActive}
                    rebuy={config.rebuy}
                    currentPlayLevel={currentPlayLevel}
                    elapsedSeconds={tournamentElapsed}
                  />
                )}
                <Controls
                  timerState={timer.timerState}
                  onToggleStartPause={timer.toggleStartPause}
                  onNext={timer.nextLevel}
                  onPrevious={timer.previousLevel}
                  onReset={handleResetLevel}
                  onRestart={handleRestart}
                  hideSecondaryControls={cleanView}
                  cleanView={cleanView}
                  onToggleCleanView={toggleCleanView}
                  lastHandActive={lastHandActive}
                  onLastHand={handleLastHand}
                  handForHandActive={handForHandActive}
                  onHandForHand={handleHandForHand}
                  onNextHand={handleNextHand}
                  showHandForHand={bubbleActive}
                  callTheClockSeconds={settings.callTheClockSeconds}
                  onCallTheClock={() => setShowCallTheClock(true)}
                />
              </div>

              {/* Mobile: sidebar toggle buttons */}
              <div className="flex md:hidden justify-center gap-2 px-3 pb-2">
                {config.players.length > 0 && (
                  <button
                    onClick={() => setShowPlayerPanel((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showPlayerPanel
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                    style={showPlayerPanel ? { backgroundColor: 'var(--accent-700)' } : undefined}
                  >
                    {showPlayerPanel ? `✓ ${t('app.players')}` : t('app.players')}
                  </button>
                )}
                <button
                  onClick={() => setShowSidebar((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showSidebar
                      ? 'text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                  style={showSidebar ? { backgroundColor: 'var(--accent-700)' } : undefined}
                >
                  {showSidebar ? `✓ ${t('app.sidebar')}` : t('app.sidebar')}
                </button>
              </div>
            </div>

            {/* Sidebar (RIGHT) */}
            {showSidebar && (
              <aside className="w-full md:absolute md:right-0 md:top-0 md:bottom-0 md:w-60 lg:w-72 md:z-20 md:shadow-xl md:shadow-black/20 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[40vh] sm:max-h-[50vh] md:max-h-none">
                <LevelPreview timerState={timer.timerState} levels={config.levels} />
                {config.chips.enabled && (
                  <ChipSidebar
                    chipConfig={config.chips}
                    colorUpMap={colorUpMap}
                    currentLevelIndex={timer.timerState.currentLevelIndex}
                    levels={config.levels}
                  />
                )}
                {config.tables && config.tables.length > 0 && (
                  <MultiTablePanel
                    config={config}
                    recentMoves={recentTableMoves}
                    onUpdateTables={handleUpdateTables}
                    onTableMoves={handleTableMoves}
                  />
                )}
                <SettingsPanel
                  settings={settings}
                  onChange={setSettings}
                  onToggleFullscreen={toggleFullscreen}
                  onShowInstallGuide={() => setShowInstallGuide(true)}
                />
                <button
                  onClick={handleExitToSetup}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-colors"
                >
                  {t('app.backToSetup')}
                </button>
              </aside>
            )}
          </div>
          </Suspense></SectionErrorBoundary>
        )}
      </main>

      {/* Seating Overlay (multi-table start) */}
      {showSeatingOverlay && mode === 'game' && config.tables && (
        <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <SeatingOverlay
            tables={config.tables}
            players={config.players}
            onDismiss={handleDismissSeating}
          />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Remote Control Modal */}
      {showRemoteControl && mode === 'game' && (
        <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <RemoteHostModal
            peerId={remoteHostRef.current?.peerId ?? ''}
            secret={remoteHostRef.current?.secret}
            status={remoteHostStatus}
            onClose={() => setShowRemoteControl(false)}
          />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Call the Clock Modal */}
      {showCallTheClock && mode === 'game' && (
        <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <CallTheClock
            durationSeconds={settings.callTheClockSeconds}
            soundEnabled={settings.soundEnabled}
            voiceEnabled={settings.voiceEnabled}
            onClose={() => setShowCallTheClock(false)}
          />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <TemplateManager
          config={config}
          onLoad={setConfig}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showHistory && (
        <TournamentHistory onClose={() => setShowHistory(false)} />
      )}

      {showLeagues && (
        <LeagueManager onClose={() => setShowLeagues(false)} currentConfig={config} />
      )}

      {/* Setup Wizard (first-time users) */}
      {showWizard && mode === 'setup' && !pendingCheckpoint && (
        <SetupWizard
          onComplete={(wizardConfig) => {
            setConfig(wizardConfig);
            setShowWizard(false);
            // Show onboarding tour after wizard if not already completed
            if (!isTourCompleted()) {
              setTimeout(() => setShowTour(true), 500);
            }
          }}
          onSkip={() => setShowWizard(false)}
        />
      )}

      {/* Onboarding Tour (after wizard completion) */}
      {showTour && mode === 'setup' && (
        <Suspense fallback={null}>
          <OnboardingTour onComplete={() => setShowTour(false)} />
        </Suspense>
      )}

      {/* PWA Install Guide */}
      {showInstallGuide && (
        <SectionErrorBoundary><Suspense fallback={null}>
          <PWAInstallGuide
            onClose={() => setShowInstallGuide(false)}
            canPrompt={canInstallPrompt}
            isInstalled={isPWAInstalled}
            onPromptInstall={promptInstall}
          />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Shared Result Modal (from QR code) */}
      {sharedResult && (
        <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <SharedResultView result={sharedResult} onClose={() => setSharedResult(null)} />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Shared League Standings Modal (from QR code) */}
      {sharedLeague && (
        <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
          <SharedLeagueView
            leagueName={sharedLeague.leagueName}
            standings={sharedLeague.standings}
            onClose={() => setSharedLeague(null)}
          />
        </Suspense></SectionErrorBoundary>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={confirmDialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-gray-300/40 dark:shadow-black/40 animate-scale-in">
            <h3 id="confirm-title" className="text-lg font-bold text-gray-900 dark:text-white">{confirmAction.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={dismissConfirm}
                className="px-4 py-2 bg-gray-100/80 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700/40"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={executeConfirm}
                className="px-4 py-2 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-red-900/40 border border-red-700/30 active:scale-[0.97]"
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
      <ToastContainer />
    </div>
    </>
  );
}

export default App;
