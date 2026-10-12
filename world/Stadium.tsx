"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  Matrix4,
  Object3D,
} from "three";
import { GROUND, STAND, TUNNEL } from "./layout";
import { seededRandom } from "./random";
import { createCanvas, toTexture } from "./textures/canvas";

/** An opening through the lower tiers (the players' tunnel). Stand-local x range, up to `top`. */
interface StandGap {
  center: number;
  halfWidth: number;
  top: number;
}

interface StandDef {
  /** Front-centre of the stand on the ground. */
  origin: [number, number];
  /** Y rotation so local +z faces the pitch. */
  rotation: number;
  length: number;
  gap?: StandGap;
}

const STANDS: StandDef[] = [
  { origin: [0, -(GROUND.halfZ + STAND.gap)], rotation: 0, length: GROUND.halfX * 2 },
  { origin: [0, GROUND.halfZ + STAND.gap], rotation: Math.PI, length: GROUND.halfX * 2 },
  {
    origin: [GROUND.halfX + STAND.gap, 0],
    rotation: -Math.PI / 2,
    length: GROUND.halfZ * 2,
    // East stand: local x runs along world z, so the tunnel's centre line is local x = TUNNEL.z.
    gap: { center: TUNNEL.z, halfWidth: TUNNEL.width / 2, top: TUNNEL.height + 0.2 },
  },
  { origin: [-(GROUND.halfX + STAND.gap), 0], rotation: Math.PI / 2, length: GROUND.halfZ * 2 },
];

const STAND_DEPTH = STAND.rows * STAND.rowDepth;
const STAND_TOP = STAND.baseHeight + (STAND.rows - 1) * STAND.rowRise;
const ROOF_HEIGHT = STAND_TOP + 3.2;

// Muted crowd palette with a few home-colour (green) and accent (amber) shirts.
const CROWD_COLOURS: [string, number][] = [
  ["#25292d", 0.24],
  ["#363b40", 0.2],
  ["#565c61", 0.12],
  ["#d6d9d6", 0.12],
  ["#1f7a3e", 0.14],
  ["#2b5d8a", 0.06],
  ["#f5b544", 0.06],
  ["#8a2f35", 0.06],
];

function pickColour(r: number): string {
  let acc = 0;
  for (const [colour, weight] of CROWD_COLOURS) {
    acc += weight;
    if (r <= acc) return colour;
  }
  return CROWD_COLOURS[0][0];
}

/** Composes stand-local (x, y, z) into a world matrix. */
function standMatrix(stand: StandDef, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const dummy = new Object3D();
  dummy.position.set(x, y, z);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  const toWorld = new Matrix4()
    .makeRotationY(stand.rotation)
    .setPosition(stand.origin[0], 0, stand.origin[1]);
  return toWorld.multiply(dummy.matrix);
}

/**
 * Adds a stand-local box spanning x ∈ [xMin, xMax], y ∈ [yMin, yMax], split
 * around the stand's gap (if any) so the tunnel passes through: the parts
 * beside the opening, plus the part above it.
 */
function addBox(list: Matrix4[], stand: StandDef, xMin: number, xMax: number, yMin: number, yMax: number, z: number, depth: number) {
  const push = (a: number, b: number, y0: number, y1: number) => {
    if (b - a > 1e-3 && y1 - y0 > 1e-3) list.push(standMatrix(stand, (a + b) / 2, (y0 + y1) / 2, z, b - a, y1 - y0, depth));
  };
  const gap = stand.gap;
  const g0 = gap ? gap.center - gap.halfWidth : 0;
  const g1 = gap ? gap.center + gap.halfWidth : 0;
  if (!gap || yMin >= gap.top || xMax <= g0 || xMin >= g1) {
    push(xMin, xMax, yMin, yMax);
    return;
  }
  push(xMin, g0, yMin, yMax);
  push(g1, xMax, yMin, yMax);
  push(Math.max(xMin, g0), Math.min(xMax, g1), gap.top, yMax);
}

/** Concrete tiers, back walls and roofs: one instanced unit box. */
function Structure() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = useMemo(() => {
    const list: Matrix4[] = [];
    for (const stand of STANDS) {
      const half = stand.length / 2;
      for (let r = 0; r < STAND.rows; r++) {
        const h = STAND.baseHeight + r * STAND.rowRise;
        addBox(list, stand, -half, half, 0, h, -(r + 0.5) * STAND.rowDepth, STAND.rowDepth);
      }
      // Back wall.
      addBox(list, stand, -half, half, 0, ROOF_HEIGHT, -STAND_DEPTH - 0.3, 0.6);
      // Roof over the back two-thirds of the stand.
      list.push(standMatrix(stand, 0, ROOF_HEIGHT, -STAND_DEPTH * 0.62, stand.length, 0.3, STAND_DEPTH * 0.8));
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} receiveShadow castShadow>
      <boxGeometry />
      <meshStandardMaterial color="#20262a" roughness={0.9} />
    </instancedMesh>
  );
}

