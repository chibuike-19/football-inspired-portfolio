import { CAMERA, CAMERA_REDUCED, FOCUS } from "./config";
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
  /** Landmark focus weight, eased 0..1 (SPEC §8). */
  focusWeight: number;
  /** Last landmark focus point, kept while the weight eases out. */
  focusX: number;
  focusZ: number;
}

export interface CameraInput {
  ballX: number;
  ballZ: number;
  vx: number;
  vz: number;
  reducedMotion: boolean;
  /** Active landmark position on the pitch, if any. */
  focus?: { x: number; z: number } | null;
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
  // Ease landmark focus in and out; remember the point so it can ease out smoothly.
  if (input.focus) {
    state.focusX = input.focus.x;
    state.focusZ = input.focus.z;
  }
  state.focusWeight = damp(state.focusWeight, input.focus ? 1 : 0, FOCUS.LAMBDA, dt);
  // Look-ahead in the direction of travel, clamped (SPEC §8).
  let aheadX = input.vx * CAMERA.LOOK_AHEAD_TIME;
  let aheadZ = input.vz * CAMERA.LOOK_AHEAD_TIME;
  const aheadLength = length(aheadX, aheadZ);
  if (aheadLength > CAMERA.LOOK_AHEAD_MAX) {
    aheadX *= CAMERA.LOOK_AHEAD_MAX / aheadLength;
    aheadZ *= CAMERA.LOOK_AHEAD_MAX / aheadLength;
  }
  const goal = followGoal(input.ballX, input.ballZ, aheadX, aheadZ);
  const w = state.focusWeight;
  if (w > 1e-4) {
    // Look towards the midpoint of ball and landmark, and close in slightly.
    const midX = (input.ballX + state.focusX) / 2;
    const midZ = (input.ballZ + state.focusZ) / 2;
    goal.tx += (midX - goal.tx) * FOCUS.BLEND * w;
    goal.tz += (midZ - goal.tz) * FOCUS.BLEND * w;
    const zoom = 1 - FOCUS.ZOOM * w;
    goal.px = goal.tx + (goal.px - goal.tx) * zoom;
    goal.py = goal.ty + (goal.py - goal.ty) * zoom;
    goal.pz = Math.min(goal.tz + (goal.pz - goal.tz) * zoom, CAMERA.MAX_Z);
  }
  return goal;
}

export function createCamera(ballX: number, ballZ: number, reducedMotion: boolean): CameraState {
  const state: CameraState = {
    px: 0,
    py: 0,
    pz: 0,
    tx: 0,
    ty: 0,
    tz: 0,
    fx: ballX,
    fz: ballZ,
    focusWeight: 0,
    focusX: ballX,
    focusZ: ballZ,
  };
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
  const focusSettling = Math.abs(state.focusWeight - (input.focus ? 1 : 0)) > 0.002;
  return moving || focusSettling || (input.reducedMotion && (Math.abs(state.fx - input.ballX) > CAMERA_REDUCED.DEAD_ZONE_X || Math.abs(state.fz - input.ballZ) > CAMERA_REDUCED.DEAD_ZONE_Z));
}

/** Vertical FOV that keeps at least MIN_HORIZONTAL_FOV on portrait screens. */
export function fovForAspect(aspect: number): number {
  const minHorizontal = (CAMERA.MIN_HORIZONTAL_FOV * Math.PI) / 180;
  const vertical = (2 * Math.atan(Math.tan(minHorizontal / 2) / aspect) * 180) / Math.PI;
  return clamp(Math.max(CAMERA.FOV, vertical), CAMERA.FOV, CAMERA.MAX_FOV);
}
