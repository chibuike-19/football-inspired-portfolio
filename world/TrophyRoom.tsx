"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  LatheGeometry,
  RepeatWrapping,
  Vector2,
  type MeshBasicMaterial,
  type MeshMatcapMaterial,
  type Texture,
} from "three";
import { trophies } from "@/content";
import { damp } from "@/core/math";
import { useWorldStore } from "@/state/store";
import { STATIONS, trophyDisplay } from "./journey/stations";
import { ROOM, TUNNEL } from "./layout";
import { createCanvas, fitText, fonts, toTexture, wrapText } from "./textures/canvas";

/**
 * Trophy cabinet (journey step 5). Like the tunnel, the room is unlit with
 * baked textures, and the trophies use a matcap: they look polished and lit
 * without adding real lights, and the room ignores the stadium lighting.
 */

const LENGTH = ROOM.end - ROOM.start;
const WIDTH = ROOM.halfWidth * 2;
const H = ROOM.height;
const CX = (ROOM.start + ROOM.end) / 2;
const Z = ROOM.z;

/** Warm walls, darker at the floor, with a soft wash of light every display spacing. */
function createWallTexture() {
  const { canvas, ctx } = createCanvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#1a1418");
  g.addColorStop(0.6, "#22191a");
  g.addColorStop(1, "#0d0a0b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const wash = ctx.createRadialGradient(256, 512, 0, 256, 512, 360);
  wash.addColorStop(0, "rgba(255, 190, 120, 0.22)");
  wash.addColorStop(1, "rgba(255, 190, 120, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 512, 512);
  // Thin brass rail.
  ctx.fillStyle = "rgba(214, 170, 96, 0.55)";
  ctx.fillRect(0, 300, 512, 3);
  const texture = toTexture(canvas, 8);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
}

function createFloorTexture() {
  const { canvas, ctx } = createCanvas(256, 256);
  ctx.fillStyle = "#0f0b0a";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255, 220, 170, 0.05)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);
  const texture = toTexture(canvas, 8);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(LENGTH / 1.5, WIDTH / 1.5);
  return texture;
}

/** Polished gold, baked into a matcap. */
function createGoldMatcap() {
  const { canvas, ctx } = createCanvas(256, 256);
  const g = ctx.createRadialGradient(96, 84, 6, 128, 128, 128);
  g.addColorStop(0, "#fff6d2");
  g.addColorStop(0.25, "#f0c45a");
  g.addColorStop(0.6, "#b07a1e");
  g.addColorStop(0.9, "#4a2e08");
  g.addColorStop(1, "#2a1a05");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas, 1);
}

/** Wall plaque: number, title and where it was earned. */
function createPlaqueTexture(index: number) {
  const trophy = trophies[index];
  const { canvas, ctx } = createCanvas(768, 360);
  ctx.fillStyle = "#120d0c";
  ctx.fillRect(0, 0, 768, 360);
  ctx.strokeStyle = "rgba(214, 170, 96, 0.7)";
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 740, 332);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#d6aa60";
  ctx.font = `400 34px ${fonts.display()}`;
  ctx.fillText(`TROPHY 0${index + 1}  ·  ${trophy.context.toUpperCase()}`, 48, 80);
  ctx.fillStyle = "#fff4e2";
  const size = fitText(ctx, trophy.title.toUpperCase(), 672, 76, (s) => `400 ${s}px ${fonts.display()}`);
  ctx.fillText(trophy.title.toUpperCase(), 48, 80 + size + 10);
  ctx.fillStyle = "rgba(255, 244, 226, 0.75)";
  ctx.font = `500 28px ${fonts.body()}`;
  const lines = trophy.items.flatMap((item) => wrapText(ctx, `★ ${item}`, 672, 1));
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 48, 80 + size + 64 + i * 40));
  return toTexture(canvas, 8);
}

