// PS5 DualSense über die Gamepad API (Standard-Mapping, funktioniert in Chrome und Safari/iPadOS).
import config from '../config.js';

// Standard-Mapping: https://w3c.github.io/gamepad/#remapping
const BUTTONS = {
  0: 'info', // X (Kreuz)
  1: 'hauptweg', // Kreis
  2: 'zonen', // Quadrat
  3: 'ansicht', // Dreieck
  4: 'zurueck', // L1
  5: 'weiter', // R1
  8: 'rahmen', // Create/Share
  9: 'praesentation', // Options
  10: 'regalzonen', // L3
  11: 'png', // R3: Draufsicht als PNG (Ergänzung zur SPEC)
};
const R2 = 7;

function deadzone(x, y, dz) {
  const m = Math.hypot(x, y);
  if (m < dz) return [0, 0];
  const s = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * s, y * s];
}

export class GamepadInput {
  constructor(bus) {
    this.bus = bus;
    this.prev = new Map(); // gamepad.index → gedrückte Buttons
    this.connected = false;
    this.lastActive = 0;
    this.onStatus = () => {};
    window.addEventListener('gamepadconnected', () => this.poll());
    window.addEventListener('gamepaddisconnected', () => this.poll());
  }

  // Liefert {move:[x,y], look:[x,y], sprint} und feuert Aktionen bei Tastendruck.
  poll() {
    const out = { move: [0, 0], look: [0, 0], sprint: 0, active: false };
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let any = false;
    const dz = config.gamepad.deadzone;
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      any = true;
      const ax = gp.axes;
      const [mx, my] = deadzone(ax[0] || 0, ax[1] || 0, dz);
      const [lx, ly] = deadzone(ax[2] || 0, ax[3] || 0, dz);
      out.move[0] += mx;
      out.move[1] += -my; // Stick nach vorn = negativ
      out.look[0] += lx;
      out.look[1] += config.gamepad.invertY ? -ly : ly;
      const r2 = gp.buttons[R2];
      if (r2) out.sprint = Math.max(out.sprint, r2.value ?? (r2.pressed ? 1 : 0));

      const before = this.prev.get(gp.index) || new Set();
      const now = new Set();
      gp.buttons.forEach((b, i) => {
        if (b.pressed) now.add(i);
      });
      for (const i of now) {
        if (!before.has(i) && BUTTONS[i]) this.bus.emit(BUTTONS[i], 'gamepad');
      }
      this.prev.set(gp.index, now);
      if (mx || my || lx || ly || now.size) out.active = true;
    }
    if (any !== this.connected) {
      this.connected = any;
      this.onStatus(any);
    }
    if (out.active) this.lastActive = performance.now();
    return out;
  }
}
