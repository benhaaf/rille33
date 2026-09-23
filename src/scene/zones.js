// Zonen als halbtransparente Bodenflächen + Beschriftungen (Zonennamen, Möbel-IDs).
import * as THREE from 'three';
import { toThree } from '../coords.js';
import { textSprite } from './labels.js';
import { footprints } from './furniture.js';

export function buildZones(layout) {
  const group = new THREE.Group();
  group.name = 'Zonen';

  // 1-m-Raster als Planungshilfe (gehört zur Zonen-Ansicht)
  const { breite: W, tiefe: D } = layout.raum;
  const n = Math.max(W, D);
  const grid = new THREE.GridHelper(n, n, 0x2a2a2a, 0x2a2a2a);
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  grid.material.depthWrite = false;
  grid.scale.set(W / n, 1, D / n);
  toThree(W / 2, 0.01, D / 2, grid.position);
  group.add(grid);

  // 3D-Beschriftungen (in der Draufsicht übernimmt das 2D-Overlay)
  const labels = new THREE.Group();
  labels.name = 'Beschriftungen';
  group.add(labels);
  group.userData.labels = labels;

  layout.zonen.forEach((z, i) => {
    const [x1, x2, z1, z2] = z.rechteck;
    const w = x2 - x1;
    const d = z2 - z1;
    const color = new THREE.Color(z.farbe);
    const y = 0.012 + i * 0.0015; // leicht versetzt, falls sich Zonen überlappen
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false }),
    );
    plane.rotation.x = -Math.PI / 2;
    toThree(x1 + w / 2, y, z1 + d / 2, plane.position);
    plane.renderOrder = 1;
    group.add(plane);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w - 0.04, d - 0.04)),
      new THREE.LineBasicMaterial({ color }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.copy(plane.position).setY(y + 0.001);
    group.add(edge);

    const label = textSprite([`${z.id} · ${z.name}`, z.typ], { height: 0.34, accent: z.farbe });
    toThree(x1 + w / 2, 2.95, z1 + d / 2, label.position);
    labels.add(label);
  });

  // Möbel-IDs
  for (const m of layout.moebel) {
    const [x1, x2, z1, z2] = footprints(m)[0];
    const label = textSprite(m.id, { height: 0.17, bg: 'rgba(232,119,46,0.92)', fg: '#1c1c1f' });
    const cx = m.stationen ? m.stationen[Math.floor(m.stationen.length / 2)][0] : (x1 + x2) / 2;
    toThree(cx, m.hoehe + 0.2, (z1 + z2) / 2, label.position);
    labels.add(label);
  }
  return group;
}

// Höhenmarken der Regalzonen an der Genre-Wand (M4)
export function buildShelfZones(layout) {
  const group = new THREE.Group();
  group.name = 'Regalzonen';
  const wand = layout.moebel.find((m) => m.typ === 'genre-wand');
  if (!wand) return group;
  const [, x2, z1, z2] = wand.rechteck;
  const len = z2 - z1;
  const fmt = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 1 });

  for (const rz of layout.regalzonen.zonen) {
    const h = rz.bis - rz.von;
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(len, h),
      new THREE.MeshBasicMaterial({ color: rz.farbe, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    );
    band.rotation.y = Math.PI / 2; // Front zeigt in +x (in den Gang)
    toThree(x2 + 0.03, rz.von + h / 2, z1 + len / 2, band.position);
    band.renderOrder = 3;
    group.add(band);

    // Grenzlinie oben
    if (rz.bis < wand.hoehe) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, len), new THREE.MeshBasicMaterial({ color: rz.farbe }));
      toThree(x2 + 0.035, rz.bis, z1 + len / 2, line.position);
      group.add(line);
    }

    const range = rz.von === 0 ? `unter ${fmt(rz.bis)} m` : rz.bis >= wand.hoehe ? `über ${fmt(rz.von)} m` : `${fmt(rz.von)}–${fmt(rz.bis)} m`;
    for (const z of [z1 - 0.15, z1 + len / 2]) {
      const label = textSprite([`${rz.name} · ${range}`, rz.inhalt], { height: 0.2, accent: rz.farbe });
      toThree(x2 + 0.45, rz.von + h / 2, z, label.position);
      group.add(label);
    }
  }
  return group;
}
