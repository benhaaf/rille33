// Etappe 4: Draufsicht mit orthografischer Kamera + 2D-Overlay (Beschriftungen, Legende, Maßstab).
// Dieselbe Zeichenfunktion erzeugt auch den PNG-Export.
import * as THREE from 'three';

const DARK = 'rgba(28,28,31,0.86)';
const TEXT = '#f4f1ec';
const SUB = '#c9c4bc';
const ACCENT = '#e8772e';

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function hatch(g, x, y, w, h, color = '#d62828') {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.5, w / 8);
  for (let i = -h; i < w + h; i += w / 3) {
    g.beginPath();
    g.moveTo(x + i, y + h);
    g.lineTo(x + i + h, y);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.strokeRect(x, y, w, h);
}

export class TopView {
  constructor(layout, container) {
    this.layout = layout;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 80);
    this.camera.up.set(0, 0, -1);
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'plan-overlay';
    this.canvas.hidden = true;
    container.appendChild(this.canvas);
    this.showZones = true;
    this.showPaths = true;
    this.reserve = { right: 0, bottom: 0 };
    this.frame = null;
  }

  // Berechnet Maßstab, Kamera und Bereiche für eine Bildgröße (CSS-Pixel)
  layoutFor(w, h, reserve = this.reserve) {
    const { breite: W, tiefe: D } = this.layout.raum;
    const u = Math.min(w, h) / 800; // UI-Maßstab
    const m = 20 * u;
    const titleH = 64 * u;
    const scaleH = 44 * u;
    const landscape = w >= h * 1.05;
    let area;
    let legend;
    if (landscape) {
      const L = Math.min(Math.max(w * 0.27, 250 * u), 400 * u);
      legend = { x: w - reserve.right - m - L, y: titleH, w: L, h: h - reserve.bottom - titleH - m };
      area = { x: m, y: titleH, w: legend.x - 2 * m, h: h - titleH - scaleH - m };
    } else {
      const LH = h * 0.36;
      legend = { x: m, y: h - reserve.bottom - m - LH, w: w - reserve.right - 2 * m, h: LH };
      area = { x: m, y: titleH, w: w - 2 * m, h: legend.y - titleH - scaleH - m };
    }
    // Platz außen für Tür-/Fensterbeschriftungen
    const ppm = Math.min(area.w / (W + 1.2), area.h / (D + 1.6));
    const acx = area.x + area.w / 2;
    const acy = area.y + area.h / 2;
    const camX = W / 2 - (acx - w / 2) / ppm;
    const camZ = D / 2 + (acy - h / 2) / ppm;
    const c = this.camera;
    c.left = -w / 2 / ppm;
    c.right = w / 2 / ppm;
    c.top = h / 2 / ppm;
    c.bottom = -h / 2 / ppm;
    c.position.set(camX, 40, -camZ);
    c.lookAt(camX, 0, -camZ);
    c.updateProjectionMatrix();
    this.frame = { w, h, u, m, ppm, camX, camZ, area, legend, landscape, scaleH };
    return this.frame;
  }

  toScreen(x, z, f = this.frame) {
    return [f.w / 2 + (x - f.camX) * f.ppm, f.h / 2 - (z - f.camZ) * f.ppm];
  }

  // Overlay im Browser (Retina-scharf)
  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.layoutFor(w, h);
    const g = this.canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    this.draw(g);
  }

  draw(g, f = this.frame) {
    const L = this.layout;
    const { u, ppm } = f;
    g.textBaseline = 'middle';

    // Titel
    const [rx0] = this.toScreen(0, 0, f);
    g.fillStyle = TEXT;
    g.textAlign = 'left';
    g.font = `700 ${22 * u}px system-ui, -apple-system, sans-serif`;
    g.fillText(L.draufsicht.titel, rx0, 26 * u);
    g.fillStyle = SUB;
    g.font = `400 ${14 * u}px system-ui, -apple-system, sans-serif`;
    g.fillText(L.draufsicht.untertitel, rx0, 48 * u);

    // Öffnungen außen beschriften
    g.font = `600 ${Math.max(10, 0.24 * ppm)}px system-ui, sans-serif`;
    g.textAlign = 'center';
    for (const o of L.oeffnungen) {
      const z = o.wand === 'front' ? -0.5 : L.raum.tiefe + 0.5;
      const [x, y] = this.toScreen((o.von + o.bis) / 2, z, f);
      g.fillStyle = o.typ === 'notausgang' ? '#3fbf7f' : SUB;
      g.fillText(o.typ === 'tuer' ? `↑ ${o.name}` : o.name, x, y);
    }

    if (this.showZones) {
      // Zonen
      for (const z of L.zonen) {
        const [x1, x2, z1, z2] = z.rechteck;
        const pos = z.beschriftung || { x: (x1 + x2) / 2, z: (z1 + z2) / 2 };
        const rot = pos.drehung || 0;
        const maxW = (rot ? z2 - z1 : x2 - x1) * ppm * 0.92;
        const fs = Math.max(9, Math.min(0.26 * ppm, 20 * u));
        g.font = `700 ${fs}px system-ui, sans-serif`;
        const lines = wrap(g, `${z.id} ${z.name}`, maxW);
        const sub = z.typ;
        g.font = `400 ${fs * 0.72}px system-ui, sans-serif`;
        const subLines = wrap(g, sub, maxW);
        g.font = `700 ${fs}px system-ui, sans-serif`;
        const tw = Math.max(...lines.map((l) => g.measureText(l).width), ...subLines.map((l) => g.measureText(l).width * 0.72));
        const lh = fs * 1.15;
        const bh = lines.length * lh + subLines.length * lh * 0.72 + fs * 0.5;
        const [sx, sy] = this.toScreen(pos.x, pos.z, f);
        g.save();
        g.translate(sx, sy);
        g.rotate((-rot * Math.PI) / 180);
        g.fillStyle = 'rgba(28,28,31,0.72)';
        roundRect(g, -tw / 2 - fs * 0.5, -bh / 2, tw + fs, bh, fs * 0.35);
        g.fill();
        g.fillStyle = z.farbe;
        g.fillRect(-tw / 2 - fs * 0.5, -bh / 2 + fs * 0.2, fs * 0.18, bh - fs * 0.4);
        g.textAlign = 'center';
        let y = -bh / 2 + fs * 0.25 + lh / 2;
        g.fillStyle = TEXT;
        g.font = `700 ${fs}px system-ui, sans-serif`;
        for (const l of lines) {
          g.fillText(l, fs * 0.08, y);
          y += lh;
        }
        g.fillStyle = SUB;
        g.font = `400 ${fs * 0.72}px system-ui, sans-serif`;
        for (const l of subLines) {
          g.fillText(l, fs * 0.08, y - lh * 0.12);
          y += lh * 0.72;
        }
        g.restore();
      }

      // Möbel-IDs
      const fs = Math.max(8, Math.min(0.2 * ppm, 15 * u));
      g.font = `800 ${fs}px system-ui, sans-serif`;
      g.textAlign = 'center';
      for (const mo of L.moebel) {
        const list = mo.stationen ? [mo.stationen[Math.floor(mo.stationen.length / 2)]] : [[(mo.rechteck[0] + mo.rechteck[1]) / 2, (mo.rechteck[2] + mo.rechteck[3]) / 2]];
        for (const [x, z] of list) {
          const [sx, sy] = this.toScreen(x, z, f);
          const tw = g.measureText(mo.id).width;
          g.fillStyle = ACCENT;
          roundRect(g, sx - tw / 2 - fs * 0.35, sy - fs * 0.62, tw + fs * 0.7, fs * 1.24, fs * 0.3);
          g.fill();
          g.fillStyle = '#1c1c1f';
          g.fillText(mo.id, sx, sy + fs * 0.04);
        }
      }
    }

    this.drawScale(g, f);
    this.drawLegend(g, f);
  }

  drawScale(g, f) {
    const { u, ppm } = f;
    const [x0] = this.toScreen(0, 0, f);
    const y = f.area.y + f.area.h + f.scaleH * 0.2;
    const n = 5;
    const h = 7 * u;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? TEXT : '#55565c';
      g.fillRect(x0 + i * ppm, y, ppm, h);
    }
    g.strokeStyle = TEXT;
    g.lineWidth = 1;
    g.strokeRect(x0, y, n * ppm, h);
    g.fillStyle = TEXT;
    g.font = `500 ${11 * u}px system-ui, sans-serif`;
    g.textAlign = 'center';
    for (let i = 0; i <= n; i++) g.fillText(i === n ? `${i} m` : String(i), x0 + i * ppm, y + h + 10 * u);
    g.textAlign = 'left';
    g.fillText('Maßstab', x0 + n * ppm + 22 * u, y + h / 2);
  }

  drawLegend(g, f) {
    const L = this.layout;
    const box = f.legend;
    const rows = [];
    rows.push({ head: 'Zonen' });
    for (const z of L.zonen) rows.push({ zone: z });
    rows.push({ head: 'Wege & Flächen' });
    for (const w of L.wege) rows.push({ weg: w });
    rows.push({ sperr: 'Notausgang freihalten (1,2 m)' });
    rows.push({ head: 'Möbel' });
    const moebel = L.moebel.map((m) => ({ id: m.id, name: m.name }));
    const twoCol = f.landscape ? false : true;
    if (twoCol) for (let i = 0; i < moebel.length; i += 2) rows.push({ pair: [moebel[i], moebel[i + 1]] });
    else for (const m of moebel) rows.push({ moebel: m });

    // Schriftgröße so wählen, dass alles in die Box passt
    const units = rows.reduce((s, r) => s + (r.head ? 1.5 : r.zone ? 1.5 : 1), 0) + 1.2;
    const lh = Math.min((box.h - 16 * f.u) / units, 24 * f.u);
    const fs = lh * 0.62;
    g.fillStyle = DARK;
    roundRect(g, box.x, box.y, box.w, box.h, 12 * f.u);
    g.fill();

    const pad = 14 * f.u;
    let y = box.y + pad + lh * 0.3;
    g.textAlign = 'left';
    g.fillStyle = TEXT;
    g.font = `700 ${fs * 1.2}px system-ui, sans-serif`;
    g.fillText('Legende', box.x + pad, y);
    y += lh * 1.1;
    const sw = fs * 1.5;
    const colW = (box.w - 2 * pad) / 2;
    const clip = (text, maxW) => {
      let t = text;
      while (g.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2);
      return t === text ? t : `${t}…`;
    };

    for (const r of rows) {
      const x = box.x + pad;
      if (r.head) {
        y += lh * 0.25;
        g.fillStyle = ACCENT;
        g.font = `700 ${fs}px system-ui, sans-serif`;
        g.fillText(r.head.toUpperCase(), x, y);
        y += lh * 1.25;
        continue;
      }
      g.font = `500 ${fs}px system-ui, sans-serif`;
      if (r.zone) {
        // Zwei Zeilen: Name, darunter der Flächentyp
        g.fillStyle = r.zone.farbe;
        g.globalAlpha = 0.75;
        g.fillRect(x, y - fs * 0.55, sw, fs * 1.5);
        g.globalAlpha = 1;
        const tx = x + sw + 8 * f.u;
        const maxW = box.x + box.w - pad - tx;
        g.font = `500 ${fs}px system-ui, sans-serif`;
        g.fillStyle = TEXT;
        g.fillText(clip(`${r.zone.id} ${r.zone.name}`, maxW), tx, y);
        g.font = `400 ${fs * 0.78}px system-ui, sans-serif`;
        g.fillStyle = SUB;
        g.fillText(clip(r.zone.typ, maxW), tx, y + fs * 0.95);
        y += lh * 0.5;
      } else if (r.weg) {
        g.strokeStyle = r.weg.farbe;
        g.lineWidth = fs * 0.3;
        g.setLineDash(r.weg.stil === 'gestrichelt' ? [fs * 0.5, fs * 0.35] : []);
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + sw, y);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = TEXT;
        g.fillText(clip(r.weg.name, box.w - 2 * pad - sw), x + sw + 8 * f.u, y);
      } else if (r.sperr) {
        hatch(g, x, y - fs * 0.55, sw, fs * 1.1);
        g.fillStyle = TEXT;
        g.fillText(r.sperr, x + sw + 8 * f.u, y);
      } else if (r.moebel || r.pair) {
        const items = r.pair ? r.pair.filter(Boolean) : [r.moebel];
        items.forEach((it, i) => {
          const cx = x + i * colW;
          g.font = `800 ${fs * 0.85}px system-ui, sans-serif`;
          const tw = g.measureText(it.id).width;
          g.fillStyle = ACCENT;
          roundRect(g, cx, y - fs * 0.55, Math.max(sw, tw + fs * 0.5), fs * 1.1, fs * 0.25);
          g.fill();
          g.fillStyle = '#1c1c1f';
          g.textAlign = 'center';
          g.fillText(it.id, cx + Math.max(sw, tw + fs * 0.5) / 2, y + fs * 0.03);
          g.textAlign = 'left';
          g.fillStyle = TEXT;
          g.font = `500 ${fs}px system-ui, sans-serif`;
          const maxW = (r.pair ? colW : box.w - 2 * pad) - sw - 14 * f.u;
          g.fillText(clip(it.name, maxW), cx + Math.max(sw, tw + fs * 0.5) + 8 * f.u, y);
        });
      }
      y += lh;
    }
  }

  // PNG in hoher Auflösung (für Folien). Gibt eine Data-URL zurück.
  exportPNG(renderer, scene, width = 2400, height = 1600) {
    const prevSize = renderer.getSize(new THREE.Vector2());
    const prevPR = renderer.getPixelRatio();
    const prevReserve = this.reserve;
    const prevFrame = this.frame;
    try {
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      const f = this.layoutFor(width, height, { right: 0, bottom: 0 });
      renderer.render(scene, this.camera);
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const g = out.getContext('2d');
      g.fillStyle = '#1c1c1f';
      g.fillRect(0, 0, width, height);
      g.drawImage(renderer.domElement, 0, 0, width, height);
      this.draw(g, f);
      return out.toDataURL('image/png');
    } finally {
      renderer.setPixelRatio(prevPR);
      renderer.setSize(prevSize.x, prevSize.y);
      this.reserve = prevReserve;
      if (prevFrame) this.layoutFor(prevFrame.w, prevFrame.h);
    }
  }
}
