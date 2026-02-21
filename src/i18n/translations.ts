export type Language = 'de' | 'en';

const de = {
  // --- App ---
  'app.title': '♠ ♥ Pokern up de Hüh ♦ ♣',
  'app.startGame': '▶ Spiel starten',
  'app.setup': '⚙ Setup',
  'app.importExport': '↕ Import/Export',
  'app.tournamentName': 'Turnier-Name',
  'app.tournamentNamePlaceholder': 'z.B. Freitagspoker',
  'app.loadPreset': 'Preset laden',
  'app.players': 'Spieler',
  'app.buyInAndChips': 'Buy-In & Startchips',
  'app.buyIn': 'Buy-In',
  'app.startingChips': 'Startchips',
  'app.blindStructure': 'Blind-Struktur',
  'app.withAnte': '✓ mit Ante',
  'app.withoutAnte': 'ohne Ante',
  'app.payout': 'Auszahlung',
  'app.rebuy': 'Rebuy',
  'app.bounty': 'Bounty',
  'app.checkConfig': 'Konfiguration prüfen:',
  'app.allReady': '✓ Alles bereit – Turnier kann gestartet werden',
  'app.startTournament': '▶ Turnier starten',
  'app.minPlayersRequired': 'Mindestens 2 Spieler erforderlich',
  'app.morePlacesThanPlayers': 'Mehr Auszahlungsplätze ({places}) als Spieler ({players})',
  'app.backToSetup': '⚙ Zurück zum Setup',
  'app.hidePlayers': 'Spieler ausblenden',
  'app.showPlayers': 'Spieler einblenden',
  'app.hideSidebar': 'Sidebar ausblenden',
  'app.showSidebar': 'Sidebar einblenden',
  'app.cancel': 'Abbrechen',

  // --- Confirm Dialogs ---
  'confirm.resetLevel.title': 'Level zurücksetzen?',
  'confirm.resetLevel.message': 'Die verbleibende Zeit des aktuellen Levels wird auf die volle Dauer zurückgesetzt.',
  'confirm.resetLevel.confirm': 'Level zurücksetzen',
  'confirm.restartTournament.title': 'Turnier neu starten?',
  'confirm.restartTournament.message': 'Das gesamte Turnier wird auf Level 1 zurückgesetzt. Alle Fortschritte gehen verloren.',
  'confirm.restartTournament.confirm': 'Turnier neu starten',
  'confirm.exitTournament.title': 'Turnier beenden?',
  'confirm.exitTournament.message': 'Wenn du zum Setup zurückkehrst, wird das laufende Turnier beendet und der Timer zurückgesetzt.',
  'confirm.exitTournament.confirm': 'Turnier beenden',

  // --- Timer ---
  'timer.next': 'Nächstes',
  'timer.break': 'Pause',
  'timer.closeSlider': 'Slider schließen',
  'timer.adjustTime': 'Zeit anpassen',
  'timer.running': 'Läuft',
  'timer.paused': 'Pausiert',
  'timer.finished': 'Beendet',
  'timer.stopped': 'Gestoppt',
  'timer.ante': 'Ante',

  // --- Controls ---
  'controls.previous': '⏮ Zurück',
  'controls.previousTooltip': 'Vorheriges Level (P)',
  'controls.startPauseTooltip': 'Start/Pause (Space)',
  'controls.pause': '⏸ Pause',
  'controls.end': '⏹ Ende',
  'controls.start': '▶ Start',
  'controls.next': 'Weiter ⏭',
  'controls.nextTooltip': 'Nächstes Level (N)',
  'controls.levelReset': '↺ Level Reset',
  'controls.levelResetTooltip': 'Level zurücksetzen (R)',
  'controls.tournamentRestart': '⟲ Turnier Restart',
  'controls.tournamentRestartTooltip': 'Turnier neu starten',

  // --- Player Panel ---
  'playerPanel.prizePool': 'Preisgeld',
  'playerPanel.payout': 'Auszahlung',
  'playerPanel.place': 'Platz',
  'playerPanel.activePlayers': 'Aktive Spieler',
  'playerPanel.eliminate': 'Raus',
  'playerPanel.eliminateTooltip': 'Spieler ist ausgeschieden',
  'playerPanel.whoEliminated': 'Wer hat {name} eliminiert?',
  'playerPanel.selectPlayer': '-- Spieler wählen --',
  'playerPanel.confirm': 'Bestätigen',
  'playerPanel.eliminated': 'Ausgeschieden',
  'playerPanel.reinstateTooltip': 'Eliminierung rückgängig machen',
  'playerPanel.reinstate': 'Zurück',
  'playerPanel.by': 'von',

  // --- Config Editor ---
  'config.allLevels': 'Alle Levels:',
  'config.allBreaks': 'Alle Pausen:',
  'config.apply': 'Übernehmen',
  'config.min': 'Min',
  'config.level': 'Level',
  'config.break': 'Pause',
  'config.moveUp': 'Nach oben',
  'config.moveDown': 'Nach unten',
  'config.duplicate': 'Duplizieren',
  'config.delete': 'Löschen',
  'config.addLevel': '+ Level',
  'config.addBreak': '+ Pause',
  'config.label': 'Label:',

  // --- Preset Picker ---
  'preset.turbo': 'Turbo',
  'preset.turboDesc': '6 min Levels, schnelles Spiel',
  'preset.standard': 'Standard',
  'preset.standardDesc': '15 min Levels, klassisch',
  'preset.deep': 'Deep Stack',
  'preset.deepDesc': '20 min Levels, viel Spieltiefe',

  // --- Settings ---
  'settings.title': 'Einstellungen',
  'settings.sound': 'Sound',
  'settings.countdown': 'Countdown (letzte 10s)',
  'settings.autoAdvance': 'Automatisch weiter',
  'settings.largeDisplay': 'Große Anzeige',
  'settings.fullscreen': '⛶ Vollbild',
  'settings.shortcuts': 'Tastenkürzel',
  'settings.shortcutStartPause': 'Start/Pause',
  'settings.shortcutNext': 'Nächstes',
  'settings.shortcutPrevious': 'Vorheriges',
  'settings.shortcutReset': 'Reset',

  // --- Import/Export ---
  'importExport.title': 'Import / Export',
  'importExport.invalidJson': 'Ungültiges JSON-Format. Benötigt "name" und "levels".',
  'importExport.copy': 'Kopieren',
  'importExport.import': 'Importieren',
  'importExport.close': 'Schließen',

  // --- Player Manager ---
  'playerManager.count': 'Anzahl Spieler',
  'playerManager.playerN': 'Spieler {n}',

  // --- Payout Editor ---
  'payoutEditor.percent': '% Prozent',
  'payoutEditor.euro': '€ Euro',
  'payoutEditor.paidPlaces': 'Bezahlte Plätze',
  'payoutEditor.placeN': 'Platz {n}',
  'payoutEditor.addPlace': '+ Platz',
  'payoutEditor.removePlace': '− Platz',
  'payoutEditor.sum': 'Summe:',

  // --- Rebuy Editor ---
  'rebuyEditor.enabled': '✓ Rebuy aktiviert',
  'rebuyEditor.disabled': 'Rebuy deaktiviert',
  'rebuyEditor.cost': 'Kosten',
  'rebuyEditor.chips': 'Chips',
  'rebuyEditor.byLevels': 'Nach Levels',
  'rebuyEditor.byTime': 'Nach Zeit',
  'rebuyEditor.untilLevel': 'Rebuy bis Level',
  'rebuyEditor.timePeriod': 'Rebuy-Zeitraum',
  'rebuyEditor.hours': 'Std',
  'rebuyEditor.minutes': 'Min',

  // --- Rebuy Status ---
  'rebuyStatus.active': '♻ Rebuy aktiv',
  'rebuyStatus.untilLevel': 'bis Level {limit} (aktuell {current})',
  'rebuyStatus.timeRemaining': 'noch {time}',
  'rebuyStatus.ended': 'Rebuy beendet',

  // --- Bounty Editor ---
  'bountyEditor.enabled': 'Bounty aktiviert',
  'bountyEditor.disabled': 'Bounty deaktiviert',
  'bountyEditor.perKnockout': 'Bounty pro Knockout',
  'bountyEditor.description': 'Jeder Spieler hat ein Bounty auf seinem Kopf. Wer einen Spieler eliminiert, erhält dessen Bounty-Betrag.',

  // --- Tournament Finished ---
  'finished.congratulations': 'Herzlichen Glückwunsch',
  'finished.tournamentWinner': 'Turniersieger',
  'finished.results': 'Ergebnis',
  'finished.bounty': 'Bounty',
  'finished.bountyPoolTotal': 'Bounty-Pool gesamt',
  'finished.tournamentInfo': 'Turnier-Info',
  'finished.prizePool': 'Preisgeld',
  'finished.players': 'Spieler',
  'finished.rebuys': 'Rebuys',
  'finished.buyIn': 'Buy-In',
  'finished.bountyLabel': 'Bounty',
  'finished.paidPlaces': 'Bezahlte Plätze',
  'finished.paidIn': 'Eingezahlt',
  'finished.bountyPaid': 'Bounty gezahlt',
  'finished.bountyEarned': 'Bounty erhalten',
  'finished.balance': 'Bilanz',
  'finished.collapse': 'Einklappen',
  'finished.expand': 'Ausklappen',
  'finished.backToSetup': 'Zurück zum Setup',

  // --- Level Preview ---
  'levelPreview.title': 'Level-Übersicht',

  // --- Logic / Validation ---
  'logic.defaultBreakLabel': 'Pause',
  'logic.levelN': 'Level {n}',
  'logic.ante': 'Ante',
  'logic.durationMustBePositive': 'Level {n}: Dauer muss > 0 sein',
  'logic.blindsMustBeSet': 'Level {n}: SB und BB müssen gesetzt sein',
  'logic.bbMustBeGreaterThanSb': 'Level {n}: BB muss > SB sein',
  'logic.defaultPlayerName': 'Spieler {n}',
  'logic.minOnePayoutPlace': 'Mindestens ein Auszahlungsplatz erforderlich',
  'logic.maxPayoutPlaces': 'Maximal {max} Auszahlungsplätze möglich (Anzahl Spieler: {max})',
  'logic.valueMustNotBeNegative': 'Platz {place}: Wert darf nicht negativ sein',
  'logic.percentMustBe100': 'Prozente müssen 100% ergeben (aktuell: {sum}%)',

  // --- Units ---
  'unit.eur': 'EUR',
  'unit.chips': 'Chips',
} as const;

