/**
 * TreeMesh.tsx — Dense low-poly pine trees clustered cleanly on land.
 * Integrates Point-in-Polygon checks to ensure trees never spawn in water,
 * and matches the updated 1.25× terrain mesh elevation height.
 */
import { useMemo } from 'react';
import { toWorld } from '../EuropeBoard3D';
import { isLandPoint, getTerrainHeight } from './TerrainMesh';
import { cities, initialRoutes } from '../../../../core/engine/ticket_europe/boardData';

function distToSegmentSq(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return (px - qx) * (px - qx) + (py - qy) * (py - qy);
}

// [mapX, mapY, count, spread] (elevation computed dynamically)
const FOREST_CLUSTERS: Array<[number, number, number, number]> = [
  // Scandinavian boreal (vast)
  [480, 80, 14, 40], [560, 58, 12, 36],
  [640, 88, 10, 32], [720, 68, 9,  30],
  [820, 95, 8,  28], [380, 98, 11, 34],
  // Black Forest / German forests
  [490, 312, 10, 28], [460, 342, 8, 24],
  [470, 280,  6, 20],
  // Scottish Highlands
  [210, 130,  9, 26], [232, 158, 7,  20],
  // Carpathian range
  [632, 330, 10, 26], [660, 358, 8,  22],
  [612, 380,  7, 20],
  // Balkans
  [620, 448,  9, 24], [592, 470, 7,  20],
  // Pyrenees foothills
  [290, 375,  9, 24], [322, 392, 7,  20],
  // Alps foothills (not on peaks)
  [448, 310,  6, 18], [540, 308, 5,  16],
  // Iberian interior (sparse)
  [250, 420,  6, 26], [285, 462, 5,  22],
  // Apennines (Italy)
  [512, 470,  7, 20], [542, 502, 5,  16],
  // Eastern Poland/Ukraine
  [742, 240,  7, 32], [798, 278, 5,  26],
  // British Isles interior
  [205, 265,  6, 20], [228, 310, 5,  16],
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

    for (const [cx, cy, count, spread] of FOREST_CLUSTERS) {
      const [bx, bz] = toWorld(cx, cy);
      const spreadW = (spread / 1000) * 24.5;
      const spreadH = (spread / 800)  * 17.5;

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

        // Exact inverse coordinate mapping to match EuropeBoard3D.tsx toWorld exactly:
        // X ∈ [-12.25, +12.25] (scale 24.5), Z ∈ [-8.75, +8.75] (scale 17.5)
        const boardX = ((treeX + 12.25) / 24.5) * 1000;
        const boardY = ((treeZ + 8.75) / 17.5) * 800;

        if (!isLandPoint(boardX, boardY)) {
          continue; // Skip spawning tree in the ocean!
        }

        // Clean-graph rule: prevent trees from spawning on top of cities (threshold 22)
        let tooClose = false;
        for (const city of Object.values(cities)) {
          const dx = city.x - boardX;
          const dy = city.y - boardY;
          if (dx * dx + dy * dy < 484) { // 22^2
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        // Clean-graph rule: prevent trees from spawning on top of tracks (threshold 18)
        for (const route of initialRoutes) {
          const from = cities[route.from];
          const to = cities[route.to];
          if (from && to) {
            const dSq = distToSegmentSq(boardX, boardY, from.x, from.y, to.x, to.y);
            if (dSq < 324) { // 18^2
              tooClose = true;
              break;
            }
          }
        }
        if (tooClose) continue;

        const terrainY = getTerrainHeight(boardX, boardY);

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
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.035, 0.055, 0.24, 5]} />
              <meshStandardMaterial color="#3a2008" roughness={0.8} metalness={0.05} />
            </mesh>
            {/* Bottom canopy layer */}
            <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.26, 0.30, 6]} />
              <meshStandardMaterial color={c1} roughness={0.7} metalness={0.1} flatShading />
            </mesh>
            {/* Mid layer */}
            <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.19, 0.25, 6]} />
              <meshStandardMaterial color={c2} roughness={0.7} metalness={0.1} flatShading />
            </mesh>
            {/* Upper layer */}
            <mesh position={[0, 0.70, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.13, 0.22, 6]} />
              <meshStandardMaterial color={c3} roughness={0.7} metalness={0.1} flatShading />
            </mesh>
            {/* Tip */}
            <mesh position={[0, 0.83, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.07, 0.16, 5]} />
              <meshStandardMaterial color={c4} roughness={0.7} metalness={0.1} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
