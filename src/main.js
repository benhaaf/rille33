import * as THREE from 'three';
import './style.css';
import config from './config.js';
import layout from './layout.json';
import { buildRoom } from './scene/room.js';
import { buildFurniture } from './scene/furniture.js';
import { buildZones, buildShelfZones } from './scene/zones.js';
import { buildLighting } from './scene/lighting.js';
import { buildFloors, buildWallDetails } from './scene/surfaces.js';
import { buildPaths } from './scene/paths.js';
import { TopView } from './topview.js';
import { ExportDialog } from './exportDialog.js';
import { Collider } from './collision.js';
import { Player } from './player.js';
import { ActionBus, ACTIONS } from './input/actions.js';
import { GamepadInput } from './input/gamepad.js';
import { KeyboardMouseInput } from './input/keyboard.js';
import { TouchInput } from './input/touch.js';
import { HUD } from './ui.js';
import { setupPWA } from './pwa.js';

const app = document.getElementById('app');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: config.grafik.antialias, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.grafik.maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const SKY = new THREE.Color(0xa9c3d6);
const PLAN_BG = new THREE.Color(0x1c1c1f);
scene.background = SKY;

const camera = new THREE.PerspectiveCamera(config.grafik.fov, window.innerWidth / window.innerHeight, 0.05, 120);

// Raum
const room = buildRoom(layout);
scene.add(room.group);
scene.add(buildFloors(layout));
scene.add(buildWallDetails(layout));
buildLighting(layout, scene);
const furniture = buildFurniture(layout);
scene.add(furniture.group);
const zones = buildZones(layout);
scene.add(zones);
const shelfZones = buildShelfZones(layout);
shelfZones.visible = false;
scene.add(shelfZones);
const paths = buildPaths(layout);
scene.add(paths.group);
const fixtures = scene.getObjectByName('Leuchten');
const collider = new Collider([...room.colliders, ...furniture.colliders]);
// Startpunkt, optional per URL überschreibbar: ?pos=x,z,blickGrad[,neigungGrad]
const start = { ...layout.start };
const posParam = new URLSearchParams(location.search).get('pos');
if (posParam) {
  const [x, z, deg = 0, tilt = 0] = posParam.split(',').map(Number);
  Object.assign(start, { position: [x, z], blickrichtung_grad: deg });
  start.neigung_grad = tilt;
}
const player = new Player(camera, collider, start);
if (start.neigung_grad) player.pitch = (start.neigung_grad * Math.PI) / 180;

// Eingabe
const hud = new HUD(app);
const bus = new ActionBus();
const gamepad = new GamepadInput(bus);
gamepad.onStatus = (c) => hud.setPad(c);
const keyboard = new KeyboardMouseInput(bus, renderer.domElement);
const touch = new TouchInput(bus, app);

// Draufsicht
const topView = new TopView(layout, app);
const exportDialog = new ExportDialog(app, (t) => hud.toast(t, 3000));
let view = 'ego';

// Sichtbarkeiten, die sich zwischen Ego-Perspektive und Draufsicht unterscheiden
function applyTopVisibility(top) {
  room.ceiling.visible = !top;
  room.outside.visible = !top;
  if (fixtures) fixtures.visible = !top;
  zones.userData.labels.visible = !top;
  shelfZones.visible = !top && shelfZonesOn;
  scene.background = top ? PLAN_BG : SKY;
}
let shelfZonesOn = false;

function updateReserve() {
  // Platz für die Touch-Buttons am rechten Rand und unten freihalten
  topView.reserve = touch.ui.hidden ? { right: 0, bottom: 0 } : { right: 96, bottom: 96 };
}

function setView(v) {
  view = v;
  const top = v === 'top';
  applyTopVisibility(top);
  topView.canvas.hidden = !top;
  document.body.classList.toggle('top-mode', top);
  touch.setActive('ansicht', top);
  if (top) {
    updateReserve();
    topView.resize(window.innerWidth, window.innerHeight);
  }
}

