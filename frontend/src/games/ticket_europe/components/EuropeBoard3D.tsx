/**
 * EuropeBoard3D.tsx
 * True 2.5D top-down isometric view — board fills canvas like a board game.
 * Camera: [0, 22, 10] fov=45 → ~65° above horizon. Pan+zoom, no rotation.
 */
import React, { Suspense, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, BakeShadows, AdaptiveDpr, Preload } from '@react-three/drei';
import * as THREE from 'three';
import type { TTREStateData } from '../../../core/engine/ticket_europe/models';
import { TerrainMesh } from './board3d/TerrainMesh';
import { OceanPlane } from './board3d/OceanPlane';
import { TreeMesh } from './board3d/TreeMesh';
import { OceanDecorations } from './board3d/OceanDecorations';
import { LighthouseMesh } from './board3d/LighthouseMesh';
import { MountainMesh } from './board3d/MountainMesh';
import { RouteMesh } from './board3d/RouteMesh';
import { CityMarker } from './board3d/CityMarker';
import { StationMarker } from './board3d/StationMarker';
import { TableSurface } from './board3d/TableSurface';
import { cities, initialRoutes } from '../../../core/engine/ticket_europe/boardData';
import { RiverMesh } from './board3d/RiverMesh';

import { graph, toWorld } from '../boardSceneGraph';

// Re-export toWorld for backward compatibility
export { toWorld };

// Dev-mode validation: log any graph errors on first import
if (import.meta.env.DEV && graph.validationErrors.length > 0) {
  console.warn('[EuropeBoard3D] Board graph has validation errors — check console');
}

interface Props {
  gameState: TTREStateData | null;
  interactive: boolean;
  onCityClick?: (cityId: string) => void;
  onRouteClick?: (routeId: string) => void;
}

function CameraLimiter() {
  const { controls } = useThree();
  useFrame(() => {
    if (controls) {
      const target = (controls as any).target;
      if (target) {
        // Clamp OrbitControls target so user cannot pan off the board
        if (target.x < -18) target.x = -18;
        if (target.x > 18) target.x = 18;
        if (target.z < -13) target.z = -13;
        if (target.z > 13) target.z = 13;
      }
    }
  });
  return null;
}

/** Resets camera to default isometric position when exiting inspect mode */
function CameraResetOnExit({ inspectMode }: { inspectMode: boolean }) {
  const { camera, controls } = useThree();
  const wasInspecting = useRef(false);

  useEffect(() => {
    if (wasInspecting.current && !inspectMode) {
      // Snap camera back to default isometric position
      camera.position.set(18, 22, 22);
      camera.updateProjectionMatrix();
      if (controls) {
        (controls as any).target.set(0, 0, -1);
        (controls as any).update();
      }
    }
    wasInspecting.current = inspectMode;
  }, [inspectMode, camera, controls]);

  return null;
}

