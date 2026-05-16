import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { Room } from './models/room';
import { WSHub } from './core/wsHub';

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Multi-room support: map of roomCode -> WSHub
const hubs = new Map<string, WSHub>();

function getOrCreateHub(roomCode: string): WSHub {
    if (!hubs.has(roomCode)) {
        const room = new Room(roomCode);
        hubs.set(roomCode, new WSHub(room));
        console.log(`Created room: ${roomCode}`);
    }
    return hubs.get(roomCode)!;
}

wss.on('connection', (ws: WebSocket, req) => {
    // Room code comes in via query param: ws://host:8080/ws?room=ABCDEF
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const roomCode = url.searchParams.get('room') || url.pathname.split('/').pop() || 'DEFAULT';
    const hub = getOrCreateHub(roomCode.toUpperCase());
    hub.handleConnection(ws);
});

// REST: create a new room and return the code
app.get('/api/rooms/create', (_req, res) => {
    const room = new Room(); // generates random 6-char ID
    const hub = new WSHub(room);
    hubs.set(room.roomId, hub);
    res.json({ roomCode: room.roomId });
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

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
