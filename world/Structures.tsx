"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InstancedMesh, Object3D, type MeshBasicMaterial, type Texture } from "three";
import { lerp } from "@/core/math";
import { useEmphasis } from "./emphasis";
import { contact, experience, getProject, profile } from "@/content";
import type { Project } from "@/content/types";
import { BOARD, GOAL, PITCH } from "./layout";
import { LANDMARKS, yawTowardsCamera, type LandmarkDef } from "./landmarks";
import { createCanvas, fitText, fonts, toTexture } from "./textures/canvas";
import { createBoardTexture, createScreenTexture } from "./textures/screens";

const FRAME = "#1b2023";
const BOARD_TILT = -0.12;
/** Screen brightness when the ball is far away; full brightness when active. */
const SCREEN_IDLE = 0.62;

/** Creates a GPU resource once per mount and disposes it on unmount. */
function useDisposable<T extends { dispose: () => void }>(factory: () => T): T {
  const [value] = useState(factory);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/**
 * Unlit LED face so boards and screens read clearly at night. With an
 * `emphasisId` it brightens as the ball approaches that landmark.
 */
function ScreenFace({
  texture,
  width,
  height,
  z = 0.01,
  emphasisId,
  back = false,
}: {
  texture: Texture;
  width: number;
  height: number;
  z?: number;
  emphasisId?: string;
  /** Also show the face from behind (double-sided signage). */
  back?: boolean;
}) {
  const material = useRef<MeshBasicMaterial>(null);
  useEmphasis(emphasisId ?? "", (value) => {
    if (!emphasisId || !material.current) return;
    const level = lerp(SCREEN_IDLE, 1, value);
    material.current.color.setRGB(level, level, level);
  });
  const initial = emphasisId ? SCREEN_IDLE : 1;
  return (
    <>
      <mesh position={[0, 0, z]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={material} map={texture} toneMapped={false} color={[initial, initial, initial]} />
      </mesh>
      {back && (
        <mesh position={[0, 0, -z]} rotation-y={Math.PI}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} toneMapped={false} color={[0.8, 0.8, 0.8]} />
        </mesh>
      )}
    </>
  );
}

/** Accent light strip that fades in with emphasis (no real light added). */
function GlowStrip({ id, size, position, color = "#f5b544" }: { id: string; size: [number, number, number]; position: [number, number, number]; color?: string }) {
  const material = useRef<MeshBasicMaterial>(null);
  useEmphasis(id, (value) => {
    if (material.current) material.current.opacity = value;
  });
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial ref={material} color={color} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function ProjectBoard({ landmark, project }: { landmark: LandmarkDef; project: Project }) {
  const texture = useDisposable(() => createBoardTexture(project));
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation} userData={{ landmarkId: landmark.id }}>
      <group position={[0, BOARD.height / 2 + 0.05, 0]} rotation-x={BOARD_TILT}>
        <mesh castShadow>
          <boxGeometry args={[BOARD.width, BOARD.height, 0.22]} />
          <meshStandardMaterial color={FRAME} roughness={0.6} />
        </mesh>
        <ScreenFace
          texture={texture}
          width={BOARD.width - 0.08}
          height={BOARD.height - 0.08}
          z={0.115}
          emphasisId={landmark.id}
        />
        <GlowStrip id={landmark.id} size={[BOARD.width, 0.06, 0.24]} position={[0, BOARD.height / 2 + 0.03, 0]} color={project.accent} />
      </group>
    </group>
  );
}

/** Generic sponsor-style texture for the boards that are not landmarks. */
function createFillerTexture() {
  const W = 1024;
  const H = 128;
  const { canvas, ctx } = createCanvas(W, H);
  ctx.fillStyle = "#0e1312";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const text = `${profile.name.toUpperCase()}  ·  ${profile.headline.toUpperCase()}`;
  fitText(ctx, text, W - 80, 64, (size) => `700 ${size}px ${fonts.display()}`);
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 3);
  ctx.fillStyle = "#1f7a3e";
  ctx.fillRect(0, H - 6, W, 6);
  return toTexture(canvas, 4);
}

/**
 * Remaining perimeter boards (south touchline, both ends) so the bowl reads as
 * a stadium. Gaps leave room for the goals, dugout, tunnel and terminal.
 */
