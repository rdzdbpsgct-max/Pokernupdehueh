# Phase 1 Design: Payout-Kalkulator, Währung & Quick-Start

**Date**: 2026-03-15
**Status**: Approved

## Scope

6 Features in 2 Clustern:
- **Payout-Cluster**: Auto-Split, Max-Plätze 20, Templates, Live-Vorschau, Währung
- **Quick-Start**: Preset-Erweiterung mit Direkt-Starten-Flow

## 1. Datenmodell-Änderungen

### Neuer Typ `Currency` (types.ts)

```ts
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'SEK';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', SEK: 'kr',
};
```

### TournamentConfig erweitern

```ts
currency: Currency; // default 'EUR'
```

### PayoutConfig — keine Strukturänderung

`{ mode: 'percent' | 'euro', entries: PayoutEntry[] }` bleibt. `'euro'` bedeutet intern "fester Betrag in Turnierwährung". UI zeigt korrektes Währungssymbol.

### PayoutEditor — neue Props

```ts
interface Props {
  payout: PayoutConfig;
  onChange: (payout: PayoutConfig) => void;
  maxPlaces?: number;    // default 20 (bisher 10)
  prizePool?: number;    // für Live-Vorschau
  currency?: Currency;   // für Symbol-Anzeige
  playerCount?: number;  // für Auto-Split
}
```

### Backward-Compat

`parseConfigObject()` setzt `currency: 'EUR'` wenn Feld fehlt.

## 2. Payout-Kalkulator

### Auto-Split-Button
- Button "Auto" im PayoutEditor-Header neben Modus-Toggle
- Ruft `defaultPayoutForPlayerCount(playerCount)` auf
- Setzt `mode: 'percent'` und überschreibt `entries`
- Nur sichtbar wenn `playerCount`-Prop vorhanden

### Payout-Templates

Neues Domain-Modul `src/domain/payoutTemplates.ts`:

```ts
export interface PayoutTemplate {
  id: string;
  label: string;           // Translation-Key
  entries: PayoutEntry[];   // immer percent-Mode
}

export const PAYOUT_TEMPLATES: PayoutTemplate[] = [
  { id: 'top-heavy', label: 'payout.template.topHeavy',  entries: [{place:1,value:60},{place:2,value:25},{place:3,value:15}] },
  { id: 'standard',  label: 'payout.template.standard',  entries: [{place:1,value:50},{place:2,value:30},{place:3,value:20}] },
  { id: 'flat',      label: 'payout.template.flat',       entries: [{place:1,value:40},{place:2,value:30},{place:3,value:20},{place:4,value:10}] },
  { id: 'deep',      label: 'payout.template.deep',       entries: [{place:1,value:35},{place:2,value:25},{place:3,value:18},{place:4,value:13},{place:5,value:9}] },
];
```

### Template-Dropdown
- Select-Element unterhalb des Auto-Buttons
- Bei Auswahl: `mode = 'percent'`, entries gesetzt
- User kann danach manuell anpassen

### Live-Vorschau
- Neben jedem PayoutEntry grauer Text: `→ 80 €`
- Berechnung: `entry.value / 100 * prizePool`
- Nur sichtbar bei `mode === 'percent'` UND `prizePool > 0`
- Summenzeile: `Σ 160 €`

### Max-Plätze
- Default von 10 auf 20 erhöhen

## 3. Währung durchziehen

### Setup-UI
- Dropdown in "Turnier-Grundlagen"-Sektion neben Buy-In
- 5 Optionen: € EUR, $ USD, £ GBP, CHF, kr SEK
- Default: 'EUR'

### Hardcoded-€-Stellen migrieren

| Datei | Änderung |
|-------|----------|
| PayoutEditor.tsx | Mode-Button-Label + Suffix → `CURRENCY_SYMBOLS[currency]` |
| tournament.ts | `formatResultAsText` → Currency-Symbol |
| tournament.ts | `formatResultAsCSV` → Currency-Symbol |
| TournamentFinished.tsx | Payout-Anzeige → aus Config |
| TournamentStats.tsx | Prizepool-Anzeige → aus Config |
| display/StatsScreen.tsx | TV Prizepool → aus Config |
| display/PayoutScreen.tsx | TV Payout-Beträge → aus Config |
| pdfExport.ts | PDF-Beträge → Currency-Symbol |

### Mode-Name 'euro' bleibt intern
Kein Rename. UI zeigt korrektes Symbol.

### Export-Formate
- CSV/Text/PDF: Beträge mit Currency-Symbol
- QR-Encoding: currency als 1-Byte-Feld (E/U/G/C/S)

## 4. Quick-Start via Preset-Erweiterung

### Flow
1. User klickt "Direkt starten" auf einem Preset
2. Inline-Expandable: NumberStepper für Spielerzahl (Default 8, Min 2, Max 30)
3. Buy-In aus Preset (Schnell: 10€, Standard: 20€, Deep: 50€)
4. "Los!" → Config laden, Spieler generieren, Blinds generieren, onSwitchToGame()

### Technisch
- `SetupPage.tsx`: `expandedPresetId`-State
- "Los" führt aus: setConfig → generateBlindStructure → defaultPayoutForPlayerCount → Default-Spieler → onSwitchToGame()
- Kein neues Modul nötig

## 5. Translation-Keys (neu, ~11 Stück)

```
payout.fixedAmount         → "Fester Betrag" / "Fixed Amount"
payout.autoSplit           → "Auto" / "Auto"
payout.template.topHeavy   → "Top-Heavy (60/25/15)"
payout.template.standard   → "Standard (50/30/20)"
payout.template.flat       → "Flach (40/30/20/10)" / "Flat (40/30/20/10)"
payout.template.deep       → "Tief (35/25/18/13/9)" / "Deep (35/25/18/13/9)"
setup.currency             → "Währung" / "Currency"
payout.total               → "Gesamt" / "Total"
setup.quickStart           → "Direkt starten" / "Quick Start"
setup.quickStartGo         → "Los!" / "Go!"
setup.quickStartPlayers    → "Spieleranzahl" / "Number of players"
```

## 6. Betroffene Dateien

**Neue Dateien**: `src/domain/payoutTemplates.ts`
**Geänderte Dateien**: `types.ts`, `PayoutEditor.tsx`, `SetupPage.tsx`, `tournament.ts`, `configPersistence.ts`, `TournamentFinished.tsx`, `TournamentStats.tsx`, `StatsScreen.tsx`, `PayoutScreen.tsx`, `pdfExport.ts`, `translations.ts`
**Tests**: Neue Tests für Templates, Auto-Split, Currency-Formatting, Quick-Start-Config-Generierung
