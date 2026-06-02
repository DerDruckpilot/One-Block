# One Block – Animation, Bewegung und Gameplay-Regeln

Stand: 2026-06-02  
Status: verbindliche Gameplay-Ergänzung

## 1. Hintergrundsystem

Der Hintergrund besteht aus mehreren Ebenen.

```text
BackgroundSystem
├─ SkyGradient
├─ CloudLayerFar
├─ CloudLayerMid
└─ World / Tiles / Player / UI
```

### Himmel

Der Himmel wird per Code als Farbverlauf erzeugt.

Vorteile:

- kein großes Hintergrundbild nötig
- skaliert sauber
- Tageszeiten später einfach möglich
- performant

### Wolken

Wolken sind transparente Pixelart-PNGs oder später Sprite-Elemente.

Regeln:

- hinter der Welt
- nicht Teil der Tilemap
- langsame Bewegung
- mehrere Ebenen möglich

Empfohlene Startwerte:

| Ebene | Drift | Parallaxe |
|---|---:|---:|
| far clouds | 2 px/s | 0.05–0.10 |
| mid clouds | 5 px/s | 0.15–0.25 |
| world | Kamera | 1.00 |

## 2. Kristallanimation

Der Kristall wirkt lebendig, aber nicht überladen.

Startversion:

- Basis-Sprite
- leichte Idle-Animation
- sanfter Glow
- wenige Partikel
- Trefferimpuls

Mögliche spätere Zustände:

```text
inactive
active
energized
damaged
corrupted
overloaded
```

## 3. Charakterbewegung

Der Spieler bewegt sich in 8 Richtungen.

```text
up
down
left
right
up_left
up_right
down_left
down_right
```

Geschwindigkeiten:

| Modus | Bedeutung |
|---|---|
| Gehen | normale Bewegung |
| Rennen | schneller, per Shift oder später Run-Button |

Wichtig:

Diagonale Bewegung wird normalisiert. Der Spieler darf diagonal nicht schneller sein als geradeaus.

## 4. Idle-Zustände

Der Charakter kann später verschiedene Idle-Zustände erhalten.

```text
Idle_Normal
Idle_LowHealth
Idle_Critical
```

Start-MVP:

- Idle_Normal reicht

Später:

- LowHealth bei niedriger Gesundheit
- Critical bei sehr niedriger Gesundheit
- eventuell leichte Atem-/Erschöpfungsanimation

## 5. Tiere und Gegner

Tiere und Gegner bekommen einfache, klar lesbare Zustände.

### Tiere

Mögliche Zustände:

```text
idle
walk
eat
flee
follow_lasso
sleep
```

### Gegner

Mögliche Zustände:

```text
idle
patrol
chase
attack
hit
die
```

Start-MVP:

- noch keine vollständige Tier-/Gegnerlogik nötig
- Struktur im Code vorbereiten

## 6. Werkzeuge und Waffen

Werkzeuge und Waffen nutzen einfache Aktionsphasen.

```text
windup
active
recovery
```

Warum:

- besseres Treffergefühl
- klare Animationen
- später einfach balancierbar

Hand-Ankerpunkte werden später pro Richtung definiert, damit Werkzeuge sauber an der Figur sitzen.

## 7. Fernkampf

Steinschleuder und Bogen haben keine komplexe Ballistik.

Grundregel:

```text
Projektil fliegt gerade vom Spieler weg.
Über Distanz wird es nur optisch leicht nach unten versetzt.
```

Das ist einfacher, lesbarer und für das Spielgefühl ausreichend.

### Steinschleuder

| Wert | Entscheidung |
|---|---:|
| Reichweite | 2 Blöcke |
| Schaden | 1 |
| trifft fliegende Gegner | ja |

### Bogen

| Wert | Entscheidung |
|---|---:|
| Reichweite | 4 Blöcke |
| Schaden | 2 |
| trifft fliegende Gegner | ja |

Spätere Upgrades:

- stärkere Sehne
- Feuerpfeile
- bessere Munition
- mehr Reichweite
- mehr Schaden

## 8. Lasso

Das Lasso dient zum Fangen/Führen von Tieren.

Regeln:

- kein komplexes Zielen
- geeignetes Tier in Reichweite wird gewählt
- Tier hängt am Seil
- Spieler kann es in ein Gehege führen
- Seil kann reißen oder gelöst werden, falls nötig

Das Lasso ist kein Hauptkampfsystem.

## 9. Weltkante

Die Weltkante ist Sicherheitsgrenze und Risiko zugleich.

### Bodengebundene Tiere und Gegner

- laufen nicht freiwillig in den Void
- wählen keine Pfade über die Kante
- stoppen oder drehen um

### Knockback

Waffentreffer dürfen Gegner/Tiere zurückdrängen.

Wenn Knockback über die Kante führt:

- bodengebundene Kreatur fällt herunter
- Kreatur stirbt oder verschwindet
- Loot wird sicher platziert

### Loot-Regel

Loot erscheint:

- auf dem letzten gültigen Tile
- oder direkt an der Kante, wo die Kreatur gefallen ist

Loot darf nicht im Void verloren gehen.

## 10. Fliegende Gegner

Fliegende Gegner folgen anderen Regeln.

- können über den Void fliegen
- fallen nicht herunter
- sterben nicht durch Weltkanten
- können durch Treffer visuell zurückgestoßen werden
- bleiben aber im erlaubten Flugbereich

Maximaler Abstand:

```text
3 Blöcke vom nächsten bebauten/gültigen Tile
```

Wenn ein Fluggegner zu weit wegfliegen würde:

- kehrt er um
- bleibt stehen
- oder wählt eine Bewegung zurück zur Welt

## 11. Kleidung, Rüstung und Schuhe

Kleidung/Rüstung:

- als Outfit-Set
- als Overlay über dem Spieler
- wenige große Varianten statt vieler Einzelteile

Schuhe:

- separate Ausrüstungsebene
- später mit Bewegungseffekten möglich

Beispiele:

- schnellere Stiefel
- Flossen für Wasser
- Spezialschuhe für bestimmte Untergründe

## 12. Platzierbare Objekte

Platzierbare Objekte machen die Welt lebendig.

### Funktional

- Werkbank
- Lagerfeuer
- Herd
- Bett
- Kisten

### Dekorativ

- Tisch
- Stuhl
- Fackel
- kleine Dekoobjekte

Fackeln:

- nachts kleiner Lichtkreis
- am Tag normale Deko/Funktion

## 13. Entwicklungspriorität

Reihenfolge für erste Umsetzung:

1. Spielerbewegung
2. Kamera
3. Tilemap
4. Kristallinteraktion
5. Ressourceninventar
6. Blöcke platzieren
7. einfache Weltkantenlogik
8. erster Savegame-Prototyp
9. Touch-Steuerung
10. erste Tiere/Gegner
