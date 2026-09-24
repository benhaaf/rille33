// Zubehör an der Gondel (M12) und Kartons im Lager: erkennbare Formen mit eigenen, gezeichneten Texturen.
import * as THREE from 'three';
import { yawFacing } from './builder.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const font = (weight, px, fam = 'system-ui, -apple-system, sans-serif') => `${weight} ${px}px ${fam}`;

export function fitText(g, text, x, y, maxW, weight, px, fam) {
  let size = px;
  g.font = font(weight, size, fam);
  while (g.measureText(text).width > maxW && size > 8) {
    size -= 1;
    g.font = font(weight, size, fam);
  }
  g.fillText(text, x, y);
}

// ---------- Texturen ----------
const TEX = {
  // Innenhüllen-Packung: weißes Papier mit runder Aussparung, Banderole
  sleeves: () =>
    canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#f3f0ea';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#c9c4bc';
      g.beginPath();
      g.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1c1c1f';
      g.beginPath();
      g.arc(w / 2, h / 2, 26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8772e';
      g.fillRect(0, 196, w, 44);
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'INNENHÜLLEN · 50 Stk.', w / 2, 211, w - 20, 800, 20);
      fitText(g, 'antistatisch · 12"', w / 2, 231, w - 20, 500, 14);
    }),
  // Außenhüllen (Schutzhüllen): klare Folie
  outer: () =>
    canvasTex(256, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#d9e3ea');
      grad.addColorStop(0.5, '#f2f6f8');
      grad.addColorStop(1, '#cdd8e0');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = 6;
      for (let i = -1; i < 4; i++) {
        g.beginPath();
        g.moveTo(i * 80, 0);
        g.lineTo(i * 80 + 120, h);
        g.stroke();
      }
      g.fillStyle = '#1c1c1f';
      g.fillRect(16, 16, 150, 40);
      g.fillStyle = '#f4f1ec';
      g.textBaseline = 'middle';
      fitText(g, 'SCHUTZHÜLLEN', 26, 30, 132, 800, 16);
      fitText(g, '25 Stk. · PE', 26, 47, 132, 400, 12);
    }),
  // Plattenbürste: Holzgriff mit Aufdruck
  brush: () =>
    canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#5a3a24';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let y = 6; y < h; y += 7) {
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + 1);
        g.stroke();
      }
      g.fillStyle = '#d8b25a';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'RILLE 33 · CARBON', w / 2, h / 2, w - 20, 800, 26);
    }),
  // Reinigungsspray: Etikett
  spray: () =>
    canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = '#2c5d8a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f1ec';
      g.fillRect(0, 34, w, 60);
      g.fillStyle = '#2c5d8a';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'VINYL CLEAN', w / 2, 56, w - 16, 900, 28);
      fitText(g, 'Reinigungsflüssigkeit · 250 ml', w / 2, 80, w - 16, 500, 13);
    }),
  // Slipmat: Filz mit Logo
  slipmat: (color) =>
    canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = color;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e8772e';
      g.lineWidth = 10;
      g.beginPath();
      g.arc(w / 2, h / 2, 92, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#f4f1ec';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'RILLE 33', w / 2, h / 2 - 20, 150, 900, 34);
      fitText(g, 'SLIPMAT', w / 2, h / 2 + 18, 150, 600, 18);
      g.fillStyle = '#1c1c1f';
      g.beginPath();
      g.arc(w / 2, h / 2 + 52, 7, 0, Math.PI * 2);
      g.fill();
    }),
  // Tonabnehmer-Nadel: Schachtel
  stylus: () =>
    canvasTex(128, 192, (g, w, h) => {
      g.fillStyle = '#1c1c1f';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8772e';
      g.fillRect(0, h - 46, w, 46);
      g.strokeStyle = '#d9d4cc';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(34, 50);
      g.lineTo(84, 90);
      g.lineTo(88, 104);
      g.stroke();
      g.fillStyle = '#f4f1ec';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'NADEL', w / 2, 128, w - 12, 800, 20);
      g.fillStyle = '#1c1c1f';
      fitText(g, 'Diamant', w / 2, h - 23, w - 12, 700, 16);
    }),
  // Tote Bag: Baumwolle naturfarben mit Druck
  tote: () =>
    canvasTex(256, 280, (g, w, h) => {
      g.fillStyle = '#e6dcc8';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      g.fillStyle = '#1c1c1f';
      g.beginPath();
      g.arc(w / 2, 118, 64, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.15)';
      g.lineWidth = 1.5;
      for (let r = 26; r < 62; r += 5) {
        g.beginPath();
        g.arc(w / 2, 118, r, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = '#e8772e';
      g.beginPath();
      g.arc(w / 2, 118, 20, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, 'RILLE 33', w / 2, 218, w - 30, 900, 40);
      fitText(g, 'Plattenladen · Heilbronn', w / 2, 250, w - 30, 500, 16);
    }),
  // Umzugskarton mit Klebeband und Beschriftung
  carton: (label) =>
    canvasTex(256, 192, (g, w, h) => {
      g.fillStyle = '#b48a5a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.06)';
      for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 2, h);
      g.fillStyle = 'rgba(230,220,190,0.7)';
      g.fillRect(w / 2 - 22, 0, 44, h);
      g.fillStyle = '#f3f0ea';
      g.fillRect(28, h / 2 - 30, w - 56, 60);
      g.fillStyle = '#1c1c1f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, label, w / 2, h / 2, w - 70, 800, 28, '"Marker Felt", "Comic Sans MS", system-ui, sans-serif');
    }),
};

