import type { Quality } from "@/state/store";

export function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    const supported = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return supported;
  } catch {
    return false;
  }
}

interface NetworkInformationLike {
  saveData?: boolean;
}

/**
 * SPEC §11.1: the world can't be offered without WebGL2 or with Save-Data on.
 * Returns the reason, or null if the world can load.
 */
export function classicReason(): string | null {
  if (!supportsWebGL2()) return "webgl2-unavailable";
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection?.saveData) return "save-data";
  return null;
}

/** Starting tier before runtime monitoring (SPEC §11.2). */
export function initialQuality(): Quality {
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return touch || cores <= 4 ? "medium" : "high";
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
