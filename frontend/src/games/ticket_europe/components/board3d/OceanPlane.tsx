/**
 * OceanPlane.tsx — Deeper, richer navy-blue/slate stylized board-game ocean.
 * Matches target Image 2 perfectly, providing high contrast for the low-poly Europe landmass.
 */
import React from 'react';

export function OceanPlane() {
  return (
    <>
      {/* Deep ocean layer sitting flat inside the borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <planeGeometry args={[25.6, 18.6]} />
        <meshLambertMaterial color="#0b1424" flatShading />
      </mesh>
      {/* Mid-ocean dark navy layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[24.8, 17.8]} />
        <meshLambertMaterial color="#0f2038" flatShading />
      </mesh>
      {/* Stylized shallows layer closer to coastlines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[23.8, 16.8]} />
        <meshLambertMaterial color="#162e4f" flatShading />
      </mesh>
    </>
  );
}
