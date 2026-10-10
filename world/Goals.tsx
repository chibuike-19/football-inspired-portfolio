"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide, RepeatWrapping, Shape, ShapeGeometry } from "three";
import { GOAL, PITCH } from "./layout";
import { createCanvas, toTexture } from "./textures/canvas";

const BACK_HEIGHT = GOAL.height * 0.62;

/** Diamond-mesh net on a transparent background, tiled across the net planes. */
function createNetTexture() {
  const size = 64;
  const { canvas, ctx } = createCanvas(size, size);
  ctx.strokeStyle = "rgba(240, 244, 242, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size / 2, 0);
  ctx.lineTo(size, size / 2);
  ctx.lineTo(size / 2, size);
  ctx.closePath();
  ctx.stroke();
  const texture = toTexture(canvas, 4);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
}

/** Side net: a quad from the goal line (full height) to the back (lower). */
function createSideGeometry() {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, GOAL.height);
  shape.lineTo(GOAL.depth, BACK_HEIGHT);
  shape.lineTo(GOAL.depth, 0);
  shape.closePath();
  const geometry = new ShapeGeometry(shape);
  // ShapeGeometry UVs are in shape units; scale to ~3 net cells per unit.
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
  return geometry;
}

function Goal({ side }: { side: 1 | -1 }) {
  const net = useMemo(() => createNetTexture(), []);
  const sideGeometry = useMemo(() => createSideGeometry(), []);
  useEffect(
    () => () => {
      net.dispose();
      sideGeometry.dispose();
    },
    [net, sideGeometry],
  );

  const roofLength = Math.hypot(GOAL.depth, GOAL.height - BACK_HEIGHT);
  const roofAngle = Math.atan2(GOAL.height - BACK_HEIGHT, GOAL.depth);
  const width = GOAL.halfWidth * 2;

  const backNet = useMemo(() => {
    const t = net.clone();
    t.repeat.set(width * 3, BACK_HEIGHT * 3);
    return t;
  }, [net, width]);
  const roofNet = useMemo(() => {
    const t = net.clone();
    t.repeat.set(roofLength * 3, width * 3);
    return t;
  }, [net, width, roofLength]);
  useEffect(
    () => () => {
      backNet.dispose();
      roofNet.dispose();
    },
    [backNet, roofNet],
  );

  const netMaterial = { transparent: true, alphaTest: 0.35, side: DoubleSide, roughness: 1, depthWrite: false } as const;

  // Local frame: x = depth (away from the pitch), z = across the goal mouth.
  return (
    <group position={[side * PITCH.halfLength, 0, 0]} rotation-y={side === 1 ? 0 : Math.PI}>
      {/* Posts and crossbar */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, GOAL.height / 2, s * GOAL.halfWidth]} castShadow>
          <cylinderGeometry args={[GOAL.postRadius, GOAL.postRadius, GOAL.height, 16]} />
          <meshStandardMaterial color="#f5f7f6" roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, GOAL.height, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[GOAL.postRadius, GOAL.postRadius, width + GOAL.postRadius * 2, 16]} />
        <meshStandardMaterial color="#f5f7f6" roughness={0.35} />
      </mesh>

      {/* Back frame */}
      {[-1, 1].map((s) => (
        <mesh key={`back-${s}`} position={[GOAL.depth, BACK_HEIGHT / 2, s * GOAL.halfWidth]}>
          <cylinderGeometry args={[0.04, 0.04, BACK_HEIGHT, 8]} />
          <meshStandardMaterial color="#c9cfcc" />
        </mesh>
      ))}

      {/* Nets */}
      <mesh position={[GOAL.depth, BACK_HEIGHT / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[width, BACK_HEIGHT]} />
        <meshStandardMaterial map={backNet} {...netMaterial} />
      </mesh>
      <group position={[GOAL.depth / 2, (GOAL.height + BACK_HEIGHT) / 2, 0]} rotation-z={-roofAngle}>
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[roofLength, width]} />
          <meshStandardMaterial map={roofNet} {...netMaterial} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={`side-${s}`} geometry={sideGeometry} position={[0, 0, s * GOAL.halfWidth]}>
          <meshStandardMaterial map={net} {...netMaterial} />
        </mesh>
      ))}
    </group>
  );
}

export function Goals() {
  return (
    <>
      <Goal side={1} />
      <Goal side={-1} />
    </>
  );
}
