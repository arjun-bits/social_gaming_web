import { wsClient } from './wsClient';

export type P2PMessageHandler = (playerId: string, payload: any) => void;

class P2PClient {
    public isHost = false;
    private connections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private messageHandlers: P2PMessageHandler[] = [];
    private unsubscribeWs: (() => void) | null = null;
    
    // For Host only
    private expectedPin: string | null = null;
    private onPlayerConnect?: (playerId: string) => void;
    private onPlayerDisconnect?: (playerId: string) => void;

    // For Player only
    private onConnectionOpen?: () => void;
    private onConnectionError?: (err: string) => void;

    private config: RTCConfiguration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    /**
     * Start listening as the Host.
     */
    startHost(pin: string, onConnect?: (id: string) => void, onDisconnect?: (id: string) => void) {
        this.isHost = true;
        this.expectedPin = pin;
        this.onPlayerConnect = onConnect;
        this.onPlayerDisconnect = onDisconnect;

        if (this.unsubscribeWs) this.unsubscribeWs();
        this.unsubscribeWs = wsClient.subscribeRaw((msg) => this.handleHostSignaling(msg));
    }

    /**
     * Start connecting as a Player.
     */
    async startPlayer(pin: string, onOpen?: () => void, onError?: (err: string) => void, isTVView = false) {
        this.isHost = false;
        this.onConnectionOpen = onOpen;
        this.onConnectionError = onError;

        if (this.unsubscribeWs) this.unsubscribeWs();
        this.unsubscribeWs = wsClient.subscribeRaw((msg) => this.handlePlayerSignaling(msg));

        const peer = new RTCPeerConnection(this.config);
        this.connections.set('HOST', peer);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                wsClient.send('webrtc_ice_candidate', { targetId: 'HOST', candidate: event.candidate });
            }
        };

        const channel = peer.createDataChannel('game', { ordered: true });
        this.setupDataChannel('HOST', channel);

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            // Send offer + TV PIN for authentication
            console.log('[P2P Player] Sending webrtc_offer...');
            wsClient.send('webrtc_offer', {
                targetId: 'HOST',
                offer: peer.localDescription,
                pin: pin,
                isTVView
            });
        } catch (e: any) {
            if (onError) onError(e.message);
        }
    }

    private async handleHostSignaling(msg: any) {
        if (!this.isHost) return;
        console.log('[P2P Host] Received signaling:', msg.type);

        if (msg.type === 'webrtc_offer') {
            const { offer, pin, isTVView } = msg.payload;
            const playerId = msg.playerId;

            if (this.expectedPin && pin !== this.expectedPin && !isTVView) {
                wsClient.send('webrtc_answer', { targetId: playerId, error: 'Invalid TV PIN' });
                return;
            }

            const peer = new RTCPeerConnection(this.config);
            this.connections.set(playerId, peer);

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    wsClient.send('webrtc_ice_candidate', { targetId: playerId, candidate: event.candidate });
                }
            };

            peer.ondatachannel = (event) => {
                this.setupDataChannel(playerId, event.channel);
            };

            peer.onconnectionstatechange = () => {
                if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                    this.cleanupPeer(playerId);
                }
            };

            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            wsClient.send('webrtc_answer', {
                targetId: playerId,
                answer: peer.localDescription
            });
        } else if (msg.type === 'webrtc_ice_candidate') {
            const peer = this.connections.get(msg.playerId);
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate', e);
                }
            }
        } else if (msg.type === 'player_disconnected') {
            this.cleanupPeer(msg.payload.playerId);
        }
    }

    private async handlePlayerSignaling(msg: any) {
        if (this.isHost) return;

        if (msg.type === 'webrtc_answer') {
            if (msg.payload.error) {
                if (this.onConnectionError) this.onConnectionError(msg.payload.error);
                return;
            }
            const peer = this.connections.get('HOST');
            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(msg.payload.answer));
            }
        } else if (msg.type === 'webrtc_ice_candidate') {
            const peer = this.connections.get('HOST');
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate', e);
                }
            }
        }
    }

    private setupDataChannel(peerId: string, channel: RTCDataChannel) {
        this.dataChannels.set(peerId, channel);

        channel.onopen = () => {
            console.log(`[P2P] DataChannel opened with ${peerId}`);
            if (this.isHost && this.onPlayerConnect) {
                this.onPlayerConnect(peerId);
            } else if (!this.isHost && this.onConnectionOpen) {
                this.onConnectionOpen();
            }
        };

        channel.onclose = () => {
            console.log(`[P2P] DataChannel closed with ${peerId}`);
            this.cleanupPeer(peerId);
        };

        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messageHandlers.forEach(h => h(peerId, data));
            } catch (e) {
                console.error('[P2P] Failed to parse data channel message', e);
            }
        };
    }

    private cleanupPeer(peerId: string) {
        const peer = this.connections.get(peerId);
        if (peer) {
            peer.close();
            this.connections.delete(peerId);
        }
        this.dataChannels.delete(peerId);
        if (this.isHost && this.onPlayerDisconnect) {
            this.onPlayerDisconnect(peerId);
        }
    }

    /**
     * Send a message to a specific peer or all peers.
     */
    send(type: string, payload: any, targetId?: string) {
        const msg = JSON.stringify({ type, payload });
        
        if (targetId) {
            const channel = this.dataChannels.get(targetId);
            if (channel && channel.readyState === 'open') {
                channel.send(msg);
            }
        } else {
            // Broadcast
            for (const channel of this.dataChannels.values()) {
                if (channel.readyState === 'open') {
                    channel.send(msg);
                }
            }
        }
    }

    onMessage(handler: P2PMessageHandler) {
        this.messageHandlers.push(handler);
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    getConnectedPeers(): string[] {
        return Array.from(this.dataChannels.keys()).filter(id => this.dataChannels.get(id)?.readyState === 'open');
    }

    stop() {
        if (this.unsubscribeWs) {
            this.unsubscribeWs();
            this.unsubscribeWs = null;
        }
        for (const peer of this.connections.values()) {
            peer.close();
        }
        this.connections.clear();
        this.dataChannels.clear();
        this.messageHandlers = [];
    }
}

export const p2pClient = new P2PClient();
