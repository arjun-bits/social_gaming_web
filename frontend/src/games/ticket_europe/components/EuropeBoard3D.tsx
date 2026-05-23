/**
 * EuropeBoard3D.tsx
 * True 2.5D top-down isometric view — board fills canvas like a board game.
 * Camera: [0, 22, 10] fov=45 → ~65° above horizon. Pan+zoom, no rotation.
 */
import React, { Suspense, useCallback, useMemo } from 'react';
import { Canvas }       from '@react-three/fiber';
import { MapControls }  from '@react-three/drei';
import * as THREE       from 'three';
import type { TTREStateData } from '../../../core/engine/ticket_europe/models';
import { TerrainMesh }      from './board3d/TerrainMesh';
import { OceanPlane }       from './board3d/OceanPlane';
import { TreeMesh }         from './board3d/TreeMesh';
import { OceanDecorations } from './board3d/OceanDecorations';
import { LighthouseMesh }   from './board3d/LighthouseMesh';
import { RouteMesh }        from './board3d/RouteMesh';
import { CityMarker }       from './board3d/CityMarker';
import { StationMarker }    from './board3d/StationMarker';
import { cities, initialRoutes } from '../../../core/engine/ticket_europe/boardData';

// ── Coordinate mapping ──────────────────────────────────────────────────
// boardData: x ∈ [0,1000], y ∈ [0,800]  →  3D: X ∈ [-12.25,+12.25], Z ∈ [-8.75,+8.75]
export function toWorld(x: number, y: number): [number, number] {
  return [
    (x / 1000) * 24.5 - 12.25,
    (y / 800)  * 17.5 - 8.75,
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
    <div style={{ width: '100%', height: '100%', background: '#0f2038' }}>
      <Canvas
        camera={{
          // TRUE 2.5D ISOMETRIC — top-down, ~65° above horizon
          // Europe spreads flat filling the canvas like a board game.
          position: [0, 22, 10],
          fov: 45,
          near: 0.1,
          far: 300,
        }}
        dpr={[1, 2]}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        frameloop="always"
        style={{ background: '#0f2038' }}
        onCreated={({ camera }) => {
          // Look slightly south of centre to account for southward board tilt
          camera.lookAt(0, 0, -2);
        }}
      >
        {/* ── Lighting — warm top-left sunlight with soft blue fill ── */}
        <ambientLight intensity={0.65} color="#d8e5f0" />
        <directionalLight
          position={[8, 25, 10]}
          intensity={1.20}
          color="#fff4df"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={70}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
        />
        {/* Soft fill from opposite side */}
        <directionalLight position={[-8, 18, -10]} intensity={0.32} color="#c0d8e8" />
        {/* Hemisphere: sky blue-green / ground forest */}
        <hemisphereLight args={['#dceef0', '#3a5a28', 0.50]} />

        {/* ── MapControls — pan + zoom, rotation LOCKED ── */}
        <MapControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          panSpeed={1.6}
          zoomSpeed={0.8}
          minDistance={10}
          maxDistance={38}
          screenSpacePanning={true}
          makeDefault
        />

        {/* ── Scene ── */}
        <Suspense fallback={null}>
          {/* ── Premium High-Definition Board Game Tray & Frames ── */}
          {/* Thick Dark Mahogany Base */}
          <mesh position={[0, -0.22, 0]} receiveShadow castShadow>
            <boxGeometry args={[26, 0.4, 19]} />
            <meshStandardMaterial color="#1a1108" roughness={0.8} metalness={0.2} />
          </mesh>

          {/* Wooden Borders framing the active board area */}
          {/* Top Border */}
          <mesh position={[0, -0.01, -9.5]} receiveShadow castShadow>
            <boxGeometry args={[26.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1508" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Bottom Border */}
          <mesh position={[0, -0.01, 9.5]} receiveShadow castShadow>
            <boxGeometry args={[26.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1508" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Left Border */}
          <mesh position={[-13, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 19]} />
            <meshStandardMaterial color="#2d1508" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Right Border */}
          <mesh position={[13, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 19]} />
            <meshStandardMaterial color="#2d1508" roughness={0.7} metalness={0.1} />
          </mesh>

          {/* Ocean base */}
          <OceanPlane />
          <OceanDecorations />

          {/* Land */}
          <TerrainMesh />
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
