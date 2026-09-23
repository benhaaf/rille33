// Packt den Einzeldatei-Build (dist-einzeldatei/) in eine HTML-Datei, die per Doppelklick
// ohne Server und ohne Internet im Browser läuft: node scripts/einzeldatei.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-einzeldatei';
let html = readFileSync(join(dir, 'index.html'), 'utf8');

html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g, (_, file) => {
  const js = readFileSync(join(dir, file), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/g, (_, file) => `<style>${readFileSync(join(dir, file), 'utf8')}</style>`);
// Icons/Manifest werden offline nicht gebraucht
html = html.replace(/<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\s*/g, '');

if (/src="\.\/assets|href="\.\/assets/.test(html)) {
  console.error('Nicht alle Dateien konnten eingebettet werden:', readdirSync(join(dir, 'assets')));
  process.exit(1);
}
writeFileSync(join(dir, 'rille33-offline.html'), html);
console.log(`rille33-offline.html geschrieben (${Math.round(html.length / 1024)} KB)`);
