/**
 * RouteMesh.tsx — Bold solid colour blocks per slot (no rails/ties).
 * Each slot = single BoxGeometry, tall and vivid. Matches target image aesthetic.
 */
import React, { useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Route } from '../../../../core/engine/ticket_europe/models';
import { RouteType } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld } from '../EuropeBoard3D';

const ROUTE_COLOR: Record<string, string> = {
  red:    '#ff1818', blue:   '#0858ff', green:  '#08b030',
  yellow: '#ffc000', black:  '#1e2838', white:  '#f0ece4',
  pink:   '#f018a8', orange: '#ff5808', any:    '#7890a0',
};

const BOARD_Y    = 0.30;   // Above terrain surface (accounts for elevation)
const BLOCK_H    = 0.18;   // Height of each car block
const BLOCK_Z    = 0.30;   // Width of each car block (across track)
const SLOT_GAP   = 0.13;   // Gap fraction between slots

// ── Hover highlight on a single material ─────────────────────────────────
interface SlotProps {
  posA: [number, number];
  posB: [number, number];
  slotIndex: number;
  totalSlots: number;
  railColor: string;
  claimed: boolean;
  routeType: RouteType;
  routeId: string;
  onRouteClick: (id: string) => void;
  interactive: boolean;
  groundY: number;
}

function TrackBlock({
  posA, posB, slotIndex, totalSlots,
  railColor, claimed, routeType, routeId,
  onRouteClick, interactive, groundY,
}: SlotProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const dx = posB[0] - posA[0];
  const dz = posB[1] - posA[1];
  const totalLen = Math.sqrt(dx * dx + dz * dz);
  if (totalLen < 0.001) return null;

  const angle = Math.atan2(dx, dz);
  const gapLen  = totalLen * SLOT_GAP / totalSlots;
  const slotLen = (totalLen - gapLen * (totalSlots + 1)) / totalSlots;
  const step    = slotLen + gapLen;

  const nx = dx / totalLen, nz = dz / totalLen;
  const mx = (posA[0] + posB[0]) / 2;
  const mz = (posA[1] + posB[1]) / 2;

  const startOff = -(totalLen / 2) + gapLen + slotLen / 2;
  const offset   = startOff + slotIndex * step;

  const px = mx + nx * offset;
  const pz = mz + nz * offset;

  const isFerry  = routeType === RouteType.ferry;
  const isTunnel = routeType === RouteType.tunnel;
  const col = new THREE.Color(railColor);

  const handleOver  = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (matRef.current) matRef.current.emissiveIntensity = 0.75;
    if (interactive) document.body.style.cursor = 'pointer';
  };
  const handleOut   = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (matRef.current) matRef.current.emissiveIntensity = claimed ? 0.50 : 0.38;
    document.body.style.cursor = 'default';
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  };

  // Ferry: longer gap, aqua tint, slight wave rotation
  const blockW  = isFerry ? slotLen * 0.75 : slotLen * 0.82;
  const blockH  = isFerry ? BLOCK_H * 0.55 : BLOCK_H;
  const blockZ  = isFerry ? BLOCK_Z * 0.80 : BLOCK_Z;

  return (
    <mesh
      position={[px, groundY + blockH / 2, pz]}
      rotation={[0, angle, 0]}
      castShadow
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <boxGeometry args={[blockW, blockH, blockZ]} />
      <meshStandardMaterial
        ref={matRef}
        color={col}
        emissive={col}
        emissiveIntensity={claimed ? 0.50 : 0.38}
        roughness={isTunnel ? 0.20 : 0.50}
        metalness={0.18}
        transparent={isTunnel}
        opacity={isTunnel ? 0.80 : 1.0}
      />
    </mesh>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
interface Props {
  routes: Route[];
  playerColors: Record<string, string>;
  interactive: boolean;
  onRouteClick: (routeId: string) => void;
}

export function RouteMesh({ routes, playerColors, interactive, onRouteClick }: Props) {
  return (
    <group>
      {routes.map(route => {
        const from = cities[route.from];
        const to   = cities[route.to];
        if (!from || !to) return null;

        const posA = toWorld(from.x, from.y);
        const posB = toWorld(to.x, to.y);

        const claimed   = !!route.owner;
        const railColor = claimed
          ? (playerColors[route.id] ?? '#888')
          : (ROUTE_COLOR[route.color] ?? '#7890a0');

        // Parallel offset for double routes
        const sameEdge = routes.filter(r =>
          (r.from === route.from && r.to === route.to) ||
          (r.from === route.to   && r.to === route.from)
        );
        const edgeIdx = sameEdge.indexOf(route);
        const off = sameEdge.length > 1 ? (edgeIdx - 0.5) * 0.34 : 0;

        const dx = posB[0] - posA[0], dz = posB[1] - posA[1];
        const len = Math.sqrt(dx * dx + dz * dz);
        const perp: [number, number] = len > 0 ? [-dz / len, dx / len] : [0, 1];

        const oA: [number, number] = [posA[0] + perp[0] * off, posA[1] + perp[1] * off];
        const oB: [number, number] = [posB[0] + perp[0] * off, posB[1] + perp[1] * off];

        // Ground Y: average of the two city terrain heights
        const groundY = BOARD_Y;

        return Array.from({ length: route.length }, (_, i) => (
          <TrackBlock
            key={`${route.id}-${i}`}
            posA={oA} posB={oB}
            slotIndex={i} totalSlots={route.length}
            railColor={railColor}
            claimed={claimed}
            routeType={route.type}
            routeId={route.id}
            onRouteClick={onRouteClick}
            interactive={interactive}
            groundY={groundY}
          />
        ));
      })}
    </group>
  );
}
