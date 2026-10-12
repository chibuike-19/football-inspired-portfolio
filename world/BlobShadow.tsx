"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import type { Mesh } from "three";
import { BALL } from "./layout";
import { createCanvas, toTexture } from "./textures/canvas";

function createBlobTexture() {
  const size = 64;
  const { canvas, ctx } = createCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas, 1);
}

/** Soft contact shadow under the ball for the low tier, where real-time shadows are off. */
export function BlobShadow({ ball }: { ball: RefObject<Mesh | null> }) {
  const texture = useMemo(() => createBlobTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const blob = useRef<Mesh>(null);
  // Runs after the controller has positioned the ball this frame.
  useFrame(() => {
    if (blob.current && ball.current) blob.current.position.set(ball.current.position.x, 0.015, ball.current.position.z);
  });
  const size = BALL.radius * 3.2;
  return (
    <mesh ref={blob} rotation-x={-Math.PI / 2} renderOrder={2}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
