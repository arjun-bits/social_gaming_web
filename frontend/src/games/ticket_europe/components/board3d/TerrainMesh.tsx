/**
 * TerrainMesh.tsx — Low-poly Europe landmass terrain for top-down 2.5D view.
 * Carves out the exact shape of mainland Europe, Great Britain, Ireland,
 * Scandinavia, and Sicily using Point-in-Polygon checks.
 * Integrates warm sandy shores and dynamic alpine elevations with snowy peaks.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld, CITY_ELEVATION, SCATTER, elevationAt, ALL_ELEVATION_SAMPLES } from '../../boardSceneGraph';

// ── Polygon coordinates defining Europe landmass (board coordinate space) ──
export const POLYGON_MAINLAND: Array<[number, number]> = [
  [230, 240], // Northwest France (Brittany/Normandy)
  [190, 330], // French Atlantic Coast
  [160, 450], // French Atlantic Coast (near Bordeaux)
  [110, 470], // Northern Pyrenees Coast
  [80,  500], // Northwest Spain
  [20,  520], // Northern Portugal
  [10,  580], // Lisbon area
  [30,  660], // Southwest Spain (Cadiz)
  [120, 720], // Gibraltar / Southern Spain
  [190, 640], // Southeast Spain (Cartagena)
  [230, 590], // Barcelona area
  [280, 500], // Southern France (Montpellier)
  [320, 510], // French Mediterranean coast (Nice)
  [360, 540], // Northwest Italy (Genoa)
  [400, 580], // West coast Italy (Rome)
  [450, 650], // Southwest Italy (Naples)
  [480, 710], // Italian toe (Calabria)
  [520, 690], // Italian heel (Taranto)
  [530, 640], // Adriatic east coast Italy (Bari)
  [490, 540], // North Adriatic Italy
  [520, 500], // Croatia Coast (Rijeka)
  [540, 520], // Dalmatian Coast (Split)
  [570, 560], // Montenegro / Albania Coast
  [610, 650], // Western Greece
  [640, 730], // Peloponnese South Greece (Athens/Attica area)
  [670, 690], // Southeast Greece
  [710, 600], // Aegean Coast
  [740, 580], // European Turkey (Bosphorus entrance)
  [800, 540], // Black Sea south coast (Balkans)
  [900, 500], // Southeast board boundary
  [1000,450], // East board boundary (South)
  [1000, 50], // Northeast board boundary (North)
  [900,  20], // North board boundary (East)
  [760,  60], // North Baltic coast
  [650, 110], // Poland/Pomerania Baltic coast
  [500, 130], // Northern Germany Baltic Coast
  [400, 160], // Danish border landward
  [330, 170], // Amsterdam / Netherlands coast
  [270, 210]  // Belgian coast
];

export const POLYGON_BRITAIN: Array<[number, number]> = [
  [160, 60],  // Northern Scotland
  [210, 60],  // Northeast Scotland
  [240, 120], // East England (Newcastle/York)
  [250, 190], // East Anglia (Norwich)
  [230, 230], // Southeast England (London/Kent)
  [170, 240], // Southwest England (Cornwall)
  [150, 190], // Wales (Cardiff/Holyhead)
  [170, 140], // Northwest England
  [140, 100]  // West Scotland
];

export const POLYGON_IRELAND: Array<[number, number]> = [
  [70, 110],  // Northwest Ireland
  [120, 110], // Northeast Ireland
  [130, 160], // Dublin / East Ireland
  [110, 210], // Southeast Ireland
  [70, 200],  // Southwest Ireland
  [60, 155]   // West Ireland
];

export const POLYGON_SCANDINAVIA: Array<[number, number]> = [
  [400, 5],   // Northwest Norway (extended for Oslo)
  [530, 5],   // Northern Sweden
  [620, 10],  // Northeast Sweden
  [640, 50],  // Stockholm/Uppsala Baltic Coast
  [630, 90],  // Southeast Sweden
  [590, 150], // Southern Sweden (Skåne)
  [530, 150], // Swedish West Coast (Gothenburg)
  [460, 100], // Southern Norway (Oslofjord)
  [410, 80],  // Oslo area
  [390, 50]   // Southwest Norway (Bergen/Stavanger)
];

export const POLYGON_JUTLAND: Array<[number, number]> = [
  [420, 90],  // Northern Jutland
  [470, 80],  // Northeast
  [480, 110], // East coast
  [470, 150], // Southeast
  [440, 160], // Southern Jutland
  [410, 130], // West coast
];

export const POLYGON_SICILY: Array<[number, number]> = [
  [440, 730], // Palermo / Northwest Sicily
  [490, 735], // Northeast Sicily (Messina)
  [480, 780], // Southeast Sicily (Syracuse)
  [430, 770]  // Southwest Sicily (Agrigento)
];

// Removed: POLYGON_SARDINIA_CORSICA and POLYGON_BALEARIC — these tiny islands
// create floating terrain patches that break visual coherence at this scale.
export const POLYGON_SARDINIA_CORSICA: Array<[number, number]> = [];
export const POLYGON_BALEARIC: Array<[number, number]> = [];

export const POLYGON_CRETE: Array<[number, number]> = [
  [650, 750], [710, 755], [700, 770], [640, 765]
];

export const POLYGON_CYPRUS: Array<[number, number]> = [
  [830, 730], [870, 740], [850, 760], [810, 750]
];

// ── Point in Polygon ray-casting checker ──
export function isPointInPolygon(point: [number, number], polygon: Array<[number, number]>): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isLandPoint(x: number, y: number): boolean {
  const p: [number, number] = [x, y];
  return isPointInPolygon(p, POLYGON_MAINLAND) ||
         isPointInPolygon(p, POLYGON_BRITAIN) ||
         isPointInPolygon(p, POLYGON_IRELAND) ||
         isPointInPolygon(p, POLYGON_SCANDINAVIA) ||
         isPointInPolygon(p, POLYGON_JUTLAND) ||
         isPointInPolygon(p, POLYGON_SICILY) ||
         isPointInPolygon(p, POLYGON_SARDINIA_CORSICA) ||
         isPointInPolygon(p, POLYGON_BALEARIC) ||
         isPointInPolygon(p, POLYGON_CRETE) ||
         isPointInPolygon(p, POLYGON_CYPRUS);
}

// ── Low-poly vertex color assignment based on height & coastal status ──
function getVertexColor(elevation: number, isCoast: boolean): THREE.Color {
  // Seamless Beach Rule: Sand is only colored on very low elevation coastline vertices
  if (isCoast && elevation < 0.035) {
    return new THREE.Color('#d4c494'); // Warm golden sand
  }
  if (elevation < 0.10) {
    return new THREE.Color('#5ca53e'); // Lush lowland green
  }
  if (elevation < 0.22) {
    return new THREE.Color('#4a9630'); // Rich grass green
  }
  if (elevation < 0.38) {
    return new THREE.Color('#3b8224'); // Deep forest green
  }
  if (elevation < 0.52) {
    return new THREE.Color('#4d7030'); // Olive highland
  }
  if (elevation < 0.65) {
    return new THREE.Color('#7a6c58'); // Foothill brown-grey
  }
  if (elevation < 0.78) {
    return new THREE.Color('#908882'); // Alpine stone grey
  }
  return new THREE.Color('#f0ede8'); // Snow peak warm-white
}

// ── CITY_ELEVATION, SCATTER, and getTerrainHeight are now centralized ──
// Imported from '../../boardSceneGraph' at the top of this file.
// Re-export getTerrainHeight as a thin wrapper for backward compatibility.
export const getTerrainHeight = elevationAt;

export const TerrainMesh = React.memo(function TerrainMesh() {
  const { geometry, skirtGeometry } = useMemo(() => {
    // Each point: [boardX, boardY, rawElevation, isCoast] in board coordinate system
    // rawElevation is in [0,1] range for color lookups
    const points: Array<[number, number, number, boolean]> = [];

    // Precompute city positions for flattening checks
    const cityList = Object.values(cities);
    const FLATTEN_RADIUS = 45; // board units
    const FLATTEN_RADIUS_SQ = FLATTEN_RADIUS * FLATTEN_RADIUS;

    // 1. Add all city coordinates
    for (const city of cityList) {
      points.push([city.x, city.y, CITY_ELEVATION[city.id] ?? 0.07, false]);
    }
    
    // 2. Dense grid points (6-unit step for clearer terrain edges)
    for (let x = 3; x < 1000; x += 6) {
      for (let y = 3; y < 800; y += 6) {
        if (isLandPoint(x, y)) {
          // Check if it's too close to a city
          let tooClose = false;
          for (const city of cityList) {
            const dx = city.x - x;
            const dy = city.y - y;
            if (dx * dx + dy * dy < 144) { // 12 units distance
              tooClose = true;
              break;
            }
          }
          if (!tooClose) {
            // Use centralized elevation (raw, before *1.65) for color
            // We extract the raw elevation by querying the same samples as elevationAt()
            // but without the *1.65 multiplier
            let totalWeight = 0;
            let weightedElev = 0;
            for (const sample of ALL_ELEVATION_SAMPLES) {
              const dx = sample.bx - x;
              const dy = sample.by - y;
              const distSq = dx * dx + dy * dy;
              if (distSq < 1.0) {
                weightedElev = sample.elevation;
                totalWeight = 1;
                break;
              }
              const w = 1 / (distSq * distSq + 1.0);
              totalWeight += w;
              weightedElev += sample.elevation * w;
            }
            const rawElev = totalWeight > 0 ? (weightedElev / totalWeight) : 0.07;
            points.push([x, y, rawElev, false]);
          }
        }
      }
    }

    // 3. Apply terrain flattening around cities (smooth plateau blend)
    for (let i = 0; i < points.length; i++) {
      const [px, py, pe, pc] = points[i];
      if (pc) continue; // skip coastline points
      
      for (const city of cityList) {
        const dx = city.x - px;
        const dy = city.y - py;
        const distSq = dx * dx + dy * dy;
        if (distSq < FLATTEN_RADIUS_SQ) {
          const dist = Math.sqrt(distSq);
          const cityRawElev = CITY_ELEVATION[city.id] ?? 0.07;
          // Smooth cubic blend: 0 at center → 1 at edge
          const t = dist / FLATTEN_RADIUS;
          const smooth = t * t * (3 - 2 * t); // smoothstep
          points[i][2] = cityRawElev + (pe - cityRawElev) * smooth;
          break; // nearest city wins
        }
      }
    }

    // 4. Add coastline boundary vertices (subdivided for smoother edges)
    const ALL_POLYGONS = [
      POLYGON_MAINLAND,
      POLYGON_BRITAIN,
      POLYGON_IRELAND,
      POLYGON_SCANDINAVIA,
      POLYGON_JUTLAND,
      POLYGON_SICILY,
      POLYGON_SARDINIA_CORSICA,
      POLYGON_BALEARIC,
      POLYGON_CRETE,
      POLYGON_CYPRUS
    ];
    for (const poly of ALL_POLYGONS) {
      for (let i = 0; i < poly.length; i++) {
        const [px, py] = poly[i];
        const [nx, ny] = poly[(i + 1) % poly.length];
        // Add the vertex itself
        points.push([px, py, 0.01, true]);
        // Subdivide each edge into 4 segments for smoother coastlines
        for (let t = 1; t <= 3; t++) {
          const frac = t / 4;
          const ix = px + (nx - px) * frac;
          const iy = py + (ny - py) * frac;
          if (isLandPoint(ix, iy)) {
            points.push([ix, iy, 0.01, true]);
          }
        }
      }
    }

    const flat2D = points.map(([x, y]) => [x, y] as [number, number]);
    const delaunay = Delaunay.from(flat2D);
    const triangles = delaunay.triangles;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < triangles.length; i += 3) {
      const ia = triangles[i], ib = triangles[i + 1], ic = triangles[i + 2];
      const [ax, ay, ae, ac] = points[ia];
      const [bx, by, be, bc] = points[ib];
      const [cx, cy, ce, cc] = points[ic];

      // PIP Centroid check in board coordinates
      const centroidX = (ax + bx + cx) / 3;
      const centroidY = (ay + by + cy) / 3;

      if (!isLandPoint(centroidX, centroidY)) {
        continue; // Discard: this triangle falls in the ocean
      }

      // Convert board coordinates to 3D world coordinates
      const [awx, awz] = toWorld(ax, ay);
      const [bwx, bwz] = toWorld(bx, by);
      const [cwx, cwz] = toWorld(cx, cy);

      // Use elevationAt() for Y — matches stations, tracks, and rivers exactly
      const ay3d = elevationAt(ax, ay);
      const by3d = elevationAt(bx, by);
      const cy3d = elevationAt(cx, cy);

      positions.push(
        awx, ay3d, awz,
        bwx, by3d, bwz,
        cwx, cy3d, cwz
      );

      // Vertex color gradients based on elevation and coastal status
      const colA = getVertexColor(ae, ac);
      const colB = getVertexColor(be, bc);
      const colC = getVertexColor(ce, cc);

      colors.push(
        colA.r, colA.g, colA.b,
        colB.r, colB.g, colB.b,
        colC.r, colC.g, colC.b
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // 4. Generate Skirt side walls
    const skirtPositions: number[] = [];
    const skirtBaseY = -0.40; // Deep enough that land looks embedded in water

    for (const poly of ALL_POLYGONS) {
      const len = poly.length;
      for (let i = 0; i < len; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % len];

        const [w1x, w1z] = toWorld(p1[0], p1[1]);
        const [w2x, w2z] = toWorld(p2[0], p2[1]);

        // Top points — use elevationAt() so skirt matches actual terrain surface
        const h1 = elevationAt(p1[0], p1[1]);
        const h2 = elevationAt(p2[0], p2[1]);

        // Quad vertices
        // Triangle 1: p1_top, p1_bottom, p2_top
        skirtPositions.push(w1x, h1, w1z);
        skirtPositions.push(w1x, skirtBaseY, w1z);
        skirtPositions.push(w2x, h2, w2z);

        // Triangle 2: p2_top, p1_bottom, p2_bottom
        skirtPositions.push(w2x, h2, w2z);
        skirtPositions.push(w1x, skirtBaseY, w1z);
        skirtPositions.push(w2x, skirtBaseY, w2z);
      }
    }

    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPositions, 3));
    skirtGeo.computeVertexNormals();

    return { geometry: geo, skirtGeometry: skirtGeo };
  }, []);

  return (
    <group>
      {/* Landmass surface — raycast disabled so pointer events pass through to tracks */}
      <mesh geometry={geometry} receiveShadow castShadow raycast={() => {}}>
        <meshStandardMaterial vertexColors flatShading roughness={0.76} metalness={0.08} />
      </mesh>
      
      {/* Landmass 3D side walls (beach cliffs) - Sandy cliff face */}
      <mesh geometry={skirtGeometry} receiveShadow castShadow raycast={() => {}}>
        <meshStandardMaterial color="#a08860" flatShading roughness={0.82} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});
