// Umgebung: überdachte Ladenpassage im Stil der Karlspassage in Stuttgart (freie Nachempfindung, kein exakter Nachbau).
// Store-Koordinaten: Ladenfront bei z = 0, Passage liegt davor (z < 0). Alle Nachbarläden sind fiktiv.
import * as THREE from 'three';
import { Builder, yawFacing, rng } from './builder.js';
import { canvasTex, fitText } from './accessories.js';
import { addStaticPerson, randomLook } from './people.js';

const SANS = 'system-ui, -apple-system, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const P = {
  zFront: -0.2, // Außenkante unserer Fassade
  zOpp: -8.2, // gegenüberliegende Fassaden
  x1: -26,
  x2: 38,
  eg: 3.6, // Erdgeschosshöhe der Passage
  traufe: 9.2,
  first: 10.6,
};

function plane(parent, material, w, h, x, y, z, dir, pitch = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, -z);
  m.rotation.set(pitch, yawFacing(...dir), 0, 'YXZ');
  parent.add(m);
  return m;
}

// ---------- Texturen ----------
function floorTexture() {
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#cfc6b8';
    g.fillRect(0, 0, w, h);
    let seed = 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // Granitplatten 60 × 60 cm (Kachel = 1,2 m → 2 × 2 Platten)
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const c = 196 + r() * 22;
        g.fillStyle = `rgb(${c},${c - 8},${c - 18})`;
        g.fillRect(i * 256 + 2, j * 256 + 2, 252, 252);
        for (let k = 0; k < 900; k++) {
          const d = r() < 0.5 ? 'rgba(60,55,50,0.18)' : 'rgba(255,255,255,0.22)';
          g.fillStyle = d;
          g.fillRect(i * 256 + r() * 256, j * 256 + r() * 256, 2, 2);
        }
      }
    g.fillStyle = 'rgba(80,72,64,0.5)';
    for (const p of [0, 256]) {
      g.fillRect(p, 0, 3, h);
      g.fillRect(0, p, w, 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function shopWindowTexture(theme, rand) {
  return canvasTex(384, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.hell);
    grad.addColorStop(1, theme.dunkel);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    // Regale / Warenpräsentation im Inneren
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (const y of [70, 140, 210]) g.fillRect(20, y, w - 40, 6);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = theme.ware[Math.floor(rand() * theme.ware.length)];
      const x = 30 + rand() * (w - 70);
      const y = [40, 110, 180][Math.floor(rand() * 3)];
      g.fillRect(x, y, 14 + rand() * 18, 30);
    }
    // Deckenleuchten und Spiegelung
    g.fillStyle = 'rgba(255,248,230,0.7)';
    for (let x = 40; x < w; x += 90) g.fillRect(x, 8, 40, 5);
    const refl = g.createLinearGradient(0, 0, w, h);
    refl.addColorStop(0, 'rgba(255,255,255,0.18)');
    refl.addColorStop(0.4, 'rgba(255,255,255,0)');
    refl.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    refl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = refl;
    g.fillRect(0, 0, w, h);
  });
}

function signTexture(name, sub, theme) {
  return canvasTex(768, 128, (g, w, h) => {
    g.fillStyle = theme.schild;
    g.fillRect(0, 0, w, h);
    g.fillStyle = theme.schrift;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fitText(g, name, w / 2, sub ? 52 : h / 2, w - 60, theme.serif ? 'italic 700' : '800', 60, theme.serif ? SERIF : SANS);
    if (sub) {
      g.globalAlpha = 0.8;
      fitText(g, sub, w / 2, 100, w - 60, '500', 22, SANS);
      g.globalAlpha = 1;
    }
  });
}

function upperWindowTexture() {
  return canvasTex(128, 192, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#9fb3c2');
    grad.addColorStop(1, '#46525c');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e9e3d8';
    g.fillRect(w / 2 - 3, 0, 6, h);
    g.fillRect(0, h * 0.35, w, 6);
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.fillRect(8, 8, 20, h - 16);
  });
}

