import { describe, expect, it } from "vitest";
import { resolveCollisions, type Obstacle } from "@/core/collision";
import { MOVEMENT } from "@/core/config";
import { speed } from "@/core/movement";
import { createSimulation } from "@/core/simulation";
import { BALL } from "@/world/layout";
import { BOUNDS, OBSTACLES } from "@/world/obstacles";

const R = 0.45;
const OPEN = { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
const wall: Obstacle = { kind: "box", x: 0, z: -5, halfWidth: 4, halfDepth: 0.12, angle: 0 };

describe("resolveCollisions", () => {
  it("pushes the ball out of a box and bounces with restitution", () => {
    const ball = { x: 0, z: -4.6, vx: 0, vz: -8 }; // overlapping the wall's south face
    resolveCollisions(ball, R, [wall], OPEN, 0.4);
    expect(ball.z).toBeCloseTo(-5 + 0.12 + R, 6);
    expect(ball.vz).toBeCloseTo(3.2, 6);
  });

  it("keeps tangential velocity so the ball slides along walls", () => {
    const ball = { x: 0, z: -4.6, vx: 5, vz: -2 };
    resolveCollisions(ball, R, [wall], OPEN, 0.4);
    expect(ball.vx).toBe(5);
    expect(ball.vz).toBeGreaterThan(0);
  });

  it("does not push a ball that is moving away", () => {
    const ball = { x: 0, z: -4.6, vx: 0, vz: 3 };
    resolveCollisions(ball, R, [wall], OPEN, 0.4);
    expect(ball.vz).toBe(3);
  });

  it("handles rotated boxes", () => {
    const rotated: Obstacle = { ...wall, x: 0, z: 0, angle: Math.PI / 2 }; // now runs north–south
    const ball = { x: 0.4, z: 0, vx: -6, vz: 0 };
    resolveCollisions(ball, R, [rotated], OPEN, 0.4);
    expect(ball.x).toBeCloseTo(0.12 + R, 6);
    expect(ball.vx).toBeGreaterThan(0);
  });

  it("bounces off circles (goal posts)", () => {
    const post: Obstacle = { kind: "circle", x: 0, z: 0, radius: 0.11 };
    const ball = { x: 0.5, z: 0, vx: -6, vz: 0 };
    resolveCollisions(ball, R, [post], OPEN, 0.4);
    expect(ball.x).toBeCloseTo(0.56, 6);
    expect(ball.vx).toBeCloseTo(2.4, 6);
  });

  it("keeps the ball inside the bounds", () => {
    const ball = { x: 99.9, z: 0, vx: 10, vz: 0 };
    resolveCollisions(ball, R, [], OPEN, 0.4);
    expect(ball.x).toBeLessThanOrEqual(100 - R);
    expect(ball.vx).toBeLessThan(0);
  });
});

describe("stadium collisions", () => {
  it("never tunnels through a board at max speed with 50 ms frames", () => {
    const sim = createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: { x: -18, z: -15 } });
    for (let i = 0; i < 60; i++) sim.advance(MOVEMENT.MAX_FRAME_DT, { x: 0, z: -1 });
    // The DevSpot board's front face is at z ≈ -21.68.
    expect(sim.ball.z).toBeGreaterThan(-21.68 + BALL.radius - 0.01);
  });

  it("stays inside the playable area whatever the input", () => {
    for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7]]) {
      const sim = createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS });
      for (let i = 0; i < 400; i++) sim.advance(1 / 60, { x, z });
      const { ball } = sim;
      expect(ball.x).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(ball.x).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(ball.z).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(ball.z).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });

  it("can roll into the goal mouth but not through the side netting", () => {
    const mouth = createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: { x: 25, z: 0 } });
    for (let i = 0; i < 120; i++) mouth.advance(1 / 60, { x: 1, z: 0 });
    expect(mouth.ball.x).toBeGreaterThan(30.5);

    const side = createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: { x: 31, z: 7 } });
    for (let i = 0; i < 120; i++) side.advance(1 / 60, { x: 0, z: -1 });
    expect(side.ball.z).toBeGreaterThan(4.2);
  });

  it("comes to rest after hitting a wall", () => {
    const sim = createSimulation({ radius: R, obstacles: [wall], bounds: OPEN, spawn: { x: 0, z: -4 } });
    for (let i = 0; i < 30; i++) sim.advance(1 / 60, { x: 0, z: -1 });
    for (let i = 0; i < 300; i++) sim.advance(1 / 60, { x: 0, z: 0 });
    expect(speed(sim.ball)).toBe(0);
  });
});
