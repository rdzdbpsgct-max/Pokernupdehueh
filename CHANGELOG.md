# Changelog

Alle wichtigen Änderungen an der Pokern up de Hüh App.
All notable changes to the Pokern up de Hüh app.

---

## [1.1.0] – 2026-02-21

### Features

- **DE/EN Sprachumschaltung (i18n)** — Alle ~170 Texte der App sind in Deutsch und Englisch verfügbar. Im Setup kann zwischen DE und EN gewechselt werden. Die Sprachauswahl wird in localStorage gespeichert und bleibt nach Reload erhalten. Standardsprache ist Deutsch.
- **DE/EN language switching (i18n)** — All ~170 texts are available in German and English. Switch between DE and EN in setup. Language selection is saved in localStorage and persists after reload. Default language is German.

- **Zurück-Button bei Eliminierung** — Der zuletzt eliminierte Spieler kann per "Zurück"-Button wieder ins Turnier aufgenommen werden (Undo bei versehentlicher Eliminierung).
- **Reinstate button for eliminations** — The most recently eliminated player can be reinstated via "Undo" button (undo accidental eliminations).

- **Erweiterte Turnier-Ergebnisübersicht** — Pro Spieler werden Gesamteinzahlung (Buy-In + Rebuys mit Aufschlüsselung), Gewinn, Bounty-Einnahmen und Bilanz (Plus/Minus mit Farbcodierung) angezeigt.
- **Extended tournament results** — Per player: total paid in (buy-in + rebuys with breakdown), winnings, bounty earnings and balance (profit/loss with color coding).

### Verbesserungen / Improvements

- **Größere Blinds-Anzeige / Larger blinds display** — Die aktuelle Blindstufe wird im Timer deutlich größer dargestellt (ca. 80% der Timer-Größe) und ist damit auch aus Entfernung gut lesbar. / The current blind level is displayed much larger in the timer (~80% of timer size), readable from a distance.
- **Default-Spielernamen sprachabhängig / Language-aware default player names** — Beim Sprachwechsel werden Standard-Spielernamen automatisch angepasst (Spieler 1 ↔ Player 1). Benutzerdefinierte Namen bleiben unverändert. / When switching languages, default player names are automatically updated (Spieler 1 ↔ Player 1). Custom names remain unchanged.
- **Poker-Farben im Header / Poker suits in header** — Alle vier Poker-Farben (♠ ♥ ♦ ♣) werden in absteigender Reihenfolge neben dem App- und Turniernamen angezeigt. / All four poker suits (♠ ♥ ♦ ♣) are displayed in descending order around the app and tournament name.

### Technisch / Technical

- Eigenes leichtgewichtiges i18n-System mit React Context (kein react-i18next) / Custom lightweight i18n system with React Context (no react-i18next)
- Neue Dateien / New files: `src/i18n/translations.ts`, `LanguageContext.tsx`, `useTranslation.ts`, `index.ts`, `LanguageSwitcher.tsx`
- Alle 17 Komponenten + `logic.ts` auf i18n umgestellt / All 17 components + `logic.ts` converted to i18n
- TypeScript-Typsicherheit: `TranslationKey` als Union-Type / TypeScript type safety: `TranslationKey` as union type

---

## [1.0.0] – 2026-02-21

### Features

- Poker-Turnier-Timer mit konfigurierbaren Blind-Stufen und Pausen / Poker tournament timer with configurable blind levels and breaks
- Drei Presets: Turbo (6 Min), Standard (15 Min), Deep Stack (20 Min) / Three presets: Turbo (6 min), Standard (15 min), Deep Stack (20 min)
- Benutzerdefinierte Blind-Strukturen (Levels hinzufügen, bearbeiten, löschen, duplizieren, verschieben) / Custom blind structures (add, edit, delete, duplicate, reorder levels)
- Globale Leveldauer: Alle Blindstufen auf einmal auf eine Dauer setzen / Global level duration: Set all blind levels to one duration at once
- Globale Pausendauer: Alle Pausen auf einmal auf eine Dauer setzen / Global break duration: Set all breaks to one duration at once
- Ante-Unterstützung (optional) mit automatischer Vorbelegung (~12,5% des BB) / Ante support (optional) with auto-population (~12.5% of BB)
- Startchips im Setup konfigurierbar (Standard: 20.000) / Starting chips configurable in setup (default: 20,000)
- Spielerverwaltung (2–20 Spieler, Namen editierbar) / Player management (2–20 players, editable names)
- Spieler-Eliminierung mit Killer-Auswahl und automatischer Platzierung / Player elimination with killer selection and automatic placement
- Rebuy-System (optional, konfigurierbar nach Levels oder Zeit, separate Kosten und Chips) / Rebuy system (optional, configurable by levels or time, separate cost and chips)
- Bounty-System (optional, konfigurierbarer Betrag pro Knockout) / Bounty system (optional, configurable amount per knockout)
- Auszahlungsstruktur mit automatischem Vorschlag basierend auf Spieleranzahl / Payout structure with automatic suggestion based on player count
- Auszahlung in Prozent oder festen Beträgen / Payout in percentage or fixed amounts
- Turnier-Timer mit Start/Pause, Level-Navigation, Zeit-Scrubbing / Tournament timer with start/pause, level navigation, time scrubbing
- Countdown-Warnung mit Beeps (letzte 10 Sekunden) / Countdown warning with beeps (last 10 seconds)
- Level-Ende-Signalton / Level end signal sound
- Sieges-Melodie bei Turniergewinn / Victory melody when tournament is won
- Automatisches Weiterschalten zum nächsten Level / Automatic advancing to next level
- Turnier-Ergebnisanzeige mit Platzierungen, Auszahlungen und Bounty-Übersicht / Tournament results with placements, payouts and bounty overview
- Import/Export der Turnierkonfiguration als JSON / Import/export tournament configuration as JSON
- Vollbild-Modus / Fullscreen mode
- Tastenkürzel (Space, N, V, R) / Keyboard shortcuts (Space, N, V, R)
- Große Anzeige (standardmäßig aktiviert) / Large display (enabled by default)

### UI & Layout

- Einklappbare Seitenleisten (links: Spieler, rechts: Einstellungen) / Collapsible sidebars (left: players, right: settings)
- Anzeige des nächsten Levels unter dem aktuellen Level / Next level displayed below current level
- Mobilfreundliches Layout mit responsiven Größen / Mobile-friendly layout with responsive sizes
- Deutsche Benutzeroberfläche (ab v1.1.0 auch Englisch) / German UI (English added in v1.1.0)

### Validierung / Validation

- Prüfung aller Einstellungen vor Turnierstart / All settings validated before tournament start
- Spieleranzahl muss zu Auszahlungsplätzen passen / Player count must match payout places
- Auszahlungsprozente müssen 100% ergeben / Payout percentages must equal 100%
- Mindestens 2 Spieler und ein gültiges Level erforderlich / At least 2 players and one valid level required
- Grüne "Bereit"-Anzeige wenn alles passt / Green "Ready" indicator when all checks pass

### Technisch / Technical

- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4
- 82 Unit-Tests (Vitest) / 82 unit tests (Vitest)
- CI/CD via GitHub Actions (Lint + Test + Build + Deploy)
- Deployment auf GitHub Pages / Deployment to GitHub Pages
- Vollständig clientseitig, keine Serveranbindung nötig / Fully client-side, no server needed
- Sound via Web Audio API (keine externen Audio-Dateien / no external audio files)
- Persistenz via localStorage mit Backward-Kompatibilität / Persistence via localStorage with backward compatibility
- 0 npm-audit-Vulnerabilities
