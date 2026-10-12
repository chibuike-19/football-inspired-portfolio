import { experience, profile, projects, trophies } from "@/content";
import type { ChapterId, Pose, StationCamera } from "@/core/journey";
import type { ScoreboardText } from "@/state/store";
import { formatRange } from "@/lib/format";
import { LANDMARK_BY_ID } from "../landmarks";
import { ROOM, TUNNEL } from "../layout";

/**
 * The journey as a list of stations (owner spec, 2026-10-12). Each station is a
 * resting point: where the camera sits, where the ball is, what the scoreboard
 * says, which stadium object is highlighted and which panel is shown.
 */

export type PanelSpec =
  | { kind: "kickoff" }
  | { kind: "player" }
  | { kind: "playbook" }
  | { kind: "project"; slug: string }
  | { kind: "experience"; id: string }
  | { kind: "trophy"; id: string }
  | { kind: "fulltime" };

export interface JourneyStation extends StationCamera {
  id: string;
  index: number;
  /** For the progress indicator and screen-reader announcements. */
  label: string;
  ball: { x: number; z: number };
  scoreboard: ScoreboardText | null;
  /** Landmark to emphasise (board, tunnel, scoreboard). */
  highlight: string | null;
  /** Push the other project boards below their ambient level so the highlighted one stands out. */
  dimBoards?: boolean;
  /**
   * Shown while the camera travels in from the previous chapter, replaced by
   * `scoreboard` / `highlight` as it arrives (spec transition 04 → 05).
   */
  arriving?: { scoreboard: ScoreboardText | null; highlight: string | null };
  panel: PanelSpec;
  /** Where the panel sits on wide screens, chosen to keep the focus object clear. */
  side: "left" | "right";
  /** Position within a multi-station chapter (projects, companies, trophies). */
  sub?: { index: number; total: number };
}

const pose = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Pose => ({ px, py, pz, tx, ty, tz });

/** Before the first station: a high, wide establishing shot. */
export const ESTABLISHING_POSE = pose(-18, 38, 62, 0, 0, -4);
/** Camera stop (x) for company `i` of `count` along the tunnel; the last sits just before the doors. */
export function tunnelStop(i: number, count: number): number {
  const first = TUNNEL.start + 3.4;
  const last = TUNNEL.end - 2.6;
  return count <= 1 ? last : first + ((last - first) * i) / (count - 1);
}

/** Trophy display (x) for trophy `i`. */
export const trophyDisplay = (i: number) => ROOM.firstDisplay + i * ROOM.displaySpacing;

/** Where the ball starts before rolling towards the centre circle. */
export const BALL_START = { x: -14, z: 9 };

const KICKOFF_POSE = pose(0, 15, 31, 0, 2, -9);
// High behind the south touchline, level enough that the pitch, the ball on the
// centre spot and the scoreboard above the north stand are all in frame.
const FULLTIME_POSE = pose(0, 17, 33, 0, 4.5, -12);

/**
 * Portrait screens: further back and aimed at the ground in front of the
 * structure, so the structure sits in the upper half above the bottom sheet.
 */
function facingPortrait(structure: readonly [number, number, number], rotation: number): Pose {
  const fx = Math.sin(rotation);
  const fz = Math.cos(rotation);
  return pose(structure[0] + fx * 16, 7.5, structure[2] + fz * 16, structure[0] + fx * 8, 0, structure[2] + fz * 8);
}

/** A camera that looks at a structure head-on from in front of it. */
function facing(structure: readonly [number, number, number], rotation: number, distance: number, height: number): Pose {
  const fx = Math.sin(rotation);
  const fz = Math.cos(rotation);
  return pose(
    structure[0] + fx * distance,
    height,
    structure[2] + fz * distance,
    structure[0] + fx * 1.5,
    1.4,
    structure[2] + fz * 1.5,
  );
}

