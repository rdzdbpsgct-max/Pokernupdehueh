import type {
  Level,
  TournamentConfig,
  TimerState,
  Settings,
  Player,
  PayoutConfig,
  RebuyConfig,
  BountyConfig,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
export function generateId(): string {
  return `lvl_${Date.now()}_${idCounter++}`;
}

let playerIdCounter = 0;
export function generatePlayerId(): string {
  return `player_${Date.now()}_${playerIdCounter++}`;
}

// ---------------------------------------------------------------------------
// Spinner rounding helper
// ---------------------------------------------------------------------------

/**
 * Rounds a spinner input value to the nearest `step` boundary based on direction.
 * When the user clicks the spinner arrow, the raw value changes by `step`.
 * This helper snaps it to a clean multiple so e.g. 1500 + 1000 → 2000 (not 2500).
 */
export function snapSpinnerValue(raw: number, prev: number, step: number, min = 1): number {
  const diff = raw - prev;
  const absDiff = Math.abs(diff);
  let val: number;
  if (absDiff > 0 && absDiff <= step) {
    // Spinner arrow click: snap to nearest step boundary
    val = diff > 0
      ? Math.ceil(raw / step) * step
      : Math.floor(raw / step) * step;
  } else {
    // Direct keyboard input: accept as-is
    val = raw;
  }
  return Math.max(min, val);
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Drift-free remaining computation
// ---------------------------------------------------------------------------

export function computeRemaining(
  startedAt: number,
  remainingAtStart: number,
  now: number,
): number {
  const elapsed = (now - startedAt) / 1000;
  return Math.max(0, remainingAtStart - elapsed);
}

// ---------------------------------------------------------------------------
// Level navigation
// ---------------------------------------------------------------------------

export function advanceLevel(
  state: TimerState,
  levels: Level[],
): TimerState {
  const nextIndex = state.currentLevelIndex + 1;
  if (nextIndex >= levels.length) {
    return {
      ...state,
      status: 'stopped',
      remainingSeconds: 0,
      startedAt: null,
      remainingAtStart: null,
    };
  }
  return {
    currentLevelIndex: nextIndex,
    remainingSeconds: levels[nextIndex].durationSeconds,
    status: 'stopped',
    startedAt: null,
    remainingAtStart: null,
  };
}

export function previousLevel(
  state: TimerState,
  levels: Level[],
): TimerState {
  const prevIndex = Math.max(0, state.currentLevelIndex - 1);
  return {
    currentLevelIndex: prevIndex,
    remainingSeconds: levels[prevIndex].durationSeconds,
    status: 'stopped',
    startedAt: null,
    remainingAtStart: null,
  };
}

export function resetCurrentLevel(
  state: TimerState,
  levels: Level[],
): TimerState {
  return {
    ...state,
    remainingSeconds: levels[state.currentLevelIndex].durationSeconds,
    status: 'stopped',
    startedAt: null,
    remainingAtStart: null,
  };
}

export function restartTournament(levels: Level[]): TimerState {
  return {
    currentLevelIndex: 0,
    remainingSeconds: levels.length > 0 ? levels[0].durationSeconds : 0,
    status: 'stopped',
    startedAt: null,
    remainingAtStart: null,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  levelIndex: number;
  message: string;
}

export function validateConfig(config: TournamentConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  config.levels.forEach((level, i) => {
    if (level.durationSeconds <= 0) {
      errors.push({ levelIndex: i, message: `Level ${i + 1}: Dauer muss > 0 sein` });
    }
    if (level.type === 'level') {
      if (level.smallBlind == null || level.bigBlind == null) {
        errors.push({ levelIndex: i, message: `Level ${i + 1}: SB und BB müssen gesetzt sein` });
      } else if (level.bigBlind <= level.smallBlind) {
        errors.push({ levelIndex: i, message: `Level ${i + 1}: BB muss > SB sein` });
      }
    }
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function defaultPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generatePlayerId(),
    name: `Spieler ${i + 1}`,
    rebuys: 0,
    status: 'active' as const,
    placement: null,
    eliminatedBy: null,
    knockouts: 0,
  }));
}

// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------

export function defaultPayoutConfig(): PayoutConfig {
  return {
    mode: 'percent',
    entries: [
      { place: 1, value: 50 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
    ],
  };
}

export function defaultPayoutForPlayerCount(playerCount: number): PayoutConfig {
  let entries: { place: number; value: number }[];

  if (playerCount <= 2) {
    entries = [{ place: 1, value: 100 }];
  } else if (playerCount <= 3) {
    entries = [
      { place: 1, value: 65 },
      { place: 2, value: 35 },
    ];
  } else if (playerCount <= 4) {
    entries = [
      { place: 1, value: 60 },
      { place: 2, value: 40 },
    ];
  } else if (playerCount <= 10) {
    entries = [
      { place: 1, value: 50 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
    ];
  } else if (playerCount <= 15) {
    entries = [
      { place: 1, value: 40 },
      { place: 2, value: 25 },
      { place: 3, value: 20 },
      { place: 4, value: 15 },
    ];
  } else {
    entries = [
      { place: 1, value: 35 },
      { place: 2, value: 25 },
      { place: 3, value: 18 },
      { place: 4, value: 13 },
      { place: 5, value: 9 },
    ];
  }

  return { mode: 'percent', entries };
}

export function validatePayoutConfig(payout: PayoutConfig, maxPlaces?: number): string[] {
  const errors: string[] = [];

  if (payout.entries.length === 0) {
    errors.push('Mindestens ein Auszahlungsplatz erforderlich');
    return errors;
  }

  if (maxPlaces !== undefined && payout.entries.length > maxPlaces) {
    errors.push(
      `Maximal ${maxPlaces} Auszahlungsplätze möglich (Anzahl Spieler: ${maxPlaces})`,
    );
  }

  payout.entries.forEach((entry) => {
    if (entry.value < 0) {
      errors.push(`Platz ${entry.place}: Wert darf nicht negativ sein`);
    }
  });

  if (payout.mode === 'percent') {
    const sum = payout.entries.reduce((s, e) => s + e.value, 0);
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`Prozente müssen 100% ergeben (aktuell: ${Math.round(sum)}%)`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Rebuy
// ---------------------------------------------------------------------------

export function defaultRebuyConfig(buyIn = 10, startingChips = 20000): RebuyConfig {
  return {
    enabled: false,
    limitType: 'levels',
    levelLimit: 4,
    timeLimit: 3600,
    rebuyCost: buyIn,
    rebuyChips: startingChips,
  };
}

export function isRebuyActive(
  rebuy: RebuyConfig,
  currentLevelIndex: number,
  levels: Level[],
  elapsedSeconds: number,
): boolean {
  if (!rebuy.enabled) return false;

  if (rebuy.limitType === 'levels') {
    const playLevelNumber = levels
      .slice(0, currentLevelIndex + 1)
      .filter((l) => l.type === 'level').length;
    return playLevelNumber <= rebuy.levelLimit;
  }

  return elapsedSeconds < rebuy.timeLimit;
}

export function computeTournamentElapsedSeconds(
  levels: Level[],
  currentLevelIndex: number,
  remainingSeconds: number,
): number {
  let elapsed = 0;
  for (let i = 0; i < currentLevelIndex; i++) {
    elapsed += levels[i].durationSeconds;
  }
  if (currentLevelIndex < levels.length) {
    elapsed += levels[currentLevelIndex].durationSeconds - remainingSeconds;
  }
  return Math.max(0, elapsed);
}

// ---------------------------------------------------------------------------
// Bounty
// ---------------------------------------------------------------------------

export function defaultBountyConfig(): BountyConfig {
  return { enabled: false, amount: 5 };
}

export function computeNextPlacement(players: Player[]): number {
  return players.filter((p) => p.status === 'active').length;
}

// ---------------------------------------------------------------------------
// Prize Pool & Payouts
// ---------------------------------------------------------------------------

export function computeTotalRebuys(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.rebuys, 0);
}

export function computePrizePool(players: Player[], buyIn: number, rebuyCost?: number): number {
  const totalRebuys = computeTotalRebuys(players);
  const costPerRebuy = rebuyCost ?? buyIn;
  return (players.length * buyIn) + (totalRebuys * costPerRebuy);
}

export function computePayouts(
  payout: PayoutConfig,
  prizePool: number,
): { place: number; amount: number }[] {
  return payout.entries.map((entry) => ({
    place: entry.place,
    amount:
      payout.mode === 'percent'
        ? Math.round((entry.value / 100) * prizePool * 100) / 100
        : entry.value,
  }));
}

// ---------------------------------------------------------------------------
// Ante helpers
// ---------------------------------------------------------------------------

export function stripAnteFromLevels(levels: Level[]): Level[] {
  return levels.map((level) =>
    level.type === 'level' ? { ...level, ante: 0 } : level,
  );
}

/**
 * Compute a standard ante value based on the big blind.
 * Typical poker tournament ante ≈ 10-12.5% of BB, rounded to a "nice" value.
 */
export function computeDefaultAnte(bigBlind: number): number {
  if (bigBlind <= 0) return 0;
  const raw = Math.round(bigBlind * 0.125); // 12.5% of BB
  if (raw <= 0) return 0;

  // Round to nearest "nice" value
  if (raw <= 5) return raw;
  if (raw <= 10) return Math.round(raw / 5) * 5;
  if (raw <= 50) return Math.round(raw / 5) * 5;
  if (raw <= 100) return Math.round(raw / 25) * 25;
  if (raw <= 500) return Math.round(raw / 50) * 50;
  return Math.round(raw / 100) * 100;
}

/**
 * Apply standard ante values to all play levels based on their big blind.
 */
export function applyDefaultAntes(levels: Level[]): Level[] {
  return levels.map((level) => {
    if (level.type !== 'level') return level;
    const ante = computeDefaultAnte(level.bigBlind ?? 0);
    return { ...level, ante };
  });
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export function createPreset(name: 'turbo' | 'standard' | 'deep'): TournamentConfig {
  const base = {
    anteEnabled: false,
    players: [] as Player[],
    payout: defaultPayoutConfig(),
    rebuy: defaultRebuyConfig(10, 20000),
    bounty: defaultBountyConfig(),
    buyIn: 10,
    startingChips: 20000,
  };

  const presets: Record<string, TournamentConfig> = {
    turbo: {
      ...base,
      name: 'Turbo Tournament',
      levels: [
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 25, bigBlind: 50, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 50, bigBlind: 100, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 75, bigBlind: 150, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 300, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 100, bigBlind: 200, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 150, bigBlind: 300, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 200, bigBlind: 400, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 300, bigBlind: 600, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 300, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 400, bigBlind: 800, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 500, bigBlind: 1000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 750, bigBlind: 1500, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 360, smallBlind: 1000, bigBlind: 2000, ante: 0 },
      ],
    },
    standard: {
      ...base,
      name: 'Standard Tournament',
      levels: [
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 25, bigBlind: 50, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 75, bigBlind: 150, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 600, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 150, bigBlind: 300, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 200, bigBlind: 400, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 300, bigBlind: 600, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 400, bigBlind: 800, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 600, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 500, bigBlind: 1000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 750, bigBlind: 1500, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 1000, bigBlind: 2000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 1500, bigBlind: 3000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 900, smallBlind: 2000, bigBlind: 4000, ante: 0 },
      ],
    },
    deep: {
      ...base,
      name: 'Deep Stack Tournament',
      levels: [
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 25, bigBlind: 50, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 50, bigBlind: 100, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 75, bigBlind: 150, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 100, bigBlind: 200, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 125, bigBlind: 250, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 900, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 150, bigBlind: 300, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 200, bigBlind: 400, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 250, bigBlind: 500, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 300, bigBlind: 600, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 400, bigBlind: 800, ante: 0 },
        { id: generateId(), type: 'break', durationSeconds: 900, label: 'Pause' },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 500, bigBlind: 1000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 750, bigBlind: 1500, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 1000, bigBlind: 2000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 1500, bigBlind: 3000, ante: 0 },
        { id: generateId(), type: 'level', durationSeconds: 1200, smallBlind: 2000, bigBlind: 4000, ante: 0 },
      ],
    },
  };
  return presets[name];
}

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

export function defaultSettings(): Settings {
  return {
    soundEnabled: true,
    countdownEnabled: true,
    autoAdvance: true,
    largeDisplay: true,
  };
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const CONFIG_KEY = 'poker-timer-config';
const SETTINGS_KEY = 'poker-timer-settings';

export function saveConfig(config: TournamentConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/** Shared parser: normalizes a raw parsed object into a TournamentConfig. */
function parseConfigObject(parsed: Record<string, unknown>): TournamentConfig | null {
  if (!parsed || !Array.isArray(parsed.levels)) return null;
  const buyIn = typeof parsed.buyIn === 'number' ? parsed.buyIn : 10;
  const startingChips = typeof parsed.startingChips === 'number' ? parsed.startingChips : 20000;
  const rebuyRaw = parsed.rebuy as Record<string, unknown> | undefined;
  const rebuy: RebuyConfig = rebuyRaw
    ? {
        ...defaultRebuyConfig(buyIn, startingChips),
        ...(rebuyRaw as Partial<RebuyConfig>),
        rebuyCost: typeof rebuyRaw.rebuyCost === 'number' ? rebuyRaw.rebuyCost : buyIn,
        rebuyChips: typeof rebuyRaw.rebuyChips === 'number' ? rebuyRaw.rebuyChips : startingChips,
      }
    : defaultRebuyConfig(buyIn, startingChips);
  return {
    name: typeof parsed.name === 'string' ? parsed.name : 'Tournament',
    levels: parsed.levels as Level[],
    anteEnabled: (parsed.anteEnabled as boolean) ?? false,
    players: Array.isArray(parsed.players)
      ? ((parsed.players as Record<string, unknown>[]).map((p) => ({
          ...p,
          rebuys: typeof p.rebuys === 'number' ? p.rebuys : 0,
          status: p.status === 'eliminated' ? 'eliminated' : 'active',
          placement: typeof p.placement === 'number' ? p.placement : null,
          eliminatedBy: typeof p.eliminatedBy === 'string' ? p.eliminatedBy : null,
          knockouts: typeof p.knockouts === 'number' ? p.knockouts : 0,
        })) as Player[])
      : ([] as Player[]),
    payout: (parsed.payout as PayoutConfig) ?? defaultPayoutConfig(),
    rebuy,
    bounty: (parsed.bounty as BountyConfig) ?? defaultBountyConfig(),
    buyIn,
    startingChips,
  };
}

export function loadConfig(): TournamentConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return parseConfigObject(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): Settings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Settings;
  } catch {
    return null;
  }
}

export function exportConfigJSON(config: TournamentConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importConfigJSON(json: string): TournamentConfig | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed.name !== 'string') return null;
    return parseConfigObject(parsed);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Level label helpers
// ---------------------------------------------------------------------------

export function getLevelLabel(level: Level, index: number, levels: Level[]): string {
  if (level.type === 'break') {
    return level.label || 'Pause';
  }
  const playLevels = levels.slice(0, index + 1).filter(l => l.type === 'level');
  return `Level ${playLevels.length}`;
}

export function getBlindsText(level: Level): string {
  if (level.type === 'break') return '';
  const parts = [`${level.smallBlind ?? 0} / ${level.bigBlind ?? 0}`];
  if (level.ante && level.ante > 0) {
    parts.push(`Ante ${level.ante}`);
  }
  return parts.join(' - ');
}
