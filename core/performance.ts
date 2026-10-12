import { PERFORMANCE } from "./config";

/**
 * Frame-rate monitor for a render-on-demand loop (SPEC §11.2). Only frames that
 * follow another frame closely are measured, so idle periods never read as a
 * slow frame rate.
 */
export interface PerformanceMonitor {
  warmup: number;
  count: number;
  total: number;
  strikes: number;
}

export const createPerformanceMonitor = (): PerformanceMonitor => ({ warmup: PERFORMANCE.WARMUP, count: 0, total: 0, strikes: 0 });

/** Start over, e.g. after changing quality: new shaders compile on the next frames. */
export function resetPerformanceMonitor(monitor: PerformanceMonitor): void {
  Object.assign(monitor, createPerformanceMonitor());
}

/** Records one frame interval. Returns true when quality should step down. */
export function recordFrame(monitor: PerformanceMonitor, dt: number): boolean {
  if (dt <= 0 || dt > PERFORMANCE.IDLE_GAP) return false;
  if (monitor.warmup > 0) {
    monitor.warmup -= dt;
    return false;
  }
  monitor.count++;
  monitor.total += dt;
  if (monitor.count < PERFORMANCE.WINDOW) return false;

  const fps = monitor.count / monitor.total;
  monitor.count = 0;
  monitor.total = 0;
  monitor.strikes = fps < PERFORMANCE.MIN_FPS ? monitor.strikes + 1 : 0;
  if (monitor.strikes < PERFORMANCE.STRIKES) return false;
  monitor.strikes = 0;
  return true;
}
