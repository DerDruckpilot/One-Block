# One Block – Game Design

Stand: 2026-06-02  
Status: verbindliche Konzeptgrundlage

## 1. Kurzbeschreibung

**One Block** ist ein freundliches 2D-Top-Down-Survival-Adventure.  
Der Spieler startet ohne Ausrüstung auf einer winzigen 3x3-Insel im Himmel. In der Mitte steht ein lila leuchtender magischer Kristall. Aus diesem Kristall entstehen Rohstoffe, Tiere, Gegner und langfristig die ganze Welt.

Der Spieler erweitert seine Insel Block für Block, baut Produktionsflächen, craftet Werkzeuge, zähmt Tiere, kämpft gegen Gegner und entwickelt aus fast nichts eine lebendige kleine Welt.

## 2. Designvision

Das Spiel überträgt das motivierende One-Block-Prinzip in ein eigenständiges 2D-Spiel.

Kernfantasie:

> Aus einem kleinen Kristall entsteht durch eigenes Handeln eine lebendige Welt.

Spielgefühl:

- freundlich
- verständlich
- kompakt
- belohnend
- kreativ
- nicht düster oder brutal

Optische Richtung:

- 2D Top-Down
- klare Pixelart
- helle Himmelswelt
- warme Farben
- gute Lesbarkeit auf kleinen Displays

Wichtige Abgrenzung:

Es dürfen keine Assets, Figuren, UI-Elemente, Musikstücke oder Logos aus Zelda, Nintendo oder anderen Marken übernommen werden. Die Inspiration betrifft nur allgemeine Stilmittel wie Top-Down-Perspektive, charmante Pixelart und klare Lesbarkeit.

## 3. Startzustand

Der Spieler startet auf einer 3x3-Fläche aus Erdblöcken.

```text
[ Erde ][ Erde   ][ Erde ]
[ Erde ][Kristall][ Erde ]
[ Erde ][ Erde   ][ Erde ]
```

Startausrüstung:

- keine Kleidung/Rüstung außer einfacher kaputter Leinenkleidung
- kein Werkzeug
- keine Waffe
- keine Werkbank
- keine Nahrungsvorräte

Startfähigkeiten:

- bewegen
- aufheben
- Faustschlag
- einfache Interaktion
- Erdblöcke platzieren, sobald Erde im Inventar vorhanden ist

## 4. Der Kristall

Der Kristall ist das Zentrum des Spiels. Er ist unzerstörbar, regenerativ und reagiert auf verschiedene Interaktionen.

### 4.1 Grundregel

| Aktion am Kristall | Ergebnis |
|---|---|
| Faust | einfache Rohstoffe |
| Spitzhacke | Rohstoffe gemäß Werkzeugstufe |
| Waffe | Tiere, Gegner oder Begegnungen |
| passive Werkzeuge | keine Rohstoffe, höchstens visuelles Feedback |

Merksatz:

```text
Faust oder Spitzhacke = Rohstoffe
Waffe = Begegnungen
```

### 4.2 Optik und Feedback

Der Kristall soll lebendig wirken:

- lila leuchtend
- leicht pulsierend
- sanfte Partikel
- kurzer Lichtimpuls bei Treffern
- stärkerer Glow bei Nacht
- besonderes Feedback bei seltenen Drops oder Ereignissen

### 4.3 Kristall-Drops

| Stufe | Voraussetzung | Mögliche Drops |
|---|---|---|
| Tier 0 | Faust | Erde, Rohholz, Äste, Fasern, Gras-, Baum-, Beeren-, Pilz- und Feldsamen, Beeren, Pilze |
| Tier 1 | Holzspitzhacke | Stein, Feuerstein, Lehm, Tonklumpen, bessere Samen, selten Quelltropfen |
| Tier 2 | Steinspitzhacke | Kohle, Kupfererz, Sand, Kies, Knochenfragmente, erste technische Rohstoffe |
| Tier 3+ | Metallspitzhacke | Eisen, Kristallsplitter, Biom-Materialien, magische Komponenten |

Zufallspech soll begrenzt werden. Wichtige Drops müssen nach genug Interaktionen garantiert erscheinen können.

## 5. Frühe Progression