function FillerBoards() {
  const texture = useDisposable(createFillerTexture);
  const placements = useMemo(() => {
    const list: { x: number; z: number; ry: number }[] = [];
    const southZ = PITCH.halfWidth + BOARD.offset;
    for (const x of [-25.5, -15.3, -5.1, 5.1, 15.3, 25.5]) list.push({ x, z: southZ, ry: Math.PI });
    const endX = PITCH.halfLength + GOAL.depth + 1.6;
    for (const side of [-1, 1]) {
      // East end leaves room for the tunnel (z ≈ -10); west for the contact terminal (z ≈ 9).
      for (const z of side === 1 ? [17, 0] : [-17, 0, 17]) {
        list.push({ x: side * endX, z, ry: side === 1 ? -Math.PI / 2 : Math.PI / 2 });
      }
    }
    return list;
  }, []);
  const bodies = useRef<InstancedMesh>(null);
  const faces = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(p.x, BOARD.height / 2 + 0.05, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.rotateX(BOARD_TILT);
      dummy.scale.set(BOARD.width, BOARD.height, 0.22);
      dummy.updateMatrix();
      bodies.current?.setMatrixAt(i, dummy.matrix);
      dummy.translateZ(0.116);
      dummy.scale.set(BOARD.width - 0.08, BOARD.height - 0.08, 1);
      dummy.updateMatrix();
      faces.current?.setMatrixAt(i, dummy.matrix);
    });
    for (const mesh of [bodies.current, faces.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [placements]);

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, placements.length]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={faces} args={[undefined, undefined, placements.length]}>
        <planeGeometry />
        <meshBasicMaterial map={texture} toneMapped={false} color="#9aa6a0" />
      </instancedMesh>
    </>
  );
}

function Scoreboard({ landmark }: { landmark: LandmarkDef }) {
  const texture = useDisposable(
    () =>
      createScreenTexture({
        width: 2048,
        height: 720,
        kicker: profile.location,
        title: profile.name,
        lines: [profile.headline, profile.strengths.slice(0, 3).join("  ·  ")],
      }),
  );
  const W = 15;
  const H = W * (720 / 2048);
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation} userData={{ landmarkId: landmark.id }}>
      <mesh>
        <boxGeometry args={[W + 0.6, H + 0.6, 0.6]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <ScreenFace texture={texture} width={W} height={H} z={0.31} emphasisId={landmark.id} />
      <GlowStrip id={landmark.id} size={[W + 0.6, 0.14, 0.62]} position={[0, -H / 2 - 0.37, 0]} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 1), -H / 2 - 1, -0.1]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
      ))}
    </group>
  );
}

function Dugout({ landmark }: { landmark: LandmarkDef }) {
  const [first, second] = experience;
  const texture = useDisposable(
    () =>
      createScreenTexture({
        width: 1024,
        height: 512,
        kicker: "Technical area",
        title: "Experience",
        lines: [
          `${first.company} · ${first.positions[0].title}`,
          `${second.company} · ${second.positions[0].title}`,
        ],
      }),
  );
  const shelterWidth = 4;
  const shelter = (x: number) => (
    <group key={x} position={[x, 0, 0]}>
      {/* Back, roof and side panels of a dugout shelter; local +z faces the pitch. */}
      <mesh position={[0, 1.1, -0.9]} castShadow>
        <boxGeometry args={[shelterWidth, 2.2, 0.15]} />
        <meshStandardMaterial color="#2c3438" />
      </mesh>
      <mesh position={[0, 2.25, -0.2]} rotation-x={0.12} castShadow>
        <boxGeometry args={[shelterWidth + 0.2, 0.12, 1.8]} />
        <meshStandardMaterial color="#9fb3bf" transparent opacity={0.55} roughness={0.2} />
      </mesh>
      <GlowStrip id={landmark.id} size={[shelterWidth + 0.2, 0.08, 0.08]} position={[0, 2.2, 0.72]} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * shelterWidth) / 2, 1.1, -0.2]}>
          <boxGeometry args={[0.1, 2.2, 1.6]} />
          <meshStandardMaterial color="#9fb3bf" transparent opacity={0.4} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, -0.5]}>
        <boxGeometry args={[shelterWidth - 0.4, 0.9, 0.6]} />
        <meshStandardMaterial color="#1f7a3e" roughness={0.8} />
      </mesh>
    </group>
  );
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation} userData={{ landmarkId: landmark.id }}>
      {shelter(-3.4)}
      {shelter(3.4)}
      {/* Screen raised above the shelters and the boards in front of them. */}
      <group position={[0, 3.1, -0.3]}>
        <mesh>
          <boxGeometry args={[3.5, 1.95, 0.2]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={3.3} height={1.65} z={0.11} emphasisId={landmark.id} />
      </group>
      <mesh position={[0, 1.1, -0.3]}>
        <boxGeometry args={[0.2, 2.2, 0.2]} />
        <meshStandardMaterial color={FRAME} />
      </mesh>
    </group>
  );
}

