/**
 * OceanDecorations.tsx
 * Decorative sailboats and cargo ships scattered across the Mediterranean, Atlantic,
 * North Sea, and Baltic. Low-poly board-game style.
 */
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

const HULL_COLOR = new THREE.Color(0xc8b880);
const MAST_COLOR = new THREE.Color(0x7a5830);
const SAIL_COLOR = new THREE.Color(0xfbfbfb);
const SAIL2_COLOR = new THREE.Color(0xebe2d0);

function Sailboat({ position, rotY }: { position: THREE.Vector3; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[1.8, 1.8, 1.8]}>
      {/* Hull */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.09, 0.20]} />
        <meshStandardMaterial color={HULL_COLOR} roughness={0.68} metalness={0.10} />
      </mesh>
      {/* Mast */}
      <mesh position={[0.04, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.018, 0.50, 4]} />
        <meshStandardMaterial color={MAST_COLOR} roughness={0.8} />
      </mesh>
      {/* Main sail */}
      <mesh position={[0.06, 0.42, 0.02]} castShadow>
        <coneGeometry args={[0.20, 0.40, 3]} />
        <meshStandardMaterial color={SAIL_COLOR} side={THREE.DoubleSide} roughness={0.75} flatShading />
      </mesh>
      {/* Jib */}
      <mesh position={[-0.10, 0.36, 0]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.10, 0.26, 3]} />
        <meshStandardMaterial color={SAIL2_COLOR} side={THREE.DoubleSide} roughness={0.75} flatShading />
      </mesh>
    </group>
  );
}

function CargoShip({ position, rotY }: { position: THREE.Vector3; rotY: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[1.5, 1.5, 1.5]}>
      {/* Red/Black Hull */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.15, 0.32]} />
        <meshStandardMaterial color="#8f1414" roughness={0.72} metalness={0.12} flatShading />
      </mesh>
      
      {/* Deck floor */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[1.26, 0.02, 0.28]} />
        <meshStandardMaterial color="#403830" roughness={0.9} />
      </mesh>

      {/* Superstructure Cabin at stern */}
      <mesh position={[0.38, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.18, 0.24]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.65} flatShading />
      </mesh>
      <mesh position={[0.44, 0.37, 0]} castShadow>
        <boxGeometry args={[0.16, 0.10, 0.16]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.65} />
      </mesh>

      {/* Smokestack */}
      <mesh position={[0.44, 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.08, 5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Cargo Container A (blue) */}
      <mesh position={[-0.36, 0.22, 0]} castShadow>
        <boxGeometry args={[0.36, 0.15, 0.22]} />
        <meshStandardMaterial color="#1452ac" roughness={0.6} flatShading />
      </mesh>

      {/* Cargo Container B (yellow) */}
      <mesh position={[0.04, 0.22, 0]} castShadow>
        <boxGeometry args={[0.36, 0.15, 0.22]} />
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
            position={new THREE.Vector3(wx, -0.11, wz)}
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
            position={new THREE.Vector3(wx, -0.11, wz)}
            rotY={rotY}
          />
        );
      })}
    </group>
  );
}
