# Fortschritt

## Plan (Etappen aus SPEC Kap. 11 + iPad-Anforderungen)

| Etappe | Inhalt | Status |
|---|---|---|
| 1 | Projekt-Setup, leerer Raum (Wände, Eingang, Schaufenster, Notausgang, Lagerwand), Controller-/Tastatur-/Touch-Steuerung mit Kollision, GitHub Pages, PWA/Offline | ✅ fertig, auf dem iPad getestet |
| 2 | `layout.json` vollständig: Zonen Z1–Z8, Möbel M1–M12, Plattencover, Regalzonen + Höhenmarken | ✅ fertig |
| 3 | Licht und Materialien je Zone (aus `layout.json`), Spots, Filz, Holz/Beton | ✅ fertig |
| 4 | Draufsicht (orthografisch), Hauptweg mit Pfeilen, Sammler-Weg, Legende, Maßstab, PNG-Export (iPad: Teilen-Dialog / neuer Tab) | ✅ fertig |
| 5 | Infokarten, Präsentationsmodus mit 8 Stationen, Rahmen-Overlay | ✅ fertig |
| 6 | Feinschliff: 60 fps auf iPad/Laptop, optional Lo-Fi-Loop, README | ✅ fertig |

## Etappe 1 – erledigt
- Vite 8 + Three.js, `base: '/rille33/'`, GitHub-Actions-Workflow für Pages.
- PWA: Manifest, Icons, Service Worker (Workbox) cacht alle Build-Dateien → läuft offline vom Home-Bildschirm.
- Raum 12 × 15 × 3,2 m, Wände Anthrazit, Eingang (x 1,5–3,5) mit Glastür + Fußmatte, Schaufenster (x 3,5–8,0), Notausgang (Rückwand, x 10,8–11,8) mit Schild und rot schraffierter Sperrfläche, Lagerwand mit Tür. Straße und Häuserzeile vor dem Fenster.
- Alle Raumdaten in `src/layout.json`, Umrechnung Store → Three.js in `src/coords.js`.
- Steuerung: PS5-Controller (Gamepad API, Deadzone), Tastatur/Maus, Touch (Joystick, Wischen, Buttons für alle Funktionen aus Kap. 10). Noch nicht umgesetzte Funktionen zeigen „folgt in Etappe N“.
- Kollision (Kreis gegen Rechtecke): Wände, Lager, Notausgang-Freifläche.
- Statusanzeige Controller + FPS-Zähler (abschaltbar mit `?fps=0` oder in `config.js`).
- Auflösung auf dem iPad auf Pixel-Ratio 1,5 begrenzt (Performance).

**Test auf dem iPad (durch Ben):** Raum, Touch-Steuerung, Kollision und Offline-Betrieb funktionieren, 60 fps. PS5-Controller noch nicht getestet.

## Etappe 2 – erledigt
- `layout.json` enthält jetzt alle Zonen (Z1–Z8), Möbel (M1–M12), Regalzonen und die Cover-Farbpalette. Formatierung: `node scripts/format-layout.mjs`.
- Zonen als halbtransparente, farbige Bodenflächen mit Umrandung und schwebendem Namensschild (ID, Name, Flächentyp); Möbel-IDs als orange Marken. Ein-/ausblendbar (Quadrat / Z / „Zonen“).
- Möbel aus einfachen Geometrien, gesteuert über `typ` in `layout.json`:
  - M1 Schaufenster-Display mit großem „Album der Woche“-Cover und hängenden Covern
  - M2/M3 Neuheiten-Tische quer zum Hauptweg, Cover frontal beidseitig
  - M4 Genre-Wand: 6 Segmente mit Schild (Reckzone), frontalen Top-Titeln (Sichtzone), Plattenfächern (Greifzone), Schubladen (Bückzone)
  - M5/M6 Digging-Kisten beidseitig, M7 drei Hörstationen mit Plattenspieler und Kopfhörer, M8 Bar mit Rückbuffet und 4 Hockern
  - M9 Hardware-Wand mit Markenblöcken „Aurel“, „Norda“, „Vinto“, M10 Beratungstisch, M11 Kasse, M12 Zubehör-Gondel
