/**
 * boardSceneGraph.ts — Single Source of Truth for all board 3D positions.
 *
 * Pure TypeScript module (no React, no Three.js). Computed once at import
 * time and frozen. Every R3F component reads from this graph instead of
 * computing its own coordinates, elevations, or angles.
 *
 * Architecture based on:
 *  - von-grid Board.js pattern (data → visual bridge)
 *  - Red Blob Games SSOT principle (separate data from rendering)
 *  - TTR adjacency list graph (cities = nodes, routes = edges)
 *  - TypeScript immutable data pattern (readonly everywhere)
 */

import { cities, initialRoutes, initialTickets } from '../../core/engine/ticket_europe/boardData';
import { RouteType } from '../../core/engine/ticket_europe/models';
import { CITY_REGION, LIGHTHOUSE_CITIES } from './components/board3d/constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Board-space coordinate [0,1000] × [0,800] */
export interface BoardPos {
  readonly bx: number;
  readonly by: number;
}

/** 3D world-space coordinate */
export interface WorldPos {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A city node in the graph */
export interface CityNode {
  readonly id: string;
  readonly name: string;
  readonly boardPos: BoardPos;
  readonly worldPos: WorldPos;
  readonly elevation: number;       // raw terrain elevation at city
  readonly stationY: number;        // guaranteed above-terrain Y for buildings
  readonly region: string;
  readonly isLighthouse: boolean;
}

/** A single pre-computed route slot (1 track piece / 1 train car) */
export interface RouteSlot {
  readonly worldPos: WorldPos;
  readonly angle: number;           // Y rotation (radians)
  readonly length: number;          // visual length of this slot
}

/** A route edge in the graph */
export interface RouteEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly color: string;
  readonly length: number;
  readonly type: 'normal' | 'ferry' | 'tunnel';
  readonly locomotivesRequired: number;
  readonly angle: number;           // overall route Y rotation
  readonly slots: readonly RouteSlot[];
  readonly midpoint: WorldPos;
  readonly parallelOffset: number;  // offset for double routes
}

