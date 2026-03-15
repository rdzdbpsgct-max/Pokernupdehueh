# Phase 2: Display Layouts, Enhanced Guides & Presentation API — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 display layout variants (Standard/Kompakt/Timer-Only/Ultra Large) to TV Display Mode, enhance ShareHub wireless guides with OS detection and step-by-step instructions, and add optional Presentation API support.

**Architecture:** Display layouts are driven by a `DisplayLayout` type that parameterizes all flex ratios, font sizes, and visibility flags in DisplayMode.tsx. OS detection is extracted from PWAInstallGuide.tsx into a shared utility. Presentation API is a progressive enhancement with capability check.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, PeerJS (existing), Presentation API (browser-native)

---

## Task 1: Add `DisplayLayout` type and layout config to types.ts

**Files:**
- Modify: `src/domain/types.ts`

**Step 1: Write the failing test**

```typescript
// In tests/logic.test.ts — add at the end of the file, as a new top-level describe block

describe('DisplayLayout type', () => {
  it('should accept valid display layout values', () => {
    const layouts: import('../src/domain/types').DisplayLayout[] = ['standard', 'compact', 'timer-only', 'ultra-large'];
    expect(layouts).toHaveLength(4);
  });
});
```

Add to `tests/logic.test.ts` at the end, after existing describe blocks.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — `DisplayLayout` type not exported from types.ts

**Step 3: Write minimal implementation**

Add to `src/domain/types.ts` after the `DisplayScreenId` type (around line 146):

```typescript
export type DisplayLayout = 'standard' | 'compact' | 'timer-only' | 'ultra-large';
```

Add `displayLayout` to the `Settings` interface (after `displayRotationInterval`):

```typescript
  /** Display layout for TV mode. Default: 'standard'. */
  displayLayout?: DisplayLayout;
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/types.ts tests/logic.test.ts
git commit -m "feat: add DisplayLayout type to types.ts"
```

---

## Task 2: Create `displayLayouts.ts` layout config module

**Files:**
- Create: `src/domain/displayLayouts.ts`
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

Add to `tests/logic.test.ts`:

```typescript
describe('displayLayouts', () => {
  it('getLayoutConfig returns standard layout by default', () => {
    const { getLayoutConfig } = require('../src/domain/displayLayouts');
    const cfg = getLayoutConfig('standard');
    expect(cfg.timerFlex).toBe(55);
    expect(cfg.secondaryFlex).toBe(45);
    expect(cfg.showSecondary).toBe(true);
    expect(cfg.showTicker).toBe(true);
  });

  it('getLayoutConfig returns compact layout', () => {
    const { getLayoutConfig } = require('../src/domain/displayLayouts');
    const cfg = getLayoutConfig('compact');
    expect(cfg.timerFlex).toBe(40);
    expect(cfg.secondaryFlex).toBe(60);
    expect(cfg.showSecondary).toBe(true);
  });

  it('getLayoutConfig returns timer-only layout', () => {
    const { getLayoutConfig } = require('../src/domain/displayLayouts');
    const cfg = getLayoutConfig('timer-only');
    expect(cfg.showSecondary).toBe(false);
    expect(cfg.showTicker).toBe(false);
    expect(cfg.timerFlex).toBe(100);
  });

  it('getLayoutConfig returns ultra-large layout', () => {
    const { getLayoutConfig } = require('../src/domain/displayLayouts');
    const cfg = getLayoutConfig('ultra-large');
    expect(cfg.timerFlex).toBe(70);
    expect(cfg.secondaryFlex).toBe(30);
    expect(cfg.showSecondary).toBe(true);
    expect(cfg.timerFontScale).toBeGreaterThan(1);
  });

  it('getLayoutConfig defaults to standard for undefined', () => {
    const { getLayoutConfig } = require('../src/domain/displayLayouts');
    const cfg = getLayoutConfig(undefined);
    expect(cfg.timerFlex).toBe(55);
  });

  it('DISPLAY_LAYOUTS has all 4 variants with labels', () => {
    const { DISPLAY_LAYOUTS } = require('../src/domain/displayLayouts');
    expect(DISPLAY_LAYOUTS).toHaveLength(4);
    expect(DISPLAY_LAYOUTS.map((l: { id: string }) => l.id)).toEqual(['standard', 'compact', 'timer-only', 'ultra-large']);
    for (const l of DISPLAY_LAYOUTS) {
      expect(l.labelKey).toBeTruthy();
      expect(l.descKey).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/domain/displayLayouts.ts`:

