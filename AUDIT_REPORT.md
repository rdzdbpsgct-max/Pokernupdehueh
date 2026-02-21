# Audit Report – Pokern up de Hüh

**Datum:** 2026-02-21
**Projekt:** Pokern up de Hüh – Poker Tournament Timer
**Tech-Stack:** React 19 + TypeScript 5.9 + Vite 7.3 + Tailwind CSS 4.2
**Deployment:** GitHub Pages via GitHub Actions

---

## Zusammenfassung

| Kategorie | Note | Kommentar |
|---|---|---|
| Projektstruktur | 1-2 | Sauber, logisch, Best Practices |
| Dependencies | 2 | Minimal, nur ESLint-Toolchain outdated |
| Performance | 1-2 | Sehr kleines Bundle, kein Backend |
| Code-Qualität | 2 | Sauber, typisiert, wenige Schwächen |
| Sicherheit | 1 | Kein Backend, keine Secrets, client-only |
| Build & Deployment | 1-2 | CI/CD funktioniert, Build schnell |
| Testing | 3 | Gute Domain-Tests, keine Komponenten-Tests |
| **Gesamt** | **2** | **Solides Hobbyprojekt, gut wartbar** |

### Top 5 kritischste Probleme

1. 🔴 **2 Tests schlagen fehl** – `round-trips a config` und `fills in default anteEnabled when missing` (Tests nicht an neue Features angepasst)
2. 🟡 **ESLint: 2 Fehler** – `setState` in `useEffect` in `PlayerManager.tsx` und `useTimer.ts`
3. 🟡 **npm audit: 10 high-severity Vulnerabilities** (in `minimatch` via ESLint-Toolchain, nur devDependencies)
4. 🟡 **App.tsx ist 665 Zeilen** – zu lang, sollte aufgeteilt werden
5. 🟡 **Keine Komponenten-Tests** – nur Domain-Logik getestet

### Top 5 Quick Wins (hoher Impact, geringer Aufwand)

1. **Tests fixen** (10 Min) – `startingChips` in Test-Config und `anteEnabled: false` als neuen Default im Test
2. **ESLint-Fehler fixen** (15 Min) – `useEffect` → `useMemo`/direkte Berechnung
3. **npm audit fix** (5 Min) – `npm audit fix --force` (ESLint major bump)
4. **`public/`-Ordner entfernen** (1 Min) – ist leer, kein Inhalt
5. **RebuyConfig-Type in Tests ergänzen** (5 Min) – `rebuyCost`/`rebuyChips` Felder

---

## 1. Projekt-Überblick & Struktur

### Dateistruktur

```
Pokernupdehueh/
├── .github/workflows/deploy.yml    # CI/CD Pipeline
├── src/
│   ├── App.tsx                     # 665 LOC – Hauptkomponente ⚠️
│   ├── main.tsx                    # 10 LOC – Entry Point
│   ├── index.css                   # 28 LOC – Globale Styles
│   ├── domain/
│   │   ├── logic.ts                # 598 LOC – Gesamte Business-Logik ⚠️
│   │   ├── types.ts                # 82 LOC – TypeScript-Typen
│   │   └── sounds.ts               # 51 LOC – Web Audio API Sounds
│   ├── components/
│   │   ├── ConfigEditor.tsx         # 286 LOC
│   │   ├── PlayerPanel.tsx          # 250 LOC
│   │   ├── TournamentFinished.tsx   # 222 LOC
│   │   ├── RebuyEditor.tsx          # 167 LOC
│   │   ├── PayoutEditor.tsx         # 161 LOC
│   │   ├── TimerDisplay.tsx         # 148 LOC
│   │   ├── PlayerManager.tsx        # 82 LOC
│   │   ├── ImportExportModal.tsx    # 77 LOC
│   │   ├── SettingsPanel.tsx        # 74 LOC
│   │   ├── Controls.tsx             # 73 LOC
│   │   ├── BountyEditor.tsx         # 51 LOC
│   │   ├── LevelPreview.tsx         # 51 LOC
│   │   ├── RebuyStatus.tsx          # 38 LOC
│   │   └── PresetPicker.tsx         # 29 LOC
│   └── hooks/
│       └── useTimer.ts              # 243 LOC
├── tests/
│   └── logic.test.ts                # 791 LOC
├── public/                          # ⚠️ Leer, kann entfernt werden
├── package.json
├── vite.config.ts
├── tsconfig.json / .app.json / .node.json
├── eslint.config.js
└── CHANGELOG.md
```

