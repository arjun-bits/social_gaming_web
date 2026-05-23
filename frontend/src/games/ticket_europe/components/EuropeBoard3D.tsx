/**
 * EuropeBoard3D.tsx
 * True 2.5D top-down isometric view — board fills canvas like a board game.
 * Camera: [0, 22, 10] fov=45 → ~65° above horizon. Pan+zoom, no rotation.
 */
import React, { Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
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
import { cities, initialRoutes } from '../../../core/engine/ticket_europe/boardData';
import { RiverMesh } from './board3d/RiverMesh';

// ── Coordinate mapping ──────────────────────────────────────────────────
// boardData: x ∈ [0,1000], y ∈ [0,800]  →  3D: X ∈ [-14,+14], Z ∈ [-10,+10]
export function toWorld(x: number, y: number): [number, number] {
  return [
    (x / 1000) * 28 - 14,
    (y / 800) * 20 - 10,
  ];
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
        if (target.x < -14) target.x = -14;
        if (target.x > 14) target.x = 14;
        if (target.z < -10) target.z = -10;
        if (target.z > 10) target.z = 10;
      }
    }
  });
  return null;
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

  const handleCityClick = useCallback((id: string) => { if (interactive) onCityClick?.(id); }, [interactive, onCityClick]);
  const handleRouteClick = useCallback((id: string) => { if (interactive) onRouteClick?.(id); }, [interactive, onRouteClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0d0906' }}>
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
          zoom={42}
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

        {/* ── OrbitControls — pan + zoom, rotation LOCKED (Locks true 3D diagonal isometric view) ── */}
        <OrbitControls
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          panSpeed={1.2}
          zoomSpeed={0.8}
          minZoom={18}
          maxZoom={120}
          screenSpacePanning={true}
          target={[0, 0, -1]}
          makeDefault
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.PAN,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        {/* Limit camera viewport off-board */}
        <CameraLimiter />

        {/* ── Scene ── */}
        <Suspense fallback={null}>
          {/* ── High-definition tactile Walnut Wood Plank table surface (organic planks + HD grain) ── */}
          <group position={[0, -0.42, 0]}>
            {Array.from({ length: 28 }).map((_, i) => {
              // Planks run vertically (along Z). Width: 5.0, dark spacing gap: 0.1
              const xPos = (i - 13.5) * 5.1;
              const shades = ['#22140a', '#291b0f', '#2f1f13', '#332317'];
              // Fix float index bug to avoid undefined color output (resolved grey/white table issue)
              const index = Math.floor(Math.abs(Math.sin(i * 12.7) * shades.length)) % shades.length;
              const color = shades[index];
              return (
                <group key={i} position={[xPos, 0, 0]}>
                  {/* Base Plank */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[5.0, 100]} />
                    <meshStandardMaterial color={color} roughness={0.85} metalness={0.06} />
                  </mesh>
                  {/* Subtle organic dark wood grain stripes running along the Z axis */}
                  <mesh position={[-1.2, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[0.06, 100]} />
                    <meshStandardMaterial color="#120803" roughness={0.9} transparent opacity={0.35} />
                  </mesh>
                  <mesh position={[0.8, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[0.08, 100]} />
                    <meshStandardMaterial color="#120803" roughness={0.9} transparent opacity={0.35} />
                  </mesh>
                </group>
              );
            })}
          </group>

          {/* ── Premium High-Definition Board Game Tray & Frames (Enlarged to 32x24) ── */}
          {/* Thick Dark Mahogany Base - Lowered so ocean sits above it */}
          <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
            <boxGeometry args={[36, 0.16, 28]} />
            <meshStandardMaterial color="#140a04" roughness={0.76} metalness={0.15} />
          </mesh>

          {/* Satin Polished Mahogany Wooden Borders framing the active board area */}
          {/* Top Border */}
          <mesh position={[0, -0.01, -14.0]} receiveShadow castShadow>
            <boxGeometry args={[36.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Bottom Border */}
          <mesh position={[0, -0.01, 14.0]} receiveShadow castShadow>
            <boxGeometry args={[36.4, 0.12, 0.4]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Left Border */}
          <mesh position={[-18.0, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 28]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>
          {/* Right Border */}
          <mesh position={[18.0, -0.01, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.12, 28]} />
            <meshStandardMaterial color="#2d1305" roughness={0.68} metalness={0.12} />
          </mesh>

          {/* Polished Brass Corner Braces for deluxe tabletop board game styling */}
          {/* Top-Left Corner Brace */}
          <group position={[-17.7, 0.051, -13.7]}>
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
          <group position={[17.7, 0.051, -13.7]}>
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
          <group position={[-17.7, 0.051, 13.7]}>
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
          <group position={[17.7, 0.051, 13.7]}>
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
