export type GameStateCallback = (state: any) => void;

class WSClient {
    private ws: WebSocket | null = null;
    private listeners: GameStateCallback[] = [];
    public playerId: string = '';
    private nickname: string = '';
    private roomCode: string = '';
    private reconnectTimeout: any = null;
    private intentionalClose = false;
    private reconnectDelay = 1000;

    connect(playerId: string, nickname: string, roomCode?: string) {
        this.playerId = playerId;
        this.nickname = nickname;
        if (roomCode) this.roomCode = roomCode;
        this.intentionalClose = false;
        this._openSocket();
    }

    private _openSocket() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return; // already connected or connecting
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const roomParam = this.roomCode ? `?room=${this.roomCode}` : '';
        const url = `${protocol}//${host}:8080/ws${roomParam}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log(`[WS] Connected to room ${this.roomCode}`);
            this.reconnectDelay = 1000; // reset backoff
            this.send('join', { nickname: this.nickname });
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'stateUpdate') {
                    this.listeners.forEach(cb => cb(msg.payload));
                }
            } catch (e) {
                console.error('[WS] Failed to parse message', e);
            }
        };

        this.ws.onclose = () => {
            if (this.intentionalClose) return;
            console.log(`[WS] Disconnected. Reconnecting in ${this.reconnectDelay}ms...`);
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000); // exponential backoff
                this._openSocket();
            }, this.reconnectDelay);
        };

        this.ws.onerror = (err) => {
            console.error('[WS] Error:', err);
        };
    }

    disconnect() {
        this.intentionalClose = true;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.ws?.close();
    }

    send(type: string, payload: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type,
                payload,
                playerId: this.playerId,
                timestamp: Date.now(),
            }));
        } else {
            console.warn('[WS] Cannot send — not connected');
        }
    }

    sendAction(payload: any) {
        this.send('action', payload);
    }

    subscribe(callback: GameStateCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
}

export const wsClient = new WSClient();
