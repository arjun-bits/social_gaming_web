import React from 'react';
import { EuropeBoard3D } from './components/EuropeBoard3D';
import type { TTREStateData } from '../../core/engine/ticket_europe/models';

export function TVView({ gameState }: { gameState: TTREStateData }) {
    if (!gameState || !gameState.players)
        return <div className="text-white p-8 text-2xl animate-pulse">Loading Ticket to Ride Europe...</div>;

    const players = Object.values(gameState.players);
    const currentPlayer = gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]];
    const isGameOver = gameState.phase === 'game_over';

    return (
        <div className="w-full h-full text-white overflow-hidden relative"
            style={{ background: '#07111e', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── MAP — fills the entire screen ── */}
            <div className="absolute inset-0">
                <EuropeBoard3D gameState={gameState} interactive={false} />
            </div>

            {/* ── TOP HUD OVERLAY ── */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 pointer-events-none">

                {/* Game title */}
                <div className="px-5 py-3 rounded-2xl"
                    style={{
                        background: 'rgba(7,17,30,0.85)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-0.5">🚂 Board Game</div>
                    <div className="text-xl font-black tracking-tight text-white">Ticket to Ride</div>
                    <div className="text-sm font-bold tracking-widest"
                        style={{ color: '#00E5FF' }}>EUROPE</div>
                </div>

                {/* Current turn indicator */}
                {currentPlayer && !isGameOver && (
                    <div className="px-5 py-3 rounded-2xl text-right"
                        style={{
                            background: 'rgba(7,17,30,0.85)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${currentPlayer.color}55`,
                            boxShadow: `0 0 24px ${currentPlayer.color}33, 0 8px 32px rgba(0,0,0,0.5)`,
                        }}>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-0.5">Current Turn</div>
                        <div className="flex items-center gap-2.5 justify-end">
                            <div className="text-xl font-black" style={{ color: currentPlayer.color }}>
                                {currentPlayer.name}
                            </div>
                            <div className="w-4 h-4 rounded-full ring-2 ring-white/20"
                                style={{ backgroundColor: currentPlayer.color,
                                    boxShadow: `0 0 12px ${currentPlayer.color}` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            {currentPlayer.trainsLeft} trains left
                        </div>
                    </div>
                )}

                {/* Game Over banner */}
                {isGameOver && gameState.winner && (
                    <div className="px-6 py-4 rounded-2xl text-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(234,179,8,0.4)',
                        }}>
                        <div className="text-3xl mb-1">🏆</div>
                        <div className="text-sm font-black text-amber-400 uppercase tracking-widest">Game Over</div>
                        <div className="text-lg font-black text-white mt-0.5">
                            {gameState.players[gameState.winner]?.name} Wins!
                        </div>
                    </div>
                )}
            </div>

            {/* ── BOTTOM PLAYER SCOREBOARD ── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-5 pointer-events-none">
                <div className="flex gap-3 justify-center items-end flex-wrap">
                    {players.map(p => {
                        const isCurrent = p.id === currentPlayer?.id && !isGameOver;
                        return (
                            <div key={p.id}
                                className="rounded-2xl overflow-hidden"
                                style={{
                                    background: 'rgba(7,17,30,0.9)',
                                    backdropFilter: 'blur(20px)',
                                    border: isCurrent
                                        ? `1px solid ${p.color}`
                                        : '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: isCurrent
                                        ? `0 0 20px ${p.color}44, 0 8px 32px rgba(0,0,0,0.5)`
                                        : '0 4px 16px rgba(0,0,0,0.4)',
                                    minWidth: '140px',
                                    transform: isCurrent ? 'translateY(-4px)' : 'none',
                                    transition: 'all 0.3s ease',
                                }}>
                                {/* Player colour header */}
                                <div className="h-1.5" style={{ background: p.color }} />
                                <div className="p-4">
                                    {/* Name */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                                        <span className="font-black text-sm text-white">{p.name}</span>
                                        {isCurrent && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-wider"
                                                style={{ background: `${p.color}33`, color: p.color }}>
                                                TURN
                                            </span>
                                        )}
                                    </div>
                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-xl font-black text-white">{p.score}</div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider">pts</div>
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-slate-300">{p.trainsLeft}</div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider">🚂</div>
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-slate-300">{p.stationsLeft}</div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider">🏠</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
