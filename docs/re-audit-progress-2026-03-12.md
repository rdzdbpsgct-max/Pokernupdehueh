# Final-Re-Audit (Stand: 2026-03-12, Update nach Umsetzung)

## 1. Executive Summary
Der zuvor offene Härtungsblock aus dem Erst-Audit wurde im verifizierten Codebestand umgesetzt. Die früheren Produktblocker (Test-Gate-Kollision, Seat-Lock-Edge-Case, League-Kosteninkonsistenz, Persistenz-Restore-Lücke, Legacy-Flow) sind im aktuellen Stand geschlossen.

Gesamturteil (Ist-Stand nach Re-Audit):
- Funktionsreife: hoch
- Betriebsreife: hoch (für Free/Premium)
- Monetarisierbarkeit: hoch (Free/Premium launch-ready), mittel (Pro noch als Blueprint/Fundament)
- Empfohlener Launchmodus: Free + Premium sofort, Pro als nächste Ausbauwelle

## 2. Überblick über den tatsächlich geprüften aktuellen Codebestand
Geprüft wurde der echte Ist-Code in:
- Repo: `/Users/michaelprill/Claudeprojekte/7mountainpoker-codex`
- Branch: `codex/re-audit-hardening`
- Auditdatum: 2026-03-12

Verifizierte Build-/Qualitätsläufe:
- `npm run lint`: erfolgreich, 0 Warnings
- `npm test` (`vitest run`): erfolgreich, 14 Testdateien, 956 Tests bestanden
- `npm run build`: erfolgreich, größter App-Chunk `dist/assets/index-*.js` ~484.14 kB
- `npm run test:e2e:cross`: erfolgreich, 22/22 bestanden (Chromium + WebKit)

Verifizierte Codebasis-Metrik:
- `src/App.tsx`: 1219 LOC
- Domain-Module: 29 Dateien
- Komponenten: 67 Dateien
- Hooks: 13 Dateien
- Testdateien gesamt: 21 (davon 6 unter `tests/e2e` inkl. Helper)

## 3. Architektur- und Projektstruktur
Architekturtyp:
- React/TypeScript SPA mit Modus-Orchestrierung (`setup`/`game`/`league`) in `src/App.tsx`, ergänzt um dedizierte Mode-Container (`src/components/modes/*`).

Strukturelle Schichten (nachweisbar):
- UI/Komponenten: `src/components/*`
- Hooks/Orchestrierung: `src/hooks/*`
- Domainlogik: `src/domain/*`
- i18n/Theme: `src/i18n/*`, `src/theme/*`
- Tests: `tests/*`, `tests/e2e/*`

Wesentliche Architekturmerkmale:
- Persistenz-Bootstrap mit IndexedDB/localStorage-Fallback: `src/main.tsx:52-54`, `src/domain/storage.ts`
- Start-Restore für `config`/`settings`: `src/App.tsx:104-115`
- Mode-Transition-Hook inkl. Recovery-Härtung: `src/hooks/useTournamentModeTransitions.ts:63-284`
- Versionierte TV-/Remote-Verträge:
  - Display-Contract v1: `src/domain/displayChannel.ts:54-106`
  - Remote-State-Contract v1: `src/domain/remote.ts:218`, `src/domain/remote.ts:438-445`, `src/domain/remote.ts:567-569`
- Feature-Tier-Gating (Free/Premium/Pro) als zentrale Domänenschicht: `src/domain/entitlements.ts:1-90`

## 4. Vollständige verifizierte Funktionsinventur
Nachweisbar implementierte Funktionsblöcke:

Turnier-Setup und Regeln:
- Blindstruktur-Generator, Presets, manuelle Level/Break-Struktur (`src/domain/blinds.ts`, `src/components/BlindGenerator.tsx`)
- Buy-in, Rebuy, Add-On, Bounty inkl. Mystery-Bounty (`src/domain/types.ts`, `src/hooks/useTournamentActions.ts`)
- Late Registration + Re-Entry inkl. Multi-Table-Seating (`src/domain/tables.ts:196-236`)
- Payout-Konfiguration + Validierung (`src/domain/tournament.ts`, `src/App.tsx:987-999`)

