/** Tunable interaction values (SPEC §13). World units, seconds. */

export const MOVEMENT = {
  FIXED_DT: 1 / 120,
  /** Longer frames (tab switch, GC pause) are clamped to this. */
  MAX_FRAME_DT: 0.05,
  MAX_SUBSTEPS: 6,
  MAX_SPEED: 9,
  ACCEL: 24,
  /** Extra acceleration when steering against the current velocity, for snappy turns. */
  REVERSE_ACCEL_MULT: 1.8,
  /** Exponential decay rate with no input. */
  FRICTION: 3.2,
  /** Below this speed with no input the ball stops. */
  REST_SPEED: 0.02,
  RESTITUTION: 0.4,
} as const;

export const CAMERA = {
  /** Offset from the ball to the camera. */
  HEIGHT: 8,
  DISTANCE: 15,
  /** How far ahead of the ball (towards the far stand) the camera looks. */
  LOOK_DISTANCE: 14,
  LOOK_HEIGHT: 1.84,
  LOOK_AHEAD_TIME: 0.35,
  LOOK_AHEAD_MAX: 3,
  FOLLOW_LAMBDA: 4,
  /** Camera never goes further south than this: just over the front row of the south stand (z ≈ 25.5). */
  MAX_Z: 26.5,
  /** Extra height when the camera is pinned at MAX_Z, so it can look down at the ball. */
  SQUEEZE_RISE: 6,
  MAX_ABS_X: 33,
  FOV: 55,
  /** Portrait screens widen the vertical FOV to keep at least this horizontal FOV. */
  MIN_HORIZONTAL_FOV: 52,
  MAX_FOV: 78,
} as const;

/** Reduced-motion camera: higher and wider, moves only when the ball nears the frame edge. */
export const CAMERA_REDUCED = {
  HEIGHT: 16,
  DISTANCE: 16,
  LOOK_DISTANCE: 6,
  DEAD_ZONE_X: 9,
  DEAD_ZONE_Z: 5,
  FOLLOW_LAMBDA: 10,
} as const;
