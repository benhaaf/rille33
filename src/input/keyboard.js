// Tastatur/Maus als Fallback (auch für iPad mit Magic Keyboard/Trackpad).
import config from '../config.js';

// Buchstaben nach e.key (Beschriftung), damit Z auf QWERTZ und QWERTY stimmt.
const KEYS = {
  t: 'ansicht',
  h: 'hauptweg',
  z: 'zonen',
  e: 'info',
  r: 'regalzonen',
  p: 'praesentation',
  ArrowRight: 'weiter',
  ArrowLeft: 'zurueck',
  i: 'rahmen',
  b: 'png', // Draufsicht als Bild speichern
  m: 'musik', // Lo-Fi-Musik an/aus
  k: 'simulation', // Kundensimulation starten/beenden
};

export class KeyboardMouseInput {
  constructor(bus, element) {
    this.bus = bus;
    this.el = element;
    this.down = new Set();
    this.look = [0, 0];
    this.dragging = false;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.down.add(e.code);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (KEYS[key]) {
        this.bus.emit(KEYS[key], 'keyboard');
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());

    // Maus: Klick = Pointer Lock; ohne Lock funktioniert Ziehen mit gedrückter Taste.
    element.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.dragging = true;
      if (element.requestPointerLock && document.pointerLockElement !== element) {
        try {
          const p = element.requestPointerLock();
          if (p && p.catch) p.catch(() => {});
        } catch {
          /* Pointer Lock nicht verfügbar – Ziehen reicht */
        }
      }
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') this.dragging = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (document.pointerLockElement === element || this.dragging) {
        this.look[0] += e.movementX || 0;
        this.look[1] += e.movementY || 0;
      }
    });
  }

  poll() {
    const k = this.down;
    const move = [
      (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0),
      (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0),
    ];
    const s = config.maus.sensitivitaet;
    const look = [this.look[0] * s, this.look[1] * s]; // bereits in rad
    this.look[0] = this.look[1] = 0;
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight') ? 1 : 0;
    return { move, lookRad: look, sprint };
  }
}
