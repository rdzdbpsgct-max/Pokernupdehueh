# Share / Display / Remote — Multi-Device Architektur

**Datum:** 2026-03-15
**Status:** Genehmigt

## Ziel

Poker-Webapp flexibel auf mehreren Geräten nutzbar machen:
- Direkt auf Laptop
- Auf TV/Beamer als große Anzeige (via Link, AirPlay, Chromecast, HDMI)
- Mit Smartphone als Remote-Steuerung
- Auf PC, Laptop, iPad, Android, Smartphone möglichst unkompliziert

## Ist-Analyse

| Bereich | Aktuell | Limitation |
|---------|---------|------------|
| Display Mode | `#display` Hash, `window.open()`, BroadcastChannel | Nur auf gleichem Gerät — BroadcastChannel ist same-origin |
| Remote Control | PeerJS WebRTC, `#remote=PKR-XXXXX&s=SECRET` | Cross-device funktioniert, nur 1 Verbindung |
| Routing | Kein Router — Hash-basiert | Keine echten Routen |
| Share Hub | Existiert nicht | QR-Codes verstreut |

**Kernproblem:** Display auf separatem Gerät (TV, Tablet, Laptop) nicht möglich ohne Screen Mirroring.

## Architektur-Entscheidung: PeerJS Multi-Role Sessions

**Gewählt:** PeerJS für Cross-Device Display (identisch zu Remote Control).

| Aspekt | Entscheidung | Begründung |
|--------|-------------|------------|
| Cross-Device Sync | PeerJS (wie Remote) | Bewährt, keine Server-Kosten, P2P |
| Same-Device Display | BroadcastChannel beibehalten | Niedrigste Latenz, kein Internet |
| Session-Modell | Eine Peer-ID für Display + Remote | Einfach, ein QR-Code pro Rolle |
| Share Hub | Zentrales Modal | Nutzer findet alles an einem Ort |
| AirPlay/Chromecast | UX-Anleitungen (Phase 2) | Ehrlich, plattformspezifisch |
| Router | Kein Router hinzufügen | Hash-Routing reicht |
| Display-Komponente | DisplayMode 1:1 wiederverwenden | Kein Duplicate Code |

## Session-Modell & Rollenkonzept

```
Host (Hauptgerät)
  ├── PeerJS Peer-ID: PKR-XXXXX
  ├── Secret: BASE64 (für Remote-HMAC)
  │
  ├─► Display-Verbindungen (0..N, read-only)
  │   └── Empfangen: DisplayStatePayload + TimerTicks
  │
  └─► Remote-Verbindung (0..1, bidirektional)
      ├── Empfängt: RemoteState
      └── Sendet: RemoteCommands (signiert)
```

### Handshake-Protokoll

Jedes neue Gerät sendet als erste Nachricht:
```typescript
{ type: 'hello', role: 'display' | 'remote', version: 2 }
```

Host routet die Verbindung:
- `role: 'display'` → Sofort DisplayStatePayload senden, danach 500ms Timer-Ticks
- `role: 'remote'` → Wie bisher (RemoteState + Commands)

Alte Controller ohne `hello`-Message werden als `remote` behandelt (Rückwärtskompatibilität).

## URL-Schema

| Hash | Rolle | Verhalten |
|------|-------|-----------|
| `#display=PKR-XXXXX` | Cross-Device Display | PeerJS-Verbindung, empfängt State, zeigt DisplayMode |
| `#remote=PKR-XXXXX&s=SECRET` | Remote Controller | Wie bisher |
| `#display` (ohne ID) | Same-Device Display | BroadcastChannel, window.open() |
| `#share` | Share Hub | Öffnet Share Hub Modal |

### Erkennung in main.tsx

```
Hash startet mit...
  "#display=" → CrossDeviceDisplayWindow (PeerJS)
  "#display"  → TVDisplayWindow (BroadcastChannel)
  "#remote="  → RemoteControllerView (bestehend)
  sonst       → App (normal)
```

## Datenfluss Host → Cross-Device Display

