"use client";

import { useEffect, useMemo } from "react";
import { GROUND } from "./layout";
import { createPitchTexture } from "./textures/pitch";

export function Pitch({ pixelsPerUnit }: { pixelsPerUnit: number }) {
  const texture = useMemo(() => createPitchTexture(pixelsPerUnit), [pixelsPerUnit]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[GROUND.halfX * 2, GROUND.halfZ * 2]} />
      <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
    </mesh>
  );
}