/** Light strips along each roof edge: cheap emissive geometry, not real lights. */
function RoofLights() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = useMemo(
    () =>
      STANDS.map((stand) =>
        standMatrix(stand, 0, ROOF_HEIGHT - 0.22, -STAND_DEPTH * 0.62 + STAND_DEPTH * 0.4, stand.length * 0.94, 0.14, 0.3),
      ),
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]}>
      <boxGeometry />
      <meshBasicMaterial color="#fff6e0" toneMapped={false} />
    </instancedMesh>
  );
}

/** Seat rows: one thin coloured strip per step. */
function Seats() {
  const ref = useRef<InstancedMesh>(null);
  const matrices = useMemo(() => {
    const list: Matrix4[] = [];
    for (const stand of STANDS) {
      for (let r = 0; r < STAND.rows; r++) {
        const stepTop = STAND.baseHeight + r * STAND.rowRise;
        const half = stand.length / 2 - 0.2;
        addBox(list, stand, -half, half, stepTop, stepTop + 0.4, -(r + 0.5) * STAND.rowDepth - 0.18, 0.45);
      }
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color="#173d26" roughness={0.8} />
    </instancedMesh>
  );
}

/** Spectators as low-poly capsules (head-and-shoulders silhouettes), one draw call. */
function Crowd({ density }: { density: number }) {
  const ref = useRef<InstancedMesh>(null);
  const { matrices, colours } = useMemo(() => {
    const random = seededRandom(19);
    const matrices: Matrix4[] = [];
    const colours: Color[] = [];
    for (const stand of STANDS) {
      const seats = Math.floor(stand.length / STAND.seatSpacing);
      for (let r = 0; r < STAND.rows; r++) {
        const stepTop = STAND.baseHeight + r * STAND.rowRise;
        for (let s = 0; s < seats; s++) {
          if (random() > density) continue;
          const x = -stand.length / 2 + (s + 0.5) * STAND.seatSpacing + (random() - 0.5) * 0.12;
          const scale = 0.9 + random() * 0.25;
          // Nobody sits inside the tunnel opening.
          const gap = stand.gap;
          if (gap && stepTop < gap.top && Math.abs(x - gap.center) < gap.halfWidth + 0.3) continue;
          matrices.push(
            standMatrix(stand, x, stepTop + 0.62 * scale, -(r + 0.5) * STAND.rowDepth - 0.05, scale, scale, scale),
          );
          colours.push(new Color(pickColour(random())));
        }
      }
    }
    return { matrices, colours };
  }, [density]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, colours[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, colours]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} key={matrices.length}>
      <capsuleGeometry args={[0.19, 0.42, 2, 6]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
}

function createGlowTexture() {
  const size = 128;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 248, 228, 1)");
  gradient.addColorStop(0.18, "rgba(255, 240, 205, 0.55)");
  gradient.addColorStop(1, "rgba(255, 240, 205, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas, 1);
}

const TOWER_HEIGHT = 22;

/** Corner floodlight towers with an emissive head and a soft additive glow. */
function Floodlights() {
  const glow = useMemo(() => createGlowTexture(), []);
  useLayoutEffect(() => () => glow.dispose(), [glow]);
  const corners: [number, number][] = [
    [GROUND.halfX + 7, GROUND.halfZ + 7],
    [-(GROUND.halfX + 7), GROUND.halfZ + 7],
    [GROUND.halfX + 7, -(GROUND.halfZ + 7)],
    [-(GROUND.halfX + 7), -(GROUND.halfZ + 7)],
  ];
  return (
    <>
      {corners.map(([x, z]) => {
        const facing = Math.atan2(-x, -z);
        return (
          <group key={`${x},${z}`} position={[x, 0, z]} rotation-y={facing}>
            <mesh position={[0, TOWER_HEIGHT / 2, 0]}>
              <cylinderGeometry args={[0.25, 0.45, TOWER_HEIGHT, 8]} />
              <meshStandardMaterial color="#2a3034" roughness={0.7} />
            </mesh>
            <group position={[0, TOWER_HEIGHT, 0.4]} rotation-x={0.45}>
              <mesh>
                <boxGeometry args={[4.4, 2.6, 0.35]} />
                <meshStandardMaterial color="#1a1f22" />
              </mesh>
              <mesh position={[0, 0, 0.19]}>
                <planeGeometry args={[4, 2.2]} />
                <meshBasicMaterial color="#fff8e6" toneMapped={false} />
              </mesh>
              <sprite position={[0, 0, 0.6]} scale={[13, 13, 1]}>
                <spriteMaterial map={glow} blending={AdditiveBlending} depthWrite={false} transparent opacity={0.55} />
              </sprite>
            </group>
          </group>
        );
      })}
    </>
  );
}

export function Stadium({ crowdDensity }: { crowdDensity: number }) {
  return (
    <>
      <Structure />
      <RoofLights />
      <Seats />
      <Crowd density={crowdDensity} />
      <Floodlights />
    </>
  );
}