function Tunnel({ landmark }: { landmark: LandmarkDef }) {
  const texture = useDisposable(
    () =>
      createScreenTexture({
        width: 1024,
        height: 400,
        kicker: "Players' tunnel",
        title: "Résumé",
        lines: ["Open or download the PDF"],
      }),
  );
  const width = 4.2;
  const height = 3.2;
  const length = 4;
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation} userData={{ landmarkId: landmark.id }}>
      {/* Canopy: a half-cylinder shell extending onto the pitch side. */}
      <mesh position={[0, height - width / 2, length / 2]} rotation-x={-Math.PI / 2} castShadow>
        <cylinderGeometry args={[width / 2, width / 2, length, 24, 1, true, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#2c3438" side={2} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2), (height - width / 2) / 2, length / 2]}>
          <boxGeometry args={[0.12, height - width / 2, length]} />
          <meshStandardMaterial color="#2c3438" />
        </mesh>
      ))}
      {/* Dark mouth into the stand. */}
      <mesh position={[0, height / 2, -0.05]}>
        <boxGeometry args={[width + 0.8, height + 0.6, 0.3]} />
        <meshStandardMaterial color="#05080a" roughness={1} />
      </mesh>
      <GlowStrip id={landmark.id} size={[width + 0.8, 0.12, 0.08]} position={[0, height + 0.36, 0.14]} />
      {/* Sign turned towards the follow camera so it reads from the pitch. */}
      <group position={[0, height + 1.25, 0.3]} rotation-y={yawTowardsCamera(landmark.structure, landmark.position) - landmark.rotation}>
        <mesh>
          <boxGeometry args={[4.8, 2, 0.2]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={4.6} height={1.8} z={0.11} emphasisId={landmark.id} />
      </group>
    </group>
  );
}

/** The kiosk turns to face the follow camera instead of the pitch centre. */
function ContactTerminal({ landmark }: { landmark: LandmarkDef }) {
  const texture = useDisposable(
    () =>
      createScreenTexture({
        width: 1024,
        height: 640,
        kicker: "Goal-side terminal",
        title: "Contact",
        lines: [contact.email, "LinkedIn · GitHub"],
      }),
  );
  return (
    <group
      position={landmark.structure as [number, number, number]}
      rotation-y={yawTowardsCamera(landmark.structure, landmark.position)}
      userData={{ landmarkId: landmark.id }}
    >
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.5]} />
        <meshStandardMaterial color={FRAME} />
      </mesh>
      <group position={[0, 2, 0.1]} rotation-x={-0.15}>
        <mesh castShadow>
          <boxGeometry args={[2.9, 1.9, 0.16]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={2.7} height={1.69} z={0.09} emphasisId={landmark.id} />
        <GlowStrip id={landmark.id} size={[2.9, 0.07, 0.17]} position={[0, -0.99, 0]} />
      </group>
    </group>
  );
}

export function Structures() {
  return (
    <>
      {LANDMARKS.map((landmark) => {
        switch (landmark.kind) {
          case "board": {
            const project = getProject(landmark.contentId);
            return project ? <ProjectBoard key={landmark.id} landmark={landmark} project={project} /> : null;
          }
          case "scoreboard":
            return <Scoreboard key={landmark.id} landmark={landmark} />;
          case "dugout":
            return <Dugout key={landmark.id} landmark={landmark} />;
          case "tunnel":
            return <Tunnel key={landmark.id} landmark={landmark} />;
          case "terminal":
            return <ContactTerminal key={landmark.id} landmark={landmark} />;
        }
      })}
      <FillerBoards />
    </>
  );
}