Runtime/Game:
- Drift-korrigierter Timer (`src/domain/timer.ts`, `src/hooks/useTimer.ts`)
- Start/Pause/Next/Prev/Reset/Restart + Keyboard-Shortcuts (`src/components/Controls.tsx`, `tests/e2e/controls.spec.ts`)
- Last Hand, Hand-for-Hand, Call the Clock (`src/App.tsx`, `src/components/CallTheClock.tsx`)
- Audio/Voice-Ansagen (`src/domain/sounds.ts`, `src/domain/speech.ts`, `src/hooks/useVoiceAnnouncements.ts`)

Spieler- und Tischlogik:
- Eliminierung/Reinstate/Rebuy/Add-On/Stack-Tracking (`src/hooks/useTournamentActions.ts`)
- Side-Pot-Rechner inkl. Payout-Auflösung (`src/components/SidePotCalculator.tsx`, `src/domain/tournament.ts`)
- Multi-Table Balancing/Dissolve/Final-Table-Merge/Seat-Locks (`src/domain/tables.ts`)
- Move-Log + Voice-Announcements (`src/components/MultiTablePanel.tsx`, `src/hooks/useTournamentActions.ts`)

League:
- Leagues/Seasons/Tiebreaker/Korrekturen (`src/domain/league.ts`, `src/domain/types.ts`)
- Extended Standings + konsolidierte Kostenberechnung (`src/domain/league.ts:21-33`, `src/domain/league.ts:141-184`)
- Manual GameDay Entry + Edit aus Liste (`src/components/LeagueView.tsx:44-46`, `src/components/LeagueGameDays.tsx:164-170`)
- Quick-Start aus League mit Validierungs-Fallback (`src/components/LeagueView.tsx:131-134`, `src/App.tsx:983-1006`)

Display/Remote:
- TV-Display-Fenster via BroadcastChannel mit Full-State + Tick + Overlay (`src/hooks/useTVDisplay.ts:89-127`)
- Runtime-Validation für TV-Messages (`src/components/display/TVDisplayWindow.tsx:41-45`)
- Remote Control mit HMAC/Replay-Schutz/Rate-Limit + versioniertem State-Protokoll (`src/domain/remote.ts`)

Persistenz/Recovery/Import/Export:
- Config/Settings/Checkpoint/History/Templates/Leagues/GameDays im Storage-Layer (`src/domain/storage.ts`)
- Checkpoint-Recovery mit stale-League-Sanitization (`src/domain/recovery.ts:12-30`)
- Restore-Flow-Härtung bei Mode-Wechsel/Restart (`src/hooks/useTournamentModeTransitions.ts:89-166`, `231-251`)

Betrieb/Qualität:
- Getrennte Quality- und E2E-CI-Gates (`.github/workflows/deploy.yml:19-126`)
- Vitest-E2E-Excludes gesetzt (`vite.config.ts:79-85`)
- Multi-Browser-E2E (Chromium + optional WebKit) (`playwright.config.ts:10-15`, `package.json:13-15`)

Monetarisierungs-Fundament:
- Entitlements + Feature-Matrix (`src/domain/entitlements.ts:27-36`)
- Produktive Gates in App-UI (`src/App.tsx:93-96`, `870-898`, `939-953`)
- Pro-Domain-Blueprint (`src/domain/proBlueprint.ts:1-35`)

## 5. Reifegradbewertung der vorhandenen Funktionen
Bewertungsmodell:
- R5 = marktführend belastbar
- R4 = stark produktionsreif
- R3 = solide nutzbar mit begrenzten Risiken
- R2 = funktional, aber mit signifikanten Lücken
- R1 = prototypisch/fragmentiert