/** A cup on a stem and base, as a lathe profile. */
function createCupGeometry() {
  const profile = [
    [0, 0],
    [0.34, 0],
    [0.34, 0.08],
    [0.16, 0.12],
    [0.06, 0.18],
    [0.05, 0.42],
    [0.09, 0.48],
    [0.3, 0.62],
    [0.38, 0.86],
    [0.36, 0.88],
    [0.3, 0.66],
    [0, 0.6],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(profile, 40);
}

function Display({ index, gold, plaque }: { index: number; gold: Texture; plaque: Texture }) {
  const trophy = trophies[index];
  const x = trophyDisplay(index);
  const wallZ = Z + ROOM.halfWidth - 0.03;
  const cup = useMemo(() => createCupGeometry(), []);
  useEffect(() => () => cup.dispose(), [cup]);

  const matcap = useRef<MeshMatcapMaterial>(null);
  const beam = useRef<MeshBasicMaterial>(null);
  const plaqueMaterial = useRef<MeshBasicMaterial>(null);
  const level = useRef(0.35);
  const invalidate = useThree((s) => s.invalidate);
  const active = useWorldStore((s) => STATIONS[s.journeyStation]?.id === `trophy:${trophy.id}`);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const target = active ? 1 : 0.35;
  useEffect(() => invalidate(), [target, invalidate]);
  useFrame((_, delta) => {
    if (Math.abs(level.current - target) < 0.002) return;
    level.current = reducedMotion ? target : damp(level.current, target, 4, Math.min(delta, 0.05));
    const l = level.current;
    matcap.current?.color.setScalar(0.45 + 0.55 * l);
    if (beam.current) beam.current.opacity = 0.03 + 0.17 * l;
    plaqueMaterial.current?.color.setScalar(0.45 + 0.55 * l);
    invalidate();
  });

  const displayZ = wallZ - 1.2;
  return (
    <group>
      {/* Plinth with a glowing top edge. */}
      <mesh position={[x, 0.5, displayZ]}>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshBasicMaterial color="#17110f" />
      </mesh>
      <mesh position={[x, 1.005, displayZ]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color="#3a2a1a" />
      </mesh>
      <mesh geometry={cup} position={[x, 1.01, displayZ]} scale={1.05}>
        <meshMatcapMaterial ref={matcap} matcap={gold} color={[0.45, 0.45, 0.45]} />
      </mesh>
      {/* Beam of light from the ceiling. */}
      <mesh position={[x, (H + 1) / 2, displayZ]}>
        <cylinderGeometry args={[0.18, 0.7, H - 1, 24, 1, true]} />
        <meshBasicMaterial
          ref={beam}
          color="#ffd9a0"
          transparent
          opacity={0.03}
          blending={AdditiveBlending}
          depthWrite={false}
          side={2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[x, H - 0.03, displayZ]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[0.2, 24]} />
        <meshBasicMaterial color="#fff1d6" toneMapped={false} />
      </mesh>
      {/* Plaque on the wall behind. */}
      <mesh position={[x, 2.55, wallZ]} rotation-y={Math.PI}>
        <planeGeometry args={[2.2, 1.03]} />
        <meshBasicMaterial ref={plaqueMaterial} map={plaque} color={[0.45, 0.45, 0.45]} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A wall split around an opening: pieces left and right of it, plus the lintel above. */
function WallWithOpening({
  x0,
  x1,
  o0,
  o1,
  openingHeight,
  z,
  facing,
  map,
  color,
}: {
  x0: number;
  x1: number;
  o0: number;
  o1: number;
  openingHeight: number;
  z: number;
  /** +1: faces +z; -1: faces -z. */
  facing: 1 | -1;
  map?: Texture;
  color?: string;
}) {
  const pieces: [number, number, number, number][] = [
    [x0, o0, 0, H],
    [o1, x1, 0, H],
    [o0, o1, openingHeight, H],
  ];
  return (
    <>
      {pieces.map(([a, b, y0, y1], i) => (
        <mesh key={i} position={[(a + b) / 2, (y0 + y1) / 2, z]} rotation-y={facing === 1 ? 0 : Math.PI}>
          <planeGeometry args={[b - a, y1 - y0]} />
          {map ? <meshBasicMaterial map={map} /> : <meshStandardMaterial color={color} roughness={0.9} />}
        </mesh>
      ))}
    </>
  );
}

export function TrophyRoom() {
  const textures = useMemo(() => {
    const wall = createWallTexture();
    const floor = createFloorTexture();
    const gold = createGoldMatcap();
    const plaques = trophies.map((_, i) => createPlaqueTexture(i));
    return { wall, floor, gold, plaques };
  }, []);
  useEffect(
    () => () => {
      const { wall, floor, gold, plaques } = textures;
      for (const t of [wall, floor, gold, ...plaques]) t.dispose();
    },
    [textures],
  );
  // Wall wash centred on each display along the long walls.
  const longWall = useMemo(() => {
    const t = textures.wall.clone();
    t.repeat.set(LENGTH / ROOM.displaySpacing, 1);
    t.offset.set((ROOM.start - (ROOM.firstDisplay - ROOM.displaySpacing / 2)) / ROOM.displaySpacing, 0);
    return t;
  }, [textures.wall]);
  const shortWall = useMemo(() => {
    const t = textures.wall.clone();
    t.repeat.set(WIDTH / ROOM.displaySpacing, 1);
    return t;
  }, [textures.wall]);
  useEffect(
    () => () => {
      longWall.dispose();
      shortWall.dispose();
    },
    [longWall, shortWall],
  );

  const tw = TUNNEL.width / 2;
  const north = Z - ROOM.halfWidth;
  const south = Z + ROOM.halfWidth;
  const exterior = "#1c2226";

  return (
    <group>
      {/* Interior: floor, ceiling, walls (all face inwards). */}
      <mesh position={[CX, 0.02, Z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[LENGTH, WIDTH]} />
        <meshBasicMaterial map={textures.floor} />
      </mesh>
      <mesh position={[CX, H, Z]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[LENGTH, WIDTH]} />
        <meshBasicMaterial color="#0b0809" />
      </mesh>
      <mesh position={[CX, H / 2, south]} rotation-y={Math.PI}>
        <planeGeometry args={[LENGTH, H]} />
        <meshBasicMaterial map={longWall} />
      </mesh>
      <WallWithOpening
        x0={ROOM.start}
        x1={ROOM.end}
        o0={ROOM.openingStart}
        o1={ROOM.openingEnd}
        openingHeight={ROOM.openingHeight}
        z={north}
        facing={1}
        map={longWall}
      />
      <mesh position={[ROOM.end, H / 2, Z]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[WIDTH, H]} />
        <meshBasicMaterial map={shortWall} />
      </mesh>
      {/* West wall with the doorway from the tunnel. */}
      <group rotation-y={Math.PI / 2} position={[ROOM.start, 0, Z]}>
        <WallWithOpening
          x0={-ROOM.halfWidth}
          x1={ROOM.halfWidth}
          o0={-tw}
          o1={tw}
          openingHeight={TUNNEL.height}
          z={0}
          facing={1}
          map={shortWall}
        />
      </group>

      {/* Opening frame: warm light from inside spills onto the threshold. */}
      <mesh position={[(ROOM.openingStart + ROOM.openingEnd) / 2, ROOM.openingHeight + 0.06, north + 0.02]}>
        <boxGeometry args={[ROOM.openingEnd - ROOM.openingStart, 0.08, 0.04]} />
        <meshBasicMaterial color="#ffd49a" toneMapped={false} />
      </mesh>

      {trophies.map((trophy, i) => (
        <Display key={trophy.id} index={i} gold={textures.gold} plaque={textures.plaques[i]} />
      ))}

      {/* Exterior shell (faces outwards): roof, long walls, end wall, west wall around the annex. */}
      <mesh position={[CX, H, Z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[LENGTH, WIDTH]} />
        <meshStandardMaterial color={exterior} roughness={0.9} />
      </mesh>
      <mesh position={[CX, H / 2, south]}>
        <planeGeometry args={[LENGTH, H]} />
        <meshStandardMaterial color={exterior} roughness={0.9} />
      </mesh>
      <WallWithOpening
        x0={ROOM.start}
        x1={ROOM.end}
        o0={ROOM.openingStart}
        o1={ROOM.openingEnd}
        openingHeight={ROOM.openingHeight}
        z={north}
        facing={-1}
        color={exterior}
      />
      <mesh position={[ROOM.end, H / 2, Z]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[WIDTH, H]} />
        <meshStandardMaterial color={exterior} roughness={0.9} />
      </mesh>
      <group rotation-y={-Math.PI / 2} position={[ROOM.start, 0, Z]}>
        <WallWithOpening x0={-ROOM.halfWidth} x1={ROOM.halfWidth} o0={-tw - 0.3} o1={tw + 0.3} openingHeight={TUNNEL.height + 0.5} z={0} facing={1} color={exterior} />
      </group>
    </group>
  );
}
