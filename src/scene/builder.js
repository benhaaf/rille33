// Sammelt viele einfache Teile und fasst sie zu wenigen Draw Calls zusammen (wichtig für 60 fps auf dem iPad).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import config from '../config.js';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const tmp = new THREE.Object3D();

// Blickrichtung in Store-Koordinaten (dx, dz) → rotation.y in Three.js (Vorderseite = lokale +z-Achse)
export function yawFacing(dx, dz) {
  return Math.atan2(dx, -dz);
}

export class Builder {
  constructor(materials) {
    this.materials = materials; // name → Material
    this.parts = new Map(); // name → [BufferGeometry]
    this.instances = new Map(); // key → { geometry, material, items: [{matrix, color}] }
    this.extra = new THREE.Group();
  }

  // Quader über Store-Rechteck [x1, x2, z1, z2] von Höhe y0 bis y1
  // Kanten werden leicht abgerundet (weniger „blocky“); sehr dünne Teile bleiben eckig.
  box(mat, [x1, x2, z1, z2], y0, y1) {
    const w = Math.abs(x2 - x1);
    const h = y1 - y0;
    const d = Math.abs(z2 - z1);
    const r = Math.min(config.grafik.kantenRadius, Math.min(w, h, d) * 0.25);
    let g;
    if (config.grafik.kantenRadius > 0 && r >= 0.003) {
      g = new RoundedBoxGeometry(w, h, d, 1, r);
    } else {
      g = unitBox.clone();
      g.scale(w, h, d);
    }
    g.translate((x1 + x2) / 2, (y0 + y1) / 2, -(z1 + z2) / 2);
    this.add(mat, g);
  }

  // Beliebige Geometrie an Store-Position (x, y, z) mit Drehung yaw (rad, Three.js)
  geo(mat, geometry, x, y, z, yaw = 0, pitch = 0, roll = 0) {
    tmp.position.set(x, y, -z);
    tmp.rotation.set(pitch, yaw, roll, 'YXZ');
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    const g = geometry.clone();
    g.applyMatrix4(tmp.matrix);
    this.add(mat, g);
  }

  add(mat, g) {
    if (g.index) g = g.toNonIndexed();
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g);
  }

  // Instanz (z. B. Schallplatte). key gruppiert gleiche Geometrie + Material.
  instance(key, geometry, material, { x, y, z, yaw = 0, pitch = 0, roll = 0, color = null, scale = null }) {
    if (!this.instances.has(key)) this.instances.set(key, { geometry, material, items: [] });
    tmp.position.set(x, y, -z);
    tmp.rotation.set(pitch, yaw, roll, 'YXZ');
    if (scale) tmp.scale.set(scale[0], scale[1], scale[2]);
    else tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    this.instances.get(key).items.push({ matrix: tmp.matrix.clone(), color });
  }

  build(name = 'Möbel') {
    const group = new THREE.Group();
    group.name = name;
    for (const [mat, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, this.materials[mat]);
      mesh.name = mat;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
    }
    for (const [key, { geometry, material, items }] of this.instances) {
      const im = new THREE.InstancedMesh(geometry, material, items.length);
      im.name = key;
      const col = new THREE.Color();
      items.forEach((it, i) => {
        im.setMatrixAt(i, it.matrix);
        if (it.color) im.setColorAt(i, col.set(it.color));
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      group.add(im);
    }
    group.add(this.extra);
    return group;
  }
}

// Deterministischer Zufall, damit der Laden bei jedem Laden gleich aussieht
export function rng(seed = 33) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
