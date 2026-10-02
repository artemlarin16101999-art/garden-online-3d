const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// ============ HTML (встроен) ============
const HTML_PAGE = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Garden Online</title>
<style>
body { margin:0; overflow:hidden; background:#87CEEB; font-family:Arial,sans-serif; touch-action:none; user-select:none; }
#ui { position:fixed; top:10px; left:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:15px; z-index:10; pointer-events:none; }
#status { position:fixed; top:10px; right:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:13px; z-index:10; pointer-events:none; }
#count { position:fixed; top:30px; right:10px; color:#fff; text-shadow:2px 2px 4px #000; font-size:13px; z-index:10; pointer-events:none; }
#msg { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); color:#fff; font-size:22px; text-shadow:2px 2px 6px #000; z-index:20; pointer-events:none; transition:opacity .3s; opacity:0; }
.btn { position:fixed; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:26px; font-weight:bold; z-index:10; cursor:pointer; text-shadow:1px 1px 3px #000; border:3px solid #fff; }
#btn-action { right:30px; bottom:180px; width:90px; height:90px; background:rgba(80,190,90,.85); }
#btn-shop { right:30px; bottom:290px; width:70px; height:70px; background:rgba(200,100,200,.85); font-size:22px; }
#btn-camera { right:30px; bottom:380px; width:70px; height:70px; background:rgba(100,150,220,.85); font-size:22px; }
#shop { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(20,20,40,.95); border:3px solid #fff; border-radius:16px; padding:20px; color:#fff; z-index:30; width:300px; display:none; font-size:16px; }
#shop h2 { margin:0 0 12px; text-align:center; }
#shop .row { display:flex; justify-content:space-between; align-items:center; margin:10px 0; }
#shop button { background:#4caf50; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-size:16px; cursor:pointer; }
</style>
</head>
<body>
<div id="ui">💰 <span id="money">50</span><br>🌱 <span id="seeds">20</span><br>ID: <span id="myid">-</span></div>
<div id="status">Connecting...</div>
<div id="count">Online: 0</div>
<div id="msg"></div>
<div id="btn-action" class="btn">🌱</div>
<div id="btn-shop" class="btn">$</div>
<div id="btn-camera" class="btn">🎥</div>
<div id="shop">
<h2>🛒 Магазин</h2>
<div class="row"><span>💰 Монеты:</span><span id="shop-money">0</span></div>
<div class="row"><span>🌱 Семена:</span><span id="shop-seeds">0</span></div>
<hr style="border-color:rgba(255,255,255,.2);">
<div class="row"><span>1 семечко — 10</span><button id="buy-seed-1">Купить</button></div>
<div class="row"><span>5 семян — 50</span><button id="buy-seed-5">Купить</button></div>
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
scene.fog = new THREE.Fog(0x87CEEB, 40, 120);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 20, 25);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(30, 50, 20);
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x7EC850 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const grid = new THREE.GridHelper(200, 40, 0x5a9e3a, 0x5a9e3a);
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
for (let i = 0; i < 50; i++) {
  const t = createTree();
  t.position.set((Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180);
  scene.add(t);
}

const plotMeshes = {};
const plotColors = { carrot: 0xFF8C00, tomato: 0xFF4040, corn: 0xFFD700, pumpkin: 0xFF6600 };

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
  if (data.crop) {
    const h = data.ready ? 2.5 : 1.2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h, 6), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
    stem.position.y = 0.5 + h / 2; g.add(stem);
    if (data.ready) {
      const crop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshLambertMaterial({ color: plotColors[data.crop] || 0xFF0000 }));
      crop.position.y = 0.5 + h + 0.3; g.add(crop);
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

const myPlayer = { x: 0, z: 0, ry: 0, mesh: null };
const otherPlayers = {};
const myStats = { money: 50, seeds: 20 };
let cameraMode = 'third';

const joy = { active: false, id: null, bx: 100, by: window.innerHeight - 150, br: 70, sx: 100, sy: window.innerHeight - 150, sr: 30, dx: 0, dy: 0 };

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
drawJoystick();

let ws = null;
let sendTimer = 0;
const SEND_INTERVAL = 0.05;

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
      document.getElementById('myid').textContent = myId;
      myPlayer.mesh = createPlayer(myColor, true);
      scene.add(myPlayer.mesh);
      myStats.money = msg.player.money; myStats.seeds = msg.player.seeds; updateUI();
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
      myStats.money = msg.money; myStats.seeds = msg.seeds; updateUI();
      if (msg.message) showMessage(msg.message);
      if (shopOpen) {
        document.getElementById('shop-money').textContent = myStats.money;
        document.getElementById('shop-seeds').textContent = myStats.seeds;
      }
    } else if (msg.type === 'message') { showMessage(msg.text); }
  };
}

