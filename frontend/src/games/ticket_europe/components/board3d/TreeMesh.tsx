/**
 * TreeMesh.tsx — Dense low-poly pine trees using Drei Instances.
 * ~130 trees × 5 meshes = 650 draw calls → 5 draw calls via instancing.
 *
 * Integrates Point-in-Polygon checks to ensure trees never spawn in water,
 * and matches the terrain mesh elevation.
 */
import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { toWorld, fromWorld, elevationAt } from '../../boardSceneGraph';
import { isLandPoint } from './TerrainMesh';
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
// Each palette = [bottom canopy, mid, upper, tip]
const PALETTES = [
  ['#2d7a1a', '#388c22', '#3fa025', '#46b02c'],
  ['#267016', '#30801e', '#389025', '#40a02a'],
  ['#1e6012', '#28701a', '#30801f', '#389024'],
] as const;

const TRUNK_COLOR = '#3a2008';

interface TreeData {
  x: number;
  y: number;
  z: number;
  scale: number;
  palette: number;
}

function useTreeData(): TreeData[] {
  return useMemo(() => {
    const result: TreeData[] = [];
    let seed = 1;

    for (const [cx, cy, count, spread] of FOREST_CLUSTERS) {
      const [bx, bz] = toWorld(cx, cy);
      const spreadW = (spread / 1000) * 24.5;
      const spreadH = (spread / 800) * 17.5;

      for (let i = 0; i < count; i++) {
        seed++;
        const ox = (seededRand(seed * 7.3) - 0.5) * spreadW * 2;
        seed++;
        const oz = (seededRand(seed * 5.9) - 0.5) * spreadH * 2;
        seed++;
        const scale = 0.38 + seededRand(seed * 3.1) * 0.24;
        seed++;
        const pal = Math.floor(seededRand(seed * 11.7) * 3);

        const treeX = bx + ox;
        const treeZ = bz + oz;

        const [boardX, boardY] = fromWorld(treeX, treeZ);

        if (!isLandPoint(boardX, boardY)) continue;

        // City proximity check
        let tooClose = false;
        for (const city of Object.values(cities)) {
          const dx = city.x - boardX;
          const dy = city.y - boardY;
          if (dx * dx + dy * dy < 484) { tooClose = true; break; }
        }
        if (tooClose) continue;

        // Route proximity check
        for (const route of initialRoutes) {
          const from = cities[route.from];
          const to = cities[route.to];
          if (from && to) {
            const dSq = distToSegmentSq(boardX, boardY, from.x, from.y, to.x, to.y);
            if (dSq < 324) { tooClose = true; break; }
          }
        }
        if (tooClose) continue;

        const terrainY = elevationAt(boardX, boardY);
        result.push({ x: treeX, y: terrainY, z: treeZ, scale, palette: pal });
      }
    }
    return result;
  }, []);
}

/**
 * Instanced tree layer — renders one geometry type (trunk or canopy cone)
 * for ALL trees in a single draw call.
 */
function TreeLayer({
  trees, yOffset, getColor,
  children,
}: {
  trees: TreeData[];
  yOffset: number;
  getColor: (palette: number) => string;
  children: React.ReactNode; // geometry + material
}) {
  return (
    <Instances limit={trees.length + 10} range={trees.length} raycast={() => {}} frustumCulled={false}>
      {children}
      {trees.map((t, i) => (
        <Instance
          key={i}
          position={[t.x, t.y + yOffset * t.scale, t.z]}
          scale={t.scale}
          color={getColor(t.palette)}
        />
      ))}
    </Instances>
  );
}

export const TreeMesh = React.memo(function TreeMesh() {
  const trees = useTreeData();

  return (
    <group>
      {/* Trunks — 1 draw call */}
      <TreeLayer trees={trees} yOffset={0.12} getColor={() => TRUNK_COLOR}>
        <cylinderGeometry args={[0.035, 0.055, 0.24, 5]} />
        <meshStandardMaterial color={TRUNK_COLOR} roughness={0.8} metalness={0.05} />
      </TreeLayer>

      {/* Bottom canopy — 1 draw call */}
      <TreeLayer trees={trees} yOffset={0.36} getColor={(p) => PALETTES[p][0]}>
        <coneGeometry args={[0.26, 0.30, 6]} />
        <meshStandardMaterial roughness={0.7} metalness={0.1} flatShading />
      </TreeLayer>

      {/* Mid canopy — 1 draw call */}
      <TreeLayer trees={trees} yOffset={0.54} getColor={(p) => PALETTES[p][1]}>
        <coneGeometry args={[0.19, 0.25, 6]} />
        <meshStandardMaterial roughness={0.7} metalness={0.1} flatShading />
      </TreeLayer>

      {/* Upper canopy — 1 draw call */}
      <TreeLayer trees={trees} yOffset={0.70} getColor={(p) => PALETTES[p][2]}>
        <coneGeometry args={[0.13, 0.22, 6]} />
        <meshStandardMaterial roughness={0.7} metalness={0.1} flatShading />
      </TreeLayer>

      {/* Tip — 1 draw call */}
      <TreeLayer trees={trees} yOffset={0.83} getColor={(p) => PALETTES[p][3]}>
        <coneGeometry args={[0.07, 0.16, 5]} />
        <meshStandardMaterial roughness={0.7} metalness={0.1} flatShading />
      </TreeLayer>
    </group>
  );
});