```typescript
import type { DisplayLayout } from './types';

export interface LayoutConfig {
  timerFlex: number;
  secondaryFlex: number;
  showSecondary: boolean;
  showTicker: boolean;
  /** Font scale multiplier for timer countdown (1 = standard). */
  timerFontScale: number;
  /** Font scale multiplier for blinds text (1 = standard). */
  blindsFontScale: number;
  /** Whether to show the next-level hint below progress bar. */
  showNextLevel: boolean;
  /** Whether to show the bottom rotation hint bar. */
  showRotationHint: boolean;
}

const STANDARD: LayoutConfig = {
  timerFlex: 55,
  secondaryFlex: 45,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 1,
  blindsFontScale: 1,
  showNextLevel: true,
  showRotationHint: true,
};

const COMPACT: LayoutConfig = {
  timerFlex: 40,
  secondaryFlex: 60,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 0.75,
  blindsFontScale: 0.75,
  showNextLevel: true,
  showRotationHint: true,
};

const TIMER_ONLY: LayoutConfig = {
  timerFlex: 100,
  secondaryFlex: 0,
  showSecondary: false,
  showTicker: false,
  timerFontScale: 1.5,
  blindsFontScale: 1.3,
  showNextLevel: true,
  showRotationHint: false,
};

const ULTRA_LARGE: LayoutConfig = {
  timerFlex: 70,
  secondaryFlex: 30,
  showSecondary: true,
  showTicker: true,
  timerFontScale: 1.25,
  blindsFontScale: 1.15,
  showNextLevel: false,
  showRotationHint: true,
};

const LAYOUT_MAP: Record<DisplayLayout, LayoutConfig> = {
  standard: STANDARD,
  compact: COMPACT,
  'timer-only': TIMER_ONLY,
  'ultra-large': ULTRA_LARGE,
};

export function getLayoutConfig(layout: DisplayLayout | undefined): LayoutConfig {
  return LAYOUT_MAP[layout ?? 'standard'];
}

export interface DisplayLayoutOption {
  id: DisplayLayout;
  labelKey: string;
  descKey: string;
}

export const DISPLAY_LAYOUTS: DisplayLayoutOption[] = [
  { id: 'standard', labelKey: 'display.layout.standard', descKey: 'display.layout.standardDesc' },
  { id: 'compact', labelKey: 'display.layout.compact', descKey: 'display.layout.compactDesc' },
  { id: 'timer-only', labelKey: 'display.layout.timerOnly', descKey: 'display.layout.timerOnlyDesc' },
  { id: 'ultra-large', labelKey: 'display.layout.ultraLarge', descKey: 'display.layout.ultraLargeDesc' },
];
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: PASS

**Step 5: Add export to logic.ts barrel**

Add to `src/domain/logic.ts`:

```typescript
export { getLayoutConfig, DISPLAY_LAYOUTS } from './displayLayouts';
export type { LayoutConfig, DisplayLayoutOption } from './displayLayouts';
```

**Step 6: Commit**

```bash
git add src/domain/displayLayouts.ts src/domain/logic.ts tests/logic.test.ts
git commit -m "feat: add displayLayouts module with 4 layout configs"
```

---

## Task 3: Parameterize DisplayMode.tsx with layout config

**Files:**
- Modify: `src/components/display/DisplayMode.tsx`

**Step 1: Add `displayLayout` prop to Props interface**

In `DisplayMode.tsx`, add to the `Props` interface:

```typescript
  displayLayout?: import('../../domain/types').DisplayLayout;
