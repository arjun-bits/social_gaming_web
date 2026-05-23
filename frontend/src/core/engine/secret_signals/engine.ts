import type { GameInterface } from '../gameInterface';
import { SecretSignalsState, CardTeam, GamePhase, TurnPhase, WordCard, Clue, wordCategories, pickBoardWords } from './models';

export class SSGameEngine implements GameInterface {
    state: SecretSignalsState;

    constructor() {
        this.state = new SecretSignalsState({ phase: GamePhase.lobby });
    }

    get gameId(): string {
        return 'secret_signals';
    }

    get displayName(): string {
        return 'Secret Signals';
    }

    get description(): string {
        return 'Codenames-style word guessing — two teams battle it out with clues and deduction.';
    }

    get minPlayers(): number { return 2; }
    get maxPlayers(): number { return 16; }

    get isActive(): boolean {
        return this.state.phase === GamePhase.playing;
    }


    init(): void {
        this.state = new SecretSignalsState({
            grid: [],
            phase: GamePhase.teamSetup,
            playerTeams: this.state.playerTeams,
            playerIsLeader: this.state.playerIsLeader,
            selectedCategory: this.state.selectedCategory,
        });
    }

    assignPlayers(playerIds: string[]): void {
        this.autoAssignTeams(playerIds);
    }

    startPlaying(usedWords?: Set<string>): void {
        this.generateBoard(usedWords);
    }


    handleAction(playerId: string, payload: any): void {
        const action = payload.action;
        if (!action) return;

        switch (action) {
            case 'joinRole':
                if (payload.team) {
                    const cardTeam = payload.team === 'teamA' ? CardTeam.teamA : CardTeam.teamB;
                    this.assignTeam(playerId, cardTeam, !!payload.isLeader);
                }
                break;
            case 'joinTeam':
                const team = payload.team;
                if (team) {
                    const cardTeam = team === 'teamA' ? CardTeam.teamA : CardTeam.teamB;
                    this.assignTeam(playerId, cardTeam);
                }
                break;
            case 'joinRole':
                const roleTeam = payload.team === 'teamA' ? CardTeam.teamA : CardTeam.teamB;
                this.assignTeam(playerId, roleTeam, !!payload.isLeader);
                if (payload.isLeader) {
                    this._becomeSpymaster(playerId);
                }
                break;
            case 'becomeSpymaster':
                this._becomeSpymaster(playerId);
                break;
            case 'submitClue':
                if (payload.word && payload.count) {
                    this.submitClue(playerId, payload.word, payload.count);
                }
                break;
            case 'guess':
                if (payload.cardIndex !== undefined) {
                    this.makeGuess(playerId, payload.cardIndex);
                }
                break;
            case 'passTurn':
                this.passTurn(playerId);
                break;
            case 'newGame':
                this.generateBoard();
                break;
            case 'startPlaying':
                this.startPlaying();
                break;
            case 'autoAssignTeams':
                if (payload.playerIds && Array.isArray(payload.playerIds)) {
                    this.autoAssignTeams(payload.playerIds);
                }
                break;
            case 'changeCategory':
                const category = payload.category;
                if (category && wordCategories[category]) {
                    this.state.selectedCategory = category;
                }
                break;
            case 'hoverCard':
                this.state.hoverCardIndex = payload.cardIndex ?? null;
                this.state.hoverTeam = this.state.playerTeams[playerId] || null;
                break;
            case 'clearHover':
                this.state.hoverCardIndex = null;
                this.state.hoverTeam = null;
                break;
            case 'hostReveal':
                if (playerId === 'HOST' && payload.cardIndex !== undefined) {
                    this.hostReveal(payload.cardIndex);
                }
                break;
            case 'hostPassTurn':
                if (playerId === 'HOST') {
                    this._endTurn();
                }
                break;
        }
    }