Reifegrad nach Funktionsdomäne:
- Core Timer & Runtime: R4
- Turnier-Setup & Regelmodell: R4
- Multi-Table-Betrieb: R4
- League-Funktionen: R4
- TV/Remote: R4
- Persistenz & Recovery: R4
- Test/CI-Betriebsreife: R4
- Pro-Betriebsfähigkeiten (Cloud/Rollen/Multi-Event): R2 (Blueprint/Fundament)
- Gesamtproduktreife: R4 (Free/Premium marktfähig)

## 6. Re-Audit der von Claude Code erzeugten Erweiterungen
Geprüfte Erweiterungswellen sind im Ist-Code substanziell vorhanden und im Re-Audit belastbar:
- League-Ausbau inkl. Edit-Flow und Finanzkonsolidierung: verifiziert
- Remote-Rebuild mit HMAC/Replay/Rate-Limit + Contract-Versionierung: verifiziert
- IndexedDB-Migration + Start-Restore + Recovery-Härtung: verifiziert
- Testsuite-Ausbau inkl. Runner-Trennung und Cross-Browser-E2E: verifiziert
- Bundle-/Architekturwellen (Mode-Container, Lazy-Splits): verifiziert
- Pro-/Paywall-Readiness (Entitlements + Blueprint): verifiziert als Fundament

Re-Audit-Befund:
- Positiv: keine Scheinimplementierung, Features sind im Produktionspfad verdrahtet.
- Positiv: frühere Kernmängel sind reproduzierbar behoben.
- Restpunkt: Pro ist architektonisch vorbereitet, aber noch ohne echten Cloud-/Org-Betriebsstack.

## 7. Edge Cases und reale Nutzungsszenarien
Verifizierte Edge-Case-Absicherung:
- Late Reg/Re-Entry bei gelockten Seats: korrigiert über lowest available unlocked seat (`src/domain/tables.ts:206-223`)
- League mit variablen Rebuy-/Add-on-Kosten: konsolidiert über Teilnehmerkostenfunktion (`src/domain/league.ts:21-33`, `180-183`)
- Checkpoint mit gelöschter Liga: stale `leagueId` wird entfernt (`src/domain/recovery.ts:19-29`)
- Mode-Wechsel/Restart mit Checkpoint-Resten: Checkpoint wird konsistent gecleart (`src/hooks/useTournamentModeTransitions.ts:91-93`, `164-166`, `237-239`)
- TV-/Remote-Protokoll-Mismatch: inkompatible Versionen werden ignoriert (`src/domain/displayChannel.ts:83-85`, `src/domain/remote.ts:568`)
- Quick-Start aus League mit ungültiger Konfiguration: Toast + Fallback auf Setup (`src/App.tsx:999-1006`)

Reale Nutzungsszenarien:
- Einzelturnier: stabil und vollständig
- Liga mit laufenden Spieltagen: stabil inkl. Edit/Korrekturen/Finanzen
- Multi-Table Live-Betrieb: stabil inkl. Balancing/Final-Table/Seat-Locks
- TV + Remote parallel: robust und versioniert

## 8. Technisches Audit
Status der technischen Risiken:
- Keine offenen P0-Blocker im verifizierten Scope.

Offene technische Punkte (nach Priorität):
1. Pro-Backend fehlt (Cloud Backup, Rollen-Identität, Multi-Event-Livebetrieb)  
   Risiko: Produkt-/Preiserwartung im Pro-Segment kann nicht vollständig eingelöst werden.
2. Hauptbundle bleibt groß (insb. Monitoring-Vendor-Chunk)  
   Nachweis: Build-Ausgabe (`dist/assets/vendor-monitoring-*.js` ~454 kB).
3. Orchestrierung weiter zentral in `App.tsx` (trotz Entflechtung)  
   Nachweis: `src/App.tsx` weiterhin 1219 LOC.
4. Nicht-blockierende Test-Warnungen (React `act`, Audio-/localStorage-Warnungen in Testumgebung)  
   Risiko: niedrig, aber erhöht Testrauschen.

## 9. UX- und Produktaudit
Stärken:
- Breiter operativer Scope für Hosts (Timer, Player Ops, Multi-Table, League, TV/Remote).
- Deutlich besserer Liga-Flow durch Edit + Quick-Start.
- Recovery-/Persistenzverhalten ist konsistenter als im Erst-Audit.
- Feature-Gates sind technisch vorhanden und stören Standardfluss nicht.

