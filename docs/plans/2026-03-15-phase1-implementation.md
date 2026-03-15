# Phase 1: Payout, Currency & Quick-Start — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add configurable currency, complete payout calculator with auto-split/templates/live-preview, raise max payout places to 20, and add quick-start flow via preset extension.

**Architecture:** Additive changes on existing domain/logic + component layer. New `payoutTemplates.ts` domain module. Currency type added to `TournamentConfig`, threaded through all display/export surfaces. Preset buttons extended with inline quick-start expandable.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS 4, Vitest

---

### Task 1: Currency Type + TournamentConfig Extension

**Files:**
- Modify: `src/domain/types.ts:31` (after PayoutMode)
- Modify: `src/domain/types.ts:118-137` (TournamentConfig)
- Modify: `src/domain/configPersistence.ts:84-101` (defaultConfig)
- Modify: `src/domain/configPersistence.ts:216-274` (parseConfigObject)
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

In `tests/logic.test.ts`, add at the end of the `parseConfigObject` describe block (~line 500):

```ts
it('should default currency to EUR when field is missing', () => {
  const raw = {
    levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
    buyIn: 10,
    startingChips: 20000,
  };
  const config = parseConfigObject(raw as Record<string, unknown>);
  expect(config?.currency).toBe('EUR');
});

it('should preserve currency when present', () => {
  const raw = {
    levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
    buyIn: 10,
    startingChips: 20000,
    currency: 'USD',
  };
  const config = parseConfigObject(raw as Record<string, unknown>);
  expect(config?.currency).toBe('USD');
});

it('should fallback to EUR for invalid currency', () => {
  const raw = {
    levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
    currency: 'INVALID',
  };
  const config = parseConfigObject(raw as Record<string, unknown>);
  expect(config?.currency).toBe('EUR');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — `currency` property does not exist on TournamentConfig

**Step 3: Write minimal implementation**

In `src/domain/types.ts`, after line 31 (`export type PayoutMode = ...`), add:

```ts
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'SEK';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', SEK: 'kr',
};

const VALID_CURRENCIES: readonly string[] = ['EUR', 'USD', 'GBP', 'CHF', 'SEK'];

export function parseCurrency(value: unknown): Currency {
  if (typeof value === 'string' && VALID_CURRENCIES.includes(value)) return value as Currency;
  return 'EUR';
}
```

In `src/domain/types.ts`, inside `TournamentConfig` interface (after line 130 `buyIn: number;`), add:

```ts
  currency: Currency;
```

In `src/domain/configPersistence.ts`, in `defaultConfig()` (after `buyIn,` line 99), add:

```ts
    currency: 'EUR',
```

In `src/domain/configPersistence.ts`, import `parseCurrency` from `./types`:

```ts
import type { ..., Currency } from './types';
import { parseCurrency } from './types';
```

In `parseConfigObject()`, in the return object (after `startingChips,` ~line 260), add:

```ts
    currency: parseCurrency(parsed.currency),
```

In `getBuiltInPresets()`, add `currency: 'EUR'` to each preset config.

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: PASS

**Step 5: Run full lint + build to ensure no TypeScript errors**

Run: `npm run lint && npm run build`
Expected: Fails — many files reference `TournamentConfig` without `currency`. Fix: add `currency: 'EUR'` anywhere `TournamentConfig` is constructed inline (tests, mocks). The barrel export from `logic.ts` already re-exports `types.ts`.

**Step 6: Fix all compile errors from missing `currency` field**

Search for inline `TournamentConfig` construction in test files and add `currency: 'EUR'`. Check: `grep -rn "TournamentConfig" tests/ | head -30` — update each one.

**Step 7: Run full test suite**

Run: `npm run test -- --run`
Expected: All 1118+ tests pass

**Step 8: Commit**

```bash
git add src/domain/types.ts src/domain/configPersistence.ts tests/logic.test.ts
git commit -m "feat: add Currency type to TournamentConfig with EUR default

Add Currency type (EUR/USD/GBP/CHF/SEK), CURRENCY_SYMBOLS map,
parseCurrency validator. Extend TournamentConfig, defaultConfig,
parseConfigObject with backward-compatible EUR default.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Payout Templates Domain Module

