import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { TournamentConfig, Settings, TournamentCheckpoint } from './domain/types';
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
  initializePlayerStacks,
  scheduleToColorUpMap,
  checkBlindChipCompatibility,
  isBubble,
  isInTheMoney,
  computeBlindStructureSummary,
  advanceDealer,
  buildTournamentResult,
  saveTournamentResult,
  decodeResultFromQR,
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
} from './domain/speech';
// Setup-mode components (static imports — used immediately on load)
import { ConfigEditor } from './components/ConfigEditor';
import { PlayerManager } from './components/PlayerManager';
import { PayoutEditor } from './components/PayoutEditor';
import { RebuyEditor } from './components/RebuyEditor';
import { AddOnEditor } from './components/AddOnEditor';
import { BountyEditor } from './components/BountyEditor';
import { ChipEditor } from './components/ChipEditor';
import { BlindGenerator } from './components/BlindGenerator';
import { TemplateManager } from './components/TemplateManager';
import { TournamentHistory } from './components/TournamentHistory';
import { CollapsibleSection } from './components/CollapsibleSection';
import { CollapsibleSubSection } from './components/CollapsibleSubSection';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { NumberStepper } from './components/NumberStepper';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { VoiceSwitcher } from './components/VoiceSwitcher';

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
const DisplayMode = lazy(() => import('./components/DisplayMode').then(m => ({ default: m.DisplayMode })));
const SharedResultView = lazy(() => import('./components/SharedResultView').then(m => ({ default: m.SharedResultView })));

type Mode = 'setup' | 'game';

function App() {
  const { t, language } = useTranslation();

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
  }, []);

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
  const eliminatePlayer = useCallback((playerId: string, eliminatedBy: string | null) => {
    setConfig((prev) => {
      const placement = computeNextPlacement(prev.players);
      return {
        ...prev,
        players: prev.players.map((p) => {
          if (p.id === playerId) {
            return { ...p, status: 'eliminated' as const, placement, eliminatedBy, chips: p.chips !== undefined ? 0 : undefined };
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

  // Detect blind values that are incompatible with current chip denominations
  const blindChipConflicts = useMemo(
    () =>
      config.chips.enabled
        ? checkBlindChipCompatibility(config.levels, config.chips.denominations)
        : [],
    [config.chips.enabled, config.chips.denominations, config.levels],
  );

  // Section summaries for collapsed CollapsibleSection cards
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
    return parts.length > 0 ? parts.join(', ') : t('section.allDisabled');
  }, [config.rebuy, config.addOn, config.bounty, t]);

  const playersSummary = useMemo(
    () => t('section.playerCount', { n: config.players.length }),
    [config.players.length, t],
  );

  const blindSummary = useMemo(() => {
    const s = computeBlindStructureSummary(config.levels);
    return t('config.summary', { levels: s.levelCount, breaks: s.breakCount, min: s.avgMinutes });
  }, [config.levels, t]);

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
                      onClick={restoreFromCheckpoint}
                      className="px-4 py-2 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md shadow-emerald-900/30 active:scale-[0.97]"
                    >
                      {t('checkpoint.restore')}
                    </button>
                    <button
                      onClick={dismissCheckpoint}
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
                  onClick={switchToGame}
                  disabled={startErrors.length > 0}
                  className="w-full px-6 py-3 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-emerald-900/30 active:scale-[0.98] active:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-emerald-700 disabled:active:scale-100"
                >
                  {t('app.startTournament')}
                </button>
              </div>
            </div>
          </div>
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
                  {showSidebar ? '✓ Sidebar' : 'Sidebar'}
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
  );
}

export default App;
