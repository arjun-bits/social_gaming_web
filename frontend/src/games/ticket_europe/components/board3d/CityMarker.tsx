import { useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { City } from '../../../../core/engine/ticket_europe/models';
import { toWorld } from '../EuropeBoard3D';
import { getTerrainHeight } from './TerrainMesh';

const REGION_WALL: Record<string, string> = {
  british: '#c0b090', nordic: '#b8a888', western: '#c8b888',
  alpine: '#c4b8a0', iberian: '#c89860', italian: '#c89870',
  eastern: '#bca880', russian: '#bca070',
};
const REGION_ROOF: Record<string, string> = {
  british: '#5a3820', nordic: '#7a2818', western: '#6a4020',
  alpine: '#506070', iberian: '#884018', italian: '#804018',
  eastern: '#4a5830', russian: '#6a3018',
};
const CITY_REGION: Record<string, string> = {
  london: 'british', edinburgh: 'british',
  paris: 'western', amsterdam: 'western', brussels: 'western', frankfurt: 'western',
  madrid: 'iberian', lisbon: 'iberian', barcelona: 'iberian', marseille: 'western',
  roma: 'italian', napoli: 'italian', palermo: 'italian', venezia: 'italian',
  zurich: 'alpine', munchen: 'alpine', wien: 'alpine', berlin: 'alpine',
  stockholm: 'nordic', copenhagen: 'nordic',
  warszawa: 'eastern', budapest: 'eastern', zagreb: 'eastern',
  sarajevo: 'eastern', sofia: 'eastern', bucuresti: 'eastern', athina: 'eastern',
  kyiv: 'russian', moskva: 'russian',
};

// Lighthouse cities — skip standard building (LighthouseMesh renders these)
const LIGHTHOUSE_CITIES = new Set(['lisbon', 'palermo', 'stockholm', 'amsterdam']);

// ── CUSTOM ICONIC LANDMARKS (Three.js low-poly primitives) ──

function EiffelTower() {
  return (
    <group scale={[0.48, 0.48, 0.48]}>
      {/* 4 Angled Legs */}
      {([-0.5, 0.5] as const).map(x =>
        ([-0.5, 0.5] as const).map(z => (
          <mesh key={`${x}_${z}`} position={[x, 0.35, z]} rotation={[z * 0.4, 0, -x * 0.4]} castShadow>
            <boxGeometry args={[0.22, 0.8, 0.22]} />
            <meshLambertMaterial color="#cca85e" />
          </mesh>
        ))
      )}
      {/* First Platform */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.2, 0.12, 1.2]} />
        <meshLambertMaterial color="#a0854a" />
      </mesh>
      {/* Mid Tower */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.44, 1.1, 4]} />
        <meshLambertMaterial color="#cca85e" flatShading />
      </mesh>
      {/* Second Platform */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.54, 0.08, 0.54]} />
        <meshLambertMaterial color="#a0854a" />
      </mesh>
      {/* Spire */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.12, 1.3, 4]} />
        <meshLambertMaterial color="#dfc58e" flatShading />
      </mesh>
    </group>
  );
}

