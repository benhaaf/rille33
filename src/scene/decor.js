// Detailreichere Einrichtung: Bar, Wanddeko (Poster, Neon, Tafeln, Pflanze) und Zusatzdetails an den Möbeln.
// Stil wie beim Zubehör: einfache Formen + selbst gezeichnete Canvas-Texturen, viel instanziert.
import * as THREE from 'three';
import { yawFacing } from './builder.js';
import { canvasTex, fitText, priceLabel } from './accessories.js';
import { COVER } from './covers.js';

const SANS = 'system-ui, -apple-system, sans-serif';
const CHALK = '"Chalkboard SE", "Marker Felt", "Comic Sans MS", system-ui, sans-serif';

// ---------- kleine Helfer ----------

// Fläche mit Textur in Store-Koordinaten; Vorderseite zeigt in dir
function plane(parent, material, w, h, x, y, z, dir, pitch = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, -z);
  m.rotation.set(pitch, yawFacing(...dir), 0, 'YXZ');
  parent.add(m);
  return m;
}

const lit = (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.8, ...extra });
const glow = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });

const MAT = {
  glas: new THREE.MeshStandardMaterial({ color: 0xdfe8ea, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false }),
  bier: new THREE.MeshStandardMaterial({ color: 0xd9901c, roughness: 0.2, transparent: true, opacity: 0.85 }),
  schaum: new THREE.MeshStandardMaterial({ color: 0xf6efe0, roughness: 0.9 }),
  led: new THREE.MeshBasicMaterial({ color: 0xffa24a, toneMapped: false }),
  ledWarm: new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }),
  blatt: new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.8, side: THREE.DoubleSide }),
  blattHell: new THREE.MeshStandardMaterial({ color: 0x5c8a45, roughness: 0.8, side: THREE.DoubleSide }),
  erde: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 }),
  tasse: new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 0.35 }),
  papier: new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.9 }),
};