**Files:**
- Create: `src/domain/payoutTemplates.ts`
- Modify: `src/domain/logic.ts` (add barrel export)
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

In `tests/logic.test.ts`, add new describe block:

```ts
describe('payoutTemplates', () => {
  it('PAYOUT_TEMPLATES should have at least 3 templates', () => {
    expect(PAYOUT_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('each template entries should sum to 100%', () => {
    for (const tpl of PAYOUT_TEMPLATES) {
      const sum = tpl.entries.reduce((s, e) => s + e.value, 0);
      expect(sum).toBe(100);
    }
  });

  it('each template should have unique id', () => {
    const ids = PAYOUT_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each template entries should have sequential places starting at 1', () => {
    for (const tpl of PAYOUT_TEMPLATES) {
      tpl.entries.forEach((e, i) => {
        expect(e.place).toBe(i + 1);
      });
    }
  });
});
```

Add `PAYOUT_TEMPLATES` to the imports at the top of the test file.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — `PAYOUT_TEMPLATES` is not exported

**Step 3: Write minimal implementation**

Create `src/domain/payoutTemplates.ts`:

```ts
import type { PayoutEntry } from './types';

export interface PayoutTemplate {
  id: string;
  label: string;
  entries: PayoutEntry[];
}

export const PAYOUT_TEMPLATES: PayoutTemplate[] = [
  {
    id: 'top-heavy',
    label: 'payout.template.topHeavy',
    entries: [
      { place: 1, value: 60 },
      { place: 2, value: 25 },
      { place: 3, value: 15 },
    ],
  },
  {
    id: 'standard',
    label: 'payout.template.standard',
    entries: [
      { place: 1, value: 50 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
    ],
  },
  {
    id: 'flat',
    label: 'payout.template.flat',
    entries: [
      { place: 1, value: 40 },
      { place: 2, value: 30 },
      { place: 3, value: 20 },
      { place: 4, value: 10 },
    ],
  },
  {
    id: 'deep',
    label: 'payout.template.deep',
    entries: [
      { place: 1, value: 35 },
      { place: 2, value: 25 },
      { place: 3, value: 18 },
      { place: 4, value: 13 },
      { place: 5, value: 9 },
    ],
  },
];
```

Add to `src/domain/logic.ts`:

```ts
export * from './payoutTemplates';
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/payoutTemplates.ts src/domain/logic.ts tests/logic.test.ts
git commit -m "feat: add payout templates domain module

4 templates: top-heavy, standard, flat, deep. All sum to 100%.
Exported via logic.ts barrel.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: PayoutEditor — maxPlaces 20, Auto-Split, Templates, Live-Vorschau

**Files:**
- Modify: `src/components/PayoutEditor.tsx` (complete rewrite of component)
- Modify: `src/components/SetupPage.tsx:648-653` (pass new props)
- Test: `tests/components.test.tsx`

**Step 1: Write the failing test**

In `tests/components.test.tsx`, add:

```ts
import { PayoutEditor } from '../src/components/PayoutEditor';

