import { create } from "zustand";
import type { ProximityState } from "@/core/discovery";

export type Mode = "world" | "classic";
export type WorldStatus = "idle" | "loading" | "ready" | "failed";
export type Quality = "high" | "medium" | "low";

/**
 * Discrete state only (SPEC §9). Per-frame values (ball, camera) live in refs
 * and are never written here.
 */
interface WorldState {
  mode: Mode;
  status: WorldStatus;
  quality: Quality;
  /** The world finished loading after the load timeout; offer it instead of switching. */
  readyLate: boolean;
  failureReason: string | null;
  /** Whether this device may run the world at all; null until checked on the client. */
  capable: boolean | null;
  setCapable: (capable: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (reducedMotion: boolean) => void;
  /** Discovery output (SPEC §7.4); written only when it changes. */
  activeLandmarkId: string | null;
  landmarkStates: Record<string, ProximityState>;
  setDiscovery: (activeLandmarkId: string | null, landmarkStates: Record<string, ProximityState>) => void;
  setMode: (mode: Mode) => void;
  setStatus: (status: WorldStatus) => void;
  setQuality: (quality: Quality) => void;
  setReadyLate: (readyLate: boolean) => void;
  fail: (reason: string) => void;
}

export const useWorldStore = create<WorldState>()((set) => ({
  mode: "classic",
  status: "idle",
  quality: "high",
  readyLate: false,
  failureReason: null,
  capable: null,
  setCapable: (capable) => set({ capable }),
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  activeLandmarkId: null,
  landmarkStates: {},
  setDiscovery: (activeLandmarkId, landmarkStates) => set({ activeLandmarkId, landmarkStates: { ...landmarkStates } }),
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setQuality: (quality) => set({ quality }),
  setReadyLate: (readyLate) => set({ readyLate }),
  fail: (reason) => set({ status: "failed", failureReason: reason, mode: "classic" }),
}));
