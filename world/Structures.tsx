"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InstancedMesh, Object3D, type Texture } from "three";
import { contact, experience, getProject, profile } from "@/content";
import type { Project } from "@/content/types";
import { BOARD, GOAL, PITCH } from "./layout";
import { LANDMARKS, type LandmarkDef } from "./landmarks";
import { createCanvas, fitText, fonts, toTexture } from "./textures/canvas";
import { createBoardTexture, createScreenTexture } from "./textures/screens";

const FRAME = "#1b2023";
const BOARD_TILT = -0.12;

/** Creates a GPU resource once per mount and disposes it on unmount. */
function useDisposable<T extends { dispose: () => void }>(factory: () => T): T {
  const [value] = useState(factory);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** Unlit LED face so boards and screens read clearly at night. */
function ScreenFace({ texture, width, height, z = 0.01 }: { texture: Texture; width: number; height: number; z?: number }) {
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function ProjectBoard({ landmark, project }: { landmark: LandmarkDef; project: Project }) {
  const texture = useDisposable(() => createBoardTexture(project));
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation}>
      <group position={[0, BOARD.height / 2 + 0.05, 0]} rotation-x={BOARD_TILT}>
        <mesh castShadow>
          <boxGeometry args={[BOARD.width, BOARD.height, 0.22]} />
          <meshStandardMaterial color={FRAME} roughness={0.6} />
        </mesh>
        <ScreenFace texture={texture} width={BOARD.width - 0.08} height={BOARD.height - 0.08} z={0.115} />
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
    const southZ = PITCH.halfWidth + BOARD.offset + 1.6; // behind the dugout line
    for (const x of [-27, -18, 18, 27]) list.push({ x, z: southZ, ry: Math.PI });
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
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation}>
      <mesh>
        <boxGeometry args={[W + 0.6, H + 0.6, 0.6]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <ScreenFace texture={texture} width={W} height={H} z={0.31} />
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
  const shelter = (x: number) => (
    <group key={x} position={[x, 0, 0]}>
      {/* Back, roof and side panels of a dugout shelter; local +z faces the pitch. */}
      <mesh position={[0, 1.1, -0.9]} castShadow>
        <boxGeometry args={[5, 2.2, 0.15]} />
        <meshStandardMaterial color="#2c3438" />
      </mesh>
      <mesh position={[0, 2.25, -0.2]} rotation-x={0.12} castShadow>
        <boxGeometry args={[5.2, 0.12, 1.8]} />
        <meshStandardMaterial color="#9fb3bf" transparent opacity={0.55} roughness={0.2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.5, 1.1, -0.2]}>
          <boxGeometry args={[0.1, 2.2, 1.6]} />
          <meshStandardMaterial color="#9fb3bf" transparent opacity={0.4} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, -0.5]}>
        <boxGeometry args={[4.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#1f7a3e" roughness={0.8} />
      </mesh>
    </group>
  );
  return (
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation}>
      {shelter(-4.6)}
      {shelter(4.6)}
      <group position={[0, 1.9, -0.3]}>
        <mesh>
          <boxGeometry args={[3.5, 1.95, 0.2]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={3.3} height={1.65} z={0.11} />
      </group>
      <mesh position={[0, 0.45, -0.3]}>
        <boxGeometry args={[0.2, 0.9, 0.2]} />
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
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation}>
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
      <group position={[0, height + 1.5, 0.3]}>
        <mesh>
          <boxGeometry args={[4.8, 2, 0.2]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={4.6} height={1.8} z={0.11} />
      </group>
    </group>
  );
}

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
    <group position={landmark.structure as [number, number, number]} rotation-y={landmark.rotation}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.5]} />
        <meshStandardMaterial color={FRAME} />
      </mesh>
      <group position={[0, 2, 0.1]} rotation-x={-0.15}>
        <mesh castShadow>
          <boxGeometry args={[2.9, 1.9, 0.16]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <ScreenFace texture={texture} width={2.7} height={1.69} z={0.09} />
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
