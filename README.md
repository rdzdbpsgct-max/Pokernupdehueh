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

A fully client-side web app for managing home poker tournaments. No server, no account, no fuss — just open and play.

Eine vollständig clientseitige Web-App zur Verwaltung von Poker-Heimturnieren. Kein Server, kein Account, kein Schnickschnack — einfach öffnen und losspielen.

- **DE / EN** — Deutsch/Englisch umschaltbar im Setup
- **Timer & Blindstruktur** mit Presets (Turbo, Standard, Deep Stack) oder eigener Konfiguration
- **Spielerverwaltung** mit Eliminierungen, Rebuys, Bounties und automatischer Platzierung
- **Auszahlungsrechner** mit prozentualer oder fester Verteilung
- **Mobilfreundlich** und offline nutzbar (kein Backend nötig)

---

## Technologien

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-82_Tests-6e9f18?style=flat-square&logo=vitest&logoColor=white)

- **React 19** mit funktionalen Komponenten und Hooks
- **TypeScript** mit strikter Typisierung
- **Vite** als Build-Tool (< 260 KB Bundle)
- **Tailwind CSS 4** für das gesamte Styling
- **Vitest** für Unit-Tests
- **GitHub Actions** CI/CD mit automatischem Deploy auf GitHub Pages

---

## Quickstart

### Voraussetzungen

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/rdzdbpsgct-max/Pokernupdehueh.git
cd Pokernupdehueh
npm install
```

### Entwicklung

```bash
npm run dev
```

Öffnet die App unter `http://localhost:5173/Pokernupdehueh/`.

### Build & Test

```bash
npm run lint        # ESLint
npm run test        # 82 Unit-Tests
npm run build       # Production-Build nach ./dist
```

---

## Verwendung

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

> **Live-Demo:** [rdzdbpsgct-max.github.io/Pokernupdehueh](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)

---

## Features

| Feature | Beschreibung |
|---------|-------------|
| Sprache / Language | DE/EN-Umschalter im Setup, alle Texte zweisprachig |
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

---

## Projektstruktur

```
src/
  domain/
    types.ts            # TypeScript-Typen
    logic.ts            # Geschäftslogik (Timer, Blinds, Payouts)
    sounds.ts           # Web Audio API Sounds
  hooks/
    useTimer.ts         # Timer-Hook mit drift-freier Berechnung
  i18n/
    translations.ts     # DE/EN Übersetzungen (~170 Keys)
    LanguageContext.tsx  # React Context Provider
    useTranslation.ts   # useTranslation() Hook
    index.ts            # Barrel-Export
  components/
    TimerDisplay.tsx    # Timer-Anzeige mit Fortschrittsbalken
    ConfigEditor.tsx    # Blindstruktur-Editor
    PlayerManager.tsx   # Spielerverwaltung
    PlayerPanel.tsx     # Spieler-Panel während des Turniers
    PayoutEditor.tsx    # Auszahlungsstruktur
    RebuyEditor.tsx     # Rebuy-Konfiguration
    BountyEditor.tsx    # Bounty-Konfiguration
    LanguageSwitcher.tsx # DE/EN-Umschalter
    Controls.tsx        # Start/Pause/Next/Prev/Reset
    ...
tests/
  logic.test.ts         # 82 Unit-Tests
```

## Architektur-Entscheidungen

- **Timer ohne Drift** — `startTimestamp` + `Date.now()` statt inkrementeller `setInterval`-Zählung
- **Domain/UI-Trennung** — `domain/` enthält ausschließlich reine, testbare Funktionen ohne UI-Abhängigkeiten
- **Eigenes i18n-System** — leichtgewichtiger React Context mit ~170 Keys, kein react-i18next nötig
- **Keine externen Dependencies** außer React und Tailwind
- **Sound via Web Audio API** — kein externes Audio-File nötig
- **Backward-Kompatibilität** — alte localStorage-Daten werden mit Defaults ergänzt

---

## Contributing

Beiträge sind willkommen!

1. Fork erstellen
2. Feature-Branch anlegen (`git checkout -b feature/mein-feature`)
3. Änderungen committen (`git commit -m 'Feature hinzugefügt'`)
4. Branch pushen (`git push origin feature/mein-feature`)
5. Pull Request öffnen

Bitte stelle sicher, dass `npm run lint` und `npm run test` fehlerfrei durchlaufen.

---

<div align="center">

**[Live Demo](https://rdzdbpsgct-max.github.io/Pokernupdehueh/)** · **[Issues](https://github.com/rdzdbpsgct-max/Pokernupdehueh/issues)**

Gebaut mit React, TypeScript und viel Liebe zum Pokern.

</div>
