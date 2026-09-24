// Etappe 5: Infokarte (Entscheidung · Begründung · Quelle · Annahme), Rahmen-Overlay (Kap. 3), Stationsanzeige.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class Panels {
  constructor(root, layout) {
    this.layout = layout;
    root.insertAdjacentHTML(
      'beforeend',
      `<aside id="infocard" hidden aria-live="polite"></aside>
       <section id="slide" hidden aria-live="polite"></section>
       <div id="station-indicator" hidden></div>
       <div id="rahmen" hidden role="dialog" aria-label="Rahmendaten"><div class="rahmen-box"></div></div>`,
    );
    this.card = root.querySelector('#infocard');
    this.slide = root.querySelector('#slide');
    this.indicator = root.querySelector('#station-indicator');
    this.rahmen = root.querySelector('#rahmen');
    this.rahmen.addEventListener('pointerdown', () => this.toggleRahmen(false));
    this.renderRahmen();
    this.cardStation = null;
  }

  // ---------- Infokarte ----------
  showCard(station, total) {
    const s = station;
    const row = (label, text, cls = '') => `<div class="ic-row ${cls}"><span class="ic-label">${label}</span><p>${esc(text)}</p></div>`;
    this.card.innerHTML = `
      <header><span class="ic-nr">${s.nr}/${total}</span><h2>${esc(s.titel)} <small>${esc(s.bezug)}</small></h2></header>
      ${row('Entscheidung', s.entscheidung)}
      ${row('Begründung', s.begruendung)}
      ${row('Quelle', s.quelle, 'ic-quelle')}
      ${s.annahme ? row('Annahme', s.annahme, 'ic-annahme') : ''}`;
    this.card.hidden = false;
    this.card.classList.remove('ic-in');
    void this.card.offsetWidth; // Animation neu starten
    this.card.classList.add('ic-in');
    this.cardStation = s;
  }

  hideCard() {
    this.card.hidden = true;
    this.cardStation = null;
  }

  get cardVisible() {
    return !this.card.hidden;
  }

  // ---------- Folien: Einleitung, Fazit, Quellen ----------
  showSlide(sl, stationCount) {
    let body = '';
    if (sl.typ === 'einleitung') {
      body = `
        <p class="sl-kicker">${esc(sl.zeile)}</p>
        <h1 class="sl-title">${esc(sl.titel)}</h1>
        <p class="sl-sub">${esc(sl.untertitel)}</p>
        <p class="sl-frage"><span>Leitfrage</span>${esc(sl.fragestellung)}</p>
        <h3>Ablauf</h3>
        <ol class="sl-agenda">${sl.agenda.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
        <p class="sl-team">${esc(sl.team)}</p>`;
    } else if (sl.typ === 'schluss') {
      body = `
        <p class="sl-kicker">Rundgang abgeschlossen · ${stationCount} Stationen</p>
        <h1 class="sl-title">${esc(sl.titel)}</h1>
        <ul class="sl-punkte">${sl.punkte.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        ${sl.ausblick ? `<p class="sl-frage"><span>Ausblick</span>${esc(sl.ausblick)}</p>` : ''}`;
    } else if (sl.typ === 'quellen') {
      body = `
        <h1 class="sl-title">${esc(sl.titel)}</h1>
        <ol class="sl-quellen">${sl.liste.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
        ${sl.hinweise ? `<ul class="sl-hinweise">${sl.hinweise.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
    }
    this.slide.className = `sl-${sl.typ}`;
    this.slide.innerHTML = body;
    this.slide.hidden = false;
    this.slide.classList.remove('ic-in');
    void this.slide.offsetWidth;
    this.slide.classList.add('ic-in');
  }

  hideSlide() {
    this.slide.hidden = true;
  }

  get slideVisible() {
    return !this.slide.hidden;
  }

  setIndicator(text) {
    this.indicator.hidden = !text;
    this.indicator.textContent = text || '';
  }

  // ---------- Rahmen-Overlay ----------
  renderRahmen() {
    const R = this.layout.rahmen;
    const rows = R.felder
      .map((f) => {
        const body = f.liste ? `<ol>${f.liste.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : `<p>${esc(f.text)}</p>`;
        const tag = f.annahme ? `<span class="tag-annahme">Annahme</span>` : '';
        const hint = f.hinweis ? `<p class="hint">${esc(f.hinweis)}</p>` : '';
        return `<div class="r-row"><dt>${esc(f.name)}</dt><dd>${body}${tag}${hint}</dd></div>`;
      })
      .join('');
    this.rahmen.querySelector('.rahmen-box').innerHTML = `
      <h1>${esc(R.titel)}</h1>
      <dl>${rows}</dl>
      <footer>${esc(R.fusszeile)}<span>Schließen: Create / I / „Rahmen“ oder tippen</span></footer>`;
  }

  toggleRahmen(on = this.rahmen.hidden) {
    this.rahmen.hidden = !on;
    return on;
  }

  get rahmenVisible() {
    return !this.rahmen.hidden;
  }
}
