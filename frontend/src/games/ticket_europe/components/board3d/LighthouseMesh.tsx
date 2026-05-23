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

function Lighthouse({ wx, wz, colorHex, baseY }: { wx: number; wz: number; colorHex: string; baseY: number }) {
  const towerColor = new THREE.Color(colorHex);
  const darkColor  = towerColor.clone().multiplyScalar(0.58);

  return (
    <group position={[wx, baseY, wz]}>
      {/* Base platform */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.22, 0.25, 0.08, 8]} />
        <meshLambertMaterial color={darkColor} />
      </mesh>

      {/* Tower body — tapered, shorter for top-down clarity */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.18, 0.72, 8]} />
        <meshLambertMaterial color={towerColor} flatShading />
      </mesh>

      {/* White stripe band */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.145, 0.145, 0.10, 8]} />
        <meshLambertMaterial color={new THREE.Color(0xf0ece4)} />
      </mesh>

      {/* Lamp room — emissive yellow */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 8]} />
        <meshStandardMaterial
          color={LAMP_COLOR}
          emissive={LAMP_COLOR}
          emissiveIntensity={0.90}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Conical roof */}
      <mesh position={[0, 0.98, 0]}>
        <coneGeometry args={[0.14, 0.16, 8]} />
        <meshLambertMaterial color={darkColor} />
      </mesh>
    </group>
  );
}

// Coastal city terrain elevations × 0.45 (matching TerrainMesh formula)
const LIGHTHOUSE_BASE_Y: Record<string, number> = {
  lisbon:    0.09,
  edinburgh: 0.14,
  palermo:   0.06,
  athina:    0.11,
  stockholm: 0.10,
  amsterdam: 0.01,
};

export function LighthouseMesh() {
  return (
    <group>
      {LIGHTHOUSES.map(([id, mx, my, colorHex]) => {
        const [wx, wz] = toWorld(mx, my);
        const baseY = LIGHTHOUSE_BASE_Y[id] ?? 0.04;
        return <Lighthouse key={id} wx={wx} wz={wz} colorHex={colorHex} baseY={baseY} />;
      })}
    </group>
  );
}