function addOtherPlayer(data) {
  const mesh = createPlayer(data.color, false);
  mesh.position.set(data.x, 0, data.z);
  scene.add(mesh);
  otherPlayers[data.id] = { mesh, x: data.x, z: data.z, targetX: data.x, targetZ: data.z, ry: 0 };
}

let shopOpen = false, messageTimer = 0, messageText = '';
function updateUI() {
  document.getElementById('money').textContent = myStats.money;
  document.getElementById('seeds').textContent = myStats.seeds;
}
function showMessage(t) { messageText = t; messageTimer = 120; }
function toggleShop() {
  shopOpen = !shopOpen;
  document.getElementById('shop').style.display = shopOpen ? 'block' : 'none';
  document.getElementById('shop-money').textContent = myStats.money;
  document.getElementById('shop-seeds').textContent = myStats.seeds;
}
function sendAction() { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'action' })); }

document.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  if (Math.hypot(t.clientX - joy.bx, t.clientY - joy.by) < joy.br + 40) {
    joy.active = true; joy.id = t.identifier; joy.sx = t.clientX; joy.sy = t.clientY; return;
  }
  const hits = ['btn-action', 'btn-shop', 'btn-camera'];
  for (const id of hits) {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
      if (id === 'btn-action') sendAction();
      if (id === 'btn-shop') toggleShop();
      if (id === 'btn-camera') cameraMode = (cameraMode === 'third') ? 'first' : 'third';
      return;
    }
  }
  if (shopOpen) {
    const b1 = document.getElementById('buy-seed-1').getBoundingClientRect();
    if (t.clientX >= b1.left && t.clientX <= b1.right && t.clientY >= b1.top && t.clientY <= b1.bottom) {
      ws.send(JSON.stringify({ type: 'buy_seed' })); return;
    }
    const b5 = document.getElementById('buy-seed-5').getBoundingClientRect();
    if (t.clientX >= b5.left && t.clientX <= b5.right && t.clientY >= b5.top && t.clientY <= b5.bottom) {
      ws.send(JSON.stringify({ type: 'buy_bundle' })); return;
    }
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!joy.active) return;
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      let dx = t.clientX - joy.bx, dy = t.clientY - joy.by;
      const d = Math.hypot(dx, dy);
      if (d > joy.br) { dx = dx / d * joy.br; dy = dy / d * joy.br; }
      joy.sx = joy.bx + dx; joy.sy = joy.by + dy;
      joy.dx = dx / joy.br; joy.dy = dy / joy.br;
      drawJoystick();
    }
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joy.id) {
      joy.active = false; joy.id = null;
      joy.sx = joy.bx; joy.sy = joy.by; joy.dx = 0; joy.dy = 0;
      drawJoystick();
    }
  }
});

const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') sendAction();
  if (e.key === 'Enter') toggleShop();
  if (e.key.toLowerCase() === 'c') cameraMode = (cameraMode === 'third') ? 'first' : 'third';
});
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

