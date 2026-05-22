import WebSocket from 'ws';
import { Room } from '../models/room';
import { Player } from '../models/player';
import { GameMessage, MessageType } from './messageProtocol';

export class WSHub {
    private clients: Map<string, WebSocket> = new Map();
    public room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    handleConnection(ws: WebSocket) {
        ws.on('message', (message: string) => {
            try {
                const msg = GameMessage.fromJson(message.toString());
                this._handleMessage(ws, msg);
            } catch (e) {
                console.error('Invalid message format', e);
            }
        });

        ws.on('close', () => {
            this._handleChannelClosed(ws);
        });
    }

    private _handleMessage(ws: WebSocket, msg: GameMessage) {
        console.log(`[wsHub] Received message of type: ${msg.type}`);
        if (msg.type === MessageType.join) {
            this._handleJoin(ws, msg);
        } else if (msg.type === MessageType.action) {
            // Deprecated for game logic, but keeping for lobby actions if needed
            this._handleGameAction(msg);
        } else if (msg.type === 'webrtc_offer') {
            console.log(`[wsHub] Forwarding webrtc_offer from ${msg.playerId} to HOST`);
            this._forwardTo('HOST', msg);
        } else if (msg.type === 'webrtc_answer') {
            this._forwardTo(msg.payload.targetId, msg);
        } else if (msg.type === 'webrtc_ice_candidate') {
            this._forwardTo(msg.payload.targetId, msg);
        }
    }

    private _forwardTo(targetId: string, msg: GameMessage) {
        const targetWs = this.clients.get(targetId);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            console.log(`[wsHub] Sent ${msg.type} to ${targetId}`);
            targetWs.send(msg.toJson());
        } else {
            console.log(`[wsHub] Failed to forward ${msg.type} to ${targetId} - WS not found or closed`);
        }
    }

    private _handleJoin(ws: WebSocket, msg: GameMessage) {
        const playerId = msg.playerId;
        const nickname = msg.payload.nickname || 'Player';
        if (!playerId) return;

        const existing = this.room.getPlayer(playerId);
        if (existing) {
            if (this.clients.has(playerId)) {
                this.clients.get(playerId)?.close();
            }
            this.clients.set(playerId, ws);
            this.room.updatePlayerStatus(playerId, true);
            existing.nickname = nickname;
        } else {
            this.clients.set(playerId, ws);
            const isHost = playerId === 'HOST' || this.room.players.length === 0;
            this.room.addPlayer(new Player(playerId, nickname, isHost));
        }

        this._broadcastFullState();
    }

    private _handleChannelClosed(ws: WebSocket) {
        let disconnectedId: string | null = null;
        for (const [id, client] of this.clients.entries()) {
            if (client === ws) {
                disconnectedId = id;
                break;
            }
        }
        if (disconnectedId) {
            this.clients.delete(disconnectedId);
            this.room.updatePlayerStatus(disconnectedId, false);
            this._broadcastFullState();
            
            // Notify Host that a player disconnected so WebRTC can clean up
            if (disconnectedId !== 'HOST') {
                this._forwardTo('HOST', new GameMessage('player_disconnected' as MessageType, { playerId: disconnectedId }, 'SERVER'));
            }
        }
    }

    private _handleGameAction(msg: GameMessage) {
        // Most actions will now go over WebRTC DataChannels.
        // We only handle basic server-level matchmaking actions here if needed.
        const action = msg.payload.action;
        const isHost = msg.playerId === 'HOST';

        if (isHost && action === 'resetGame') {
            this.room.currentGame = undefined;
            this._broadcastFullState();
            return;
        }

        if (isHost && action === 'addMockPlayers') {
            const mocks = ['Alice', 'Bob', 'Charlie', 'Dave'];
            mocks.forEach((name, i) => {
                const id = `mock_${i}`;
                this.room.players = this.room.players.filter(p => p.uuid !== id);
                const p = new Player(id, name, false);
                p.isConnected = true;
                this.room.addPlayer(p);
            });
            this._broadcastFullState();
            return;
        }
    }

    private _broadcastFullState() {
        const basePayload: any = {
            room: this.room.toJson(),
        };

        for (const [playerId, client] of this.clients.entries()) {
            if (client.readyState !== WebSocket.OPEN) continue;

            const msg = new GameMessage(MessageType.stateUpdate, basePayload, 'SERVER');
            client.send(msg.toJson());
        }
    }
}
