/**
 * TreeMesh.tsx — Dense tall low-poly pine trees in real European forest regions.
 * 1.8× denser, 1.5× taller than previous version.
 */
import React, { useMemo } from 'react';
import { toWorld } from '../EuropeBoard3D';

// [mapX, mapY, count, spread, baseElevMultiplier]
// baseElevMultiplier * 2.2 gives approximate terrain Y for that region
const FOREST_CLUSTERS: Array<[number, number, number, number, number]> = [
  // Scandinavian boreal (vast)
  [480, 80, 14, 42, 0.30], [560, 58, 12, 38, 0.32],
  [640, 88, 10, 34, 0.28], [720, 68, 9,  32, 0.26],
  [820, 95, 8,  30, 0.22], [380, 98, 11, 36, 0.28],
  // Black Forest / German forests
  [490, 312, 10, 30, 0.38], [460, 342, 8, 26, 0.34],
  [470, 280, 6, 22, 0.42],
  // Scottish Highlands
  [210, 130, 9,  28, 0.40], [232, 158, 7,  22, 0.36],
  // Carpathian range
  [632, 330, 10, 28, 0.42], [660, 358, 8,  24, 0.38],
  [612, 380, 7,  22, 0.35],
  // Balkans
  [620, 448, 9,  26, 0.36], [592, 470, 7,  22, 0.30],
  // Pyrenees foothills
  [290, 375, 9,  26, 0.32], [322, 392, 7,  22, 0.28],
  // Alps foothills (not on peaks)
  [448, 310, 6,  20, 0.50], [540, 308, 5,  18, 0.48],
  // Iberian interior (sparse)
  [250, 420, 6,  28, 0.28], [285, 462, 5,  24, 0.24],
  // Apennines (Italy)
  [512, 470, 7,  22, 0.20], [542, 502, 5,  18, 0.18],
  // Eastern Poland/Ukraine borderlands
  [742, 240, 7,  34, 0.06], [798, 278, 5,  28, 0.06],
  // British Isles interior
  [205, 265, 6,  22, 0.10], [228, 310, 5,  18, 0.09],
];

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

const PALETTE = [
  ['#1a5422', '#226030', '#2a703a', '#30804a'],
  ['#164c1e', '#1c5826', '#22642e', '#287438'],
  ['#124018', '#184c20', '#1e5828', '#246430'],
] as const;

interface TreeData {
  pos: [number, number, number];
  scale: number;
  palette: number;
}

export function TreeMesh() {
  const trees = useMemo<TreeData[]>(() => {
    const result: TreeData[] = [];
    let seed = 1;

    for (const [cx, cy, count, spread, baseElev] of FOREST_CLUSTERS) {
      const [bx, bz] = toWorld(cx, cy);
      const spreadW = (spread / 1000) * 20;
      const spreadH = (spread / 800) * 14;
      const terrainY = baseElev * 2.2;

      for (let i = 0; i < count; i++) {
        seed++;
        const ox = (seededRand(seed * 7.3) - 0.5) * spreadW * 2;
        seed++;
        const oz = (seededRand(seed * 5.9) - 0.5) * spreadH * 2;
        seed++;
        const scale = 0.85 + seededRand(seed * 3.1) * 0.70;   // 0.85–1.55
        seed++;
        const pal   = Math.floor(seededRand(seed * 11.7) * 3);

        result.push({ pos: [bx + ox, terrainY, bz + oz], scale, palette: pal });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((t, i) => {
        const [c1, c2, c3, c4] = PALETTE[t.palette];
        const [px, py, pz] = t.pos;
        const s = t.scale;
        return (
          <group key={i} position={[px, py, pz]} scale={[s, s, s]}>
            {/* Trunk */}
            <mesh position={[0, 0.14, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.055, 0.28, 5]} />
              <meshStandardMaterial color="#3a2008" roughness={0.95} flatShading />
            </mesh>
            {/* Layer 1 */}
            <mesh position={[0, 0.42, 0]} castShadow>
              <coneGeometry args={[0.27, 0.36, 6]} />
              <meshStandardMaterial color={c1} roughness={0.85} flatShading />
            </mesh>
            {/* Layer 2 */}
            <mesh position={[0, 0.62, 0]} castShadow>
              <coneGeometry args={[0.20, 0.30, 6]} />
              <meshStandardMaterial color={c2} roughness={0.85} flatShading />
            </mesh>
            {/* Layer 3 */}
            <mesh position={[0, 0.79, 0]} castShadow>
              <coneGeometry args={[0.13, 0.24, 6]} />
              <meshStandardMaterial color={c3} roughness={0.85} flatShading />
            </mesh>
            {/* Top tip */}
            <mesh position={[0, 0.94, 0]} castShadow>
              <coneGeometry args={[0.07, 0.18, 5]} />
              <meshStandardMaterial color={c4} roughness={0.85} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
