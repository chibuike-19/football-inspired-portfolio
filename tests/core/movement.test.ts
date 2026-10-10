import { describe, expect, it } from "vitest";
import { MOVEMENT } from "@/core/config";
import { createBall, speed, stepBall } from "@/core/movement";
import { createSimulation } from "@/core/simulation";

const OPEN = { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 };
const north = { x: 0, z: -1 };
const none = { x: 0, z: 0 };

/** Runs `seconds` of simulation split into frames of `frameDt`. */
function run(frameDt: number, seconds: number, input = north) {
  const sim = createSimulation({ radius: 0.45, obstacles: [], bounds: OPEN });
  const frames = Math.round(seconds / frameDt);
  for (let i = 0; i < frames; i++) sim.advance(frameDt, input);
  return sim;
}

describe("stepBall", () => {
  it("accelerates to max speed and never exceeds it", () => {
    const ball = createBall();
    let peak = 0;
    for (let i = 0; i < 240; i++) {
      stepBall(ball, north, MOVEMENT.FIXED_DT);
      peak = Math.max(peak, speed(ball));
    }
    expect(speed(ball)).toBeCloseTo(MOVEMENT.MAX_SPEED, 5);
    expect(peak).toBeLessThanOrEqual(MOVEMENT.MAX_SPEED + 1e-9);
    expect(ball.vz).toBeLessThan(0);
  });

  it("reaches max speed in under half a second (responsive, not sluggish)", () => {
    const ball = createBall();
    let t = 0;
    while (speed(ball) < MOVEMENT.MAX_SPEED * 0.95) {
      stepBall(ball, north, MOVEMENT.FIXED_DT);
      t += MOVEMENT.FIXED_DT;
    }
    expect(t).toBeLessThan(0.5);
  });

  it("scales speed with analogue input", () => {
    const ball = createBall();
    for (let i = 0; i < 240; i++) stepBall(ball, { x: 0.5, z: 0 }, MOVEMENT.FIXED_DT);
    expect(speed(ball)).toBeCloseTo(MOVEMENT.MAX_SPEED * 0.5, 5);
  });

  it("decelerates to a full stop with no input, coasting a short distance", () => {
    const ball = createBall();
    for (let i = 0; i < 240; i++) stepBall(ball, north, MOVEMENT.FIXED_DT);
    const startZ = ball.z;
    let t = 0;
    while (speed(ball) > 0 && t < 10) {
      stepBall(ball, none, MOVEMENT.FIXED_DT);
      t += MOVEMENT.FIXED_DT;
    }
    expect(speed(ball)).toBe(0);
    expect(t).toBeLessThan(3);
    const coast = Math.abs(ball.z - startZ);
    expect(coast).toBeGreaterThan(1.5);
    expect(coast).toBeLessThan(4);
  });

  it("reverses direction faster than it accelerates from rest", () => {
    const fromRest = createBall();
    const reversing = createBall();
    reversing.vz = -MOVEMENT.MAX_SPEED;
    const south = { x: 0, z: 1 };
    for (let i = 0; i < 12; i++) {
      stepBall(fromRest, south, MOVEMENT.FIXED_DT);
      stepBall(reversing, south, MOVEMENT.FIXED_DT);
    }
    const changeFromRest = fromRest.vz;
    const changeReversing = reversing.vz + MOVEMENT.MAX_SPEED;
    expect(changeReversing).toBeGreaterThan(changeFromRest * 1.5);
  });
});

describe("simulation timing", () => {
  it("gives the same result at 30, 60, 120 and 144 Hz", () => {
    const reference = run(1 / 60, 2);
    for (const hz of [30, 120, 144]) {
      const sim = run(1 / hz, 2);
      expect(Math.abs(sim.ball.z - reference.ball.z), `${hz} Hz`).toBeLessThan(0.1);
      expect(Math.abs(sim.ball.vz - reference.ball.vz), `${hz} Hz`).toBeLessThan(0.05);
    }
  });

  it("clamps long frames so a stall cannot launch the ball", () => {
    const sim = createSimulation({ radius: 0.45, obstacles: [], bounds: OPEN });
    sim.advance(5, north); // a 5-second stall (tab switch)
    expect(Math.abs(sim.ball.z)).toBeLessThan(MOVEMENT.MAX_SPEED * MOVEMENT.MAX_FRAME_DT);
  });

  it("returns an interpolation factor in [0, 1)", () => {
    const sim = createSimulation({ radius: 0.45, obstacles: [], bounds: OPEN });
    for (const dt of [1 / 144, 1 / 60, 1 / 37, 0.05]) {
      const alpha = sim.advance(dt, north);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
    }
  });

  it("place() puts the ball at rest", () => {
    const sim = run(1 / 60, 1);
    sim.place(5, 6);
    expect(sim.ball).toEqual({ x: 5, z: 6, vx: 0, vz: 0 });
    expect(sim.previous).toEqual(sim.ball);
  });
});