- Regalzonen-Höhenmarken an M4 (farbige Bänder, Linien, Beschriftung) ein-/ausblendbar (L3 / R / „Regal“).
- Kollision automatisch aus allen Möbel-Grundrissen (inkl. Barhocker).
- Performance: Teile werden pro Material zusammengefasst, Platten als Instanzen → ca. 100 Draw Calls, ca. 32.000 Dreiecke.
- URL-Parameter für Tests: `?pos=x,z,blickGrad` setzt den Startpunkt, `?debug` stellt `window.rille` bereit.

## Etappe 3 – erledigt
- Licht je Zone in `layout.json` (`zonen[].licht`): Farbtemperatur in Kelvin, Stärke, Leuchtentyp (`pendel`, `panel`, `strahler`), Leuchtenabstand, Anzahl echter Lichtquellen.
  - warm 2700 K: Second-Hand (Z4) und Listening Bar (Z5) mit Pendelleuchten
  - neutral 4000 K: Hardware & Beratung (Z6) mit Deckenpanels
  - Stromschienen mit Strahlern über Neuheiten (Z2) und Genre-Wand (Z3)
- Spots (`beleuchtung.spots`): auf das Schaufenster M1 und auf die Sichtzone der Genre-Wand M4 (3 Stück).
- Grundlicht (Himmel/Boden) und Tageslicht durchs Schaufenster.
- Materialien (`materialien` und `zonen[].boden`): Holzdielen auf Warenflächen, Beton mit Plattenfugen auf Kundenflächen, Filz-Paneele an Rück- und Seitenwand der Bar, Wände Anthrazit mit orangem Akzentstreifen.
- Das 1-m-Raster gehört jetzt zur Zonen-Ansicht (wird mit „Zonen“ ein-/ausgeblendet).
- Leistungsreserve: `?licht=einfach` bzw. `lichtEinfach: true` in `config.js` → weniger Lichtquellen, keine Spots. Stand: ca. 110 Draw Calls, 36.000 Dreiecke, 14 Lichtquellen.

## Zwischenschritt – detailliertere Plattencover (Wunsch nach Etappe 3)
- 64 prozedurale Cover mit fiktiven Band- und Albumnamen, verschiedenen Schriften und Motiven, gelegentlich „NEU“-Aufkleber.
- Auch Platten in Fächern, Kisten und Stapeln zeigen Cover; Second-Hand-Platten leicht verblichen.
- Alles auf einem Textur-Atlas in einer InstancedMesh → weniger Draw Calls als vorher (ca. 100).

## Etappe 4 – erledigt
- Draufsicht (Dreieck / T / „Ansicht“): orthografische Kamera, Straße unten, Decke/Leuchten/Straße ausgeblendet.
- 2D-Overlay: Titel, Zonennamen mit Flächentyp (Position je Zone über `zonen[].beschriftung` in `layout.json`), Möbel-IDs, Beschriftung von Eingang/Schaufenster/Notausgang, Legende (Zonen, Wege, Sperrfläche, Möbel), Maßstabsbalken 0–5 m. Passt sich an Quer- und Hochformat an und lässt Platz für die Touch-Buttons.
- Hauptweg (`wege` in `layout.json`) als leuchtende Linie mit wandernden Richtungspfeilen, Sammler-Weg gestrichelt (Eingang → Second-Hand). Ein-/ausblendbar mit Kreis / H / „Weg“ – in beiden Ansichten.
- PNG-Export (R3 / B / „PNG“): 2400 × 1600 px, sieht aus wie die Draufsicht. Vorschau-Dialog mit „Teilen / Sichern“ (Teilen-Dialog des iPads), „Herunterladen“, „In neuem Tab öffnen“, langes Drücken aufs Bild.
- Ergänzung zur SPEC: PNG-Export auch auf R3 (Controller) und B (Tastatur), weil Kapitel 10 dafür keine Taste vorsieht.

