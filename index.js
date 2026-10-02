const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>Garden Online</title>
<style>
html, body { margin:0; padding:0; overflow:hidden; background:#87CEEB; font-family:Arial,sans-serif; touch-action:none; user-select:none; width:100%; height:100%; position:fixed; }
#ui { position:fixed; top:10px; left:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:14px; z-index:10; pointer-events:none; }
#status { position:fixed; top:10px; right:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:12px; z-index:10; pointer-events:none; }
#count { position:fixed; top:28px; right:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:12px; z-index:10; pointer-events:none; }
#hint { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:16px; text-shadow:2px 2px 6px #000; z-index:15; pointer-events:none; text-align:center; padding:12px 20px; background:rgba(0,0,0,0.5); border-radius:12px; }
#msg { position:fixed; top:25%; left:50%; transform:translateX(-50%); color:#fff; font-size:20px; text-shadow:2px 2px 6px #000; z-index:20; pointer-events:none; transition:opacity .3s; opacity:0; }
.btn { position:fixed; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:26px; font-weight:bold; z-index:20; cursor:pointer; text-shadow:1px 1px 3px #000; border:3px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3); }
.btn:active { transform:scale(0.92); }
#btn-action { right:20px; bottom:130px; width:86px; height:86px; background:rgba(80,190,90,0.9); }
#btn-camera { right:115px; bottom:130px; width:64px; height:64px; background:rgba(100,150,220,0.9); font-size:20px; }
#btn-shop { right:20px; bottom:230px; width:64px; height:64px; background:rgba(200,100,200,0.9); font-size:20px; }

/* МАГАЗИН — панель снизу */
#shop {
  position:fixed; left:0; right:0; bottom:0; max-height:60vh;
  background:rgba(15,15,30,0.97); border-top:3px solid #fff;
  color:#fff; z-index:30; display:none; flex-direction:column;
  border-radius:16px 16px 0 0;
}
#shop-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:2px solid rgba(255,255,255,0.2); }
#shop-header h2 { margin:0; font-size:18px; }
#shop-close { background:#c0392b; color:#fff; border:none; border-radius:8px; padding:6px 14px; font-size:16px; cursor:pointer; }
#shop-money-bar { padding:8px 16px; font-size:14px; display:flex; gap:20px; background:rgba(0,0,0,0.3); }
#shop-list { overflow-y:auto; padding:8px 12px 20px; display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.shop-item { background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.2); border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:4px; cursor:pointer; }
.shop-item:active { background:rgba(255,255,255,0.2); }
.shop-item .name { font-size:13px; font-weight:bold; }
.shop-item .cost { font-size:11px; color:#ffd700; }
.shop-item .gain { font-size:11px; color:#7fff7f; }
.shop-item .time { font-size:11px; color:#aaa; }
.shop-item.locked { opacity:0.5; }

#inv-btn { position:fixed; right:20px; bottom:310px; width:64px; height:64px; background:rgba(240,180,60,0.9); font-size:20px; }
#inv {
  position:fixed; left:0; right:0; bottom:0; max-height:50vh;
  background:rgba(15,15,30,0.97); border-top:3px solid #fff;
  color:#fff; z-index:29; display:none; flex-direction:column;
  border-radius:16px 16px 0 0;
}
#inv-list { overflow-y:auto; padding:8px 12px 20px; display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.inv-item { background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.2); border-radius:10px; padding:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; }
.inv-item.selected { border-color:#7fff7f; background:rgba(100,255,100,0.15); }
</style>
</head>
<body>
<div id="ui">💰 <span id="money">50</span> · 🌱 <span id="seeds">20</span><br>ID: <span id="myid">-</span> · В руке: <span id="held">-</span></div>
<div id="status">Connecting...</div>
<div id="count">Online: 0</div>
<div id="hint">🖱 Кликни для захвата мыши<br>WASD + мышь · Esc отпустить</div>
<div id="msg"></div>

<div id="btn-action" class="btn">🌱</div>
<div id="btn-camera" class="btn">🎥</div>
<div id="btn-shop" class="btn">$</div>
<div id="inv-btn" class="btn">🎒</div>

<div id="shop">
  <div id="shop-header">
    <h2>🛒 Магазин семян</h2>
    <button id="shop-close">✕</button>
  </div>
  <div id="shop-money-bar">💰 <span id="shop-money">0</span> · 🌱 В сумке: <span id="shop-seeds">0</span></div>
  <div id="shop-list"></div>
</div>

<div id="inv">
  <div id="shop-header">
    <h2>🎒 Инвентарь</h2>
    <button id="inv-close">✕</button>
  </div>
  <div id="inv-list"></div>
</div>

<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" } }
</script>
<script type="module">
import * as THREE from 'three';
const proto = location.protocol === 'https:' ? 'wss' : 'ws';
const SERVER_URL = proto + '://' + location.host;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 60, 180);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 20, 25);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(30, 50, 20);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x7EC850 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const grid = new THREE.GridHelper(400, 80, 0x5a9e3a, 0x5a9e3a);
grid.position.y = 0.01;
scene.add(grid);

function createTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4, 8), new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
  trunk.position.y = 2; g.add(trunk);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshLambertMaterial({ color: 0x2E8B57 }));
  leaf.position.y = 5; g.add(leaf);
  return g;
}
for (let i = 0; i < 80; i++) {
  const t = createTree();
  t.position.set((Math.random() - 0.5) * 350, 0, (Math.random() - 0.5) * 350);
  scene.add(t);
}

