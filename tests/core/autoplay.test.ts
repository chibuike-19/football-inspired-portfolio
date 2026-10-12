import { describe, expect, it } from "vitest";
import { AUTOPLAY, autoplayProgress, startStation, tickAutoplay } from "@/core/autoplay";

const run = (clock: ReturnType<typeof startStation>, seconds: number, held = false) => {
  let advanced = false;
  for (let t = 0; t < seconds; t += 1 / 60) advanced = tickAutoplay(clock, 1 / 60, held) || advanced;
  return advanced;
};

describe("autoplay clock", () => {
  it("waits for the camera move plus the dwell, then advances once", () => {
    const clock = startStation(1.6, false);
    expect(run(clock, 1.6 + AUTOPLAY.DWELL - 0.1)).toBe(false);
    expect(run(clock, 0.2)).toBe(true);
    expect(run(clock, 5)).toBe(false);
  });

  it("keeps the gap between movements within 3–5 seconds of rest", () => {
    expect(AUTOPLAY.DWELL).toBeGreaterThanOrEqual(3);
    expect(AUTOPLAY.DWELL).toBeLessThanOrEqual(5);
  });

  it("does not advance while held, and resumes where it left off", () => {
    const clock = startStation(0, false);
    run(clock, 2);
    expect(run(clock, 30, true)).toBe(false);
    expect(clock.remaining).toBeCloseTo(AUTOPLAY.DWELL - 2, 1);
    expect(run(clock, AUTOPLAY.DWELL - 2 + 0.1)).toBe(true);
  });

  it("never advances past the last station", () => {
    const clock = startStation(1, true);
    expect(run(clock, 60)).toBe(false);
  });

  it("reports progress for the HUD ring", () => {
    const clock = startStation(0, false);
    expect(autoplayProgress(clock)).toBe(0);
    run(clock, AUTOPLAY.DWELL / 2);
    expect(autoplayProgress(clock)).toBeCloseTo(0.5, 1);
  });
});
