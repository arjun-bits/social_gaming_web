/**
 * RouteMesh.tsx
 * Top-down 2.5D route rendering:
 *   UNCLAIMED → physical wooden sleepers + two shiny parallel steel rails (box geometry)
 *   CLAIMED   → high-fidelity low-poly toy train car with wheels, chassis, and details
 * Positions & angles pre-computed by boardSceneGraph. Hover highlighting + tooltips.
 */
import React, { useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Route } from '../../../../core/engine/ticket_europe/models';
import { RouteType } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { graph } from '../../boardSceneGraph';
import { ROUTE_COLOR } from './constants';

// ── Geometry constants (all in world units) ───────────────────────────────
const RAIL_THICK = 0.045;  // rail cross-section (Z)
const RAIL_SEP   = 0.18;   // separation between two rails (centre-to-centre, measured Z)
const CAR_H      = 0.12;   // claimed car block height
const CAR_Z      = RAIL_SEP + 0.08; // car width (slightly wider than tie span)

const FERRY_COLOR = new THREE.Color(0x2299cc); // ferry route tint

// ── Single route slot ─────────────────────────────────────────────────────
interface SlotProps {
  cx: number;
  cz: number;
  slotY: number;
  angle: number;
  slotLen: number;
  slotIndex: number;
  railColor: THREE.Color;
  routeColorName: string;
  claimed: boolean;
  isFerry: boolean;
  isTunnel: boolean;
  routeId: string;
  onRouteClick: (routeId: string) => void;
  interactive: boolean;
  isRouteHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const RouteSlotComponent = React.memo(function RouteSlotComponent({
  cx, cz, slotY, angle, slotLen, slotIndex,
  railColor, routeColorName, claimed, isFerry, isTunnel,
  routeId, onRouteClick, interactive, isRouteHovered,
  onHoverStart, onHoverEnd,
}: SlotProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = useRef<THREE.MeshStandardMaterial>(null);

  const emBase = claimed ? 0.65 : 0.60;

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Direct emissive update for instant visual feedback
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = 0.85; });
    if (interactive) {
      document.body.style.cursor = 'pointer';
      onHoverStart();
    }
  }, [interactive, onHoverStart]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = emBase; });
    document.body.style.cursor = 'default';
    if (interactive) {
      onHoverEnd();
    }
  }, [interactive, onHoverEnd, emBase]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  }, [interactive, onRouteClick, routeId]);

  const carLen = slotLen * (isFerry ? 0.70 : 0.88);
  const tileColor = isFerry ? FERRY_COLOR : railColor;

  // Y position from graph pre-computation
  const py = slotY + (claimed ? CAR_H / 2 : 0);

  // Box geometries extend along local X, so add π/2 to align them along the route direction
  const renderAngle = angle + Math.PI / 2;

  // ── CLAIMED: High-fidelity low-poly train car model ───────────────────
  if (claimed) {
    return (
      <group
        position={[cx, py, cz]}
        rotation={[0, renderAngle, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        {/* Chassis Base - Dark metallic bar */}
        <mesh position={[0, -CAR_H * 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[carLen * 0.94, CAR_H * 0.16, CAR_Z * 0.88]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.2} />
        </mesh>

        {/* Wheels - 4 cylinders */}
        {([-0.3, 0.3] as const).map(xOff =>
          ([-0.42, 0.42] as const).map(zOff => (
            <mesh key={`${xOff}_${zOff}`} position={[carLen * xOff, -CAR_H * 0.38, CAR_Z * zOff]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.032, 0.015, 6]} />
              <meshStandardMaterial color="#0c0c0c" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Main Cabin body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[carLen * 0.90, CAR_H * 0.72, CAR_Z * 0.82]} />
          <meshStandardMaterial
            ref={matRef}
            color={tileColor}
            emissive={tileColor}
            emissiveIntensity={emBase}
            roughness={0.42}
            metalness={0.12}
            transparent={isTunnel}
            opacity={isTunnel ? 0.82 : 1}
            flatShading
          />
        </mesh>

        {/* Cabin end details (plugs) */}
        <mesh position={[carLen * 0.44, 0, 0]} castShadow>
          <boxGeometry args={[0.02, CAR_H * 0.4, CAR_Z * 0.4]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        <mesh position={[-carLen * 0.44, 0, 0]} castShadow>
          <boxGeometry args={[0.02, CAR_H * 0.4, CAR_Z * 0.4]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>

        {/* Cargo ribs/roof bands for corrugated metal style */}
        {([-0.25, 0, 0.25] as const).map(offset => (
          <mesh key={offset} position={[carLen * offset, CAR_H * 0.36 + 0.005, 0]} castShadow>
            <boxGeometry args={[0.03, 0.015, CAR_Z * 0.84]} />
            <meshStandardMaterial color={tileColor.clone().multiplyScalar(0.72)} roughness={0.5} />
          </mesh>
        ))}
      </group>
    );
  }

  // ── UNCLAIMED: 3D track beds and metallic rails ────────────────────────
  const railLen = carLen;

  return (
    <group
      position={[cx, py, cz]}
      rotation={[0, renderAngle, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {/* Invisible hit area — large enough for reliable hover/click detection */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[slotLen, 0.15, RAIL_SEP + 0.18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Gravel/wooden sleeper bed base */}
      <mesh position={[0, 0.005, 0]} receiveShadow castShadow>
        <boxGeometry args={[slotLen * 0.96, 0.025, RAIL_SEP + 0.12]} />
        <meshStandardMaterial color="#30241e" roughness={0.95} flatShading />
      </mesh>

      {/* Wooden cross-ties (sleepers) */}
      {([-0.3, 0, 0.3] as const).map(xOff => (
        <mesh key={xOff} position={[railLen * xOff, 0.015, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.05, 0.02, RAIL_SEP + 0.16]} />
          <meshStandardMaterial color="#1e140f" roughness={0.9} />
        </mesh>
      ))}

      {/* Rail A (left steel track) */}
      <mesh position={[0, 0.035, -RAIL_SEP / 2]} castShadow receiveShadow>
        <boxGeometry args={[railLen, 0.04, RAIL_THICK]} />
        <meshStandardMaterial
          ref={matRef}
          color={tileColor}
          emissive={tileColor}
          emissiveIntensity={emBase}
          roughness={0.22}
          metalness={0.75}
        />
      </mesh>

      {/* Rail B (right steel track) */}
      <mesh position={[0, 0.035, RAIL_SEP / 2]} castShadow receiveShadow>
        <boxGeometry args={[railLen, 0.04, RAIL_THICK]} />
        <meshStandardMaterial
          ref={matRef2}
          color={tileColor}
          emissive={tileColor}
          emissiveIntensity={emBase}
          roughness={0.22}
          metalness={0.75}
        />
      </mesh>
    </group>
  );
});

// ── Main ──────────────────────────────────────────────────────────────────
interface Props {
  routes: Route[];
  playerColors: Record<string, string>;
  interactive: boolean;
  onRouteClick: (routeId: string) => void;
}

export function RouteMesh({ routes, playerColors, interactive, onRouteClick }: Props) {
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  // Build a lookup from route.id → graph edge (pre-computed slots/angles)
  const edgeLookup = useMemo(() => {
    const map = new Map<string, typeof graph.routes[number]>();
    for (const edge of graph.routes) {
      map.set(edge.id, edge);
    }
    return map;
  }, []);

  return (
    <group>
      {routes.map(route => {
        const edge = edgeLookup.get(route.id);
        if (!edge) return null;

        const from = cities[route.from];
        const to = cities[route.to];
        if (!from || !to) return null;

        const claimed = !!route.owner;
        const colorHex = claimed
          ? (playerColors[route.id] ? parseInt(playerColors[route.id].replace('#', ''), 16) : 0x888888)
          : (ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any);
        const railColor = new THREE.Color(colorHex);

        const isFerry = route.type === RouteType.ferry;
        const isTunnel = route.type === RouteType.tunnel;
        const isHovered = route.id === hoveredRouteId;

        // Read pre-computed slots from graph
        const slots = edge.slots.map((slot, i) => (
          <RouteSlotComponent
            key={`${route.id}-${i}`}
            cx={slot.worldPos.x}
            cz={slot.worldPos.z}
            slotY={slot.worldPos.y}
            angle={slot.angle}
            slotLen={slot.length}
            slotIndex={i}
            railColor={railColor}
            routeColorName={route.color}
            claimed={claimed}
            isFerry={isFerry}
            isTunnel={isTunnel}
            routeId={route.id}
            onRouteClick={onRouteClick}
            interactive={interactive}
            isRouteHovered={isHovered}
            onHoverStart={() => setHoveredRouteId(route.id)}
            onHoverEnd={() => setHoveredRouteId(null)}
          />
        ));

        // ── Track Continuity: Connecting strips between slots ──
        const connectors: React.ReactNode[] = [];
        const connColor = claimed ? railColor : new THREE.Color('#30241e');
        const connEmissive = claimed ? railColor : new THREE.Color('#201408');

        // Between adjacent slots (gap fillers)
        for (let i = 0; i < edge.slots.length - 1; i++) {
          const s1 = edge.slots[i];
          const s2 = edge.slots[i + 1];
          const mx = (s1.worldPos.x + s2.worldPos.x) / 2;
          const mz = (s1.worldPos.z + s2.worldPos.z) / 2;
          const my = (s1.worldPos.y + s2.worldPos.y) / 2 + 0.01;
          const gdx = s2.worldPos.x - s1.worldPos.x;
          const gdz = s2.worldPos.z - s1.worldPos.z;
          const gapLen = Math.sqrt(gdx * gdx + gdz * gdz) - s1.length * 0.42;
          if (gapLen > 0.01) {
            const gAngle = Math.atan2(gdx, gdz) + Math.PI / 2;
            connectors.push(
              <mesh key={`conn-${route.id}-${i}`} position={[mx, my, mz]} rotation={[0, gAngle, 0]}>
                <boxGeometry args={[gapLen, 0.012, 0.08]} />
                <meshStandardMaterial
                  color={connColor}
                  emissive={connEmissive}
                  emissiveIntensity={0.25}
                  roughness={0.85}
                  flatShading
                />
              </mesh>
            );
          }
        }

        // City approach strips (from city to first slot, and to last slot)
        const fromNode = graph.cities[route.from];
        const toNode = graph.cities[route.to];
        if (fromNode && edge.slots.length > 0) {
          const firstSlot = edge.slots[0];
          const adx = firstSlot.worldPos.x - fromNode.worldPos.x;
          const adz = firstSlot.worldPos.z - fromNode.worldPos.z;
          const approachLen = Math.sqrt(adx * adx + adz * adz);
          if (approachLen > 0.15) {
            const amx = (fromNode.worldPos.x + firstSlot.worldPos.x) / 2;
            const amz = (fromNode.worldPos.z + firstSlot.worldPos.z) / 2;
            const amy = (fromNode.worldPos.y + firstSlot.worldPos.y) / 2;
            const aAngle = Math.atan2(adx, adz) + Math.PI / 2;
            connectors.push(
              <mesh key={`app-from-${route.id}`} position={[amx, amy, amz]} rotation={[0, aAngle, 0]}>
                <boxGeometry args={[approachLen * 0.8, 0.014, 0.08]} />
                <meshStandardMaterial color={connColor} roughness={0.9} flatShading />
              </mesh>
            );
          }
        }
        if (toNode && edge.slots.length > 0) {
          const lastSlot = edge.slots[edge.slots.length - 1];
          const adx = toNode.worldPos.x - lastSlot.worldPos.x;
          const adz = toNode.worldPos.z - lastSlot.worldPos.z;
          const approachLen = Math.sqrt(adx * adx + adz * adz);
          if (approachLen > 0.15) {
            const amx = (lastSlot.worldPos.x + toNode.worldPos.x) / 2;
            const amz = (lastSlot.worldPos.z + toNode.worldPos.z) / 2;
            const amy = (lastSlot.worldPos.y + toNode.worldPos.y) / 2;
            const aAngle = Math.atan2(adx, adz) + Math.PI / 2;
            connectors.push(
              <mesh key={`app-to-${route.id}`} position={[amx, amy, amz]} rotation={[0, aAngle, 0]}>
                <boxGeometry args={[approachLen * 0.8, 0.014, 0.08]} />
                <meshStandardMaterial color={connColor} roughness={0.9} flatShading />
              </mesh>
            );
          }
        }

        // Tooltip label — pre-computed midpoint from graph
        const labelY = edge.midpoint.y + 0.68;

        const typeStr = isFerry
          ? ` (FERRY: +${route.locomotivesRequired || 1} LOCO)`
          : isTunnel
            ? ' (TUNNEL)'
            : '';
        const colorName = route.color === 'any' ? 'ANY COLOR' : route.color.toUpperCase();
        const reqStr = `${route.length} ${colorName} TRAINS${typeStr}`;
        const swatchColor = `#${(ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any).toString(16).padStart(6, '0')}`;

        return (
          <group key={route.id}>
            {connectors}
            {slots}
            {isHovered && (
              <Billboard position={[edge.midpoint.x, labelY, edge.midpoint.z]}>
                <mesh receiveShadow={false}>
                  <planeGeometry args={[5.0, 0.70]} />
                  <meshBasicMaterial color="#050a14" opacity={0.94} transparent depthWrite={false} />
                </mesh>
                <mesh position={[-2.1, 0.12, 0.01]}>
                  <circleGeometry args={[0.08, 8]} />
                  <meshBasicMaterial color={swatchColor} />
                </mesh>
                <Text
                  fontSize={0.22}
                  color="#ffffff"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0.12, 0]}
                >
                  {`${from.name.toUpperCase()} ➔ ${to.name.toUpperCase()}`}
                </Text>
                <Text
                  fontSize={0.18}
                  color="#00E5FF"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, -0.14, 0]}
                >
                  {reqStr}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}
