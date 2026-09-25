// Menschen im Stil der übrigen Szene: stilisiert-realistisch mit echten Proportionen, Gelenken,
// Gesicht, Frisuren und Kleidung. Ein gemeinsamer Aufbau (Gelenk-Hierarchie) wird entweder
// statisch in den Builder „gebacken“ (wenige Draw Calls) oder als animierte Figur genutzt (Simulation).
import * as THREE from 'three';

const SKIN = ['#f1d2b6', '#e8c4a0', '#d9a883', '#c99a72', '#a8714f', '#8d5a3b', '#6b4430'];
const HAIR = ['#2a1d15', '#3b2718', '#5a3a22', '#8a5a32', '#c9a15a', '#1c1c1f', '#8a4a2a', '#b8b3ab', '#d8c9a8'];
const TOP = ['#3d405b', '#b56576', '#e8772e', '#2f4550', '#6b705c', '#e9e4da', '#355070', '#81667a', '#9c6644', '#5b6d5b', '#c9ada7', '#1f3a4a'];
const BOTTOM = ['#2b3a55', '#3a4a5c', '#2b2c30', '#5b4a3a', '#1c1c1f', '#4a5a4a', '#6b6258', '#394b63'];
const SHOE = ['#1c1c1f', '#e9e4da', '#5a3a22', '#2b2c30', '#8a6242'];

// ---------- Geometrien (einmal erzeugt, von allen Figuren geteilt) ----------
const lathe = (pts, seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

const G = {
  // Oberkörper: Taille schmal, Brust/Schultern breiter (wird in der Tiefe gestaucht)
  torso: lathe([[0.001, 0], [0.13, 0], [0.14, 0.06], [0.128, 0.18], [0.15, 0.3], [0.168, 0.4], [0.17, 0.46], [0.13, 0.52], [0.06, 0.55], [0.001, 0.555]]),
  pelvis: lathe([[0.001, -0.12], [0.1, -0.12], [0.145, -0.07], [0.15, 0.0], [0.14, 0.07], [0.001, 0.07]]),
  skirt: lathe([[0.14, 0.04], [0.16, -0.08], [0.22, -0.42], [0.001, -0.42]], 20),
  collar: new THREE.TorusGeometry(0.062, 0.018, 8, 20),
  neck: new THREE.CylinderGeometry(0.046, 0.054, 0.08, 14),
  head: new THREE.SphereGeometry(1, 24, 18),
  nose: new THREE.ConeGeometry(0.016, 0.04, 8),
  ear: new THREE.SphereGeometry(1, 10, 8),
  eye: new THREE.SphereGeometry(0.011, 8, 6),
  brow: new THREE.BoxGeometry(0.03, 0.006, 0.008),
  mouth: new THREE.BoxGeometry(0.032, 0.005, 0.006),
  thigh: new THREE.CapsuleGeometry(0.072, 0.3, 4, 14),
  shin: new THREE.CapsuleGeometry(0.056, 0.32, 4, 12),
  upperArm: new THREE.CapsuleGeometry(0.047, 0.2, 4, 12),
  forearm: new THREE.CapsuleGeometry(0.041, 0.19, 4, 12),
  hand: new THREE.SphereGeometry(1, 12, 10),
  shoe: new THREE.CapsuleGeometry(0.048, 0.14, 4, 10),
  sole: new THREE.BoxGeometry(0.1, 0.022, 0.24),
  hairCap: new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
  hairLong: new THREE.CylinderGeometry(0.11, 0.12, 0.26, 18, 1, true, Math.PI * 0.2, Math.PI * 1.6),
  bun: new THREE.SphereGeometry(0.05, 12, 10),
  beard: new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.4),
  lens: new THREE.TorusGeometry(0.022, 0.004, 6, 16),
  bridge: new THREE.BoxGeometry(0.022, 0.004, 0.004),
  apron: new THREE.BoxGeometry(0.3, 0.62, 0.012),
  strap: new THREE.BoxGeometry(0.02, 0.24, 0.01),
  bag: new THREE.BoxGeometry(0.3, 0.34, 0.07),
  bagStrap: new THREE.TorusGeometry(0.2, 0.008, 5, 20, Math.PI),
  jacketFlap: new THREE.BoxGeometry(0.12, 0.44, 0.02),
};

const matCache = new Map();
function mat(color, rough = 0.85) {
  const key = `${color}|${rough}`;
  if (!matCache.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough });
    m.name = key;
    matCache.set(key, m);
  }
  return matCache.get(key);
}

export function randomLook(rand, overrides = {}) {
  const p = (a) => a[Math.floor(rand() * a.length)];
  const feminine = rand() < 0.5;
  return {
    skin: p(SKIN),
    hair: p(HAIR),
    hairStyle: feminine ? p(['lang', 'lang', 'dutt', 'bob']) : p(['kurz', 'kurz', 'kurz', 'glatze', 'bob']),
    beard: !feminine && rand() < 0.35,
    glasses: rand() < 0.3,
    top: p(TOP),
    bottom: p(BOTTOM),
    shoes: p(SHOE),
    sleeves: rand() < 0.35 ? 'kurz' : 'lang',
    jacket: rand() < 0.3 ? p(['#2b2c30', '#5b4a3a', '#3a4a5c', '#6b705c']) : null,
    skirt: feminine && rand() < 0.3,
    scale: feminine ? 0.93 + rand() * 0.08 : 0.98 + rand() * 0.09,
    width: feminine ? 0.92 : 1.04,
    bag: rand() < 0.35,
    apron: false,
    ...overrides,
  };
}