```

**Step 2: Import and use `getLayoutConfig`**

At the top of the `DisplayMode` function body, add:

```typescript
import { getLayoutConfig } from '../../domain/displayLayouts';
import type { DisplayLayout } from '../../domain/types';
```

Inside the function:

```typescript
const layoutConfig = getLayoutConfig(displayLayout);
```

**Step 3: Replace hardcoded flex values with layout config**

Replace the timer section (line ~338):

```tsx
{/* TIMER — always visible */}
<div
  className="flex flex-col items-center justify-center px-6 py-3"
  style={{ flex: layoutConfig.timerFlex }}
>
```

Replace the secondary area (line ~435):

```tsx
{/* SECONDARY AREA */}
{layoutConfig.showSecondary && (
  <div
    className="overflow-hidden px-6 py-3 animate-fade-in"
    style={{ flex: layoutConfig.secondaryFlex }}
    key={activeSecondary}
  >
    {/* ...existing screen rendering... */}
  </div>
)}
```

**Step 4: Apply font scale to timer and blinds**

Use inline style `fontSize` with calc for the countdown:

```tsx
<p
  className={`font-mono font-bold tabular-nums leading-none ${/* ...existing classes... */}`}
  style={{ fontSize: `calc(${layoutConfig.timerFontScale} * var(--timer-base-size, 1rem))` }}
>
```

**Simpler approach** — use a CSS class mapping:

Since Tailwind responsive classes (`text-[4rem] sm:text-[6rem] lg:text-[8rem]`) can't be dynamically scaled, use inline style override only when scale ≠ 1:

For countdown (base: `text-[4rem] sm:text-[6rem] lg:text-[8rem]`):

```tsx
const timerScale = layoutConfig.timerFontScale;
const timerStyle = timerScale !== 1
  ? { fontSize: `clamp(${4 * timerScale}rem, ${12 * timerScale}vw, ${8 * timerScale}rem)` }
  : undefined;
```

For blinds (base: `text-[3rem] sm:text-[5rem] lg:text-[7rem]`):

```tsx
const blindsScale = layoutConfig.blindsFontScale;
const blindsStyle = blindsScale !== 1
  ? { fontSize: `clamp(${3 * blindsScale}rem, ${10 * blindsScale}vw, ${7 * blindsScale}rem)` }
  : undefined;
```

Apply via `style={timerStyle}` and `style={blindsStyle}` on the respective elements (override Tailwind text-size when non-standard). When `timerScale === 1`, the existing Tailwind classes apply naturally.

**Step 5: Conditionally render ticker and rotation hint**

Wrap ticker:

```tsx
{layoutConfig.showTicker && <TickerBanner items={tickerItems} />}
```

Wrap rotation hint:

```tsx
{layoutConfig.showRotationHint && (
  <div className="px-6 py-1 border-t border-gray-800/60 text-center">
    <p className="text-gray-600 text-[10px]">
      {/* existing rotation hint */}
    </p>
  </div>
)}
```

Wrap next level:

```tsx
{layoutConfig.showNextLevel && nextLevel && (
  <div className="text-center mt-1">
    {/* existing next level display */}
  </div>
)}
```

**Step 6: Run lint and tests**

Run: `npm run lint && npm run test -- --run`
Expected: PASS

**Step 7: Commit**

```bash
git add src/components/display/DisplayMode.tsx
git commit -m "feat: parameterize DisplayMode with layout config"
```

---

## Task 4: Wire `displayLayout` through App.tsx, settings, and cross-device display

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/display/CrossDeviceDisplay.tsx`
- Modify: `src/hooks/useDisplaySession.ts`

**Step 1: Pass `displayLayout` from settings to DisplayMode in App.tsx**

In `App.tsx`, wherever `DisplayMode` is rendered, add:

```tsx
displayLayout={settings.displayLayout}
```

**Step 2: Add layout selector to SettingsPanel.tsx**

In the Display section of SettingsPanel (near displayScreens / displayRotationInterval), add a layout picker:

