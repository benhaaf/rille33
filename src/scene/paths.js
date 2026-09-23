// Etappe 4: Hauptweg (leuchtende Linie mit wandernden Richtungspfeilen) und gestrichelter Sammler-Weg.
import * as THREE from 'three';

const Y = 0.035; // knapp über Boden und Zonenflächen

function segments(points) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    segs.push({ x1, z1, x2, z2, len, start: total, dx: (x2 - x1) / len, dz: (z2 - z1) / len });
    total += len;
  }
  return { segs, total };
}

function pointAt({ segs }, s) {
  for (const g of segs) {
    if (s <= g.start + g.len) {
      const t = s - g.start;
      return { x: g.x1 + g.dx * t, z: g.z1 + g.dz * t, dx: g.dx, dz: g.dz };
    }
  }
  const g = segs[segs.length - 1];
  return { x: g.x2, z: g.z2, dx: g.dx, dz: g.dz };
}

// Flaches Band zwischen zwei Punkten (Store-Koordinaten) in eine Positionsliste schreiben
function pushQuad(pos, ax, az, bx, bz, w, y) {
  const len = Math.hypot(bx - ax, bz - az);
  const nx = (-(bz - az) / len) * (w / 2);
  const nz = ((bx - ax) / len) * (w / 2);
  const p = [
    [ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz],
    [ax + nx, az + nz], [bx - nx, bz - nz], [ax - nx, az - nz],
  ];
  for (const [x, z] of p) pos.push(x, y, -z);
}

function ribbon(path, width, dashed, y) {
  const pos = [];
  const { segs, total } = path;
  if (!dashed) {
    for (const g of segs) pushQuad(pos, g.x1, g.z1, g.x2, g.z2, width, y);
  } else {
    for (let s = 0; s < total; s += 0.55) {
      const a = pointAt(path, s);
      const b = pointAt(path, Math.min(total, s + 0.32));
      pushQuad(pos, a.x, a.z, b.x, b.z, width, y);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

function arrowGeometry(size) {
  // Spitze zeigt in lokale -z-Richtung (= Store +z), liegt flach
  const s = size;
  const shape = new THREE.Shape();
  shape.moveTo(0, s * 0.6);
  shape.lineTo(s * 0.45, -s * 0.35);
  shape.lineTo(0, -s * 0.12);
  shape.lineTo(-s * 0.45, -s * 0.35);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function buildPaths(layout) {
  const group = new THREE.Group();
  group.name = 'Wege';
  const animated = [];
  const o = new THREE.Object3D();

  (layout.wege || []).forEach((w, i) => {
    const path = segments(w.punkte);
    const color = new THREE.Color(w.farbe);
    const y = Y + i * 0.002;
    const dashed = w.stil === 'gestrichelt';

    // Weicher Schein unter der Linie
    if (!dashed) {
      const glow = new THREE.Mesh(
        ribbon(path, 0.42, false, y - 0.001),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      group.add(glow);
      // Runde Gelenke
      for (const [x, z] of w.punkte) {
        const c = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color }));
        c.rotation.x = -Math.PI / 2;
        c.position.set(x, y, -z);
        group.add(c);
      }
    }
    const line = new THREE.Mesh(ribbon(path, dashed ? 0.1 : 0.12, dashed, y), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    group.add(line);

    // Richtungspfeile
    const spacing = dashed ? path.total : 1.1;
    const count = dashed ? 1 : Math.floor(path.total / spacing);
    const arrows = new THREE.InstancedMesh(arrowGeometry(dashed ? 0.4 : 0.34), new THREE.MeshBasicMaterial({ color: color.clone().lerp(new THREE.Color('#ffffff'), 0.35) }), count);
    arrows.frustumCulled = false;
    group.add(arrows);
    const item = { path, arrows, spacing, count, y: y + 0.001, speed: dashed ? 0 : 0.45, offset: 0, dashed };
    animated.push(item);
    place(item);
  });

  function place(item) {
    for (let k = 0; k < item.count; k++) {
      const s = item.dashed ? item.path.total - 0.15 : (k * item.spacing + item.offset) % item.path.total;
      const p = pointAt(item.path, s);
      o.position.set(p.x, item.y, -p.z);
      o.rotation.set(0, Math.atan2(-p.dx, p.dz), 0);
      o.updateMatrix();
      item.arrows.setMatrixAt(k, o.matrix);
    }
    item.arrows.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    update(dt) {
      if (!group.visible) return;
      for (const item of animated) {
        if (!item.speed) continue;
        item.offset = (item.offset + dt * item.speed) % item.spacing;
        place(item);
      }
    },
  };
}
