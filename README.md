# Rille 33 – begehbarer 3D-Plattenladen

Uni-Projekt (BWL Handel, Store Layout, DHBW Heilbronn): begehbarer 3D-Prototyp eines Plattenladens, der das Store-Konzept **erklärt** – Hauptweg, Zonen und begründete Entscheidungen werden sichtbar. Spezifikation: [SPEC.md](SPEC.md), Entwicklungsstand: [PROGRESS.md](PROGRESS.md).

**Live:** https://benhaaf.github.io/rille33/
**Offline-Datei für den Laptop:** https://benhaaf.github.io/rille33/rille33-offline.html (herunterladen, per Doppelklick in Chrome öffnen – kein Internet, kein Server nötig)

## Steuerung

| Aktion | PS5-Controller | Tastatur/Maus | Touch (iPad) |
|---|---|---|---|
| Laufen | linker Stick | WASD | Joystick unten links |
| Umsehen | rechter Stick | Maus (Klick = Pointer Lock) | rechte Bildschirmhälfte wischen |
| Schneller gehen | R2 (analog) | Shift | „Schnell“ |
| Ego ↔ Draufsicht | Dreieck | T | „Ansicht“ |
| Hauptweg ein/aus | Kreis | H | „Weg“ |
| Zonen & Beschriftungen ein/aus | Quadrat | Z | „Zonen“ |
| Infokarte zum Objekt im Blick / Schublade oder Tür im Fadenkreuz öffnen | X | E | „Info“ oder Hinweis antippen |
| Regalzonen-Höhenmarken ein/aus | L3 | R | „Regal“ |
| Präsentationsmodus ein/aus | Options | P | „Präs.“ |
| Nächste / vorige Station | R1 / L1 | → / ← | „Weiter“ / „Zurück“ |
| Rahmen-Overlay (Kap. 3) | Create/Share | I | „Rahmen“ |
| Draufsicht als PNG speichern* | R3 | B | „PNG“ |
| Lo-Fi-Musik an/aus* | L2 | M | „Musik“ |

\* Ergänzungen zur SPEC (Kap. 10 sieht dafür keine Taste vor).

Der Controller verbindet sich per USB oder Bluetooth; nach dem ersten Tastendruck steht oben links „Controller verbunden“. Sobald der Controller benutzt wird, blenden sich die Touch-Buttons aus (Antippen holt sie zurück).

## Präsentation (20 Minuten)
1. „Präs.“ / Options starten → Einleitung (Titel, Leitfrage, Ablauf) vor dem Laden. Mit R1 / „Weiter“ geht es zu Station 1.
2. R1 / „Weiter“ blättert wie Folien durch die 8 Stationen, die Infokarte (Entscheidung · Begründung · Quelle · Annahme) blendet automatisch ein, unten rechts steht „3/8“.
3. Zwischendurch frei laufen: Options beendet den Präsentationsmodus an der aktuellen Stelle; X / „Info“ zeigt die Karte zu dem, was man gerade ansieht.
4. „Rahmen“ / Create zeigt Standort, Kundengruppen, Sortiment, Fläche und Zielumsatz.
5. Dreieck / „Ansicht“ wechselt in die Draufsicht mit Legende und Maßstab.
6. Nach Station 8 folgen „Fazit“ und „Quellen“. Texte: `layout.json` → `praesentation`.

## Auf dem iPad installieren (offline)
1. Seite in Safari öffnen und warten, bis „Offline bereit“ erscheint.
2. Teilen → „Zum Home-Bildschirm“. Danach startet die App im Vollbild und ohne Internet.
3. Updates kommen automatisch, sobald man online ist (App ggf. zweimal neu öffnen).

## Draufsicht als PNG (für die Folien)
„PNG“ antippen (geht aus beiden Ansichten). Es erscheint eine Vorschau (2400 × 1600 px):
- **Teilen / Sichern** öffnet den Teilen-Dialog des iPads („Bild sichern“, AirDrop, Dateien …)
- **Herunterladen** speichert in „Dateien“, **In neuem Tab öffnen** zeigt das Bild einzeln
- oder das Bild in der Vorschau lange drücken → „Zu Fotos hinzufügen“

## Inhalte ändern – ohne Code
Alle Store-Daten stehen in **`src/layout.json`** (auf GitHub direkt im Browser bearbeitbar; nach dem Speichern auf `main` ist die neue Version nach ca. 1–2 Minuten online):

| Abschnitt | Inhalt |
|---|---|
| `raum`, `oeffnungen`, `innenwaende`, `sperrflaechen` | Raummaße, Eingang, Schaufenster, Notausgang, Lager |
| `zonen` | Z1–Z8: Rechteck, Farbe, Flächentyp, Boden (holz/beton), Licht (Kelvin, Stärke, Leuchtentyp), Position der Beschriftung in der Draufsicht |
| `moebel` | M1–M12: Rechteck `[x1, x2, z1, z2]`, Höhe, Details (Genres, Marken, Schilder …) |
| `wege` | Hauptweg und Sammler-Weg (Punktliste) |
| `stationen` | 8 Stationen: Kamera, Blickziel, Infokarten-Texte |
| `rahmen` | Rahmendaten aus Kap. 3 |
| `beleuchtung`, `materialien`, `regalzonen`, `cover_farben` | Spots, Grundlicht, Farben, Filz-Paneele, Regalzonen-Höhen |

Koordinaten in Metern, Ursprung = vordere linke Ecke von der Straße aus, `x` nach rechts (0–12), `z` in die Tiefe (0–15). Nach Änderungen optional `node scripts/format-layout.mjs` für eine ordentliche Formatierung.

Steuerungs- und Grafik-Einstellungen (Empfindlichkeit, Deadzone, Tempo, Auflösung) stehen in `src/config.js`.

## URL-Parameter
- `?fps=1` – FPS-Anzeige einblenden (zum Messen)
- `?licht=einfach` – weniger Lichtquellen, falls ein Gerät ruckelt
- `?pos=x,z,blickGrad` – an einer bestimmten Stelle starten
- `?debug` – `window.rille` in der Browser-Konsole

## Leistung
Ziel sind 60 fps auf iPad und Laptop. Maßnahmen: zusammengefasste Geometrien (ca. 100 Draw Calls), alle Plattencover auf einem Textur-Atlas als Instanzen, keine Schatten, begrenzte Pixeldichte (`maxPixelRatio`). Fällt die Bildrate trotzdem länger unter 50 fps, senkt die App die Auflösung automatisch ein wenig.

## Entwicklung
```
npm install
npm run dev               # Entwicklungsserver
npm run build             # Build nach dist/ (PWA, wie auf GitHub Pages)
npm run build:einzeldatei # dist-einzeldatei/rille33-offline.html – eine Datei, läuft per Doppelklick
```
Jeder Push auf `main` baut und veröffentlicht automatisch über GitHub Actions (`.github/workflows/deploy.yml`).

Technik: Three.js + Vite, keine externen 3D-Assets (alles aus einfachen Geometrien), Cover und Musik werden prozedural erzeugt (keine urheberrechtlich geschützten Inhalte, fiktive Band- und Markennamen).
