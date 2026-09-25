// Etappe 2: Möbel und Warenträger M1–M12 aus layout.json.
import * as THREE from 'three';
import { Builder, yawFacing, rng } from './builder.js';
import { Covers, COVER } from './covers.js';
import { signMesh } from './labels.js';
import { Drawers } from './drawers.js';
import { AccessoryKit, priceLabel } from './accessories.js';
import { Decor } from './decor.js';
import { addStaticPerson, randomLook } from './people.js';

const std = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

const MATERIALS = {
  korpus: std(0x2f3034, 0.85), // dunkle Möbelkorpusse
  holz: std(0x8a6242, 0.7),
  holzHell: std(0xb08a5e, 0.7),
  kiste: std(0xa57d52, 0.8),
  metall: std(0x3a3c40, 0.4, 0.6),
  chrom: std(0xb8bcc2, 0.25, 0.9),
  schwarz: std(0x151516, 0.5),
  akzent: std(0xe8772e, 0.55),
  weiss: std(0xe8e4dc, 0.7),
  polster: std(0x6b2f2a, 0.9),
  bildschirm: new THREE.MeshBasicMaterial({ color: 0x9fd3c7 }),
};

// Wiederverwendete Geometrien
const G = {
  disc: (r, h, seg = 32) => new THREE.CylinderGeometry(r, r, h, seg),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
};

const acc = (ctx) => ctx.acc;

const Y_AXIS_TO_X = Math.PI / 2; // roll: Zylinderachse von y nach x drehen
// Kleiner Versatz, damit sich Flächen verschiedener Materialien nie exakt überdecken (sonst Z-Fighting/Flimmern)
const E = 0.005;

// Plattenspieler, Front zeigt in Richtung (dx, dz)
function turntable(b, x, y, z, [dx, dz], plinth = 'holz') {
  const yaw = yawFacing(dx, dz);
  // Richtungen: f = zum Kunden, r = rechts davon (Store-Koordinaten)
  const rx = -dz;
  const rz = dx;
  const at = (fr, rr) => [x + dx * fr + rx * rr, z + dz * fr + rz * rr];
  b.geo(plinth, G.box(0.44, 0.08, 0.34), x, y + 0.05, z, yaw);
  for (const [fr, rr] of [[0.13, 0.18], [0.13, -0.18], [-0.13, 0.18], [-0.13, -0.18]]) {
    const [fx, fz] = at(fr, rr);
    b.geo('schwarz', G.disc(0.022, 0.012, 16), fx, y + 0.006, fz); // Gerätefüße
  }
  const [px, pz] = at(0, -0.04);
  b.geo('chrom', G.disc(0.152, 0.012), px, y + 0.095, pz); // Plattenteller
  b.geo('schwarz', G.disc(0.148, 0.006), px, y + 0.104, pz); // Platte
  b.geo('akzent', G.disc(0.045, 0.008), px, y + 0.106, pz); // Label
  b.geo('chrom', G.disc(0.004, 0.02, 8), px, y + 0.112, pz); // Mittelachse
  // Tonarm: Lager, Arm, Gegengewicht, Tonkopf
  const [ax, az] = at(-0.1, 0.16);
  b.geo('chrom', G.disc(0.022, 0.03, 16), ax, y + 0.105, az);
  b.geo('chrom', G.box(0.01, 0.01, 0.21), ax + (dx * 0.1 - rx * 0.03), y + 0.125, az + (dz * 0.1 - rz * 0.03), yaw + 0.3);
  const [cx, cz] = at(-0.15, 0.17);
  b.geo('schwarz', G.disc(0.018, 0.03, 12), cx, y + 0.125, cz, yaw, Math.PI / 2);
  const [hx, hz] = at(0.1, 0.1);
  b.geo('schwarz', G.box(0.02, 0.012, 0.035), hx, y + 0.12, hz, yaw + 0.3);
  // Drehzahlknopf und Start-Taste vorn
  const [kx, kz] = at(0.15, -0.16);
  b.geo('chrom', G.disc(0.012, 0.012, 12), kx, y + 0.095, kz);
  const [sx, sz] = at(0.15, -0.11);
  b.geo('akzent', G.box(0.025, 0.006, 0.015), sx, y + 0.092, sz, yaw);
}

