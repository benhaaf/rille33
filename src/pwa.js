// Service Worker registrieren (vite-plugin-pwa). Danach läuft die App offline.
import { registerSW } from 'virtual:pwa-register';

export function setupPWA(toast) {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      toast('Offline bereit – über „Teilen → Zum Home-Bildschirm“ installierbar');
    },
    onNeedRefresh() {
      toast('Neue Version geladen – wird beim nächsten Start aktiv');
    },
  });
}
