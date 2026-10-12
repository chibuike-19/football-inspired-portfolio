import { describe, expect, it } from "vitest";
import {
  JOURNEY_TIMING,
  planTransition,
  sampleTransition,
  stationFromScroll,
  type Pose,
  type StationCamera,
} from "@/core/journey";

const pose = (px: number, py: number, pz: number, tx = 0, ty = 0, tz = 0): Pose => ({ px, py, pz, tx, ty, tz });
const station = (chapter: StationCamera["chapter"], p: Pose, via?: Pose[]): StationCamera => ({ chapter, pose: p, via });
const close = (a: Pose, b: Pose) => Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz, a.tx - b.tx, a.ty - b.ty, a.tz - b.tz) < 1e-6;

describe("stationFromScroll", () => {
  it("maps each viewport of scroll to one station", () => {
    expect(stationFromScroll(0, 800, 10, -1)).toBe(0);
    expect(stationFromScroll(800, 800, 10, -1)).toBe(1);
    expect(stationFromScroll(800 * 9, 800, 10, -1)).toBe(9);
  });

  it("clamps to the available stations", () => {
    expect(stationFromScroll(-500, 800, 5, -1)).toBe(0);
    expect(stationFromScroll(99999, 800, 5, -1)).toBe(4);
  });

  it("holds the current station until clearly past the boundary (no flicker)", () => {
    // Just past halfway between station 2 and 3 → still 2.
    expect(stationFromScroll(800 * 2.55, 800, 10, 2)).toBe(2);
    // Clearly past → 3.
    expect(stationFromScroll(800 * 2.7, 800, 10, 2)).toBe(3);
    // Jitter around the boundary never flips back and forth.
    let current = 2;
    let changes = 0;
    for (let i = 0; i < 200; i++) {
      const next = stationFromScroll(800 * (2.5 + Math.sin(i) * 0.08), 800, 10, current);
      if (next !== current) changes++;
      current = next;
    }
    expect(changes).toBe(0);
  });

  it("reverses naturally: scrolling up returns to earlier stations", () => {
    expect(stationFromScroll(800 * 4.3, 800, 10, 5)).toBe(4);
  });
});

describe("planTransition", () => {
  const playbook = station("playbook", pose(0, 46, 6));
  const highlight = station("highlights", pose(-26, 4, -10), [pose(-14, 12, 4)]);
  const sameChapterNext = station("highlights", pose(-18, 4, -10));
  const fulltime = station("fulltime", pose(0, 30, 44));

  it("uses the designed route when moving forward into the next chapter", () => {
    const t = planTransition(playbook.pose, "playbook", highlight, { interrupted: false, reducedMotion: false });
    expect(t.points).toHaveLength(3);
    expect(t.duration).toBe(JOURNEY_TIMING.NEXT_CHAPTER);
    expect(t.ease).toBe("inOut");
  });

  it("is quick between stations of the same chapter", () => {
    const t = planTransition(highlight.pose, "highlights", sameChapterNext, { interrupted: false, reducedMotion: false });
    expect(t.duration).toBe(JOURNEY_TIMING.WITHIN_CHAPTER);
    expect(t.points).toHaveLength(2);
  });

  it("jumps directly across chapters without visiting the ones between", () => {
    const t = planTransition(pose(0, 16, 30), "kickoff", fulltime, { interrupted: false, reducedMotion: false });
    expect(t.duration).toBe(JOURNEY_TIMING.JUMP);
    expect(t.points.length).toBeLessThanOrEqual(3);
  });

  it("arcs long direct moves over the stands", () => {
    const t = planTransition(pose(-26, 4, -10), "highlights", fulltime, { interrupted: false, reducedMotion: false });
    const mid = t.points[1];
    expect(mid.py).toBeGreaterThan(Math.max(4, 30));
  });

  it("keeps momentum when redirected mid-move", () => {
    const t = planTransition(pose(5, 20, 10), "player", fulltime, { interrupted: true, reducedMotion: false });
    expect(t.ease).toBe("out");
  });

  it("cuts instantly with reduced motion", () => {
    const t = planTransition(playbook.pose, "playbook", highlight, { interrupted: false, reducedMotion: true });
    expect(t.duration).toBe(0);
    expect(close(sampleTransition(t, 0), highlight.pose)).toBe(true);
  });
});