**Gesamt-LOC (Quellcode):** ~3.424 Zeilen (ohne Tests)
**Gesamt mit Tests:** ~4.215 Zeilen

### Bewertung

- ✅ Klare Trennung: `domain/` (Logik), `components/` (UI), `hooks/` (State)
- ✅ Keine zirkulären Abhängigkeiten
- ✅ Typen zentral in `types.ts`
- ⚠️ `App.tsx` (665 LOC) und `logic.ts` (598 LOC) sind die größten Dateien
- ⚠️ `public/` Ordner ist leer (0 Dateien)

### Ungenutzte / Redundante Dateien

| Datei | Status |
|---|---|
| `public/` | Leer, kann entfernt werden |
| `.DS_Store` | macOS-Artefakt, in .gitignore |

---

## 2. Dependency-Analyse

### package.json

**Dependencies (2):**
| Paket | Version | Status |
|---|---|---|
| react | ^19.2.0 | ✅ Aktuell |
| react-dom | ^19.2.0 | ✅ Aktuell |

**DevDependencies (15):**
| Paket | Version | Status |
|---|---|---|
| @eslint/js | ^9.39.1 | ⚠️ 10.0.1 verfügbar (breaking) |
| @tailwindcss/vite | ^4.2.0 | ✅ Aktuell |
| @testing-library/jest-dom | ^6.9.1 | ✅ Aktuell |
| @testing-library/react | ^16.3.2 | ✅ Aktuell |
| @types/node | ^24.10.1 | ⚠️ 25.3.0 verfügbar (breaking) |
| @types/react | ^19.2.7 | ✅ Aktuell |
| @types/react-dom | ^19.2.3 | ✅ Aktuell |
| @vitejs/plugin-react | ^5.1.1 | ✅ Aktuell |
| eslint | ^9.39.1 | ⚠️ 10.0.1 verfügbar (breaking) |
| eslint-plugin-react-hooks | ^7.0.1 | ✅ Aktuell |
| eslint-plugin-react-refresh | ^0.4.24 | ⚠️ 0.5.0 verfügbar (breaking) |
| globals | ^16.5.0 | ⚠️ 17.3.0 verfügbar (breaking) |
| jsdom | ^28.1.0 | ✅ Aktuell |
| tailwindcss | ^4.2.0 | ✅ Aktuell |
| typescript | ~5.9.3 | ✅ Aktuell |
| typescript-eslint | ^8.48.0 | ✅ Aktuell |
| vite | ^7.3.1 | ✅ Aktuell |
| vitest | ^4.0.18 | ✅ Aktuell |

### npm audit

```
10 high severity vulnerabilities
```

Alle in `minimatch` → nur via ESLint-Toolchain (devDependencies), **kein Produktionsrisiko**. Fix: `npm audit fix --force` (bumpt eslint auf 10.x).

### Nicht verwendete Dependencies

| Paket | Tatsächlich genutzt? |
|---|---|
| @testing-library/jest-dom | ⚠️ Nicht importiert in Tests – nur `vitest` verwendet |
| @testing-library/react | ⚠️ Nicht importiert – keine Komponenten-Tests |

**Empfehlung:** `@testing-library/jest-dom` und `@testing-library/react` erst nutzen wenn Komponenten-Tests geschrieben werden, oder entfernen.

### Bundle-Size-Impact

- Nur 2 Produktions-Dependencies: `react` + `react-dom`
- Tailwind CSS wird zur Build-Zeit verarbeitet (kein Runtime-Overhead)
- Kein CSS-in-JS, keine State-Management-Library, kein Router → sehr schlank

