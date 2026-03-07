import type {
  Level,
  TournamentConfig,
  TournamentCheckpoint,
  TournamentResult,
  PlayerResult,
  AnteMode,
  TimerState,
  Settings,
  Player,
  PayoutConfig,
  RebuyConfig,
  AddOnConfig,
  BountyConfig,
  ChipConfig,
  ChipDenomination,
  ColorUpEntry,
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

export function formatElapsedTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

/**
 * Advances the dealer button to the next active player (skipping eliminated ones).
 */
export function advanceDealer(players: Player[], currentDealerIndex: number): number {
  const n = players.length;
  if (n === 0) return 0;
  for (let i = 1; i <= n; i++) {
    const candidate = (currentDealerIndex + i) % n;
    if (players[candidate].status === 'active') return candidate;
  }
  return currentDealerIndex;
}

// ---------------------------------------------------------------------------
// Blind Structure Summary
// ---------------------------------------------------------------------------

export function computeBlindStructureSummary(levels: Level[]): {
  levelCount: number;
  breakCount: number;
  avgMinutes: number;
} {
  const playLevels = levels.filter((l) => l.type === 'level');
  const breaks = levels.filter((l) => l.type === 'break');
  const avgMinutes =
    playLevels.length > 0
      ? Math.round(
          playLevels.reduce((s, l) => s + l.durationSeconds, 0) /
            playLevels.length /
            60,
        )
      : 0;
  return { levelCount: playLevels.length, breakCount: breaks.length, avgMinutes };
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
    50, 100, 150, 200, 400, 600, 800, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000,
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
  anteMode?: AnteMode;
  /** Smallest chip denomination — when provided, all blind values snap to its multiples. */
  smallestChip?: number;
}

/**
 * Round a value to the nearest multiple of the smallest chip denomination.
 * Falls back to roundToNice() when no chip constraint is given.
 */
export function roundToChipMultiple(value: number, smallestChip: number): number {
  if (value <= 0 || smallestChip <= 0) return 0;
  return Math.max(smallestChip, Math.round(value / smallestChip) * smallestChip);
}

/**
 * Check whether all blind values in a level array are compatible with the given
 * chip denominations, i.e. every SB/BB/Ante is a multiple of the smallest chip.
 * Returns list of incompatible blind values (empty = all compatible).
 */
export function checkBlindChipCompatibility(
  levels: Level[],
  denominations: ChipDenomination[],
): number[] {
  if (denominations.length === 0) return [];
  const smallest = Math.min(...denominations.map((d) => d.value));
  if (smallest <= 0) return [];

  const bad = new Set<number>();
  for (const level of levels) {
    if (level.type !== 'level') continue;
    if (level.smallBlind != null && level.smallBlind % smallest !== 0) bad.add(level.smallBlind);
    if (level.bigBlind != null && level.bigBlind % smallest !== 0) bad.add(level.bigBlind);
    if (level.ante != null && level.ante > 0 && level.ante % smallest !== 0) bad.add(level.ante);
  }
  return [...bad].sort((a, b) => a - b);
}

/**
 * Generate a complete blind structure based on starting chips and speed.
 * Each speed has its own BB progression (not just different durations).
 * Values are scaled from a 20k reference stack and rounded to nice poker numbers.
 * When smallestChip is provided, all values snap to chip multiples.
 */
export function generateBlindStructure(params: GenerateBlindParams): Level[] {
  const { startingChips, speed, anteEnabled, anteMode = 'standard', smallestChip } = params;
  const cfg = SPEED_CONFIGS[speed];
  const scale = startingChips / REFERENCE_STACKS;
  const round = smallestChip != null && smallestChip > 0
    ? (v: number) => roundToChipMultiple(v, smallestChip)
    : roundToNice;

  const playLevels: Level[] = [];
  let lastBB = 0;

  for (const refBB of BB_SEQUENCES[speed]) {
    const rawBB = round(refBB * scale);
    if (rawBB <= lastBB) continue; // skip duplicates after rounding
    const sb = round(rawBB / 2);
    const bb = sb * 2; // ensure BB is always exactly double SB
    if (sb >= bb) continue; // safety: SB must be < BB
    const rawAnte = anteEnabled ? computeDefaultAnte(bb, anteMode) : 0;
    const ante = rawAnte > 0 && smallestChip ? round(rawAnte) : rawAnte;

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
        label: moduleT('logic.defaultBreakLabel'),
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
  smallestChip?: number,
  anteMode?: AnteMode,
): DurationEstimate[] {
  const speeds: BlindSpeed[] = ['fast', 'normal', 'slow'];
  return speeds.map((speed) => {
    const allLevels = generateBlindStructure({ startingChips, speed, anteEnabled, anteMode, smallestChip });
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

/** Check if a specific player can still rebuy (considering per-player cap) */
export function canPlayerRebuy(player: Player, rebuy: RebuyConfig): boolean {
  if (rebuy.maxRebuysPerPlayer === undefined) return true;
  return player.rebuys < rebuy.maxRebuysPerPlayer;
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

export function computeEstimatedRemainingSeconds(
  levels: Level[],
  currentLevelIndex: number,
  remainingSeconds: number,
): number {
  let remaining = remainingSeconds;
  for (let i = currentLevelIndex + 1; i < levels.length; i++) {
    remaining += levels[i].durationSeconds;
  }
  return Math.max(0, remaining);
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
  { hex: '#92400E', de: 'Braun', en: 'Brown' },
  { hex: '#06B6D4', de: 'Cyan', en: 'Cyan' },
  { hex: '#B91C1C', de: 'Dunkelrot', en: 'Dark Red' },
  { hex: '#14532D', de: 'Dunkelgrün', en: 'Dark Green' },
  { hex: '#1E3A5F', de: 'Dunkelblau', en: 'Dark Blue' },
  { hex: '#F5F5DC', de: 'Beige', en: 'Beige' },
  { hex: '#D4AF37', de: 'Gold', en: 'Gold' },
  { hex: '#C0C0C0', de: 'Silber', en: 'Silver' },
  { hex: '#7C3AED', de: 'Violett', en: 'Violet' },
  { hex: '#0EA5E9', de: 'Hellblau', en: 'Light Blue' },
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
    colorUpEnabled: true,
    denominations: preset.denominations.map((d) => ({
      ...d,
      id: generateChipId(),
    })),
    colorUpSchedule: [],
  };
}

export function defaultChipConfig(): ChipConfig {
  const preset = applyChipPreset(chipPresets[1]); // 5-color preset, disabled by default
  return { ...preset, enabled: false };
}

/**
 * Check whether a denomination is needed to represent any of the given values.
 * A denomination can only be removed (color-up) when ALL future blind values
 * are multiples of the next-higher active denomination. This matches real
 * tournament practice: you remove the smallest active chip when all future
 * values are "clean" multiples of the next size up.
 */
function isDenominationNeeded(
  denomValue: number,
  allDenoms: ChipDenomination[],
  values: number[],
): boolean {
  // Find the next higher denomination in the active set
  const higherValues = allDenoms
    .map((d) => d.value)
    .filter((v) => v > denomValue)
    .sort((a, b) => a - b);

  // Highest denomination is always needed (nothing to replace it)
  if (higherValues.length === 0) return true;

  const nextHigher = higherValues[0];

  // Denomination is needed if any future value cannot be represented
  // purely with the next-higher denomination (i.e. is not a multiple of it)
  for (const val of values) {
    if (val <= 0) continue;
    if (val % nextHigher !== 0) return true;
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
        // Shift color-up to the next break after this level
        const firstBreak = findNextBreak(levels, levelIdx);
        // For realism: skip one more break to keep chips in play longer.
        // In real tournaments, chips stay on the table a bit longer than
        // the mathematically earliest possible removal point.
        const secondBreak = firstBreak !== null ? findNextBreak(levels, firstBreak + 1) : null;
        const targetIdx = secondBreak ?? firstBreak ?? levelIdx;
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

/**
 * Generate a color-up suggestion by converting the auto-computed map to a flat schedule.
 */
export function generateColorUpSuggestion(
  levels: Level[],
  denominations: ChipDenomination[],
): ColorUpEntry[] {
  const map = computeColorUps(levels, denominations);
  const entries: ColorUpEntry[] = [];
  for (const [levelIndex, denoms] of map) {
    for (const d of denoms) {
      entries.push({ levelIndex, denomId: d.id });
    }
  }
  return entries.sort((a, b) => a.levelIndex - b.levelIndex);
}

/**
 * Convert a stored color-up schedule to the Map format used for display/game mode.
 * Filters out entries referencing non-existent denominations.
 */
export function scheduleToColorUpMap(
  schedule: ColorUpEntry[],
  denominations: ChipDenomination[],
): Map<number, ChipDenomination[]> {
  const denomMap = new Map(denominations.map((d) => [d.id, d]));
  const result = new Map<number, ChipDenomination[]>();
  for (const entry of schedule) {
    const denom = denomMap.get(entry.denomId);
    if (!denom) continue;
    const existing = result.get(entry.levelIndex) ?? [];
    existing.push(denom);
    result.set(entry.levelIndex, existing);
  }
  return result;
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

export function computeAverageStackInBB(averageStack: number, currentBigBlind: number): number {
  if (currentBigBlind <= 0) return 0;
  return Math.round((averageStack / currentBigBlind) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Per-player stack tracking
// ---------------------------------------------------------------------------

export function initializePlayerStacks(
  players: Player[],
  startingChips: number,
  rebuyChips: number,
  addOnChips: number,
): Player[] {
  return players.map((p) => ({
    ...p,
    chips: p.status === 'active'
      ? startingChips + p.rebuys * rebuyChips + (p.addOn ? addOnChips : 0)
      : 0,
  }));
}

export function findChipLeader(players: Player[]): string | null {
  const withChips = players.filter((p) => p.status === 'active' && p.chips !== undefined && p.chips > 0);
  if (withChips.length === 0) return null;
  return withChips.reduce((leader, p) => (p.chips! > (leader.chips ?? 0) ? p : leader)).id;
}

export function computeAverageStackFromPlayers(players: Player[]): number | null {
  const active = players.filter((p) => p.status === 'active');
  if (active.length === 0) return null;
  const tracked = active.filter((p) => p.chips !== undefined);
  if (tracked.length === 0) return null;
  const total = tracked.reduce((sum, p) => sum + (p.chips ?? 0), 0);
  return Math.round(total / active.length);
}

export function addRebuyToStack(player: Player, rebuyChips: number): Player {
  if (player.chips === undefined) return player;
  return { ...player, chips: player.chips + rebuyChips };
}

export function addAddOnToStack(player: Player, addOnChips: number): Player {
  if (player.chips === undefined) return player;
  return { ...player, chips: player.chips + addOnChips };
}

// ---------------------------------------------------------------------------
// Bubble detection
// ---------------------------------------------------------------------------

export function isBubble(activePlayers: number, paidPlaces: number): boolean {
  if (paidPlaces <= 0 || activePlayers <= 1) return false;
  return activePlayers === paidPlaces + 1;
}

export function isInTheMoney(activePlayers: number, paidPlaces: number): boolean {
  if (paidPlaces <= 0 || activePlayers <= 1) return false;
  return activePlayers <= paidPlaces;
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
export function computeDefaultAnte(bigBlind: number, anteMode: AnteMode = 'standard'): number {
  if (bigBlind <= 0) return 0;

  // Big Blind Ante: ante equals the big blind
  if (anteMode === 'bigBlindAnte') return bigBlind;

  // Standard: ~12.5% of BB, rounded to nice values
  const raw = Math.round(bigBlind * 0.125);
  if (raw <= 0) return 0;

  if (raw <= 5) return raw;
  if (raw <= 10) return Math.round(raw / 5) * 5;
  if (raw <= 50) return Math.round(raw / 5) * 5;
  if (raw <= 100) return Math.round(raw / 25) * 25;
  if (raw <= 500) return Math.round(raw / 50) * 50;
  return Math.round(raw / 100) * 100;
}

/**
 * Apply ante values to all play levels based on their big blind and ante mode.
 */
export function applyDefaultAntes(levels: Level[], anteMode: AnteMode = 'standard'): Level[] {
  return levels.map((level) => {
    if (level.type !== 'level') return level;
    const ante = computeDefaultAnte(level.bigBlind ?? 0, anteMode);
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
    anteMode: 'standard',
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
    voiceEnabled: true,
  };
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const CONFIG_KEY = 'poker-timer-config';
const SETTINGS_KEY = 'poker-timer-settings';

export function saveConfig(config: TournamentConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable (e.g. private browsing, quota exceeded)
  }
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
    anteMode: (parsed.anteMode === 'bigBlindAnte' ? 'bigBlindAnte' : 'standard'),
    players: Array.isArray(parsed.players)
      ? ((parsed.players as Record<string, unknown>[]).map((p) => ({
          ...p,
          rebuys: typeof p.rebuys === 'number' ? p.rebuys : 0,
          addOn: typeof p.addOn === 'boolean' ? p.addOn : false,
          status: p.status === 'eliminated' ? 'eliminated' : 'active',
          placement: typeof p.placement === 'number' ? p.placement : null,
          eliminatedBy: typeof p.eliminatedBy === 'string' ? p.eliminatedBy : null,
          knockouts: typeof p.knockouts === 'number' ? p.knockouts : 0,
          chips: typeof p.chips === 'number' ? p.chips : undefined,
        })) as Player[])
      : ([] as Player[]),
    dealerIndex: typeof parsed.dealerIndex === 'number' ? parsed.dealerIndex : 0,
    payout: (parsed.payout as PayoutConfig) ?? defaultPayoutConfig(),
    rebuy,
    addOn,
    bounty: (parsed.bounty as BountyConfig) ?? defaultBountyConfig(),
    chips: parsed.chips
      ? {
          ...defaultChipConfig(),
          ...(parsed.chips as ChipConfig),
          colorUpEnabled: typeof (parsed.chips as Record<string, unknown>).colorUpEnabled === 'boolean'
            ? (parsed.chips as ChipConfig).colorUpEnabled
            : true,
          colorUpSchedule: Array.isArray((parsed.chips as Record<string, unknown>).colorUpSchedule)
            ? (parsed.chips as ChipConfig).colorUpSchedule
            : [],
        }
      : defaultChipConfig(),
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
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (e.g. private browsing, quota exceeded)
  }
}

export function loadSettings(): Settings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings(), ...parsed } as Settings;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tournament Checkpoint (auto-save / restore)
// ---------------------------------------------------------------------------

const CHECKPOINT_KEY = 'poker-timer-checkpoint';

export function saveCheckpoint(checkpoint: TournamentCheckpoint): void {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
  } catch { /* private browsing or quota exceeded */ }
}

export function loadCheckpoint(): TournamentCheckpoint | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return null;
    const levels = parsed.config?.levels;
    if (!Array.isArray(levels) || levels.length === 0) return null;
    // Clamp to valid ranges
    parsed.timer.currentLevelIndex = Math.max(0, Math.min(
      parsed.timer.currentLevelIndex, levels.length - 1,
    ));
    parsed.timer.remainingSeconds = Math.max(0, parsed.timer.remainingSeconds);
    return parsed as TournamentCheckpoint;
  } catch {
    return null;
  }
}

export function clearCheckpoint(): void {
  try { localStorage.removeItem(CHECKPOINT_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Tournament History (persistent results)
// ---------------------------------------------------------------------------

const HISTORY_KEY = 'poker-timer-history';
const MAX_HISTORY = 50;

export function buildTournamentResult(
  config: TournamentConfig,
  elapsedSeconds: number,
  levelsPlayed: number,
): TournamentResult {
  const prizePool = computePrizePool(
    config.players, config.buyIn,
    config.rebuy.enabled ? config.rebuy.rebuyCost : undefined,
    config.addOn.enabled ? config.addOn.cost : undefined,
  );
  const payouts = computePayouts(config.payout, prizePool);
  const payoutMap = new Map(payouts.map((p) => [p.place, p.amount]));

  const sorted = [...config.players].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    if (a.placement != null && b.placement != null) return a.placement - b.placement;
    return 0;
  });

  const players: PlayerResult[] = sorted.map((p, i) => {
    const place = p.status === 'active' ? 1 : (p.placement ?? i + 1);
    const payout = payoutMap.get(place) ?? 0;
    const totalCost = config.buyIn
      + p.rebuys * (config.rebuy.enabled ? config.rebuy.rebuyCost : config.buyIn)
      + (p.addOn ? (config.addOn.enabled ? config.addOn.cost : config.buyIn) : 0);
    const bountyEarned = config.bounty.enabled ? p.knockouts * config.bounty.amount : 0;
    return {
      name: p.name,
      place,
      payout,
      rebuys: p.rebuys,
      addOn: p.addOn,
      knockouts: p.knockouts,
      bountyEarned,
      netBalance: payout + bountyEarned - totalCost,
    };
  });

  return {
    id: crypto.randomUUID(),
    name: config.name,
    date: new Date().toISOString(),
    playerCount: config.players.length,
    buyIn: config.buyIn,
    prizePool,
    players,
    bountyEnabled: config.bounty.enabled,
    bountyAmount: config.bounty.amount,
    rebuyEnabled: config.rebuy.enabled,
    totalRebuys: computeTotalRebuys(config.players),
    addOnEnabled: config.addOn.enabled,
    totalAddOns: computeTotalAddOns(config.players),
    elapsedSeconds,
    levelsPlayed,
  };
}

export function saveTournamentResult(result: TournamentResult): void {
  try {
    const history = loadTournamentHistory();
    history.unshift(result);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* private browsing or quota exceeded */ }
}

export function loadTournamentHistory(): TournamentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TournamentResult[];
  } catch {
    return [];
  }
}

export function deleteTournamentResult(id: string): void {
  try {
    const history = loadTournamentHistory();
    const filtered = history.filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

export function clearTournamentHistory(): void {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Tournament Result — Text & CSV Export
// ---------------------------------------------------------------------------

const PLACE_EMOJI = ['🏆', '🥈', '🥉'];

export function formatResultAsText(result: TournamentResult, locale: string = 'de-DE'): string {
  const isEn = locale.startsWith('en');
  const lines: string[] = [];
  lines.push(`♠♥ ${result.name || 'Poker Tournament'} ♦♣`);
  lines.push(new Date(result.date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }));
  lines.push('');
  for (const p of result.players) {
    const emoji = PLACE_EMOJI[p.place - 1] ?? `${p.place}.`;
    const payoutStr = p.payout > 0 ? ` → ${p.payout.toFixed(2)} €` : '';
    lines.push(`${emoji} ${p.name}${payoutStr}`);
  }
  lines.push('');
  const playersLabel = isEn ? 'Players' : 'Spieler';
  lines.push(`Prizepool: ${result.prizePool.toFixed(2)} € | ${result.playerCount} ${playersLabel}`);
  if (result.totalRebuys > 0) lines.push(`Rebuys: ${result.totalRebuys}`);
  return lines.join('\n');
}

export function formatResultAsCSV(result: TournamentResult): string {
  const header = 'Place,Name,Payout,Rebuys,AddOn,Knockouts,NetBalance';
  const rows = result.players.map((p) =>
    [p.place, `"${p.name}"`, p.payout.toFixed(2), p.rebuys, p.addOn ? 1 : 0, p.knockouts, p.netBalance.toFixed(2)].join(','),
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Player Statistics (cross-tournament aggregation)
// ---------------------------------------------------------------------------

export function computePlayerStats(history: TournamentResult[]): import('./types').PlayerStat[] {
  const map = new Map<string, import('./types').PlayerStat>();

  for (const tournament of history) {
    for (const p of tournament.players) {
      const key = p.name.toLowerCase().trim();
      let stat = map.get(key);
      if (!stat) {
        stat = {
          name: p.name,
          tournaments: 0,
          wins: 0,
          cashes: 0,
          totalPayout: 0,
          totalCost: 0,
          netBalance: 0,
          avgPlace: 0,
          bestPlace: Infinity,
          knockouts: 0,
        };
        map.set(key, stat);
      }
      stat.tournaments++;
      if (p.place === 1) stat.wins++;
      if (p.payout > 0) stat.cashes++;
      stat.totalPayout += p.payout + p.bountyEarned;
      stat.totalCost += p.payout + p.bountyEarned - p.netBalance; // totalCost = payout + bounty - netBalance
      stat.netBalance += p.netBalance;
      stat.avgPlace += p.place;
      if (p.place < stat.bestPlace) stat.bestPlace = p.place;
      stat.knockouts += p.knockouts;
    }
  }

  const stats = [...map.values()];
  for (const s of stats) {
    s.avgPlace = Math.round((s.avgPlace / s.tournaments) * 10) / 10;
    if (s.bestPlace === Infinity) s.bestPlace = 0;
  }
  stats.sort((a, b) => b.netBalance - a.netBalance);
  return stats;
}

// ---------------------------------------------------------------------------
// QR Code Encoding / Decoding (compact tournament result sharing)
// ---------------------------------------------------------------------------

export function decodeResultFromQR(encoded: string): TournamentResult | null {
  try {
    const parts = encoded.split('|');
    if (parts.length < 11) return null;

    const name = parts[0];
    const date = parts[1];
    const playerCount = Number(parts[2]);
    const buyIn = Number(parts[3]);
    const prizePool = Number(parts[4]);
    const bountyAmount = Number(parts[5]);
    const totalRebuys = Number(parts[6]);
    const totalAddOns = Number(parts[7]);
    const elapsedMinutes = Number(parts[8]);
    const levelsPlayed = Number(parts[9]);
    const playersRaw = parts.slice(10).join('|');

    if (!name || isNaN(playerCount)) return null;

    const players: PlayerResult[] = playersRaw.split(';').filter(Boolean).map(entry => {
      const [pName, place, payout, rebuys, addOn, knockouts] = entry.split(':');
      const rebuyCount = Number(rebuys) || 0;
      const hasAddOn = Number(addOn) === 1;
      const totalCost = buyIn + rebuyCount * buyIn + (hasAddOn ? buyIn : 0);
      const bountyEarned = bountyAmount > 0 ? (Number(knockouts) || 0) * bountyAmount : 0;
      return {
        name: pName,
        place: Number(place),
        payout: Number(payout) || 0,
        rebuys: rebuyCount,
        addOn: hasAddOn,
        knockouts: Number(knockouts) || 0,
        bountyEarned,
        netBalance: (Number(payout) || 0) + bountyEarned - totalCost,
      };
    });

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name,
      date: new Date(date).toISOString(),
      playerCount,
      buyIn,
      prizePool,
      players,
      bountyEnabled: bountyAmount > 0,
      bountyAmount,
      rebuyEnabled: totalRebuys > 0,
      totalRebuys,
      addOnEnabled: totalAddOns > 0,
      totalAddOns,
      elapsedSeconds: elapsedMinutes * 60,
      levelsPlayed,
    };
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
// Tournament Templates
// ---------------------------------------------------------------------------

export interface TournamentTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: TournamentConfig;
}

const TEMPLATES_KEY = 'poker-timer-templates';

export function loadTemplates(): TournamentTemplate[] {
  const raw = localStorage.getItem(TEMPLATES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t: unknown) =>
        t !== null &&
        typeof t === 'object' &&
        typeof (t as Record<string, unknown>).id === 'string' &&
        typeof (t as Record<string, unknown>).name === 'string',
    ) as TournamentTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, config: TournamentConfig): TournamentTemplate {
  const templates = loadTemplates();
  const template: TournamentTemplate = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    config,
  };
  templates.push(template);
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // localStorage unavailable
  }
  return template;
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates().filter((t) => t.id !== id);
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Serialize a tournament config to JSON for file export.
 */
export function exportTemplateToJSON(name: string, config: TournamentConfig): string {
  return JSON.stringify({ name, createdAt: new Date().toISOString(), config }, null, 2);
}

/**
 * Parse a JSON string from a template file.
 * Accepts two formats:
 * 1. Template format: { name, config: { levels, ... } }
 * 2. Direct config format: { name, levels: [...], ... }
 * Returns the parsed name + config, or null if invalid.
 */
export function parseTemplateFile(json: string): { name: string; config: TournamentConfig } | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;

    // Template format: { name, config: { ... } }
    if (
      parsed.config &&
      typeof parsed.config === 'object' &&
      Array.isArray((parsed.config as Record<string, unknown>).levels)
    ) {
      const config = parseConfigObject(parsed.config as Record<string, unknown>);
      if (!config) return null;
      const name = typeof parsed.name === 'string' ? parsed.name : config.name;
      return { name, config };
    }

    // Direct config format: { name, levels: [...], ... }
    if (Array.isArray(parsed.levels)) {
      const config = parseConfigObject(parsed as Record<string, unknown>);
      if (!config) return null;
      return { name: config.name, config };
    }

    return null;
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
