# Remote/TV State Contracts (v1)

Stand: 2026-03-12

## Ziel
- Stabiler, versionierter Nachrichtenvertrag zwischen:
  - Admin-App ↔ TV-Window (BroadcastChannel)
  - Host ↔ Remote Controller (PeerJS state updates)
- Explizite Kompatibilitätsregel für zukünftige Änderungen.

## Display Contract (`display-sync`)

Quelle:
- `src/domain/displayChannel.ts`

Konstanten:
- `DISPLAY_CONTRACT_NAME = "display-sync"`
- `DISPLAY_CONTRACT_VERSION = 1`

Envelope:
- `contract: "display-sync"`
- `version: 1`
- `type: "full-state" | "timer-tick" | "call-the-clock" | "call-the-clock-dismiss" | "close"`
- `payload: ...` (typabhängig)

Regeln:
- Receiver akzeptiert nur Messages mit passendem `contract` und `version`.
- Unbekannte oder inkompatible Messages werden ignoriert (kein Hard-Crash).

## Remote State Contract (`remote-state`)

Quelle:
- `src/domain/remote.ts`

Konstanten:
- `REMOTE_STATE_CONTRACT_VERSION = 1`

Message:
- `type: "state"`
- `version: 1`
- `data: { timerStatus, remainingSeconds, currentLevelIndex, levelLabel, ... }`

Regeln:
- Controller verarbeitet nur `state`-Messages mit unterstützter `version`.
- Version-Mismatch wird defensiv ignoriert.

## Versionierungsstrategie

1. Additive Änderungen (nur neue optionale Felder):
- gleiche Major-Version möglich (`v1` bleibt)

2. Breaking Changes (Feld entfernt/umbenannt/semantisch geändert):
- `version` erhöhen (z. B. `v2`)
- Receiver muss alte Version weiter ignorieren (graceful)

3. Rollout:
- Sender zuerst erweitern
- Receiver tolerant halten
- Nach Stabilisierung Legacy-Pfade entfernen