// ---------- Texturen ----------
const TEX = {
  // Gig-Poster
  poster: (p) =>
    canvasTex(320, 448, (g, w, h) => {
      g.fillStyle = p.farbe;
      g.fillRect(0, 0, w, h);
      // grafisches Motiv: Platte / Schallwellen
      g.strokeStyle = p.akzent;
      g.globalAlpha = 0.9;
      g.lineWidth = 5;
      for (let r = 30; r < 150; r += 18) {
        g.beginPath();
        g.arc(w / 2, 170, r, Math.PI * 1.05, Math.PI * 1.95);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(w / 2, 170, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = p.akzent;
      g.beginPath();
      g.arc(w / 2, 170, 9, 0, Math.PI * 2);
      g.fill();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = p.akzent;
      fitText(g, p.titel, w / 2, 300, w - 30, 900, 46, SANS);
      g.fillStyle = '#f4f1ec';
      fitText(g, p.zeile, w / 2, 342, w - 40, 600, 22, SANS);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(0, 380, w, 40);
      g.fillStyle = '#f4f1ec';
      fitText(g, p.datum, w / 2, 400, w - 40, 700, 20, SANS);
      g.font = `600 13px ${SANS}`;
      g.fillText('RILLE 33 · PLATTENLADEN & LISTENING BAR', w / 2, 434);
    }),
  // Kreidetafel
  tafel: (t, wPx, hPx) =>
    canvasTex(wPx, hPx, (g, w, h) => {
      g.fillStyle = '#23302b';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.035)';
      for (let i = 0; i < 60; i++) g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 3);
      g.fillStyle = '#f2c230';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, t.titel, w / 2, 48, w - 40, 700, 44, CHALK);
      g.strokeStyle = 'rgba(244,241,236,0.6)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(40, 82);
      g.lineTo(w - 40, 82);
      g.stroke();
      g.fillStyle = '#f4f1ec';
      g.textAlign = 'left';
      const lh = Math.min(90, (h - 140) / t.zeilen.length);
      t.zeilen.forEach((z, i) => fitText(g, z, 34, 110 + lh / 2 + i * lh, w - 68, 400, Math.min(38, lh * 0.55), CHALK));
    }),
  // Neon-Schriftzug (Leuchtschrift mit Schein)
  neon: (text, color, weight = '700') =>
    canvasTex(1024, 256, (g, w, h) => {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let size = 170;
      g.font = `${weight} ${size}px ${SANS}`;
      while (g.measureText(text).width > w * 0.9) g.font = `${weight} ${(size -= 6)}px ${SANS}`;
      g.shadowColor = color;
      for (const [blur, alpha] of [[60, 0.5], [30, 0.7], [12, 1]]) {
        g.shadowBlur = blur;
        g.globalAlpha = alpha;
        g.strokeStyle = color;
        g.lineWidth = 10;
        g.strokeText(text, w / 2, h / 2);
      }
      g.globalAlpha = 1;
      g.shadowBlur = 8;
      g.fillStyle = '#fff3e3';
      g.fillText(text, w / 2, h / 2);
    }),
  // Flaschenetikett (Lathe-UV: u rundherum, v von unten nach oben)
  flasche: (glass, label, text, sub, band) =>
    canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = glass;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(w * 0.1, 0, w * 0.05, h);
      const [v0, v1] = band; // Etikett-Bereich (0 = unten)
      const y0 = h * (1 - v1);
      const y1 = h * (1 - v0);
      g.fillStyle = label;
      g.fillRect(w * 0.3, y0, w * 0.4, y1 - y0);
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.save();
      g.translate(w / 2, (y0 + y1) / 2);
      fitText(g, text, 0, -8, w * 0.38, 800, 22, SANS);
      fitText(g, sub, 0, 14, w * 0.38, 500, 12, SANS);
      g.restore();
    }),
  // Kühlschrank mit Glastür (Inhalt gezeichnet)
  kuehlschrank: () =>
    canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#1b2226';
      g.fillRect(0, 0, w, h);
      const cols = ['#e8772e', '#2e5a3a', '#c9d6d2', '#8a6a2a', '#b56576', '#f2c230'];
      for (let row = 0; row < 3; row++) {
        const y = 20 + row * 80;
        g.fillStyle = 'rgba(255,255,255,0.25)';
        g.fillRect(8, y + 66, w - 16, 3);
        for (let x = 16; x < w - 20; x += 24) {
          g.fillStyle = cols[(row * 7 + x) % cols.length];
          g.fillRect(x, y + 14, 16, 52);
          g.fillRect(x + 5, y + 4, 6, 12);
        }
      }
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, 'rgba(255,255,255,0.18)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }),
  // Untersetzer
  untersetzer: () =>
    canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#e8772e';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'RILLE', w / 2, 52, w - 20, 900, 30, SANS);
      fitText(g, '33', w / 2, 84, w - 20, 900, 30, SANS);
    }),
  // Aufsteller / Schild mit Titel und Unterzeile
  karte: (titel, sub, bg = '#1c1c1f', fg = '#f4f1ec', akzent = '#e8772e') =>
    canvasTex(384, 256, (g, w, h) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = akzent;
      g.fillRect(0, 0, w, 14);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = fg;
      fitText(g, titel, w / 2, 100, w - 30, 900, 58, SANS);
      g.fillStyle = akzent;
      const lines = String(sub).split('\n');
      lines.forEach((l, i) => fitText(g, l, w / 2, 165 + i * 34 - (lines.length - 1) * 17, w - 30, 600, 28, SANS));
    }),
  // Kundendisplay
  kunde: () =>
    canvasTex(256, 144, (g, w, h) => {
      g.fillStyle = '#12171a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8772e';
      g.fillRect(0, 0, w, 8);
      g.fillStyle = '#c9c4bc';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'Summe', w / 2, 40, w - 20, 500, 22, SANS);
      g.fillStyle = '#f4f1ec';
      fitText(g, '52,79 €', w / 2, 82, w - 20, 900, 46, SANS);
      g.fillStyle = '#3fbf7f';
      fitText(g, 'Danke & viel Spaß beim Hören!', w / 2, 124, w - 20, 600, 16, SANS);
    }),
  // Kartenterminal (Draufsicht): Display + Tastenfeld
  terminal: () =>
    canvasTex(128, 240, (g, w, h) => {
      g.fillStyle = '#1b1b1d';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#9fd3c7';
      g.fillRect(12, 12, w - 24, 64);
      g.fillStyle = '#12171a';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'Karte auflegen', w / 2, 44, w - 30, 700, 15, SANS);
      const cols = ['#3a3c40', '#3a3c40', '#3a3c40'];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 3; c++) {
          g.fillStyle = r === 3 ? ['#c0504d', '#3a3c40', '#3fbf7f'][c] : cols[c];
          g.fillRect(14 + c * 35, 92 + r * 36, 30, 28);
        }
    }),
  // Papiertüte mit Logo
  tuete: () =>
    canvasTex(256, 320, (g, w, h) => {
      g.fillStyle = '#b48a5a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.06)';
      for (let x = 0; x < w; x += 5) g.fillRect(x, 0, 2, h);
      g.fillStyle = '#1c1c1f';
      g.beginPath();
      g.arc(w / 2, 140, 62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8772e';
      g.beginPath();
      g.arc(w / 2, 140, 20, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'RILLE 33', w / 2, 250, w - 30, 900, 40, SANS);
    }),
  // Bodenaufkleber
  boden: () =>
    canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#f2c230';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1c1c1f';
      g.fillRect(12, 12, w - 24, h - 24);
      g.fillStyle = '#f2c230';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'BITTE HIER ANSTELLEN', w / 2, 90, w - 60, 900, 52, SANS);
      g.fillStyle = '#f4f1ec';
      fitText(g, 'Zubehör gibt’s beim Warten →', w / 2, 170, w - 60, 600, 32, SANS);
    }),
  // Kassen-Oberfläche
  kasse: () =>
    canvasTex(256, 170, (g, w, h) => {
      g.fillStyle = '#12171a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8772e';
      g.fillRect(0, 0, w, 20);
      g.fillStyle = '#1c1c1f';
      g.font = `700 12px ${SANS}`;
      g.fillText('RILLE 33 · KASSE', 8, 14);
      const items = [['LP Nachtbus', '24,99'], ['Innenhüllen', '14,90'], ['Bürste', '12,90']];
      g.font = `500 13px ${SANS}`;
      items.forEach(([a, b], i) => {
        g.fillStyle = '#d9d4cc';
        g.fillText(a, 10, 44 + i * 20);
        g.textAlign = 'right';
        g.fillText(b, w - 110, 44 + i * 20);
        g.textAlign = 'left';
      });
      g.fillStyle = '#f4f1ec';
      g.font = `800 16px ${SANS}`;
      g.fillText('Summe  52,79 €', 10, 128);
      const btn = ['Bar', 'Karte', 'Gutschein', 'Storno'];
      btn.forEach((b, i) => {
        g.fillStyle = i === 1 ? '#3fbf7f' : '#2c3438';
        g.fillRect(w - 100, 28 + i * 34, 90, 28);
        g.fillStyle = '#f4f1ec';
        g.font = `700 12px ${SANS}`;
        g.fillText(b, w - 92, 46 + i * 34);
      });
      g.fillStyle = '#2c3438';
      g.fillRect(10, 142, w - 120, 18);
    }),
};

