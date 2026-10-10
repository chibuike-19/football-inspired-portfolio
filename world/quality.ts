import type { Quality } from "@/state/store";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  pitchPixelsPerUnit: number;
  /** Fraction of stand seats that get a spectator. */
  crowdDensity: number;
  antialias: boolean;
}

export const QUALITY: Record<Quality, QualitySettings> = {
  high: { dpr: [1, 2], shadows: true, shadowMapSize: 2048, pitchPixelsPerUnit: 40, crowdDensity: 0.78, antialias: true },
  medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, pitchPixelsPerUnit: 28, crowdDensity: 0.55, antialias: true },
  low: { dpr: [1, 1], shadows: false, shadowMapSize: 512, pitchPixelsPerUnit: 18, crowdDensity: 0.3, antialias: false },
};