---

## 3. Performance-Analyse

### 3.1 Bundle-Größe

```
dist/index.html                   0.61 kB │ gzip:  0.41 kB
dist/assets/index-DAMD89__.css   26.53 kB │ gzip:  5.64 kB
dist/assets/index-BHR_6vmB.js   255.95 kB │ gzip: 73.96 kB
───────────────────────────────────────────────────────
Total                           283.09 kB │ gzip: 80.01 kB
```

**Bewertung:** 🟢 Ausgezeichnet. ~80 KB gzipped total (davon ~70 KB React selbst).

### 3.2 Re-Render-Analyse

| Problem | Schweregrad | Datei |
|---|---|---|
| `App.tsx` enthält gesamten Config-State | 🟡 Mittel | `src/App.tsx` |
| `useMemo` wird sinnvoll für teure Berechnungen eingesetzt | ✅ Gut | |
| `useCallback` für Event-Handler | ✅ Gut | |
| Timer tickt alle 100ms → viele Re-Renders der Timer-Komponenten | 🟢 Niedrig | `useTimer.ts:116` |

**Detail:** Der Timer rendert alle 100ms den `remainingSeconds`-State neu. Da nur `TimerDisplay` davon betroffen ist und die Komponente klein ist, ist der Performance-Impact vernachlässigbar.

### 3.3 Code-Splitting

- ⚠️ Kein Lazy-Loading / Code-Splitting implementiert
- **Kein Problem**, da die App nur 256 KB JS hat – Code-Splitting würde den Overhead durch Chunk-Loading nicht rechtfertigen

### 3.4 Assets

- ✅ Kein einziges Bild, Font oder Icon-File
- ✅ Favicon ist ein inline SVG (data-URI)
- ✅ Sounds werden via Web Audio API synthetisiert (keine Audio-Dateien)
- ✅ Font: System-Font-Stack (`Inter, system-ui, ...`)

### 3.5 Netzwerk

- ✅ Keine API-Calls – vollständig client-seitig
- ✅ Alle Daten in `localStorage`
- ✅ Kein Backend, keine Datenbank

---

## 4. Code-Qualität & Komplexität

### 4.1 TypeScript-Konfiguration

- ✅ `strict: true` aktiviert
- ✅ `noUnusedLocals: true`, `noUnusedParameters: true`
- ✅ Kein `any` im gesamten Codebase
- ✅ Saubere Type-Definitionen in `types.ts`
- ✅ `Record<string, unknown>` statt `any` für JSON-Parsing

### 4.2 ESLint-Ergebnisse

```
2 Fehler, 0 Warnungen
```

| # | Datei | Zeile | Problem |
|---|---|---|---|
| 1 | `PlayerManager.tsx` | 14 | `setState` in `useEffect` – kann Cascading-Renders verursachen |
| 2 | `useTimer.ts` | 129 | `setState` in `useEffect` – kann Cascading-Renders verursachen |

### 4.3 Duplizierter Code (DRY-Verstöße)

| Problem | Schweregrad | Dateien |
|---|---|---|
| Spinner-Rounding-Logik (ceil/floor) ist 2x identisch implementiert | 🟡 Mittel | `App.tsx:392-396`, `RebuyEditor.tsx:81-84` |
| `loadConfig()` und `importConfigJSON()` enthalten fast identische Parsing-Logik | 🟡 Mittel | `logic.ts:448-488`, `logic.ts:508-548` |
| Toggle-Button CSS-Pattern wird ca. 8x wiederholt | 🟢 Niedrig | Diverse Komponenten |

### 4.4 Überlange Dateien

| Datei | Zeilen | Bewertung |
|---|---|---|
| `App.tsx` | 665 | 🟡 Zu lang – sollte in Setup/Game-Subkomponenten aufgeteilt werden |
| `logic.ts` | 598 | 🟡 Am Limit – könnte in `presets.ts`, `persistence.ts`, `validation.ts` aufgeteilt werden |
| `tests/logic.test.ts` | 791 | 🟢 OK für Test-Datei |

