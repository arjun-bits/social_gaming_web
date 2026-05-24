/**
 * RouteMesh.tsx
 * Top-down 2.5D route rendering:
 *   UNCLAIMED → Kenney GLB railroad track models with colored rails
 *   CLAIMED   → Kenney GLB train car models (player-colored)
 * Full-route hover highlighting + improved tooltips.
 */
import { useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Route } from '../../../../core/engine/ticket_europe/models';
import { RouteType } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';
import { ROUTE_COLOR } from './constants';
import { TrainModel } from './models/TrainModel';
import { TrackModel } from './models/TrackModel';

// ── Geometry constants (all in world units) ───────────────────────────────
const SLOT_GAP_F = 0.22;   // fraction of total length used for inter-slot gaps
const CAR_H = 0.12;         // claimed car block height

const FERRY_COLOR = new THREE.Color(0x2299cc); // ferry route tint

// ── Single route slot ─────────────────────────────────────────────────────
interface SlotProps {
  cx: number; cz: number;   // centre position of this slot
  angle: number;             // rotation Y (radians)
  slotLen: number;           // length of this slot
  slotIndex: number;         // index within the route
  railColor: THREE.Color;
  routeColorName: string;
  claimed: boolean;
  isFerry: boolean;
  isTunnel: boolean;
  routeId: string;
  onRouteClick: (id: string) => void;
  interactive: boolean;
  isRouteHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function RouteSlot({
  cx, cz, angle, slotLen, slotIndex,
  railColor, routeColorName, claimed, isFerry, isTunnel,
  routeId, onRouteClick, interactive, isRouteHovered,
  onHoverStart, onHoverEnd,
}: SlotProps) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);

  // Pulsing emissive animation when route is hovered
  useFrame(({ clock }) => {
    if (glowRef.current && isRouteHovered) {
      const pulse = Math.sin(clock.getElapsedTime() * 4) * 0.15 + 0.85;
      glowRef.current.emissiveIntensity = pulse;
    } else if (glowRef.current) {
      glowRef.current.emissiveIntensity = claimed ? 0.65 : 0.55;
    }
  });

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) {
      document.body.style.cursor = 'pointer';
      onHoverStart();
    }
  }, [interactive, onHoverStart]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
    if (interactive) {
      onHoverEnd();
    }
  }, [interactive, onHoverEnd]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  }, [interactive, onRouteClick, routeId]);

  const tileColor = isFerry ? FERRY_COLOR : railColor;

  // ── Terrain-Aware Dynamic Height ──
  const boardX = ((cx + 18) / 36) * 1000;
  const boardY = ((cz + 13) / 26) * 800;
  const terrainY = getTerrainHeight(boardX, boardY);

  const py = terrainY + (claimed ? CAR_H / 2 + 0.015 : 0.015);

  // Highlight glow overlay when route is hovered
  const glowColor = isRouteHovered ? new THREE.Color(0xffffff) : tileColor;

  // ── CLAIMED: Use Kenney GLB train models ───────────────────────
  if (claimed) {
    return (
      <group
        position={[cx, py, cz]}
        rotation={[0, angle, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <TrainModel
          routeColor={routeColorName}
          playerColor={tileColor}
          slotIndex={slotIndex}
          slotLen={slotLen}
        />
        {/* Hover glow disc */}
        {isRouteHovered && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <circleGeometry args={[slotLen * 0.5, 8]} />
            <meshStandardMaterial
              ref={glowRef}
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={0.85}
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    );
  }

  // ── UNCLAIMED: Use Kenney GLB track models ────────────────────
  return (
    <group
      position={[cx, py, cz]}
      rotation={[0, angle, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <TrackModel railColor={tileColor} slotLen={slotLen} />
      {/* Hover glow disc */}
      {isRouteHovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[slotLen * 0.5, 8]} />
          <meshStandardMaterial
            ref={glowRef}
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={0.85}
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      )}
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
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  return (
    <group>
      {routes.map(route => {
        const from = cities[route.from];
        const to = cities[route.to];
        if (!from || !to) return null;

        const posA = toWorld(from.x, from.y);
        const posB = toWorld(to.x, to.y);

        const dx = posB[0] - posA[0];
        const dz = posB[1] - posA[1];
        const totalLen = Math.sqrt(dx * dx + dz * dz);
        if (totalLen < 0.01) return null;

        const angle = Math.atan2(dx, dz) + Math.PI / 2;
        const nx = dx / totalLen, nz = dz / totalLen;

        const claimed = !!route.owner;
        const colorHex = claimed
          ? (playerColors[route.id] ? parseInt(playerColors[route.id].replace('#', ''), 16) : 0x888888)
          : (ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any);
        const railColor = new THREE.Color(colorHex);

        // Parallel offset for double routes
        const sameEdge = routes.filter(r =>
          (r.from === route.from && r.to === route.to) ||
          (r.from === route.to && r.to === route.from)
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

        const isFerry = route.type === RouteType.ferry;
        const isTunnel = route.type === RouteType.tunnel;

        // Slot geometry
        const gapLen = totalLen * SLOT_GAP_F / (route.length + 1);
        const slotLen = (totalLen - gapLen * (route.length + 1)) / route.length;
        const step = slotLen + gapLen;
        const startOff = -(totalLen / 2) + gapLen + slotLen / 2;

        const isHovered = route.id === hoveredRouteId;

        const slots = Array.from({ length: route.length }, (_, i) => {
          const offset = startOff + i * step;
          const cx = omx + nx * offset;
          const cz = omz + nz * offset;

          return (
            <RouteSlot
              key={`${route.id}-${i}`}
              cx={cx} cz={cz}
              angle={angle}
              slotLen={slotLen}
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
          );
        });

        // Floating Route Requirements Billboard — always shown on hover (removed interactive guard)
        const midPointX = (from.x + to.x) / 2;
        const midPointY = (from.y + to.y) / 2;
        const terrainH = getTerrainHeight(midPointX, midPointY);
        const labelY = terrainH + 0.68;

        const typeStr = isFerry 
          ? ` (FERRY: +${route.locomotivesRequired || 1} LOCO)` 
          : isTunnel 
            ? ' (TUNNEL)' 
            : '';
        const colorName = route.color === 'any' ? 'ANY COLOR' : route.color.toUpperCase();
        const reqStr = `${route.length} ${colorName} TRAINS${typeStr}`;

        // Route color swatch hex
        const swatchColor = `#${(ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any).toString(16).padStart(6, '0')}`;

        return (
          <group key={route.id}>
            {slots}
            {isHovered && (
              <Billboard position={[omx, labelY, omz]}>
                <mesh receiveShadow={false}>
                  <planeGeometry args={[5.0, 0.70]} />
                  <meshBasicMaterial color="#050a14" opacity={0.94} transparent depthWrite={false} />
                </mesh>
                {/* Route color swatch */}
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
