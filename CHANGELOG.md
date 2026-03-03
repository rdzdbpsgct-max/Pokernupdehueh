# Changelog

Alle wichtigen Änderungen an der Pokern up de Hüh App.
All notable changes to the Pokern up de Hüh app.

---

## [2.0.1] – 2026-03-03

### Light-Mode-Fixes, Sektionsumbenennung & Clean-View-Button

- **Light-Mode Lesbarkeit** — Alle farbigen UI-Elemente (rot/grün/amber) waren im Light Mode schlecht lesbar (dunkle Hintergründe mit niedrigen Opacities, helle Textfarben aus dem Dark-Mode-Design). Jetzt: helle Basis-Farben für Light Mode + bisherige Werte als `dark:`-Varianten. 14 Dateien gefixt.
- **Light mode readability** — All colored UI elements (red/green/amber) were hard to read in light mode (dark backgrounds with low opacities, bright text colors from dark mode design). Now: light base colors for light mode + previous values as `dark:` variants. 14 files fixed.

- **Sektionsumbenennung** — „Turnier-Format" → „Rebuy / Add-On / Bounty" — direkter und verständlicher.
- **Section rename** — "Tournament Format" → "Rebuy / Add-On / Bounty" — more direct and understandable.

- **Clean-View-Button in Controls** — Der „Details einblenden/ausblenden"-Button sitzt jetzt mittig unter dem Start-Button in der Controls-Komponente (über Level-Reset / Turnier-Restart). Prominenter gestaltet mit Border und Shadow, immer sichtbar (auch bei eingeblendeten Details).
- **Clean view button in controls** — The "Show/hide details" button now sits centered below the start button in the Controls component (above level reset / tournament restart). More prominent with border and shadow, always visible (even when details are shown).

- **Theme ohne Flash** — Inline-Script in `index.html` setzt den Dark/Light-Modus vor dem ersten Paint anhand von localStorage oder `prefers-color-scheme`. Kein Flash of Wrong Theme mehr beim App-Start.
- **Theme without flash** — Inline script in `index.html` applies dark/light mode before first paint based on localStorage or `prefers-color-scheme`. No more flash of wrong theme on app start.

- **Theme/Sprache im Spielmodus** — Theme-Switcher und Language-Switcher im Header sind jetzt in beiden Modi verfügbar (Setup + Spiel), nicht mehr nur im Setup.
- **Theme/language in game mode** — Theme switcher and language switcher in header are now available in both modes (setup + game), not just setup.

- **Chips standardmäßig deaktiviert** — Chip-Farben/-Denominations sind bei neuen Turnieren deaktiviert. ChipSidebar im Spielmodus wird nur angezeigt wenn Chips im Setup aktiviert wurden.
- **Chips disabled by default** — Chip colors/denominations are disabled for new tournaments. Chip sidebar in game mode only shown when chips are enabled in setup.

- **Color-Up realistischer** — Chips werden nicht mehr bei der ersten möglichen Pause entfernt, sondern erst bei der übernächsten. Z.B. bleiben 500er-Chips länger im Spiel, wie in echten Turnieren üblich.
- **Color-up more realistic** — Chips are no longer removed at the first possible break but at the one after that. E.g. 500-value chips stay in play longer, as is common in real tournaments.

- **Add-On-Timing korrigiert** — Die Add-On-Ankündigung erscheint jetzt zum richtigen Zeitpunkt: Wenn eine Pause nach der letzten Rebuy-Stufe folgt, läuft der Timer weiter und das Banner wird in der Pause + nächstem Level angezeigt. Ohne Pause wird der Timer automatisch angehalten, damit Spieler ihr Add-On nehmen können.
- **Add-on timing fixed** — The add-on announcement now appears at the correct time: When a break follows the last rebuy level, the timer keeps running and the banner shows during the break + next level. Without a break, the timer pauses automatically so players can take their add-on.

---

## [2.0.0] – 2026-03-03

### Dark/Light Mode, SVG-Chevrons, NumberStepper & Performance

