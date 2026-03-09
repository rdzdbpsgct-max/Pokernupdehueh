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
  /** Number of re-entries this player has used */
  reEntryCount?: number;
  /** Original player ID when this is a re-entry instance */
  originalPlayerId?: string;
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
  /** When true, eliminated players can re-enter the tournament with a fresh buy-in */
  reEntryEnabled?: boolean;
  /** Maximum number of re-entries per player (undefined = unlimited) */
  maxReEntries?: number;
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

export type AccentColor = 'emerald' | 'blue' | 'purple' | 'red' | 'amber' | 'cyan';

export type BackgroundImage = 'none' | 'felt-green' | 'felt-blue' | 'felt-red' | 'casino' | 'dark-wood' | 'abstract' | 'midnight' | 'sunset';

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
  /** Background image/pattern. Default: 'none'. */
  backgroundImage?: BackgroundImage;
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
  /** Cost per rebuy in EUR (fallback: buyIn for old results) */
  rebuyCost?: number;
  /** Cost per add-on in EUR (fallback: buyIn for old results) */
  addOnCost?: number;
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

export interface Season {
  id: string;
  name: string;           // e.g. "Saison 2025/26"
  startDate: string;      // ISO date
  endDate?: string;       // ISO date, undefined = ongoing
}

export type TiebreakerCriterion = 'avgPlace' | 'wins' | 'headToHead' | 'lastResult' | 'cashes';

export interface TiebreakerConfig {
  /** Ordered list of tiebreaker criteria applied when points are equal */
  criteria: TiebreakerCriterion[];
}

export interface LeagueCorrection {
  id: string;
  playerName: string;
  /** Positive = bonus, negative = penalty */
  points: number;
  reason: string;
  date: string; // ISO date
}

export interface League {
  id: string;
  name: string;
  pointSystem: PointSystem;
  createdAt: string; // ISO timestamp
  /** Optional tournament defaults stored with this league */
  defaultConfig?: Partial<TournamentConfig>;
  /** League seasons for grouping game days */
  seasons?: Season[];
  /** Currently active season ID */
  activeSeasonId?: string;
  /** Tiebreaker configuration for equal points */
  tiebreaker?: TiebreakerConfig;
  /** Manual point corrections (bonus/penalty) */
  corrections?: LeagueCorrection[];
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

export interface ExtendedLeagueStanding extends LeagueStanding {
  totalCost: number;
  totalPayout: number;
  netBalance: number;
  /** Participation rate 0–1 (gameDays attended / total gameDays) */
  participationRate: number;
  knockouts: number;
  /** Sum of manual point corrections */
  corrections: number;
  /** 1-based rank in standings */
  rank: number;
}

export interface GameDayParticipant {
  name: string;
  place: number;
  points: number;
  buyIn: number;
  rebuys: number;
  addOnCost: number;
  payout: number;
  /** payout - buyIn - rebuyCost - addOnCost */
  netBalance: number;
  /** When true, this player is a guest and may be excluded from overall standings */
  isGuest?: boolean;
  /** Optional link to RegisteredPlayer for stable identity */
  registeredPlayerId?: string;
}

export interface GameDay {
  id: string;
  leagueId: string;
  seasonId?: string;
  date: string;           // ISO date
  label?: string;         // e.g. "Spieltag 5"
  /** Link to the automatically saved TournamentResult */
  tournamentResultId?: string;
  participants: GameDayParticipant[];
  totalPrizePool: number;
  totalBuyIns: number;
  /** totalBuyIns - totalPrizePool (cash balance for this game day) */
  cashBalance: number;
  notes?: string;
  venue?: string;
}

export type TableStatus = 'active' | 'dissolved';

export interface Seat {
  /** 1-based seat number */
  seatNumber: number;
  /** Player ID occupying this seat, or null if empty */
  playerId: string | null;
  /** When true, this seat cannot be assigned to players during distribution/balancing */
  locked?: boolean;
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

export interface SidePot {
  /** Pot amount in chips */
  amount: number;
  /** Number of players eligible for this pot */
  eligiblePlayers: number;
  /** Display label: "Main Pot" or "Side Pot 1", etc. */
  label: string;
}

// ---------------------------------------------------------------------------
// Side-Pot Calculator (advanced)
// ---------------------------------------------------------------------------

export type PlayerPotStatus = 'active' | 'all-in' | 'folded';

export interface PlayerPotInput {
  id: string;
  name: string;
  invested: number;
  status: PlayerPotStatus;
}

export interface PotResult {
  type: 'main' | 'side';
  /** 0-based index: 0 = main pot, 1 = side pot 1, etc. */
  index: number;
  amount: number;
  /** IDs of players eligible to win this pot */
  eligiblePlayerIds: string[];
  /** Names of players eligible to win this pot */
  eligiblePlayerNames: string[];
}

export interface SidePotCalculationResult {
  pots: PotResult[];
  total: number;
  warnings: string[];
}

/** Winner assignment for a single pot */
export interface PotWinnerAssignment {
  potIndex: number;
  /** IDs of the winner(s) — multiple = split pot */
  winnerIds: string[];
}

/** Payout for a single player after resolving all pots */
export interface PlayerPayout {
  playerId: string;
  playerName: string;
  /** Total amount invested in the hand */
  invested: number;
  /** Total payout received from all pots */
  payout: number;
  /** Net result: payout - invested */
  net: number;
  /** Breakdown per pot: pot index → amount won from that pot */
  perPot: { potIndex: number; amount: number }[];
}

/** Result of resolving winners for all pots */
export interface SidePotPayoutResult {
  payouts: PlayerPayout[];
  /** Odd chips that couldn't be evenly split (remainder per pot) */
  oddChips: { potIndex: number; remainder: number; awardedTo: string }[];
  total: number;
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
