/**
 * TreeMesh.tsx — Dense low-poly pine trees clustered cleanly on land.
 * Integrates Point-in-Polygon checks to ensure trees never spawn in water,
 * and matches the updated 1.25× terrain mesh elevation height.
 */
import React, { useMemo } from 'react';
import { toWorld } from '../EuropeBoard3D';
import { isLandPoint } from './TerrainMesh';

// [mapX, mapY, count, spread, baseElev (× 1.25 = terrainY)]
const FOREST_CLUSTERS: Array<[number, number, number, number, number]> = [
  // Scandinavian boreal (vast)
  [480, 80, 14, 40, 0.20], [560, 58, 12, 36, 0.20],
  [640, 88, 10, 32, 0.20], [720, 68, 9,  30, 0.20],
  [820, 95, 8,  28, 0.16], [380, 98, 11, 34, 0.20],
  // Black Forest / German forests
  [490, 312, 10, 28, 0.30], [460, 342, 8, 24, 0.20],
  [470, 280,  6, 20, 0.35],
  // Scottish Highlands
  [210, 130,  9, 26, 0.28], [232, 158, 7,  20, 0.24],
  // Carpathian range
  [632, 330, 10, 26, 0.32], [660, 358, 8,  22, 0.28],
  [612, 380,  7, 20, 0.24],
  // Balkans
  [620, 448,  9, 24, 0.25], [592, 470, 7,  20, 0.18],
  // Pyrenees foothills
  [290, 375,  9, 24, 0.24], [322, 392, 7,  20, 0.20],
  // Alps foothills (not on peaks)
  [448, 310,  6, 18, 0.40], [540, 308, 5,  16, 0.38],
  // Iberian interior (sparse)
  [250, 420,  6, 26, 0.20], [285, 462, 5,  22, 0.18],
  // Apennines (Italy)
  [512, 470,  7, 20, 0.16], [542, 502, 5,  16, 0.14],
  // Eastern Poland/Ukraine
  [742, 240,  7, 32, 0.05], [798, 278, 5,  26, 0.05],
  // British Isles interior
  [205, 265,  6, 20, 0.10], [228, 310, 5,  16, 0.09],
];

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

// Brighter, more saturated greens to resist warm light tinting
const PALETTES = [
  ['#2d7a1a', '#388c22', '#3fa025', '#46b02c'],
  ['#267016', '#30801e', '#389025', '#40a02a'],
  ['#1e6012', '#28701a', '#30801f', '#389024'],
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
      const spreadW = (spread / 1000) * 22;
      const spreadH = (spread / 800)  * 16;
      const terrainY = baseElev * 1.25;   // matches new TerrainMesh 1.25× multiplier

      for (let i = 0; i < count; i++) {
        seed++;
        const ox = (seededRand(seed * 7.3) - 0.5) * spreadW * 2;
        seed++;
        const oz = (seededRand(seed * 5.9) - 0.5) * spreadH * 2;
        seed++;
        const scale = 0.38 + seededRand(seed * 3.1) * 0.24;   // scale adjusted for R3F
        seed++;
        const pal   = Math.floor(seededRand(seed * 11.7) * 3);

        const treeX = bx + ox;
        const treeZ = bz + oz;

        // Map world coordinate [treeX, treeZ] back to board space for the isLandPoint check
        // toWorld mapping: X ∈ [-11, +11] (scale 22), Z ∈ [-8, +8] (scale 16)
        const boardX = ((treeX + 11) / 22) * 1000;
        const boardY = ((treeZ + 8) / 16) * 800;

        if (!isLandPoint(boardX, boardY)) {
          continue; // Skip spawning tree in the ocean!
        }

        result.push({ pos: [treeX, terrainY, treeZ], scale, palette: pal });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((t, i) => {
        const [c1, c2, c3, c4] = PALETTES[t.palette];
        const [px, py, pz] = t.pos;
        const s = t.scale;
        return (
          <group key={i} position={[px, py, pz]} scale={[s, s, s]}>
            {/* Trunk — dark brown */}
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.055, 0.24, 5]} />
              <meshLambertMaterial color="#3a2008" />
            </mesh>
            {/* Bottom canopy layer */}
            <mesh position={[0, 0.36, 0]} castShadow>
              <coneGeometry args={[0.26, 0.30, 6]} />
              <meshLambertMaterial color={c1} />
            </mesh>
            {/* Mid layer */}
            <mesh position={[0, 0.54, 0]} castShadow>
              <coneGeometry args={[0.19, 0.25, 6]} />
              <meshLambertMaterial color={c2} />
            </mesh>
            {/* Upper layer */}
            <mesh position={[0, 0.70, 0]} castShadow>
              <coneGeometry args={[0.13, 0.22, 6]} />
              <meshLambertMaterial color={c3} />
            </mesh>
            {/* Tip */}
            <mesh position={[0, 0.83, 0]} castShadow>
              <coneGeometry args={[0.07, 0.16, 5]} />
              <meshLambertMaterial color={c4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