function speaker(b, x, y, z, [dx, dz], h = 0.34) {
  const yaw = yawFacing(dx, dz);
  b.geo('korpus', G.box(0.22, h, 0.24), x, y + h / 2, z, yaw);
  // Membranen mit Sicke und Bassreflexöffnung auf der Front
  const fx = x + dx * 0.121;
  const fz = z + dz * 0.121;
  b.geo('metall', G.disc(0.08, 0.008), fx, y + h * 0.35, fz, yaw, Math.PI / 2);
  b.geo('schwarz', G.disc(0.066, 0.012), fx, y + h * 0.35, fz, yaw, Math.PI / 2);
  b.geo('metall', G.disc(0.02, 0.016), fx, y + h * 0.35, fz, yaw, Math.PI / 2);
  b.geo('metall', G.disc(0.038, 0.008), fx, y + h * 0.75, fz, yaw, Math.PI / 2);
  b.geo('schwarz', G.disc(0.026, 0.012), fx, y + h * 0.75, fz, yaw, Math.PI / 2);
  b.geo('schwarz', G.disc(0.018, 0.014), fx, y + h * 0.1 + 0.015, fz, yaw, Math.PI / 2);
}

function tableLegs(b, [x1, x2, z1, z2], h, inset = 0.06, t = 0.05) {
  for (const x of [x1 + inset, x2 - inset - t])
    for (const z of [z1 + inset, z2 - inset - t]) b.box('metall', [x, x + t, z, z + t], 0, h);
}

function sign(group, text, opts, x, y, z, dir) {
  const m = signMesh(text, opts);
  m.position.set(x, y, -z);
  m.rotation.y = yawFacing(dir[0], dir[1]);
  group.add(m);
  return m;
}

// ---------- Möbeltypen ----------

