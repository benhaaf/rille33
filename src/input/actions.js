// Alle Funktionen aus SPEC Kap. 10 – eine gemeinsame Liste für Controller, Tastatur und Touch.
export const ACTIONS = {
  ansicht: { label: 'Ego ↔ Draufsicht', kurz: 'Ansicht', icon: '⬒', etappe: 4 },
  hauptweg: { label: 'Hauptweg ein/aus', kurz: 'Weg', icon: '➜', etappe: 4 },
  zonen: { label: 'Zonen & Beschriftungen', kurz: 'Zonen', icon: '▦', etappe: 2 },
  info: { label: 'Infokarte zum Objekt', kurz: 'Info', icon: 'ⓘ', etappe: 5 },
  regalzonen: { label: 'Regalzonen-Höhenmarken', kurz: 'Regal', icon: '☰', etappe: 2 },
  praesentation: { label: 'Präsentationsmodus', kurz: 'Präs.', icon: '▶', etappe: 5 },
  weiter: { label: 'Nächste Station', kurz: 'Weiter', icon: '›', etappe: 5 },
  zurueck: { label: 'Vorige Station', kurz: 'Zurück', icon: '‹', etappe: 5 },
  rahmen: { label: 'Rahmen-Overlay', kurz: 'Rahmen', icon: '≡', etappe: 5 },
  png: { label: 'Draufsicht als PNG', kurz: 'PNG', icon: '⤓', etappe: 4 },
  musik: { label: 'Lo-Fi-Musik an den Hörstationen', kurz: 'Musik', icon: '♪', etappe: 6 },
};

// Winziger Event-Bus für Aktionen
export class ActionBus {
  constructor() {
    this.handlers = new Map();
  }
  on(name, fn) {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name).push(fn);
  }
  emit(name, source) {
    const list = this.handlers.get(name);
    if (list && list.length) list.forEach((fn) => fn(source));
    else (this.handlers.get('*') || []).forEach((fn) => fn(name, source));
  }
}
