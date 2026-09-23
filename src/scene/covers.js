// Plattencover: 64 prozedurale Motive mit fiktiven Band- und Albumnamen auf einem Textur-Atlas.
// Alle Cover und Platten werden als eine einzige InstancedMesh gezeichnet (1 Draw Call).
import * as THREE from 'three';

export const COVER = 0.315; // LP-Format 31,5 cm

const GRID = 8; // 8 × 8 = 64 Motive
const TILE = 256;
const PAD = 6; // Rand gegen Farbbluten zwischen den Kacheln

// ---------- Fiktive Namen (bewusst ausgedachte Silbenkombinationen) ----------
const WORDS_A = ['Nacht', 'Kupfer', 'Nebel', 'Glas', 'Beton', 'Sommer', 'Neon', 'Staub', 'Wellen', 'Mond', 'Rost', 'Samt', 'Echo', 'Funken', 'Nord', 'Asphalt'];
const WORDS_B = ['falter', 'garten', 'kollektiv', 'fabrik', 'strom', 'bande', 'orchester', 'signal', 'haus', 'linie', 'klub', 'wald'];
const EN_A = ['Velvet', 'Paper', 'Silver', 'Hollow', 'Quiet', 'Golden', 'Midnight', 'Static', 'Crimson', 'Lunar', 'Wild', 'Distant'];
const EN_B = ['Harbor', 'Engines', 'Rooms', 'Tides', 'Pilots', 'Gardens', 'Signals', 'Owls', 'Motel', 'Parade', 'Fever', 'Circles'];
const TITLES = ['Zweite Seite', 'Leise Räume', 'Spätschicht', 'Nachtbus', 'Rille 33', 'Unter Strom', 'Weites Feld', 'Blaue Stunde', 'Low Tide', 'Side B', 'Night Drive', 'Warm Static', 'Slow Motion', 'Open Water', 'Afterglow', 'Paper Moon', 'Echolot', 'Vol. 2', 'Live im Keller', 'Morgengrau'];
const FONTS = ['700 %px system-ui, sans-serif', 'italic 600 %px Georgia, serif', '900 %px Impact, Arial Black, sans-serif', '300 %px Helvetica, Arial, sans-serif', '700 %px "Courier New", monospace', '600 %px "Times New Roman", serif'];

function pick(r, list) {
  return list[Math.floor(r() * list.length)];
}

function bandName(r) {
  const v = r();
  if (v < 0.4) return pick(r, WORDS_A) + pick(r, WORDS_B);
  if (v < 0.75) return `The ${pick(r, EN_A)} ${pick(r, EN_B)}`;
  if (v < 0.9) return `${pick(r, EN_A)} ${pick(r, EN_B)}`;
  return `${pick(r, WORDS_A).toUpperCase()} ${Math.floor(r() * 90 + 10)}`;
}

