/**
 * LighthouseMesh.tsx
 * Tall tapered lighthouse towers at coastal cities — matching the orange
 * towers visible in the target image.
 */
import React from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';

// [cityId, mapX, mapY, towerColor]
const LIGHTHOUSES: Array<[string, number, number, string]> = [
  ['lisbon',    285, 560,  '#d4702a'],   // Atlantic tower
  ['edinburgh', 222, 148,  '#b86828'],   // North Sea tower
  ['palermo',   360, 680,  '#d46828'],   // Mediterranean
  ['athina',    668, 628,  '#c86030'],   // Aegean coast
  ['stockholm', 662, 118,  '#b87840'],   // Baltic
  ['amsterdam', 448, 200,  '#b09050'],   // North Sea flat coast
];

const LAMP_COLOR = new THREE.Color(0xffe080);

function Lighthouse({ wx, wz, colorHex }: { wx: number; wz: number; colorHex: string }) {
  const towerColor = new THREE.Color(colorHex);
  const darkColor  = towerColor.clone().multiplyScalar(0.6);

  return (
    <group position={[wx, 0.04, wz]}>
      {/* Base platform */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.08, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.75} />
      </mesh>

      {/* Tower body — tapered */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.20, 1.28, 8]} />
        <meshStandardMaterial color={towerColor} roughness={0.65} flatShading />
      </mesh>

      {/* Stripe band */}
      <mesh position={[0, 0.60, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.12, 8]} />
        <meshStandardMaterial color={new THREE.Color(0xf8f4ec)} roughness={0.7} />
      </mesh>

      {/* Lamp room */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.14, 8]} />
        <meshStandardMaterial
          color={LAMP_COLOR}
          emissive={LAMP_COLOR}
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Roof cap */}
      <mesh position={[0, 1.56, 0]}>
        <coneGeometry args={[0.16, 0.18, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function LighthouseMesh() {
  return (
    <group>
      {LIGHTHOUSES.map(([id, mx, my, colorHex]) => {
        const [wx, wz] = toWorld(mx, my);
        return <Lighthouse key={id} wx={wx} wz={wz} colorHex={colorHex} />;
      })}
    </group>
  );
}
