// Etappe 1: leerer Raum mit Wänden, Eingang, Schaufenster, Notausgang, Lagerwand.
import * as THREE from 'three';
import { placeBox, toThree } from '../coords.js';
import { labelTexture, hatchTexture } from './textures.js';

const unitBox = new THREE.BoxGeometry(1, 1, 1);

const mat = {
  wand: new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.9 }),
  boden: new THREE.MeshStandardMaterial({ color: 0x8a8782, roughness: 0.95 }),
  decke: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 1 }),
  akzent: new THREE.MeshStandardMaterial({ color: 0xe8772e, roughness: 0.6 }),
  glas: new THREE.MeshStandardMaterial({ color: 0xbfd9e6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false }),
  notausgang: new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.6 }),
  tuer: new THREE.MeshStandardMaterial({ color: 0x45464b, roughness: 0.7 }),
  strasse: new THREE.MeshStandardMaterial({ color: 0x3a3b3f, roughness: 1 }),
  gehweg: new THREE.MeshStandardMaterial({ color: 0x9a9893, roughness: 1 }),
  fussmatte: new THREE.MeshStandardMaterial({ color: 0x3b2f28, roughness: 1 }),
};

function box(material, rect, height, y0 = 0) {
  return placeBox(new THREE.Mesh(unitBox, material), rect, height, y0);
}

// Wand entlang einer Achse mit Öffnungen. axis 'x': Wand läuft in x-Richtung, fest liegt der z-Bereich [a, b].
function wallWithOpenings(group, { axis, from, to, a, b, height, openings }, material) {
  const rect = (s, e) => (axis === 'x' ? [s, e, a, b] : [a, b, s, e]);
  const sorted = [...openings].sort((o1, o2) => o1.von - o2.von);
  let cursor = from;
  for (const o of sorted) {
    if (o.von > cursor) group.add(box(material, rect(cursor, o.von), height));
    const unten = o.unten ?? 0;
    if (unten > 0) group.add(box(material, rect(o.von, o.bis), unten));
    if (o.hoehe < height) group.add(box(material, rect(o.von, o.bis), height - o.hoehe, o.hoehe));
    cursor = o.bis;
  }
  if (cursor < to) group.add(box(material, rect(cursor, to), height));
}

function sign(text, { bg, fg, w, h }) {
  const tex = labelTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w) });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