### 4.5 Magische Zahlen

| Wert | Stelle | Kontext |
|---|---|---|
| `100` (TICK_INTERVAL_MS) | `useTimer.ts:11` | ✅ Benannt als Konstante |
| `10` (Countdown-Sekunden) | `useTimer.ts:70` | 🟢 Hardcoded, aber klar im Kontext |
| `0.125` (Ante-Faktor) | `logic.ts:347` | ✅ Kommentiert als "12.5% of BB" |
| `20000` (Default-Chips) | `logic.ts:248` | 🟢 Parameter-Default, klar |
| `2` / `20` (Spieler-Limits) | `PlayerManager.tsx:18` | 🟢 Klare Grenzen |
| `600` (10 Min Pausen-Default) | `ConfigEditor.tsx:19` | 🟢 Sinnvoller Default |

### 4.6 Zyklomatische Komplexität (hoch)

| Funktion | Datei | Komplexität | Bewertung |
|---|---|---|---|
| `App()` (Render) | `App.tsx` | ~12 | 🟡 Hoch – viele Conditional-Renders |
| `tick()` | `useTimer.ts:58-110` | ~8 | 🟡 Mittel-hoch – verschachtelte Conditions |
| `computeDefaultAnte()` | `logic.ts:345-357` | ~7 | 🟢 Angemessen |
| `loadConfig()` | `logic.ts:448-488` | ~6 | 🟢 Angemessen |

### 4.7 Anti-Patterns

| Problem | Schweregrad | Datei:Zeile |
|---|---|---|
| IIFE im JSX für Next-Level-Anzeige | 🟢 Niedrig | `TimerDisplay.tsx:63-84` |
| `useState` für Derived State (globalMinutes) | 🟡 Mittel | `ConfigEditor.tsx:16` |
| Mutable ID-Counter (`let idCounter = 0`) | 🟢 Niedrig | `logic.ts:16` |

---

## 5. Sicherheit

### Bewertung: 🟢 Kein Risiko

| Prüfpunkt | Status |
|---|---|
| API-Keys / Secrets im Code | ✅ Keine gefunden |
| `.env`-Dateien | ✅ Keine vorhanden |
| Input-Validierung | ✅ `Math.max()`, `Math.min()` an allen Eingaben |
| XSS-Anfälligkeit | ✅ React escaped alles automatisch, kein `dangerouslySetInnerHTML` |
| localStorage-Daten | 🟢 Nur Config-Daten, keine sensiblen Informationen |
| JSON-Import | ✅ Typen werden bei Import validiert und Defaults gesetzt |
| CORS | N/A – kein Backend |
| SQL-Injection | N/A – keine Datenbank |
| Secrets in Git-History | ✅ Keine gefunden |

**Einziger Hinweis:** Der JSON-Import (`importConfigJSON`) akzeptiert beliebige JSON-Strukturen und setzt fehlende Felder auf Defaults. Ein manipuliertes JSON könnte theoretisch unerwartete Level-Konfigurationen laden, aber das hat keine Sicherheitsauswirkung, da die App rein client-seitig ist.

---

## 6. Build & Deployment

### Build

```bash
$ npm run build
tsc -b && vite build
✓ built in 557ms
```

- ✅ TypeScript-Check vor Build (`tsc -b`)
- ✅ Vite-Build mit Tree-Shaking und Minification
- ✅ Build-Zeit: ~600ms (exzellent)

### CI/CD Pipeline (`.github/workflows/deploy.yml`)

- ✅ Trigger: Push auf `main` + manueller Dispatch
- ✅ Node.js 20 mit npm-Cache
- ✅ `npm ci` (deterministische Installs)
- ✅ GitHub Pages Deployment mit Artifact-Upload
- ✅ Concurrency-Group verhindert parallele Deployments
- ⚠️ Tests werden im CI nicht ausgeführt (`npm run test` fehlt im Workflow)
- ⚠️ ESLint wird im CI nicht ausgeführt (`npm run lint` fehlt im Workflow)

