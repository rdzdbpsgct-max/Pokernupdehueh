export type AppTier = 'free' | 'premium' | 'pro';

export type AppFeature =
  | 'tvDisplay'
  | 'remoteControl'
  | 'multiTable'
  | 'league'
  | 'sidePot'
  | 'cloudBackup'
  | 'teamRoles'
  | 'multiEvent';

export interface EntitlementState {
  tier: AppTier;
  overrides?: Partial<Record<AppFeature, boolean>>;
}

const STORAGE_KEY = 'poker-timer-entitlements';
const LAST_SEEN_TIER_KEY = 'poker-timer-last-seen-tier';
let memoryEntitlements: EntitlementState | null = null;
let memoryLastSeenTier: AppTier | null = null;

const TIER_RANK: Record<AppTier, number> = {
  free: 0,
  premium: 1,
  pro: 2,
};

const FEATURE_MIN_TIER: Record<AppFeature, AppTier> = {
  tvDisplay: 'premium',
  remoteControl: 'premium',
  multiTable: 'premium',
  league: 'premium',
  sidePot: 'premium',
  cloudBackup: 'pro',
  teamRoles: 'pro',
  multiEvent: 'pro',
};

const ALL_FEATURES = Object.keys(FEATURE_MIN_TIER) as AppFeature[];

function parseTier(value: unknown): AppTier | null {
  if (value === 'free' || value === 'premium' || value === 'pro') {
    return value;
  }
  return null;
}

function readDefaultTierFromEnv(): AppTier {
  const fromEnv = parseTier((import.meta as ImportMeta).env?.VITE_APP_TIER);
  // Default is premium to preserve current behavior until explicit rollout.
  return fromEnv ?? 'premium';
}

export function defaultEntitlements(): EntitlementState {
  return {
    tier: readDefaultTierFromEnv(),
  };
}

export function loadEntitlements(): EntitlementState {
  const fallback = defaultEntitlements();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryEntitlements ?? fallback;
    const parsed = JSON.parse(raw) as Partial<EntitlementState>;
    const tier = parseTier(parsed.tier) ?? fallback.tier;
    const overrides = parsed.overrides ?? undefined;
    const result = { tier, overrides };
    memoryEntitlements = result;
    return result;
  } catch {
    return memoryEntitlements ?? fallback;
  }
}

export function saveEntitlements(state: EntitlementState): void {
  memoryEntitlements = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function isFeatureAvailable(
  feature: AppFeature,
  entitlements: EntitlementState = loadEntitlements(),
): boolean {
  const override = entitlements.overrides?.[feature];
  if (typeof override === 'boolean') return override;
  const requiredTier = FEATURE_MIN_TIER[feature];
  return TIER_RANK[entitlements.tier] >= TIER_RANK[requiredTier];
}

export function getRequiredTier(feature: AppFeature): AppTier {
  return FEATURE_MIN_TIER[feature];
}

export function featuresUnavailableForTier(tier: AppTier): AppFeature[] {
  return ALL_FEATURES.filter((feature) => TIER_RANK[tier] < TIER_RANK[FEATURE_MIN_TIER[feature]]);
}

export function featuresLostOnTierChange(previousTier: AppTier, nextTier: AppTier): AppFeature[] {
  return ALL_FEATURES.filter((feature) =>
    TIER_RANK[previousTier] >= TIER_RANK[FEATURE_MIN_TIER[feature]]
    && TIER_RANK[nextTier] < TIER_RANK[FEATURE_MIN_TIER[feature]],
  );
}

export function featuresGainedOnTierChange(previousTier: AppTier, nextTier: AppTier): AppFeature[] {
  return ALL_FEATURES.filter((feature) =>
    TIER_RANK[previousTier] < TIER_RANK[FEATURE_MIN_TIER[feature]]
    && TIER_RANK[nextTier] >= TIER_RANK[FEATURE_MIN_TIER[feature]],
  );
}

function readLastSeenTier(): AppTier | null {
  if (memoryLastSeenTier) return memoryLastSeenTier;
  try {
    const raw = localStorage.getItem(LAST_SEEN_TIER_KEY);
    const parsed = parseTier(raw);
    memoryLastSeenTier = parsed;
    return parsed;
  } catch {
    return memoryLastSeenTier;
  }
}

function writeLastSeenTier(tier: AppTier): void {
  memoryLastSeenTier = tier;
  try {
    localStorage.setItem(LAST_SEEN_TIER_KEY, tier);
  } catch {
    // ignore storage errors
  }
}

export function consumeTierTransition(currentTier: AppTier): {
  previousTier: AppTier | null;
  downgraded: boolean;
  upgraded: boolean;
  lostFeatures: AppFeature[];
  gainedFeatures: AppFeature[];
} {
  const previousTier = readLastSeenTier();
  writeLastSeenTier(currentTier);

  if (!previousTier) {
    return {
      previousTier: null,
      downgraded: false,
      upgraded: false,
      lostFeatures: [],
      gainedFeatures: [],
    };
  }

  const downgraded = TIER_RANK[currentTier] < TIER_RANK[previousTier];
  const upgraded = TIER_RANK[currentTier] > TIER_RANK[previousTier];
  return {
    previousTier,
    downgraded,
    upgraded,
    lostFeatures: downgraded ? featuresLostOnTierChange(previousTier, currentTier) : [],
    gainedFeatures: upgraded ? featuresGainedOnTierChange(previousTier, currentTier) : [],
  };
}