Schwächen:
- Hohe Funktionsdichte bleibt für Erstnutzer fordernd.
- Paywall-/Tier-Kommunikation ist technisch vorbereitet, UX-seitig aber noch nicht ausgespielt.
- Pro-UX (Teamrollen, Workspace, Multi-Event) fehlt noch endnutzerreif.

UX-Reife insgesamt:
- Homegame: hoch
- Liga-Operator: hoch
- Club/Team-Operations (Pro): mittel

## 10. Markt- und Wettbewerbsvergleich
Einschätzung gegenüber relevanten Marktprofilen (Blind Valet, Blinds Are Up, HoldemTimer, The Tournament Director):
- Gegen Free-Markt: deutlich überdurchschnittlich.
- Gegen Premium-Markt: funktional und qualitativ auf Wettbewerbsniveau.
- Gegen Pro-Markt: teilweise vorbereitet, aber noch ohne vollständige Cloud-/Org-Fähigkeiten.

Monetarisierungsmuster im Markt (weiterhin gültig):
- Free-Baseline als Akquise
- Premium für operative Mehrwerte (Multi-Table, League, Display/Remote)
- Pro mit Cloud/Organisation/Mehr-Event-Betrieb

## 11. Ziel-Funktionsmodell auf Marktniveau
Zielmodell in 3 Tiers:
- Free: stabiler Single-Table-Kern (Timer/Blinds/Setup)
- Premium: Multi-Table, League, TV/Remote, Side-Pot, Exporte
- Pro: Cloud Backup, Rollen/Rechte, Multi-Event, Team-Operations

Erreichungsgrad:
- Free: erreicht
- Premium: erreicht (mit verbleibenden Optimierungspunkten)
- Pro: teilweise erreicht (technisches Fundament vorhanden, Produktbetrieb fehlt)

## 12. Gap-Analyse: tatsächlicher Bestand vs. Marktstandard
Ist-vs-Markt:
- Free: über Marktstandard
- Premium: auf Marktstandard
- Pro: unter Marktstandard (fehlende Betriebsfeatures)

Aktuelle Haupt-Gaps:
- Kein produktiver Cloud-Backup-/Restore-Stack
- Kein Rollen-/Rechtesystem mit echter User-/Workspace-Identität
- Keine Multi-Event-Operationsoberfläche
- Noch keine Conversion-/Entitlement-Telemetrie für Paywall-Steuerung

## 13. Positionierungsanalyse
Empfohlene Positionierung heute:
- "Premium Tournament Operations für Homegames und Ligen"

Strategische Nische:
- Hosts/Ligen, die über reine Timer-Apps hinaus einen kompletten Turnierbetrieb brauchen (inkl. Multi-Table + League + TV/Remote).

Positionierungsrisiko:
- "Pro"-Versprechen ohne Cloud-/Org-Stack würde Erwartungsbruch erzeugen.

## 14. Empfehlung Free / Premium / Pro
Empfohlene Produkt-/Paywall-Struktur:

Free:
- Basis-Timer, Blindstruktur, Presets, Wizard, lokales Setup.

Premium:
- Multi-Table, League, TV-Display, Remote, Side-Pot, erweiterte Exporte.
- Empfehlung: jetzt launchbar.

Pro:
- Erst nach Umsetzung der echten Betriebsfeatures:
  - Cloud Backup/Restore (workspace-basiert)
  - Rollen/Rechte inkl. Identität
  - Multi-Event-/Workspace-Betrieb

## 15. Letzte fehlende Funktionen und Qualitätslücken
Offene Lücken vor vollem Pro-Niveau:
- Cloud-Backup-End-to-End (nicht nur Typen/Blueprint)
- Teamrollen mit Auth/Identity und Auditierbarkeit
- Multi-Event-Management inkl. Rechte-Scopes
- Entitlement-/Paywall-UX (gesperrte Features transparent erklären, Upgrade-Flows)
- Produkttelemetrie für Conversion/Retention nach Tier

