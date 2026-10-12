/**
 * World dimensions in world units (SPEC §5.1). The pitch lies on the XZ plane,
 * +x east, -z north (the far side from the spawn camera).
 *
 * The pitch is a ~0.57 scale of a real 105 × 68 m pitch so every landmark is a
 * few seconds' roll away; the ball is deliberately oversized for readability.
 */
export const PITCH = {
  halfLength: 30, // x: touchline-to-touchline along the long axis
  halfWidth: 20, // z
  lineWidth: 0.14,
  centerCircleRadius: 5.2,
  penaltyAreaDepth: 9.4,
  penaltyAreaHalfWidth: 11.5,
  goalAreaDepth: 3.1,
  goalAreaHalfWidth: 5.2,
  penaltySpot: 6.3,
  cornerArcRadius: 0.6,
} as const;

/** Grass beyond the lines, up to the boards and stands. */
export const RUNOFF = { x: 5, z: 4.5 } as const;

export const GROUND = {
  halfX: PITCH.halfLength + RUNOFF.x,
  halfZ: PITCH.halfWidth + RUNOFF.z,
} as const;

export const GOAL = {
  halfWidth: 4.2,
  height: 2.8,
  depth: 2.2,
  postRadius: 0.11,
} as const;

export const BALL = { radius: 0.45 } as const;

/** Stands start just behind the runoff and rise outwards. */
export const STAND = {
  rows: 9,
  rowDepth: 1.1,
  rowRise: 0.75,
  seatSpacing: 0.62,
  baseHeight: 1.4,
  gap: 1, // between runoff edge and first row
} as const;

export const BOARD = {
  width: 7,
  height: 1.1,
  /** Distance of the board line beyond the touchline. */
  offset: 1.8,
} as const;

/**
 * Players' tunnel: a corridor from the mouth in the east stand, under the
 * tiers and out the back into a low annex that ends at the trophy-room doors.
 * Axis-aligned along +x; z is the corridor's centre line.
 */
export const TUNNEL = {
  z: -(GOAL.halfWidth + 6),
  width: 4.2,
  height: 3.2,
  /** Mouth, flush with the front of the east stand. */
  start: GROUND.halfX + STAND.gap,
  /** Doors to the trophy room. */
  end: GROUND.halfX + STAND.gap + 16,
} as const;

/**
 * Trophy room behind the tunnel doors, outside the stadium shell. Displays line
 * the south (right-hand) wall; an opening in the north wall leads back outside.
 */
export const ROOM = {
  start: TUNNEL.end + 0.3,
  end: TUNNEL.end + 17.5,
  z: TUNNEL.z,
  halfWidth: 6,
  height: 5.5,
  /** Opening in the north wall: x range. */
  openingStart: TUNNEL.end + 9.7,
  openingEnd: TUNNEL.end + 13.3,
  openingHeight: 3.4,
  /** First display (x) and spacing. */
  firstDisplay: TUNNEL.end + 3.6,
  displaySpacing: 3,
} as const;
