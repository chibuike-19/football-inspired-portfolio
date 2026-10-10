/** Mutable 2D vector on the pitch plane (x east, z south). */
export interface Vec2 {
  x: number;
  z: number;
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const length = (x: number, z: number) => Math.hypot(x, z);

/**
 * Frame-rate-independent exponential smoothing (SPEC §8):
 * moves `current` towards `target` by the fraction 1 - e^(-λ·dt).
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scales (x, z) down to at most `max` length. */
export function clampLength(v: Vec2, max: number): Vec2 {
  const len = length(v.x, v.z);
  if (len <= max || len === 0) return v;
  v.x = (v.x / len) * max;
  v.z = (v.z / len) * max;
  return v;
}