// Flaschentypen: Profil (Radius, Höhe) von unten nach oben, Glas- und Etikettfarbe
const BOTTLES = [
  { name: 'NECKAR GIN', sub: 'Dry Gin · 0,7 l', glass: '#9fc9c2', label: '#f4f1ec', band: [0.18, 0.55], profile: [[0, 0], [0.036, 0], [0.038, 0.01], [0.038, 0.18], [0.03, 0.21], [0.014, 0.24], [0.013, 0.3], [0, 0.3]] },
  { name: 'RILLE RUM', sub: 'Dark · 0,7 l', glass: '#4a2a16', label: '#e8c47a', band: [0.2, 0.55], profile: [[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.16], [0.036, 0.19], [0.013, 0.22], [0.013, 0.28], [0, 0.28]] },
  { name: 'RIESLING', sub: 'Heilbronn · 2023', glass: '#3f5a2c', label: '#efe8d8', band: [0.12, 0.42], profile: [[0, 0], [0.034, 0], [0.036, 0.01], [0.036, 0.17], [0.022, 0.24], [0.012, 0.28], [0.012, 0.34], [0, 0.34]] },
  { name: 'KAFFEELIKÖR', sub: 'aus der Bar', glass: '#2a1a12', label: '#e8772e', band: [0.25, 0.6], profile: [[0, 0], [0.045, 0], [0.046, 0.01], [0.046, 0.14], [0.03, 0.17], [0.014, 0.19], [0.014, 0.24], [0, 0.24]] },
  { name: 'RILLE MATE', sub: 'Koffein · 0,5 l', glass: '#6b4a1a', label: '#f2c230', band: [0.2, 0.55], profile: [[0, 0], [0.03, 0], [0.032, 0.01], [0.032, 0.14], [0.02, 0.18], [0.012, 0.2], [0.012, 0.23], [0, 0.23]] },
];

