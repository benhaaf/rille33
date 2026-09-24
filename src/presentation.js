// Etappe 5: Präsentationsmodus – Kamera fliegt weich von Station zu Station (wie Folien).
import * as THREE from 'three';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const tmpM = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

export function stationPose(station) {
  const k = station.kamera;
  const pos = new THREE.Vector3(k.position[0], k.hoehe, -k.position[1]);
  const target = new THREE.Vector3(k.ziel[0], k.ziel[1], -k.ziel[2]);
  const quat = new THREE.Quaternion().setFromRotationMatrix(tmpM.lookAt(pos, target, UP));
  return { pos, quat, target };
}

export class Presentation {
  constructor(layout, camera) {
    this.layout = layout;
    this.stations = layout.stationen;
    // Folienfolge: Einleitung → Stationen → Fazit → Quellen (Einleitung/Fazit/Quellen optional)
    const P = layout.praesentation || {};
    this.slides = [
      ...(P.einleitung ? [{ ...P.einleitung, typ: 'einleitung' }] : []),
      ...this.stations.map((st) => ({ ...st, typ: 'station' })),
      ...(P.schluss ? [{ ...P.schluss, typ: 'schluss' }] : []),
      ...(P.quellen ? [{ ...P.quellen, typ: 'quellen' }] : []),
    ];
    this.camera = camera;
    this.active = false;
    this.index = -1;
    this.flight = null;
    this.onStation = () => {};
  }

  get total() {
    return this.slides.length;
  }

  get current() {
    return this.slides[this.index];
  }

  start(i = 0) {
    this.active = true;
    this.go(i);
  }

  stop() {
    this.active = false;
    this.flight = null;
  }

  next() {
    this.go(Math.min(this.total - 1, this.index + 1));
  }

  prev() {
    this.go(Math.max(0, this.index - 1));
  }

  go(i) {
    const slide = this.slides[i];
    const to = stationPose(slide);
    const from = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone() };
    const dist = from.pos.distanceTo(to.pos);
    const same = dist < 0.01 && from.quat.angleTo(to.quat) < 0.01;
    const dur = Math.min(3.2, Math.max(1.2, 0.9 + dist * 0.2));
    this.flight = same ? null : { from, to, t: 0, dur, arc: Math.min(0.6, dist * 0.08) };
    this.index = i;
    this.onStation(slide, i);
  }

  update(dt) {
    const f = this.flight;
    if (!f) return;
    f.t = Math.min(1, f.t + dt / f.dur);
    const k = ease(f.t);
    this.camera.position.lerpVectors(f.from.pos, f.to.pos, k);
    this.camera.position.y += Math.sin(Math.PI * k) * f.arc; // leichter Bogen über Möbel hinweg
    this.camera.quaternion.slerpQuaternions(f.from.quat, f.to.quat, k);
    if (f.t >= 1) this.flight = null;
  }

  // Station, deren Objekte am besten im Blickfeld liegen (für „Infokarte zum Objekt im Blick“)
  stationInView(camera, maxAngle = 0.5, maxDist = 9) {
    const L = this.layout;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const len = Math.hypot(dir.x, dir.z) || 1;
    const fx = dir.x / len;
    const fz = dir.z / len;
    // Punkte über die ganze Grundfläche verteilt (lange Möbel wie die Genre-Wand!)
    const points = (id) => {
      const m = L.moebel.find((x) => x.id === id);
      const z = L.zonen.find((x) => x.id === id);
      if (m && m.stationen) return m.stationen.map(([x, zz]) => new THREE.Vector3(x, m.hoehe, -zz));
      const r = (m || z)?.rechteck;
      if (!r) return [];
      const y = m ? Math.min(m.hoehe, 1.5) * 0.7 : 0.3;
      const nx = Math.max(1, Math.ceil((r[1] - r[0]) / 1));
      const nz = Math.max(1, Math.ceil((r[3] - r[2]) / 1));
      const pts = [];
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) pts.push(new THREE.Vector3(r[0] + ((i + 0.5) * (r[1] - r[0])) / nx, y, -(r[2] + ((j + 0.5) * (r[3] - r[2])) / nz)));
      return pts;
    };
    let best = null;
    // Wer in einer Zone steht, bekommt deren Karte – außer ein Möbelstück ist klar im Blick
    const cx = camera.position.x;
    const cz = -camera.position.z;
    for (const s of this.stations) {
      for (const id of s.objekte) {
        const z = L.zonen.find((x) => x.id === id);
        if (z) {
          const [x1, x2, z1, z2] = z.rechteck;
          if (cx >= x1 && cx <= x2 && cz >= z1 && cz <= z2 && (!best || best.score > 0.35)) best = { station: s, score: 0.35 };
        }
      }
    }
    for (const s of this.stations) {
      for (const id of s.objekte) {
        // Möbel zählen mehr als Zonenflächen
        const weight = id.startsWith('M') ? 0 : 0.15;
        for (const p of points(id)) {
          // Nur die horizontale Richtung zählt – niedrige Tische direkt vor einem sollen auch gelten
          const vx = p.x - camera.position.x;
          const vz = p.z - camera.position.z;
          const d = Math.hypot(vx, vz);
          if (d > maxDist) continue;
          if (d < 0.3) continue;
          const a = Math.acos(Math.max(-1, Math.min(1, (vx * fx + vz * fz) / d)));
          if (a > maxAngle) continue;
          const score = a + d * 0.06 + weight;
          if (!best || score < best.score) best = { station: s, score };
        }
      }
    }
    return best && best.station;
  }
}
