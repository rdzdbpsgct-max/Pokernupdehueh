import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { TournamentConfig, Settings, TournamentCheckpoint, Table, TableMove } from './domain/types';
import {
  defaultConfig,
  defaultSettings,
  saveConfig,
  loadConfig,
  saveSettings,
  loadSettings,
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  isRebuyActive,
  isLateRegistrationOpen,
  generatePlayerId,
  computeTournamentElapsedSeconds,
  computeNextPlacement,
  validatePayoutConfig,
  validateConfig,
  computeAverageStack,
  initializePlayerStacks,
  scheduleToColorUpMap,
  isBubble,
  isInTheMoney,
  advanceDealer,
  buildTournamentResult,
  saveTournamentResult,
  decodeResultFromQR,
  drawMysteryBounty,
  isWizardCompleted,
  removePlayerFromTable,
  shouldMergeToFinalTable,
  mergeToFinalTable,
} from './domain/logic';
import { useTimer } from './hooks/useTimer';
import { useVoiceAnnouncements } from './hooks/useVoiceAnnouncements';
import { useGameEvents } from './hooks/useGameEvents';
import { useTranslation } from './i18n';
import {
  setSpeechLanguage,
  initSpeech,
  cancelSpeech,
  announceTournamentStart,
  announceLastHand,
  announceHandForHand,
  announceTableMove,
  announceFinalTable,
  announceMysteryBounty,
  announceLateRegistrationClosed,
  setSpeechVolume,
} from './domain/speech';
import { setMasterVolume } from './domain/sounds';
import { setAudioVolume } from './domain/audioPlayer';
// Setup-mode components (static imports — used immediately on load)
import { SetupPage } from './components/SetupPage';
import { SetupWizard } from './components/SetupWizard';
import { PrintView } from './components/PrintView';
import { TemplateManager } from './components/TemplateManager';
import { TournamentHistory } from './components/TournamentHistory';
import { LeagueManager } from './components/LeagueManager';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { VoiceSwitcher } from './components/VoiceSwitcher';
import { useTheme } from './theme';

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
const DisplayMode = lazy(() => import('./components/display').then(m => ({ default: m.DisplayMode })));
const SharedResultView = lazy(() => import('./components/SharedResultView').then(m => ({ default: m.SharedResultView })));
const CallTheClock = lazy(() => import('./components/CallTheClock').then(m => ({ default: m.CallTheClock })));
const MultiTablePanel = lazy(() => import('./components/MultiTablePanel').then(m => ({ default: m.MultiTablePanel })));

type Mode = 'setup' | 'game';

