/**
 * MountainMesh.tsx
 * Explicit low-poly mountain cones at Alpine, Pyrenean, Scandinavian,
 * Balkan, and Scottish peak locations. Two-cone design: grey body + snow cap.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';

// [mapX, mapY, coneRadius, coneHeight, baseY] — baseY = approx terrain surface
const MOUNTAIN_DEFS: Array<[number, number, number, number, number]> = [
  // ── Alps (Zurich/Munich corridor) ──────────────────────────────────────
  [487, 268, 0.55, 2.20, 1.62],  // Matterhorn-ish
  [510, 255, 0.48, 1.95, 1.58],
  [468, 262, 0.42, 1.80, 1.54],
  [534, 258, 0.38, 1.65, 1.52],
  [500, 290, 0.45, 1.70, 1.55],
  [452, 278, 0.35, 1.50, 1.48],
  [548, 272, 0.32, 1.40, 1.44],
  // ── Pyrenees ───────────────────────────────────────────────────────────
  [310, 380, 0.36, 1.30, 1.28],
  [342, 368, 0.40, 1.42, 1.32],
  [372, 376, 0.34, 1.22, 1.26],
  [392, 370, 0.30, 1.10, 1.20],
  // ── Scandinavian highlands ─────────────────────────────────────────────
  [558, 55,  0.38, 0.90, 0.68],
  [638, 65,  0.32, 0.80, 0.62],
  [490, 72,  0.28, 0.75, 0.64],
  [720, 60,  0.26, 0.68, 0.58],
  // ── Scottish highlands ─────────────────────────────────────────────────
  [192, 130, 0.28, 0.72, 0.76],
  [218, 144, 0.24, 0.62, 0.72],
  // ── Balkans / Dinaric Alps ─────────────────────────────────────────────
  [596, 400, 0.30, 0.88, 0.80],
  [618, 420, 0.26, 0.78, 0.74],
  [578, 432, 0.22, 0.68, 0.68],
  // ── Carpathians ────────────────────────────────────────────────────────
  [652, 310, 0.28, 0.88, 0.92],
  [672, 330, 0.24, 0.75, 0.86],
];

const BODY_COLOR  = new THREE.Color(0x8a7060);
const DARK_COLOR  = new THREE.Color(0x7a6050);
const SNOW_COLOR  = new THREE.Color(0xf0ece8);
const SNOW_TINT   = new THREE.Color(0xd8d4d0);

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
        <meshStandardMaterial color={BODY_COLOR} roughness={0.88} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, height * 0.5 - snowH * 0.3, 0]} castShadow>
        <coneGeometry args={[snowR, snowH, 6, 1]} />
        <meshStandardMaterial color={SNOW_COLOR} roughness={0.7} flatShading />
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