### .gitignore

- ✅ `node_modules`, `dist`, `dist-ssr` ausgeschlossen
- ✅ `.claude/` ausgeschlossen
- ✅ IDE-Dateien ausgeschlossen
- ✅ `.DS_Store` ausgeschlossen
- 🟢 `.env` nicht explizit gelistet (aber es gibt keine .env-Dateien)

### Empfehlung

```yaml
# deploy.yml – nach "Install dependencies" hinzufügen:
- name: Lint
  run: npm run lint

- name: Test
  run: npm run test
```

---

## 7. Testing

### Test-Ergebnisse

```
74 Tests | 2 failed | 72 passed
Duration: 675ms
```

### Fehlgeschlagene Tests

#### 1. `round-trips a config` (Zeile 282)

**Problem:** Test-Config enthält kein `startingChips`-Feld (seit Einführung der Startchips-Funktion fehlt es).

```typescript
// Test erwartet:
{ name: 'Test', levels: [...], anteEnabled: true, players: [...],
  payout: ..., rebuy: ..., bounty: ..., buyIn: 10 }

// Import gibt zurück (zusätzliches Feld):
{ ...obiges, startingChips: 20000 }
```

**Fix:**
```typescript
// tests/logic.test.ts, Zeile 278: startingChips hinzufügen
const config: TournamentConfig = {
  name: 'Test',
  levels: [{ id: '1', type: 'level', durationSeconds: 600, smallBlind: 25, bigBlind: 50 }],
  anteEnabled: true,
  players: [makePlayer({ id: 'p1', name: 'Alice' })],
  payout: defaultPayoutConfig(),
  rebuy: defaultRebuyConfig(),
  bounty: defaultBountyConfig(),
  buyIn: 10,
  startingChips: 20000,  // ← hinzufügen
};
```

#### 2. `fills in default anteEnabled when missing` (Zeile 296)

**Problem:** Test erwartet `anteEnabled: true` als Default, aber der Default wurde auf `false` geändert.

**Fix:**
```typescript
// tests/logic.test.ts, Zeile 296:
expect(imported?.anteEnabled).toBe(false); // war: toBe(true)
```

### Test-Abdeckung

| Bereich | Abgedeckt? |
|---|---|
| `formatTime` | ✅ 5 Tests |
| `computeRemaining` | ✅ 3 Tests |
| `advanceLevel` / `previousLevel` | ✅ 4 Tests |
| `resetCurrentLevel` / `restartTournament` | ✅ 3 Tests |
| `validateConfig` | ✅ 4 Tests |
| Import/Export | ✅ 7 Tests (2 fehlerhaft) |
| `getLevelLabel` / `getBlindsText` | ✅ 5 Tests |
| `defaultPlayers` | ✅ 3 Tests |
| `validatePayoutConfig` | ✅ 5 Tests |
| `stripAnteFromLevels` | ✅ 3 Tests |
| `isRebuyActive` | ✅ 5 Tests |
| `computeTournamentElapsedSeconds` | ✅ 3 Tests |
| `computeTotalRebuys` / `computePrizePool` / `computePayouts` | ✅ 11 Tests |
| Backward-Compatibility | ✅ 10 Tests |
| **Neue Funktionen ohne Tests:** | |
| `computeDefaultAnte()` | ❌ Keine Tests |
| `applyDefaultAntes()` | ❌ Keine Tests |
| React-Komponenten | ❌ Keine Tests |
| `useTimer` Hook | ❌ Keine Tests |
| Sound-Funktionen | ❌ Keine Tests |

### Empfehlung

Priorität 1: Tests fixen (2 fehlende Felder/Defaults)
Priorität 2: Tests für `computeDefaultAnte` und `applyDefaultAntes` hinzufügen
Priorität 3: Komponenten-Tests mit `@testing-library/react` (Dependencies sind schon installiert)