## Etappe 5 – erledigt
- `layout.json` → `stationen`: 8 Stationen aus Kap. 9 mit Kameraposition, Blickziel, zugehörigen Objekten und Infokarte (Entscheidung · Begründung · Quelle · Annahme). Texte dort änderbar.
- Infokarte oben links; „Annahme“ gelb markiert. Im freien Laufen öffnet X / E / „Info“ die Karte zum Objekt im Blick (oder zur Zone, in der man steht); sie schließt sich nach 2,5 m Laufen oder erneutem Drücken.
- Präsentationsmodus (Options / P / „Präs.“): Kamera fliegt weich von Station zu Station (leichter Bogen über Möbel), R1/L1 bzw. → / ← bzw. „Weiter“/„Zurück“ wie Folien, Karte blendet automatisch ein, „3/8“ unten rechts. Station 1 zeigt das Schaufenster von der Straße aus. Beim Beenden läuft man dort weiter, wo die Kamera steht.
- R1/L1 außerhalb des Präsentationsmodus starten ihn direkt (bei Station 1 bzw. 8).
- Rahmen-Overlay (Create / I / „Rahmen“) mit allen Feldern aus Kap. 3, Annahmen gelb markiert (`layout.json` → `rahmen`).
- Schild „Album der Woche“ hängt jetzt an der Stange, damit es von der Straße aus sichtbar ist.

## Fix nach Etappe 5 – flimmernde Tür- und Fensterrahmen
- Ursache: Rahmenflächen lagen exakt auf Wandflächen (Laibung, Sturz) und die Rahmen von Tür und Schaufenster überdeckten sich → Z-Fighting.
- Lösung: Rahmen ragen 5 mm in die Öffnung, jede Öffnung steht minimal anders weit vor der Wand; Schaufenster hat jetzt auch unten einen Rahmen.

## Fix – Lager-Schild und Notausgang
- Schildtexte werden automatisch verkleinert, damit nichts abgeschnitten wird (vorher war vom Lager-Schild nur „r Perso“ zu sehen); mehrzeilige Schilder möglich.
- Lagertür: zweizeiliges Schild „LAGER / Nur Personal“ (Text in `layout.json` → `innenwaende[].tuer.schild`).
- Keine Leuchten mehr über Sperrflächen (Pendelleuchte hing vor dem Notausgang-Schild).
- Grundboden reicht unter die Wände (kein heller Spalt unter der Notausgangstür).

## Etappe 6 – erledigt
- FPS-Anzeige standardmäßig aus (`?fps=1` zum Messen).
- Dynamische Auflösung: fällt die Bildrate länger als 3 s unter 50 fps, wird die Pixeldichte schrittweise gesenkt (nach 5 s Aufwärmzeit; abschaltbar in `config.js`).
- Offline-Einzeldatei `rille33-offline.html`: eine HTML-Datei mit allem drin, läuft per Doppelklick ohne Server/Internet (für den Präsentations-Laptop). Wird bei jedem Deployment mit veröffentlicht: https://benhaaf.github.io/rille33/rille33-offline.html
- Lo-Fi-Musik (optional laut SPEC): synthetisch per Web Audio (Rhodes-Akkorde Dm9–G13–Cmaj9–Am9, Bass, Beat, Vinyl-Knistern), räumlich aus den 3 Hörstationen, an/aus mit L2 / M / „Musik“. Auf dem iPad funktioniert sie auch bei Stummschalter (iOS 17+).
- README mit vollständiger Steuerung, Präsentationsablauf, Offline-Nutzung und Anleitung zum Ändern von `layout.json`.

## Fix – flimmernder Akzentstreifen an der Zubehör-Gondel
- Oranger Abschluss lag bündig auf der Mittelwand (oben und an beiden Enden) → Z-Fighting.
- Gleiches Muster auch an Genre-Wand und Hardware-Wand behoben (Rückwand/Sockel gegen Seitenteile, Abschluss oben). Regel im Code: Teile aus verschiedenen Materialien bekommen 5 mm Versatz (`E` in `furniture.js`).