```
App.tsx Tournament State Changes
  ↓
useDisplaySession hook (NEU)
  ├── Für Same-Device: BroadcastChannel (useTVDisplay, bestehend)
  └── Für Cross-Device: PeerJS broadcast an alle Display-Peers
      ↓
      Serialized DisplayStatePayload (identisches Format)
      ↓
      PeerJS DataConnection.send(payload)
      ↓
CrossDeviceDisplay empfängt
  ├── 'full-state' → setState(payload)
  ├── 'timer-tick' → setTimerTick(overlay)
  └── 'call-the-clock' → setCtcPayload()
      ↓
DisplayMode rendert (identisch zum Same-Device TV)
```

### Timer-Sync-Strategie
- Full State: Bei signifikanten Änderungen (Spieler, Level, Config)
- Timer Ticks: Alle 500ms `{ remainingSeconds, status, currentLevelIndex }`
- Client-seitige Interpolation: 100ms Interval liest aus Refs (wie Remote Controller)

## Share Hub UI

Zentraler Button im Header: 📡 „Teilen / Anzeigen"

### Sektionen

1. **Auf anderem Gerät anzeigen**
   - QR-Code für Display-Link
   - Link kopieren Button
   - Session-ID anzeigen
   - Live-Status: X Displays verbunden

2. **Mit Smartphone steuern**
   - QR-Code für Remote-Link
   - Link kopieren Button
   - Live-Status: Verbunden / Getrennt

3. **Auf diesem Gerät**
   - Zweites Fenster öffnen (BroadcastChannel)
   - Browser-Vollbild

4. **Kabel & Wireless** (Phase 2)
   - AirPlay / Screen Mirroring — plattformspezifische Anleitung
   - Chromecast / Google Cast — plattformspezifische Anleitung
   - HDMI / Kabel — kurze Anleitung

Jede Option hat: Titel, Icon, 1-Satz-Beschreibung, Aktion, Live-Status.

## Neue Dateien

| Datei | Zweck | ~Zeilen |
|-------|-------|---------|
| `src/components/ShareHub.tsx` | Zentrales Share/Connect Modal | ~450 |
| `src/components/display/CrossDeviceDisplay.tsx` | PeerJS Display-Client | ~200 |
| `src/domain/session.ts` | Session-Erstellung, Multi-Role PeerJS-Management | ~250 |
| `src/hooks/useDisplaySession.ts` | Host-seitige Display-Broadcast via PeerJS | ~150 |

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/main.tsx` | `#display=` Hash-Pattern erkennen, CrossDeviceDisplay rendern |
| `src/domain/remote.ts` | Hello-Handshake Protokoll, Multi-Connection Support für Display-Peers |
| `src/components/AppHeader.tsx` | Share-Button (📡) hinzufügen |
| `src/App.tsx` | ShareHub State, Session-Lifecycle, useDisplaySession Integration |
| `src/hooks/useTVDisplay.ts` | Erweitern um PeerJS Display-Broadcast |
| `src/i18n/translations.ts` | ~80 neue Keys (Share Hub, Anleitungen, Status) |
| `src/domain/types.ts` | SessionRole, DisplayConnectionInfo Types |

## Phasen-Roadmap

### Phase 1 — Kern (direkt umsetzen)
1. `session.ts` — Session mit Multi-Role PeerJS
2. `CrossDeviceDisplay.tsx` — PeerJS Display-Client
3. `ShareHub.tsx` — Zentrales Modal (Display-Link, Remote-Link, Vollbild, Same-Device)
4. `useDisplaySession.ts` — Host-seitige Display-Broadcast-Logik
5. `main.tsx` + `App.tsx` — Hash-Routing für `#display=`
6. `remote.ts` — Hello-Handshake, Multi-Connection
7. Translations ~80 Keys DE/EN

### Phase 2 — Comfort (späterer Sprint)
8. AirPlay/Chromecast/HDMI-Anleitungen im Share Hub
9. Presentation API (optional, Capability Check)
10. Google Cast SDK (optional)
11. Display-Layout-Varianten (Kompakt, Ultra Large)

### Phase 3 — Premium (optional)
12. Read-only Spectator Mode
13. Multi-Remote (mehrere Controller)
14. Display-Customization (Logo, Farben)
