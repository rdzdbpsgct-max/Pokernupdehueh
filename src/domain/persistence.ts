import type {
  TournamentConfig,
  TournamentCheckpoint,
  TournamentResult,
  RegisteredPlayer,
  Settings,
  Player,
  Level,
  RebuyConfig,
  AddOnConfig,
  BountyConfig,
  ChipConfig,
  PayoutConfig,
  LateRegistrationConfig,
  League,
  PointSystem,
  Table,
  Seat,
  MultiTableConfig,
  GameDay,
} from './types';
import { generateBlindStructure } from './blinds';
import { defaultChipConfig } from './chips';
import { defaultPayoutConfig } from './tournament';
import { defaultLateRegistrationConfig } from './validation';
import { defaultMultiTableConfig } from './tables';
import { loadGameDaysForLeague, saveGameDay } from './league';

// ---------------------------------------------------------------------------
// Default Configs
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

export function defaultAddOnConfig(buyIn = 10, startingChips = 20000): AddOnConfig {
  return {
    enabled: false,
    cost: buyIn,
    chips: startingChips,
  };
}

export function defaultBountyConfig(): BountyConfig {
  return { enabled: false, amount: 5, type: 'fixed' };
}

export function defaultSettings(): Settings {
  return {
    soundEnabled: true,
    countdownEnabled: true,
    autoAdvance: true,
    largeDisplay: true,
    voiceEnabled: true,
    volume: 100,
    callTheClockSeconds: 30,
  };
}

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
// Tournament Presets (Quick Start)
// ---------------------------------------------------------------------------

export interface TournamentPreset {
  id: string;
  nameKey: string;
  descKey: string;
  config: Partial<TournamentConfig>;
}

/**
 * Return 3 built-in tournament presets for quick start.
 * Each provides a complete tournament config (minus per-tournament fields).
 */
