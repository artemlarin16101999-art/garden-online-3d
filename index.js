const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const httpServer = http.createServer((req, res) => {
    let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(__dirname, file);
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath);
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server: httpServer });
const TICK_MS = 50;
const players = {};
let nextId = 1;
const COLORS = [0xFF8C42, 0xFFD700, 0x9FC5E8, 0x1a1a2e, 0x9B59B6, 0x2ECC71, 0xE74C3C];

wss.on('connection', (ws) => {
    const id = nextId++;
    const color = COLORS[id % COLORS.length];
    players[id] = {
        id,
        x: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10,
        ry: 0,
        color,
        name: 'Player' + id
    };

    ws.send(JSON.stringify({ type: 'init', id, color, players }));
    broadcast({ type: 'join', player: players[id] }, ws);
    console.log('Player ' + id + ' connected. Total: ' + Object.keys(players).length);

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'move') {
                const p = players[id];
                if (!p) return;
                const dx = msg.x - p.x;
                const dz = msg.z - p.z;
                const dist = Math.hypot(dx, dz);
                if (dist > 2) {
                    const k = 2 / dist;
                    p.x += dx * k;
                    p.z += dz * k;
                } else {
                    p.x = msg.x;
                    p.z = msg.z;
                }
                p.ry = msg.ry || 0;
                p.x = Math.max(-50, Math.min(50, p.x));
                p.z = Math.max(-50, Math.min(50, p.z));
            }
        } catch (e) { console.error('Bad message:', e.message); }
    });

    ws.on('close', () => {
        delete players[id];
        broadcast({ type: 'leave', id });
        console.log('Player ' + id + ' disconnected. Total: ' + Object.keys(players).length);
    });
});

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
        state[id] = {
            x: +p.x.toFixed(2),
            z: +p.z.toFixed(2),
            ry: +p.ry.toFixed(2),
            color: p.color,
            name: p.name
        };
    }
    broadcast({ type: 'state', players: state });
}, TICK_MS);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('Server started on port ' + PORT);
});
