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
  /** When true, rebuy money is tracked as a separate pot instead of adding to prize pool */
  separatePot?: boolean;
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
  type: 'fixed' | 'mystery';
  mysteryPool?: number[];
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

export interface MultiTableConfig {
  enabled: boolean;
  /** Default seats per table when creating new tables */
  seatsPerTable: number;
  /** Dissolve a table when its active player count drops to this threshold or below */
  dissolveThreshold: number;
  /** Automatically balance tables after each elimination */
  autoBalanceOnElimination: boolean;
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
  leagueId?: string;
  multiTable?: MultiTableConfig;
  tables?: Table[];
}

export interface Settings {
  soundEnabled: boolean;
  countdownEnabled: boolean;
  autoAdvance: boolean;
  largeDisplay: boolean;
  voiceEnabled: boolean;
  /** Master volume 0–100 (percent). Default: 100. */
  volume: number;
  /** Call-the-Clock countdown duration in seconds. Default: 30. */
  callTheClockSeconds: number;
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

export interface RegisteredPlayer {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
  lastPlayedAt: string; // ISO timestamp
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
  leagueId?: string;
  /** Separate rebuy pot amount (only set when RebuyConfig.separatePot is true) */
  rebuyPot?: number;
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

export interface PointEntry {
  place: number;
  points: number;
}

export interface PointSystem {
  entries: PointEntry[];
}

export interface League {
  id: string;
  name: string;
  pointSystem: PointSystem;
  createdAt: string; // ISO timestamp
}

export interface LeagueStanding {
  name: string;
  points: number;
  tournaments: number;
  wins: number;
  cashes: number;
  avgPlace: number;
  bestPlace: number;
}

export type TableStatus = 'active' | 'dissolved';

export interface Seat {
  /** 1-based seat number */
  seatNumber: number;
  /** Player ID occupying this seat, or null if empty */
  playerId: string | null;
}

export interface Table {
  id: string;
  name: string;
  /** Maximum number of seats at this table */
  maxSeats: number;
  /** Seat assignments (length === maxSeats) */
  seats: Seat[];
  /** Whether this table is active or has been dissolved */
  status: TableStatus;
  /** Seat number of the dealer at this table (null if no dealer) */
  dealerSeat: number | null;
}

export type TableMoveReason = 'balance' | 'dissolution' | 'final-table' | 'late-registration' | 'manual';

export interface TableMove {
  playerId: string;
  playerName: string;
  fromTableId: string;
  fromTableName: string;
  fromSeat: number;
  toTableId: string;
  toTableName: string;
  toSeat: number;
  reason: TableMoveReason;
  /** Epoch ms when the move occurred */
  timestamp: number;
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