## 16. Priorisierte Empfehlungen
Priorität P0 (sofort):
- Keine offenen P0-Blocker im verifizierten Scope.

Priorität P1 (kurzfristig):
- Pro-Backend-Plan in ein MVP schneiden (Cloud Backup + Workspace + Rollenbasis).
- Entitlement-/Paywall-UX finalisieren (Upsell-Flows, Downgrade-Verhalten, Explainability).
- Bundle-/Ladezeit-Nachschärfung (insb. Monitoring-Paket).

Priorität P2 (mittelfristig):
- Weitere App-Orchestrierung aus `App.tsx` extrahieren.
- Pro-Multi-Event-UI und operative Reports.
- Testrauschen (act/localStorage/audio-Warnungen) gezielt abbauen.

## 17. Top-10- oder Top-20-Maßnahmen
Top-10 nächste Maßnahmen:

1. Cloud-Snapshot-Format finalisieren + verschlüsselte Backup-Pipeline implementieren.  
2. Workspace-/User-Modell mit Rollenprüfung in kritischen Aktionen einführen.  
3. Multi-Event-Dashboard mit Event-Kontextwechsel und Rechte-Scopes bauen.  
4. Entitlement-Gates um „Upgrade-Hinweis statt verstecken“ erweitern.  
5. Tier-Downgrade-Strategie (Daten behalten, Zugriff sperren) produktiv absichern.  
6. Monitoring-Bundle weiter splitten/lazyisieren.  
7. `App.tsx` weiter in orchestrierende Sub-Hooks/Sub-Container zerlegen.  
8. Cross-Browser-E2E um League-/Multi-Table-Happy-Path erweitern.  
9. Nicht-blockierende Testwarnungen in Vitest systematisch abbauen.  
10. Conversion-Telemetrie für Free→Premium und Premium→Pro einführen.  

## 18. Abschlussfazit
Der aktuelle, tatsächlich geprüfte Codebestand ist für Free/Premium klar marktfähig und betrieblich stabil. Die vormals kritischen Reifeprobleme aus dem Erst-Audit sind im verifizierten Ist-Stand geschlossen.

Das verbleibende Delta liegt nicht mehr im Premium-Kern, sondern primär in echten Pro-Betriebsfähigkeiten (Cloud, Rollen, Multi-Event). Genau dafür existiert bereits ein tragfähiges technisches Fundament im Code.

---

## Zusätzliche Tabellen / Matrizen

