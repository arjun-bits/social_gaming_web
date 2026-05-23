export interface GameInterface {
    gameId: string;
    isActive: boolean;
    displayName: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    init(): void;
    assignPlayers(playerIds: string[], nameMap?: Record<string, string>): void;
    startPlaying(usedWords?: Set<string>): void;
    handleAction(playerId: string, payload: any): void;
    getStateForPlayer(playerId: string): any;
    getFullState(): any;
}
