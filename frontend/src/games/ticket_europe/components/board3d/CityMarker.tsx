/**
 * CityMarker.tsx — 3D station building (scaled, varied by region)
 * + Billboard white text label floating above.
 */
import React, { useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import type { City } from '../../../../core/engine/ticket_europe/models';
import { toWorld } from '../EuropeBoard3D';

const REGION_WALL: Record<string, string> = {
  british: '#c0b090',  nordic:  '#b8a888',  western: '#c8b888',
  alpine:  '#c4b8a0',  iberian: '#c89860',  italian: '#c89870',
  eastern: '#bca880',  russian: '#bca070',
};
const REGION_ROOF: Record<string, string> = {
  british: '#5a3820',  nordic:  '#7a2818',  western: '#6a4020',
  alpine:  '#506070',  iberian: '#884018',  italian: '#804018',
  eastern: '#4a5830',  russian: '#6a3018',
};
const CITY_REGION: Record<string, string> = {
  london: 'british',   edinburgh: 'british',
  paris: 'western',    amsterdam: 'western',  brussels: 'western',  frankfurt: 'western',
  madrid: 'iberian',   lisbon: 'iberian',     barcelona: 'iberian', marseille: 'western',
  roma: 'italian',     napoli: 'italian',     palermo: 'italian',   venezia: 'italian',
  zurich: 'alpine',    munchen: 'alpine',     wien: 'alpine',       berlin: 'alpine',
  stockholm: 'nordic', copenhagen: 'nordic',
  warszawa: 'eastern', budapest: 'eastern',   zagreb: 'eastern',
  sarajevo: 'eastern', sofia: 'eastern',      bucuresti: 'eastern', athina: 'eastern',
  kyiv: 'russian',     moskva: 'russian',
};

// Cities that get lighthouses instead of station buildings (skip here)
const LIGHTHOUSE_CITIES = new Set(['lisbon', 'edinburgh', 'palermo', 'athina', 'stockholm', 'amsterdam']);

// Approximate terrain elevation per city (matches TerrainMesh CITY_ELEVATION * 2.2)
const CITY_Y: Record<string, number> = {
  zurich: 1.65, munchen: 1.21, wien: 0.77, frankfurt: 0.35, marseille: 0.66,
  roma: 0.40, venezia: 0.48, napoli: 0.44, barcelona: 0.77, madrid: 0.92,
  lisbon: 0.48, palermo: 0.33, sarajevo: 1.06, sofia: 0.77, zagreb: 0.84,
  budapest: 0.40, bucuresti: 0.26, athina: 0.62, berlin: 0.13, warszawa: 0.11,
  amsterdam: 0.09, brussels: 0.11, paris: 0.20, london: 0.15, edinburgh: 0.79,
  stockholm: 0.62, copenhagen: 0.20, kyiv: 0.13, moskva: 0.11,
};

function StationBuilding({ wallHex, roofHex }: { wallHex: string; roofHex: string }) {
  const wallCol = new THREE.Color(wallHex);
  const roofCol = new THREE.Color(roofHex);
  const platCol = new THREE.Color('#c0b08a');
  const winCol  = new THREE.Color('#5878b0');

  return (
    <group scale={[0.82, 0.82, 0.82]}>
      {/* Platform */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.06, 0.68]} />
        <meshStandardMaterial color={platCol} roughness={0.88} />
      </mesh>
      {/* Main hall */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.66, 0.36, 0.46]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} />
      </mesh>
      {/* Barrel vault roof */}
      <mesh position={[0, 0.46, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.68, 10, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={roofCol} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Wings */}
      {([-1, 1] as const).map(side => (
        <group key={side}>
          <mesh position={[side * 0.50, 0.14, 0]} castShadow>
            <boxGeometry args={[0.24, 0.22, 0.42]} />
            <meshStandardMaterial color={wallCol} roughness={0.72} />
          </mesh>
          <mesh position={[side * 0.50, 0.27, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.26, 6, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={roofCol} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* Windows */}
      {[-0.18, 0, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0.238]}>
          <boxGeometry args={[0.09, 0.13, 0.01]} />
          <meshStandardMaterial color={winCol} roughness={0.1} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

interface Props {
  city: City;
  interactive: boolean;
  onClick: (cityId: string) => void;
}

export function CityMarker({ city, interactive, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const [wx, wz] = toWorld(city.x, city.y);
  const baseY    = CITY_Y[city.id] ?? 0.20;

  const regionKey = CITY_REGION[city.id] ?? 'eastern';
  const wallHex   = REGION_WALL[regionKey] ?? '#c8b888';
  const roofHex   = REGION_ROOF[regionKey] ?? '#5a3820';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.scale.setScalar(hovered ? 1 + Math.sin(clock.elapsedTime * 8) * 0.04 : 1);
  });

  const handleOver  = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) { setHovered(true); document.body.style.cursor = 'pointer'; }
  }, [interactive]);

  const handleOut   = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); if (interactive) onClick(city.id);
  }, [interactive, onClick, city.id]);

  // Skip building for lighthouse cities (they have their own component)
  if (LIGHTHOUSE_CITIES.has(city.id)) {
    return (
      <group position={[wx, baseY, wz]}>
        <Billboard position={[0, 1.8, 0]}>
          <Text
            fontSize={0.52}
            color="white"
            outlineColor="#000000"
            outlineWidth={0.06}
            anchorX="center"
            anchorY="bottom"
          >
            {city.name.toUpperCase()}
          </Text>
        </Billboard>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={[wx, baseY, wz]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <StationBuilding wallHex={wallHex} roofHex={roofHex} />

      {/* Floating billboard name — always readable, faces camera */}
      <Billboard position={[0, 1.2, 0]}>
        <Text
          fontSize={0.52}
          color="white"
          outlineColor="#000000"
          outlineWidth={0.06}
          anchorX="center"
          anchorY="bottom"
        >
          {city.name.toUpperCase()}
        </Text>
      </Billboard>
    </group>
  );
}