## Erweiterung – Schubladen, Zubehör, begehbares Lager
- **Schubladen** (Bückzone der Genre-Wand, 36 Stück): Fadenkreuz in der Bildmitte; schaut man auf eine Schublade, erscheint „X / E Schublade öffnen“ (auf dem iPad den Hinweis antippen). Schublade fährt 40 cm heraus, darin ein Stapel Nachschub-Platten. Alles instanziert (`src/scene/drawers.js`).
- **Zubehör-Gondel** mit erkennbaren Artikeln und gezeichneten Texturen (`src/scene/accessories.js`): Innenhüllen-Packungen, Schutzhüllen, Reinigungsspray „Vinyl Clean“, Carbon-Plattenbürsten, Slipmats, Ersatznadeln, gefaltete und hängende „Rille 33“-Tote-Bags, Preisschilder an jeder Regalkante, Kopfschild oben.
- **Lager begehbar** (Abweichung von SPEC Kap. 5 „nicht begehbar“, auf Wunsch): Lagertür öffnet per X / E / Hinweis und schwenkt ins Lager (Kollision folgt dem Türblatt). Innen: zwei Schwerlastregale mit beschrifteten Kartons, Backoffice-Schreibtisch mit Monitor, Ordnern und Bürostuhl, Kartonstapel, neutrales Deckenlicht. Möbel L1–L4 in `layout.json`.
- „Info“ / X / E: zeigt das Fadenkreuz auf eine Schublade oder Tür, wird diese bedient – sonst wie bisher die Infokarte.
- Stand: ca. 160 Draw Calls, 44.000 Dreiecke.

## Erweiterung – detailliertere Einrichtung, Bar, Wand zum Lager
- Neues Modul `src/scene/decor.js` (Stil wie das Zubehör: einfache Formen + gezeichnete Texturen).
- **Bar:** Lattenfront, LED-Leiste, Fußstange, Zapfanlage mit 3 Hähnen, Untersetzer mit Gläsern/Tassen, Getränkekarten, Kassen-Tablet, Pflanze. Rückbuffet (über Thekenhöhe, da zwischen Theke und Wand kaum Platz ist) mit Siebträger-Espressomaschine, Mühle, DJ-Plattenspieler mit Boxen und „Jetzt läuft“. Zwei Regale mit etikettierten Flaschen (5 Sorten, z. B. „Neckar Gin“, „Rille Mate“), Gläserreihe, LED darunter. Glastür-Kühlschrank am Thekenende. Barhocker mit Lehne. Neon „Listening Bar“ auf dem Filz, Kreidetafel „Getränke“.
- **Wand zum Lager** (`layout.json` → `wanddeko`, Texte dort änderbar): Holzlatten-Verkleidung, Neon „RILLE 33“, 5 gerahmte Veranstaltungsposter, große Pflanze; zur Bar hin Tafeln „Hörregeln“ und „Diese Woche“.
- **Details:** Aufsteller an den Hörstationen, Schilder „Neuheiten“/„Charts“, Trennkarten und Schilder „Second-Hand A–M / N–Z“, Kassenbildschirm mit Oberfläche, hängendes Schild „KASSE“, Gutschein-Aufsteller, Preisschilder an der Hardware-Wand, Beratungs-Aufsteller, Prospekte und Hocker am Beratungstisch.
- Stand: ca. 180 Draw Calls, 58.000 Dreiecke.

## Umbau – Bar mit Arbeitsgang, neue Kasse, Pflanze
- **Bar (Abweichung von SPEC Kap. 6):** Theke von z 14,1–14,7 auf z 13,3–13,9 nach vorn gerückt, Hocker auf z 12,95, Hörstationen von z 12,2 auf 11,95. Dahinter ca. 75 cm Arbeitsgang mit Bodenmatte, erreichbar am rechten Thekenende. Mitarbeiterseite: Spüle mit Hahn, Gläserspüler, Kühlschubladen, Gläserfach; Zapfhähne zeigen zum Personal. Rückbuffet (Tiefe 36 cm) mit Schranktüren, Espressomaschine, DJ-Ecke; Glastür-Kühlschrank ins Rückbuffet integriert. Werte in `layout.json` (`M8.rechteck`, `hocker_z`, `rueckbuffet`).
- **Kasse:** Lattenfront mit LED und Logo-Schild, Kassenlade; Kassensystem mit Personal-Bildschirm, Kundendisplay „Summe“, Kartenterminal, Bondrucker; Tragetaschen, Sticker-/Button-Korb, Gutschein-Aufsteller; Bodenaufkleber „Bitte hier anstellen“; Regal „Abholung – Vorbestellungen“ an der Frontwand hinter der Kasse.
- **Pflanze** steht frei vor der Lattenwand (ragte vorher in die Wand).
- Hauptweg weiterhin komplett begehbar (getestet).

