import { CAMERA, CAMERA_REDUCED } from "./config";
import { clamp, damp, length } from "./math";

export interface CameraState {
  /** Camera position. */
  px: number;
  py: number;
  pz: number;
  /** Look-at point. */
  tx: number;
  ty: number;
  tz: number;
  /** Reduced-motion focus point (dead-zone follow). */
  fx: number;
  fz: number;
}

export interface CameraInput {
  ballX: number;
  ballZ: number;
  vx: number;
  vz: number;
  reducedMotion: boolean;
}

interface Goal {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
}

/**
 * The camera always looks north (towards the scoreboard) from behind the ball,
 * so controls never rotate under the player. Position is clamped out of the stands.
 */
function followGoal(focusX: number, focusZ: number, aheadX: number, aheadZ: number): Goal {
  const wantedZ = focusZ + CAMERA.DISTANCE;
  const pz = Math.min(wantedZ, CAMERA.MAX_Z);
  // Near the south stand the camera can't back off, so it rises and looks
  // down at the ball instead of losing it below the frame.
  const squeeze = clamp((wantedZ - pz) / CAMERA.DISTANCE, 0, 1);
  return {
    px: clamp(focusX + aheadX * 0.5, -CAMERA.MAX_ABS_X, CAMERA.MAX_ABS_X),
    py: CAMERA.HEIGHT + squeeze * CAMERA.SQUEEZE_RISE,
    pz,
    tx: focusX + aheadX,
    ty: CAMERA.LOOK_HEIGHT,
    tz: focusZ - CAMERA.LOOK_DISTANCE * (1 - squeeze) + aheadZ,
  };
}

function reducedGoal(state: CameraState, input: CameraInput, dt: number): Goal {
  // Move the focus only as far as needed to keep the ball inside the dead zone.
  const dx = input.ballX - state.fx;
  const dz = input.ballZ - state.fz;
  const targetFx = Math.abs(dx) > CAMERA_REDUCED.DEAD_ZONE_X ? input.ballX - Math.sign(dx) * CAMERA_REDUCED.DEAD_ZONE_X * 0.4 : state.fx;
  const targetFz = Math.abs(dz) > CAMERA_REDUCED.DEAD_ZONE_Z ? input.ballZ - Math.sign(dz) * CAMERA_REDUCED.DEAD_ZONE_Z * 0.4 : state.fz;
  state.fx = damp(state.fx, targetFx, CAMERA_REDUCED.FOLLOW_LAMBDA, dt);
  state.fz = damp(state.fz, targetFz, CAMERA_REDUCED.FOLLOW_LAMBDA, dt);
  return {
    px: clamp(state.fx, -CAMERA.MAX_ABS_X, CAMERA.MAX_ABS_X),
    py: CAMERA_REDUCED.HEIGHT,
    pz: Math.min(state.fz + CAMERA_REDUCED.DISTANCE, CAMERA.MAX_Z),
    tx: state.fx,
    ty: 0,
    tz: state.fz - CAMERA_REDUCED.LOOK_DISTANCE,
  };
}

export function goalFor(state: CameraState, input: CameraInput, dt: number): Goal {
  if (input.reducedMotion) return reducedGoal(state, input, dt);
  // Look-ahead in the direction of travel, clamped (SPEC §8).
  let aheadX = input.vx * CAMERA.LOOK_AHEAD_TIME;
  let aheadZ = input.vz * CAMERA.LOOK_AHEAD_TIME;
  const aheadLength = length(aheadX, aheadZ);
  if (aheadLength > CAMERA.LOOK_AHEAD_MAX) {
    aheadX *= CAMERA.LOOK_AHEAD_MAX / aheadLength;
    aheadZ *= CAMERA.LOOK_AHEAD_MAX / aheadLength;
  }
  return followGoal(input.ballX, input.ballZ, aheadX, aheadZ);
}

export function createCamera(ballX: number, ballZ: number, reducedMotion: boolean): CameraState {
  const state: CameraState = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fx: ballX, fz: ballZ };
  Object.assign(state, goalFor(state, { ballX, ballZ, vx: 0, vz: 0, reducedMotion }, 0));
  return state;
}

/** Eases the camera towards its goal. Returns true while it is still moving noticeably. */
export function stepCamera(state: CameraState, input: CameraInput, dt: number): boolean {
  const goal = goalFor(state, input, dt);
  const lambda = input.reducedMotion ? CAMERA_REDUCED.FOLLOW_LAMBDA : CAMERA.FOLLOW_LAMBDA;
  let moving = false;
  for (const key of ["px", "py", "pz", "tx", "ty", "tz"] as const) {
    const next = damp(state[key], goal[key], lambda, dt);
    if (Math.abs(next - goal[key]) > 0.002) moving = true;
    state[key] = next;
  }
  return moving || (input.reducedMotion && (Math.abs(state.fx - input.ballX) > CAMERA_REDUCED.DEAD_ZONE_X || Math.abs(state.fz - input.ballZ) > CAMERA_REDUCED.DEAD_ZONE_Z));
}

/** Vertical FOV that keeps at least MIN_HORIZONTAL_FOV on portrait screens. */
export function fovForAspect(aspect: number): number {
  const minHorizontal = (CAMERA.MIN_HORIZONTAL_FOV * Math.PI) / 180;
  const vertical = (2 * Math.atan(Math.tan(minHorizontal / 2) / aspect) * 180) / Math.PI;
  return clamp(Math.max(CAMERA.FOV, vertical), CAMERA.FOV, CAMERA.MAX_FOV);
}
