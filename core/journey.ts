/**
 * Scroll-driven journey (owner spec, 2026-10-12): pure scroll mapping and
 * camera transition planning. No React or three.js; unit-tested.
 *
 * The journey is a list of stations (one per readable moment). The camera rests
 * at a station's pose while the visitor reads, and moves only between stations.
 */

export type ChapterId = "kickoff" | "player" | "playbook" | "highlights" | "journey" | "trophies" | "fulltime";

export const CHAPTERS: { id: ChapterId; label: string }[] = [
  { id: "kickoff", label: "Kickoff" },
  { id: "player", label: "The Player" },
  { id: "playbook", label: "Playbook" },
  { id: "highlights", label: "Highlights" },
  { id: "journey", label: "Journey" },
  { id: "trophies", label: "Trophies" },
  { id: "fulltime", label: "Full Time" },
];

/** Camera position (p) and look-at target (t). */
export interface Pose {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
}

export interface StationCamera {
  chapter: ChapterId;
  pose: Pose;
  /** Alternative framing for portrait screens (phones), where the panel is a bottom sheet. */
  portrait?: Pose;
  /** Waypoints used when arriving from the previous chapter, for spatial continuity. */
  via?: Pose[];
  /**
   * Routes used whenever this station is reached from another chapter, so the
   * camera never passes through walls. The first route whose `from` includes
   * the departing chapter wins; a route without `from` is the default.
   */
  enter?: EnterRoute[];
  /** Waypoints used when leaving for another chapter, except the chapters listed (reached directly). */
  exit?: { points: Pose[]; except?: ChapterId[] };
  /** Seconds for moves between stations of this chapter (default WITHIN_CHAPTER). */
  withinDuration?: number;
}

export interface EnterRoute {
  from?: ChapterId[];
  points: Pose[];
}

/** The entry route for arriving from `fromChapter`, if any. */
export function enterRoute(to: StationCamera, fromChapter: ChapterId | null): Pose[] {
  const routes = to.enter ?? [];
  const match = routes.find((r) => fromChapter !== null && r.from?.includes(fromChapter)) ?? routes.find((r) => !r.from);
  return match?.points ?? [];
}

export const JOURNEY_TIMING = {
  /** Within a chapter (project → project, company → company). */
  WITHIN_CHAPTER: 0.8,
  /** Between neighbouring chapters, along their designed route. */
  NEXT_CHAPTER: 1.6,
  /** Jumps across several chapters: short and direct. */
  JUMP: 1.2,
  /** First establishing move when the stadium appears. */
  INTRO: 2.6,
  /** Replay: back to the opening composition. */
  REPLAY: 1.8,
  /** Scroll hysteresis, in stations: avoids flicker at boundaries. */
  HYSTERESIS: 0.12,
  /** Direct jumps longer than this arc upwards so they never cut through the stands. */
  ARC_MIN_DISTANCE: 15,
  /** Routed moves (through openings) travel at about this speed (units/s)… */
  ROUTE_SPEED: 22,
  /** …but never take longer than this. */
  ROUTE_MAX: 2.6,
} as const;

/**
 * Active station for a scroll position. Each station owns one viewport of
 * scroll; the active station changes only once the visitor is clearly past the
 * boundary (hysteresis), so small scroll jitters never retarget the camera.
 */
export function stationFromScroll(scrollTop: number, viewport: number, count: number, current: number): number {
  if (count <= 0 || viewport <= 0) return 0;
  const position = scrollTop / viewport;
  const nearest = Math.min(count - 1, Math.max(0, Math.round(position)));
  if (current < 0 || current >= count) return nearest;
  return Math.abs(position - current) < 0.5 + JOURNEY_TIMING.HYSTERESIS ? current : nearest;
}

export interface Transition {
  points: Pose[];
  duration: number;
  /** "inOut" from rest; "out" when redirected mid-move, so it keeps its momentum. */
  ease: "inOut" | "out";
}

export type TransitionKind = "move" | "intro" | "replay";

const distance = (a: Pose, b: Pose) => Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz);

const chapterIndex = (chapter: ChapterId) => CHAPTERS.findIndex((c) => c.id === chapter);