describe('PayoutEditor', () => {
  it('should render up to 20 places', () => {
    const payout = { mode: 'percent' as const, entries: Array.from({ length: 20 }, (_, i) => ({ place: i + 1, value: 5 })) };
    const { container } = render(<PayoutEditor payout={payout} onChange={() => {}} />);
    const placeLabels = container.querySelectorAll('[data-testid="payout-entry"]');
    expect(placeLabels.length).toBe(20);
  });

  it('should show live preview when prizePool is provided in percent mode', () => {
    const payout = { mode: 'percent' as const, entries: [{ place: 1, value: 50 }, { place: 2, value: 30 }, { place: 3, value: 20 }] };
    const { getByText } = render(
      <PayoutEditor payout={payout} onChange={() => {}} prizePool={200} currency="EUR" />
    );
    expect(getByText(/100(.00)?\s*€/)).toBeTruthy();
  });

  it('should show auto-split button when playerCount is provided', () => {
    const payout = { mode: 'percent' as const, entries: [{ place: 1, value: 100 }] };
    const { getByText } = render(
      <PayoutEditor payout={payout} onChange={() => {}} playerCount={8} />
    );
    expect(getByText('Auto')).toBeTruthy();
  });

  it('should show template dropdown', () => {
    const payout = { mode: 'percent' as const, entries: [{ place: 1, value: 100 }] };
    const { container } = render(
      <PayoutEditor payout={payout} onChange={() => {}} />
    );
    const select = container.querySelector('select[data-testid="payout-template"]');
    expect(select).toBeTruthy();
  });

  it('should use currency symbol from prop', () => {
    const payout = { mode: 'euro' as const, entries: [{ place: 1, value: 50 }] };
    const { getByText } = render(
      <PayoutEditor payout={payout} onChange={() => {}} currency="USD" />
    );
    expect(getByText('$')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/components.test.tsx`
Expected: FAIL — new props don't exist yet / missing data-testid / missing template select

**Step 3: Implement PayoutEditor changes**

Modify `src/components/PayoutEditor.tsx` — update the Props interface:

```ts
import type { PayoutConfig, PayoutMode, Currency } from '../domain/types';
import { CURRENCY_SYMBOLS } from '../domain/types';
import { defaultPayoutForPlayerCount } from '../domain/logic';
import { PAYOUT_TEMPLATES } from '../domain/logic';

interface Props {
  payout: PayoutConfig;
  onChange: (payout: PayoutConfig) => void;
  maxPlaces?: number;
  prizePool?: number;
  currency?: Currency;
  playerCount?: number;
}
```

Change function signature default: `maxPlaces = 20`.

Add auto-split handler:

```ts
const applyAutoSplit = () => {
  if (!playerCount) return;
  onChange(defaultPayoutForPlayerCount(playerCount));
};
```

Add template handler:

```ts
const applyTemplate = (templateId: string) => {
  const tpl = PAYOUT_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;
  onChange({ mode: 'percent', entries: [...tpl.entries] });
};
```

In the JSX:
- Replace hardcoded `€` in mode button label with `currency ? CURRENCY_SYMBOLS[currency] : '€'`
- Replace `€` / `%` suffix with currency symbol
- Add `data-testid="payout-entry"` on each entry row
- Add auto-split button (only when `playerCount` is provided)
- Add template `<select data-testid="payout-template">` with PAYOUT_TEMPLATES
- Add live preview: for each entry in percent mode, show `→ {(entry.value / 100 * prizePool).toFixed(2)} {currencySymbol}` when `prizePool > 0`
- Add total preview line: `Σ {prizePool.toFixed(2)} {currencySymbol}`

Mode toggle label change: replace `{t('payoutEditor.euro')}` with `{t('payout.fixedAmount')}` (to be added in Task 5).

**Step 4: Update SetupPage to pass new props**

In `src/components/SetupPage.tsx`, line ~648, change:

```tsx
<PayoutEditor
  payout={config.payout}
  onChange={(payout) => setConfig((prev) => ({ ...prev, payout }))}
  maxPlaces={Math.max(config.players.length, 20)}
  prizePool={config.players.length > 0 ? config.players.length * config.buyIn : undefined}
  currency={config.currency}
  playerCount={config.players.length || undefined}
/>
```

Note: In setup mode, the simple prize pool is `playerCount * buyIn` (no rebuys yet). This is a reasonable estimate for the preview.

**Step 5: Run tests**

Run: `npm run test -- --run tests/components.test.tsx`
Expected: PASS

**Step 6: Run lint + full test suite**

Run: `npm run lint && npm run test -- --run`
Expected: All pass

**Step 7: Commit**

```bash
git add src/components/PayoutEditor.tsx src/components/SetupPage.tsx tests/components.test.tsx
git commit -m "feat: PayoutEditor with auto-split, templates, live preview, max 20 places

- Auto-split button uses defaultPayoutForPlayerCount
- Template dropdown with 4 structures (top-heavy/standard/flat/deep)
- Live EUR/USD/GBP preview next to each percent entry
- maxPlaces raised from 10 to 20
- Currency symbol from config instead of hardcoded €

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Currency Dropdown in Setup + Thread Currency Through UI

**Files:**
- Modify: `src/components/SetupPage.tsx:370-403` (add currency dropdown next to buyIn)
- Modify: `src/components/SetupWizard.tsx:152` (replace unit.eur with currency symbol)
- Modify: `src/components/TournamentStats.tsx:72-74`
- Modify: `src/components/PlayerPanel.tsx:125-190` (all unit.eur → currency)
- Modify: `src/components/TournamentFinished.tsx:227,237,332`
- Modify: `src/components/RebuyEditor.tsx:68`
- Modify: `src/components/AddOnEditor.tsx:97`
- Modify: `src/components/BountyEditor.tsx:107,126`
- Modify: `src/components/display/StatsScreen.tsx:64,85,91`
- Modify: `src/components/display/PayoutScreen.tsx:38,41,73`

**Step 1: Add currency dropdown in SetupPage**

In `src/components/SetupPage.tsx`, import `CURRENCY_SYMBOLS, Currency` from types, and in the "Turnier-Grundlagen" section, after the buy-in NumberStepper + `{t('unit.eur')}` span (~line 403), replace the `{t('unit.eur')}` with a currency dropdown:

```tsx
<select
  value={config.currency}
  onChange={(e) => setConfig((prev) => ({ ...prev, currency: e.target.value as Currency }))}
  className="px-2 py-1 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--accent-500)] focus:ring-2 focus:ring-[var(--accent-ring)] transition-all duration-200"
  aria-label={t('setup.currency')}
>
  {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map((c) => (
    <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
  ))}
</select>
```

**Step 2: Thread currency through all components**

The key pattern: Wherever `{t('unit.eur')}` or `€` appears, replace with `{CURRENCY_SYMBOLS[config.currency]}` or the prop-passed currency.

For components that receive `config` or specific props from App.tsx:

**Components that have direct access to config** (via props from App.tsx → mode containers):
- `SetupPage`, `SetupWizard` — have `config` prop
- `PlayerPanel`, `TournamentStats`, `TournamentFinished` — need `currency` as new prop
- `StatsScreen`, `PayoutScreen` — need `currency` threaded through DisplayMode

**Implementation approach**: Add `currency?: Currency` prop to each component that displays currency. Default to `'EUR'` for backward compat. Replace `{t('unit.eur')}` or hardcoded `€` with `{CURRENCY_SYMBOLS[currency ?? 'EUR']}`.

Components to update (replace `t('unit.eur')` with `CURRENCY_SYMBOLS[currency]`):
1. `SetupPage.tsx` — line ~403 (done above — dropdown replaces text)
2. `SetupWizard.tsx` — line 152, 240
3. `PlayerPanel.tsx` — lines 125, 128, 130, 133, 138, 139, 146, 149, 167, 190
4. `TournamentStats.tsx` — lines 72, 74
5. `TournamentFinished.tsx` — lines 227, 237, 332
6. `RebuyEditor.tsx` — line 68
7. `AddOnEditor.tsx` — line 97
8. `BountyEditor.tsx` — lines 107, 126
9. `StatsScreen.tsx` — lines 64, 85, 91
10. `PayoutScreen.tsx` — lines 38, 41, 73

Components with hardcoded `€` (not `t('unit.eur')`):
11. `LeagueGameDays.tsx` — lines 118, 151
12. `TournamentHistory.tsx` — lines 275, 354
13. `PayoutOverlay.tsx` — lines 73, 126
14. `GameDayEditor.tsx` — lines 307, 397
15. `SharedLeagueView.tsx` — line 89
16. `LeagueStandingsTable.tsx` — line 283

For league/history components (11-16): These display historical data that doesn't carry a `currency` field in the stored result. For now, these should use `t('unit.eur')` (keeping existing behavior) since we'd need a data migration to add currency to `TournamentResult` and `GameDay`. This can be a follow-up. Mark with a `// TODO: use result.currency when available` comment.

**Step 3: Thread currency through App.tsx → mode containers → components**

The `config.currency` is available in App.tsx. It flows to:
- `SetupModeContainer` → `SetupPage` (already has config)
- `GameModeContainer` → `PlayerPanel`, `TournamentStats` (need currency prop)
- `TournamentFinishedContainer` → `TournamentFinished` (needs currency prop)
- `DisplayMode` → `StatsScreen`, `PayoutScreen` (need currency prop)

Check each mode container and pass `currency={config.currency}` to child components.

**Step 4: Run lint + build**

Run: `npm run lint && npm run build`
Expected: Pass — all TypeScript types check, no hardcoded `t('unit.eur')` in setup-facing components

**Step 5: Run full tests**

Run: `npm run test -- --run`
Expected: All pass. Some snapshot or text-matching tests may need update if they check for `€` in rendered output.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: thread configurable currency through all UI components

Replace t('unit.eur') and hardcoded € with CURRENCY_SYMBOLS[currency]
in 10+ components. Currency dropdown in Turnier-Grundlagen section.
League/history components keep EUR default (data migration follow-up).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Currency in Export Functions

**Files:**
- Modify: `src/domain/tournament.ts:472-490` (formatResultAsText)
- Modify: `src/domain/tournament.ts:~505` (formatResultAsCSV)
- Modify: `src/domain/types.ts` (TournamentResult — add currency field)
- Modify: `src/domain/tournament.ts:~370` (buildTournamentResult — set currency)
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

```ts
it('formatResultAsText should use currency symbol from result', () => {
  const result = {
    ...minimalResult,
    currency: 'USD' as const,
    players: [{ place: 1, name: 'Alice', payout: 100, rebuys: 0, addOn: false, knockouts: 1, netBalance: 90 }],
  };
  const text = formatResultAsText(result);
  expect(text).toContain('$');
  expect(text).not.toContain('€');
});
```

**Step 2: Run test — should fail**

**Step 3: Implement**

Add `currency?: Currency` to `TournamentResult` interface in `types.ts`.

In `formatResultAsText`, replace `\u20AC` (€) with:

```ts
const sym = CURRENCY_SYMBOLS[result.currency ?? 'EUR'];
```

Use `sym` in all lines that currently use `\u20AC`.

In `buildTournamentResult`, set `currency: config.currency`.

In `formatResultAsCSV`, add currency symbol to Payout column header: `Payout (${sym})`.

**Step 4: Run tests — should pass**

**Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/tournament.ts tests/logic.test.ts
git commit -m "feat: currency-aware text and CSV export

formatResultAsText and formatResultAsCSV use result.currency
instead of hardcoded €. TournamentResult carries currency field.
Backward-compatible: defaults to EUR.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Translation Keys

**Files:**
- Modify: `src/i18n/translations.ts`
- Test: `tests/i18n.test.ts` (auto-validates key parity)

**Step 1: Add translation keys**

In `src/i18n/translations.ts`, add to both DE and EN sections:

```ts
// DE
'payout.fixedAmount': 'Fester Betrag',
'payout.autoSplit': 'Auto',
'payout.template': 'Vorlage',
'payout.template.topHeavy': 'Top-Heavy (60/25/15)',
'payout.template.standard': 'Standard (50/30/20)',
'payout.template.flat': 'Flach (40/30/20/10)',
'payout.template.deep': 'Tief (35/25/18/13/9)',
'payout.total': 'Gesamt',
'setup.currency': 'Währung',
'setup.quickStart': 'Direkt starten',
'setup.quickStartGo': 'Los!',
'setup.quickStartPlayers': 'Spieleranzahl',

// EN
'payout.fixedAmount': 'Fixed Amount',
'payout.autoSplit': 'Auto',
'payout.template': 'Template',
'payout.template.topHeavy': 'Top-Heavy (60/25/15)',
'payout.template.standard': 'Standard (50/30/20)',
'payout.template.flat': 'Flat (40/30/20/10)',
'payout.template.deep': 'Deep (35/25/18/13/9)',
'payout.total': 'Total',
'setup.currency': 'Currency',
'setup.quickStart': 'Quick Start',
'setup.quickStartGo': 'Go!',
'setup.quickStartPlayers': 'Number of players',
```

**Step 2: Run i18n tests to verify key parity**

Run: `npm run test -- --run tests/i18n.test.ts`
Expected: PASS (the parity test checks DE and EN have same keys)

**Step 3: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "feat: add 12 translation keys for payout, currency, quick-start

DE and EN keys for payout templates, auto-split, currency label,
and quick-start flow.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Quick-Start Preset Extension

**Files:**
- Modify: `src/components/SetupPage.tsx:334-367` (preset buttons section)
- Test: `tests/components.test.tsx`

**Step 1: Write the failing test**

```ts
describe('SetupPage Quick-Start', () => {
  it('should show quick-start button on each preset', () => {
    // Render SetupPage with minimal props, check for quickStart buttons
    // This test may be complex due to SetupPage's many required props.
    // Alternative: test the quick-start logic as a pure function.
  });
});
```

Given SetupPage's complex props, a pragmatic alternative: test the config generation logic as a unit test:

```ts
describe('Quick-Start config generation', () => {
  it('should create valid config from preset with player count', () => {
    const presets = getBuiltInPresets();
    const preset = presets[1]; // standard
    const playerCount = 8;
    const config = {
      ...defaultConfig(),
      ...preset.config,
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Spieler ${i + 1}`,
        rebuys: 0,
        addOn: false,
        status: 'active' as const,
        placement: null,
        eliminatedBy: null,
        knockouts: 0,
      })),
      payout: defaultPayoutForPlayerCount(playerCount),
      currency: 'EUR' as const,
    };
    expect(config.players.length).toBe(8);
    expect(config.buyIn).toBe(10);
    expect(config.payout.entries.length).toBe(3);
    expect(config.levels.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test — should fail (currency missing on defaultConfig)**

Actually this should pass after Task 1. Run and verify.

**Step 3: Implement Quick-Start UI in SetupPage**

In `src/components/SetupPage.tsx`, modify the preset buttons section (~line 334-367).

Add state:

```ts
const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
const [quickStartPlayers, setQuickStartPlayers] = useState(8);
```

Replace each preset button with a card that has two actions:
1. The existing "apply preset" click (with confirm dialog)
2. A new "Direkt starten" / "Quick Start" button that expands an inline section

When expanded, show:
- `NumberStepper` for player count (min 2, max 30, default 8)
- "Los!" / "Go!" button

The "Los!" handler:

```ts
const handleQuickStart = (preset: TournamentPreset) => {
  const playerCount = quickStartPlayers;
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i + 1}`,
    name: `${t('app.defaultPlayerPrefix')} ${i + 1}`,
    rebuys: 0,
    addOn: false,
    status: 'active' as const,
    placement: null,
    eliminatedBy: null,
    knockouts: 0,
  }));
  setConfig((prev) => ({
    ...prev,
    ...preset.config,
    players,
    dealerIndex: 0,
    payout: defaultPayoutForPlayerCount(playerCount),
    currency: prev.currency,
  }));
  onSwitchToGame();
};
```

**Step 4: Run lint + test**

Run: `npm run lint && npm run test -- --run`
Expected: All pass

**Step 5: Commit**

```bash
git add src/components/SetupPage.tsx tests/components.test.tsx tests/logic.test.ts
git commit -m "feat: quick-start flow on preset buttons

