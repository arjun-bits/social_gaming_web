import * as THREE from 'three';

export function EiffelTower() {
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

export function OnionDomeCathedral() {
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

export function BigBen() {
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

export function RomanRotunda() {
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

export function GreekTemple() {
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

export function CanalHouses() {
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

export function EdinburghCastle() {
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
