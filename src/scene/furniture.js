// Etappe 2: Möbel und Warenträger M1–M12 aus layout.json.
import * as THREE from 'three';
import { Builder, yawFacing, rng } from './builder.js';
import { Covers, COVER } from './covers.js';
import { signMesh } from './labels.js';

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
  disc: (r, h, seg = 24) => new THREE.CylinderGeometry(r, r, h, seg),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
};

const Y_AXIS_TO_X = Math.PI / 2; // roll: Zylinderachse von y nach x drehen

// Plattenspieler, Front zeigt in Richtung (dx, dz)
function turntable(b, x, y, z, [dx, dz], plinth = 'holz') {
  const yaw = yawFacing(dx, dz);
  b.geo(plinth, G.box(0.44, 0.09, 0.34), x, y + 0.045, z, yaw);
  b.geo('schwarz', G.disc(0.15, 0.02), x - dz * 0.04, y + 0.1, z + dx * 0.04);
  b.geo('akzent', G.disc(0.045, 0.024), x - dz * 0.04, y + 0.101, z + dx * 0.04);
  // Tonarm
  b.geo('chrom', G.box(0.012, 0.012, 0.2), x + dz * 0.15 - dx * 0.02, y + 0.12, z - dx * 0.15 - dz * 0.02, yaw + 0.35);
}

