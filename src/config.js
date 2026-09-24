// Steuerungs- und Darstellungs-Einstellungen. Hier darf ohne Code-Kenntnis gedreht werden.
export default {
  augenhoehe: 1.65,
  spielerRadius: 0.25,
  gehtempo: 1.6, // m/s
  sprinttempo: 3.4, // m/s bei voll gedrücktem R2 / Shift

  gamepad: {
    deadzone: 0.15,
    blickGeschwindigkeit: 2.4, // rad/s bei vollem Stickausschlag
    invertY: false,
  },
  maus: {
    sensitivitaet: 0.0022, // rad pro Pixel
  },
  touch: {
    joystickRadius: 60, // px
    blickSensitivitaet: 0.005, // rad pro Pixel Wischweg
  },

  grafik: {
    // Begrenzt die Auflösung auf Retina-Displays – wichtig für 60 fps auf dem iPad.
    maxPixelRatio: 1.5,
    antialias: true,
    fov: 70,
    // Abgerundete Möbelkanten in Metern (0 = eckig, spart Rechenleistung)
    kantenRadius: 0.012,
    // Fällt die Bildrate länger unter diesen Wert, wird die Auflösung automatisch etwas gesenkt
    dynamischeAufloesung: true,
    zielFps: 50,
    minPixelRatio: 1,
    // true = weniger Lichtquellen, keine Spots (falls das iPad unter 60 fps fällt). Auch per URL: ?licht=einfach
    lichtEinfach: false,
  },

  // FPS-Anzeige oben links (zum Messen per URL ?fps=1 einschalten)
  zeigeFps: false,
};
