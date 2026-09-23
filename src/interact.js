// Interaktion: Schubladen und Lagertür öffnen/schließen (X / E / Hinweis antippen).
import * as THREE from 'three';

const REACH = 2.3; // maximale Entfernung in Metern
const DOOR_SPEED = 2.2; // rad/s

export class Interactions {
  constructor(camera, { drawers, doors, collider }) {
    this.camera = camera;
    this.drawers = drawers;
    this.doors = doors.map((d) => ({ ...d, angle: 0, target: 0, rect: collider.add(d.closedRect) }));
    this.collider = collider;
    this.ray = new THREE.Raycaster();
    this.ray.far = REACH;
    this.center = new THREE.Vector2(0, 0);
    this.low = new THREE.Vector2(0, -0.35);
    this.current = null;
    this.frame = 0;
  }

  // Was liegt im Fadenkreuz? → { label, act } oder null
  findTarget() {
    this.ray.setFromCamera(this.center, this.camera);
    let best = null;
    let di = this.drawers ? this.drawers.hit(this.ray, REACH) : -1;
    // Schubladen liegen sehr tief: zusätzlich knapp unterhalb des Fadenkreuzes suchen
    if (di < 0 && this.drawers) {
      this.ray.setFromCamera(this.low, this.camera);
      di = this.drawers.hit(this.ray, REACH);
      this.ray.setFromCamera(this.center, this.camera);
    }
    if (di >= 0) {
      const open = this.drawers.isOpen(di);
      best = { key: `d${di}`, label: open ? 'Schublade schließen' : 'Schublade öffnen (Nachschub)', act: () => this.drawers.toggle(di) };
    }
    const leaves = this.doors.map((d) => d.leaf);
    const hit = this.ray.intersectObjects(leaves, false)[0];
    if (hit && (!best || hit.distance < REACH)) {
      const door = this.doors[leaves.indexOf(hit.object)];
      const open = door.target > 0;
      best = { key: door.name, label: open ? `${door.name} schließen` : `${door.name} öffnen`, act: () => this.toggleDoor(door) };
    }
    return best;
  }

  // Alle paar Frames neu bestimmen (spart Rechenzeit)
  update(dt, active) {
    for (const d of this.doors) this.animateDoor(d, dt);
    if (this.drawers) this.drawers.update(dt);
    if (!active) {
      this.current = null;
      return null;
    }
    if (this.frame++ % 4 === 0) this.current = this.findTarget();
    return this.current;
  }

  interact() {
    const t = this.current || this.findTarget();
    if (!t) return false;
    t.act();
    this.current = this.findTarget();
    return true;
  }

  toggleDoor(d) {
    d.target = d.target > 0 ? 0 : Math.PI / 2;
  }

  animateDoor(d, dt) {
    if (d.angle === d.target) return;
    const step = DOOR_SPEED * dt;
    d.angle = d.angle < d.target ? Math.min(d.target, d.angle + step) : Math.max(d.target, d.angle - step);
    d.pivot.rotation.y = d.angle;
    // Kollision folgt dem Türblatt: zu = Öffnung gesperrt, offen = Blatt liegt im Lager
    this.collider.set(d.rect, d.angle > Math.PI / 4 ? d.openRect : d.closedRect);
  }
}