### Tabelle A – Verifizierte Features
| Bereich | Funktion | im Code nachweisbar? | Reifegrad | relevant für Einzelturnier? | relevant für Liga? | relevant für Multi-Table? | Fundstelle im Code | Schwächen / Lücken |
|---|---|---|---|---|---|---|---|---|
| Setup | Setup Wizard + Presets | Ja | Hoch | Ja | Ja | Ja | `src/components/SetupWizard.tsx`, `src/domain/blinds.ts` | Tiefe Konfiguration bleibt komplex |
| Setup | Start-Validierung inkl. Quick-Start-Fallback | Ja | Hoch | Ja | Ja | Ja | `src/App.tsx:987-1006` | Erste Fehlermeldung statt vollständiger Fehlerliste |
| Runtime | Drift-korrigierter Timer + Controls | Ja | Hoch | Ja | Ja | Ja | `src/hooks/useTimer.ts`, `src/components/Controls.tsx` | Keine dedizierte Drift-Metrik im UI |
| Runtime | Call the Clock inkl. TV-Overlay | Ja | Hoch | Ja | Teilweise | Ja | `src/components/CallTheClock.tsx`, `src/components/display/TVDisplayWindow.tsx:143-151` | Keine Rollenprüfung für Trigger |
| Player Ops | Eliminate/Reinstate/Rebuy/Add-On/Stacks | Ja | Hoch | Ja | Ja | Ja | `src/hooks/useTournamentActions.ts` | Kein separates revisionssicheres Audit-Log |
| Side Pot | Side-Pot-Rechner + Payout-Auflösung | Ja | Hoch | Ja | Teilweise | Ja | `src/components/SidePotCalculator.tsx`, `src/domain/tournament.ts` | UX für Gelegenheitsnutzer komplex |
| Multi-Table | Seating + Seat-Locks + Balancing + Merge | Ja | Hoch | Nein | Teilweise | Ja | `src/domain/tables.ts`, `src/hooks/useTournamentActions.ts` | Keine Simulationsvorschau vor Rebalance |
| Multi-Table | Late-Reg/Re-Entry Seat-Edge-Case Fix | Ja | Hoch | Nein | Teilweise | Ja | `src/domain/tables.ts:206-223` | Keine Explizit-UI bei komplett gesperrter Kapazität |
| League | Standings/GameDays/Finanzen/Korrekturen | Ja | Hoch | Nein | Ja | Teilweise | `src/domain/league.ts`, `src/components/LeagueView.tsx` | Pro-Reporting fehlt |
| League | GameDay-Edit aus Liste | Ja | Mittel-Hoch | Nein | Ja | Nein | `src/components/LeagueGameDays.tsx:164-170` | Kein Bulk-Edit |
| League | Quick-Start aus League | Ja | Mittel-Hoch | Nein | Ja | Teilweise | `src/components/LeagueView.tsx:131-134`, `src/App.tsx:983-1006` | Kein „Preflight-Dialog“ |
| Display | TV-Sync mit versioniertem Contract | Ja | Hoch | Ja | Ja | Ja | `src/domain/displayChannel.ts:54-106`, `src/hooks/useTVDisplay.ts` | Popup-/Browser-Policy abhängig |
| Remote | HMAC-gesicherte Fernsteuerung + versionierter State | Ja | Hoch | Ja | Ja | Ja | `src/domain/remote.ts:47-95`, `438-445`, `567-569` | Single-Controller-Modell |
| Persistenz | Config/Settings Start-Restore + Auto-Save | Ja | Hoch | Ja | Ja | Ja | `src/App.tsx:104-115`, `220-227` | Kein Multi-Device Sync |
| Recovery | Checkpoint-Flow mit stale-League-Sanitization | Ja | Hoch | Ja | Ja | Ja | `src/domain/recovery.ts:12-30`, `src/hooks/useTournamentModeTransitions.ts:180-215` | Kein Full-Session-Time-Travel |
| Qualität | Vitest/Playwright sauber getrennt | Ja | Hoch | Ja | Ja | Ja | `vite.config.ts:79-85`, `.github/workflows/deploy.yml:19-74` | Cross-E2E aktuell nicht CI-default |
| Qualität | Cross-Browser-E2E (Chromium/WebKit) | Ja | Mittel-Hoch | Ja | Teilweise | Teilweise | `playwright.config.ts:10-15`, `package.json:14` | Firefox-Profil fehlt |
| Monetarisierung | Entitlements + Feature-Gates | Ja | Mittel-Hoch | Ja | Ja | Ja | `src/domain/entitlements.ts:27-90`, `src/App.tsx:93-96` | Upgrade-UX noch nicht ausgebaut |
| Pro Foundation | Rollen/Workspace/Backup-Typen | Ja | Mittel | Nein | Ja | Ja | `src/domain/proBlueprint.ts:1-35` | Noch ohne produktive Backend-Implementierung |

