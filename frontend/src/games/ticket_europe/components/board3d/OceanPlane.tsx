/**
 * OceanPlane.tsx — Deep teal ocean extending to screen edges.
 * Matches target image rich dark blue sea.
 */
import React from 'react';

export function OceanPlane() {
  return (
    <>
      {/* Main ocean — large enough for low dramatic camera */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 80]} />
        <meshLambertMaterial color="#0e2840" flatShading />
      </mesh>
      {/* Near shore slightly lighter teal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[44, 32]} />
        <meshLambertMaterial color="#122e48" flatShading />
      </mesh>
    </>
  );
}
