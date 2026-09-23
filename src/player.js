// Ego-Perspektive: Position in Store-Koordinaten (x, z), Blick über yaw/pitch.
import config from './config.js';
import { toThree } from './coords.js';

export class Player {
  constructor(camera, collider, start) {
    this.camera = camera;
    this.collider = collider;
    this.x = start.position[0];
    this.z = start.position[1];
    this.yaw = ((start.blickrichtung_grad || 0) * Math.PI) / 180; // 0 = in den Laden, + = nach rechts
    this.pitch = 0;
    camera.rotation.order = 'YXZ';
    this.apply();
  }

  // move: [rechts, vorwärts] in -1..1, lookRad: [yaw, pitch] Delta in rad, sprint 0..1
  update(dt, move, lookRad, sprint) {
    this.yaw += lookRad[0];
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - lookRad[1]));

    let [mx, mf] = move;
    const m = Math.hypot(mx, mf);
    if (m > 1) {
      mx /= m;
      mf /= m;
    }
    if (mx || mf) {
      const speed = config.gehtempo + (config.sprinttempo - config.gehtempo) * sprint;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      // vorwärts = (sin, cos), rechts = (cos, -sin) in Store-Koordinaten
      const dx = (mf * sin + mx * cos) * speed * dt;
      const dz = (mf * cos - mx * sin) * speed * dt;
      // In kleinen Schritten, damit man bei Sprint nicht durch dünne Wände tunnelt
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
      for (let i = 0; i < steps; i++) {
        const p = this.collider.resolve(this.x + dx / steps, this.z + dz / steps, config.spielerRadius);
        this.x = p.x;
        this.z = p.z;
      }
    }
    this.apply();
  }

  apply() {
    toThree(this.x, config.augenhoehe, this.z, this.camera.position);
    this.camera.rotation.set(this.pitch, -this.yaw, 0);
  }
}
