/**
 * TrackModel.tsx — Loads Kenney GLB railroad track model for unclaimed routes.
 * Tints rail color based on route color.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const RAILROAD_STRAIGHT = '/models/trains/railroad-straight.glb';

interface TrackModelProps {
  railColor: THREE.Color;
  slotLen: number;
  scale?: number;
}

export const TrackModel = React.memo(function TrackModel({ railColor, slotLen, scale = 1 }: TrackModelProps) {
  const { scene } = useGLTF(RAILROAD_STRAIGHT);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          // Tint rail parts with the route color
          mat.color.lerp(railColor, 0.4);
          mat.emissive = railColor.clone().multiplyScalar(0.2);
          mat.emissiveIntensity = 0.55;
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene, railColor]);

  const fitScale = slotLen * 0.55 * scale;

  return (
    <group scale={[fitScale, fitScale, fitScale]}>
      <primitive object={clonedScene} />
    </group>
  );
});

useGLTF.preload(RAILROAD_STRAIGHT);