export type TranslationKey = keyof typeof de;

const en: Record<TranslationKey, string> = {
  // --- App ---
  'app.title': '♠ ♥ Pokern up de Hüh ♦ ♣',
  'app.startGame': '▶ Start Game',
  'app.setup': '⚙ Setup',
  'app.importExport': '↕ Import/Export',
  'app.tournamentName': 'Tournament Name',
  'app.tournamentNamePlaceholder': 'e.g. Friday Poker',
  'app.loadPreset': 'Load Preset',
  'app.players': 'Players',
  'app.buyInAndChips': 'Buy-In & Starting Chips',
  'app.buyIn': 'Buy-In',
  'app.startingChips': 'Starting Chips',
  'app.blindStructure': 'Blind Structure',
  'app.withAnte': '✓ with Ante',
  'app.withoutAnte': 'without Ante',
  'app.payout': 'Payout',
  'app.rebuy': 'Rebuy',
  'app.bounty': 'Bounty',
  'app.checkConfig': 'Check configuration:',
  'app.allReady': '✓ All set – tournament is ready to start',
  'app.startTournament': '▶ Start Tournament',
  'app.minPlayersRequired': 'At least 2 players required',
  'app.morePlacesThanPlayers': 'More payout places ({places}) than players ({players})',
  'app.backToSetup': '⚙ Back to Setup',
  'app.hidePlayers': 'Hide players',
  'app.showPlayers': 'Show players',
  'app.hideSidebar': 'Hide sidebar',
  'app.showSidebar': 'Show sidebar',
  'app.cancel': 'Cancel',

  // --- Confirm Dialogs ---
  'confirm.resetLevel.title': 'Reset level?',
  'confirm.resetLevel.message': 'The remaining time of the current level will be reset to its full duration.',
  'confirm.resetLevel.confirm': 'Reset Level',
  'confirm.restartTournament.title': 'Restart tournament?',
  'confirm.restartTournament.message': 'The entire tournament will be reset to Level 1. All progress will be lost.',
  'confirm.restartTournament.confirm': 'Restart Tournament',
  'confirm.exitTournament.title': 'End tournament?',
  'confirm.exitTournament.message': 'Returning to setup will end the running tournament and reset the timer.',
  'confirm.exitTournament.confirm': 'End Tournament',

  // --- Timer ---
  'timer.next': 'Next',
  'timer.break': 'Break',
  'timer.closeSlider': 'Close slider',
  'timer.adjustTime': 'Adjust time',
  'timer.running': 'Running',
  'timer.paused': 'Paused',
  'timer.finished': 'Finished',
  'timer.stopped': 'Stopped',
  'timer.ante': 'Ante',

  // --- Controls ---
  'controls.previous': '⏮ Back',
  'controls.previousTooltip': 'Previous Level (P)',
  'controls.startPauseTooltip': 'Start/Pause (Space)',
  'controls.pause': '⏸ Pause',
  'controls.end': '⏹ End',
  'controls.start': '▶ Start',
  'controls.next': 'Next ⏭',
  'controls.nextTooltip': 'Next Level (N)',
  'controls.levelReset': '↺ Level Reset',
  'controls.levelResetTooltip': 'Reset Level (R)',
  'controls.tournamentRestart': '⟲ Restart',
  'controls.tournamentRestartTooltip': 'Restart tournament',

  // --- Player Panel ---
  'playerPanel.prizePool': 'Prize Pool',
  'playerPanel.payout': 'Payout',
  'playerPanel.place': 'Place',
  'playerPanel.activePlayers': 'Active Players',
  'playerPanel.eliminate': 'Out',
  'playerPanel.eliminateTooltip': 'Player is eliminated',
  'playerPanel.whoEliminated': 'Who eliminated {name}?',
  'playerPanel.selectPlayer': '-- Select player --',
  'playerPanel.confirm': 'Confirm',
  'playerPanel.eliminated': 'Eliminated',
  'playerPanel.reinstateTooltip': 'Undo elimination',
  'playerPanel.reinstate': 'Undo',
  'playerPanel.by': 'by',

  // --- Config Editor ---
  'config.allLevels': 'All Levels:',
  'config.allBreaks': 'All Breaks:',
  'config.apply': 'Apply',
  'config.min': 'Min',
  'config.level': 'Level',
  'config.break': 'Break',
  'config.moveUp': 'Move up',
  'config.moveDown': 'Move down',
  'config.duplicate': 'Duplicate',
  'config.delete': 'Delete',
  'config.addLevel': '+ Level',
  'config.addBreak': '+ Break',
  'config.label': 'Label:',

  // --- Preset Picker ---
  'preset.turbo': 'Turbo',
  'preset.turboDesc': '6 min levels, fast-paced',
  'preset.standard': 'Standard',
  'preset.standardDesc': '15 min levels, classic',
  'preset.deep': 'Deep Stack',
  'preset.deepDesc': '20 min levels, deep play',

  // --- Settings ---
  'settings.title': 'Settings',
  'settings.sound': 'Sound',
  'settings.countdown': 'Countdown (last 10s)',
  'settings.autoAdvance': 'Auto-advance',
  'settings.largeDisplay': 'Large display',
  'settings.fullscreen': '⛶ Fullscreen',
  'settings.shortcuts': 'Keyboard Shortcuts',
  'settings.shortcutStartPause': 'Start/Pause',
  'settings.shortcutNext': 'Next',
  'settings.shortcutPrevious': 'Previous',
  'settings.shortcutReset': 'Reset',

  // --- Import/Export ---
  'importExport.title': 'Import / Export',
  'importExport.invalidJson': 'Invalid JSON format. Requires "name" and "levels".',
  'importExport.copy': 'Copy',
  'importExport.import': 'Import',
  'importExport.close': 'Close',

  // --- Player Manager ---
  'playerManager.count': 'Number of Players',
  'playerManager.playerN': 'Player {n}',

  // --- Payout Editor ---
  'payoutEditor.percent': '% Percent',
  'payoutEditor.euro': '€ Euro',
  'payoutEditor.paidPlaces': 'Paid Places',
  'payoutEditor.placeN': 'Place {n}',
  'payoutEditor.addPlace': '+ Place',
  'payoutEditor.removePlace': '− Place',
  'payoutEditor.sum': 'Total:',

  // --- Rebuy Editor ---
  'rebuyEditor.enabled': '✓ Rebuy enabled',
  'rebuyEditor.disabled': 'Rebuy disabled',
  'rebuyEditor.cost': 'Cost',
  'rebuyEditor.chips': 'Chips',
  'rebuyEditor.byLevels': 'By Levels',
  'rebuyEditor.byTime': 'By Time',
  'rebuyEditor.untilLevel': 'Rebuy until Level',
  'rebuyEditor.timePeriod': 'Rebuy Period',
  'rebuyEditor.hours': 'Hrs',
  'rebuyEditor.minutes': 'Min',

  // --- Rebuy Status ---
  'rebuyStatus.active': '♻ Rebuy active',
  'rebuyStatus.untilLevel': 'until Level {limit} (current {current})',
  'rebuyStatus.timeRemaining': '{time} remaining',
  'rebuyStatus.ended': 'Rebuy ended',

  // --- Bounty Editor ---
  'bountyEditor.enabled': 'Bounty enabled',
  'bountyEditor.disabled': 'Bounty disabled',
  'bountyEditor.perKnockout': 'Bounty per Knockout',
  'bountyEditor.description': 'Every player has a bounty on their head. Eliminating a player earns you their bounty.',

  // --- Tournament Finished ---
  'finished.congratulations': 'Congratulations',
  'finished.tournamentWinner': 'Tournament Winner',
  'finished.results': 'Results',
  'finished.bounty': 'Bounty',
  'finished.bountyPoolTotal': 'Total Bounty Pool',
  'finished.tournamentInfo': 'Tournament Info',
  'finished.prizePool': 'Prize Pool',
  'finished.players': 'Players',
  'finished.rebuys': 'Rebuys',
  'finished.buyIn': 'Buy-In',
  'finished.bountyLabel': 'Bounty',
  'finished.paidPlaces': 'Paid Places',
  'finished.paidIn': 'Paid in',
  'finished.bountyPaid': 'Bounty paid',
  'finished.bountyEarned': 'Bounty earned',
  'finished.balance': 'Balance',
  'finished.collapse': 'Collapse',
  'finished.expand': 'Expand',
  'finished.backToSetup': 'Back to Setup',

  // --- Level Preview ---
  'levelPreview.title': 'Level Overview',

  // --- Logic / Validation ---
  'logic.defaultBreakLabel': 'Break',
  'logic.levelN': 'Level {n}',
  'logic.ante': 'Ante',
  'logic.durationMustBePositive': 'Level {n}: Duration must be > 0',
  'logic.blindsMustBeSet': 'Level {n}: SB and BB must be set',
  'logic.bbMustBeGreaterThanSb': 'Level {n}: BB must be > SB',
  'logic.defaultPlayerName': 'Player {n}',
  'logic.minOnePayoutPlace': 'At least one payout place required',
  'logic.maxPayoutPlaces': 'Maximum {max} payout places allowed (players: {max})',
  'logic.valueMustNotBeNegative': 'Place {place}: Value must not be negative',
  'logic.percentMustBe100': 'Percentages must add up to 100% (currently: {sum}%)',

  // --- Units ---
  'unit.eur': 'EUR',
  'unit.chips': 'Chips',
};

export const translations: Record<Language, Record<TranslationKey, string>> = { de, en };

let currentLanguage: Language = 'de';

export function setCurrentLanguage(lang: Language) {
  currentLanguage = lang;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = translations[currentLanguage][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