---

## 8. Funktionstest

```bash
$ npm run dev
VITE v7.3.1 ready in 219 ms
➜ Local: http://localhost:5174/Pokernupdehueh/
```

- ✅ Dev-Server startet sofort (219ms)
- ✅ Keine Konsolen-Fehler oder Warnungen
- ✅ Build erfolgreich (557ms)
- ✅ TypeScript-Check ohne Fehler

---

## Detailergebnisse

### 🔴 Kritisch

#### F-01: Tests schlagen fehl

- **Kategorie:** Testing
- **Datei:** `tests/logic.test.ts`, Zeilen 268-282 und 293-296
- **Problem:** 2 Tests schlagen fehl weil sie nicht an neue Features angepasst wurden:
  1. `round-trips a config` – fehlendes `startingChips` Feld
  2. `fills in default anteEnabled` – erwartet `true`, Default ist jetzt `false`
- **Auswirkung:** CI würde fehlschlagen wenn Tests im Workflow wären; falsche Qualitätssicherung
- **Lösung:** `startingChips: 20000` in Test-Config ergänzen; `toBe(true)` → `toBe(false)`
- **Aufwand:** 10 Minuten

### 🟡 Mittel

#### F-02: ESLint-Fehler – setState in useEffect

- **Kategorie:** Code-Qualität / Performance
- **Dateien:**
  - `src/components/PlayerManager.tsx:14` – `setCountInput` in `useEffect`
  - `src/hooks/useTimer.ts:129` – `setTimerState` in `useEffect`
- **Problem:** `setState` direkt in `useEffect`-Body kann Cascading-Renders verursachen
- **Auswirkung:** Unnötige Extra-Renders; ESLint-Fehler blockieren clean lint
- **Lösung:**
  - `PlayerManager.tsx`: `countInput` aus `players.length` direkt ableiten oder `useSyncExternalStore` nutzen
  - `useTimer.ts`: Level-Reset-Logik in den Level-Change-Handler verschieben statt als Effekt
- **Aufwand:** 30 Minuten

#### F-03: npm audit – 10 high-severity Vulnerabilities

- **Kategorie:** Sicherheit (devDependencies)
- **Problem:** `minimatch <10.2.1` ReDoS-Vulnerability in ESLint-Toolchain
- **Auswirkung:** Nur devDependencies betroffen, kein Produktionsrisiko. Aber flaggt in Security-Scans.
- **Lösung:** `npm audit fix --force` (bumpt eslint auf 10.x, breaking change)
- **Aufwand:** 15-30 Minuten (ggf. ESLint-Config anpassen)

#### F-04: App.tsx zu lang (665 LOC)

- **Kategorie:** Code-Qualität / Wartbarkeit
- **Datei:** `src/App.tsx`
- **Problem:** Enthält Setup-View, Game-View, Timer-Logik, Player-Logik, Modals – alles in einer Datei
- **Auswirkung:** Schwer zu navigieren und zu warten bei weiterer Feature-Entwicklung
- **Lösung:** Aufteilen in:
  - `SetupView.tsx` (~250 LOC) – Setup-Formular
  - `GameView.tsx` (~200 LOC) – Timer + Panels
  - `App.tsx` (~200 LOC) – State-Management + Routing
- **Aufwand:** 2-3 Stunden

#### F-05: Duplizierte loadConfig / importConfigJSON Logik

- **Kategorie:** Code-Qualität (DRY)
- **Datei:** `src/domain/logic.ts`, Zeilen 448-548
- **Problem:** `loadConfig()` und `importConfigJSON()` enthalten fast identischen Parsing-Code
- **Auswirkung:** Bei neuen Feldern müssen Änderungen an zwei Stellen gemacht werden (Fehlerquelle)
- **Lösung:** Gemeinsame `parseConfig(parsed: unknown): TournamentConfig` Funktion extrahieren
- **Aufwand:** 30 Minuten

#### F-06: Duplizierte Spinner-Rounding-Logik

