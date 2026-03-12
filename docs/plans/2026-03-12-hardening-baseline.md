# Hardening Baseline (2026-03-12)

Branch:
- `codex/re-audit-hardening`

Ausgangsstatus vor Hardening-Änderungen (Schritt 0):
- `npm run lint`: erfolgreich, 2 Warnings (`security/detect-non-literal-regexp`)
- `npm run build`: erfolgreich, Bundle-/Chunk-Warnungen
- `npm test`: fehlgeschlagen (Vitest lädt Playwright-E2E-Specs)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Ziel für Schritt 1-2:
- Vitest und Playwright vollständig entkoppeln.
- CI-Gates separat ausweisen (`quality` vs `e2e`).
- Nach Änderung: `npm test` muss lokal grün sein, `npm run test:e2e` weiterhin grün.

Ergebnis nach Umsetzung Schritt 1-2:
- `npm run lint`: erfolgreich (2 Warnings unverändert)
- `npm run build`: erfolgreich (Warnungen unverändert)
- `npm test`: erfolgreich (12 Testdateien, 943 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Geänderte Dateien:
- `vite.config.ts` (Vitest-Exclude für `tests/e2e/**`)
- `.github/workflows/deploy.yml` (separate Jobs: `quality`, `e2e`, `pages-build`, `deploy`)

Ergebnis nach Umsetzung Schritt 3-4:
- Seat-Lock-Edge-Case in `seatPlayerAtSmallestTable()` behoben.
- Neue Regressionstests für locked-empty Seats ergänzt.
- `npm test`: erfolgreich (12 Testdateien, 945 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/domain/tables.ts`
- `tests/logic.test.ts`

Ergebnis nach Umsetzung Schritt 5-6:
- League-Kostenberechnung in `computeExtendedStandings()` auf reale Teilnehmerkosten konsolidiert (`payout - netBalance` mit Fallback).
- Neue Regression für variable Rebuy-Kosten ergänzt.
- `npm test`: erfolgreich (12 Testdateien, 946 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/domain/league.ts`
- `tests/logic.test.ts`

Ergebnis nach Umsetzung Schritt 7-8:
- App-Start lädt persistierte `config`/`settings` als Initialzustand (mit Default-Fallback/Settings-Merge).
- Integrationstest für Reload-Szenario (Storage Re-Init über IndexedDB) ergänzt.
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/App.tsx`
- `tests/integration.test.ts`

Ergebnis nach Umsetzung Schritt 9-10:
- Legacy-`LeagueManager`-Pfad aus `App.tsx` entfernt (nicht mehr erreichbar).
- GameDay-Edit-Flow aus der Spieltageliste verdrahtet (`LeagueGameDays` → `LeagueView` → `GameDayEditor` mit `editingGameDay`).
- i18n-Key für Edit-Aktion ergänzt (`league.gameDays.edit` DE/EN).
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/App.tsx`
- `src/components/LeagueView.tsx`
- `src/components/LeagueGameDays.tsx`
- `src/i18n/translations.ts`

Ergebnis nach Umsetzung Security/Lint-Fix (Top-20 #14):
- Dynamische RegExp-Interpolation in i18n-Platzhalterersetzung entfernt (`split/join` statt `new RegExp(...)`).
- `npm run lint`: erfolgreich (0 Warnings)
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/i18n/LanguageContext.tsx`
- `src/i18n/translations.ts`

Ergebnis nach Umsetzung Schritt 11 (Phase 1):
- `App.tsx` entkoppelt: Setup-, League- und Finished-Mode-Rendering in dedizierte Container ausgelagert.
- Neue Mode-Container:
  - `SetupModeContainer`
  - `LeagueModeContainer`
  - `TournamentFinishedContainer`
- Ziel: weitere Entflechtung von `App.tsx` ohne Verhaltensänderung.
- `npm run lint`: erfolgreich (0 Warnings)
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/App.tsx`
- `src/components/modes/SetupModeContainer.tsx`
- `src/components/modes/LeagueModeContainer.tsx`
- `src/components/modes/TournamentFinishedContainer.tsx`

Ergebnis nach Umsetzung Schritt 16 (Multi-Browser-E2E, Phase 1):
- Playwright-Config erweitert: optionales WebKit-Projekt via Env-Flag `PW_INCLUDE_WEBKIT=1`.
- Neuer Script:
  - `npm run test:e2e:cross` (`chromium + webkit`)
- Verifiziert:
  - `PW_INCLUDE_WEBKIT=1 npx playwright test --list` listet 22 Tests (11 Chromium + 11 WebKit).
- Stabiler Standardlauf bleibt unverändert:
  - `npm run test:e2e` erfolgreich (11/11 Chromium).

Hinweis:
- Vollständige lokale WebKit-Ausführung hängt in der aktuellen Umgebung ohne verwertbare Ausgabe (vermutlich Browser-Runtime-/Install-Umgebung), daher hier nur Konfiguration + Listing verifiziert.

Zusätzliche geänderte Dateien:
- `playwright.config.ts`
- `package.json`

Ergebnis nach Umsetzung Schritt 11 (Phase 2):
- Verbleibendes Game-Mode-Layout aus `App.tsx` in dedizierten `GameModeContainer` ausgelagert.
- `App.tsx` rendert im Game-Mode jetzt den Container und bleibt primär Orchestrierungs-/State-Layer.
- `npm run lint`: erfolgreich (0 Warnings)
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `src/App.tsx`
- `src/components/modes/GameModeContainer.tsx`

Ergebnis nach Umsetzung Schritt 13 (Bundle-Optimierung, Phase 1):
- Zusätzliche Vendor-Splits in Vite:
  - `vendor-react`
  - `vendor-monitoring`
  - `vendor-utils`
- Modal-only Komponenten in `App.tsx` lazy geladen:
  - `TemplateManager`
  - `TournamentHistory`
- Build-Resultat verbessert:
  - größter App-Chunk von >500 kB auf ~486 kB reduziert
  - 500-kB-Warnung für App-Hauptchunk entfernt
- `npm run build`: erfolgreich
- `npm run lint`: erfolgreich (0 Warnings)
- `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
- `npm run test:e2e`: erfolgreich (11/11 bestanden)

Zusätzliche geänderte Dateien:
- `vite.config.ts`
- `src/App.tsx`

Ergebnis nach Umsetzung Punkt 2 (WebKit-E2E lauffähig):
- Root-Cause geklärt: fehlendes WebKit-Browser-Binary (`Executable doesn't exist ... webkit-2248/pw_run.sh`).
- WebKit lokal installiert (`npx playwright install webkit`).
- Verifiziert:
  - fokussierter WebKit-Run: `tests/e2e/setup-to-game.spec.ts` (2/2 bestanden)
  - vollständiger Cross-Browser-Run: `npm run test:e2e:cross` (22/22 bestanden; Chromium + WebKit)
- Standardlauf bleibt unverändert:
  - `npm run test:e2e` weiterhin Chromium-only.

Zusätzliche geänderte Dateien:
- keine Codeänderung erforderlich (nur Runtime-Installation im lokalen Playwright-Cache)

Ergebnis nach Umsetzung Punkt 3 (weitere Orchestrierungs-Auslagerung aus `App.tsx`):
- Neue Hook-Kapselung der Turnier-Mode-Transitions:
  - Start/Setup-Wechsel
  - Seating-Overlay-Dismiss
  - Checkpoint-Restore/Dismiss
  - Reset/Restart/Exit-Confirm-Flows
- `App.tsx` auf den neuen Hook umgestellt, Orchestrierungsblock entfernt.
- Verifikation:
  - `npm run lint`: erfolgreich
  - `npm test`: erfolgreich (12 Testdateien, 947 Tests bestanden)
  - `npm run build`: erfolgreich
  - `npm run test:e2e:cross`: erfolgreich (22/22 bestanden)

Zusätzliche geänderte Dateien:
- `src/hooks/useTournamentModeTransitions.ts` (neu)
- `src/App.tsx`

Ergebnis nach Umsetzung Punkt 12 (Remote/TV-State-Contracts versioniert):
- Versionierter Broadcast-Contract für TV-Display eingeführt (`display-sync`, `v1`).
- Runtime-Validation im TV-Receiver ergänzt; inkompatible Messages werden defensiv ignoriert.
- Remote-State-Contract um Versionsfeld ergänzt (`REMOTE_STATE_CONTRACT_VERSION = 1`), Controller validiert Version.
- Contract-Dokumentation ergänzt.
- Verifikation:
  - `npm test`: erfolgreich (13 Testdateien, 949 Tests bestanden)

Zusätzliche geänderte Dateien:
- `src/domain/displayChannel.ts`
- `src/hooks/useTVDisplay.ts`
- `src/components/display/TVDisplayWindow.tsx`
- `src/domain/remote.ts`
- `tests/display-channel.test.ts`
- `docs/plans/2026-03-12-remote-tv-contracts.md` (neu)

Ergebnis nach Umsetzung Schritt 13 (Bundle-Optimierung, Phase 2):
- `CallTheClock` aus statischem Import auf Lazy-Import umgestellt (kein statisch+dynamisch Konflikt mehr).
- Analytics/SpeedInsights auf Lazy-Import mit `Suspense` umgestellt.
- Doppelte `Analytics`-Einbindung entfernt.
- Build-Ergebnis bleibt stabil mit reduziertem Hauptchunk (~484 kB).

Zusätzliche geänderte Dateien:
- `src/components/display/TVDisplayWindow.tsx`
- `src/App.tsx`
- `src/main.tsx`

Ergebnis nach Umsetzung Punkt 15 (i18n-Qualitätsschleife):
- Mehrere bisher identische DE/EN-Keys im Setup/League/Sidebar/Player-Panel-Bereich übersetzt.
- i18n-Testschwelle verschärft: max. identische Keys von `<120` auf `<90`.
- Aktueller Messwert: 75 identische Keys.
- Verifikation:
  - `npm test`: erfolgreich (13 Testdateien, 949 Tests bestanden)

Zusätzliche geänderte Dateien:
- `src/i18n/translations.ts`
- `tests/i18n.test.ts`

Ergebnis nach Umsetzung Punkt 17 (Recovery-Härtung):
- Neue Recovery-Sanitization für Checkpoint-Restore eingeführt (`sanitizeRecoveredConfig`).
- Stale `leagueId` beim Restore wird entfernt, wenn die verknüpfte Liga nicht mehr existiert.
- Checkpoint-State wird bei Mode-Wechsel/Restart konsistent zurückgesetzt.
- Nutzerhinweis für entfernte fehlende Liga-Verknüpfung ergänzt.
- Verifikation:
  - `npm test`: erfolgreich (14 Testdateien, 956 Tests bestanden)

Zusätzliche geänderte Dateien:
- `src/domain/recovery.ts` (neu)
- `src/domain/logic.ts`
- `src/hooks/useTournamentModeTransitions.ts`
- `src/i18n/translations.ts`
- `tests/recovery.test.ts` (neu)

Ergebnis nach Umsetzung Punkt 18 (Operator-UX Quick Start aus League):
- Quick-Start-Aktion in League-GameDays ergänzt (`⚡ Quick Start`).
- Callback erweitert: `onStartTournament(leagueId, { quickStart: true })`.
- Quick-Start validiert Config; bei gültiger Konfiguration direkter Sprung in Game-Mode, sonst Fallback auf Setup mit Toast.

Zusätzliche geänderte Dateien:
- `src/components/LeagueView.tsx`
- `src/components/modes/LeagueModeContainer.tsx`
- `src/App.tsx`
- `src/i18n/translations.ts`

Ergebnis nach Umsetzung Punkt 19-20 (Pro-Blueprint + Paywall-Readiness):
- Entitlements-Framework mit Tiers (`free`, `premium`, `pro`) und Feature-Matrix eingeführt.
- Erste produktive Feature-Gates in der App integriert (Remote/TV/League-Entry).
- Pro-Domain-Skeleton für Rollen, Workspaces, Backups und Multi-Event ergänzt.
- Architektur-/Migrationsdokument für Pro-Pfad ergänzt.
- Verifikation:
  - `npm test`: erfolgreich (14 Testdateien, 956 Tests bestanden)

Zusätzliche geänderte Dateien:
- `src/domain/entitlements.ts` (neu)
- `src/domain/proBlueprint.ts` (neu)
- `src/App.tsx`
- `tests/entitlements.test.ts` (neu)
- `docs/plans/2026-03-12-pro-paywall-blueprint.md` (neu)

Abschluss-Verifikation (Final):
- `npm run lint`: erfolgreich
- `npm test`: erfolgreich (14 Testdateien, 956 Tests bestanden)
- `npm run build`: erfolgreich
- `npm run test:e2e:cross`: erfolgreich (22/22 bestanden)
- Cross-E2E-Stabilisierung:
  - `tests/e2e/controls.spec.ts` auf sprachunabhängige Assertion (`aria-pressed`) umgestellt.
