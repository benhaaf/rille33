// Etappe 3: Licht je Zone aus layout.json (Farbtemperatur, Stärke, Leuchtentyp) + Spots.
import * as THREE from 'three';
import config from '../config.js';
import { Builder } from './builder.js';

// Farbtemperatur (Kelvin) → RGB (Näherung nach Tanner Helland)
export function kelvinToColor(k) {
  const t = k / 100;
  let r;
  let g;
  let b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE.Color(c(r), c(g), c(b));
}

const CEILING = 3.2;

// Leuchten gleichmäßig über ein Rechteck verteilen
function grid([x1, x2, z1, z2], spacing) {
  const nx = Math.max(1, Math.round((x2 - x1) / spacing));
  const nz = Math.max(1, Math.round((z2 - z1) / spacing));
  const pts = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) pts.push([x1 + ((i + 0.5) * (x2 - x1)) / nx, z1 + ((j + 0.5) * (z2 - z1)) / nz]);
  return pts;
}

// Echte Lichtquellen entlang der längeren Achse der Zone
function sources([x1, x2, z1, z2], n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    if (x2 - x1 >= z2 - z1) pts.push([x1 + f * (x2 - x1), (z1 + z2) / 2]);
    else pts.push([(x1 + x2) / 2, z1 + f * (z2 - z1)]);
  }
  return pts;
}

export function buildLighting(layout, scene) {
  const B = layout.beleuchtung;
  const einfach = config.grafik.lichtEinfach || new URLSearchParams(location.search).get('licht') === 'einfach';
  const group = new THREE.Group();
  group.name = 'Licht';

  const g = B.grundlicht;
  group.add(new THREE.HemisphereLight(g.himmel, g.boden, g.staerke));
  // Tageslicht durchs Schaufenster
  const day = new THREE.DirectionalLight(0xdfe9f5, 0.6);
  day.position.set(5, 6, 8); // Straßenseite (Store z < 0 → Three +z)
  day.target.position.set(6, 0, -6);
  group.add(day, day.target);

  // Sichtbare Leuchten (emissiv, kein Rechenaufwand)
  const glow = {};
  const b = new Builder({
    gehaeuse: new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide }),
    schiene: new THREE.MeshStandardMaterial({ color: 0x111112, roughness: 0.5 }),
  });
  const glowMat = (kelvin) => {
    const key = `glow-${kelvin}`;
    if (!glow[key]) b.materials[key] = glow[key] = new THREE.MeshBasicMaterial({ color: kelvinToColor(kelvin).multiplyScalar(1.4) });
    return key;
  };
  const shade = new THREE.CylinderGeometry(0.1, 0.22, 0.2, 16, 1, true);
  const bulb = new THREE.SphereGeometry(0.06, 10, 8);
  const cable = new THREE.CylinderGeometry(0.006, 0.006, 1, 4);
  const spotHead = new THREE.CylinderGeometry(0.05, 0.06, 0.16, 10);

  for (const z of layout.zonen) {
    const L = z.licht;
    if (!L) continue;
    const color = kelvinToColor(L.kelvin);
    const n = einfach ? 1 : L.lichtquellen;
    for (const [x, zz] of sources(z.rechteck, n)) {
      const light = new THREE.PointLight(color, 9 * L.staerke * (einfach ? L.lichtquellen : 1), 9, 1.4);
      light.position.set(x, 2.7, -zz);
      group.add(light);
    }

    const gm = glowMat(L.kelvin);
    const pts = grid(z.rechteck, L.abstand);
    if (L.leuchte === 'pendel') {
      for (const [x, zz] of pts) {
        const y = 2.35;
        b.geo('schiene', cable, x, y + (CEILING - y) / 2, zz);
        b.geo('gehaeuse', shade, x, y, zz);
        b.geo(gm, bulb, x, y - 0.05, zz);
      }
    } else if (L.leuchte === 'panel') {
      for (const [x, zz] of pts) {
        b.box('gehaeuse', [x - 0.33, x + 0.33, zz - 0.33, zz + 0.33], CEILING - 0.04, CEILING);
        b.box(gm, [x - 0.3, x + 0.3, zz - 0.3, zz + 0.3], CEILING - 0.045, CEILING - 0.04);
      }
    } else if (L.leuchte === 'strahler') {
      // Stromschiene entlang der längeren Achse mit Strahlern
      const [x1, x2, z1, z2] = z.rechteck;
      const alongX = x2 - x1 >= z2 - z1;
      const cx = (x1 + x2) / 2;
      const cz = (z1 + z2) / 2;
      if (alongX) b.box('schiene', [x1 + 0.3, x2 - 0.3, cz - 0.02, cz + 0.02], CEILING - 0.04, CEILING);
      else b.box('schiene', [cx - 0.02, cx + 0.02, z1 + 0.3, z2 - 0.3], CEILING - 0.04, CEILING);
      const len = alongX ? x2 - x1 : z2 - z1;
      const cnt = Math.max(2, Math.round(len / L.abstand));
      for (let i = 0; i < cnt; i++) {
        const f = (i + 0.5) / cnt;
        const x = alongX ? x1 + f * (x2 - x1) : cx;
        const zz = alongX ? cz : z1 + f * (z2 - z1);
        b.geo('gehaeuse', spotHead, x, CEILING - 0.14, zz, 0, 0.5);
        b.geo(gm, new THREE.CircleGeometry(0.045, 10), x, CEILING - 0.215, zz, 0, Math.PI / 2 + 0.5);
      }
    }
  }

  // Spots (echte SpotLights, ohne Schatten)
  if (!einfach) {
    for (const s of B.spots) {
      const spot = new THREE.SpotLight(kelvinToColor(s.kelvin), s.staerke, 7, THREE.MathUtils.degToRad(s.winkel / 2), 0.45, 1.3);
      spot.position.set(s.von[0], s.von[1], -s.von[2]);
      spot.target.position.set(s.auf[0], s.auf[1], -s.auf[2]);
      group.add(spot, spot.target);
      b.geo('gehaeuse', spotHead, s.von[0], s.von[1] - 0.02, s.von[2]);
    }
  }

  group.add(b.build('Leuchten'));
  scene.add(group);
  return group;
}
