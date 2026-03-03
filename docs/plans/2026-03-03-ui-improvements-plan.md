# UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve UI visibility (chevrons, steppers), page load performance, and add dark/light mode toggle.

**Architecture:** Four independent workstreams: (1) Replace Unicode chevrons with SVG, (2) Create `NumberStepper` component to replace native spinners, (3) Lazy-load game-mode components and html-to-image, (4) Add Tailwind `dark:` class-based theme system with 3-way toggle (System/Light/Dark). All changes are UI-only — no business logic in `domain/` is touched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite 7

---

## Task 1: Chevron SVG Component

Replace tiny Unicode triangles with proper SVG chevrons across all collapsible components.

**Files:**
- Create: `src/components/ChevronIcon.tsx`
- Modify: `src/components/CollapsibleSection.tsx:37-39`
- Modify: `src/components/CollapsibleSubSection.tsx:28-30`
- Modify: `src/components/ChipSidebar.tsx:31`
- Modify: `src/components/TemplateManager.tsx:281`
- Modify: `src/components/TournamentFinished.tsx:130`

**Step 1: Create ChevronIcon component**

Create `src/components/ChevronIcon.tsx`:

```tsx
interface Props {
  open: boolean;
  className?: string;
}

export function ChevronIcon({ open, className = '' }: Props) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
```

**Step 2: Update CollapsibleSection.tsx**

Replace lines 37-39:

```tsx
// OLD:
<span className="text-gray-500 text-xs" aria-hidden="true">
  {isOpen ? '\u25BE' : '\u25B8'}
</span>

// NEW:
<ChevronIcon open={isOpen} className="text-gray-400 group-hover:text-gray-200" />
```

Also add `group` class to the button element (line 19, add to className).

Import `ChevronIcon` at top.

**Step 3: Update CollapsibleSubSection.tsx**

Same pattern as Step 2 — replace lines 28-30 with `<ChevronIcon>`.

**Step 4: Update ChipSidebar.tsx**

Replace line 31:

```tsx
// OLD:
<span className="text-gray-500 text-xs">{collapsed ? '▸' : '▾'}</span>

// NEW:
<ChevronIcon open={!collapsed} className="text-gray-400" />
```

Import `ChevronIcon` at top.

**Step 5: Update TemplateManager.tsx**

Replace line 281:

```tsx
// OLD:
<span>{showJson ? '▾' : '▸'}</span>

// NEW:
<ChevronIcon open={showJson} className="text-gray-400" />
```

Import `ChevronIcon` at top.

**Step 6: Update TournamentFinished.tsx**

Replace line 130. The expand/collapse button uses `▲`/`▼` with text. Change to:

```tsx
// OLD:
{detailsExpanded ? `▲ ${t('finished.collapse')}` : `▼ ${t('finished.expand')}`}

// NEW:
<span className="flex items-center gap-1">
  <ChevronIcon open={detailsExpanded} className="w-3 h-3" />
  {detailsExpanded ? t('finished.collapse') : t('finished.expand')}
</span>
```

Import `ChevronIcon` at top.

**Step 7: Also update move-up/move-down buttons in PlayerManager and ConfigEditor**

In `PlayerManager.tsx` lines 189-204 and `ConfigEditor.tsx` lines 249-264, replace the tiny `▲`/`▼` Unicode arrows with SVG arrows. Use larger size and better contrast:

```tsx
// OLD (both files):
<button ... className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs">
  ▲
</button>

// NEW:
<button ... className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
</button>
```

Same for `▼` with `d="M19 9l-7 7-7-7"`.

