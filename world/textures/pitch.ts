import { GROUND, PITCH } from "../layout";
import { createCanvas, toTexture } from "./canvas";

/**
 * Pitch texture: mown stripes, subtle grain and white markings, covering the
 * whole ground (pitch + runoff). One draw call, no line geometry.
 */
export function createPitchTexture(pixelsPerUnit: number) {
  const width = Math.round(GROUND.halfX * 2 * pixelsPerUnit);
  const height = Math.round(GROUND.halfZ * 2 * pixelsPerUnit);
  const { canvas, ctx } = createCanvas(width, height);

  // World (x, z) → canvas pixels.
  const px = (x: number) => (x + GROUND.halfX) * pixelsPerUnit;
  const pz = (z: number) => (z + GROUND.halfZ) * pixelsPerUnit;
  const u = (units: number) => units * pixelsPerUnit;

  // Base turf.
  ctx.fillStyle = "#1d6b34";
  ctx.fillRect(0, 0, width, height);

  // Mowing stripes across the long axis (12 bands on the pitch).
  const bands = 12;
  const bandWidth = (PITCH.halfLength * 2) / bands;
  for (let i = -6; i < bands + 6; i++) {
    const x0 = -PITCH.halfLength + i * bandWidth;
    ctx.fillStyle = i % 2 === 0 ? "#22793c" : "#1c6a34";
    ctx.fillRect(px(x0), 0, u(bandWidth) + 1, height);
  }

  // Grain: low-contrast speckle so close-ups don't look flat.
  const grains = Math.round((width * height) / 90);
  for (let i = 0; i < grains; i++) {
    const shade = Math.random() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.035)";
    ctx.fillStyle = shade;
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }

  // Runoff is slightly darker and worn.
  ctx.fillStyle = "rgba(6, 30, 14, 0.28)";
  ctx.fillRect(0, 0, width, pz(-PITCH.halfWidth));
  ctx.fillRect(0, pz(PITCH.halfWidth), width, height);
  ctx.fillRect(0, pz(-PITCH.halfWidth), px(-PITCH.halfLength), u(PITCH.halfWidth * 2));
  ctx.fillRect(px(PITCH.halfLength), pz(-PITCH.halfWidth), width, u(PITCH.halfWidth * 2));

  // Markings.
  ctx.strokeStyle = "rgba(245, 248, 246, 0.92)";
  ctx.fillStyle = "rgba(245, 248, 246, 0.92)";
  ctx.lineWidth = u(PITCH.lineWidth);
  ctx.lineCap = "butt";

  const rect = (x0: number, z0: number, x1: number, z1: number) =>
    ctx.strokeRect(px(x0), pz(z0), u(x1 - x0), u(z1 - z0));
  const circle = (x: number, z: number, r: number, a0 = 0, a1 = Math.PI * 2) => {
    ctx.beginPath();
    ctx.arc(px(x), pz(z), u(r), a0, a1);
    ctx.stroke();
  };
  const dot = (x: number, z: number, r: number) => {
    ctx.beginPath();
    ctx.arc(px(x), pz(z), u(r), 0, Math.PI * 2);
    ctx.fill();
  };

  const L = PITCH.halfLength;
  const W = PITCH.halfWidth;
  rect(-L, -W, L, W);
  ctx.beginPath();
  ctx.moveTo(px(0), pz(-W));
  ctx.lineTo(px(0), pz(W));
  ctx.stroke();
  circle(0, 0, PITCH.centerCircleRadius);
  dot(0, 0, 0.22);

  for (const side of [-1, 1]) {
    const goalLine = side * L;
    const inward = -side;
    rect(
      Math.min(goalLine, goalLine + inward * PITCH.penaltyAreaDepth),
      -PITCH.penaltyAreaHalfWidth,
      Math.max(goalLine, goalLine + inward * PITCH.penaltyAreaDepth),
      PITCH.penaltyAreaHalfWidth,
    );
    rect(
      Math.min(goalLine, goalLine + inward * PITCH.goalAreaDepth),
      -PITCH.goalAreaHalfWidth,
      Math.max(goalLine, goalLine + inward * PITCH.goalAreaDepth),
      PITCH.goalAreaHalfWidth,
    );
    const spotX = goalLine + inward * PITCH.penaltySpot;
    dot(spotX, 0, 0.18);
    // Penalty arc: the part of the circle outside the box.
    const dx = PITCH.penaltyAreaDepth - PITCH.penaltySpot;
    const half = Math.acos(dx / PITCH.centerCircleRadius);
    const facing = side === 1 ? Math.PI : 0;
    circle(spotX, 0, PITCH.centerCircleRadius, facing - half, facing + half);
  }

  // Corner arcs.
  for (const [cx, cz, a0] of [
    [-L, -W, 0],
    [L, -W, Math.PI / 2],
    [L, W, Math.PI],
    [-L, W, (3 * Math.PI) / 2],
  ] as const) {
    circle(cx, cz, PITCH.cornerArcRadius, a0, a0 + Math.PI / 2);
  }

  return toTexture(canvas, 16);
}
