import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

// Preload the straight railroad asset
useGLTF.preload('/models/trains/railroad-straight.glb');

interface Props {
  color: string; // Hex color string representing route card requirements
  isHighlighted?: boolean;
}

export function TrackModel({ color, isHighlighted = false }: Props) {
  const { scene } = useGLTF('/models/trains/railroad-straight.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Dynamic material targeting:
        // Identify metallic rail meshes by name keywords to apply route colors with shiny steel reflections.
        // Sleepers/ties are given a dark mahogany wood feel.
        const nameLower = mesh.name.toLowerCase();
        if (nameLower.includes('rail') || nameLower.includes('metal') || nameLower.includes('steel')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.25,
            metalness: 0.85,
            emissive: new THREE.Color(color),
            emissiveIntensity: isHighlighted ? 0.85 : 0.35, // Emissive glow for clear visibility
            flatShading: true,
          });
        } else {
          // Wooden sleeper ties
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#382318'), // Tactile dark wood
            roughness: 0.95,
            metalness: 0.05,
            flatShading: true,
          });
        }
      }
    });
    return clone;
  }, [scene, color, isHighlighted]);

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
