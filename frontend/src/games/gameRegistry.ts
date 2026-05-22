/**
 * Frontend Game Registry
 * Add new games here — the shell pages (Lobby, Host, TV, Player) are game-agnostic.
 */

import type { GameInterface } from '../core/engine/gameInterface';
import { SSGameEngine } from '../core/engine/secret_signals/engine';
import { TTREGameEngine } from '../core/engine/ticket_europe/engine';

export function createGameEngine(gameId: string): GameInterface | null {
  switch (gameId) {
    case 'secret_signals':
      return new SSGameEngine();
    case 'ticket_europe':
      return new TTREGameEngine();
    default:
      return null;
  }
}

export interface GameClientMeta {
  gameId: string;
  displayName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: string;
  tags: string[];
  accentColor: string;
  comingSoon?: boolean;
}

export const CLIENT_GAME_REGISTRY: GameClientMeta[] = [
  {
    gameId: 'secret_signals',
    displayName: 'Secret Signals',
    description: 'Two teams, one spymaster each. Give one-word clues to lead your operatives to the right cards — avoid the assassin!',
    minPlayers: 2,
    maxPlayers: 16,
    icon: '🕵️',
    tags: ['Word Game', 'Teams', '2–16 Players'],
    accentColor: '#00E5FF',
  },
  {
    gameId: 'ticket_europe',
    displayName: 'Ticket to Ride Europe',
    description: 'Build train routes across an isometric map of Europe. Claim routes, build stations, and complete your destination tickets!',
    minPlayers: 2,
    maxPlayers: 5,
    icon: '🚂',
    tags: ['Strategy', 'Trains', '2–5 Players'],
    accentColor: '#FF5733',
  },
  {
    gameId: 'neon_trivia',
    displayName: 'Neon Trivia',
    description: 'Fast-paced buzzer trivia — answer questions before your opponents and climb the leaderboard.',
    minPlayers: 2,
    maxPlayers: 20,
    icon: '⚡',
    tags: ['Trivia', 'Buzzer', '2–20 Players'],
    accentColor: '#FFD700',
    comingSoon: true,
  },
  {
    gameId: 'wavelength',
    displayName: 'Mind Wave',
    description: 'Dial in a concept on a spectrum. Can your team read your mind?',
    minPlayers: 2,
    maxPlayers: 12,
    icon: '🌊',
    tags: ['Party', 'Creative', '2–12 Players'],
    accentColor: '#A855F7',
    comingSoon: true,
  },
];

export function getClientGameMeta(gameId: string): GameClientMeta | undefined {
  return CLIENT_GAME_REGISTRY.find(g => g.gameId === gameId);
}
