/**
 * CityMarker.tsx — Renders each city on the 3D board.
 * Slimmed down: landmarks + station variants extracted to ./stations/
 * Constants extracted to ./constants.ts
 */
import React, { useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { City } from '../../../../core/engine/ticket_europe/models';
import { graph } from '../../boardSceneGraph';
import { CITY_REGION, REGION_WALL, REGION_ROOF, LIGHTHOUSE_CITIES, LABEL_OFFSETS } from './constants';
import {
  StationBuilding,
  EiffelTower, OnionDomeCathedral, BigBen,
  RomanRotunda, GreekTemple, CanalHouses, EdinburghCastle,
} from './stations';

interface Props {
  city: City;
  interactive: boolean;
  onClick: (cityId: string) => void;
}

export const CityMarker = React.memo(function CityMarker({ city, interactive, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const cityNode = graph.cities[city.id];
  const wx = cityNode.worldPos.x;
  const wz = cityNode.worldPos.z;

  // Pre-computed elevation with guaranteed clearance
  const baseY = cityNode.stationY;

  const regionKey = cityNode.region;
  const wallHex = REGION_WALL[regionKey] ?? '#c8b888';
  const roofHex = REGION_ROOF[regionKey] ?? '#5a3820';

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) { setHovered(true); document.body.style.cursor = 'pointer'; }
  }, [interactive]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); if (interactive) onClick(city.id);
  }, [interactive, onClick, city.id]);

  // Calculate dynamic rounded black pill badge width based on name length
  const badgeWidth = city.name.length * 0.20 + 0.50;

  // Per-city label offsets for de-collision
  const labelOffset = LABEL_OFFSETS[city.id] ?? [0, 0, 0];

  // Render distinctive custom 3D landmark shapes for major cities
  const renderLandmark = () => {
    switch (city.id) {
      case 'paris': return <EiffelTower />;
      case 'moskva': return <OnionDomeCathedral />;
      case 'london': return <BigBen />;
      case 'roma': return <RomanRotunda />;
      case 'athina': return <GreekTemple />;
      case 'amsterdam': return <CanalHouses />;
      case 'edinburgh': return <EdinburghCastle />;
      default: return <StationBuilding wallHex={wallHex} roofHex={roofHex} cityId={city.id} />;
    }
  };

  // Lighthouse cities (marker handled separately in LighthouseMesh.tsx)
  if (LIGHTHOUSE_CITIES.has(city.id)) {
    return (
      <group position={[wx, baseY, wz]}>
        <Billboard position={[labelOffset[0], 1.2 + labelOffset[1], labelOffset[2]]}>
          {/* Connecting pin line */}
          <mesh position={[0, -0.6, -0.02]}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
            <meshBasicMaterial color="#ffffff" opacity={0.20} transparent />
          </mesh>
          {/* Rounded black pill badge backdrop */}
          <mesh position={[0, 0.16, -0.02]} receiveShadow={false}>
            <planeGeometry args={[badgeWidth, 0.50]} />
            <meshBasicMaterial color="#0b0f19" opacity={0.94} transparent depthWrite={false} />
          </mesh>
          <Text
            fontSize={0.34}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.16, 0]}
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {city.name.toUpperCase()}
          </Text>
        </Billboard>
      </group>
    );
  }

  // Calculate suitable elevation offset depending on the height of the landmark
  const labelY = city.id === 'paris' ? 0.65 : city.id === 'moskva' ? 0.52 : city.id === 'london' ? 0.55 : city.id === 'edinburgh' ? 0.58 : 0.85;

  return (
    <group
      ref={groupRef}
      position={[wx, baseY, wz]}
      scale={hovered ? [1.10, 1.10, 1.10] : [1, 1, 1]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {renderLandmark()}

      {/* Base glow disc for clear node identification */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.48, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.35} transparent depthWrite={false} />
      </mesh>

      {/* Floating Connecting Line from label to landmark */}
      <mesh position={[0, (labelY + 0.16) / 2, -0.02]}>
        <cylinderGeometry args={[0.004, 0.004, labelY + 0.16, 4]} />
        <meshBasicMaterial color="#ffffff" opacity={0.20} transparent />
      </mesh>

      {/* Label Billboards with premium rounded pill badges */}
      <Billboard position={[labelOffset[0], labelY + labelOffset[1], labelOffset[2]]}>
        <mesh position={[0, 0.16, -0.02]} receiveShadow={false}>
          <planeGeometry args={[badgeWidth, 0.50]} />
          <meshBasicMaterial color="#07111e" opacity={0.94} transparent depthWrite={false} />
        </mesh>
        <Text
          fontSize={0.38}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.16, 0]}
          fontWeight="bold"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {city.name.toUpperCase()}
        </Text>
      </Billboard>

      {/* Floating Train Station Building tooltip — always visible on hover */}
      {hovered && (
        <Billboard position={[0, labelY + 0.72, 0]}>
          <mesh receiveShadow={false}>
            <planeGeometry args={[5.0, 0.70]} />
            <meshBasicMaterial color="#050a14" opacity={0.94} transparent depthWrite={false} />
          </mesh>
          <Text
            fontSize={0.22}
            color="#ffd700"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.12, 0]}
          >
            {"BUILD TRAIN STATION"}
          </Text>
          <Text
            fontSize={0.18}
            color="#b0c5e0"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.14, 0]}
          >
            {"Requires 1-3 matching cards"}
          </Text>
        </Billboard>
      )}
    </group>
  );
});
