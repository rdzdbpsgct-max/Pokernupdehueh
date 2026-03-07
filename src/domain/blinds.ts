import type { Level, AnteMode } from './types';
import { generateId } from './helpers';
import { t as moduleT } from '../i18n/translations';

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
// Rounding helpers
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
 * Round a value to the nearest multiple of the smallest chip denomination.
 * Falls back to roundToNice() when no chip constraint is given.
 */
export function roundToChipMultiple(value: number, smallestChip: number): number {
  if (value <= 0 || smallestChip <= 0) return 0;
  return Math.max(smallestChip, Math.round(value / smallestChip) * smallestChip);
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
 * Typical poker tournament ante ~ 10-12.5% of BB, rounded to a "nice" value.
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
// Blind Structure Generator
// ---------------------------------------------------------------------------

/**
 * Reference BB sequences for each speed, calibrated for 20 000 starting chips.
 * Fast: aggressive jumps, fewer levels -- turbo / multi-deck games.
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
  /** Smallest chip denomination -- when provided, all blind values snap to its multiples. */
  smallestChip?: number;
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

// ---------------------------------------------------------------------------
// Duration estimates
// ---------------------------------------------------------------------------

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
  // Estimate end: short stack at heads-up ~ 40% of total chips = ~10 BBs
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
