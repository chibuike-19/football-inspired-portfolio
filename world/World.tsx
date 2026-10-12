"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { PCFShadowMap, type Mesh } from "three";
import { CAMERA } from "@/core/config";
import { createSimulation, type Simulation } from "@/core/simulation";
import { gameOwnsKeyboard } from "@/core/input";
import { useWorldStore, type MotionSetting, type Quality } from "@/state/store";
import { buttonStyles } from "@/ui/primitives";
import { writeViewPreference } from "./capability";
import { Ball } from "./Ball";
import { BlobShadow } from "./BlobShadow";
import { createInputController } from "./input";
import { Joystick } from "./Joystick";
import { BALL } from "./layout";
import { LANDMARK_BY_ID, SPAWN } from "./landmarks";
import { ExpandedPanel } from "./ExpandedPanel";
import { landmarkFromHash } from "./hash";
import { Hud } from "./Hud";
import { Onboarding } from "./Onboarding";
import { TapBridge, type TapPicker } from "./TapBridge";
import { usePanelHistory } from "./usePanelHistory";
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
function useDebugHook(simulation: Simulation, pick: () => TapPicker | null) {
  const invalidate = useThree((state) => state.invalidate);
  const get = useThree((state) => state.get);
  useEffect(() => {
    if (!DEBUG) return;
    const hook = {
      getState: () => {
        const { activeLandmarkId, expandedId, autopilot, reducedMotion } = useWorldStore.getState();
        return { ball: { ...simulation.ball }, activeLandmarkId, expandedId, autopilot, reducedMotion };
      },
      pick: (clientX: number, clientY: number) => pick()?.(clientX, clientY) ?? null,
      renderer: () => {
        const { gl } = get();
        return { calls: gl.info.render.calls, triangles: gl.info.render.triangles, ...gl.info.memory, quality: useWorldStore.getState().quality };
      },
      setBall: (x: number, z: number) => {
        simulation.place(x, z);
        invalidate();
      },
    };
    (window as unknown as { __world?: typeof hook }).__world = hook;
    return () => {
      delete (window as unknown as { __world?: typeof hook }).__world;
    };
  }, [simulation, invalidate, pick, get]);
}

