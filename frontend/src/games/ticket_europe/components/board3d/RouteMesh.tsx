/**
 * RouteMesh.tsx
 * Top-down 2.5D route rendering:
 *   UNCLAIMED → Kenney straight railroad tracks with colored emissive rails
 *   CLAIMED   → Kenney low-poly train locomotive + varying carriages tinted in player color
 */
import { useCallback, useState } from 'react';
import { Text, Billboard } from '@react-three/drei';
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

// ── Single route slot ─────────────────────────────────────────────────────
interface SlotProps {
  cx: number; cz: number;   // centre position of this slot
  angle: number;             // rotation Y (radians)
  colorHex: string;
  claimed: boolean;
  routeId: string;
  onRouteClick: (id: string) => void;
  interactive: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  isRouteHovered: boolean;
  slotIndex: number;
}

function RouteSlot({
  cx, cz, angle,
  colorHex, claimed,
  routeId, onRouteClick, interactive,
  onHoverStart, onHoverEnd,
  isRouteHovered, slotIndex
}: SlotProps) {

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) {
      document.body.style.cursor = 'pointer';
    }
    // Hover start triggers full route hover highlighting
    onHoverStart();
  }, [interactive, onHoverStart]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) {
      document.body.style.cursor = 'default';
    }
    onHoverEnd();
  }, [interactive, onHoverEnd]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  }, [interactive, onRouteClick, routeId]);


  // ── Terrain-Aware Dynamic Height ──
  const boardX = ((cx + 18) / 36) * 1000; // Updated to match expanded 36x26 board space
  const boardY = ((cz + 13) / 26) * 800;
  const terrainY = getTerrainHeight(boardX, boardY);

  const py = terrainY + (claimed ? 0.015 : 0.005);

  // ── CLAIMED: High-fidelity Kenney low-poly train car model ───────────
  if (claimed) {
    // Slot 0 is the locomotive pulling the train
    const isLoco = slotIndex === 0;
    // Alternate carriage styles for realistic texture variety (container, coal, tank)
    const carriageType = slotIndex % 3 === 1 ? 'container' : slotIndex % 3 === 2 ? 'coal' : 'tank';
    
    return (
      <group
        position={[cx, py, cz]}
        rotation={[0, angle, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <TrainModel color={colorHex} isLocomotive={isLoco} type={carriageType} />
      </group>
    );
  }

  // ── UNCLAIMED: Kenney Straight Railroad tracks with glowing rails ────
  return (
    <group
      position={[cx, py, cz]}
      rotation={[0, angle, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <TrackModel color={colorHex} isHighlighted={isRouteHovered} />
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
          ? (playerColors[route.id] || '#888888')
          : '#' + (ROUTE_COLOR[route.color] ?? ROUTE_COLOR.any).toString(16).padStart(6, '0');

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

        // Slot geometry calculations
        const gapLen = totalLen * SLOT_GAP_F / (route.length + 1);
        const slotLen = (totalLen - gapLen * (route.length + 1)) / route.length;
        const step = slotLen + gapLen;
        const startOff = -(totalLen / 2) + gapLen + slotLen / 2;

        const isRouteHovered = route.id === hoveredRouteId;

        const slots = Array.from({ length: route.length }, (_, i) => {
          const offset = startOff + i * step;
          const cx = omx + nx * offset;
          const cz = omz + nz * offset;

          return (
            <RouteSlot
              key={`${route.id}-${i}`}
              cx={cx} cz={cz}
              angle={angle}
              colorHex={colorHex}
              claimed={claimed}
              routeId={route.id}
              onRouteClick={onRouteClick}
              interactive={interactive}
              onHoverStart={() => setHoveredRouteId(route.id)}
              onHoverEnd={() => setHoveredRouteId(null)}
              isRouteHovered={isRouteHovered}
              slotIndex={i}
            />
          );
        });

        // Floating Route Requirements Billboard on Hover
        const midPointX = (from.x + to.x) / 2;
        const midPointY = (from.y + to.y) / 2;
        const terrainH = getTerrainHeight(midPointX, midPointY);
        // Float nicely above terrain features
        const labelY = terrainH + 0.85;

        const typeStr = isFerry 
          ? ` (FERRY: +${route.locomotivesRequired || 1} LOCO)` 
          : isTunnel 
            ? ' (TUNNEL)' 
            : '';
        const colorName = route.color === 'any' ? 'ANY COLOR' : route.color.toUpperCase();
        const reqStr = `${route.length} ${colorName} TRAINS${typeStr}`;

        return (
          <group key={route.id}>
            {slots}
            {isRouteHovered && (
              <Billboard position={[omx, labelY, omz]}>
                {/* Expanded premium layout and typography */}
                <mesh receiveShadow={false}>
                  <planeGeometry args={[5.0, 0.70]} />
                  <meshBasicMaterial color="#050a14" opacity={0.95} transparent depthWrite={false} />
                </mesh>
                <Text
                  fontSize={0.24}
                  color="#ffffff"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0.18, 0]}
                  outlineWidth={0.012}
                  outlineColor="#000000"
                >
                  {`${from.name.toUpperCase()} ➔ ${to.name.toUpperCase()}`}
                </Text>
                <Text
                  fontSize={0.18}
                  color="#00E5FF"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, -0.16, 0]}
                  outlineWidth={0.01}
                  outlineColor="#000000"
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
