# UI Improvements Design — 2026-03-03

## Overview

Four improvements to the Poker Tournament Timer:

1. Larger, more visible chevron arrows for collapsible sections
2. Custom +/- number stepper replacing native browser spinners
3. Page load performance optimization
4. Dark/Light mode with system default

## 1. Chevrons — Larger & More Visible

**Problem:** Unicode triangles (`▾`/`▸`) at `text-xs text-gray-500` are nearly invisible on the dark background.

**Solution:** Replace with inline SVG chevrons.

- Size: `w-4 h-4` (16px) — 2.5x larger than current
- Color: `text-gray-400` default, `text-gray-200` on hover (light mode: `text-gray-500` / `text-gray-700`)
- Rotation animation: `transition-transform duration-200` with `rotate-90` for collapsed state
- Affected files: `CollapsibleSection.tsx`, `CollapsibleSubSection.tsx`, `ChipSidebar.tsx`, `TemplateManager.tsx`, `TournamentFinished.tsx`

## 2. Custom Number Stepper

**Problem:** Native `<input type="number">` spinners are tiny, inconsistent across browsers, and don't match the premium UI.

**Solution:** New reusable `NumberStepper` component.

- Layout: `[−]` `[input]` `[+]` horizontal group
- Buttons: `w-8 h-8` minimum touch target, emerald gradient style, `active:scale-[0.97]`
- Input: centered value, manual entry still possible, native spinner hidden via CSS
- Step values: preserved per-field (1 for currency, 1000 for chips, etc.)
- Long-press: hold button to auto-increment (accelerating interval)
- Props: `value`, `onChange`, `min`, `max`, `step`, `label`, `className`
- Native spinner hidden: `-webkit-appearance: none` / `-moz-appearance: textfield`
- Dark/light: buttons and input adapt via `dark:` classes

Affected files: All ~20 `<input type="number">` instances across `App.tsx`, `PlayerManager.tsx`, `ConfigEditor.tsx`, `RebuyEditor.tsx`, `AddOnEditor.tsx`, `BountyEditor.tsx`, `PayoutEditor.tsx`, `ChipEditor.tsx`.

## 3. Performance Optimization

**Current state:** Single 341 KB JS bundle, no code splitting, no lazy loading.

### 3a. Lazy-load html-to-image

`TournamentFinished.tsx` is the only consumer. Dynamic `import('html-to-image')` at usage point instead of static import.

### 3b. Code Splitting — Game Mode Components

Game-mode components are only needed after tournament starts. Lazy-load them with `React.lazy()` + `Suspense`:

- `TimerDisplay`, `Controls`, `PlayerPanel`, `ChipSidebar`, `LevelPreview`
- `TournamentStats`, `RebuyStatus`, `BubbleIndicator`, `SettingsPanel`
- `TournamentFinished`

### 3c. Vite Compression

Add `vite-plugin-compression` for gzip pre-compression of assets.

## 4. Dark/Light Mode

**Current state:** Hardcoded dark theme, no CSS variables, no `dark:` prefixes. Colors spread across ~20 component files.

### Architecture

- **Tailwind `dark:` class approach** — base styles are light, `dark:` variants for dark mode
- **3 modes:** System (default), Light, Dark
- **ThemeProvider** React Context + `useTheme()` hook
- **localStorage key:** `poker-timer-theme` (values: `system`, `light`, `dark`)
- **System detection:** `prefers-color-scheme` media query + `matchMedia` change listener
- **Toggle location:** Header area, compact 3-way toggle (icons: sun/moon/monitor)

### Implementation approach

1. Create `ThemeContext.tsx` with provider, hook, and localStorage persistence
2. Apply `class="dark"` on `<html>` element based on resolved theme
3. Wrap `App` in `ThemeProvider` in `main.tsx`
4. Add theme toggle component in header
5. Convert all ~20 component files: current dark colors become `dark:` variants, add light equivalents as base classes

### Light palette

| Element | Light | Dark (existing) |
|---------|-------|-----------------|
| Body bg | `#ffffff` | `#0a0a0f` |
| Card bg | `gray-100/80` | `gray-800/40` |
| Text primary | `gray-900` | `white` / `gray-200` |
| Text secondary | `gray-600` | `gray-400` |
| Text muted | `gray-400` | `gray-500` |
| Borders | `gray-200` / `gray-300` | `gray-700/40` |
| Input bg | `white` | `gray-800/80` |
| Emerald accents | unchanged | unchanged |
| Amber accents | unchanged | unchanged |
| Red accents | unchanged | unchanged |

### Tailwind config

Enable `darkMode: 'class'` in Tailwind config (Tailwind v4 uses CSS, so configure via `@custom-variant dark (&:where(.dark, .dark *))` in index.css or equivalent).

## Scope & Risk

- **Highest effort:** Dark/Light mode (~20 files, ~200+ class additions)
- **Medium effort:** NumberStepper (~10 files, new component)
- **Low effort:** Chevrons (5 files, drop-in replacement)
- **Low effort:** Performance (3 changes, minimal risk)
- **No logic changes** — all business logic in `domain/` is untouched
- **No new dependencies** except `vite-plugin-compression` (dev only)
