import { MOVEMENT } from "./config";
import { length, type Vec2 } from "./math";

export interface BallState {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export const createBall = (x = 0, z = 0): BallState => ({ x, z, vx: 0, vz: 0 });

/**
 * One fixed simulation step (SPEC §7.2). Mutates `ball` in place to avoid
 * per-step allocation; `input` is a direction with length ≤ 1.
 */
export function stepBall(ball: BallState, input: Vec2, dt: number): BallState {
  const inputLength = Math.min(1, length(input.x, input.z));

  if (inputLength > 0.001) {
    const desiredX = (input.x / length(input.x, input.z)) * inputLength * MOVEMENT.MAX_SPEED;
    const desiredZ = (input.z / length(input.x, input.z)) * inputLength * MOVEMENT.MAX_SPEED;
    const dvx = desiredX - ball.vx;
    const dvz = desiredZ - ball.vz;
    const dvLength = length(dvx, dvz);
    // Turning against the current velocity uses more grip, so reversals feel responsive.
    const reversing = ball.vx * desiredX + ball.vz * desiredZ < 0;
    const maxChange = MOVEMENT.ACCEL * (reversing ? MOVEMENT.REVERSE_ACCEL_MULT : 1) * dt;
    if (dvLength <= maxChange) {
      ball.vx = desiredX;
      ball.vz = desiredZ;
    } else {
      ball.vx += (dvx / dvLength) * maxChange;
      ball.vz += (dvz / dvLength) * maxChange;
    }
  } else {
    const decay = Math.exp(-MOVEMENT.FRICTION * dt);
    ball.vx *= decay;
    ball.vz *= decay;
    if (length(ball.vx, ball.vz) < MOVEMENT.REST_SPEED) {
      ball.vx = 0;
      ball.vz = 0;
    }
  }

  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  return ball;
}

export const speed = (ball: BallState) => length(ball.vx, ball.vz);
