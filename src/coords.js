// Umrechnung Store-Koordinaten (SPEC Kap. 2) ↔ Three.js.
// Store: x = Breite nach rechts, z = Tiefe von der Straße weg, y = Höhe.
// Three.js: rechtshändig, Kamera schaut standardmäßig nach -z.
// → three.x = x, three.y = y, three.z = -z. So blickt man mit Blickrichtung 0 in den Laden hinein.
import * as THREE from 'three';

export function toThree(x, y, z, target = new THREE.Vector3()) {
  return target.set(x, y, -z);
}

// Mittelpunkt und Größe eines Rechtecks [x1, x2, z1, z2]
export function rectCenter([x1, x2, z1, z2]) {
  return { x: (x1 + x2) / 2, z: (z1 + z2) / 2, w: Math.abs(x2 - x1), d: Math.abs(z2 - z1) };
}

// Box auf dem Boden (Unterkante y0) für ein Store-Rechteck
export function placeBox(mesh, rect, height, y0 = 0) {
  const c = rectCenter(rect);
  mesh.scale.set(c.w, height, c.d);
  toThree(c.x, y0 + height / 2, c.z, mesh.position);
  return mesh;
}
