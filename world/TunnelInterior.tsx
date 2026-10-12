"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { RepeatWrapping, type Group, type MeshBasicMaterial, type Texture } from "three";
import { experience } from "@/content";
import { damp } from "@/core/math";
import { formatRange } from "@/lib/format";
import { useWorldStore } from "@/state/store";
import { STATIONS, tunnelStop } from "./journey/stations";
import { GROUND, STAND, TUNNEL } from "./layout";
import { createCanvas, toTexture } from "./textures/canvas";
import { createScreenTexture } from "./textures/screens";

/**
 * The players' tunnel (journey step 4). Surfaces are unlit, with lighting baked
 * into their textures: the moody interior costs no real lights and doesn't
 * depend on the stadium lighting outside.
 */

const LENGTH = TUNNEL.end - TUNNEL.start;
const W = TUNNEL.width;
const H = TUNNEL.height;
const LIGHT_SPACING = 2.4;

function repeat(texture: Texture, x: number, y: number) {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(x, y);
  return texture;
}

/** Concrete wall panels, darker at the floor, with an indigo LED strip low on the wall. */
function createWallTexture() {
  const { canvas, ctx } = createCanvas(512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#1b2335");
  g.addColorStop(0.55, "#141b2b");
  g.addColorStop(1, "#090c14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  // Light pools from the ceiling fixtures (one per tile, tile = LIGHT_SPACING long).
  const pool = ctx.createRadialGradient(256, 0, 0, 256, 0, 260);
  pool.addColorStop(0, "rgba(255, 236, 205, 0.18)");
  pool.addColorStop(1, "rgba(255, 236, 205, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, 512, 256);
  // Panel seams.
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, 3, 256);
  ctx.fillRect(0, 168, 512, 2);
  // LED strip.
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(0, 214, 512, 5);
  ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
  ctx.fillRect(0, 204, 512, 24);
  return repeat(toTexture(canvas, 8), LENGTH / LIGHT_SPACING, 1);
}

/** Rubber floor with a centre line and pools of light under each fixture (u runs along the corridor). */
function createFloorTexture() {
  const { canvas, ctx } = createCanvas(512, 256);
  ctx.fillStyle = "#0b1019";
  ctx.fillRect(0, 0, 512, 256);
  const pool = ctx.createRadialGradient(256, 128, 0, 256, 128, 230);
  pool.addColorStop(0, "rgba(255, 236, 205, 0.16)");
  pool.addColorStop(1, "rgba(255, 236, 205, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "rgba(129, 140, 248, 0.35)";
  ctx.fillRect(0, 124, 512, 8);
  return repeat(toTexture(canvas, 8), LENGTH / LIGHT_SPACING, 1);
}

function createCeilingTexture() {
  const { canvas, ctx } = createCanvas(64, 64);
  ctx.fillStyle = "#0d121d";
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(canvas, 1);
}

/** A company's sign on the corridor wall; brightens when its stop is active. */
function CompanySign({ index, texture }: { index: number; texture: Texture }) {
  const entry = experience[index];
  const material = useRef<MeshBasicMaterial>(null);
  const level = useRef(0.4);
  const invalidate = useThree((s) => s.invalidate);
  const active = useWorldStore((s) => STATIONS[s.journeyStation]?.id === `experience:${entry.id}`);
  const target = active ? 1 : 0.4;
  useEffect(() => invalidate(), [target, invalidate]);
  useFrame((_, delta) => {
    if (!material.current || Math.abs(level.current - target) < 0.002) return;
    level.current = damp(level.current, target, 5, Math.min(delta, 0.05));
    material.current.color.setScalar(level.current);
    invalidate();
  });
  const x = tunnelStop(index, experience.length) + 0.6;
  return (
    <group position={[x, 1.75, TUNNEL.z + W / 2 - 0.04]} rotation-y={Math.PI}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.7, 1.32]} />
        <meshBasicMaterial color="#05070c" />
      </mesh>
      <mesh>
        <planeGeometry args={[2.56, 1.2]} />
        <meshBasicMaterial ref={material} map={texture} toneMapped={false} color={[0.4, 0.4, 0.4]} />
      </mesh>
    </group>
  );
}

/** One door leaf: dark metal, warm light leaking at the centre seam and through a porthole. */
function createDoorTexture(seamOnRight: boolean) {
  const { canvas, ctx } = createCanvas(256, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#1a2131");
  g.addColorStop(1, "#0c1019");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  // Panel inset.
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 208, 464);
  // Warm leak along the seam.
  const seamX = seamOnRight ? 256 : 0;
  const leak = ctx.createLinearGradient(seamX, 0, seamOnRight ? 200 : 56, 0);
  leak.addColorStop(0, "rgba(255, 196, 120, 0.95)");
  leak.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = leak;
  ctx.fillRect(seamOnRight ? 200 : 0, 0, 56, 512);
  // Porthole.
  const px = seamOnRight ? 170 : 86;
  const glow = ctx.createRadialGradient(px, 150, 0, px, 150, 60);
  glow.addColorStop(0, "rgba(255, 214, 150, 1)");
  glow.addColorStop(0.55, "rgba(255, 196, 120, 0.9)");
  glow.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(px - 64, 86, 128, 128);
  ctx.strokeStyle = "#2a3245";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(px, 150, 36, 0, Math.PI * 2);
  ctx.stroke();
  return toTexture(canvas, 4);
}

/** Warm light spilling across the floor from the doors. */
function createSpillTexture() {
  const { canvas, ctx } = createCanvas(256, 256);
  const g = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
  g.addColorStop(0, "rgba(255, 196, 120, 0.55)");
  g.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas, 4);
}

