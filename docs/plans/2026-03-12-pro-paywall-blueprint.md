# Pro Blueprint + Paywall Readiness

Stand: 2026-03-12

## 1) Zielbild

Pro-Tier soll drei Betriebsfähigkeiten ergänzen:
- Cloud Backup / Restore
- Rollen- und Rechte-Modell (Team-Operator)
- Multi-Event-/Workspace-Betrieb

## 2) Technischer Rahmen (vorbereitet)

Umgesetzt:
- Tier-/Feature-Framework in `src/domain/entitlements.ts`
  - Tiers: `free`, `premium`, `pro`
  - Features: `tvDisplay`, `remoteControl`, `multiTable`, `league`, `sidePot`, `cloudBackup`, `teamRoles`, `multiEvent`
  - lokale Persistenz + Override-Support
- Erste produktive Nutzung von Feature-Gates in `src/App.tsx`
  - Remote-Control- und TV-Display-UI
  - League-Mode-Entry
- Pro-Domain-Skeleton in `src/domain/proBlueprint.ts`
  - zentrale Typen für Rollen, Workspaces und Backup-Snapshots

## 3) Migrationsstrategie

1. Phase A (ohne Backend-Zwang):
- Feature-Gates vollständig hinter Entitlements schalten
- Telemetrie für gesperrte Feature-Nutzung ergänzen

2. Phase B (Backend-Einführung):
- Workspace-/User-Identität einführen
- verschlüsselte Cloud-Snapshots pro Workspace

3. Phase C (Pro-Betrieb):
- Rollenbasierte Aktionen (z. B. nur `admin` darf Turnier resetten)
- Multi-Event-Ansicht und Rechte pro Event

## 4) Gating-Regeln (empfohlen)

- Free:
  - Basis-Timer, Setup-Wizard, Einzelturnier
- Premium:
  - League, Multi-Table, TV-Display, Remote, Side-Pot
- Pro:
  - Cloud Backup, Rollen/Rechte, Multi-Event

## 5) Risiken / Kritische Punkte

- Tier-Downgrade-Handling:
  - Daten dürfen nicht verloren gehen; nur Zugriff temporär sperren
- Offline-Betrieb:
  - Entitlements müssen lokal cachebar bleiben
- Kompatibilität:
  - Feature-Gates dürfen bestehende Local-Only-Flows nicht brechen

