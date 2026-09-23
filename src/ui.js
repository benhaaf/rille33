import config from './config.js';

// Kleine HUD-Elemente: Controller-Status, FPS, Hinweise (Toasts).
export class HUD {
  constructor(root) {
    root.insertAdjacentHTML(
      'beforeend',
      `<div id="status"><span id="pad-status">🎮 Taste drücken zum Verbinden</span><span id="fps"></span></div>
       <div id="toast" role="status" aria-live="polite"></div>`,
    );
    this.pad = root.querySelector('#pad-status');
    this.fpsEl = root.querySelector('#fps');
    this.toastEl = root.querySelector('#toast');
    this.frames = 0;
    this.acc = 0;
    const q = new URLSearchParams(location.search).get('fps');
    this.showFps = q !== null ? q !== '0' : config.zeigeFps;
  }

  setPad(connected) {
    this.pad.textContent = connected ? '🎮 Controller verbunden' : '🎮 Taste drücken zum Verbinden';
    this.pad.classList.toggle('ok', connected);
  }

  tick(dt) {
    if (!this.showFps) return;
    this.frames++;
    this.acc += dt;
    if (this.acc >= 0.5) {
      this.fpsEl.textContent = `${Math.round(this.frames / this.acc)} fps`;
      this.frames = 0;
      this.acc = 0;
    }
  }

  toast(text, ms = 2200) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.t);
    this.t = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }
}