```tsx
import { DISPLAY_LAYOUTS } from '../domain/logic';
import type { DisplayLayout } from '../domain/types';

{/* Display Layout */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    {t('settings.displayLayout' as TKey)}
  </label>
  <div className="grid grid-cols-2 gap-2">
    {DISPLAY_LAYOUTS.map((l) => (
      <button
        key={l.id}
        onClick={() => onSettingsChange({ ...settings, displayLayout: l.id })}
        className={`p-2 rounded-lg border text-left text-xs transition-all ${
          (settings.displayLayout ?? 'standard') === l.id
            ? 'border-[var(--accent-500)] bg-[color-mix(in_srgb,var(--accent-500)_10%,transparent)]'
            : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <div className="font-medium text-gray-900 dark:text-gray-100">{t(l.labelKey as TKey)}</div>
        <div className="text-gray-500 dark:text-gray-400 mt-0.5">{t(l.descKey as TKey)}</div>
      </button>
    ))}
  </div>
</div>
```

**Step 3: Include `displayLayout` in DisplayStatePayload for cross-device**

In `useDisplaySession.ts`, ensure `displayLayout` from settings is included in the payload sent to cross-device displays (it's part of the full state broadcast). Check that `CrossDeviceDisplay.tsx` passes it through to `DisplayMode`.

**Step 4: Run lint and tests**

Run: `npm run lint && npm run test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/components/SettingsPanel.tsx src/components/display/CrossDeviceDisplay.tsx src/hooks/useDisplaySession.ts
git commit -m "feat: wire displayLayout through settings, App, and cross-device"
```

---

## Task 5: Add translation keys for display layouts

**Files:**
- Modify: `src/i18n/translations.ts`

**Step 1: Add German translation keys**

Add to DE translations:

```typescript
'display.layout.standard': 'Standard',
'display.layout.standardDesc': 'Timer oben (55%), rotierende Infos unten (45%)',
'display.layout.compact': 'Kompakt',
'display.layout.compactDesc': 'Kleinerer Timer (40%), mehr Platz für Infos (60%)',
'display.layout.timerOnly': 'Nur Timer',
'display.layout.timerOnlyDesc': 'Maximaler Timer, keine Sekundäranzeige',
'display.layout.ultraLarge': 'Ultra Large',
'display.layout.ultraLargeDesc': 'Übergroßer Timer (70%), kompakte Infos (30%)',
'settings.displayLayout': 'Display-Layout',
```

**Step 2: Add English translation keys**

Add to EN translations:

```typescript
'display.layout.standard': 'Standard',
'display.layout.standardDesc': 'Timer top (55%), rotating info bottom (45%)',
'display.layout.compact': 'Compact',
'display.layout.compactDesc': 'Smaller timer (40%), more space for info (60%)',
'display.layout.timerOnly': 'Timer Only',
'display.layout.timerOnlyDesc': 'Maximum timer, no secondary screens',
'display.layout.ultraLarge': 'Ultra Large',
'display.layout.ultraLargeDesc': 'Oversized timer (70%), compact info (30%)',
'settings.displayLayout': 'Display Layout',
```

**Step 3: Run i18n tests**

Run: `npm run test -- --run tests/i18n.test.ts`
Expected: PASS (keys must be in parity)

**Step 4: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "feat: add translation keys for display layout variants"
```

---

## Task 6: Extract `detectPlatform` to shared utility

**Files:**
- Create: `src/domain/platform.ts`
- Modify: `src/components/PWAInstallGuide.tsx`
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

Add to `tests/logic.test.ts`:

```typescript
describe('platform detection', () => {
  it('detectPlatform returns desktop by default', () => {
    const { detectPlatform } = require('../src/domain/platform');
    expect(detectPlatform()).toBe('desktop');
  });

  it('detectPlatform returns android for Android UA', () => {
    const { detectPlatform } = require('../src/domain/platform');
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
      configurable: true,
    });
    expect(detectPlatform()).toBe('android');
    // Restore
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (jsdom)',
      configurable: true,
    });
  });

  it('detectPlatform returns ios for iPhone UA', () => {
    const { detectPlatform } = require('../src/domain/platform');
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      configurable: true,
    });
    expect(detectPlatform()).toBe('ios');
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (jsdom)',
      configurable: true,
    });
  });

  it('detectDesktopOS returns macos for Mac platform', () => {
    const { detectDesktopOS } = require('../src/domain/platform');
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
    expect(detectDesktopOS()).toBe('macos');
    Object.defineProperty(navigator, 'platform', {
      value: '',
      configurable: true,
    });
  });

  it('detectDesktopOS returns windows for Win32 platform', () => {
    const { detectDesktopOS } = require('../src/domain/platform');
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    expect(detectDesktopOS()).toBe('windows');
    Object.defineProperty(navigator, 'platform', {
      value: '',
      configurable: true,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/domain/platform.ts`:

