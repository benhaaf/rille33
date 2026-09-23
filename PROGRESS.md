# Fortschritt

## Plan (Etappen aus SPEC Kap. 11 + iPad-Anforderungen)

| Etappe | Inhalt | Status |
|---|---|---|
| 1 | Projekt-Setup, leerer Raum (Wände, Eingang, Schaufenster, Notausgang, Lagerwand), Controller-/Tastatur-/Touch-Steuerung mit Kollision, GitHub Pages, PWA/Offline | ✅ fertig, auf dem iPad getestet |
| 2 | `layout.json` vollständig: Zonen Z1–Z8, Möbel M1–M12, Plattencover, Regalzonen + Höhenmarken | ✅ fertig |
| 3 | Licht und Materialien je Zone (aus `layout.json`), Spots, Filz, Holz/Beton | ⏳ als Nächstes |
| 4 | Draufsicht (orthografisch), Hauptweg mit Pfeilen, Sammler-Weg, Legende, Maßstab, PNG-Export (iPad: Teilen-Dialog / neuer Tab) | offen |
| 5 | Infokarten, Präsentationsmodus mit 8 Stationen, Rahmen-Overlay | offen |
| 6 | Feinschliff: 60 fps auf iPad/Laptop, optional Lo-Fi-Loop, README | offen |

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

## Als Nächstes (Etappe 3)
- Licht pro Zone aus `layout.json` (warm 2700 K in Z4/Z5, neutral 4000 K in Z6), Spots auf M1 und die Sichtzone von M4.
- Materialien: Holzboden auf Warenflächen, Beton auf Kundenflächen, Filz-Paneele an der Bar, Wände Anthrazit mit orangen Akzenten.