function bannerTexture() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#1f2a33';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a15a';
    g.lineWidth = 6;
    g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#e9dcc0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fitText(g, 'KARLSPASSAGE', w / 2, 110, w - 120, '700', 110, SERIF);
    g.fillStyle = '#c9a15a';
    fitText(g, 'Stuttgart · Mitte', w / 2, 200, w - 120, '500', 40, SANS);
  });
}

function posterColumnTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    const cols = ['#e8772e', '#355070', '#b56576', '#f2c230', '#2f4550', '#6b705c'];
    const titles = ['JAZZ OPEN', 'THEATER', 'FLOHMARKT', 'KINO', 'LESUNG', 'KONZERT'];
    for (let i = 0; i < 6; i++) {
      g.fillStyle = cols[i];
      g.fillRect((i * w) / 6, 0, w / 6 - 3, h);
      g.fillStyle = '#f4f1ec';
      g.save();
      g.translate((i * w) / 6 + w / 12, h / 2);
      g.rotate(-Math.PI / 2);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      fitText(g, titles[i], 0, 0, h - 30, '900', 30, SANS);
      g.restore();
    }
  });
}

function aBoardTexture() {
  return canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = '#23302b';
    g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#e8772e';
    fitText(g, 'RILLE 33', w / 2, 50, w - 30, '900', 44, SANS);
    g.fillStyle = '#f4f1ec';
    const chalk = '"Chalkboard SE", "Marker Felt", "Comic Sans MS", sans-serif';
    ['Neu reingekommen:', 'Second-Hand-Kisten', 'ab 5 €', '', 'Listening Bar', 'Espresso 2,50'].forEach((l, i) => fitText(g, l, w / 2, 120 + i * 40, w - 30, '400', 26, chalk));
  });
}

// Themen der fiktiven Nachbarläden
const THEMES = [
  { name: 'Café Karlsbohne', sub: 'Kaffeerösterei seit 1952', schild: '#2f2622', schrift: '#e9dcc0', hell: '#f0d9b8', dunkel: '#8a6242', ware: ['#6b3d1f', '#f4f1ec', '#c9a15a'], serif: true },
  { name: 'Buchhandlung Seitenweise', sub: 'Bücher · Karten · Kalender', schild: '#1f3a4a', schrift: '#f4f1ec', hell: '#e8e0d0', dunkel: '#7a6a58', ware: ['#b56576', '#355070', '#e8772e', '#6b705c', '#f2c230'], serif: true },
  { name: 'Optik Klarsicht', sub: '', schild: '#f4f1ec', schrift: '#1c1c1f', hell: '#ffffff', dunkel: '#c8ccd0', ware: ['#1c1c1f', '#8a6242', '#c0504d'] },
  { name: 'Feinkost Rössle', sub: 'Schwäbische Spezialitäten', schild: '#5b1f1f', schrift: '#f2e2c0', hell: '#f3e3c3', dunkel: '#9a6a3a', ware: ['#c9a15a', '#6b3d1f', '#2e5a3a', '#b56576'], serif: true },
  { name: 'Atelier Vier', sub: 'Mode', schild: '#1c1c1f', schrift: '#f4f1ec', hell: '#ece6de', dunkel: '#9a948c', ware: ['#3d405b', '#b56576', '#f4f1ec', '#6b705c'] },
  { name: 'Papeterie Feder', sub: 'Schreibwaren & Geschenke', schild: '#e9dcc0', schrift: '#2f4550', hell: '#f7f0e4', dunkel: '#c2b6a2', ware: ['#e8772e', '#2f6fd6', '#3fbf7f', '#f2c230'], serif: true },
  { name: 'Blumen Maienfeld', sub: '', schild: '#2e5a3a', schrift: '#f4f1ec', hell: '#e3efd8', dunkel: '#5b7a4a', ware: ['#e06c4f', '#f2c230', '#b56576', '#f4f1ec'] },
  { name: 'Gelateria Dolce', sub: 'Eis · Espresso', schild: '#f2c9d0', schrift: '#6b2f3a', hell: '#fff4f0', dunkel: '#e0b8b0', ware: ['#f2c230', '#b56576', '#8a6242', '#f4f1ec'] },
];