```typescript
export type Platform = 'android' | 'ios' | 'desktop';
export type DesktopOS = 'macos' | 'windows' | 'chromeos' | 'linux' | 'unknown';

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

export function detectDesktopOS(): DesktopOS {
  const platform = navigator.platform || '';
  const ua = navigator.userAgent;
  if (/Mac/i.test(platform)) return 'macos';
  if (/Win/i.test(platform)) return 'windows';
  if (/CrOS/i.test(ua)) return 'chromeos';
  if (/Linux/i.test(platform)) return 'linux';
  return 'unknown';
}
```

**Step 4: Update PWAInstallGuide.tsx to import from shared utility**

Replace the local `detectPlatform` function and `Platform` type in `PWAInstallGuide.tsx` with:

```typescript
import { detectPlatform } from '../domain/platform';
import type { Platform } from '../domain/platform';
```

Remove the local `function detectPlatform()` and `type Platform` definitions.

**Step 5: Add export to logic.ts barrel**

```typescript
export { detectPlatform, detectDesktopOS } from './platform';
export type { Platform, DesktopOS } from './platform';
```

**Step 6: Run tests**

Run: `npm run test -- --run`
Expected: PASS

**Step 7: Commit**

```bash
git add src/domain/platform.ts src/domain/logic.ts src/components/PWAInstallGuide.tsx tests/logic.test.ts
git commit -m "refactor: extract detectPlatform to shared domain/platform module"
```

---

## Task 7: Enhance ShareHub wireless guides with OS detection

**Files:**
- Modify: `src/components/ShareHub.tsx`
- Modify: `src/i18n/translations.ts`

**Step 1: Import platform detection in ShareHub**

```typescript
import { detectPlatform, detectDesktopOS } from '../domain/logic';
```

**Step 2: Replace static `<details>` with platform-aware sections**

Inside the Cable & Wireless section of ShareHub.tsx (lines 263-296), replace the three static `<details>` elements with:

