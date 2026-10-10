import type { BallState } from "./movement";

/** Static obstacles on the pitch plane (SPEC §7.3). */
export type Obstacle =
  | { kind: "circle"; x: number; z: number; radius: number }
  | {
      kind: "box";
      x: number;
      z: number;
      halfWidth: number; // along local x
      halfDepth: number; // along local z
      /** Rotation about Y (radians), same convention as the scene. */
      angle: number;
    };

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Pushes the ball out of a contact along `normal` (unit, pointing at the ball)
 * and reflects the velocity component into the surface. Tangential velocity is
 * kept, so the ball slides along walls.
 */
function resolveContact(ball: BallState, nx: number, nz: number, penetration: number, restitution: number) {
  ball.x += nx * penetration;
  ball.z += nz * penetration;
  const into = ball.vx * nx + ball.vz * nz;
  if (into < 0) {
    ball.vx -= (1 + restitution) * into * nx;
    ball.vz -= (1 + restitution) * into * nz;
  }
}

function collideCircle(ball: BallState, radius: number, o: Extract<Obstacle, { kind: "circle" }>, restitution: number) {
  const dx = ball.x - o.x;
  const dz = ball.z - o.z;
  const distance = Math.hypot(dx, dz);
  const minDistance = radius + o.radius;
  if (distance >= minDistance) return false;
  const [nx, nz] = distance > 1e-6 ? [dx / distance, dz / distance] : [0, 1];
  resolveContact(ball, nx, nz, minDistance - distance, restitution);
  return true;
}

function collideBox(ball: BallState, radius: number, o: Extract<Obstacle, { kind: "box" }>, restitution: number) {
  // Ball centre in box-local space. A scene rotation of θ about Y maps local
  // (x, z) to world (x cosθ + z sinθ, -x sinθ + z cosθ).
  const cos = Math.cos(o.angle);
  const sin = Math.sin(o.angle);
  const dx = ball.x - o.x;
  const dz = ball.z - o.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;

  const cx = Math.max(-o.halfWidth, Math.min(o.halfWidth, lx));
  const cz = Math.max(-o.halfDepth, Math.min(o.halfDepth, lz));
  let nlx = lx - cx;
  let nlz = lz - cz;
  let distance = Math.hypot(nlx, nlz);
  let penetration: number;

  if (distance > 1e-6) {
    if (distance >= radius) return false;
    nlx /= distance;
    nlz /= distance;
    penetration = radius - distance;
  } else {
    // Centre inside the box: leave through the nearest face.
    const toX = o.halfWidth - Math.abs(lx);
    const toZ = o.halfDepth - Math.abs(lz);
    if (toX < toZ) {
      nlx = Math.sign(lx) || 1;
      nlz = 0;
      penetration = toX + radius;
    } else {
      nlx = 0;
      nlz = Math.sign(lz) || 1;
      penetration = toZ + radius;
    }
    distance = 0;
  }

  // Normal back to world space.
  const nx = nlx * cos + nlz * sin;
  const nz = -nlx * sin + nlz * cos;
  resolveContact(ball, nx, nz, penetration, restitution);
  return true;
}

/** Keeps the ball inside the playable rectangle with a soft bounce. */
function collideBounds(ball: BallState, radius: number, b: Bounds, restitution: number) {
  if (ball.x - radius < b.minX) resolveContact(ball, 1, 0, b.minX - (ball.x - radius), restitution);
  if (ball.x + radius > b.maxX) resolveContact(ball, -1, 0, ball.x + radius - b.maxX, restitution);
  if (ball.z - radius < b.minZ) resolveContact(ball, 0, 1, b.minZ - (ball.z - radius), restitution);
  if (ball.z + radius > b.maxZ) resolveContact(ball, 0, -1, ball.z + radius - b.maxZ, restitution);
}

export function resolveCollisions(
  ball: BallState,
  radius: number,
  obstacles: readonly Obstacle[],
  bounds: Bounds,
  restitution: number,
): void {
  for (const obstacle of obstacles) {
    if (obstacle.kind === "circle") collideCircle(ball, radius, obstacle, restitution);
    else collideBox(ball, radius, obstacle, restitution);
  }
  collideBounds(ball, radius, bounds, restitution);
}
