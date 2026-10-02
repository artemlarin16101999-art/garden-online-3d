const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// --- Раздача статики + WebSocket на одном порту ---
const httpServer = http.createServer((req, res) => {
    let file = req.url === '/' ? '/index.html' : req.url.split('?')[0];

    // Защита от выхода за пределы папки
    file = file.replace(/\.\./g, '');

    const filePath = path.join(__dirname, file);

    console.log('Request:', req.url, '->', filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('Not found:', filePath);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const types = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.json': 'application/json; charset=utf-8'
        };

        res.writeHead(200, {
            'Content-Type': types[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server: httpServer });

const TICK_MS = 50;
const players = {};
let nextId = 1;
const COLORS = [0xFF8C42, 0xFFD700, 0x9FC5E8, 0x1a1a2e, 0x9B59B6, 0x2ECC71, 0xE74C3C];

const WORLD = {
    minX: -50, maxX: 50,
    minZ: -50, maxZ: 50
};

const ECONOMY = {
    startMoney: 50,
    startSeeds: 20,
    seedPrice: 10,
    bundlePrice: 50,
    bundleCount: 5,
    rewards: {
        carrot: 20,
        tomato: 30,
        corn: 50,
        pumpkin: 100
    },
    growTimeMs: 8000,
    maxPlots: 8
};

const plots = [];
for (let i = 0; i < ECONOMY.maxPlots; i++) {
    plots.push({
        id: i,
        x: -8 + i * 2.5,
        z: 0,
        crop: null,
        plantedAt: 0,
        ready: false,
        owner: null
    });
}

wss.on('connection', (ws) => {
    const id = nextId++;
    const color = COLORS[id % COLORS.length];

    players[id] = {
        id,
        x: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10,
        ry: 0,
        color,
        name: 'Player' + id,
        money: ECONOMY.startMoney,
        seeds: ECONOMY.startSeeds
    };

    ws.send(JSON.stringify({
        type: 'init',
        id,
        color,
        player: players[id],
        players,
        plots,
        economy: ECONOMY
    }));

    broadcast({ type: 'join', player: players[id] }, ws);

    console.log('Player ' + id + ' connected. Total: ' + Object.keys(players).length);

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            return;
        }

        const p = players[id];
        if (!p) return;

        if (msg.type === 'move') {
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
            p.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, p.x));
            p.z = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, p.z));
        }

        else if (msg.type === 'action') {
            handlePlotAction(p, ws);
        }

        else if (msg.type === 'buy_seed') {
            if (p.money >= ECONOMY.seedPrice) {
                p.money -= ECONOMY.seedPrice;
                p.seeds += 1;
                ws.send(JSON.stringify({
                    type: 'stats',
                    money: p.money,
                    seeds: p.seeds,
                    message: 'Куплено 1 семечко'
                }));
            } else {
                ws.send(JSON.stringify({ type: 'stats', money: p.money, seeds: p.seeds, message: 'Мало монет' }));
            }
        }

        else if (msg.type === 'buy_bundle') {
            if (p.money >= ECONOMY.bundlePrice) {
                p.money -= ECONOMY.bundlePrice;
                p.seeds += ECONOMY.bundleCount;
                ws.send(JSON.stringify({
                    type: 'stats',
                    money: p.money,
                    seeds: p.seeds,
                    message: 'Куплено ' + ECONOMY.bundleCount + ' семян'
                }));
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
    let closest = null;
    let closestDist = 4;
    for (const plot of plots) {
        const d = Math.hypot(player.x - plot.x, player.z - plot.z);
        if (d < closestDist) {
            closestDist = d;
            closest = plot;
        }
    }
    if (!closest) {
        ws.send(JSON.stringify({ type: 'message', text: 'Подойди к грядке' }));
        return;
    }

    if (closest.ready && closest.crop) {
        const reward = ECONOMY.rewards[closest.crop] || 10;
        player.money += reward;
        ws.send(JSON.stringify({
            type: 'stats',
            money: player.money,
            seeds: player.seeds,
            message: 'Собрано! +' + reward + ' монет'
        }));
        closest.crop = null;
        closest.ready = false;
        closest.plantedAt = 0;
        closest.owner = null;
        broadcast({ type: 'plots', plots });
        return;
    }

    if (!closest.crop) {
        if (player.seeds <= 0) {
            ws.send(JSON.stringify({ type: 'message', text: 'Нет семян. Купи в магазине.' }));
            return;
        }
        const kinds = ['carrot', 'tomato', 'corn', 'pumpkin'];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        closest.crop = kind;
        closest.plantedAt = Date.now();
        closest.ready = false;
        closest.owner = player.id;
        player.seeds -= 1;
        ws.send(JSON.stringify({
            type: 'stats',
            money: player.money,
            seeds: player.seeds,
            message: 'Посажено: ' + kind
        }));
        broadcast({ type: 'plots', plots });
        return;
    }

    ws.send(JSON.stringify({ type: 'message', text: 'Растёт... подожди' }));
}

setInterval(() => {
    let changed = false;
    const now = Date.now();
    for (const plot of plots) {
        if (plot.crop && !plot.ready) {
            if (now - plot.plantedAt >= ECONOMY.growTimeMs) {
                plot.ready = true;
                changed = true;
            }
        }
    }
    if (changed) broadcast({ type: 'plots', plots });
}, 1000);

function broadcast(msg, exclude) {
    const data = JSON.stringify(msg);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== exclude) {
            client.send(data);
        }
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