```tsx
const PlatformGuides = memo(function PlatformGuides() {
  const { t } = useTranslation();
  const platform = useMemo(() => detectPlatform(), []);
  const desktopOS = useMemo(() => detectDesktopOS(), []);

  // Build guides list — platform-relevant first, open by default
  const guides = useMemo(() => {
    const list: { id: string; title: string; steps: string[]; defaultOpen: boolean }[] = [];

    if (platform === 'ios') {
      list.push({
        id: 'airplay',
        title: 'AirPlay / Screen Mirroring',
        steps: [
          t('shareHub.guide.airplay.step1' as TKey),
          t('shareHub.guide.airplay.step2' as TKey),
          t('shareHub.guide.airplay.step3' as TKey),
        ],
        defaultOpen: true,
      });
    }

    if (platform === 'android') {
      list.push({
        id: 'chromecast',
        title: 'Chromecast / Google Cast',
        steps: [
          t('shareHub.guide.chromecast.step1' as TKey),
          t('shareHub.guide.chromecast.step2' as TKey),
          t('shareHub.guide.chromecast.step3' as TKey),
        ],
        defaultOpen: true,
      });
    }

    if (platform === 'desktop') {
      if (desktopOS === 'macos') {
        list.push({
          id: 'airplay',
          title: 'AirPlay / Screen Mirroring',
          steps: [
            t('shareHub.guide.airplayMac.step1' as TKey),
            t('shareHub.guide.airplayMac.step2' as TKey),
            t('shareHub.guide.airplayMac.step3' as TKey),
          ],
          defaultOpen: true,
        });
      }
      list.push({
        id: 'chromecast',
        title: 'Chromecast / Google Cast',
        steps: [
          t('shareHub.guide.chromecastDesktop.step1' as TKey),
          t('shareHub.guide.chromecastDesktop.step2' as TKey),
          t('shareHub.guide.chromecastDesktop.step3' as TKey),
        ],
        defaultOpen: desktopOS !== 'macos',
      });
    }

    // HDMI always last, never auto-open
    list.push({
      id: 'hdmi',
      title: `HDMI / ${t('shareHub.cable' as TKey)}`,
      steps: [
        t('shareHub.guide.hdmi.step1' as TKey),
        t('shareHub.guide.hdmi.step2' as TKey),
        t('shareHub.guide.hdmi.step3' as TKey),
      ],
      defaultOpen: false,
    });

    // Add non-primary guides as collapsed
    if (platform !== 'ios' && platform !== 'desktop') {
      list.splice(list.length - 1, 0, {
        id: 'airplay',
        title: 'AirPlay / Screen Mirroring',
        steps: [
          t('shareHub.guide.airplay.step1' as TKey),
          t('shareHub.guide.airplay.step2' as TKey),
          t('shareHub.guide.airplay.step3' as TKey),
        ],
        defaultOpen: false,
      });
    }
    if (platform !== 'android' && platform !== 'desktop') {
      list.splice(list.length - 1, 0, {
        id: 'chromecast',
        title: 'Chromecast / Google Cast',
        steps: [
          t('shareHub.guide.chromecast.step1' as TKey),
          t('shareHub.guide.chromecast.step2' as TKey),
          t('shareHub.guide.chromecast.step3' as TKey),
        ],
        defaultOpen: false,
      });
    }

    return list;
  }, [platform, desktopOS, t]);

  return (
    <div className="space-y-1">
      {guides.map((g) => (
        <details key={g.id} className="group" open={g.defaultOpen || undefined}>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 py-1.5 hover:text-gray-900 dark:hover:text-white transition-colors">
            {g.title}
          </summary>
          <ol className="text-xs text-gray-500 dark:text-gray-400 pl-4 pb-2 space-y-1 list-decimal list-inside">
            {g.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
});
```

Replace the existing 3 `<details>` elements in the Cable & Wireless SectionCard with `<PlatformGuides />`.

**Step 3: Add detailed guide translation keys**

Add to DE translations:

```typescript
// Platform-specific guides
'shareHub.guide.airplay.step1': 'Kontrollzentrum öffnen (von oben rechts wischen)',
'shareHub.guide.airplay.step2': '„Bildschirmsynchronisierung" antippen',
'shareHub.guide.airplay.step3': 'Apple TV oder AirPlay-Empfänger auswählen',
'shareHub.guide.airplayMac.step1': 'Kontrollzentrum öffnen (Menüleiste)',
'shareHub.guide.airplayMac.step2': '„Bildschirmsynchronisierung" klicken',
'shareHub.guide.airplayMac.step3': 'Apple TV oder AirPlay-Empfänger auswählen',
'shareHub.guide.chromecast.step1': 'Google Home App → Chromecast-Gerät',
'shareHub.guide.chromecast.step2': '„Bildschirm streamen" antippen',
'shareHub.guide.chromecast.step3': 'Poker-Timer App sollte auf dem TV erscheinen',
'shareHub.guide.chromecastDesktop.step1': 'In Chrome: Menü (⋮) → „Streamen…"',
'shareHub.guide.chromecastDesktop.step2': 'Unter „Quellen" → „Tab streamen" wählen',
'shareHub.guide.chromecastDesktop.step3': 'Chromecast-Gerät auswählen',
'shareHub.guide.hdmi.step1': 'HDMI-Kabel an Laptop/PC und TV anschließen',
'shareHub.guide.hdmi.step2': 'Browser in Vollbild öffnen (F11 oder ⌘+Ctrl+F)',
'shareHub.guide.hdmi.step3': 'Fenster auf den externen Bildschirm ziehen',
'shareHub.guide.tip': 'Tipp: Nutze den Display-Link oben für ein eigenständiges Fenster auf dem TV.',
```