const plotMeshes = {};
let CROPS = {};

function updatePlotMesh(data) {
  let g = plotMeshes[data.id];
  if (!g) {
    g = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    soil.position.y = 0.25; g.add(soil);
    g.position.set(data.x, 0, data.z);
    scene.add(g);
    plotMeshes[data.id] = g;
  }
  while (g.children.length > 1) g.remove(g.children[g.children.length - 1]);
  if (data.crop && CROPS[data.crop]) {
    const crop = CROPS[data.crop];
    const h = data.ready ? 2.5 : 1.2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h, 6), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
    stem.position.y = 0.5 + h / 2; g.add(stem);
    if (data.ready) {
      const colorHex = parseInt(crop.color.replace('#', '0x'));
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshLambertMaterial({ color: colorHex }));
      fruit.position.y = 0.5 + h + 0.3; g.add(fruit);
    }
  }
}

let myId = null, myColor = 0xFF8C42;
function createPlayer(color, isMe) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 1; g.add(body);
  const earMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
  const earGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const earL = new THREE.Mesh(earGeo, earMat); earL.position.set(-0.5, 2, 0); g.add(earL);
  const earR = new THREE.Mesh(earGeo, earMat); earR.position.set(0.5, 2, 0); g.add(earR);
  const eyeGeo = new THREE.SphereGeometry(0.13, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.3, 1.3, 0.85); g.add(eL);
  const eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.3, 1.3, 0.85); g.add(eR);
  if (isMe) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 24), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
  }
  return g;
}

const myPlayer = { x: 0, z: 0, ry: 0, vx: 0, vz: 0, mesh: null };
const otherPlayers = {};
const myStats = { money: 50, seeds: 0, inventory: {}, held: null, unlocked: [] };
let cameraMode = 'first';

// === МЫШЬ ===
const canvas = renderer.domElement;
let mouseLocked = false;
canvas.addEventListener('click', () => { if (!mouseLocked && !shopOpen && !invOpen) canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  mouseLocked = document.pointerLockElement === canvas;
  document.getElementById('hint').style.display = mouseLocked ? 'none' : 'block';
});
document.addEventListener('mousemove', (e) => {
  if (!mouseLocked) return;
  myPlayer.ry -= e.movementX * 0.0025;
});