const BUILDERS = {
  'schaufenster-display'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const cx = (x1 + x2) / 2;
    const zc = (z1 + z2) / 2;
    const top = 0.25;
    b.box('korpus', [x1, x2, z1, z2], 0, top);
    b.box('akzent', [x1, x2, z1 - 0.005, z1], 0.2, 0.25);
    // "Album der Woche": großes Cover auf Staffelei, Blick zur Straße
    b.box('holz', [cx - 0.03, cx + 0.03, zc + 0.02, zc + 0.08], top, top + 0.75);
    ctx.covers.front(b, { x: cx, y: top + COVER + 0.05, z: zc, yaw: 0, pitch: -0.08 }, 2);
    // Hängende Cover an einer Stange
    const rodZ = zc + 0.05;
    b.box('metall', [x1 + 0.05, x1 + 0.09, rodZ - 0.02, rodZ + 0.02], top, m.hoehe);
    b.box('metall', [x2 - 0.09, x2 - 0.05, rodZ - 0.02, rodZ + 0.02], top, m.hoehe);
    b.box('metall', [x1 + 0.05, x2 - 0.05, rodZ - 0.015, rodZ + 0.015], m.hoehe - 0.03, m.hoehe);
    const r = ctx.rand;
    for (let x = x1 + 0.35; x < x2 - 0.2; x += 0.42) {
      if (Math.abs(x - cx) < 0.55) continue;
      const y = 0.45 + r() * 0.4;
      b.box('chrom', [x - 0.002, x + 0.002, rodZ - 0.002, rodZ + 0.002], y + COVER / 2, m.hoehe - 0.03);
      ctx.covers.front(b, { x, y, z: rodZ, yaw: (r() - 0.5) * 0.5 });
    }
    // Schild an der Stange: eins zur Straße, eins in den Laden
    sign(ctx.extra, m.schild, { w: 0.9, h: 0.12, bg: '#1c1c1f', fg: '#e8772e' }, cx, m.hoehe - 0.1, rodZ - 0.02, [0, -1]);
    sign(ctx.extra, m.schild, { w: 0.9, h: 0.12, bg: '#1c1c1f', fg: '#e8772e' }, cx, m.hoehe - 0.1, rodZ + 0.02, [0, 1]);
  },

  'neuheiten-tisch'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    tableLegs(b, m.rechteck, h - 0.05);
    b.box('holz', [x1, x2, z1, z2], h - 0.05, h);
    b.box('holz', [x1 + 0.08, x2 - 0.08, z1 + 0.08, z2 - 0.08], 0.2, 0.23);
    // Mittelsteg, an den die Cover gelehnt sind (beidseitig frontal)
    const zm = (z1 + z2) / 2;
    b.box('holzHell', [x1 + 0.05, x2 - 0.05, zm - 0.1, zm + 0.1], h, h + 0.12);
    const n = Math.floor((x2 - x1 - 0.1) / 0.37);
    const start = (x1 + x2) / 2 - ((n - 1) * 0.37) / 2;
    for (let i = 0; i < n; i++) {
      const x = start + i * 0.37;
      ctx.covers.front(b, { x, y: h + COVER / 2 - 0.01, z: zm - 0.2, yaw: 0, pitch: -0.35 });
      ctx.covers.front(b, { x, y: h + COVER / 2 - 0.01, z: zm + 0.2, yaw: Math.PI, pitch: -0.35 });
    }
    // Stapel unten
    for (let i = 0; i < n; i++) {
      const x = start + i * 0.37;
      for (let k = 0; k < 4; k++) ctx.covers.record(b, { x, y: 0.235 + k * 0.006, z: zm, pitch: -Math.PI / 2 });
    }
  },

  'genre-wand'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const H = m.hoehe;
    const segs = m.segmente;
    const L = (z2 - z1) / segs.length;
    const depth = x2 - x1;
    b.box('korpus', [x1, x1 + 0.04, z1 + E, z2 - E], 0, H - 0.04); // Rückwand (eingerückt → kein Flimmern)
    b.box('holz', [x1, x2 + 0.02, z1 - E, z2 + E], H - 0.04, H + E); // Abschluss oben
    for (let i = 0; i <= segs.length; i++) {
      const z = z1 + i * L;
      b.box('holz', [x1, x2, Math.max(z1, z - 0.015), Math.min(z2, z + 0.015)], 0, H);
    }
    segs.forEach((genre, i) => {
      const s1 = z1 + i * L + 0.015;
      const s2 = z1 + (i + 1) * L - 0.015;
      const sw = s2 - s1;

      // Bückzone (< 0,6 m): Schubladen mit Nachschub
      b.box('korpus', [x1 + 0.04, x2 - 0.03, s1, s2], 0, 0.035); // Boden des Schubladenfachs
      for (let row = 0; row < 2; row++) {
        const y0 = 0.04 + row * 0.28;
        for (let k = 0; k < 3; k++) {
          const a = s1 + (k * sw) / 3 + 0.01;
          const e = s1 + ((k + 1) * sw) / 3 - 0.01;
          ctx.drawers.add({ x1, x2, z1: a, z2: e, y0, y1: y0 + 0.26 }); // öffnenbar (drawers.js)
        }
      }

      // Greifzone (0,6–1,2 m): Plattenfächer zum Durchblättern
      b.box('korpus', [x1 + 0.04, x2, s1, s2], 0.6, 0.64);
      b.box('holz', [x2 - 0.03, x2, s1, s2], 0.64, 0.78);
      const bins = 4;
      for (let k = 0; k < bins; k++) {
        const a = s1 + (k * sw) / bins;
        const e = s1 + ((k + 1) * sw) / bins;
        if (k > 0) b.box('holz', [x1 + 0.04, x2, a - 0.008, a + 0.008], 0.64, 0.9);
        const zc = (a + e) / 2;
        for (let x = x1 + 0.1; x < x2 - 0.06; x += 0.024) {
          ctx.covers.record(b, { x, y: 0.64 + COVER / 2 - 0.01, z: zc, yaw: yawFacing(1, 0), pitch: -0.22 });
        }
      }

      // Sichtzone (1,2–1,8 m): Top-Titel frontal
      b.box('korpus', [x1 + 0.04, x1 + 0.3, s1, s2], 1.2, H - 0.04);
      b.box('holz', [x1 + 0.3, x1 + 0.44, s1, s2], 1.2, 1.24);
      b.box('holz', [x1 + 0.42, x1 + 0.44, s1, s2], 1.24, 1.28);
      for (let k = 0; k < 4; k++) {
        const zc = s1 + ((k + 0.5) * sw) / 4;
        ctx.covers.front(b, { x: x1 + 0.35, y: 1.24 + COVER / 2, z: zc, yaw: yawFacing(1, 0), pitch: -0.12 });
      }

      // Reckzone (> 1,8 m): Genre-Schild und Deko-Platten
      const zm = (s1 + s2) / 2;
      sign(ctx.extra, genre, { w: 0.95, h: 0.26, bg: '#1c1c1f', fg: '#f4f1ec', border: '#e8772e' }, x1 + 0.305, 2.1, zm, [1, 0]);
      for (const side of [-1, 1]) {
        const zd = zm + side * 0.6;
        b.geo('schwarz', G.disc(0.1, 0.008), x1 + 0.31, 2.1, zd, 0, 0, Y_AXIS_TO_X);
        b.geo('akzent', G.disc(0.035, 0.01), x1 + 0.311, 2.1, zd, 0, 0, Y_AXIS_TO_X);
      }
    });
  },

  'digging-kiste'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const base = 0.55;
    const xm = (x1 + x2) / 2;
    b.box('holz', [x1 + 0.05, x2 - 0.05, z1 + 0.05, z2 - 0.05], 0, base);
    const n = Math.round((z2 - z1) / 0.4);
    const L = (z2 - z1) / n;
    for (const [a, e, dir] of [[x1, xm - 0.01, -1], [xm + 0.01, x2, 1]]) {
      for (let i = 0; i < n; i++) {
        const c1 = z1 + i * L + 0.01;
        const c2 = z1 + (i + 1) * L - 0.01;
        const t = 0.015;
        const top = base + 0.24;
        b.box('kiste', [a, e, c1, c2], base, base + 0.02);
        b.box('kiste', [a, a + t, c1, c2], base, top);
        b.box('kiste', [e - t, e, c1, c2], base, top);
        b.box('kiste', [a, e, c1, c1 + t], base, top);
        b.box('kiste', [a, e, c2 - t, c2], base, top);
        const zc = (c1 + c2) / 2;
        const count = 12 + Math.floor(ctx.rand() * 4);
        for (let k = 0; k < count; k++) {
          const x = dir < 0 ? e - 0.05 - k * 0.022 : a + 0.05 + k * 0.022;
          if (x < a + 0.03 || x > e - 0.03) break;
          ctx.covers.record(b, { x, y: base + 0.02 + COVER / 2, z: zc, yaw: yawFacing(dir, 0), pitch: -0.2 + (ctx.rand() - 0.5) * 0.06 }, true);
        }
      }
    }
  },

  hoerstation(b, m, ctx) {
    const r = m.durchmesser / 2;
    const h = m.hoehe;
    for (const [x, z] of m.stationen) {
      b.geo('metall', G.disc(0.24, 0.03), x, 0.015, z);
      b.geo('metall', G.disc(0.035, h - 0.04, 20), x, (h - 0.04) / 2, z);
      b.geo('holz', G.disc(r, 0.04, 32), x, h - 0.02, z);
      // Plattenspieler, Front Richtung Laden (Kunde steht auf der Ladenseite)
      turntable(b, x, h, z + 0.05, [0, -1], 'weiss');
      // Kopfhörer: Bügel + zwei Muscheln, liegend
      const hx = x + 0.23;
      const hz = z - 0.12;
      b.geo('schwarz', new THREE.TorusGeometry(0.075, 0.01, 6, 16, Math.PI), hx, h + 0.012, hz, 0, -Math.PI / 2);
      b.geo('schwarz', G.disc(0.04, 0.03, 20), hx + 0.075, h + 0.015, hz);
      b.geo('schwarz', G.disc(0.04, 0.03, 20), hx - 0.075, h + 0.015, hz);
    }
  },

  bar(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    b.box('korpus', [x1, x2, z1 + 0.05, z2], 0, h - 0.05);
    b.box('holz', [x1 - 0.05, x2 + 0.05, z1 - 0.05, z2 + 0.05], h - 0.05, h);
    b.box('chrom', [x1, x2, z1 - 0.1, z1 - 0.07], 0.2, 0.23);
    // Rückbuffet an der Rückwand mit Flaschen
    const wz = 15;
    b.box('korpus', [x1, x2, wz - 0.4, wz], 0, 0.9);
    b.box('holz', [x1, x2, wz - 0.42, wz], 0.9, 0.94);
    const bottle = G.disc(0.035, 0.26, 10);
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const colors = ['#2e5a3a', '#6b3d1f', '#c9d6d2', '#8a6a2a', '#3a2a4a'];
    for (const y of [1.3, 1.7]) {
      b.box('holz', [x1 + 0.2, x2 - 0.2, wz - 0.22, wz], y - 0.03, y);
      for (let x = x1 + 0.3; x < x2 - 0.25; x += 0.12 + ctx.rand() * 0.08) {
        b.instance('flaschen', bottle, bottleMat, { x, y: y + 0.13, z: wz - 0.11, color: colors[Math.floor(ctx.rand() * colors.length)] });
      }
    }
    // Barhocker
    for (const x of m.hocker_x) {
      const z = m.hocker_z;
      b.geo('metall', G.disc(0.21, 0.02), x, 0.01, z);
      b.geo('metall', G.disc(0.025, 0.74, 20), x, 0.39, z);
      b.geo('chrom', new THREE.TorusGeometry(0.15, 0.012, 6, 20), x, 0.3, z, 0, Math.PI / 2);
      b.geo('polster', G.disc(0.19, 0.07), x, 0.79, z);
    }
  },

  'hardware-wand'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const H = m.hoehe;
    const brands = m.marken;
    const L = (z2 - z1) / brands.length;
    b.box('korpus', [x2 - 0.05, x2, z1 + E, z2 - E], 0, H - 0.04);
    b.box('korpus', [x1 + E, x2 - E, z1 + E, z2 - E], 0, 0.1);
    b.box('holz', [x1 - E, x2, z1 - E, z2 + E], H - 0.04, H + E);
    for (let i = 0; i <= brands.length; i++) {
      const z = z1 + i * L;
      b.box('holz', [x1, x2, Math.max(z1, z - 0.015), Math.min(z2, z + 0.015)], 0, H);
    }
    brands.forEach((brand, i) => {
      const s1 = z1 + i * L + 0.015;
      const s2 = z1 + (i + 1) * L - 0.015;
      const key = `marke-${brand.name}`;
      if (!b.materials[key]) b.materials[key] = std(new THREE.Color(brand.farbe), 0.5);
      for (const y of [0.55, 1.05, 1.5]) b.box('holz', [x1 + 0.03, x2 - 0.05, s1, s2], y - 0.03, y);
      const zc = (s1 + s2) / 2;
      // Plattenspieler in zwei Etagen, Lautsprecher unten
      for (const [y, plinth] of [[1.05, key], [1.5, 'schwarz']]) {
        turntable(b, (x1 + x2) / 2 - 0.02, y, zc - 0.26, [-1, 0], plinth);
        turntable(b, (x1 + x2) / 2 - 0.02, y, zc + 0.26, [-1, 0], plinth === key ? 'weiss' : key);
      }
      speaker(b, (x1 + x2) / 2, 0.1, zc - 0.4, [-1, 0], 0.4);
      speaker(b, (x1 + x2) / 2, 0.1, zc + 0.4, [-1, 0], 0.4);
      b.box(key, [x1 + 0.2, x1 + 0.4, zc - 0.12, zc + 0.12], 0.55, 0.75); // Verstärker
      b.box('schwarz', [x1 + 0.19, x1 + 0.2, zc - 0.1, zc + 0.1], 0.6, 0.7);
      sign(ctx.extra, brand.name, { w: 0.9, h: 0.24, bg: brand.farbe, fg: '#1c1c1f', font: '700' }, x1 - 0.005, 1.85, zc, [-1, 0]);
    });
  },

  beratungstisch(b, m) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    tableLegs(b, m.rechteck, h - 0.05);
    b.box('holzHell', [x1, x2, z1, z2], h - 0.05, h);
    const xc = (x1 + x2) / 2;
    const zc = (z1 + z2) / 2;
    turntable(b, xc, h, zc, [-1, 0], 'holz');
    speaker(b, xc + 0.15, h, z1 + 0.15, [-1, 0], 0.3);
    speaker(b, xc + 0.15, h, z2 - 0.15, [-1, 0], 0.3);
  },

  kasse(b, m) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    b.box('korpus', [x1, x2, z1 + 0.05, z2], 0, h - 0.05);
    b.box('holz', [x1 - 0.05, x2 + 0.05, z1 - 0.05, z2 + 0.05], h - 0.05, h);
    b.box('akzent', [x1, x2, z2, z2 + 0.01], h - 0.25, h - 0.18);
    // Kasse (Bildschirm zum Personal), Kartenterminal zur Kundenseite
    const xc = x1 + (x2 - x1) * 0.6;
    b.box('schwarz', [xc - 0.18, xc + 0.18, z1 + 0.25, z1 + 0.55], h, h + 0.08);
    b.geo('schwarz', G.box(0.34, 0.24, 0.02), xc, h + 0.26, z1 + 0.35, 0, 0.25);
    b.geo('bildschirm', G.box(0.3, 0.2, 0.005), xc, h + 0.26, z1 + 0.337, 0, 0.25);
    b.geo('schwarz', G.box(0.08, 0.03, 0.15), x1 + 0.5, h + 0.015, z2 - 0.12, 0, 0);
    // Tüten
    b.box('weiss', [x2 - 0.5, x2 - 0.2, z1 + 0.2, z1 + 0.5], h, h + 0.03);
  },

  gondel(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const H = m.hoehe;
    const xm = (x1 + x2) / 2;
    const acc = ctx.acc;
    b.box('korpus', [x1 + 0.05, x2 - 0.05, z1 + 0.05, z2 - 0.05], 0, 0.1);
    b.box('korpus', [xm - 0.03, xm + 0.03, z1, z2], 0, H);
    b.box('akzent', [xm - 0.035, xm + 0.035, z1 - E, z2 + E], H - 0.04, H + E); // größer als die Mittelwand → kein Flimmern
    // Kopfschild oben auf der Gondel
    b.box('korpus', [xm - 0.02, xm + 0.02, z1 + 0.3, z2 - 0.3], H + E, H + 0.24);
    sign(ctx.extra, m.schild, { w: 0.86, h: 0.18, bg: '#1c1c1f', fg: '#e8772e' }, xm + 0.022, H + 0.13, (z1 + z2) / 2, [1, 0]);
    sign(ctx.extra, m.schild, { w: 0.86, h: 0.18, bg: '#1c1c1f', fg: '#e8772e' }, xm - 0.022, H + 0.13, (z1 + z2) / 2, [-1, 0]);

    const levels = [0.1, 0.45, 0.8, 1.12];
    const along = (n, pad = 0.18) => Array.from({ length: n }, (_, i) => z1 + pad + ((z2 - z1 - 2 * pad) * i) / Math.max(1, n - 1));
    // Seite B zeigt zur Kassenschlange (+x), Seite A zu den Neuheiten (-x)
    const sides = [
      { dir: [1, 0], a: xm + 0.03, e: x2 - 0.05, items: [
        ['Schutzhüllen 25 Stk.', '8,90 €', (y, x, d) => along(4).forEach((z) => acc.outerStack(b, x, y, z, 3))],
        ['Innenhüllen 50 Stk.', '14,90 €', (y, x, d) => along(4).forEach((z) => acc.sleevePack(b, x - 0.04, y, z, d))],
        ['Reinigungsspray 250 ml', '9,90 €', (y, x, d) => along(6, 0.12).forEach((z) => [-0.08, 0.08].forEach((o) => acc.spray(b, x + o, y, z, d)))],
        ['Plattenbürste Carbon', '12,90 €', (y, x, d) => along(5, 0.14).forEach((z) => [-0.09, 0.07].forEach((o) => acc.brush(b, x + o, y, z, d)))],
      ] },
      { dir: [-1, 0], a: x1 + 0.05, e: xm - 0.03, items: [
        ['Tote Bag „Rille 33“', '12,00 €', (y, x, d) => along(4).forEach((z) => acc.toteFolded(b, x, y, z, 4))],
        ['Innenhüllen 50 Stk.', '14,90 €', (y, x, d) => along(4).forEach((z) => acc.sleevePack(b, x + 0.04, y, z, d))],
        ['Ersatznadel Diamant', '29,90 €', (y, x, d) => along(8, 0.1).forEach((z) => [-0.07, 0.07].forEach((o) => acc.stylus(b, x + o, y, z, d)))],
        ['Slipmat Filz', '14,90 €', (y, x, d) => along(4).forEach((z, i) => acc.slipmat(b, x + 0.03, y, z, d, i % 2))],
      ] },
    ];
    for (const side of sides) {
      const x = (side.a + side.e) / 2;
      const front = side.dir[0] > 0 ? side.e : side.a;
      side.items.forEach(([name, price, place], li) => {
        const y = levels[li];
        if (y > 0.1) b.box('holz', [side.a, side.e, z1 + 0.02, z2 - 0.02], y - 0.02, y);
        place(y, x, side.dir);
        // Preisschild an der Regalkante
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.0625), priceLabel(name, price));
        label.position.set(front + side.dir[0] * 0.004, y - (y > 0.1 ? 0.05 : 0.03), -(z1 + z2) / 2);
        label.rotation.y = yawFacing(...side.dir);
        ctx.extra.add(label);
      });
    }
    // Stirnseiten: Tote Bags an Haken (Stirnseite bei z1 zeigt zur Kasse)
    for (const [z, dz] of [[z1, -1], [z2, 1]]) {
      for (const ox of [-0.22, 0.22]) acc.toteHanging(b, xm + ox, 1.32, z, [0, dz]);
    }
  },

  lagerregal(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const H = m.hoehe;
    const alongX = x2 - x1 >= z2 - z1;
    // Front zeigt zur Raummitte des Lagers
    const zone = ctx.layout.zonen.find((z) => z.rechteck[0] <= (x1 + x2) / 2 && (x1 + x2) / 2 <= z.rechteck[1] && z.rechteck[2] <= (z1 + z2) / 2 && (z1 + z2) / 2 <= z.rechteck[3]);
    const [cx, cz] = zone ? [(zone.rechteck[0] + zone.rechteck[1]) / 2, (zone.rechteck[2] + zone.rechteck[3]) / 2] : [6, 7.5];
    const dir = alongX ? [0, cz > (z1 + z2) / 2 ? 1 : -1] : [cx > (x1 + x2) / 2 ? 1 : -1, 0];
    const t = 0.035;
    for (const x of [x1, x2 - t]) for (const z of [z1, z2 - t]) b.box('metall', [x, x + t, z, z + t], 0, H);
    // Zwischenstützen bei langen Regalen
    const len = alongX ? x2 - x1 : z2 - z1;
    const bays = Math.max(1, Math.round(len / 1.05));
    for (let i = 1; i < bays; i++) {
      const p = (alongX ? x1 : z1) + (len * i) / bays;
      if (alongX) for (const z of [z1, z2 - t]) b.box('metall', [p - t / 2, p + t / 2, z, z + t], 0, H);
      else for (const x of [x1, x2 - t]) b.box('metall', [x, x + t, p - t / 2, p + t / 2], 0, H);
    }
    const shelves = [0.08, 0.62, 1.16, 1.7, H - 0.02];
    const labels = m.kartons || ['LAGER'];
    let n = 0;
    shelves.forEach((y, si) => {
      b.box('metall', [x1, x2, z1, z2], y - 0.02, y);
      if (si === shelves.length - 1) return;
      const depth = (alongX ? z2 - z1 : x2 - x1) - 0.06;
      const perBay = 2;
      for (let bay = 0; bay < bays; bay++) {
        for (let k = 0; k < perBay; k++) {
          if (ctx.rand() < 0.15) continue; // Lücken wirken echter
          const f = (bay + (k + 0.5) / perBay) / bays;
          const w = len / bays / perBay - 0.06;
          const h = 0.3 + ctx.rand() * 0.14;
          const px = alongX ? x1 + f * len : (x1 + x2) / 2;
          const pz = alongX ? (z1 + z2) / 2 : z1 + f * len;
          acc(ctx).carton(b, labels[n++ % labels.length], px, y, pz, dir, [w, Math.min(h, 0.46), Math.min(depth, 0.42)]);
        }
      }
    });
  },

  schreibtisch(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const h = m.hoehe;
    tableLegs(b, m.rechteck, h - 0.03);
    b.box('holzHell', [x1, x2, z1, z2], h - 0.03, h);
    const xc = (x1 + x2) / 2;
    // Schreibtisch steht an der Wand (z1), Stuhl auf der Raumseite (z2)
    b.geo('schwarz', G.box(0.56, 0.34, 0.03), xc, h + 0.3, z1 + 0.2, Math.PI);
    b.geo('bildschirm', G.box(0.52, 0.3, 0.005), xc, h + 0.3, z1 + 0.218, Math.PI);
    b.box('metall', [xc - 0.03, xc + 0.03, z1 + 0.16, z1 + 0.2], h, h + 0.14);
    b.box('metall', [xc - 0.12, xc + 0.12, z1 + 0.1, z1 + 0.26], h, h + 0.01);
    b.box('schwarz', [xc - 0.22, xc + 0.22, z1 + 0.38, z1 + 0.52], h, h + 0.02); // Tastatur
    b.box('weiss', [x1 + 0.1, x1 + 0.4, z1 + 0.3, z1 + 0.6], h, h + 0.01); // Lieferscheine
    // Ordner
    const binder = ['#2f5d8a', '#e8772e', '#3d405b', '#5b6d5b'];
    binder.forEach((c, i) => {
      const key = `ordner-${i}`;
      if (!b.materials[key]) b.materials[key] = std(new THREE.Color(c), 0.7);
      b.box(key, [x2 - 0.35 + i * 0.07, x2 - 0.29 + i * 0.07, z1 + 0.05, z1 + 0.33], h, h + 0.32);
    });
    // Bürostuhl
    const cz = z2 + 0.38;
    b.geo('metall', G.disc(0.26, 0.03, 5), xc, 0.05, cz);
    b.geo('metall', G.disc(0.03, 0.42, 10), xc, 0.26, cz);
    b.box('korpus', [xc - 0.23, xc + 0.23, cz - 0.23, cz + 0.23], 0.46, 0.53);
    b.box('korpus', [xc - 0.22, xc + 0.22, cz + 0.2, cz + 0.25], 0.55, 1.05);
  },

  kartonstapel(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const labels = ['VERSAND', 'RETOURE', 'NEUWARE', 'VERSAND'];
    const w = (x2 - x1) / 2 - 0.02;
    let n = 0;
    for (let level = 0; level < 3; level++) {
      for (let i = 0; i < 2; i++) {
        if (level === 2 && i === 1) continue;
        acc(ctx).carton(b, labels[n++ % labels.length], x1 + w / 2 + 0.01 + i * (w + 0.02), level * 0.34, (z1 + z2) / 2, [0, -1], [w, 0.33, z2 - z1 - 0.05]);
      }
    }
  },
};

