import * as THREE from 'three';
import './style.css';
import config from './config.js';
import layout from './layout.json';
import { buildRoom } from './scene/room.js';
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
scene.background = new THREE.Color(0xa9c3d6);

const camera = new THREE.PerspectiveCamera(config.grafik.fov, window.innerWidth / window.innerHeight, 0.05, 120);

// Grundlicht (Etappe 3 ersetzt das durch Licht je Zone aus layout.json)
scene.add(new THREE.HemisphereLight(0xfff4e8, 0x5a524a, 2.4));
const sun = new THREE.DirectionalLight(0xfff8f0, 1.0);
sun.position.set(3, 8, 5);
scene.add(sun);
for (const [x, z] of [[3, 4], [9, 4], [3, 10], [9, 10]]) {
  const l = new THREE.PointLight(0xffd2a0, 8, 9, 1.2);
  l.position.set(x, 3.0, -z);
  scene.add(l);
}

// Raum
const room = buildRoom(layout);
scene.add(room.group);
const collider = new Collider(room.colliders);
const player = new Player(camera, collider, layout.start);

// Eingabe
const hud = new HUD(app);
const bus = new ActionBus();
const gamepad = new GamepadInput(bus);
gamepad.onStatus = (c) => hud.setPad(c);
const keyboard = new KeyboardMouseInput(bus, renderer.domElement);
const touch = new TouchInput(bus, app);

// Funktionen, die erst in späteren Etappen kommen, melden sich mit einem Hinweis.
bus.on('*', (name) => {
  const a = ACTIONS[name];
  if (a) hud.toast(`${a.label} – folgt in Etappe ${a.etappe}`);
});

setupPWA((t) => hud.toast(t, 4000));

// Größe
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

// iOS: Zoom-Gesten und Kontextmenüs unterdrücken
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Hauptschleife
const timer = new THREE.Timer();
renderer.setAnimationLoop(() => {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.1);

  const gp = gamepad.poll();
  const kb = keyboard.poll();
  const tc = touch.poll();

  // Controller aktiv → Touch-Oberfläche ausblenden (erscheint bei Berührung wieder)
  if (gp.active && !touch.ui.hidden) touch.show(false);

  const move = [gp.move[0] + kb.move[0] + tc.move[0], gp.move[1] + kb.move[1] + tc.move[1]];
  const g = config.gamepad.blickGeschwindigkeit * dt;
  const look = [gp.look[0] * g + kb.lookRad[0] + tc.lookRad[0], gp.look[1] * g + kb.lookRad[1] + tc.lookRad[1]];
  const sprint = Math.max(gp.sprint, kb.sprint, tc.sprint);

  player.update(dt, move, look, sprint);
  renderer.render(scene, camera);
  hud.tick(dt);
});
