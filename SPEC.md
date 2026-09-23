# SPEC – „Rille 33“: begehbarer 3D-Plattenladen

Uni-Projekt (BWL Handel, Store Layout, DHBW Heilbronn). Ziel ist ein begehbarer 3D-Prototyp eines Plattenladens, den wir in einer 20-minütigen Präsentation mit einem PS5-Controller vorführen. Der Prototyp soll das Store-Konzept **erklären**, nicht nur zeigen: Hauptweg, Zonen und begründete Entscheidungen müssen sichtbar werden.

---

## 1. Technik

- Three.js + Vite, JavaScript, keine externen 3D-Assets (alles aus einfachen Geometrien, Low-Poly, clean).
- Läuft offline im Browser (Chrome) auf einem Laptop. `npm run dev` zum Starten, `npm run build` für eine Offline-Version.
- Steuerung per Gamepad API (PS5 DualSense via USB/Bluetooth). Tastatur/Maus als vollwertiger Fallback.
- **Alle Store-Daten liegen in `src/layout.json`** (Raum, Zonen, Möbel, Hauptweg, Stationen, Infotexte). Code und Daten strikt trennen, damit wir Möbel verschieben und Texte ändern können, ohne Code anzufassen.
- Alle sichtbaren Texte auf Deutsch.
- Keine urheberrechtlich geschützte Musik. Klang höchstens synthetisch per Web Audio API.

## 2. Koordinatensystem

- Maße in Metern. Ursprung (0,0) = vordere linke Ecke, von der Straße aus gesehen.
- `x` = Breite 0–12 (links → rechts), `z` = Tiefe 0–15 (Straßenfront → Rückwand).
- Raumhöhe 3,2 m. Rechtecke werden als `[x1, x2, z1, z2]` angegeben.
- Bitte intern sauber auf das Three.js-Koordinatensystem umrechnen.

## 3. Rahmen (Startbildschirm / Info-Overlay)

| Feld | Inhalt |
|---|---|
| Store | „Rille 33 – Plattenladen & Listening Bar“ |
| Standort | Innenstadt-Nebenlage Heilbronn, Nähe Hochschule (Annahme) |
| Kundengruppen | 1) Sammler (25–55 J., zielgerichtet, lange Verweildauer) 2) Einsteiger/Studierende (Vinyl-Revival, stöbernd) 3) Geschenkkäufer (kurz, beratungsbedürftig) |
| Sortiment | Neuware-LPs, Second-Hand-Platten, Plattenspieler/Hardware, Zubehör & Merch, Getränke an der Listening Bar |
| Fläche | 180 m² gesamt (12 × 15 m), davon ca. 165 m² Verkaufsfläche |
| Wirtschaftliche Größe | Zielumsatz 495.000 €/Jahr = 165 m² × 3.000 €/m² (**Annahme**, Flächenproduktivität nicht belegt) |

## 4. Raum & feste Positionen

- Eingang: Frontwand, x 1,5–3,5 (unten links).
- Schaufenster: Frontwand, x 3,5–8,0 (Glas).
- Kasse: vorne rechts (siehe Möbel M11).
- Notausgang: Rückwand, x 10,8–11,8. Davor 1,2 m freihalten (Kollisionszone ohne Möbel, rot schraffiert in der Draufsicht).

## 5. Zonen (farbige Bodenflächen, halbtransparent, ein-/ausblendbar)

| ID | Name | Rechteck [x1,x2,z1,z2] | Flächentyp (Kap. 10) | Farbe |
|---|---|---|---|---|
| Z1 | Eingangszone | [0, 7, 0, 2.5] | Kundenfläche | hellgrau |
| Z2 | Neuheiten & Charts | [2.8, 7.5, 2.5, 6.5] | Warenfläche | orange |
| Z3 | Genre-Wand Neuware | [0, 1.2, 2.5, 11.5] | Warenfläche | gelb |
| Z4 | Second-Hand „Digging“ | [4.2, 8.2, 6.5, 10.8] | Warenfläche | braun |
| Z5 | Listening Bar | [4.5, 12, 11.8, 15] | Kundenfläche (Aufenthalt) | petrol |
| Z6 | Hardware & Beratung | [10, 12, 4.8, 10.5] | Beratungszone | blau |
| Z7 | Kasse & Zubehör | [7, 12, 0, 4.5] | sonstige Fläche + Impulsware | violett |
| Z8 | Lager / Backoffice | [0, 4.5, 12, 15] | sonstige Fläche (nicht begehbar, nur Tür) | dunkelgrau |

## 6. Möbel / Warenträger

