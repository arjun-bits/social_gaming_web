import type { GameInterface } from '../gameInterface';
import { TTREState, GamePhase, TrainColor, RouteType } from './models';
import type { TTREStateData, Route, Ticket, PlayerState } from './models';
import { initialRoutes, cities } from './boardData';

export class TTREGameEngine implements GameInterface {
    state: TTREState;

    constructor() {
        this.state = new TTREState({
            phase: GamePhase.lobby,
            players: {},
            routes: [...initialRoutes],
            openCards: [],
            deckCount: 100, // mock
            ticketDeckCount: 40 // mock
        });
    }

    get gameId(): string {
        return 'ticket_europe';
    }

    get displayName(): string {
        return 'Ticket to Ride Europe';
    }

    get isActive(): boolean {
        return this.state.data.phase !== GamePhase.lobby;
    }

    get description(): string {
        return 'Build train routes across Europe!';
    }

    get minPlayers(): number { return 2; }
    get maxPlayers(): number { return 5; }

    init(): void {
        // any one-time setup
    }

    assignPlayers(playerIds: string[], nameMap?: Record<string, string>): void {
        // Create player state for all assigned players using real names
        for (const id of playerIds) {
            const name = nameMap?.[id] || ('Player ' + id.substring(0, 4));
            this.addPlayer(id, name);
        }
        // Apply color preferences set in lobby if available
        const colorPrefs = (this.state.data as any).playerColorPrefs || {};
        for (const [pid, colorId] of Object.entries(colorPrefs)) {
            const colorHexMap: Record<string, string> = {
                red: '#E53E3E', blue: '#3182CE', green: '#38A169',
                yellow: '#D69E2E', black: '#718096'
            };
            if (this.state.data.players[pid]) {
                this.state.data.players[pid].color = colorHexMap[colorId as string] || this.state.data.players[pid].color;
            }
        }
    }

    startPlaying(usedWords?: Set<string>): void {
        this.startGame();
    }

    getFullState(): any {
        return { data: this.state.data };
    }

    handleAction(playerId: string, payload: any): void {
        const action = payload?.action;

        // HOST-only actions that don't require a player state entry
        if (action === 'start_game' || action === 'setPlayerColors') {
            if (action === 'start_game' && playerId === 'HOST') {
                this.startGame();
            }
            if (action === 'setPlayerColors' && playerId === 'HOST') {
                // Store color preferences for when players are assigned
                (this.state.data as any).playerColorPrefs = payload.colorMap || {};
                // Apply immediately to any existing player states
                const colorHexMap: Record<string, string> = {
                    red: '#E53E3E', blue: '#3182CE', green: '#38A169',
                    yellow: '#D69E2E', black: '#718096'
                };
                for (const [pid, colorId] of Object.entries(payload.colorMap || {})) {
                    if (this.state.data.players[pid]) {
                        this.state.data.players[pid].color = colorHexMap[colorId as string] || this.state.data.players[pid].color;
                    }
                }
            }
            return;
        }

        const p = this.state.data.players[playerId];
        if (!p) return;

        switch (action) {
            case 'draw_card':
                this.drawCard(playerId, payload.color); // color or 'deck'
                break;
            case 'claim_route':
                this.claimRoute(playerId, payload.routeId, payload.cardsUsed);
                break;
            case 'build_station':
                this.buildStation(playerId, payload.cityId, payload.cardsUsed);
                break;
        }
    }

    private startGame() {
        this.state.data.phase = GamePhase.playing;
        this.state.data.playerOrder = Object.keys(this.state.data.players).filter(id => id !== 'HOST');
        this.state.data.currentPlayerIndex = 0;

        // Initialize players
        for (const id of this.state.data.playerOrder) {
            const p = this.state.data.players[id];
            p.trainsLeft = 45;
            p.stationsLeft = 3;
            p.score = 0;
            p.trainCards = {
                red: 0, blue: 0, green: 0, yellow: 0, black: 0, white: 0, orange: 0, pink: 0, locomotive: 0, any: 0
            };
            p.tickets = [];
            p.stationsBuilt = [];
        }

        // Deal initial cards
        this.dealInitialCards();
        this.replenishOpenCards();
    }

