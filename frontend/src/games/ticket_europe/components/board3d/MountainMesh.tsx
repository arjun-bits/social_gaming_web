/**
 * MountainMesh.tsx
 * Explicit low-poly mountain cones at Alpine, Pyrenean, Scandinavian,
 * Balkan, and Scottish peak locations. Two-cone design: grey body + snow cap.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';

// [mapX, mapY, coneRadius, coneHeight, baseY]
// Heights × 0.25 vs previous — matches terrain 0.45× multiplier
const MOUNTAIN_DEFS: Array<[number, number, number, number, number]> = [
  // ── Alps (Zurich/Munich corridor) ──────────────────────────────────────
  [487, 268, 0.46, 0.55, 0.34],  // Matterhorn-ish (tallest)
  [510, 255, 0.40, 0.50, 0.34],
  [468, 262, 0.35, 0.46, 0.33],
  [534, 258, 0.32, 0.42, 0.32],
  [500, 290, 0.38, 0.44, 0.32],
  [452, 278, 0.30, 0.38, 0.30],
  [548, 272, 0.28, 0.35, 0.29],
  // ── Pyrenees ───────────────────────────────────────────────────────────
  [310, 380, 0.30, 0.34, 0.27],
  [342, 368, 0.34, 0.36, 0.28],
  [372, 376, 0.28, 0.31, 0.26],
  [392, 370, 0.25, 0.28, 0.24],
  // ── Scandinavian highlands ─────────────────────────────────────────────
  [558, 55,  0.32, 0.24, 0.14],
  [638, 65,  0.27, 0.21, 0.13],
  [490, 72,  0.24, 0.19, 0.13],
  [720, 60,  0.22, 0.17, 0.12],
  // ── Scottish highlands ─────────────────────────────────────────────────
  [192, 130, 0.24, 0.19, 0.14],
  [218, 144, 0.20, 0.16, 0.13],
  // ── Balkans / Dinaric Alps ─────────────────────────────────────────────
  [596, 400, 0.26, 0.22, 0.16],
  [618, 420, 0.22, 0.20, 0.14],
  [578, 432, 0.19, 0.17, 0.13],
  // ── Carpathians ────────────────────────────────────────────────────────
  [652, 310, 0.24, 0.22, 0.18],
  [672, 330, 0.20, 0.19, 0.17],
];

const BODY_COLOR = new THREE.Color(0x8a7060);
const SNOW_COLOR = new THREE.Color(0xf0ece8);

function MountainPeak({
  wx, wz, radius, height, baseY,
}: { wx: number; wz: number; radius: number; height: number; baseY: number }) {
  const snowH = height * 0.25;
  const snowR = radius * 0.28;

  return (
    <group position={[wx, baseY, wz]}>
      {/* Main cone body */}
      <mesh castShadow receiveShadow>
        <coneGeometry args={[radius, height, 6, 1]} />
        <meshLambertMaterial color={BODY_COLOR} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, height * 0.5 - snowH * 0.3, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, 6, 1]} />
        <meshLambertMaterial color={SNOW_COLOR} flatShading />
      </mesh>
    </group>
  );
}

export function MountainMesh() {
  const mounts = useMemo(() =>
    MOUNTAIN_DEFS.map(([mx, my, r, h, by]) => {
      const [wx, wz] = toWorld(mx, my);
      return { wx, wz, r, h, by };
    }), []);

  return (
    <group>
      {mounts.map((m, i) => (
        <MountainPeak key={i} wx={m.wx} wz={m.wz} radius={m.r} height={m.h} baseY={m.by} />
      ))}
    </group>
  );
}
