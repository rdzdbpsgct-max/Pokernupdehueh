# Design-Prompt v1.9 — Premium Polish & Konsistenz

## Kontext

Die App hat seit v1.8.0 ein solides Design-Fundament: Glassmorphism, Gradient-Buttons, Timer-Glow, Custom-Animationen, taktile Interaktionen. Das Ziel ist jetzt **Konsistenz und Verfeinerung** — die vorhandenen Design-Muster konsequent durchziehen, Schwachstellen eliminieren und das Gesamtbild auf ein einheitlich premium Niveau heben.

**Keine Logik-Änderungen. Keine neuen Dateien. Keine neuen Dependencies. Rein visuell/CSS.**

---

## Analyse: Was gut funktioniert (beibehalten)

- Timer-Glow als Signatur-Effekt (pulsierender text-shadow)
- Gradient-Buttons mit `active:scale` auf primären Aktionen
- Glassmorphic Cards im Setup (`backdrop-blur-sm`, weiche Schatten)
- Semantische Farbcodierung: Emerald = aktiv/positiv, Amber = Pause/Warnung, Rot = Gefahr
- Custom Animationen: `fade-in`, `scale-in`, `countdown-pulse`, `bubble-pulse`
- Fortschrittsbalken mit Gradient + Glow-Shadow

---

## Analyse: Schwachstellen (beheben)

### 1. Inkonsistente Abrundungen
Aktuell gemischt: `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl` ohne klares System.

**Regel definieren:**
- Große Container/Modals: `rounded-2xl`
- Cards/Panels: `rounded-xl`
- Buttons/Inputs: `rounded-lg`
- Kleine Badges/Tags: `rounded-md` oder `rounded-full`

Alle Stellen durchgehen und vereinheitlichen.

### 2. Inkonsistente Borders
Aktuell: `border-gray-600`, `border-gray-700`, `border-gray-700/40`, `border-gray-700/50`, `border-gray-700/60` — zu viele Varianten.

**Regel:**
- Standard-Border: `border-gray-700/40`
- Hover-Border: `border-gray-600/50`
- Fokus-Border: `border-emerald-500` (bereits vorhanden)
- Aktive/Hervorgehobene Border: `border-emerald-700/50` oder Farbspezifisch

### 3. Sekundäre Buttons fehlt Tiefe
`Controls.tsx`: Prev/Next/Reset/Restart-Buttons sind flat (`bg-gray-700/80 hover:bg-gray-600`). Kein Gradient, kein Shadow, kaum Feedback.

**Upgrade:**
- Sekundär: + `shadow-md shadow-black/15`, `border border-gray-600/40`, dezenter `bg-gradient-to-b from-gray-700 to-gray-800`
- Restart (destruktiv): Stärkere visuelle Warnung — `from-red-800/80 to-red-900/80` als Hover, `border-red-700/40`
- Alle sekundären + `active:scale-[0.97]` (fehlt teilweise)

### 4. Range-Slider (Zeit-Scrub) ist unstyled
Der `<input type="range">` hat nur `accent-emerald-500`. Kein Custom-Thumb, kein Track-Styling.

**Upgrade in `index.css`:**
```css
input[type="range"] {
  -webkit-appearance: none;
  background: transparent;
}
input[type="range"]::-webkit-slider-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, rgb(16 185 129 / 0.3), rgb(31 41 55));
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(to bottom, #34d399, #059669);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  cursor: pointer;
}
```
Plus Firefox-Equivalents (`::-moz-range-track`, `::-moz-range-thumb`).

### 5. Sidebars: Schwache visuelle Trennung
Im Spielmodus sind die Seitenpanels (PlayerPanel, LevelPreview/ChipSidebar/Settings) nur durch dünne `border-gray-800` getrennt. Kein Depth-Gefälle.

**Upgrade:**
- Linke Sidebar: `bg-gray-900/60 border-r border-gray-700/30`
- Rechte Sidebar: `bg-gray-900/60 border-l border-gray-700/30`
- Center-Bereich bleibt transparent (Timer hebt sich ab)
- Sidebar-Toggle-Buttons: Etwas größer (`w-7 h-20`), `bg-gray-800/80`, stärkere Border

### 6. Setup-Inputs: Focus-State ausbaubar
Aktuell: `focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20`. Gut, aber dezent.

**Upgrade:**
- + `focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]` für weicheren Glow-Effekt
- Oder: `focus:ring-2 focus:ring-emerald-500/30` statt `/20`

### 7. Tabellen-Rows (Ergebnisse, Level-Tabelle)
`TournamentFinished.tsx` und `ConfigEditor.tsx`: Tabellenzeilen sind nur abwechselnd `bg-gray-800/30` oder transparent. Flach.

**Upgrade:**
- Alternating rows: + `border-b border-gray-800/30` für subtile Trennlinien
- Erste Reihe (Sieger): Eigene Mini-Card — `bg-amber-900/15 border border-amber-500/20 rounded-lg px-4 py-3` (visuell abgehoben)
- Hover auf Zeilen: `hover:bg-gray-800/40 transition-colors`