export function buildRoom(layout) {
  const { breite: W, tiefe: D, hoehe: H, wandstaerke: t } = layout.raum;
  const group = new THREE.Group();
  group.name = 'Raum';
  const colliders = [];

  const byWall = (w) => layout.oeffnungen.filter((o) => o.wand === w);

  // Außenwände (liegen außerhalb der Nutzfläche, damit 12 × 15 m innen frei bleiben)
  wallWithOpenings(group, { axis: 'x', from: -t, to: W + t, a: -t, b: 0, height: H, openings: byWall('front') }, mat.wand);
  wallWithOpenings(group, { axis: 'x', from: -t, to: W + t, a: D, b: D + t, height: H, openings: byWall('rueck') }, mat.wand);
  wallWithOpenings(group, { axis: 'z', from: 0, to: D, a: -t, b: 0, height: H, openings: byWall('links') }, mat.wand);
  wallWithOpenings(group, { axis: 'z', from: 0, to: D, a: W, b: W + t, height: H, openings: byWall('rechts') }, mat.wand);
  // Kollision: Außenwände komplett (man verlässt den Laden nicht durch Tür oder Notausgang)
  colliders.push([-t - 1, W + t + 1, -t - 1, 0], [-t - 1, W + t + 1, D, D + t + 1], [-t - 1, 0, -t, D + t], [W, W + t + 1, -t, D + t]);

  // Boden, Decke
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat.boden);
  floor.rotation.x = -Math.PI / 2;
  toThree(W / 2, 0, D / 2, floor.position);
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat.decke);
  ceiling.rotation.x = Math.PI / 2;
  toThree(W / 2, H, D / 2, ceiling.position);
  group.add(ceiling);

  // 1-m-Raster als Orientierungshilfe
  const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D), 0x6f6c68, 0x7b7874);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.scale.set(W / Math.max(W, D), 1, D / Math.max(W, D));
  toThree(W / 2, 0.003, D / 2, grid.position);
  grid.name = 'Raster';
  group.add(grid);

  // Öffnungen ausgestalten
  for (const o of layout.oeffnungen) {
    const wz = o.wand === 'front' ? [-t, 0] : [D, D + t];
    const inner = o.wand === 'front' ? 0 : D;
    const dir = o.wand === 'front' ? 1 : -1; // Richtung ins Rauminnere
    const unten = o.unten ?? 0;
    // Orangefarbener Rahmen innen
    const f = 0.06;
    const fz = [wz[0] - 0.02, wz[1] + 0.02]; // leicht vor der Wand, sonst flimmert es (Z-Fighting)
    group.add(box(mat.akzent, [o.von - f, o.von, fz[0], fz[1]], o.hoehe - unten + f, unten));
    group.add(box(mat.akzent, [o.bis, o.bis + f, fz[0], fz[1]], o.hoehe - unten + f, unten));
    group.add(box(mat.akzent, [o.von - f, o.bis + f, fz[0], fz[1]], f, o.hoehe));

    if (o.typ === 'glas') {
      const pane = box(mat.glas, [o.von, o.bis, -t / 2 - 0.01, -t / 2 + 0.01], o.hoehe - unten, unten);
      pane.renderOrder = 2;
      group.add(pane);
    } else if (o.typ === 'tuer') {
      // Offene Glastür (nach außen aufgeschwenkt angedeutet) + Fußmatte innen
      group.add(box(mat.fussmatte, [o.von + 0.1, o.bis - 0.1, 0.05, 1.0], 0.01));
      const leaf = box(mat.glas, [o.von, o.von + (o.bis - o.von) / 2, -0.03, 0.0], o.hoehe - 0.05);
      leaf.renderOrder = 2;
      group.add(leaf);
    } else if (o.typ === 'notausgang') {
      const mid = (wz[0] + wz[1]) / 2;
      group.add(box(mat.notausgang, [o.von, o.bis, mid - 0.03, mid + 0.03], o.hoehe));
      const s = sign('NOTAUSGANG', { bg: '#1f8a4c', fg: '#ffffff', w: 0.9, h: 0.22 });
      toThree((o.von + o.bis) / 2, o.hoehe + 0.25, inner + 0.02 * dir, s.position);
      s.rotation.y = o.wand === 'front' ? Math.PI : 0;
      group.add(s);
    }
  }

  // Innenwände (Lager)
  for (const w of layout.innenwaende || []) {
    const [ax, az] = w.von;
    const [bx, bz] = w.bis;
    const half = 0.05;
    const openings = w.tuer ? [{ von: w.tuer.von, bis: w.tuer.bis, hoehe: w.tuer.hoehe }] : [];
    if (ax === bx) {
      wallWithOpenings(group, { axis: 'z', from: Math.min(az, bz), to: Math.max(az, bz), a: ax - half, b: ax + half, height: w.hoehe, openings }, mat.wand);
      if (w.tuer) {
        group.add(box(mat.tuer, [ax - half * 0.6, ax + half * 0.6, w.tuer.von, w.tuer.bis], w.tuer.hoehe));
        const s = sign('Lager – nur Personal', { bg: '#e8772e', fg: '#1c1c1f', w: 0.8, h: 0.16 });
        toThree(ax + half + 0.01, 1.6, (w.tuer.von + w.tuer.bis) / 2, s.position);
        s.rotation.y = Math.PI / 2;
        group.add(s);
      }
    } else {
      wallWithOpenings(group, { axis: 'x', from: Math.min(ax, bx), to: Math.max(ax, bx), a: az - half, b: az + half, height: w.hoehe, openings }, mat.wand);
    }
  }

  // Sperrflächen
  for (const s of layout.sperrflaechen || []) {
    colliders.push(s.rechteck);
    if (s.darstellung === 'schraffur-rot') {
      const [x1, x2, z1, z2] = s.rechteck;
      const tex = hatchTexture();
      tex.repeat.set((x2 - x1) * 2, (z2 - z1) * 2);
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(x2 - x1, z2 - z1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false }),
      );
      m.rotation.x = -Math.PI / 2;
      toThree((x1 + x2) / 2, 0.006, (z1 + z2) / 2, m.position);
      group.add(m);
      // Umrandung
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(x2 - x1, z2 - z1)),
        new THREE.LineBasicMaterial({ color: 0xd62828 }),
      );
      edge.rotation.x = -Math.PI / 2;
      edge.position.copy(m.position).setY(0.008);
      group.add(edge);
    }
  }

  // Straße und Gehweg vor dem Laden (durchs Schaufenster sichtbar)
  group.add(box(mat.gehweg, [-6, W + 6, -4, -t], 0.02, -0.02));
  group.add(box(mat.strasse, [-30, W + 30, -14, -4], 0.02, -0.12));
  // Gegenüberliegende Häuserzeile als einfache Blöcke
  const haus = new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: 1 });
  for (let i = -3; i < 6; i++) {
    const hgt = 7 + ((i * 37) % 5);
    group.add(box(haus, [i * 5 - 1, i * 5 + 3.6, -22, -16], hgt));
  }

  return { group, colliders };
}