export function EuropeBoard3D({ gameState, interactive, onCityClick, onRouteClick }: Props) {
  const routes = gameState?.routes ?? initialRoutes;
  const [inspectMode, setInspectMode] = useState(false);

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

  const handleCityClick = useCallback((id: string) => { if (interactive) onCityClick?.(id); }, [interactive, onCityClick]);
  const handleRouteClick = useCallback((id: string) => { if (interactive) onRouteClick?.(id); }, [interactive, onRouteClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0d0906', position: 'relative' }}>
      {/* ── Inspect Mode Toggle Button ── */}
      <button
        onClick={() => setInspectMode(prev => !prev)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          border: inspectMode ? '2px solid #00e5ff' : '2px solid rgba(255,255,255,0.2)',
          borderRadius: 12,
          background: inspectMode
            ? 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,150,255,0.15))'
            : 'linear-gradient(135deg, rgba(20,20,30,0.85), rgba(30,30,45,0.85))',
          backdropFilter: 'blur(12px)',
          color: inspectMode ? '#00e5ff' : '#ffffff',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: inspectMode
            ? '0 0 20px rgba(0,229,255,0.3), inset 0 0 12px rgba(0,229,255,0.1)'
            : '0 4px 16px rgba(0,0,0,0.4)',
          textTransform: 'uppercase',
        }}
        title={inspectMode ? 'Click to return to Pan & Zoom mode' : 'Click to rotate the board and inspect behind stations'}
      >
        <span style={{ fontSize: 18 }}>{inspectMode ? '🔓' : '🔍'}</span>
        {inspectMode ? 'Exit Inspect' : 'Inspect Mode'}
      </button>

      {/* Mode indicator badge */}
      {inspectMode && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '8px 20px',
          borderRadius: 20,
          background: 'rgba(0,229,255,0.15)',
          border: '1px solid rgba(0,229,255,0.3)',
          backdropFilter: 'blur(8px)',
          color: '#00e5ff',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          🔄 Drag to rotate · Zoom locked · Click button to exit
        </div>
      )}

      <Canvas
        dpr={[1, 2]}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.NoToneMapping,
          toneMappingExposure: 1.0,
        }}
        frameloop="always"
        style={{ background: '#0d0906' }}
      >
        {/* TRUE DIAGONAL 3D ISOMETRIC VIEWPORT (Matches reference Image 2 perfectly) */}
        <OrthographicCamera
          makeDefault
          position={[18, 22, 22]}
          zoom={36}
          near={0.1}
          far={500}
        />

        {/* ── Lighting — Flat, uniform, even illumination (matches reference Image 2's matte board-game style) ── */}
        <ambientLight intensity={0.85} color="#ffffff" />
        
        {/* Primary directional light — soft, not too dramatic */}
        <directionalLight
          position={[10, 30, 15]}
          intensity={0.7}
          color="#fff8f0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={100}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-bias={-0.0004}
        />
        
        {/* Fill light from the other side for flat even illumination */}
        <directionalLight 
          position={[-12, 20, -8]} 
          intensity={0.45} 
          color="#f0f4ff" 
        />
        
        {/* Front fill to eliminate dark faces */}
        <directionalLight 
          position={[0, 15, 25]} 
          intensity={0.3} 
          color="#ffffff" 
        />
        
        <hemisphereLight args={['#ffffff', '#8899aa', 0.35]} />

        {/* ── OrbitControls — mode-dependent ── */}
        <OrbitControls
          enableRotate={inspectMode}
          enablePan={!inspectMode}
          enableZoom={!inspectMode}
          panSpeed={1.2}
          zoomSpeed={0.8}
          rotateSpeed={0.6}
          minZoom={14}
          maxZoom={150}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.48}
          screenSpacePanning={true}
          target={[0, 0, -1]}
          makeDefault
          mouseButtons={inspectMode ? {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: undefined as any,
            RIGHT: THREE.MOUSE.ROTATE,
          } : {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={inspectMode ? {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.ROTATE,
          } : {
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        {/* Camera helpers */}
        <CameraLimiter />
        <CameraResetOnExit inspectMode={inspectMode} />

        {/* ── Scene ── */}
        <Suspense fallback={null}>
          {/* Drei quality: bake shadows once, auto-reduce DPR, preload all assets */}
          <BakeShadows />
          <AdaptiveDpr pixelated />
          <Preload all />

          {/* ── Instanced Walnut Wood Plank table surface (2 draw calls) ── */}
          <TableSurface />

          {/* ── Premium High-Definition Board Game Tray & Frames (Enlarged to 32x24) ── */}
          {/* Thick Dark Mahogany Base - Lowered so ocean sits above it */}
          <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
            <boxGeometry args={[44, 0.16, 34]} />
            <meshStandardMaterial color="#140a04" roughness={0.76} metalness={0.15} />
          </mesh>

          {/* Satin Polished Mahogany Wooden Borders framing the active board area */}
          {/* Top Border */}
          <mesh position={[0, -0.01, -17.0]} receiveShadow castShadow>
            <boxGeometry args={[44.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Bottom Border */}
          <mesh position={[0, -0.01, 17.0]} receiveShadow castShadow>
            <boxGeometry args={[44.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Left Border */}
          <mesh position={[-22.0, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 34]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Right Border */}
          <mesh position={[22.0, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 34]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>

          {/* Polished Brass Corner Braces for deluxe tabletop board game styling */}
          {/* Top-Left Corner Brace */}
          <group position={[-21.7, 0.051, -16.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0, 0.24]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
          </group>
          {/* Top-Right Corner Brace */}
          <group position={[21.7, 0.051, -16.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0, 0.24]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
          </group>
          {/* Bottom-Left Corner Brace */}
          <group position={[-21.7, 0.051, 16.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0, -0.24]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
          </group>
          {/* Bottom-Right Corner Brace */}
          <group position={[21.7, 0.051, 16.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0, -0.24]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.12]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.9} />
            </mesh>
          </group>

          {/* Ocean base */}
          <OceanPlane />
          <OceanDecorations />

          {/* Land */}
          <TerrainMesh />
          <MountainMesh />
          <TreeMesh />
          <LighthouseMesh />
          <RiverMesh />

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
