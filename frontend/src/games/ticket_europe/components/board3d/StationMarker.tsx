/**
 * StationMarker.tsx
 * A colored pin/cylinder that appears above a city when a player builds a station there.
 * Dynamically positioned on the terrain surface. Animates in with a scale spring on mount.
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { City } from '../../../../core/engine/ticket_europe/models';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

interface Props {
  city: City;
  playerColor: string; // hex string like '#ef4444'
}

export function StationMarker({ city, playerColor }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  const [wx, wz] = toWorld(city.x, city.y);
  // Dynamic terrain-aware positioning
  const wy = getTerrainHeight(city.x, city.y) + 0.05;

  // Animate in: scale spring 0 → 1
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    scaleRef.current = Math.min(1, scaleRef.current + delta * 4);
    groupRef.current.scale.setScalar(scaleRef.current * 1.6);
  });

  const color = new THREE.Color(playerColor);

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={0}>
      {/* Pole */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} flatShading />
      </mesh>

      {/* Flag / disc on top */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.07, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.3}
          flatShading
        />
      </mesh>

      {/* Glow ring */}
      <mesh position={[0, 0.46, 0]}>
        <torusGeometry args={[0.18, 0.018, 6, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Base glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.22, 12]} />
        <meshBasicMaterial color={color} opacity={0.35} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