- **Dark/Light Mode** — Vollständiges Theming mit 3-Wege-Toggle (System/Hell/Dunkel) im Header. Alle 24+ Komponenten mit Tailwind `dark:`-Varianten konvertiert. Theme-Infrastruktur: `ThemeProvider` mit System-Preference-Listener (`prefers-color-scheme`), `useTheme()` Hook, localStorage-Persistenz (`poker-timer-theme`). CSS Custom Properties für theme-aware Timer-Glow-Animation. PWA `theme-color` Meta-Tag passt sich dynamisch an. Screenshot-Hintergrund respektiert aktives Theme.
- **Dark/Light mode** — Full theming with 3-way toggle (System/Light/Dark) in header. All 24+ components converted with Tailwind `dark:` variants. Theme infrastructure: `ThemeProvider` with system preference listener, `useTheme()` hook, localStorage persistence. CSS custom properties for theme-aware timer glow animation. PWA theme-color meta tag dynamically updated. Screenshot background respects active theme.

- **SVG-Chevrons** — Neue `ChevronIcon`-Komponente ersetzt Unicode-Dreiecke in allen ausklappbaren Sektionen. Größer (`w-4 h-4`), dicker (`strokeWidth 2.5`), CSS-Rotation-Animation, Hover-Farbwechsel (`group-hover`). Verwendet in 5 Komponenten.
- **SVG chevrons** — New `ChevronIcon` component replaces Unicode triangles in all collapsible sections. Larger (`w-4 h-4`), thicker (`strokeWidth 2.5`), CSS rotation animation, hover color change (`group-hover`). Used in 5 components.

