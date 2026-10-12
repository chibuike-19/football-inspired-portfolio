import { describe, expect, it } from "vitest";
import { PERFORMANCE } from "@/core/config";
import { createPerformanceMonitor, recordFrame, resetPerformanceMonitor } from "@/core/performance";

/** Feeds `seconds` of frames at `fps`; returns how many times it asked to step down. */
function run(monitor: ReturnType<typeof createPerformanceMonitor>, fps: number, seconds: number) {
  let declines = 0;
  for (let t = 0; t < seconds; t += 1 / fps) if (recordFrame(monitor, 1 / fps)) declines++;
  return declines;
}

describe("performance monitor", () => {
  it("never declines at a healthy frame rate", () => {
    expect(run(createPerformanceMonitor(), 60, 30)).toBe(0);
    expect(run(createPerformanceMonitor(), 50, 30)).toBe(0);
  });

  it("declines after sustained slow frames", () => {
    const m = createPerformanceMonitor();
    expect(run(m, 25, 20)).toBeGreaterThan(0);
  });

  it("ignores the warm-up period (shader compiles, texture uploads)", () => {
    const m = createPerformanceMonitor();
    expect(run(m, 10, PERFORMANCE.WARMUP * 0.9)).toBe(0);
  });

  it("does not count idle gaps from render-on-demand as slow frames", () => {
    const m = createPerformanceMonitor();
    run(m, 60, 3);
    let declines = 0;
    for (let i = 0; i < 200; i++) {
      if (recordFrame(m, 5)) declines++; // came back after 5 s idle
      declines += run(m, 60, 0.1);
    }
    expect(declines).toBe(0);
  });

  it("a brief hitch (a few long frames) is not enough", () => {
    const m = createPerformanceMonitor();
    let declines = run(m, 60, 3);
    for (let i = 0; i < 5; i++) if (recordFrame(m, 0.15)) declines++;
    declines += run(m, 60, 6);
    expect(declines).toBe(0);
  });

  it("starts over after a reset", () => {
    const m = createPerformanceMonitor();
    run(m, 60, 5);
    resetPerformanceMonitor(m);
    expect(m.warmup).toBe(PERFORMANCE.WARMUP);
  });
});
