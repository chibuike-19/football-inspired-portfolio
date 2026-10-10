"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { PerspectiveCamera, Quaternion, Vector3, type Mesh } from "three";
import { createCamera, fovForAspect, stepCamera } from "@/core/camera";
import { MOVEMENT } from "@/core/config";
import { lerp } from "@/core/math";
import { speed } from "@/core/movement";
import type { Simulation } from "@/core/simulation";
import type { InputController } from "./input";
import { BALL } from "./layout";

interface Props {
  simulation: Simulation;
  input: InputController;
  ball: RefObject<Mesh | null>;
  reducedMotion: boolean;
  /** Debug camera override: skip the follow camera entirely. */
  freeCamera: boolean;
}

const axis = new Vector3();
const spin = new Quaternion();

/**
 * Frame orchestration (SPEC §3.2): input → fixed-step simulation → ball mesh
 * → camera. Everything per-frame lives in refs; React never re-renders here.
 * With `frameloop="demand"`, frames are requested only while something moves.
 */
export function WorldController({ simulation, input, ball, reducedMotion, freeCamera }: Props) {
  // Read the camera at call time: three.js objects are mutated by design.
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);

  const cameraState = useRef(createCamera(simulation.ball.x, simulation.ball.z, reducedMotion));
  const rendered = useRef({ x: simulation.ball.x, z: simulation.ball.z });
  const idle = useRef(true);

  // Wake the loop on input.
  useEffect(() => input.onChange(() => invalidate()), [input, invalidate]);

  // Portrait screens get a wider vertical FOV so the stadium width still fits.
  useEffect(() => {
    const camera = get().camera;
    if (!(camera instanceof PerspectiveCamera) || freeCamera) return;
    camera.fov = fovForAspect(size.width / Math.max(1, size.height));
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size, freeCamera, invalidate]);

  // Switching motion preference re-frames the camera on the next frame.
  useEffect(() => {
    cameraState.current = createCamera(simulation.ball.x, simulation.ball.z, reducedMotion);
    invalidate();
  }, [reducedMotion, simulation, invalidate]);

  useFrame(({ camera }, delta) => {
    // After an idle period the clock delta is the whole idle time; treat it as one frame.
    const dt = idle.current ? 1 / 60 : Math.min(delta, MOVEMENT.MAX_FRAME_DT);
    const direction = input.direction();
    const alpha = simulation.advance(dt, direction);
    const { ball: now, previous } = simulation;

    const x = lerp(previous.x, now.x, alpha);
    const z = lerp(previous.z, now.z, alpha);
    const mesh = ball.current;
    if (mesh) {
      mesh.position.set(x, BALL.radius, z);
      // Roll without slipping: rotate about (up × travel) by distance / radius.
      const dx = x - rendered.current.x;
      const dz = z - rendered.current.z;
      const distance = Math.hypot(dx, dz);
      // Skip teleports (placement, deep links): only roll for real travel.
      if (distance > 1e-5 && distance < 1) {
        axis.set(dz / distance, 0, -dx / distance);
        spin.setFromAxisAngle(axis, distance / BALL.radius);
        mesh.quaternion.premultiply(spin);
      }
    }
    rendered.current.x = x;
    rendered.current.z = z;

    let cameraMoving = false;
    if (!freeCamera) {
      const c = cameraState.current;
      cameraMoving = stepCamera(c, { ballX: x, ballZ: z, vx: now.vx, vz: now.vz, reducedMotion }, dt);
      camera.position.set(c.px, c.py, c.pz);
      camera.lookAt(c.tx, c.ty, c.tz);
    }

    const active = cameraMoving || speed(now) > 0 || direction.x !== 0 || direction.z !== 0;
    idle.current = !active;
    if (active) invalidate();
  });

  return null;
}
