# One Block – Technische Architektur

## 1. Grundidee

Die Startversion ist eine statische Browser-App mit Canvas-Rendering.  
Sie soll ohne Build-Schritt funktionieren und direkt über GitHub Pages laufen.

## 2. Laufzeit

```text
Browser
└─ index.html
   └─ src/main.js
      └─ Game Loop
         ├─ Input
         ├─ Update
         ├─ Render
         └─ UI
```

## 3. Ordnerlogik

| Ordner | Zweck |
|---|---|
| `src/config` | zentrale Werte und Konstanten |
| `src/core` | Spielkern: Loop, Input, Kamera |
| `src/world` | Tilemap, Weltregeln, Kantenlogik |
| `src/entities` | Spieler, Tiere, Gegner, Projektile |
| `src/systems` | Kristall, Ressourcen, Rendering, Hintergrund |
| `src/ui` | HUD, Menüs, Touch-UI später |
| `assets` | Grafiken und Daten |
| `docs` | Projektentscheidungen |

## 4. Wichtige technische Regeln

- Rendering und Spiellogik möglichst getrennt halten.
- Konstanten nicht im Code verstreuen.
- Neue Systeme klein und testbar halten.
- Daten nach Möglichkeit in JSON auslagern, wenn sie wachsen.
- Keine Engine-Struktur nachbauen, die aktuell nicht gebraucht wird.

## 5. Geplante Systeme

### Vorhanden als Startgerüst

- Canvas-Spielschleife
- Tastatursteuerung
- Kamera
- Tilemap
- Spieler
- Kristallinteraktion
- Ressourceninventar
- einfacher HUD
- PWA-Grundlage

### Als nächste Schritte sinnvoll

- Savegame in LocalStorage
- Touch-Steuerung
- Crafting-Grundsystem
- platzierbare Objekte
- echtes Asset-Laden statt Code-Platzhalter
- einfache Tiere/Gegner
- Projektilsystem

## 6. Mobile Ausrichtung

Desktop-Steuerung ist nur die erste Testschicht.  
Das Spiel muss langfristig mit Touch gut funktionieren.

Geplant:

- virtueller Joystick links
- Aktionsbuttons rechts
- große UI-Flächen
- keine kleinen Desktop-Menüs

## 7. GitHub Pages

Das Projekt wird ohne Build-Artefakte deployed.  
Der GitHub-Actions-Workflow lädt das Repository direkt als statische Seite hoch.