export function buildPassage(layout) {
  const rand = rng(77);
  const group = new THREE.Group();
  group.name = 'Karlspassage';
  const extra = new THREE.Group();
  const std = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const b = new Builder({
    stein: std(0xd8d0c2, 0.9),
    steinDunkel: std(0xa89e8e, 0.9),
    stahl: std(0x3a3f45, 0.45, 0.6),
    stahlHell: std(0x8c939a, 0.35, 0.8),
    rahmen: std(0x2a2d31, 0.5, 0.4),
    holz: std(0x8a6242, 0.7),
    gruen: std(0x3f6b3a, 0.8),
    gruenHell: std(0x5c8a45, 0.8),
    stamm: std(0x4a3526, 1),
    erde: std(0x3a2a1e, 1),
    schwarz: std(0x1c1c1f, 0.6),
    leuchte: new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
    glasDach: new THREE.MeshStandardMaterial({ color: 0xcfe3ee, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
    akzent: std(0xe8772e, 0.55),
  });
  const W = layout.raum.breite;

  // ---------- Boden ----------
  const ft = floorTexture();
  const len = P.x2 - P.x1;
  const dep = P.zFront - P.zOpp;
  ft.repeat.set(len / 1.2, dep / 1.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(len, dep), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.55, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((P.x1 + P.x2) / 2, -0.001, -(P.zFront + P.zOpp) / 2);
  group.add(floor);
  // Mittelband aus dunklerem Stein
  b.box('steinDunkel', [P.x1, P.x2, -4.5, -3.9], -0.01, 0.001);

  // ---------- Fassaden ----------
  const winMat = new THREE.MeshStandardMaterial({ map: upperWindowTexture(), roughness: 0.2, metalness: 0.2 });
  const upperFacade = (xa, xe, zFace, dir) => {
    // Wand über dem Erdgeschoss mit Fensterreihen und Gesimsen
    const zBack = zFace - dir[1] * 0.3;
    b.box('stein', [xa, xe, Math.min(zFace, zBack), Math.max(zFace, zBack)], P.eg, P.traufe);
    for (const y of [P.eg, 6.3, P.traufe - 0.25]) b.box('steinDunkel', [xa, xe, Math.min(zFace, zFace + dir[1] * 0.12), Math.max(zFace, zFace + dir[1] * 0.12)], y, y + 0.22);
    for (let x = xa + 1.1; x < xe - 0.8; x += 1.8) {
      for (const y of [4.9, 7.6]) {
        plane(extra, winMat, 0.9, 1.35, x, y, zFace + dir[1] * 0.005, dir);
        b.box('steinDunkel', [x - 0.55, x + 0.55, Math.min(zFace, zFace + dir[1] * 0.1), Math.max(zFace, zFace + dir[1] * 0.1)], y - 0.78, y - 0.7);
      }
    }
  };
  const shopFront = (xa, xe, zFace, dir, theme) => {
    const zo = zFace + dir[1] * 0.06; // Pfeiler stehen etwas vor
    const zMin = Math.min(zFace, zo);
    const zMax = Math.max(zFace, zo);
    b.box('rahmen', [xa, xa + 0.25, zMin, zMax], 0, P.eg);
    b.box('rahmen', [xe - 0.25, xe, zMin, zMax], 0, P.eg);
    b.box('rahmen', [xa, xe, zMin, zMax], 0, 0.35);
    b.box('rahmen', [xa, xe, zMin, zMax], 2.95, 3.05);
    // Schaufenster (Innenleben gezeichnet) + Glastür
    const ww = xe - xa - 0.5;
    const doorW = 1.1;
    const glassW = ww - doorW - 0.1;
    const shop = new THREE.MeshBasicMaterial({ map: shopWindowTexture(theme, rand), color: 0xd4d0c8 });
    plane(extra, shop, glassW, 2.6, xa + 0.25 + glassW / 2, 0.35 + 1.3, zFace + dir[1] * 0.01, dir);
    const doorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.dunkel).multiplyScalar(0.8) });
    plane(extra, doorMat, doorW, 2.6, xe - 0.25 - doorW / 2, 1.3, zFace + dir[1] * 0.01, dir);
    b.box('stahlHell', [xe - 0.25 - doorW - 0.05, xe - 0.25 - doorW, zMin, zMax], 0, 2.95);
    // Ladenschild
    const sign = new THREE.MeshBasicMaterial({ map: signTexture(theme.name, theme.sub, theme), color: 0xe6e6e6 });
    plane(extra, sign, Math.min(xe - xa - 0.4, 4.2), 0.48, (xa + xe) / 2, 3.3, zFace + dir[1] * 0.07, dir);
    // Ausleger-Schild quer zur Passage
    const ax = xa + 0.4;
    b.box('stahl', [ax - 0.02, ax + 0.02, Math.min(zFace, zFace + dir[1] * 0.9), Math.max(zFace, zFace + dir[1] * 0.9)], 2.95, 2.99);
    // zwei Seiten, damit die Schrift von beiden Richtungen lesbar ist (nicht gespiegelt)
    const blade = new THREE.MeshBasicMaterial({ map: signTexture(theme.name, '', theme) });
    for (const d of [[1, 0], [-1, 0]]) plane(extra, blade, 0.8, 0.14, ax + d[0] * 0.004, 2.8, zFace + dir[1] * 0.55, d);
  };

  // Fassade über unserem Laden + Fassadenverkleidung neben dem Schaufenster
  upperFacade(-0.2, W + 0.2, P.zFront, [0, -1]);
  b.box('stein', [-0.2, W + 0.2, P.zFront - 0.3, P.zFront], 3.2, P.eg);

  // Nachbarläden auf unserer Seite (links und rechts) und gegenüber
  let t = 0;
  const units = [];
  for (let x = P.x1; x < -0.2 - 0.1; x += 6.5) units.push([x, Math.min(x + 6.5, -0.2), P.zFront, [0, -1]]);
  for (let x = W + 0.2; x < P.x2 - 0.1; x += 6.5) units.push([x, Math.min(x + 6.5, P.x2), P.zFront, [0, -1]]);
  for (let x = P.x1; x < P.x2 - 0.1; x += 7) units.push([x, Math.min(x + 7, P.x2), P.zOpp, [0, 1]]);
  for (const [xa, xe, z, dir] of units) {
    if (xe - xa < 3) continue;
    shopFront(xa, xe, z, dir, THEMES[t++ % THEMES.length]);
    upperFacade(xa, xe, z, dir);
  }
  // Stirnseiten der Passage: helle Durchgänge
  for (const [x, dx] of [[P.x1, 1], [P.x2, -1]]) {
    b.box('stein', [Math.min(x, x - dx * 0.4), Math.max(x, x - dx * 0.4), P.zOpp, P.zFront], 4.6, P.first);
    const light = new THREE.MeshBasicMaterial({ color: 0xf4efe6 });
    plane(extra, light, dep, 4.6, x - dx * 0.2, 2.3, (P.zFront + P.zOpp) / 2, [dx, 0]);
  }

  // ---------- Glasdach mit Stahlbindern ----------
  const zMid = (P.zFront + P.zOpp) / 2;
  const half = dep / 2;
  const slope = Math.atan2(P.first - P.traufe, half);
  const slopeLen = Math.hypot(half, P.first - P.traufe);
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(len, slopeLen);
    const m = new THREE.Mesh(g, b.materials.glasDach);
    m.position.set((P.x1 + P.x2) / 2, (P.traufe + P.first) / 2, -(zMid + (s * half) / 2));
    m.rotation.x = -Math.PI / 2 + s * -slope;
    m.renderOrder = 3;
    extra.add(m);
  }
  for (let x = P.x1; x <= P.x2; x += 3) {
    // Binder: zwei Sparren + Zugstange
    for (const s of [-1, 1]) {
      const geo = new THREE.BoxGeometry(0.1, 0.14, slopeLen);
      b.geo('stahl', geo, x, (P.traufe + P.first) / 2 - 0.08, zMid + (s * half) / 2, 0, -s * slope);
    }
    b.box('stahl', [x - 0.02, x + 0.02, P.zOpp + 0.2, P.zFront - 0.2], P.traufe - 0.05, P.traufe - 0.01);
    b.box('stahl', [x - 0.015, x + 0.015, zMid - 0.015, zMid + 0.015], P.traufe, P.first - 0.1);
  }
  // Pfetten längs
  for (const f of [0.2, 0.5, 0.8]) {
    for (const s of [-1, 1]) {
      const z = zMid + s * half * (1 - f);
      const y = P.traufe + (P.first - P.traufe) * f;
      b.box('stahl', [P.x1, P.x2, z - 0.04, z + 0.04], y - 0.14, y - 0.06);
    }
  }

  // ---------- Banner „Karlspassage“ ----------
  const bannerX = 6;
  for (const o of [-1.6, 1.6]) b.box('stahl', [bannerX + o - 0.01, bannerX + o + 0.01, zMid - 0.01, zMid + 0.01], 5.2, P.traufe);
  b.box('rahmen', [bannerX - 1.75, bannerX + 1.75, zMid - 0.03, zMid + 0.03], 4.4, 5.3);
  const bt = new THREE.MeshBasicMaterial({ map: bannerTexture() });
  for (const d of [[0, 1], [0, -1]]) plane(extra, bt, 3.4, 0.85, bannerX, 4.85, zMid + d[1] * 0.035, d);

  // ---------- Möblierung in der Passage ----------
  const lamp = (x, z) => {
    b.geo('stahl', new THREE.CylinderGeometry(0.05, 0.07, 3.6, 16), x, 1.8, z);
    b.geo('stahl', new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), x, 0.04, z);
    b.geo('leuchte', new THREE.SphereGeometry(0.22, 20, 14), x, 3.75, z);
    b.geo('stahl', new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), x, 3.55, z);
  };
  const bench = (x, z, alongX = true) => {
    const L = 1.8;
    for (let i = 0; i < 5; i++) {
      const o = -0.18 + i * 0.09;
      if (alongX) b.box('holz', [x - L / 2, x + L / 2, z + o - 0.035, z + o + 0.035], 0.42, 0.46);
      else b.box('holz', [x + o - 0.035, x + o + 0.035, z - L / 2, z + L / 2], 0.42, 0.46);
    }
    for (const e of [-L / 2 + 0.15, L / 2 - 0.15]) {
      if (alongX) b.box('stahl', [x + e - 0.03, x + e + 0.03, z - 0.2, z + 0.2], 0, 0.42);
      else b.box('stahl', [x - 0.2, x + 0.2, z + e - 0.03, z + e + 0.03], 0, 0.42);
    }
  };
  const planter = (x, z) => {
    b.box('steinDunkel', [x - 0.6, x + 0.6, z - 0.6, z + 0.6], 0, 0.55);
    b.box('erde', [x - 0.52, x + 0.52, z - 0.52, z + 0.52], 0.55, 0.57);
    b.geo('stamm', new THREE.CylinderGeometry(0.06, 0.09, 1.8, 12), x, 1.45, z);
    const crown = [[0, 2.6, 0, 0.75], [0.35, 2.35, 0.2, 0.5], [-0.3, 2.4, -0.25, 0.55], [0.1, 3.05, -0.1, 0.5]];
    crown.forEach(([dx, y, dz, r], i) => b.geo(i % 2 ? 'gruenHell' : 'gruen', new THREE.IcosahedronGeometry(r, 1), x + dx, y, z + dz));
  };
  const bin = (x, z) => {
    b.geo('stahl', new THREE.CylinderGeometry(0.22, 0.2, 0.85, 20), x, 0.43, z);
    b.geo('schwarz', new THREE.CylinderGeometry(0.23, 0.23, 0.05, 20), x, 0.87, z);
  };
  const column = (x, z) => {
    b.geo('rahmen', new THREE.CylinderGeometry(0.55, 0.6, 0.3, 28), x, 0.15, z);
    const tex = posterColumnTexture();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.4, 28, 1, true), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    m.position.set(x, 1.5, -z);
    extra.add(m);
    b.geo('rahmen', new THREE.ConeGeometry(0.62, 0.5, 28), x, 2.95, z);
  };

  for (let x = P.x1 + 3; x < P.x2 - 2; x += 8) lamp(x, zMid);
  for (const x of [-14, 20, 30]) planter(x, zMid);
  for (const x of [-8, 17.5]) bench(x, zMid - 1.1);
  bench(-20, zMid + 1.1);
  for (const x of [-5.5, 14.5, 26]) bin(x, zMid + 1.2);
  column(-2.5, zMid - 1.2);

  // Vor „Rille 33“: Kundenstopper und Grabbelkiste
  const abTex = new THREE.MeshStandardMaterial({ map: aBoardTexture(), roughness: 0.95 });
  const abx = 4.2;
  const abz = -1.3;
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.6, 1.0, 0.03);
    b.geo('holz', geo, abx, 0.5, abz + s * 0.13, 0, s * 0.14);
    plane(extra, abTex, 0.52, 0.86, abx, 0.52, abz + s * 0.15, [0, s], -s * 0.14);
  }
  const cx = 8.8;
  const cz = -0.95;
  b.box('holz', [cx - 0.45, cx + 0.45, cz - 0.3, cz + 0.3], 0, 0.7);
  b.box('schwarz', [cx - 0.42, cx + 0.42, cz - 0.27, cz + 0.27], 0.7, 0.71);
  const recCols = ['#b56576', '#355070', '#e8772e', '#6b705c', '#f2c230', '#3d405b', '#81667a'];
  for (let i = 0; i < 26; i++) {
    const key = `rec-${i % recCols.length}`;
    if (!b.materials[key]) b.materials[key] = std(recCols[i % recCols.length], 0.8);
    b.geo(key, new THREE.BoxGeometry(0.315, 0.315, 0.006), cx - 0.38 + i * 0.03, 0.86, cz, Math.PI / 2, -0.25);
  }
  const crateSign = canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#e8772e';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1c1f';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    fitText(g, 'GRABBELKISTE', w / 2, 36, w - 20, '900', 30, SANS);
    fitText(g, 'jede Platte 3 €', w / 2, 72, w - 20, '600', 22, SANS);
  });
  plane(extra, new THREE.MeshBasicMaterial({ map: crateSign }), 0.6, 0.22, cx, 0.4, cz - 0.305, [0, -1]);

  // ---------- Passanten ----------
  const people = [
    [-12, -3.2, 1.4], [-10.5, -5.9, -1.6], [-4, -2.6, 0.2], [-1.2, -6.4, 3.0], [1.2, -3.8, -1.2], [5.3, -2.1, 3.1],
    [10.8, -6.9, 1.6], [14, -3.0, -1.5], [16.2, -5.5, 0.4], [22, -2.8, 1.6], [25, -6.2, -1.6], [31, -4.8, 1.5],
    [-18, -4.3, -1.5], [7.2, -6.8, 0.1],
  ];
  for (const [x, z, yaw] of people) addStaticPerson(b, randomLook(rand), x, z, yaw);
  // Sitzende auf der Bank werden als Stehende davor angedeutet
  addStaticPerson(b, randomLook(rand), -8.4, zMid - 0.6, Math.PI, 'stoebern');

  group.add(b.build('Passage'));
  group.add(extra);
  return group;
}
