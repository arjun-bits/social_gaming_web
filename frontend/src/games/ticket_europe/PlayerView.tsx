import React, { useState } from 'react';
import { EuropeBoard3D } from './components/EuropeBoard3D';
import type { TTREStateData } from '../../core/engine/ticket_europe/models';
import { initialRoutes } from '../../core/engine/ticket_europe/boardData';
import { p2pClient } from '../../lib/p2pClient';

const ROUTE_COLOR_HEX: Record<string, string> = {
    red: '#f03030', blue: '#2563eb', green: '#16a34a',
    yellow: '#d97706', black: '#334155', white: '#e2e8f0',
    pink: '#db2777', orange: '#ea580c', any: '#78716c',
};

const CARD_BG: Record<string, string> = {
    red: '#dc2626', blue: '#1d4ed8', green: '#15803d',
    yellow: '#ca8a04', black: '#1e293b', white: '#cbd5e1',
    pink: '#be185d', orange: '#c2410c', locomotive: '#6b7280', any: '#44403c',
};

export function PlayerView({ gameState, playerId }: { gameState: TTREStateData; playerId: string }) {
    const [tab, setTab] = useState<'map' | 'routes' | 'hand'>('map');
    const player = gameState.players[playerId];
    const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === playerId;

    // pan/zoom handled inside EuropeBoard3D via @react-three/drei MapControls

    if (!player) return <div className="text-white p-4">Loading player data...</div>;

    const handleCityClick  = (cityId: string)  =>
        p2pClient.send('action', { action: 'build_station', cityId, cardsUsed: {} }, 'HOST');
    const handleRouteClick = (routeId: string) =>
        p2pClient.send('action', { action: 'claim_route', routeId, cardsUsed: {} }, 'HOST');
    const handleDrawCard   = (color = 'deck') =>
        p2pClient.send('action', { action: 'draw_card', color }, 'HOST');

    const totalCards = Object.values(player.trainCards).reduce((a, b) => a + b, 0);
    const currentPlayerName = gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.name ?? '…';

    return (
        <div className="h-[100dvh] bg-[#07111e] flex flex-col text-white select-none overflow-hidden"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── HEADER ── */}
            <div className="shrink-0 bg-black/80 backdrop-blur-md border-b border-white/8 z-30"
                style={{ borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    {/* Player identity */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full ring-2 ring-white/30"
                            style={{ backgroundColor: player.color,
                                boxShadow: `0 0 8px ${player.color}88` }} />
                        <span className="font-black text-base tracking-tight">{player.name}</span>
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1 text-slate-400">
                            <span className="text-sm">🚂</span>{player.trainsLeft}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                            <span className="text-sm">🏠</span>{player.stationsLeft}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 font-black">
                            <span className="text-sm">⭐</span>{player.score}
                        </span>
                    </div>
                </div>
                {/* Turn indicator strip */}
                {isMyTurn ? (
                    <div className="mx-4 mb-2 px-3 py-1 rounded-full text-center text-xs font-black tracking-widest"
                        style={{ background: 'rgba(0,229,255,0.15)', color: '#00E5FF',
                            border: '1px solid rgba(0,229,255,0.35)' }}>
                        ✦ YOUR TURN — Pinch to zoom, tap route to claim ✦
                    </div>
                ) : (
                    <div className="mx-4 mb-2 px-3 py-1 rounded-full text-center text-[10px] font-bold tracking-widest text-slate-500"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        {currentPlayerName}'s turn
                    </div>
                )}
            </div>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 relative overflow-hidden">

                {/* MAP TAB — R3F 3D board (pan/zoom/pinch built-in) */}
                {tab === 'map' && (
                    <div className="absolute inset-0">
                        <EuropeBoard3D
                            gameState={gameState}
                            interactive={isMyTurn}
                            onCityClick={handleCityClick}
                            onRouteClick={handleRouteClick}
                        />
                    </div>
                )}

                {/* ROUTES TAB */}
                {tab === 'routes' && (
                    <div className="absolute inset-0 overflow-y-auto">
                        <div className="p-4 flex flex-col gap-2">
                            <h2 className="text-xs font-black uppercase tracking-widest mb-2"
                                style={{ color: '#00E5FF' }}>
                                {isMyTurn ? '🚂 Tap to claim a route' : 'Routes (view only)'}
                            </h2>
                            {initialRoutes.map(route => {
                                const routeState = gameState.routes.find(r => r.id === route.id);
                                const isClaimed = !!routeState?.owner;
                                const owner = isClaimed ? gameState.players[routeState!.owner!] : null;
                                const col = ROUTE_COLOR_HEX[route.color] || '#78716c';
                                const cityName = (id: string) =>
                                    id.charAt(0).toUpperCase() + id.slice(1);

                                return (
                                    <button
                                        key={route.id}
                                        disabled={isClaimed || !isMyTurn}
                                        onClick={() => handleRouteClick(route.id)}
                                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98]"
                                        style={{
                                            background: isClaimed
                                                ? 'rgba(255,255,255,0.03)'
                                                : isMyTurn
                                                    ? 'rgba(255,255,255,0.06)'
                                                    : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isClaimed
                                                ? 'rgba(255,255,255,0.06)'
                                                : isMyTurn
                                                    ? `${col}55`
                                                    : 'rgba(255,255,255,0.08)'}`,
                                            opacity: isClaimed ? 0.45 : 1,
                                        }}
                                    >
                                        {/* Color swatch */}
                                        <div className="w-4 h-4 rounded-full shrink-0 ring-1 ring-white/20"
                                            style={{ backgroundColor: col }} />

                                        {/* Route info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-bold truncate">
                                                {cityName(route.from)} → {cityName(route.to)}
                                            </p>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">
                                                {route.length} trains · {route.type} · {route.color}
                                            </p>
                                        </div>

                                        {/* Owner badge / claim CTA */}
                                        {owner ? (
                                            <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full"
                                                style={{ background: `${owner.color}22`, border: `1px solid ${owner.color}44` }}>
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: owner.color }} />
                                                <span className="text-[9px] font-bold" style={{ color: owner.color }}>{owner.name}</span>
                                            </div>
                                        ) : isMyTurn ? (
                                            <span className="text-[10px] font-black shrink-0 px-2 py-1 rounded-full"
                                                style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}>
                                                CLAIM
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* HAND TAB */}
                {tab === 'hand' && (
                    <div className="absolute inset-0 overflow-y-auto">
                        <div className="p-4 flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black uppercase tracking-widest"
                                    style={{ color: '#00E5FF' }}>Your Hand</h2>
                                <span className="text-xs text-slate-500 font-bold">{totalCards} cards</span>
                            </div>

                            {/* Card grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(player.trainCards).map(([color, count]) => count > 0 && (
                                    <div key={color}
                                        className="relative rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-white/10 shadow-lg overflow-hidden"
                                        style={{ background: `${CARD_BG[color] || '#334'}`, minHeight: '90px' }}>
                                        {/* Shine overlay */}
                                        <div className="absolute inset-0 pointer-events-none"
                                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                                        <span className="text-4xl font-black drop-shadow-lg relative z-10">{count}</span>
                                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-75 relative z-10">{color}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/8 pt-4"
                                style={{ borderTopColor: 'rgba(255,255,255,0.08)' }}>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                                    Draw Cards
                                </h3>
                                <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
                                    {gameState.openCards.map((color, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleDrawCard(color)}
                                            className="snap-center shrink-0 rounded-2xl transition-all active:scale-95 hover:-translate-y-1 border border-white/15 shadow-xl relative overflow-hidden"
                                            style={{
                                                width: '72px', height: '108px',
                                                background: CARD_BG[color] || '#334',
                                            }}
                                        >
                                            <div className="absolute inset-0 pointer-events-none"
                                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />
                                            <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] uppercase tracking-widest font-bold opacity-70">{color}</span>
                                        </button>
                                    ))}
                                    {/* Deck */}
                                    <button
                                        onClick={() => handleDrawCard('deck')}
                                        className="snap-center shrink-0 rounded-2xl flex flex-col items-center justify-center font-black text-white transition-all active:scale-95 hover:-translate-y-1 border shadow-xl relative overflow-hidden"
                                        style={{
                                            width: '72px', height: '108px',
                                            background: 'linear-gradient(135deg, #00E5FF, #0077FF)',
                                            borderColor: 'rgba(0,229,255,0.4)',
                                            boxShadow: '0 0 20px rgba(0,229,255,0.3)',
                                        }}
                                    >
                                        <span className="text-2xl">🂠</span>
                                        <span className="text-[9px] uppercase tracking-widest mt-1">Deck</span>
                                        <span className="text-[8px] opacity-60 mt-0.5">{gameState.deckCount}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Destination tickets */}
                            {player.tickets.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                                        Destination Tickets
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {player.tickets.map(ticket => (
                                            <div key={ticket.id}
                                                className="flex items-center justify-between rounded-xl px-4 py-3 border"
                                                style={{
                                                    background: ticket.completed
                                                        ? 'rgba(22,163,74,0.12)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    borderColor: ticket.completed
                                                        ? 'rgba(22,163,74,0.35)'
                                                        : 'rgba(255,255,255,0.08)',
                                                }}>
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {ticket.from} → {ticket.to}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                                        {ticket.completed ? '✓ Complete' : 'In progress'}
                                                    </p>
                                                </div>
                                                <span className="text-xl font-black"
                                                    style={{ color: ticket.completed ? '#22c55e' : '#f59e0b' }}>
                                                    {ticket.points}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── BOTTOM NAV ── */}
            <div className="shrink-0 z-30"
                style={{
                    background: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex">
                    {([
                        { id: 'map',    icon: '🗺',  label: 'Map'    },
                        { id: 'routes', icon: '🚂',  label: 'Routes' },
                        { id: 'hand',   icon: '🃏',  label: 'Hand'   },
                    ] as const).map(({ id, icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95"
                            style={{
                                color: tab === id ? '#00E5FF' : 'rgba(255,255,255,0.35)',
                                background: tab === id ? 'rgba(0,229,255,0.07)' : 'transparent',
                                borderTop: tab === id ? '2px solid #00E5FF' : '2px solid transparent',
                            }}
                        >
                            <span className="text-lg leading-none">{icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
