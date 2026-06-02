# One Block – Codex-Anweisungen

Diese Datei ist die wichtigste Arbeitsanweisung für Codex in diesem Repository.

## Sprache und Kommunikation

- Antworte dem Projektinhaber auf Deutsch.
- Erkläre Änderungen kurz, praktisch und ohne unnötige Fachdetails.
- Wenn mehrere Lösungen möglich sind, wähle die einfachere und robustere Variante.
- Keine großen Umbauten ohne klaren Nutzen.

## Projektziel

Baue ein 2D-Top-Down-Spiel namens **One Block** als statische Web-App/PWA.

Kernidee:

- Spieler startet auf einer kleinen 3x3-Insel im Himmel.
- In der Mitte steht ein magischer Kristall.
- Faust/Spitzhacke am Kristall erzeugt Rohstoffe.
- Waffen am Kristall erzeugen Begegnungen wie Tiere oder Gegner.
- Der Spieler erweitert die Welt Block für Block.

## Technikvorgabe

- Ziel: statische Web-App/PWA für GitHub Pages.
- Runtime: Browser, Canvas, JavaScript-Module.
- Kein Backend einführen, solange es nicht ausdrücklich verlangt wird.
- Keine Frameworks hinzufügen, solange Vanilla JS ausreicht.
- Mobile Touch-Bedienung ist langfristig wichtiger als Desktop-Komfort.

## Dokumente zuerst lesen

Vor größeren Änderungen zuerst diese Dateien prüfen:

1. `docs/game-design.md`
2. `docs/technical-asset-decisions.md`
3. `docs/animation-gameplay-guide.md`
4. `docs/roadmap.md`
5. `docs/architecture.md`

## Verbindliche Designentscheidungen

- Welt-Tiles sind 32x32 Pixel.
- Spieler-Ingame-Sprite ist 48x48 Pixel pro Frame.
- Pixelart-Assets sind PNG mit transparentem Hintergrund, falls nötig.
- Keine JPEG-Dateien für Spielgrafiken.
- Das Spiel bleibt freundlich, hell und charmant.
- Kein Kopieren fremder Marken, Figuren, Sounds oder Assets.
- Keine unnötig komplexe Physik.
- Diagonale Bewegung muss normalisiert werden.
- Weltkanten sind Sicherheitsgrenzen für Tiere und Gegner.
- Knockback darf bodengebundene Gegner/Tiere über die Kante schieben.
- Loot von herunterfallenden Gegnern/Tieren erscheint auf dem letzten gültigen Tile.
- Fliegende Gegner können über den Void, bleiben aber maximal 3 Blöcke von bebauten Tiles entfernt.
- Steinschleuder und Bogen nutzen gerade Projektilbahnen mit nur optischer Absenkung.
- Kleidung wird als Set/Overlay umgesetzt.
- Schuhe bleiben separates Equipment.

## Code-Stil

- Kleine Module bevorzugen.
- Klare Namen verwenden.
- Keine cleveren, schwer lesbaren Abkürzungen.
- Bestehende Struktur respektieren.
- Neue Systeme in passende Ordner legen.
- Spiellogik und Rendering möglichst getrennt halten.
- Konstanten zentral halten.

## Tests und Prüfung

Nach Änderungen mindestens ausführen:

```bash
npm test
```

Falls die Änderung visuell ist, zusätzlich kurz im Browser prüfen.

## Pull Requests

PR-Beschreibung kurz halten:

- Was wurde geändert?
- Warum wurde es geändert?
- Wie wurde es geprüft?

## Was Codex vermeiden soll

- Keine großen Frameworks ohne Auftrag.
- Keine fremden Assets aus bekannten Spielen.
- Keine unnötig komplizierten Build-Systeme.
- Keine Simulationen, die für das gewünschte Spielgefühl nicht nötig sind.
- Keine langen technischen Erklärungen an den Projektinhaber.
