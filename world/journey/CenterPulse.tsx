"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from "three";
import { PITCH } from "../layout";
import { useWorldStore } from "@/state/store";
import { STATIONS } from "./stations";

const DURATION = 1.4;

/**
 * Kickoff → Meet the player (spec transition 02): as the ball settles in the
 * centre circle, a ring of light expands outward from it.
 */
export function CenterPulse() {
  const station = useWorldStore((s) => s.journeyStation);
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const time = useRef<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (STATIONS[station]?.chapter !== "player" || useWorldStore.getState().reducedMotion) return;
    // Start as the camera is arriving, overlapping the move (spec §5).
    time.current = -useWorldStore.getState().panelDelay * 0.6;
    invalidate();
  }, [station, invalidate]);

  useFrame((_, delta) => {
    if (time.current === null || !mesh.current || !material.current) return;
    time.current += Math.min(delta, 0.05);
    const t = time.current / DURATION;
    if (t >= 1) {
      time.current = null;
      material.current.opacity = 0;
      invalidate();
      return;
    }
    const u = Math.max(0, t);
    const eased = 1 - Math.pow(1 - u, 3);
    mesh.current.scale.setScalar(0.25 + eased * 1.35);
    material.current.opacity = t < 0 ? 0 : 0.85 * (1 - u);
    invalidate();
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} renderOrder={2}>
      <ringGeometry args={[PITCH.centerCircleRadius - 0.25, PITCH.centerCircleRadius + 0.25, 96]} />
      <meshBasicMaterial
        ref={material}
        color="#a5b4fc"
        transparent
        opacity={0}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
