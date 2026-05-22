import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { Room } from './models/room';
import { WSHub } from './core/wsHub';
import { getPublicRegistry } from './games/gameRegistry';
import os from 'os';

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIp();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Multi-room support: map of roomCode -> WSHub
const hubs = new Map<string, WSHub>();

function getOrCreateHub(roomCode: string): WSHub {
    if (!hubs.has(roomCode)) {
        const room = new Room(roomCode);
        room.localIp = LOCAL_IP;
        hubs.set(roomCode, new WSHub(room));
        console.log(`Created room: ${roomCode} at ${LOCAL_IP}`);
    }
    return hubs.get(roomCode)!;
}

wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const roomCode = url.searchParams.get('room') || url.pathname.split('/').pop() || 'DEFAULT';
    const hub = getOrCreateHub(roomCode.toUpperCase());
    hub.handleConnection(ws);
});

// REST: create a new room and return the code
app.get('/api/rooms/create', (_req, res) => {
    const room = new Room();
    room.localIp = LOCAL_IP;
    const hub = new WSHub(room);
    hubs.set(room.roomId, hub);
    res.json({ roomCode: room.roomId, localIp: LOCAL_IP });
});

// REST: list active rooms
app.get('/api/rooms', (_req, res) => {
    const rooms = Array.from(hubs.entries()).map(([code, hub]) => ({
        code,
        players: hub.room.players.length,
        game: hub.room.currentGame || null,
    }));
    res.json(rooms);
});

// REST: get a single room's status
app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const hub = hubs.get(code);
    if (!hub) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    res.json({
        code,
        players: hub.room.players.length,
        game: hub.room.currentGame || null,
        localIp: hub.room.localIp,
    });
});

// REST: list available games (from registry)
app.get('/api/games', (_req, res) => {
    res.json(getPublicRegistry());
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Local IP: ${LOCAL_IP}`);
    console.log(`API: http://${LOCAL_IP}:${PORT}/api/games`);
});
