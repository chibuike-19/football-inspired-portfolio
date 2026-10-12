import { projects } from "@/content";
import { CAMERA, DISCOVERY } from "@/core/config";
import type { DiscoveryLandmark } from "@/core/discovery";
import { BOARD, GOAL, GROUND, PITCH, STAND, TUNNEL } from "./layout";

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
  /** World point the overlay anchors to (top-centre of what the visitor should see). */
  anchor: Vec3;
  /** Visible size around the anchor in world units: [half width, depth below the anchor]. */
  extent: readonly [halfWidth: number, below: number];
  /** Content id: a project slug for boards. */
  contentId: string;
  /** Short name for labels and screen-reader announcements. */
  title: string;
  /** "anchor": beside the structure; "dock": a lower screen corner (for landmarks the ball sits on). */
  preview: "anchor" | "dock";
  nearRadius: number;
  activeRadius: number;
  priority: number;
}

/**
 * Yaw that turns a display at `structure` towards where the follow camera sits
 * when the ball is at `position` (the camera always looks north from behind).
 */
export function yawTowardsCamera(structure: Vec3, position: Vec2): number {
  const cameraX = position[0];
  const cameraZ = Math.min(position[1] + CAMERA.DISTANCE, CAMERA.MAX_Z);
  return Math.atan2(cameraX - structure[0], cameraZ - structure[2]);
}

const northBoardZ = -(PITCH.halfWidth + BOARD.offset);

/**
 * Project boards along the north touchline in two groups, leaving the centre
 * for the technical area. The camera always faces north, so everything on this
 * side reads head-on. Spacing equals two activation radii, so zones never overlap.
 */
const BOARD_GAP = 10; // centre line to the first board on each side
const BOARD_SPACING = 2 * DISCOVERY.DEFAULT_ACTIVE_RADIUS;
function boardX(index: number, count: number): number {
  const leftCount = Math.ceil(count / 2);
  return index < leftCount
    ? -(BOARD_GAP + (leftCount - 1 - index) * BOARD_SPACING)
    : BOARD_GAP + (index - leftCount) * BOARD_SPACING;
}

/** The north touchline fits this many boards with non-overlapping activation zones. */
export const NORTH_BOARD_SLOTS = 6;

/**
 * Overflow boards stand at the ends beside the goals, turned towards the camera.
 * East first: the journey's highlights sweep west to east and end beside the
 * players' tunnel. East is opposite the tunnel; west is opposite the contact kiosk.
 */
const END_SLOTS: { side: -1 | 1; z: number }[] = [
  { side: 1, z: GOAL.halfWidth + 4.8 },
  { side: -1, z: -(GOAL.halfWidth + 4.8) },
];

const northProjects = projects.slice(0, NORTH_BOARD_SLOTS);

const boards: LandmarkDef[] = projects.map((project, index): LandmarkDef => {
  const shared = {
    id: `project:${project.slug}` as const,
    kind: "board" as const,
    extent: [BOARD.width / 2, BOARD.height + 0.4] as const,
    contentId: project.slug,
    title: project.name,
    preview: "anchor" as const,
    nearRadius: 6,
    activeRadius: DISCOVERY.DEFAULT_ACTIVE_RADIUS,
    priority: 1,
  };
  if (index < NORTH_BOARD_SLOTS) {
    const x = boardX(index, northProjects.length);
    return {
      ...shared,
      position: [x, -PITCH.halfWidth + 2.5],
      structure: [x, 0, northBoardZ],
      rotation: 0,
      anchor: [x, BOARD.height + 0.4, northBoardZ],
    };
  }
  const slot = END_SLOTS[index - NORTH_BOARD_SLOTS];
  if (!slot) throw new Error(`No stadium slot for project board ${project.slug}: add a slot in world/landmarks.ts`);
  const x = slot.side * (PITCH.halfLength + GOAL.depth + 1.6);
  const position: Vec2 = [slot.side * (PITCH.halfLength - 4), slot.z];
  const structure: Vec3 = [x, 0, slot.z];
  return {
    ...shared,
    position,
    structure,
    rotation: yawTowardsCamera(structure, position),
    anchor: [x, BOARD.height + 0.4, slot.z],
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
    extent: [1, 3],
    contentId: "profile",
    title: "Profile",
    preview: "dock",
    nearRadius: DISCOVERY.DEFAULT_NEAR_RADIUS,
    activeRadius: 4.5,
    priority: 0,
  },
  {
    id: "experience",
    kind: "dugout",
    // Centre of the north touchline, between the two groups of boards.
    position: [0, -PITCH.halfWidth + 2.5],
    structure: [0, 0, northBoardZ - 1.8],
    rotation: 0,
    anchor: [0, 4.1, northBoardZ - 1.8],
    extent: [7.5, 4.1],
    contentId: "experience",
    title: "Experience",
    preview: "anchor",
    nearRadius: DISCOVERY.DEFAULT_NEAR_RADIUS,
    activeRadius: DISCOVERY.DEFAULT_ACTIVE_RADIUS,
    priority: 0,
  },
  {
    id: "contact",
    kind: "terminal",
    // West goal side.
    position: [-PITCH.halfLength + 4, GOAL.halfWidth + 5],
    structure: [-PITCH.halfLength - 2.2, 0, GOAL.halfWidth + 5],
    rotation: Math.PI / 2,
    anchor: [-PITCH.halfLength - 2.2, 3.2, GOAL.halfWidth + 5],
    extent: [1.6, 3.2],
    contentId: "contact",
    title: "Contact",
    preview: "anchor",
    nearRadius: DISCOVERY.DEFAULT_NEAR_RADIUS,
    activeRadius: DISCOVERY.DEFAULT_ACTIVE_RADIUS,
    priority: 0,
  },
  {
    id: "resume",
    kind: "tunnel",
    // East end, beside the goal: the players' entrance.
    // Discovery spot sits a little north of centre so it stays clear of the nearest board's area.
    position: [PITCH.halfLength - 4, -(GOAL.halfWidth + 4.8)],
    // Mouth at the front of the east stand; the canopy extends towards the pitch.
    structure: [TUNNEL.start, 0, TUNNEL.z],
    rotation: -Math.PI / 2,
    // Top of the sign above the tunnel mouth, so the card sits above the sign.
    anchor: [GROUND.halfX + STAND.gap, 6.3, -(GOAL.halfWidth + 6)],
    extent: [2.6, 6.3],
    contentId: "resume",
    title: "Résumé",
    preview: "anchor",
    nearRadius: DISCOVERY.DEFAULT_NEAR_RADIUS,
    activeRadius: DISCOVERY.DEFAULT_ACTIVE_RADIUS,
    priority: 0,
  },
  ...boards,
];

export const SPAWN: Vec2 = [0, 0];

export const LANDMARK_BY_ID = new Map<string, LandmarkDef>(LANDMARKS.map((landmark) => [landmark.id, landmark]));

/**
 * Where the camera eases its view when a landmark is active: the structure
 * itself, except the scoreboard, which the default framing already shows.
 */
export function cameraFocus(landmark: LandmarkDef): { x: number; z: number } | null {
  return landmark.kind === "scoreboard" ? null : { x: landmark.structure[0], z: landmark.structure[2] };
}

/** Discovery input derived from the scene definitions. */
export const DISCOVERY_LANDMARKS: DiscoveryLandmark[] = LANDMARKS.map((l) => ({
  id: l.id,
  x: l.position[0],
  z: l.position[1],
  nearRadius: l.nearRadius,
  activeRadius: l.activeRadius,
  priority: l.priority,
}));