- **NumberStepper** — Neue Komponente ersetzt native Browser-Zahleneingaben. Custom `+`/`-` Buttons mit Long-Press-Support (400ms Delay, 100ms Repeat via Pointer Events), optionale `snap`-Funktion, konfigurierbares min/max/step. Native Spinner per CSS ausgeblendet. Verwendet in 8 Komponenten.
- **Number stepper** — New component replaces native browser number inputs. Custom `+`/`- buttons with long-press support (400ms delay, 100ms repeat via pointer events), optional `snap` function, configurable min/max/step. Native spinners hidden via CSS. Used in 8 components.

- **Performance** — Game-Mode-Komponenten (10 Stück) per `React.lazy()` + `Suspense` lazy-loaded. `html-to-image` dynamisch importiert statt statisch gebundelt. Haupt-Bundle von 341KB auf ~302KB reduziert + separate Game-Chunks (~30KB).
- **Performance** — 10 game-mode components lazy-loaded via `React.lazy()` + `Suspense`. `html-to-image` dynamically imported instead of statically bundled. Main bundle reduced from 341KB to ~302KB + separate game chunks (~30KB).

- **Neue Dateien** — `ChevronIcon.tsx`, `NumberStepper.tsx`, `ThemeSwitcher.tsx`, `src/theme/` (ThemeContext, useTheme, themeContextValue, index).
- **New files** — `ChevronIcon.tsx`, `NumberStepper.tsx`, `ThemeSwitcher.tsx`, `src/theme/` (ThemeContext, useTheme, themeContextValue, index).

- **3 neue Translation-Keys** — `theme.system`, `theme.light`, `theme.dark` (DE + EN).
- **3 new translation keys** — `theme.system`, `theme.light`, `theme.dark` (DE + EN).

---

## [1.9.1] – 2026-03-03

### Scrub-Slider Redesign & Add-On-Ankündigung

- **Custom Scrub-Slider** — Nativen `<input type="range">` durch `ScrubSlider`-Komponente ersetzt. Sieht identisch zum Fortschrittsbalken am oberen Bildschirmrand aus (emerald/amber Gradient, Glow-Shadow, runder Thumb). Bewegen des Sliders aktualisiert den oberen Fortschrittsbalken in Echtzeit. Pointer Events für Touch + Mouse (kein Browser-Scroll-Conflict).
- **Custom scrub slider** — Replaced native `<input type="range">` with `ScrubSlider` component. Looks identical to the progress bar at the top of the screen (emerald/amber gradient, glow shadow, round thumb). Moving the slider updates the top progress bar in real-time. Pointer events for touch + mouse (no browser scroll conflict).

- **Add-On-Ankündigung** — Prominenter amber Banner in der Hauptanzeige (wie Bubble/ITM) sobald die Rebuy-Phase endet. Zeigt Kosten und Chip-Bonus an. `BubbleIndicator` erweitert um Add-On-Props, Fragment-Return erlaubt gleichzeitige Anzeige mit Bubble/ITM.
- **Add-on announcement** — Prominent amber banner in the main display (like Bubble/ITM) as soon as the rebuy phase ends. Shows cost and chip bonus. `BubbleIndicator` extended with add-on props, fragment return allows simultaneous display with bubble/ITM.

- **Neue Animation** — `animate-addon-pulse` (amber box-shadow pulse) in `index.css`.
- **New animation** — `animate-addon-pulse` (amber box-shadow pulse) in `index.css`.

- **2 neue Translation-Keys** — `addOn.announcement`, `addOn.announcementDetail` (DE + EN).
- **2 new translation keys** — `addOn.announcement`, `addOn.announcementDetail` (DE + EN).

---

## [1.9.0] – 2026-03-03

### Design Polish — Konsistenz & Verfeinerung

- **Abrundungs-Hierarchie** — Einheitliches System: Container `rounded-2xl` → Cards `rounded-xl` → Buttons/Inputs `rounded-lg` → Badges `rounded-md`/`rounded-full`. Betrifft 10 Komponenten mit insgesamt ~25 Korrekturen.
- **Rounding hierarchy** — Unified system: Container `rounded-2xl` → Cards `rounded-xl` → Buttons/Inputs `rounded-lg` → Badges `rounded-md`/`rounded-full`. Affects 10 components with ~25 corrections total.

- **Border-Standardisierung** — Einheitliche Opacities: `border-gray-700/40` (Standard), `border-gray-600/50` (Hover), `border-gray-700/30` (Sidebar-Trennung). Amber-Borders auf `/40` normalisiert. 12+ Dateien angepasst.
- **Border standardization** — Unified opacities: `border-gray-700/40` (standard), `border-gray-600/50` (hover), `border-gray-700/30` (sidebar separation). Amber borders normalized to `/40`. 12+ files updated.

- **Sekundäre Buttons** — Reset/Restart-Buttons mit `shadow-md shadow-black/15` und `active:scale-[0.97]` für taktiles Feedback aufgewertet.
- **Secondary buttons** — Reset/Restart buttons upgraded with `shadow-md shadow-black/15` and `active:scale-[0.97]` for tactile feedback.

- **Range-Slider Styling** — Custom CSS für `<input type="range">`: Emerald-Gradient-Track, runder Gradient-Thumb mit Glow-Shadow. Webkit + Firefox Pseudo-Elemente.
- **Range slider styling** — Custom CSS for `<input type="range">`: emerald gradient track, round gradient thumb with glow shadow. Webkit + Firefox pseudo-elements.

- **Sidebar-Trennung** — Desktop-Sidebars mit `bg-gray-900/40` Hintergrund und `border-gray-700/30`. Toggle-Buttons von `w-6 h-16` auf `w-7 h-20` vergrößert.
- **Sidebar separation** — Desktop sidebars with `bg-gray-900/40` background and `border-gray-700/30`. Toggle buttons enlarged from `w-6 h-16` to `w-7 h-20`.

- **Focus-States** — Glow-Effekt auf allen Inputs verstärkt: `focus:ring-1 focus:ring-emerald-500/20` → `focus:ring-2 focus:ring-emerald-500/25`. Betrifft 9 Komponenten.
- **Focus states** — Enhanced glow effect on all inputs: `focus:ring-1 focus:ring-emerald-500/20` → `focus:ring-2 focus:ring-emerald-500/25`. Affects 9 components.

- **Tabellen-Rows** — Standings und Bounty-Tabelle in Ergebnissen: `border-b border-gray-800/30`, `hover:bg-gray-800/40`, 1. Platz mit `border-l-2 border-l-amber-400`. Level-Rows im Editor mit Hover-Effekt.
- **Table rows** — Standings and bounty table in results: `border-b border-gray-800/30`, `hover:bg-gray-800/40`, 1st place with `border-l-2 border-l-amber-400`. Level rows in editor with hover effect.

- **Spieler-Rows** — Aktive Spieler mit `hover:border-gray-600/40`. Dealer-Badge mit `ring-2 ring-red-500/30` Glow. Rebuy-Count als Badge (`bg-emerald-900/30 rounded-full`). Eliminierte Spieler stärker abgeblendet (`opacity-40`).
- **Player rows** — Active players with `hover:border-gray-600/40`. Dealer badge with `ring-2 ring-red-500/30` glow. Rebuy count as badge (`bg-emerald-900/30 rounded-full`). Eliminated players more faded (`opacity-40`).

- **Body-Gradient** — Verstärkt auf `0.06` Opacity + zweiter Gradient am unteren rechten Bildschirmrand (`ellipse at 80% 100%`).
- **Body gradient** — Enhanced to `0.06` opacity + second gradient at bottom-right of screen (`ellipse at 80% 100%`).

- **Checkpoint-Banner** — `border-2 border-amber-600/50`, `shadow-lg`, `animate-fade-in`. Restore-Button als Gradient, Dismiss-Button als Ghost-Style.
- **Checkpoint banner** — `border-2 border-amber-600/50`, `shadow-lg`, `animate-fade-in`. Restore button as gradient, dismiss button as ghost style.

- **Card-Hover Glow** — `CollapsibleSection` und `CollapsibleSubSection` Header mit Hover-Shadows (`shadow-lg`/`shadow-md`).
- **Card hover glow** — `CollapsibleSection` and `CollapsibleSubSection` headers with hover shadows (`shadow-lg`/`shadow-md`).

- **Confirm-Dialog** — Cancel subtiler (`bg-gray-800/60`), Confirm mit `shadow-lg shadow-red-900/40`, `border border-red-700/30`, `active:scale-[0.97]`.
- **Confirm dialog** — Cancel more subtle (`bg-gray-800/60`), confirm with `shadow-lg shadow-red-900/40`, `border border-red-700/30`, `active:scale-[0.97]`.

- **22 Dateien geändert** — Rein visuelle/CSS-Änderungen, keine Logik-Modifikationen, keine neuen Dateien, keine neuen Dependencies.
- **22 files modified** — Purely visual/CSS changes, no logic modifications, no new files, no new dependencies.

---

## [1.8.0] – 2026-03-03

### Premium UI — Glassmorphism, Animationen & taktiles Design

- **Glassmorphic Cards** — Setup-Sektionen (`CollapsibleSection`, `CollapsibleSubSection`) mit `backdrop-blur-sm`, weichen Schatten (`shadow-lg shadow-black/20`) und halbtransparenten Backgrounds (`bg-gray-800/40`). Content-Bereiche mit `animate-fade-in`.
- **Glassmorphic cards** — Setup sections (`CollapsibleSection`, `CollapsibleSubSection`) with `backdrop-blur-sm`, soft shadows (`shadow-lg shadow-black/20`) and semi-transparent backgrounds (`bg-gray-800/40`). Content areas with `animate-fade-in`.

- **Timer-Glow** — Signatur-Effekt: Laufender Timer mit pulsierendem `text-shadow` (`animate-timer-glow`). Fortschrittsbalken als Gradient (`from-emerald-600 to-emerald-400`) mit Glow-Shadow. Countdown in Rot mit `animate-countdown-pulse` (ersetzt `animate-pulse`). Blinds mit dezenter `drop-shadow`.
- **Timer glow** — Signature effect: Running timer with pulsing `text-shadow` (`animate-timer-glow`). Progress bar as gradient (`from-emerald-600 to-emerald-400`) with glow shadow. Countdown in red with `animate-countdown-pulse` (replaces `animate-pulse`). Blinds with subtle `drop-shadow`.

- **Taktile Buttons** — Primär-Buttons (Play/Pause) mit `bg-gradient-to-b`, `shadow-lg` und `active:scale-[0.97]`. Sekundär-Buttons mit `shadow-md` und Borders. Tertiär-Buttons mit weicheren Borders und `rounded-lg`.
- **Tactile buttons** — Primary buttons (play/pause) with `bg-gradient-to-b`, `shadow-lg` and `active:scale-[0.97]`. Secondary buttons with `shadow-md` and borders. Tertiary buttons with softer borders and `rounded-lg`.

- **Custom Animationen** — 8 neue `@keyframes` in `index.css`: `fade-in`, `timer-glow`, `countdown-pulse`, `bubble-pulse`, `itm-flash`, `scale-in`, `slide-in-left`, `slide-in-right`. Entsprechende `@utility`-Klassen für Tailwind CSS 4.
- **Custom animations** — 8 new `@keyframes` in `index.css`: `fade-in`, `timer-glow`, `countdown-pulse`, `bubble-pulse`, `itm-flash`, `scale-in`, `slide-in-left`, `slide-in-right`. Corresponding `@utility` classes for Tailwind CSS 4.

- **Modal-Polish** — Confirm-Dialog und TemplateManager: `backdrop-blur-sm`, `animate-scale-in`, `shadow-2xl`, `rounded-2xl`. Sanftere Overlay-Transparenz (`bg-black/60`).
- **Modal polish** — Confirm dialog and TemplateManager: `backdrop-blur-sm`, `animate-scale-in`, `shadow-2xl`, `rounded-2xl`. Softer overlay transparency (`bg-black/60`).

- **Bubble/ITM-Animationen** — `animate-pulse` durch `animate-bubble-pulse` / `animate-itm-flash` ersetzt (custom box-shadow pulsieren). `backdrop-blur-sm`, `rounded-xl`.
- **Bubble/ITM animations** — `animate-pulse` replaced with `animate-bubble-pulse` / `animate-itm-flash` (custom box-shadow pulsing). `backdrop-blur-sm`, `rounded-xl`.

- **Spielmodus-Polishing** — `TournamentStats` mit `backdrop-blur-sm` und Shadows. `PlayerPanel` mit weicheren Borders, Hover-States und `rounded-xl`. `LevelPreview`, `ChipSidebar`, `RebuyStatus` mit dezenten Verbesserungen.
- **Game mode polishing** — `TournamentStats` with `backdrop-blur-sm` and shadows. `PlayerPanel` with softer borders, hover states and `rounded-xl`. `LevelPreview`, `ChipSidebar`, `RebuyStatus` with subtle refinements.

- **Globales Input-Pattern** — Alle Inputs: `bg-gray-800/80`, `border-gray-700/60`, `focus:ring-1 focus:ring-emerald-500/20`, `rounded-lg`, `transition-all duration-200`. Betrifft 10 Komponenten.
- **Global input pattern** — All inputs: `bg-gray-800/80`, `border-gray-700/60`, `focus:ring-1 focus:ring-emerald-500/20`, `rounded-lg`, `transition-all duration-200`. Applies to 10 components.

- **Settings-Polish** — Checkbox-Gradient (`from-emerald-400 to-emerald-600 shadow-sm`). Tastenkürzel-Anzeige mit Keycap-Look (`border shadow-sm`).
- **Settings polish** — Checkbox gradient (`from-emerald-400 to-emerald-600 shadow-sm`). Keyboard shortcuts display with keycap look (`border shadow-sm`).

- **Ergebnisseite** — Winner-Card mit `shadow-xl`, Standings und Info-Boxen mit `shadow-lg`, Share-Button als Gradient mit `active:scale-[0.97]`.
- **Results screen** — Winner card with `shadow-xl`, standings and info boxes with `shadow-lg`, share button as gradient with `active:scale-[0.97]`.

- **Body-Gradient** — Dezenter emerald `radial-gradient` am oberen Bildschirmrand auf `#0a0a0f`-Hintergrund.
- **Body gradient** — Subtle emerald `radial-gradient` at top of screen on `#0a0a0f` background.

