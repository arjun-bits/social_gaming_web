/**
 * TableSurface.tsx — Walnut wood plank table surface with grain lines.
 * Uses Drei Instances to reduce 84 draw calls → 2 draw calls.
 * Memoized since it never changes.
 */
import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';

const SHADES = ['#22140a', '#291b0f', '#2f1f13', '#332317'];
const GRAIN_COLOR = '#120803';

interface PlankData {
  xPos: number;
  color: string;
}

export const TableSurface = React.memo(function TableSurface() {
  const planks = useMemo<PlankData[]>(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const xPos = (i - 20.5) * 5.1;
      const index = Math.floor(Math.abs(Math.sin(i * 12.7) * SHADES.length)) % SHADES.length;
      return { xPos, color: SHADES[index] };
    });
  }, []);

  // Grain lines — 2 per plank (56 total, 1 draw call)
  const grainLines = useMemo(() => {
    const lines: Array<{ x: number; z: number }> = [];
    for (const plank of planks) {
      lines.push({ x: plank.xPos - 1.2, z: 0 });
      lines.push({ x: plank.xPos + 0.8, z: 0 });
    }
    return lines;
  }, [planks]);

  return (
    <group position={[0, -0.42, 0]}>
      {/* Base Planks — 1 draw call for all 28 */}
      <Instances limit={45} range={planks.length} frustumCulled={false}>
        <planeGeometry args={[5.0, 150]} />
        <meshStandardMaterial roughness={0.85} metalness={0.06} />
        {planks.map((p, i) => (
          <Instance
            key={i}
            position={[p.xPos, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            color={p.color}
          />
        ))}
      </Instances>

      {/* Grain Lines — 1 draw call for all 56 */}
      <Instances limit={90} range={grainLines.length} frustumCulled={false}>
        <planeGeometry args={[0.07, 150]} />
        <meshStandardMaterial color={GRAIN_COLOR} roughness={0.9} transparent opacity={0.35} />
        {grainLines.map((g, i) => (
          <Instance
            key={i}
            position={[g.x, 0.001, g.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        ))}
      </Instances>
    </group>
  );
});
