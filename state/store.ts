import { create } from "zustand";
import type { ProximityState } from "@/core/discovery";

export type Mode = "world" | "classic";
export type WorldStatus = "idle" | "loading" | "ready" | "failed";
export type Quality = "high" | "medium" | "low";
/** Visitor's motion choice; "system" follows prefers-reduced-motion. */
export type MotionSetting = "system" | "reduced" | "full";
/** Where the autopilot is heading: a landmark id, or back to spawn. */
export type AutopilotTarget = string | "spawn";

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
  /** Effective reduced-motion flag (system preference combined with the setting). */
  reducedMotion: boolean;
  setReducedMotion: (reducedMotion: boolean) => void;
  motionSetting: MotionSetting;
  setMotionSetting: (setting: MotionSetting) => void;
  /** Expanded panel (SPEC §10.3): UI state, separate from proximity. */
  expandedId: string | null;
  openPanel: (id: string) => void;
  closePanel: () => void;
  /** Pending menu navigation; the frame loop drives the ball and clears it. */
  autopilot: { target: AutopilotTarget; requestId: number } | null;
  requestAutopilot: (target: AutopilotTarget) => void;
  clearAutopilot: () => void;
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

let autopilotRequests = 0;

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
  motionSetting: "system",
  setMotionSetting: (motionSetting) => set({ motionSetting }),
  expandedId: null,
  openPanel: (expandedId) => set({ expandedId }),
  closePanel: () => set({ expandedId: null }),
  autopilot: null,
  // Ids only ever increase, so the frame loop can tell a new request from one it already started.
  requestAutopilot: (target) => set({ autopilot: { target, requestId: ++autopilotRequests } }),
  clearAutopilot: () => set({ autopilot: null }),
  activeLandmarkId: null,
  landmarkStates: {},
  setDiscovery: (activeLandmarkId, landmarkStates) => set({ activeLandmarkId, landmarkStates: { ...landmarkStates } }),
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setQuality: (quality) => set({ quality }),
  setReadyLate: (readyLate) => set({ readyLate }),
  fail: (reason) => set({ status: "failed", failureReason: reason, mode: "classic" }),
}));
