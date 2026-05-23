/**
 * OceanDecorations.tsx
 * Decorative sailboats scattered across the Mediterranean, Atlantic,
 * North Sea, and Baltic. Low-poly board-game style.
 */
import React from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';

// [mapX, mapY, rotationY]
const BOATS: Array<[number, number, number]> = [
  [60,  450, 0.5],    // Atlantic, west of Lisbon
  [90,  600, 1.2],    // Bay of Biscay
  [160, 700, 0.3],    // Western Mediterranean
  [600, 750, 2.1],    // Central Mediterranean
  [750, 680, 1.8],    // Eastern Mediterranean
  [870, 600, 0.8],    // Aegean
  [200, 80,  1.5],    // North Sea, west UK
  [420, 50,  0.9],    // North Sea, east
  [720, 120, 2.4],    // Baltic Sea
  [920, 200, 1.1],    // Gulf of Finland area
];

const HULL_COLOR   = new THREE.Color(0xc8b880);
const MAST_COLOR   = new THREE.Color(0x7a5830);
const SAIL_COLOR   = new THREE.Color(0xf0ebe0);
const SAIL2_COLOR  = new THREE.Color(0xe0d5c0);

function Sailboat({ position, rotY }: { position: THREE.Vector3; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Hull */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.55, 0.09, 0.20]} />
        <meshStandardMaterial color={HULL_COLOR} roughness={0.8} />
      </mesh>
      {/* Keel */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.06]} />
        <meshStandardMaterial color={new THREE.Color(0x9a7850)} roughness={0.8} />
      </mesh>
      {/* Mast */}
      <mesh position={[0.04, 0.36, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.56, 4]} />
        <meshStandardMaterial color={MAST_COLOR} roughness={0.85} />
      </mesh>
      {/* Main sail */}
      <mesh position={[0.06, 0.45, 0.02]}>
        <coneGeometry args={[0.20, 0.42, 3]} />
        <meshStandardMaterial
          color={SAIL_COLOR}
          side={THREE.DoubleSide}
          roughness={0.9}
          flatShading
        />
      </mesh>
      {/* Jib */}
      <mesh position={[-0.10, 0.38, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.10, 0.28, 3]} />
        <meshStandardMaterial
          color={SAIL2_COLOR}
          side={THREE.DoubleSide}
          roughness={0.9}
          flatShading
        />
      </mesh>
    </group>
  );
}

export function OceanDecorations() {
  return (
    <group>
      {BOATS.map(([mx, my, rotY], i) => {
        const [wx, wz] = toWorld(mx, my);
        return (
          <Sailboat
            key={i}
            position={new THREE.Vector3(wx, 0.04, wz)}
            rotY={rotY}
          />
        );
      })}
    </group>
  );
}