// Grundriss-Rechtecke eines Möbels (für Kollision und Beschriftung)
export function footprints(m) {
  if (m.stationen) {
    const r = m.durchmesser / 2 - 0.05;
    return m.stationen.map(([x, z]) => [x - r, x + r, z - r, z + r]);
  }
  const list = [m.rechteck];
  if (m.hocker_x) for (const x of m.hocker_x) list.push([x - 0.2, x + 0.2, m.hocker_z - 0.2, m.hocker_z + 0.2]);
  return list;
}

export function buildFurniture(layout) {
  const rand = rng(33);
  const b = new Builder({ ...MATERIALS });
  const covers = new Covers(layout.cover_farben, rand);
  const decor = new Decor();
  Object.assign(b.materials, decor.builderMaterials);
  const colliders = [];
  const ctx = { rand, covers, extra: b.extra, layout, acc: new AccessoryKit(), drawers: new Drawers(MATERIALS, covers), mats: MATERIALS, builder: b, colliders };
  for (const m of layout.moebel) {
    const fn = BUILDERS[m.typ];
    if (!fn) {
      console.warn(`Unbekannter Möbeltyp: ${m.typ} (${m.id})`);
      continue;
    }
    if (m.typ === 'bar') decor.bar(b, m, ctx);
    else if (m.typ === 'kasse') decor.kasse(b, m, ctx);
    else fn(b, m, ctx);
    decor.details(b, m, ctx);
    colliders.push(...footprints(m));
  }
  colliders.push(...decor.wall(ctx, layout));

  // Menschen im Laden (belebt die Szene): Personal und stöbernde Kundschaft
  const people = [
    // [x, z, Blickrichtung, Haltung, Personal?]
    [8.1, 14.25, [0, -1], 'arbeiten', true], // Barkraft im Arbeitsgang
    [10.3, 1.45, [0, 1], 'arbeiten', true], // Kasse
    [1.15, 7.3, [-1, 0], 'stoebern'], // Genre-Wand
    [1.2, 4.1, [-1, 0], 'stoebern'],
    [4.45, 8.0, [1, 0], 'stoebern'], // Second-Hand (außen an den Kisten, Gang bleibt frei)
    [7.95, 9.3, [-1, 0], 'stoebern'],
    [5.25, 11.95, [1, 0], 'stoebern'], // Hörstation (seitlich, Hauptweg bleibt frei)
    [9.15, 12.75, [0, 1], 'stehen'], // Bargast
    [10.6, 9.0, [1, 0], 'stehen'], // Hardware
    [4.6, 4.5, [0, -1], 'stoebern'], // Neuheiten
  ];
  const staffLook = { top: '#1c1c1f', bag: false, apron: true, jacket: null, skirt: false, sleeves: 'kurz' };
  for (const [x, z, dir, pose, staff] of people) {
    addStaticPerson(b, randomLook(rand, staff ? staffLook : {}), x, z, yawFacing(...dir), pose);
    if (!staff) colliders.push([x - 0.22, x + 0.22, z - 0.22, z + 0.22]); // Personal blockiert Arbeitsgang/Kasse nicht
  }

  // Lüftungsrohr unter der Decke mit Abhängungen (eigene Gruppe → in der Draufsicht ausgeblendet)
  const duct = new Builder(MATERIALS);
  for (const [a, e, zz] of [[1.6, 10.6, 7.6]]) {
    const b = duct;
    b.geo('chrom', new THREE.CylinderGeometry(0.16, 0.16, e - a, 24), (a + e) / 2, 2.92, zz, 0, 0, Math.PI / 2);
    for (let x = a + 0.5; x < e; x += 1.5) {
      b.geo('metall', new THREE.TorusGeometry(0.165, 0.012, 6, 24), x, 2.92, zz, Math.PI / 2);
      b.box('metall', [x - 0.006, x + 0.006, zz - 0.006, zz + 0.006], 3.08, 3.2);
    }
    for (let x = a + 1.2; x < e; x += 3) b.box('metall', [x - 0.12, x + 0.12, zz - 0.08, zz + 0.08], 2.72, 2.77); // Luftauslass
  }
  const ductGroup = duct.build('Lueftung');
  // Feuerlöscher mit Schild neben dem Notausgang
  const fx = 11.84;
  const fz = 11.5;
  if (!b.materials.rot) b.materials.rot = std(0xc0282b, 0.4);
  b.geo('rot', new THREE.CylinderGeometry(0.075, 0.075, 0.5, 20), fx, 0.55, fz);
  b.geo('schwarz', new THREE.CylinderGeometry(0.03, 0.04, 0.08, 12), fx, 0.84, fz);
  b.box('metall', [11.95, 12, fz - 0.05, fz + 0.05], 0.5, 0.9);
  sign(ctx.extra, 'FEUERLÖSCHER', { w: 0.28, h: 0.1, bg: '#c0282b', fg: '#ffffff' }, 11.99, 1.1, fz, [-1, 0]);
  const group = b.build('Möbel');
  group.add(ctx.covers.build());
  group.add(ctx.drawers.build());
  group.add(ductGroup);
  return { group, colliders, drawers: ctx.drawers };
}