function OnionDomeCathedral() {
  return (
    <group scale={[0.48, 0.48, 0.48]}>
      {/* Main Base block */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.3, 0.6, 1.0]} />
        <meshLambertMaterial color="#b2443a" flatShading />
      </mesh>
      {/* Central main tower */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.7, 8]} />
        <meshLambertMaterial color="#dfc28f" />
      </mesh>
      {/* Onion Dome - Gold */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshLambertMaterial color="#ffd700" flatShading />
      </mesh>
      {/* Spire top */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 4]} />
        <meshLambertMaterial color="#ffd700" />
      </mesh>
      {/* Left/Right side towers */}
      {([-0.45, 0.45] as const).map((offset, idx) => {
        const domeColor = idx === 0 ? '#0077ff' : '#08b030';
        return (
          <group key={offset} position={[offset, 0, 0.1]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.16, 0.5, 8]} />
              <meshLambertMaterial color="#e0d0b0" />
            </mesh>
            <mesh position={[0, 0.95, 0]} castShadow>
              <sphereGeometry args={[0.20, 8, 8]} />
              <meshLambertMaterial color={new THREE.Color(domeColor)} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BigBen() {
  return (
    <group scale={[0.48, 0.48, 0.48]}>
      {/* Sandstone tower shaft */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.48, 0.9, 0.48]} />
        <meshLambertMaterial color="#d4c294" flatShading />
      </mesh>
      {/* Clock room */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.54, 0.32, 0.54]} />
        <meshLambertMaterial color="#c0b080" />
      </mesh>
      {/* Clock faces */}
      {([-0.285, 0.285] as const).map(z => (
        <mesh key={z} position={[0, 1.05, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {([-0.285, 0.285] as const).map(x => (
        <mesh key={x} position={[x, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.14, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Dark Roof cap + spire */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.34, 0.4, 4]} />
        <meshLambertMaterial color="#3a4a58" flatShading />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshLambertMaterial color="#3a4a58" />
      </mesh>
    </group>
  );
}

function RomanRotunda() {
  return (
    <group scale={[0.50, 0.50, 0.50]}>
      {/* Rotunda base wall */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.65, 0.5, 12]} />
        <meshLambertMaterial color="#dcd6c0" flatShading />
      </mesh>
      {/* Colonnade front arch */}
      <mesh position={[0, 0.25, 0.58]} castShadow>
        <boxGeometry args={[0.55, 0.46, 0.22]} />
        <meshLambertMaterial color="#e0dcd0" />
      </mesh>
      {/* Terracotta basilica dome */}
      <mesh position={[0, 0.50, 0]} castShadow>
        <sphereGeometry args={[0.58, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#a65230" flatShading />
      </mesh>
    </group>
  );
}

function GreekTemple() {
  return (
    <group scale={[0.50, 0.50, 0.50]}>
      {/* Pedestal platform */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.3, 0.08, 0.82]} />
        <meshLambertMaterial color="#dfdcd6" />
      </mesh>
      {/* Low-poly cylinders as classical pillars */}
      {([-0.52, 0.52] as const).map(x =>
        ([-0.28, 0.28] as const).map(z => (
          <mesh key={`${x}_${z}`} position={[x, 0.22, z]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.32, 6]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        ))
      )}
      {/* Roof structure architrave */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.34, 0.08, 0.86]} />
        <meshLambertMaterial color="#dfdcd6" />
      </mesh>
      {/* Classical triangular pediment roof */}
      <mesh position={[0, 0.53, 0.38]} castShadow>
        <coneGeometry args={[0.55, 0.16, 4]} />
        <meshLambertMaterial color="#dfdcd6" flatShading />
      </mesh>
    </group>
  );
}

function CanalHouses() {
  return (
    <group scale={[0.50, 0.50, 0.50]}>
      {/* Three adjacent gabled narrow canal house rows */}
      {([-0.36, 0, 0.36] as const).map((xOffset, idx) => {
        const houses = [
          { wall: '#aa553a', roof: '#3e4a56', height: 0.85 },
          { wall: '#8a9c72', roof: '#463c2c', height: 0.95 },
          { wall: '#cfa264', roof: '#3c3a38', height: 0.78 }
        ];
        const h = houses[idx];
        return (
          <group key={xOffset} position={[xOffset, 0, 0]}>
            <mesh position={[0, h.height * 0.5, 0]} castShadow>
              <boxGeometry args={[0.32, h.height, 0.44]} />
              <meshLambertMaterial color={new THREE.Color(h.wall)} flatShading />
            </mesh>
            <mesh position={[0, h.height + 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <coneGeometry args={[0.25, 0.28, 4]} />
              <meshLambertMaterial color={new THREE.Color(h.roof)} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── 5 DISTINCT STATION BUILDING VARIANTS ──
// Each city gets a deterministic "random" variant based on its id hash

// Variant 0: Grand Terminal (wide, with clock tower + wings + platform canopy)
function StationGrandTerminal({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  const win = new THREE.Color('#1a2540');
  const accent = new THREE.Color('#d4af37');
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.90]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main hall */}
      <mesh position={[0, 0.30, 0]} castShadow>
        <boxGeometry args={[0.80, 0.44, 0.54]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Windows */}
      {[-0.24, 0, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0.275]}>
          <boxGeometry args={[0.10, 0.14, 0.01]} />
          <meshBasicMaterial color={win} />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.14, 0.275]}>
        <boxGeometry args={[0.12, 0.20, 0.01]} />
        <meshBasicMaterial color="#3a2008" />
      </mesh>
      {/* Main roof */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <coneGeometry args={[0.50, 0.30, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {/* Clock tower */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.24, 0.28, 0.24]} />
        <meshStandardMaterial color={wallCol} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.64, 0.125]}>
        <circleGeometry args={[0.07, 8]} />
        <meshBasicMaterial color="#f0ece0" />
      </mesh>
      <mesh position={[0, 0.80, 0]} castShadow>
        <coneGeometry args={[0.18, 0.16, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      <mesh position={[0, 0.90, 0]} castShadow>
        <coneGeometry args={[0.03, 0.10, 4]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Wings */}
      {([-1, 1] as const).map(s => (
        <group key={s}>
          <mesh position={[s * 0.58, 0.22, 0]} castShadow>
            <boxGeometry args={[0.34, 0.30, 0.48]} />
            <meshStandardMaterial color={wallCol} roughness={0.75} flatShading />
          </mesh>
          <mesh position={[s * 0.58, 0.40, 0]} castShadow>
            <coneGeometry args={[0.28, 0.20, 4]} />
            <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[s * 0.58, 0.24, 0.245]}>
            <boxGeometry args={[0.14, 0.10, 0.01]} />
            <meshBasicMaterial color={win} />
          </mesh>
        </group>
      ))}
      {/* Platform canopy */}
      <mesh position={[0, 0.38, 0.54]} castShadow>
        <boxGeometry args={[1.4, 0.02, 0.34]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0.64]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.28, 4]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[-0.28, 0.62, -0.14]} castShadow>
        <boxGeometry args={[0.07, 0.18, 0.07]} />
        <meshStandardMaterial color="#5a3020" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// Variant 1: Nordic Tower (tall narrow clock tower with steep roof)
function StationNordicTower({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  const win = new THREE.Color('#1a2540');
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.80, 0.06, 0.70]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Tower body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.44, 0.64, 0.44]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Windows (stacked) */}
      {[0.24, 0.40, 0.56].map((y, i) => (
        <mesh key={i} position={[0, y, 0.225]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshBasicMaterial color={win} />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.12, 0.225]}>
        <boxGeometry args={[0.10, 0.16, 0.01]} />
        <meshBasicMaterial color="#3a2008" />
      </mesh>
      {/* Steep pointed roof */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <coneGeometry args={[0.32, 0.50, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Spire */}
      <mesh position={[0, 1.10, 0]} castShadow>
        <coneGeometry args={[0.04, 0.14, 4]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Side annexe */}
      <mesh position={[0.34, 0.16, 0]} castShadow>
        <boxGeometry args={[0.28, 0.26, 0.38]} />
        <meshStandardMaterial color={wallCol} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.34, 0.32, 0]} castShadow>
        <coneGeometry args={[0.22, 0.14, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// Variant 2: Cathedral Station (dome + bell tower)
function StationCathedral({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.60, 0.44, 0.50]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.30, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={roofCol} roughness={0.6} flatShading />
      </mesh>
      {/* Dome cap */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 6]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Bell tower */}
      <mesh position={[-0.40, 0.36, 0]} castShadow>
        <boxGeometry args={[0.22, 0.66, 0.22]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.74, 0]} castShadow>
        <coneGeometry args={[0.16, 0.20, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.86, 0]} castShadow>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Windows arch */}
      {[-0.14, 0.14].map((x, i) => (
        <mesh key={i} position={[x, 0.32, 0.255]}>
          <boxGeometry args={[0.10, 0.18, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
      {/* Round window */}
      <mesh position={[0, 0.48, 0.255]}>
        <circleGeometry args={[0.06, 6]} />
        <meshBasicMaterial color="#2a3560" />
      </mesh>
    </group>
  );
}

// Variant 3: Market Hall (wide, low, with arched openings and timber frame feel)
function StationMarketHall({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Long hall */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.0, 0.32, 0.56]} />
        <meshStandardMaterial color={wallCol} roughness={0.72} flatShading />
      </mesh>
      {/* Pitched roof */}
      <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.60, 0.22, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.7} flatShading />
      </mesh>
      {/* Timber cross-beams (visible on front) */}
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0.285]}>
          <boxGeometry args={[0.03, 0.30, 0.01]} />
          <meshStandardMaterial color="#3a2008" roughness={0.85} flatShading />
        </mesh>
      ))}
      {[0.15, 0.30].map((y, i) => (
        <mesh key={i} position={[0, y, 0.285]}>
          <boxGeometry args={[1.0, 0.02, 0.01]} />
          <meshStandardMaterial color="#3a2008" roughness={0.85} flatShading />
        </mesh>
      ))}
      {/* Arched openings */}
      {[-0.30, 0, 0.30].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0.285]}>
          <boxGeometry args={[0.16, 0.16, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
      {/* Small chimney */}
      <mesh position={[0.30, 0.50, -0.08]} castShadow>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#5a3020" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// Variant 4: Fortress Station (thick walls, battlements, round turret)
function StationFortress({ wallCol, roofCol }: { wallCol: THREE.Color; roofCol: THREE.Color }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.06, 0.80]} />
        <meshStandardMaterial color="#c8b888" roughness={0.8} flatShading />
      </mesh>
      {/* Main keep */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.60, 0.44, 0.50]} />
        <meshStandardMaterial color={wallCol} roughness={0.78} flatShading />
      </mesh>
      {/* Battlements */}
      {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.54, 0]} castShadow>
          <boxGeometry args={[0.10, 0.08, 0.52]} />
          <meshStandardMaterial color={wallCol} roughness={0.78} flatShading />
        </mesh>
      ))}
      {/* Round turret (left) */}
      <mesh position={[-0.40, 0.30, 0.20]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.54, 6]} />
        <meshStandardMaterial color={wallCol} roughness={0.76} flatShading />
      </mesh>
      <mesh position={[-0.40, 0.60, 0.20]} castShadow>
        <coneGeometry args={[0.18, 0.20, 6]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Square tower (right) */}
      <mesh position={[0.40, 0.34, -0.16]} castShadow>
        <boxGeometry args={[0.24, 0.62, 0.24]} />
        <meshStandardMaterial color={wallCol} roughness={0.76} flatShading />
      </mesh>
      <mesh position={[0.40, 0.68, -0.16]} castShadow>
        <coneGeometry args={[0.18, 0.16, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.65} flatShading />
      </mesh>
      {/* Gate */}
      <mesh position={[0, 0.14, 0.255]}>
        <boxGeometry args={[0.16, 0.20, 0.01]} />
        <meshBasicMaterial color="#1a1008" />
      </mesh>
      {/* Arrow slits */}
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.38, 0.255]}>
          <boxGeometry args={[0.03, 0.12, 0.01]} />
          <meshBasicMaterial color="#1a2540" />
        </mesh>
      ))}
    </group>
  );
}