// === ДЖОЙСТИК ===
const joy = { active: false, id: null, bx: 110, by: 0, br: 70, sx: 110, sy: 0, sr: 30, dx: 0, dy: 0 };
function updateJoyPositions() { joy.bx = 110; joy.by = window.innerHeight - 110; joy.sx = joy.bx; joy.sy = joy.by; }
function drawJoystick() {
  let svg = document.getElementById('joy-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'joy-svg';
    svg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5';
    document.body.appendChild(svg);
  }
  svg.innerHTML = '<circle cx="' + joy.bx + '" cy="' + joy.by + '" r="' + joy.br + '" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" stroke-width="3"/><circle cx="' + joy.sx + '" cy="' + joy.sy + '" r="' + joy.sr + '" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.9)" stroke-width="3"/>';
}
updateJoyPositions(); drawJoystick();
window.addEventListener('resize', () => { updateJoyPositions(); drawJoystick(); });

function pointInRect(x, y, r) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

function handleDown(x, y, id) {
  if (shopOpen || invOpen) {
    // Разрешаем клики по кнопкам закрытия и по списку
    const closeS = document.getElementById('shop-close').getBoundingClientRect();
    if (pointInRect(x, y, closeS)) { toggleShop(); return; }
    const closeI = document.getElementById('inv-close').getBoundingClientRect();
    if (pointInRect(x, y, closeI)) { toggleInv(); return; }
    // Клик по элементу магазина
    const shopEls = document.querySelectorAll('.shop-item');
    for (const el of shopEls) {
      const r = el.getBoundingClientRect();
      if (pointInRect(x, y, r)) {
        const key = el.dataset.key;
        ws.send(JSON.stringify({ type: 'buy', crop: key }));
        return;
      }
    }
    // Клик по элементу инвентаря
    const invEls = document.querySelectorAll('.inv-item');
    for (const el of invEls) {
      const r = el.getBoundingClientRect();
      if (pointInRect(x, y, r)) {
        const key = el.dataset.key;
        ws.send(JSON.stringify({ type: 'select', crop: key }));
        return;
      }
    }
    return;
  }

  if (Math.hypot(x - joy.bx, y - joy.by) < joy.br + 40) {
    joy.active = true; joy.id = id; joy.sx = x; joy.sy = y;
    drawJoystick(); return;
  }
  const btns = ['btn-action', 'btn-camera', 'btn-shop', 'inv-btn'];
  for (const bid of btns) {
    const el = document.getElementById(bid);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (pointInRect(x, y, r)) {
      if (bid === 'btn-action') sendAction();
      if (bid === 'btn-shop') toggleShop();
      if (bid === 'btn-camera') cameraMode = (cameraMode === 'third') ? 'first' : 'third';
      if (bid === 'inv-btn') toggleInv();
      return;
    }
  }
}
function handleMove(x, y, id) {
  if (!joy.active || joy.id !== id) return;
  let dx = x - joy.bx, dy = y - joy.by;
  const d = Math.hypot(dx, dy);
  if (d > joy.br) { dx = dx / d * joy.br; dy = dy / d * joy.br; }
  joy.sx = joy.bx + dx; joy.sy = joy.by + dy;
  joy.dx = dx / joy.br; joy.dy = dy / joy.br;
  drawJoystick();
}
function handleUp(id) {
  if (joy.active && joy.id === id) {
    joy.active = false; joy.id = null;
    joy.sx = joy.bx; joy.sy = joy.by; joy.dx = 0; joy.dy = 0;
    drawJoystick();
  }
}
document.addEventListener('touchstart', (e) => { e.preventDefault(); for (const t of e.changedTouches) handleDown(t.clientX, t.clientY, t.identifier); }, { passive: false });
document.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) handleMove(t.clientX, t.clientY, t.identifier); }, { passive: false });
document.addEventListener('touchend', (e) => { e.preventDefault(); for (const t of e.changedTouches) handleUp(t.identifier); }, { passive: false });
document.addEventListener('mousedown', (e) => { if (!mouseLocked) handleDown(e.clientX, e.clientY, 'mouse'); });
document.addEventListener('mousemove', (e) => { if (joy.active && !mouseLocked) handleMove(e.clientX, e.clientY, 'mouse'); });
document.addEventListener('mouseup', () => { handleUp('mouse'); });

