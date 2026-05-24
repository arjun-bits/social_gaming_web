/**
 * RiverMesh.tsx — Low-poly rivers cutting through the European terrain.
 * Rhine, Danube, Seine, Rhône, Vistula, and Dnieper as visible blue ribbon meshes
 * with dark river banks that sit clearly above the terrain surface.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

// River paths in board coordinates [x, y]
// Each river is a polyline of waypoints
const RIVERS: { name: string; color: string; width: number; points: Array<[number, number]> }[] = [
  {
    name: 'Rhine',
    color: '#2196c4',
    width: 0.28,
    points: [
      [350, 430], [356, 410], [360, 380], [358, 360], [355, 340],
      [352, 310], [350, 300], [345, 280], [340, 260], [330, 240],
      [320, 220], [310, 205], [300, 190],
    ],
  },
  {
    name: 'Danube',
    color: '#1e88b0',
    width: 0.35,
    points: [
      [430, 400], [455, 395], [480, 390], [505, 385], [530, 380],
      [555, 375], [580, 370], [605, 374], [630, 380],
      [655, 390], [680, 400], [705, 410], [730, 420],
      [755, 435], [780, 450], [800, 462], [820, 470],
    ],
  },
  {
    name: 'Seine',
    color: '#2196c4',
    width: 0.22,
    points: [
      [210, 370], [218, 355], [230, 340], [235, 325], [240, 310], [244, 295], [248, 280],
    ],
  },
  {
    name: 'Rhone',
    color: '#2196c4',
    width: 0.22,
    points: [
      [290, 520], [294, 505], [300, 490], [305, 475], [310, 460],
      [315, 450], [320, 440], [330, 435], [340, 430],
    ],
  },
  {
    name: 'Vistula',
    color: '#1e88b0',
    width: 0.22,
    points: [
      [670, 190], [666, 205], [660, 220], [656, 235], [650, 250],
      [646, 265], [640, 280], [638, 295], [635, 310],
    ],
  },
  {
    name: 'Dnieper',
    color: '#1e88b0',
    width: 0.25,
    points: [
      [860, 250], [864, 230], [870, 210], [875, 190], [880, 170],
      [885, 150], [890, 130], [895, 110], [900, 90],
    ],
  },
];

function RiverStrip({ river, isBank }: { river: typeof RIVERS[0]; isBank?: boolean }) {
  const widthMult = isBank ? 1.5 : 1.0;
  const effectiveWidth = river.width * widthMult;

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const hw = effectiveWidth / 2;
    const pts = river.points;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];

      const [wx1, wz1] = toWorld(x1, y1);
      const [wx2, wz2] = toWorld(x2, y2);

      const wy1 = getTerrainHeight(x1, y1) + (isBank ? 0.05 : 0.07);
      const wy2 = getTerrainHeight(x2, y2) + (isBank ? 0.05 : 0.07);

      // Perpendicular direction for width
      const dx = wx2 - wx1;
      const dz = wz2 - wz1;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / len * hw;
      const nz = dx / len * hw;

      // Two triangles forming a quad segment
      positions.push(wx1 + nx, wy1, wz1 + nz);
      positions.push(wx1 - nx, wy1, wz1 - nz);
      positions.push(wx2 + nx, wy2, wz2 + nz);

      positions.push(wx2 + nx, wy2, wz2 + nz);
      positions.push(wx1 - nx, wy1, wz1 - nz);
      positions.push(wx2 - nx, wy2, wz2 - nz);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [river, effectiveWidth, isBank]);

  if (isBank) {
    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#2a1a0a"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.9}
        />
      </mesh>
    );
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={river.color}
        emissive="#1a6880"
        emissiveIntensity={0.3}
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
        depthWrite={true}
        roughness={0.4}
      />
    </mesh>
  );
}

export function RiverMesh() {
  return (
    <group>
      {/* River banks (below water) */}
      {RIVERS.map((river) => (
        <RiverStrip key={`${river.name}-bank`} river={river} isBank={true} />
      ))}
      {/* Water surface (above banks) */}
      {RIVERS.map((river) => (
        <RiverStrip key={river.name} river={river} />
      ))}
    </group>
  );
}
