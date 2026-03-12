import type { Language } from '../i18n/translations';

// --- Types ---

interface LocalizedText {
  de: string;
  en: string;
}

export interface HelpItem {
  title: LocalizedText;
  body: LocalizedText;
}

export interface HelpSection {
  id: string;
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
  items: HelpItem[];
}

export interface FaqEntry {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface ShortcutEntry {
  key: string;
  label: LocalizedText;
  context: 'game' | 'all';
}

// --- Helper ---

export function matchesSearch(text: LocalizedText, query: string, language: Language): boolean {
  return text[language].toLowerCase().includes(query);
}

export function filterSections(sections: HelpSection[], query: string, language: Language): HelpSection[] {
  if (!query) return sections;
  const q = query.toLowerCase();
  return sections
    .map((section) => {
      // Section title/desc match → keep whole section
      if (matchesSearch(section.title, q, language) || matchesSearch(section.description, q, language)) {
        return section;
      }
      // Filter items
      const filtered = section.items.filter(
        (item) => matchesSearch(item.title, q, language) || matchesSearch(item.body, q, language),
      );
      return filtered.length > 0 ? { ...section, items: filtered } : null;
    })
    .filter((s): s is HelpSection => s !== null);
}

export function filterFaq(entries: FaqEntry[], query: string, language: Language): FaqEntry[] {
  if (!query) return entries;
  const q = query.toLowerCase();
  return entries.filter(
    (e) => matchesSearch(e.question, q, language) || matchesSearch(e.answer, q, language),
  );
}

// --- Data ---

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    icon: '\uD83D\uDE80',
    title: { de: 'Erste Schritte', en: 'Getting Started' },
    description: { de: 'Turnier einrichten und starten', en: 'Set up and start a tournament' },
    items: [
      {
        title: { de: 'Setup-Wizard', en: 'Setup Wizard' },
        body: {
          de: 'Beim ersten Start führt dich ein Wizard durch die wichtigsten Einstellungen: Spieleranzahl, Buy-In, Startchips und Blindgeschwindigkeit. Du kannst den Wizard jederzeit überspringen.',
          en: 'On first launch, a wizard guides you through key settings: player count, buy-in, starting chips, and blind speed. You can skip the wizard at any time.',
        },
      },
      {
        title: { de: 'Setup-Übersicht', en: 'Setup Overview' },
        body: {
          de: 'Im Setup-Modus siehst du aufklappbare Sektionen für alle Einstellungen: Turnier-Grundlagen, Spieler, Blindstruktur, Chip-Werte, Auszahlung und Rebuy/Add-On/Bounty. Essentielle Bereiche sind standardmäßig geöffnet.',
          en: 'In setup mode you see collapsible sections for all settings: tournament basics, players, blind structure, chip values, payout, and rebuy/add-on/bounty. Essential sections are open by default.',
        },
      },
      {
        title: { de: 'Turnier starten', en: 'Start Tournament' },
        body: {
          de: 'Drücke den grünen "Turnier starten"-Button. Die App prüft vorher, ob die Konfiguration gültig ist (mindestens 2 Spieler, Auszahlungsplätze passen etc.).',
          en: 'Press the green "Start Tournament" button. The app validates your config first (at least 2 players, payout places match, etc.).',
        },
      },
      {
        title: { de: 'Vorlagen', en: 'Templates' },
        body: {
          de: 'Speichere deine Turnierkonfiguration als Vorlage, um sie später wiederzuverwenden. Du kannst Vorlagen auch als JSON-Datei exportieren/importieren. Es gibt 3 eingebaute Presets für Schnellstart.',
          en: 'Save your tournament config as a template for reuse. You can also export/import templates as JSON files. There are 3 built-in presets for quick start.',
        },
      },
    ],
  },
  {
    id: 'blind-structure',
    icon: '\uD83D\uDCCA',
    title: { de: 'Blind-Struktur', en: 'Blind Structure' },
    description: { de: 'Blinds generieren und anpassen', en: 'Generate and customize blinds' },
    items: [
      {
        title: { de: 'Blind-Generator', en: 'Blind Generator' },
        body: {
          de: 'Wähle aus 3 Geschwindigkeiten (Schnell/Normal/Langsam). Der Generator erstellt eine passende Struktur basierend auf deinen Startchips. Die geschätzte Turnierdauer wird angezeigt.',
          en: 'Choose from 3 speeds (Fast/Normal/Slow). The generator creates a matching structure based on your starting chips. Estimated tournament duration is displayed.',
        },
      },
      {
        title: { de: 'Manuell bearbeiten', en: 'Manual Editing' },
        body: {
          de: 'In der Level-Tabelle kannst du jedes Level einzeln anpassen: Blinds, Ante, Dauer, Pausen hinzufügen/entfernen. Levels lassen sich auch hinzufügen oder löschen.',
          en: 'In the level table you can adjust each level individually: blinds, ante, duration, add/remove breaks. You can also add or delete levels.',
        },
      },
      {
        title: { de: 'Endzeit-Modus', en: 'End Time Mode' },
        body: {
          de: 'Im Tab "Nach Endzeit" gibst du eine Ziel-Turnierdauer ein. Der Generator erstellt automatisch eine Blindstruktur, die in dieser Zeit zum Heads-Up führt.',
          en: 'In the "By End Time" tab, enter a target tournament duration. The generator automatically creates a blind structure that leads to heads-up within that time.',
        },
      },
      {
        title: { de: 'Ante-Optionen', en: 'Ante Options' },
        body: {
          de: 'Aktiviere Ante im Setup. Wähle zwischen Standard-Ante (~12,5% des Big Blind) oder Big-Blind-Ante (BBA, Ante = Big Blind, wie bei WSOP/EPT).',
          en: 'Enable ante in setup. Choose between standard ante (~12.5% of big blind) or Big Blind Ante (BBA, ante = big blind, as in WSOP/EPT).',
        },
      },
    ],
  },
  {
    id: 'player-management',
    icon: '\uD83D\uDC65',
    title: { de: 'Spielerverwaltung', en: 'Player Management' },
    description: { de: 'Spieler, Sitzplätze und Dealer', en: 'Players, seats, and dealer' },
    items: [
      {
        title: { de: 'Spieler hinzufügen', en: 'Add Players' },
        body: {
          de: 'Tippe auf "+ Spieler" im Setup. Spielernamen werden automatisch gespeichert und bei zukünftigen Turnieren per Autocomplete vorgeschlagen. Du kannst auch Spieler aus der Historie importieren.',
          en: 'Tap "+ Player" in setup. Player names are saved automatically and suggested via autocomplete in future tournaments. You can also import players from history.',
        },
      },
      {
        title: { de: 'Sitzplätze & Shuffle', en: 'Seats & Shuffle' },
        body: {
          de: 'Weise Sitzplätze per Drag & Drop zu oder nutze den Shuffle-Button für zufällige Platzierung. Der Dealer-Button wird automatisch zugewiesen.',
          en: 'Assign seats via drag & drop or use the shuffle button for random placement. The dealer button is assigned automatically.',
        },
      },
      {
        title: { de: 'Dealer-Rotation', en: 'Dealer Rotation' },
        body: {
          de: 'Im Spielmodus dreht der Dealer-Button automatisch weiter. Eliminierte Spieler werden übersprungen. Du kannst auch manuell weiterdrücken.',
          en: 'In game mode the dealer button rotates automatically. Eliminated players are skipped. You can also advance manually.',
        },
      },
      {
        title: { de: 'Multi-Table', en: 'Multi-Table' },
        body: {
          de: 'Für größere Turniere: Aktiviere Multi-Table im Setup, definiere Tischanzahl und Sitzplätze. Spieler werden automatisch verteilt. Tisch-Balancing und Final-Table-Merge laufen automatisch.',
          en: 'For larger tournaments: enable multi-table in setup, define table count and seats. Players are distributed automatically. Table balancing and final table merge happen automatically.',
        },
      },
    ],
  },
  {
    id: 'during-tournament',
    icon: '\u23F1\uFE0F',
    title: { de: 'Während des Turniers', en: 'During the Tournament' },
    description: { de: 'Timer, Pausen und besondere Situationen', en: 'Timer, breaks, and special situations' },
    items: [
      {
        title: { de: 'Timer-Steuerung', en: 'Timer Controls' },
        body: {
          de: 'Start/Pause mit der Leertaste oder dem Button. Der Timer nutzt Wall-Clock-Zeit (keine Drift). Per Slider kannst du die Zeit im aktuellen Level anpassen.',
          en: 'Start/pause with spacebar or the button. The timer uses wall-clock time (no drift). Use the slider to adjust time within the current level.',
        },
      },
      {
        title: { de: 'Pausen', en: 'Breaks' },
        body: {
          de: 'Pausen werden automatisch nach dem konfigurierten Level eingelegt. 30 Sekunden vor Pausenende wird eine Warnung angesagt. Color-Up-Events können an Pausen gekoppelt sein.',
          en: 'Breaks are inserted automatically after the configured level. A warning is announced 30 seconds before break ends. Color-up events can be tied to breaks.',
        },
      },
      {
        title: { de: 'Clean View', en: 'Clean View' },
        body: {
          de: 'Taste F blendet Statistiken, Sidebars und sekundäre Buttons aus. Nur Timer, Blinds und wichtige Banner bleiben sichtbar — ideal für fokussiertes Spiel.',
          en: 'Press F to hide stats, sidebars, and secondary buttons. Only timer, blinds, and important banners remain visible — ideal for focused play.',
        },
      },
      {
        title: { de: 'Bubble & In The Money', en: 'Bubble & In The Money' },
        body: {
          de: 'Wenn noch ein Spieler mehr als die Auszahlungsplätze übrig ist, erscheint der "BUBBLE!"-Banner. Beim Burst gibt es einen "In The Money"-Flash. Sound-Effekte begleiten beide Events.',
          en: 'When one more player than payout places remains, the "BUBBLE!" banner appears. On burst, an "In The Money" flash shows. Sound effects accompany both events.',
        },
      },
      {
        title: { de: 'Letzte Hand & Hand-for-Hand', en: 'Last Hand & Hand-for-Hand' },
        body: {
          de: 'Taste L sagt die letzte Hand an (unterscheidet vor Pause / Ende des Levels). Hand-for-Hand (Taste H) pausiert nach jeder Hand — ideal während der Bubble-Phase.',
          en: 'Press L to announce last hand (distinguishes before break / end of level). Hand-for-hand (key H) pauses after each hand — ideal during bubble phase.',
        },
      },
      {
        title: { de: 'Call the Clock', en: 'Call the Clock' },
        body: {
          de: 'Taste C startet einen Shot-Clock-Countdown (Standard: 60 Sekunden, konfigurierbar 10–300s). In den letzten 10 Sekunden ertönen Spannungs-Beeps.',
          en: 'Press C to start a shot clock countdown (default: 60 seconds, configurable 10–300s). Tension beeps play in the last 10 seconds.',
        },
      },
    ],
  },
  {
    id: 'rebuy-addon-bounty',
    icon: '\uD83D\uDD04',
    title: { de: 'Rebuy / Add-On / Bounty', en: 'Rebuy / Add-On / Bounty' },
    description: { de: 'Nachkauf, Zusatzchips und Kopfgeld', en: 'Rebuys, add-ons, and bounties' },
    items: [
      {
        title: { de: 'Rebuy', en: 'Rebuy' },
        body: {
          de: 'Aktiviere Rebuys im Setup mit optionalem Limit (maximal X Rebuys gesamt oder pro Spieler). Rebuys sind nur bis zum konfigurierten Level möglich. Re-Entry ermöglicht Wiedereinstieg nach Elimination.',
          en: 'Enable rebuys in setup with optional limits (max X rebuys total or per player). Rebuys are only possible up to the configured level. Re-entry allows rejoining after elimination.',
        },
      },
      {
        title: { de: 'Add-On', en: 'Add-On' },
        body: {
          de: 'Add-On wird automatisch nach Ende der Rebuy-Phase angeboten. Ein amber Banner erscheint. Mit Pause: Banner während Pause + nächstem Level. Ohne Pause: Timer pausiert automatisch.',
          en: 'Add-on is offered automatically after the rebuy phase ends. An amber banner appears. With break: banner during break + next level. Without break: timer pauses automatically.',
        },
      },
      {
        title: { de: 'Fixed Bounty', en: 'Fixed Bounty' },
        body: {
          de: 'Jeder Spieler hat ein festes Kopfgeld. Bei Elimination geht das Kopfgeld an den Eliminator. Knockouts werden im Spielerpanel und in den Ergebnissen angezeigt.',
          en: 'Each player has a fixed bounty. On elimination, the bounty goes to the eliminator. Knockouts are shown in the player panel and results.',
        },
      },
      {
        title: { de: 'Mystery Bounty', en: 'Mystery Bounty' },
        body: {
          de: 'Alternative zu Fixed Bounty: Ein Pool von zufälligen Beträgen. Bei jeder Elimination wird ein zufälliger Betrag gezogen und per Sprachansage verkündet.',
          en: 'Alternative to fixed bounty: a pool of random amounts. On each elimination, a random amount is drawn and announced via voice.',
        },
      },
    ],
  },
  {
    id: 'remote-control',
    icon: '\uD83D\uDCF1',
    title: { de: 'Fernbedienung', en: 'Remote Control' },
    description: { de: 'Smartphone als Fernsteuerung nutzen', en: 'Use your smartphone as remote' },
    items: [
      {
        title: { de: 'Verbindung herstellen', en: 'Connect' },
        body: {
          de: 'Tippe im Spielmodus auf das 📱-Symbol im Header. Ein QR-Code erscheint. Scanne ihn mit deinem Smartphone — die App öffnet sich und verbindet automatisch.',
          en: 'In game mode, tap the 📱 icon in the header. A QR code appears. Scan it with your smartphone — the app opens and connects automatically.',
        },
      },
      {
        title: { de: 'Controller-Funktionen', en: 'Controller Functions' },
        body: {
          de: 'Vom Smartphone aus: Play/Pause, nächstes/vorheriges Level, Dealer weiterdrücken, Sound ein/aus, Call the Clock, Level zurücksetzen. Große Touch-Targets für einfache Bedienung.',
          en: 'From your smartphone: play/pause, next/previous level, advance dealer, sound on/off, call the clock, reset level. Large touch targets for easy use.',
        },
      },
      {
        title: { de: 'Verbindungsstatus', en: 'Connection Status' },
        body: {
          de: 'Ein farbiger Punkt am 📱-Symbol zeigt den Status: Grün = verbunden. Bei Verbindungsverlust versucht die App automatisch bis zu 3 Mal, sich erneut zu verbinden.',
          en: 'A colored dot on the 📱 icon shows status: green = connected. On connection loss, the app automatically retries up to 3 times.',
        },
      },
      {
        title: { de: 'Spieler-Management', en: 'Player Management' },
        body: {
          de: 'Die aufklappbare Spielerliste auf der Fernbedienung zeigt alle aktiven Spieler. Du kannst Spieler eliminieren (mit Bounty-Picker bei aktivem Kopfgeld), Rebuys vergeben und Add-Ons zuweisen — alles vom Smartphone aus.',
          en: 'The collapsible player list on the remote shows all active players. You can eliminate players (with bounty picker when bounties are active), assign rebuys, and grant add-ons — all from your smartphone.',
        },
      },
      {
        title: { de: 'Turnier-Infos auf dem Controller', en: 'Tournament Info on Controller' },
        body: {
          de: 'Der Controller zeigt neben Timer und Blinds auch Prizepool, durchschnittlichen Stack in Big Blinds, bisherige Spielzeit, das nächste Level, Pausen-Anzeige und ITM-Status.',
          en: 'The controller shows prize pool, average stack in big blinds, elapsed time, next level, break indicator, and ITM status — in addition to timer and blinds.',
        },
      },
    ],
  },
  {
    id: 'tv-display',
    icon: '\uD83D\uDCFA',
    title: { de: 'TV-Modus', en: 'TV Display Mode' },
    description: { de: 'Fullscreen-Anzeige für TV oder Beamer', en: 'Fullscreen display for TV or projector' },
    items: [
      {
        title: { de: 'Aktivieren', en: 'Activate' },
        body: {
          de: 'Im Spielmodus: Tippe auf 📺 im Header oder drücke T. Die Anzeige öffnet sich in einem separaten Fenster — ziehe es auf deinen TV/Beamer.',
          en: 'In game mode: tap 📺 in the header or press T. The display opens in a separate window — drag it to your TV/projector.',
        },
      },
      {
        title: { de: 'Layout', en: 'Layout' },
        body: {
          de: 'Obere Hälfte: Timer, Blinds, Countdown, Fortschrittsbalken — immer sichtbar. Untere Hälfte: 6 rotierende Screens (Spieler, Stats, Auszahlung, Blindstruktur, Chips, Sitzplan) alle 15 Sekunden.',
          en: 'Top half: timer, blinds, countdown, progress bar — always visible. Bottom half: 6 rotating screens (players, stats, payout, blind schedule, chips, seating) every 15 seconds.',
        },
      },
      {
        title: { de: 'Navigation', en: 'Navigation' },
        body: {
          de: 'Pfeiltasten (← →) wechseln die Screens manuell. Escape oder T beendet den TV-Modus. Indikator-Punkte zeigen den aktuellen Screen.',
          en: 'Arrow keys (← →) switch screens manually. Escape or T exits TV mode. Indicator dots show the current screen.',
        },
      },
    ],
  },
  {
    id: 'voice-sounds',
    icon: '\uD83D\uDD0A',
    title: { de: 'Sprachansagen & Sounds', en: 'Voice & Sounds' },
    description: { de: 'Professionelle Ansagen und Sound-Effekte', en: 'Professional announcements and sound effects' },
    items: [
      {
        title: { de: 'Sprachansagen', en: 'Voice Announcements' },
        body: {
          de: 'Aktiviere Voice über den Mikrofon-Toggle im Header. Professionelle MP3-Ansagen (ElevenLabs) für Level-Wechsel, Pausen, Bubble, ITM, Eliminierungen, Turniersieger und mehr. Funktioniert auch offline.',
          en: 'Enable voice via the microphone toggle in the header. Professional MP3 announcements (ElevenLabs) for level changes, breaks, bubble, ITM, eliminations, tournament winner, and more. Works offline too.',
        },
      },
      {
        title: { de: 'Sound-Effekte', en: 'Sound Effects' },
        body: {
          de: 'Beep-Sounds beim Countdown (letzte 10 Sekunden), Spannungs-Sound bei Bubble, Fanfare bei In The Money, Victory-Sound beim Turniersieger. Lautstärke regelbar in den Einstellungen.',
          en: 'Beep sounds during countdown (last 10 seconds), tension sound at bubble, fanfare at in the money, victory sound for tournament winner. Volume adjustable in settings.',
        },
      },
      {
        title: { de: 'Verbaler Countdown', en: 'Verbal Countdown' },
        body: {
          de: 'In den letzten 10 Sekunden eines Spiellevels werden die Zahlen gesprochen (10, 9, 8...). Während Pausen ertönen stattdessen nur Beeps.',
          en: 'In the last 10 seconds of a play level, numbers are spoken (10, 9, 8...). During breaks, only beeps sound instead.',
        },
      },
    ],
  },
];

