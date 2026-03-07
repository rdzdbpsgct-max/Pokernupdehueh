export interface Level {
  id: string;
  type: 'level' | 'break';
  durationSeconds: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  label?: string;
}

export interface Player {
  id: string;
  name: string;
  rebuys: number;
  addOn: boolean;
  status: 'active' | 'eliminated';
  placement: number | null;
  eliminatedBy: string | null;
  knockouts: number;
  chips?: number;
}

export type PayoutMode = 'percent' | 'euro';

export interface PayoutEntry {
  place: number;
  value: number;
}

export interface PayoutConfig {
  mode: PayoutMode;
  entries: PayoutEntry[];
}

export type RebuyLimitType = 'levels' | 'time';

export interface RebuyConfig {
  enabled: boolean;
  limitType: RebuyLimitType;
  /** When limitType === 'levels': rebuy allowed up to this play-level number */
  levelLimit: number;
  /** When limitType === 'time': rebuy period in seconds */
  timeLimit: number;
  /** Cost per rebuy in EUR (defaults to buyIn) */
  rebuyCost: number;
  /** Chips received per rebuy (defaults to startingChips) */
  rebuyChips: number;
  /** Max rebuys per player (undefined = unlimited) */
  maxRebuysPerPlayer?: number;
}

export interface AddOnConfig {
  enabled: boolean;
  /** Cost per add-on in EUR (defaults to buyIn) */
  cost: number;
  /** Chips received per add-on (defaults to startingChips) */
  chips: number;
}

export interface BountyConfig {
  enabled: boolean;
  amount: number;
}

export interface ChipDenomination {
  id: string;
  value: number;
  color: string;
  label: string;
}

export interface ColorUpEntry {
  levelIndex: number;
  denomId: string;
}

export interface ChipConfig {
  enabled: boolean;
  colorUpEnabled: boolean;
  denominations: ChipDenomination[];
  colorUpSchedule: ColorUpEntry[];
}

export type AnteMode = 'standard' | 'bigBlindAnte';

export interface LateRegistrationConfig {
  enabled: boolean;
  /** Late registration allowed until this play-level number */
  levelLimit: number;
}

export interface TournamentConfig {
  name: string;
  levels: Level[];
  anteEnabled: boolean;
  anteMode: AnteMode;
  players: Player[];
  dealerIndex: number;
  payout: PayoutConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  bounty: BountyConfig;
  chips: ChipConfig;
  buyIn: number;
  startingChips: number;
  lateRegistration?: LateRegistrationConfig;
}

export interface Settings {
  soundEnabled: boolean;
  countdownEnabled: boolean;
  autoAdvance: boolean;
  largeDisplay: boolean;
  voiceEnabled: boolean;
  /** Master volume 0–100 (percent). Default: 100. */
  volume: number;
}

export interface TournamentCheckpoint {
  version: 1;
  config: TournamentConfig;
  settings: Settings;
  timer: {
    currentLevelIndex: number;
    remainingSeconds: number;
  };
  savedAt: string; // ISO timestamp
}

export interface PlayerResult {
  name: string;
  place: number;
  payout: number;
  rebuys: number;
  addOn: boolean;
  knockouts: number;
  bountyEarned: number;
  netBalance: number;
}

export interface TournamentResult {
  id: string;
  name: string;
  date: string; // ISO timestamp
  playerCount: number;
  buyIn: number;
  prizePool: number;
  players: PlayerResult[];
  bountyEnabled: boolean;
  bountyAmount: number;
  rebuyEnabled: boolean;
  totalRebuys: number;
  addOnEnabled: boolean;
  totalAddOns: number;
  elapsedSeconds: number;
  levelsPlayed: number;
}

export interface PlayerStat {
  name: string;
  tournaments: number;
  wins: number;
  cashes: number;
  totalPayout: number;
  totalCost: number;
  netBalance: number;
  avgPlace: number;
  bestPlace: number;
  knockouts: number;
}

export type TimerStatus = 'stopped' | 'running' | 'paused';

export interface TimerState {
  currentLevelIndex: number;
  remainingSeconds: number;
  status: TimerStatus;
  /** Epoch ms when the timer was last started/resumed */
  startedAt: number | null;
  /** Seconds remaining at the moment the timer was last started/resumed */
  remainingAtStart: number | null;
}