// ---------- Motive ----------
const MOTIFS = [
  // Sonne/Kreis
  (g, s, r, c) => {
    g.fillStyle = c[1];
    g.beginPath();
    g.arc(s * (0.3 + r() * 0.4), s * (0.4 + r() * 0.2), s * (0.18 + r() * 0.14), 0, Math.PI * 2);
    g.fill();
  },
  // Streifen
  (g, s, r, c) => {
    const n = 4 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      g.fillStyle = c[1 + (i % 2)];
      g.fillRect(0, s * 0.2 + (i * s * 0.6) / n, s, (s * 0.6) / n / 2);
    }
  },
  // Berge unter Farbverlauf
  (g, s, r, c) => {
    const grad = g.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, c[0]);
    grad.addColorStop(1, c[2]);
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    g.fillStyle = c[1];
    g.beginPath();
    g.moveTo(0, s);
    for (let x = 0; x <= s; x += s / 6) g.lineTo(x, s * (0.55 + r() * 0.25));
    g.lineTo(s, s);
    g.fill();
  },
  // Porträt-Silhouette
  (g, s, r, c) => {
    g.fillStyle = c[1];
    g.beginPath();
    g.arc(s * 0.5, s * 0.42, s * 0.16, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(s * 0.5, s * 0.95, s * 0.34, s * 0.3, 0, Math.PI, 0);
    g.fill();
  },
  // Rasterpunkte (Halbton)
  (g, s, r, c) => {
    g.fillStyle = c[1];
    const step = s / 12;
    for (let y = step / 2; y < s; y += step)
      for (let x = step / 2; x < s; x += step) {
        const d = Math.hypot(x - s * 0.6, y - s * 0.55) / s;
        const rad = Math.max(0, step * 0.45 * (1 - d * 1.6));
        g.beginPath();
        g.arc(x, y, rad, 0, Math.PI * 2);
        g.fill();
      }
  },
  // Konzentrische Quadrate
  (g, s, r, c) => {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = c[i % 3];
      const m = i * s * 0.07;
      g.fillRect(m + s * 0.08, m + s * 0.08, s * 0.84 - 2 * m, s * 0.84 - 2 * m);
    }
  },
  // Wellen
  (g, s, r, c) => {
    g.strokeStyle = c[1];
    g.lineWidth = s * 0.025;
    for (let k = 0; k < 7; k++) {
      g.beginPath();
      const y0 = s * (0.3 + k * 0.08);
      for (let x = 0; x <= s; x += 4) g.lineTo(x, y0 + Math.sin(x / (s * 0.08) + k) * s * 0.03);
      g.stroke();
    }
  },
  // Diagonale Teilung
  (g, s, r, c) => {
    g.fillStyle = c[1];
    g.beginPath();
    g.moveTo(0, s);
    g.lineTo(s, 0);
    g.lineTo(s, s);
    g.fill();
    g.fillStyle = c[2];
    g.fillRect(s * 0.6, s * 0.6, s * 0.25, s * 0.25);
  },
  // Großer Buchstabe
  (g, s, r, c, name) => {
    g.fillStyle = c[1];
    g.font = `900 ${s * 0.8}px Georgia, serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name[0], s * 0.5, s * 0.55);
  },
  // Ringe (Platte)
  (g, s, r, c) => {
    g.fillStyle = '#111';
    g.beginPath();
    g.arc(s * 0.62, s * 0.5, s * 0.34, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 1.5;
    for (let rr = s * 0.14; rr < s * 0.33; rr += 4) {
      g.beginPath();
      g.arc(s * 0.62, s * 0.5, rr, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = c[1];
    g.beginPath();
    g.arc(s * 0.62, s * 0.5, s * 0.11, 0, Math.PI * 2);
    g.fill();
  },
  // Blockgrafik
  (g, s, r, c) => {
    for (let i = 0; i < 7; i++) {
      g.fillStyle = c[1 + Math.floor(r() * 2)];
      g.fillRect(r() * s * 0.7, r() * s * 0.7, s * (0.1 + r() * 0.3), s * (0.1 + r() * 0.3));
    }
  },
  // Dreieck
  (g, s, r, c) => {
    g.fillStyle = c[1];
    g.beginPath();
    g.moveTo(s * 0.5, s * 0.18);
    g.lineTo(s * 0.86, s * 0.82);
    g.lineTo(s * 0.14, s * 0.82);
    g.fill();
  },
];

function drawCover(g, s, r, palette, index) {
  const c = [pick(r, palette), pick(r, palette), pick(r, palette)];
  if (c[1] === c[0]) c[1] = palette[(palette.indexOf(c[0]) + 7) % palette.length];
  const name = bandName(r);
  const title = pick(r, TITLES);
  g.fillStyle = c[0];
  g.fillRect(0, 0, s, s);
  MOTIFS[index % MOTIFS.length](g, s, r, c, name);

  // Typografie: Bandname + Titel, oben oder unten, links oder zentriert
  const top = r() < 0.5;
  const center = r() < 0.4;
  const font = pick(r, FONTS);
  let size = s * (0.1 + r() * 0.05);
  g.font = font.replace('%', size);
  while (g.measureText(name).width > s * 0.86 && size > 10) {
    size -= 2;
    g.font = font.replace('%', size);
  }
  const light = r() < 0.6;
  g.fillStyle = light ? '#f4f1ec' : '#161616';
  g.shadowColor = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.2)';
  g.shadowBlur = 4;
  g.textAlign = center ? 'center' : 'left';
  g.textBaseline = 'alphabetic';
  const x = center ? s / 2 : s * 0.07;
  const y = top ? s * 0.07 + size : s * 0.9;
  g.fillText(name, x, y);
  g.font = `400 ${Math.round(size * 0.55)}px system-ui, sans-serif`;
  g.fillText(title, x, top ? y + size * 0.75 : y - size * 1.05);
  g.shadowBlur = 0;

  // Manchmal ein Aufkleber
  if (r() < 0.12) {
    g.fillStyle = '#e8772e';
    g.beginPath();
    g.arc(s * 0.82, s * 0.2, s * 0.09, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1c1c1f';
    g.font = `800 ${s * 0.06}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('NEU', s * 0.82, s * 0.2);
  }
  // Leichte Papierstruktur / Abnutzung am Rand
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, s - 3, s - 3);
}

