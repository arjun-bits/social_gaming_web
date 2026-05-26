/**
 * OceanPlane.tsx — Low-poly stylized ocean with gentle wave vertex displacement.
 * Three depth layers with vibrant teal-blue colors that render correctly
 * regardless of camera angle or lighting setup.
 */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function WaveOceanLayer({
  width, depth, yPos, color, segments, waveAmp, waveFreq, waveSpeed,
}: {
  width: number; depth: number; yPos: number; color: string;
  segments: number; waveAmp: number; waveFreq: number; waveSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, depth, segments, segments);
    geo.rotateX(-Math.PI / 2);

    // Initial low-poly wave displacement
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const wave = Math.sin(x * waveFreq + z * waveFreq * 0.7) * waveAmp
                 + Math.cos(x * waveFreq * 0.5 - z * waveFreq * 1.2) * waveAmp * 0.6;
      pos.setY(i, wave);
    }
    geo.computeVertexNormals();
    return geo;
  }, [width, depth, segments, waveAmp, waveFreq]);

  // Subtle animated wave motion
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position;
    const t = clock.getElapsedTime() * waveSpeed;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const wave = Math.sin(x * waveFreq + z * waveFreq * 0.7 + t) * waveAmp
                 + Math.cos(x * waveFreq * 0.5 - z * waveFreq * 1.2 + t * 0.6) * waveAmp * 0.6;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, yPos, 0]} receiveShadow raycast={() => {}}>
      <meshLambertMaterial color={color} flatShading side={THREE.DoubleSide} />
    </mesh>
  );
}

export const OceanPlane = React.memo(function OceanPlane() {
  return (
    <>
      {/* Deep ocean — largest, fills entire board tray with no edge gaps */}
      <WaveOceanLayer
        width={63} depth={48} yPos={-0.16}
        color="#0b4a78"
        segments={24} waveAmp={0.025} waveFreq={0.6} waveSpeed={0.3}
      />
      {/* Mid-ocean — teal, slightly more active */}
      <WaveOceanLayer
        width={60} depth={45} yPos={-0.14}
        color="#1a8a9e"
        segments={20} waveAmp={0.02} waveFreq={0.7} waveSpeed={0.35}
      />
      {/* Shallow coastal — bright turquoise, visible ripples */}
      <WaveOceanLayer
        width={57} depth={42} yPos={-0.12}
        color="#38bdd4"
        segments={18} waveAmp={0.015} waveFreq={0.8} waveSpeed={0.4}
      />
    </>
  );
});
