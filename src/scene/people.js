// Einfache Low-Poly-Menschen: statisch (zusammengefasst über den Builder) oder animiert (Simulation).
import * as THREE from 'three';

const SKIN = ['#e8c4a0', '#c99a72', '#8d5a3b', '#f1d2b6', '#a8714f'];
const HAIR = ['#2a1d15', '#5a3a22', '#c9a15a', '#1c1c1f', '#8a4a2a', '#b8b3ab'];
const TOP = ['#3d405b', '#b56576', '#e8772e', '#2f4550', '#6b705c', '#f4f1ec', '#355070', '#81667a'];
const BOTTOM = ['#2b2c30', '#3a4a5c', '#5b4a3a', '#1c1c1f', '#4a5a4a'];

// Maße für eine Person von ca. 1,75 m
const G = {
  leg: new THREE.CapsuleGeometry(0.065, 0.66, 3, 10),
  torso: new THREE.CapsuleGeometry(0.16, 0.34, 4, 12),
  arm: new THREE.CapsuleGeometry(0.048, 0.5, 3, 8),
  head: new THREE.SphereGeometry(0.105, 16, 12),
  hair: new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
  shoe: new THREE.BoxGeometry(0.1, 0.06, 0.2),
  bag: new THREE.BoxGeometry(0.28, 0.32, 0.08),
};

const matCache = new Map();
function mat(color, rough = 0.85) {
  const key = `${color}-${rough}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: rough }));
  return matCache.get(key);
}

export function randomLook(rand, overrides = {}) {
  const p = (a) => a[Math.floor(rand() * a.length)];
  return { skin: p(SKIN), hair: p(HAIR), top: p(TOP), bottom: p(BOTTOM), scale: 0.92 + rand() * 0.16, bag: rand() < 0.35, ...overrides };
}

// Teile einer Person relativ zu den Füßen (Blick in lokale +z-Richtung)
function parts(look, pose = 'stehen') {
  const out = [];
  const armAngle = pose === 'arbeiten' ? -0.9 : pose === 'stoebern' ? -0.6 : 0.05;
  for (const s of [-1, 1]) {
    out.push({ g: G.leg, c: look.bottom, p: [s * 0.09, 0.44, 0] });
    out.push({ g: G.shoe, c: '#1c1c1f', p: [s * 0.09, 0.03, 0.03] });
    out.push({ g: G.arm, c: look.top, p: [s * 0.23, 1.2, pose === 'stehen' ? 0 : 0.12], r: [armAngle, 0, s * 0.08] });
  }
  out.push({ g: G.torso, c: look.top, p: [0, 1.2, 0] });
  out.push({ g: G.head, c: look.skin, p: [0, 1.6, 0.01] });
  out.push({ g: G.hair, c: look.hair, p: [0, 1.62, -0.005] });
  if (look.bag) out.push({ g: G.bag, c: '#b48a5a', p: [0.3, 0.85, 0] });
  return out;
}

// Statische Person über den Builder (wird mit allen anderen zusammengefasst)
export function addStaticPerson(b, look, x, z, yaw, pose = 'stehen') {
  const o = new THREE.Object3D();
  const root = new THREE.Object3D();
  root.position.set(x, 0, -z);
  root.rotation.y = yaw;
  root.scale.setScalar(look.scale);
  root.updateMatrix();
  for (const part of parts(look, pose)) {
    o.position.set(...part.p);
    o.rotation.set(...(part.r || [0, 0, 0]));
    o.updateMatrix();
    const key = `person-${part.c}`;
    if (!b.materials[key]) b.materials[key] = mat(part.c);
    const g = part.g.clone();
    g.applyMatrix4(o.matrix);
    g.applyMatrix4(root.matrix);
    b.add(key, g);
  }
}

// Animierte Person für die Simulation (Arme und Beine schwingen beim Gehen)
export class Walker {
  constructor(look) {
    this.group = new THREE.Group();
    this.group.name = 'Simulationskunde';
    const body = new THREE.Group();
    body.scale.setScalar(look.scale);
    this.group.add(body);
    this.limbs = [];
    const add = (g, c, p, parent = body) => {
      const m = new THREE.Mesh(g, mat(c));
      m.position.set(...p);
      parent.add(m);
      return m;
    };
    for (const s of [-1, 1]) {
      // Hüft- und Schultergelenke als Drehpunkte
      const hip = new THREE.Group();
      hip.position.set(s * 0.09, 0.82, 0);
      body.add(hip);
      add(G.leg, look.bottom, [0, -0.38, 0], hip);
      add(G.shoe, '#1c1c1f', [0, -0.79, 0.03], hip);
      const sh = new THREE.Group();
      sh.position.set(s * 0.23, 1.44, 0);
      sh.rotation.z = s * 0.08;
      body.add(sh);
      add(G.arm, look.top, [0, -0.25, 0], sh);
      this.limbs.push({ hip, sh, s });
    }
    add(G.torso, look.top, [0, 1.2, 0]);
    this.head = add(G.head, look.skin, [0, 1.6, 0.01]);
    add(G.hair, look.hair, [0, 1.62, -0.005]);
    // Markierung am Boden, damit man den Kunden auch in der Draufsicht gut sieht
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.4, 32), new THREE.MeshBasicMaterial({ color: 0xe8772e, transparent: true, opacity: 0.85 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);
    this.phase = 0;
  }

  // speed 0..1 (0 = steht), dt in s
  animate(dt, speed) {
    this.phase += dt * 7 * speed;
    const a = Math.sin(this.phase) * 0.55 * speed;
    for (const l of this.limbs) {
      l.hip.rotation.x = a * l.s;
      l.sh.rotation.x = -a * l.s * 0.8;
    }
  }
}