// Deterministic hash from city id → variant index [0-4]
function cityHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 5;
}

// Deterministic Y-rotation from city id (gives each station a unique facing)
function cityRotation(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 628) / 100; // 0 to ~6.28 radians
}

function StationBuilding({ wallHex, roofHex, cityId }: { wallHex: string; roofHex: string; cityId: string }) {
  const wallCol = new THREE.Color(wallHex);
  const roofCol = new THREE.Color(roofHex);
  const variant = cityHash(cityId);
  const rotY = cityRotation(cityId);

  const renderVariant = () => {
    switch (variant) {
      case 0: return <StationGrandTerminal wallCol={wallCol} roofCol={roofCol} />;
      case 1: return <StationNordicTower wallCol={wallCol} roofCol={roofCol} />;
      case 2: return <StationCathedral wallCol={wallCol} roofCol={roofCol} />;
      case 3: return <StationMarketHall wallCol={wallCol} roofCol={roofCol} />;
      case 4: return <StationFortress wallCol={wallCol} roofCol={roofCol} />;
      default: return <StationGrandTerminal wallCol={wallCol} roofCol={roofCol} />;
    }
  };

  return (
    <group scale={[0.80, 0.80, 0.80]} rotation={[0, rotY, 0]}>
      {renderVariant()}
    </group>
  );
}

