import * as THREE from 'three';

// Schild/Beschriftung als Canvas-Textur. Mehrzeilig mit \n; die Schrift wird so weit verkleinert,
// dass jede Zeile aufs Schild passt (sonst wird der Text abgeschnitten).
export function labelTexture(text, { bg = '#1c1c1f', fg = '#ffffff', width = 512, height = 128, weight = 'bold' } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);
  const lines = String(text).split('\n');
  const font = (px) => `${weight} ${px}px system-ui, -apple-system, sans-serif`;
  let size = Math.floor((height * 0.72) / lines.length);
  g.font = font(size);
  while (size > 10 && lines.some((l) => g.measureText(l).width > width * 0.9)) {
    size -= 2;
    g.font = font(size);
  }
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = size * 1.15;
  lines.forEach((l, i) => g.fillText(l, width / 2, height / 2 + (i - (lines.length - 1) / 2) * lh + 2));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Rot schraffierte Sperrfläche (Notausgang freihalten)
export function hatchTexture(color = '#d62828') {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.clearRect(0, 0, s, s);
  g.strokeStyle = color;
  g.lineWidth = 18;
  for (let i = -s; i <= s * 2; i += s / 2) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i - s, s);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
