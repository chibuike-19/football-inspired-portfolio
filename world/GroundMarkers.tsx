"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MeshBasicMaterial } from "three";
import { lerp } from "@/core/math";
import { useEmphasis } from "./emphasis";
import { LANDMARKS, type LandmarkDef } from "./landmarks";
import { createCanvas, toTexture } from "./textures/canvas";

/** Soft ring painted on the turf: tells the player where each landmark's spot is. */
function createRingTexture() {
  const size = 256;
  const { canvas, ctx } = createCanvas(size, size);
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, c * 0.55, c, c, c);
  // Cool white with a hint of the indigo accent: reads on turf without going neon.
  gradient.addColorStop(0, "rgba(224, 231, 255, 0)");
  gradient.addColorStop(0.58, "rgba(224, 231, 255, 0.95)");
  gradient.addColorStop(0.72, "rgba(165, 180, 252, 0.4)");
  gradient.addColorStop(1, "rgba(165, 180, 252, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const inner = ctx.createRadialGradient(c, c, 0, c, c, c * 0.6);
  inner.addColorStop(0, "rgba(224, 231, 255, 0.14)");
  inner.addColorStop(1, "rgba(224, 231, 255, 0)");
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas, 4);
}

function Marker({ landmark, texture }: { landmark: LandmarkDef; texture: ReturnType<typeof createRingTexture> }) {
  const material = useRef<MeshBasicMaterial>(null);
  useEmphasis(landmark.id, (value) => {
    if (material.current) material.current.opacity = lerp(0.16, 0.7, value);
  });
  const size = Math.min(landmark.activeRadius * 0.9, 3.6);
  return (
    <mesh position={[landmark.position[0], 0.02, landmark.position[1]]} rotation-x={-Math.PI / 2} renderOrder={1}>
      <planeGeometry args={[size * 2, size * 2]} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        transparent
        opacity={0.16}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function GroundMarkers() {
  const texture = useMemo(() => createRingTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <>
      {LANDMARKS.map((landmark) => (
        <Marker key={landmark.id} landmark={landmark} texture={texture} />
      ))}
    </>
  );
}
