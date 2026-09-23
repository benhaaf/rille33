// Zeigt die exportierte Draufsicht an und bietet iPad-taugliche Wege zum Speichern:
// Teilen-Dialog (→ „Bild sichern“, AirDrop, Dateien), Herunterladen, Öffnen in neuem Tab, langes Drücken aufs Bild.
const FILE = 'rille33-draufsicht.png';

function dataUrlToBlob(url) {
  const [head, b64] = url.split(',');
  const mime = head.match(/:(.*?);/)[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export class ExportDialog {
  constructor(root, toast) {
    this.toast = toast;
    root.insertAdjacentHTML(
      'beforeend',
      `<div id="export-dialog" hidden role="dialog" aria-label="Draufsicht als PNG">
        <div class="export-box">
          <img alt="Draufsicht als PNG" />
          <p class="hint">Tipp: Bild lange drücken → „Zu Fotos hinzufügen“.</p>
          <div class="export-actions">
            <button type="button" data-x="share">Teilen / Sichern</button>
            <a data-x="download" download="${FILE}">Herunterladen</a>
            <a data-x="open" target="_blank" rel="noopener">In neuem Tab öffnen</a>
            <button type="button" data-x="close">Schließen</button>
          </div>
        </div>
      </div>`,
    );
    this.el = root.querySelector('#export-dialog');
    this.img = this.el.querySelector('img');
    this.shareBtn = this.el.querySelector('[data-x="share"]');
    this.dl = this.el.querySelector('[data-x="download"]');
    this.open = this.el.querySelector('[data-x="open"]');
    this.el.querySelector('[data-x="close"]').addEventListener('click', () => this.hide());
    this.el.addEventListener('pointerdown', (e) => e.target === this.el && this.hide());
    // Teilen muss direkt im Klick passieren (Safari verlangt eine Nutzergeste)
    this.shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({ files: [this.file], title: 'Rille 33 – Draufsicht' });
      } catch (err) {
        if (err && err.name !== 'AbortError') this.toast('Teilen nicht möglich – bitte „Herunterladen“ oder Bild lange drücken');
      }
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && this.hide());
  }

  get visible() {
    return !this.el.hidden;
  }

  show(dataUrl) {
    const blob = dataUrlToBlob(dataUrl);
    this.file = new File([blob], FILE, { type: 'image/png' });
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(blob);
    this.img.src = this.url;
    this.dl.href = this.url;
    this.open.href = this.url;
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [this.file] }));
    this.shareBtn.hidden = !canShare;
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }
}