function build(): JourneyStation[] {
  const list: Omit<JourneyStation, "index">[] = [];

  list.push({
    id: "kickoff",
    chapter: "kickoff",
    label: "Kickoff",
    pose: KICKOFF_POSE,
    // Phones: higher and looking down, so pitch and ball sit above the sheet.
    portrait: pose(0, 24, 26, 0, 0, 7),
    ball: { x: -3.5, z: 3 },
    scoreboard: null,
    highlight: null,
    panel: { kind: "kickoff" },
    side: "left",
  });

  list.push({
    id: "player",
    chapter: "player",
    label: "Meet the player",
    // Lower and closer to the centre circle; the scoreboard stays in view above.
    pose: pose(1.6, 3.6, 8.5, 0, 4.5, -20),
    portrait: pose(0, 8, 13, 0, 0, 5),
    ball: { x: 0, z: 0 },
    scoreboard: { kicker: "The starting XI", title: `Player 01 — ${profile.name}`, lines: [profile.headline] },
    highlight: "profile",
    panel: { kind: "player" },
    side: "left",
  });

  list.push({
    id: "playbook",
    chapter: "playbook",
    label: "The playbook",
    // Overhead tactical view; the route rises straight up from the centre circle.
    // Centred so the formation fills the space right of the panel.
    pose: pose(-3, 44, 9, -3, 0, 0.5),
    // Phones: the pitch runs top to bottom (attack at the top), above the bottom sheet.
    portrait: pose(33, 56, 0, 24, 0, 0),
    via: [pose(3, 18, 10, 2, 1, -2)],
    ball: { x: 0, z: 0 },
    scoreboard: { kicker: "Tactics", title: "The playbook", lines: ["The technologies behind the game"] },
    highlight: null,
    panel: { kind: "playbook" },
    side: "left",
  });

  projects.forEach((project, i) => {
    const board = LANDMARK_BY_ID.get(`project:${project.slug}`)!;
    list.push({
      id: `project:${project.slug}`,
      chapter: "highlights",
      label: `Highlights · ${project.name}`,
      pose: facing(board.structure, board.rotation, 12, 3.6),
      portrait: facingPortrait(board.structure, board.rotation),
      // First project: tilt back to stadium level and follow the ball towards the boards.
      via: i === 0 ? [pose(board.structure[0] * 0.5, 14, 6, board.structure[0] * 0.8, 1, -16)] : undefined,
      // Near the board, not under the camera.
      ball: { x: board.position[0], z: board.position[1] - (board.rotation === 0 ? 2 : 0) },
      scoreboard: { kicker: "Career highlights", title: project.name, lines: [project.context ?? ""] },
      highlight: board.id,
      dimBoards: true,
      panel: { kind: "project", slug: project.slug },
      side: "left",
      sub: { index: i, total: projects.length },
    });
  });

  // The players' tunnel: one stop per company along the corridor, branding on
  // the right-hand (south) wall, the trophy-room doors at the far end.
  const tunnel = LANDMARK_BY_ID.get("resume")!;
  const zc = TUNNEL.z;
  const tunnelEnter = [pose(26, 3.6, zc, TUNNEL.start, 2, zc), pose(TUNNEL.start - 1.6, 1.8, zc, TUNNEL.start + 6, 1.7, zc)];
  const tunnelExit = [pose(TUNNEL.start + 1, 1.9, zc, TUNNEL.start - 8, 1.9, zc), pose(28, 4.5, zc, 12, 1, -4)];
  experience.forEach((entry, i) => {
    const position = entry.positions[0];
    const x = tunnelStop(i, experience.length);
    list.push({
      id: `experience:${entry.id}`,
      chapter: "journey",
      label: `Journey · ${entry.company}`,
      // Looking down the corridor, angled slightly towards the company's wall sign.
      pose: pose(x - 3.4, 1.65, zc - 0.55, x + 2.6, 1.5, zc + 0.95),
      portrait: pose(x - 4.4, 2.1, zc - 0.7, x + 1.2, 1.25, zc + 1.0),
      enter: [{ points: tunnelEnter }],
      // Forward into the trophy room goes straight through the doors.
      exit: { points: tunnelExit, except: ["trophies"] },
      ball: { x: tunnel.position[0], z: tunnel.position[1] },
      scoreboard: { kicker: "Match history", title: entry.company, lines: [`${position.title} · ${formatRange(position)}`] },
      highlight: "resume",
      // Leaving the highlights: the boards settle, the scoreboard bridges the story, the tunnel lights up.
      arriving:
        i === 0
          ? { scoreboard: { kicker: "Career highlights", title: "Every highlight has a story", lines: [] }, highlight: "resume" }
          : undefined,
      panel: { kind: "experience", id: entry.id },
      side: "left",
      sub: { index: i, total: experience.length },
    });
  });

  // Trophy cabinet: one display per trophy along the room's south wall.
  const rz = ROOM.z;
  const doorway = [pose(TUNNEL.end - 1.2, 1.75, zc, TUNNEL.end + 4, 1.6, zc)];
  // Routes between the room's north opening and the stadium, over the east stand.
  // Separate poses per direction so the camera always faces where it is going.
  const ox = (ROOM.openingStart + ROOM.openingEnd) / 2;
  const northWall = ROOM.z - ROOM.halfWidth;
  const inbound = [
    pose(40, 17, -6, 62, 2, -16),
    pose(58, 15, northWall - 7, ox, 1.6, rz),
    pose(ox, 2.6, northWall - 3.5, ox, 1.6, rz),
    pose(ox, 1.9, northWall + 1.4, ox + 2, 1.5, rz + 3),
  ];
  const outbound = [
    pose(ox, 1.9, northWall + 1.4, ox, 2, northWall - 6),
    pose(ox, 2.8, northWall - 3.5, 40, 6, -14),
    pose(58, 15, northWall - 7, 30, 2, -6),
    pose(40, 17, -6, 4, 0, -4),
  ];
  const trophyExit = { points: outbound, except: ["journey", "fulltime"] as ChapterId[] };
  trophies.forEach((trophy, i) => {
    const x = trophyDisplay(i);
    list.push({
      id: `trophy:${trophy.id}`,
      chapter: "trophies",
      label: `Trophies · ${trophy.title}`,
      pose: pose(x - 2.5, 1.75, rz - 1.4, x + 0.5, 1.4, rz + ROOM.halfWidth - 1.4),
      portrait: pose(x - 3.4, 2.4, rz - 2.8, x + 0.2, 1.1, rz + ROOM.halfWidth - 1.4),
      enter: [
        { from: ["journey"], points: doorway },
        { points: inbound },
      ],
      exit: trophyExit,
      withinDuration: 1.1,
      ball: { x: tunnel.position[0], z: tunnel.position[1] },
      scoreboard: { kicker: "Trophy cabinet", title: trophy.title, lines: [trophy.context] },
      highlight: null,
      panel: { kind: "trophy", id: trophy.id },
      side: "left",
      sub: { index: i, total: trophies.length },
    });
  });

  list.push({
    id: "fulltime",
    chapter: "fulltime",
    label: "Full time",
    pose: FULLTIME_POSE,
    portrait: pose(0, 30, 30, 0, 0, 13),
    via: [pose(20, 30, 26, 4, 2, -4)],
    // From the trophy room: turn to the opening, step outside, rise over the east stand
    // and let the pitch come into view (spec transition 07).
    enter: [{ from: ["trophies"], points: outbound }],
    // The ball returns to the centre circle: the journey ends where it started.
    ball: { x: 0, z: 0 },
    scoreboard: { kicker: "Final whistle", title: "Full time", lines: ["The next match starts here"] },
    highlight: "profile",
    panel: { kind: "fulltime" },
    side: "left",
  });

  return list.map((station, index) => ({ ...station, index }));
}

export const STATIONS: JourneyStation[] = build();

/** First station of each chapter, for the chapter navigation. */
export function chapterStart(chapter: ChapterId): number {
  return STATIONS.findIndex((station) => station.chapter === chapter);
}

export const stationById = (id: string) => STATIONS.find((station) => station.id === id);
