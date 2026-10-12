"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { PerspectiveCamera, type Mesh } from "three";
import { autopilotInput } from "@/core/autopilot";
import { createCamera, fovForAspect, stepCamera, type CameraState } from "@/core/camera";
import { createDiscovery, stepDiscovery } from "@/core/discovery";
import { AUTOPILOT, CAMERA, MOVEMENT } from "@/core/config";
import { lerp } from "@/core/math";
import { speed } from "@/core/movement";
import { createPerformanceMonitor, recordFrame, resetPerformanceMonitor } from "@/core/performance";
import type { Simulation } from "@/core/simulation";
import { useWorldStore } from "@/state/store";
import type { InputController } from "./input";
import { cameraFocus, DISCOVERY_LANDMARKS, LANDMARK_BY_ID, SPAWN } from "./landmarks";
import { rollBall } from "./ballRoll";
import { BALL, PITCH } from "./layout";

interface Props {
  simulation: Simulation;
  input: InputController;
  ball: RefObject<Mesh | null>;
  reducedMotion: boolean;
  /** Debug camera override: skip the follow camera entirely. */
  freeCamera: boolean;
}


/** Opening shot (SPEC §10.5): start a little higher and further back, then settle. */
function openingCamera(x: number, z: number, reducedMotion: boolean): CameraState {
  const camera = createCamera(x, z, reducedMotion);
  if (!reducedMotion) {
    camera.py += 5;
    camera.pz = Math.min(camera.pz + 4, CAMERA.MAX_Z);
  }
  return camera;
}

function autopilotTarget(target: string): { x: number; z: number } | null {
  if (target === "spawn") return { x: SPAWN[0], z: SPAWN[1] };
  const landmark = LANDMARK_BY_ID.get(target);
  return landmark ? { x: landmark.position[0], z: landmark.position[1] } : null;
}

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

  const cameraState = useRef<CameraState | null>(null);
  if (cameraState.current === null) cameraState.current = openingCamera(simulation.ball.x, simulation.ball.z, reducedMotion);
  const pilotStarted = useRef<{ requestId: number; time: number } | null>(null);
  const clock = useRef(0);
  const autopilot = useWorldStore((s) => s.autopilot);
  useEffect(() => invalidate(), [autopilot, invalidate]);
  const rendered = useRef({ x: simulation.ball.x, z: simulation.ball.z });
  const idle = useRef(true);
  const discovery = useRef(createDiscovery(DISCOVERY_LANDMARKS));
  const performanceMonitor = useRef(createPerformanceMonitor());
  // New quality settings recompile shaders and re-upload textures: measure afresh.
  const quality = useWorldStore((s) => s.quality);
  useEffect(() => resetPerformanceMonitor(performanceMonitor.current), [quality]);

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

  // Switching motion preference re-frames the camera (not on mount: keep the opening shot).
  const lastReduced = useRef(reducedMotion);
  useEffect(() => {
    if (lastReduced.current === reducedMotion) return;
    lastReduced.current = reducedMotion;
    cameraState.current = createCamera(simulation.ball.x, simulation.ball.z, reducedMotion);
    invalidate();
  }, [reducedMotion, simulation, invalidate]);

  useFrame(({ camera }, delta) => {
    // After an idle period the clock delta is the whole idle time; treat it as one frame.
    const dt = idle.current ? 1 / 60 : Math.min(delta, MOVEMENT.MAX_FRAME_DT);
    // Measure real frame intervals during continuous play only (SPEC §11.2).
    if (!idle.current && !freeCamera && recordFrame(performanceMonitor.current, delta)) useWorldStore.getState().degrade();
    clock.current += dt;
    let direction = input.direction();
    const userInput = direction.x !== 0 || direction.z !== 0;

    // Menu navigation (SPEC §7.5): any user input takes over immediately.
    const store = useWorldStore.getState();
    const pilot = store.autopilot;
    if (pilot && userInput) {
      store.clearAutopilot();
    } else if (pilot) {
      const target = autopilotTarget(pilot.target);
      if (pilotStarted.current?.requestId !== pilot.requestId) {
        pilotStarted.current = { requestId: pilot.requestId, time: clock.current };
        if (target && reducedMotion) simulation.place(target.x, target.z); // teleport, no travel
      }
      const steer = target ? autopilotInput(simulation.ball, target, { pitchHalfLength: PITCH.halfLength }) : null;
      if (!steer || clock.current - pilotStarted.current.time > AUTOPILOT.TIMEOUT) store.clearAutopilot();
      else direction = steer;
    }
    const alpha = simulation.advance(dt, direction);
    const { ball: now, previous } = simulation;

    const x = lerp(previous.x, now.x, alpha);
    const z = lerp(previous.z, now.z, alpha);
    const mesh = ball.current;
    if (mesh) {
      mesh.position.set(x, BALL.radius, z);
      rollBall(mesh, x - rendered.current.x, z - rendered.current.z);
    }
    rendered.current.x = x;
    rendered.current.z = z;

    // Discovery runs on the simulated ball; the store is written only on change.
    const found = stepDiscovery(discovery.current, DISCOVERY_LANDMARKS, now, dt);
    if (found.changed) useWorldStore.getState().setDiscovery(discovery.current.activeId, discovery.current.states);
    const active = discovery.current.activeId ? LANDMARK_BY_ID.get(discovery.current.activeId) : undefined;

    let cameraMoving = false;
    if (!freeCamera) {
      const c = cameraState.current!;
      const focus = active ? cameraFocus(active) : null;
      cameraMoving = stepCamera(c, { ballX: x, ballZ: z, vx: now.vx, vz: now.vz, reducedMotion, focus }, dt);
      camera.position.set(c.px, c.py, c.pz);
      camera.lookAt(c.tx, c.ty, c.tz);
    }

    const busy =
      cameraMoving || found.pending || speed(now) > 0 || direction.x !== 0 || direction.z !== 0 || store.autopilot !== null;
    idle.current = !busy;
    if (busy) invalidate();
  });

  return null;
}