function EdinburghCastle() {
  return (
    <group scale={[0.50, 0.50, 0.50]}>
      {/* Main rocky base mound */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.1, 0.9]} />
        <meshStandardMaterial color="#55555d" roughness={0.9} flatShading />
      </mesh>
      {/* Main keep block */}
      <mesh position={[-0.1, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.36, 0.65]} />
        <meshStandardMaterial color="#888890" roughness={0.8} flatShading />
      </mesh>
      {/* Castle Tower 1 */}
      <mesh position={[0.34, 0.34, 0.22]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 6]} />
        <meshStandardMaterial color="#7c7c84" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.34, 0.64, 0.22]} castShadow>
        <coneGeometry args={[0.22, 0.18, 6]} />
        <meshStandardMaterial color="#b2443a" roughness={0.7} flatShading />
      </mesh>
      {/* Castle Tower 2 */}
      <mesh position={[0.34, 0.34, -0.22]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 6]} />
        <meshStandardMaterial color="#7c7c84" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.34, 0.64, -0.22]} castShadow>
        <coneGeometry args={[0.22, 0.18, 6]} />
        <meshStandardMaterial color="#b2443a" roughness={0.7} flatShading />
      </mesh>
      {/* Portcullis Doorway */}
      <mesh position={[-0.1, 0.18, 0.335]} castShadow>
        <boxGeometry args={[0.2, 0.22, 0.02]} />
        <meshStandardMaterial color="#3a2008" roughness={0.9} />
      </mesh>
    </group>
  );
}

