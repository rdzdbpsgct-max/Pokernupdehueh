# CLAUDE.md — Pokern up de Hüh

## Project Overview

Poker tournament timer — a fully client-side React/TypeScript SPA for managing home poker tournaments. Handles blind levels, timers, player tracking, rebuys, bounties, chip management, and payouts. No server required, all data persisted in localStorage.

**Version**: 2.10.0
**Live**: Deployed to [GitHub Pages](https://rdzdbpsgct-max.github.io/Pokernupdehueh/) and [Vercel](https://pokernupdehueh.vercel.app/)

## Tech Stack

- **React 19** with TypeScript (~5.9) in strict mode
- **Vite 7** — build tool and dev server
- **Tailwind CSS 4** — utility-first styling via Vite plugin (no separate CSS files)
- **Vitest** — unit testing with `@testing-library/react` and `jsdom`
- **ESLint 9** — flat config with typescript-eslint, react-hooks, react-refresh plugins
- **No external state library** — React hooks + props + Context (i18n, theme)
- **No CSS-in-JS** — pure Tailwind utility classes + custom `@keyframes`, `@utility`, CSS custom properties, and body gradient in `index.css`

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173/)
npm run build        # TypeScript compile + Vite bundle → dist/
npm run lint         # ESLint check
npm run test         # Vitest run (239 tests, single run)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build locally
```

**CI/CD pipelines**:
- **GitHub Pages** (`.github/workflows/deploy.yml`): install → lint → test → build (with `VITE_BASE_PATH=/Pokernupdehueh/`) → deploy to GitHub Pages (Node 20)
- **Vercel**: Auto-deploy on push to `main`, builds with default base `/`

## Project Structure

```
src/
├── App.tsx                      # Root component: game mode, central state, timer, keyboard shortcuts
├── main.tsx                     # React entry point, wraps app in ThemeProvider + LanguageProvider
├── index.css                    # Tailwind base imports, @keyframes animations, @utility classes, CSS custom properties, body gradient
├── components/                  # UI components (one export per file)
│   ├── AddOnEditor.tsx          # Add-On config (requires Rebuy, auto-disable)
│   ├── BlindGenerator.tsx       # Blind structure generator (3 speeds, chip-aware)
│   ├── BountyEditor.tsx         # Bounty amount configuration
│   ├── ChevronIcon.tsx          # Reusable SVG chevron with rotation animation
│   ├── ChipEditor.tsx           # Chip denomination management, editable color-up schedule
│   ├── ChipSidebar.tsx          # Game-mode chip info, next color-up display
│   ├── CollapsibleSection.tsx   # Reusable collapsible card for setup sections
│   ├── CollapsibleSubSection.tsx # Lighter collapsible for nesting inside cards
│   ├── ConfigEditor.tsx         # Blind level table editor
│   ├── Controls.tsx             # Play/Pause/Next/Prev/Reset/Restart buttons
│   ├── DisplayMode.tsx          # TV/Projector display with 5 rotating screens (players, stats, payout, schedule, chips)
│   ├── ErrorBoundary.tsx        # React error boundary with reload fallback
│   ├── LanguageSwitcher.tsx     # DE/EN toggle
│   ├── LevelPreview.tsx         # Next-level sidebar
│   ├── NumberStepper.tsx        # Custom +/- stepper with long-press support
│   ├── PayoutEditor.tsx         # Prize distribution config
│   ├── PlayerManager.tsx        # Add/edit/delete/seat players with drag & drop
│   ├── PlayerPanel.tsx          # Active players, elimination, bounty tracking
│   ├── RebuyEditor.tsx          # Rebuy limit config
│   ├── RebuyStatus.tsx          # Rebuy active indicator
│   ├── BubbleIndicator.tsx      # Bubble / In The Money visual banner
│   ├── SetupPage.tsx             # Setup mode UI — collapsible sections, config editors, start button
│   ├── SettingsPanel.tsx        # Sound, countdown, auto-advance, fullscreen, volume
│   ├── TemplateManager.tsx      # Save/load/delete tournament templates, JSON import/export
│   ├── ThemeSwitcher.tsx        # System/Light/Dark 3-way toggle
│   ├── VoiceSwitcher.tsx        # Sound/Voice segmented toggle in header
│   ├── TimerDisplay.tsx         # Main timer, blinds display, progress bar
│   ├── TournamentFinished.tsx   # Results & payout display with screenshot/share/text-copy/CSV/QR
│   ├── SharedResultView.tsx     # Read-only modal for QR-shared tournament results
│   ├── TournamentHistory.tsx    # Tournament history modal with standings, player stats, export
│   └── TournamentStats.tsx      # Live stats bar (players, prizepool, avg BB, time)
├── domain/                      # Business logic (no React imports)
│   ├── types.ts                 # All TypeScript interfaces and type aliases
│   ├── logic.ts                 # Core logic (~1640 lines): validation, payouts, blinds, chips, templates, persistence, checkpoint
│   ├── sounds.ts                # Web Audio API sound effects (beeps, victory, bubble, ITM)
│   ├── speech.ts                # Voice announcements — ElevenLabs MP3 (German) + Web Speech API fallback
│   └── audioPlayer.ts           # MP3 playback engine — sequential file playback for pre-recorded audio
├── hooks/
│   ├── useTimer.ts              # Drift-free timer hook (wall-clock based, 100ms tick)
│   ├── useVoiceAnnouncements.ts # Voice announcement effects (extracted from App.tsx)
│   └── useGameEvents.ts         # Game event effects: victory, bubble, ITM sounds
├── theme/                       # Dark/Light mode system
│   ├── index.ts                 # Public re-exports
│   ├── ThemeContext.tsx          # React Context provider, system preference listener, localStorage persistence
│   ├── themeContextValue.ts     # Context value type + ThemeMode type
│   └── useTheme.ts              # Hook: mode, setMode, resolved
└── i18n/                        # Lightweight custom i18n (no react-i18next)
    ├── index.ts                 # Public re-exports
    ├── LanguageContext.tsx       # React Context provider, localStorage persistence
    ├── languageContextValue.ts  # Context value type
    ├── translations.ts          # DE/EN translation strings (~560+ keys)
    └── useTranslation.ts        # Hook: t(key, params) + language state

tests/
└── logic.test.ts                # 222 unit tests for domain/logic.ts

