# Pokern up de Hüh - Tournament Timer

Lokale Poker-Turnier-Timer-Webapp für Homegames.

## Features

- Blind-Level-Struktur (SB / BB / Ante)
- Break-Level-Unterstützung
- Driftfreier Timer (basierend auf `Date.now()`, kein inkrementelles Zählen)
- Start / Pause / Resume / Next / Previous / Reset / Restart
- Spielerverwaltung (Anzahl + Namen)
- Ante Toggle (mit/ohne Ante)
- Auszahlungsstruktur (% oder Euro, beliebig viele Plätze)
- Rebuy-Unterstützung (nach Levels oder nach Zeit)
- Sound-Beeps (Web Audio API) bei Countdown und Level-Ende
- Countdown-Anzeige (letzte 10 Sekunden)
- Presets: Turbo (6 min), Standard (15 min), Deep Stack (20 min)
- Setup-Mode zum Konfigurieren des Turniers
- Game-Mode mit großer Timer-Anzeige + Rebuy-Status
- Persistenz via localStorage
- JSON Import / Export
- Fullscreen-Modus
- Tastenkürzel:
  - `Space` - Start / Pause
  - `N` - Nächstes Level
  - `P` - Vorheriges Level
  - `R` - Level zurücksetzen

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Vitest (Unit Tests)
- Keine Backend-Komponenten

## Starten

```bash
npm install
npm run dev
```

Öffne http://localhost:5173

## Tests

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```

## Projektstruktur

```
src/
  domain/
    types.ts            # Datenmodelle (Level, Player, Payout, Rebuy, Config, etc.)
    logic.ts            # Reine Funktionen (Format, Validate, Presets, Persistence, etc.)
  hooks/
    useTimer.ts         # Timer-Hook mit drift-freier Berechnung
  components/
    TimerDisplay.tsx    # Große Uhranzeige + Blinds
    Controls.tsx        # Start/Pause/Next/Prev/Reset Buttons
    LevelPreview.tsx    # Level-Übersicht (Sidebar)
    ConfigEditor.tsx    # Level-Editor im Setup-Mode
    PresetPicker.tsx    # Turbo/Standard/Deep Auswahl
    SettingsPanel.tsx   # Sound/Countdown/AutoAdvance Toggles
    PlayerManager.tsx   # Spieleranzahl + Namen
    PayoutEditor.tsx    # Auszahlungsstruktur (% / €)
    RebuyEditor.tsx     # Rebuy-Konfiguration
    RebuyStatus.tsx     # Rebuy-Status im Game-Mode
    ImportExportModal.tsx  # JSON Import/Export Dialog
  App.tsx               # Haupt-App mit Mode-Switch
  main.tsx              # Entry Point
tests/
  logic.test.ts         # 51 Unit Tests für Domain-Logik
```

## Architektur-Entscheidungen

- **Timer ohne Drift**: `startTimestamp` + `Date.now()` statt inkrementeller `setInterval`-Zählung
- **State Machine**: `stopped` -> `running` -> `paused` -> `stopped`
- **Domain/UI-Trennung**: `domain/` enthält ausschließlich reine, testbare Funktionen ohne UI-Abhängigkeiten
- **Keine externen Dependencies** außer React, Tailwind, Vite
- **Sound via Web Audio API** (kein externes Audio-File nötig)
- **Backward-Kompatibilität**: Alte localStorage-Daten werden mit Defaults ergänzt
