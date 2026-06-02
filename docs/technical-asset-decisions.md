# One Block – Technische und Asset-Entscheidungen

Stand: 2026-06-02  
Status: verbindliche technische Grundlage

## 1. Plattform

One Block wird als statische Web-App/PWA entwickelt.

Primärziel:

- iPhone
- iPad
- Mobile Safari
- iOS Home-Screen-Web-App

Sekundärziel:

- Desktop-Browser

Regeln:

- kein Server nötig
- Hosting über GitHub Pages
- offline-fähige Struktur vorbereiten
- keine externen Runtime-Abhängigkeiten für den Spielstart
- Touch-Bedienung später fest einplanen

## 2. Technischer Startstandard

Starttechnik:

- HTML
- CSS
- JavaScript-Module
- Canvas 2D
- PWA-Manifest
- Service Worker

Bewusst noch nicht verwenden:

- große Game Engine
- komplexes Build-System
- TypeScript-Zwang
- externe Asset-CDNs
- unnötige Frameworks

Diese Entscheidung hält das Projekt für Codex, GitHub Pages und mobile Browser einfach.

## 3. Grafikstil

- 2D Top-Down Pixelart
- freundlich und farbstark
- klare Silhouetten
- gute Lesbarkeit auf kleinen Displays
- sichtbares Pixelraster
- keine weichgezeichneten Assets
- keine fotorealistischen Spielgrafiken

Wichtig:

Spielassets werden nicht einfach aus großen Bildern beliebig verkleinert. Finale Runtime-Assets müssen exakt im geplanten Pixelraster liegen.

## 4. Dateiformate

### Standard

| Format | Verwendung |
|---|---|
| PNG | Tiles, Sprites, UI, Icons, Effekte |
| JSON | Sprite-Metadaten, Animationen, Daten |
| MD | Dokumentation |

### Optional

| Format | Verwendung |
|---|---|
| WebP | große Hintergrundbilder, falls später nötig |
| SVG | einfache nicht-pixelige UI-Symbole, falls sinnvoll |
| Aseprite/Krita/PSD | Quelldateien, nicht Runtime |

### Nicht für Spielgrafiken

- JPEG

JPEG ist für Pixelart, Transparenz, Sprites und UI ungeeignet.

## 5. Pixelgrößen

### Welt-Tiles

```text
1 Weltblock = 32 x 32 Pixel
```

Verwendung:

- Erde
- Gras
- Lehm
- Stein
- Sand
- Wasser
- Acker
- Waldfläche
- Gebäudeböden

### Spieler

```text
Spieler-Ingame-Sprite = 48 x 48 Pixel pro Frame
```

Regeln:

- echtes 48x48-Canvas
- transparenter Hintergrund
- Figur vollständig innerhalb des Rahmens
- kleiner transparenter Rand erlaubt
- große Konzeptbilder sind nur Menü-/Portraitbilder

### Tiere und Gegner

| Typ | Empfohlene Framegröße |
|---|---:|
| kleine Tiere | 32x32 px |
| mittelgroße Tiere/Gegner | 48x48 px |
| große Tiere | 64x64 px |
| Bosse | 64x64 bis 96x96 px |

## 6. Charakterdesign

Aktuelles Spielerdesign:

- junger freundlicher Abenteurer
- mittelbraunes, etwas unordentliches Haar
- warme/tanfarbene Haut
- große braune Augen
- kaputte helle Leinenbekleidung
- einfache braune Handgelenkwickel
- barfuß
- keine Schärpe
- kein Beutel

Nutzung:

- 48x48-Sprite in der Welt
- größere Darstellung im Charaktermenü möglich

## 7. Bewegungsrichtungen

Bewegliche Figuren verwenden 8 Richtungen:

```text
down
down_right
right
up_right
up
up_left
left
down_left
```

Betroffen:

- Spieler
- Tiere
- Gegner
- spätere NPCs

Nicht betroffen:

- Terrain
- einfache Pflanzen
- Gebäudeobjekte
- UI

## 8. Animationen

Startumfang Spieler:

| Animation | Frames pro Richtung |
|---|---:|
| idle | 1–4 |
| walk | 4 |
| run | 6 |
| use/tool | später nach Bedarf |
| attack | später nach Bedarf |

Tiere/Gegner starten einfacher und werden nur erweitert, wenn es spielerisch nötig ist.

## 9. Sprite-Sheets