## Präsentationsformat und mehr Detail
- **Präsentationsablauf:** Einleitung (Titel, Leitfrage, Ablauf, Team) → Stationen 1–8 → Fazit (Kernaussagen, Ausblick) → Quellen (vollständige Literaturangaben). Texte und Kamerapositionen in `layout.json` → `praesentation`. Anzeige unten rechts: „Einleitung“, „3/8“, „Fazit“, „Quellen“. Info (X/E) blendet Karte oder Folie aus/ein.
- **Weniger kantig:** Möbelteile mit abgerundeten Kanten (`kantenRadius` in `config.js`, 0 = aus), auch Kartons, Taschen, Latten; runde Teile mit mehr Segmenten; Sockelleisten an allen Wänden; Leuchtschrift „RILLE 33“ an der Fassade.
- Stand: ca. 180 Draw Calls, ca. 145.000 Dreiecke.
- **Zu prüfen:** Literaturangabe Ahlert/Kenning/Brock (Titel, Auflage, Jahr) mit dem eigenen Exemplar abgleichen.

## Karlspassage, mehr Leben, Kundensimulation
- **Umgebung** (`src/scene/passage.js`): überdachte Ladenpassage im Stil der Karlspassage Stuttgart (freie Nachempfindung, kein exakter Nachbau): Glasdach mit Stahlbindern, Granitboden, Fassaden mit Obergeschossen, fiktive Nachbarläden mit Schaufenstern, Ausleger-Schildern, Banner „Karlspassage“, Leuchten, Bänke, Bäume in Pflanzkübeln, Litfaßsäule, Mülleimer, Passanten; vor Rille 33 ein Kundenstopper und eine Grabbelkiste.
- **Mehr Detail/Leben:** Personal an Bar und Kasse, stöbernde Kundschaft (`src/scene/people.js`), Plattenspieler mit Füßen, Teller, Tonarm, Gegengewicht, Knöpfen; Lautsprecher mit Sicken und Bassreflex; Lüftungsrohr an der Decke; Feuerlöscher.
- **Kundensimulation** (`src/simulation.js`, Daten in `layout.json` → `simulation`): „Sim.“ / K / Steuerkreuz oben. Eine Kundin läuft aus der Passage den Hauptweg ab, bleibt an 9 Halten stehen, Bildunterschrift erklärt das Verhalten; Kamera folgt, in der Draufsicht sieht man sie von oben (oranger Ring). Weiter/Zurück springen zum nächsten/vorigen Halt. Erneut starten → Sammler auf dem Sammler-Weg.
- Stand: ca. 240.000 Dreiecke, ca. 270 Draw Calls im Gesamtblick.
- **Zu klären:** Rahmen-Overlay nennt weiterhin „Innenstadt-Nebenlage Heilbronn“ als Standort.

## Realistischere Figuren
- Neuer Körperaufbau in `src/scene/people.js`: Proportionen ca. 7,5 Kopflängen, geformter Oberkörper und Becken, Ober-/Unterschenkel mit Knie, Ober-/Unterarm mit Ellbogen, Hände, Hals, Schuhe mit Sohle.
- Gesicht mit Augen, Brauen, Nase, Mund, Ohren; Frisuren (kurz, lang, Bob, Dutt, Glatze), Bärte, Brillen; Kleidung mit Kragen, kurzen/langen Ärmeln, offenen Jacken, Röcken, Umhängetaschen; Personal mit Schürze.
- Haltungen: stehen, stöbern (greift ins Regal, Kopf gesenkt), arbeiten.
- Simulationsfigur mit Gehzyklus: Knie- und Ellbogenbeugung, Wippen, weicher Übergang Stehen ↔ Gehen.
- Stand: ca. 315.000 Dreiecke.

## Offen / Ideen
- Test mit echtem PS5-Controller am iPad (Options/Create könnten von iPadOS abgefangen werden – dann Tasten umlegen).
- Kamerapositionen der Stationen nach Probelauf feinjustieren (`layout.json` → `stationen[].kamera`).