function buildAtlas(palette, r) {
  const size = GRID * TILE;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const inner = TILE - 2 * PAD;
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = inner;
  const tg = tmp.getContext('2d');
  for (let i = 0; i < GRID * GRID; i++) {
    tg.save();
    tg.clearRect(0, 0, inner, inner);
    drawCover(tg, inner, r, palette, i);
    tg.restore();
    const x = (i % GRID) * TILE;
    const y = Math.floor(i / GRID) * TILE;
    // Rand mit gestreckter Kante füllen, damit Mipmaps nicht in Nachbarkacheln bluten
    g.drawImage(tmp, x, y, TILE, TILE);
    g.drawImage(tmp, x + PAD, y + PAD);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.flipY = false;
  return tex;
}

// Quader im LP-Format; Vorder- und Rückseite zeigen das Cover, die Kanten nur dessen Randfarbe.
function coverGeometry(thickness) {
  const geo = new THREE.BoxGeometry(COVER, COVER, thickness);
  const uv = geo.attributes.uv;
  // Flächenreihenfolge: +x, -x, +y, -y, +z, -z (je 4 Ecken)
  for (let face = 0; face < 4; face++)
    for (let k = 0; k < 4; k++) uv.setXY(face * 4 + k, 0.5, 0.97);
  // Three-Konvention: v = 0 unten; Atlas wird ohne flipY geladen → v umdrehen
  for (let i = 16; i < 24; i++) uv.setY(i, 1 - uv.getY(i));
  return geo;
}

function atlasMaterial(map) {
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.72 });
  const scale = (TILE - 2 * PAD) / (TILE * GRID);
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 coverTile;')
      .replace(
        '#include <uv_vertex>',
        THREE.ShaderChunk.uv_vertex,
      )
      .replace(
        'vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;',
        `vMapUv = ( mapTransform * vec3( (coverTile * ${TILE}.0 + ${PAD}.0) / ${TILE * GRID}.0 + MAP_UV * ${scale.toFixed(6)}, 1 ) ).xy;`,
      );
  };
  return mat;
}

export class Covers {
  constructor(palette, rand) {
    this.rand = rand;
    this.material = atlasMaterial(buildAtlas(palette, rand));
    this.geo = coverGeometry(0.005);
    this.items = [];
  }

  // Frontal präsentiertes Cover
  front(_b, pose, scale = 1) {
    this.items.push({ ...pose, scale });
  }

  // Platte im Fach / in der Kiste. used = Second-Hand (leicht verblichen)
  record(_b, pose, used = false) {
    this.items.push({ ...pose, scale: 1, used });
  }

  // Baut alle gesammelten Cover (oder eine eigene Liste, z. B. den Inhalt der Schubladen) als eine InstancedMesh
  build(items = this.items, name = 'Plattencover') {
    const geo = this.geo.clone(); // eigene Geometrie, weil coverTile pro Instanz-Liste gilt
    const im = new THREE.InstancedMesh(geo, this.material, items.length);
    im.name = name;
    const tiles = new Float32Array(items.length * 2);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, -it.z);
      o.rotation.set(it.pitch || 0, it.yaw || 0, it.roll || 0, 'YXZ');
      o.scale.set(it.scale || 1, it.scale || 1, 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      const t = Math.floor(this.rand() * GRID * GRID);
      tiles[i * 2] = t % GRID;
      tiles[i * 2 + 1] = Math.floor(t / GRID);
      im.setColorAt(i, it.used ? col.setRGB(0.86, 0.82, 0.74) : col.setRGB(1, 1, 1));
    });
    geo.setAttribute('coverTile', new THREE.InstancedBufferAttribute(tiles, 2));
    im.instanceMatrix.needsUpdate = true;
    im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
    return im;
  }
}
