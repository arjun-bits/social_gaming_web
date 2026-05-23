/**
 * RiverMesh.tsx — Low-poly rivers cutting through the European terrain.
 * Rhine, Danube, Seine, Rhône, and Vistula as thin blue ribbon meshes
 * that sit just above the terrain surface.
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
    width: 0.08,
    points: [
      [350, 430], [360, 380], [355, 340], [350, 300], [340, 260], [320, 220], [300, 190],
    ],
  },
  {
    name: 'Danube',
    color: '#1e88b0',
    width: 0.10,
    points: [
      [430, 400], [480, 390], [530, 380], [580, 370], [630, 380],
      [680, 400], [730, 420], [780, 450], [820, 470],
    ],
  },
  {
    name: 'Seine',
    color: '#2196c4',
    width: 0.06,
    points: [
      [210, 370], [230, 340], [240, 310], [248, 280],
    ],
  },
  {
    name: 'Rhone',
    color: '#2196c4',
    width: 0.06,
    points: [
      [290, 520], [300, 490], [310, 460], [320, 440], [340, 430],
    ],
  },
  {
    name: 'Vistula',
    color: '#1e88b0',
    width: 0.06,
    points: [
      [670, 190], [660, 220], [650, 250], [640, 280], [635, 310],
    ],
  },
  {
    name: 'Dnieper',
    color: '#1e88b0',
    width: 0.07,
    points: [
      [860, 250], [870, 210], [880, 170], [890, 130], [900, 90],
    ],
  },
];

function RiverStrip({ river }: { river: typeof RIVERS[0] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const hw = river.width / 2;
    const pts = river.points;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];

      const [wx1, wz1] = toWorld(x1, y1);
      const [wx2, wz2] = toWorld(x2, y2);

      const wy1 = getTerrainHeight(x1, y1) + 0.03;
      const wy2 = getTerrainHeight(x2, y2) + 0.03;

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
  }, [river]);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial
        color={river.color}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function RiverMesh() {
  return (
    <group>
      {RIVERS.map((river) => (
        <RiverStrip key={river.name} river={river} />
      ))}
    </group>
  );
}
