<div align="center">

<img src="https://img.shields.io/badge/%F0%9F%83%8F%20Pokern-up%20de%20H%C3%BCh-1a1a2e?style=for-the-badge&labelColor=065f46&color=1a1a2e" alt="Pokern up de Hüh" height="40" />

# Pokern up de Hüh

**Der Poker-Turnier-Timer für deinen Spieleabend**

[![Version](https://img.shields.io/badge/Version-1.1.0-blue?style=flat-square)](#)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-34d399?style=flat-square&logo=github)](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)
[![Tests](https://img.shields.io/badge/Tests-82%20passed-brightgreen?style=flat-square)](#)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen?style=flat-square)](#)

</div>

---

## Deutsch

Eine vollständig clientseitige Web-App zur Verwaltung von Poker-Heimturnieren. Kein Server, kein Account, kein Schnickschnack — einfach öffnen und losspielen.

- **DE / EN** — Deutsch/Englisch umschaltbar im Setup
- **Timer & Blindstruktur** mit Presets (Turbo, Standard, Deep Stack) oder eigener Konfiguration
- **Spielerverwaltung** mit Eliminierungen, Rebuys, Bounties und automatischer Platzierung
- **Auszahlungsrechner** mit prozentualer oder fester Verteilung
- **Mobilfreundlich** und offline nutzbar (kein Backend nötig)

### Verwendung

1. **Preset wählen** oder eigene Blindstruktur erstellen
2. **Spieler hinzufügen** (2–20), Buy-In und Startchips festlegen
3. **Turnier starten** — der Timer läuft, Blinds steigen automatisch
4. **Spieler eliminieren** — Platzierung und Killer werden erfasst
5. **Ergebnis** — Auszahlungen, Bounties und Platzierungen auf einen Blick

### Tastenkürzel

| Taste | Aktion |
|-------|--------|
| `Space` | Start / Pause |
| `N` | Nächstes Level |
| `V` | Vorheriges Level |
| `R` | Level zurücksetzen |

### Features

| Feature | Beschreibung |
|---------|-------------|
| Sprache | DE/EN-Umschalter im Setup, alle Texte zweisprachig |
| Timer | Drift-freier Countdown mit Fortschrittsbalken und Countdown-Warnung (letzte 10 Sek.) |
| Blindstruktur | Drei Presets + vollständig anpassbare Levels und Pausen |
| Ante | Optional, automatische Vorbelegung (~12,5 % des Big Blind) |
| Spielerverwaltung | Eliminierung mit Killer-Auswahl, automatische Platzierung, Zurück-Button bei versehentlicher Eliminierung |
| Rebuys | Konfigurierbares Limit (nach Levels oder Zeit), separate Kosten und Chips |
| Bounty | Optionales Kopfgeld pro Knockout mit Gesamtauswertung |
| Auszahlung | Prozentual oder fest, automatischer Vorschlag je nach Spielerzahl |
| Import / Export | Turnierkonfiguration als JSON speichern und laden |
| Sound | Countdown-Beeps und Sieges-Melodie via Web Audio API |
| Vollbild | Großer Timer-Modus für Präsentation am TV oder Beamer |
| Persistenz | Automatische Speicherung im Browser (localStorage) |
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

A fully client-side web app for managing home poker tournaments. No server, no account, no fuss — just open and play.

- **DE / EN** — Switch between German and English in setup
- **Timer & blind structure** with presets (Turbo, Standard, Deep Stack) or custom configuration
- **Player management** with eliminations, rebuys, bounties and automatic placement
- **Payout calculator** with percentage or fixed distribution
- **Mobile-friendly** and works offline (no backend needed)

### Usage

1. **Choose a preset** or create your own blind structure
2. **Add players** (2–20), set buy-in and starting chips
3. **Start the tournament** — the timer runs, blinds increase automatically
4. **Eliminate players** — placement and killer are tracked
5. **Results** — payouts, bounties and placements at a glance

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause |
| `N` | Next level |
| `V` | Previous level |
| `R` | Reset level |

### Features

| Feature | Description |
|---------|-------------|
| Language | DE/EN toggle in setup, all texts bilingual |
| Timer | Drift-free countdown with progress bar and countdown warning (last 10 sec.) |
| Blind structure | Three presets + fully customizable levels and breaks |
| Ante | Optional, auto-populated (~12.5% of big blind) |
| Player management | Elimination with killer selection, automatic placement, undo button for accidental eliminations |
| Rebuys | Configurable limit (by levels or time), separate cost and chips |
| Bounty | Optional bounty per knockout with total overview |
| Payout | Percentage or fixed, automatic suggestion based on player count |
| Import / Export | Save and load tournament configuration as JSON |
| Sound | Countdown beeps and victory melody via Web Audio API |
| Fullscreen | Large timer mode for TV or projector display |
| Persistence | Automatic saving in browser (localStorage) |
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
![Vitest](https://img.shields.io/badge/Vitest-82_Tests-6e9f18?style=flat-square&logo=vitest&logoColor=white)

- **React 19** — Funktionale Komponenten und Hooks / Functional components and hooks
- **TypeScript** — Strikte Typisierung / Strict typing
- **Vite** — Build-Tool (< 280 KB Bundle)
- **Tailwind CSS 4** — Styling
- **Vitest** — 82 Unit-Tests / Unit tests
- **GitHub Actions** — CI/CD mit Deploy auf GitHub Pages / with deploy to GitHub Pages

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
npm run test        # 82 Unit-Tests
npm run build       # Production-Build → ./dist
```

---

## Projektstruktur / Project Structure

```
src/
  domain/
    types.ts            # TypeScript-Typen / Types
    logic.ts            # Geschäftslogik / Business logic (Timer, Blinds, Payouts)
    sounds.ts           # Web Audio API Sounds
  hooks/
    useTimer.ts         # Timer-Hook (drift-free)
  i18n/
    translations.ts     # DE/EN Übersetzungen / Translations (~170 Keys)
    LanguageContext.tsx  # React Context Provider
    useTranslation.ts   # useTranslation() Hook
    index.ts            # Barrel-Export
  components/
    TimerDisplay.tsx    # Timer-Anzeige / Timer display
    ConfigEditor.tsx    # Blindstruktur-Editor / Blind structure editor
    PlayerManager.tsx   # Spielerverwaltung / Player management
    PlayerPanel.tsx     # Spieler-Panel / Player panel (during tournament)
    PayoutEditor.tsx    # Auszahlungsstruktur / Payout structure
    RebuyEditor.tsx     # Rebuy-Konfiguration / Rebuy configuration
    BountyEditor.tsx    # Bounty-Konfiguration / Bounty configuration
    LanguageSwitcher.tsx # DE/EN-Umschalter / Language toggle
    Controls.tsx        # Start/Pause/Next/Prev/Reset
    ...
tests/
  logic.test.ts         # 82 Unit-Tests
```

## Architektur / Architecture

- **Timer ohne Drift / Drift-free timer** — `startTimestamp` + `Date.now()` statt inkrementeller `setInterval`-Zählung / instead of incremental `setInterval` counting
- **Domain/UI-Trennung / Separation** — `domain/` enthält reine, testbare Funktionen / contains pure, testable functions
- **Eigenes i18n-System / Custom i18n** — Leichtgewichtiger React Context (~170 Keys), kein react-i18next / Lightweight React Context, no react-i18next
- **Keine externen Dependencies / No external dependencies** — Nur React und Tailwind / Only React and Tailwind
- **Sound via Web Audio API** — Keine externen Audio-Dateien / No external audio files
- **Backward-Kompatibilität / Backward compatibility** — Alte localStorage-Daten werden mit Defaults ergänzt / Old localStorage data is augmented with defaults

---

<div align="center">

> **Live-Demo / Live Demo:** [rdzdbpsgct-max.github.io/Pokernupdehueh](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)

**[Live Demo](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)** · **[Issues](https://github.com/rdzdbpsgct-max/Pokernupdehueh/issues)**

Gebaut mit React, TypeScript und viel Liebe zum Pokern.
Built with React, TypeScript and a love for poker.

</div>
