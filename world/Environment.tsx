"use client";

import { useMemo } from "react";
import { BackSide, Color, ShaderMaterial } from "three";
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
export function Lighting({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const extent = Math.max(GROUND.halfX, GROUND.halfZ) + 2;
  return (
    <>
      <color attach="background" args={["#070a0d"]} />
      <fog attach="fog" args={["#0b1014", 70, 170]} />
      <SkyDome />
      <hemisphereLight args={["#b9cde0", "#0d2a17", 0.75]} />
      <ambientLight intensity={0.12} />
      <directionalLight
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
    </>
  );
}
