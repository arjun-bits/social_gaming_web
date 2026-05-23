/**
 * OceanDecorations.tsx
 * Decorative sailboats and cargo ships scattered across the Mediterranean, Atlantic,
 * North Sea, and Baltic. Low-poly board-game style with proper boat shapes.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';

// [mapX, mapY, rotationY]
const BOATS: Array<[number, number, number]> = [
  [60, 450, 0.5],    // Atlantic, west of Lisbon
  [90, 600, 1.2],    // Bay of Biscay
  [160, 700, 0.3],    // Western Mediterranean
  [600, 750, 2.1],    // Central Mediterranean
  [870, 600, 0.8],    // Aegean
  [200, 80, 1.5],    // North Sea, west UK
  [420, 50, 0.9],    // North Sea, east
  [720, 120, 2.4],    // Baltic Sea
  [920, 200, 1.1],    // Gulf of Finland area
];

const SHIPS: Array<[number, number, number]> = [
  [40, 200, 0.8],    // North Atlantic
  [740, 780, 2.3],   // East Mediterranean
  [520, 150, 0.2],   // Kattegat / Baltic entry
  [220, 15, 1.4],    // Norwegian Sea
];

// Build a boat hull shape (pointed bow) as BufferGeometry
function makeHullGeometry(length: number, width: number, height: number): THREE.BufferGeometry {
  const hl = length / 2;
  const hw = width / 2;
  const hh = height / 2;
  const bowX = hl + length * 0.25; // pointed bow extends forward

  // 10 vertices: 4 stern corners (top/bottom), 4 mid-hull (top/bottom), 2 bow tip (top/bottom)
  const vertices = new Float32Array([
    // Stern bottom-left, bottom-right, top-left, top-right
    -hl, -hh, -hw,   // 0
    -hl, -hh,  hw,   // 1
    -hl,  hh, -hw,   // 2
    -hl,  hh,  hw,   // 3
    // Mid bottom-left, bottom-right, top-left, top-right
     hl, -hh, -hw,   // 4
     hl, -hh,  hw,   // 5
     hl,  hh, -hw,   // 6
     hl,  hh,  hw,   // 7
    // Bow tip bottom, top
     bowX, -hh, 0,    // 8
     bowX,  hh * 0.5, 0,  // 9 (bow rises less)
  ]);

  const indices = new Uint16Array([
    // Stern face
    0, 2, 1,  1, 2, 3,
    // Bottom face (stern to mid)
    0, 1, 4,  4, 1, 5,
    // Bottom face (mid to bow)
    4, 5, 8,
    // Top face (stern to mid)
    2, 6, 3,  3, 6, 7,
    // Top face (mid to bow)
    6, 9, 7,
    // Left side (stern to mid)
    0, 4, 2,  2, 4, 6,
    // Left side (mid to bow)
    4, 8, 6,  6, 8, 9,
    // Right side (stern to mid)
    1, 3, 5,  5, 3, 7,
    // Right side (mid to bow)
    5, 7, 8,  8, 7, 9,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  return geo;
}

function Sailboat({ position, rotY }: { position: THREE.Vector3; rotY: number }) {
  const hullGeo = useMemo(() => makeHullGeometry(0.28, 0.14, 0.06), []);

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[1.6, 1.6, 1.6]}>
      {/* Hull with pointed bow */}
      <mesh geometry={hullGeo} position={[0, 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c8a060" roughness={0.68} metalness={0.10} flatShading />
      </mesh>
      {/* Mast */}
      <mesh position={[0.04, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.015, 0.46, 4]} />
        <meshStandardMaterial color="#5a3820" roughness={0.8} flatShading />
      </mesh>
      {/* Main sail — triangle cone */}
      <mesh position={[0.06, 0.40, 0.02]} castShadow>
        <coneGeometry args={[0.18, 0.36, 3]} />
        <meshStandardMaterial color="#fbf8f0" side={THREE.DoubleSide} roughness={0.75} flatShading />
      </mesh>
      {/* Jib sail */}
      <mesh position={[-0.08, 0.34, 0]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.09, 0.22, 3]} />
        <meshStandardMaterial color="#ebe2d0" side={THREE.DoubleSide} roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

function CargoShip({ position, rotY }: { position: THREE.Vector3; rotY: number }) {
  const hullGeo = useMemo(() => makeHullGeometry(0.65, 0.22, 0.10), []);

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[1.4, 1.4, 1.4]}>
      {/* Hull with pointed bow */}
      <mesh geometry={hullGeo} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8f1414" roughness={0.72} metalness={0.12} flatShading />
      </mesh>
      
      {/* Deck floor */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.02, 0.20]} />
        <meshStandardMaterial color="#403830" roughness={0.9} flatShading />
      </mesh>

      {/* Superstructure Cabin at stern */}
      <mesh position={[0.30, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.16, 0.18]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.65} flatShading />
      </mesh>
      <mesh position={[0.36, 0.34, 0]} castShadow>
        <boxGeometry args={[0.14, 0.08, 0.14]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.65} flatShading />
      </mesh>

      {/* Smokestack */}
      <mesh position={[0.36, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.07, 5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} flatShading />
      </mesh>

      {/* Cargo Container A (blue) */}
      <mesh position={[-0.28, 0.20, 0]} castShadow>
        <boxGeometry args={[0.30, 0.12, 0.16]} />
        <meshStandardMaterial color="#1452ac" roughness={0.6} flatShading />
      </mesh>

      {/* Cargo Container B (yellow) */}
      <mesh position={[0.02, 0.20, 0]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.16]} />
        <meshStandardMaterial color="#d4a314" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

export function OceanDecorations() {
  return (
    <group>
      {/* Sailboats */}
      {BOATS.map(([mx, my, rotY], i) => {
        const [wx, wz] = toWorld(mx, my);
        return (
          <Sailboat
            key={`boat_${i}`}
            position={new THREE.Vector3(wx, -0.05, wz)}
            rotY={rotY}
          />
        );
      })}

      {/* Cargo Ships */}
      {SHIPS.map(([mx, my, rotY], i) => {
        const [wx, wz] = toWorld(mx, my);
        return (
          <CargoShip
            key={`ship_${i}`}
            position={new THREE.Vector3(wx, -0.05, wz)}
            rotY={rotY}
          />
        );
      })}
    </group>
  );
}
