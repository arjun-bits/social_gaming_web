import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

// [cityId, mapX, mapY, towerColor]
// Stockholm and Amsterdam removed — they now render as full StationBuildings via CityMarker
const LIGHTHOUSES: Array<[string, number, number, string]> = [
  ['lisbon',    40, 680,   '#d4702a'],   // Atlantic tower
  ['palermo',   480, 780,  '#d46828'],   // Mediterranean
];

const LAMP_COLOR = new THREE.Color(0xffe080);

function Lighthouse({ wx, wz, colorHex, baseY }: { wx: number; wz: number; colorHex: string; baseY: number }) {
  const towerColor = new THREE.Color(colorHex);
  const darkColor  = towerColor.clone().multiplyScalar(0.58);

  return (
    <group position={[wx, baseY, wz]}>
      {/* Base platform */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.25, 0.08, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Tower body — tapered, shorter for top-down clarity */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.18, 0.72, 8]} />
        <meshStandardMaterial color={towerColor} roughness={0.65} metalness={0.15} flatShading />
      </mesh>

      {/* White stripe band */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.145, 0.145, 0.10, 8]} />
        <meshStandardMaterial color={new THREE.Color(0xf0ece4)} roughness={0.6} />
      </mesh>

      {/* Lamp room — emissive yellow */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 8]} />
        <meshStandardMaterial
          color={LAMP_COLOR}
          emissive={LAMP_COLOR}
          emissiveIntensity={1.1}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Conical roof */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <coneGeometry args={[0.14, 0.16, 8]} />
        <meshStandardMaterial color={darkColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function LighthouseMesh() {
  return (
    <group>
      {LIGHTHOUSES.map(([id, mx, my, colorHex]) => {
        const [wx, wz] = toWorld(mx, my);
        const baseY = getTerrainHeight(mx, my) - 0.01;
        return <Lighthouse key={id} wx={wx} wz={wz} colorHex={colorHex} baseY={baseY} />;
      })}
    </group>
  );
}
