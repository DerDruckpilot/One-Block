# One Block – Gute Startaufgaben für Codex

Diese Datei enthält konkrete Aufgaben, die sich gut für Codex eignen.

## Aufgabe 1: Projekt verstehen

```text
Lies AGENTS.md und die Dateien im docs-Ordner. Fasse kurz zusammen, wie das Projekt aufgebaut ist und welche nächsten technischen Schritte sinnvoll sind. Ändere noch keinen Code.
```

## Aufgabe 2: Savegame einbauen

```text
Lies AGENTS.md und docs/architecture.md. Ergänze ein einfaches Savegame-System mit LocalStorage. Gespeichert werden sollen Spielerposition, platzierte Tiles und Ressourcen. Füge einen Reset-Button oder eine klare Reset-Funktion für die Entwicklung hinzu. Führe npm test aus.
```

## Aufgabe 3: Touch-Steuerung vorbereiten

```text
Ergänze eine einfache mobile Touch-Steuerung mit virtuellem Joystick links und Aktionsbutton rechts. Desktop-Steuerung soll erhalten bleiben. Halte die Umsetzung einfach und prüfe, dass npm test weiterhin läuft.
```

## Aufgabe 4: Drop-Tiers umsetzen

```text
Erweitere das Kristall-System so, dass Faust und Holzspitzhacke unterschiedliche Drop-Tabellen verwenden. Halte die Tabellen datengetrieben und einfach erweiterbar.
```

## Aufgabe 5: Platzierbare Objekte vorbereiten

```text
Lege eine einfache Datenstruktur für platzierbare Objekte an. Starte mit Werkbank, Lagerfeuer, Bett und Fackel. Noch keine komplexe Funktion, aber Platzierung und Rendering vorbereiten.
```

## Aufgabe 6: Weltkantenlogik verbessern

```text
Implementiere eine klare Hilfsfunktion, die prüft, ob ein Tile gültig/begehbar ist und ob eine Position über dem Void liegt. Dokumentiere im Code kurz, dass Tiere/Gegner später nicht freiwillig über Kanten laufen dürfen.
```