- **Kategorie:** Code-Qualität (DRY)
- **Dateien:** `src/App.tsx:392-396`, `src/components/RebuyEditor.tsx:81-84`
- **Problem:** Identische ceil/floor-Logik für 1000er-Schritte 2x implementiert
- **Lösung:** Helper-Funktion `roundToStep(raw, prev, step)` extrahieren
- **Aufwand:** 15 Minuten

#### F-07: CI führt keine Tests/Lint aus

- **Kategorie:** Build & Deployment
- **Datei:** `.github/workflows/deploy.yml`
- **Problem:** Weder `npm run lint` noch `npm run test` sind im CI-Workflow
- **Auswirkung:** Fehlerhafte Commits können deployed werden
- **Lösung:** Lint- und Test-Steps vor Build hinzufügen
- **Aufwand:** 10 Minuten

#### F-08: Tests für neue Funktionen fehlen

- **Kategorie:** Testing
- **Problem:** `computeDefaultAnte()` und `applyDefaultAntes()` haben keine Tests
- **Auswirkung:** Regressionen bei Ante-Berechnung werden nicht erkannt
- **Lösung:** Tests hinzufügen die verschiedene BB-Werte und Rundungen prüfen
- **Aufwand:** 30 Minuten

### 🟢 Niedrig

#### F-09: Leerer `public/`-Ordner

- **Kategorie:** Projektstruktur
- **Datei:** `public/`
- **Problem:** Ordner existiert aber ist leer
- **Lösung:** Entfernen oder mit favicon füllen
- **Aufwand:** 1 Minute

#### F-10: RebuyConfig in Tests unvollständig

- **Kategorie:** Testing
- **Datei:** `tests/logic.test.ts:501-523`
- **Problem:** `RebuyConfig` in Tests hat nicht die neuen `rebuyCost`/`rebuyChips` Felder
- **Auswirkung:** Tests laufen trotzdem (TypeScript-Check nur in src/), aber Typen stimmen nicht
- **Lösung:** `rebuyCost` und `rebuyChips` zu Test-RebuyConfigs hinzufügen
- **Aufwand:** 10 Minuten

#### F-11: IIFE im JSX (TimerDisplay)

- **Kategorie:** Code-Qualität
- **Datei:** `src/components/TimerDisplay.tsx:63-84`
- **Problem:** Immediately Invoked Function Expression im JSX für Next-Level-Anzeige
- **Lösung:** In eigene `NextLevelInfo`-Subkomponente oder Variable extrahieren
- **Aufwand:** 10 Minuten

#### F-12: `useState` für Derived State

- **Kategorie:** Code-Qualität
- **Datei:** `src/components/ConfigEditor.tsx:16,21`
- **Problem:** `globalMinutes` und `globalBreakMinutes` werden aus Props initialisiert aber nicht synchronisiert bei Preset-Wechsel
- **Auswirkung:** Nach Preset-Wechsel zeigen die globalen Inputs noch die alten Werte
- **Lösung:** `useState` mit Key-Pattern oder `useEffect` zum Sync (aber ESLint warnt davor)
- **Aufwand:** 15 Minuten

#### F-13: Ungenutzte Testing-Library-Dependencies

- **Kategorie:** Dependencies
- **Dateien:** `package.json`
- **Problem:** `@testing-library/jest-dom` und `@testing-library/react` installiert aber nirgends importiert
- **Lösung:** Entfernen oder Komponenten-Tests schreiben
- **Aufwand:** 5 Minuten

#### F-14: `makeConfig` Helper in Tests setzt `anteEnabled: true`

- **Kategorie:** Testing
- **Datei:** `tests/logic.test.ts:32`
- **Problem:** Test-Helper `makeConfig` setzt `anteEnabled: true` als Default, aber die App nutzt jetzt `false`
- **Auswirkung:** Tests testen mit einem Default der nicht dem Produktions-Default entspricht
- **Lösung:** `anteEnabled: true` → `anteEnabled: false` in `makeConfig`
- **Aufwand:** 5 Minuten