**Step 8: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/components/ChevronIcon.tsx src/components/CollapsibleSection.tsx src/components/CollapsibleSubSection.tsx src/components/ChipSidebar.tsx src/components/TemplateManager.tsx src/components/TournamentFinished.tsx src/components/PlayerManager.tsx src/components/ConfigEditor.tsx
git commit -m "feat: SVG-Chevrons und grössere Reorder-Pfeile für bessere Sichtbarkeit"
```

---

## Task 2: NumberStepper Component

Create reusable component and replace all `<input type="number">` instances.

**Files:**
- Create: `src/components/NumberStepper.tsx`
- Modify: `src/index.css` (hide native spinners)
- Modify: `src/App.tsx:731-783` (buy-in, starting chips)
- Modify: `src/components/PlayerManager.tsx:119-131` (player count)
- Modify: `src/components/ConfigEditor.tsx:116-149` (global minutes, break minutes) and per-level inputs
- Modify: `src/components/RebuyEditor.tsx:61-89,120-158` (cost, chips, limits)
- Modify: `src/components/AddOnEditor.tsx:90-116` (cost, chips)
- Modify: `src/components/BountyEditor.tsx:35-44` (amount)
- Modify: `src/components/PayoutEditor.tsx:98-106,114-122` (places, entries)
- Modify: `src/components/ChipEditor.tsx:176-188` (denomination values)

**Step 1: Add spinner-hiding CSS to index.css**

Add to `src/index.css` at end of Global Styles section:

```css
/* Hide native number input spinners */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
```

**Step 2: Create NumberStepper component**

Create `src/components/NumberStepper.tsx`:

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional snap function for non-linear stepping (e.g. snapSpinnerValue) */
  snap?: (raw: number, prev: number, step: number) => number;
  inputClassName?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  snap,
  inputClassName = 'w-20',
}: Props) {
  const [localValue, setLocalValue] = useState(String(value));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local display when value prop changes
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, v)),
    [min, max],
  );

  const increment = useCallback(() => {
    const next = clamp(value + step);
    const result = snap ? snap(next, value, step) : next;
    onChange(clamp(result));
  }, [value, step, clamp, snap, onChange]);

  const decrement = useCallback(() => {
    const next = clamp(value - step);
    const result = snap ? snap(next, value, step) : next;
    onChange(clamp(result));
  }, [value, step, clamp, snap, onChange]);

  const stopHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startHold = useCallback(
    (action: () => void) => {
      action();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(action, 100);
      }, 400);
    },
    [],
  );

  // Clean up on unmount
  useEffect(() => stopHold, [stopHold]);

  const handleBlur = () => {
    const n = Number(localValue);
    if (!isNaN(n)) {
      onChange(clamp(n));
    } else {
      setLocalValue(String(value));
    }
  };

  const btnBase =
    'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-150 select-none shrink-0 ' +
    'bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50 ' +
    'active:scale-[0.93] disabled:opacity-30 disabled:pointer-events-none';

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className={btnBase}
        disabled={value <= min}
        onPointerDown={() => startHold(decrement)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        tabIndex={-1}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        min={min}
        max={max === Infinity ? undefined : max}
        step={step}
        className={`${inputClassName} px-2 py-1.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-white text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200`}
      />
      <button
        type="button"
        className={btnBase}
        disabled={value >= max}
        onPointerDown={() => startHold(increment)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        tabIndex={-1}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
```

**Step 3: Replace number inputs in App.tsx**

Replace buy-in input (around line 731-753) and starting chips input (around line 758-783) with `<NumberStepper>`. Keep the existing `onChange` logic but adapt it to receive a number directly instead of an event.

Example for buy-in:
```tsx
<NumberStepper
  value={config.buyIn}
  onChange={(newBuyIn) => {
    setConfig((prev) => ({
      ...prev,
      buyIn: newBuyIn,
      rebuy: {
        ...prev.rebuy,
        rebuyCost: prev.rebuy.rebuyCost === prev.buyIn ? newBuyIn : prev.rebuy.rebuyCost,
      },
      addOn: {
        ...prev.addOn,
        cost: prev.addOn.cost === prev.buyIn ? newBuyIn : prev.addOn.cost,
      },
    }));
  }}
  min={1}
  step={1}
/>
```

For starting chips, pass `snap={snapSpinnerValue}` and `step={1000}`.

**Step 4: Replace number inputs in PlayerManager.tsx**

Replace player count input (lines 119-131). The component uses a controlled `countInput` string state with `applyCountInput` on blur. Adapt to use `NumberStepper` with `onChange` calling `setPlayerCount` directly:

```tsx
<NumberStepper
  value={players.length}
  onChange={(n) => setPlayerCount(n)}
  min={2}
  max={20}
  step={1}
/>
```

Remove `countInput` state and `applyCountInput` since NumberStepper handles this internally.

**Step 5: Replace number inputs in ConfigEditor.tsx**

Replace global level minutes input (line 116-123), global break minutes input (line 134-141), and per-level duration/blind/ante inputs (lines 180-228).

For the global controls, the current pattern is: edit local state, then click "Apply". Keep this pattern — use `NumberStepper` for the input but keep the Apply button.