export function getBuiltInPresets(): TournamentPreset[] {
  return [
    {
      id: 'turbo',
      nameKey: 'preset.turbo',
      descKey: 'preset.turboDesc',
      config: {
        name: '',
        buyIn: 5,
        startingChips: 10000,
        anteEnabled: false,
        anteMode: 'standard',
        levels: generateBlindStructure({ startingChips: 10000, speed: 'fast', anteEnabled: false }),
        payout: defaultPayoutConfig(),
        rebuy: defaultRebuyConfig(5, 10000),
        addOn: defaultAddOnConfig(5, 10000),
        bounty: defaultBountyConfig(),
        chips: defaultChipConfig(),
      },
    },
    {
      id: 'standard',
      nameKey: 'preset.standard',
      descKey: 'preset.standardDesc',
      config: {
        name: '',
        buyIn: 10,
        startingChips: 20000,
        anteEnabled: false,
        anteMode: 'standard',
        levels: generateBlindStructure({ startingChips: 20000, speed: 'normal', anteEnabled: false }),
        payout: defaultPayoutConfig(),
        rebuy: { ...defaultRebuyConfig(10, 20000), enabled: true },
        addOn: defaultAddOnConfig(10, 20000),
        bounty: defaultBountyConfig(),
        chips: defaultChipConfig(),
      },
    },
    {
      id: 'deepstack',
      nameKey: 'preset.deepStack',
      descKey: 'preset.deepStackDesc',
      config: {
        name: '',
        buyIn: 20,
        startingChips: 40000,
        anteEnabled: true,
        anteMode: 'standard',
        levels: generateBlindStructure({ startingChips: 40000, speed: 'slow', anteEnabled: true }),
        payout: defaultPayoutConfig(),
        rebuy: { ...defaultRebuyConfig(20, 40000), enabled: true },
        addOn: defaultAddOnConfig(20, 40000),
        bounty: defaultBountyConfig(),
        chips: defaultChipConfig(),
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Config Parsing
// ---------------------------------------------------------------------------

/** Shared parser: normalizes a raw parsed object into a TournamentConfig. */
export function parseConfigObject(parsed: Record<string, unknown>): TournamentConfig | null {
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
  // Validate individual level objects — filter out malformed entries
  const rawLevels = parsed.levels as Record<string, unknown>[];
  const validatedLevels = rawLevels.filter((l) =>
    l &&
    typeof l === 'object' &&
    typeof l.id === 'string' &&
    typeof l.durationSeconds === 'number' &&
    l.durationSeconds > 0 &&
    (l.type === 'level' || l.type === 'break'),
  ) as unknown as Level[];

  return {
    name: typeof parsed.name === 'string' ? parsed.name : 'Tournament',
    levels: validatedLevels,
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
    bounty: parsed.bounty
      ? {
          ...defaultBountyConfig(),
          ...(parsed.bounty as Partial<BountyConfig>),
          type: (parsed.bounty as Record<string, unknown>).type === 'mystery' ? 'mystery' : 'fixed',
          mysteryPool: Array.isArray((parsed.bounty as Record<string, unknown>).mysteryPool)
            ? (parsed.bounty as BountyConfig).mysteryPool
            : undefined,
        }
      : defaultBountyConfig(),
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
    lateRegistration: parsed.lateRegistration
      ? { ...defaultLateRegistrationConfig(), ...(parsed.lateRegistration as Partial<LateRegistrationConfig>) }
      : undefined,
    leagueId: typeof parsed.leagueId === 'string' ? parsed.leagueId : undefined,
    multiTable: parsed.multiTable
      ? { ...defaultMultiTableConfig(), ...(parsed.multiTable as Partial<MultiTableConfig>) }
      : undefined,
    tables: Array.isArray(parsed.tables)
      ? (parsed.tables as Record<string, unknown>[])
          .filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string')
          .map((t) => migrateTable(t))
      : undefined,
  };
}

/**
 * Migrate a table from old format (playerIds: string[], seats: number)
 * to new format (seats: Seat[], maxSeats: number, status, dealerSeat).
 */
function migrateTable(raw: Record<string, unknown>): Table {
  // New format: seats is an array of Seat objects
  if (
    Array.isArray(raw.seats) &&
    raw.seats.length > 0 &&
    typeof (raw.seats[0] as Record<string, unknown>)?.seatNumber === 'number'
  ) {
    return {
      id: raw.id as string,
      name: raw.name as string,
      maxSeats: typeof raw.maxSeats === 'number' ? raw.maxSeats : (raw.seats as Seat[]).length,
      seats: raw.seats as Seat[],
      status: raw.status === 'dissolved' ? 'dissolved' : 'active',
      dealerSeat: typeof raw.dealerSeat === 'number' ? raw.dealerSeat : null,
    };
  }

  // Old format: seats is a number, playerIds is a string array
  const maxSeats = typeof raw.seats === 'number' ? raw.seats : 10;
  const playerIds = Array.isArray(raw.playerIds) ? raw.playerIds as string[] : [];
  const seats: Seat[] = Array.from({ length: maxSeats }, (_, i) => ({
    seatNumber: i + 1,
    playerId: playerIds[i] ?? null,
  }));

  return {
    id: raw.id as string,
    name: raw.name as string,
    maxSeats,
    seats,
    status: 'active',
    dealerSeat: null,
  };
}

// ---------------------------------------------------------------------------
// Config Persistence
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
    // Validate config through parseConfigObject for safety
    const config = parsed.config ? parseConfigObject(parsed.config) : null;
    if (!config) return null;
    const timer = parsed.timer;
    if (!timer || typeof timer.currentLevelIndex !== 'number' || typeof timer.remainingSeconds !== 'number') return null;
    // Clamp to valid ranges
    timer.currentLevelIndex = Math.max(0, Math.min(
      timer.currentLevelIndex, config.levels.length - 1,
    ));
    timer.remainingSeconds = Math.max(0, timer.remainingSeconds);
    return { ...parsed, config, timer } as TournamentCheckpoint;
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
const MAX_HISTORY = 200;

export function saveTournamentResult(result: TournamentResult): void {
  try {
    const history = loadTournamentHistory();
    history.unshift(result);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* private browsing or quota exceeded */ }

  // Auto-save player names to persistent database
  syncPlayersToDatabase(result.players.map((p) => p.name));
}

function isValidTournamentResult(item: unknown): item is TournamentResult {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.date === 'string' && Array.isArray(r.players);
}

export function loadTournamentHistory(): TournamentResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTournamentResult);
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
// Config JSON Import / Export
// ---------------------------------------------------------------------------

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
// Leagues
// ---------------------------------------------------------------------------

const LEAGUES_KEY = 'poker-timer-leagues';

export function defaultPointSystem(): PointSystem {
  return {
    entries: [
      { place: 1, points: 10 },
      { place: 2, points: 7 },
      { place: 3, points: 5 },
      { place: 4, points: 4 },
      { place: 5, points: 3 },
      { place: 6, points: 2 },
      { place: 7, points: 1 },
    ],
  };
}

function isValidLeague(item: unknown): item is League {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.createdAt === 'string' && r.pointSystem != null;
}

export function loadLeagues(): League[] {
  try {
    const raw = localStorage.getItem(LEAGUES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidLeague);
  } catch {
    return [];
  }
}

/** Upsert a league: update existing by id, or append if new. */
export function saveLeague(league: League): League {
  const leagues = loadLeagues();
  const idx = leagues.findIndex((l) => l.id === league.id);
  if (idx >= 0) {
    leagues[idx] = league;
  } else {
    leagues.push(league);
  }
  try {
    localStorage.setItem(LEAGUES_KEY, JSON.stringify(leagues));
  } catch { /* private browsing or quota exceeded */ }
  return league;
}

export function deleteLeague(id: string): void {
  const leagues = loadLeagues().filter((l) => l.id !== id);
  try {
    localStorage.setItem(LEAGUES_KEY, JSON.stringify(leagues));
  } catch { /* ignore */ }
}

/**
 * Extract league-relevant config fields from a TournamentConfig.
 * Strips per-tournament data (players, dealerIndex, tables, leagueId)
 * so only structural settings (blinds, buy-in, payout, rebuy, etc.) remain.
 */
export function extractLeagueConfig(config: TournamentConfig): Partial<TournamentConfig> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { players: _p, dealerIndex: _d, tables: _t, leagueId: _l, ...leagueConfig } = config;
  return leagueConfig;
}

// ---------------------------------------------------------------------------
// League Export / Import
// ---------------------------------------------------------------------------

export interface LeagueExport {
  version: 1 | 2;
  league: League;
  results: TournamentResult[];
  gameDays?: GameDay[];
  exportedAt: string;
}

export function exportLeagueToJSON(league: League): string {
  const history = loadTournamentHistory();
  const results = history.filter((r) => r.leagueId === league.id);
  const gameDays = loadGameDaysForLeague(league.id);
  const payload: LeagueExport = {
    version: 2,
    league,
    results,
    gameDays: gameDays.length > 0 ? gameDays : undefined,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseLeagueFile(json: string): LeagueExport | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.league || typeof parsed.league.id !== 'string' || typeof parsed.league.name !== 'string') return null;
    if (!Array.isArray(parsed.results)) return null;
    // Normalize defaultConfig if present (backward compat)
    if (parsed.league.defaultConfig && typeof parsed.league.defaultConfig === 'object') {
      const normalized = parseConfigObject(parsed.league.defaultConfig as Record<string, unknown>);
      if (normalized) {
        parsed.league.defaultConfig = extractLeagueConfig(normalized);
      } else {
        delete parsed.league.defaultConfig;
      }
    }
    // Backward compat: v1 files have no gameDays field
    if (!parsed.gameDays) parsed.gameDays = [];
    return parsed as LeagueExport;
  } catch {
    return null;
  }
}

export function importLeague(data: LeagueExport): League {
  // Generate new ID to avoid collisions
  const newLeagueId = `league_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const league: League = {
    ...data.league,
    id: newLeagueId,
  };
  saveLeague(league);

  // Import linked tournament results with updated leagueId
  for (const result of data.results) {
    saveTournamentResult({ ...result, leagueId: newLeagueId });
  }

  // v2: Import game days with updated leagueId
  if (data.gameDays && data.gameDays.length > 0) {
    for (const gd of data.gameDays) {
      saveGameDay({
        ...gd,
        id: `gd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        leagueId: newLeagueId,
      });
    }
  }

  return league;
}