- **Header-Redesign** — `bg-gray-900/50 backdrop-blur-sm border-gray-700/30`, Buttons mit Gradients und Shadows.
- **Header redesign** — `bg-gray-900/50 backdrop-blur-sm border-gray-700/30`, buttons with gradients and shadows.

- **23 Dateien geändert** — Rein visuelle/CSS-Änderungen, keine Logik-Modifikationen, keine neuen Dateien.
- **23 files modified** — Purely visual/CSS changes, no logic modifications, no new files.

---

## [1.7.0] – 2026-03-03

### Setup UX: Blindstruktur ausklappbar + Cleanup

- **Blindstruktur ausklappbar** — Die Level-Tabelle (ConfigEditor) ist jetzt in einem `CollapsibleSubSection` gewrappt und standardmäßig eingeklappt. Summary zeigt „12 Levels, 3 Pausen, Ø 15 Min".
- **Collapsible blind structure** — The level table (ConfigEditor) is now wrapped in a `CollapsibleSubSection` and collapsed by default. Summary shows "12 Levels, 3 Breaks, avg 15 Min".

- **BlindGenerator vereinheitlicht** — Eigener interner Toggle durch `CollapsibleSubSection` ersetzt — konsistente Chevrons (▸/▾) und Styling in der gesamten App.
- **BlindGenerator unified** — Internal toggle replaced with `CollapsibleSubSection` — consistent chevrons (▸/▾) and styling throughout the app.