Erste Spielkette:

```text
Faust am Kristall
→ Erde, Rohholz, Fasern, Samen
→ Insel erweitern
→ Samen pflanzen
→ Holz sammeln
→ Werkbank bauen
→ primitive Werkzeuge herstellen
→ Holzspitzhacke nutzen
→ Stein und Lehm gewinnen
→ Wasser/Farming freischalten
```

### 5.1 Primitive Werkzeuge

| Werkzeug | Funktion |
|---|---|
| Holzspitzhacke | Tier-1-Drops am Kristall |
| Axt | Bäume effizient fällen |
| Sense | Gras und Fasern abernten |
| Schaufel | Blöcke entfernen/abreißen |
| Hacke | Acker vorbereiten |
| Hammer | spätere Gebäude-/Reparaturfunktionen |

### 5.2 Primitive Waffen

| Waffe | Rolle |
|---|---|
| Speer | erste Nahkampf-/Jagdwaffe |
| Steinschleuder | einfache Distanzwaffe für kleine und fliegende Ziele |
| Bogen | stärkere Distanzwaffe |
| magische Waffen | spätere Begegnungen, Events, Mini-Bosse |

## 6. Boden, Samen und Wachstum

Erde ist die Basis der Welt. Samen verändern die Funktion eines Erdblocks.

| Samen | Ergebnisfläche | Funktion |
|---|---|---|
| Grassamen | Grasfläche | Gras, Pflanzenfasern, Futter |
| Baumsamen | Waldfläche | Baumwachstum und Holz |
| Beerensamen | Buschfläche | Beeren als Nahrung |
| Pilzsporen | Pilzfläche | Pilze als Nahrung/Zutat |
| Feldsamen | Ackerfläche | Gemüse/Getreide/Nahrung |
| Blumensamen | Blumenwiese | Deko, Alchemie, Insekten/Bienen später möglich |

Grundregel:

- Produktionsfläche bleibt erhalten.
- Nur das gewachsene Objekt wird geerntet.
- Wachstum läuft über Zeit/Zyklen.

## 7. Wasser, Lehm und Ton

Der **Quelltropfen** ist ein seltener magischer Drop und schaltet Wasser frei.

Mögliche Nutzung:

| Anwendung | Ergebnis |
|---|---|
| Quelltropfen auf Erde | nasser Boden oder Ackerbonus |
| Quelltropfen auf Lehm | Wasserquelle |
| Lehm + Brennen | Ziegel/Tonprodukte |

Wasser ist ein wichtiger Progressionsschritt für Farming, Tiere und spätere Systeme.

## 8. Tiere, Gegner und Begegnungen

Begegnungen entstehen, wenn der Spieler den Kristall mit einer Waffe trifft.

### 8.1 Begegnungstypen

- friedliche Tiere
- wilde Tiere
- einfache Gegner
- fliegende Gegner
- besondere Ereignisse
- spätere Mini-Bosse

### 8.2 Friedliche Tiere

Beispiele:

- Huhn
- Kaninchen
- Schaf
- Ziege
- Kuh

Tiere können später Produkte liefern, etwa Eier, Milch, Wolle oder Futterkreisläufe.

### 8.3 Lasso und Zähmen

Das Lasso ist für Tiere gedacht, nicht als komplexe Kampfwaffe.

Grundregel:

- kein freies Zielen nötig
- nächstes geeignetes Tier in Reichweite wird erfasst
- Tier folgt am Seil
- Tier kann in Gehege geführt werden

## 9. Kampf und Fernkampf

Kampf bleibt bewusst einfach.

### 9.1 Steinschleuder

- Reichweite: 2 Blöcke
- Schaden: 1
- trifft auch fliegende Gegner
- gerade Flugbahn
- nur optische Absenkung über Distanz

### 9.2 Bogen

- Reichweite: 4 Blöcke
- Schaden: 2
- trifft auch fliegende Gegner
- gerade Flugbahn
- nur optische Absenkung über Distanz

Spätere Upgrades:

- stärkere Sehne
- bessere Pfeile
- Feuerpfeile
- mehr Reichweite
- mehr Schaden

## 10. Weltkante und Void

