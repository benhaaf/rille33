import * as THREE from 'three';

// Schwebende Beschriftung (immer zur Kamera gedreht). Höhe in Metern.
export function textSprite(lines, { height = 0.3, bg = 'rgba(28,28,31,0.82)', fg = '#f4f1ec', accent = null, sub = '#c9c4bc' } = {}) {
  const [title, subtitle] = Array.isArray(lines) ? lines : [lines];
  const px = 64;
  const pad = 22;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fontT = `600 ${px}px system-ui, -apple-system, sans-serif`;
  const fontS = `400 ${Math.round(px * 0.62)}px system-ui, -apple-system, sans-serif`;
  g.font = fontT;
  let w = g.measureText(title).width;
  if (subtitle) {
    g.font = fontS;
    w = Math.max(w, g.measureText(subtitle).width);
  }
  const hPx = subtitle ? px * 1.95 : px * 1.25;
  c.width = Math.ceil(w + pad * 2 + (accent ? 18 : 0));
  c.height = Math.ceil(hPx + pad);
  g.fillStyle = bg;
  roundRect(g, 0, 0, c.width, c.height, 22);
  g.fill();
  const x0 = pad + (accent ? 18 : 0);
  if (accent) {
    g.fillStyle = accent;
    roundRect(g, pad * 0.6, pad * 0.6, 12, c.height - pad * 1.2, 6);
    g.fill();
  }
  g.textBaseline = 'top';
  g.fillStyle = fg;
  g.font = fontT;
  g.fillText(title, x0, pad * 0.55);
  if (subtitle) {
    g.fillStyle = sub;
    g.font = fontS;
    g.fillText(subtitle, x0, pad * 0.55 + px * 1.12);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set((height * c.width) / c.height, height, 1);
  s.renderOrder = 5;
  return s;
}

// Flaches Schild (Plane) mit Text, z. B. Genre- oder Markenschild
export function signMesh(text, { w, h, bg = '#1c1c1f', fg = '#f4f1ec', font = '600', border = null }) {
  const H = 128;
  const W = Math.round((H * w) / h);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = 8;
    g.strokeRect(4, 4, W - 8, H - 8);
  }
  g.fillStyle = fg;
  let size = 72;
  g.font = `${font} ${size}px system-ui, -apple-system, sans-serif`;
  while (g.measureText(text).width > W * 0.88 && size > 20) {
    size -= 4;
    g.font = `${font} ${size}px system-ui, -apple-system, sans-serif`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2 + 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