/**
 * Plans the camera move from the current pose to a station. Neighbouring
 * chapters use the arriving station's designed waypoints; longer jumps go
 * directly (arcing over the stands); moves within a chapter are short.
 */
export function planTransition(
  current: Pose,
  fromChapter: ChapterId | null,
  to: StationCamera,
  options: { interrupted: boolean; reducedMotion: boolean; kind?: TransitionKind; from?: StationCamera | null },
): Transition {
  const kind = options.kind ?? "move";
  if (options.reducedMotion) return { points: [current, to.pose], duration: 0, ease: "out" };

  let duration: number;
  let via: Pose[] = [];
  const gap = fromChapter ? Math.abs(chapterIndex(to.chapter) - chapterIndex(fromChapter)) : 1;

  if (kind === "intro") duration = JOURNEY_TIMING.INTRO;
  else if (kind === "replay") duration = JOURNEY_TIMING.REPLAY;
  else if (gap === 0) duration = to.withinDuration ?? JOURNEY_TIMING.WITHIN_CHAPTER;
  else if (gap === 1 && !options.interrupted && chapterIndex(to.chapter) > chapterIndex(fromChapter!)) {
    // Forward into the next chapter: take the designed route.
    duration = JOURNEY_TIMING.NEXT_CHAPTER;
    via = to.via ?? [];
  } else {
    duration = gap === 1 ? JOURNEY_TIMING.NEXT_CHAPTER : JOURNEY_TIMING.JUMP;
  }

  // Enclosed spaces: leave and enter through their openings.
  const changingChapter = gap > 0 && kind === "move";
  const exitRoute = options.from?.exit;
  const exit =
    changingChapter && exitRoute && !(exitRoute.except ?? []).includes(to.chapter) ? exitRoute.points : [];
  const enter = changingChapter ? enterRoute(to, fromChapter) : [];
  if (exit.length > 0 || enter.length > 0) {
    via = [...exit, ...(enter.length > 0 ? enter : via)];
    // Pace by distance, so long routes (e.g. over the stand) aren't rushed.
    const points = [current, ...via, to.pose];
    let length = 0;
    for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
    duration = Math.min(JOURNEY_TIMING.ROUTE_MAX, Math.max(duration, JOURNEY_TIMING.NEXT_CHAPTER, length / JOURNEY_TIMING.ROUTE_SPEED));
  }

  if (via.length === 0 && distance(current, to.pose) > JOURNEY_TIMING.ARC_MIN_DISTANCE) {
    // Lift the midpoint so long direct moves pass over the stands, not through them.
    const lift = Math.min(18, distance(current, to.pose) * 0.15);
    via = [
      {
        px: (current.px + to.pose.px) / 2,
        py: Math.max(current.py, to.pose.py) + lift,
        pz: (current.pz + to.pose.pz) / 2,
        tx: (current.tx + to.pose.tx) / 2,
        ty: (current.ty + to.pose.ty) / 2,
        tz: (current.tz + to.pose.tz) / 2,
      },
    ];
  }

  return { points: [current, ...via, to.pose], duration, ease: options.interrupted ? "out" : "inOut" };
}

const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

/** Catmull-Rom interpolation of one coordinate through the given values. */
function spline(values: number[], u: number): number {
  if (values.length === 1) return values[0];
  const segments = values.length - 1;
  const scaled = Math.min(u, 1) * segments;
  const i = Math.min(segments - 1, Math.floor(scaled));
  const t = scaled - i;
  const p0 = values[Math.max(0, i - 1)];
  const p1 = values[i];
  const p2 = values[i + 1];
  const p3 = values[Math.min(values.length - 1, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Pose along a transition after `elapsed` seconds. */
export function sampleTransition(transition: Transition, elapsed: number): Pose {
  const { points, duration } = transition;
  const u = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration));
  const e = transition.ease === "out" ? easeOut(u) : easeInOut(u);
  const pick = (key: keyof Pose) => spline(points.map((p) => p[key]), e);
  return { px: pick("px"), py: pick("py"), pz: pick("pz"), tx: pick("tx"), ty: pick("ty"), tz: pick("tz") };
}

export const transitionDone = (transition: Transition, elapsed: number) => elapsed >= transition.duration;