### Tabelle B – Claude-Code-Re-Audit
| Bereich / Modul | Feststellung | Status | Qualitätsbewertung | Risiko | empfohlene Maßnahme |
|---|---|---|---|---|---|
| Remote Rebuild | HMAC/Replay-Schutz/Rate-Limit plus versionierter State real implementiert | Abgeschlossen | Hoch | Niedrig | Security-Regressionstests weiter ausbauen |
| League v2 | Umfangreiche Features inkl. Kostenkonsolidierung und Edit-Flow verdrahtet | Abgeschlossen | Hoch | Niedrig-Mittel | Reporting/Exports weiter vertiefen |
| IndexedDB/Persistenz | Cache-first plus Start-Restore funktional | Abgeschlossen | Hoch | Niedrig | Optional: Konfliktstrategie für zukünftigen Cloud-Sync |
| Test-Suite | Vitest/E2E-Runnertennung umgesetzt; Cross-Browser-Lauf vorhanden | Abgeschlossen | Hoch | Niedrig | Cross-Lauf in CI optional ergänzen |
| Multi-Table Fixes | Seat-Lock-Edge-Case behoben + Regressionsschutz | Abgeschlossen | Hoch | Niedrig | Zusätzliche Extremfall-Simulationen |
| App-Entflechtung | Mode-Container + Transition-Hook eingeführt | Abgeschlossen (Phase) | Mittel-Hoch | Mittel | Weitere Zerlegung von `App.tsx` |
| Bundle-Optimierung | Zusätzliche Splits/Lazy-Loads umgesetzt | Abgeschlossen (Phase) | Mittel-Hoch | Mittel | Monitoring-Bundle weiter optimieren |
| i18n-Qualität | Schwellenwert verschärft, identische DE/EN reduziert | Abgeschlossen (Phase) | Mittel-Hoch | Niedrig | Restliche 75 Keys iterativ abbauen |
| Recovery-Härtung | Stale-League-Link beim Restore abgesichert | Abgeschlossen | Hoch | Niedrig | Weitere Cold-Start-Ketten testen |
| Pro/Paywall-Readiness | Entitlement-Fundament + Pro-Blueprint vorhanden | Teilweise abgeschlossen | Mittel | Mittel-Hoch | Backend-MVP + UX-Flow implementieren |

### Tabelle C – Marktvergleich
| Feature | Marktstandard? | Premium am Markt? | in meiner App verifiziert? | Reifegrad | Lücke / Differenz | Priorität |
|---|---|---|---|---|---|---|
| Basis-Timer/Blinds/Breaks | Ja | Nein | Ja | Hoch | Keine | Niedrig |
| Presets + Setup-Wizard | Ja | Teilweise | Ja | Hoch | Keine | Niedrig |
| Rebuy/Add-On/Bounty | Ja | Teilweise | Ja | Hoch | Keine | Niedrig |
| Multi-Table Seating + Balancing | Teilweise | Ja | Ja | Hoch | Keine kritische Lücke | Mittel |
| League/Season/Finanzen | Teilweise | Ja | Ja | Hoch | Kein Pro-Reporting/Cloud-Share | Mittel |
| TV-/Second-Screen-Display | Ja | Ja | Ja | Hoch | Keine | Mittel |
| Mobile Remote Control | Teilweise | Ja | Ja | Hoch | Kein Multi-Operator | Mittel |
| Side-Pot-Rechner | Nein | Ja | Ja | Hoch | Kein vereinfachter „Basic“-Modus | Mittel |
| Test-/CI-Betriebsstabilität | Ja | Ja | Ja | Hoch | Cross-E2E noch nicht CI-default | Mittel |
| Cloud Sync / Account | Bei Premium/Pro häufig | Ja | Nein (nur Fundament) | Niedrig-Mittel | Pro-Hauptlücke | Hoch |
| Rollen/Rechte/Team-Betrieb | Im Pro-Segment Ja | Ja | Nein (nur Fundament) | Niedrig-Mittel | Pro-Hauptlücke | Hoch |
| Multi-Event parallel | Im Pro-Segment Ja | Ja | Nein (nur Fundament) | Niedrig-Mittel | Pro-Hauptlücke | Hoch |

