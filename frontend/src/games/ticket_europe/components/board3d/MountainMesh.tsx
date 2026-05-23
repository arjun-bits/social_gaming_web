/**
 * MountainMesh.tsx
 * Explicit low-poly mountain cones at Alpine, Pyrenean, Scandinavian,
 * Balkan, and Scottish peak locations. Two-cone design: grey body + snow cap.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';
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

// [mapX, mapY, coneRadius, coneHeight] (baseY computed dynamically via getTerrainHeight)
const MOUNTAIN_DEFS: Array<[number, number, number, number]> = [
  // ── Alps (Zurich/Munich corridor) ──────────────────────────────────────
  [487, 268, 0.62, 0.75],  // Matterhorn-ish (tallest)
  [510, 255, 0.55, 0.68],
  [468, 262, 0.48, 0.62],
  [534, 258, 0.45, 0.58],
  [500, 290, 0.52, 0.60],
  [452, 278, 0.42, 0.52],
  [548, 272, 0.40, 0.48],
  [520, 280, 0.38, 0.46],
  [475, 250, 0.36, 0.44],
  // ── Pyrenees ───────────────────────────────────────────────────────────
  [310, 380, 0.42, 0.48],
  [342, 368, 0.46, 0.50],
  [372, 376, 0.38, 0.42],
  [392, 370, 0.34, 0.38],
  [280, 400, 0.32, 0.36],
  // ── Scandinavian highlands ─────────────────────────────────────────────
  [558, 55, 0.44, 0.34],
  [638, 65, 0.38, 0.30],
  [490, 72, 0.34, 0.26],
  [720, 60, 0.30, 0.24],
  [530, 40, 0.32, 0.28],
  [600, 45, 0.28, 0.22],
  // ── Scottish highlands ─────────────────────────────────────────────────
  [192, 130, 0.34, 0.28],
  [218, 144, 0.28, 0.22],
  [175, 118, 0.24, 0.20],
  // ── Balkans / Dinaric Alps ─────────────────────────────────────────────
  [596, 400, 0.36, 0.32],
  [618, 420, 0.32, 0.28],
  [578, 432, 0.28, 0.24],
  [640, 440, 0.26, 0.22],
  // ── Carpathians ────────────────────────────────────────────────────────
  [652, 310, 0.34, 0.30],
  [672, 330, 0.30, 0.26],
  [690, 345, 0.26, 0.24],
  [710, 320, 0.24, 0.22],
  // ── Apennines (Italian spine) ──────────────────────────────────────────
  [420, 580, 0.28, 0.26],
  [440, 620, 0.26, 0.24],
  [460, 660, 0.24, 0.22],
  // ── Ural foothills (near Moskva) ───────────────────────────────────────
  [950, 100, 0.30, 0.24],
  [940, 140, 0.26, 0.20],
];

const BODY_COLOR = new THREE.Color('#7a6b58'); // Warm earthy slate grey
const SNOW_COLOR = new THREE.Color('#fdfcf7'); // Soft warm white snow cap

function MountainPeak({
  wx, wz, radius, height, baseY, seed,
}: { wx: number; wz: number; radius: number; height: number; baseY: number; seed: number }) {
  const snowH = height * 0.28;
  const snowR = radius * 0.32;

  // Deterministic organic rotation and scale jitter to match tectonic formations in Image 2
  const rotY = Math.sin(seed * 7.9) * Math.PI;
  const scaleX = 0.9 + Math.abs(Math.sin(seed * 3.3)) * 0.25;
  const scaleZ = 0.9 + Math.abs(Math.cos(seed * 5.5)) * 0.25;

  return (
    <group position={[wx, baseY + height * 0.5, wz]} rotation={[0, rotY, 0]} scale={[scaleX, 1.0, scaleZ]}>
      {/* Main cone body - 4-sided tectonic pyramid for Image 2 look */}
      <mesh castShadow receiveShadow>
        <coneGeometry args={[radius, height, 4, 1]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.82} metalness={0.05} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, height * 0.5 - snowH * 0.35, 0]} castShadow receiveShadow>
        <coneGeometry args={[snowR, snowH, 4, 1]} />
        <meshStandardMaterial color={SNOW_COLOR} roughness={0.80} metalness={0.02} flatShading />
      </mesh>
    </group>
  );
}

export function MountainMesh() {
  const mounts = useMemo(() => {
    const result: Array<{ wx: number; wz: number; r: number; h: number; baseY: number; seed: number }> = [];
    
    MOUNTAIN_DEFS.forEach(([mx, my, r, h], idx) => {
      // Clean-graph rule: prevent mountains from spawning on top of cities (threshold 40)
      let tooClose = false;
      for (const city of Object.values(cities)) {
        const dx = city.x - mx;
        const dy = city.y - my;
        if (dx * dx + dy * dy < 1600) { // 40^2
          tooClose = true;
          break;
        }
      }
      if (tooClose) return;

      // Clean-graph rule: prevent mountains from spawning on top of tracks (threshold 25)
      for (const route of initialRoutes) {
        const from = cities[route.from];
        const to = cities[route.to];
        if (from && to) {
          const dSq = distToSegmentSq(mx, my, from.x, from.y, to.x, to.y);
          if (dSq < 625) { // 25^2
            tooClose = true;
            break;
          }
        }
      }
      if (tooClose) return;

      const [wx, wz] = toWorld(mx, my);
      const baseY = getTerrainHeight(mx, my) - 0.02;
      result.push({ wx, wz, r, h, baseY, seed: idx });
    });
    
    return result;
  }, []);

  return (
    <group>
      {mounts.map((m, i) => (
        <MountainPeak key={i} wx={m.wx} wz={m.wz} radius={m.r} height={m.h} baseY={m.baseY} seed={m.seed} />
      ))}
    </group>
  );
}
