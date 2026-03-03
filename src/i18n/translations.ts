export type Language = 'de' | 'en';

const de = {
  // --- App ---
  'app.title': '♠ ♥ Pokern up de Hüh ♦ ♣',
  'app.startGame': '▶ Spiel starten',
  'app.setup': '⚙ Setup',
  'app.tournamentName': 'Turnier-Name',
  'app.tournamentNamePlaceholder': 'z.B. Freitagspoker',
  'app.players': 'Spieler',
  'app.buyInAndChips': 'Buy-In & Startchips',
  'app.buyIn': 'Buy-In',
  'app.startingChips': 'Startchips',
  'app.blindStructure': 'Blind-Struktur',
  'app.withAnte': 'Ante deaktivieren',
  'app.withoutAnte': 'Ante aktivieren',
  'app.payout': 'Auszahlung',
  'app.rebuy': 'Rebuy',
  'app.addOn': 'Add-On',
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
  'app.chipBlindConflict': 'Achtung: Die Blindstruktur enthält Werte ({values}), die nicht mit den aktuellen Chip-Werten darstellbar sind.',
  'app.chipBlindConflictHint': 'Generiere die Blindstruktur neu, um sie an die Chip-Werte anzupassen.',

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
  'timer.next': 'Nächstes:',
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
  'playerPanel.avgStack': 'Ø Stack',
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
  'playerPanel.addOnAvailable': 'Add-On jetzt verfügbar! (einmalig pro Spieler)',
  'addOn.announcement': 'Add-On jetzt verfügbar!',
  'addOn.announcementDetail': '{cost} € → +{chips} Chips (einmalig pro Spieler)',

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

  // --- Settings ---
  'settings.title': 'Einstellungen',
  'settings.sound': 'Sound',
  'settings.countdown': 'Countdown (letzte 10s)',
  'settings.voice': 'Sprachansagen',
  'settings.autoAdvance': 'Automatisch weiter',
  'settings.largeDisplay': 'Große Anzeige',
  'settings.fullscreen': '⛶ Vollbild',
  'settings.shortcuts': 'Tastenkürzel',
  'settings.shortcutStartPause': 'Start/Pause',
  'settings.shortcutNext': 'Nächstes',
  'settings.shortcutPrevious': 'Vorheriges',
  'settings.shortcutReset': 'Reset',

  // --- Player Manager ---
  'playerManager.count': 'Anzahl Spieler',
  'playerManager.playerN': 'Spieler {n}',
  'playerManager.moveUp': 'Nach oben',
  'playerManager.moveDown': 'Nach unten',
  'playerManager.shuffle': 'Plätze & Dealer mischen',
  'playerManager.shuffleConfirm': 'Sitzreihenfolge zufällig mischen?',
  'playerManager.shuffleWarning': 'Die aktuelle Reihenfolge wird überschrieben und kann nicht rückgängig gemacht werden.',
  'playerManager.shuffleConfirmBtn': 'Jetzt mischen',
  'playerManager.setDealer': 'Als Dealer setzen',
  'playerManager.dealer': 'Dealer',
  'playerManager.seat': 'Platz {n}',

  // --- Payout Editor ---
  'payoutEditor.percent': '% Prozent',
  'payoutEditor.euro': '€ Euro',
  'payoutEditor.paidPlaces': 'Bezahlte Plätze',
  'payoutEditor.placeN': 'Platz {n}',
  'payoutEditor.addPlace': '+ Platz',
  'payoutEditor.removePlace': '− Platz',
  'payoutEditor.sum': 'Summe:',

  // --- Rebuy Editor ---
  'rebuyEditor.enabled': 'Rebuy deaktivieren',
  'rebuyEditor.disabled': 'Rebuy aktivieren',
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

  // --- Add-On Editor ---
  'addOnEditor.enabled': 'Add-On deaktivieren',
  'addOnEditor.disabled': 'Add-On aktivieren',
  'addOnEditor.cost': 'Kosten',
  'addOnEditor.chips': 'Chips',
  'addOnEditor.description': 'Jeder Spieler kann einmalig ein Add-On kaufen (zusätzliche Chips, unabhängig vom Bustout).',
  'addOnEditor.requiresRebuy': 'Add-On ist nur in Rebuy-Turnieren verfügbar. Soll Rebuy aktiviert werden?',
  'addOnEditor.enableRebuy': 'Rebuy aktivieren',

  // --- Bounty Editor ---
  'bountyEditor.enabled': 'Bounty deaktivieren',
  'bountyEditor.disabled': 'Bounty aktivieren',
  'bountyEditor.perKnockout': 'Bounty pro Knockout',
  'bountyEditor.description': 'Jeder Spieler hat ein Bounty auf seinem Kopf. Wer einen Spieler eliminiert, erhält dessen Bounty-Betrag.',

  // --- Chip Editor ---
  'app.chips': 'Chip-Werte',
  'chipEditor.enabled': 'Chip-Werte deaktivieren',
  'chipEditor.disabled': 'Chip-Werte aktivieren',
  'chipEditor.presets': 'Chip-Set wählen',
  'chipEditor.preset4': '4 Farben',
  'chipEditor.preset4Desc': 'Weiß, Rot, Grün, Schwarz',
  'chipEditor.preset5': '5 Farben',
  'chipEditor.preset5Desc': 'Weiß, Rot, Blau, Grün, Schwarz',
  'chipEditor.preset6': '6 Farben',
  'chipEditor.preset6Desc': 'Weiß, Rot, Blau, Grün, Schwarz, Lila',
  'chipEditor.value': 'Wert',
  'chipEditor.addDenomination': '+ Chip hinzufügen',
  'chipEditor.colorUpPreview': 'Color-Up Vorschau',
  'chipEditor.colorUpAtLevel': 'Level {level}: {chips} entfernen',
  'chipEditor.colorUpAtBreak': 'Pause nach Level {level}: {chips} entfernen',
  'chipEditor.noColorUps': 'Keine Color-Ups nötig',
  'chipEditor.description': 'Definiere die Chip-Farben und -Werte für das Turnier.',
  'chipEditor.duplicateColor': 'Achtung: Mehrere Chips mit gleicher Farbe!',
  'chipEditor.colorUpEnabled': 'Color-Up deaktivieren',
  'chipEditor.colorUpDisabled': 'Color-Up aktivieren',
  'chipEditor.colorUpSchedule': 'Color-Up Plan',
  'chipEditor.generateSuggestion': '↻ Vorschlag generieren',
  'chipEditor.addColorUp': '+ Color-Up hinzufügen',
  'chipEditor.removeEntry': 'Entfernen',
  'chipEditor.selectLevel': 'Level wählen',
  'chipEditor.selectChip': 'Chip wählen',
  'chipEditor.noSchedule': 'Kein Color-Up Plan. Klicke "Vorschlag generieren" um automatisch einen Plan zu erstellen.',
  'chipEditor.levelLabel': 'Level {n}',
  'chipEditor.breakLabel': 'Pause nach Lvl {n}',

  // --- Chip Sidebar (Game) ---
  'chipSidebar.title': 'Chips',
  'chipSidebar.nextColorUp': 'Nächstes Color-Up',
  'chipSidebar.atLevel': 'bei Level {level}',
  'chipSidebar.atBreak': 'Pause nach Level {level}',
  'chipSidebar.noMore': 'Keine weiteren Color-Ups',

  // --- Color-Up Banner ---
  'colorUp.banner': 'Color-Up (Chip Race): {chips} entfernen!',

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
  'finished.addOn': 'Add-On',
  'finished.addOns': 'Add-Ons',
  'finished.paidIn': 'Eingezahlt',
  'finished.bountyPaid': 'Bounty gezahlt',
  'finished.bountyEarned': 'Bounty erhalten',
  'finished.balance': 'Bilanz',
  'finished.collapse': 'Details ausblenden',
  'finished.expand': 'Details einblenden',
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

  // --- Blind Generator ---
  'blindGenerator.title': 'Blindstruktur generieren',
  'blindGenerator.fast': 'Schnell',
  'blindGenerator.normal': 'Normal',
  'blindGenerator.slow': 'Langsam',
  'blindGenerator.fastDesc': '6 Min/Level',
  'blindGenerator.normalDesc': '12 Min/Level',
  'blindGenerator.slowDesc': '20 Min/Level',
  'blindGenerator.estimated': 'Geschätzte Dauer',
  'blindGenerator.duration': 'ca. {h}h {m}min',
  'blindGenerator.levels': '{n} Level + {b} Pausen',
  'blindGenerator.preview': 'Vorschau',
  'blindGenerator.apply': 'Blindstruktur übernehmen',
  'blindGenerator.break': 'Pause',

  // --- Tournament Stats ---
  'stats.players': 'Spieler',
  'stats.prizePool': 'Preisgeld',
  'stats.avgStackBB': 'Ø Stack',
  'stats.elapsed': 'Spielzeit',
  'stats.remaining': 'Restzeit',

  // --- Bubble ---
  'bubble.bubble': 'BUBBLE!',
  'bubble.bubbleHint': 'Nächste Eliminierung erreicht die Geldränge',
  'bubble.inTheMoney': 'In The Money!',

  // --- Templates ---
  'app.templates': 'Vorlagen',
  'templates.title': 'Turnier-Vorlagen',
  'templates.saveCurrent': 'Aktuelle Konfiguration speichern',
  'templates.namePlaceholder': 'z.B. Freitagspoker-Standard',
  'templates.save': 'Speichern',
  'templates.noTemplates': 'Keine gespeicherten Vorlagen',
  'templates.load': 'Laden',
  'templates.delete': 'Löschen',
  'templates.yes': 'Ja',
  'templates.players': '{n} Spieler',
  'templates.levels': '{n} Level',
  'templates.close': 'Schließen',
  'templates.saveToFile': 'Als Datei speichern',
  'templates.loadFromFile': 'Aus Datei laden',
  'templates.invalidFile': 'Ungültige Vorlagendatei.',
  'templates.browserTemplates': 'Browser-Vorlagen',
  'templates.jsonSection': 'JSON Import / Export',
  'templates.jsonCopy': 'Kopieren',
  'templates.jsonImport': 'Importieren',
  'templates.jsonInvalid': 'Ungültiges JSON-Format.',
  'templates.saveHint': 'Tipp: In Safari → Einstellungen → Allgemein → Download-Ort auf „Nachfragen" stellen, um den Speicherort zu wählen.',

  // --- Clean View ---
  'game.cleanViewOn': 'Details einblenden',
  'game.cleanViewOff': 'Details ausblenden',

  // --- Screenshot/Share ---
  'finished.shareResults': 'Ergebnis teilen / Screenshot',
  'finished.capturing': 'Wird erstellt...',
  'finished.shareTitle': 'Turnier-Ergebnis',

  // --- Section Summaries ---
  'app.tournamentFormat': 'Rebuy / Add-On / Bounty',
  'section.chipsDisabled': 'Deaktiviert',
  'section.colorUpActive': 'Color-Up aktiv',
  'section.payoutSummary': '{places} Plätze, {mode}',
  'section.allDisabled': 'Alles deaktiviert',

  // --- Setup UX ---
  'app.tournamentBasics': 'Turnier-Grundlagen',
  'config.levelTable': 'Level-Tabelle',
  'config.summary': '{levels} Levels, {breaks} Pausen, Ø {min} Min',
  'section.playerCount': '{n} Spieler',

  // --- Checkpoint ---
  'checkpoint.found': 'Laufendes Turnier gefunden',
  'checkpoint.details': '„{name}" — gespeichert am {date}',
  'checkpoint.restore': 'Turnier fortsetzen',
  'checkpoint.dismiss': 'Verwerfen',

  // --- Theme ---
  'theme.system': 'System',
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',

  // --- Units ---
  'unit.eur': 'EUR',
  'unit.chips': 'Chips',

  // --- Voice Announcements ---
  'voice.levelChange': 'Level {level} — Blinds {sb} / {bb}',
  'voice.levelChangeWithAnte': 'Level {level} — Blinds {sb} / {bb} — Ante {ante}',
  'voice.breakStart': 'Pause — {minutes} Minuten',
  'voice.breakWarning': 'Noch 30 Sekunden Pause',
  'voice.bubble': 'Wir sind auf der Bubble!',
  'voice.inTheMoney': 'In The Money! Herzlichen Glückwunsch!',
  'voice.playerEliminated': '{name} ausgeschieden auf Platz {place}',
  'voice.tournamentWinner': '{name} gewinnt das Turnier!',
  'voice.addOnAvailable': 'Add-On jetzt verfügbar!',
  'voice.rebuyEnded': 'Die Rebuy-Phase ist beendet',
  'voice.colorUp': 'Color-Up: {chips} Chips werden eingetauscht',
} as const;