export class Decor {
  constructor() {
    // Zusätzliche Materialien für den Möbel-Builder
    this.builderMaterials = { glas: MAT.glas, erde: MAT.erde };
    this.bottleKinds = BOTTLES.map((bt) => ({
      ...bt,
      geo: new THREE.LatheGeometry(bt.profile.map(([r, y]) => new THREE.Vector2(r, y)), 18),
      mat: lit(TEX.flasche(bt.glass, bt.label, bt.name, bt.sub, bt.band), { roughness: 0.25, metalness: 0.05 }),
    }));
    this.geo = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
      glas: new THREE.CylinderGeometry(0.034, 0.028, 0.14, 14, 1, true),
      sphere: new THREE.SphereGeometry(1, 10, 8),
      leaf: new THREE.PlaneGeometry(0.16, 0.5),
    };
    this.coasterMat = lit(TEX.untersetzer(), { roughness: 1 });
    this.fridgeMat = new THREE.MeshBasicMaterial({ map: TEX.kuehlschrank() });
    this.posMat = new THREE.MeshBasicMaterial({ map: TEX.kasse() });
    this.kundeMat = new THREE.MeshBasicMaterial({ map: TEX.kunde() });
    this.terminalMat = new THREE.MeshBasicMaterial({ map: TEX.terminal() });
    this.bagMat = lit(TEX.tuete(), { roughness: 1 });
  }

  bottle(b, kind, x, y, z) {
    const k = this.bottleKinds[kind];
    b.instance(`flasche-${kind}`, k.geo, k.mat, { x, y, z, yaw: Math.PI }); // Etikett (u = 0,5) zur Raumseite
  }

  glass(b, x, y, z, full = false) {
    b.instance('glas', this.geo.glas, MAT.glas, { x, y: y + 0.07, z });
    if (full) {
      b.instance('bier', this.geo.cyl, MAT.bier, { x, y: y + 0.055, z, scale: [0.029, 0.1, 0.029] });
      b.instance('schaum', this.geo.cyl, MAT.schaum, { x, y: y + 0.115, z, scale: [0.031, 0.02, 0.031] });
    }
  }

  card(parent, titel, sub, w, h, x, y, z, dir, opts = {}) {
    return plane(parent, lit(TEX.karte(titel, sub, opts.bg, opts.fg, opts.akzent)), w, h, x, y, z, dir, opts.pitch || 0);
  }

  // ======================= BAR =======================
  // Aufbau (von vorn): Hocker · Theke · Arbeitsgang fürs Personal · Rückbuffet an der Wand.
  // Zugang zum Arbeitsgang an beiden Thekenenden.
  bar(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    const extra = ctx.extra;
    const D = 15;
    const rb = m.rueckbuffet || { tiefe: 0.36, hoehe: 0.95 };

    // --- Theke ---
    b.box('korpus', [x1, x2, z1 + 0.05, z2], 0, h - 0.05);
    b.box('holz', [x1 - 0.06, x2 + 0.06, z1 - 0.08, z2 + 0.03], h - 0.05, h);
    // Lattenfront zur Gästeseite
    for (let x = x1 + 0.03; x < x2 - 0.02; x += 0.07) b.instance('bar-latte', this.geo.box, ctx.mats.holz, { x, y: (h - 0.12) / 2 + 0.05, z: z1 + 0.035, scale: [0.04, h - 0.17, 0.03] });
    b.box('schwarz', [x1, x2, z1 + 0.04, z1 + 0.05], 0.05, h - 0.07);
    // LED-Leiste unter der Arbeitsplatte
    b.instance('bar-led', this.geo.box, MAT.led, { x: (x1 + x2) / 2, y: h - 0.065, z: z1 - 0.06, scale: [x2 - x1 + 0.08, 0.012, 0.012] });
    // Fußstange
    b.box('chrom', [x1 + 0.05, x2 - 0.05, z1 - 0.12, z1 - 0.09], 0.2, 0.23);
    for (let x = x1 + 0.3; x < x2; x += 1.0) b.box('chrom', [x - 0.015, x + 0.015, z1 - 0.12, z1 + 0.04], 0.2, 0.225);

    // --- Mitarbeiterseite der Theke (zeigt zur Wand) ---
    // Unterbau: Spülmaschine, Kühlschubladen, offenes Gläserfach
    const E = 0.004;
    b.box('chrom', [x1 + 0.4, x1 + 1.0, z2, z2 + 0.02], 0.08, h - 0.12); // Gläserspüler
    b.box('schwarz', [x1 + 0.45, x1 + 0.95, z2 + 0.02, z2 + 0.022], h - 0.3, h - 0.26);
    for (const [a, e] of [[x1 + 1.1, x1 + 1.9], [x1 + 1.95, x1 + 2.75]]) {
      b.box('chrom', [a, e, z2, z2 + 0.02], 0.08, 0.5); // Kühlschubladen
      b.box('chrom', [a, e, z2, z2 + 0.02], 0.54, h - 0.12);
      b.box('schwarz', [a + 0.2, e - 0.2, z2 + 0.02, z2 + 0.035], 0.42, 0.44);
      b.box('schwarz', [a + 0.2, e - 0.2, z2 + 0.02, z2 + 0.035], h - 0.22, h - 0.2);
    }
    // offenes Fach mit Gläsern
    b.box('korpus', [x1 + 2.9, x2 - 0.5, z2 - 0.25, z2 + E], 0.45, 0.47);
    for (let x = x1 + 3.0; x < x2 - 0.6; x += 0.09) this.glass(b, x, 0.47, z2 - 0.12);
    // Spüle in der Arbeitsplatte + Wasserhahn
    const sxc = x1 + 0.7;
    b.box('chrom', [sxc - 0.25, sxc + 0.25, z2 - 0.3, z2 - 0.02], h, h + 0.006);
    b.box('schwarz', [sxc - 0.2, sxc + 0.2, z2 - 0.26, z2 - 0.06], h + 0.006, h + 0.008);
    b.geo('chrom', new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), sxc, h + 0.15, z2 - 0.28);
    b.geo('chrom', new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8), sxc, h + 0.3, z2 - 0.21, 0, Math.PI / 2);
    // Bodenmatte im Arbeitsgang
    const gz1 = z2 + 0.05;
    const gz2 = D - rb.tiefe - 0.05;
    b.box('schwarz', [x1 + 0.1, x2 - 0.1, gz1, gz2], 0, 0.012);

    // --- Auf der Theke ---
    // Zapfanlage mit drei Hähnen + Tropfschale (Hähne zeigen zum Personal)
    const tx = x1 + 1.5;
    const tz = (z1 + z2) / 2 + 0.05;
    b.box('chrom', [tx - 0.28, tx + 0.28, tz, tz + 0.18], h, h + 0.015);
    b.geo('chrom', new THREE.CylinderGeometry(0.035, 0.045, 0.42, 14), tx, h + 0.21, tz - 0.02);
    b.geo('chrom', new THREE.CylinderGeometry(0.03, 0.03, 0.5, 14), tx, h + 0.4, tz - 0.02, 0, 0, Math.PI / 2);
    const tapCols = ['akzent', 'weiss', 'schwarz'];
    [-0.18, 0, 0.18].forEach((o, i) => {
      b.geo('chrom', new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), tx + o, h + 0.35, tz + 0.03);
      b.box(tapCols[i], [tx + o - 0.018, tx + o + 0.018, tz - 0.055, tz - 0.02], h + 0.42, h + 0.58);
    });
    // Untersetzer mit Gläsern an den Hockerplätzen
    const coaster = new THREE.CylinderGeometry(0.05, 0.05, 0.004, 20);
    m.hocker_x.forEach((x, i) => {
      b.instance('untersetzer', coaster, this.coasterMat, { x, y: h + 0.002, z: z1 + 0.12, yaw: i });
      if (i % 2 === 0) this.glass(b, x, h + 0.004, z1 + 0.12, true);
      else b.instance('tasse', this.geo.cyl, MAT.tasse, { x, y: h + 0.03, z: z1 + 0.12, scale: [0.04, 0.06, 0.04] });
    });
    // Getränkekarten-Aufsteller
    for (const x of [x1 + 0.55, x2 - 1.3]) {
      const s = this.card(extra, 'KARTE', 'Kaffee · Bier · Wein\nRille Mate', 0.16, 0.11, x, h + 0.06, z1 + 0.2, [0, -1], { pitch: -0.25 });
      s.material.side = THREE.DoubleSide;
    }
    // Kassen-Tablet (zum Personal)
    b.geo('schwarz', new THREE.BoxGeometry(0.26, 0.18, 0.012), x2 - 0.35, h + 0.1, z2 - 0.18, Math.PI, -0.5);
    b.geo('metall', new THREE.BoxGeometry(0.05, 0.08, 0.05), x2 - 0.35, h + 0.04, z2 - 0.2);
    // Pflanze am Thekenende
    this.plant(b, x1 + 0.2, h, (z1 + z2) / 2, 0.45);

    // --- Rückbuffet an der Wand ---
    const bz = D - rb.tiefe;
    const ey = rb.hoehe;
    // Kühlschrank mit Glastür als Teil des Rückbuffets (rechts)
    const fx1 = x2 - 0.62;
    const fx2 = x2 - 0.02;
    b.box('korpus', [x1, fx1 - 0.02, bz, D], 0, ey - 0.04);
    b.box('holz', [x1 - 0.02, fx1, bz - 0.02, D], ey - 0.04, ey);
    // Schranktüren mit Griffen (zum Personal)
    for (let x = x1 + 0.05; x < fx1 - 0.4; x += 0.6) {
      b.box('holzHell', [x, x + 0.56, bz - 0.012, bz], 0.08, ey - 0.08);
      b.box('metall', [x + 0.24, x + 0.32, bz - 0.03, bz - 0.012], ey - 0.2, ey - 0.18);
    }
    b.box('metall', [fx1, fx2, bz - 0.2, D], 0, 1.85);
    b.box('schwarz', [fx1 + 0.03, fx2 - 0.03, bz - 0.21, bz - 0.2], 0.1, 1.72);
    plane(extra, this.fridgeMat, fx2 - fx1 - 0.1, 1.5, (fx1 + fx2) / 2, 0.93, bz - 0.215, [0, -1]);
    b.box('chrom', [fx1 + 0.05, fx1 + 0.07, bz - 0.25, bz - 0.215], 0.7, 1.2); // Griff
    this.card(extra, 'KALT', 'Rille Mate · Bier · Limo', 0.4, 0.15, (fx1 + fx2) / 2, 1.79, bz - 0.212, [0, -1], { bg: '#e8772e', fg: '#1c1c1f', akzent: '#1c1c1f' });
    ctx.colliders.push([x1, fx1, bz - 0.02, D], [fx1, fx2, bz - 0.22, D]);
    // Espressomaschine
    const ex = x1 + 0.45;
    const ez = D - rb.tiefe / 2;
    b.box('chrom', [ex - 0.32, ex + 0.32, ez - 0.12, ez + 0.12], ey, ey + 0.38);
    b.box('schwarz', [ex - 0.33, ex + 0.33, ez - 0.13, ez - 0.11], ey + 0.3, ey + 0.34);
    b.box('akzent', [ex - 0.33, ex + 0.33, ez - 0.13, ez - 0.12], ey + 0.02, ey + 0.05);
    for (const o of [-0.16, 0.16]) {
      b.geo('chrom', new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), ex + o, ey + 0.22, ez - 0.15);
      b.box('schwarz', [ex + o - 0.015, ex + o + 0.015, ez - 0.3, ez - 0.17], ey + 0.19, ey + 0.21); // Siebträgergriff
      b.instance('tasse', this.geo.cyl, MAT.tasse, { x: ex + o, y: ey + 0.03, z: ez - 0.15, scale: [0.03, 0.05, 0.03] });
    }
    for (let i = 0; i < 6; i++) b.instance('tasse', this.geo.cyl, MAT.tasse, { x: ex - 0.25 + i * 0.1, y: ey + 0.41, z: ez, scale: [0.03, 0.05, 0.03] });
    // Kaffeemühle
    const gx = ex + 0.52;
    b.box('schwarz', [gx - 0.08, gx + 0.08, ez - 0.1, ez + 0.08], ey, ey + 0.3);
    b.geo('glas', new THREE.CylinderGeometry(0.08, 0.04, 0.2, 14), gx, ey + 0.4, ez - 0.01);
    b.geo('erde', new THREE.CylinderGeometry(0.06, 0.035, 0.1, 14), gx, ey + 0.36, ez - 0.01);
    // DJ-Plattenspieler mit Boxen + „Jetzt läuft“
    const dx = x1 + 2.2;
    b.box('schwarz', [dx - 0.25, dx + 0.25, ez - 0.17, ez + 0.13], ey, ey + 0.09);
    b.geo('schwarz', new THREE.CylinderGeometry(0.15, 0.15, 0.02, 28), dx - 0.03, ey + 0.1, ez - 0.02);
    b.geo('akzent', new THREE.CylinderGeometry(0.045, 0.045, 0.022, 16), dx - 0.03, ey + 0.1, ez - 0.02);
    b.geo('chrom', new THREE.BoxGeometry(0.012, 0.012, 0.22), dx + 0.16, ey + 0.12, ez - 0.02, 0.3);
    for (const o of [-0.5, 0.5]) {
      b.box('korpus', [dx + o - 0.11, dx + o + 0.11, ez - 0.13, ez + 0.12], ey, ey + 0.34);
      b.geo('schwarz', new THREE.CylinderGeometry(0.075, 0.075, 0.01, 16), dx + o, ey + 0.12, ez - 0.135, 0, Math.PI / 2);
      b.geo('schwarz', new THREE.CylinderGeometry(0.035, 0.035, 0.01, 12), dx + o, ey + 0.27, ez - 0.135, 0, Math.PI / 2);
    }
    ctx.covers.front(b, { x: dx + 0.85, y: ey + COVER / 2 + 0.01, z: D - 0.06, yaw: 0, pitch: -0.1 });
    this.card(extra, 'JETZT LÄUFT', 'an der Bar', 0.2, 0.13, dx + 0.85, ey + 0.05, D - 0.24, [0, -1], { pitch: -0.4 });

    // --- Wandregale mit Flaschen und Gläsern, LED darunter ---
    const shelves = [1.55, 1.86];
    const sx1 = x1 + 1.1; // links steht die Espressomaschine
    const sx2 = fx1 - 0.08; // rechts der Kühlschrank
    shelves.forEach((y, si) => {
      b.box('holz', [sx1, sx2, D - 0.24, D], y - 0.03, y);
      b.instance('bar-ledwarm', this.geo.box, MAT.ledWarm, { x: (sx1 + sx2) / 2, y: y - 0.035, z: D - 0.2, scale: [sx2 - sx1 - 0.1, 0.006, 0.012] });
      let x = sx1 + 0.12;
      let n = si * 3;
      while (x < sx2 - 0.1) {
        if (si === 0 && x > x1 + 1.8 && x < x1 + 2.7) {
          // Gläserreihe in der Mitte des unteren Regals
          this.glass(b, x, y, D - 0.12);
          x += 0.09;
          continue;
        }
        this.bottle(b, n++ % BOTTLES.length, x, y, D - 0.12);
        x += 0.1 + ctx.rand() * 0.035;
      }
    });

    // --- Barhocker mit Lehne ---
    for (const x of m.hocker_x) {
      const z = m.hocker_z;
      b.geo('metall', new THREE.CylinderGeometry(0.21, 0.23, 0.03, 20), x, 0.015, z);
      b.geo('metall', new THREE.CylinderGeometry(0.025, 0.025, 0.74, 10), x, 0.39, z);
      b.geo('chrom', new THREE.TorusGeometry(0.16, 0.012, 6, 22), x, 0.32, z, 0, Math.PI / 2);
      b.geo('polster', new THREE.CylinderGeometry(0.2, 0.18, 0.08, 22), x, 0.8, z);
      // Rückenlehne auf der Gästeseite: zwei Streben + Polster
      for (const o of [-0.12, 0.12]) b.geo('chrom', new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), x + o, 0.97, z - 0.16);
      b.box('polster', [x - 0.17, x + 0.17, z - 0.19, z - 0.15], 1.02, 1.14);
    }
  }

  // ======================= KASSE =======================
  // Personal steht zwischen Theke und Frontwand (z < z1), Kunden auf der Ladenseite (z > z2).
  kasse(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    const extra = ctx.extra;
    const xc = x1 + (x2 - x1) * 0.55;

    // --- Theke ---
    b.box('korpus', [x1, x2, z1 + 0.05, z2 - 0.04], 0, h - 0.05);
    b.box('holz', [x1 - 0.05, x2 + 0.05, z1 - 0.03, z2 + 0.1], h - 0.05, h);
    // Lattenfront zur Kundenseite + LED unter der Platte
    for (let x = x1 + 0.03; x < x2 - 0.02; x += 0.07) b.instance('kasse-latte', this.geo.box, ctx.mats.holz, { x, y: (h - 0.12) / 2 + 0.05, z: z2 - 0.025, scale: [0.04, h - 0.17, 0.03] });
    b.instance('kasse-led', this.geo.box, MAT.led, { x: (x1 + x2) / 2, y: h - 0.065, z: z2 + 0.08, scale: [x2 - x1 + 0.08, 0.012, 0.012] });
    b.box('korpus', [(x1 + x2) / 2 - 0.42, (x1 + x2) / 2 + 0.42, z2 - 0.01, z2 + 0.005], 0.35, 0.7);
    this.card(extra, 'RILLE 33', 'Plattenladen & Listening Bar', 0.8, 0.3, (x1 + x2) / 2, 0.525, z2 + 0.007, [0, 1]);
    // Kassenlade und Fach auf der Personalseite
    b.box('schwarz', [xc - 0.22, xc + 0.22, z1 + 0.03, z1 + 0.05], h - 0.25, h - 0.1);
    b.box('metall', [xc - 0.05, xc + 0.05, z1 + 0.01, z1 + 0.03], h - 0.19, h - 0.17);
    b.box('korpus', [x1 + 0.05, x1 + 0.9, z1 + 0.05, z1 + 0.06], 0.1, 0.12);

    // --- Kassensystem ---
    // Bildschirm zum Personal
    b.box('metall', [xc - 0.04, xc + 0.04, z1 + 0.3, z1 + 0.38], h, h + 0.14);
    b.box('metall', [xc - 0.12, xc + 0.12, z1 + 0.22, z1 + 0.46], h, h + 0.012);
    b.geo('schwarz', new THREE.BoxGeometry(0.36, 0.25, 0.025), xc, h + 0.27, z1 + 0.34, 0, -0.25);
    plane(extra, this.posMat, 0.32, 0.21, xc, h + 0.27, z1 + 0.325, [0, -1], -0.25);
    // Kundendisplay (zum Kunden)
    const kx = xc + 0.34;
    b.geo('metall', new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), kx, h + 0.11, z1 + 0.42);
    b.geo('schwarz', new THREE.BoxGeometry(0.2, 0.12, 0.02), kx, h + 0.26, z1 + 0.43, 0, 0.2);
    plane(extra, this.kundeMat, 0.18, 0.1, kx, h + 0.26, z1 + 0.442, [0, 1], 0.2);
    // Bondrucker mit Bon
    const px = xc - 0.35;
    b.box('schwarz', [px - 0.08, px + 0.08, z1 + 0.25, z1 + 0.45], h, h + 0.12);
    b.geo('weiss', new THREE.BoxGeometry(0.07, 0.16, 0.002), px, h + 0.18, z1 + 0.3, 0, -0.3);
    // Kartenterminal auf der Kundenseite
    const tx = xc + 0.1;
    b.geo('schwarz', new THREE.BoxGeometry(0.09, 0.03, 0.17), tx, h + 0.03, z2 - 0.15, 0, 0.3);
    plane(extra, this.terminalMat, 0.08, 0.15, tx, h + 0.052, z2 - 0.153, [0, 1], -Math.PI / 2 + 0.3);

    // --- Auf der Theke ---
    // bedruckte Tragetaschen (stehend) am linken Ende
    for (let i = 0; i < 3; i++) {
      b.instance('tragetasche', this.geo.box, this.bagMat, { x: x1 + 0.2 + i * 0.06, y: h + 0.17, z: z1 + 0.35 + i * 0.03, yaw: 0.15 - i * 0.08, scale: [0.26, 0.32, 0.1] });
    }
    // Impulskorb mit Stickern und Buttons (zum Kunden)
    const ix = x2 - 0.55;
    const iz = z2 - 0.18;
    b.box('holz', [ix - 0.17, ix + 0.17, iz - 0.1, iz + 0.1], h, h + 0.012);
    for (const [a, e, c, d] of [[-0.17, 0.17, -0.1, -0.09], [-0.17, 0.17, 0.09, 0.1], [-0.17, -0.16, -0.1, 0.1], [0.16, 0.17, -0.1, 0.1]]) b.box('holz', [ix + a, ix + e, iz + c, iz + d], h, h + 0.08);
    const cols = ['#e8772e', '#f2c230', '#2f6fd6', '#3fbf7f', '#b56576', '#f4f1ec'];
    for (let i = 0; i < 26; i++) {
      const r = ctx.rand;
      b.instance('button', this.geo.cyl, MAT.papier, { x: ix - 0.13 + r() * 0.26, y: h + 0.02 + r() * 0.03, z: iz - 0.07 + r() * 0.14, pitch: r() * 0.6, roll: r() * 0.6, scale: [0.022, 0.006, 0.022], color: cols[i % cols.length] });
    }
    this.card(extra, 'STICKER & BUTTONS', 'ab 1 €', 0.2, 0.09, ix, h + 0.13, iz + 0.101, [0, 1], { pitch: 0.2 });
    // Gutschein-Aufsteller
    this.card(extra, 'GUTSCHEIN', 'Das Geschenk für\nPlattenfans', 0.24, 0.16, x2 - 0.15, h + 0.1, z2 - 0.05, [0, 1], { pitch: 0.25, bg: '#e8772e', fg: '#1c1c1f', akzent: '#1c1c1f' });

    // --- Hängendes Schild ---
    const sx = (x1 + x2) / 2;
    const sz = (z1 + z2) / 2;
    for (const o of [-0.4, 0.4]) b.box('schwarz', [sx + o - 0.004, sx + o + 0.004, sz - 0.004, sz + 0.004], 2.55, 3.2);
    b.box('korpus', [sx - 0.5, sx + 0.5, sz - 0.02, sz + 0.02], 2.3, 2.58);
    this.card(extra, 'KASSE', 'Karte · Bar · Gutschein', 0.96, 0.26, sx, 2.44, sz + 0.022, [0, 1]);
    this.card(extra, 'KASSE', 'Karte · Bar · Gutschein', 0.96, 0.26, sx, 2.44, sz - 0.022, [0, -1]);

    // --- Bodenaufkleber für die Warteschlange (an der Zubehör-Gondel) ---
    const floor = plane(extra, lit(TEX.boden()), 0.7, 0.35, x1 - 0.35, 0.007, z2 + 0.9, [0, 1], -Math.PI / 2);
    floor.rotation.set(-Math.PI / 2, 0, Math.PI); // lesbar für Wartende, die zur Kasse schauen

    // --- Regal „Abholung“ hinter der Kasse an der Frontwand ---
    const ax1 = x1 + 0.3;
    const ax2 = x2 - 0.2;
    const az1 = 0.02;
    const az2 = 0.36;
    for (const x of [ax1, ax2 - 0.03]) b.box('holz', [x, x + 0.03, az1, az2], 0, 1.85);
    const levels = [0.08, 0.6, 1.12, 1.62];
    levels.forEach((y, li) => {
      b.box('holz', [ax1, ax2, az1, az2], y - 0.025, y);
      if (li === levels.length - 1) return;
      for (let x = ax1 + 0.12; x < ax2 - 0.1; x += 0.023) {
        if (ctx.rand() < 0.12) continue;
        ctx.covers.record(b, { x, y: y + COVER / 2, z: (az1 + az2) / 2, yaw: Math.PI / 2, pitch: 0 });
        // Namenszettel ragen heraus
        if (ctx.rand() < 0.2) b.instance('zettel', this.geo.box, MAT.papier, { x, y: y + COVER + 0.03, z: (az1 + az2) / 2 + 0.05, scale: [0.004, 0.06, 0.05] });
      }
    });
    b.box('korpus', [ax1, ax2, az1, az2], 1.85, 1.88);
    this.card(extra, 'ABHOLUNG', 'Vorbestellungen · nach Namen', 0.8, 0.26, (ax1 + ax2) / 2, 2.05, az2 - 0.14, [0, 1]);
    ctx.colliders.push([ax1, ax2, 0, az2]);
  }

  // ======================= Wanddeko =======================
  wall(ctx, layout) {
    const { extra } = ctx;
    const b = ctx.builder;
    const colliders = [];
    for (const e of layout.wanddeko?.elemente || []) {
      const dir = e.richtung || [0, -1];
      if (e.typ === 'lattenwand') {
        const [ax, az] = e.von;
        const [bx, bz] = e.bis;
        const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
        const len = alongX ? bx - ax : bz - az;
        const off = 0.02; // Abstand vor der Wand
        for (let s = 0.03; s < len; s += 0.075) {
          const x = alongX ? ax + s : ax + dir[0] * off;
          const z = alongX ? az + dir[1] * off : az + s;
          b.instance('latte-wand', this.geo.box, ctx.mats.holz, { x, y: e.oben / 2, z, yaw: alongX ? 0 : Math.PI / 2, scale: [0.045, e.oben, 0.025] });
        }
        const [cx1, cx2] = alongX ? [ax, bx] : [ax + dir[0] * 0.05 - 0.03, ax + dir[0] * 0.05 + 0.03];
        const [cz1, cz2] = alongX ? [az + dir[1] * 0.05 - 0.03, az + dir[1] * 0.05 + 0.03] : [az, bz];
        b.box('holz', [Math.min(cx1, cx2), Math.max(cx1, cx2), Math.min(cz1, cz2), Math.max(cz1, cz2)], e.oben, e.oben + 0.03);
        b.box('akzent', [Math.min(cx1, cx2), Math.max(cx1, cx2), Math.min(cz1, cz2), Math.max(cz1, cz2)], e.oben + 0.03, e.oben + 0.045);
      } else if (e.typ === 'poster') {
        const [x, z] = e.pos;
        const w = 0.52;
        const h = 0.73;
        // Rahmen
        b.instance('rahmen', this.geo.box, ctx.mats.schwarz, { x: x + dir[0] * 0.012, y: e.y, z: z + dir[1] * 0.012, yaw: yawFacing(...dir), scale: [w + 0.05, h + 0.05, 0.02] });
        plane(extra, lit(TEX.poster(e)), w, h, x + dir[0] * 0.024, e.y, z + dir[1] * 0.024, dir);
      } else if (e.typ === 'tafel') {
        const [x, z] = e.pos;
        b.instance('tafelrahmen', this.geo.box, ctx.mats.holz, { x: x + dir[0] * 0.012, y: e.y, z: z + dir[1] * 0.012, yaw: yawFacing(...dir), scale: [e.breite + 0.06, e.hoehe + 0.06, 0.024] });
        const px = 512;
        plane(extra, lit(TEX.tafel(e, px, Math.round((px * e.hoehe) / e.breite)), { roughness: 1 }), e.breite, e.hoehe, x + dir[0] * 0.026, e.y, z + dir[1] * 0.026, dir);
      } else if (e.typ === 'neon') {
        const [x, z] = e.pos;
        const tex = TEX.neon(e.text, e.farbe, e.schrift || '700');
        plane(extra, glow(tex), e.hoehe * 4, e.hoehe, x + dir[0] * 0.02, e.y, z + dir[1] * 0.02, dir).renderOrder = 4;
      } else if (e.typ === 'pflanze') {
        const [x, z] = e.pos;
        this.plant(b, x, 0, z, 1);
        colliders.push([x - 0.25, x + 0.25, z - 0.25, z + 0.25]);
      }
    }
    return colliders;
  }

  // Topfpflanze: Topf + Blätter (s = Größenfaktor)
  plant(b, x, y, z, s = 1) {
    b.geo('korpus', new THREE.CylinderGeometry(0.2 * s, 0.15 * s, 0.4 * s, 16), x, y + 0.2 * s, z);
    b.instance('erde', this.geo.cyl, MAT.erde, { x, y: y + 0.39 * s, z, scale: [0.18 * s, 0.02, 0.18 * s] });
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a = i * 2.399 + (i % 3) * 0.2; // goldener Winkel → gleichmäßig verteilt
      const tilt = 0.35 + (i % 5) * 0.16; // Blätter fächern nach außen
      const len = (0.55 + (i % 6) * 0.09) * s;
      b.instance(i % 2 ? 'blatt' : 'blatt2', this.geo.leaf, i % 2 ? MAT.blatt : MAT.blattHell, {
        x: x + Math.sin(a) * (0.05 + len * 0.3 * Math.sin(tilt)) * s,
        y: y + 0.4 * s + len * 0.38 * Math.cos(tilt),
        z: z - Math.cos(a) * (0.05 + len * 0.3 * Math.sin(tilt)) * s, // Store-z ist Three-(-z): Versatz in Neigungsrichtung
        yaw: a,
        pitch: tilt,
        scale: [s * 0.55, len * 1.5, 1],
      });
    }
  }

  // ======================= Zusatzdetails an den Möbeln =======================
  details(b, m, ctx) {
    const extra = ctx.extra;
    const [x1, x2, z1, z2] = m.rechteck || [0, 0, 0, 0];
    switch (m.typ) {
      case 'hoerstation':
        m.stationen.forEach(([x, z], i) => {
          const h = m.hoehe;
          // Acryl-Aufsteller mit Nummer
          b.geo('glas', new THREE.BoxGeometry(0.16, 0.12, 0.006), x - 0.1, h + 0.07, z - 0.24, 0, -0.2);
          this.card(extra, `HÖRSTATION ${i + 1}`, 'Jetzt läuft:\nWunschplatte', 0.15, 0.1, x - 0.1, h + 0.075, z - 0.244, [0, -1], { pitch: -0.2 });
          // Plattenhülle, die gerade gespielt wird
          ctx.covers.front(b, { x: x + 0.2, y: h + COVER / 2 - 0.02, z: z + 0.18, yaw: -0.4, pitch: -0.25 });
        });
        break;
      case 'neuheiten-tisch': {
        const h = m.hoehe;
        const isFirst = m.id === 'M2';
        const zc = (z1 + z2) / 2;
        b.box('metall', [x1 + 0.08, x1 + 0.11, zc - 0.015, zc + 0.015], h, h + 0.2);
        this.card(extra, isFirst ? 'NEUHEITEN' : 'CHARTS', isFirst ? 'Diese Woche frisch' : 'Top 10 der Woche', 0.34, 0.22, x1 + 0.075, h + 0.3, zc, [-1, 0]);
        this.card(extra, isFirst ? 'NEUHEITEN' : 'CHARTS', isFirst ? 'Diese Woche frisch' : 'Top 10 der Woche', 0.34, 0.22, x1 + 0.115, h + 0.3, zc, [1, 0]);
        break;
      }
      case 'digging-kiste': {
        const base = 0.55;
        const n = Math.round((z2 - z1) / 0.4);
        const L = (z2 - z1) / n;
        const xm = (x1 + x2) / 2;
        // orange Trennkarten zwischen den Fächern
        for (let i = 0; i < n; i++) {
          for (const x of [(x1 + xm) / 2, (xm + x2) / 2]) {
            b.instance('trennkarte', this.geo.box, ctx.mats.akzent, { x, y: base + 0.25, z: z1 + i * L + 0.12, scale: [0.3, 0.12, 0.004] });
          }
        }
        const label = m.id === 'M5' ? 'A – M' : 'N – Z';
        b.box('metall', [xm - 0.015, xm + 0.015, z1 + 0.05, z1 + 0.08], base, base + 0.32);
        this.card(extra, `SECOND-HAND ${label}`, 'ab 5 € · geprüft & gereinigt', 0.44, 0.21, xm, base + 0.42, z1 + 0.045, [0, -1], { bg: '#8b5a2b' });
        break;
      }
      case 'hardware-wand': {
        const L = (z2 - z1) / m.marken.length;
        m.marken.forEach((brand, i) => {
          const zc = z1 + i * L + L / 2;
          [[1.05, 'TT-1', '349 €'], [1.5, 'TT-2 Pro', '599 €']].forEach(([y, model, price], k) => {
            for (const [o, suffix, p] of [[-0.26, '', price], [0.26, ' Bluetooth', k ? '649 €' : '399 €']]) {
              plane(extra, priceLabel(`${brand.name} ${model}${suffix}`, p), 0.42, 0.052, x1 + 0.025, y - 0.055, zc + o, [-1, 0]);
            }
          });
        });
        break;
      }
      case 'beratungstisch': {
        const h = m.hoehe;
        const zc = (z1 + z2) / 2;
        // Dreieck-Aufsteller (Tent-Card)
        this.card(extra, 'BERATUNG', 'Wir helfen gern –\nauch beim Aufbau', 0.3, 0.2, x1 + 0.12, h + 0.1, z1 + 0.25, [-1, 0], { pitch: -0.35 });
        // Prospekte
        for (let i = 0; i < 4; i++) b.instance('prospekt', this.geo.box, i % 2 ? ctx.mats.akzent : MAT.papier, { x: x1 + 0.2, y: h + 0.004 + i * 0.004, z: z2 - 0.3 + i * 0.01, yaw: i * 0.15, scale: [0.21, 0.003, 0.3] });
        // Hocker auf Kundenseite
        const sx = x1 - 0.35;
        b.geo('metall', new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), sx, 0.31, zc);
        b.geo('metall', new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), sx, 0.01, zc);
        b.geo('polster', new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), sx, 0.64, zc);
        ctx.colliders.push([sx - 0.18, sx + 0.18, zc - 0.18, zc + 0.18]);
        break;
      }
      default:
        break;
    }
  }
}