function speaker(b, x, y, z, [dx, dz], h = 0.34) {
  const yaw = yawFacing(dx, dz);
  b.geo('korpus', G.box(0.22, h, 0.24), x, y + h / 2, z, yaw);
  // Membranen auf der Front
  const fx = x + dx * 0.121;
  const fz = z + dz * 0.121;
  b.geo('schwarz', G.disc(0.075, 0.01), fx, y + h * 0.35, fz, yaw, Math.PI / 2);
  b.geo('schwarz', G.disc(0.035, 0.01), fx, y + h * 0.75, fz, yaw, Math.PI / 2);
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
    sign(ctx.extra, m.schild, { w: 1.3, h: 0.16, bg: '#1c1c1f', fg: '#e8772e' }, cx, 0.12, z1 - 0.01, [0, -1]);
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
    b.box('korpus', [x1, x1 + 0.04, z1, z2], 0, H); // Rückwand
    b.box('holz', [x1, x2 + 0.02, z1, z2], H - 0.04, H); // Abschluss oben
    for (let i = 0; i <= segs.length; i++) {
      const z = z1 + i * L;
      b.box('holz', [x1, x2, Math.max(z1, z - 0.015), Math.min(z2, z + 0.015)], 0, H);
    }
    segs.forEach((genre, i) => {
      const s1 = z1 + i * L + 0.015;
      const s2 = z1 + (i + 1) * L - 0.015;
      const sw = s2 - s1;

      // Bückzone (< 0,6 m): Schubladen mit Nachschub
      for (let row = 0; row < 2; row++) {
        const y0 = 0.04 + row * 0.28;
        for (let k = 0; k < 3; k++) {
          const a = s1 + (k * sw) / 3 + 0.01;
          const e = s1 + ((k + 1) * sw) / 3 - 0.01;
          b.box('holzHell', [x1 + 0.04, x2 - 0.01, a, e], y0, y0 + 0.26);
          const zc = (a + e) / 2;
          b.box('metall', [x2 - 0.01, x2 + 0.01, zc - 0.07, zc + 0.07], y0 + 0.17, y0 + 0.19);
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
      b.geo('metall', G.disc(0.035, h - 0.04, 12), x, (h - 0.04) / 2, z);
      b.geo('holz', G.disc(r, 0.04, 32), x, h - 0.02, z);
      // Plattenspieler, Front Richtung Laden (Kunde steht auf der Ladenseite)
      turntable(b, x, h, z + 0.05, [0, -1], 'weiss');
      // Kopfhörer: Bügel + zwei Muscheln, liegend
      const hx = x + 0.23;
      const hz = z - 0.12;
      b.geo('schwarz', new THREE.TorusGeometry(0.075, 0.01, 6, 16, Math.PI), hx, h + 0.012, hz, 0, -Math.PI / 2);
      b.geo('schwarz', G.disc(0.04, 0.03, 12), hx + 0.075, h + 0.015, hz);
      b.geo('schwarz', G.disc(0.04, 0.03, 12), hx - 0.075, h + 0.015, hz);
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
      b.geo('metall', G.disc(0.025, 0.74, 10), x, 0.39, z);
      b.geo('chrom', new THREE.TorusGeometry(0.15, 0.012, 6, 20), x, 0.3, z, 0, Math.PI / 2);
      b.geo('polster', G.disc(0.19, 0.07), x, 0.79, z);
    }
  },

  'hardware-wand'(b, m, ctx) {
    const [x1, x2, z1, z2] = m.rechteck;
    const H = m.hoehe;
    const brands = m.marken;
    const L = (z2 - z1) / brands.length;
    b.box('korpus', [x2 - 0.05, x2, z1, z2], 0, H);
    b.box('korpus', [x1, x2, z1, z2], 0, 0.1);
    b.box('holz', [x1, x2, z1, z2], H - 0.04, H);
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
    b.box('korpus', [x1 + 0.05, x2 - 0.05, z1 + 0.05, z2 - 0.05], 0, 0.1);
    b.box('korpus', [xm - 0.03, xm + 0.03, z1, z2], 0, H);
    b.box('akzent', [xm - 0.035, xm + 0.035, z1, z2], H - 0.04, H);
    const item = G.box(1, 1, 1);
    const itemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const colors = ['#e8e4dc', '#e8e4dc', '#1c1c1f', '#d9c7a1', '#e8772e', '#3d405b', '#6b705c'];
    for (const [a, e] of [[x1 + 0.05, xm - 0.03], [xm + 0.03, x2 - 0.05]]) {
      for (const y of [0.1, 0.45, 0.8, 1.12]) {
        if (y > 0.1) b.box('holz', [a, e, z1 + 0.02, z2 - 0.02], y - 0.02, y);
        for (let z = z1 + 0.1; z < z2 - 0.1; ) {
          const w = 0.08 + ctx.rand() * 0.1;
          const hh = 0.1 + ctx.rand() * 0.14;
          const d = (e - a) * (0.6 + ctx.rand() * 0.3);
          const x = a < xm ? a + d / 2 + 0.02 : e - d / 2 - 0.02;
          b.instance('zubehoer', item, itemMat, { x, y: y + hh / 2, z: z + w / 2, scale: [d, hh, w], color: colors[Math.floor(ctx.rand() * colors.length)] });
          z += w + 0.03;
        }
      }
    }
    sign(ctx.extra, m.schild, { w: 0.9, h: 0.16, bg: '#1c1c1f', fg: '#e8772e' }, xm + 0.032, 1.3, (z1 + z2) / 2, [1, 0]);
    sign(ctx.extra, m.schild, { w: 0.9, h: 0.16, bg: '#1c1c1f', fg: '#e8772e' }, xm - 0.032, 1.3, (z1 + z2) / 2, [-1, 0]);
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
  const ctx = { rand, covers: new Covers(layout.cover_farben, rand), extra: b.extra };
  const colliders = [];
  for (const m of layout.moebel) {
    const fn = BUILDERS[m.typ];
    if (!fn) {
      console.warn(`Unbekannter Möbeltyp: ${m.typ} (${m.id})`);
      continue;
    }
    fn(b, m, ctx);
    colliders.push(...footprints(m));
  }
  // Rückbuffet der Bar steht an der Wand
  const bar = layout.moebel.find((m) => m.typ === 'bar');
  if (bar) colliders.push([bar.rechteck[0], bar.rechteck[1], 14.6, 15]);
  const group = b.build('Möbel');
  group.add(ctx.covers.build());
  return { group, colliders };
}