export const faqEntries: FaqEntry[] = [
  {
    question: { de: 'Wie starte ich ein Turnier?', en: 'How do I start a tournament?' },
    answer: {
      de: 'Konfiguriere dein Turnier im Setup (Spieler, Buy-In, Blindstruktur) und drücke den grünen "Turnier starten"-Button. Oder nutze eines der 3 Presets für einen Schnellstart.',
      en: 'Configure your tournament in setup (players, buy-in, blind structure) and press the green "Start Tournament" button. Or use one of the 3 presets for a quick start.',
    },
  },
  {
    question: { de: 'Wie nutze ich die Fernbedienung?', en: 'How do I use the remote control?' },
    answer: {
      de: 'Im Spielmodus: Tippe auf 📱 im Header, scanne den QR-Code mit deinem Smartphone. Die App verbindet sich automatisch. Du steuerst dann Timer, Levels und Dealer vom Handy.',
      en: 'In game mode: tap 📱 in the header, scan the QR code with your smartphone. The app connects automatically. You then control timer, levels, and dealer from your phone.',
    },
  },
  {
    question: { de: 'Kann ich die Blindstruktur anpassen?', en: 'Can I customize the blind structure?' },
    answer: {
      de: 'Ja! Nutze den Blind-Generator (3 Geschwindigkeiten) oder bearbeite jedes Level einzeln in der Tabelle. Du kannst auch eine Ziel-Endzeit eingeben und die Struktur automatisch generieren lassen.',
      en: 'Yes! Use the blind generator (3 speeds) or edit each level individually in the table. You can also enter a target end time and have the structure generated automatically.',
    },
  },
  {
    question: { de: 'Was passiert bei der Bubble?', en: 'What happens at the bubble?' },
    answer: {
      de: 'Ein roter "BUBBLE!"-Banner erscheint, begleitet von einem Spannungs-Sound. Du kannst Hand-for-Hand (Taste H) aktivieren. Wenn die Bubble platzt, gibt es einen grünen "In The Money"-Flash.',
      en: 'A red "BUBBLE!" banner appears, accompanied by a tension sound. You can activate hand-for-hand (key H). When the bubble bursts, a green "In The Money" flash shows.',
    },
  },
  {
    question: { de: 'Wie funktioniert der TV-Modus?', en: 'How does TV mode work?' },
    answer: {
      de: 'Drücke 📺 im Header oder Taste T. Ein separates Fenster öffnet sich — ziehe es auf deinen TV/Beamer. Timer bleibt oben, 6 Info-Screens rotieren unten automatisch.',
      en: 'Press 📺 in the header or key T. A separate window opens — drag it to your TV/projector. Timer stays on top, 6 info screens rotate automatically below.',
    },
  },
  {
    question: { de: 'Kann ich Turniervorlagen speichern?', en: 'Can I save tournament templates?' },
    answer: {
      de: 'Ja, über den "Vorlagen"-Button im Setup. Speichere beliebig viele Konfigurationen, exportiere sie als JSON oder importiere Vorlagen von anderen Geräten.',
      en: 'Yes, via the "Templates" button in setup. Save any number of configurations, export them as JSON, or import templates from other devices.',
    },
  },
  {
    question: { de: 'Wie funktionieren Rebuys?', en: 'How do rebuys work?' },
    answer: {
      de: 'Aktiviere Rebuys im Setup und konfiguriere Limit und Phase. Im Spielmodus können Spieler über den Rebuy-Button nachkaufen. Der Prizepool aktualisiert sich automatisch.',
      en: 'Enable rebuys in setup and configure limits and phase. In game mode, players can rebuy via the rebuy button. The prize pool updates automatically.',
    },
  },
  {
    question: { de: 'Was ist Mystery Bounty?', en: 'What is Mystery Bounty?' },
    answer: {
      de: 'Statt eines festen Kopfgeldes wird bei jeder Elimination ein zufälliger Betrag aus einem Pool gezogen. Die Beträge können von klein bis sehr groß variieren — wie im Casino!',
      en: 'Instead of a fixed bounty, a random amount is drawn from a pool on each elimination. Amounts can range from small to very large — just like in a casino!',
    },
  },
  {
    question: { de: 'Wie drucke ich die Blindstruktur?', en: 'How do I print the blind structure?' },
    answer: {
      de: 'Im Setup gibt es einen "Drucken"-Button unter der Blindstruktur. Er öffnet eine druckoptimierte Ansicht mit Blind-Tabelle, Chip-Werten und Auszahlung.',
      en: 'In setup there is a "Print" button below the blind structure. It opens a print-optimized view with blind table, chip values, and payout.',
    },
  },
  {
    question: { de: 'Funktioniert die App offline?', en: 'Does the app work offline?' },
    answer: {
      de: 'Ja! Die App ist eine PWA (Progressive Web App) und funktioniert vollständig offline. Alle Daten werden lokal gespeichert. Nur die Fernbedienung benötigt eine Internetverbindung zum Verbindungsaufbau.',
      en: 'Yes! The app is a PWA (Progressive Web App) and works fully offline. All data is stored locally. Only the remote control needs internet for initial connection.',
    },
  },
  {
    question: { de: 'Wie ändere ich die Sprache?', en: 'How do I change the language?' },
    answer: {
      de: 'Tippe auf den DE/EN-Toggle im Header — jederzeit verfügbar, auch im Spielmodus. Die Sprache wird gespeichert.',
      en: 'Tap the DE/EN toggle in the header — available at any time, even in game mode. The language setting is saved.',
    },
  },
  {
    question: { de: 'Wie teile ich Turnierergebnisse?', en: 'How do I share tournament results?' },
    answer: {
      de: 'Nach Turnierende: "Text kopieren" für WhatsApp, "CSV" für Tabellenkalkulation, "Screenshot" für ein Bild, oder QR-Code zum Teilen der Ergebnisse mit anderen App-Nutzern.',
      en: 'After tournament: "Copy text" for WhatsApp, "CSV" for spreadsheets, "Screenshot" for an image, or QR code to share results with other app users.',
    },
  },
  {
    question: { de: 'Wie funktioniert die Liga?', en: 'How does the league work?' },
    answer: {
      de: 'Erstelle eine Liga im Liga-Modus, konfiguriere das Punktesystem, und verknüpfe Turniere mit der Liga. Spieltage werden automatisch oder manuell angelegt. Die Tabelle zeigt Punkte, Finanzen und Statistiken.',
      en: 'Create a league in league mode, configure the point system, and link tournaments to the league. Game days are created automatically or manually. The standings show points, finances, and statistics.',
    },
  },
  {
    question: { de: 'Kann ich den Bildschirm während des Turniers anlassen?', en: 'Can I keep the screen on during the tournament?' },
    answer: {
      de: 'Ja, die App nutzt die Wake Lock API — dein Bildschirm bleibt automatisch an, solange der Timer läuft. Kein manuelles Einstellen nötig.',
      en: 'Yes, the app uses the Wake Lock API — your screen stays on automatically while the timer runs. No manual configuration needed.',
    },
  },
  {
    question: { de: 'Kann ich Spieler über die Fernbedienung eliminieren?', en: 'Can I eliminate players via the remote control?' },
    answer: {
      de: 'Ja! Öffne die Spielerliste auf dem Controller und tippe auf das ❌-Symbol neben dem Spieler. Bei aktivem Bounty erscheint ein Eliminator-Picker, in dem du auswählst, wer den Knockout gemacht hat.',
      en: 'Yes! Open the player list on the controller and tap the ❌ icon next to the player. With bounties active, an eliminator picker appears to select who made the knockout.',
    },
  },
];

