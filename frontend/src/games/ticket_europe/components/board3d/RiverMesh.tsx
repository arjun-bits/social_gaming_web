/**
 * RiverMesh.tsx — Low-poly rivers cutting through the European terrain.
 * Rhine, Danube, Seine, Rhône, Vistula, and Dnieper as detailed blue ribbon meshes
 * featuring dark-brown riverbanks and subtle emissive water glow.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

// River paths in board coordinates [x, y]
// Tripled widths and added detailed intermediate points for smoother curves
const RIVERS: { name: string; color: string; width: number; points: Array<[number, number]> }[] = [
  {
    name: 'Rhine',
    color: '#2196c4',
    width: 0.28, // Tripled from 0.08
    points: [
      [350, 430], [355, 405], [360, 380], [358, 360], [355, 340],
      [352, 320], [350, 300], [345, 280], [340, 260], [330, 240],
      [320, 220], [310, 205], [300, 190],
    ],
  },
  {
    name: 'Danube',
    color: '#1e88b0',
    width: 0.35, // Tripled from 0.10
    points: [
      [430, 400], [455, 395], [480, 390], [505, 385], [530, 380],
      [555, 373], [580, 370], [605, 373], [630, 380], [655, 388],
      [680, 400], [705, 410], [730, 420], [755, 435], [780, 450],
      [800, 460], [820, 470],
    ],
  },
  {
    name: 'Seine',
    color: '#2196c4',
    width: 0.22, // Tripled from 0.06
    points: [
      [210, 370], [220, 355], [230, 340], [235, 325], [240, 310], [248, 280],
    ],
  },
  {
    name: 'Rhone',
    color: '#2196c4',
    width: 0.22, // Tripled from 0.06
    points: [
      [290, 520], [295, 505], [300, 490], [305, 475], [310, 460], [320, 440], [340, 430],
    ],
  },
  {
    name: 'Vistula',
    color: '#1e88b0',
    width: 0.22, // Tripled from 0.06
    points: [
      [670, 190], [665, 205], [660, 220], [655, 235], [650, 250],
      [645, 265], [640, 280], [637, 295], [635, 310],
    ],
  },
  {
    name: 'Dnieper',
    color: '#1e88b0',
    width: 0.25, // Tripled from 0.07
    points: [
      [860, 250], [865, 230], [870, 210], [875, 190], [880, 170],
      [885, 150], [890, 130], [895, 110], [900, 90],
    ],
  },
];

function RiverStrip({ river, bank = false }: { river: typeof RIVERS[0]; bank?: boolean }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const hw = (river.width * (bank ? 1.5 : 1.0)) / 2;
    const pts = river.points;

    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];

      const [wx1, wz1] = toWorld(x1, y1);
      const [wx2, wz2] = toWorld(x2, y2);

      // Raise slightly above the terrain to prevent z-fighting (bank sits under water)
      const wy1 = getTerrainHeight(x1, y1) + (bank ? 0.05 : 0.07);
      const wy2 = getTerrainHeight(x2, y2) + (bank ? 0.05 : 0.07);

      // Perpendicular direction for width calculation
      const dx = wx2 - wx1;
      const dz = wz2 - wz1;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -(dz / len) * hw;
      const nz = (dx / len) * hw;

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
  }, [river, bank]);

  return (
    <mesh geometry={geometry}>
      {bank ? (
        <meshStandardMaterial
          color="#2a1a0a" // Dark brown bank color
          roughness={0.95}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      ) : (
        <meshStandardMaterial
          color={river.color}
          emissive="#1a6880" // Emissive subtle glow
          emissiveIntensity={0.3}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          depthWrite={true} // Ensures clean rendering
        />
      )}
    </mesh>
  );
}

export function RiverMesh() {
  return (
    <group>
      {/* 1. Render all banks first so they lay underneath */}
      {RIVERS.map((river) => (
        <RiverStrip key={`${river.name}_bank`} river={river} bank={true} />
      ))}
      {/* 2. Render water strips on top */}
      {RIVERS.map((river) => (
        <RiverStrip key={river.name} river={river} bank={false} />
      ))}
    </group>
  );
}
