import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { IsometricMap } from './components/IsometricMap';
import type { TTREStateData, TrainColor } from '../../core/engine/ticket_europe/models';
import { p2pClient } from '../../lib/p2pClient';

export function PlayerView({ gameState, playerId }: { gameState: TTREStateData, playerId: string }) {
    const [tab, setTab] = useState<'map' | 'hand'>('map');
    const player = gameState.players[playerId];

    if (!player) return <div className="text-white p-4">Loading player data...</div>;

    const handleCityClick = (cityId: string) => {
        // Build station action — goes via P2P to host's game engine
        p2pClient.send('action', { action: 'build_station', cityId, cardsUsed: {} }, 'HOST');
    };

    const handleRouteClick = (routeId: string) => {
        // Claim route action — goes via P2P to host's game engine
        p2pClient.send('action', { action: 'claim_route', routeId, cardsUsed: {} }, 'HOST');
    };

    const handleDrawCard = () => {
        p2pClient.send('action', { action: 'draw_card', color: 'deck' }, 'HOST');
    };

    return (
        <div className="h-[100dvh] bg-[#0A0A0F] flex flex-col text-white font-poppins">
            {/* Header */}
            <div className="p-4 bg-black border-b border-white/10 flex justify-between items-center z-10 shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="flex gap-4 text-sm font-bold text-[#6B7280]">
                    <span>🚂 {player.trainsLeft}</span>
                    <span>🏠 {player.stationsLeft}</span>
                    <span className="text-white">⭐ {player.score}</span>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 relative overflow-hidden">
                {tab === 'map' ? (
                    <TransformWrapper
                        initialScale={0.5}
                        minScale={0.2}
                        maxScale={3}
                        centerOnInit={true}
                        wheel={{ step: 0.1 }}
                        pinch={{ step: 5 }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <React.Fragment>
                                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                    <button onClick={() => zoomIn()} className="w-10 h-10 bg-black/80 rounded-full text-xl hover:bg-white/20 transition">+</button>
                                    <button onClick={() => zoomOut()} className="w-10 h-10 bg-black/80 rounded-full text-xl hover:bg-white/20 transition">-</button>
                                    <button onClick={() => resetTransform()} className="w-10 h-10 bg-black/80 rounded-full text-xl hover:bg-white/20 transition">⌂</button>
                                </div>
                                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                    <IsometricMap 
                                        gameState={gameState} 
                                        interactive={true} 
                                        onCityClick={handleCityClick}
                                        onRouteClick={handleRouteClick}
                                    />
                                </TransformComponent>
                            </React.Fragment>
                        )}
                    </TransformWrapper>
                ) : (
                    <div className="p-4 flex flex-col h-full gap-4 overflow-y-auto">
                        <h2 className="text-xl font-black uppercase tracking-widest text-[#00E5FF]">Your Hand</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(player.trainCards).map(([color, count]) => count > 0 && (
                                <div key={color} className="p-4 rounded-xl flex flex-col items-center justify-center border border-white/20 shadow-lg"
                                    style={{ backgroundColor: color === 'locomotive' ? '#888' : color === 'any' ? '#444' : color }}
                                >
                                    <span className="text-3xl font-black drop-shadow-md">{count}</span>
                                    <span className="text-xs uppercase tracking-widest opacity-80 mt-1">{color}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#6B7280] mb-4">Draw Cards</h2>
                            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                                {gameState.openCards.map((color, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => p2pClient.send('action', { action: 'draw_card', color }, 'HOST')}
                                        className="snap-center shrink-0 w-20 h-28 rounded-xl shadow-lg hover:-translate-y-2 transition-transform border border-white/20"
                                        style={{ backgroundColor: color === 'locomotive' ? '#888' : color === 'any' ? '#444' : color }}
                                    />
                                ))}
                                <button 
                                    onClick={handleDrawCard}
                                    className="snap-center shrink-0 w-20 h-28 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#0077FF] border border-white/20 shadow-[0_0_15px_#00E5FF44] flex items-center justify-center font-black text-xl hover:-translate-y-2 transition-transform"
                                >
                                    DECK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="flex bg-black border-t border-white/10 pb-safe">
                <button 
                    onClick={() => setTab('map')}
                    className={`flex-1 py-4 font-bold text-sm tracking-widest uppercase transition-colors ${tab === 'map' ? 'text-[#00E5FF] bg-white/5' : 'text-[#6B7280] hover:text-white'}`}
                >
                    🌍 Map
                </button>
                <button 
                    onClick={() => setTab('hand')}
                    className={`flex-1 py-4 font-bold text-sm tracking-widest uppercase transition-colors ${tab === 'hand' ? 'text-[#00E5FF] bg-white/5' : 'text-[#6B7280] hover:text-white'}`}
                >
                    🃏 Hand
                </button>
            </div>
        </div>
    );
}
