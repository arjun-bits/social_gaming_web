/**
 * RouteMesh.tsx
 * Top-down 2.5D route rendering:
 *   UNCLAIMED → two thin parallel rails + dark cross-ties per slot
 *   CLAIMED   → single solid train-car block in player colour (the "tile")
 *
 * This matches how Ticket to Ride works: players place their train car cards
 * on the route, and claimed segments show solid coloured car blocks.
 */
import React, { useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Route } from '../../../../core/engine/ticket_europe/models';
import { RouteType } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld } from '../EuropeBoard3D';

// ── Route colours (vivid, matches game cards) ─────────────────────────────
const ROUTE_COLOR: Record<string, number> = {
  red:    0xee1111, blue:   0x0055ee, green:  0x00aa22,
  yellow: 0xffcc00, black:  0x222233, white:  0xeeece4,
  pink:   0xee00aa, orange: 0xff6600, any:    0x88a0b0,
};

// ── Geometry constants (all in world units) ───────────────────────────────
const GROUND_Y     = 0.14;   // Fixed height above terrain (terrain max ~0.34, routes span flat areas)
const SLOT_GAP_F   = 0.22;   // fraction of total length used for inter-slot gaps
const RAIL_THICK   = 0.055;  // rail cross-section (Z)
const RAIL_H       = 0.07;   // rail height above ground
const RAIL_SEP     = 0.18;   // separation between two rails (centre-to-centre, measured Z)
const TIE_H        = 0.04;   // cross-tie height
const TIE_THICK    = 0.12;   // cross-tie depth along track
const TIE_W        = RAIL_SEP + 0.10; // tie spans both rails
const CAR_H        = 0.10;   // claimed car block height
const CAR_Z        = TIE_W + 0.04; // car width (slightly wider than tie span)

const TIE_COLOR = new THREE.Color(0x3a2808);   // dark wood
const FERRY_COLOR = new THREE.Color(0x2299cc); // ferry route tint

// ── Single route slot ─────────────────────────────────────────────────────
interface SlotProps {
  cx: number; cz: number;   // centre position of this slot
  angle: number;             // rotation Y (radians)
  slotLen: number;           // length of this slot
  railColor: THREE.Color;
  claimed: boolean;
  isFerry: boolean;
  isTunnel: boolean;
  routeId: string;
  onRouteClick: (id: string) => void;
  interactive: boolean;
}

