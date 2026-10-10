import { resolveCollisions, type Bounds, type Obstacle } from "./collision";
import { MOVEMENT } from "./config";
import { createBall, stepBall, type BallState } from "./movement";
import type { Vec2 } from "./math";

export interface SimulationOptions {
  radius: number;
  obstacles: readonly Obstacle[];
  bounds: Bounds;
  spawn?: Vec2;
}

export interface Simulation {
  /** State after the latest fixed step. */
  readonly ball: BallState;
  /** State before the latest fixed step, for render interpolation. */
  readonly previous: BallState;
  /**
   * Advances by a frame delta using fixed steps (SPEC §7.2). Returns the
   * interpolation factor between `previous` and `ball` for rendering.
   */
  advance(frameDt: number, input: Vec2): number;
  /** Places the ball at rest (spawn, teleport, tests). */
  place(x: number, z: number): void;
}

export function createSimulation({ radius, obstacles, bounds, spawn = { x: 0, z: 0 } }: SimulationOptions): Simulation {
  const ball = createBall(spawn.x, spawn.z);
  const previous = createBall(spawn.x, spawn.z);
  let accumulator = 0;

  return {
    ball,
    previous,
    advance(frameDt, input) {
      accumulator += Math.min(Math.max(frameDt, 0), MOVEMENT.MAX_FRAME_DT);
      let steps = 0;
      while (accumulator >= MOVEMENT.FIXED_DT && steps < MOVEMENT.MAX_SUBSTEPS) {
        Object.assign(previous, ball);
        stepBall(ball, input, MOVEMENT.FIXED_DT);
        resolveCollisions(ball, radius, obstacles, bounds, MOVEMENT.RESTITUTION);
        accumulator -= MOVEMENT.FIXED_DT;
        steps++;
      }
      // Drop time we could not simulate rather than spiralling.
      if (steps === MOVEMENT.MAX_SUBSTEPS) accumulator = Math.min(accumulator, MOVEMENT.FIXED_DT);
      return accumulator / MOVEMENT.FIXED_DT;
    },
    place(x, z) {
      Object.assign(ball, { x, z, vx: 0, vz: 0 });
      Object.assign(previous, ball);
      accumulator = 0;
    },
  };
}