public/
├── favicon.svg                  # Spade symbol favicon
├── pwa-192x192.png              # PWA icon 192×192
└── pwa-512x512.png              # PWA icon 512×512 (+ maskable)
```

## Architecture & Patterns

### State Management
- **App.tsx** owns all tournament state (config, settings, mode) via `useState`
- **useTimer** hook manages timer state with drift-free wall-clock computation
- **Props drilling** for passing state and callbacks to child components
- **React Context** for i18n (language selection) and theme (dark/light mode)
- **localStorage keys**: `poker-timer-config`, `poker-timer-settings`, `poker-timer-language`, `poker-timer-templates`, `poker-timer-checkpoint`, `poker-timer-theme`, `poker-timer-history`

### Component Conventions
- Functional components with hooks only (no class components)
- Props interface defined as `Props` type above each component
- Destructured props in function signature: `export function Foo({ bar, baz }: Props)`
- Single named export per file (no default exports)
- `useCallback` for stable handler references, `useMemo` for derived values

### Domain Logic Separation
- `src/domain/` contains pure business logic with no React dependencies
- `src/domain/types.ts` — all shared types (`Level`, `TournamentConfig`, `Player`, `Settings`, `TimerState`, etc.)
- `src/domain/logic.ts` — grouped by responsibility: formatting, timing, navigation, validation, players, payouts, rebuys, bounties, antes, blind generation, chip management, persistence
- Tests cover `logic.ts` exclusively — UI tests are not currently present

### i18n
- Two languages: German (DE, default) and English (EN)
- `useTranslation()` hook returns `{ t, language, setLanguage }`
- `t('key')` or `t('key', { n: 5 })` for parameterized strings (template vars: `{n}`, `{place}`, etc.)
- All user-facing strings must go through `t()` — no hardcoded UI text

### Styling
- Tailwind utility classes + custom `@keyframes` and `@utility` in `index.css` — no CSS modules, no CSS-in-JS
- **Dark/Light mode**: `@custom-variant dark (&:is(.dark *))` in `index.css`; class-based via `.dark` on `<html>`; every component uses `dark:` variants (e.g., `bg-gray-100/80 dark:bg-gray-800/40`)
- Light theme: `#f9fafb` body, `#111827` text. Dark theme: `#0a0a0f` body with subtle emerald radial-gradient, `#e5e7eb` text
- CSS custom properties: `--timer-glow-color` / `--timer-glow-color-strong` for theme-aware animation colors
- Color palette: emerald (active/success), amber (breaks/warnings), red (danger/elimination)
- Glassmorphism: `backdrop-blur-sm`, soft shadows (`shadow-lg shadow-gray-300/30 dark:shadow-black/20`), semi-transparent backgrounds
- Buttons: `bg-gradient-to-b` for tactile feel, `active:scale-[0.97]` feedback, `shadow-lg` depth
- Animations: `animate-fade-in` (content), `animate-timer-glow` (running timer), `animate-countdown-pulse`, `animate-scale-in` (modals), `animate-bubble-pulse`/`animate-itm-flash`/`animate-addon-pulse`
- Design system hierarchy: Rounding (`rounded-2xl` > `rounded-xl` > `rounded-lg` > `rounded-md`), borders (`border-gray-200 dark:border-gray-700/40` standard), focus (`ring-2 ring-emerald-500/25`)
- Inputs: Global pattern — `bg-white dark:bg-gray-800/80`, `border-gray-300 dark:border-gray-700/60`, `focus:ring-2 focus:ring-emerald-500/25`, `rounded-lg`
- NumberStepper: Custom `+`/`-` buttons with long-press support (400ms delay, 100ms repeat), replaces native number input spinners
- Scrub slider: Custom `ScrubSlider` component in `TimerDisplay.tsx` — mirrors progress bar styling (emerald/amber gradient, glow thumb, pointer events for drag)
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
- **Sound**: Web Audio API oscillators — no external audio files. Sound functions return Promises for precise voice coordination (victory: 1700ms, bubble: 1450ms, ITM: 700ms)
- **Voice announcements**: Triple-fallback system — ElevenLabs pre-recorded MP3s (German: Ava, English: voice `xctasy8XvGp2cVO9HL9k`), HTMLAudioElement fallback, Web Speech API (`speechSynthesis`) as last resort. 225 MP3 files per language in `public/audio/de/` and `public/audio/en/` (450 total, PWA-cached for offline use). `audioPlayer.ts` handles gapless sequential MP3 playback via Web Audio API with trailing-silence trimming, falls back to HTMLAudioElement for maximum browser compatibility; `speech.ts` unified queue supports both `audio` and `speech` items. Manifest-based file lookup (110 blind pairs, 20 ante values, 25 levels, 30 break durations 1–30 min) determines MP3 availability; falls back to Web Speech API for missing files or dynamic content (player names). `VoiceSwitcher` header toggle (sound-only / voice). Announces: tournament start ("Shuffle up and deal!"), level changes, breaks (start + 30s warning + break over), 5-minute warning, last hand (before break / end of level), bubble, dynamic player count milestones (based on paid places — announces from paidPlaces down to 3 + heads-up), ITM, eliminations, tournament winner, add-on, rebuy end, color-up (+ next-break warning), timer paused/resumed. Verbal countdown for last 10 seconds (play levels only, beeps during breaks). Sound effects finish before voice starts (delay-based coordination).
- **Keyboard shortcuts** (in App.tsx): Space (play/pause), N (next level), V (previous), R (reset), F (clean view toggle), L (last hand toggle), T (TV display mode toggle), H (hand-for-hand toggle)
- **TV Display Mode**: Dedicated fullscreen overlay (`DisplayMode.tsx`) optimized for projectors/TVs at 3+ meter distance. Split-layout: **Timer always visible** (top ~55% — level label, blinds, countdown, progress bar, next level preview, banners) + **5 rotating secondary screens** (bottom ~45% — Players → Stats → Payout → Blind Schedule → Chips, every 15 seconds). Players screen: active grid with CL badge, rebuys, eliminated compact. Stats screen: prizepool, active players, avg BB, elapsed/remaining, rebuys, add-ons, bounty pool. Payout screen: places with amounts, medal emojis top 3, bubble indicator. Dark background, large timer (8rem). Manual navigation via arrow keys. Indicator dots for secondary screens. Exit via T/Escape. Lazy-loaded (~13.5 KB chunk). 📺 button in header during game mode.
- **Ante calculation**: Two modes — Standard (~12.5% of big blind, rounded to "nice" values) or Big Blind Ante (BBA, ante = big blind). Toggle in setup when ante is enabled. `AnteMode` type in `types.ts`
- **Blind structure generator**: 3 speeds (fast/normal/slow) with distinct BB progressions scaled from 20k reference; chip-aware rounding via `roundToChipMultiple()` when denominations are active
- **Chip management**: Editable color-up schedule with auto-suggestion; color-up events coupled with next break; duplicate color warnings; auto-sort by value
- **Chip-blind compatibility**: `checkBlindChipCompatibility()` detects blind values not expressible with current chip denominations
- **Duration estimates**: Factor in player count to estimate realistic tournament length
- **Import/export**: Full config as JSON with backward compatibility for old formats (integrated into TemplateManager)
- **Tournament templates**: Save/load/delete named configs via localStorage or local JSON files (File System Access API with download fallback)
- **Clean View**: Toggle to hide stats, sidebars, and secondary controls during game (keyboard: F)
- **Auto-start on level jump**: Timer automatically starts when pressing Next/Previous level
- **Bubble detection**: `isBubble()` and `isInTheMoney()` based on active players vs paid places; `BubbleIndicator` also shows Add-On announcement banner (amber, center-screen) when rebuy phase ends — with break: shown during break + next level (timer runs); without break: timer pauses automatically for add-on
- **Hand-for-Hand mode**: Manual toggle (keyboard: H) during bubble phase. Activates pause/resume cycle — timer pauses, user clicks "Next Hand" to resume, manually pauses after each hand. Red banner in BubbleIndicator and DisplayMode. Voice announcement on activation. Auto-deactivates when bubble bursts.
- **Stack Tracking**: Optional per-player `chips` field in Player interface. "Initialize stacks" button in PlayerPanel computes starting chips + rebuys + add-ons. Inline number input for editing stacks. Chip Leader badge ("C" amber circle). Auto-adjusts on rebuy/add-on/elimination. `initializePlayerStacks()`, `findChipLeader()`, `computeAverageStackFromPlayers()` in logic.ts.
- **Tournament stats**: Live display of players, prizepool, avg stack in BB, elapsed/remaining time
- **Dark/Light mode**: 3-way toggle (System/Light/Dark) in header; `ThemeProvider` manages mode + system preference listener + `dark` class on `<html>`; `useTheme()` hook; `poker-timer-theme` in localStorage; PWA `theme-color` meta tag updated dynamically
- **Code splitting**: Game-mode components lazy-loaded via `React.lazy()` + `Suspense`; `html-to-image` dynamically imported only when capturing screenshots; main bundle ~302KB + ~30KB game chunks
- **SVG Chevrons**: `ChevronIcon` component with CSS rotation animation replaces Unicode triangles for collapsible sections
- **NumberStepper**: Custom `+`/`-` stepper component replaces native number input spinners; long-press support via pointer events (400ms delay, 100ms repeat); optional `snap` function; used across all numeric inputs in setup
- **Screenshot/share**: `html-to-image` (dynamic import) capture → Web Share API (mobile) or PNG download (desktop); theme-aware background color
- **QR codes**: Two QR codes on TournamentFinished screen — App-URL (static, Vercel link) and tournament result data (compact pipe-delimited format in URL hash `#r=`). `TournamentResult` passed directly as prop from App.tsx (not read from localStorage — avoids timing issues). `qrcode.react` (`QRCodeSVG`) renders inline SVG captured by html-to-image. `encodeResultForQR()` / `decodeResultFromQR()` in logic.ts. `SharedResultView.tsx` modal for viewing shared results. Theme-aware QR colors.
- **PWA**: `vite-plugin-pwa` with auto-update service worker, installable on mobile/desktop
- **Wake Lock**: Screen stays on during active tournament (Wake Lock API, re-acquired on tab focus)
- **Cross-device compatibility**: Safe area insets (notch/gesture-bar), `100dvh` viewport height, `inputmode="numeric"` on all number inputs, webkit fullscreen prefix, localStorage try-catch for private browsing, tablet breakpoint (`md:` at 768px), touch targets ≥32px
- **Progressive disclosure in setup**: `CollapsibleSection` card component wraps each setup section; essential sections (Tournament Basics, Players, Blinds) open by default, optional sections (Chips, Payout, Rebuy/Add-On/Bounty) collapsed with summary text; `CollapsibleSubSection` for nested collapsibles inside cards (BlindGenerator, Level Table); Tournament Name + Buy-In merged into "Turnier-Grundlagen" card; Rebuy/Add-On/Bounty grouped into one card; Summary badges visible as subtitles even on open sections
- **Tournament checkpoint**: Auto-save game state to localStorage on every action in game mode; on restart, offer to resume with timer always paused (timestamps invalid after reload)
- **Accessibility**: ARIA roles/labels on timer, controls, modals, collapsible sections; auto-focus and Escape-to-close on dialogs
- **Premium UI**: Glassmorphism (`backdrop-blur-sm`, soft shadows), gradient buttons (`bg-gradient-to-b`), custom animations (9 `@keyframes` in `index.css`), tactile feedback (`active:scale-[0.97]`), timer glow (`animate-timer-glow`), dual body gradient, focus glow on all inputs, custom scrub slider matching progress bar, card hover glow, table row hover states
- **Clock display**: Real-time clock in game mode header, updated every 30 seconds via `setInterval`
- **Last Hand**: Toggle button (L key) + amber banner via `BubbleIndicator`, voice announcement via `announceLastHand()` (distinguishes before-break vs end-of-level), auto-reset on level change
- **Dealer auto-rotation**: `advanceDealer()` in logic.ts skips eliminated players with wrap-around; button in PlayerPanel header
- **ErrorBoundary**: React class component in `main.tsx` wrapping entire app; catches lazy-load failures and render errors; hardcoded English fallback UI with reload button
- **Tournament history**: Persistent result storage in `poker-timer-history` (localStorage, max 50 entries). Auto-save on tournament finish. `TournamentHistory.tsx` modal with expandable standings, player statistics tab (`computePlayerStats` aggregation by normalized name), text export (WhatsApp-friendly), CSV download. Accessible from setup header "Historie" button.
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