const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') sendAction();
  if (e.key === 'Tab') { e.preventDefault(); toggleShop(); }
  if (e.key.toLowerCase() === 'i') toggleInv();
  if (e.key.toLowerCase() === 'c') cameraMode = (cameraMode === 'third') ? 'first' : 'third';
});
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

let ws = null;
let sendTimer = 0;
const SEND_INTERVAL = 0.05;
let shopOpen = false, invOpen = false, messageTimer = 0, messageText = '';

function connect() {
  ws = new WebSocket(SERVER_URL);
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('count');
  ws.onopen = () => { statusEl.textContent = 'Online'; statusEl.style.color = '#4f4'; };
  ws.onclose = () => { statusEl.textContent = 'Reconnecting...'; statusEl.style.color = '#f44'; setTimeout(connect, 2000); };
  ws.onerror = () => { statusEl.textContent = 'Error'; statusEl.style.color = '#f44'; };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'init') {
      myId = msg.id; myColor = msg.color;
      CROPS = msg.crops;
      document.getElementById('myid').textContent = myId;
      myPlayer.mesh = createPlayer(myColor, true);
      scene.add(myPlayer.mesh);
      myStats.money = msg.player.money;
      myStats.seeds = msg.player.seeds;
      myStats.inventory = msg.player.inventory || {};
      myStats.held = msg.player.held || null;
      myStats.unlocked = msg.player.unlocked || [];
      updateUI(); renderShop(); renderInv();
      let count = 0;
      for (const id in msg.players) { if (parseInt(id) === myId) continue; addOtherPlayer(msg.players[id]); count++; }
      countEl.textContent = 'Online: ' + (count + 1);
      for (const plot of msg.plots) updatePlotMesh(plot);
    } else if (msg.type === 'join') {
      if (msg.player.id !== myId) { addOtherPlayer(msg.player); countEl.textContent = 'Online: ' + (Object.keys(otherPlayers).length + 1); }
    } else if (msg.type === 'leave') {
      if (otherPlayers[msg.id]) { scene.remove(otherPlayers[msg.id].mesh); delete otherPlayers[msg.id]; countEl.textContent = 'Online: ' + (Object.keys(otherPlayers).length + 1); }
    } else if (msg.type === 'state') {
      for (const id in msg.players) {
        const data = msg.players[id];
        if (parseInt(id) === myId) continue;
        if (!otherPlayers[id]) addOtherPlayer(data);
        otherPlayers[id].targetX = data.x; otherPlayers[id].targetZ = data.z; otherPlayers[id].ry = data.ry;
      }
    } else if (msg.type === 'plots') {
      for (const plot of msg.plots) updatePlotMesh(plot);
    } else if (msg.type === 'stats') {
      myStats.money = msg.money;
      myStats.seeds = msg.seeds;
      if (msg.inventory) myStats.inventory = msg.inventory;
      if (msg.held !== undefined) myStats.held = msg.held;
      if (msg.unlocked) myStats.unlocked = msg.unlocked;
      updateUI(); renderShop(); renderInv();
      if (msg.message) showMessage(msg.message);
    } else if (msg.type === 'message') { showMessage(msg.text); }
  };
}

function addOtherPlayer(data) {
  const mesh = createPlayer(data.color, false);
  mesh.position.set(data.x, 0, data.z);
  scene.add(mesh);
  otherPlayers[data.id] = { mesh, x: data.x, z: data.z, targetX: data.x, targetZ: data.z, ry: 0 };
}