### 8. Spieler-Panel: Player-Rows brauchen mehr Struktur
Aktuell: `bg-gray-800/40 rounded-lg border border-gray-700/20`. Funktional, aber generisch.

**Upgrade:**
- Aktiver Spieler: + `hover:border-gray-600/40` (interaktiver wirkend)
- Eliminierter Spieler: `opacity-40` statt `opacity-50`, + `grayscale` Filter subtil
- Dealer-Badge: + `animate-pulse` ganz dezent oder `ring-2 ring-red-500/30` als Glow
- Rebuy-Count: Als kleiner Badge (`bg-emerald-900/30 text-emerald-400 rounded-full px-2 text-xs`)

### 9. Body-Gradient verstärken
Aktuell: `radial-gradient` mit nur `0.03` Opacity — fast unsichtbar.

**Upgrade:** Opacity auf `0.06` erhöhen. Zweiten subtilen Gradient hinzufügen:
```css
background:
  radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 60%),
  radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.02) 0%, transparent 40%),
  #0a0a0f;
```

### 10. Checkpoint-Banner: Mehr Aufmerksamkeit
Aktuell: `bg-amber-900/20 border border-amber-700/50`. Für eine wichtige Wiederherstellungs-Aktion zu dezent.

**Upgrade:**
- `bg-amber-900/30 border-2 border-amber-600/60 shadow-lg shadow-amber-900/20`
- + `animate-fade-in`
- Buttons: Resume als Gradient-Button (wie Start-Button), Verwerfen als Ghost-Button

### 11. Micro-Interaction: Hover-Glow auf Cards
`CollapsibleSection` Header-Hover ist nur `hover:bg-gray-700/30`.

**Upgrade:**
- + `hover:border-gray-600/50` (Border leuchtet auf bei Hover)
- + `hover:shadow-lg hover:shadow-black/25` (Shadow intensiviert bei Hover)
- Transition ist bereits vorhanden (`transition-all duration-200`)

### 12. Confirm-Dialog: Destruktiver Button zu flach
Aktuell: Cancel und Confirm haben ähnliches visuelles Gewicht.

**Upgrade:**
- Confirm (destruktiv): `shadow-lg shadow-red-900/30` hinzufügen, Border `border-red-700/40`
- Cancel: Noch subtiler — `bg-gray-800/60` statt `bg-gray-700/80`
- So entsteht klare visuelle Hierarchie

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Range-Slider-Styling, Body-Gradient verstärken |
| `src/App.tsx` | Sidebar-Borders, Confirm-Dialog, Checkpoint-Banner, Sidebar-Toggles |
| `src/components/Controls.tsx` | Sekundäre Button-Upgrades |
| `src/components/TimerDisplay.tsx` | Range-Slider nutzt neues Styling |
| `src/components/CollapsibleSection.tsx` | Hover-Glow auf Card-Header |
| `src/components/PlayerPanel.tsx` | Player-Row-Struktur, Dealer-Badge, Rebuy-Badge |
| `src/components/TournamentFinished.tsx` | Tabellen-Rows, Sieger-Hervorhebung |
| `src/components/ConfigEditor.tsx` | Level-Row-Borders, Abrundungen |
| `src/components/CollapsibleSubSection.tsx` | Konsistente Abrundung |
| `src/components/BlindGenerator.tsx` | Konsistente Abrundung |
| `src/components/TemplateManager.tsx` | Konsistente Abrundung |

---

## Design-Prinzipien (erweitert)

1. **Glassmorphism ist dezent** — `backdrop-blur-sm`, Opacities `/40` bis `/60`
2. **Schatten erzeugen Hierarchie** — Cards `shadow-lg`, Innen `shadow-md`, Buttons `shadow-md`
3. **Gradients sind gerichtet** — Buttons `bg-gradient-to-b` (Licht von oben)
4. **Animationen sind kurz** — 200ms UI, 250ms Expand, nie > 300ms
5. **Active-States geben Feedback** — `active:scale-[0.97]` auf allen klickbaren Elementen
6. **Borders sind einheitlich** — Standard: `border-gray-700/40`, Hover: `border-gray-600/50`
7. **Abrundungen folgen Hierarchie** — Container `2xl` > Cards `xl` > Buttons `lg` > Badges `md/full`
8. **Focus-States sind sichtbar** — Ring + Shadow für Accessibility
9. **Timer-Glow ist der Signatur-Effekt** — Einzigartig, nicht inflationär
10. **Destruktive Aktionen sind visuell klar** — Rot-Gradient, Shadow, stärkere Border
11. **Keine neuen Dateien** — Alles in bestehenden Dateien
12. **Keine Logik-Änderungen** — Nur className-Strings und CSS

---

## Verifizierung

1. `npm run lint` — fehlerfrei
2. `npm run test` — alle 187 Tests bestanden
3. `npm run build` — erfolgreich
4. Manuell prüfen: Range-Slider, Button-Hierarchie, Sidebar-Separation, Card-Hover, Ergebnis-Tabellen, Confirm-Dialog
