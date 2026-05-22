export enum MessageType {
    join = 'join',
    action = 'action',
    stateUpdate = 'stateUpdate',
    private = 'private',
    error = 'error',
    audit = 'audit',
    webrtc_offer = 'webrtc_offer',
    webrtc_answer = 'webrtc_answer',
    webrtc_ice_candidate = 'webrtc_ice_candidate',
}

export class GameMessage {
    type: MessageType;
    payload: any;
    timestamp: number;
    playerId: string;

    constructor(type: MessageType, payload: any, playerId: string, timestamp?: number) {
        this.type = type;
        this.payload = payload;
        this.playerId = playerId;
        this.timestamp = timestamp || Date.now();
    }

    toJson(): string {
        return JSON.stringify({
            type: this.type,
            payload: this.payload,
            timestamp: this.timestamp,
            playerId: this.playerId,
        });
    }

    static fromJson(source: string): GameMessage {
        const map = JSON.parse(source);
        return new GameMessage(map.type as MessageType, map.payload || {}, map.playerId || '', map.timestamp);
    }
}
