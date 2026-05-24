export enum GamePhase {
    lobby = 'lobby',
    setup = 'setup',
    playing = 'playing',
    game_over = 'game_over'
}

export enum TrainColor {
    red = 'red',
    blue = 'blue',
    green = 'green',
    yellow = 'yellow',
    black = 'black',
    white = 'white',
    orange = 'orange',
    pink = 'pink',
    locomotive = 'locomotive', // wild
    any = 'any' // used for gray routes
}

export interface City {
    id: string;
    name: string;
    x: number;
    y: number;
}

export enum RouteType {
    normal = 'normal',
    ferry = 'ferry',
    tunnel = 'tunnel'
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
    pendingTickets: Ticket[]; // tickets awaiting keep/discard decision
    stationsBuilt: string[]; // city ids
}

export interface TTREStateData {
    phase: GamePhase;
    players: Record<string, PlayerState>;
    playerOrder: string[];
    currentPlayerIndex: number;
    openCards: TrainColor[];
    deckCount: number;
    ticketDeck: Ticket[];       // remaining ticket draw pile
    ticketDeckCount: number;
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
            ticketDeck: data.ticketDeck || [],
            ticketDeckCount: data.ticketDeckCount || 0,
            routes: data.routes || [],
            logs: data.logs || [],
            longestPathWinner: data.longestPathWinner,
            winner: data.winner
        };
    }
}
