import type {
  TimerState,
  Level,
  ChipConfig,
  ChipDenomination,
  Player,
  PayoutConfig,
  RebuyConfig,
  AddOnConfig,
  BountyConfig,
  Table,
} from './types';

// ---------------------------------------------------------------------------
// Display-State payload — everything the TV window needs to render DisplayMode
// ---------------------------------------------------------------------------

export interface DisplayStatePayload {
  timerState: TimerState;
  levels: Level[];
  chipConfig?: ChipConfig;
  /** Serialized colorUpMap — Map cannot be structured-cloned reliably across browsers */
  colorUpSchedule?: { levelIndex: number; denoms: ChipDenomination[] }[];
  tournamentName: string;
  activePlayerCount: number;
  totalPlayerCount: number;
  isBubble: boolean;
  isLastHand: boolean;
  isHandForHand: boolean;
  players: Player[];
  dealerIndex: number;
  buyIn: number;
  payout: PayoutConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  bounty: BountyConfig;
  averageStack: number;
  tournamentElapsed: number;
  tables?: Table[];
}

// ---------------------------------------------------------------------------
// Message types sent from Admin → TV window
// ---------------------------------------------------------------------------

export type DisplayMessage =
  | { type: 'full-state'; payload: DisplayStatePayload }
  | { type: 'timer-tick'; payload: { remainingSeconds: number; status: string; currentLevelIndex: number } }
  | { type: 'call-the-clock'; payload: { durationSeconds: number; soundEnabled: boolean; voiceEnabled: boolean } }
  | { type: 'call-the-clock-dismiss' }
  | { type: 'close' };

// ---------------------------------------------------------------------------
// Channel helpers
// ---------------------------------------------------------------------------

const CHANNEL_NAME = 'poker-timer-sync';

export function createDisplayChannel(): BroadcastChannel {
  return new BroadcastChannel(CHANNEL_NAME);
}

export function sendDisplayMessage(channel: BroadcastChannel, msg: DisplayMessage): void {
  try {
    channel.postMessage(msg);
  } catch {
    // Channel may be closed
  }
}

// ---------------------------------------------------------------------------
// Serialization helpers for colorUpMap
// ---------------------------------------------------------------------------

export function serializeColorUpMap(
  map: Map<number, ChipDenomination[]> | undefined,
): { levelIndex: number; denoms: ChipDenomination[] }[] | undefined {
  if (!map || map.size === 0) return undefined;
  return Array.from(map.entries()).map(([levelIndex, denoms]) => ({ levelIndex, denoms }));
}

export function deserializeColorUpMap(
  schedule: { levelIndex: number; denoms: ChipDenomination[] }[] | undefined,
): Map<number, ChipDenomination[]> | undefined {
  if (!schedule || schedule.length === 0) return undefined;
  return new Map(schedule.map(({ levelIndex, denoms }) => [levelIndex, denoms]));
}
