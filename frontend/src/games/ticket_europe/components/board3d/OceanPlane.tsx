/**
 * OceanPlane.tsx — Deeper, richer navy-blue/slate stylized board-game ocean.
 * Matches target Image 2 perfectly, providing high contrast for the low-poly Europe landmass.
 */

export function OceanPlane() {
  return (
    <>
      {/* Deep ocean layer sitting flat inside the borders */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[31.8, 23.8]} />
        <meshStandardMaterial color="#145274" roughness={0.65} metalness={0.10} flatShading />
      </mesh>
      {/* Mid-ocean dark navy layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow>
        <planeGeometry args={[29.5, 21.5]} />
        <meshStandardMaterial color="#2488a5" roughness={0.65} metalness={0.10} flatShading />
      </mesh>
      {/* Stylized shallows layer closer to coastlines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} receiveShadow>
        <planeGeometry args={[27.0, 19.0]} />
        <meshStandardMaterial color="#3fb4c6" roughness={0.60} metalness={0.08} flatShading />
      </mesh>
    </>
  );
}
