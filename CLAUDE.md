# CLAUDE.md — Pokern up de Hüh

## Project Overview

Poker tournament timer — a fully client-side React/TypeScript SPA for managing home poker tournaments. Handles blind levels, timers, player tracking, rebuys, bounties, chip management, and payouts. No server required, all data persisted in localStorage.

**Version**: 2.0.0
**Live**: Deployed to GitHub Pages at `/Pokernupdehueh/`

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
│   ├── LanguageSwitcher.tsx     # DE/EN toggle
│   ├── LevelPreview.tsx         # Next-level sidebar
│   ├── NumberStepper.tsx        # Custom +/- stepper with long-press support
│   ├── PayoutEditor.tsx         # Prize distribution config
│   ├── PlayerManager.tsx        # Add/edit/delete/seat players with drag & drop
│   ├── PlayerPanel.tsx          # Active players, elimination, bounty tracking
│   ├── RebuyEditor.tsx          # Rebuy limit config
│   ├── RebuyStatus.tsx          # Rebuy active indicator
│   ├── BubbleIndicator.tsx      # Bubble / In The Money visual banner
│   ├── SettingsPanel.tsx        # Sound, countdown, auto-advance, fullscreen
│   ├── TemplateManager.tsx      # Save/load/delete tournament templates, JSON import/export
│   ├── ThemeSwitcher.tsx        # System/Light/Dark 3-way toggle
│   ├── TimerDisplay.tsx         # Main timer, blinds display, progress bar
│   ├── TournamentFinished.tsx   # Results & payout display with screenshot/share
│   └── TournamentStats.tsx      # Live stats bar (players, prizepool, avg BB, time)
├── domain/                      # Business logic (no React imports)
│   ├── types.ts                 # All TypeScript interfaces and type aliases
│   ├── logic.ts                 # Core logic (~900 lines): validation, payouts, blinds, chips, templates, persistence, checkpoint
│   └── sounds.ts                # Web Audio API sound effects (beeps, victory, bubble, ITM)
├── hooks/
│   └── useTimer.ts              # Drift-free timer hook (wall-clock based, 100ms tick)
├── theme/                       # Dark/Light mode system
│   ├── index.ts                 # Public re-exports
│   ├── ThemeContext.tsx          # React Context provider, system preference listener, localStorage persistence
│   ├── themeContextValue.ts     # Context value type + ThemeMode type
│   └── useTheme.ts              # Hook: mode, setMode, resolved
└── i18n/                        # Lightweight custom i18n (no react-i18next)
    ├── index.ts                 # Public re-exports
    ├── LanguageContext.tsx       # React Context provider, localStorage persistence
    ├── languageContextValue.ts  # Context value type
    ├── translations.ts          # DE/EN translation strings (~460+ keys)
    └── useTranslation.ts        # Hook: t(key, params) + language state

tests/
└── logic.test.ts                # 187 unit tests for domain/logic.ts

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
- **localStorage keys**: `poker-timer-config`, `poker-timer-settings`, `poker-timer-language`, `poker-timer-templates`, `poker-timer-checkpoint`, `poker-timer-theme`

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
- **Sound**: Web Audio API oscillators — no external audio files
- **Keyboard shortcuts** (in App.tsx): Space (play/pause), N (next level), V (previous), R (reset), F (clean view toggle)
- **Ante calculation**: Auto ~12.5% of big blind, rounded to "nice" values
- **Blind structure generator**: 3 speeds (fast/normal/slow) with distinct BB progressions scaled from 20k reference; chip-aware rounding via `roundToChipMultiple()` when denominations are active
- **Chip management**: Editable color-up schedule with auto-suggestion; color-up events coupled with next break; duplicate color warnings; auto-sort by value
- **Chip-blind compatibility**: `checkBlindChipCompatibility()` detects blind values not expressible with current chip denominations
- **Duration estimates**: Factor in player count to estimate realistic tournament length
- **Import/export**: Full config as JSON with backward compatibility for old formats (integrated into TemplateManager)
- **Tournament templates**: Save/load/delete named configs via localStorage or local JSON files (File System Access API with download fallback)
- **Clean View**: Toggle to hide stats, sidebars, and secondary controls during game (keyboard: F)
- **Auto-start on level jump**: Timer automatically starts when pressing Next/Previous level
- **Bubble detection**: `isBubble()` and `isInTheMoney()` based on active players vs paid places; `BubbleIndicator` also shows Add-On announcement banner (amber, center-screen) when rebuy phase ends
- **Tournament stats**: Live display of players, prizepool, avg stack in BB, elapsed/remaining time
- **Dark/Light mode**: 3-way toggle (System/Light/Dark) in header; `ThemeProvider` manages mode + system preference listener + `dark` class on `<html>`; `useTheme()` hook; `poker-timer-theme` in localStorage; PWA `theme-color` meta tag updated dynamically
- **Code splitting**: Game-mode components lazy-loaded via `React.lazy()` + `Suspense`; `html-to-image` dynamically imported only when capturing screenshots; main bundle ~302KB + ~30KB game chunks
- **SVG Chevrons**: `ChevronIcon` component with CSS rotation animation replaces Unicode triangles for collapsible sections
- **NumberStepper**: Custom `+`/`-` stepper component replaces native number input spinners; long-press support via pointer events (400ms delay, 100ms repeat); optional `snap` function; used across all numeric inputs in setup
- **Screenshot/share**: `html-to-image` (dynamic import) capture → Web Share API (mobile) or PNG download (desktop); theme-aware background color
- **PWA**: `vite-plugin-pwa` with auto-update service worker, installable on mobile/desktop
- **Wake Lock**: Screen stays on during active tournament (Wake Lock API, re-acquired on tab focus)
- **Cross-device compatibility**: Safe area insets (notch/gesture-bar), `100dvh` viewport height, `inputmode="numeric"` on all number inputs, webkit fullscreen prefix, localStorage try-catch for private browsing, tablet breakpoint (`md:` at 768px), touch targets ≥32px
- **Progressive disclosure in setup**: `CollapsibleSection` card component wraps each setup section; essential sections (Tournament Basics, Players, Blinds) open by default, optional sections (Chips, Payout, Tournament Format) collapsed with summary text; `CollapsibleSubSection` for nested collapsibles inside cards (BlindGenerator, Level Table); Tournament Name + Buy-In merged into "Turnier-Grundlagen" card; Rebuy/Add-On/Bounty grouped into one "Tournament Format" card; Summary badges visible as subtitles even on open sections
- **Tournament checkpoint**: Auto-save game state to localStorage on every action in game mode; on restart, offer to resume with timer always paused (timestamps invalid after reload)
- **Accessibility**: ARIA roles/labels on timer, controls, modals, collapsible sections; auto-focus and Escape-to-close on dialogs
- **Premium UI**: Glassmorphism (`backdrop-blur-sm`, soft shadows), gradient buttons (`bg-gradient-to-b`), custom animations (9 `@keyframes` in `index.css`), tactile feedback (`active:scale-[0.97]`), timer glow (`animate-timer-glow`), dual body gradient, focus glow on all inputs, custom scrub slider matching progress bar, card hover glow, table row hover states
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