- **Turnier-Grundlagen** — Turnier-Name und Buy-In/Startchips in einer gemeinsamen Karte zusammengefasst. Spart eine Sektion im vertikalen Scroll.
- **Tournament basics** — Tournament name and buy-in/starting chips merged into a single card. Saves one section in vertical scroll.

- **Summary-Badges bei offenen Sektionen** — Summaries werden jetzt auch als dezenter Subtitle angezeigt, wenn die Sektion geöffnet ist. Neue Summaries für Spieler-Sektion und Blindstruktur.
- **Summary badges on open sections** — Summaries are now also shown as subtle subtitles when the section is open. New summaries for players section and blind structure.

- **Sticky Start-Button auf Mobile** — Der „Turnier starten"-Button bleibt auf Mobile am unteren Bildschirmrand sichtbar, unabhängig von der Scroll-Position.
- **Sticky start button on mobile** — The "Start tournament" button stays visible at the bottom of the screen on mobile, regardless of scroll position.

- **3 neue Tests** — `computeBlindStructureSummary` (187 Tests gesamt).
- **3 new tests** — `computeBlindStructureSummary` (187 tests total).

---

## [1.6.0] – 2026-02-27

### Bug-Fixes, Accessibility & Turnier-Checkpoint

- **useTimer-Fix** — Render-Phase-State-Mutation durch `useRef` + `useEffect` ersetzt; vorher wurde `setState` während des Renderings aufgerufen (React-Regelverstoß).
- **useTimer fix** — Render-phase state mutation replaced with `useRef` + `useEffect`; previously `setState` was called during rendering (React rules violation).

