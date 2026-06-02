# One Block

**One Block** ist ein 2D-Top-Down-Survival-Adventure als statische Web-App/PWA.  
Der Spieler startet auf einer kleinen Insel im Himmel. Ein magischer Kristall erzeugt Rohstoffe, Tiere, Gegner und Progression.

Das Repository ist so vorbereitet, dass Codex direkt damit arbeiten kann.

## Zielplattform

- Primär: iPhone und iPad als PWA über den Home-Screen
- Sekundär: Desktop-Browser
- Hosting: GitHub Pages
- Technik: HTML, CSS, JavaScript, Canvas, keine Serverpflicht

## Projekt starten

Lokal reicht ein einfacher statischer Webserver:

```bash
python -m http.server 8080
```

Dann öffnen:

```text
http://localhost:8080
```

Alternativ mit Node:

```bash
npm start
```

## Nützliche Befehle

```bash
npm test
npm run check
```

Die Tests prüfen aktuell nur, ob die Grundstruktur vorhanden ist. Das ist absichtlich einfach gehalten, damit Codex später saubere Erweiterungen darauf aufbauen kann.

## Aktueller Stand

Dieses Repo enthält:

- eine lauffähige Canvas-/PWA-Grundstruktur
- klare Projekt- und Codex-Anweisungen
- neu strukturierte Designdokumente
- Platzhalter-Assets im korrekten Pixelraster
- GitHub-Pages-Workflow
- erste Spielsysteme als Code-Gerüst

Die Demo ist noch kein fertiges Spiel. Sie dient als technischer Startpunkt.

## Bedienung der Demo

| Eingabe | Funktion |
|---|---|
| WASD / Pfeiltasten | Bewegen |
| Shift | Rennen |
| Leertaste / E | Kristall benutzen |
| B | Erdblock vor dem Spieler platzieren |
| 1 | Faust auswählen |
| 2 | Holzspitzhacke auswählen |
| 3 | Speer auswählen |

## Wichtige Dokumente

| Datei | Zweck |
|---|---|
| `AGENTS.md` | Verbindliche Arbeitsregeln für Codex |
| `docs/game-design.md` | Spielidee, Systeme, Progression |
| `docs/technical-asset-decisions.md` | Technik, Pixelgrößen, Assets, Repo-Regeln |
| `docs/animation-gameplay-guide.md` | Animationen, Bewegung, Fernkampf, Weltkante |
| `docs/roadmap.md` | MVP und nächste Schritte |
| `docs/architecture.md` | Code-Struktur und technische Grundidee |
| `docs/codex-task-brief.md` | Gute Startaufgaben für Codex |

## Grundregeln

- Kein fremdes Markenmaterial verwenden.
- Pixelart-Assets als PNG mit sauberem Pixelraster anlegen.
- Welt-Tiles: 32x32 px.
- Spieler-Ingame-Sprite: 48x48 px.
- Spielmechaniken einfach und gut erweiterbar halten.
- Erst kleine, stabile Systeme bauen; später erweitern.

## GitHub Pages

Nach dem Hochladen auf GitHub:

1. Repository öffnen.
2. `Settings` → `Pages`.
3. Source auf `GitHub Actions` setzen.
4. Auf `main` pushen.
5. Workflow `Deploy static site to GitHub Pages` ausführen lassen.

Danach ist die Web-App über GitHub Pages erreichbar.