function DebugHook({ simulation, pick }: { simulation: Simulation; pick: () => TapPicker | null }) {
  useDebugHook(simulation, pick);
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

const MOTION_KEY = "fp:motion";
/** Scene build stages; the world is marked ready after the last one. */
const SCENE_STAGES = 5;

function readMotionSetting(): MotionSetting {
  try {
    const value = window.localStorage.getItem(MOTION_KEY);
    return value === "reduced" || value === "full" ? value : "system";
  } catch {
    return "system";
  }
}

/** Effective reduced motion: the HUD setting wins over the OS preference (SPEC §12). */
function useMotion(): boolean {
  const system = useReducedMotion();
  const setting = useWorldStore((state) => state.motionSetting);
  const setMotionSetting = useWorldStore((state) => state.setMotionSetting);
  const setReducedMotion = useWorldStore((state) => state.setReducedMotion);
  const effective = setting === "system" ? system : setting === "reduced";

  useEffect(() => setMotionSetting(readMotionSetting()), [setMotionSetting]);
  useEffect(() => {
    try {
      if (setting === "system") window.localStorage.removeItem(MOTION_KEY);
      else window.localStorage.setItem(MOTION_KEY, setting);
    } catch {
      // Not remembered when storage is blocked.
    }
  }, [setting]);
  useEffect(() => {
    setReducedMotion(effective);
    document.documentElement.classList.toggle("reduce-motion", effective);
  }, [effective, setReducedMotion]);
  return effective;
}

/** Debug builds only: `?quality=high|medium|low` forces a tier. */
function readDebugQuality(): Quality | null {
  if (!DEBUG) return null;
  const value = new URLSearchParams(window.location.search).get("quality");
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

/** Offered when even the lowest quality is too slow (SPEC §11.2). Never forces a switch. */
function SlowNotice() {
  const show = useWorldStore((state) => state.slowNotice);
  const dismiss = useWorldStore((state) => state.dismissSlowNotice);
  if (!show) return null;
  const switchToClassic = () => {
    writeViewPreference("classic");
    dismiss();
    useWorldStore.getState().setMode("classic");
  };
  return (
    <div role="status" data-ui className="slow-notice">
      <p>The 3D stadium is running slowly on this device.</p>
      <div className="flex gap-2">
        <button type="button" onClick={switchToClassic} className={`${buttonStyles.primary} min-h-10 px-3 py-2 text-xs`}>
          Switch to Classic view
        </button>
        <button type="button" onClick={dismiss} className={`${buttonStyles.secondary} min-h-10 px-3 py-2 text-xs`}>
          Keep 3D
        </button>
      </div>
    </div>
  );
}

export default function World() {
  const setQuality = useWorldStore((state) => state.setQuality);
  useEffect(() => {
    const forced = readDebugQuality();
    if (forced) setQuality(forced);
  }, [setQuality]);
  const quality = useWorldStore((state) => state.quality);
  const settings = QUALITY[quality];
  // The renderer's shadow setting is fixed at creation; lower tiers just stop the light casting.
  const [canvasShadows] = useState(() => QUALITY[readDebugQuality() ?? quality].shadows);
  const reducedMotion = useMotion();
  const [debugCamera] = useState(readDebugCamera);
  // Deep link (SPEC §10.6): start at that landmark with its panel open.
  const [deepLink] = useState(() => landmarkFromHash(window.location.hash));
  const [simulation] = useState(() => {
    const landmark = deepLink ? LANDMARK_BY_ID.get(deepLink) : undefined;
    const spawn = landmark ? { x: landmark.position[0], z: landmark.position[1] } : { x: SPAWN[0], z: SPAWN[1] };
    return createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn });
  });
  const [input] = useState(createInputController);
  useEffect(() => () => input.dispose(), [input]);

  const surface = useRef<HTMLDivElement>(null);
  const ball = useRef<Mesh>(null);
  const card = useRef<HTMLDivElement>(null);
  const picker = useRef<TapPicker | null>(null);
  const expandedId = useWorldStore((state) => state.expandedId);
  const openPanel = useWorldStore((state) => state.openPanel);

  useEffect(() => input.setGameSurface(surface.current), [input]);
  useEffect(() => input.setPanelOpen(expandedId !== null), [input, expandedId]);
  useEffect(() => {
    if (deepLink) openPanel(deepLink);
  }, [deepLink, openPanel]);
  usePanelHistory();

  // Enter / Space on an active landmark opens its details (routing table, SPEC §7.1).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const { activeLandmarkId, expandedId: open } = useWorldStore.getState();
      if (!activeLandmarkId) return;
      if (!gameOwnsKeyboard({ active: document.activeElement, gameSurface: surface.current, panelOpen: open !== null })) return;
      event.preventDefault();
      openPanel(activeLandmarkId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPanel]);

  const registerPicker = useCallback((next: TapPicker | null) => {
    picker.current = next;
  }, []);
  const getPicker = useCallback(() => picker.current, []);

  // Tapping or clicking a landmark structure opens its details.
  const onTap = useCallback(
    (clientX: number, clientY: number) => {
      const id = picker.current?.(clientX, clientY);
      if (id) openPanel(id);
    },
    [openPanel],
  );

  // Build the scene in stages, one per task, so no single long task blocks the page
  // (SPEC §16). Canvas textures draw text, so the first stage waits for page fonts.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadCanvasFonts().then(() => !cancelled && startTransition(() => setStage(1)));
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (stage === 0 || stage >= SCENE_STAGES) return;
    const timer = window.setTimeout(() => startTransition(() => setStage((s) => s + 1)), 0);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <div className="relative h-full w-full">
      <Hud simulation={simulation} gameSurface={surface} />
      <div
        ref={surface}
        tabIndex={0}
        role="application"
        aria-label="3D stadium. Move the ball with W A S D, the arrow keys or by dragging. Press Enter near a landmark for details."
        className="game-surface relative h-full w-full touch-none select-none outline-none"
      >
        <Canvas
          aria-hidden="true"
          frameloop="demand"
          dpr={settings.dpr}
          shadows={canvasShadows ? { type: PCFShadowMap } : false}
          gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
          camera={{ position: [0, CAMERA.HEIGHT, CAMERA.DISTANCE], fov: CAMERA.FOV, near: 0.5, far: 400 }}
        >
          <ContextLossGuard />
          <Lighting shadows={settings.shadows} shadowMapSize={settings.shadowMapSize} />
          {debugCamera && <DebugCamera values={debugCamera} />}
          <DebugHook simulation={simulation} pick={getPicker} />
          <TapBridge register={registerPicker} />
          <WorldController
            simulation={simulation}
            input={input}
            ball={ball}
            reducedMotion={reducedMotion}
            freeCamera={debugCamera !== null}
          />
          <PreviewTracker card={card} simulation={simulation} />
          {stage >= 1 && (
            <>
              <Pitch pixelsPerUnit={settings.pitchPixelsPerUnit} />
              <Ball ref={ball} />
              {!settings.shadows && <BlobShadow ball={ball} />}
            </>
          )}
          {stage >= 2 && <Goals />}
          {stage >= 3 && <Stadium crowdDensity={settings.crowdDensity} />}
          {stage >= 4 && <Structures />}
          {stage >= 5 && (
            <>
              <GroundMarkers />
              <ReadySignal />
            </>
          )}
        </Canvas>
        <Joystick surface={surface} input={input} onTap={onTap} />
        <PreviewCard card={card} />
        <Onboarding input={input} />
        <SlowNotice />
        <DiscoveryAnnouncer />
      </div>
      <ExpandedPanel returnFocus={surface} />
    </div>
  );
}
