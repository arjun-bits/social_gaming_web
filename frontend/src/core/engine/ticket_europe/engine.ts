import type { GameInterface } from '../gameInterface';
import { TTREState, GamePhase, TrainColor, RouteType } from './models';
import type { Ticket } from './models';
import { initialRoutes, cities, initialTickets } from './boardData';

export class TTREGameEngine implements GameInterface {
    state: TTREState;

    constructor() {
        this.state = new TTREState({
            phase: GamePhase.lobby,
            players: {},
            routes: [...initialRoutes],
            openCards: [],
            deckCount: 110,
            ticketDeckCount: initialTickets.length,
            ticketDeck: [...initialTickets] // Load the ticket deck
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
        for (const id of playerIds) {
            const name = nameMap?.[id] || ('Player ' + id.substring(0, 4));
            this.addPlayer(id, name);
        }
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

    startPlaying(_usedWords?: Set<string>): void {
        this.startGame();
    }

    getFullState(): any {
        return { data: this.state.data };
    }

    handleAction(playerId: string, payload: any): void {
        const action = payload?.action;

        // HOST-only actions
        if (action === 'start_game' || action === 'setPlayerColors') {
            if (action === 'start_game' && playerId === 'HOST') {
                this.startGame();
            }
            if (action === 'setPlayerColors' && playerId === 'HOST') {
                (this.state.data as any).playerColorPrefs = payload.colorMap || {};
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
                this.drawCard(playerId, payload.color);
                break;
            case 'claim_route':
                this.claimRoute(playerId, payload.routeId, payload.cardsUsed);
                break;
            case 'build_station':
                this.buildStation(playerId, payload.cityId, payload.cardsUsed);
                break;
            case 'draw_tickets':
                this.drawTickets(playerId);
                break;
            case 'keep_tickets':
                this.keepTickets(playerId, payload.keepTicketIds);
                break;
        }
    }

    private startGame() {
        this.state.data.phase = GamePhase.playing;
        this.state.data.playerOrder = Object.keys(this.state.data.players);
        this.state.data.currentPlayerIndex = 0;

        // Shuffle the destination tickets deck
        const tickets = [...initialTickets];
        for (let i = tickets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tickets[i], tickets[j]] = [tickets[j], tickets[i]];
        }
        this.state.data.ticketDeck = tickets;
        this.state.data.ticketDeckCount = tickets.length;

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
            p.pendingTickets = []; // Array for pending keep/discard choice
        }

        // Deal 4 initial train cards
        this.dealInitialCards();
        this.replenishOpenCards();

        // Deal 3 initial tickets as pending to each player
        for (const id of this.state.data.playerOrder) {
            const p = this.state.data.players[id];
            const pending: Ticket[] = [];
            for (let i = 0; i < 3; i++) {
                const t = this.state.data.ticketDeck?.pop();
                if (t) pending.push(t);
            }
            p.pendingTickets = pending;
            this.state.data.ticketDeckCount = this.state.data.ticketDeck?.length || 0;
        }
    }

    private dealInitialCards() {
        for (const id of this.state.data.playerOrder) {
            const p = this.state.data.players[id];
            for (let i = 0; i < 4; i++) {
                p.trainCards[this.randomCard()]++;
            }
        }
    }

    private randomCard(): TrainColor {
        const colors = [
            TrainColor.red, TrainColor.blue, TrainColor.green, TrainColor.yellow,
            TrainColor.black, TrainColor.white, TrainColor.orange, TrainColor.pink,
            TrainColor.locomotive
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private replenishOpenCards() {
        while (this.state.data.openCards.length < 5) {
            this.state.data.openCards.push(this.randomCard());
        }
        if (this.state.data.openCards.filter(c => c === TrainColor.locomotive).length >= 3) {
            this.state.data.openCards = [];
            this.replenishOpenCards();
        }
    }

    private drawCard(playerId: string, color: TrainColor | 'deck') {
        const p = this.state.data.players[playerId];
        if (color === 'deck') {
            p.trainCards[this.randomCard()]++;
            this.state.data.logs.push(`${p.name} drew a card from the deck`);
        } else {
            const idx = this.state.data.openCards.indexOf(color);
            if (idx >= 0) {
                this.state.data.openCards.splice(idx, 1);
                p.trainCards[color]++;
                this.replenishOpenCards();
                this.state.data.logs.push(`${p.name} took a face-up ${color.toUpperCase()} card`);
            }
        }
        this.nextTurn();
    }

    private drawTickets(playerId: string) {
        const p = this.state.data.players[playerId];
        const pending: Ticket[] = [];
        // Draw 3 tickets
        for (let i = 0; i < 3; i++) {
            const t = this.state.data.ticketDeck?.pop();
            if (t) pending.push(t);
        }
        p.pendingTickets = pending;
        this.state.data.ticketDeckCount = this.state.data.ticketDeck?.length || 0;
        this.state.data.logs.push(`${p.name} drew destination tickets`);
        // Note: Turn does not end yet; it ends when player decides which to keep!
    }

    private keepTickets(playerId: string, keepTicketIds: string[]) {
        const p = this.state.data.players[playerId];
        if (!p.pendingTickets || p.pendingTickets.length === 0) return;
        if (keepTicketIds.length === 0) return; // Must keep at least 1 ticket

        const kept = p.pendingTickets.filter(t => keepTicketIds.includes(t.id));
        const discarded = p.pendingTickets.filter(t => !keepTicketIds.includes(t.id));

        // Add kept tickets to active tickets list
        p.tickets = [...p.tickets, ...kept];

        // Return discarded tickets to the bottom of the ticket deck
        if (this.state.data.ticketDeck) {
            this.state.data.ticketDeck = [...discarded, ...this.state.data.ticketDeck];
        } else {
            this.state.data.ticketDeck = discarded;
        }
        this.state.data.ticketDeckCount = this.state.data.ticketDeck.length;

        // Clear pending list
        p.pendingTickets = [];

        this.state.data.logs.push(`${p.name} kept ${kept.length} ticket(s)`);

        // Check ticket completion immediately
        this.checkTicketCompletion(playerId);

        this.nextTurn();
    }

    private claimRoute(playerId: string, routeId: string, cardsUsed: Partial<Record<TrainColor, number>>) {
        const route = this.state.data.routes.find(r => r.id === routeId);
        if (!route || route.owner) return;

        const p = this.state.data.players[playerId];
        const routeColor = route.color;
        const needed = route.length;

        // ── CARD REQUIREMENT VALIDATION ──
        let locosUsed = cardsUsed.locomotive || 0;
        let coloredUsed = 0;
        for (const [color, count] of Object.entries(cardsUsed)) {
            if (color !== 'locomotive') {
                coloredUsed += count;
            }
        }

        // 1. Total cards must match the route length
        if (coloredUsed + locosUsed !== needed) return;

        // 2. Player must actually possess these cards
        for (const [color, count] of Object.entries(cardsUsed)) {
            if ((p.trainCards[color as TrainColor] || 0) < count) return;
        }

        // 3. Validate ferry locomotive crossings
        if (route.type === RouteType.ferry) {
            const minLocos = route.locomotivesRequired || 1;
            if (locosUsed < minLocos) return;
        }

        // 4. Validate color matching
        if (routeColor !== TrainColor.any) {
            // Must use cards of the route's color + locomotives
            for (const color of Object.keys(cardsUsed)) {
                if (color !== 'locomotive' && color !== routeColor) {
                    return;
                }
            }
        } else {
            // Gray route: all non-locomotive cards must be of the same single color
            let singleColor: string | null = null;
            for (const color of Object.keys(cardsUsed)) {
                if (color !== 'locomotive') {
                    if (singleColor === null) {
                        singleColor = color;
                    } else if (singleColor !== color) {
                        return;
                    }
                }
            }
        }

        // ── CARD DEDUCTION ──
        for (const [color, count] of Object.entries(cardsUsed)) {
            p.trainCards[color as TrainColor] -= count;
        }

        // ── APPLY OWNERSHIP ──
        route.owner = playerId;
        p.trainsLeft -= route.length;
        p.score += this.getRoutePoints(route.length);
        this.state.data.logs.push(`${p.name} claimed route: ${cities[route.from].name} ➔ ${cities[route.to].name}`);

        // Recalculate ticket completion for ALL players (in case stations lease routes)
        for (const pid of this.state.data.playerOrder) {
            this.checkTicketCompletion(pid);
        }

        this.nextTurn();
    }

    private buildStation(playerId: string, cityId: string, cardsUsed: Partial<Record<TrainColor, number>>) {
        const p = this.state.data.players[playerId];
        if (p.stationsLeft <= 0 || p.stationsBuilt.includes(cityId)) return;

        // ── STATION CARD VALIDATION ──
        const needed = 4 - p.stationsLeft; // 1st station = 1 card, 2nd = 2, 3rd = 3
        let locosUsed = cardsUsed.locomotive || 0;
        let coloredUsed = 0;
        let singleColor: string | null = null;

        for (const [color, count] of Object.entries(cardsUsed)) {
            if (color !== 'locomotive') {
                coloredUsed += count;
                if (singleColor === null) {
                    singleColor = color;
                } else if (singleColor !== color) {
                    return; // Mixed colors not allowed for station building
                }
            }
        }

        if (coloredUsed + locosUsed !== needed) return;

        // Player must possess the cards
        for (const [color, count] of Object.entries(cardsUsed)) {
            if ((p.trainCards[color as TrainColor] || 0) < count) return;
        }

        // ── CARD DEDUCTION ──
        for (const [color, count] of Object.entries(cardsUsed)) {
            p.trainCards[color as TrainColor] -= count;
        }

        p.stationsLeft--;
        p.stationsBuilt.push(cityId);
        this.state.data.logs.push(`${p.name} built a station at ${cities[cityId].name}`);

        // Recalculate ticket completion for ALL players
        for (const pid of this.state.data.playerOrder) {
            this.checkTicketCompletion(pid);
        }

        this.nextTurn();
    }

    private checkTicketCompletion(playerId: string) {
        const p = this.state.data.players[playerId];
        if (!p) return;

        const pStations = p.stationsBuilt || [];

        // Build adjacency graph mapping
        const adj: Record<string, string[]> = {};
        for (const r of this.state.data.routes) {
            if (r.owner === playerId) {
                if (!adj[r.from]) adj[r.from] = [];
                if (!adj[r.to]) adj[r.to] = [];
                adj[r.from].push(r.to);
                adj[r.to].push(r.from);
            } else if (pStations.includes(r.from) || pStations.includes(r.to)) {
                // Station Leasing Rule: A station allows connection over another player's route incident to it
                if (!adj[r.from]) adj[r.from] = [];
                if (!adj[r.to]) adj[r.to] = [];
                adj[r.from].push(r.to);
                adj[r.to].push(r.from);
            }
        }

        // BFS path connectivity checking
        for (const ticket of p.tickets) {
            const visited = new Set<string>();
            const queue = [ticket.from];
            visited.add(ticket.from);
            let connected = false;

            while (queue.length > 0) {
                const curr = queue.shift()!;
                if (curr === ticket.to) {
                    connected = true;
                    break;
                }
                const neighbors = adj[curr] || [];
                for (const n of neighbors) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        queue.push(n);
                    }
                }
            }

            const wasCompleted = ticket.completed;
            ticket.completed = connected;

            if (connected && !wasCompleted) {
                p.score += ticket.points;
                this.state.data.logs.push(`${p.name} completed ticket: ${cities[ticket.from].name} ➔ ${cities[ticket.to].name} (+${ticket.points} pts)`);
            }
        }
    }

    private getRoutePoints(len: number): number {
        const pts: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 };
        return pts[len] || 0;
    }

    private nextTurn() {
        this.state.data.currentPlayerIndex = (this.state.data.currentPlayerIndex + 1) % this.state.data.playerOrder.length;
    }

    addPlayer(playerId: string, name: string): void {
        if (!this.state.data.players[playerId]) {
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

    getStateForPlayer(_playerId: string): any {
        return { data: this.state.data };
    }

    private assignColor(): string {
        const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#000000'];
        const used = Object.values(this.state.data.players).map(p => p.color);
        return colors.find(c => !used.includes(c)) || '#FFFFFF';
    }
}
