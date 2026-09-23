// Plattencover: wenige prozedurale Motive als Texturen, Platten als Instanzen.
import * as THREE from 'three';

export const COVER = 0.315; // LP-Format 31,5 cm

const DESIGNS = 12;

function coverTexture(i, palette, rand) {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const pick = () => palette[Math.floor(rand() * palette.length)];
  const bg = pick();
  g.fillStyle = bg;
  g.fillRect(0, 0, s, s);
  const fg = pick();
  const fg2 = pick();
  g.fillStyle = fg;
  g.strokeStyle = fg2;
  switch (i % 6) {
    case 0: // Kreis
      g.beginPath();
      g.arc(s * 0.5, s * 0.55, s * 0.28, 0, Math.PI * 2);
      g.fill();
      break;
    case 1: // Streifen
      for (let k = 0; k < 6; k++) g.fillRect(0, k * 22 + 6, s, 9);
      break;
    case 2: // Blöcke
      g.fillRect(s * 0.1, s * 0.1, s * 0.45, s * 0.45);
      g.fillStyle = fg2;
      g.fillRect(s * 0.45, s * 0.45, s * 0.45, s * 0.45);
      break;
    case 3: // Dreieck
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.15);
      g.lineTo(s * 0.88, s * 0.85);
      g.lineTo(s * 0.12, s * 0.85);
      g.closePath();
      g.fill();
      break;
    case 4: // Ringe
      g.lineWidth = 6;
      for (let r = 12; r < 64; r += 13) {
        g.beginPath();
        g.arc(s * 0.5, s * 0.5, r, 0, Math.PI * 2);
        g.stroke();
      }
      break;
    default: // Diagonale
      g.beginPath();
      g.moveTo(0, s);
      g.lineTo(s, 0);
      g.lineTo(s, s * 0.35);
      g.lineTo(s * 0.35, s);
      g.closePath();
      g.fill();
  }
  // "Titel"-Balken
  g.fillStyle = 'rgba(244,241,236,0.85)';
  g.fillRect(s * 0.1, s * 0.08, s * (0.3 + rand() * 0.4), 7);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export class Covers {
  constructor(palette, rand) {
    this.palette = palette;
    this.rand = rand;
    this.frontGeo = new THREE.BoxGeometry(COVER, COVER, 0.004);
    this.recordGeo = new THREE.BoxGeometry(COVER, COVER, 0.005);
    this.materials = Array.from({ length: DESIGNS }, (_, i) =>
      new THREE.MeshStandardMaterial({ map: coverTexture(i, palette, rand), roughness: 0.75 }),
    );
    this.recordMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  }

  color() {
    return this.palette[Math.floor(this.rand() * this.palette.length)];
  }

  // Frontal präsentiertes Cover (mit Motiv)
  front(builder, pose, scale = 1) {
    const d = Math.floor(this.rand() * DESIGNS);
    const geo = scale === 1 ? this.frontGeo : new THREE.BoxGeometry(COVER * scale, COVER * scale, 0.006);
    const key = scale === 1 ? `cover-${d}` : `cover-${d}-x${scale}`;
    builder.instance(key, geo, this.materials[d], pose);
  }

  // Platte im Fach (nur Farbe, man sieht sie von der Kante/ oben)
  record(builder, pose) {
    builder.instance('platten', this.recordGeo, this.recordMat, { ...pose, color: this.color() });
  }
}
