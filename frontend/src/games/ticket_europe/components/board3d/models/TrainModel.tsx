import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

// Preload to prevent rendering pop-ins during active gameplay
useGLTF.preload('/models/trains/train-locomotive-a.glb');
useGLTF.preload('/models/trains/train-carriage-container-red.glb');
useGLTF.preload('/models/trains/train-carriage-container-blue.glb');
useGLTF.preload('/models/trains/train-carriage-container-green.glb');
useGLTF.preload('/models/trains/train-carriage-box.glb');
useGLTF.preload('/models/trains/train-carriage-coal.glb');
useGLTF.preload('/models/trains/train-carriage-tank.glb');

interface Props {
  color: string; // Emissive hex or player hex color
  isLocomotive?: boolean;
  type?: 'container' | 'box' | 'coal' | 'tank';
}

export function TrainModel({ color, isLocomotive = false, type = 'box' }: Props) {
  let modelPath = '/models/trains/train-carriage-box.glb';
  if (isLocomotive) {
    modelPath = '/models/trains/train-locomotive-a.glb';
  } else {
    switch (type) {
      case 'container':
        // Map common hex colors to pre-colored container assets, fallback to standard tinted ones
        const cLower = color.toLowerCase();
        if (cLower === '#ee1111' || cLower === 'red' || cLower === '#ff0000') {
          modelPath = '/models/trains/train-carriage-container-red.glb';
        } else if (cLower === '#0055ee' || cLower === 'blue') {
          modelPath = '/models/trains/train-carriage-container-blue.glb';
        } else if (cLower === '#00aa22' || cLower === 'green') {
          modelPath = '/models/trains/train-carriage-container-green.glb';
        } else {
          modelPath = '/models/trains/train-carriage-box.glb';
        }
        break;
      case 'coal':
        modelPath = '/models/trains/train-carriage-coal.glb';
        break;
      case 'tank':
        modelPath = '/models/trains/train-carriage-tank.glb';
        break;
      case 'box':
      default:
        modelPath = '/models/trains/train-carriage-box.glb';
        break;
    }
  }

  const { scene } = useGLTF(modelPath);

  // Clone the scene graph so instances have independent, customized materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Dynamically override material with high-contrast player-tinted styling
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          roughness: 0.45,
          metalness: 0.15,
          flatShading: true,
        });
      }
    });
    return clone;
  }, [scene, color]);

  // Rotated Y by Math.PI / 2 because Kenney models face sideways by default, we align them along the track direction
  // Scaled down to match standard 0.4 world-unit slot dimensions
  return (
    <primitive 
      object={clonedScene} 
      scale={[0.13, 0.13, 0.13]} 
      rotation={[0, Math.PI / 2, 0]} 
    />
  );
}
