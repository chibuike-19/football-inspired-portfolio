import { AUTOPILOT } from "./config";
import type { Vec2 } from "./math";
import type { BallState } from "./movement";

export interface AutopilotOptions {
  /** Goal lines are at ±halfLength; inside a goal mouth the ball first steps back out. */
  pitchHalfLength: number;
}

const ZERO: Vec2 = { x: 0, z: 0 };

/**
 * Seek-and-arrive steering towards `target` (SPEC §7.5). Returns the input
 * direction to feed the simulation, or null once the ball has arrived.
 * Pure: the caller decides when to start, cancel or time out.
 */
export function autopilotInput(ball: BallState, target: Vec2, options: AutopilotOptions): Vec2 | null {
  // Inside a goal the side nets would block a straight line: leave through the mouth first.
  const inGoal = Math.abs(ball.x) > options.pitchHalfLength;
  const aim = inGoal ? { x: Math.sign(ball.x) * (options.pitchHalfLength - 2), z: ball.z } : target;

  const dx = aim.x - ball.x;
  const dz = aim.z - ball.z;
  const distance = Math.hypot(dx, dz);
  const speed = Math.hypot(ball.vx, ball.vz);
  const final = !inGoal;

  if (final && distance < AUTOPILOT.ARRIVE_RADIUS && speed < AUTOPILOT.ARRIVE_SPEED) return null;
  if (distance < 1e-6) return ZERO;

  // Full input far away; proportionally less inside the slow radius so it doesn't overshoot.
  const strength = final ? Math.min(1, distance / AUTOPILOT.SLOW_RADIUS) : 1;
  return { x: (dx / distance) * strength, z: (dz / distance) * strength };
}
