# Changelog

Alle wichtigen Änderungen an der Pokern up de Hüh App.

## [Unreleased]

### Geändert
- Ante ist standardmäßig deaktiviert

## [1.0.0] – Erste Version

### Features
- Poker-Turnier-Timer mit konfigurierbaren Blind-Stufen und Pausen
- Drei Presets: Turbo, Standard, Deep Stack
- Benutzerdefinierte Blind-Strukturen (Levels hinzufügen, bearbeiten, löschen)
- Ante-Unterstützung (optional pro Level)
- Spielerverwaltung (2–20 Spieler, Namen editierbar)
- Rebuy-System (optional, konfigurierbare Anzahl und Zeitfenster)
- Bounty-System (optional, konfigurierbarer Betrag pro Knockout)
- Auszahlungsstruktur mit automatischem Vorschlag basierend auf Spieleranzahl
- Auszahlung in Prozent oder festen Beträgen
- Turnier-Timer mit Start/Pause, Level-Navigation, Zeit-Scrubbing
- Countdown-Warnung (letzte 10 Sekunden)
- Automatisches Weiterschalten zum nächsten Level
- Spieler-Eliminierung mit Killer-Auswahl und Platzierung
- Turnier-Ergebnisanzeige mit Platzierungen, Auszahlungen und Bounty-Übersicht
- Import/Export der Turnierkonfiguration als JSON
- Vollbild-Modus
- Tastenkürzel (Space, N, V, R)
- Sound-Unterstützung (optional)
- Große Anzeige (standardmäßig aktiviert)

### UI & Layout
- Einklappbare Seitenleisten (links: Spieler, rechts: Einstellungen)
- Anzeige des nächsten Levels unter dem aktuellen Level
- Mobilfreundliches Layout mit responsiven Größen
- Deutsche Benutzeroberfläche mit korrekten Umlauten

### Validierung
- Prüfung aller Einstellungen vor Turnierstart
- Spieleranzahl muss zu Auszahlungsplätzen passen
- Auszahlungsprozente müssen 100% ergeben
- Mindestens 2 Spieler und ein gültiges Level erforderlich
- Grüne „Bereit"-Anzeige wenn alles passt

### Technisch
- React + TypeScript + Vite + Tailwind CSS
- Deployment via GitHub Pages mit GitHub Actions
- Vollständig clientseitig, keine Serveranbindung nötig
