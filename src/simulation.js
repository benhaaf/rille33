// Kundensimulation: Eine Figur läuft einen Weg aus layout.json ab, bleibt an Stationen stehen,
// eine Bildunterschrift erklärt das Verhalten. Die Kamera folgt (Ego-Ansicht), in der Draufsicht sieht man sie von oben.
import * as THREE from 'three';
import { Walker, randomLook } from './scene/people.js';
import { rng } from './scene/builder.js';

const CAM_DIST = 2.4;
const CAM_HEIGHT = 2.25;

export class Simulation {
  constructor(layout, scene, camera) {
    this.cfg = layout.simulation;
    this.scene = scene;
    this.camera = camera;
    this.active = false;
    this.next = 0; // welche Kundengruppe als Nächstes
    this.onCaption = () => {};
    this.onEnd = () => {};
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
  }

  get kunde() {
    return this.current;
  }

  start() {
    const k = this.cfg.kunden[this.next % this.cfg.kunden.length];
    this.next++;
    this.current = k;
    const look = randomLook(rng(this.next * 13), { top: k.farbe, bag: true, jacket: null, scale: 1 });
    this.walker = new Walker(look);
    this.scene.add(this.walker.group);
    this.pts = k.punkte;
    this.i = 0;
    const [x, z] = this.pts[0].p;
    this.pos = new THREE.Vector2(x, z);
    this.heading = 0;
    this.wait = 0;
    this.stopShown = false;
    this.done = false;
    this.active = true;
    this.placeWalker();
    // Kamera startet hinter der Figur
    this.updateCamera(1, true);
    this.onCaption(`${k.name} ${k.beschreibung}`, 0, this.stopCount());
    return k;
  }

  stop() {
    if (this.walker) this.scene.remove(this.walker.group);
    this.walker = null;
    this.active = false;
  }

  stopCount() {
    return this.pts.filter((p) => p.text).length;
  }

  stopIndex() {
    return this.pts.slice(0, this.i + 1).filter((p) => p.text).length;
  }

  // Sprung zum nächsten / vorigen Halt (für die Präsentation)
  skip(dir) {
    const stops = this.pts.map((p, i) => (p.text ? i : -1)).filter((i) => i >= 0);
    const target = dir > 0 ? stops.find((i) => i > this.i) : [...stops].reverse().find((i) => i < this.i - (this.wait > 0 ? 0 : 1));
    if (target === undefined) return;
    this.i = target;
    this.pos.set(...this.pts[target].p);
    this.wait = 0;
    this.arrive();
  }

  arrive() {
    const pt = this.pts[this.i];
    if (pt.text) {
      this.wait = pt.dauer || 2;
      this.onCaption(pt.text, this.stopIndex(), this.stopCount());
    }
    if (this.i >= this.pts.length - 1) this.done = true;
  }

  placeWalker() {
    this.walker.group.position.set(this.pos.x, 0, -this.pos.y);
    this.walker.group.rotation.y = this.heading;
  }

  // Store-Richtung (dx, dz) → Drehung der Figur (lokal +z = vorn)
  static yawOf(dx, dz) {
    return Math.atan2(dx, -dz);
  }

  turnTowards(target, dt, rate = 5) {
    let d = target - this.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.heading += d * Math.min(1, dt * rate);
  }

  update(dt, followCamera) {
    if (!this.active) return;
    const speed = this.cfg.tempo || 1.1;
    let moving = 0;
    if (this.wait > 0) {
      this.wait -= dt;
      const pt = this.pts[this.i];
      if (pt.blick) this.turnTowards(Simulation.yawOf(pt.blick[0] - this.pos.x, pt.blick[1] - this.pos.y), dt);
      if (this.wait <= 0 && this.done) {
        this.onEnd();
        return;
      }
    } else if (this.done) {
      this.onEnd();
      return;
    } else {
      const [tx, tz] = this.pts[this.i + 1].p;
      const dx = tx - this.pos.x;
      const dz = tz - this.pos.y;
      const dist = Math.hypot(dx, dz);
      const step = speed * dt;
      this.turnTowards(Simulation.yawOf(dx, dz), dt, 8);
      moving = 1;
      if (dist <= step) {
        this.pos.set(tx, tz);
        this.i++;
        this.arrive();
      } else {
        this.pos.x += (dx / dist) * step;
        this.pos.y += (dz / dist) * step;
      }
    }
    this.walker.animate(dt, moving);
    this.placeWalker();
    if (followCamera) this.updateCamera(dt);
  }

  // Kamera schräg hinter der Figur, weich nachgeführt
  updateCamera(dt, snap = false) {
    const back = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    const head = new THREE.Vector3(this.pos.x, 1.35, -this.pos.y);
    const want = head.clone().addScaledVector(back, CAM_DIST);
    want.y = CAM_HEIGHT;
    // Im Laden nicht durch Wände/Decke: Kamera innerhalb des Raums halten (Passage davor ist offen)
    want.x = THREE.MathUtils.clamp(want.x, 0.3, 11.7);
    if (-want.z > 0.2) want.z = -THREE.MathUtils.clamp(-want.z, 0.3, 14.7);
    const k = snap ? 1 : 1 - Math.exp(-dt * 3);
    this.camPos.lerp(want, k);
    this.camLook.lerp(head, snap ? 1 : 1 - Math.exp(-dt * 5));
    if (snap) {
      this.camPos.copy(want);
      this.camLook.copy(head);
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }
}
