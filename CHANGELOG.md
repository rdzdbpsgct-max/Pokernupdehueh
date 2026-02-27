# Changelog

Alle wichtigen Änderungen an der Pokern up de Hüh App.
All notable changes to the Pokern up de Hüh app.

---

## [1.5.0] – 2026-02-27

### Usability & Progressive Disclosure

- **Aufklappbare Setup-Sektionen** — Neue `CollapsibleSection`-Karten-Komponente: Essentielle Bereiche (Spieler, Buy-In, Blindstruktur) standardmäßig offen, optionale Bereiche (Chip-Werte, Auszahlung, Turnier-Format) eingeklappt mit kompaktem Summary-Text. Deutlich weniger Scrollen im Setup.
- **Collapsible setup sections** — New `CollapsibleSection` card component: Essential sections (Players, Buy-In, Blind Structure) open by default, optional sections (Chip Values, Payout, Tournament Format) collapsed with compact summary text. Significantly less scrolling in setup.

- **Turnier-Format-Gruppierung** — Rebuy, Add-On und Bounty in einer gemeinsamen „Turnier-Format"-Karte zusammengefasst — logische Gruppierung verwandter Turnierformat-Optionen.
- **Tournament format grouping** — Rebuy, Add-On and Bounty combined into a single "Tournament Format" card — logical grouping of related tournament format options.

- **Summary-Badges** — Eingeklappte Sektionen zeigen kompakte Zusammenfassung: „5 Chips, Color-Up aktiv", „3 Plätze, % Prozent", „Rebuy, Bounty: 5 €" oder „Alles deaktiviert".
- **Summary badges** — Collapsed sections show compact summary: "5 Chips, Color-Up active", "3 places, % Percent", "Rebuy, Bounty: 5 €" or "All disabled".

- **Clean View auf Mobile** — Clean-View-Toggle in der mobilen Button-Leiste im Spielmodus hinzugefügt (neben Spieler/Sidebar-Buttons).
- **Clean view on mobile** — Clean view toggle added to mobile button bar in game mode (alongside Players/Sidebar buttons).

---

## [1.4.0] – 2026-02-27

### Vorlagen, Clean View & Stabilität

- **Einheitlicher Vorlagen-Dialog** — Ein Button „Vorlagen" im Setup vereint alles: Browser-Vorlagen speichern/laden/löschen, als JSON-Datei exportieren/importieren (File System Access API mit nativem Dateidialog, Download-Fallback für Safari/Firefox), und aufklappbare JSON-Import/Export-Sektion für Power-User. Separates Import/Export-Modal entfernt.
- **Unified templates dialog** — One "Templates" button in setup covers everything: save/load/delete browser templates, export/import as JSON files (File System Access API with native dialog, download fallback for Safari/Firefox), and collapsible JSON import/export section for power users. Separate import/export modal removed.

