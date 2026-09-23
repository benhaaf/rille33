// 2D-Kollision in der Draufsicht: Spieler = Kreis, Hindernisse = Rechtecke [x1, x2, z1, z2].

export class Collider {
  constructor(rects = []) {
    this.rects = rects.map(([x1, x2, z1, z2]) => [
      Math.min(x1, x2), Math.max(x1, x2), Math.min(z1, z2), Math.max(z1, z2),
    ]);
  }

  // Fügt ein Rechteck hinzu und gibt es zurück – es kann später mit set() verändert werden (z. B. Tür auf/zu)
  add(rect) {
    const r = [Math.min(rect[0], rect[1]), Math.max(rect[0], rect[1]), Math.min(rect[2], rect[3]), Math.max(rect[2], rect[3])];
    this.rects.push(r);
    return r;
  }

  set(r, rect) {
    r[0] = Math.min(rect[0], rect[1]);
    r[1] = Math.max(rect[0], rect[1]);
    r[2] = Math.min(rect[2], rect[3]);
    r[3] = Math.max(rect[2], rect[3]);
  }

  // Schiebt einen Kreis (x, z, r) aus allen Rechtecken heraus. Liefert {x, z}.
  resolve(x, z, r) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const [x1, x2, z1, z2] of this.rects) {
        // Schnelltest
        if (x < x1 - r || x > x2 + r || z < z1 - r || z > z2 + r) continue;
        const cx = Math.max(x1, Math.min(x, x2));
        const cz = Math.max(z1, Math.min(z, z2));
        const dx = x - cx;
        const dz = z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          const push = r - d;
          x += (dx / d) * push;
          z += (dz / d) * push;
        } else {
          // Mittelpunkt liegt im Rechteck: entlang der kleinsten Überlappung hinaus
          const pens = [x - x1 + r, x2 - x + r, z - z1 + r, z2 - z + r];
          const i = pens.indexOf(Math.min(...pens));
          if (i === 0) x = x1 - r;
          else if (i === 1) x = x2 + r;
          else if (i === 2) z = z1 - r;
          else z = z2 + r;
        }
        moved = true;
      }
      if (!moved) break;
    }
    return { x, z };
  }
}