Bevorzugt werden Sprite-Sheets statt vieler Einzelbilder.

Beispiel:

```text
assets/sprites/player/player_base.png
assets/sprites/player/player_base.json
```

Metadaten beschreiben:

- Framegröße
- Animationen
- Richtungen
- FPS
- Hitbox/Ankerpunkte später möglich

## 10. Terrain und Autotiles

Start-MVP:

- einfache 32x32-Tiles reichen
- keine vollständigen Autotiles nötig

Später:

- Kantenvarianten
- Ecken
- Übergänge
- Wasser-/Uferlogik

Grundregel:

Die Welt muss auch ohne finalen Autotile-Satz spielbar bleiben.

## 11. Hintergrund

Himmel:

- per Code als Farbverlauf
- kein großes PNG nötig
- später leicht für Tageszeiten anpassbar

Wolken:

- separate transparente Pixelart-PNGs
- mehrere Ebenen
- langsamer Drift
- leichter Parallaxeeffekt

## 12. Rendering

CSS/Canvas-Regeln:

```css
image-rendering: pixelated;
image-rendering: crisp-edges;
```

Grundsätze:

- interne Spielauflösung sauber halten
- Pixelart nicht weichzeichnen
- Kamera und Skalierung kontrolliert umsetzen
- UI auf Touchflächen auslegen

## 13. PWA-Dateien

Mindestdateien:

```text
index.html
manifest.webmanifest
service-worker.js
assets/ui/icon-192.png
assets/ui/icon-512.png
```

Zusätzlich sinnvoll:

```text
.nojekyll
.github/workflows/pages.yml
```

## 14. Repository-Struktur

```text
One-Block/
├─ AGENTS.md
├─ README.md
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ package.json
├─ docs/
│  ├─ game-design.md
│  ├─ technical-asset-decisions.md
│  ├─ animation-gameplay-guide.md
│  ├─ architecture.md
│  ├─ roadmap.md
│  └─ codex-task-brief.md
├─ src/
│  ├─ main.js
│  ├─ config/
│  ├─ core/
│  ├─ world/
│  ├─ entities/
│  ├─ systems/
│  └─ ui/
├─ assets/
│  ├─ sprites/
│  ├─ tiles/
│  ├─ backgrounds/
│  └─ ui/
├─ scripts/
└─ .github/workflows/
```

## 15. Namenskonventionen

- Dateinamen klein schreiben.
- Wörter mit Bindestrich trennen.
- Keine Leerzeichen in Dateinamen.
- Klare, beschreibende Namen verwenden.

Beispiele:

```text
player-base.png
earth-tile.png
crystal-idle.png
wood-pickaxe-icon.png
```

Animationen:

```text
player_walk_down_00
player_walk_down_01
player_walk_down_02
player_walk_down_03
```

## 16. Asset-Workflow

1. Konzeptbild erstellen.
2. Daraus echtes Pixelart-Asset im Zielraster bauen.
3. Transparenz prüfen.
4. Pixelraster prüfen.
5. In passenden Asset-Ordner legen.
6. Metadaten als JSON ergänzen, wenn es ein Sprite-Sheet ist.
7. Im Spiel testen.

## 17. Priorisierte Asset-Pakete

### Paket 1: Spieler

- Base-Sprite 48x48
- Idle/Walk in 8 Richtungen
- einfache Run-Animation
- Kleidung/Outfit-Overlay später
- Schuhe separat später

### Paket 2: Start-Terrain

- Erde
- Gras
- Lehm
- Stein
- Wasser
- Acker

### Paket 3: Kristall

- Basis-Sprite
- Idle-Animation
- Glow/Partikel
- Trefferfeedback

### Paket 4: Startobjekte

- Werkbank
- Lagerfeuer
- Bett
- Fackel
- einfache Kiste

### Paket 5: UI

- Inventar-Slots
- Tool-/Waffenicons
- Ressourcensymbole
- Touchbuttons später

## 18. Aktueller verbindlicher Standard

| Bereich | Entscheidung |
|---|---|
| Zielplattform | Web-App/PWA |
| Hosting | GitHub Pages |
| Rendering | Canvas 2D |
| Welt-Tile | 32x32 px |
| Spieler | 48x48 px |
| Spielgrafiken | PNG |
| Metadaten | JSON |
| Stil | freundliche 2D-Pixelart |
| Steuerung Start | Tastatur, später Touch |
| Codebasis | Vanilla JS, modular |