- **Tastenkürzel-Fix** — CLAUDE.md dokumentierte falsches Tastenkürzel `P` (previous) statt korrektem `V` (Vorheriges). Korrigiert.
- **Keyboard shortcut fix** — CLAUDE.md documented wrong shortcut `P` (previous) instead of correct `V`. Fixed.

- **Accessibility (a11y)** — Umfassende ARIA-Verbesserungen: `role="progressbar"` auf Timer-Fortschrittsbalken, `aria-live` auf Blinds- und Countdown-Anzeige, `aria-label` auf allen Buttons, `aria-pressed` auf Start/Pause-Toggle, `role="alert"`/`role="status"` auf Bubble/ITM-Banner, `aria-expanded` auf Collapsible-Sections, `role="dialog"` + `aria-modal` + Auto-Focus + Escape-to-Close auf Modals (TemplateManager, Confirm-Dialog).
- **Accessibility (a11y)** — Comprehensive ARIA improvements: `role="progressbar"` on timer progress bar, `aria-live` on blinds and countdown display, `aria-label` on all buttons, `aria-pressed` on start/pause toggle, `role="alert"`/`role="status"` on bubble/ITM banner, `aria-expanded` on collapsible sections, `role="dialog"` + `aria-modal` + auto-focus + escape-to-close on modals (TemplateManager, confirm dialog).

- **Turnier-Checkpoint** — Automatisches Speichern des Spielstands bei jeder Aktion im Spielmodus (Level, Restzeit, Config, Settings). Bei App-Neustart erscheint ein Wiederherstellungs-Banner im Setup: „Turnier fortsetzen" lädt den Spielstand mit pausiertem Timer, „Verwerfen" löscht den Checkpoint. Checkpoint wird automatisch gelöscht wenn das Turnier endet oder der User zum Setup zurückkehrt.
- **Tournament checkpoint** — Auto-save game state on every action in game mode (level, remaining time, config, settings). On app restart, a recovery banner appears in setup: "Resume tournament" loads the game state with paused timer, "Dismiss" clears the checkpoint. Checkpoint is automatically cleared when the tournament ends or the user returns to setup.

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