interface Props {
  city: City;
  interactive: boolean;
  onClick: (cityId: string) => void;
}

export function CityMarker({ city, interactive, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const [wx, wz] = toWorld(city.x, city.y);

  // Dynamic elevation — guaranteed minimum of 0.08 so no station sinks into terrain
  const baseY = Math.max(getTerrainHeight(city.x, city.y), 0.08);

  const regionKey = CITY_REGION[city.id] ?? 'eastern';
  const wallHex = REGION_WALL[regionKey] ?? '#c8b888';
  const roofHex = REGION_ROOF[regionKey] ?? '#5a3820';

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (interactive) { setHovered(true); document.body.style.cursor = 'pointer'; }
  }, [interactive]);

  const handleOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default';
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); if (interactive) onClick(city.id);
  }, [interactive, onClick, city.id]);

  // Calculate dynamic rounded black pill badge width based on name length
  const badgeWidth = city.name.length * 0.17 + 0.40;

  // Render distinctive custom 3D landmark shapes for major cities
  const renderLandmark = () => {
    switch (city.id) {
      case 'paris': return <EiffelTower />;
      case 'moskva': return <OnionDomeCathedral />;
      case 'london': return <BigBen />;
      case 'roma': return <RomanRotunda />;
      case 'athina': return <GreekTemple />;
      case 'amsterdam': return <CanalHouses />;
      case 'edinburgh': return <EdinburghCastle />;
      default: return <StationBuilding wallHex={wallHex} roofHex={roofHex} cityId={city.id} />;
    }
  };

  // Lighthouse cities (marker handled separately in LighthouseMesh.tsx)
  if (LIGHTHOUSE_CITIES.has(city.id)) {
    return (
      <group position={[wx, baseY, wz]}>
        <Billboard position={[0, 1.2, 0]}>
          {/* Connecting pin line */}
          <mesh position={[0, -0.6, -0.02]}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
            <meshBasicMaterial color="#ffffff" opacity={0.20} transparent />
          </mesh>
          {/* Rounded black pill badge backdrop */}
          <mesh position={[0, 0.16, -0.02]} receiveShadow={false}>
            <planeGeometry args={[badgeWidth, 0.44]} />
            <meshBasicMaterial color="#0b0f19" opacity={0.88} transparent depthWrite={false} />
          </mesh>
          <Text
            fontSize={0.26}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.16, 0]}
          >
            {city.name.toUpperCase()}
          </Text>
        </Billboard>
      </group>
    );
  }

  // Calculate suitable elevation offset depending on the height of the landmark
  const labelY = city.id === 'paris' ? 0.65 : city.id === 'moskva' ? 0.52 : city.id === 'london' ? 0.55 : city.id === 'edinburgh' ? 0.58 : 0.75;

  return (
    <group
      ref={groupRef}
      position={[wx, baseY, wz]}
      scale={hovered ? [1.10, 1.10, 1.10] : [1, 1, 1]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {renderLandmark()}

      {/* Base glow disc for clear node identification */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.25} transparent depthWrite={false} />
      </mesh>

      {/* Floating Connecting Line from label to landmark */}
      <mesh position={[0, (labelY + 0.16) / 2, -0.02]}>
        <cylinderGeometry args={[0.004, 0.004, labelY + 0.16, 4]} />
        <meshBasicMaterial color="#ffffff" opacity={0.20} transparent />
      </mesh>

      {/* Label Billboards with premium rounded pill badges */}
      <Billboard position={[0, labelY, 0]}>
        <mesh position={[0, 0.16, -0.02]} receiveShadow={false}>
          <planeGeometry args={[badgeWidth, 0.44]} />
          <meshBasicMaterial color="#07111e" opacity={0.92} transparent depthWrite={false} />
        </mesh>
        <Text
          fontSize={0.30}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.16, 0]}
          fontWeight="bold"
        >
          {city.name.toUpperCase()}
        </Text>
      </Billboard>

      {/* Floating Train Station Building tooltip on Hover (Clean Graph Node details) */}
      {hovered && interactive && (
        <Billboard position={[0, labelY + 0.72, 0]}>
          <mesh receiveShadow={false}>
            <planeGeometry args={[2.8, 0.44]} />
            <meshBasicMaterial color="#050a14" opacity={0.94} transparent depthWrite={false} />
          </mesh>
          <Text
            fontSize={0.14}
            color="#ffd700"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.12, 0]}
          >
            {"BUILD TRAIN STATION"}
          </Text>
          <Text
            fontSize={0.11}
            color="#b0c5e0"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.10, 0]}
          >
            {"Requires 1-3 matching cards"}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
