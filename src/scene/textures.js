import * as THREE from 'three';

// Schild/Beschriftung als Canvas-Textur
export function labelTexture(text, { bg = '#1c1c1f', fg = '#ffffff', width = 512, height = 128, font = 'bold 64px system-ui, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, width / 2, height / 2 + 2);
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