// ---------- Aufbau einer Figur (Füße bei y = 0, Blick in lokale +z-Richtung) ----------
function mesh(parent, geo, color, pos, rough, scale, rot) {
  const m = new THREE.Mesh(geo, mat(color, rough));
  m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  parent.add(m);
  return m;
}

function joint(parent, pos) {
  const j = new THREE.Group();
  j.position.set(...pos);
  parent.add(j);
  return j;
}

export function buildPerson(look) {
  const root = new THREE.Group();
  const body = joint(root, [0, 0, 0]);
  body.scale.setScalar(look.scale);
  const w = look.width;
  const skin = look.skin;
  const topColor = look.top;
  const J = { body, legs: [], arms: [] };

  // Becken und Beine
  const hips = joint(body, [0, 0.94, 0]);
  J.hips = hips;
  mesh(hips, G.pelvis, look.bottom, [0, 0, 0], 0.9, [w, 1, 0.78]);
  if (look.skirt) mesh(hips, G.skirt, look.bottom, [0, 0, 0], 0.9, [w, 1, 0.85]);
  for (const s of [-1, 1]) {
    const hip = joint(hips, [s * 0.085 * w, -0.05, 0]);
    const legColor = look.skirt ? skin : look.bottom;
    mesh(hip, G.thigh, look.skirt ? look.bottom : legColor, [0, -0.2, 0], 0.9, look.skirt ? [0.8, 1, 0.8] : null);
    const knee = joint(hip, [0, -0.42, 0]);
    mesh(knee, G.shin, look.skirt ? skin : look.bottom, [0, -0.2, 0], look.skirt ? 0.6 : 0.9, look.skirt ? [0.75, 1, 0.75] : null);
    const ankle = joint(knee, [0, -0.43, 0]);
    mesh(ankle, G.shoe, look.shoes, [0, -0.03, 0.045], 0.5, null, [Math.PI / 2, 0, 0]);
    mesh(ankle, G.sole, '#2a2622', [0, -0.07, 0.045], 0.9);
    J.legs.push({ hip, knee, ankle, s });
  }

  // Oberkörper
  const spine = joint(hips, [0, 0.03, 0]);
  J.spine = spine;
  mesh(spine, G.torso, topColor, [0, 0, 0], 0.85, [1.12 * w, 1, 0.66]);
  mesh(spine, G.collar, look.jacket || topColor, [0, 0.54, 0], 0.85, [1.1, 1, 0.9], [Math.PI / 2, 0, 0]);
  if (look.jacket) {
    // offene Jacke: zwei Vorderteile über dem Shirt
    for (const s of [-1, 1]) mesh(spine, G.jacketFlap, look.jacket, [s * 0.1 * w, 0.28, 0.105], 0.85, null, [0.05, s * -0.18, 0]);
  }
  if (look.apron) {
    mesh(spine, G.apron, '#1c1c1f', [0, 0.02, 0.112], 0.9, [w, 1, 1], [0.06, 0, 0]);
    for (const s of [-1, 1]) mesh(spine, G.strap, '#e8772e', [s * 0.1, 0.43, 0.1], 0.7, null, [0, 0, s * 0.25]);
  }
  mesh(spine, G.neck, skin, [0, 0.575, 0.005], 0.6);

  // Kopf mit Gesicht
  const head = joint(spine, [0, 0.575, 0.012]);
  head.scale.setScalar(1.1); // Kopf im Verhältnis zum Körper (ca. 1/7,5 der Körperhöhe)
  J.head = head;
  mesh(head, G.head, skin, [0, 0.1, 0], 0.55, [0.092, 0.118, 0.104]);
  mesh(head, G.nose, skin, [0, 0.085, 0.108], 0.55, null, [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    mesh(head, G.ear, skin, [s * 0.09, 0.095, 0.0], 0.6, [0.014, 0.026, 0.018]);
    mesh(head, G.eye, '#1c1c1f', [s * 0.034, 0.11, 0.094], 0.3);
    mesh(head, G.brow, look.hair, [s * 0.035, 0.135, 0.097], 0.9, null, [0, 0, s * -0.1]);
  }
  mesh(head, G.mouth, '#8a4a44', [0, 0.05, 0.099], 0.6);
  if (look.beard) mesh(head, G.beard, look.hair, [0, 0.085, 0.006], 0.95, [0.096, 0.118, 0.106]);
  if (look.glasses) {
    for (const s of [-1, 1]) mesh(head, G.lens, '#2a2a2e', [s * 0.036, 0.11, 0.108], 0.3);
    mesh(head, G.bridge, '#2a2a2e', [0, 0.112, 0.11], 0.3);
  }
  // Frisur
  if (look.hairStyle !== 'glatze') mesh(head, G.hairCap, look.hair, [0, 0.112, -0.006], 0.9, [0.098, 0.115, 0.11], [-0.25, 0, 0]);
  if (look.hairStyle === 'lang') mesh(head, G.hairLong, look.hair, [0, 0.02, -0.012], 0.9, [0.9, 1, 0.92]);
  if (look.hairStyle === 'bob') mesh(head, G.hairLong, look.hair, [0, 0.07, -0.01], 0.9, [0.92, 0.5, 0.95]);
  if (look.hairStyle === 'dutt') mesh(head, G.bun, look.hair, [0, 0.21, -0.07], 0.9);

  // Arme
  for (const s of [-1, 1]) {
    const shoulder = joint(spine, [s * 0.19 * w, 0.47, 0]);
    shoulder.rotation.z = s * 0.1;
    const sleeve = look.jacket || topColor;
    mesh(shoulder, G.upperArm, sleeve, [0, -0.13, 0], 0.85);
    const elbow = joint(shoulder, [0, -0.28, 0]);
    mesh(elbow, G.forearm, look.sleeves === 'kurz' && !look.jacket ? skin : sleeve, [0, -0.12, 0], 0.7);
    mesh(elbow, G.hand, skin, [0, -0.28, 0.005], 0.6, [0.038, 0.058, 0.026]);
    J.arms.push({ shoulder, elbow, s });
  }
  if (look.bag) {
    mesh(spine, G.bag, '#b48a5a', [0.24 * w, 0.02, 0.0], 0.9, null, [0, Math.PI / 2, 0]);
    mesh(spine, G.bagStrap, '#b48a5a', [0.16 * w, 0.19, 0], 0.9, [0.6, 1.1, 1], [0, Math.PI / 2, 0]);
  }
  return { root, J };
}

// Haltungen: stehen, stoebern (greift nach vorn, Kopf leicht gesenkt), arbeiten (beide Unterarme vorn)
function applyPose(J, pose) {
  const [l, r] = J.arms;
  if (pose === 'stoebern') {
    r.shoulder.rotation.x = -0.75;
    r.elbow.rotation.x = -0.7;
    l.shoulder.rotation.x = -0.1;
    l.elbow.rotation.x = -0.25;
    J.head.rotation.x = 0.28;
    J.spine.rotation.x = 0.06;
  } else if (pose === 'arbeiten') {
    for (const a of J.arms) {
      a.shoulder.rotation.x = -0.35;
      a.elbow.rotation.x = -1.1;
    }
    J.head.rotation.x = 0.18;
  } else {
    for (const a of J.arms) a.elbow.rotation.x = -0.12;
  }
}

// Statische Person: Aufbau → Weltmatrizen → Geometrien in den Builder (fasst gleiche Materialien zusammen)
export function addStaticPerson(b, look, x, z, yaw, pose = 'stehen') {
  const { root, J } = buildPerson(look);
  applyPose(J, pose);
  root.position.set(x, 0, -z);
  root.rotation.y = yaw;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const key = `person-${o.material.name}`;
    if (!b.materials[key]) b.materials[key] = o.material;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    b.add(key, g);
  });
}

