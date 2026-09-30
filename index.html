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

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ color: 0x7EC850 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(200, 40, 0x5a9e3a, 0x5a9e3a);
grid.position.y = 0.01;
scene.add(grid);

function createTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.7, 4, 8),
        new THREE.MeshLambertMaterial({ color: 0x8B5A2B })
    );
    trunk.position.y = 2;
    g.add(trunk);
    const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x2E8B57 })
    );
    leaf.position.y = 5;
    g.add(leaf);
    return g;
}
for (let i = 0; i < 50; i++) {
    const t = createTree();
    t.position.set((Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180);
    scene.add(t);
}

let myId = null;
let myColor = 0xFF8C42;

function createPlayer(color, isMe = false) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 12),
        new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = 1;
    g.add(body);

    const earMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    const earGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.5, 2, 0);
    g.add(earL);
    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.5, 2, 0);
    g.add(earR);

    const eyeGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.3, 1.3, 0.85);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.3, 1.3, 0.85);
    g.add(eyeR);

    if (isMe) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.3, 1.6, 24),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        g.add(ring);
    }
    return g;
}

const myPlayer = { x: 0, z: 0, ry: 0, mesh: null };
const otherPlayers = {};

const joy = {
    active: false, id: null,
    bx: 100, by: window.innerHeight - 150, br: 70,
    sx: 100, sy: window.innerHeight - 150, sr: 30,
    dx: 0, dy: 0
};

function drawJoystick() {
    let svg = document.getElementById('joy-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'joy-svg';
        svg.style.position = 'fixed';
        svg.style.top = '0'; svg.style.left = '0';
        svg.style.width = '100%'; svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '5';
        document.body.appendChild(svg);
    }
    svg.innerHTML = `
        <circle cx="${joy.bx}" cy="${joy.by}" r="${joy.br}" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
        <circle cx="${joy.sx}" cy="${joy.sy}" r="${joy.sr}" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.9)" stroke-width="3"/>
    `;
}
drawJoystick();

document.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (Math.hypot(t.clientX - joy.bx, t.clientY - joy.by) < joy.br + 40) {
        joy.active = true;
        joy.id = t.identifier;
        joy.sx = t.clientX;
        joy.sy = t.clientY;
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!joy.active) return;
    for (const t of e.changedTouches) {
        if (t.identifier === joy.id) {
            let dx = t.clientX - joy.bx;
            let dy = t.clientY - joy.by;
            const d = Math.hypot(dx, dy);
            if (d > joy.br) { dx = dx / d * joy.br; dy = dy / d * joy.br; }
            joy.sx = joy.bx + dx;
            joy.sy = joy.by + dy;
            joy.dx = dx / joy.br;
            joy.dy = dy / joy.br;
            drawJoystick();
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
        if (t.identifier === joy.id) {
            joy.active = false;
            joy.id = null;
            joy.sx = joy.bx;
            joy.sy = joy.by;
            joy.dx = 0; joy.dy = 0;
            drawJoystick();
        }
    }
});

const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

let ws = null;
let sendTimer = 0;
const SEND_INTERVAL = 0.05;

function connect() {
    ws = new WebSocket(SERVER_URL);
    const statusEl = document.getElementById('status');
    const countEl = document.getElementById('count');

    ws.onopen = () => {
        statusEl.textContent = 'Online';
        statusEl.style.color = '#4f4';
    };

    ws.onclose = () => {
        statusEl.textContent = 'Reconnecting...';
        statusEl.style.color = '#f44';
        setTimeout(connect, 2000);
    };

    ws.onerror = () => {
        statusEl.textContent = 'Error';
        statusEl.style.color = '#f44';
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'init') {
            myId = msg.id;
            myColor = msg.color;
            document.getElementById('myid').textContent = myId;
            myPlayer.mesh = createPlayer(myColor, true);
            scene.add(myPlayer.mesh);

            let count = 0;
            for (const id in msg.players) {
                if (parseInt(id) === myId) continue;
                addOtherPlayer(msg.players[id]);
                count++;
            }
            countEl.textContent = 'Online: ' + (count + 1);
        }
        else if (msg.type === 'join') {
            if (msg.player.id !== myId) {
                addOtherPlayer(msg.player);
                countEl.textContent = 'Online: ' + (Object.keys(otherPlayers).length + 1);
            }
        }
        else if (msg.type === 'leave') {
            if (otherPlayers[msg.id]) {
                scene.remove(otherPlayers[msg.id].mesh);
                delete otherPlayers[msg.id];
                countEl.textContent = 'Online: ' + (Object.keys(otherPlayers).length + 1);
            }
        }
        else if (msg.type === 'state') {
            for (const id in msg.players) {
                const data = msg.players[id];
                if (parseInt(id) === myId) continue;
                if (!otherPlayers[id]) addOtherPlayer(data);
                otherPlayers[id].targetX = data.x;
                otherPlayers[id].targetZ = data.z;
                otherPlayers[id].ry = data.ry;
            }
        }
    };
}

function addOtherPlayer(data) {
    const mesh = createPlayer(data.color, false);
    mesh.position.set(data.x, 0, data.z);
    scene.add(mesh);
    otherPlayers[data.id] = {
        mesh,
        x: data.x, z: data.z,
        targetX: data.x, targetZ: data.z,
        ry: 0
    };
}

connect();

const clock = new THREE.Clock();

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
        const normX = moveX / Math.max(1, mLen);
        const normZ = moveZ / Math.max(1, mLen);
        const speed = 8;
        myPlayer.x += normX * speed * dt;
        myPlayer.z += normZ * speed * dt;
        myPlayer.x = Math.max(-50, Math.min(50, myPlayer.x));
        myPlayer.z = Math.max(-50, Math.min(50, myPlayer.z));
        myPlayer.ry = Math.atan2(normX, normZ);
    }

    if (myPlayer.mesh) {
        myPlayer.mesh.position.set(myPlayer.x, 0, myPlayer.z);
        myPlayer.mesh.rotation.y = myPlayer.ry;
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

    camera.position.x += (myPlayer.x - camera.position.x) * 0.1;
    camera.position.z += (myPlayer.z + 22 - camera.position.z) * 0.1;
    camera.lookAt(myPlayer.x, 1.5, myPlayer.z);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
