# CLAUDE.md — Pokern up de Hüh

## Project Overview

Poker tournament timer — a fully client-side React/TypeScript SPA for managing home poker tournaments. Handles blind levels, timers, player tracking, rebuys, bounties, and payouts. No server required, all data persisted in localStorage.

**Version**: 1.1.0
**Live**: Deployed to GitHub Pages at `/Pokernupdehueh/`

## Tech Stack

- **React 19** with TypeScript (~5.9) in strict mode
- **Vite 7** — build tool and dev server
- **Tailwind CSS 4** — utility-first styling via Vite plugin (no separate CSS files)
- **Vitest** — unit testing with `@testing-library/react` and `jsdom`
- **ESLint 9** — flat config with typescript-eslint, react-hooks, react-refresh plugins
- **No external state library** — React hooks + props + Context (i18n only)
- **No CSS-in-JS** — pure Tailwind utility classes

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript compile + Vite bundle → dist/
npm run lint         # ESLint check
npm run test         # Vitest run (82 tests, single run)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build locally
```

**CI pipeline** (`.github/workflows/deploy.yml`): install → lint → test → build → deploy to GitHub Pages (Node 20).

## Project Structure

```
src/
├── App.tsx                      # Root component: setup/game mode switching, central state
├── main.tsx                     # React entry point, wraps app in LanguageProvider
├── index.css                    # Tailwind base imports
├── components/                  # UI components (one export per file)
│   ├── BountyEditor.tsx         # Bounty amount configuration
│   ├── ConfigEditor.tsx         # Blind level table editor
│   ├── Controls.tsx             # Play/Pause/Next/Prev/Reset/Restart buttons
│   ├── ImportExportModal.tsx    # JSON import/export dialog
│   ├── LanguageSwitcher.tsx     # DE/EN toggle
│   ├── LevelPreview.tsx         # Next-level sidebar
│   ├── PayoutEditor.tsx         # Prize distribution config
│   ├── PlayerManager.tsx        # Add/edit/delete players
│   ├── PlayerPanel.tsx          # Active players, elimination, bounty tracking
│   ├── PresetPicker.tsx         # Turbo/Standard/Deep Stack presets
│   ├── RebuyEditor.tsx          # Rebuy limit config
│   ├── RebuyStatus.tsx          # Rebuy active indicator
│   ├── SettingsPanel.tsx        # Sound, countdown, auto-advance, fullscreen
│   ├── TimerDisplay.tsx         # Main timer, blinds display, progress bar
│   └── TournamentFinished.tsx   # Results & payout display
├── domain/                      # Business logic (no React imports)
│   ├── types.ts                 # All TypeScript interfaces and type aliases
│   ├── logic.ts                 # Core logic (~595 lines): validation, payouts, presets, persistence
│   └── sounds.ts                # Web Audio API sound effects (beeps, victory melody)
├── hooks/
│   └── useTimer.ts              # Drift-free timer hook (wall-clock based, 100ms tick)
└── i18n/                        # Lightweight custom i18n (no react-i18next)
    ├── index.ts                 # Public re-exports
    ├── LanguageContext.tsx       # React Context provider, localStorage persistence
    ├── languageContextValue.ts  # Context value type
    ├── translations.ts          # DE/EN translation strings (~400+ keys)
    └── useTranslation.ts        # Hook: t(key, params) + language state

tests/
└── logic.test.ts                # 82 unit tests for domain/logic.ts
```

## Architecture & Patterns

### State Management
- **App.tsx** owns all tournament state (config, settings, mode) via `useState`
- **useTimer** hook manages timer state with drift-free wall-clock computation
- **Props drilling** for passing state and callbacks to child components
- **React Context** used only for i18n (language selection)
- **localStorage keys**: `poker-timer-config`, `poker-timer-settings`, `poker-timer-language`

### Component Conventions
- Functional components with hooks only (no class components)
- Props interface defined as `Props` type above each component
- Destructured props in function signature: `export function Foo({ bar, baz }: Props)`
- Single named export per file (no default exports)
- `useCallback` for stable handler references, `useMemo` for derived values

### Domain Logic Separation
- `src/domain/` contains pure business logic with no React dependencies
- `src/domain/types.ts` — all shared types (`Level`, `TournamentConfig`, `Player`, `Settings`, `TimerState`, etc.)
- `src/domain/logic.ts` — grouped by responsibility: formatting, timing, navigation, validation, players, payouts, rebuys, bounties, antes, presets, persistence
- Tests cover `logic.ts` exclusively — UI tests are not currently present

### i18n
- Two languages: German (DE, default) and English (EN)
- `useTranslation()` hook returns `{ t, language, setLanguage }`
- `t('key')` or `t('key', { n: 5 })` for parameterized strings (template vars: `{n}`, `{place}`, etc.)
- All user-facing strings must go through `t()` — no hardcoded UI text

### Styling
- Tailwind utility classes exclusively — no custom CSS classes, no CSS modules
- Dark theme: `gray-900` bg, `gray-800`/`gray-700` panels
- Color palette: emerald (active/success), amber (breaks/warnings), red (danger/elimination)
- Responsive: mobile-first, `sm:` and `lg:` breakpoints, flex layouts
- No component library (fully custom UI)

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `TimerDisplay`, `PlayerPanel` |
| Functions | camelCase | `computeRemaining`, `validateConfig` |
| Types/Interfaces | PascalCase | `TournamentConfig`, `TimerState` |
| Files | Match export name | `TimerDisplay.tsx`, `logic.ts` |
| Translation keys | dot.separated | `setup.players.title`, `game.timer.paused` |
| localStorage keys | kebab-case | `poker-timer-config` |

## Key Implementation Details

- **Drift-free timer**: Uses `Date.now()` wall-clock timestamps, not interval counters
- **Sound**: Web Audio API oscillators — no external audio files
- **Keyboard shortcuts** (in App.tsx): Space (play/pause), N (next level), V (previous), R (reset)
- **Ante calculation**: Auto ~12.5% of big blind, rounded to "nice" values
- **Import/export**: Full config as JSON with backward compatibility for old formats
- **Offline-first**: Zero network dependencies at runtime

## Testing

- Tests live in `tests/logic.test.ts` covering `src/domain/logic.ts`
- Use Vitest with globals mode (`describe`, `it`, `expect` available without imports)
- Run `npm run test` before committing — CI will fail on test failures
- When modifying `logic.ts`, add or update corresponding tests
- No snapshot tests, no E2E tests currently

## Development Workflow

1. `npm install` to set up dependencies
2. `npm run dev` for local development with hot reload
3. Make changes — all UI text through `t()`, all styling via Tailwind classes
4. `npm run lint` to check code style
5. `npm run test` to verify logic
6. `npm run build` to verify production build succeeds

## Gotchas

- The Vite base path is `/Pokernupdehueh/` — asset URLs must be relative or respect this base
- TypeScript strict mode is on — no implicit any, strict null checks enforced
- ESLint uses flat config format (not `.eslintrc`) in `eslint.config.js`
- The project language is bilingual — commit messages and docs are in German, code and comments are in English
- Default player names change when the language is switched (DE: "Spieler 1", EN: "Player 1")