---

## Optimierungsplan

### Phase 1: Sofort (unter 1 Stunde)

| # | Maßnahme | Impact | Aufwand |
|---|---|---|---|
| 1 | Tests fixen (F-01) | 🔴 Hoch | 10 Min |
| 2 | Tests für `computeDefaultAnte` hinzufügen (F-08) | 🟡 Mittel | 30 Min |
| 3 | CI um Lint + Test erweitern (F-07) | 🟡 Mittel | 10 Min |
| 4 | Leeren `public/`-Ordner entfernen (F-09) | 🟢 Niedrig | 1 Min |
| 5 | Ungenutzte Test-Dependencies prüfen (F-13) | 🟢 Niedrig | 5 Min |

### Phase 2: Kurzfristig (1 Tag)

| # | Maßnahme | Impact | Aufwand |
|---|---|---|---|
| 6 | ESLint-Fehler beheben (F-02) | 🟡 Mittel | 30 Min |
| 7 | loadConfig/importConfigJSON deduplizieren (F-05) | 🟡 Mittel | 30 Min |
| 8 | Spinner-Rounding-Helper extrahieren (F-06) | 🟡 Mittel | 15 Min |
| 9 | npm audit Vulnerabilities fixen (F-03) | 🟡 Mittel | 30 Min |
| 10 | IIFE in TimerDisplay refactorn (F-11) | 🟢 Niedrig | 10 Min |

### Phase 3: Mittelfristig (1 Woche)

| # | Maßnahme | Impact | Aufwand |
|---|---|---|---|
| 11 | App.tsx aufteilen (F-04) | 🟡 Mittel | 2-3 Std |
| 12 | logic.ts in Module aufteilen | 🟡 Mittel | 1-2 Std |
| 13 | Komponenten-Tests mit @testing-library/react | 🟡 Mittel | 3-4 Std |
| 14 | globalMinutes-Sync bei Preset-Wechsel (F-12) | 🟢 Niedrig | 15 Min |

---

## Metriken-Vergleich (Vorher → Nachher-Schätzung)

| Metrik | Aktuell | Nach Phase 1 | Nach Phase 3 |
|---|---|---|---|
| Bundle JS (gzip) | 73.96 kB | 73.96 kB | ~73 kB |
| Bundle CSS (gzip) | 5.64 kB | 5.64 kB | ~5.5 kB |
| Produktions-Dependencies | 2 | 2 | 2 |
| DevDependencies | 15 | 13-15 | 13-15 |
| npm audit Vulnerabilities | 10 high | 10 high | 0 |
| ESLint-Fehler | 2 | 2 | 0 |
| Test-Fehler | 2 | 0 | 0 |
| Test-Abdeckung (Domain) | ~85% | ~95% | ~95% |
| Test-Abdeckung (Komponenten) | 0% | 0% | ~40% |
| Quellcode LOC | 3.424 | 3.424 | ~3.500 |
| Größte Datei (LOC) | 665 (App.tsx) | 665 | ~250 |
| Geschätzte Ladezeit (3G) | ~1.5s | ~1.5s | ~1.5s |
| Geschätzte Ladezeit (4G) | ~0.3s | ~0.3s | ~0.3s |

---

## Fazit

Das Projekt ist ein gut strukturiertes, schlankes Frontend-Projekt mit klarer Architektur. Die Hauptprobleme sind:

1. **2 fehlende Test-Updates** durch Feature-Entwicklung (schnell behebbar)
2. **Moderate Code-Duplikation** die bei weiterer Feature-Entwicklung zum Problem werden kann
3. **App.tsx ist zu lang** und sollte bei Gelegenheit aufgeteilt werden
4. **CI führt keine Qualitätschecks durch** (Lint, Tests)

Keine Sicherheitsprobleme, keine Performance-Probleme, keine architektonischen Fehler. Das Projekt ist für ein Hobby-/Nebenprojekt überdurchschnittlich gut aufgestellt.