    private dealInitialCards() {
        for (const id of this.state.data.playerOrder) {
            const p = this.state.data.players[id];
            // Give 4 random cards (simplified)
            for (let i = 0; i < 4; i++) {
                p.trainCards[this.randomCard()]++;
            }
        }
    }

    private randomCard(): TrainColor {
        const colors = [TrainColor.red, TrainColor.blue, TrainColor.green, TrainColor.yellow, TrainColor.black, TrainColor.white, TrainColor.orange, TrainColor.pink, TrainColor.locomotive];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private replenishOpenCards() {
        while (this.state.data.openCards.length < 5) {
            this.state.data.openCards.push(this.randomCard());
        }
        // Check for 3 locomotives
        if (this.state.data.openCards.filter(c => c === TrainColor.locomotive).length >= 3) {
            this.state.data.openCards = [];
            this.replenishOpenCards();
        }
    }

    private drawCard(playerId: string, color: TrainColor | 'deck') {
        const p = this.state.data.players[playerId];
        if (color === 'deck') {
            p.trainCards[this.randomCard()]++;
        } else {
            const idx = this.state.data.openCards.indexOf(color);
            if (idx >= 0) {
                this.state.data.openCards.splice(idx, 1);
                p.trainCards[color]++;
                this.replenishOpenCards();
            }
        }
        this.nextTurn();
    }

    private claimRoute(playerId: string, routeId: string, cardsUsed: Partial<Record<TrainColor, number>>) {
        const route = this.state.data.routes.find(r => r.id === routeId);
        if (!route || route.owner) return; // invalid or taken

        const p = this.state.data.players[playerId];
        
        // Deduct cards
        let totalUsed = 0;
        for (const [color, count] of Object.entries(cardsUsed)) {
            p.trainCards[color as TrainColor] -= count;
            totalUsed += count;
        }

        // Apply
        route.owner = playerId;
        p.trainsLeft -= route.length;
        p.score += this.getRoutePoints(route.length);

        this.nextTurn();
    }

    private buildStation(playerId: string, cityId: string, cardsUsed: Partial<Record<TrainColor, number>>) {
        const p = this.state.data.players[playerId];
        if (p.stationsLeft <= 0 || p.stationsBuilt.includes(cityId)) return;

        // Deduct cards
        for (const [color, count] of Object.entries(cardsUsed)) {
            p.trainCards[color as TrainColor] -= count;
        }

        p.stationsLeft--;
        p.stationsBuilt.push(cityId);

        this.nextTurn();
    }

    private getRoutePoints(len: number): number {
        const pts: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 };
        return pts[len] || 0;
    }

    private nextTurn() {
        this.state.data.currentPlayerIndex = (this.state.data.currentPlayerIndex + 1) % this.state.data.playerOrder.length;
    }

    addPlayer(playerId: string, name: string): void {
        if (!this.state.data.players[playerId] && playerId !== 'HOST') {
            this.state.data.players[playerId] = {
                id: playerId,
                name,
                color: this.assignColor(),
                trainsLeft: 45,
                stationsLeft: 3,
                score: 0,
                trainCards: { red: 0, blue: 0, green: 0, yellow: 0, black: 0, white: 0, orange: 0, pink: 0, locomotive: 0, any: 0 },
                tickets: [],
                stationsBuilt: []
            };
        }
    }

    removePlayer(playerId: string): void {
        delete this.state.data.players[playerId];
        this.state.data.playerOrder = this.state.data.playerOrder.filter(id => id !== playerId);
    }

    getStateForPlayer(playerId: string): any {
        // Obfuscate other players' hands later, but for MVP send full state
        return { data: this.state.data };
    }

    private assignColor(): string {
        const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#000000'];
        const used = Object.values(this.state.data.players).map(p => p.color);
        return colors.find(c => !used.includes(c)) || '#FFFFFF';
    }
}