// Beschriftung mit Preis an der Regalkante
export function priceLabel(text, price) {
  const tex = canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = '#f4f1ec';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8772e';
    g.fillRect(0, 0, 10, h);
    g.fillStyle = '#1c1c1f';
    g.textBaseline = 'middle';
    fitText(g, text, 24, h / 2 + 1, w - 170, 700, 30);
    g.textAlign = 'right';
    g.fillStyle = '#c0501f';
    fitText(g, price, w - 14, h / 2 + 1, 140, 900, 32);
  });
  return new THREE.MeshBasicMaterial({ map: tex });
}

// Materialien werden einmal erzeugt und von allen Instanzen geteilt
export class AccessoryKit {
  constructor() {
    const std = (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.8, ...extra });
    this.mat = {
      sleeves: std(TEX.sleeves()),
      outer: std(TEX.outer(), { roughness: 0.35 }),
      brush: std(TEX.brush(), { roughness: 0.6 }),
      velvet: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 1 }),
      spray: std(TEX.spray(), { roughness: 0.4 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.4 }),
      slipmatA: std(TEX.slipmat('#2a2a2e'), { roughness: 1 }),
      slipmatB: std(TEX.slipmat('#7a2e2a'), { roughness: 1 }),
      slipmatEdge: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 1 }),
      stylus: std(TEX.stylus()),
      tote: std(TEX.tote(), { roughness: 1, side: THREE.DoubleSide }),
      toteHandle: new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 1 }),
      hook: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.9 }),
    };
    this.cartons = new Map();
    this.geo = {
      box: new RoundedBoxGeometry(1, 1, 1, 1, 0.04), // wird skaliert → weiche Kanten
      sprayBody: new THREE.CylinderGeometry(0.028, 0.03, 0.17, 28),
      sprayHead: new THREE.CylinderGeometry(0.014, 0.018, 0.035, 20),
      slipmat: new THREE.CylinderGeometry(0.15, 0.15, 0.004, 32),
      toteHandle: new THREE.TorusGeometry(0.07, 0.008, 6, 16, Math.PI),
    };
  }

  cartonMaterial(label) {
    if (!this.cartons.has(label)) this.cartons.set(label, new THREE.MeshStandardMaterial({ map: TEX.carton(label), roughness: 0.95 }));
    return this.cartons.get(label);
  }

  // ----- Einzelne Artikel (b = Builder, Position in Store-Koordinaten, dir = Blickrichtung zum Kunden) -----
  sleevePack(b, x, y, z, dir, lean = -0.12) {
    b.instance('acc-sleeves', this.geo.box, this.mat.sleeves, { x, y: y + 0.155, z, yaw: yawFacing(...dir), pitch: lean, scale: [0.31, 0.31, 0.025] });
  }

  outerStack(b, x, y, z, n = 3) {
    for (let i = 0; i < n; i++) b.instance('acc-outer', this.geo.box, this.mat.outer, { x, y: y + 0.012 + i * 0.024, z, yaw: (i % 2) * 0.06, scale: [0.32, 0.022, 0.32] });
  }

  brush(b, x, y, z, dir) {
    const yaw = yawFacing(...dir) + Math.PI / 2; // Griff quer zur Blickrichtung
    b.instance('acc-brush', this.geo.box, this.mat.brush, { x, y: y + 0.03, z, yaw, scale: [0.14, 0.035, 0.05] });
    b.instance('acc-velvet', this.geo.box, this.mat.velvet, { x, y: y + 0.007, z, yaw, scale: [0.13, 0.014, 0.046] });
  }

  spray(b, x, y, z, dir) {
    const yaw = yawFacing(...dir) + Math.PI; // Etikettmitte (u = 0,5) liegt auf lokal -z → zum Kunden drehen
    b.instance('acc-spray', this.geo.sprayBody, this.mat.spray, { x, y: y + 0.085, z, yaw });
    b.instance('acc-sprayhead', this.geo.sprayHead, this.mat.plastic, { x, y: y + 0.19, z, yaw });
    b.instance('acc-trigger', this.geo.box, this.mat.plastic, { x: x + dir[0] * 0.02, y: y + 0.19, z: z + dir[1] * 0.02, yaw: yawFacing(...dir), scale: [0.02, 0.03, 0.04] });
  }

  slipmat(b, x, y, z, dir, variant) {
    b.instance(`acc-slipmat-${variant}`, this.geo.slipmat, [this.mat.slipmatEdge, variant ? this.mat.slipmatB : this.mat.slipmatA, this.mat.slipmatEdge], {
      x, y: y + 0.152, z, yaw: yawFacing(...dir), pitch: Math.PI / 2 - 0.2,
    });
  }

  stylus(b, x, y, z, dir) {
    b.instance('acc-stylus', this.geo.box, this.mat.stylus, { x, y: y + 0.045, z, yaw: yawFacing(...dir), scale: [0.06, 0.09, 0.025] });
  }

  toteFolded(b, x, y, z, n = 4) {
    for (let i = 0; i < n; i++) b.instance('acc-totefold', this.geo.box, this.mat.tote, { x, y: y + 0.008 + i * 0.016, z, yaw: (i % 2) * 0.05, scale: [0.26, 0.014, 0.3] });
  }

  // Hängende Tasche an einem Haken; (x, z) = Hakenpunkt an der Stirnseite, dir = Richtung nach außen
  toteHanging(b, x, yHook, z, dir) {
    const yaw = yawFacing(...dir);
    b.instance('acc-hook', this.geo.box, this.mat.hook, { x: x + dir[0] * 0.06, y: yHook, z: z + dir[1] * 0.06, yaw, scale: [0.01, 0.01, 0.12] });
    const bx = x + dir[0] * 0.1;
    const bz = z + dir[1] * 0.1;
    b.instance('acc-tote', this.geo.box, this.mat.tote, { x: bx, y: yHook - 0.3, z: bz, yaw, pitch: -0.05, scale: [0.36, 0.4, 0.012] });
    b.instance('acc-totehandle', this.geo.toteHandle, this.mat.toteHandle, { x: bx, y: yHook - 0.1, z: bz, yaw });
  }

  carton(b, label, x, y, z, dir, [w, h, d] = [0.5, 0.35, 0.4]) {
    const mat = this.cartonMaterial(label);
    b.instance(`acc-carton-${label}`, this.geo.box, mat, { x, y: y + h / 2, z, yaw: yawFacing(...dir), scale: [w, h, d] });
  }
}
