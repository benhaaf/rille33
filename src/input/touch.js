// Touch-Steuerung fürs iPad: Joystick unten links, Wischen rechts zum Umsehen, Buttons für alle Funktionen.
import config from '../config.js';
import { ACTIONS } from './actions.js';

const CLICK_ACTIONS = new Set(['png', 'musik']);
const TOGGLE_BUTTONS = ['ansicht', 'hauptweg', 'zonen', 'regalzonen', 'praesentation', 'rahmen', 'musik', 'png'];

export class TouchInput {
  constructor(bus, root) {
    this.bus = bus;
    this.move = [0, 0];
    this.look = [0, 0];
    this.sprint = false;
    this.lastActive = 0;

    root.insertAdjacentHTML(
      'beforeend',
      `<div id="touch-ui" hidden>
        <div id="look-area"></div>
        <div id="joystick"><div id="joystick-knob"></div></div>
        <button id="btn-sprint" class="tbtn round" aria-pressed="false"><span>»</span><small>Schnell</small></button>
        <div id="toggle-bar">${TOGGLE_BUTTONS.map(btn).join('')}</div>
        <div id="station-bar">${['zurueck', 'info', 'weiter'].map(btn).join('')}</div>
      </div>`,
    );
    this.ui = root.querySelector('#touch-ui');

    const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    if (isTouch) this.show(true);
    window.addEventListener('touchstart', () => this.show(true), { passive: true });

    this.setupJoystick(root.querySelector('#joystick'), root.querySelector('#joystick-knob'));
    this.setupLook(root.querySelector('#look-area'));

    const sprintBtn = root.querySelector('#btn-sprint');
    sprintBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.sprint = !this.sprint;
      sprintBtn.setAttribute('aria-pressed', String(this.sprint));
    });

    root.querySelectorAll('#touch-ui [data-action]').forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.classList.add('pressed');
        this.lastActive = performance.now();
        if (!CLICK_ACTIONS.has(el.dataset.action)) this.bus.emit(el.dataset.action, 'touch');
      });
      // Manche Aktionen brauchen eine echte Nutzergeste (z. B. Teilen-Dialog in Safari)
      el.addEventListener('click', () => {
        if (CLICK_ACTIONS.has(el.dataset.action)) this.bus.emit(el.dataset.action, 'touch');
      });
      const up = () => el.classList.remove('pressed');
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    });
  }

  show(on) {
    this.ui.hidden = !on;
    document.body.classList.toggle('touch-mode', on);
  }

  setActive(name, on) {
    const el = this.ui.querySelector(`[data-action="${name}"]`);
    if (el) el.setAttribute('aria-pressed', String(on));
  }

  setupJoystick(base, knob) {
    const R = config.touch.joystickRadius;
    let id = null;
    let cx = 0;
    let cy = 0;
    const reset = () => {
      id = null;
      this.move = [0, 0];
      knob.style.transform = 'translate(-50%, -50%)';
      base.classList.remove('active');
    };
    const update = (e) => {
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const m = Math.hypot(dx, dy);
      if (m > R) {
        dx = (dx / m) * R;
        dy = (dy / m) * R;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.move = [dx / R, -dy / R];
      this.lastActive = performance.now();
    };
    base.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      e.preventDefault();
      id = e.pointerId;
      base.setPointerCapture(id);
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      base.classList.add('active');
      update(e);
    });
    base.addEventListener('pointermove', (e) => e.pointerId === id && update(e));
    base.addEventListener('pointerup', (e) => e.pointerId === id && reset());
    base.addEventListener('pointercancel', (e) => e.pointerId === id && reset());
  }

  setupLook(area) {
    const pointers = new Map();
    area.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      area.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
    });
    area.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      this.look[0] += e.clientX - p[0];
      this.look[1] += e.clientY - p[1];
      p[0] = e.clientX;
      p[1] = e.clientY;
      this.lastActive = performance.now();
    });
    const end = (e) => pointers.delete(e.pointerId);
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);
  }

  poll() {
    const s = config.touch.blickSensitivitaet;
    const lookRad = [this.look[0] * s, this.look[1] * s];
    this.look[0] = this.look[1] = 0;
    return { move: this.move, lookRad, sprint: this.sprint ? 1 : 0 };
  }
}

function btn(name) {
  const a = ACTIONS[name];
  return `<button class="tbtn" data-action="${name}" aria-pressed="false" title="${a.label}"><span>${a.icon}</span><small>${a.kurz}</small></button>`;
}
