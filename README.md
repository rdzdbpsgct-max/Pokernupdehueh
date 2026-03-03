<div align="center">

<img src="https://img.shields.io/badge/%F0%9F%83%8F%20Pokern-up%20de%20H%C3%BCh-1a1a2e?style=for-the-badge&labelColor=065f46&color=1a1a2e" alt="Pokern up de Hüh" height="40" />

# Pokern up de Hüh

**Der Poker-Turnier-Timer für deinen Spieleabend**

[![Version](https://img.shields.io/badge/Version-2.1.0-blue?style=flat-square)](#)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-34d399?style=flat-square&logo=github)](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)
[![Tests](https://img.shields.io/badge/Tests-187%20passed-brightgreen?style=flat-square)](#)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen?style=flat-square)](#)
[![PWA](https://img.shields.io/badge/PWA-installierbar-7c3aed?style=flat-square)](#)

</div>

---

## Deutsch

Eine vollständig clientseitige Web-App zur Verwaltung von Poker-Heimturnieren. Kein Server, kein Account, kein Schnickschnack — einfach öffnen und losspielen. Installierbar als PWA auf Mobile und Desktop.

- **DE / EN** — Deutsch/Englisch umschaltbar im Setup
- **Timer & Blindstruktur** mit Generator (3 Geschwindigkeiten) oder eigener Konfiguration
- **Spielerverwaltung** mit Drag & Drop Sitzordnung, Eliminierungen, Rebuys, Add-Ons und Bounties
- **Chip-Management** mit Color-Up Plan und Chip-Blind-Kompatibilitätsprüfung
- **Turnier-Vorlagen** speichern/laden (Browser + Datei-Export/Import)
- **Live-Statistiken** mit Bubble-Anzeige und In-The-Money-Erkennung
- **Dark/Light Mode** — 3-Wege-Umschalter (System/Hell/Dunkel)
- **Mobilfreundlich** und offline nutzbar (PWA, kein Backend nötig)

### Verwendung

1. **Blindstruktur generieren** (schnell/normal/langsam) oder eigene erstellen
2. **Spieler hinzufügen** (2–20), Buy-In und Startchips festlegen
3. **Optional**: Chips, Rebuys, Add-Ons, Bounties, Auszahlung konfigurieren
4. **Turnier starten** — Timer läuft, Blinds steigen automatisch, Color-Up-Banner bei Chip Race
5. **Spieler eliminieren** — Platzierung, Killer und Bounties werden erfasst
6. **Ergebnis** — Auszahlungen, Bounties und Platzierungen als Screenshot teilen

### Tastenkürzel

| Taste | Aktion |
|-------|--------|
| `Space` | Start / Pause |
| `N` | Nächstes Level |
| `V` | Vorheriges Level |
| `R` | Level zurücksetzen |
| `F` | Clean View ein/aus |

### Features

| Feature | Beschreibung |
|---------|-------------|
| Sprache | DE/EN-Umschalter im Setup, alle Texte zweisprachig |
| Timer | Drift-freier Countdown mit Fortschrittsbalken und Countdown-Warnung (letzte 10 Sek.) |
| Blindstruktur | Generator mit 3 Geschwindigkeiten + vollständig anpassbare Levels und Pausen |
| Ante | Optional, automatische Vorbelegung (~12,5 % des Big Blind) |
| Chip-Management | Chip-Farben/-Werte verwalten, editierbarer Color-Up Plan, Chip-Blind-Kompatibilitätsprüfung |
| Spielerverwaltung | Drag & Drop Sitzordnung, Shuffle, Dealer-Button, Eliminierung mit Killer-Auswahl |
| Rebuys & Add-Ons | Konfigurierbares Limit (nach Levels oder Zeit), Add-On einmalig pro Spieler |
| Bounty | Optionales Kopfgeld pro Knockout mit Gesamtauswertung |
| Auszahlung | Prozentual oder fest, automatischer Vorschlag je nach Spielerzahl |
| Vorlagen | Turnierkonfigurationen speichern/laden (Browser + JSON-Datei-Export/Import) |
| Turnier-Statistiken | Live: Spieleranzahl, Preisgeld, Ø Stack in BB, Spielzeit, geschätzte Restzeit |
| Bubble / ITM | Rot pulsierender BUBBLE!-Banner, grüner In-The-Money-Flash mit Sound |
| Clean View | Reduzierte Ansicht im Spielmodus — nur Timer, Blinds und Bubble (Taste: F) |
| Screenshot/Teilen | Turnier-Ergebnisse als PNG — Web Share API auf Mobile, Download auf Desktop |
| Sound | Countdown-Beeps, Level-Ende, Bubble-Spannung, ITM-Fanfare, Sieges-Melodie (Web Audio API) |
| Sprachansagen | Level-Wechsel, Pausen, Bubble, ITM, Eliminierungen, Sieger — Web Speech API (offline, kostenlos) |
| Vollbild | Großer Timer-Modus für Präsentation am TV oder Beamer |
| PWA | Installierbar auf Mobile/Desktop, offline nutzbar |
| Wake Lock | Bildschirm bleibt während laufendem Timer an (kein Energiesparmodus) |
| Persistenz | Automatische Speicherung im Browser (localStorage) |
| Turnier-Checkpoint | Automatische Spielstandsicherung, Wiederherstellung nach Browser-Crash |
| Barrierefreiheit | ARIA-Labels, Dialog-Rollen, Auto-Fokus, Escape-zum-Schließen |
| Kompatibilität | Safe Area Insets, dynamische Viewport-Höhe, optimierte Touch-Targets, numerische Tastatur, Tablet-Layout |
| Usability | Aufklappbare Sektionen mit Summary-Badges, ausklappbare Blindstruktur, Sticky Start-Button auf Mobile |
| Dark/Light Mode | 3-Wege-Umschalter (System/Hell/Dunkel), folgt Systemeinstellung, merkt sich Auswahl |
| Premium UI | Glassmorphism, Gradient-Buttons, Timer-Glow, benutzerdefinierte Animationen, taktile Interaktionen |
| Design-System | Einheitliche Abrundungen, Border-Opacities, Focus-Glow, Custom Number-Stepper, SVG-Chevrons |
| Validierung | Eingabeprüfung vor Turnierstart mit klaren Fehlermeldungen |

### Mitwirken

Beiträge sind willkommen!

1. Fork erstellen
2. Feature-Branch anlegen (`git checkout -b feature/mein-feature`)
3. Änderungen committen (`git commit -m 'Feature hinzugefügt'`)
4. Branch pushen (`git push origin feature/mein-feature`)
5. Pull Request öffnen

Bitte stelle sicher, dass `npm run lint` und `npm run test` fehlerfrei durchlaufen.

---

## English

A fully client-side web app for managing home poker tournaments. No server, no account, no fuss — just open and play. Installable as a PWA on mobile and desktop.

- **DE / EN** — Switch between German and English in setup
- **Timer & blind structure** with generator (3 speeds) or custom configuration
- **Player management** with drag & drop seating, eliminations, rebuys, add-ons and bounties
- **Chip management** with color-up schedule and blind-chip compatibility check
- **Tournament templates** save/load (browser + file export/import)
- **Live statistics** with bubble indicator and in-the-money detection
- **Dark/Light mode** — 3-way toggle (System/Light/Dark)
- **Mobile-friendly** and works offline (PWA, no backend needed)

### Usage

1. **Generate blind structure** (fast/normal/slow) or create your own
2. **Add players** (2–20), set buy-in and starting chips
3. **Optional**: Configure chips, rebuys, add-ons, bounties, payout
4. **Start the tournament** — timer runs, blinds increase automatically, color-up banner on chip race
5. **Eliminate players** — placement, killer and bounties are tracked
6. **Results** — share payouts, bounties and placements as screenshot

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `N` | Next level |
| `V` | Previous level |
| `R` | Reset level |
| `F` | Clean view toggle |

### Features

| Feature | Description |
|---------|-------------|
| Language | DE/EN toggle in setup, all texts bilingual |
| Timer | Drift-free countdown with progress bar and countdown warning (last 10 sec.) |
| Blind structure | Generator with 3 speeds + fully customizable levels and breaks |
| Ante | Optional, auto-populated (~12.5% of big blind) |
| Chip management | Manage chip colors/values, editable color-up schedule, blind-chip compatibility check |
| Player management | Drag & drop seating, shuffle, dealer button, elimination with killer selection |
| Rebuys & add-ons | Configurable limit (by levels or time), add-on once per player |
| Bounty | Optional bounty per knockout with total overview |
| Payout | Percentage or fixed, automatic suggestion based on player count |
| Templates | Save/load tournament configurations (browser + JSON file export/import) |
| Tournament stats | Live: player count, prize pool, avg stack in BB, elapsed time, estimated remaining |
| Bubble / ITM | Red pulsing BUBBLE! banner, green In The Money flash with sound |
| Clean view | Reduced game mode — only timer, blinds and bubble visible (key: F) |
| Screenshot/share | Tournament results as PNG — Web Share API on mobile, download on desktop |
| Sound | Countdown beeps, level end, bubble tension, ITM fanfare, victory melody (Web Audio API) |
| Voice announcements | Level changes, breaks, bubble, ITM, eliminations, winner — Web Speech API (offline, free) |
| Fullscreen | Large timer mode for TV or projector display |
| PWA | Installable on mobile/desktop, works offline |
| Wake Lock | Screen stays on during active timer (no sleep mode) |
| Persistence | Automatic saving in browser (localStorage) |
| Tournament checkpoint | Auto-save game state, recovery after browser crash |
| Accessibility | ARIA labels, dialog roles, auto-focus, escape-to-close |
| Compatibility | Safe area insets, dynamic viewport height, optimized touch targets, numeric keyboard, tablet layout |
| Usability | Collapsible sections with summary badges, collapsible blind structure, sticky start button on mobile |
| Dark/Light mode | 3-way toggle (System/Light/Dark), follows system preference, remembers selection |
| Premium UI | Glassmorphism, gradient buttons, timer glow, custom animations, tactile interactions |
| Design system | Unified rounding, border opacities, focus glow, custom number stepper, SVG chevrons |
| Validation | Input validation before tournament start with clear error messages |

### Contributing

Contributions are welcome!

1. Create a fork
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push the branch (`git push origin feature/my-feature`)
5. Open a pull request

Please make sure `npm run lint` and `npm run test` pass without errors.

---

## Technologien / Tech Stack

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-187_Tests-6e9f18?style=flat-square&logo=vitest&logoColor=white)

- **React 19** — Funktionale Komponenten und Hooks / Functional components and hooks
- **TypeScript 5.9** — Strikte Typisierung / Strict typing
- **Vite 7** — Build-Tool / Build tool
- **Tailwind CSS 4** — Styling (keine CSS-Dateien / no CSS files)
- **Vitest** — 187 Unit-Tests / Unit tests
- **GitHub Actions** — CI/CD mit Deploy auf GitHub Pages / with deploy to GitHub Pages
- **PWA** — vite-plugin-pwa, offline-fähig / offline-capable

---

## Quickstart

### Voraussetzungen / Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/rdzdbpsgct-max/Pokernupdehueh.git
cd Pokernupdehueh
npm install
```

### Entwicklung / Development

```bash
npm run dev
```

App: `http://localhost:5173/Pokernupdehueh/`

### Build & Test

```bash
npm run lint        # ESLint
npm run test        # 187 Unit-Tests
npm run build       # Production-Build → ./dist
```

---

## Projektstruktur / Project Structure

```
src/
  domain/
    types.ts            # TypeScript-Typen / Types
    logic.ts            # Geschäftslogik / Business logic (~1200 Zeilen)
    sounds.ts           # Web Audio API Sounds (Beeps, Melodien)
    speech.ts           # Web Speech API Sprachansagen
  hooks/
    useTimer.ts         # Timer-Hook (drift-free, shared AudioContext)
  theme/
    ThemeContext.tsx     # Dark/Light Mode Provider
    useTheme.ts         # useTheme() Hook
    themeContextValue.ts # Context + Types
    index.ts            # Barrel-Export
  i18n/
    translations.ts     # DE/EN Übersetzungen / Translations (~460 Keys)
    LanguageContext.tsx  # React Context Provider
    useTranslation.ts   # useTranslation() Hook
    index.ts            # Barrel-Export
  components/
    TimerDisplay.tsx     # Timer-Anzeige / Timer display
    ConfigEditor.tsx     # Blindstruktur-Editor / Blind structure editor
    BlindGenerator.tsx   # Blindstruktur-Generator / Blind structure generator
    PlayerManager.tsx    # Spielerverwaltung / Player management (Drag & Drop)
    PlayerPanel.tsx      # Spieler-Panel / Player panel (during tournament)
    PayoutEditor.tsx     # Auszahlungsstruktur / Payout structure
    RebuyEditor.tsx      # Rebuy-Konfiguration / Rebuy configuration
    AddOnEditor.tsx      # Add-On-Konfiguration / Add-on configuration
    BountyEditor.tsx     # Bounty-Konfiguration / Bounty configuration
    ChipEditor.tsx       # Chip-Werte & Color-Up / Chip values & color-up
    ChipSidebar.tsx      # Chip-Info im Spiel / Chip info during game
    CollapsibleSubSection.tsx # Leichteres Collapsible für Verschachtelung / Lighter collapsible for nesting
    TemplateManager.tsx  # Vorlagen + JSON Import/Export / Templates + JSON import/export
    TournamentStats.tsx  # Live-Statistiken / Live statistics
    BubbleIndicator.tsx  # Bubble / In The Money Banner
    TournamentFinished.tsx # Ergebnisse & Screenshot / Results & screenshot
    SettingsPanel.tsx    # Einstellungen / Settings (custom checkboxes)
    Controls.tsx         # Start/Pause/Next/Prev/Reset
    ChevronIcon.tsx      # SVG-Chevron mit Animation / SVG chevron with animation
    NumberStepper.tsx     # Custom +/- Stepper mit Long-Press / Custom +/- stepper with long-press
    ThemeSwitcher.tsx     # Dark/Light Mode Toggle
    LanguageSwitcher.tsx  # DE/EN-Umschalter / Language toggle
    LevelPreview.tsx      # Level-Vorschau / Level preview
    RebuyStatus.tsx      # Rebuy-Anzeige / Rebuy indicator
tests/
  logic.test.ts         # 187 Unit-Tests
```

## Architektur / Architecture

- **Timer ohne Drift / Drift-free timer** — `startTimestamp` + `Date.now()` statt inkrementeller `setInterval`-Zählung / instead of incremental `setInterval` counting
- **Domain/UI-Trennung / Separation** — `domain/` enthält reine, testbare Funktionen / contains pure, testable functions
- **Eigenes i18n-System / Custom i18n** — Leichtgewichtiger React Context (~300 Keys), kein react-i18next / Lightweight React Context, no react-i18next
- **Shared AudioContext** — Alle Sounds teilen einen AudioContext, initialisiert aus User-Geste (Safari-kompatibel) / All sounds share one AudioContext, initialized from user gesture (Safari-compatible)
- **Dark/Light Mode** — `ThemeProvider` + `useTheme()` Hook, 3-Wege-Toggle (System/Hell/Dunkel), `prefers-color-scheme` Listener, Tailwind `dark:`-Varianten / `ThemeProvider` + `useTheme()` hook, 3-way toggle (System/Light/Dark), `prefers-color-scheme` listener, Tailwind `dark:` variants
- **Keine externen State-Libraries / No external state libraries** — React Hooks + Props + Context (i18n + Theme) / Only React hooks + props + Context (i18n + theme)
- **Sound via Web Audio API** — Keine externen Audio-Dateien / No external audio files
- **PWA** — Offline-fähig, installierbar / Offline-capable, installable
- **Backward-Kompatibilität / Backward compatibility** — Alte localStorage-Daten werden mit Defaults ergänzt / Old localStorage data is augmented with defaults

---

<div align="center">

> **Live-Demo / Live Demo:** [rdzdbpsgct-max.github.io/Pokernupdehueh](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)

**[Live Demo](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)** · **[Issues](https://github.com/rdzdbpsgct-max/Pokernupdehueh/issues)**

Gebaut mit React, TypeScript und viel Liebe zum Pokern.
Built with React, TypeScript and a love for poker.

</div>