Add to EN translations:

```typescript
'shareHub.guide.airplay.step1': 'Open Control Center (swipe down from top right)',
'shareHub.guide.airplay.step2': 'Tap "Screen Mirroring"',
'shareHub.guide.airplay.step3': 'Select your Apple TV or AirPlay receiver',
'shareHub.guide.airplayMac.step1': 'Open Control Center (menu bar)',
'shareHub.guide.airplayMac.step2': 'Click "Screen Mirroring"',
'shareHub.guide.airplayMac.step3': 'Select your Apple TV or AirPlay receiver',
'shareHub.guide.chromecast.step1': 'Google Home app → Chromecast device',
'shareHub.guide.chromecast.step2': 'Tap "Cast screen"',
'shareHub.guide.chromecast.step3': 'Poker timer app should appear on TV',
'shareHub.guide.chromecastDesktop.step1': 'In Chrome: Menu (⋮) → "Cast…"',
'shareHub.guide.chromecastDesktop.step2': 'Under "Sources" → select "Cast tab"',
'shareHub.guide.chromecastDesktop.step3': 'Select your Chromecast device',
'shareHub.guide.hdmi.step1': 'Connect HDMI cable to laptop/PC and TV',
'shareHub.guide.hdmi.step2': 'Open browser in fullscreen (F11 or ⌘+Ctrl+F)',
'shareHub.guide.hdmi.step3': 'Drag window to the external display',
'shareHub.guide.tip': 'Tip: Use the Display Link above for a standalone window on the TV.',
```

**Step 4: Run tests**

