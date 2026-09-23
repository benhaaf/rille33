// Formatiert src/layout.json kompakt: einfache Objekte und Zahlenlisten jeweils in einer Zeile.
// Aufruf: node scripts/format-layout.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/layout.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));

const flat = (v) => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every((x) => typeof x !== 'object' || (Array.isArray(x) && x.every((y) => typeof y !== 'object'))));
const inline = (v) => JSON.stringify(v).replace(/,(?=["\[\d-])/g, ', ').replace(/":/g, '": ').replace(/\{"/g, '{ "').replace(/\}$/g, ' }');

function fmt(v, ind) {
  if (flat(v)) return inline(v);
  const pad = '  '.repeat(ind + 1);
  if (Array.isArray(v)) return '[\n' + v.map((x) => pad + fmt(x, ind + 1)).join(',\n') + '\n' + '  '.repeat(ind) + ']';
  const entries = Object.entries(v);
  if (ind >= 2 && entries.every(([, x]) => flat(x)) && inline(v).length < 160) return inline(v);
  return '{\n' + entries.map(([k, x]) => `${pad}${JSON.stringify(k)}: ${fmt(x, ind + 1)}`).join(',\n') + '\n' + '  '.repeat(ind) + '}';
}

writeFileSync(file, fmt(data, 0) + '\n');
