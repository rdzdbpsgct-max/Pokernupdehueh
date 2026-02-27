# CLAUDE.md — Pokern up de Hüh

## Project Overview

Poker tournament timer — a fully client-side React/TypeScript SPA for managing home poker tournaments. Handles blind levels, timers, player tracking, rebuys, bounties, chip management, and payouts. No server required, all data persisted in localStorage.

**Version**: 1.5.0
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
npm run test         # Vitest run (184 tests, single run)
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
│   ├── AddOnEditor.tsx          # Add-On config (requires Rebuy, auto-disable)
│   ├── BlindGenerator.tsx       # Blind structure generator (3 speeds, chip-aware)
│   ├── BountyEditor.tsx         # Bounty amount configuration
│   ├── ChipEditor.tsx           # Chip denomination management, editable color-up schedule
│   ├── ChipSidebar.tsx          # Game-mode chip info, next color-up display
│   ├── CollapsibleSection.tsx   # Reusable collapsible card for setup sections
│   ├── ConfigEditor.tsx         # Blind level table editor
│   ├── Controls.tsx             # Play/Pause/Next/Prev/Reset/Restart buttons
│   ├── LanguageSwitcher.tsx     # DE/EN toggle
│   ├── LevelPreview.tsx         # Next-level sidebar
│   ├── PayoutEditor.tsx         # Prize distribution config
│   ├── PlayerManager.tsx        # Add/edit/delete/seat players with drag & drop
│   ├── PlayerPanel.tsx          # Active players, elimination, bounty tracking
│   ├── RebuyEditor.tsx          # Rebuy limit config
│   ├── RebuyStatus.tsx          # Rebuy active indicator
│   ├── BubbleIndicator.tsx      # Bubble / In The Money visual banner
│   ├── SettingsPanel.tsx        # Sound, countdown, auto-advance, fullscreen
│   ├── TemplateManager.tsx      # Save/load/delete tournament templates, JSON import/export
│   ├── TimerDisplay.tsx         # Main timer, blinds display, progress bar
│   ├── TournamentFinished.tsx   # Results & payout display with screenshot/share
│   └── TournamentStats.tsx      # Live stats bar (players, prizepool, avg BB, time)
├── domain/                      # Business logic (no React imports)
│   ├── types.ts                 # All TypeScript interfaces and type aliases
│   ├── logic.ts                 # Core logic (~900 lines): validation, payouts, blinds, chips, templates, persistence
│   └── sounds.ts                # Web Audio API sound effects (beeps, victory, bubble, ITM)
├── hooks/
│   └── useTimer.ts              # Drift-free timer hook (wall-clock based, 100ms tick)
└── i18n/                        # Lightweight custom i18n (no react-i18next)
    ├── index.ts                 # Public re-exports
    ├── LanguageContext.tsx       # React Context provider, localStorage persistence
    ├── languageContextValue.ts  # Context value type
    ├── translations.ts          # DE/EN translation strings (~450+ keys)
    └── useTranslation.ts        # Hook: t(key, params) + language state

tests/
└── logic.test.ts                # 184 unit tests for domain/logic.ts

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
- **React Context** used only for i18n (language selection)
- **localStorage keys**: `poker-timer-config`, `poker-timer-settings`, `poker-timer-language`, `poker-timer-templates`

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
- **Keyboard shortcuts** (in App.tsx): Space (play/pause), N (next level), P (previous), R (reset), F (clean view toggle)
- **Ante calculation**: Auto ~12.5% of big blind, rounded to "nice" values
- **Blind structure generator**: 3 speeds (fast/normal/slow) with distinct BB progressions scaled from 20k reference; chip-aware rounding via `roundToChipMultiple()` when denominations are active
- **Chip management**: Editable color-up schedule with auto-suggestion; color-up events coupled with next break; duplicate color warnings; auto-sort by value
- **Chip-blind compatibility**: `checkBlindChipCompatibility()` detects blind values not expressible with current chip denominations
- **Duration estimates**: Factor in player count to estimate realistic tournament length
- **Import/export**: Full config as JSON with backward compatibility for old formats (integrated into TemplateManager)
- **Tournament templates**: Save/load/delete named configs via localStorage or local JSON files (File System Access API with download fallback)
- **Clean View**: Toggle to hide stats, sidebars, and secondary controls during game (keyboard: F)
- **Auto-start on level jump**: Timer automatically starts when pressing Next/Previous level
- **Bubble detection**: `isBubble()` and `isInTheMoney()` based on active players vs paid places
- **Tournament stats**: Live display of players, prizepool, avg stack in BB, elapsed/remaining time
- **Screenshot/share**: `html-to-image` capture → Web Share API (mobile) or PNG download (desktop)
- **PWA**: `vite-plugin-pwa` with auto-update service worker, installable on mobile/desktop
- **Wake Lock**: Screen stays on during active tournament (Wake Lock API, re-acquired on tab focus)
- **Cross-device compatibility**: Safe area insets (notch/gesture-bar), `100dvh` viewport height, `inputmode="numeric"` on all number inputs, webkit fullscreen prefix, localStorage try-catch for private browsing, tablet breakpoint (`md:` at 768px), touch targets ≥32px
- **Progressive disclosure in setup**: `CollapsibleSection` card component wraps each setup section; essential sections (Players, Buy-In, Blinds) open by default, optional sections (Chips, Payout, Tournament Format) collapsed with summary text; Rebuy/Add-On/Bounty grouped into one "Tournament Format" card
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

- The Vite base path is `/Pokernupdehueh/` — asset URLs must be relative or respect this base
- TypeScript strict mode is on — no implicit any, strict null checks enforced
- ESLint uses flat config format (not `.eslintrc`) in `eslint.config.js`
- The project language is bilingual — commit messages and docs are in German, code and comments are in English
- Default player names change when the language is switched (DE: "Spieler 1", EN: "Player 1")
- PresetPicker was removed in v1.2.0 — blind structures are now generated via BlindGenerator
- When chips are enabled, the blind generator uses the smallest chip denomination as rounding base

## Changelog

### v1.5.0 — Usability & Progressive Disclosure

- **Collapsible Setup-Sektionen**: Neue `CollapsibleSection`-Karten-Komponente — Setup-Bereiche sind in Karten mit klickbarem Header und Chevron-Indikator gewrappt. Essentielle Sektionen (Spieler, Buy-In, Blindstruktur) standardmäßig offen, optionale (Chip-Werte, Auszahlung, Turnier-Format) eingeklappt mit Summary-Text
- **Turnier-Format-Gruppierung**: Rebuy, Add-On und Bounty in einer gemeinsamen „Turnier-Format"-Karte zusammengefasst (logische Gruppierung verwandter Optionen)
- **Summary-Badges**: Eingeklappte Sektionen zeigen kompakte Zusammenfassung (z.B. „5 Chips, Color-Up aktiv", „3 Plätze, % Prozent", „Rebuy, Bounty: 5 €")
- **Clean View auf Mobile**: Clean-View-Toggle in der mobilen Button-Leiste im Spielmodus hinzugefügt (neben Spieler/Sidebar)

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
