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
    // Scale 0.55 — sized for top-down view (was designed for side-on camera)
    <group position={position} rotation={[0, rotY, 0]} scale={[0.55, 0.55, 0.55]}>
      {/* Hull */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.55, 0.09, 0.20]} />
        <meshLambertMaterial color={HULL_COLOR} />
      </mesh>
      {/* Mast */}
      <mesh position={[0.04, 0.34, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.50, 4]} />
        <meshLambertMaterial color={MAST_COLOR} />
      </mesh>
      {/* Main sail */}
      <mesh position={[0.06, 0.42, 0.02]}>
        <coneGeometry args={[0.20, 0.40, 3]} />
        <meshLambertMaterial color={SAIL_COLOR} side={THREE.DoubleSide} flatShading />
      </mesh>
      {/* Jib */}
      <mesh position={[-0.10, 0.36, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.10, 0.26, 3]} />
        <meshLambertMaterial color={SAIL2_COLOR} side={THREE.DoubleSide} flatShading />
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
