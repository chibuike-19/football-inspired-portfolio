"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { PCFShadowMap } from "three";
import { useWorldStore } from "@/state/store";
import { Ball } from "./Ball";
import { Lighting } from "./Environment";
import { Goals } from "./Goals";
import { Pitch } from "./Pitch";
import { QUALITY } from "./quality";
import { Stadium } from "./Stadium";
import { Structures } from "./Structures";
import { loadCanvasFonts } from "./textures/canvas";

/** Static spawn view for Phase 3; the follow camera arrives in Phase 4. */
// Low and wide so the pitch, boards, stands and scoreboard all read from the spawn point.
const CAMERA = { position: [0, 8, 15] as const, target: [0, 1.84, -14] as const, fov: 55 };

function CameraSetup() {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    camera.lookAt(...CAMERA.target);
    // Dev / debug builds only: `?cam=x,y,z,tx,ty,tz` places the camera for inspecting the scene.
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_WORLD_DEBUG === "1") {
      const values = new URLSearchParams(window.location.search).get("cam")?.split(",").map(Number);
      if (values?.length === 6 && values.every(Number.isFinite)) {
        camera.position.set(values[0], values[1], values[2]);
        camera.lookAt(values[3], values[4], values[5]);
      }
    }
    invalidate();
  }, [camera, invalidate]);
  return null;
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
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={settings.dpr}
      shadows={settings.shadows ? { type: PCFShadowMap } : false}
      gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
      camera={{ position: [...CAMERA.position], fov: CAMERA.fov, near: 0.5, far: 400 }}
    >
      <CameraSetup />
      <ContextLossGuard />
      <Lighting shadows={settings.shadows} shadowMapSize={settings.shadowMapSize} />
      {fontsReady && (
        <>
          <Pitch pixelsPerUnit={settings.pitchPixelsPerUnit} />
          <Goals />
          <Stadium crowdDensity={settings.crowdDensity} />
          <Structures />
          <Ball />
          <ReadySignal />
        </>
      )}
    </Canvas>
  );
}