bus.on('ansicht', () => {
  if (exportDialog.visible) return exportDialog.hide();
  setView(view === 'ego' ? 'top' : 'ego');
  hud.toast(view === 'top' ? 'Draufsicht' : 'Ego-Perspektive', 1200);
});

// Ein-/Ausblenden
function redrawPlan() {
  if (view === 'top') topView.resize(window.innerWidth, window.innerHeight);
}
function toggle(action, text, get, set) {
  bus.on(action, () => {
    set(!get());
    touch.setActive(action, get());
    hud.toast(`${text} ${get() ? 'eingeblendet' : 'ausgeblendet'}`, 1400);
    redrawPlan();
  });
  touch.setActive(action, get());
}
toggle('zonen', 'Zonen & Beschriftungen', () => zones.visible, (v) => {
  zones.visible = v;
  topView.showZones = v;
});
toggle('regalzonen', 'Regalzonen', () => shelfZonesOn, (v) => {
  shelfZonesOn = v;
  shelfZones.visible = v && view === 'ego';
  if (v && view === 'top') hud.toast('Regalzonen sind in der Ego-Perspektive an der Genre-Wand zu sehen', 2500);
});
toggle('hauptweg', 'Hauptweg', () => paths.group.visible, (v) => {
  paths.group.visible = v;
  topView.showPaths = v;
});

// PNG-Export der Draufsicht (funktioniert aus beiden Ansichten)
bus.on('png', () => {
  if (exportDialog.visible) return exportDialog.hide();
  applyTopVisibility(true);
  let url;
  try {
    url = topView.exportPNG(renderer, scene);
  } finally {
    applyTopVisibility(view === 'top');
    if (view === 'top') topView.resize(window.innerWidth, window.innerHeight);
  }
  exportDialog.show(url);
});

// Funktionen, die erst in späteren Etappen kommen, melden sich mit einem Hinweis.
bus.on('*', (name) => {
  const a = ACTIONS[name];
  if (a) hud.toast(`${a.label} – folgt in Etappe ${a.etappe}`);
});

setupPWA((t) => hud.toast(t, 4000));

// Diagnose in der Browser-Konsole: ?debug → window.rille
if (new URLSearchParams(location.search).has('debug')) window.rille = { renderer, scene, camera, player, topView, bus };

// Größe
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (view === 'top') topView.resize(w, h);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

// iOS: Zoom-Gesten und Kontextmenüs unterdrücken
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => {
  // Im Export-Dialog soll langes Drücken aufs Bild funktionieren
  if (!e.target.closest('#export-dialog')) e.preventDefault();
});

// Hauptschleife
const timer = new THREE.Timer();
let touchHidden = touch.ui.hidden;
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.1);

  const gp = gamepad.poll();
  const kb = keyboard.poll();
  const tc = touch.poll();

  // Controller aktiv → Touch-Oberfläche ausblenden (erscheint bei Berührung wieder)
  if (gp.active && !touch.ui.hidden) touch.show(false);
  if (touchHidden !== touch.ui.hidden) {
    touchHidden = touch.ui.hidden;
    if (view === 'top') {
      updateReserve();
      topView.resize(window.innerWidth, window.innerHeight);
    }
  }

  const move = [gp.move[0] + kb.move[0] + tc.move[0], gp.move[1] + kb.move[1] + tc.move[1]];
  const g = config.gamepad.blickGeschwindigkeit * dt;
  const look = [gp.look[0] * g + kb.lookRad[0] + tc.lookRad[0], gp.look[1] * g + kb.lookRad[1] + tc.lookRad[1]];
  const sprint = Math.max(gp.sprint, kb.sprint, tc.sprint);

  paths.update(dt);
  if (view === 'ego') {
    player.update(dt, move, look, sprint);
    renderer.render(scene, camera);
  } else {
    renderer.render(scene, topView.camera);
  }
  hud.tick(dt);
});