| ID | Typ | Rechteck [x1,x2,z1,z2] | Höhe | Details |
|---|---|---|---|---|
| M1 | Schaufenster-Display | [4.0, 7.5, 0.3, 1.0] | 1,2 | Plattencover-Installation „Album der Woche“ |
| M2 | Neuheiten-Tisch 1 | [3.5, 6.5, 3.0, 4.0] | 0,9 | quer zum Hauptweg, Cover frontal |
| M3 | Neuheiten-Tisch 2 | [3.5, 6.5, 5.0, 6.0] | 0,9 | quer zum Hauptweg |
| M4 | Genre-Wand | [0, 0.6, 2.5, 11.5] | 2,4 | 6 Segmente à 1,5 m (von vorn): Rock/Indie, Hip-Hop, Pop, Elektronik, Jazz/Soul, Klassik/Soundtrack; Genre-Schild oben |
| M5 | Digging-Kiste Reihe 1 | [4.8, 5.6, 6.5, 10.5] | 0,9 | Plattenkisten, beidseitig |
| M6 | Digging-Kiste Reihe 2 | [6.8, 7.6, 6.5, 10.5] | 0,9 | Plattenkisten, beidseitig |
| M7 | Hörstationen (3×) | Stehtische ⌀ 0,7 bei z 12,2; x 5,8 / 7,3 / 8,8 | 1,1 | je Plattenspieler + Kopfhörer |
| M8 | Bar-Theke | [6.0, 10.2, 14.1, 14.7] | 1,1 | davor 4 Barhocker bei z 13,6 |
| M9 | Hardware-Wand | [11.4, 12, 5.0, 10.0] | 2,2 | 3 Herstellerblöcke mit fiktiven Marken („Aurel“, „Norda“, „Vinto“) |
| M10 | Beratungstisch | [10.2, 11.0, 6.5, 8.0] | 0,9 | Plattenspieler zum Ausprobieren |
| M11 | Kassentheke | [9.0, 11.5, 2.0, 2.8] | 1,0 | Personal steht dahinter (z < 2,0) |
| M12 | Zubehör-Gondel | [7.0, 8.0, 3.0, 4.5] | 1,4 | Reinigungsbürsten, Innenhüllen, Tote Bags – Impulsware an der Kassenschlange |

**Regalzonen an der Genre-Wand (M4) sichtbar machen:**
- Reckzone (über 1,8 m): Genre-Schilder und Deko
- Sichtzone (1,2–1,8 m): Top-Titel frontal präsentiert (Cover nach vorn)
- Greifzone (0,6–1,2 m): Plattenfächer zum Durchblättern
- Bückzone (unter 0,6 m): Schubladen mit Nachschub
Platten als dünne Boxen mit zufälligen, gedeckten Cover-Farben. Per Taste einblendbare Höhenmarken mit Beschriftung der vier Zonen.

## 7. Hauptweg

Punktliste (x, z), als leuchtende Linie mit Richtungspfeilen am Boden:
(2.5, 0) → (2.2, 3.0) → (2.2, 10.8) → (4.0, 11.3) → (9.2, 11.3) → (9.2, 4.5) → (9.6, 3.4)

Idee: Eingang links, an der Genre-Wand entlang nach hinten (Längsplatzierung), Listening Bar als Magnet an der Rückwand, dann rechts an der Beratung vorbei zur Kasse. Optional zweiter, gestrichelter Weg für Sammler: Eingang → direkt zu Second-Hand (Z4).

## 8. Beleuchtung & Atmosphäre

- Wände dunkles Anthrazit, Akzente in Orange, Böden Holz (Warenfläche) und Beton (Kundenfläche), Filz-Paneele an der Bar (Akustik).
- Licht warm (ca. 2700 K) in Z4 und Z5, neutral-hell (ca. 4000 K) in Z6 (Details an Hardware erkennbar), Spots auf M1 und Sichtzone von M4.
- Licht pro Zone in `layout.json` konfigurierbar.
- Optional: synthetischer, leiser Lo-Fi-Loop per Web Audio, räumlich an den Hörstationen, ein-/ausschaltbar.

## 9. Stationen & Infokarten (Kern der Präsentation)

Jede Station hat Kameraposition, Blickziel und eine Infokarte mit vier Feldern: **Entscheidung · Begründung · Quelle · Annahme** (Annahme deutlich markiert, z. B. gelbes Label).