## Documentation Sync

When making changes to the project, **always update all three documentation files**:
- **CLAUDE.md** — Technical reference for AI-assisted development (this file)
- **README.md** — Public-facing GitHub project page (features, badges, structure)
- **CHANGELOG.md** — Human-readable changelog with all version history

Version numbers, test counts, feature lists, and project structure must stay in sync.

## Gotchas

- The Vite base path is configurable via `VITE_BASE_PATH` env var (defaults to `/`). GitHub Actions sets it to `/Pokernupdehueh/` for GitHub Pages; Vercel uses the default `/`. Never hardcode base paths in `index.html` — Vite prepends the base during build
- TypeScript strict mode is on — no implicit any, strict null checks enforced
- ESLint uses flat config format (not `.eslintrc`) in `eslint.config.js`
- The project language is bilingual — commit messages and docs are in German, code and comments are in English
- Default player names change when the language is switched (DE: "Spieler 1", EN: "Player 1")
- PresetPicker was removed in v1.2.0 — blind structures are now generated via BlindGenerator
- When chips are enabled, the blind generator uses the smallest chip denomination as rounding base

## Changelog

### v2.10.0 — Phase 1: Foundation & Quick Wins

- **SetupPage Refactoring**: App.tsx von 1465 auf 1102 Zeilen reduziert. Neue `SetupPage.tsx` (406 Zeilen).
- **Per-Player Rebuy Cap**: `maxRebuysPerPlayer` in RebuyConfig, `canPlayerRebuy()` Helper.
- **Late Registration**: `LateRegistrationConfig`, `isLateRegistrationOpen()`, Spieler während Turnier hinzufügen.
- **Benannte Pausen**: `Level.label` im DisplayMode + Voice-Ansage.
- **Lautstärke-Regler**: Master Volume (0–100%), Range-Slider im SettingsPanel.
- **Bug-Fixes**: Sidebar i18n, `formatResultAsText` Locale, dynamische QR-URL.
- **Neue Datei**: `src/components/SetupPage.tsx`
- **24 Translation-Keys**, **7 neue Tests** — **239 Tests gesamt**.

### v2.9.4 — TV-Modus: 5 rotierende Screens

- **3 neue TV-Screens**: Spieler, Stats, Auszahlung im TV/Projector-Display. 5 rotierende Screens: Spieler → Stats → Auszahlung → Blindstruktur → Chips.
- **8 neue Props** an DisplayMode, **~15 neue Translation-Keys** pro Sprache.
- **232 Tests**, Lint + Build bestanden.

