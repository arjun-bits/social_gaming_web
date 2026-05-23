/**
 * TerrainMesh.tsx — Rich green low-poly Europe terrain with dramatic elevation.
 * Target: Alps 1.5+ units tall, green forest palette, clear mountain ridges.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';
import { cities } from '../../../../core/engine/ticket_europe/boardData';
import { toWorld } from '../EuropeBoard3D';

// ── Board-game green palette (matches target image) ───────────────────────
function landColor(e: number): THREE.Color {
  if (e < 0.04) return new THREE.Color(0x4a9ad4);  // coastal water / fjords
  if (e < 0.09) return new THREE.Color(0x2d8a40);  // bright lowland grass
  if (e < 0.18) return new THREE.Color(0x2a7838);  // lush green plains
  if (e < 0.30) return new THREE.Color(0x256630);  // darker forest green
  if (e < 0.44) return new THREE.Color(0x7a6040);  // brown-green highlands
  if (e < 0.58) return new THREE.Color(0x8a7860);  // rocky grey-tan foothills
  if (e < 0.72) return new THREE.Color(0x9a9080);  // alpine stone grey
  return new THREE.Color(0xe0dcd4);                 // snow / ice caps
}

// ── City elevations (0‒1 raw scale, multiplied 2.2× in geometry) ──────────
const CITY_ELEVATION: Record<string, number> = {
  zurich:    0.75, munchen:  0.55, wien:      0.35, frankfurt: 0.16,
  marseille: 0.30, roma:     0.18, venezia:   0.22, napoli:    0.20,
  barcelona: 0.35, madrid:   0.42, lisbon:    0.22, palermo:   0.15,
  sarajevo:  0.48, sofia:    0.35, zagreb:    0.38, budapest:  0.18,
  bucuresti: 0.12, athina:   0.28, berlin:    0.06, warszawa:  0.05,
  amsterdam: 0.04, brussels: 0.05, paris:     0.09, london:    0.07,
  edinburgh: 0.36, stockholm:0.28, copenhagen:0.09, kyiv:      0.06,
  moskva:    0.05,
};

// ── Dense scatter for full board coverage ─────────────────────────────────
const SCATTER: Array<[number, number, number]> = [
  // Alpine core — peaks
  [490, 268, 0.80], [512, 255, 0.78], [468, 262, 0.76], [534, 260, 0.74],
  [500, 290, 0.72], [455, 278, 0.68], [548, 280, 0.65],
  // Pyrenees
  [310, 380, 0.60], [345, 368, 0.62], [372, 378, 0.58], [390, 372, 0.55],
  // Scottish highlands
  [192, 128, 0.42], [218, 144, 0.38], [204, 160, 0.36],
  // Scandinavian highlands
  [490, 72, 0.32], [560, 55, 0.34], [640, 65, 0.30], [720, 58, 0.28],
  [820, 85, 0.24], [380, 88, 0.30],
  // Balkans/Carpathians
  [650, 310, 0.44], [672, 335, 0.42], [636, 325, 0.40],
  [598, 400, 0.38], [618, 420, 0.35], [582, 435, 0.32],
  // Eastern plains (flat)
  [860, 180, 0.05], [940, 280, 0.05], [980, 380, 0.05],
  [920, 460, 0.05], [860, 540, 0.05], [760, 320, 0.06],
  // Atlantic coast (near sea level)
  [20,  50,  0.08], [80, 120,  0.10], [40, 280, 0.08],
  [20, 420,  0.08], [80, 580,  0.08], [140,680, 0.07],
  // Mediterranean lowlands
  [460, 550, 0.12], [530, 600, 0.10], [600, 580, 0.11],
  // Board frame — ocean border (elevation ≈0)
  [0,   0,  0.02], [250,  0, 0.02], [500,  0, 0.02], [750,  0, 0.02], [1000, 0,  0.02],
  [0, 200,  0.02], [0,  400, 0.02], [0,  600, 0.02], [0,  800, 0.02],
  [1000,200,0.02], [1000,400,0.02], [1000,600,0.02], [1000,800,0.02],
  [250,800, 0.02], [500,800, 0.02], [750,800, 0.02],
  // Mediterranean islands
  [498, 680, 0.12], [580, 700, 0.10],
  // British Isles fill
  [155, 200, 0.10], [180, 250, 0.12], [200, 300, 0.10], [225, 350, 0.08],
];

export function TerrainMesh() {
  const geometry = useMemo(() => {
    const points: Array<[number, number, number]> = [];

    for (const city of Object.values(cities)) {
      const [wx, wz] = toWorld(city.x, city.y);
      points.push([wx, wz, CITY_ELEVATION[city.id] ?? 0.09]);
    }
    for (const [mx, my, elev] of SCATTER) {
      const [wx, wz] = toWorld(mx, my);
      points.push([wx, wz, elev]);
    }

    const flat2D = points.map(([x, z]) => [x, z] as [number, number]);
    const delaunay = Delaunay.from(flat2D);
    const triangles = delaunay.triangles;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < triangles.length; i += 3) {
      const ia = triangles[i], ib = triangles[i + 1], ic = triangles[i + 2];
      const [ax, az, ae] = points[ia];
      const [bx, bz, be] = points[ib];
      const [cx, cz, ce] = points[ic];

      // Facet-definition jitter — gives low-poly look without killing shape
      const jitter = (x: number, z: number) =>
        (Math.sin(x * 23.7 + z * 41.3) * 0.5 + 0.5) * 0.35;

      // 2.2× scale — Alps reach ~1.65 world units, clearly visible
      const ay = ae * 2.2 + jitter(ax, az);
      const by = be * 2.2 + jitter(bx, bz);
      const cy = ce * 2.2 + jitter(cx, cz);

      positions.push(ax, ay, az,  bx, by, bz,  cx, cy, cz);

      const avgE = (ae + be + ce) / 3;
      const col = landColor(avgE);
      for (let v = 0; v < 3; v++) colors.push(col.r, col.g, col.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshLambertMaterial vertexColors flatShading side={THREE.FrontSide} />
    </mesh>
  );
}
