"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { startTransition, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { PCFShadowMap, type Mesh } from "three";
import { CAMERA } from "@/core/config";
import { createSimulation, type Simulation } from "@/core/simulation";
import { gameOwnsKeyboard } from "@/core/input";
import { useWorldStore, type MotionSetting, type Quality } from "@/state/store";
import { buttonStyles } from "@/ui/primitives";
import { Ball } from "./Ball";
import { BlobShadow } from "./BlobShadow";
import { createInputController } from "./input";
import { Joystick } from "./Joystick";
import { BALL } from "./layout";
import { SPAWN } from "./landmarks";
import { JourneyCamera } from "./journey/JourneyCamera";
import { JourneyLayer } from "./journey/JourneyLayer";
import { CenterPulse } from "./journey/CenterPulse";
import { PlaybookProjector } from "./journey/Playbook";
import { ExpandedPanel } from "./ExpandedPanel";
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
import { TunnelInterior } from "./TunnelInterior";
import { TrophyRoom } from "./TrophyRoom";
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
function useDebugHook(simulation: Simulation, pick: () => TapPicker | null, ball: RefObject<Mesh | null>) {
  const invalidate = useThree((state) => state.invalidate);
  const get = useThree((state) => state.get);
  useEffect(() => {
    if (!DEBUG) return;
    const hook = {
      getState: () => {
        const { activeLandmarkId, expandedId, autopilot, reducedMotion, experience, journeyStation, scoreboard } = useWorldStore.getState();
        const camera = get().camera.position;
        return {
          ball: { ...simulation.ball },
          activeLandmarkId,
          expandedId,
          autopilot,
          reducedMotion,
          experience,
          journeyStation,
          scoreboard,
          camera: { x: camera.x, y: camera.y, z: camera.z },
          /** The ball as rendered (journey or free play). */
          ballMesh: ball.current ? { x: ball.current.position.x, z: ball.current.position.z } : null,
          landmarkStates: useWorldStore.getState().landmarkStates,
          stadiumMood: useWorldStore.getState().stadiumMood,
        };
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
      setExperience: (experience: "journey" | "freeplay") => useWorldStore.getState().setExperience(experience),
    };
    (window as unknown as { __world?: typeof hook }).__world = hook;
    return () => {
      delete (window as unknown as { __world?: typeof hook }).__world;
    };
  }, [simulation, invalidate, pick, get, ball]);
}

function DebugHook({
  simulation,
  pick,
  ball,
}: {
  simulation: Simulation;
  pick: () => TapPicker | null;
  ball: RefObject<Mesh | null>;
}) {
  useDebugHook(simulation, pick, ball);
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
  const [simulation] = useState(() =>
    createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: { x: SPAWN[0], z: SPAWN[1] } }),
  );
  const experience = useWorldStore((state) => state.experience);
  const freeplay = experience === "freeplay";
  // The journey resumes from the live camera after free play, not from the establishing shot.
  const journeyResume = useWorldStore((state) => state.journeyResume);
  // Opening shot only: the stadium lights come up as the journey starts (spec transition 01).
  const [introRamp] = useState(() => !journeyResume && !reducedMotion);
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
  usePanelHistory();

  // Switching experience hands the ball over where it is, and resets the
  // journey-only stadium state (scoreboard text, highlights).
  useEffect(() => {
    const store = useWorldStore.getState();
    if (freeplay) {
      const mesh = ball.current;
      if (mesh) simulation.place(mesh.position.x, mesh.position.z);
      store.setScoreboard(null);
      store.setDiscovery(null, {});
      // The journey's scroller just unmounted: give the keyboard to the stadium, so
      // the next Tab doesn't fall into the hidden classic page.
      surface.current?.focus({ preventScroll: true });
    }
  }, [freeplay, simulation]);

  // Enter / Space on an active landmark opens its details (routing table, SPEC §7.1). Free play only.
  useEffect(() => {
    if (!freeplay) return;
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
  }, [openPanel, freeplay]);

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
      {freeplay && <Hud simulation={simulation} gameSurface={surface} />}
      <div
        ref={surface}
        tabIndex={freeplay ? 0 : -1}
        role={freeplay ? "application" : undefined}
        aria-label={
          freeplay ? "3D stadium. Move the ball with W A S D, the arrow keys or by dragging. Press Enter near a landmark for details." : undefined
        }
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
          <Lighting shadows={settings.shadows} shadowMapSize={settings.shadowMapSize} introRamp={introRamp} />
          {debugCamera && <DebugCamera values={debugCamera} />}
          <DebugHook simulation={simulation} pick={getPicker} ball={ball} />
          <TapBridge register={registerPicker} />
          {freeplay ? (
            <>
              <WorldController
                simulation={simulation}
                input={input}
                ball={ball}
                reducedMotion={reducedMotion}
                freeCamera={debugCamera !== null}
              />
              <PreviewTracker card={card} simulation={simulation} />
            </>
          ) : (
            <>
              {!debugCamera && <JourneyCamera ball={ball} resume={journeyResume} />}
              <CenterPulse />
              <PlaybookProjector />
            </>
          )}
          {stage >= 1 && (
            <>
              <Pitch pixelsPerUnit={settings.pitchPixelsPerUnit} />
              <Ball ref={ball} />
              {!settings.shadows && <BlobShadow ball={ball} />}
            </>
          )}
          {stage >= 2 && <Goals />}
          {stage >= 3 && <Stadium crowdDensity={settings.crowdDensity} />}
          {stage >= 4 && (
            <>
              <Structures />
              <TunnelInterior />
              <TrophyRoom />
            </>
          )}
          {stage >= 5 && (
            <>
              {freeplay && <GroundMarkers />}
              <ReadySignal />
            </>
          )}
        </Canvas>
        {freeplay ? (
          <>
            <Joystick surface={surface} input={input} onTap={onTap} />
            <PreviewCard card={card} />
            <Onboarding input={input} />
            <DiscoveryAnnouncer />
          </>
        ) : (
          <JourneyLayer picker={picker} />
        )}
        <SlowNotice />
      </div>
      <ExpandedPanel returnFocus={surface} />
    </div>
  );
}