describe("enclosed spaces (tunnel)", () => {
  const mouth = pose(34, 2, -10, 40, 2, -10);
  const inside = pose(38, 1.7, -10, 41, 1.6, -9);
  const back = pose(35, 2, -10, 28, 2, -10);
  const tunnel = { chapter: "journey" as const, pose: inside, enter: [{ points: [mouth] }], exit: { points: [back], except: ["trophies" as const] } };
  const trophies = station("trophies", pose(56, 2, -10, 60, 2, -10));
  const kickoff = station("kickoff", pose(0, 15, 31, 0, 2, -9));

  it("enters through the mouth from any chapter, including direct jumps", () => {
    for (const from of ["highlights", "kickoff", "fulltime"] as const) {
      const t = planTransition(pose(0, 20, 30), from, tunnel, { interrupted: false, reducedMotion: false });
      expect(t.points.some((p) => close(p, mouth)), from).toBe(true);
    }
  });

  it("leaves back through the mouth when going to an earlier chapter", () => {
    const t = planTransition(inside, "journey", kickoff, { interrupted: false, reducedMotion: false, from: tunnel });
    expect(close(t.points[1], back)).toBe(true);
  });

  it("does not turn back when continuing forward to the next chapter", () => {
    const t = planTransition(inside, "journey", trophies, { interrupted: false, reducedMotion: false, from: tunnel });
    expect(t.points.some((p) => close(p, back))).toBe(false);
  });

  it("picks the entry route by origin (doors from the tunnel, outside opening otherwise)", () => {
    const doorway = pose(51, 1.75, -10, 56, 1.6, -10);
    const opening = pose(63, 2, -18, 63, 1.6, -12);
    const room = {
      chapter: "trophies" as const,
      pose: pose(55, 1.75, -11, 58, 1.3, -6),
      enter: [{ from: ["journey" as const], points: [doorway] }, { points: [opening] }],
    };
    const fromTunnel = planTransition(inside, "journey", room, { interrupted: false, reducedMotion: false, from: tunnel });
    expect(fromTunnel.points.some((p) => close(p, doorway))).toBe(true);
    expect(fromTunnel.points.some((p) => close(p, opening))).toBe(false);
    const fromKickoff = planTransition(pose(0, 15, 31), "kickoff", room, { interrupted: false, reducedMotion: false });
    expect(fromKickoff.points.some((p) => close(p, opening))).toBe(true);
  });

  it("paces long routed moves by distance, within the cap", () => {
    const far = { chapter: "fulltime" as const, pose: pose(0, 22, 30, 0, 1, -6), enter: [{ points: [pose(60, 15, -22), pose(40, 17, -6)] }] };
    const t = planTransition(pose(64, 1.7, -11), "trophies", far, { interrupted: false, reducedMotion: false });
    expect(t.duration).toBeGreaterThan(JOURNEY_TIMING.NEXT_CHAPTER);
    expect(t.duration).toBeLessThanOrEqual(JOURNEY_TIMING.ROUTE_MAX);
  });

  it("moves between stops inside without waypoints", () => {
    const next = { ...tunnel, pose: pose(42, 1.7, -10, 45, 1.6, -9) };
    const t = planTransition(inside, "journey", next, { interrupted: false, reducedMotion: false, from: tunnel });
    expect(t.points).toHaveLength(2);
  });
});

describe("sampleTransition", () => {
  const from = pose(0, 10, 10, 0, 0, 0);
  const to = pose(20, 4, -10, 5, 1, -20);

  it("starts at the current pose and ends exactly at the station", () => {
    const t = planTransition(from, "player", station("playbook", to), { interrupted: false, reducedMotion: false });
    expect(close(sampleTransition(t, 0), from)).toBe(true);
    expect(close(sampleTransition(t, t.duration), to)).toBe(true);
    expect(close(sampleTransition(t, t.duration * 3), to)).toBe(true);
  });

  it("moves continuously (no jumps between frames)", () => {
    const t = planTransition(from, "player", station("playbook", to, [pose(10, 20, 0)]), { interrupted: false, reducedMotion: false });
    let previous = sampleTransition(t, 0);
    for (let s = 1 / 60; s <= t.duration; s += 1 / 60) {
      const next = sampleTransition(t, s);
      expect(Math.hypot(next.px - previous.px, next.py - previous.py, next.pz - previous.pz)).toBeLessThan(1.5);
      previous = next;
    }
  });

  it("redirecting from a mid-move pose is continuous", () => {
    const first = planTransition(from, "player", station("playbook", to), { interrupted: false, reducedMotion: false });
    const midway = sampleTransition(first, first.duration / 2);
    const second = planTransition(midway, "playbook", station("fulltime", pose(0, 30, 44)), { interrupted: true, reducedMotion: false });
    expect(close(sampleTransition(second, 0), midway)).toBe(true);
  });
});
