import { describe, expect, it } from "vitest";
import { autopilotInput } from "@/core/autopilot";
import { AUTOPILOT } from "@/core/config";
import { createSimulation } from "@/core/simulation";
import { BALL } from "@/world/layout";
import { LANDMARKS } from "@/world/landmarks";
import { BOUNDS, OBSTACLES } from "@/world/obstacles";

const options = { pitchHalfLength: 30 };

/** Drives the real simulation with the autopilot until it reports arrival. */
function drive(from: { x: number; z: number }, to: { x: number; z: number }) {
  const sim = createSimulation({ radius: BALL.radius, obstacles: OBSTACLES, bounds: BOUNDS, spawn: from });
  for (let t = 0; t < AUTOPILOT.TIMEOUT; t += 1 / 60) {
    const input = autopilotInput(sim.ball, to, options);
    if (!input) return { arrived: true, time: t, ball: sim.ball };
    sim.advance(1 / 60, input);
  }
  return { arrived: false, time: AUTOPILOT.TIMEOUT, ball: sim.ball };
}

describe("autopilot", () => {
  it("returns null once the ball is at rest on the target", () => {
    expect(autopilotInput({ x: 1, z: 1, vx: 0, vz: 0 }, { x: 1.1, z: 1 }, options)).toBeNull();
  });

  it("steers at full strength from far away and eases off near the target", () => {
    const far = autopilotInput({ x: 0, z: 0, vx: 0, vz: 0 }, { x: 20, z: 0 }, options)!;
    const near = autopilotInput({ x: 18, z: 0, vx: 0, vz: 0 }, { x: 20, z: 0 }, options)!;
    expect(far.x).toBeCloseTo(1, 6);
    expect(near.x).toBeLessThan(0.5);
  });

  it("reaches every landmark from spawn without overshooting into the next one", () => {
    for (const landmark of LANDMARKS) {
      const target = { x: landmark.position[0], z: landmark.position[1] };
      const result = drive({ x: 0, z: 0 }, target);
      expect(result.arrived, landmark.id).toBe(true);
      expect(Math.hypot(result.ball.x - target.x, result.ball.z - target.z), landmark.id).toBeLessThan(landmark.activeRadius);
      expect(result.time, landmark.id).toBeLessThan(6);
    }
  });

  it("gets out of a goal before heading elsewhere", () => {
    const result = drive({ x: 31, z: 0 }, { x: 26, z: -9 });
    expect(result.arrived).toBe(true);
  });

  it("travels between opposite corners of the pitch", () => {
    expect(drive({ x: -26, z: 9.2 }, { x: 26, z: -9 }).arrived).toBe(true);
    expect(drive({ x: 22, z: -17.5 }, { x: -26, z: 9.2 }).arrived).toBe(true);
  });
});
