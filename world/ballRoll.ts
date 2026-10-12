import { Quaternion, Vector3, type Object3D } from "three";
import { BALL } from "./layout";

const axis = new Vector3();
const spin = new Quaternion();

/**
 * Rolls the ball without slipping for a move of (dx, dz): rotation about
 * (up × travel) by distance / radius. Teleports (≥ 1 unit in a frame) don't spin.
 */
export function rollBall(ball: Object3D, dx: number, dz: number): void {
  const distance = Math.hypot(dx, dz);
  if (distance <= 1e-5 || distance >= 1) return;
  axis.set(dz / distance, 0, -dx / distance);
  spin.setFromAxisAngle(axis, distance / BALL.radius);
  ball.quaternion.premultiply(spin);
}
