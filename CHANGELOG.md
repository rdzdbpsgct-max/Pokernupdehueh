# Changelog

Alle wichtigen Änderungen an der Pokern up de Hüh App.

## [1.0.0] – 2026-02-21

### Features
- Poker-Turnier-Timer mit konfigurierbaren Blind-Stufen und Pausen
- Drei Presets: Turbo (6 Min), Standard (15 Min), Deep Stack (20 Min)
- Benutzerdefinierte Blind-Strukturen (Levels hinzufügen, bearbeiten, löschen, duplizieren, verschieben)
- Globale Leveldauer: Alle Blindstufen auf einmal auf eine Dauer setzen
- Globale Pausendauer: Alle Pausen auf einmal auf eine Dauer setzen
- Ante-Unterstützung (optional) mit automatischer Vorbelegung (~12,5% des BB)
- Startchips im Setup konfigurierbar (Standard: 20.000)
- Spielerverwaltung (2–20 Spieler, Namen editierbar)
- Spieler-Eliminierung mit Killer-Auswahl und automatischer Platzierung
- Rebuy-System (optional, konfigurierbar nach Levels oder Zeit, separate Kosten und Chips)
- Bounty-System (optional, konfigurierbarer Betrag pro Knockout)
- Auszahlungsstruktur mit automatischem Vorschlag basierend auf Spieleranzahl
- Auszahlung in Prozent oder festen Beträgen
- Turnier-Timer mit Start/Pause, Level-Navigation, Zeit-Scrubbing
- Countdown-Warnung mit Beeps (letzte 10 Sekunden)
- Level-Ende-Signalton
- Sieges-Melodie bei Turniergewinn
- Automatisches Weiterschalten zum nächsten Level
- Turnier-Ergebnisanzeige mit Platzierungen, Auszahlungen und Bounty-Übersicht
- Import/Export der Turnierkonfiguration als JSON
- Vollbild-Modus
- Tastenkürzel (Space, N, V, R)
- Große Anzeige (standardmäßig aktiviert)

### UI & Layout
- Einklappbare Seitenleisten (links: Spieler, rechts: Einstellungen)
- Anzeige des nächsten Levels unter dem aktuellen Level
- Mobilfreundliches Layout mit responsiven Größen
- Deutsche Benutzeroberfläche

### Validierung
- Prüfung aller Einstellungen vor Turnierstart
- Spieleranzahl muss zu Auszahlungsplätzen passen
- Auszahlungsprozente müssen 100% ergeben
- Mindestens 2 Spieler und ein gültiges Level erforderlich
- Grüne „Bereit"-Anzeige wenn alles passt

### Technisch
- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4
- 82 Unit-Tests (Vitest)
- CI/CD via GitHub Actions (Lint + Test + Build + Deploy)
- Deployment auf GitHub Pages
- Vollständig clientseitig, keine Serveranbindung nötig
- Sound via Web Audio API (keine externen Audio-Dateien)
- Persistenz via localStorage mit Backward-Kompatibilität
- 0 npm-audit-Vulnerabilities
