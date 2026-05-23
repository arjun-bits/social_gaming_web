/**
 * EuropeBoard3D.tsx
 * Low dramatic perspective camera — board appears like the target image:
 * Lisbon/Palermo large in foreground, Stockholm/Moskva small at back.
 * Includes: terrain, mountains, trees, sailboats, lighthouses, routes, cities.
 */
import React, { Suspense, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TTREStateData } from '../../../core/engine/ticket_europe/models';
import { TerrainMesh }      from './board3d/TerrainMesh';
import { OceanPlane }       from './board3d/OceanPlane';
import { MountainMesh }     from './board3d/MountainMesh';
import { TreeMesh }         from './board3d/TreeMesh';
import { OceanDecorations } from './board3d/OceanDecorations';
import { LighthouseMesh }   from './board3d/LighthouseMesh';
import { RouteMesh }        from './board3d/RouteMesh';
import { CityMarker }       from './board3d/CityMarker';
import { StationMarker }    from './board3d/StationMarker';
import { cities, initialRoutes } from '../../../core/engine/ticket_europe/boardData';

// ── Coordinate mapping ─────────────────────────────────────────────────
// boardData: x ∈ [0,1000], y ∈ [0,800]  →  3D: X ∈ [-10,+10], Z ∈ [-7,+7]
export function toWorld(x: number, y: number): [number, number] {
  return [
    (x / 1000) * 20 - 10,
    (y / 800)  * 14 - 7,
  ];
}

interface Props {
  gameState: TTREStateData | null;
  interactive: boolean;
  onCityClick?:  (cityId: string)  => void;
  onRouteClick?: (routeId: string) => void;
}

export function EuropeBoard3D({ gameState, interactive, onCityClick, onRouteClick }: Props) {
  const routes = gameState?.routes ?? initialRoutes;

  const playerColors = useMemo<Record<string, string>>(() => {
    if (!gameState) return {};
    const map: Record<string, string> = {};
    for (const route of gameState.routes) {
      if (route.owner && gameState.players[route.owner]) {
        map[route.id] = gameState.players[route.owner].color;
      }
    }
    return map;
  }, [gameState]);

  const handleCityClick  = useCallback((id: string) => { if (interactive) onCityClick?.(id);  }, [interactive, onCityClick]);
  const handleRouteClick = useCallback((id: string) => { if (interactive) onRouteClick?.(id); }, [interactive, onRouteClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a1e38' }}>
      <Canvas
        camera={{
          // LOW DRAMATIC perspective — near south coastline, looking north.
          // Creates foreshortening: south cities large, north cities small.
          position: [0, 9, 17],
          fov: 62,
          near: 0.1,
          far: 400,
        }}
        dpr={[1, 2]}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        frameloop="always"
        style={{ background: '#0a1e38' }}
        onCreated={({ camera }) => camera.lookAt(0, 0, -1)}
      >
        {/* ── Lighting ── */}
        <ambientLight intensity={0.65} color="#d8e8f0" />
        <directionalLight
          position={[10, 28, 14]}
          intensity={1.20}
          color="#fff8e0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight position={[-8, 10, -12]} intensity={0.28} color="#b0c8e8" />
        <hemisphereLight args={['#c8e8d0', '#2a4020', 0.45]} />

        {/* ── MapControls — pan + zoom, no rotation ── */}
        <MapControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          panSpeed={1.8}
          zoomSpeed={0.9}
          minDistance={8}
          maxDistance={50}
          screenSpacePanning={true}
          makeDefault
        />

        {/* ── Scene ── */}
        <Suspense fallback={null}>
          {/* Ocean */}
          <OceanPlane />
          <OceanDecorations />

          {/* Land */}
          <TerrainMesh />
          <MountainMesh />
          <TreeMesh />
          <LighthouseMesh />

          {/* Game elements */}
          <RouteMesh
            routes={routes}
            playerColors={playerColors}
            interactive={interactive}
            onRouteClick={handleRouteClick}
          />

          {/* Cities */}
          {Object.values(cities).map(city => {
            const playerStation = gameState
              ? Object.values(gameState.players).find(p => p.stationsBuilt.includes(city.id))
              : null;
            return (
              <React.Fragment key={city.id}>
                <CityMarker city={city} interactive={interactive} onClick={handleCityClick} />
                {playerStation && (
                  <StationMarker city={city} playerColor={playerStation.color} />
                )}
              </React.Fragment>
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}