function updateUI() {
  document.getElementById('money').textContent = myStats.money;
  document.getElementById('seeds').textContent = myStats.seeds;
  document.getElementById('held').textContent = myStats.held && CROPS[myStats.held] ? CROPS[myStats.held].name : '—';
  document.getElementById('shop-money').textContent = myStats.money;
  document.getElementById('shop-seeds').textContent = myStats.seeds;
}
function showMessage(t) { messageText = t; messageTimer = 150; }
function toggleShop() { shopOpen = !shopOpen; if (shopOpen) invOpen = false; document.getElementById('shop').style.display = shopOpen ? 'flex' : 'none'; document.getElementById('inv').style.display = invOpen ? 'flex' : 'none'; if (mouseLocked) document.exitPointerLock(); renderShop(); }
function toggleInv() { invOpen = !invOpen; if (invOpen) shopOpen = false; document.getElementById('inv').style.display = invOpen ? 'flex' : 'none'; document.getElementById('shop').style.display = shopOpen ? 'flex' : 'none'; if (mouseLocked) document.exitPointerLock(); renderInv(); }
function sendAction() { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'action' })); }

function renderShop() {
  const list = document.getElementById('shop-list');
  if (!list) return;
  list.innerHTML = '';
  const keys = Object.keys(CROPS).sort((a,b) => CROPS[a].price - CROPS[b].price);
  for (const key of keys) {
    const c = CROPS[key];
    const affordable = myStats.money >= c.price;
    const div = document.createElement('div');
    div.className = 'shop-item' + (affordable ? '' : ' locked');
    div.dataset.key = key;
    div.innerHTML = '<div class="name">' + c.name + '</div>' +
                    '<div class="cost">💰 ' + c.price + '</div>' +
                    '<div class="gain">+ ' + c.reward + ' за урожай</div>' +
                    '<div class="time">⏱ ' + (c.growMs/1000).toFixed(0) + 'с</div>';
    list.appendChild(div);
  }
}
function renderInv() {
  const list = document.getElementById('inv-list');
  if (!list) return;
  list.innerHTML = '';
  const inv = myStats.inventory || {};
  const keys = Object.keys(inv).filter(k => inv[k] > 0);
  if (keys.length === 0) {
    list.innerHTML = '<div style="grid-column:1/3;text-align:center;padding:20px;color:#aaa;">Пусто. Купи семена в магазине.</div>';
    return;
  }
  for (const key of keys) {
    const c = CROPS[key]; if (!c) continue;
    const div = document.createElement('div');
    div.className = 'inv-item' + (myStats.held === key ? ' selected' : '');
    div.dataset.key = key;
    div.innerHTML = '<span>' + c.name + '</span><span>× ' + inv[key] + '</span>';
    list.appendChild(div);
  }
}

