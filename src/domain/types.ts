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

export interface ChipConfig {
  enabled: boolean;
  denominations: ChipDenomination[];
}

export interface TournamentConfig {
  name: string;
  levels: Level[];
  anteEnabled: boolean;
  players: Player[];
  payout: PayoutConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  bounty: BountyConfig;
  chips: ChipConfig;
  buyIn: number;
  startingChips: number;
}

export interface Settings {
  soundEnabled: boolean;
  countdownEnabled: boolean;
  autoAdvance: boolean;
  largeDisplay: boolean;
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
