import React from 'react';
import { IsometricMap } from './components/IsometricMap';
import type { TTREStateData } from '../../core/engine/ticket_europe/models';

export function TVView({ gameState }: { gameState: TTREStateData }) {
    if (!gameState || !gameState.players) return <div className="text-white p-8">Loading Ticket to Ride...</div>;

    const players = Object.values(gameState.players);

    return (
        <div className="w-full h-full bg-[#0A0A0F] text-white overflow-hidden relative font-poppins">
            
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#004d40]/20 to-[#0A0A0F] pointer-events-none" />

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10 pointer-events-none">
                <div>
                    <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        Ticket to Ride Europe
                    </h1>
                    <div className="text-xl text-[#00E5FF] font-bold tracking-widest uppercase mt-2 drop-shadow-md">
                        {gameState.phase === 'game_over' ? 'GAME OVER' : 'PLAYING'}
                    </div>
                </div>

                {/* Turn Indicator */}
                <div className="text-right">
                    <div className="text-sm text-[#6B7280] uppercase tracking-[0.2em] mb-1">Current Turn</div>
                    <div className="text-3xl font-black" style={{ color: gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.color }}>
                        {gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.name || 'Waiting...'}
                    </div>
                </div>
            </div>

            {/* The Map (Center) */}
            <div className="absolute inset-0 flex items-center justify-center pt-20">
                <IsometricMap gameState={gameState} interactive={false} />
            </div>

            {/* Player Leaderboard (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full p-8 z-10 pointer-events-none">
                <div className="flex gap-6 justify-center items-end">
                    {players.map(p => (
                        <div key={p.id} className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-w-[200px] shadow-2xl flex flex-col gap-2">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                                <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                                <span className="font-bold text-xl">{p.name}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[#6B7280] text-xs uppercase tracking-widest">Score</span>
                                <span className="text-3xl font-black text-white">{p.score}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#6B7280] text-xs uppercase tracking-widest">Trains</span>
                                <span className="text-lg font-bold">{p.trainsLeft}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#6B7280] text-xs uppercase tracking-widest">Stations</span>
                                <span className="text-lg font-bold">{p.stationsLeft}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
