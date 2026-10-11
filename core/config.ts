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

/** Proximity discovery (SPEC §7.4). Per-landmark radii can override the defaults. */
export const DISCOVERY = {
  DEFAULT_NEAR_RADIUS: 7,
  DEFAULT_ACTIVE_RADIUS: 4,
  /** Hysteresis: a state is left only beyond radius + padding. */
  EXIT_PADDING: 1,
  /** A challenger must score this much better to take over from the active landmark. */
  SWITCH_MARGIN: 1.5,
  /** Up to this many units of preference for landmarks in the direction of travel. */
  DIRECTION_BONUS: 0.75,
  /** Below this speed, direction of travel is ignored. */
  DIRECTION_MIN_SPEED: 0.5,
  /** The active landmark lingers this long after the ball leaves (no flashing). */
  EXIT_GRACE: 0.35,
} as const;

/** Camera framing when a landmark is active (SPEC §8). */
export const FOCUS = {
  BLEND: 0.35,
  /** Fraction the camera distance shrinks at full focus. */
  ZOOM: 0.12,
  LAMBDA: 2.5,
} as const;

/** Menu navigation: the ball dribbles itself to a landmark (SPEC §7.5). */
export const AUTOPILOT = {
  /** Within this distance of the target the ball eases off. */
  SLOW_RADIUS: 5,
  /** Arrived: close enough and nearly stopped. */
  ARRIVE_RADIUS: 0.6,
  ARRIVE_SPEED: 0.6,
  /** Give up after this long (e.g. something blocks the way). */
  TIMEOUT: 8,
} as const;
