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
import { toWorld } from '../EuropeBoard3D';

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
  [440, 10],  // Northwest Norway
  [520, 10],  // Northern Sweden
  [610, 20],  // Northeast Sweden
  [630, 80],  // Stockholm/Uppsala Baltic Coast
  [590, 150], // Southern Sweden (Skåne)
  [530, 150], // Swedish West Coast (Gothenburg)
  [460, 90],  // Southern Norway (Oslofjord)
  [410, 80]   // Southwest Norway (Bergen/Stavanger)
];

export const POLYGON_SICILY: Array<[number, number]> = [
  [440, 730], // Palermo / Northwest Sicily
  [490, 735], // Northeast Sicily (Messina)
  [480, 780], // Southeast Sicily (Syracuse)
  [430, 770]  // Southwest Sicily (Agrigento)
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
         isPointInPolygon(p, POLYGON_SICILY);
}

// ── Low-poly vertex color assignment based on height & coastal status ──
function getVertexColor(elevation: number, isCoast: boolean): THREE.Color {
  if (isCoast || elevation < 0.06) {
    return new THREE.Color('#e2c99a'); // Beautiful sandy coastline beach
  }
  if (elevation < 0.16) {
    return new THREE.Color('#5da03b'); // Lowland lush grass green
  }
  if (elevation < 0.35) {
    return new THREE.Color('#3d7a22'); // Warmer plains / forest green
  }
  if (elevation < 0.52) {
    return new THREE.Color('#5a7c36'); // Highlands / olive green
  }
  if (elevation < 0.68) {
    return new THREE.Color('#8c7b65'); // Foothills / rocky grey-brown
  }
  if (elevation < 0.80) {
    return new THREE.Color('#99958e'); // Alpine stone grey
  }
  return new THREE.Color('#ffffff'); // High summits snowy peaks white!
}

// ── City elevations ──
export const CITY_ELEVATION: Record<string, number> = {
  zurich:     0.78, munchen:   0.55, wien:      0.35, frankfurt:  0.14,
  marseille:  0.22, roma:      0.16, venezia:   0.18, napoli:     0.15,
  barcelona:  0.24, madrid:    0.38, lisbon:    0.16, palermo:    0.12,
  sarajevo:   0.45, sofia:     0.32, zagreb:    0.35, budapest:   0.16,
  bucuresti:  0.10, athina:    0.20, berlin:    0.05, warszawa:   0.04,
  amsterdam:  0.03, brussels:  0.04, paris:     0.07, london:     0.06,
  edinburgh:  0.28, stockholm: 0.20, copenhagen:0.07, kyiv:       0.05,
  moskva:     0.04, bruxelles: 0.04,
};

// ── Dense interior scatter points drives the mountain ranges ──
const SCATTER: Array<[number, number, number]> = [
  // Alpine core (elevated Alps range)
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

export function TerrainMesh() {
  const geometry = useMemo(() => {
    // Each point: [x, y, elevation, isCoast] in board coordinate system
    const points: Array<[number, number, number, boolean]> = [];

    // 1. Add all city coordinates
    for (const city of Object.values(cities)) {
      points.push([city.x, city.y, CITY_ELEVATION[city.id] ?? 0.07, false]);
    }
    // 2. Add scatter points
    for (const [mx, my, elev] of SCATTER) {
      points.push([mx, my, elev, false]);
    }
    // 3. Add coastline boundary vertices directly so Delaunay cuts off crisply at the edge
    const ALL_POLYGONS = [
      POLYGON_MAINLAND,
      POLYGON_BRITAIN,
      POLYGON_IRELAND,
      POLYGON_SCANDINAVIA,
      POLYGON_SICILY
    ];
    for (const poly of ALL_POLYGONS) {
      for (const [px, py] of poly) {
        points.push([px, py, 0.01, true]);
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

      // Low-poly facets jitter
      const jitter = (x: number, z: number) =>
        (Math.sin(x * 17.3 + z * 31.7) * 0.5 + 0.5) * 0.04;

      // 1.25× multiplier — creates gorgeous elevated mountain ranges
      const ay3d = ae * 1.25 + jitter(awx, awz);
      const by3d = be * 1.25 + jitter(bwx, bwz);
      const cy3d = ce * 1.25 + jitter(cwx, cwz);

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
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading side={THREE.FrontSide} />
    </mesh>
  );
}
