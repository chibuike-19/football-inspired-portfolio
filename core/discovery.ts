import { DISCOVERY } from "./config";

export type ProximityState = "idle" | "near" | "active";

export interface DiscoveryLandmark {
  id: string;
  x: number;
  z: number;
  nearRadius: number;
  activeRadius: number;
  /** Higher wins ties. */
  priority: number;
}

export interface DiscoveryBall {
  x: number;
  z: number;
  vx: number;
  vz: number;
}

export interface Discovery {
  states: Record<string, ProximityState>;
  activeId: string | null;
  /** Landmarks currently inside their (hysteresis-adjusted) active radius. */
  candidates: Set<string>;
  near: Set<string>;
  /** Seconds the active landmark has been outside its active radius. */
  graceTime: number;
}

export function createDiscovery(landmarks: readonly DiscoveryLandmark[]): Discovery {
  return {
    states: Object.fromEntries(landmarks.map((l) => [l.id, "idle" as ProximityState])),
    activeId: null,
    candidates: new Set(),
    near: new Set(),
    graceTime: 0,
  };
}

/** Lower is better: distance, minus a bonus for landmarks the ball is heading towards. */
function score(landmark: DiscoveryLandmark, ball: DiscoveryBall, distance: number): number {
  const speed = Math.hypot(ball.vx, ball.vz);
  if (speed < DISCOVERY.DIRECTION_MIN_SPEED || distance < 1e-6) return distance;
  const heading = (ball.vx * (landmark.x - ball.x) + ball.vz * (landmark.z - ball.z)) / (speed * distance);
  return distance - DISCOVERY.DIRECTION_BONUS * Math.max(0, heading);
}

function better(a: { score: number; priority: number; id: string }, b: { score: number; priority: number; id: string }) {
  if (a.score !== b.score) return a.score < b.score;
  if (a.priority !== b.priority) return a.priority > b.priority;
  return a.id < b.id; // deterministic final tie-break
}

export interface DiscoveryStep {
  /** States or the active landmark changed: publish to the UI. */
  changed: boolean;
  /** A grace timer is running: keep stepping even if the ball is still. */
  pending: boolean;
}

/**
 * Advances discovery (SPEC §7.4). Mutates `discovery`. At most one landmark is
 * active; switching between candidates needs a clear margin, and leaving one
 * waits out a short grace period.
 */
export function stepDiscovery(
  discovery: Discovery,
  landmarks: readonly DiscoveryLandmark[],
  ball: DiscoveryBall,
  dt: number,
): DiscoveryStep {
  const pad = DISCOVERY.EXIT_PADDING;
  let best: { id: string; score: number; priority: number } | null = null;
  let currentScore: number | null = null;

  for (const landmark of landmarks) {
    const distance = Math.hypot(ball.x - landmark.x, ball.z - landmark.z);

    const wasNear = discovery.near.has(landmark.id);
    if (wasNear ? distance > landmark.nearRadius + pad : distance >= landmark.nearRadius) {
      discovery.near.delete(landmark.id);
    } else {
      discovery.near.add(landmark.id);
    }

    const wasCandidate = discovery.candidates.has(landmark.id);
    const isCandidate = wasCandidate ? distance <= landmark.activeRadius + pad : distance < landmark.activeRadius;
    if (!isCandidate) {
      discovery.candidates.delete(landmark.id);
      continue;
    }
    discovery.candidates.add(landmark.id);
    const entry = { id: landmark.id, score: score(landmark, ball, distance), priority: landmark.priority };
    if (landmark.id === discovery.activeId) currentScore = entry.score;
    else if (!best || better(entry, best)) best = entry;
  }

  const previousActive = discovery.activeId;
  let pending = false;

  if (discovery.activeId && currentScore !== null) {
    // Still inside: hold unless a challenger is clearly better.
    discovery.graceTime = 0;
    if (best && best.score < currentScore - DISCOVERY.SWITCH_MARGIN) discovery.activeId = best.id;
  } else if (discovery.activeId) {
    if (best) {
      // Rolled straight from one landmark into another: hand over immediately.
      discovery.activeId = best.id;
      discovery.graceTime = 0;
    } else {
      discovery.graceTime += dt;
      if (discovery.graceTime >= DISCOVERY.EXIT_GRACE) {
        discovery.activeId = null;
        discovery.graceTime = 0;
      } else {
        pending = true;
      }
    }
  } else if (best) {
    discovery.activeId = best.id;
  }

  let changed = discovery.activeId !== previousActive;
  for (const landmark of landmarks) {
    const next: ProximityState =
      landmark.id === discovery.activeId ? "active" : discovery.near.has(landmark.id) ? "near" : "idle";
    if (discovery.states[landmark.id] !== next) {
      discovery.states[landmark.id] = next;
      changed = true;
    }
  }
  return { changed, pending };
}