function App() {
  const { t, language } = useTranslation();
  const { resolved: theme } = useTheme();

  // Sync speech language with app language
  useEffect(() => {
    setSpeechLanguage(language);
  }, [language]);

  const [mode, setMode] = useState<Mode>('setup');
  const [config, setConfig] = useState<TournamentConfig>(
    () => loadConfig() ?? defaultConfig(),
  );
  const [settings, setSettings] = useState<Settings>(
    () => loadSettings() ?? defaultSettings(),
  );
  const [showPlayerPanel, setShowPlayerPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLeagues, setShowLeagues] = useState(false);
  const [showWizard, setShowWizard] = useState(() => !isWizardCompleted());
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
  const [cleanView, setCleanView] = useState(false);
  const [lastHandActive, setLastHandActive] = useState(false);
  const [handForHandActive, setHandForHandActive] = useState(false);
  const [displayMode, setDisplayMode] = useState(false);
  const [showCallTheClock, setShowCallTheClock] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [pendingCheckpoint, setPendingCheckpoint] = useState<TournamentCheckpoint | null>(() => loadCheckpoint());

  // Clock display in game mode — update every 30 seconds
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    if (mode !== 'game') return;
    setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const id = setInterval(() => setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 30000);
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
  const confirmDialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus confirm dialog & close on Escape
  useEffect(() => {
    if (!confirmAction) return;
    const el = confirmDialogRef.current;
    if (el) {
      const focusable = el.querySelector<HTMLElement>('button, input, [tabindex]');
      focusable?.focus();
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmAction(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [confirmAction]);

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
  useEffect(() => {
    if (mode !== 'game') return;
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
  }, [mode, config, settings, timer.timerState.currentLevelIndex, timer.timerState.remainingSeconds]);

  // Wake Lock: prevent screen from sleeping during active tournament
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const isActive = mode === 'game' && timer.timerState.status === 'running';

    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Wake lock request failed (e.g. low battery, tab hidden)
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // already released
        }
        wakeLockRef.current = null;
      }
    };

    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire wake lock when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseWakeLock();
    };
  }, [mode, timer.timerState.status]);

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

  // Stack tracking handlers
  const updatePlayerStack = useCallback((playerId: string, chips: number) => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, chips } : p,
      ),
    }));
  }, []);

  const initStacks = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      players: initializePlayerStacks(
        prev.players,
        prev.startingChips,
        prev.rebuy.enabled ? prev.rebuy.rebuyChips : 0,
        prev.addOn.enabled ? prev.addOn.chips : 0,
      ),
    }));
  }, []);

  const clearStacks = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) => ({ ...p, chips: undefined })),
    }));
  }, []);

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
        case 'KeyF':
          toggleCleanView();
          break;
        case 'KeyL':
          handleLastHand();
          break;
        case 'KeyT':
          setDisplayMode((v) => !v);
          break;
        case 'KeyH':
          handleHandForHand();
          break;
        case 'KeyC':
          setShowCallTheClock((v) => !v);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, timer, t, toggleCleanView, handleLastHand, handleHandForHand]);

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

  // --- Late registration: add player during tournament ---
  const addLatePlayer = useCallback(() => {
    const playerNumber = config.players.length + 1;
    const name = t('playerManager.playerN', { n: playerNumber });
    setConfig((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        {
          id: generatePlayerId(),
          name,
          rebuys: 0,
          addOn: false,
          status: 'active' as const,
          placement: null,
          eliminatedBy: null,
          knockouts: 0,
        },
      ],
    }));
  }, [config.players.length, t]);

  // --- Rebuy update handler ---
  const updatePlayerRebuys = useCallback((playerId: string, newCount: number) => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id !== playerId) return p;
        const diff = newCount - p.rebuys;
        const updated = { ...p, rebuys: newCount };
        if (p.chips !== undefined && diff !== 0) {
          updated.chips = Math.max(0, p.chips + diff * prev.rebuy.rebuyChips);
        }
        return updated;
      }),
    }));
  }, []);

  // --- Add-on update handler ---
  const updatePlayerAddOn = useCallback((playerId: string, hasAddOn: boolean) => {
    setConfig((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id !== playerId) return p;
        const updated = { ...p, addOn: hasAddOn };
        if (p.chips !== undefined) {
          updated.chips = hasAddOn
            ? p.chips + prev.addOn.chips
            : Math.max(0, p.chips - prev.addOn.chips);
        }
        return updated;
      }),
    }));
  }, []);

  // --- Advance dealer ---
  const handleAdvanceDealer = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      dealerIndex: advanceDealer(prev.players, prev.dealerIndex),
    }));
  }, []);

  // --- Eliminate player handler ---
  const lastMysteryDrawRef = useRef<number | null>(null);
  const eliminatePlayer = useCallback((playerId: string, eliminatedBy: string | null) => {
    setConfig((prev) => {
      const placement = computeNextPlacement(prev.players);

      // Mystery bounty: draw from pool if applicable
      let updatedBounty = prev.bounty;
      if (prev.bounty.enabled && prev.bounty.type === 'mystery' && prev.bounty.mysteryPool && prev.bounty.mysteryPool.length > 0 && eliminatedBy) {
        const draw = drawMysteryBounty(prev.bounty.mysteryPool);
        lastMysteryDrawRef.current = draw.amount;
        updatedBounty = { ...prev.bounty, amount: draw.amount, mysteryPool: draw.remainingPool };
      }

      const updatedPlayers = prev.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, status: 'eliminated' as const, placement, eliminatedBy, chips: p.chips !== undefined ? 0 : undefined };
        }
        if (eliminatedBy && p.id === eliminatedBy) {
          return { ...p, knockouts: p.knockouts + 1 };
        }
        return p;
      });

      // Multi-table: remove eliminated player from their table
      let updatedTables = prev.tables;
      if (updatedTables && updatedTables.length > 0) {
        updatedTables = removePlayerFromTable(updatedTables, playerId);

        // Check for final table merge
        if (updatedTables.length > 1 && shouldMergeToFinalTable(updatedTables, updatedPlayers)) {
          updatedTables = mergeToFinalTable(updatedTables, updatedPlayers);
        }
      }

      return {
        ...prev,
        bounty: updatedBounty,
        players: updatedPlayers,
        tables: updatedTables,
      };
    });
  }, []);

  // Voice: Mystery bounty draw
  useEffect(() => {
    if (mode !== 'game' || !settings.voiceEnabled) return;
    if (lastMysteryDrawRef.current !== null) {
      announceMysteryBounty(lastMysteryDrawRef.current, t);
      lastMysteryDrawRef.current = null;
    }
  }, [mode, settings.voiceEnabled, config.bounty, t]);

  // --- Reinstate (undo elimination) handler ---
  const reinstatePlayer = useCallback((playerId: string) => {
    setConfig((prev) => {
      const player = prev.players.find((p) => p.id === playerId);
      if (!player || player.status !== 'eliminated') return prev;

      const killedBy = player.eliminatedBy;
      const reinstatedPlacement = player.placement;

      const updated = prev.players.map((p) => {
        // Reset the reinstated player
        if (p.id === playerId) {
          return { ...p, status: 'active' as const, placement: null, eliminatedBy: null };
        }
        // Decrement knockout count of the killer
        if (killedBy && p.id === killedBy) {
          return { ...p, knockouts: Math.max(0, p.knockouts - 1) };
        }
        // Recalculate placements: players eliminated before the reinstated one
        // had higher placement numbers; shift them down by 1
        if (p.status === 'eliminated' && reinstatedPlacement != null && p.placement != null && p.placement > reinstatedPlacement) {
          return { ...p, placement: p.placement - 1 };
        }
        return p;
      });

      return { ...prev, players: updated };
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
      if (idx === lastRebuyLevelIndex && timer.timerState.remainingSeconds <= 0) return true;
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
  }, [config.addOn.enabled, config.rebuy, config.levels, lastRebuyLevelIndex, timer.timerState.currentLevelIndex, timer.timerState.remainingSeconds, rebuyActive, addOnEndLevelIndex]);

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
        saveTournamentResult(buildTournamentResult(config, tournamentElapsed, currentPlayLevel));
      }
    }
    if (!tournamentFinished) {
      resultSavedRef.current = false;
    }
  }, [mode, tournamentFinished, config, tournamentElapsed, currentPlayLevel]);

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
  const handleLevelChange = useCallback(() => setLastHandActive(false), []);
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
    if (!settings.voiceEnabled) return;
    for (const move of moves) {
      announceTableMove(move.playerName, move.toTableName, t);
    }
  }, [settings.voiceEnabled, t]);

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
    setAddOnEndLevelIndex(null);
    // Ensure all panels are visible when starting a game
    setCleanView(false);
    setShowPlayerPanel(true);
    setShowSidebar(true);
    setMode('game');
    timer.restart();
    initSpeech();
    if (settings.voiceEnabled) announceTournamentStart(t);
  };

  const switchToSetup = () => {
    cancelSpeech();
    timer.restart();
    setAddOnEndLevelIndex(null);
    setLastHandActive(false);
    setHandForHandActive(false);
    setDisplayMode(false);
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

  return (
    <>
    <PrintView config={config} />
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/30 bg-gray-50/90 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {mode === 'game' && config.name ? `♠ ♥ ${config.name} ♦ ♣` : t('app.title')}
          </h1>
          {mode === 'game' && (
            <span className="text-sm text-gray-400 dark:text-gray-500 font-mono tabular-nums">{clockTime}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <VoiceSwitcher settings={settings} onChange={setSettings} />
          {mode === 'game' && !tournamentFinished && (
            <button
              onClick={() => setDisplayMode(true)}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600/30"
              title={t('display.activate')}
            >
              📺
            </button>
          )}
          <button
            onClick={() => {
              if (mode === 'game') {
                handleExitToSetup();
              } else {
                setMode('game');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'game'
                ? 'bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600/30'
                : 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-900/20'
            }`}
          >
            {mode === 'setup' ? t('app.startGame') : t('app.setup')}
          </button>
          {mode === 'setup' && (
            <>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-all duration-200 border border-gray-200 dark:border-gray-700/30"
              >
                {t('app.templates')}
              </button>
              <button
                onClick={() => setShowLeagues(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-all duration-200 border border-gray-200 dark:border-gray-700/30"
              >
                {t('app.leagues')}
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm transition-all duration-200 border border-gray-200 dark:border-gray-700/30"
              >
                {t('app.history')}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex">
        {mode === 'setup' ? (
          /* Setup Mode */
          <SetupPage
            config={config}
            setConfig={setConfig}
            pendingCheckpoint={pendingCheckpoint}
            onRestoreCheckpoint={restoreFromCheckpoint}
            onDismissCheckpoint={dismissCheckpoint}
            onSwitchToGame={switchToGame}
            startErrors={startErrors}
            theme={theme}
          />
        ) : tournamentFinished && winner ? (
          /* Tournament Finished */
          <Suspense fallback={null}>
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
          </Suspense>
        ) : (
          /* Game Mode */
          <Suspense fallback={null}>
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Player Panel (LEFT) */}
            {showPlayerPanel && config.players.length > 0 && (
              <aside className="w-full md:w-60 lg:w-72 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4 overflow-y-auto max-h-[40vh] sm:max-h-[50vh] md:max-h-none">
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
                  onUpdateStack={updatePlayerStack}
                  onInitStacks={initStacks}
                  onClearStacks={clearStacks}
                  lateRegOpen={lateRegOpen}
                  onAddLatePlayer={addLatePlayer}
                />
              </aside>
            )}

            {/* Timer area (CENTER) with edge toggle buttons */}
            <div className="flex-1 flex flex-col relative">
              {/* Desktop: side toggle buttons */}
              {config.players.length > 0 && (
                <button
                  onClick={() => setShowPlayerPanel((v) => !v)}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-20 items-center justify-center bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-r-lg text-xs transition-all duration-200 border-r border-y border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-300/30 dark:shadow-black/10"
                  title={showPlayerPanel ? t('app.hidePlayers') : t('app.showPlayers')}
                >
                  {showPlayerPanel ? '\u25C0' : '\u25B6'}
                </button>
              )}
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-20 items-center justify-center bg-white dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-l-lg text-xs transition-all duration-200 border-l border-y border-gray-200 dark:border-gray-700/30 shadow-md shadow-gray-300/30 dark:shadow-black/10"
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
                />
              </div>

              {/* Mobile: sidebar toggle buttons */}
              <div className="flex md:hidden justify-center gap-2 px-3 pb-2">
                {config.players.length > 0 && (
                  <button
                    onClick={() => setShowPlayerPanel((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showPlayerPanel
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {showSidebar ? `✓ ${t('app.sidebar')}` : t('app.sidebar')}
                </button>
              </div>
            </div>

            {/* Sidebar (RIGHT) */}
            {showSidebar && (
              <aside className="w-full md:w-60 lg:w-72 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[40vh] sm:max-h-[50vh] md:max-h-none">
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
                    onUpdateTables={handleUpdateTables}
                    onTableMoves={handleTableMoves}
                  />
                )}
                <SettingsPanel
                  settings={settings}
                  onChange={setSettings}
                  onToggleFullscreen={toggleFullscreen}
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
          </Suspense>
        )}
      </main>

      {/* TV Display Mode Overlay */}
      {displayMode && mode === 'game' && !tournamentFinished && (
        <Suspense fallback={null}>
          <DisplayMode
            timerState={timer.timerState}
            levels={config.levels}
            chipConfig={config.chips}
            colorUpMap={colorUpMap}
            tournamentName={config.name}
            activePlayerCount={activePlayerCount}
            totalPlayerCount={config.players.length}
            isBubble={bubbleActive}
            isLastHand={lastHandActive}
            isHandForHand={handForHandActive}
            onExit={() => setDisplayMode(false)}
            players={config.players}
            dealerIndex={config.dealerIndex}
            buyIn={config.buyIn}
            payout={config.payout}
            rebuy={config.rebuy}
            addOn={config.addOn}
            bounty={config.bounty}
            averageStack={averageStack}
            tournamentElapsed={tournamentElapsed}
          />
        </Suspense>
      )}

      {/* Call the Clock Modal */}
      {showCallTheClock && mode === 'game' && (
        <Suspense fallback={null}>
          <CallTheClock
            durationSeconds={settings.callTheClockSeconds}
            soundEnabled={settings.soundEnabled}
            voiceEnabled={settings.voiceEnabled}
            onClose={() => setShowCallTheClock(false)}
          />
        </Suspense>
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
        <LeagueManager onClose={() => setShowLeagues(false)} />
      )}

      {/* Setup Wizard (first-time users) */}
      {showWizard && mode === 'setup' && (
        <SetupWizard
          onComplete={(wizardConfig) => {
            setConfig(wizardConfig);
            setShowWizard(false);
          }}
          onSkip={() => setShowWizard(false)}
        />
      )}

      {/* Shared Result Modal (from QR code) */}
      {sharedResult && (
        <Suspense fallback={null}>
          <SharedResultView result={sharedResult} onClose={() => setSharedResult(null)} />
        </Suspense>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={confirmDialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white/95 dark:bg-gray-900/95 border border-gray-300 dark:border-gray-700/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl shadow-gray-300/40 dark:shadow-black/40 animate-scale-in">
            <h3 id="confirm-title" className="text-lg font-bold text-gray-900 dark:text-white">{confirmAction.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{confirmAction.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-gray-100/80 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700/40"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-red-900/40 border border-red-700/30 active:scale-[0.97]"
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
    </>
  );
}

export default App;
