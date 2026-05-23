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
    <group scale={[0.39, 0.39, 0.39]}>
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
    <group scale={[0.39, 0.39, 0.39]}>
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
    <group scale={[0.39, 0.39, 0.39]}>
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
    <group scale={[0.42, 0.42, 0.42]}>
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
    <group scale={[0.42, 0.42, 0.42]}>
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
    <group scale={[0.42, 0.42, 0.42]}>
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

function StationBuilding({ wallHex, roofHex }: { wallHex: string; roofHex: string }) {
  const wallCol = new THREE.Color(wallHex);
  const roofCol = new THREE.Color(roofHex);
  const platCol = new THREE.Color('#c8b888');

  return (
    <group scale={[0.42, 0.42, 0.42]}>
      {/* Platform base */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.08, 0.72]} />
        <meshLambertMaterial color={platCol} />
      </mesh>
      {/* Main hall body */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.72, 0.40, 0.50]} />
        <meshLambertMaterial color={wallCol} />
      </mesh>
      {/* Roof — gabled */}
      <mesh position={[0, 0.50, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.46, 0.28, 4]} />
        <meshLambertMaterial color={roofCol} />
      </mesh>
      {/* Side wings */}
      {([-1, 1] as const).map(side => (
        <group key={side}>
          <mesh position={[side * 0.54, 0.18, 0]} castShadow>
            <boxGeometry args={[0.28, 0.24, 0.44]} />
            <meshLambertMaterial color={wallCol} />
          </mesh>
          <mesh position={[side * 0.54, 0.32, 0]} castShadow>
            <coneGeometry args={[0.23, 0.18, 4]} />
            <meshLambertMaterial color={roofCol} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EdinburghCastle() {
  return (
    <group scale={[0.42, 0.42, 0.42]}>
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

  // Dynamic elevation alignment to snap perfectly to the terrain mesh height
  const baseY = getTerrainHeight(city.x, city.y);

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
  const badgeWidth = city.name.length * 0.16 + 0.35;

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
      default: return <StationBuilding wallHex={wallHex} roofHex={roofHex} />;
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
  const labelY = city.id === 'paris' ? 0.65 : city.id === 'moskva' ? 0.52 : city.id === 'london' ? 0.55 : city.id === 'edinburgh' ? 0.48 : 0.40;

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
          fontSize={0.25}
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