- **Safari-Hinweis** — Automatischer Tipp wenn der Browser keine native Ordnerauswahl beim Speichern unterstützt (Safari → Einstellungen → Download-Ort auf „Nachfragen").
- **Safari hint** — Automatic tip when the browser doesn't support native directory picker for saving (Safari → Settings → download location to "Ask for each download").

- **Editierbarer Color-Up Plan** — Color-Up Zeitpunkte manuell anpassen oder automatisch generieren (Chip Race).
- **Editable color-up schedule** — Manually adjust or auto-generate color-up timing (chip race).

- **Clean View** — Umschalter im Spielmodus blendet Stats, Sidebars und sekundäre Buttons aus — nur Timer, Blinds und Bubble bleiben (Tastenkürzel: F).
- **Clean view** — Toggle in game mode hides stats, sidebars and secondary controls — only timer, blinds and bubble remain (key: F).

- **Auto-Start bei Levelwechsel** — Timer startet automatisch bei Weiter/Zurück.
- **Auto-start on level change** — Timer starts automatically on Next/Previous.

- **Sound-Fix für Safari** — Gemeinsamer AudioContext, initialisiert aus User-Geste (Play/Start), damit Safari Audio nicht blockiert. Custom Checkboxen (grün/grau) statt native accent-color.
- **Sound fix for Safari** — Shared AudioContext initialized from user gesture (Play/Start) so Safari doesn't block audio. Custom checkboxes (green/gray) instead of native accent-color.

- **Timer-Zuverlässigkeit** — Fix für sporadisches Nicht-Starten bei Levelwechsel (eager interval restart).
- **Timer reliability** — Fix for sporadic non-start on level change (eager interval restart).

- **iPad-Kompatibilität** — Build-Target auf Safari 14 / ES2020 angepasst, Lade-Fallback in index.html.
- **iPad compatibility** — Build target set to Safari 14 / ES2020, loading fallback in index.html.

- **Wake Lock** — Bildschirm bleibt während laufendem Timer an (kein Energiesparmodus). Wird bei Tab-Wechsel automatisch neu angefordert.
- **Wake Lock** — Screen stays on during active timer (no sleep mode). Automatically re-acquired on tab focus.

- **Text & i18n** — „Nächstes: Pause" (Grammatik-Fix), Color-Up Banner mit „(Chip Race)", lokalisierte Pause-Labels, aktualisierte Beschreibungen, unbenutzte Translation-Keys entfernt.
- **Text & i18n** — "Next: Break" (grammar fix), color-up banner with "(Chip Race)", localized break labels, updated descriptions, unused translation keys removed.

- **7 neue Tests** — exportTemplateToJSON, parseTemplateFile Round-Trip und Fehlerbehandlung (184 Tests gesamt).
- **7 new tests** — exportTemplateToJSON, parseTemplateFile round-trip and error handling (184 tests total).

- **Cross-Device-Kompatibilität** — Safe Area Insets für Notch-Phones (viewport-fit=cover, env()-Padding), dynamische Viewport-Höhe (100dvh statt 100vh), größere Touch-Targets (Checkboxen 28px, Rebuy-Buttons 32px), numerische Tastatur auf Mobile (inputmode="numeric"), Fullscreen API mit Webkit-Prefix und Error-Guard, Clipboard API abgesichert, localStorage try-catch für Private Browsing, Tablet-Breakpoint (md: ab 768px statt lg: ab 1024px).
- **Cross-device compatibility** — Safe area insets for notched phones (viewport-fit=cover, env() padding), dynamic viewport height (100dvh instead of 100vh), larger touch targets (checkboxes 28px, rebuy buttons 32px), numeric keyboard on mobile (inputmode="numeric"), fullscreen API with webkit prefix and error guard, clipboard API guarded, localStorage try-catch for private browsing, tablet breakpoint (md: from 768px instead of lg: from 1024px).

---

## [1.3.0] – 2026-02-24

### Turnier-Statistiken, Bubble & PWA

- **Turnier-Statistiken** — Live-Anzeige im Spielmodus: Spieleranzahl, Preisgeld, Ø Stack in BB, Spielzeit, geschätzte Restzeit.
- **Tournament statistics** — Live display in game mode: player count, prize pool, avg stack in BB, elapsed time, estimated remaining time.

- **Bubble-Anzeige** — Rot pulsierender „BUBBLE!"-Banner wenn activePlayers === paidPlaces + 1, grüner „In The Money!"-Flash beim Bubble-Burst (5 Sek).
- **Bubble indicator** — Red pulsing "BUBBLE!" banner when activePlayers === paidPlaces + 1, green "In The Money!" flash on bubble burst (5 sec).

- **Bubble/ITM Sounds** — Spannungs-Sound (Sawtooth) bei Bubble, Fanfare (Triangle) bei In The Money.
- **Bubble/ITM sounds** — Tension sound (sawtooth) on bubble, fanfare (triangle) on In The Money.

- **Screenshot/Teilen** — Turnier-Ergebnisse als PNG capturen: Web Share API auf Mobile, Download-Fallback auf Desktop (html-to-image).
- **Screenshot/share** — Capture tournament results as PNG: Web Share API on mobile, download fallback on desktop (html-to-image).

- **PWA** — Progressive Web App mit Manifest, Service Worker, installierbar auf Mobile/Desktop (vite-plugin-pwa).
- **PWA** — Progressive Web App with manifest, service worker, installable on mobile/desktop (vite-plugin-pwa).

- **Turnier-Templates** — Benannte Turnierkonfigurationen speichern/laden/löschen via localStorage.
- **Tournament templates** — Save/load/delete named tournament configurations via localStorage.

- **23 neue Tests** — formatElapsedTime, computeEstimatedRemainingSeconds, computeAverageStackInBB, isBubble, isInTheMoney, Template-CRUD (177 Tests gesamt).
- **23 new tests** — formatElapsedTime, computeEstimatedRemainingSeconds, computeAverageStackInBB, isBubble, isInTheMoney, template CRUD (177 tests total).

---

## [1.2.0] – 2026-02-23

### Blindstruktur-Generator & Chip-Management

- **Blindstruktur-Generator** — 3 Geschwindigkeiten (schnell/normal/langsam) mit eigener BB-Progression, chip-aware Rundung, geschätzte Turnierdauer basierend auf Spieleranzahl.
- **Blind structure generator** — 3 speeds (fast/normal/slow) with distinct BB progressions, chip-aware rounding, estimated tournament duration based on player count.

- **Chip-Blind-Kompatibilitätsprüfung** — Warnung wenn Chip-Werte geändert werden und die Blindstruktur nicht mehr darstellbar ist.
- **Chip-blind compatibility check** — Warning when chip values are changed and the blind structure can no longer be expressed.

- **PresetPicker entfernt** — Blindstrukturen werden jetzt komplett über den Generator erstellt.
- **PresetPicker removed** — Blind structures are now created entirely via the generator.

- **Add-On automatisch deaktiviert** — Wird Rebuy ausgeschaltet, wird Add-On automatisch zurückgesetzt.
- **Add-on auto-disabled** — Disabling rebuy automatically resets add-on.

- **Rebuy-Anzeige** — Nur während aktiver Rebuy-Phase sichtbar.
- **Rebuy indicator** — Only visible during active rebuy phase.

- **Chip-Duplikat-Warnung** — Warnung bei doppelten Chip-Farben.
- **Chip duplicate warning** — Warning for duplicate chip colors.

- **Chip-Auto-Sort** — Automatische Sortierung nach Wertigkeit.
- **Chip auto-sort** — Automatic sorting by value.

- **Color-Up gekoppelt mit Pause** — Chip-Race-Empfehlungen an nächste Pause gekoppelt.
- **Color-up coupled with break** — Chip race recommendations coupled with next break.

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
- **Aufgeräumte Ergebnisübersicht / Cleaner results overview** — Pro Spieler werden Buy-In, Rebuys, Bounty gezahlt/erhalten und Bilanz jeweils in eigener Zeile angezeigt. Details sind auf-/einklappbar (Standard: ausgeklappt). / Per player: buy-in, rebuys, bounty paid/earned and balance each on its own line. Details are collapsible (default: expanded).

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
- Ante-Unterstützung (optional) mit automatischer Vorbelegung (~12,5% des BB) / Ante support (optional) with auto-population (~12.5% of BB)
- Spielerverwaltung (2–20 Spieler, Namen editierbar) / Player management (2–20 players, editable names)
- Spieler-Eliminierung mit Killer-Auswahl und automatischer Platzierung / Player elimination with killer selection and automatic placement
- Rebuy-System (optional, konfigurierbar nach Levels oder Zeit) / Rebuy system (optional, configurable by levels or time)
- Bounty-System (optional, konfigurierbarer Betrag pro Knockout) / Bounty system (optional, configurable amount per knockout)
- Auszahlungsstruktur mit automatischem Vorschlag / Payout structure with automatic suggestion
- Import/Export der Turnierkonfiguration als JSON / Import/export tournament configuration as JSON
- Countdown-Warnung mit Beeps (letzte 10 Sekunden) / Countdown warning with beeps (last 10 seconds)
- Sieges-Melodie bei Turniergewinn / Victory melody when tournament is won
- Vollbild-Modus / Fullscreen mode
- Tastenkürzel (Space, N, V, R) / Keyboard shortcuts (Space, N, V, R)

### Technisch / Technical

- React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4
- 82 Unit-Tests (Vitest) / 82 unit tests (Vitest)
- CI/CD via GitHub Actions (Lint + Test + Build + Deploy)
- Sound via Web Audio API
- Persistenz via localStorage / Persistence via localStorage
