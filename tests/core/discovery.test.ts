import { describe, expect, it } from "vitest";
import { DISCOVERY } from "@/core/config";
import { createDiscovery, stepDiscovery, type DiscoveryLandmark } from "@/core/discovery";

const make = (id: string, x: number, z: number, priority = 0): DiscoveryLandmark => ({
  id,
  x,
  z,
  nearRadius: DISCOVERY.DEFAULT_NEAR_RADIUS,
  activeRadius: DISCOVERY.DEFAULT_ACTIVE_RADIUS,
  priority,
});

const DT = 1 / 60;
const at = (x: number, z: number, vx = 0, vz = 0) => ({ x, z, vx, vz });

/** Steps `seconds` at a fixed position. */
function hold(d: ReturnType<typeof createDiscovery>, landmarks: DiscoveryLandmark[], ball: ReturnType<typeof at>, seconds: number) {
  for (let t = 0; t < seconds; t += DT) stepDiscovery(d, landmarks, ball, DT);
}

describe("discovery states", () => {
  const board = [make("board", 0, 0)];

  it("goes idle → near → active as the ball approaches", () => {
    const d = createDiscovery(board);
    stepDiscovery(d, board, at(10, 0), DT);
    expect(d.states.board).toBe("idle");
    stepDiscovery(d, board, at(6, 0), DT);
    expect(d.states.board).toBe("near");
    const step = stepDiscovery(d, board, at(3, 0), DT);
    expect(d.states.board).toBe("active");
    expect(d.activeId).toBe("board");
    expect(step.changed).toBe(true);
  });

  it("reports no change when nothing changed", () => {
    const d = createDiscovery(board);
    stepDiscovery(d, board, at(3, 0), DT);
    expect(stepDiscovery(d, board, at(3.1, 0), DT).changed).toBe(false);
  });

  it("does not flicker when the ball jitters on the activation boundary", () => {
    const d = createDiscovery(board);
    stepDiscovery(d, board, at(3.9, 0), DT);
    expect(d.activeId).toBe("board");
    let changes = 0;
    for (let i = 0; i < 300; i++) {
      // Oscillate across the 4-unit activation radius (inside the 5-unit exit radius).
      const x = 4 + Math.sin(i) * 0.3;
      if (stepDiscovery(d, board, at(x, 0), DT).changed) changes++;
    }
    expect(changes).toBe(0);
    expect(d.activeId).toBe("board");
  });

  it("stays active through the grace period, then deactivates", () => {
    const d = createDiscovery(board);
    stepDiscovery(d, board, at(2, 0), DT);
    const step = stepDiscovery(d, board, at(5.5, 0), DT); // beyond the exit radius
    expect(d.activeId).toBe("board");
    expect(step.pending).toBe(true);
    hold(d, board, at(5.5, 0), DISCOVERY.EXIT_GRACE + 0.05);
    expect(d.activeId).toBeNull();
    expect(d.states.board).toBe("near");
  });

  it("re-entering during the grace period cancels the exit", () => {
    const d = createDiscovery(board);
    stepDiscovery(d, board, at(2, 0), DT);
    hold(d, board, at(5.5, 0), DISCOVERY.EXIT_GRACE * 0.6);
    stepDiscovery(d, board, at(3, 0), DT);
    hold(d, board, at(5.5, 0), DISCOVERY.EXIT_GRACE * 0.6);
    expect(d.activeId).toBe("board");
  });
});

describe("choosing between landmarks", () => {
  // Two boards 6 apart: their activation areas overlap between them.
  const pair = [make("left", -3, 0), make("right", 3, 0)];

  it("keeps at most one landmark active", () => {
    const d = createDiscovery(pair);
    stepDiscovery(d, pair, at(0, 0), DT);
    const active = Object.values(d.states).filter((s) => s === "active");
    expect(active).toHaveLength(1);
  });

  it("holds the current landmark until a challenger is clearly closer", () => {
    const d = createDiscovery(pair);
    stepDiscovery(d, pair, at(-1, 0), DT);
    expect(d.activeId).toBe("left");
    // Just past the midpoint: right is closer, but not by the switch margin.
    stepDiscovery(d, pair, at(0.5, 0), DT);
    expect(d.activeId).toBe("left");
    // Clearly closer to the right board now.
    stepDiscovery(d, pair, at(1.5, 0), DT);
    expect(d.activeId).toBe("right");
  });

  it("does not ping-pong while drifting around the midpoint", () => {
    const d = createDiscovery(pair);
    stepDiscovery(d, pair, at(-0.5, 0), DT);
    let changes = 0;
    for (let i = 0; i < 300; i++) if (stepDiscovery(d, pair, at(Math.sin(i / 7) * 0.6, 0), DT).changed) changes++;
    expect(changes).toBe(0);
  });

  it("prefers the landmark the ball is heading towards", () => {
    const d = createDiscovery(pair);
    // Equidistant, moving right.
    stepDiscovery(d, pair, at(0, 0, 5, 0), DT);
    expect(d.activeId).toBe("right");
    const e = createDiscovery(pair);
    stepDiscovery(e, pair, at(0, 0, -5, 0), DT);
    expect(e.activeId).toBe("left");
  });

  it("breaks exact ties by priority, then deterministically by id", () => {
    const prioritised = [make("a", -3, 0), make("b", 3, 0, 1)];
    const d = createDiscovery(prioritised);
    stepDiscovery(d, prioritised, at(0, 0), DT);
    expect(d.activeId).toBe("b");
    const e = createDiscovery(pair);
    stepDiscovery(e, pair, at(0, 0), DT);
    expect(e.activeId).toBe("left");
  });

  it("hands over immediately when rolling from one landmark straight into another", () => {
    const apart = [make("one", 0, 0), make("two", 8.5, 0)];
    const d = createDiscovery(apart);
    stepDiscovery(d, apart, at(0, 0), DT);
    // At 5.2 the first is outside its exit radius and the second is a candidate.
    stepDiscovery(d, apart, at(5.2, 0), DT);
    expect(d.activeId).toBe("two");
  });
});