For per-level inputs, replace inline with `<NumberStepper>` instances. These are in a tight table layout, so use `inputClassName="w-14"` for narrower fields.

**Step 6: Replace number inputs in RebuyEditor.tsx**

Replace cost (line 61-71), chips (line 76-87), level limit (line 120-128), and time limit hours/minutes (lines 136-158).

**Step 7: Replace number inputs in AddOnEditor.tsx**

Replace cost (line 90-100) and chips (line 105-115).

**Step 8: Replace number inputs in BountyEditor.tsx**

Replace amount (line 35-44).

**Step 9: Replace number inputs in PayoutEditor.tsx**

Replace paid places count (line 98-106) and payout entry values (line 114-122).

**Step 10: Replace number inputs in ChipEditor.tsx**

Replace denomination value inputs (line 176-188).

**Step 11: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/components/NumberStepper.tsx src/index.css src/App.tsx src/components/PlayerManager.tsx src/components/ConfigEditor.tsx src/components/RebuyEditor.tsx src/components/AddOnEditor.tsx src/components/BountyEditor.tsx src/components/PayoutEditor.tsx src/components/ChipEditor.tsx
git commit -m "feat: Custom NumberStepper ersetzt native Browser-Spinner"
```

---

## Task 3: Performance Optimization

**Files:**
- Modify: `src/components/TournamentFinished.tsx:5` (dynamic import)
- Modify: `src/App.tsx:32-51,684` (lazy imports + Suspense)

**Step 1: Dynamic import of html-to-image**

In `src/components/TournamentFinished.tsx`, remove the static import on line 5:

```tsx
// REMOVE:
import { toPng } from 'html-to-image';
```

Replace the `toPng` call inside `captureScreenshot` (line 37) with a dynamic import:

```tsx
const { toPng } = await import('html-to-image');
const dataUrl = await toPng(resultsRef.current, {
  backgroundColor: '#111827',
  pixelRatio: 2,
});
```

**Step 2: Lazy-load game-mode components in App.tsx**

Replace static imports for game-mode-only components with `React.lazy()`. These components are only rendered when `mode === 'game'` or tournament is finished:

```tsx
import { lazy, Suspense } from 'react';

