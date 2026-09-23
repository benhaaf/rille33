// Etappe 3: Oberflächen – Holz/Beton-Böden je Zone, Filz-Paneele, Akzentstreifen.
import * as THREE from 'three';
import { Builder } from './builder.js';

function canvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function shade(hex, f) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
}

// Holzdielen: 8 Dielen pro Kachel, Kachel = 1,2 m
export function woodTexture(base) {
  return canvas(512, (g, s) => {
    const rows = 8;
    const h = s / rows;
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < rows; i++) {
      const off = r() * s;
      for (const x0 of [off - s, off]) {
        g.fillStyle = shade(base, 0.82 + r() * 0.3);
        g.fillRect(x0, i * h, s, h);
      }
      // Maserung
      g.strokeStyle = 'rgba(40,22,10,0.18)';
      g.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) {
        const y = i * h + 6 + r() * (h - 12);
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 8, s * 0.6, y + (r() - 0.5) * 8, s, y);
        g.stroke();
      }
      // Fugen
      g.fillStyle = 'rgba(25,15,8,0.55)';
      g.fillRect(0, i * h, s, 2);
      g.fillRect(off % s, i * h, 2, h);
    }
  });
}

// Beton: Rauschen + Flecken, Kachel = 2 m
export function concreteTexture(base) {
  return canvas(256, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    const img = g.getImageData(0, 0, s, s);
    let seed = 11;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 18;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    for (let k = 0; k < 14; k++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},0.035)`;
      g.beginPath();
      g.arc(r() * s, r() * s, 10 + r() * 40, 0, Math.PI * 2);
      g.fill();
    }
    // Fuge (Betonplatten 2 × 2 m)
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, 0, s, 1);
    g.fillRect(0, 0, 1, s);
  });
}

export function floorMaterials(M) {
  const beton = new THREE.MeshStandardMaterial({ map: concreteTexture(M.beton), roughness: 0.92 });
  const holz = new THREE.MeshStandardMaterial({ map: woodTexture(M.holz), roughness: 0.65 });
  return { beton, holz, kachel: { beton: 2, holz: 1.2 } };
}

// Böden je Zone (Holz auf Warenflächen, Beton auf Kundenflächen); Grundboden ist Beton.
export function buildFloors(layout) {
  const M = layout.materialien;
  const mats = floorMaterials(M);
  const group = new THREE.Group();
  group.name = 'Böden';
  const { breite: W, tiefe: D } = layout.raum;

  const add = (mat, [x1, x2, z1, z2], y) => {
    const w = x2 - x1;
    const d = z2 - z1;
    const geo = new THREE.PlaneGeometry(w, d);
    // UVs in Metern, damit die Textur überall gleich groß ist
    const uv = geo.attributes.uv;
    const k = mats.kachel[mat];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x1 + uv.getX(i) * w) / k, (z1 + (1 - uv.getY(i)) * d) / k);
    const m = new THREE.Mesh(geo, mats[mat]);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x1 + w / 2, y, -(z1 + d / 2));
    group.add(m);
  };

  add('beton', [0, W, 0, D], 0);
  layout.zonen.forEach((z, i) => {
    if (z.boden === 'holz') add('holz', z.rechteck, 0.002 + i * 0.0003);
  });
  return group;
}

// Filz-Paneele und oranger Akzentstreifen an den Wänden
export function buildWallDetails(layout) {
  const M = layout.materialien;
  const { breite: W, tiefe: D } = layout.raum;
  const b = new Builder({
    filz: new THREE.MeshStandardMaterial({ color: M.filz, roughness: 1 }),
    akzent: new THREE.MeshStandardMaterial({ color: M.akzent, roughness: 0.5, emissive: M.akzent, emissiveIntensity: 0.15 }),
  });
  const t = 0.04;
  const gap = 0.03;
  for (const p of M.filz_paneele) {
    const n = Math.max(1, Math.round((p.bis - p.von) / 0.6));
    const w = (p.bis - p.von) / n;
    for (let i = 0; i < n; i++) {
      const a = p.von + i * w + gap / 2;
      const e = p.von + (i + 1) * w - gap / 2;
      if (p.wand === 'rueck') b.box('filz', [a, e, D - t, D], p.unten, p.oben);
      else if (p.wand === 'front') b.box('filz', [a, e, 0, t], p.unten, p.oben);
      else if (p.wand === 'links') b.box('filz', [0, t, a, e], p.unten, p.oben);
      else b.box('filz', [W - t, W, a, e], p.unten, p.oben);
    }
  }
  // Akzentstreifen rundum – ausgespart über Schaufenster und hinter Filz-Paneelen
  const y = M.akzentstreifen_hoehe;
  const s = 0.012;
  const walls = {
    front: { len: W, rect: (a, e) => [a, e, s, s + 0.005] },
    rueck: { len: W, rect: (a, e) => [a, e, D - s - 0.005, D - s] },
    links: { len: D, rect: (a, e) => [s, s + 0.005, a, e] },
    rechts: { len: D, rect: (a, e) => [W - s - 0.005, W - s, a, e] },
  };
  for (const [name, w] of Object.entries(walls)) {
    const cut = [
      ...layout.oeffnungen.filter((o) => o.wand === name && o.typ === 'glas' && o.hoehe > y && (o.unten ?? 0) < y),
      ...M.filz_paneele.filter((p) => p.wand === name && p.unten < y + 0.05 && p.oben > y),
    ].sort((a, e) => a.von - e.von);
    let x = 0;
    for (const c of cut) {
      if (c.von > x) b.box('akzent', w.rect(x, c.von), y, y + 0.05);
      x = Math.max(x, c.bis);
    }
    if (x < w.len) b.box('akzent', w.rect(x, w.len), y, y + 0.05);
  }
  return b.build('Wanddetails');
}