function RouteSlot({
  cx, cz, angle, slotLen,
  railColor, claimed, isFerry, isTunnel,
  routeId, onRouteClick, interactive,
}: SlotProps) {
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = useRef<THREE.MeshStandardMaterial>(null);

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = 0.85; });
    if (interactive) document.body.style.cursor = 'pointer';
  }, [interactive]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const base = claimed ? 0.65 : 0.40;
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = base; });
    document.body.style.cursor = 'default';
  }, [claimed]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  }, [interactive, onRouteClick, routeId]);

  const carLen = slotLen * (isFerry ? 0.70 : 0.88);
  const tileColor = isFerry ? FERRY_COLOR : railColor;
  const emBase = claimed ? 0.65 : 0.40;

  const py = GROUND_Y + (claimed ? CAR_H / 2 : RAIL_H / 2);

  // ── CLAIMED: one solid train-car block ───────────────────────────────────
  if (claimed) {
    return (
      <group
        position={[cx, py, cz]}
        rotation={[0, angle, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        {/* Car body */}
        <mesh castShadow>
          <boxGeometry args={[carLen, CAR_H, CAR_Z]} />
          <meshStandardMaterial
            ref={matRef}
            color={tileColor}
            emissive={tileColor}
            emissiveIntensity={emBase}
            roughness={0.45}
            metalness={0.10}
            transparent={isTunnel}
            opacity={isTunnel ? 0.82 : 1}
          />
        </mesh>
        {/* Car end lines (black edges to distinguish individual cars) */}
        <mesh position={[carLen * 0.46, 0, 0]}>
          <boxGeometry args={[0.025, CAR_H + 0.01, CAR_Z + 0.01]} />
          <meshStandardMaterial color={0x111111} roughness={0.9} />
        </mesh>
        <mesh position={[-carLen * 0.46, 0, 0]}>
          <boxGeometry args={[0.025, CAR_H + 0.01, CAR_Z + 0.01]} />
          <meshStandardMaterial color={0x111111} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // ── UNCLAIMED: two rails + one cross-tie ─────────────────────────────────
  const railLen = carLen;

  return (
    <group
      position={[cx, GROUND_Y, cz]}
      rotation={[0, angle, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {/* Rail A (left of track direction) */}
      <mesh position={[0, RAIL_H / 2, -RAIL_SEP / 2]} castShadow>
        <boxGeometry args={[railLen, RAIL_H, RAIL_THICK]} />
        <meshStandardMaterial
          ref={matRef}
          color={tileColor}
          emissive={tileColor}
          emissiveIntensity={emBase}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      {/* Rail B (right of track direction) */}
      <mesh position={[0, RAIL_H / 2,  RAIL_SEP / 2]} castShadow>
        <boxGeometry args={[railLen, RAIL_H, RAIL_THICK]} />
        <meshStandardMaterial
          ref={matRef2}
          color={tileColor}
          emissive={tileColor}
          emissiveIntensity={emBase}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      {/* Cross-tie in center */}
      <mesh position={[0, TIE_H / 2, 0]}>
        <boxGeometry args={[TIE_THICK, TIE_H, TIE_W]} />
        <meshLambertMaterial color={TIE_COLOR} />
      </mesh>
      {/* Cross-tie at 1/3 and 2/3 positions for longer slots */}
      <mesh position={[railLen * 0.3, TIE_H / 2, 0]}>
        <boxGeometry args={[TIE_THICK, TIE_H, TIE_W]} />
        <meshLambertMaterial color={TIE_COLOR} />
      </mesh>
      <mesh position={[-railLen * 0.3, TIE_H / 2, 0]}>
        <boxGeometry args={[TIE_THICK, TIE_H, TIE_W]} />
        <meshLambertMaterial color={TIE_COLOR} />
      </mesh>
    </group>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
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

        const dx = posB[0] - posA[0];
        const dz = posB[1] - posA[1];
        const totalLen = Math.sqrt(dx * dx + dz * dz);
        if (totalLen < 0.01) return null;

        const angle = Math.atan2(dx, dz) + Math.PI / 2;
        const nx = dx / totalLen, nz = dz / totalLen;

        const claimed   = !!route.owner;
        const colorHex  = claimed
          ? (playerColors[route.id] ? parseInt(playerColors[route.id].replace('#', ''), 16) : 0x888888)
          : (ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any);
        const railColor = new THREE.Color(colorHex);

        // Parallel offset for double routes
        const sameEdge = routes.filter(r =>
          (r.from === route.from && r.to === route.to) ||
          (r.from === route.to   && r.to === route.from)
        );
        const edgeIdx = sameEdge.indexOf(route);
        const off = sameEdge.length > 1 ? (edgeIdx - 0.5) * 0.32 : 0;
        const perp: [number, number] = [-nz, nx];

        const oAx = posA[0] + perp[0] * off;
        const oAz = posA[1] + perp[1] * off;
        const oBx = posB[0] + perp[0] * off;
        const oBz = posB[1] + perp[1] * off;
        const omx = (oAx + oBx) / 2;
        const omz = (oAz + oBz) / 2;

        const isFerry  = route.type === RouteType.ferry;
        const isTunnel = route.type === RouteType.tunnel;

        // Slot geometry
        const gapLen  = totalLen * SLOT_GAP_F / (route.length + 1);
        const slotLen = (totalLen - gapLen * (route.length + 1)) / route.length;
        const step    = slotLen + gapLen;
        const startOff = -(totalLen / 2) + gapLen + slotLen / 2;

        return Array.from({ length: route.length }, (_, i) => {
          const offset = startOff + i * step;
          const cx = omx + nx * offset;
          const cz = omz + nz * offset;

          return (
            <RouteSlot
              key={`${route.id}-${i}`}
              cx={cx} cz={cz}
              angle={angle}
              slotLen={slotLen}
              railColor={railColor}
              claimed={claimed}
              isFerry={isFerry}
              isTunnel={isTunnel}
              routeId={route.id}
              onRouteClick={onRouteClick}
              interactive={interactive}
            />
          );
        });
      })}
    </group>
  );
}
