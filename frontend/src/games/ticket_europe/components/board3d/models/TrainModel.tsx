/**
 * TrainModel.tsx — Loads Kenney GLB train car models for claimed routes.
 * Maps route/player colors to specific train car models.
 */
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// Model paths
const LOCOMOTIVE = '/models/trains/train-locomotive-a.glb';
const CARRIAGE_RED = '/models/trains/train-carriage-container-red.glb';
const CARRIAGE_BLUE = '/models/trains/train-carriage-container-blue.glb';
const CARRIAGE_GREEN = '/models/trains/train-carriage-container-green.glb';
const CARRIAGE_BOX = '/models/trains/train-carriage-box.glb';
const CARRIAGE_COAL = '/models/trains/train-carriage-coal.glb';
const CARRIAGE_TANK = '/models/trains/train-carriage-tank.glb';

// Map route colors to specific model paths
function getModelPath(routeColor: string, slotIndex: number): string {
  // First slot = locomotive
  if (slotIndex === 0) return LOCOMOTIVE;
  // Cycle through carriages based on slot index for variety
  const carriages = [CARRIAGE_BOX, CARRIAGE_COAL, CARRIAGE_TANK];
  switch (routeColor) {
    case 'red': return CARRIAGE_RED;
    case 'blue': return CARRIAGE_BLUE;
    case 'green': return CARRIAGE_GREEN;
    default: return carriages[(slotIndex - 1) % carriages.length];
  }
}

interface TrainModelProps {
  routeColor: string;
  playerColor: THREE.Color;
  slotIndex: number;
  slotLen: number;
  scale?: number;
}

export function TrainModel({ routeColor, playerColor, slotIndex, slotLen, scale = 1 }: TrainModelProps) {
  const modelPath = getModelPath(routeColor, slotIndex);
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Tint all meshes with the player color
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.color.lerp(playerColor, 0.5);
          mat.emissive = playerColor.clone().multiplyScalar(0.15);
          mat.emissiveIntensity = 0.6;
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene, playerColor]);

  // Scale model to fit slot dimensions
  const fitScale = slotLen * 0.65 * scale;

  return (
    <group ref={groupRef} scale={[fitScale, fitScale, fitScale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload all models to avoid pop-in
useGLTF.preload(LOCOMOTIVE);
useGLTF.preload(CARRIAGE_RED);
useGLTF.preload(CARRIAGE_BLUE);
useGLTF.preload(CARRIAGE_GREEN);
useGLTF.preload(CARRIAGE_BOX);
useGLTF.preload(CARRIAGE_COAL);
useGLTF.preload(CARRIAGE_TANK);