connect();
const clock = new THREE.Clock();
let bobPhase = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  let moveX = 0, moveZ = 0;
  if (joy.active) { moveX = joy.dx; moveZ = joy.dy; }
  if (keys['w'] || keys['ц']) moveZ -= 1;
  if (keys['s'] || keys['ы']) moveZ += 1;
  if (keys['a'] || keys['ф']) moveX -= 1;
  if (keys['d'] || keys['в']) moveX += 1;
  const mLen = Math.hypot(moveX, moveZ);
  if (mLen > 0.1) {
    const nX = moveX / Math.max(1, mLen), nZ = moveZ / Math.max(1, mLen);
    const sp = 8;
    myPlayer.x += nX * sp * dt; myPlayer.z += nZ * sp * dt;
    myPlayer.x = Math.max(-50, Math.min(50, myPlayer.x));
    myPlayer.z = Math.max(-50, Math.min(50, myPlayer.z));
    myPlayer.ry = Math.atan2(nX, nZ);
    bobPhase += dt * 12;
  }
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
    p.x += (p.targetX - p.x) * 0.2;
    p.z += (p.targetZ - p.z) * 0.2;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.ry;
  }
  if (cameraMode === 'third') {
    const camDist = 10, camHeight = 8;
    const bx = myPlayer.x - Math.sin(myPlayer.ry) * camDist;
    const bz = myPlayer.z - Math.cos(myPlayer.ry) * camDist;
    camera.position.x += (bx - camera.position.x) * 0.15;
    camera.position.z += (bz - camera.position.z) * 0.15;
    camera.position.y += (camHeight - camera.position.y) * 0.15;
    camera.lookAt(myPlayer.x, 1.5, myPlayer.z);
  } else {
    const eyeH = 1.6, fwd = 0.3;
    const ex = myPlayer.x + Math.sin(myPlayer.ry) * fwd;
    const ez = myPlayer.z + Math.cos(myPlayer.ry) * fwd;
    const bob = (mLen > 0.1) ? Math.sin(bobPhase) * 0.08 : 0;
    camera.position.x += (ex - camera.position.x) * 0.5;
    camera.position.z += (ez - camera.position.z) * 0.5;
    camera.position.y += (eyeH + bob - camera.position.y) * 0.5;
    const lx = myPlayer.x + Math.sin(myPlayer.ry) * 5;
    const lz = myPlayer.z + Math.cos(myPlayer.ry) * 5;
    camera.lookAt(lx, eyeH + bob, lz);
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
});
</script>
</body>
</html>`;

// ============ СЕРВЕР ============
const httpServer = http.createServer((req, res) => {
    // Отдаём HTML на любой запрос
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_PAGE);
});

const wss = new WebSocket.Server({ server: httpServer });

const TICK_MS = 50;
const players = {};
let nextId = 1;
const COLORS = [0xFF8C42, 0xFFD700, 0x9FC5E8, 0x1a1a2e, 0x9B59B6, 0x2ECC71, 0xE74C3C];

const WORLD = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };

const ECONOMY = {
    startMoney: 50,
    startSeeds: 20,
    seedPrice: 10,
    bundlePrice: 50,
    bundleCount: 5,
    rewards: { carrot: 20, tomato: 30, corn: 50, pumpkin: 100 },
    growTimeMs: 8000,
    maxPlots: 8
};

const plots = [];
for (let i = 0; i < ECONOMY.maxPlots; i++) {
    plots.push({ id: i, x: -8 + i * 2.5, z: 0, crop: null, plantedAt: 0, ready: false, owner: null });
}

wss.on('connection', (ws) => {
    const id = nextId++;
    const color = COLORS[id % COLORS.length];

    players[id] = {
        id, x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10,
        ry: 0, color, name: 'Player' + id,
        money: ECONOMY.startMoney, seeds: ECONOMY.startSeeds
    };

    ws.send(JSON.stringify({
        type: 'init', id, color, player: players[id], players, plots, economy: ECONOMY
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
        else if (msg.type === 'buy_seed') {
            if (p.money >= ECONOMY.seedPrice) {
                p.money -= ECONOMY.seedPrice; p.seeds += 1;
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, message: 'Куплено 1 семечко' }));
            } else {
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, message: 'Мало монет' }));
            }
        }
        else if (msg.type === 'buy_bundle') {
            if (p.money >= ECONOMY.bundlePrice) {
                p.money -= ECONOMY.bundlePrice; p.seeds += ECONOMY.bundleCount;
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, message: 'Куплено ' + ECONOMY.bundleCount + ' семян' }));
            } else {
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, message: 'Мало монет' }));
            }
        }
    });

    ws.on('close', () => {
        delete players[id];
        broadcast({ type: 'leave', id });
        console.log('Player ' + id + ' disconnected. Total: ' + Object.keys(players).length);
    });
});

function handlePlotAction(player, ws) {
    let closest = null, closestDist = 4;
    for (const plot of plots) {
        const d = Math.hypot(player.x - plot.x, player.z - plot.z);
        if (d < closestDist) { closestDist = d; closest = plot; }
    }
    if (!closest) { ws.send(JSON.stringify({ type: 'message', text: 'Подойди к грядке' })); return; }

    if (closest.ready && closest.crop) {
        const reward = ECONOMY.rewards[closest.crop] || 10;
        player.money += reward;
        ws.send(JSON.stringify({ type: 'stats', money: player.money, seeds: player.seeds, message: 'Собрано! +' + reward }));
        closest.crop = null; closest.ready = false; closest.plantedAt = 0; closest.owner = null;
        broadcast({ type: 'plots', plots });
        return;
    }

    if (!closest.crop) {
        if (player.seeds <= 0) { ws.send(JSON.stringify({ type: 'message', text: 'Нет семян' })); return; }
        const kinds = ['carrot', 'tomato', 'corn', 'pumpkin'];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        closest.crop = kind; closest.plantedAt = Date.now(); closest.ready = false; closest.owner = player.id;
        player.seeds -= 1;
        ws.send(JSON.stringify({ type: 'stats', money: player.money, seeds: player.seeds, message: 'Посажено' }));
        broadcast({ type: 'plots', plots });
        return;
    }

    ws.send(JSON.stringify({ type: 'message', text: 'Растёт...' }));
}

setInterval(() => {
    let changed = false;
    const now = Date.now();
    for (const plot of plots) {
        if (plot.crop && !plot.ready && now - plot.plantedAt >= ECONOMY.growTimeMs) {
            plot.ready = true; changed = true;
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
