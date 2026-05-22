import { GameInterface } from './gameInterface';
import { SSGameEngine } from './secret_signals/engine';

export interface GameMeta {
    gameId: string;
    displayName: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    icon: string;
    tags: string[];
    createEngine: () => GameInterface;
}

export const GAME_REGISTRY: GameMeta[] = [
    {
        gameId: 'secret_signals',
        displayName: 'Secret Signals',
        description: 'Two teams, one spymaster each. Give one-word clues to lead your operatives to the right words — avoid the assassin!',
        minPlayers: 2,
        maxPlayers: 16,
        icon: '🕵️',
        tags: ['Word Game', 'Teams', '2–16 Players'],
        createEngine: () => new SSGameEngine(),
    },
    // Future games go here:
    // {
    //   gameId: 'neon_trivia',
    //   displayName: 'Neon Trivia',
    //   description: 'Fast-paced trivia with buzzer racing and powerups.',
    //   minPlayers: 2, maxPlayers: 20,
    //   icon: '⚡',
    //   tags: ['Trivia', 'Solo', '2–20 Players'],
    //   createEngine: () => new NeonTriviaEngine(),
    // },
];

export function getGameMeta(gameId: string): GameMeta | undefined {
    return GAME_REGISTRY.find(g => g.gameId === gameId);
}

export function createGameEngine(gameId: string): GameInterface | undefined {
    const meta = getGameMeta(gameId);
    return meta?.createEngine();
}

/** Public metadata suitable for REST responses (no factory function) */
export function getPublicRegistry(): Omit<GameMeta, 'createEngine'>[] {
    return GAME_REGISTRY.map(({ createEngine: _, ...rest }) => rest);
}
