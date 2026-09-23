// Öffnenbare Schubladen (Bückzone der Genre-Wand): alle Teile als Instanzen, beim Öffnen werden nur die
// Matrizen der betroffenen Schublade verschoben – 36 Schubladen kosten so nur ein paar Draw Calls.
import * as THREE from 'three';

const unit = new THREE.BoxGeometry(1, 1, 1);
const OPEN = 0.4; // Auszug in Metern
const SPEED = 1.6; // m/s

export class Drawers {
  constructor(materials, covers) {
    this.materials = materials;
    this.covers = covers;
    this.list = [];
  }

  // Schublade in Store-Koordinaten; Front bei x2, zieht in +x-Richtung auf
  add({ x1, x2, z1, z2, y0, y1 }) {
    this.list.push({ x1, x2, z1, z2, y0, y1, open: 0, target: 0 });
  }

  build() {
    const group = new THREE.Group();
    group.name = 'Schubladen';
    const boxes = { front: [], handle: [], tray: [] };
    const records = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const box = (list, d, [x1, x2, z1, z2], y0, y1) => {
      m.compose(new THREE.Vector3((x1 + x2) / 2, (y0 + y1) / 2, -(z1 + z2) / 2), q, new THREE.Vector3(x2 - x1, y1 - y0, z2 - z1));
      list.push({ drawer: d, base: m.clone() });
    };
    this.list.forEach((d, i) => {
      const { x1, x2, z1, z2, y0, y1 } = d;
      const xf = x2 - 0.01; // Frontfläche
      const xb = x1 + 0.06; // Rückseite des Kastens
      const zc = (z1 + z2) / 2;
      box(boxes.front, i, [xf - 0.02, xf, z1, z2], y0, y1);
      box(boxes.handle, i, [xf, xf + 0.02, zc - 0.07, zc + 0.07], y0 + 0.17, y0 + 0.19);
      box(boxes.tray, i, [xb, xf - 0.02, z1 + 0.01, z2 - 0.01], y0, y0 + 0.012); // Boden
      box(boxes.tray, i, [xb, xf - 0.02, z1 + 0.01, z1 + 0.022], y0, y0 + 0.16); // Seiten
      box(boxes.tray, i, [xb, xf - 0.02, z2 - 0.022, z2 - 0.01], y0, y0 + 0.16);
      box(boxes.tray, i, [xb, xb + 0.012, z1 + 0.01, z2 - 0.01], y0, y0 + 0.16); // Rückwand
      // Nachschub: ein Stapel eingeschweißter Platten
      const n = 5 + (i % 4);
      for (let k = 0; k < n; k++) records.push({ drawer: i, x: (xb + xf) / 2 - 0.01, y: y0 + 0.016 + k * 0.0055, z: zc, pitch: -Math.PI / 2, yaw: (k % 3) * 0.03 });
    });

    const inst = (name, list, material) => {
      const im = new THREE.InstancedMesh(unit, material, list.length);
      im.name = name;
      list.forEach((p, k) => im.setMatrixAt(k, p.base));
      im.instanceMatrix.needsUpdate = true;
      group.add(im);
      return im;
    };
    this.meshes = {
      front: inst('Schubladenfront', boxes.front, this.materials.holzHell),
      handle: inst('Schubladengriff', boxes.handle, this.materials.metall),
      tray: inst('Schubladenkasten', boxes.tray, this.materials.holz),
    };
    this.parts = boxes;
    const rec = this.covers.build(records, 'Schubladeninhalt');
    this.meshes.records = rec;
    this.parts.records = records.map((r, k) => {
      const base = new THREE.Matrix4();
      rec.getMatrixAt(k, base);
      return { drawer: r.drawer, base };
    });
    group.add(rec);

    // Pro Schublade: welche Instanzen gehören dazu
    this.index = this.list.map(() => []);
    for (const [key, list] of Object.entries(this.parts)) list.forEach((p, k) => this.index[p.drawer].push([key, k]));
    for (const im of Object.values(this.meshes)) {
      im.frustumCulled = false; // Bounding-Sphere ändert sich beim Öffnen
    }
    return group;
  }

  // Trefferprüfung: Front oder Griff → Nummer der Schublade
  hit(raycaster, maxDist) {
    const m = this.meshes;
    const hits = raycaster.intersectObjects([m.front, m.handle, m.tray, m.records], false);
    const h = hits.find((x) => x.distance <= maxDist);
    if (!h) return -1;
    const key = Object.keys(m).find((k) => m[k] === h.object);
    return this.parts[key][h.instanceId].drawer;
  }

  toggle(i) {
    const d = this.list[i];
    d.target = d.target > 0 ? 0 : OPEN;
    return d.target > 0;
  }

  isOpen(i) {
    return this.list[i].target > 0;
  }

  update(dt) {
    const m = new THREE.Matrix4();
    const dirty = new Set();
    this.list.forEach((d, i) => {
      if (d.open === d.target) return;
      const step = SPEED * dt;
      d.open = d.open < d.target ? Math.min(d.target, d.open + step) : Math.max(d.target, d.open - step);
      for (const [key, k] of this.index[i]) {
        m.copy(this.parts[key][k].base);
        m.elements[12] += d.open; // entlang +x verschieben
        this.meshes[key].setMatrixAt(k, m);
        dirty.add(key);
      }
    });
    for (const key of dirty) this.meshes[key].instanceMatrix.needsUpdate = true;
  }
}