### Tabelle D – Monetarisierung
| Feature | Nutzerwert | strategische Rolle | Free / Premium / Pro | Begründung | Conversion-Potenzial | Risiko bei Paywall |
|---|---|---|---|---|---|---|
| Basis-Timer + Blinds | Sehr hoch | Acquisition | Free | Muss barrierefrei bleiben | Hoch | Hoch |
| Setup-Wizard + Presets | Hoch | Activation | Free | Schnellster Erfolgsmoment | Hoch | Mittel |
| Rebuy/Add-On/Bounty Basis | Hoch | Core Retention | Free | Homegame-Standardbedarf | Mittel-Hoch | Mittel |
| TV-Display | Hoch | Premium Differenzierung | Premium | Direkter Event-Mehrwert vor Ort | Hoch | Niedrig-Mittel |
| Remote Control | Hoch | Premium Differenzierung | Premium | Host-Effizienz im Livebetrieb | Hoch | Niedrig-Mittel |
| Multi-Table Engine | Sehr hoch | Premium Value Anchor | Premium | Kernnutzen für wiederkehrende Hosts | Sehr hoch | Niedrig |
| League + Finanzen | Sehr hoch | Premium Retention | Premium | Wiederkehrender Ligabetrieb | Sehr hoch | Niedrig |
| Side-Pot-Calculator | Mittel-Hoch | Premium Add-on | Premium | Höherer Spot-Nutzen als Frequenz | Mittel | Niedrig |
| Cloud Backup | Sehr hoch | Pro Anchor | Pro | Betriebs-/Datensicherheit | Mittel-Hoch | Niedrig |
| Rollen/Rechte | Hoch | Pro Anchor | Pro | Teamfähiger Turnierbetrieb | Mittel | Niedrig |
| Multi-Event-Management | Hoch | Pro Expansion | Pro | Notwendig für Clubs/Serien | Mittel | Niedrig |

### Tabelle E – Abschlussmaßnahmen
| Maßnahme | Kategorie | Nutzen | Marktwert | Aufwand | Risiko | Priorität | betroffene Dateien / Module |
|---|---|---|---|---|---|---|---|
| Cloud-Backup-MVP (encrypt + restore) implementieren | Produkt/Architektur | Pro-Fähigkeit realisieren | Sehr hoch | Hoch | Mittel | P1 | `src/domain/proBlueprint.ts`, neue Cloud-Module |
| Workspace-/Identity-Layer + Rollenprüfung einführen | Produkt/Security | Team-Betrieb absichern | Sehr hoch | Hoch | Mittel-Hoch | P1 | neue Auth/Workspace-Module, `src/App.tsx` |
| Multi-Event-Workspace UI bauen | Produkt/UX | Pro-Use-Cases freischalten | Hoch | Hoch | Mittel | P1 | neue Views/Container, League/Event-Domain |
| Entitlement-Upsell-UX (statt Feature-Verstecken) | Monetarisierung/UX | Conversion verbessern | Hoch | Mittel | Niedrig-Mittel | P1 | `src/App.tsx`, neue Paywall-Komponenten |
| Downgrade-Handling definieren und testen | Produkt/Qualität | Datenvertrauen sichern | Hoch | Mittel | Mittel | P1 | `src/domain/entitlements.ts`, Persistenzpfade |
| Monitoring-Bundle weiter splitten/lazy laden | Performance | Schnellere Initial-Loads | Mittel-Hoch | Mittel | Niedrig | P2 | `vite.config.ts`, `src/main.tsx` |
| Weitere `App.tsx`-Entkopplung in Sub-Hooks | Architektur | Wartbarkeit/Regressionen senken | Hoch | Mittel | Mittel | P2 | `src/App.tsx`, `src/hooks/*` |
| Cross-E2E in CI als optionales/nightly Gate | Qualität | Browser-Risiko senken | Mittel-Hoch | Niedrig-Mittel | Niedrig | P2 | `.github/workflows/deploy.yml`, `playwright.config.ts` |
| Testwarnungen systematisch reduzieren | Qualität | Weniger Rauschen, klarere Fehlersignale | Mittel | Mittel | Niedrig | P2 | `tests/integration.test.ts`, Audio-/Storage-Mocks |
| Conversion-Telemetrie je Tier ergänzen | Monetarisierung | Preis-/Paywall-Steuerung datenbasiert | Hoch | Mittel | Mittel | P2 | neue Analytics-Events, Entitlement-Flow |
