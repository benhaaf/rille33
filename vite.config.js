import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serviert das Projekt unter https://benhaaf.github.io/rille33/
const BASE = '/rille33/';

export default defineConfig(({ mode }) => {
  // Offline-Einzeldatei (npm run build:einzeldatei): relative Pfade, kein Service Worker.
  // scripts/einzeldatei.mjs packt danach JS und CSS in eine einzige HTML-Datei.
  if (mode === 'einzeldatei') {
    return {
      base: './',
      build: { target: 'es2020', outDir: 'dist-einzeldatei', modulePreload: false, chunkSizeWarningLimit: 1500 },
      resolve: { alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.js', import.meta.url)) } },
    };
  }

  return {
    base: BASE,
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // Registrierung in src/pwa.js
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Rille 33 – Plattenladen',
          short_name: 'Rille 33',
          description: 'Begehbarer 3D-Prototyp des Plattenladens „Rille 33“',
          lang: 'de',
          start_url: BASE,
          scope: BASE,
          display: 'fullscreen',
          orientation: 'landscape',
          background_color: '#1c1c1f',
          theme_color: '#1c1c1f',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Alles cachen, was der Build erzeugt – die App soll komplett offline laufen.
          globPatterns: ['**/*.{js,css,html,json,png,svg,webmanifest}'],
          globIgnores: ['rille33-offline.html'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
        },
      }),
    ],
  };
});
