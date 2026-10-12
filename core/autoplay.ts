/**
 * Journey autoplay (owner request, 2026-10-12): from kickoff the story advances
 * by itself, resting a few seconds at each station after the camera arrives.
 * Pure: the caller ticks it with elapsed time and acts on `advance`.
 */

export const AUTOPLAY = {
  /** Seconds to rest at a station once the camera has arrived. With ~1–2 s moves this
   *  puts 3–5 s between movements (owner request). */
  DWELL: 3,
} as const;

/** Why autoplay is holding. The visitor's own pause is one reason among several. */
export type HoldReason = "user" | "hover" | "focus" | "panel" | "hidden" | "freeplay";

export interface AutoplayClock {
  /** Seconds until the next station: the camera move plus the dwell. */
  remaining: number;
  /** Total for the current station, for the progress ring. */
  total: number;
  finished: boolean;
}

export function startStation(moveSeconds: number, isLast: boolean, dwell: number = AUTOPLAY.DWELL): AutoplayClock {
  const total = Math.max(0, moveSeconds) + dwell;
  return { remaining: total, total, finished: isLast };
}

/** Advances the clock unless held. Returns true when it is time to go to the next station. */
export function tickAutoplay(clock: AutoplayClock, dt: number, held: boolean): boolean {
  if (clock.finished || held || dt <= 0) return false;
  clock.remaining = Math.max(0, clock.remaining - dt);
  if (clock.remaining > 0) return false;
  clock.finished = true;
  return true;
}

/** 0 → 1 progress towards the next move, for the HUD ring. */
export const autoplayProgress = (clock: AutoplayClock) =>
  clock.total <= 0 || clock.finished ? (clock.remaining === 0 ? 1 : 0) : 1 - clock.remaining / clock.total;