### v2.9.3 — Sprachausgabe: Elimination + Hand-for-Hand MP3

- **Spieler-Elimination Ansage**: `announceElimination(t)` spielt jetzt MP3 „Ein Spieler ist ausgeschieden!" statt leer. Wird bei jeder Elimination getriggert (vor Bounty-Ansage).
- **Hand-for-Hand MP3**: `announceHandForHand()` nutzt jetzt ElevenLabs MP3 statt reinem Web Speech API Fallback.
- **4 neue MP3-Dateien**: `hand-for-hand.mp3` + `player-eliminated.mp3` je DE + EN. **450 Audio-Dateien** (225 pro Sprache).
- **Translation-Key**: `voice.playerEliminated` von dynamisch zu generisch geändert.

### v2.9.2 — QR-Code Vereinfachung

- **Ergebnis-QR-Code entfernt**: Nur noch statischer App-QR-Code. `encodeResultForQR()` und `QR_BASE_URL` aus logic.ts entfernt. `decodeResultFromQR()` bleibt für bestehende `#r=`-Links.
- **App-QR-Code auf Setupseite**: QR-Code zur App-URL wird jetzt auch auf der Setupseite unterhalb des Start-Buttons angezeigt.
- **Translation-Keys**: 2 entfernt (`finished.qrCodes`, `finished.qrResult`). 1 Test entfernt, 1 umgeschrieben — **232 Tests gesamt**

### v2.9.1 — Bug-Fixes: QR-Code + TV-Modus

- **QR-Code Timing-Fix**: Ergebnis-QR-Code wurde nie angezeigt (localStorage-Timing-Bug). Fix: `TournamentResult` als Prop übergeben statt aus localStorage lesen. Text-Kopieren und CSV-Download nutzen ebenfalls Prop direkt.
- **TV-Modus Split-Layout**: Timer + Blinds permanent im oberen Bereich (~55%), nur unterer Bereich rotiert zwischen Blind-Schedule (8 kompakte Zeilen) und Chip-Werten. Vorher: gesamter Screen rotierte, Timer 2/3 der Zeit nicht sichtbar.
- **App.tsx**: Neues `finishedResult` Memo, als Prop an TournamentFinished übergeben.

### v2.9.0 — Hand-for-Hand Mode + Stack Tracking