1. **Schaufenster (M1)** – Entscheidung: Fantasiefenster „Album der Woche“. Begründung: Wechselndes Thema schafft Anlass zum Betreten und zeigt Sortimentskompetenz. Quelle: Ahlert/Kenning/Brock 2020, S. 303–306 (Fenstertypen). Annahme: wöchentlicher Wechsel ist personell leistbar.
2. **Eingangszone (Z1)** – Entscheidung: Eingangszone frei von Warenträgern. Begründung: Orientierung beim Betreten, freier Blick bis zur Bar. Quelle: Ahlert et al. 2020, S. 297–302. Annahme: Kunden brauchen nach dem Eintreten kurz Orientierung.
3. **Neuheiten (M2/M3)** – Entscheidung: Tische quer zum Hauptweg. Begründung: Querplatzierung erzeugt Bremseffekt und neue Kaufrelevanz (Impulskäufe). Quelle: Ahlert et al. 2020, S. 300–301, Abb. 10.3.
4. **Genre-Wand (M4)** – Entscheidung: Längsplatzierung, Produktblock nach Genre, Regalzonen gezielt belegt. Begründung: Wer ein Genre sucht, findet es schnell (bestehende Kaufabsicht). Quelle: Ahlert et al. 2020, S. 300–303. Annahme: Rock/Indie und Hip-Hop sind die umsatzstärksten Genres, daher vorn.
5. **Second-Hand (Z4)** – Entscheidung: Digging-Kisten in der Ladenmitte, abseits des Hauptwegs. Begründung: Sammler suchen gezielt und bleiben lange, ohne den Hauptstrom zu blockieren. Quelle: Ahlert et al. 2020, S. 297–302; Larson et al. 2005 (Kundenlauf). Annahme: Sammler sind die Stammkundschaft.
6. **Listening Bar (Z5)** – Entscheidung: Bar und Hörstationen an der Rückwand. Begründung: Attraktiver Zielpunkt zieht Kunden durch den gesamten Laden; Atmosphäre über Klang, Licht, Material. Quelle: Ahlert et al. 2020, S. 303–306. Annahme: Bar erhöht die Verweildauer.
7. **Hardware & Beratung (Z6)** – Entscheidung: Beratungszone außerhalb des Hauptstroms, Hardware im Herstellerblock. Begründung: Beratung braucht Ruhe; Hardware-Käufer vergleichen oft markenweise. Quelle: Ahlert et al. 2020, S. 297–303. Annahme: Markenvergleich ist bei Plattenspielern typisch.
8. **Kasse & Zubehör (Z7)** – Entscheidung: Kasse vorn rechts am Ende des Hauptwegs, Zubehör-Gondel an der Warteschlange. Begründung: Kasse am Ausgang, Zusatzkäufe beim Warten. Quelle: Ahlert et al. 2020, S. 295–302. Annahme: Wartezeit wird für Zubehörkäufe genutzt.

## 10. Steuerung

| Aktion | PS5-Controller | Tastatur/Maus |
|---|---|---|
| Laufen | linker Stick | WASD |
| Umsehen | rechter Stick | Maus (Pointer Lock) |
| Schneller gehen | R2 (analog) | Shift |
| Ego-Perspektive ↔ Draufsicht | Dreieck | T |
| Hauptweg ein/aus | Kreis | H |
| Zonen & Beschriftungen ein/aus | Quadrat | Z |
| Infokarte zum Objekt im Blick | X | E |
| Regalzonen-Höhenmarken ein/aus | L3 | R |
| Präsentationsmodus ein/aus | Options | P |
| Nächste / vorige Station | R1 / L1 | → / ← |
| Rahmen-Overlay (Kapitel 3) | Create/Share-Taste | I |

Details:
- Augenhöhe 1,65 m, Kollision mit Wänden, Möbeln, Lager und Notausgangs-Freifläche.
- Deadzone für Sticks, Sensitivität in einer Config-Datei.
- Kleine Statusanzeige: „Controller verbunden“ / „Taste drücken zum Verbinden“.
- **Präsentationsmodus:** Kamera fliegt weich von Station zu Station (R1/L1 wie Folien), Infokarte blendet automatisch ein, Stationsnummer „3/8“ unten rechts.
- **Draufsicht:** orthografische Kamera, Zonen farbig mit Namen, Möbel-IDs, Hauptweg, Legende, Maßstabsbalken, Nordpfeil entfällt. Taste zum Speichern der Draufsicht als PNG (für unsere Folien).

## 11. Vorgehen

Bitte zuerst einen Plan vorlegen, dann in Etappen bauen und nach jeder Etappe sagen, wie ich teste:
1. Projekt-Setup, leerer Raum mit Wänden, Eingang, Schaufenster, Notausgang; Controller- und Tastatursteuerung mit Kollision.
2. `layout.json` laden; Zonen und Möbel (M1–M12) rendern, inkl. Plattencover und Regalzonen.
3. Licht und Materialien je Zone.
4. Draufsicht, Hauptweg-Linie, Beschriftungen, PNG-Export.
5. Infokarten, Präsentationsmodus mit Stationen, Rahmen-Overlay.
6. Feinschliff: Performance auf normalem Laptop (60 fps), Offline-Build, kurze README mit Tastenbelegung.