Each preset card gets expandable 'Quick Start' with player count
picker and 'Go!' button. Generates complete config and starts
tournament immediately.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Final Integration — Full Test Suite + Build

**Files:** None new — verification only

**Step 1: Run full test suite**

Run: `npm run test -- --run`
Expected: All tests pass (1118+ existing + ~15 new)

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Run production build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors

**Step 4: Manual smoke test**

Run: `npm run dev`
Verify:
- [ ] Setup page: currency dropdown visible next to buy-in
- [ ] Setup page: PayoutEditor shows auto button, template dropdown
- [ ] Setup page: PayoutEditor live preview shows amounts
- [ ] Setup page: preset cards have "Quick Start" option
- [ ] Quick Start: selecting a preset → expand → set players → Go! → game starts
- [ ] Game mode: TournamentStats shows correct currency symbol
- [ ] Game mode: PlayerPanel shows correct currency
- [ ] TV Display: StatsScreen and PayoutScreen show correct currency
- [ ] Changing currency to USD → all € symbols update

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: integration fixes from manual smoke test

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | What | Files | Tests |
|------|------|-------|-------|
| 1 | Currency type + config | types.ts, configPersistence.ts | 3 new |
| 2 | Payout templates module | payoutTemplates.ts, logic.ts | 4 new |
| 3 | PayoutEditor overhaul | PayoutEditor.tsx, SetupPage.tsx | 5 new |
| 4 | Currency through UI | 10+ components | — |
| 5 | Currency in exports | tournament.ts, types.ts | 1 new |
| 6 | Translation keys | translations.ts | existing parity test |
| 7 | Quick-Start presets | SetupPage.tsx | 1 new |
| 8 | Integration verification | — | full suite |

**Total new tests: ~14**
**Total files modified: ~18**
**Total new files: 1** (`payoutTemplates.ts`)
