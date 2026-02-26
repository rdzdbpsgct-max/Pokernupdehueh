import type {
  Level,
  TournamentConfig,
  TimerState,
  Settings,
  Player,
  PayoutConfig,
  RebuyConfig,
  AddOnConfig,
  BountyConfig,
  ChipConfig,
  ChipDenomination,
} from './types';
import { t as moduleT } from '../i18n/translations';

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

let chipIdCounter = 0;
export function generateChipId(): string {
  return `chip_${Date.now()}_${chipIdCounter++}`;
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

export function validateConfig(config: TournamentConfig, t = moduleT): ValidationError[] {
  const errors: ValidationError[] = [];

  config.levels.forEach((level, i) => {
    if (level.durationSeconds <= 0) {
      errors.push({ levelIndex: i, message: t('logic.durationMustBePositive', { n: i + 1 }) });
    }
    if (level.type === 'level') {
      if (level.smallBlind == null || level.bigBlind == null) {
        errors.push({ levelIndex: i, message: t('logic.blindsMustBeSet', { n: i + 1 }) });
      } else if (level.bigBlind <= level.smallBlind) {
        errors.push({ levelIndex: i, message: t('logic.bbMustBeGreaterThanSb', { n: i + 1 }) });
      }
    }
  });

  return errors;
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function defaultPlayers(count: number, t = moduleT): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generatePlayerId(),
    name: t('logic.defaultPlayerName', { n: i + 1 }),
    rebuys: 0,
    addOn: false,
    status: 'active' as const,
    placement: null,
    eliminatedBy: null,
    knockouts: 0,
  }));
}

// ---------------------------------------------------------------------------
// Seating
// ---------------------------------------------------------------------------

/**
 * Swaps a player with their neighbour (direction -1 = up, +1 = down).
 * Returns the same array reference if the move is out of bounds.
 */
export function movePlayer(players: Player[], fromIndex: number, direction: -1 | 1): Player[] {
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= players.length) return players;
  const result = [...players];
  [result[fromIndex], result[toIndex]] = [result[toIndex], result[fromIndex]];
  return result;
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array plus a random dealer index.
 */
export function shufflePlayers(players: Player[]): { players: Player[]; dealerIndex: number } {
  const result = [...players];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  const dealerIndex = Math.floor(Math.random() * result.length);
  return { players: result, dealerIndex };
}

// ---------------------------------------------------------------------------
// Blind Structure Generator
// ---------------------------------------------------------------------------

/**
 * Round a value to a "nice" poker-friendly number.
 */
export function roundToNice(value: number): number {
  if (value <= 0) return 0;
  if (value <= 10) return Math.max(1, Math.round(value));
  if (value <= 50) return Math.round(value / 5) * 5;
  if (value <= 200) return Math.round(value / 25) * 25;
  if (value <= 1000) return Math.round(value / 50) * 50;
  if (value <= 5000) return Math.round(value / 100) * 100;
  return Math.round(value / 500) * 500;
}

/**
 * Reference BB sequences for each speed, calibrated for 20 000 starting chips.
 * Fast: aggressive jumps, fewer levels — turbo / multi-deck games.
 * Normal: classic home-tournament progression.
 * Slow: gradual increments, deep play.
 */
const REFERENCE_STACKS = 20000;

const BB_SEQUENCES: Record<string, number[]> = {
  fast: [
    50, 100, 200, 400, 600, 800, 1200, 1600, 2000, 3000, 4000, 6000, 8000, 10000,
  ],
  normal: [
    50, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000,
  ],
  slow: [
    50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000,
  ],
};

export type BlindSpeed = 'fast' | 'normal' | 'slow';

interface SpeedConfig {
  key: BlindSpeed;
  levelDurationSeconds: number;
  breakDurationSeconds: number;
  breakEveryNLevels: number;
}