export type TranslationKey = keyof typeof de;

const en: Record<TranslationKey, string> = {
  // --- App ---
  'app.title': '♠ ♥ Pokern up de Hüh ♦ ♣',
  'app.startGame': '▶ Start Game',
  'app.setup': '⚙ Setup',
  'app.tournamentName': 'Tournament Name',
  'app.tournamentNamePlaceholder': 'e.g. Friday Poker',
  'app.players': 'Players',
  'app.buyInAndChips': 'Buy-In & Starting Chips',
  'app.buyIn': 'Buy-In',
  'app.startingChips': 'Starting Chips',
  'app.blindStructure': 'Blind Structure',
  'app.withAnte': 'Disable Ante',
  'app.withoutAnte': 'Enable Ante',
  'app.payout': 'Payout',
  'app.rebuy': 'Rebuy',
  'app.addOn': 'Add-On',
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
  'app.chipBlindConflict': 'Warning: The blind structure contains values ({values}) that cannot be represented with the current chip denominations.',
  'app.chipBlindConflictHint': 'Regenerate the blind structure to match the chip values.',

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
  'timer.next': 'Next:',
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
  'playerPanel.avgStack': 'Avg Stack',
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
  'playerPanel.addOnAvailable': 'Add-On now available! (once per player)',
  'addOn.announcement': 'Add-On now available!',
  'addOn.announcementDetail': '{cost} € → +{chips} Chips (once per player)',

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

  // --- Settings ---
  'settings.title': 'Settings',
  'settings.sound': 'Sound',
  'settings.countdown': 'Countdown (last 10s)',
  'settings.voice': 'Voice Announcements',
  'settings.autoAdvance': 'Auto-advance',
  'settings.largeDisplay': 'Large display',
  'settings.fullscreen': '⛶ Fullscreen',
  'settings.shortcuts': 'Keyboard Shortcuts',
  'settings.shortcutStartPause': 'Start/Pause',
  'settings.shortcutNext': 'Next',
  'settings.shortcutPrevious': 'Previous',
  'settings.shortcutReset': 'Reset',

  // --- Player Manager ---
  'playerManager.count': 'Number of Players',
  'playerManager.playerN': 'Player {n}',
  'playerManager.moveUp': 'Move up',
  'playerManager.moveDown': 'Move down',
  'playerManager.shuffle': 'Shuffle Seats & Dealer',
  'playerManager.shuffleConfirm': 'Randomly shuffle seating order?',
  'playerManager.shuffleWarning': 'The current order will be overwritten and cannot be undone.',
  'playerManager.shuffleConfirmBtn': 'Shuffle now',
  'playerManager.setDealer': 'Set as Dealer',
  'playerManager.dealer': 'Dealer',
  'playerManager.seat': 'Seat {n}',

  // --- Payout Editor ---
  'payoutEditor.percent': '% Percent',
  'payoutEditor.euro': '€ Euro',
  'payoutEditor.paidPlaces': 'Paid Places',
  'payoutEditor.placeN': 'Place {n}',
  'payoutEditor.addPlace': '+ Place',
  'payoutEditor.removePlace': '− Place',
  'payoutEditor.sum': 'Total:',

  // --- Rebuy Editor ---
  'rebuyEditor.enabled': 'Disable Rebuy',
  'rebuyEditor.disabled': 'Enable Rebuy',
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

  // --- Add-On Editor ---
  'addOnEditor.enabled': 'Disable Add-On',
  'addOnEditor.disabled': 'Enable Add-On',
  'addOnEditor.cost': 'Cost',
  'addOnEditor.chips': 'Chips',
  'addOnEditor.description': 'Each player can purchase one add-on (extra chips, regardless of bustout).',
  'addOnEditor.requiresRebuy': 'Add-On is only available in rebuy tournaments. Enable Rebuy?',
  'addOnEditor.enableRebuy': 'Enable Rebuy',

  // --- Bounty Editor ---
  'bountyEditor.enabled': 'Disable Bounty',
  'bountyEditor.disabled': 'Enable Bounty',
  'bountyEditor.perKnockout': 'Bounty per Knockout',
  'bountyEditor.description': 'Every player has a bounty on their head. Eliminating a player earns you their bounty.',

  // --- Chip Editor ---
  'app.chips': 'Chip Values',
  'chipEditor.enabled': 'Disable Chip Values',
  'chipEditor.disabled': 'Enable Chip Values',
  'chipEditor.presets': 'Choose chip set',
  'chipEditor.preset4': '4 Colors',
  'chipEditor.preset4Desc': 'White, Red, Green, Black',
  'chipEditor.preset5': '5 Colors',
  'chipEditor.preset5Desc': 'White, Red, Blue, Green, Black',
  'chipEditor.preset6': '6 Colors',
  'chipEditor.preset6Desc': 'White, Red, Blue, Green, Black, Purple',
  'chipEditor.value': 'Value',
  'chipEditor.addDenomination': '+ Add chip',
  'chipEditor.colorUpPreview': 'Color-Up Preview',
  'chipEditor.colorUpAtLevel': 'Level {level}: remove {chips}',
  'chipEditor.colorUpAtBreak': 'Break after Level {level}: remove {chips}',
  'chipEditor.noColorUps': 'No color-ups needed',
  'chipEditor.description': 'Define the chip colors and values for the tournament.',
  'chipEditor.duplicateColor': 'Warning: Multiple chips with the same color!',
  'chipEditor.colorUpEnabled': 'Disable Color-Up',
  'chipEditor.colorUpDisabled': 'Enable Color-Up',
  'chipEditor.colorUpSchedule': 'Color-Up Schedule',
  'chipEditor.generateSuggestion': '↻ Generate Suggestion',
  'chipEditor.addColorUp': '+ Add Color-Up',
  'chipEditor.removeEntry': 'Remove',
  'chipEditor.selectLevel': 'Select level',
  'chipEditor.selectChip': 'Select chip',
  'chipEditor.noSchedule': 'No color-up schedule. Click "Generate Suggestion" to auto-create a plan.',
  'chipEditor.levelLabel': 'Level {n}',
  'chipEditor.breakLabel': 'Break after Lvl {n}',

  // --- Chip Sidebar (Game) ---
  'chipSidebar.title': 'Chips',
  'chipSidebar.nextColorUp': 'Next Color-Up',
  'chipSidebar.atLevel': 'at Level {level}',
  'chipSidebar.atBreak': 'break after Level {level}',
  'chipSidebar.noMore': 'No more color-ups',

  // --- Color-Up Banner ---
  'colorUp.banner': 'Color-Up (Chip Race): Remove {chips}!',

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
  'finished.addOn': 'Add-On',
  'finished.addOns': 'Add-Ons',
  'finished.paidIn': 'Paid in',
  'finished.bountyPaid': 'Bounty paid',
  'finished.bountyEarned': 'Bounty earned',
  'finished.balance': 'Balance',
  'finished.collapse': 'Hide details',
  'finished.expand': 'Show details',
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

  // --- Blind Generator ---
  'blindGenerator.title': 'Generate Blind Structure',
  'blindGenerator.fast': 'Fast',
  'blindGenerator.normal': 'Normal',
  'blindGenerator.slow': 'Slow',
  'blindGenerator.fastDesc': '6 min/level',
  'blindGenerator.normalDesc': '12 min/level',
  'blindGenerator.slowDesc': '20 min/level',
  'blindGenerator.estimated': 'Estimated Duration',
  'blindGenerator.duration': '~{h}h {m}min',
  'blindGenerator.levels': '{n} levels + {b} breaks',
  'blindGenerator.preview': 'Preview',
  'blindGenerator.apply': 'Apply Blind Structure',
  'blindGenerator.break': 'Break',

  // --- Tournament Stats ---
  'stats.players': 'Players',
  'stats.prizePool': 'Prize Pool',
  'stats.avgStackBB': 'Avg Stack',
  'stats.elapsed': 'Elapsed',
  'stats.remaining': 'Remaining',

  // --- Bubble ---
  'bubble.bubble': 'BUBBLE!',
  'bubble.bubbleHint': 'Next elimination reaches the money',
  'bubble.inTheMoney': 'In The Money!',

  // --- Templates ---
  'app.templates': 'Templates',
  'templates.title': 'Tournament Templates',
  'templates.saveCurrent': 'Save current configuration',
  'templates.namePlaceholder': 'e.g. Friday Poker Standard',
  'templates.save': 'Save',
  'templates.noTemplates': 'No saved templates',
  'templates.load': 'Load',
  'templates.delete': 'Delete',
  'templates.yes': 'Yes',
  'templates.players': '{n} players',
  'templates.levels': '{n} levels',
  'templates.close': 'Close',
  'templates.saveToFile': 'Save as File',
  'templates.loadFromFile': 'Load from File',
  'templates.invalidFile': 'Invalid template file.',
  'templates.browserTemplates': 'Browser Templates',
  'templates.jsonSection': 'JSON Import / Export',
  'templates.jsonCopy': 'Copy',
  'templates.jsonImport': 'Import',
  'templates.jsonInvalid': 'Invalid JSON format.',
  'templates.saveHint': 'Tip: In Safari → Settings → General, set download location to "Ask for each download" to choose where to save.',

  // --- Clean View ---
  'game.cleanViewOn': 'Show details',
  'game.cleanViewOff': 'Hide details',

  // --- Screenshot/Share ---
  'finished.shareResults': 'Share Results / Screenshot',
  'finished.capturing': 'Capturing...',
  'finished.shareTitle': 'Tournament Results',

  // --- Section Summaries ---
  'app.tournamentFormat': 'Rebuy / Add-On / Bounty',
  'section.chipsDisabled': 'Disabled',
  'section.colorUpActive': 'Color-Up active',
  'section.payoutSummary': '{places} places, {mode}',
  'section.allDisabled': 'All disabled',

  // --- Setup UX ---
  'app.tournamentBasics': 'Tournament Basics',
  'config.levelTable': 'Level Table',
  'config.summary': '{levels} Levels, {breaks} Breaks, avg {min} Min',
  'section.playerCount': '{n} Players',

  // --- Checkpoint ---
  'checkpoint.found': 'Running tournament found',
  'checkpoint.details': '"{name}" — saved at {date}',
  'checkpoint.restore': 'Resume tournament',
  'checkpoint.dismiss': 'Dismiss',

  // --- Theme ---
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  // --- Units ---
  'unit.eur': 'EUR',
  'unit.chips': 'Chips',

  // --- Voice Announcements ---
  'voice.levelChange': 'Level {level} — Blinds {sb} / {bb}',
  'voice.levelChangeWithAnte': 'Level {level} — Blinds {sb} / {bb} — Ante {ante}',
  'voice.breakStart': 'Break — {minutes} minutes',
  'voice.breakWarning': '30 seconds remaining in break',
  'voice.bubble': 'We are on the bubble!',
  'voice.inTheMoney': 'In the money! Congratulations!',
  'voice.playerEliminated': '{name} eliminated in place {place}',
  'voice.tournamentWinner': '{name} wins the tournament!',
  'voice.addOnAvailable': 'Add-on now available!',
  'voice.rebuyEnded': 'The rebuy phase has ended',
  'voice.colorUp': 'Color-up: exchange {chips} chips',
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
