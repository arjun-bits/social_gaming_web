import WebSocket from 'ws';
import { Room } from '../models/room';
import { Player } from '../models/player';
import { GameInterface } from '../games/gameInterface';
import { createGameEngine } from '../games/gameRegistry';
import { GameMessage, MessageType } from './messageProtocol';

export class WSHub {
    private clients: Map<string, WebSocket> = new Map();
    public room: Room;
    private game?: GameInterface;

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
        if (msg.type === MessageType.join) {
            this._handleJoin(ws, msg);
        } else if (msg.type === MessageType.action) {
            this._handleGameAction(msg);
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
        }
    }

    private _handleGameAction(msg: GameMessage) {
        const action = msg.payload.action;
        const isHost = msg.playerId === 'HOST';

        if (isHost && action === 'initGame') {
            this.initGame(msg.payload.gameId);
            return;
        }

        if (isHost && action === 'resetGame') {
            this.game = undefined;
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

        if (isHost && action === 'startGame') {
            this.startGame(msg.payload.gameId || 'secret_signals');
            return;
        }

        if (isHost && action === 'selectGame') {
            // Pre-select a game in the lobby (before starting)
            if (msg.payload.gameId) {
                this.initGame(msg.payload.gameId);
            }
            return;
        }

        if (!this.game) return;
        this.game.handleAction(msg.playerId, msg.payload);
        this._broadcastFullState();
    }

    public initGame(gameId: string) {
        const engine = createGameEngine(gameId);
        if (!engine) {
            console.warn(`Unknown gameId: ${gameId}`);
            return;
        }
        this.game = engine;
        this.game.init();
        this.room.currentGame = gameId;
        this._broadcastFullState();
    }

    public startGame(gameId: string) {
        if (!this.game || this.room.currentGame !== gameId) {
            this.initGame(gameId);
        }
        // Assign players (including HOST so they can participate)
        const playerIds = this.room.players.map(p => p.uuid);
        this.game!.assignPlayers(playerIds);
        // Pass usedWords so each board picks fresh words
        this.game!.startPlaying(this.room.usedWords);
        this._broadcastFullState();
    }

    private _broadcastFullState() {
        const basePayload: any = {
            room: this.room.toJson(),
        };

        if (this.game) {
            basePayload.gameId = this.game.gameId;
            basePayload.gameMeta = {
                displayName: this.game.displayName,
                description: this.game.description,
                minPlayers: this.game.minPlayers,
                maxPlayers: this.game.maxPlayers,
            };
        }

        for (const [playerId, client] of this.clients.entries()) {
            if (client.readyState !== WebSocket.OPEN) continue;

            const payload = { ...basePayload };
            if (this.game) {
                payload.game = this.game.getStateForPlayer(playerId);
            }

            const msg = new GameMessage(MessageType.stateUpdate, payload, 'SERVER');
            client.send(msg.toJson());
        }
    }
}
