export enum CardTeam {
    teamA = 'teamA',
    teamB = 'teamB',
    neutral = 'neutral',
    assassin = 'assassin',
}

export enum GamePhase {
    lobby = 'lobby',
    teamSetup = 'teamSetup',
    playing = 'playing',
    gameOver = 'gameOver',
}

export enum TurnPhase {
    givingClue = 'givingClue',
    guessing = 'guessing',
}

export class WordCard {
    word: string;
    team: CardTeam;
    isRevealed: boolean;

    constructor(word: string, team: CardTeam, isRevealed: boolean = false) {
        this.word = word;
        this.team = team;
        this.isRevealed = isRevealed;
    }

    toJson(isLeader: boolean): any {
        return {
            word: this.word,
            team: isLeader || this.isRevealed ? this.team : null,
            isRevealed: this.isRevealed,
        };
    }
}

export class Clue {
    word: string;
    count: number;
    givenBy: string;

    constructor(word: string, count: number, givenBy: string) {
        this.word = word;
        this.count = count;
        this.givenBy = givenBy;
    }
}

export class SecretSignalsState {
    grid: WordCard[];
    phase: GamePhase;
    currentTurn?: CardTeam;
    turnPhase?: TurnPhase;
    currentClue?: Clue;
    guessesRemaining: number;
    winner?: CardTeam;
    playerTeams: { [playerId: string]: CardTeam };
    playerIsLeader: { [playerId: string]: boolean };
    selectedCategory: string;
    teamARemaining: number;
    teamBRemaining: number;
    hoverCardIndex: number | null;
    hoverTeam: string | null;

    constructor(init: Partial<SecretSignalsState>) {
        this.grid = init.grid || [];
        this.phase = init.phase || GamePhase.lobby;
        this.currentTurn = init.currentTurn;
        this.turnPhase = init.turnPhase;
        this.currentClue = init.currentClue;
        this.guessesRemaining = init.guessesRemaining || 0;
        this.winner = init.winner;
        this.playerTeams = init.playerTeams || {};
        this.playerIsLeader = init.playerIsLeader || {};
        this.selectedCategory = init.selectedCategory || 'Standard';
        this.teamARemaining = init.teamARemaining || 0;
        this.teamBRemaining = init.teamBRemaining || 0;
        this.hoverCardIndex = init.hoverCardIndex ?? null;
        this.hoverTeam = init.hoverTeam ?? null;
    }

    toLeaderJson(): any {
        return {
            grid: this.grid.map(c => c.toJson(true)),
            phase: this.phase,
            currentTurn: this.currentTurn,
            turnPhase: this.turnPhase,
            currentClue: this.currentClue,
            guessesRemaining: this.guessesRemaining,
            winner: this.winner,
            playerTeams: this.playerTeams,
            playerIsLeader: this.playerIsLeader,
            selectedCategory: this.selectedCategory,
            teamARemaining: this.teamARemaining,
            teamBRemaining: this.teamBRemaining,
            hoverCardIndex: this.hoverCardIndex,
            hoverTeam: this.hoverTeam,
        };
    }

    toPublicJson(): any {
        return {
            grid: this.grid.map(c => c.toJson(false)),
            phase: this.phase,
            currentTurn: this.currentTurn,
            turnPhase: this.turnPhase,
            currentClue: this.currentClue,
            guessesRemaining: this.guessesRemaining,
            winner: this.winner,
            playerTeams: this.playerTeams,
            playerIsLeader: this.playerIsLeader,
            selectedCategory: this.selectedCategory,
            teamARemaining: this.teamARemaining,
            teamBRemaining: this.teamBRemaining,
        };
    }
}

export const wordCategories: { [key: string]: string[] } = {
    'Standard': [
        'APPLE', 'TRAIN', 'GHOST', 'FIRE', 'ICE', 'WIND', 'WATER', 'EARTH', 'MOON', 'SUN',
        'STAR', 'LION', 'TIGER', 'BEAR', 'DOG', 'CAT', 'BIRD', 'FISH', 'TREE', 'FLOWER',
        'ROCK', 'MOUNTAIN', 'RIVER', 'OCEAN', 'SKY', 'CLOUD', 'RAIN', 'SNOW', 'STORM', 'LIGHTNING',
        'SWORD', 'SHIELD', 'BOW', 'ARROW', 'KNIFE', 'AXE', 'HAMMER', 'SPEAR', 'CLUB', 'STAFF',
        'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'KNIGHT', 'WIZARD', 'WITCH', 'DRAGON', 'MONSTER', 'DEMON'
    ],
    'Tech': [
        'COMPUTER', 'PHONE', 'TABLET', 'WATCH', 'SCREEN', 'KEYBOARD', 'MOUSE', 'PRINTER', 'CAMERA', 'SPEAKER',
        'MICROPHONE', 'HEADPHONES', 'CHARGER', 'CABLE', 'BATTERY', 'WIFI', 'BLUETOOTH', 'INTERNET', 'NETWORK', 'SERVER',
        'DATABASE', 'SOFTWARE', 'HARDWARE', 'CODE', 'PROGRAM', 'APP', 'GAME', 'WEBSITE', 'BROWSER', 'EMAIL',
        'PASSWORD', 'HACKER', 'VIRUS', 'BUG', 'ERROR', 'CRASH', 'UPDATE', 'DOWNLOAD', 'UPLOAD', 'STREAM',
        'CLOUD', 'DATA', 'FILE', 'FOLDER', 'DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'MUSIC', 'MOVIE'
    ]
};