// Lazy-loaded game mode components
const TimerDisplay = lazy(() => import('./components/TimerDisplay').then(m => ({ default: m.TimerDisplay })));
const Controls = lazy(() => import('./components/Controls').then(m => ({ default: m.Controls })));
const LevelPreview = lazy(() => import('./components/LevelPreview').then(m => ({ default: m.LevelPreview })));
const PlayerPanel = lazy(() => import('./components/PlayerPanel').then(m => ({ default: m.PlayerPanel })));
const ChipSidebar = lazy(() => import('./components/ChipSidebar').then(m => ({ default: m.ChipSidebar })));
const TournamentStats = lazy(() => import('./components/TournamentStats').then(m => ({ default: m.TournamentStats })));
const RebuyStatus = lazy(() => import('./components/RebuyStatus').then(m => ({ default: m.RebuyStatus })));
const BubbleIndicator = lazy(() => import('./components/BubbleIndicator').then(m => ({ default: m.BubbleIndicator })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TournamentFinished = lazy(() => import('./components/TournamentFinished').then(m => ({ default: m.TournamentFinished })));
```

Remove the corresponding static imports (lines 32-49 selectively — keep setup-only components as static).

Wrap the game-mode `<main>` section with `<Suspense fallback={null}>`:

```tsx
{mode === 'game' ? (
  <Suspense fallback={null}>
    {/* existing game mode content */}
  </Suspense>
) : (
  /* setup mode - no Suspense needed */
)}
```

**Step 3: Run lint, test & build, commit**

```bash
npm run lint && npm run test && npm run build
git add src/App.tsx src/components/TournamentFinished.tsx
git commit -m "perf: Lazy-Loading für Game-Mode-Komponenten und html-to-image"
```

**Step 4: Verify bundle splitting**

```bash
ls -la dist/assets/*.js
```

Confirm multiple JS chunks exist instead of the single 341 KB bundle.

---

## Task 4: Theme System — Infrastructure

Create the theme context, provider, hook, and toggle component.

**Files:**
- Create: `src/theme/ThemeContext.tsx`
- Create: `src/theme/useTheme.ts`
- Create: `src/theme/index.ts`
- Create: `src/components/ThemeSwitcher.tsx`
- Modify: `src/main.tsx` (wrap in ThemeProvider)
- Modify: `src/index.css` (dark variant + light/dark body styles)
- Modify: `src/App.tsx:654-655` (add ThemeSwitcher to header)

**Step 1: Create ThemeContext**

Create `src/theme/ThemeContext.tsx`:

```tsx
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'poker-timer-theme';

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      // localStorage unavailable
    }
    return 'system';
  });

  const [systemPref, setSystemPref] = useState<'light' | 'dark'>(getSystemPreference);

  const resolved = mode === 'system' ? systemPref : mode;

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPref(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Step 2: Create useTheme hook**

Create `src/theme/useTheme.ts`:

```tsx
import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

**Step 3: Create index.ts barrel export**

Create `src/theme/index.ts`:

```tsx
export { ThemeProvider } from './ThemeContext';
export { useTheme } from './useTheme';
export type { ThemeMode, ThemeContextValue } from './ThemeContext';
```

**Step 4: Create ThemeSwitcher component**

Create `src/components/ThemeSwitcher.tsx`:

```tsx
import { useTheme, type ThemeMode } from '../theme';

const modes: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'system', label: 'System', icon: '💻' },
  { mode: 'light', label: 'Light', icon: '☀️' },
  { mode: 'dark', label: 'Dark', icon: '🌙' },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700/40">
      {modes.map((m) => (
        <button
          key={m.mode}
          onClick={() => setMode(m.mode)}
          title={m.label}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            mode === m.mode
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
```

**Step 5: Update main.tsx — wrap in ThemeProvider**

```tsx
import { ThemeProvider } from './theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

**Step 6: Configure Tailwind dark mode in index.css**

Add at the top of `index.css`, after the `@import "tailwindcss"`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Step 7: Update body styles in index.css for light/dark**

Replace the current body styles:

```css
body {
  background-color: #ffffff;
  color: #111827;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.dark body {
  background-color: #0a0a0f;
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.02) 0%, transparent 40%);
  color: #e5e7eb;
}
```

Also update scrollbar styles with dark variant.

**Step 8: Add ThemeSwitcher to App.tsx header**

In `App.tsx` line 654-655, add `<ThemeSwitcher />` next to `<LanguageSwitcher />`:

```tsx
<div className="flex items-center gap-2">
  {mode === 'setup' && <ThemeSwitcher />}
  {mode === 'setup' && <LanguageSwitcher />}
  ...
</div>
```

Import `ThemeSwitcher` at top of App.tsx.

**Step 9: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/theme/ src/components/ThemeSwitcher.tsx src/main.tsx src/index.css src/App.tsx
git commit -m "feat: Theme-Infrastruktur — ThemeProvider, useTheme, 3-Wege-Toggle"
```

---

## Task 5: Dark/Light Mode — Convert Components (Batch 1: Layout & Shared)

Convert the structural/layout components and shared components.

**Files:**
- Modify: `src/App.tsx` (header, main layout, checkpoint banner, all inline styles)
- Modify: `src/components/CollapsibleSection.tsx`
- Modify: `src/components/CollapsibleSubSection.tsx`
- Modify: `src/components/LanguageSwitcher.tsx`
- Modify: `src/components/NumberStepper.tsx`

**Conversion pattern** (apply to every hardcoded dark color):

| Current (dark-only) | New (light base + dark variant) |
|---|---|
| `bg-gray-800/40` | `bg-gray-100/80 dark:bg-gray-800/40` |
| `bg-gray-800/80` | `bg-white dark:bg-gray-800/80` |
| `bg-gray-900/50` | `bg-gray-50 dark:bg-gray-900/50` |
| `border-gray-700/40` | `border-gray-200 dark:border-gray-700/40` |
| `border-gray-600/50` | `border-gray-300 dark:border-gray-600/50` |
| `text-white` | `text-gray-900 dark:text-white` |
| `text-gray-200` | `text-gray-800 dark:text-gray-200` |
| `text-gray-300` | `text-gray-700 dark:text-gray-300` |
| `text-gray-400` | `text-gray-500 dark:text-gray-400` |
| `text-gray-500` | `text-gray-400 dark:text-gray-500` |
| `text-gray-600` | `text-gray-300 dark:text-gray-600` |
| `bg-gray-700/80` | `bg-gray-200 dark:bg-gray-700/80` |
| `bg-gray-800` | `bg-gray-100 dark:bg-gray-800` |
| `hover:bg-gray-700` | `hover:bg-gray-200 dark:hover:bg-gray-700` |
| `hover:bg-gray-600` | `hover:bg-gray-300 dark:hover:bg-gray-600` |
| `bg-gray-900/95` (modals) | `bg-white/95 dark:bg-gray-900/95` |
| `shadow-black/20` | `shadow-gray-300/30 dark:shadow-black/20` |
| `backdrop-blur-sm` | keep (works for both) |
| emerald/amber/red colors | keep unchanged (work on both backgrounds) |

**Step 1: Convert App.tsx**

Apply the conversion pattern to the header (line 650), main layout (line 684-688), checkpoint banner (lines 690-713), setup containers, and all inline button styles. This is the largest single file — work section by section.

Key areas:
- Header: `bg-gray-900/50` → `bg-white/90 dark:bg-gray-900/50`, `border-gray-700/30` → `border-gray-200 dark:border-gray-700/30`
- Setup container background
- All text color classes
- Confirm dialog if present

**Step 2: Convert CollapsibleSection.tsx**

```tsx
// Line 14: card wrapper
"bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/40 rounded-xl overflow-hidden shadow-lg shadow-gray-300/30 dark:shadow-black/20"

// Line 19: button hover
"hover:bg-gray-100 dark:hover:bg-gray-700/30"

// Line 22: title text
"text-gray-500 dark:text-gray-400"

// Line 26: open summary
"text-gray-400 dark:text-gray-600"

// Line 33: collapsed summary
"text-gray-500 dark:text-gray-500" (unchanged)
```

**Step 3: Convert CollapsibleSubSection.tsx**

Similar pattern to CollapsibleSection.

**Step 4: Convert LanguageSwitcher.tsx and NumberStepper.tsx**

Apply the button/input conversion patterns.

**Step 5: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/App.tsx src/components/CollapsibleSection.tsx src/components/CollapsibleSubSection.tsx src/components/LanguageSwitcher.tsx src/components/NumberStepper.tsx
git commit -m "feat: Dark/Light Mode — Layout & Shared Components"
```

---

## Task 6: Dark/Light Mode — Convert Components (Batch 2: Setup Components)

**Files:**
- Modify: `src/components/ConfigEditor.tsx`
- Modify: `src/components/PlayerManager.tsx`
- Modify: `src/components/BlindGenerator.tsx`
- Modify: `src/components/ChipEditor.tsx`
- Modify: `src/components/PayoutEditor.tsx`
- Modify: `src/components/RebuyEditor.tsx`
- Modify: `src/components/AddOnEditor.tsx`
- Modify: `src/components/BountyEditor.tsx`
- Modify: `src/components/TemplateManager.tsx`

**Step 1-9: Convert each file**

Apply the same conversion pattern from Task 5 to every file. Focus areas per component:

- **ConfigEditor**: Level row backgrounds (`bg-gray-800/40`→`bg-gray-100/80 dark:bg-gray-800/40`), break rows (amber backgrounds work on both, but border colors may need adjustment), all input fields
- **PlayerManager**: Drag/drop rows, seat numbers, dealer badge, shuffle confirmation
- **BlindGenerator**: Button states, speed selection
- **ChipEditor**: Denomination rows, color palette, color-up schedule
- **PayoutEditor**: Mode toggle, entry rows
- **RebuyEditor/AddOnEditor/BountyEditor**: Toggle buttons, settings sections, border-left accent
- **TemplateManager**: Modal overlay (`bg-black/60`→`bg-black/40 dark:bg-black/60`), modal card, template list items

**Step 10: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/components/ConfigEditor.tsx src/components/PlayerManager.tsx src/components/BlindGenerator.tsx src/components/ChipEditor.tsx src/components/PayoutEditor.tsx src/components/RebuyEditor.tsx src/components/AddOnEditor.tsx src/components/BountyEditor.tsx src/components/TemplateManager.tsx
git commit -m "feat: Dark/Light Mode — Setup-Komponenten"
```

---

## Task 7: Dark/Light Mode — Convert Components (Batch 3: Game Components)

**Files:**
- Modify: `src/components/TimerDisplay.tsx`
- Modify: `src/components/Controls.tsx`
- Modify: `src/components/LevelPreview.tsx`
- Modify: `src/components/PlayerPanel.tsx`
- Modify: `src/components/ChipSidebar.tsx`
- Modify: `src/components/TournamentStats.tsx`
- Modify: `src/components/RebuyStatus.tsx`
- Modify: `src/components/BubbleIndicator.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/TournamentFinished.tsx`

**Step 1-10: Convert each file**

Apply the same conversion pattern. Special considerations:

- **TimerDisplay**: The timer itself should remain high-contrast in both modes. Timer text can stay `text-white dark:text-white` in dark and `text-gray-900` in light. Progress bar emerald/amber gradients work in both modes.
- **Controls**: Play/pause emerald gradient buttons work in both modes. Gray secondary buttons need conversion.
- **PlayerPanel**: Elimination, rebuy tracking — keep red/amber semantic colors, convert gray backgrounds.
- **SettingsPanel**: Checkboxes (emerald gradient — works), keyboard shortcut keycaps need conversion.
- **TournamentFinished**: Winner celebration, standings table, bounty results — keep amber/emerald accents, convert gray card backgrounds.

**Step 2: Run lint & test, commit**

```bash
npm run lint && npm run test
git add src/components/TimerDisplay.tsx src/components/Controls.tsx src/components/LevelPreview.tsx src/components/PlayerPanel.tsx src/components/ChipSidebar.tsx src/components/TournamentStats.tsx src/components/RebuyStatus.tsx src/components/BubbleIndicator.tsx src/components/SettingsPanel.tsx src/components/TournamentFinished.tsx
git commit -m "feat: Dark/Light Mode — Game-Komponenten"
```

---

## Task 8: Dark/Light Mode — Animations & Final Polish

**Files:**
- Modify: `src/index.css` (keyframe animations for light mode)
- Modify: `src/theme/ThemeContext.tsx` (PWA theme-color meta tag update)

**Step 1: Update CSS animations for light mode**

The `timer-glow` and `countdown-pulse` animations use hardcoded RGBA values for text-shadow. These need light-mode variants. Either:
- Use CSS custom properties for the glow colors, or
- Accept that the glow effects are subtle enough to work on light backgrounds too

The body gradient is already handled (Task 4 Step 7). Scrollbar colors need a light variant:

```css
::-webkit-scrollbar-thumb {
  background: #d1d5db;
}
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
.dark ::-webkit-scrollbar-thumb {
  background: #374151;
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
```

**Step 2: Update PWA theme-color dynamically**

In `ThemeContext.tsx`, update the `<meta name="theme-color">` when theme changes:

```tsx
useEffect(() => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#111827' : '#ffffff');
  }
}, [resolved]);
```

**Step 3: Add new translation keys**

In `src/i18n/translations.ts`, add:

```ts
// DE:
'theme.system': 'System',
'theme.light': 'Hell',
'theme.dark': 'Dunkel',

// EN:
'theme.system': 'System',
'theme.light': 'Light',
'theme.dark': 'Dark',
```

Update `ThemeSwitcher` to use `t()` for labels.

**Step 4: Full visual test**

```bash
npm run dev
```

Test in browser:
- Toggle between System/Light/Dark
- Check all setup sections in both modes
- Start a game and check timer, controls, sidebars
- Check modals (TemplateManager, confirm dialogs)
- Check tournament finished screen
- Test on mobile viewport

**Step 5: Run full CI pipeline locally**

```bash
npm run lint && npm run test && npm run build
```

**Step 6: Commit final polish**

```bash
git add -A
git commit -m "feat: Dark/Light Mode — Animationen, PWA-Theme & Feinschliff"
```

---

## Task 9: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Step 1: Update CLAUDE.md**

- Add `ThemeSwitcher`, `ThemeSwitcher`, `NumberStepper`, `ChevronIcon` to component list
- Add `src/theme/` to project structure
- Add `poker-timer-theme` to localStorage keys
- Update version to 2.0.0
- Update test count if changed
- Add theme system to Architecture & Patterns section
- Add NumberStepper to Component Conventions
- Update Styling section with light/dark system

**Step 2: Update CHANGELOG.md**

Add v2.0.0 entry with all changes.

**Step 3: Update README.md**

Add dark/light mode to features list, update component count, project structure.

**Step 4: Update package.json version**

```bash
npm version minor --no-git-tag-version
```

**Step 5: Final commit**

```bash
npm run lint && npm run test && npm run build
git add -A
git commit -m "docs: Dokumentation für v2.0.0 — Theme, Stepper, Chevrons, Performance"
```
