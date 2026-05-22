import { v4 as uuidv4 } from 'uuid';
import { Player } from './player';

export class Room {
    roomId: string;
    players: Player[];
    currentGame?: string;
    localIp?: string;
    auditLog: any[];
    createdAt: Date;

    /** Words used in this room's game session — prevents repeats across consecutive boards */
    usedWords: Set<string>;

    constructor(roomId?: string) {
        this.roomId = roomId || uuidv4().substring(0, 6).toUpperCase();
        this.players = [];
        this.auditLog = [];
        this.createdAt = new Date();
        this.usedWords = new Set<string>();
    }


    addPlayer(player: Player) {
        if (!this.players.some((p) => p.uuid === player.uuid)) {
            this.players.push(player);
        }
    }

    removePlayer(uuid: string) {
        this.players = this.players.filter((p) => p.uuid !== uuid);
    }

    updatePlayerStatus(uuid: string, isConnected: boolean) {
        const player = this.players.find((p) => p.uuid === uuid);
        if (player) {
            player.isConnected = isConnected;
        }
    }

    getPlayer(uuid: string): Player | undefined {
        return this.players.find((p) => p.uuid === uuid);
    }

    appendAudit(message: any) {
        this.auditLog.push(message);
    }

    toJson(): any {
        return {
            roomId: this.roomId,
            players: this.players.map((p) => p.toJson()),
            currentGame: this.currentGame,
            localIp: this.localIp,
        };
    }
}
