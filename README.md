# Rille 33 – begehbarer 3D-Plattenladen

Uni-Projekt (BWL Handel, Store Layout, DHBW Heilbronn). Spezifikation: [SPEC.md](SPEC.md), Stand: [PROGRESS.md](PROGRESS.md).

**Live (auch offline als App):** https://benhaaf.github.io/rille33/

## Auf dem iPad installieren
1. Seite in Safari öffnen und warten, bis „Offline bereit“ erscheint.
2. Teilen → „Zum Home-Bildschirm“. Danach startet die App im Vollbild und ohne Internet.

## Steuerung

| Aktion | PS5-Controller | Tastatur/Maus | Touch |
|---|---|---|---|
| Laufen | linker Stick | WASD | Joystick unten links |
| Umsehen | rechter Stick | Maus (Klick = Pointer Lock) | rechte Bildschirmhälfte wischen |
| Schneller gehen | R2 (analog) | Shift | Button „Schnell“ |
| Ego ↔ Draufsicht | Dreieck | T | „Ansicht“ |
| Hauptweg ein/aus | Kreis | H | „Weg“ |
| Zonen ein/aus | Quadrat | Z | „Zonen“ |
| Infokarte | X | E | „Info“ |
| Regalzonen | L3 | R | „Regal“ |
| Präsentationsmodus | Options | P | „Präs.“ |
| Nächste / vorige Station | R1 / L1 | → / ← | „Weiter“ / „Zurück“ |
| Rahmen-Overlay | Create | I | „Rahmen“ |
| Draufsicht als PNG speichern | R3 | B | „PNG“ |

Empfindlichkeit, Deadzone, Tempo und Grafikqualität: `src/config.js`. Store-Daten (Raum, Zonen, Möbel, Regalzonen, Licht, Materialien): `src/layout.json`.

URL-Parameter: `?pos=x,z,blickGrad` (Startpunkt), `?fps=0` (FPS-Anzeige aus), `?licht=einfach` (weniger Lichtquellen, falls es ruckelt), `?debug` (`window.rille` in der Konsole).

## Draufsicht als PNG (für die Folien)
„PNG“ antippen (geht aus beiden Ansichten). Es erscheint eine Vorschau (2400 × 1600 px):
- **Teilen / Sichern** öffnet den Teilen-Dialog des iPads („Bild sichern“, AirDrop, Dateien …)
- **Herunterladen** speichert in „Dateien“, **In neuem Tab öffnen** zeigt das Bild einzeln
- oder das Bild in der Vorschau lange drücken → „Zu Fotos hinzufügen“

## Entwicklung
```
npm install
npm run dev      # Entwicklungsserver
npm run build    # Offline-Build nach dist/
```
Jeder Push auf `main` baut und veröffentlicht automatisch über GitHub Actions (`.github/workflows/deploy.yml`).