// Animierte Person für die Simulation: Gehzyklus mit Knie- und Ellbogenbeugung, leichtes Wippen
export class Walker {
  constructor(look) {
    const { root, J } = buildPerson(look);
    this.group = root;
    this.group.name = 'Simulationskunde';
    this.J = J;
    applyPose(J, 'stehen');
    // Markierung am Boden, damit man die Figur auch in der Draufsicht gut sieht
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.4, 32), new THREE.MeshBasicMaterial({ color: 0xe8772e, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);
    this.phase = 0;
    this.amount = 0;
  }

  // speed 0..1 (0 = steht), dt in s
  animate(dt, speed) {
    this.amount += (speed - this.amount) * Math.min(1, dt * 6); // weicher Übergang Stehen ↔ Gehen
    const k = this.amount;
    this.phase += dt * 6.2 * k;
    const ph = this.phase;
    for (const leg of this.J.legs) {
      const s = Math.sin(ph + (leg.s > 0 ? 0 : Math.PI));
      leg.hip.rotation.x = -s * 0.45 * k;
      leg.knee.rotation.x = Math.max(0, Math.sin(ph + (leg.s > 0 ? 0 : Math.PI) - 1.2)) * 0.9 * k;
      leg.ankle.rotation.x = -leg.knee.rotation.x * 0.35;
    }
    for (const arm of this.J.arms) {
      const s = Math.sin(ph + (arm.s > 0 ? Math.PI : 0));
      arm.shoulder.rotation.x = -s * 0.4 * k;
      arm.elbow.rotation.x = -0.12 - (0.25 + Math.max(0, -s) * 0.3) * k;
    }
    this.J.body.position.y = Math.abs(Math.cos(ph)) * 0.025 * k;
    this.J.spine.rotation.y = Math.sin(ph) * 0.06 * k;
    this.J.head.rotation.x = 0.04 * (1 - k);
  }
}
