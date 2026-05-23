/**
 * StationMarker.tsx
 * A colored pin/cylinder that appears above a city when a player builds a station there.
 * Animates in with a scale spring on mount.
 */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { City } from '../../../../core/engine/ticket_europe/models';
import { toWorld } from '../EuropeBoard3D';

interface Props {
  city: City;
  playerColor: string; // hex string like '#ef4444'
}

export function StationMarker({ city, playerColor }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  const [wx, wz] = toWorld(city.x, city.y);
  const wy = 0.38; // above the city hex marker

  // Animate in: scale spring 0 → 1
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    scaleRef.current = Math.min(1, scaleRef.current + delta * 4);
    groupRef.current.scale.setScalar(scaleRef.current);
  });

  const color = new THREE.Color(playerColor);

  return (
    <group ref={groupRef} position={[wx, wy, wz]} scale={0}>
      {/* Pole */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 6]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} flatShading />
      </mesh>

      {/* Flag / disc on top */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          flatShading
        />
      </mesh>

      {/* Glow ring */}
      <mesh position={[0, 0.38, 0]}>
        <torusGeometry args={[0.15, 0.015, 6, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
