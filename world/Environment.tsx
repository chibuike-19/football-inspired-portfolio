"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Color, ShaderMaterial, type DirectionalLight, type Group, type Light } from "three";
import { damp } from "@/core/math";
import { useWorldStore } from "@/state/store";
import { GROUND } from "./layout";

/** Night sky dome: vertical gradient with a faint floodlight haze at the horizon. */
function SkyDome() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new Color("#05070b") },
          horizon: { value: new Color("#2a3a44") },
        },
        vertexShader: /* glsl */ `
          varying float vHeight;
          void main() {
            vHeight = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top;
          uniform vec3 horizon;
          varying float vHeight;
          void main() {
            // Floodlight haze sits low over the bowl.
            float t = smoothstep(0.02, 0.5, vHeight);
            gl_FragColor = vec4(mix(horizon, top, t), 1.0);
          }`,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[180, 32, 16]} />
    </mesh>
  );
}

/**
 * One shadow-casting key light from a floodlight corner, plus hemisphere and
 * cool fill (SPEC §6.2). The shadow frustum covers the ground only.
 */
const LIGHT_RAMP_SECONDS = 2.4;
const WARM = new Color("#ffcc94");

/**
 * Applies light levels. Lights are declared at full strength; the first call
 * records that (and the base colour) and every call scales from it:
 * `ramp` 0→1 brings the stadium up from 20% (opening shot), `mood` 0→1 dims
 * and warms it for full time. Mutates lights by design, so kept outside React.
 */
function applyLights(group: Group, ramp: number, mood: number) {
  const level = (0.2 + 0.8 * (1 - Math.pow(1 - Math.min(1, ramp), 3))) * (1 - 0.18 * mood);
  group.traverse((object) => {
    const light = object as Light;
    if (!light.isLight) return;
    light.userData.baseIntensity ??= light.intensity;
    light.userData.baseColor ??= light.color.clone();
    light.intensity = light.userData.baseIntensity * level;
    light.color.copy(light.userData.baseColor).lerp(WARM, 0.45 * mood);
  });
}

export function Lighting({
  shadows,
  shadowMapSize,
  introRamp = false,
}: {
  shadows: boolean;
  shadowMapSize: number;
  /** Journey opening (spec transition 01): stadium lights illuminate gradually. */
  introRamp?: boolean;
}) {
  const extent = Math.max(GROUND.halfX, GROUND.halfZ) + 2;
  const key = useRef<DirectionalLight>(null);
  const lights = useRef<Group>(null);
  const ramp = useRef(introRamp ? 0 : 1);
  const invalidate = useThree((state) => state.invalidate);
  // A new map size only takes effect once the old shadow map is released.
  useEffect(() => {
    const shadow = key.current?.shadow;
    if (!shadow) return;
    shadow.mapSize.set(shadowMapSize, shadowMapSize);
    shadow.map?.dispose();
    shadow.map = null;
  }, [shadowMapSize]);

  const mood = useRef(0);
  const closing = useWorldStore((state) => state.stadiumMood === "closing");
  useEffect(() => invalidate(), [closing, invalidate]);

  useFrame((_, delta) => {
    if (!lights.current) return;
    const dt = Math.min(delta, 0.05);
    const moodTarget = closing ? 1 : 0;
    if (ramp.current >= 1 && Math.abs(mood.current - moodTarget) < 0.002) return;
    // Hold the dim start until the stadium is on screen, then bring the lights up.
    const visible = useWorldStore.getState().status === "ready";
    if (visible && ramp.current < 1) ramp.current = Math.min(1, ramp.current + dt / LIGHT_RAMP_SECONDS);
    mood.current = useWorldStore.getState().reducedMotion ? moodTarget : damp(mood.current, moodTarget, 1.6, dt);
    if (Math.abs(mood.current - moodTarget) < 0.002) mood.current = moodTarget;
    applyLights(lights.current, ramp.current, mood.current);
    if (visible) invalidate();
  });

  return (
    <>
      <color attach="background" args={["#070a0d"]} />
      <fog attach="fog" args={["#0b1014", 70, 170]} />
      <SkyDome />
      <group ref={lights}>
        <hemisphereLight args={["#b9cde0", "#0d2a17", 0.75]} />
        <ambientLight intensity={0.12} />
        <directionalLight
          ref={key}
          position={[-28, 42, 22]}
          intensity={2.6}
          color="#fff3dc"
          castShadow={shadows}
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-left={-extent}
          shadow-camera-right={extent}
          shadow-camera-top={extent}
          shadow-camera-bottom={-extent}
          shadow-camera-near={10}
          shadow-camera-far={120}
        />
        <directionalLight position={[30, 28, -26]} intensity={0.7} color="#cfe0ff" />
      </group>
    </>
  );
}
