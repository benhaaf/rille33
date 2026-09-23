// Etappe 6 (optional laut SPEC): leiser, synthetischer Lo-Fi-Loop per Web Audio – ohne Audiodateien,
// räumlich an den Hörstationen (M7). Ein-/ausschaltbar.
const BPM = 76;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Dm9 – G13 – Cmaj9 – Am9 (MIDI-Noten), dazu Bass-Grundton
const CHORDS = [
  { notes: [62, 65, 69, 72, 76], bass: 38 },
  { notes: [59, 65, 69, 71, 76], bass: 43 },
  { notes: [60, 64, 67, 71, 74], bass: 36 },
  { notes: [57, 60, 64, 67, 71], bass: 45 },
];

export class LofiAudio {
  constructor(layout) {
    const m7 = layout.moebel.find((m) => m.typ === 'hoerstation');
    this.sources = m7 ? m7.stationen.map(([x, z]) => [x, m7.hoehe, z]) : [[7, 1.1, 12]];
    this.ctx = null;
    this.on = false;
  }

  // Muss aus einer Nutzergeste (Tippen/Taste) aufgerufen werden, sonst blockiert iOS den Ton.
  async toggle() {
    if (!this.ctx) this.init();
    this.on = !this.on;
    if (this.on) {
      try {
        await this.ctx.resume();
      } catch {
        /* wird unten gemeldet */
      }
      this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.4);
      this.startScheduler();
    } else {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.on;
  }

  get blocked() {
    return this.on && this.ctx && this.ctx.state !== 'running';
  }

  init() {
    // iOS 17+: Musik auch bei Stummschalter (sonst ist Web Audio still)
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {
      /* nicht unterstützt */
    }
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // Lo-Fi-Klang: alles durch einen weichen Tiefpass
    this.bus = ctx.createBiquadFilter();
    this.bus.type = 'lowpass';
    this.bus.frequency.value = 3200;
    this.bus.Q.value = 0.4;

    // Räumlich: dasselbe Signal kommt aus jeder Hörstation
    for (const [x, y, z] of this.sources) {
      const p = ctx.createPanner();
      p.panningModel = 'equalpower';
      p.distanceModel = 'inverse';
      p.refDistance = 1.2;
      p.rolloffFactor = 1.3;
      p.maxDistance = 25;
      if (p.positionX) {
        p.positionX.value = x;
        p.positionY.value = y;
        p.positionZ.value = -z;
      } else p.setPosition(x, y, -z);
      const g = ctx.createGain();
      g.gain.value = 0.55;
      this.bus.connect(p).connect(g).connect(this.master);
    }

    // Rauschpuffer für Drums und Knistern
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // Vinyl-Knistern: gefiltertes Rauschen + zufällige Knackser
    const crackle = ctx.createBuffer(1, len * 2, ctx.sampleRate);
    const c = crackle.getChannelData(0);
    for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * 0.02 + (Math.random() < 0.0004 ? (Math.random() - 0.5) * 0.9 : 0);
    const src = ctx.createBufferSource();
    src.buffer = crackle;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(f).connect(g).connect(this.bus);
    src.start();

    this.nextTime = 0;
    this.step = 0; // Achtel
  }

  startScheduler() {
    if (this.timer) return;
    this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    this.timer = setInterval(() => this.schedule(), 40);
  }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 0.2) {
      const s = this.step % 32; // 4 Takte × 8 Achtel
      const eighth = s % 8;
      const bar = Math.floor(s / 8);
      const swing = eighth % 2 ? BEAT * 0.12 : 0; // leichter Swing
      const t = this.nextTime + swing;
      const chord = CHORDS[bar];

      if (eighth === 0) this.keys(t, chord.notes, BAR * 0.95);
      if (eighth === 5) this.keys(t, chord.notes.slice(1, 4), BEAT * 1.2, 0.5);
      if (eighth === 0 || eighth === 3 || eighth === 4) this.bass(t, chord.bass, eighth === 3 ? BEAT * 0.45 : BEAT * 0.9);
      if (eighth === 0 || eighth === 4 || (eighth === 5 && bar % 2)) this.kick(t);
      if (eighth === 2 || eighth === 6) this.snare(t);
      this.hat(t, eighth % 2 ? 0.25 : 0.4);

      this.nextTime += BEAT / 2;
      this.step++;
    }
  }

  env(t, peak, attack, decay) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  keys(t, notes, dur, vel = 1) {
    for (const n of notes) {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(n);
      o.detune.value = (Math.random() - 0.5) * 12; // leicht verstimmt = „Tape“
      const g = this.env(t, 0.035 * vel, 0.02, dur);
      o.connect(g).connect(this.bus);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  bass(t, n, dur) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(n);
    const g = this.env(t, 0.22, 0.01, dur);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  kick(t) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = this.env(t, 0.5, 0.005, 0.28);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 0.35);
  }

  noiseHit(t, type, freq, peak, decay) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.env(t, peak, 0.003, decay);
    s.connect(f).connect(g).connect(this.bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + decay + 0.05);
  }

  snare(t) {
    this.noiseHit(t, 'bandpass', 1800, 0.12, 0.16);
  }

  hat(t, vel) {
    this.noiseHit(t, 'highpass', 7000, 0.03 * vel, 0.05);
  }

  // Hörer = Kamera (jeden Frame)
  updateListener(camera) {
    if (!this.on || !this.ctx) return;
    const L = this.ctx.listener;
    const p = camera.position;
    const f = this._f || (this._f = camera.getWorldDirection(p.clone()));
    camera.getWorldDirection(f);
    if (L.positionX) {
      const t = this.ctx.currentTime;
      L.positionX.setTargetAtTime(p.x, t, 0.05);
      L.positionY.setTargetAtTime(p.y, t, 0.05);
      L.positionZ.setTargetAtTime(p.z, t, 0.05);
      L.forwardX.setTargetAtTime(f.x, t, 0.05);
      L.forwardY.setTargetAtTime(f.y, t, 0.05);
      L.forwardZ.setTargetAtTime(f.z, t, 0.05);
      L.upX.value = 0;
      L.upY.value = 1;
      L.upZ.value = 0;
    } else {
      L.setPosition(p.x, p.y, p.z);
      L.setOrientation(f.x, f.y, f.z, 0, 1, 0);
    }
  }
}
