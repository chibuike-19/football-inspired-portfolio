"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { PCFShadowMap, type Mesh } from "three";
import { CAMERA } from "@/core/config";
import { createSimulation, type Simulation } from "@/core/simulation";
import { useWorldStore } from "@/state/store";
import { Ball } from "./Ball";
import { createInputController } from "./input";
import { Joystick } from "./Joystick";
import { BALL } from "./layout";
import { SPAWN } from "./landmarks";
import { BOUNDS, OBSTACLES } from "./obstacles";
import { WorldController } from "./WorldController";
import { GroundMarkers } from "./GroundMarkers";
import { DiscoveryAnnouncer, PreviewCard, PreviewTracker } from "./PreviewOverlay";
import { Lighting } from "./Environment";
import { Goals } from "./Goals";
import { Pitch } from "./Pitch";
import { QUALITY } from "./quality";
import { Stadium } from "./Stadium";
import { Structures } from "./Structures";
import { loadCanvasFonts } from "./textures/canvas";

const DEBUG = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_WORLD_DEBUG === "1";

/** Debug builds only: `?cam=x,y,z,tx,ty,tz` fixes the camera for inspecting the scene. */
function readDebugCamera(): number[] | null {
  if (!DEBUG) return null;
  const values = new URLSearchParams(window.location.search).get("cam")?.split(",").map(Number);
  return values?.length === 6 && values.every(Number.isFinite) ? values : null;
}

function DebugCamera({ values }: { values: number[] }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    camera.position.set(values[0], values[1], values[2]);
    camera.lookAt(values[3], values[4], values[5]);
    invalidate();
  }, [camera, values, invalidate]);
  return null;
}

/** Debug builds only: `window.__world` for Playwright (SPEC §15.2). */
function useDebugHook(simulation: Simulation) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!DEBUG) return;
    const hook = {
      getState: () => ({ ball: { ...simulation.ball }, activeLandmarkId: useWorldStore.getState().activeLandmarkId }),
      setBall: (x: number, z: number) => {
        simulation.place(x, z);
        invalidate();
      },
    };
    (window as unknown as { __world?: typeof hook }).__world = hook;
    return () => {
      delete (window as unknown as { __world?: typeof hook }).__world;
    };
  }, [simulation, invalidate]);
}

function DebugHook({ simulation }: { simulation: Simulation }) {
  useDebugHook(simulation);
  return null;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Marks the world ready after the first frames with the full scene have rendered. */
function ReadySignal() {
  const setStatus = useWorldStore((state) => state.setStatus);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setStatus("ready"));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [setStatus]);
  return null;
}

/** Hands context loss to the mount so it can fall back to Classic view (SPEC §11.3). */
function ContextLossGuard() {
  const gl = useThree((state) => state.gl);
  const fail = useWorldStore((state) => state.fail);
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      fail("context-lost");
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl, fail]);
  return null;
}

export default function World() {
  const quality = useWorldStore((state) => state.quality);
  const settings = QUALITY[quality];
  const reducedMotion = useReducedMotion();
  const [debugCamera] = useState(readDebugCamera);
  const [simulation] = useState(() =>
    createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: { x: SPAWN[0], z: SPAWN[1] } }),
  );
  const [input] = useState(createInputController);
  useEffect(() => () => input.dispose(), [input]);

  const surface = useRef<HTMLDivElement>(null);
  const ball = useRef<Mesh>(null);
  const card = useRef<HTMLDivElement>(null);
  const setReducedMotion = useWorldStore((state) => state.setReducedMotion);
  useEffect(() => setReducedMotion(reducedMotion), [reducedMotion, setReducedMotion]);
  useEffect(() => input.setGameSurface(surface.current), [input]);

  // Canvas textures draw text, so wait for the page fonts first.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadCanvasFonts().then(() => !cancelled && setFontsReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={surface}
      tabIndex={0}
      role="application"
      aria-label="3D stadium. Use W A S D or the arrow keys, or drag, to move the ball."
      className="game-surface relative h-full w-full touch-none select-none outline-none"
    >
      <Canvas
        aria-hidden="true"
        frameloop="demand"
        dpr={settings.dpr}
        shadows={settings.shadows ? { type: PCFShadowMap } : false}
        gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
        camera={{ position: [0, CAMERA.HEIGHT, CAMERA.DISTANCE], fov: CAMERA.FOV, near: 0.5, far: 400 }}
      >
        <ContextLossGuard />
        <Lighting shadows={settings.shadows} shadowMapSize={settings.shadowMapSize} />
        {debugCamera && <DebugCamera values={debugCamera} />}
        <DebugHook simulation={simulation} />
        <WorldController
          simulation={simulation}
          input={input}
          ball={ball}
          reducedMotion={reducedMotion}
          freeCamera={debugCamera !== null}
        />
        <PreviewTracker card={card} simulation={simulation} />
        {fontsReady && (
          <>
            <Pitch pixelsPerUnit={settings.pitchPixelsPerUnit} />
            <Goals />
            <Stadium crowdDensity={settings.crowdDensity} />
            <Structures />
            <GroundMarkers />
            <Ball ref={ball} />
            <ReadySignal />
          </>
        )}
      </Canvas>
      <Joystick surface={surface} input={input} />
      <PreviewCard card={card} />
      <DiscoveryAnnouncer />
    </div>
  );
}
