import React from 'react';
import type { City, Route, TTREStateData } from '../../../core/engine/ticket_europe/models';
import { cities as boardCities, initialRoutes } from '../../../core/engine/ticket_europe/boardData';

interface IsometricMapProps {
    gameState: TTREStateData | null;
    interactive?: boolean;
    onCityClick?: (cityId: string) => void;
    onRouteClick?: (routeId: string) => void;
}

export function IsometricMap({ gameState, interactive = false, onCityClick, onRouteClick }: IsometricMapProps) {
    const renderRoutes = () => {
        return initialRoutes.map(route => {
            const fromCity = boardCities[route.from];
            const toCity = boardCities[route.to];
            if (!fromCity || !toCity) return null;

            const isClaimed = gameState?.routes.find(r => r.id === route.id)?.owner;
            const strokeColor = isClaimed ? getPlayerColor(isClaimed) : (route.color === 'any' ? '#888' : route.color);

            return (
                <g 
                    key={route.id} 
                    className={`route-group ${interactive && !isClaimed ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => interactive && !isClaimed && onRouteClick?.(route.id)}
                >
                    <line
                        x1={fromCity.x}
                        y1={fromCity.y}
                        x2={toCity.x}
                        y2={toCity.y}
                        stroke={strokeColor}
                        strokeWidth="8"
                        strokeDasharray={route.type === 'ferry' ? '15,10' : route.type === 'tunnel' ? '20,20' : 'none'}
                        className="opacity-50"
                    />
                    {isClaimed && (
                        // Placed trains with 3D drop animation
                        <line
                            x1={fromCity.x}
                            y1={fromCity.y}
                            x2={toCity.x}
                            y2={toCity.y}
                            stroke={strokeColor}
                            strokeWidth="12"
                            className="drop-in-3d"
                        />
                    )}
                </g>
            );
        });
    };

    const renderCities = () => {
        return Object.values(boardCities).map(city => {
            const hasStation = gameState?.players ? Object.values(gameState.players).find(p => p.stationsBuilt.includes(city.id)) : null;

            return (
                <g 
                    key={city.id} 
                    className={`city-group ${interactive && !hasStation ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
                    onClick={() => interactive && !hasStation && onCityClick?.(city.id)}
                >
                    <circle cx={city.x} cy={city.y} r="12" fill="#333" stroke="#FFF" strokeWidth="3" />
                    <text x={city.x} y={city.y - 20} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" className="city-label drop-shadow-md">
                        {city.name}
                    </text>
                    {hasStation && (
                        <circle cx={city.x} cy={city.y} r="8" fill={hasStation.color} className="drop-in-3d" />
                    )}
                </g>
            );
        });
    };

    const getPlayerColor = (playerId: string) => {
        return gameState?.players[playerId]?.color || '#FFF';
    };

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-[#1a202c]">
            {/* The Isometric Container */}
            <div className="isometric-container w-[1000px] h-[800px] relative transition-transform duration-500 ease-out">
                <svg viewBox="0 0 1000 800" className="w-full h-full drop-shadow-2xl bg-[#004d40]/30 rounded-[100px]">
                    {/* Render connections first */}
                    {renderRoutes()}
                    {/* Render cities on top */}
                    {renderCities()}
                </svg>
            </div>
            
            <style>{`
                .isometric-container {
                    transform: rotateX(60deg) rotateZ(-45deg) scale(0.8);
                    transform-style: preserve-3d;
                }
                
                .city-label {
                    /* Inverse transform to make text readable */
                    transform: rotateZ(45deg) rotateX(-60deg);
                    transform-origin: center;
                }

                @keyframes dropIn3D {
                    0% {
                        transform: translateZ(500px);
                        opacity: 0;
                        box-shadow: 0 50px 20px rgba(0,0,0,0);
                    }
                    70% {
                        transform: translateZ(-20px);
                        opacity: 1;
                    }
                    100% {
                        transform: translateZ(0);
                        box-shadow: -10px 10px 15px rgba(0,0,0,0.5);
                    }
                }

                .drop-in-3d {
                    animation: dropIn3D 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-style: preserve-3d;
                    filter: drop-shadow(-5px 5px 5px rgba(0,0,0,0.6));
                }
            `}</style>
        </div>
    );
}