const SPEED_CONFIGS: Record<BlindSpeed, SpeedConfig> = {
  fast:   { key: 'fast',   levelDurationSeconds: 360,  breakDurationSeconds: 300, breakEveryNLevels: 4 },
  normal: { key: 'normal', levelDurationSeconds: 720,  breakDurationSeconds: 600, breakEveryNLevels: 4 },
  slow:   { key: 'slow',   levelDurationSeconds: 1200, breakDurationSeconds: 600, breakEveryNLevels: 4 },
};

export interface GenerateBlindParams {
  startingChips: number;
  speed: BlindSpeed;
  anteEnabled: boolean;
}

/**
 * Generate a complete blind structure based on starting chips and speed.
 * Each speed has its own BB progression (not just different durations).
 * Values are scaled from a 20k reference stack and rounded to nice poker numbers.
 */
export function generateBlindStructure(params: GenerateBlindParams): Level[] {
  const { startingChips, speed, anteEnabled } = params;
  const cfg = SPEED_CONFIGS[speed];
  const scale = startingChips / REFERENCE_STACKS;

  const playLevels: Level[] = [];
  let lastBB = 0;

  for (const refBB of BB_SEQUENCES[speed]) {
    const bb = roundToNice(refBB * scale);
    if (bb <= lastBB) continue; // skip duplicates after rounding
    const sb = roundToNice(bb / 2);
    if (sb >= bb) continue; // safety: SB must be < BB
    const ante = anteEnabled ? computeDefaultAnte(bb) : 0;

    playLevels.push({
      id: generateId(),
      type: 'level',
      durationSeconds: cfg.levelDurationSeconds,
      smallBlind: sb,
      bigBlind: bb,
      ante,
    });
    lastBB = bb;
  }

  // Insert breaks every N play levels
  const levels: Level[] = [];
  let playCount = 0;
  for (const level of playLevels) {
    if (playCount > 0 && playCount % cfg.breakEveryNLevels === 0) {
      levels.push({
        id: generateId(),
        type: 'break',
        durationSeconds: cfg.breakDurationSeconds,
        label: 'Pause',
      });
    }
    levels.push(level);
    playCount++;
  }

  return levels;
}

/**
 * Estimate total duration of a level array in seconds.
 */
export function estimateDuration(levels: Level[]): number {
  return levels.reduce((sum, l) => sum + l.durationSeconds, 0);
}

/**
 * Estimate how many levels a tournament will realistically play through,
 * based on total chips in play and blind progression.
 * Assumes tournament ends when the short stack at heads-up is ~10 BBs.
 */
export function estimatePlayedLevels(levels: Level[], playerCount: number, startingChips: number): Level[] {
  if (playerCount < 2) return levels;
  const totalChips = startingChips * playerCount;
  // Estimate end: short stack at heads-up ≈ 40% of total chips = ~10 BBs
  const endBB = Math.max(1, totalChips * 0.04);

  const result: Level[] = [];
  for (const level of levels) {
    result.push(level);
    if (level.type === 'level' && level.bigBlind != null && level.bigBlind >= endBB) {
      break;
    }
  }
  return result;
}

export interface DurationEstimate {
  speed: BlindSpeed;
  levels: Level[];
  totalSeconds: number;
}

/**
 * Estimate durations for all 3 speed configs.
 * Uses player count and starting chips to estimate realistic tournament length.
 */
