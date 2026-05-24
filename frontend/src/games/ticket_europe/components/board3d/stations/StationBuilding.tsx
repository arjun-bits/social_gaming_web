/**
 * StationBuilding.tsx — 5 distinct station building variants for cities.
 * Extracted from CityMarker.tsx for modularity.
 */
import * as THREE from 'three';
import { graph } from '../../../boardSceneGraph';

// Deterministic hash from city id → variant index [0-4]
function cityHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 5;
}

// Deterministic Y-rotation from city id (gives each station a unique facing)
function cityRotation(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 628) / 100; // 0 to ~6.28 radians
}

// Variant 0: Grand Terminal (wide, with clock tower + wings + platform canopy)
function StationGrandTerminal({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  const win = new THREE.Color('#1a2540');
  const accent = new THREE.Color('#d4af37');
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.90]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main hall */}
      <mesh position={[0, 0.30, 0]} castShadow>
        <boxGeometry args={[0.80, 0.44, 0.54]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Windows */}
      {[-0.24, 0, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0.275]}>
          <boxGeometry args={[0.10, 0.14, 0.01]} />
          <meshBasicMaterial color={win} />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.14, 0.275]}>
        <boxGeometry args={[0.12, 0.20, 0.01]} />
        <meshBasicMaterial color="#3a2008" />
      </mesh>
      {/* Main roof */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <coneGeometry args={[0.50, 0.30, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {/* Clock tower */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.24, 0.28, 0.24]} />
        <meshStandardMaterial color={wallCol} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.64, 0.125]}>
        <circleGeometry args={[0.07, 8]} />
        <meshBasicMaterial color="#f0ece0" />
      </mesh>
      <mesh position={[0, 0.80, 0]} castShadow>
        <coneGeometry args={[0.18, 0.16, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      <mesh position={[0, 0.90, 0]} castShadow>
        <coneGeometry args={[0.03, 0.10, 4]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Wings */}
      {([-1, 1] as const).map(s => (
        <group key={s}>
          <mesh position={[s * 0.58, 0.22, 0]} castShadow>
            <boxGeometry args={[0.34, 0.30, 0.48]} />
            <meshStandardMaterial color={wallCol} roughness={0.75} flatShading />
          </mesh>
          <mesh position={[s * 0.58, 0.40, 0]} castShadow>
            <coneGeometry args={[0.28, 0.20, 4]} />
            <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[s * 0.58, 0.24, 0.245]}>
            <boxGeometry args={[0.14, 0.10, 0.01]} />
            <meshBasicMaterial color={win} />
          </mesh>
        </group>
      ))}
      {/* Platform canopy */}
      <mesh position={[0, 0.38, 0.54]} castShadow>
        <boxGeometry args={[1.4, 0.02, 0.34]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0.64]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.28, 4]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[-0.28, 0.62, -0.14]} castShadow>
        <boxGeometry args={[0.07, 0.18, 0.07]} />
        <meshStandardMaterial color="#5a3020" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// Variant 1: Nordic Tower (tall narrow clock tower with steep roof)