Die Insel schwebt im Himmel. Der Rand der Welt ist spielmechanisch wichtig.

### 10.1 Bodengebundene Tiere und Gegner

- laufen nicht freiwillig über die Kante
- erkennen Weltkante als Grenze
- können durch Knockback über die Kante gestoßen werden
- sterben dann im Void

### 10.2 Loot-Regel

Wenn ein bodengebundener Gegner oder ein Tier durch Knockback herunterfällt:

- Loot geht nicht verloren
- Loot erscheint auf dem letzten gültigen Tile oder direkt an der Kante

### 10.3 Fliegende Gegner

- können über den Void fliegen
- fallen nicht herunter
- sterben nicht durch Weltkanten
- dürfen sich maximal 3 Blöcke vom nächsten bebauten Tile entfernen

## 11. Ausrüstung und Kleidung

Kleidung und Rüstung werden als vereinfachte Sets dargestellt.

Regel:

- Outfit/Kleidung als Set-Overlay
- Rüstung ebenfalls als Set oder wenige große Overlay-Gruppen
- keine unnötig vielen Einzel-Sprites
- Schuhe/Stiefel bleiben separat

Warum Schuhe separat bleiben:

- spätere Bewegungseffekte möglich
- Beispiele: schnelle Stiefel, Flossen für Wasser, Spezialschuhe

## 12. Platzierbare Gegenstände

Die Welt soll lebendig wirken. Daher gibt es platzierbare Objekte.

### 12.1 Funktionale Objekte

- Werkbank
- Lagerfeuer
- Herd
- Bett
- Kisten/Lager
- spätere Produktionsstationen

### 12.2 Dekorative Objekte

- Tische
- Stühle
- Fackeln
- Blumen/kleine Deko

Fackeln sollen nachts einen kleinen Lichtbereich erzeugen.

## 13. Bauen und Gebäude

Das Baumenü soll klar kategorisiert sein.

Mögliche Kategorien:

- Blöcke/Böden
- Wände/Zäune
- Türen/Tore
- Möbel
- Produktionsstationen
- Licht/Deko

Dächer sollen später möglichst automatisch entstehen, wenn Räume klar geschlossen sind. Das verhindert unnötige Einzelarbeit beim Bauen.

## 14. Menüs

### Charaktermenü

Soll anzeigen:

- großes Charakterbild
- Kleidung/Rüstung
- Schuhe
- aktive Hand/Waffe
- passive Werkzeuge
- Werte später möglich

### Inventar/Crafting

Soll einfach und mobil gut bedienbar sein:

- klare Icons
- große Touchflächen
- Kategorien
- wenig verschachtelte Menüs

## 15. Tageszyklus und Atmosphäre

### Tag

- heller Himmel
- langsame Wolken
- klare Sicht
- Farming und Bauen im Vordergrund

### Nacht

- dunklerer Himmel
- Kristall leuchtet stärker
- Fackeln werden relevant
- eventuell andere Drops/Begegnungen
- Atmosphäre magischer, aber nicht horrorartig

## 16. MVP-Umfang

Der erste spielbare MVP sollte enthalten:

- Canvas-Spielschleife
- Spielerbewegung
- 3x3-Startinsel
- Kristall-Interaktion
- erste Rohstoffe
- einfache Inventaranzeige
- Erdblock platzieren
- einfache Kollisions-/Kantenlogik
- Basis-Crafting oder vorbereitete Crafting-Struktur
- PWA-Grundfunktion

Noch nicht nötig im MVP:

- vollständige Tiere
- komplexe Gegner-KI
- komplettes Crafting
- echtes Savegame mit Versionierung
- vollständiger Tag-/Nachtzyklus
- finaler Asset-Satz

## 17. Kompakte Designregeln

- Kristall ist das Herz des Spiels.
- Faust/Spitzhacke erzeugt Rohstoffe.
- Waffen erzeugen Begegnungen.
- Erde ist Weltbasis.
- Samen spezialisieren Erde.
- Wasser ist ein früher Progressionsschritt.
- Weltkante ist Risiko und taktisches Element.
- Loot darf durch Void-Stürze nicht verloren gehen.
- Systeme bleiben einfach, aber erweiterbar.
