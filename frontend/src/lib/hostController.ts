import { p2pClient } from './p2pClient';
import type { GameInterface } from '../core/engine/gameInterface';
import { createGameEngine, getClientGameMeta } from '../games/gameRegistry';

export type HostStateCallback = (state: any) => void;

class HostController {
    public isHostActive = false;
    public roomCode: string = '';
    public tvPin: string = '';
    public isConfiguring: boolean = false;
    
    private game: GameInterface | null = null;
    private gameId: string | null = null;
    private players: { id: string, nickname: string, isConnected: boolean }[] = [];
    
    private listeners: HostStateCallback[] = [];
    private channel: BroadcastChannel;
    private isPrimaryHost = false;

    constructor() {
        this.channel = new BroadcastChannel('partyhub_host');
        this.channel.onmessage = (event) => {
            if (event.data.type === 'STATE_UPDATE' && !this.isPrimaryHost) {
                this.listeners.forEach(cb => cb(event.data.state));
            } else if (event.data.type === 'REQUEST_STATE' && this.isPrimaryHost) {
                this.broadcastState();
            }
        };
    }

    initHost(roomCode: string, hostName: string = 'TV Host') {
        if (this.isHostActive) return;
        this.isHostActive = true;
        this.isPrimaryHost = true;
        this.roomCode = roomCode;
        
        // Generate random 4-digit PIN
        this.tvPin = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(`[TESTING] TV PIN generated: ${this.tvPin}`);
        
        // Host is always player 1
        this.players.push({ id: 'HOST', nickname: hostName, isConnected: true });

        p2pClient.startHost(
            this.tvPin,
            (playerId) => this.onPlayerConnect(playerId),
            (playerId) => this.onPlayerDisconnect(playerId)
        );

        p2pClient.onMessage((playerId, msg) => this.handleMessageFromPlayer(playerId, msg));

        this.broadcastState();
    }

    private onPlayerConnect(playerId: string) {
        const existing = this.players.find(p => p.id === playerId);
        if (existing) {
            existing.isConnected = true;
        } else {
            // Wait for 'join' action to set nickname
        }
        this.broadcastState();
    }

    private onPlayerDisconnect(playerId: string) {
        const existing = this.players.find(p => p.id === playerId);
        if (existing) {
            existing.isConnected = false;
        }
        this.broadcastState();
    }

    private handleMessageFromPlayer(playerId: string, msg: any) {
        if (msg.type !== 'action') return;
        const action = msg.payload;

        if (action.action === 'join') {
            console.log(`[P2P Host] Received join from ${playerId} with nickname ${action.nickname}`);
            const nickname = action.nickname || 'Player';
            const existing = this.players.find(p => p.id === playerId);
            if (existing) {
                existing.nickname = nickname;
                existing.isConnected = true;
            } else {
                this.players.push({ id: playerId, nickname, isConnected: true });
            }
            this.broadcastState();
            return;
        }

        if (this.game) {
            this.game.handleAction(playerId, action);
            this.broadcastState();
        }
    }

    // Host UI Actions
    public initGame(gameId: string) {
        this.gameId = gameId;
        this.game = createGameEngine(gameId);
        if (this.game) {
            this.game.init();
        }
        this.broadcastState();
    }

    public setGameConfiguring(configuring: boolean) {
        this.isConfiguring = configuring;
        this.broadcastState();
    }

    public startGame() {
        if (this.game) {
            // Exclude HOST — only real players should be assigned game roles
            const activePlayers = this.players.filter(p => p.isConnected && p.id !== 'HOST');
            const activePlayerIds = activePlayers.map(p => p.id);
            // Build name map so engines can use real nicknames (especially TTRE)
            const nameMap: Record<string, string> = {};
            activePlayers.forEach(p => { nameMap[p.id] = p.nickname; });
            this.game.assignPlayers(activePlayerIds, nameMap);
            this.game.startPlaying();
            this.broadcastState();
        }
    }

    public resetGame() {
        this.game = null;
        this.gameId = null;
        this.broadcastState();
    }

    public addMockPlayers() {
        const mockNames = ['Alice', 'Bob', 'Charlie', 'Diana'];
        for (const name of mockNames) {
            const id = 'mock_' + Math.random().toString(36).substring(2, 7);
            this.players.push({ id, nickname: name, isConnected: true });
        }
        this.broadcastState();
    }

    public handleLocalAction(action: any) {
        if (this.game) {
            this.game.handleAction('HOST', action);
            this.broadcastState();
        }
    }

    // State Management
    public subscribe(cb: HostStateCallback) {
        this.listeners.push(cb);
        if (this.isPrimaryHost) {
            cb(this.getFullStateForPlayer('HOST'));
        } else {
            this.channel.postMessage({ type: 'REQUEST_STATE' });
        }
        return () => {
            this.listeners = this.listeners.filter(l => l !== cb);
        };
    }

    private broadcastState() {
        if (!this.isPrimaryHost) return;

        // Update local Host UI
        const hostState = this.getFullStateForPlayer('HOST');
        this.listeners.forEach(cb => cb(hostState));

        // Sync with other tabs (TV View)
        this.channel.postMessage({ type: 'STATE_UPDATE', state: hostState });

        // Update connected WebRTC players and TV Views
        const peers = p2pClient.getConnectedPeers();
        for (const peerId of peers) {
            if (peerId !== 'HOST') {
                const playerState = this.getFullStateForPlayer(peerId);
                p2pClient.send('stateUpdate', playerState, peerId);
            }
        }
    }

    private getFullStateForPlayer(playerId: string) {
        const basePayload: any = {
            room: {
                roomId: this.roomCode,
                players: this.players,
                currentGame: this.gameId,
                isConfiguring: this.isConfiguring,
                tvPin: this.tvPin,
            }
        };

        if (this.game) {
            basePayload.gameId = this.game.gameId;
            basePayload.gameMeta = getClientGameMeta(this.game.gameId);
            basePayload.game = this.game.getStateForPlayer(playerId);
        }

        return basePayload;
    }
}

export const hostController = new HostController();