function StationNordicTower({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  const win = new THREE.Color('#1a2540');
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.80, 0.06, 0.70]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Tower body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.44, 0.64, 0.44]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Windows (stacked) */}
      {[0.24, 0.40, 0.56].map((y, i) => (
        <mesh key={i} position={[0, y, 0.225]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color={win} />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.12, 0.225]}>
        <boxGeometry args={[0.10, 0.16, 0.01]} />
        <meshBasicMaterial color="#3a2008" />
      </mesh>
      {/* Steep pointed roof */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <coneGeometry args={[0.32, 0.50, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Spire */}
      <mesh position={[0, 1.10, 0]} castShadow>
        <coneGeometry args={[0.04, 0.14, 4]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Side annexe */}
      <mesh position={[0.34, 0.16, 0]} castShadow>
        <boxGeometry args={[0.28, 0.26, 0.38]} />
        <meshStandardMaterial color={wallCol} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.34, 0.32, 0]} castShadow>
        <coneGeometry args={[0.22, 0.14, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// Variant 2: Cathedral Station (dome + bell tower)
function StationCathedral({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.60, 0.44, 0.50]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.30, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={roofCol} roughness={0.6} flatShading />
      </mesh>
      {/* Dome cap */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 6]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Bell tower */}
      <mesh position={[-0.40, 0.36, 0]} castShadow>
        <boxGeometry args={[0.22, 0.66, 0.22]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.74, 0]} castShadow>
        <coneGeometry args={[0.16, 0.20, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.86, 0]} castShadow>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Windows arch */}
      {[-0.14, 0.14].map((x, i) => (
        <mesh key={i} position={[x, 0.32, 0.255]}>
          <boxGeometry args={[0.10, 0.18, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
      {/* Round window */}
      <mesh position={[0, 0.48, 0.255]}>
        <circleGeometry args={[0.06, 6]} />
        <meshBasicMaterial color="#2a3560" />
      </mesh>
    </group>
  );
}

// Variant 3: Market Hall (wide, low, with arched openings and timber frame feel)
function StationMarketHall({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Long hall */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.0, 0.32, 0.56]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Pitched roof */}
      <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.60, 0.22, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {/* Timber cross-beams (visible on front) */}
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0.285]}>
          <boxGeometry args={[0.03, 0.30, 0.01]} />
          <meshStandardMaterial color="#3a2008" roughness={0.85} flatShading />
        </mesh>
      ))}
      {[0.15, 0.30].map((y, i) => (
        <mesh key={i} position={[0, y, 0.285]}>
          <boxGeometry args={[1.0, 0.02, 0.01]} />
          <meshStandardMaterial color="#3a2008" roughness={0.85} flatShading />
        </mesh>
      ))}
      {/* Arched openings */}
      {[-0.30, 0, 0.30].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0.285]}>
          <boxGeometry args={[0.16, 0.16, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
      {/* Small chimney */}
      <mesh position={[0.30, 0.50, -0.08]} castShadow>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#5a3020" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// Variant 4: Fortress Station (thick walls, battlements, round turret)
function StationFortress({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main keep */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.60, 0.44, 0.50]} />
        <meshStandardMaterial color={wallCol} roughness={0.78} flatShading />
      </mesh>
      {/* Battlements */}
      {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.54, 0]} castShadow>
          <boxGeometry args={[0.10, 0.08, 0.52]} />
          <meshStandardMaterial color={wallCol} roughness={0.78} flatShading />
        </mesh>
      ))}
      {/* Round turret (left) */}
      <mesh position={[-0.40, 0.30, 0.20]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.54, 6]} />
        <meshStandardMaterial color={wallCol} roughness={0.76} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.60, 0.20]} castShadow>
        <coneGeometry args={[0.18, 0.20, 6]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Square tower (right) */}
      <mesh position={[0.40, 0.34, -0.16]} castShadow>
        <boxGeometry args={[0.24, 0.62, 0.24]} />
        <meshStandardMaterial color={wallCol} roughness={0.76} flatShading />
      </mesh>
      <mesh position={[0.40, 0.68, -0.16]} castShadow>
        <coneGeometry args={[0.18, 0.16, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Gate */}
      <mesh position={[0, 0.14, 0.255]}>
        <boxGeometry args={[0.16, 0.20, 0.01]} />
        <meshBasicMaterial color="#1a1008" />
      </mesh>
      {/* Arrow slits */}
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.38, 0.255]}>
          <boxGeometry args={[0.03, 0.12, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
    </group>
  );
}

interface StationBuildingProps {
  wallHex: string;
  roofHex: string;
  cityId: string;
}

export function StationBuilding({ wallHex, roofHex, cityId }: StationBuildingProps) {
  const wallCol = new THREE.Color(wallHex);
  const roofCol = new THREE.Color(roofHex);
  const variant = cityHash(cityId);
  const rotY = cityRotation(cityId);

  // Check if this is a high-elevation (mountain) city that needs a foundation
  const cityNode = graph.cities[cityId];
  const isHighElevation = cityNode && cityNode.elevation > 0.35;

  const renderVariant = () => {
    switch (variant) {
      case 0: return <StationGrandTerminal wallCol={wallCol} roofCol={roofCol} />;
      case 1: return <StationNordicTower wallCol={wallCol} roofCol={roofCol} />;
      case 2: return <StationCathedral wallCol={wallCol} roofCol={roofCol} />;
      case 3: return <StationMarketHall wallCol={wallCol} roofCol={roofCol} />;
      case 4: return <StationFortress wallCol={wallCol} roofCol={roofCol} />;
      default: return <StationGrandTerminal wallCol={wallCol} roofCol={roofCol} />;
    }
  };

  return (
    <group scale={[1.10, 1.10, 1.10]} rotation={[0, rotY, 0]}>
      {/* Stone foundation pedestal for mountain cities */}
      {isHighElevation && (
        <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.5, 0.14, 1.1]} />
          <meshStandardMaterial color="#8a7c6e" roughness={0.85} flatShading />
        </mesh>
      )}
      {renderVariant()}
    </group>
  );
}
