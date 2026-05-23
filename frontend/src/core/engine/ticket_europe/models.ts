export const GamePhase = {
    lobby: 'lobby',
    setup: 'setup',
    playing: 'playing',
    game_over: 'game_over'
} as const;
export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

export const TrainColor = {
    red: 'red',
    blue: 'blue',
    green: 'green',
    yellow: 'yellow',
    black: 'black',
    white: 'white',
    orange: 'orange',
    pink: 'pink',
    locomotive: 'locomotive', // wild
    any: 'any' // used for gray routes
} as const;
export type TrainColor = typeof TrainColor[keyof typeof TrainColor];

export const RouteType = {
    normal: 'normal',
    ferry: 'ferry',
    tunnel: 'tunnel'
} as const;
export type RouteType = typeof RouteType[keyof typeof RouteType];

export interface City {
    id: string;
    name: string;
    x: number;
    y: number;
}

export interface Route {
    id: string;
    from: string; // city id
    to: string; // city id
    color: TrainColor;
    length: number;
    type: RouteType;
    locomotivesRequired?: number; // for ferries
    owner?: string; // player id who claimed it
}

export interface Ticket {
    id: string;
    from: string;
    to: string;
    points: number;
    completed?: boolean;
}

export interface PlayerState {
    id: string;
    name: string;
    color: string;
    trainsLeft: number;
    stationsLeft: number;
    score: number;
    trainCards: Record<TrainColor, number>;
    tickets: Ticket[];
    pendingTickets?: Ticket[]; // Destination tickets currently awaiting keep/discard choice
    stationsBuilt: string[]; // city ids
}

export interface TTREStateData {
    phase: GamePhase;
    players: Record<string, PlayerState>;
    playerOrder: string[];
    currentPlayerIndex: number;
    openCards: TrainColor[];
    deckCount: number;
    ticketDeckCount: number;
    ticketDeck?: Ticket[]; // The deck of destination tickets
    routes: Route[];
    logs: string[];
    longestPathWinner?: string;
    winner?: string;
}

export class TTREState {
    data: TTREStateData;

    constructor(data: Partial<TTREStateData> = {}) {
        this.data = {
            phase: data.phase || GamePhase.lobby,
            players: data.players || {},
            playerOrder: data.playerOrder || [],
            currentPlayerIndex: data.currentPlayerIndex || 0,
            openCards: data.openCards || [],
            deckCount: data.deckCount || 0,
            ticketDeckCount: data.ticketDeckCount || 0,
            routes: data.routes || [],
            logs: data.logs || [],
            longestPathWinner: data.longestPathWinner,
            winner: data.winner
        };
    }
}