- **Hand-for-Hand Mode**: Manueller Toggle (Tastenkürzel: H) während der Bubble-Phase. Roter Banner in BubbleIndicator und DisplayMode. „Nächste Hand"-Button startet Timer, User pausiert manuell. Voice-Ansage (`announceHandForHand`) bei Aktivierung via Web Speech API. Deaktiviert sich automatisch wenn Bubble platzt.
- **Stack Tracking pro Spieler**: Optionales `chips?: number` Feld im Player-Interface. `initializePlayerStacks()` berechnet Starting-Stack + Rebuys + Add-Ons. `findChipLeader()` findet den Spieler mit den meisten Chips. `computeAverageStackFromPlayers()` berechnet Durchschnitt aus individuellen Stacks. Inline-Zahleneingabe im PlayerPanel. Chip-Leader-Badge (amber „C"-Kreis). Auto-Adjustment bei Rebuy/Add-On/Elimination. Backward-kompatibel via `parseConfigObject`.
- **28 neue Translation-Keys** (14 DE + 14 EN): Hand-for-Hand (8 pro Sprache), Stack Tracking (5 pro Sprache), Voice (1 pro Sprache)
- **11 neue Tests**: Stack-Tracking-Funktionen — **233 Tests gesamt**

### v2.8.0 — QR-Codes auf dem Ergebnis-Screen

- **QR-Code App-URL**: Statischer QR-Code auf dem Ergebnis-Screen verlinkt zur App (Vercel-URL). Andere Spieler können die App direkt installieren.
- **QR-Code Turnierergebnis**: Dynamischer QR-Code kodiert Turnierergebnis kompakt (Pipe-delimited Format in URL-Hash `#r=`). Empfänger sieht Ergebnisse in der App.
- **SharedResultView**: Neues read-only Modal zeigt geteilte Turnierergebnisse (Standings, Turnier-Info). Wird automatisch geöffnet wenn App mit `#r=` Hash aufgerufen wird.
- **Kompakte Kodierung**: `encodeResultForQR()` / `decodeResultFromQR()` — 8-Spieler-Turnier in ~375 Bytes URL-encoded. Pipe-delimited Header + Semicolon-delimited Players.
- **Theme-aware QR**: `QRCodeSVG` aus `qrcode.react` mit angepassten Farben für Dark/Light Mode. Inline SVG wird von `html-to-image` korrekt in Screenshots erfasst.
- **Neue Dependency**: `qrcode.react` (~13KB gzip, im TournamentFinished-Chunk)
- **Neue Datei**: `src/components/SharedResultView.tsx` (~120 Zeilen)
- **12 neue Translation-Keys** (6 DE + 6 EN): `finished.qrCodes/qrApp/qrResult`, `shared.title/close/invalidData`
- **4 neue Tests**: encodeResultForQR URL-Format, Round-Trip encode/decode, Invalid-Input-Handling — **222 Tests gesamt**

### v2.7.0 — Refactoring + Big Blind Ante

- **Hook-Extraktion `useVoiceAnnouncements()`**: 8 Voice-Announcement-Effects mit Refs aus App.tsx in eigenen Hook extrahiert (~200 Zeilen). Returns `{ reset }` Callback. App.tsx um ~160 Zeilen reduziert.
- **Hook-Extraktion `useGameEvents()`**: Victory-Sound/Pause, Bubble-Sound, ITM-Sound/Flash in eigenen Hook extrahiert (~100 Zeilen). Verwaltet `showItmFlash` State intern. Returns `{ showItmFlash, reset }`.
- **Big Blind Ante (BBA)**: Neuer `AnteMode`-Typ (`'standard' | 'bigBlindAnte'`) in TournamentConfig. BBA-Modus setzt Ante = Big Blind (WSOP/EPT-Standard). Segmentierter Toggle im Setup (Standard / Big Blind Ante), nur sichtbar wenn Ante aktiviert. TimerDisplay zeigt „BBA" statt „Ante". Backward-kompatibles Parsing in `parseConfigObject`.
- **App.tsx Reduktion**: Von ~1500 auf ~1284 Zeilen durch Hook-Extraktion.
- **2 neue Dateien**: `src/hooks/useVoiceAnnouncements.ts`, `src/hooks/useGameEvents.ts`
- **6 neue Translation-Keys** (3 DE + 3 EN): `app.anteStandard`, `app.anteBBA`, `timer.bba`
- **4 neue Tests**: BBA computeDefaultAnte, Standard mode, applyDefaultAntes BBA, importConfigJSON backward compat — **218 Tests gesamt**

### v2.6.0 — Turnier-Historie, Spieler-Statistiken & Export

- **Turnier-Historie**: Ergebnisse werden automatisch nach Turnierende in localStorage gespeichert (max 50 Einträge). Neue `TournamentHistory.tsx` Modal-Komponente mit aufklappbaren Turniereinträgen (Datum, Name, Sieger, Spielerzahl, Prizepool), vollständiger Standings-Tabelle, Einzel-/Gesamt-Löschfunktion.
- **Spieler-Statistiken**: Tab „Spielerstatistik" im Historie-Modal aggregiert alle Ergebnisse nach normalisiertem Spielernamen — zeigt Turniere, Siege, Cashes, Auszahlung, Einsatz, Bilanz, Ø Platz, Knockouts. Sortiert nach Netto-Bilanz.
- **Text-Export (WhatsApp)**: „Text kopieren" Button in TournamentFinished + TournamentHistory — WhatsApp-freundliches Format mit Emoji-Platzierungen (🏆🥈🥉), Prizepool, Spielerzahl.
- **CSV-Export**: „CSV herunterladen" Button — vollständige Turnierdaten als CSV (Place, Name, Payout, Rebuys, AddOn, Knockouts, NetBalance).
- **Neue Interfaces**: `PlayerResult`, `TournamentResult`, `PlayerStat` in types.ts
- **Neue Funktionen**: `buildTournamentResult`, `saveTournamentResult`, `loadTournamentHistory`, `deleteTournamentResult`, `clearTournamentHistory`, `formatResultAsText`, `formatResultAsCSV`, `computePlayerStats` in logic.ts
- **Neue Datei**: `src/components/TournamentHistory.tsx`
- **50 neue Translation-Keys** (27 DE + 27 EN): `history.*`, `app.history`, `finished.copyText/textCopied/downloadCSV/exportOptions`
- **11 neue Tests**: buildTournamentResult (2), Persistence CRUD (4), formatResultAsText, formatResultAsCSV, computePlayerStats (3) — 214 Tests gesamt

### v2.5.0 — TV-Display-Modus

- **TV/Projector Display**: Neuer dedizierter Vollbild-Anzeigemodus (`DisplayMode.tsx`) optimiert für Projektoren und Fernseher. Dunkler Hintergrund, sehr großer Timer (bis 12rem), keine sensiblen Daten (kein Prizepool, keine Standings, keine Controls).
- **Drei rotierende Screens**: Timer-Hauptanzeige (Blinds + Countdown + Fortschrittsbalken + Bubble/Last-Hand-Banner), Blindstruktur-Tabelle (14 sichtbare Levels, aktuelles Level hervorgehoben, vergangene durchgestrichen), Chip-Werte (Grid mit Farben, Werten und nächstem Color-Up).
- **Auto-Rotation**: Automatischer Screen-Wechsel alle 15 Sekunden. Manuelle Navigation per Pfeiltasten (←/→). Screen-Indikator-Punkte in der Top-Bar.
- **Keyboard-Shortcut**: `T` zum Ein-/Ausschalten des TV-Modus. `Escape` zum Beenden.
- **Header-Button**: 📺-Button im Header während des Spielmodus (nicht bei Turnierende).
- **Lazy-loaded**: ~8,5 KB separater Chunk, nur bei Bedarf geladen.
- **11 neue Translation-Keys** pro Sprache: `display.exit`, `display.playersRemaining`, `display.nextLevel`, `display.blind`, `display.ante`, `display.break`, `display.activate`, `display.schedule`, `display.chips`, `display.rotationHint`, `display.navigate`
- **Neue Datei**: `src/components/DisplayMode.tsx` (~320 Zeilen)
- **App.tsx**: `displayMode` State, `KeyT` Shortcut, 📺 Header-Button, DisplayMode-Overlay-Rendering

### v2.4.0 — Quick Wins: Uhrzeit, Letzte Hand, Dealer-Rotation, ErrorBoundary

- **Uhrzeit im Spielmodus**: Echtzeit-Uhr im Game-Mode-Header, aktualisiert alle 30 Sekunden. Zeigt lokale Uhrzeit im `font-mono tabular-nums` Format.
- **„Letzte Hand"-Banner + Ansage**: Toggle-Button in Controls (amber-Styling) + Tastenkürzel `L`. Zeigt amber Banner über `BubbleIndicator`, Voice-Ansage via `announceLastHand()` (unterscheidet „vor Pause" / „Ende des Levels"). Auto-Reset bei Level-Wechsel.
- **Dealer Auto-Rotation**: Neuer `advanceDealer()` in `logic.ts` — überspringt eliminierte Spieler mit Wrap-Around. „Dealer weiter"-Button im PlayerPanel-Header neben Spieleranzahl.
- **React ErrorBoundary**: `ErrorBoundary.tsx` Class Component in `main.tsx` wrapping gesamte App. Fängt Lazy-Load-Fehler und Render-Crashes ab. Hardcoded English Fallback-UI mit Reload-Button.
- **Promise-basierte Sound-Voice-Koordination**: `playVictorySound()`, `playBubbleSound()`, `playInTheMoneySound()` geben jetzt `Promise<void>` zurück. `setTimeout`-Pattern in App.tsx durch `async/await` ersetzt — keine Race Conditions mehr bei langsamer AudioContext-Initialisierung.
- **Neue Datei**: `src/components/ErrorBoundary.tsx`
- **10 neue Translation-Keys**: `controls.lastHand`, `controls.lastHandTooltip`, `game.lastHand`, `game.lastHandHint`, `playerPanel.advanceDealer` (DE + EN)
- **8 neue Tests**: advanceDealer (5), Promise-Sounds (3) — 203 Tests gesamt

### v2.3.0 — ElevenLabs MP3 Voice (Deutsch + Englisch)

- **ElevenLabs MP3 Sprachausgabe**: 450 professionelle MP3-Audiodateien — Deutsch (Stimme: Ava) und Englisch (ElevenLabs Voice Library). Modular aufgebaut: Building-Blocks (`blinds.mp3`, `ante.mp3`, `color-up.mp3`) + einzelne Dateien für Levels, Blind-Paare, Ante-Werte, Countdowns, Pausen (minutengenau 1–30 Min) und 27 feste Ansagen.
- **Dreistufiger Audio-Fallback**: Web Audio API (gapless, mit Trailing-Silence-Trimming) → HTMLAudioElement (sequentiell, maximale Browser-Kompatibilität) → Web Speech API (Browser-Stimme als letzter Ausweg). Behebt stille MP3-Fehler in bestimmten Browsern.
- **Neue Datei**: `src/domain/audioPlayer.ts` — MP3-Playback-Engine mit Web Audio API + HTMLAudioElement-Fallback, dynamischem Sprachpfad (`audio/de/` / `audio/en/`)
- **speech.ts Refactoring**: Unified Queue mit `audio`- und `speech`-Items. Manifest-basierte Dateiprüfung (110 Blind-Paare, 20 Ante-Werte, 25 Levels, 30 Pausen-Dauern). Fehler-Logging im Catch-Handler für Diagnose.
- **Beide Sprachen mit Voice**: Sowohl Deutsch als auch Englisch nutzen ElevenLabs MP3s. Voice standardmäßig aktiviert. Bei deaktivierter Sprachausgabe nur Beep-Sounds.
- **Erweiterte Ansagen**: Turnierstart ("Shuffle up and deal!"), Heads-Up, dynamische Spieleranzahl-Ansagen (4–10 Spieler basierend auf ausgezahlten Plätzen), Letzte Hand / Letzte Hand vor der Pause, Noch 5 Minuten, Pause vorbei, Color-Up nächste Pause, Timer pausiert/fortgesetzt. Voice-Countdown nur in Spiellevels (Beeps in Pausen).
- **Vollständige Blind-Pair-Abdeckung**: Alle 110 Blind-Kombinationen vorhanden — Generator-Blinds für Startstacks 1k–100k (schnell/normal/langsam) plus Standard-Kombinationen aus Poker-Turnierformaten (Home Games, WSOP). Kein Speech-Fallback mehr für übliche Blindstrukturen.
- **Pausenzeiten minutengenau**: Alle Pausenansagen von 1 bis 30 Minuten als eigene MP3-Dateien (vorher nur 5/10/15/20/25/30)
- **PWA-Caching**: `.mp3` zu Workbox `globPatterns` hinzugefügt — Audio offline verfügbar
- **Qualitätsverbesserungen**: Race-Condition-Fix in `audioPlayer.ts` (onended bei `source.stop()`), Speech-Fallback für alle Ansagen, HTMLAudioElement überspringt fehlerhafte Dateien statt Abbruch, `victoryVoicePlayedRef` Reset in `switchToSetup`, 20 ungenutzte MP3s entfernt, 4 neue Translation-Keys
- **450 Audio-Dateien** in `public/audio/de/` + `public/audio/en/` (225 pro Sprache, 7 Unterverzeichnisse)
- **3 neue Tests**: audioPlayer Degradation, announceCountdown Return-Value, Dual-Language-Support (203 Tests gesamt)

### v2.2.1 — Dual Deployment (GitHub Pages + Vercel)

- **Vercel-Deployment**: App jetzt auch über Vercel erreichbar (https://pokernupdehueh.vercel.app/). Automatisches Deploy bei Push auf `main`.
- **Dynamischer Base-Pfad**: `vite.config.ts` nutzt `VITE_BASE_PATH` Umgebungsvariable (Default: `/`). GitHub Actions setzt `/Pokernupdehueh/` für GitHub Pages. Keine hardcodierten Pfade mehr in `index.html`.
- **PWA-Pfade dynamisch**: `start_url` und `scope` im PWA-Manifest nutzen dieselbe Base-Variable.

### v2.2.0 — Sprachausgabe-Verfeinerung & VoiceSwitcher

- **VoiceSwitcher im Header**: Neue `VoiceSwitcher.tsx`-Komponente — 2-Segment-Toggle (Noten-Icon / Mikrofon-Icon) zwischen LanguageSwitcher und Mode-Button. Ersetzt Voice-Toggle aus SettingsPanel. Verfügbar in Setup + Spielmodus.
- **Sequentielle Sprachwiedergabe**: Speech-Queue mit `onend`-Verkettung — Ansagen werden nacheinander abgespielt (kein Überlappen). `announceImmediate()` für zeitkritische Countdown-Zahlen (Queue leeren + sofort sprechen).
- **Phonetische Aussprache**: Alle englischen Pokerbegriffe in deutschen Voice-Texten phonetisch angepasst: Bleindz (Blinds), Riebai (Rebuy), Ädd-On (Add-On), Babbl (Bubble), Kaller-App (Color-Up), Inn se Manni (In The Money).
- **Countdown komplett gesprochen**: Voice-Countdown für alle 10 Sekunden (war: nur letzte 5). Timing-Fix: `Math.floor` statt `Math.ceil` — synchron mit Anzeige.
- **Sound-Voice-Koordination**: Sound-Effekte werden vor Sprachansagen abgespielt (delay-basiert, conditional auf `soundEnabled`).
- **Add-On/Rebuy-Timing**: Ansage und Banner vor Pause/nächstem Level. Zentralisierter `lastRebuyLevelIndex`. Add-On-Text: „einmalig verfügbar".

### v2.1.0 — Sprachansagen (Web Speech API)

- **Voice Announcements**: Web Speech API Sprachansagen für Level-Wechsel, Pausen (Start + 30s-Warnung), Bubble, ITM, Eliminierungen, Turniersieger, Add-On, Rebuy-Ende, Color-Up. Verbaler Countdown letzte 5 Sekunden. Offline-fähig, keine Sounddateien.
- **Neue Datei**: `src/domain/speech.ts` — Voice-Engine mit DE/EN-Sprachauswahl, Cancel-before-speak Queue, 11 Convenience-Funktionen
- **Settings**: `voiceEnabled: boolean` in Settings, Toggle „Sprachansagen" im Einstellungspanel
- **13 neue Translation-Keys**: `settings.voice` + 11× `voice.*` (DE + EN)
- **5 neue Tests**: Speech-Modul Degradation + Announcement-Builder (203 Tests gesamt)

### v2.0.1 — Light-Mode-Fixes, Sektionsumbenennung & Clean-View-Button

- **Light-Mode Lesbarkeit**: Alle farbigen UI-Elemente (rot/grün/amber) mit Light-Mode-Basis-Farben + `dark:`-Varianten versehen (14 Dateien)
- **Sektionsumbenennung**: „Turnier-Format" → „Rebuy / Add-On / Bounty" (DE + EN)
- **Clean-View-Button**: In Controls-Komponente integriert, mittig unter Start-Button (über Reset/Restart), prominenter mit Border + Shadow, immer sichtbar
- **Theme ohne Flash**: Inline-Script in `index.html` setzt Dark/Light-Modus vor dem ersten Paint (localStorage oder `prefers-color-scheme`)
- **Theme/Sprache im Spielmodus**: Theme-Switcher und Language-Switcher auch im Spielmodus verfügbar
- **Chips standardmäßig deaktiviert**: `defaultChipConfig()` gibt `enabled: false` zurück; ChipSidebar nur bei aktivierten Chips
- **Color-Up realistischer**: Chips werden erst bei der übernächsten Pause entfernt (nicht bei der ersten möglichen)
- **Add-On-Timing**: Ankündigung erscheint nach Ende der Rebuy-Phase — mit Pause: Banner in Pause + nächstem Level, Timer läuft weiter; ohne Pause: Timer pausiert automatisch für Add-On. `useTimer` akzeptiert optionalen `pauseAtLevelIndex`-Parameter.

### v2.0.0 — Dark/Light Mode, SVG-Chevrons, NumberStepper & Performance

- **Dark/Light Mode**: Vollständiges Theming mit 3-Wege-Toggle (System/Hell/Dunkel). `ThemeProvider` mit System-Preference-Listener, `useTheme()` Hook, `@custom-variant dark` in Tailwind 4, `dark:` Varianten auf allen 24+ Komponenten. PWA `theme-color` dynamisch. CSS Custom Properties für theme-aware Timer-Glow-Animation. Screenshot-Hintergrund passt sich dem Theme an.
- **SVG-Chevrons**: Neue `ChevronIcon`-Komponente ersetzt Unicode-Dreiecke — `w-4 h-4`, `strokeWidth={2.5}`, CSS-Rotation-Animation, `group-hover`-Farbwechsel. Verwendet in CollapsibleSection, CollapsibleSubSection, ChipSidebar, TemplateManager, TournamentFinished.
- **NumberStepper**: Neue Komponente ersetzt native Browser-Spinner — Custom `+`/`-` Buttons mit Long-Press-Support (400ms Delay, 100ms Repeat), optionale `snap`-Funktion, konfigurierbares min/max/step. Verwendet in App.tsx, PlayerManager, ConfigEditor, RebuyEditor, AddOnEditor, BountyEditor, PayoutEditor, ChipEditor.
- **Performance**: Game-Mode-Komponenten (10 Stück) per `React.lazy()` + `Suspense` lazy-loaded. `html-to-image` dynamisch importiert. Haupt-Bundle von 341KB auf 302KB reduziert + ~30KB Game-Chunks.
- **Neue Dateien**: `ChevronIcon.tsx`, `NumberStepper.tsx`, `ThemeSwitcher.tsx`, `src/theme/` (ThemeContext, useTheme, themeContextValue, index)
- **3 neue Translation-Keys**: `theme.system`, `theme.light`, `theme.dark` (DE + EN)

### v1.9.1 — Scrub-Slider Redesign & Add-On-Ankündigung

- **Custom Scrub-Slider**: Nativen Range-Input durch `ScrubSlider`-Komponente ersetzt — identisches Aussehen wie Fortschrittsbalken (Gradient, Glow, Thumb). Pointer Events für Touch + Mouse. Break-Levels in amber.
- **Add-On-Ankündigung**: Prominenter amber Banner in Hauptanzeige (wie Bubble/ITM) wenn Rebuy-Phase endet. `BubbleIndicator` erweitert um `addOnWindowOpen`-Props, Fragment-Return für gleichzeitige Banner.
- **Neue Animation**: `animate-addon-pulse` (amber box-shadow pulse) in `index.css`
- **2 neue Translation-Keys**: `addOn.announcement`, `addOn.announcementDetail` (DE + EN)
- **Range-Slider CSS entfernt**: Globale `input[type="range"]`-Regeln gelöscht (nicht mehr benötigt)

### v1.9.0 — Design Polish: Konsistenz & Verfeinerung

- **Abrundungs-Hierarchie**: Container `rounded-2xl` → Cards `rounded-xl` → Buttons `rounded-lg` → Badges `rounded-md`/`rounded-full` durchgehend vereinheitlicht (10 Komponenten, ~25 Fixes)
- **Border-Standardisierung**: `border-gray-700/40` (Standard), `border-gray-600/50` (Hover), `border-gray-700/30` (Sidebar). Amber-Borders auf `/40` normalisiert (12+ Dateien)
- **Sekundäre Buttons**: Reset/Restart mit `shadow-md` und `active:scale-[0.97]`
- **Range-Slider**: Custom CSS — Emerald-Gradient-Track, Gradient-Thumb mit Glow (webkit + moz)
- **Sidebar-Trennung**: `bg-gray-900/40` Hintergrund, `border-gray-700/30`, Toggle-Buttons vergrößert (`w-7 h-20`)
- **Focus-States**: `ring-1 ring-emerald-500/20` → `ring-2 ring-emerald-500/25` auf allen Inputs (9 Komponenten)
- **Tabellen-Rows**: Hover-States und `border-b` auf Standings, Bounty-Tabelle, Level-Editor; 1. Platz mit amber Border-Left
- **Spieler-Rows**: Hover-Border, Dealer-Badge-Glow, Rebuy-Badge, eliminierte Spieler `opacity-40`
- **Body-Gradient**: Verstärkt + zweiter Gradient bottom-right
- **Checkpoint-Banner**: `border-2`, `shadow-lg`, `animate-fade-in`, Gradient-Restore-Button, Ghost-Dismiss
- **Card-Hover**: CollapsibleSection/SubSection Header mit Hover-Shadows
- **Confirm-Dialog**: Button-Hierarchie verfeinert — Cancel subtiler, Confirm mit Red-Shadow und Scale
- **22 Dateien geändert**: Rein visuelle/CSS-Änderungen, keine Logik, keine neuen Dateien/Dependencies

### v1.8.0 — Premium UI: Glassmorphism, Animationen & taktiles Design

- **Glassmorphic Cards**: `CollapsibleSection` und `CollapsibleSubSection` mit `backdrop-blur-sm`, weichen Schatten und halbtransparenten Backgrounds; Content mit `animate-fade-in`
- **Timer-Glow**: Signatur-Effekt — pulsierender `text-shadow` auf laufendem Timer, Gradient-Fortschrittsbalken mit Glow-Shadow, `animate-countdown-pulse` für Countdown
- **Taktile Buttons**: Gradient-Buttons mit `active:scale-[0.97]`, Shadows und weicheren Borders durchgehend
- **8 Custom Animationen**: `fade-in`, `timer-glow`, `countdown-pulse`, `bubble-pulse`, `itm-flash`, `scale-in`, `slide-in-left`, `slide-in-right` als `@keyframes` + `@utility` in `index.css`
- **Modal-Polish**: `backdrop-blur-sm`, `animate-scale-in`, `shadow-2xl`, `rounded-2xl` auf Confirm-Dialog und TemplateManager
- **Bubble/ITM**: Custom Pulse-Animationen statt `animate-pulse`
- **Globales Input-Pattern**: `bg-gray-800/80`, `border-gray-700/60`, Focus-Ring, `rounded-lg`, Transition auf allen Inputs (10 Komponenten)
- **Settings-Polish**: Checkbox-Gradient, Keycap-Look auf Tastenkürzel-Anzeige
- **Header & Body**: `backdrop-blur-sm` Header, Body-Gradient (`radial-gradient` emerald), Gradient-Buttons
- **23 Dateien geändert**: Rein visuelle/CSS-Änderungen, keine Logik, keine neuen Dateien, keine neuen Translation-Keys

### v1.5.0 — Usability & Progressive Disclosure

- **Collapsible Setup-Sektionen**: Neue `CollapsibleSection`-Karten-Komponente — Setup-Bereiche sind in Karten mit klickbarem Header und Chevron-Indikator gewrappt. Essentielle Sektionen (Spieler, Buy-In, Blindstruktur) standardmäßig offen, optionale (Chip-Werte, Auszahlung, Turnier-Format) eingeklappt mit Summary-Text
- **Turnier-Format-Gruppierung**: Rebuy, Add-On und Bounty in einer gemeinsamen „Turnier-Format"-Karte zusammengefasst (logische Gruppierung verwandter Optionen)
- **Summary-Badges**: Eingeklappte Sektionen zeigen kompakte Zusammenfassung (z.B. „5 Chips, Color-Up aktiv", „3 Plätze, % Prozent", „Rebuy, Bounty: 5 €")
- **Clean View auf Mobile**: Clean-View-Toggle in der mobilen Button-Leiste im Spielmodus hinzugefügt (neben Spieler/Sidebar)

### v1.7.0 — Setup UX: Blindstruktur ausklappbar + Cleanup

- **Blindstruktur ausklappbar**: Level-Tabelle (ConfigEditor) in `CollapsibleSubSection` gewrappt, standardmäßig eingeklappt mit Summary „12 Levels, 3 Pausen, Ø 15 Min"
- **BlindGenerator vereinheitlicht**: Eigener Toggle durch `CollapsibleSubSection` ersetzt — konsistente Chevrons und Styling
- **Turnier-Name + Buy-In zusammengeführt**: Neue „Turnier-Grundlagen"-Karte spart eine Sektion
- **Summary-Badges auch bei offenen Sektionen**: Dezenter Subtitle unter dem Titel zeigt Key-Info
- **Spieler-Summary**: „6 Spieler"-Badge auf Spieler-Sektion
- **Sticky Start-Button auf Mobile**: Button bleibt am unteren Bildschirmrand sichtbar
- **Neue Komponente**: `CollapsibleSubSection.tsx` — leichteres Collapsible für Verschachtelung in Karten
- **3 neue Tests**: `computeBlindStructureSummary` (187 Tests gesamt)

### v1.6.0 — Bug-Fixes, Accessibility & Turnier-Checkpoint

- **useTimer-Fix**: Render-Phase-State-Mutation durch `useRef` + `useEffect` ersetzt
- **Tastenkürzel-Fix**: Dokumentation korrigiert (P → V für „Vorheriges Level")
- **Accessibility**: ARIA-Labels auf Timer, Controls, Bubble/ITM, Collapsible-Sections; `role="dialog"` + `aria-modal` + Auto-Focus + Escape-to-Close auf Modals (TemplateManager, Confirm-Dialog)
- **Turnier-Checkpoint**: Automatisches Speichern des Spielstands bei jeder Aktion im Spielmodus; bei App-Neustart Wiederherstellungs-Banner im Setup mit „Turnier fortsetzen" / „Verwerfen"; Timer wird immer pausiert wiederhergestellt
- **8 neue Translation-Keys**: `checkpoint.*` (DE + EN)

### v1.4.0 — Vorlagen, Clean View & Stabilität

- **Einheitlicher Vorlagen-Dialog**: Ein Button „Vorlagen" im Setup vereint alles — Browser-Vorlagen speichern/laden/löschen, als JSON-Datei exportieren/importieren (File System Access API mit nativem Dateidialog, Download-Fallback für Safari/Firefox), und aufklappbare JSON-Import/Export-Sektion für Power-User. Separates Import/Export-Modal entfernt.
- **Safari-Hinweis**: Automatischer Tipp wenn der Browser keine native Ordnerauswahl beim Speichern unterstützt (Safari → Einstellungen → Download-Ort auf „Nachfragen")
- **Editierbarer Color-Up Plan**: Color-Up Zeitpunkte manuell anpassen oder automatisch generieren (Chip Race)
- **Clean View**: Umschalter im Spielmodus blendet Stats, Sidebars und sekundäre Buttons aus — nur Timer, Blinds und Bubble bleiben (Tastenkürzel: F)
- **Auto-Start bei Levelwechsel**: Timer startet automatisch bei Weiter/Zurück
- **Timer-Zuverlässigkeit**: Fix für sporadisches Nicht-Starten bei Levelwechsel (eager interval restart)
- **iPad-Kompatibilität**: Build-Target auf Safari 14 / ES2020 angepasst, Lade-Fallback in index.html
- **Wake Lock**: Bildschirm bleibt während laufendem Timer an (Wake Lock API), wird bei Tab-Wechsel automatisch neu angefordert
- **Sound-Fix für Safari**: Gemeinsamer AudioContext aus User-Geste initialisiert, Custom Checkboxen (grün/grau) statt native accent-color
- **Text & i18n**: „Nächstes: Pause" (Grammatik-Fix), Color-Up Banner mit „(Chip Race)", lokalisierte Pause-Labels, aktualisierte Beschreibungen, unbenutzte Translation-Keys entfernt
- **7 neue Tests**: exportTemplateToJSON, parseTemplateFile Round-Trip und Fehlerbehandlung (184 Tests gesamt)
- **Cross-Device-Kompatibilität**: Safe Area Insets (viewport-fit=cover, env() Padding), 100dvh statt 100vh, größere Touch-Targets (Checkboxen, Rebuy-Buttons), inputmode="numeric" auf allen Zahleneingaben, Fullscreen API mit webkit-Prefix und try-catch, Clipboard API abgesichert, localStorage try-catch für Private Browsing, Tablet-Breakpoint (md: ab 768px)

### v1.3.0

- **Turnier-Statistiken**: Live-Anzeige im Spielmodus — Spieleranzahl, Preisgeld, Ø Stack in BB, Spielzeit, geschätzte Restzeit
- **Bubble-Anzeige**: Rot pulsierender "BUBBLE!"-Banner wenn activePlayers === paidPlaces + 1, grüner "In The Money!"-Flash beim Bubble-Burst (5 Sek)
- **Bubble/ITM Sounds**: Spannungs-Sound (Sawtooth) bei Bubble, Fanfare (Triangle) bei In The Money
- **Screenshot/Teilen**: Turnier-Ergebnisse als PNG capturen — Web Share API auf Mobile, Download-Fallback auf Desktop (html-to-image)
- **PWA**: Progressive Web App mit Manifest, Service Worker, installierbar auf Mobile/Desktop (vite-plugin-pwa)
- **Turnier-Templates**: Benannte Turnierkonfs speichern/laden/löschen via localStorage
- **23 neue Tests**: formatElapsedTime, computeEstimatedRemainingSeconds, computeAverageStackInBB, isBubble, isInTheMoney, Template-CRUD (177 Tests gesamt)

### v1.2.0

- **Blindstruktur-Generator**: 3 Geschwindigkeiten (schnell/normal/langsam) mit eigener BB-Progression, chip-aware Rundung, geschätzte Turnierdauer basierend auf Spieleranzahl
- **Chip-Blind-Kompatibilitätsprüfung**: Warnung wenn Chip-Werte geändert werden und die Blindstruktur nicht mehr darstellbar ist
- **PresetPicker entfernt**: Blindstrukturen werden jetzt komplett über den Generator erstellt
- **Add-On automatisch deaktiviert**: Wird Rebuy ausgeschaltet, wird Add-On automatisch zurückgesetzt
- **Rebuy-Anzeige**: Nur während aktiver Rebuy-Phase sichtbar
- **Chip-Duplikat-Warnung**: Warnung bei doppelten Chip-Farben
- **Chip-Auto-Sort**: Automatische Sortierung nach Wertigkeit
- **Color-Up gekoppelt mit Pause**: Chip-Race-Empfehlungen an nächste Pause gekoppelt

### v1.1.0

- Chip-Farben / Denomination-Management mit Color-Up Erinnerung
- Sitzplatz-Zuordnung mit Drag & Drop, Shuffle und Dealer-Button
- Add-On nur in Rebuy-Turnieren verfügbar
- Shuffle-Bestätigung
