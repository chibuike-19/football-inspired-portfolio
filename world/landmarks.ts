import { projects } from "@/content";
import { BOARD, GOAL, GROUND, PITCH, STAND } from "./layout";

export type Vec2 = readonly [x: number, z: number];
export type Vec3 = readonly [x: number, y: number, z: number];

export type LandmarkId = "profile" | "experience" | "resume" | "contact" | `project:${string}`;

export type LandmarkKind = "scoreboard" | "dugout" | "board" | "tunnel" | "terminal";

export interface LandmarkDef {
  id: LandmarkId;
  kind: LandmarkKind;
  /** Where the ball must be for discovery (on the pitch plane). */
  position: Vec2;
  /** Where the physical structure stands. */
  structure: Vec3;
  /** Y rotation of the structure (radians). */
  rotation: number;
  /** World point the overlay anchors to. */
  anchor: Vec3;
  /** Content id: a project slug for boards. */
  contentId: string;
}

const northBoardZ = -(PITCH.halfWidth + BOARD.offset);

/** Project boards along the north touchline, evenly spaced (≥ 6 units apart, SPEC §5.1). */
const boardSpacing = 12;
const boards: LandmarkDef[] = projects.map((project, index) => {
  const x = (index - (projects.length - 1) / 2) * boardSpacing;
  return {
    id: `project:${project.slug}`,
    kind: "board",
    position: [x, -PITCH.halfWidth + 2.5],
    structure: [x, 0, northBoardZ],
    rotation: 0,
    anchor: [x, BOARD.height + 0.4, northBoardZ],
    contentId: project.slug,
  };
});

export const LANDMARKS: LandmarkDef[] = [
  {
    id: "profile",
    kind: "scoreboard",
    position: [0, 0],
    // On the north stand roofline, visible from the spawn camera.
    structure: [0, 14.2, -31.5],
    rotation: 0,
    anchor: [0, 3, 0],
    contentId: "profile",
  },
  {
    id: "experience",
    kind: "dugout",
    position: [0, PITCH.halfWidth - 3],
    structure: [0, 0, PITCH.halfWidth + 2.6],
    rotation: Math.PI,
    anchor: [0, 3.2, PITCH.halfWidth + 2.6],
    contentId: "experience",
  },
  {
    id: "contact",
    kind: "terminal",
    // West goal side.
    position: [-PITCH.halfLength + 4, GOAL.halfWidth + 5],
    structure: [-PITCH.halfLength - 2.2, 0, GOAL.halfWidth + 5],
    rotation: Math.PI / 2,
    anchor: [-PITCH.halfLength - 2.2, 3.2, GOAL.halfWidth + 5],
    contentId: "contact",
  },
  {
    id: "resume",
    kind: "tunnel",
    // East end, beside the goal: the players' entrance.
    position: [PITCH.halfLength - 4, -(GOAL.halfWidth + 6)],
    // Mouth at the front of the east stand; the canopy extends towards the pitch.
    structure: [GROUND.halfX + STAND.gap, 0, -(GOAL.halfWidth + 6)],
    rotation: -Math.PI / 2,
    anchor: [GROUND.halfX + STAND.gap - 2, 4, -(GOAL.halfWidth + 6)],
    contentId: "resume",
  },
  ...boards,
];

export const SPAWN: Vec2 = [0, 0];