/** Doors at the far end; they open into the trophy room (spec transition 06). */
function EndDoors() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const spill = useRef<MeshBasicMaterial>(null);
  const open = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const target = useWorldStore((s) => (STATIONS[s.journeyStation]?.chapter === "trophies" ? 1 : 0));
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const textures = useMemo(() => [createDoorTexture(true), createDoorTexture(false), createSpillTexture()], []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  useEffect(() => invalidate(), [target, invalidate]);
  useFrame((_, delta) => {
    if (Math.abs(open.current - target) < 0.001) return;
    open.current = reducedMotion ? target : damp(open.current, target, 3.2, Math.min(delta, 0.05));
    const slide = open.current * (W / 2);
    left.current?.position.setZ(-W / 4 - slide);
    right.current?.position.setZ(W / 4 + slide);
    // More light spills into the corridor as the doors open.
    if (spill.current) spill.current.opacity = 0.7 + open.current * 0.3;
    invalidate();
  });
  return (
    <group position={[TUNNEL.end, 0, TUNNEL.z]}>
      {/* The lit room beyond (the trophy room proper arrives in journey step 5). */}
      <mesh position={[0.6, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#ffcf8a" toneMapped={false} />
      </mesh>
      {/* Leaves face back down the corridor (-x). */}
      {[
        [left, -W / 4, textures[0]],
        [right, W / 4, textures[1]],
      ].map(([ref, z, texture], i) => (
        <group key={i} ref={ref as React.RefObject<Group>} position={[0, H / 2, z as number]}>
          <mesh position={[0.07, 0, 0]}>
            <boxGeometry args={[0.1, H, W / 2]} />
            <meshBasicMaterial color="#0b0f19" />
          </mesh>
          <mesh rotation-y={-Math.PI / 2}>
            <planeGeometry args={[W / 2, H]} />
            <meshBasicMaterial map={texture as Texture} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Warm strip over the frame and light pooling on the floor. */}
      <mesh position={[-0.05, H - 0.08, 0]}>
        <boxGeometry args={[0.06, 0.08, W]} />
        <meshBasicMaterial color="#ffd49a" toneMapped={false} />
      </mesh>
      <mesh position={[-1.6, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.2, W]} />
        <meshBasicMaterial ref={spill} map={textures[2]} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function TunnelInterior() {
  const wall = useMemo(() => createWallTexture(), []);
  const floor = useMemo(() => createFloorTexture(), []);
  const ceiling = useMemo(() => createCeilingTexture(), []);
  const signs = useMemo(
    () =>
      experience.map((entry) => {
        const position = entry.positions[0];
        const last = entry.positions[entry.positions.length - 1];
        return createScreenTexture({
          width: 1024,
          height: 480,
          kicker: formatRange({ start: last.start, end: position.end }),
          title: entry.company,
          lines: [position.title, entry.location],
        });
      }),
    [],
  );
  useEffect(
    () => () => {
      for (const t of [wall, floor, ceiling, ...signs]) t.dispose();
    },
    [wall, floor, ceiling, signs],
  );

  const cx = TUNNEL.start + LENGTH / 2;
  const zc = TUNNEL.z;
  const lights = Math.floor(LENGTH / LIGHT_SPACING);
  // Behind the east stand's back wall, the corridor runs through a low annex.
  const annexStart = GROUND.halfX + STAND.gap + STAND.rows * STAND.rowDepth + 0.6;
  const annexEnd = TUNNEL.end + 1;
  const annexWidth = W + 0.6;
  const annexHeight = H + 0.5;

  return (
    <group>
      {/* Floor, ceiling and walls face inwards (single-sided: invisible from outside). */}
      <mesh position={[cx, 0.02, zc]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[LENGTH, W]} />
        <meshBasicMaterial map={floor} />
      </mesh>
      <mesh position={[cx, H, zc]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[LENGTH, W]} />
        <meshBasicMaterial map={ceiling} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[cx, H / 2, zc + (side * W) / 2]} rotation-y={side === -1 ? 0 : Math.PI}>
          <planeGeometry args={[LENGTH, H]} />
          <meshBasicMaterial map={wall} />
        </mesh>
      ))}

      {/* Ceiling fixtures. */}
      {Array.from({ length: lights }, (_, i) => (
        <mesh key={i} position={[TUNNEL.start + LIGHT_SPACING * (i + 0.5), H - 0.04, zc]}>
          <boxGeometry args={[0.9, 0.05, 0.28]} />
          <meshBasicMaterial color="#fff1d6" toneMapped={false} />
        </mesh>
      ))}

      {signs.map((texture, i) => (
        <CompanySign key={experience[i].id} index={i} texture={texture} />
      ))}

      <EndDoors />

      {/* Annex shell behind the stand: outward-facing planes only, open towards the
          corridor, so it hides the corridor from outside without blocking the view inside. */}
      <group>
        <mesh position={[(annexStart + annexEnd) / 2, annexHeight, zc]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[annexEnd - annexStart, annexWidth]} />
          <meshStandardMaterial color="#1c2226" roughness={0.9} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[(annexStart + annexEnd) / 2, annexHeight / 2, zc + (side * annexWidth) / 2]}
            rotation-y={side === 1 ? 0 : Math.PI}
          >
            <planeGeometry args={[annexEnd - annexStart, annexHeight]} />
            <meshStandardMaterial color="#1c2226" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[annexEnd, annexHeight / 2, zc]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[annexWidth, annexHeight]} />
          <meshStandardMaterial color="#1c2226" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
