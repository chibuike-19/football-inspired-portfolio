import type { Bounds, Obstacle } from "@/core/collision";
import { BOARD, GOAL, PITCH } from "./layout";
import { LANDMARKS } from "./landmarks";

/**
 * Playable area: the pitch plus a margin into the runoff. At the ends the ball
 * can roll into the goal mouth (the goal is 2.2 deep; the limit stops short of
 * the back net). The north limit sits at the project boards.
 */
export const BOUNDS: Bounds = {
  minX: -(PITCH.halfLength + 1.6),
  maxX: PITCH.halfLength + 1.6,
  minZ: -(PITCH.halfWidth + BOARD.offset),
  maxZ: PITCH.halfWidth + 1.4,
};

const posts: Obstacle[] = [-1, 1].flatMap((side) =>
  [-1, 1].map((s): Obstacle => ({ kind: "circle", x: side * PITCH.halfLength, z: s * GOAL.halfWidth, radius: GOAL.postRadius })),
);

/** Side nets, so the ball can enter the goal only through the mouth. */
const sideNets: Obstacle[] = [-1, 1].flatMap((side) =>
  [-1, 1].map(
    (s): Obstacle => ({
      kind: "box",
      x: side * (PITCH.halfLength + GOAL.depth / 2),
      z: s * GOAL.halfWidth,
      halfWidth: GOAL.depth / 2,
      halfDepth: 0.05,
      angle: 0,
    }),
  ),
);

const boards: Obstacle[] = LANDMARKS.filter((l) => l.kind === "board").map((l) => ({
  kind: "box",
  x: l.structure[0],
  z: l.structure[2],
  halfWidth: BOARD.width / 2,
  halfDepth: 0.12,
  angle: l.rotation,
}));

export const OBSTACLES: readonly Obstacle[] = [...posts, ...sideNets, ...boards];