    getStateForPlayer(playerId: string): any {
        // HOST always sees the full board (leader view) for oversight
        const isLeader = playerId === 'HOST' || this.state.playerIsLeader[playerId] || false;
        return isLeader ? this.state.toLeaderJson() : this.state.toPublicJson();
    }

    getFullState(): any {
        return this.state.toLeaderJson();
    }

    /** usedWords is passed in from the Room so word history persists across games */
    generateBoard(usedWords?: Set<string>): void {
        const sessionWords = usedWords ?? new Set<string>();
        const selectedWords = pickBoardWords(this.state.selectedCategory, sessionWords);

        // Fisher-Yates already used inside pickBoardWords; shuffle teams here too
        const teamPool: CardTeam[] = [
            ...Array(9).fill(CardTeam.teamA),
            ...Array(8).fill(CardTeam.teamB),
            ...Array(7).fill(CardTeam.neutral),
            CardTeam.assassin,
        ];
        // Fisher-Yates for team assignment
        for (let i = teamPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teamPool[i], teamPool[j]] = [teamPool[j], teamPool[i]];
        }

        const grid: WordCard[] = selectedWords.map((word, i) => new WordCard(word, teamPool[i]));

        this.state = new SecretSignalsState({
            grid,
            currentTurn: CardTeam.teamA,
            turnPhase: TurnPhase.givingClue,
            phase: GamePhase.playing,
            playerTeams: this.state.playerTeams,
            playerIsLeader: this.state.playerIsLeader,
            selectedCategory: this.state.selectedCategory,
            teamARemaining: 9,
            teamBRemaining: 8,
        });
    }

    assignTeam(playerId: string, team: CardTeam, isLeader: boolean = false): void {
        this.state.playerTeams[playerId] = team;
        this.state.playerIsLeader[playerId] = isLeader;
    }

    private _becomeSpymaster(playerId: string): void {
        const team = this.state.playerTeams[playerId];
        if (!team) return;

        this.state.playerIsLeader[playerId] = true;
    }

    autoAssignTeams(playerIds: string[]): void {
        // Never assign HOST to a team — only real players
        const realPlayers = playerIds.filter(id => id !== 'HOST');
        const unassigned = realPlayers.filter(id => !this.state.playerTeams[id]);
        const shuffled = [...unassigned].sort(() => Math.random() - 0.5);

        // Check if teams already have leaders
        let teamAHasLeader = Object.keys(this.state.playerIsLeader).some(id => this.state.playerIsLeader[id] && this.state.playerTeams[id] === CardTeam.teamA);
        let teamBHasLeader = Object.keys(this.state.playerIsLeader).some(id => this.state.playerIsLeader[id] && this.state.playerTeams[id] === CardTeam.teamB);

        for (let i = 0; i < shuffled.length; i++) {
            // Count current team sizes to balance
            const aCount = Object.values(this.state.playerTeams).filter(t => t === CardTeam.teamA).length;
            const bCount = Object.values(this.state.playerTeams).filter(t => t === CardTeam.teamB).length;
            
            const team = aCount <= bCount ? CardTeam.teamA : CardTeam.teamB;
            let isLeader = false;

            if (team === CardTeam.teamA && !teamAHasLeader) {
                isLeader = true;
                teamAHasLeader = true;
            } else if (team === CardTeam.teamB && !teamBHasLeader) {
                isLeader = true;
                teamBHasLeader = true;
            }

            this.assignTeam(shuffled[i], team, isLeader);
        }
        
        // Final sanity check for leaders: if no leader exists for a team, pick a random player from that team
        [CardTeam.teamA, CardTeam.teamB].forEach(team => {
            const teamMembers = realPlayers.filter(id => this.state.playerTeams[id] === team);
            const hasLeader = teamMembers.some(id => this.state.playerIsLeader[id]);
            if (teamMembers.length > 0 && !hasLeader) {
                this.assignTeam(teamMembers[0], team, true);
            }
        });
    }

    submitClue(playerId: string, word: string, count: number): boolean {
        if (this.state.phase !== GamePhase.playing) return false;
        if (this.state.turnPhase !== TurnPhase.givingClue) return false;

        const playerTeam = this.state.playerTeams[playerId];
        const isLeader = this.state.playerIsLeader[playerId] || false;
        if (playerTeam !== this.state.currentTurn || !isLeader) return false;

        const clueUpper = word.toUpperCase().trim();
        if (clueUpper.length === 0) return false;
        if (this.state.grid.some(c => c.word === clueUpper && !c.isRevealed)) return false;

        this.state.currentClue = new Clue(clueUpper, count, playerId);
        this.state.turnPhase = TurnPhase.guessing;
        this.state.guessesRemaining = count + 1;
        return true;
    }

    makeGuess(playerId: string, cardIndex: number): void {
        if (this.state.phase !== GamePhase.playing) return;
        if (this.state.turnPhase !== TurnPhase.guessing) return;

        const playerTeam = this.state.playerTeams[playerId];
        const isLeader = this.state.playerIsLeader[playerId] || false;
        if (playerTeam !== this.state.currentTurn || isLeader) return;

        if (cardIndex < 0 || cardIndex >= 25) return;
        const card = this.state.grid[cardIndex];
        if (card.isRevealed) return;

        card.isRevealed = true;
        this.state.guessesRemaining--;
        this.state.hoverCardIndex = null;
        this.state.hoverTeam = null;
        this._updateRemainingCounts();

        if (card.team === CardTeam.assassin) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = this.state.currentTurn === CardTeam.teamA ? CardTeam.teamB : CardTeam.teamA;
            return;
        }

        if (this.state.teamARemaining === 0) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = CardTeam.teamA;
            return;
        }
        if (this.state.teamBRemaining === 0) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = CardTeam.teamB;
            return;
        }

        if (card.team === this.state.currentTurn) {
            if (this.state.guessesRemaining <= 0) {
                this._endTurn();
            }
        } else {
            this._endTurn();
        }
    }

    passTurn(playerId: string): void {
        const playerTeam = this.state.playerTeams[playerId];
        if (playerTeam !== this.state.currentTurn) return;
        if (this.state.turnPhase !== TurnPhase.guessing) return;
        this._endTurn();
    }

    private _endTurn(): void {
        this.state.currentTurn = this.state.currentTurn === CardTeam.teamA ? CardTeam.teamB : CardTeam.teamA;
        this.state.turnPhase = TurnPhase.givingClue;
    }

    private _updateRemainingCounts(): void {
        this.state.teamARemaining = this.state.grid.filter(c => c.team === CardTeam.teamA && !c.isRevealed).length;
        this.state.teamBRemaining = this.state.grid.filter(c => c.team === CardTeam.teamB && !c.isRevealed).length;
    }

    hostReveal(cardIndex: number): void {
        if (this.state.phase !== GamePhase.playing) return;
        if (cardIndex < 0 || cardIndex >= 25) return;
        
        const card = this.state.grid[cardIndex];
        if (card.isRevealed) return;

        card.isRevealed = true;
        
        if (this.state.turnPhase === TurnPhase.guessing) {
            this.state.guessesRemaining--;
        }

        this._updateRemainingCounts();

        if (card.team === CardTeam.assassin) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = this.state.currentTurn === CardTeam.teamA ? CardTeam.teamB : CardTeam.teamA;
            return;
        }

        if (this.state.teamARemaining === 0) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = CardTeam.teamA;
            return;
        }
        if (this.state.teamBRemaining === 0) {
            this.state.phase = GamePhase.gameOver;
            this.state.winner = CardTeam.teamB;
            return;
        }

        if (this.state.turnPhase === TurnPhase.guessing) {
            if (card.team !== this.state.currentTurn || this.state.guessesRemaining <= 0) {
                this._endTurn();
            }
        }
    }
}
