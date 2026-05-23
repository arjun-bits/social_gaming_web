/**
 * RouteMesh.tsx
 * Top-down 2.5D route rendering:
 *   UNCLAIMED → physical wooden sleepers + two shiny parallel steel rails
 *   CLAIMED   → high-fidelity low-poly toy train car with wheels, chassis, and details
 */
import { useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Route } from '../../../../core/engine/ticket_europe/models';
import { RouteType } from '../../../../core/engine/ticket_europe/models';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

// ── Route colours (vivid, matches game cards) ─────────────────────────────
const ROUTE_COLOR: Record<string, number> = {
  red: 0xee1111, blue: 0x0055ee, green: 0x00aa22,
  yellow: 0xffcc00, black: 0x222233, white: 0xeeece4,
  pink: 0xee00aa, orange: 0xff6600, any: 0x88a0b0,
};

// ── Geometry constants (all in world units) ───────────────────────────────
const SLOT_GAP_F = 0.22;   // fraction of total length used for inter-slot gaps
const RAIL_THICK = 0.045;  // rail cross-section (Z)
const RAIL_SEP = 0.18;   // separation between two rails (centre-to-centre, measured Z)
const CAR_H = 0.12;   // claimed car block height
const CAR_Z = RAIL_SEP + 0.08; // car width (slightly wider than tie span)

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
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function RouteSlot({
  cx, cz, angle, slotLen,
  railColor, claimed, isFerry, isTunnel,
  routeId, onRouteClick, interactive,
  onHoverStart, onHoverEnd,
}: SlotProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = useRef<THREE.MeshStandardMaterial>(null);

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = 0.85; });
    if (interactive) {
      document.body.style.cursor = 'pointer';
      onHoverStart();
    }
  }, [interactive, onHoverStart]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const base = claimed ? 0.65 : 0.40;
    [matRef, matRef2].forEach(r => { if (r.current) r.current.emissiveIntensity = base; });
    document.body.style.cursor = 'default';
    if (interactive) {
      onHoverEnd();
    }
  }, [claimed, interactive, onHoverEnd]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) onRouteClick(routeId);
  }, [interactive, onRouteClick, routeId]);

  const carLen = slotLen * (isFerry ? 0.70 : 0.88);
  const tileColor = isFerry ? FERRY_COLOR : railColor;
  const emBase = claimed ? 0.65 : 0.40;

  // ── Terrain-Aware Dynamic Height ──
  const boardX = ((cx + 12.25) / 24.5) * 1000;
  const boardY = ((cz + 8.75) / 17.5) * 800;
  const terrainY = getTerrainHeight(boardX, boardY);

  const py = terrainY + (claimed ? CAR_H / 2 + 0.015 : 0.015);

  // ── CLAIMED: High-fidelity low-poly train car model ───────────────────
  if (claimed) {
    return (
      <group
        position={[cx, py, cz]}
        rotation={[0, angle, 0]}
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
      rotation={[0, angle, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {/* Gravel/wooden sleeper bed base */}
      <mesh position={[0, 0.005, 0]} receiveShadow castShadow>
        <boxGeometry args={[slotLen * 0.96, 0.015, RAIL_SEP + 0.12]} />
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
        <boxGeometry args={[railLen, 0.03, RAIL_THICK]} />
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
        <boxGeometry args={[railLen, 0.03, RAIL_THICK]} />
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
              railColor={railColor}
              claimed={claimed}
              isFerry={isFerry}
              isTunnel={isTunnel}
              routeId={route.id}
              onRouteClick={onRouteClick}
              interactive={interactive}
              onHoverStart={() => setHoveredRouteId(route.id)}
              onHoverEnd={() => setHoveredRouteId(null)}
            />
          );
        });

        // Floating Route Requirements Billboard on Hover (Clean Graph Edge details)
        const isHovered = route.id === hoveredRouteId;
        const midPointX = (from.x + to.x) / 2;
        const midPointY = (from.y + to.y) / 2;
        const terrainH = getTerrainHeight(midPointX, midPointY);
        // Float nicely above terrain features
        const labelY = terrainH + 0.68;

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
            {isHovered && interactive && (
              <Billboard position={[omx, labelY, omz]}>
                <mesh receiveShadow={false}>
                  <planeGeometry args={[3.2, 0.46]} />
                  <meshBasicMaterial color="#050a14" opacity={0.94} transparent depthWrite={false} />
                </mesh>
                <Text
                  fontSize={0.14}
                  color="#ffffff"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0.12, 0]}
                >
                  {`${from.name.toUpperCase()} ➔ ${to.name.toUpperCase()}`}
                </Text>
                <Text
                  fontSize={0.11}
                  color="#00E5FF"
                  fontWeight="bold"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, -0.10, 0]}
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