/** Elevation sample point for IDW interpolation */
export interface ElevationSample {
  readonly bx: number;
  readonly by: number;
  readonly elevation: number;
  readonly label?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOARD DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════════

const BOARD_W = 1000;
const BOARD_H = 800;
const WORLD_W = 36;   // X: -18 to +18
const WORLD_D = 26;   // Z: -13 to +13
const HALF_W  = WORLD_W / 2;  // 18
const HALF_D  = WORLD_D / 2;  // 13

// Slot layout constant (fraction of total length used for inter-slot gaps)
const SLOT_GAP_F = 0.22;

// Station clearance above terrain (world units)
const STATION_CLEARANCE = 0.08;
const MIN_STATION_Y     = 0.10;

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE MAPPING (centralized — never duplicate these!)
// ═══════════════════════════════════════════════════════════════════════════

/** Board space → World XZ */
export function toWorld(bx: number, by: number): [number, number] {
  return [
    (bx / BOARD_W) * WORLD_W - HALF_W,
    (by / BOARD_H) * WORLD_D - HALF_D,
  ];
}

/** World XZ → Board space (inverse of toWorld) */
export function fromWorld(worldX: number, worldZ: number): [number, number] {
  return [
    ((worldX + HALF_W) / WORLD_W) * BOARD_W,
    ((worldZ + HALF_D) / WORLD_D) * BOARD_H,
  ];
}

/** Board space → World XYZ (includes elevation) */
export function toWorld3D(bx: number, by: number): WorldPos {
  const [x, z] = toWorld(bx, by);
  const y = elevationAt(bx, by);
  return { x, y, z };
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEVATION DATA (moved from TerrainMesh.tsx — centralized here)
// ═══════════════════════════════════════════════════════════════════════════

/** Per-city elevation values */
export const CITY_ELEVATION: Record<string, number> = {
  zurich:     0.40, munchen:   0.38, wien:      0.35, frankfurt:  0.14,
  marseille:  0.22, roma:      0.16, venezia:   0.18, napoli:     0.15,
  barcelona:  0.24, madrid:    0.38, lisbon:    0.16, palermo:    0.12,
  sarajevo:   0.45, sofia:     0.32, zagreb:    0.35, budapest:   0.16,
  bucuresti:  0.10, athina:    0.20, berlin:    0.05, warszawa:   0.04,
  amsterdam:  0.08, brussels:  0.04, paris:     0.07, london:     0.06,
  edinburgh:  0.28, stockholm: 0.20, copenhagen:0.07, kyiv:       0.05,
  moskva:     0.04, bruxelles: 0.04,
  dublin:     0.06, oslo:      0.18, istanbul:  0.12, sevastopol: 0.08,
};

/** Terrain scatter points for IDW interpolation [boardX, boardY, elevation] */
export const SCATTER: ReadonlyArray<readonly [number, number, number]> = [
  // Alpine core
  [490, 268, 0.88], [512, 255, 0.84], [468, 262, 0.82], [534, 260, 0.80],
  [500, 290, 0.82], [455, 278, 0.72], [548, 272, 0.70],
  [480, 330, 0.76], [520, 310, 0.72], [460, 320, 0.68], [540, 330, 0.65],
  [510, 360, 0.62], [430, 350, 0.58], [420, 390, 0.50], [530, 380, 0.55],
  // Pyrenees & Iberian interior
  [310, 380, 0.65], [345, 368, 0.68], [372, 376, 0.60], [392, 370, 0.58],
  [140, 560, 0.35], [160, 590, 0.32], [180, 610, 0.30], [210, 650, 0.28],
  [120, 600, 0.34], [90,  630, 0.26], [60,  670, 0.22], [150, 660, 0.25],
  // Apennines & Italian interior
  [430, 530, 0.22], [470, 580, 0.25], [490, 610, 0.24], [460, 630, 0.22],
  [410, 480, 0.18], [420, 500, 0.20],
  // Scottish highlands & British Isles
  [192, 128, 0.45], [218, 144, 0.38], [204, 160, 0.36],
  [150, 160, 0.22], [170, 180, 0.20], [190, 120, 0.25], [210, 100, 0.30],
  [120, 120, 0.15], [90,  140, 0.12], [100, 180, 0.12],
  // Scandinavian highlands & valleys
  [490, 72, 0.40], [560, 55, 0.44], [640, 65, 0.36], [720, 58, 0.32],
  [820, 85, 0.25], [380, 88, 0.32],
  [500, 40,  0.38], [530, 30,  0.42], [570, 45,  0.35], [470, 50,  0.32],
  [480, 95,  0.28], [520, 110, 0.25], [560, 130, 0.22], [600, 110, 0.24],
  // Balkans/Carpathians
  [650, 310, 0.55], [672, 335, 0.52], [636, 325, 0.48],
  [598, 400, 0.45], [618, 420, 0.40], [582, 435, 0.38],
  [660, 420, 0.36], [680, 450, 0.32], [700, 480, 0.28], [720, 510, 0.25],
  [650, 560, 0.24], [670, 590, 0.20], [690, 620, 0.18], [630, 610, 0.22],
  // Eastern plains (flat)
  [860, 180, 0.04], [940, 280, 0.04], [980, 380, 0.04],
  [920, 460, 0.04], [860, 540, 0.04], [760, 320, 0.05],
  [750, 150, 0.05], [820, 160, 0.04], [880, 130, 0.04], [920, 110, 0.04],
  [780, 220, 0.05], [850, 230, 0.04], [900, 250, 0.05], [950, 220, 0.04],
  [760, 360, 0.06], [820, 370, 0.05], [880, 340, 0.04], [920, 320, 0.05],
  [730, 470, 0.08], [800, 460, 0.06], [850, 440, 0.05], [890, 420, 0.04],
  // Atlantic coast interior
  [20,  50,  0.07], [80, 120,  0.09], [40, 280, 0.07],
  [20, 420,  0.07], [80, 580,  0.07], [140, 680, 0.06],
  // Mediterranean lowlands & islands
  [460, 550, 0.11], [530, 600, 0.09], [600, 580, 0.10],
  [498, 680, 0.11], [580, 700, 0.09],
  // British Isles fill
  [155, 200, 0.09], [180, 250, 0.11], [200, 300, 0.09], [225, 350, 0.07],
  // Central Plains (France, Germany, Extra fill)
  [400, 200, 0.07], [500, 200, 0.06], [600, 200, 0.06], [700, 200, 0.05],
  [400, 400, 0.10], [500, 450, 0.09], [600, 350, 0.08], [700, 400, 0.07],
  [300, 300, 0.09], [350, 450, 0.10], [400, 550, 0.09], [450, 650, 0.10],
  [550, 500, 0.09], [650, 500, 0.08], [750, 450, 0.07], [800, 350, 0.06],
  [280, 280, 0.10], [320, 320, 0.12], [360, 340, 0.11], [300, 400, 0.14],
  [380, 250, 0.08], [420, 270, 0.07], [460, 240, 0.06], [380, 220, 0.07],
];

/** All elevation samples (cities + scatter) combined */
export const ALL_ELEVATION_SAMPLES: readonly ElevationSample[] = (() => {
  const samples: ElevationSample[] = [];
  // City elevation samples
  for (const city of Object.values(cities)) {
    samples.push({
      bx: city.x,
      by: city.y,
      elevation: CITY_ELEVATION[city.id] ?? 0.07,
      label: city.id,
    });
  }
  // Scatter terrain samples
  for (const [bx, by, elev] of SCATTER) {
    samples.push({ bx, by, elevation: elev });
  }
  return Object.freeze(samples);
})();

/**
 * Elevation query via IDW (Inverse Distance Weighting, power=4).
 * Centralized — every component uses this instead of computing its own.
 */
export function elevationAt(boardX: number, boardY: number): number {
  let totalWeight = 0;
  let weightedElevation = 0;

  for (const sample of ALL_ELEVATION_SAMPLES) {
    const dx = sample.bx - boardX;
    const dy = sample.by - boardY;
    const distSq = dx * dx + dy * dy;

    // Exact hit — return directly with jitter
    if (distSq < 1.0) {
      const [wx, wz] = toWorld(boardX, boardY);
      const jitter = (Math.sin(wx * 17.3 + wz * 31.7) * 0.5 + 0.5) * 0.05;
      return sample.elevation * 1.65 + jitter;
    }

    const weight = 1 / (distSq * distSq + 1.0);
    totalWeight += weight;
    weightedElevation += sample.elevation * weight;
  }

  const [wx, wz] = toWorld(boardX, boardY);
  const jitter = (Math.sin(wx * 17.3 + wz * 31.7) * 0.5 + 0.5) * 0.05;
  if (totalWeight === 0) return 0.07 * 1.65 + jitter;
  return (weightedElevation / totalWeight) * 1.65 + jitter;
}

// ═══════════════════════════════════════════════════════════════════════════
// CITY NODES (pre-computed)
// ═══════════════════════════════════════════════════════════════════════════

function buildCityNodes(): Readonly<Record<string, CityNode>> {
  const nodes: Record<string, CityNode> = {};

  for (const city of Object.values(cities)) {
    const [wx, wz] = toWorld(city.x, city.y);
    const elev = elevationAt(city.x, city.y);
    const stationY = Math.max(elev, MIN_STATION_Y) + STATION_CLEARANCE;

    nodes[city.id] = {
      id: city.id,
      name: city.name,
      boardPos: { bx: city.x, by: city.y },
      worldPos: { x: wx, y: stationY, z: wz },
      elevation: elev,
      stationY,
      region: CITY_REGION[city.id] ?? 'eastern',
      isLighthouse: LIGHTHOUSE_CITIES.has(city.id),
    };
  }

  return Object.freeze(nodes);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE EDGES with PRE-COMPUTED SLOTS
// ═══════════════════════════════════════════════════════════════════════════

function buildRouteEdges(cityNodes: Readonly<Record<string, CityNode>>): readonly RouteEdge[] {
  const edges: RouteEdge[] = [];

  for (const route of initialRoutes) {
    const fromCity = cityNodes[route.from];
    const toCity = cityNodes[route.to];
    if (!fromCity || !toCity) continue;

    const ax = fromCity.worldPos.x;
    const az = fromCity.worldPos.z;
    const bx = toCity.worldPos.x;
    const bz = toCity.worldPos.z;

    const dx = bx - ax;
    const dz = bz - az;
    const totalLen = Math.sqrt(dx * dx + dz * dz);
    if (totalLen < 0.01) continue;

    // Correct angle for Kenney Z-forward GLBs: NO + π/2
    const angle = Math.atan2(dx, dz);
    const nx = dx / totalLen;
    const nz = dz / totalLen;

    // Parallel offset for double routes
    const sameEdge = initialRoutes.filter(r =>
      (r.from === route.from && r.to === route.to) ||
      (r.from === route.to && r.to === route.from)
    );
    const edgeIdx = sameEdge.indexOf(route);
    const parallelOffset = sameEdge.length > 1 ? (edgeIdx - 0.5) * 0.42 : 0;
    const perp: [number, number] = [-nz, nx];

    // Apply parallel offset to endpoints
    const oAx = ax + perp[0] * parallelOffset;
    const oAz = az + perp[1] * parallelOffset;
    const oBx = bx + perp[0] * parallelOffset;
    const oBz = bz + perp[1] * parallelOffset;
    const omx = (oAx + oBx) / 2;
    const omz = (oAz + oBz) / 2;

    // Pre-compute slot geometry
    const gapLen = totalLen * SLOT_GAP_F / (route.length + 1);
    const slotLen = (totalLen - gapLen * (route.length + 1)) / route.length;
    const step = slotLen + gapLen;
    const startOff = -(totalLen / 2) + gapLen + slotLen / 2;

    const slots: RouteSlot[] = [];
    for (let i = 0; i < route.length; i++) {
      const offset = startOff + i * step;
      const cx = omx + nx * offset;
      const cz = omz + nz * offset;

      // Terrain-aware Y for this slot
      const [slotBx, slotBy] = fromWorld(cx, cz);
      const terrainY = elevationAt(slotBx, slotBy);

      slots.push({
        worldPos: { x: cx, y: terrainY + 0.08, z: cz },
        angle,
        length: slotLen,
      });
    }

    // Midpoint elevation
    const [midBx, midBy] = fromWorld(omx, omz);
    const midY = elevationAt(midBx, midBy);

    edges.push({
      id: route.id,
      from: route.from,
      to: route.to,
      color: route.color,
      length: route.length,
      type: route.type as 'normal' | 'ferry' | 'tunnel',
      locomotivesRequired: route.locomotivesRequired ?? 0,
      angle,
      slots: Object.freeze(slots),
      midpoint: { x: omx, y: midY, z: omz },
      parallelOffset,
    });
  }

  return Object.freeze(edges);
}

// ═══════════════════════════════════════════════════════════════════════════
// ADJACENCY LIST (city → neighbor cities, for pathfinding & validation)
// ═══════════════════════════════════════════════════════════════════════════

function buildAdjacency(): ReadonlyMap<string, readonly string[]> {
  const adj = new Map<string, Set<string>>();

  // Initialize all cities
  for (const cityId of Object.keys(cities)) {
    adj.set(cityId, new Set());
  }

  // Add edges
  for (const route of initialRoutes) {
    adj.get(route.from)?.add(route.to);
    adj.get(route.to)?.add(route.from);
  }

  // Freeze: convert Sets to frozen arrays
  const frozen = new Map<string, readonly string[]>();
  for (const [key, value] of adj) {
    frozen.set(key, Object.freeze([...value]));
  }
  return frozen;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function validateGraph(
  cityNodes: Readonly<Record<string, CityNode>>,
  routeEdges: readonly RouteEdge[],
  adjacency: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  const errors: string[] = [];

  // 1. All route endpoints reference valid cities
  for (const route of routeEdges) {
    if (!cityNodes[route.from]) errors.push(`Route ${route.id}: unknown city '${route.from}'`);
    if (!cityNodes[route.to]) errors.push(`Route ${route.id}: unknown city '${route.to}'`);
  }

  // 2. No duplicate route IDs
  const ids = new Set<string>();
  for (const route of routeEdges) {
    if (ids.has(route.id)) errors.push(`Duplicate route ID: ${route.id}`);
    ids.add(route.id);
  }

  // 3. Station clearance — no city below terrain
  for (const city of Object.values(cityNodes)) {
    if (city.stationY < city.elevation) {
      errors.push(`City ${city.id}: stationY (${city.stationY.toFixed(3)}) < elevation (${city.elevation.toFixed(3)})`);
    }
  }

  // 4. Ticket endpoints exist
  for (const ticket of initialTickets) {
    if (!cityNodes[ticket.from]) errors.push(`Ticket ${ticket.id}: unknown city '${ticket.from}'`);
    if (!cityNodes[ticket.to]) errors.push(`Ticket ${ticket.id}: unknown city '${ticket.to}'`);
  }

  // 5. Graph connectivity — all cities reachable (BFS from first city)
  const allCityIds = Object.keys(cityNodes);
  if (allCityIds.length > 0) {
    const visited = new Set<string>();
    const queue = [allCityIds[0]];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node)) continue;
      visited.add(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }
    if (visited.size !== allCityIds.length) {
      const unreachable = allCityIds.filter(c => !visited.has(c));
      errors.push(`Disconnected cities: ${unreachable.join(', ')}`);
    }
  }

  // 6. Route slot positions are finite
  for (const route of routeEdges) {
    for (let i = 0; i < route.slots.length; i++) {
      const slot = route.slots[i];
      if (!isFinite(slot.worldPos.x) || !isFinite(slot.worldPos.y) || !isFinite(slot.worldPos.z)) {
        errors.push(`Route ${route.id} slot ${i}: non-finite position`);
      }
    }
  }

  // 7. Route lengths match slot count
  for (const route of routeEdges) {
    if (route.slots.length !== route.length) {
      errors.push(`Route ${route.id}: expected ${route.length} slots, got ${route.slots.length}`);
    }
  }

  return Object.freeze(errors);
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD & EXPORT the frozen graph
// ═══════════════════════════════════════════════════════════════════════════

const cityNodes = buildCityNodes();
const routeEdges = buildRouteEdges(cityNodes);
const adjacency = buildAdjacency();
const validationErrors = validateGraph(cityNodes, routeEdges, adjacency);

// Log validation errors in development
if (validationErrors.length > 0) {
  console.warn('[BoardSceneGraph] Validation errors:');
  for (const err of validationErrors) {
    console.warn(`  ⚠ ${err}`);
  }
} else {
  console.info('[BoardSceneGraph] ✓ Graph valid — %d cities, %d routes', Object.keys(cityNodes).length, routeEdges.length);
}

/** The complete, frozen board scene graph — single source of truth */
export const graph = Object.freeze({
  // Nodes & Edges
  cities: cityNodes,
  routes: routeEdges,
  adjacency,

  // Elevation
  elevationSamples: ALL_ELEVATION_SAMPLES,

  // Dimensions
  boardWidth: BOARD_W,
  boardHeight: BOARD_H,
  worldWidth: WORLD_W,
  worldDepth: WORLD_D,

  // Validation
  validationErrors,
});