Run: `npm run lint && npm run test -- --run`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ShareHub.tsx src/i18n/translations.ts
git commit -m "feat: enhance ShareHub wireless guides with OS detection and step-by-step instructions"
```

---

## Task 8: Add Presentation API support

**Files:**
- Create: `src/domain/presentationApi.ts`
- Modify: `src/components/ShareHub.tsx`
- Modify: `src/i18n/translations.ts`
- Test: `tests/logic.test.ts`

**Step 1: Write the failing test**

Add to `tests/logic.test.ts`:

```typescript
describe('Presentation API', () => {
  it('isPresentationApiAvailable returns false in test env', () => {
    const { isPresentationApiAvailable } = require('../src/domain/presentationApi');
    expect(isPresentationApiAvailable()).toBe(false);
  });

  it('buildPresentationUrl includes display hash', () => {
    const { buildPresentationUrl } = require('../src/domain/presentationApi');
    const url = buildPresentationUrl('PKR-12345');
    expect(url).toContain('#display=PKR-12345');
  });

  it('buildPresentationUrl uses current origin', () => {
    const { buildPresentationUrl } = require('../src/domain/presentationApi');
    const url = buildPresentationUrl('PKR-99999');
    expect(url).toMatch(/^https?:\/\//);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/domain/presentationApi.ts`:

```typescript
/**
 * Presentation API — progressive enhancement for second-screen display.
 *
 * The Presentation API allows a web app to open a URL on a connected external
 * display (Chromecast, HDMI, wireless display) directly from the browser.
 * Supported in Chrome/Edge on desktop and Android. Not supported in Safari/Firefox.
 *
 * We use this as an optional enhancement — never the only path.
 */

export function isPresentationApiAvailable(): boolean {
  try {
    return typeof navigator !== 'undefined' && 'presentation' in navigator && typeof PresentationRequest !== 'undefined';
  } catch {
    return false;
  }
}

export function buildPresentationUrl(peerId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#display=${peerId}`;
}

/**
 * Start a Presentation API session — opens the display URL on an external screen.
 * Returns the PresentationConnection or null if cancelled/failed.
 */
export async function startPresentation(peerId: string): Promise<unknown> {
  if (!isPresentationApiAvailable()) return null;

  const url = buildPresentationUrl(peerId);
  try {
    const request = new PresentationRequest([url]);
    const connection = await request.start();
    return connection;
  } catch (err: unknown) {
    // User cancelled or no displays available — this is expected
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return null;
    }
    console.warn('[PresentationAPI] Failed to start:', err);
    return null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run tests/logic.test.ts`
Expected: PASS

**Step 5: Add to logic.ts barrel**

```typescript
export { isPresentationApiAvailable, buildPresentationUrl, startPresentation } from './presentationApi';
```

**Step 6: Add Presentation API button to ShareHub**

In `ShareHub.tsx`, in the "Auf anderem Gerät anzeigen" section, add a conditional button:

```tsx
import { isPresentationApiAvailable, startPresentation } from '../domain/logic';

// Inside the Display SectionCard, after the existing QR/link buttons:
{isPresentationApiAvailable() && peerId && (
  <button
    onClick={() => startPresentation(peerId)}
    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 transition-colors active:scale-[0.97] flex items-center justify-center gap-2"
  >
    <span>🖥️</span>
    <span>{t('shareHub.presentationApi' as TKey)}</span>
  </button>
)}
```

**Step 7: Add translation keys**

DE:
```typescript
'shareHub.presentationApi': 'Auf externem Display öffnen (Browser)',
'shareHub.presentationApiDesc': 'Öffnet die Anzeige direkt auf einem verbundenen Bildschirm.',
```

EN:
```typescript
'shareHub.presentationApi': 'Open on External Display (Browser)',
'shareHub.presentationApiDesc': 'Opens the display directly on a connected screen.',
```

**Step 8: Run tests**

Run: `npm run lint && npm run test -- --run`
Expected: PASS

**Step 9: Commit**

```bash
git add src/domain/presentationApi.ts src/domain/logic.ts src/components/ShareHub.tsx src/i18n/translations.ts tests/logic.test.ts
git commit -m "feat: add Presentation API support with capability check"
```

---

## Task 9: Update documentation (CLAUDE.md, CHANGELOG.md, package.json)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`

**Step 1: Update version to 6.7.0 in package.json**

**Step 2: Add Phase 2 features to CHANGELOG.md**

Add new section at top:

```markdown
### v6.7.0 — Phase 2: Display-Layouts, Plattform-Guides & Presentation API

- **4 Display-Layout-Varianten**: Standard (55/45), Kompakt (40/60), Timer-Only (100/0), Ultra Large (70/30). Konfigurierbar in Settings. `displayLayouts.ts` (~80 Zeilen) mit `LayoutConfig`-Interface und `getLayoutConfig()`. DisplayMode.tsx parameterized mit flexiblen Flex-Ratios, Font-Scales und Visibility-Flags.
- **Plattform-spezifische Guides**: `platform.ts` (~25 Zeilen) mit `detectPlatform()` + `detectDesktopOS()` als shared Utility (aus PWAInstallGuide extrahiert). ShareHub Wireless-Sektion erkennt Plattform und zeigt relevante Anleitung zuerst (AirPlay auf iOS/macOS, Chromecast auf Android/Desktop). Schritt-für-Schritt-Anleitungen statt Einzeiler.
- **Presentation API**: `presentationApi.ts` (~40 Zeilen) — Progressive Enhancement für Browser-nativen Second-Screen-Support. `isPresentationApiAvailable()` Capability-Check. Button in ShareHub nur sichtbar wenn Browser die API unterstützt (Chrome/Edge).
- **Neue Dateien**: `src/domain/displayLayouts.ts`, `src/domain/platform.ts`, `src/domain/presentationApi.ts`
- **~46 neue Translation-Keys** (23 DE + 23 EN)
- **~14 neue Tests**
```

**Step 3: Update CLAUDE.md**

- Add `displayLayouts.ts`, `platform.ts`, `presentationApi.ts` to project structure
- Add `DisplayLayout` to types documentation
- Update `Settings` interface documentation with `displayLayout`
- Add Display Layouts section to Key Implementation Details
- Update test count
- Update version number

**Step 4: Run build to verify**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json CLAUDE.md CHANGELOG.md
git commit -m "docs: update documentation for v6.7.0 Phase 2"
```
