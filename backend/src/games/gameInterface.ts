export interface GameInterface {
    gameId: string;
    isActive: boolean;
    init(): void;
    assignPlayers(playerIds: string[]): void;
    startPlaying(): void;
    handleAction(playerId: string, payload: any): void;
    getStateForPlayer(playerId: string): any;
    getFullState(): any;
}