export function estimateAllDurations(
  startingChips: number,
  anteEnabled: boolean,
  playerCount: number,
): DurationEstimate[] {
  const speeds: BlindSpeed[] = ['fast', 'normal', 'slow'];
  return speeds.map((speed) => {
    const allLevels = generateBlindStructure({ startingChips, speed, anteEnabled });
    const playedLevels = playerCount >= 2
      ? estimatePlayedLevels(allLevels, playerCount, startingChips)
      : allLevels;
    return {
      speed,
      levels: allLevels,
      totalSeconds: estimateDuration(playedLevels),
    };
  });
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

export function validatePayoutConfig(payout: PayoutConfig, maxPlaces?: number, t = moduleT): string[] {
  const errors: string[] = [];

  if (payout.entries.length === 0) {
    errors.push(t('logic.minOnePayoutPlace'));
    return errors;
  }

  if (maxPlaces !== undefined && payout.entries.length > maxPlaces) {
    errors.push(t('logic.maxPayoutPlaces', { max: maxPlaces }));
  }

  payout.entries.forEach((entry) => {
    if (entry.value < 0) {
      errors.push(t('logic.valueMustNotBeNegative', { place: entry.place }));
    }
  });

  if (payout.mode === 'percent') {
    const sum = payout.entries.reduce((s, e) => s + e.value, 0);
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(t('logic.percentMustBe100', { sum: Math.round(sum) }));
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
// Add-On
// ---------------------------------------------------------------------------

export function defaultAddOnConfig(buyIn = 10, startingChips = 20000): AddOnConfig {
  return {
    enabled: false,
    cost: buyIn,
    chips: startingChips,
  };
}

export function computeTotalAddOns(players: Player[]): number {
  return players.filter((p) => p.addOn).length;
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
// Chip Denominations & Color-Up
// ---------------------------------------------------------------------------

export const CHIP_COLORS = [
  { hex: '#FFFFFF', de: 'Weiß', en: 'White' },
  { hex: '#EF4444', de: 'Rot', en: 'Red' },
  { hex: '#3B82F6', de: 'Blau', en: 'Blue' },
  { hex: '#22C55E', de: 'Grün', en: 'Green' },
  { hex: '#111827', de: 'Schwarz', en: 'Black' },
  { hex: '#A855F7', de: 'Lila', en: 'Purple' },
  { hex: '#EAB308', de: 'Gelb', en: 'Yellow' },
  { hex: '#F97316', de: 'Orange', en: 'Orange' },
  { hex: '#EC4899', de: 'Pink', en: 'Pink' },
  { hex: '#6B7280', de: 'Grau', en: 'Gray' },
] as const;

export interface ChipPreset {
  key: string;
  denominations: Omit<ChipDenomination, 'id'>[];
}

export const chipPresets: ChipPreset[] = [
  {
    key: '4color',
    denominations: [
      { value: 25, color: '#FFFFFF', label: 'Weiß' },
      { value: 50, color: '#EF4444', label: 'Rot' },
      { value: 100, color: '#22C55E', label: 'Grün' },
      { value: 500, color: '#111827', label: 'Schwarz' },
    ],
  },
  {
    key: '5color',
    denominations: [
      { value: 25, color: '#FFFFFF', label: 'Weiß' },
      { value: 50, color: '#EF4444', label: 'Rot' },
      { value: 100, color: '#3B82F6', label: 'Blau' },
      { value: 500, color: '#22C55E', label: 'Grün' },
      { value: 1000, color: '#111827', label: 'Schwarz' },
    ],
  },
  {
    key: '6color',
    denominations: [
      { value: 25, color: '#FFFFFF', label: 'Weiß' },
      { value: 50, color: '#EF4444', label: 'Rot' },
      { value: 100, color: '#3B82F6', label: 'Blau' },
      { value: 500, color: '#22C55E', label: 'Grün' },
      { value: 1000, color: '#111827', label: 'Schwarz' },
      { value: 5000, color: '#A855F7', label: 'Lila' },
    ],
  },
];

export function applyChipPreset(preset: ChipPreset): ChipConfig {
  return {
    enabled: true,
    denominations: preset.denominations.map((d) => ({
      ...d,
      id: generateChipId(),
    })),
  };
}

export function defaultChipConfig(): ChipConfig {
  return applyChipPreset(chipPresets[1]); // 5-color preset, enabled by default
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function gcdOfArray(arr: number[]): number {
  return arr.reduce((g, val) => gcd(g, val), 0);
}

/**
 * Check whether a denomination is needed to represent any of the given values.
 * A denomination is needed if removing it leaves the remaining denominations
 * unable to represent all values (via GCD check).
 */
function isDenominationNeeded(
  denomValue: number,
  allDenoms: ChipDenomination[],
  values: number[],
): boolean {
  const remaining = allDenoms.filter((d) => d.value !== denomValue);
  if (remaining.length === 0) return true;

  const remainingValues = remaining.map((d) => d.value);
  const smallestRemaining = Math.min(...remainingValues);
  const remainingGcd = gcdOfArray(remainingValues);

  for (const val of values) {
    if (val <= 0) continue;
    if (val < smallestRemaining) return true;
    if (val % remainingGcd !== 0) return true;
  }
  return false;
}

/**
 * Find the next break at or after the given level index.
 * Returns the break's level index, or null if no break follows.
 */
function findNextBreak(levels: Level[], fromIndex: number): number | null {
  for (let i = fromIndex; i < levels.length; i++) {
    if (levels[i].type === 'break') return i;
  }
  return null;
}

/**
 * Compute color-up events for the blind structure.
 * Color-ups are shifted to the next break (pause) after the level where
 * a denomination becomes unnecessary — this matches real tournament practice
 * where chip races happen during breaks.
 * Returns a Map: levelIndex → denominations to remove at that level.
 */
export function computeColorUps(
  levels: Level[],
  denominations: ChipDenomination[],
): Map<number, ChipDenomination[]> {
  const result = new Map<number, ChipDenomination[]>();
  if (denominations.length <= 1) return result;

  const sorted = [...denominations].sort((a, b) => a.value - b.value);
  const removedIds = new Set<string>();

  for (const denom of sorted) {
    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      const futureValues: number[] = [];
      for (let j = levelIdx; j < levels.length; j++) {
        const lvl = levels[j];
        if (lvl.type === 'level') {
          if (lvl.smallBlind) futureValues.push(lvl.smallBlind);
          if (lvl.bigBlind) futureValues.push(lvl.bigBlind);
          if (lvl.ante && lvl.ante > 0) futureValues.push(lvl.ante);
        }
      }

      if (futureValues.length === 0) continue;

      const activeDenoms = sorted.filter(
        (d) => !removedIds.has(d.id) || d.id === denom.id,
      );

      if (!isDenominationNeeded(denom.value, activeDenoms, futureValues)) {
        removedIds.add(denom.id);
        // Shift color-up to the next break, or keep at the level if no break follows
        const breakIdx = findNextBreak(levels, levelIdx);
        const targetIdx = breakIdx ?? levelIdx;
        const existing = result.get(targetIdx) ?? [];
        existing.push(denom);
        result.set(targetIdx, existing);
        break;
      }
    }
  }

  return result;
}

/** Set of denomination IDs removed at or before the given level index. */
export function getRemovedDenomIds(
  colorUpMap: Map<number, ChipDenomination[]>,
  currentLevelIndex: number,
): Set<string> {
  const removed = new Set<string>();
  for (const [levelIdx, denoms] of colorUpMap) {
    if (levelIdx <= currentLevelIndex) {
      for (const d of denoms) removed.add(d.id);
    }
  }
  return removed;
}

/** Next level index with a color-up event (strictly after currentLevelIndex). */
export function getNextColorUpLevel(
  colorUpMap: Map<number, ChipDenomination[]>,
  currentLevelIndex: number,
): number | null {
  let next: number | null = null;
  for (const levelIdx of colorUpMap.keys()) {
    if (levelIdx > currentLevelIndex) {
      if (next === null || levelIdx < next) next = levelIdx;
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Prize Pool & Payouts
// ---------------------------------------------------------------------------

export function computeTotalRebuys(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.rebuys, 0);
}

export function computePrizePool(players: Player[], buyIn: number, rebuyCost?: number, addOnCost?: number): number {
  const totalRebuys = computeTotalRebuys(players);
  const totalAddOns = computeTotalAddOns(players);
  const costPerRebuy = rebuyCost ?? buyIn;
  const costPerAddOn = addOnCost ?? buyIn;
  return (players.length * buyIn) + (totalRebuys * costPerRebuy) + (totalAddOns * costPerAddOn);
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
// Average stack
// ---------------------------------------------------------------------------

export function computeAverageStack(
  players: Player[],
  startingChips: number,
  rebuyChips: number,
  addOnChips: number,
): number {
  const activePlayers = players.filter((p) => p.status === 'active').length;
  if (activePlayers === 0) return 0;
  const totalRebuys = computeTotalRebuys(players);
  const totalAddOns = computeTotalAddOns(players);
  const totalChips =
    players.length * startingChips +
    totalRebuys * rebuyChips +
    totalAddOns * addOnChips;
  return Math.round(totalChips / activePlayers);
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

/**
 * Create a default tournament config with a generated "normal" blind structure.
 */
export function defaultConfig(): TournamentConfig {
  const buyIn = 10;
  const startingChips = 20000;
  return {
    name: '',
    anteEnabled: false,
    levels: generateBlindStructure({ startingChips, speed: 'normal', anteEnabled: false }),
    players: [] as Player[],
    dealerIndex: 0,
    payout: defaultPayoutConfig(),
    rebuy: defaultRebuyConfig(buyIn, startingChips),
    addOn: defaultAddOnConfig(buyIn, startingChips),
    bounty: defaultBountyConfig(),
    chips: defaultChipConfig(),
    buyIn,
    startingChips,
  };
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
  const addOnRaw = parsed.addOn as Record<string, unknown> | undefined;
  const addOn: AddOnConfig = addOnRaw
    ? {
        ...defaultAddOnConfig(buyIn, startingChips),
        ...(addOnRaw as Partial<AddOnConfig>),
        cost: typeof addOnRaw.cost === 'number' ? addOnRaw.cost : buyIn,
        chips: typeof addOnRaw.chips === 'number' ? addOnRaw.chips : startingChips,
      }
    : defaultAddOnConfig(buyIn, startingChips);
  return {
    name: typeof parsed.name === 'string' ? parsed.name : 'Tournament',
    levels: parsed.levels as Level[],
    anteEnabled: (parsed.anteEnabled as boolean) ?? false,
    players: Array.isArray(parsed.players)
      ? ((parsed.players as Record<string, unknown>[]).map((p) => ({
          ...p,
          rebuys: typeof p.rebuys === 'number' ? p.rebuys : 0,
          addOn: typeof p.addOn === 'boolean' ? p.addOn : false,
          status: p.status === 'eliminated' ? 'eliminated' : 'active',
          placement: typeof p.placement === 'number' ? p.placement : null,
          eliminatedBy: typeof p.eliminatedBy === 'string' ? p.eliminatedBy : null,
          knockouts: typeof p.knockouts === 'number' ? p.knockouts : 0,
        })) as Player[])
      : ([] as Player[]),
    dealerIndex: typeof parsed.dealerIndex === 'number' ? parsed.dealerIndex : 0,
    payout: (parsed.payout as PayoutConfig) ?? defaultPayoutConfig(),
    rebuy,
    addOn,
    bounty: (parsed.bounty as BountyConfig) ?? defaultBountyConfig(),
    chips: (parsed.chips as ChipConfig) ?? defaultChipConfig(),
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

export function getLevelLabel(level: Level, index: number, levels: Level[], t = moduleT): string {
  if (level.type === 'break') {
    return level.label || t('logic.defaultBreakLabel');
  }
  const playLevels = levels.slice(0, index + 1).filter(l => l.type === 'level');
  return t('logic.levelN', { n: playLevels.length });
}

export function getBlindsText(level: Level, t = moduleT): string {
  if (level.type === 'break') return '';
  const parts = [`${level.smallBlind ?? 0} / ${level.bigBlind ?? 0}`];
  if (level.ante && level.ante > 0) {
    parts.push(`${t('logic.ante')} ${level.ante}`);
  }
  return parts.join(' - ');
}