// ---------------------------------------------------------------------------
// Setup Wizard
// ---------------------------------------------------------------------------

export const WIZARD_KEY = 'poker-timer-wizard-completed';

export function isWizardCompleted(): boolean {
  try {
    return localStorage.getItem(WIZARD_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markWizardCompleted(): void {
  try {
    localStorage.setItem(WIZARD_KEY, 'true');
  } catch { /* private browsing */ }
}

// ---------------------------------------------------------------------------
// Persistent Player Database
// ---------------------------------------------------------------------------

const PLAYERS_KEY = 'poker-timer-players';

function isValidRegisteredPlayer(item: unknown): item is RegisteredPlayer {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.name === 'string' && typeof r.createdAt === 'string';
}

export function loadPlayerDatabase(): RegisteredPlayer[] {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRegisteredPlayer);
  } catch {
    return [];
  }
}

export function savePlayerDatabase(players: RegisteredPlayer[]): void {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch { /* private browsing or quota exceeded */ }
}

export function addRegisteredPlayer(name: string): RegisteredPlayer {
  const db = loadPlayerDatabase();
  const normalized = name.trim();
  // Check for duplicate (case-insensitive)
  const existing = db.find((p) => p.name.toLowerCase() === normalized.toLowerCase());
  if (existing) {
    existing.lastPlayedAt = new Date().toISOString();
    savePlayerDatabase(db);
    return existing;
  }
  const player: RegisteredPlayer = {
    id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: normalized,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  };
  db.push(player);
  savePlayerDatabase(db);
  return player;
}

export function deleteRegisteredPlayer(id: string): void {
  const db = loadPlayerDatabase().filter((p) => p.id !== id);
  savePlayerDatabase(db);
}

/**
 * Import player names from tournament history into the player database.
 * Deduplicates by normalized (lowercased) name.
 */
export function importPlayersFromHistory(): number {
  const history = loadTournamentHistory();
  const db = loadPlayerDatabase();
  const existingNames = new Set(db.map((p) => p.name.toLowerCase()));
  let added = 0;
  const now = new Date().toISOString();

  for (const result of history) {
    for (const player of result.players) {
      const normalized = player.name.trim();
      if (!normalized) continue;
      if (existingNames.has(normalized.toLowerCase())) continue;
      existingNames.add(normalized.toLowerCase());
      db.push({
        id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${added}`,
        name: normalized,
        createdAt: now,
        lastPlayedAt: result.date,
      });
      added++;
    }
  }

  if (added > 0) savePlayerDatabase(db);
  return added;
}

/**
 * Sync player names from a finished tournament into the player database.
 * Updates lastPlayedAt for existing players, adds new ones.
 */
export function syncPlayersToDatabase(playerNames: string[]): void {
  const db = loadPlayerDatabase();
  const nameMap = new Map(db.map((p) => [p.name.toLowerCase(), p]));
  const now = new Date().toISOString();
  let changed = false;

  for (const name of playerNames) {
    const normalized = name.trim();
    if (!normalized) continue;
    const existing = nameMap.get(normalized.toLowerCase());
    if (existing) {
      existing.lastPlayedAt = now;
      changed = true;
    } else {
      const player: RegisteredPlayer = {
        id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: normalized,
        createdAt: now,
        lastPlayedAt: now,
      };
      db.push(player);
      nameMap.set(normalized.toLowerCase(), player);
      changed = true;
    }
  }

  if (changed) savePlayerDatabase(db);
}