export const shortcutEntries: ShortcutEntry[] = [
  { key: 'Space', label: { de: 'Start / Pause', en: 'Start / Pause' }, context: 'game' },
  { key: 'N', label: { de: 'Nächstes Level', en: 'Next Level' }, context: 'game' },
  { key: 'V', label: { de: 'Vorheriges Level', en: 'Previous Level' }, context: 'game' },
  { key: 'R', label: { de: 'Level zurücksetzen', en: 'Reset Level' }, context: 'game' },
  { key: 'F', label: { de: 'Clean View ein/aus', en: 'Clean View toggle' }, context: 'game' },
  { key: 'L', label: { de: 'Letzte Hand', en: 'Last Hand' }, context: 'game' },
  { key: 'T', label: { de: 'TV-Modus ein/aus', en: 'TV Mode toggle' }, context: 'game' },
  { key: 'H', label: { de: 'Hand-for-Hand', en: 'Hand-for-Hand' }, context: 'game' },
  { key: 'C', label: { de: 'Call the Clock', en: 'Call the Clock' }, context: 'game' },
  { key: 'Esc', label: { de: 'TV-Modus beenden', en: 'Exit TV Mode' }, context: 'game' },
  { key: '\u2190 \u2192', label: { de: 'TV-Screens wechseln', en: 'Switch TV screens' }, context: 'game' },
];