connect();
const clock = new THREE.Clock();
let bobPhase = 0;
const MAX_SPEED = 8, ACCEL = 25, DECEL = 18, SMOOTH_CAM = 0.12;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  let inputX = 0, inputZ = 0;
  if (joy.active) { inputX = joy.dx; inputZ = joy.dy; }
  if (keys['w'] || keys['ц'] || keys['arrowup']) inputZ -= 1;
  if (keys['s'] || keys['ы'] || keys['arrowdown']) inputZ += 1;
  if (keys['a'] || keys['ф'] || keys['arrowleft']) inputX -= 1;
  if (keys['d'] || keys['в'] || keys['arrowright']) inputX += 1;
  const inLen = Math.hypot(inputX, inputZ);
  if (inLen > 1) { inputX /= inLen; inputZ /= inLen; }

  const sinY = Math.sin(myPlayer.ry), cosY = Math.cos(myPlayer.ry);
  const worldMoveX = (inputZ * sinY) + (inputX * cosY);
  const worldMoveZ = (inputZ * cosY) - (inputX * sinY);
  const targetVX = worldMoveX * MAX_SPEED;
  const targetVZ = worldMoveZ * MAX_SPEED;
  const dvx = targetVX - myPlayer.vx, dvz = targetVZ - myPlayer.vz;
  const dvLen = Math.hypot(dvx, dvz);
  if (inLen > 0.1) {
    const step = Math.min(ACCEL * dt, dvLen);
    if (dvLen > 0.001) { myPlayer.vx += (dvx/dvLen)*step; myPlayer.vz += (dvz/dvLen)*step; }
  } else {
    const step = Math.min(DECEL * dt, dvLen);
    if (dvLen > 0.001) { myPlayer.vx -= (dvx/dvLen)*step; myPlayer.vz -= (dvz/dvLen)*step; }
    else { myPlayer.vx = 0; myPlayer.vz = 0; }
  }
  myPlayer.x += myPlayer.vx * dt;
  myPlayer.z += myPlayer.vz * dt;
  myPlayer.x = Math.max(-50, Math.min(50, myPlayer.x));
  myPlayer.z = Math.max(-50, Math.min(50, myPlayer.z));
  const speedNow = Math.hypot(myPlayer.vx, myPlayer.vz);
  if (speedNow > 0.5) bobPhase += dt * 12;

  if (myPlayer.mesh) {
    myPlayer.mesh.position.set(myPlayer.x, 0, myPlayer.z);
    myPlayer.mesh.rotation.y = myPlayer.ry;
    myPlayer.mesh.visible = (cameraMode === 'third');
  }

  sendTimer += dt;
  if (sendTimer >= SEND_INTERVAL && ws && ws.readyState === WebSocket.OPEN) {
    sendTimer = 0;
    ws.send(JSON.stringify({ type: 'move', x: myPlayer.x, z: myPlayer.z, ry: myPlayer.ry }));
  }

  for (const id in otherPlayers) {
    const p = otherPlayers[id];
    p.x += (p.targetX - p.x) * 0.15;
    p.z += (p.targetZ - p.z) * 0.15;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.ry;
  }

  if (cameraMode === 'first') {
    const eyeH = 1.6;
    const bob = (speedNow > 0.5) ? Math.sin(bobPhase) * 0.06 : 0;
    camera.position.x += (myPlayer.x - camera.position.x) * 0.5;
    camera.position.z += (myPlayer.z - camera.position.z) * 0.5;
    camera.position.y += (eyeH + bob - camera.position.y) * 0.5;
    const lx = myPlayer.x + Math.sin(myPlayer.ry) * 5;
    const lz = myPlayer.z + Math.cos(myPlayer.ry) * 5;
    camera.lookAt(lx, eyeH + bob, lz);
  } else {
    const camDist = 8, camHeight = 5;
    const bx = myPlayer.x - Math.sin(myPlayer.ry) * camDist;
    const bz = myPlayer.z - Math.cos(myPlayer.ry) * camDist;
    camera.position.x += (bx - camera.position.x) * SMOOTH_CAM;
    camera.position.z += (bz - camera.position.z) * SMOOTH_CAM;
    camera.position.y += (camHeight - camera.position.y) * SMOOTH_CAM;
    camera.lookAt(myPlayer.x, 1.5, myPlayer.z);
  }

  if (messageTimer > 0) {
    messageTimer--;
    const m = document.getElementById('msg');
    m.textContent = messageText;
    m.style.opacity = Math.min(1, messageTimer / 30);
  } else {
    document.getElementById('msg').style.opacity = 0;
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateJoyPositions();
  drawJoystick();
});
</script>
</body>
</html>`;

// ============ СЕРВЕР ============
const CROPS = {
    turnip:    { name: 'Репа',           price: 5,   reward: 8,    growMs: 4000,  color: '#f0e0a0' },
    carrot:    { name: 'Морковь',        price: 10,  reward: 18,   growMs: 6000,  color: '#ff8c00' },
    cucumber:  { name: 'Огурец',         price: 14,  reward: 24,   growMs: 7000,  color: '#3a7d44' },
    tomato:    { name: 'Помидор',        price: 18,  reward: 32,   growMs: 8000,  color: '#ff4040' },
    onion:     { name: 'Лук',            price: 22,  reward: 40,   growMs: 9000,  color: '#d4a574' },
    potato:    { name: 'Картофель',      price: 28,  reward: 52,   growMs: 11000, color: '#c9a06a' },
    beet:      { name: 'Свёкла',         price: 35,  reward: 65,   growMs: 12000, color: '#8b1a4a' },
    cabbage:   { name: 'Капуста',        price: 45,  reward: 85,   growMs: 14000, color: '#a8d878' },
    pumpkin:   { name: 'Тыква',          price: 60,  reward: 115,  growMs: 16000, color: '#ff6600' },
    corn:      { name: 'Кукуруза',       price: 80,  reward: 155,  growMs: 18000, color: '#ffd700' },
    pepper:    { name: 'Перец',          price: 105, reward: 210,  growMs: 20000, color: '#e63232' },
    eggplant:  { name: 'Баклажан',       price: 135, reward: 270,  growMs: 22000, color: '#5b2a86' },
    watermelon:{ name: 'Арбуз',          price: 170, reward: 350,  growMs: 25000, color: '#2e8b57' },
    melon:     { name: 'Дыня',           price: 215, reward: 445,  growMs: 27000, color: '#ffd88a' },
    pineapple: { name: 'Ананас',         price: 270, reward: 570,  growMs: 30000, color: '#e8b93b' },
    strawberry:{ name: 'Клубника',       price: 340, reward: 720,  growMs: 33000, color: '#e33b5a' },
    grapes:    { name: 'Виноград',       price: 430, reward: 920,  growMs: 36000, color: '#6b2d8b' },
    pomegranate:{name: 'Гранат',         price: 540, reward: 1180, growMs: 40000, color: '#c0392b' },
    mango:     { name: 'Манго',          price: 680, reward: 1500, growMs: 45000, color: '#ffb347' },
    goldenapple:{name: 'Золотое яблоко', price: 900, reward: 2100, growMs: 55000, color: '#ffd700' }
};

const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_PAGE);
});

const wss = new WebSocket.Server({ server: httpServer });
const TICK_MS = 50;
const players = {};
const plots = [];
let nextId = 1;
let nextPlotId = 0;
const COLORS = [0xFF8C42, 0xFFD700, 0x9FC5E8, 0x1a1a2e, 0x9B59B6, 0x2ECC71, 0xE74C3C];
const WORLD = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
const PLOTS_PER_PLAYER = 4;
const START_MONEY = 50;

function createGardenForPlayer(playerId) {
    let ox, oz, tries = 0;
    do {
        ox = (Math.random() - 0.5) * 80;
        oz = (Math.random() - 0.5) * 80;
        tries++;
    } while (tries < 30 && plots.some(p => Math.hypot(p.x - ox, p.z - oz) < 8));

    const created = [];
    for (let i = 0; i < PLOTS_PER_PLAYER; i++) {
        const plot = { id: nextPlotId++, x: ox + i * 2.5, z: oz, crop: null, plantedAt: 0, ready: false, owner: playerId };
        plots.push(plot); created.push(plot);
    }
    return created;
}
function removePlotsOfPlayer(playerId) {
    for (let i = plots.length - 1; i >= 0; i--) if (plots[i].owner === playerId) plots.splice(i, 1);
}

wss.on('connection', (ws) => {
    const id = nextId++;
    const color = COLORS[id % COLORS.length];
    const garden = createGardenForPlayer(id);
    const spawnX = garden[0].x;
    const spawnZ = garden[0].z + 4;

    players[id] = {
        id, x: spawnX, z: spawnZ, ry: 0, color, name: 'Player' + id,
        money: START_MONEY, seeds: 0,
        inventory: {},  // { cropKey: count }
        held: null,     // выбранное семя
        unlocked: []    // для будущего
    };

    ws.send(JSON.stringify({
        type: 'init', id, color, player: players[id], players, plots, crops: CROPS
    }));

    broadcast({ type: 'join', player: players[id] }, ws);
    console.log('Player ' + id + ' connected. Total: ' + Object.keys(players).length);

    ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch (e) { return; }
        const p = players[id];
        if (!p) return;

        if (msg.type === 'move') {
            const dx = msg.x - p.x, dz = msg.z - p.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 2) { const k = 2 / dist; p.x += dx * k; p.z += dz * k; }
            else { p.x = msg.x; p.z = msg.z; }
            p.ry = msg.ry || 0;
            p.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, p.x));
            p.z = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, p.z));
        }
        else if (msg.type === 'action') { handlePlotAction(p, ws); }
        else if (msg.type === 'buy') {
            const crop = CROPS[msg.crop];
            if (!crop) return;
            if (p.money >= crop.price) {
                p.money -= crop.price;
                p.inventory[msg.crop] = (p.inventory[msg.crop] || 0) + 1;
                // автоматически выбираем купленное
                p.held = msg.crop;
                // пересчитываем суммарные семена
                p.seeds = Object.values(p.inventory).reduce((a,b) => a+b, 0);
                ws.send(JSON.stringify({
                    type: 'stats', money: p.money, seeds: p.seeds,
                    inventory: p.inventory, held: p.held,
                    message: 'Куплено: ' + crop.name
                }));
            } else {
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, inventory: p.inventory, held: p.held, message: 'Мало монет' }));
            }
        }
        else if (msg.type === 'select') {
            if (p.inventory[msg.crop] > 0) {
                p.held = msg.crop;
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, inventory: p.inventory, held: p.held, message: 'Выбрано: ' + CROPS[msg.crop].name }));
            }
        }
    });

    ws.on('close', () => {
        removePlotsOfPlayer(id);
        delete players[id];
        broadcast({ type: 'leave', id });
        broadcast({ type: 'plots', plots });
        console.log('Player ' + id + ' disconnected. Total: ' + Object.keys(players).length);
    });
});

function handlePlotAction(player, ws) {
    let closest = null, closestDist = 4;
    for (const plot of plots) {
        // только свои грядки
        if (plot.owner !== player.id) continue;
        const d = Math.hypot(player.x - plot.x, player.z - plot.z);
        if (d < closestDist) { closestDist = d; closest = plot; }
    }
    if (!closest) { ws.send(JSON.stringify({ type: 'message', text: 'Подойди к своей грядке' })); return; }

    if (closest.ready && closest.crop) {
        const crop = CROPS[closest.crop];
        const reward = crop ? crop.reward : 10;
        player.money += reward;
        closest.crop = null; closest.ready = false; closest.plantedAt = 0;
        ws.send(JSON.stringify({
            type: 'stats', money: player.money, seeds: player.seeds,
            inventory: player.inventory, held: player.held,
            message: 'Собрано: +' + reward + ' 💰'
        }));
        broadcast({ type: 'plots', plots });
        return;
    }

    if (!closest.crop) {
        if (!player.held || !player.inventory[player.held] || player.inventory[player.held] <= 0) {
            ws.send(JSON.stringify({ type: 'message', text: 'Выбери семечко в 🎒 инвентаре' }));
            return;
        }
        const cropKey = player.held;
        closest.crop = cropKey;
        closest.plantedAt = Date.now();
        closest.ready = false;
        player.inventory[cropKey] -= 1;
        if (player.inventory[cropKey] <= 0) delete player.inventory[cropKey];
        player.seeds = Object.values(player.inventory).reduce((a,b) => a+b, 0);
        ws.send(JSON.stringify({
            type: 'stats', money: player.money, seeds: player.seeds,
            inventory: player.inventory, held: player.held,
            message: 'Посажено: ' + CROPS[cropKey].name
        }));
        broadcast({ type: 'plots', plots });
        return;
    }
    ws.send(JSON.stringify({ type: 'message', text: 'Растёт...' }));
}

setInterval(() => {
    let changed = false;
    const now = Date.now();
    for (const plot of plots) {
        if (plot.crop && !plot.ready) {
            const crop = CROPS[plot.crop];
            if (crop && now - plot.plantedAt >= crop.growMs) {
                plot.ready = true; changed = true;
            }
        }
    }
    if (changed) broadcast({ type: 'plots', plots });
}, 1000);

function broadcast(msg, exclude) {
    const data = JSON.stringify(msg);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== exclude) client.send(data);
    });
}

setInterval(() => {
    const state = {};
    for (const id in players) {
        const p = players[id];
        state[id] = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), ry: +p.ry.toFixed(2), color: p.color, name: p.name };
    }
    broadcast({ type: 'state', players: state });
}, TICK_MS);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('Server started on port ' + PORT);
});
