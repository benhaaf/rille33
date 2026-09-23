# Fortschritt

## Plan (Etappen aus SPEC Kap. 11 + iPad-Anforderungen)

| Etappe | Inhalt | Status |
|---|---|---|
| 1 | Projekt-Setup, leerer Raum (Wände, Eingang, Schaufenster, Notausgang, Lagerwand), Controller-/Tastatur-/Touch-Steuerung mit Kollision, GitHub Pages, PWA/Offline | ✅ fertig |
| 2 | `layout.json` vollständig: Zonen Z1–Z8, Möbel M1–M12, Plattencover, Regalzonen + Höhenmarken | ⏳ als Nächstes |
| 3 | Licht und Materialien je Zone (aus `layout.json`), Spots, Filz, Holz/Beton | offen |
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

## Als Nächstes (Etappe 2)
- Zonen als halbtransparente Bodenflächen mit Namen, Möbel M1–M12 aus `layout.json`, Plattencover, Genre-Schilder, Regalzonen an M4.
- Kollision automatisch aus den Möbeln erzeugen.
