import { create } from "zustand";
import type { ProximityState } from "@/core/discovery";

export type Mode = "world" | "classic";
export type WorldStatus = "idle" | "loading" | "ready" | "failed";
export type Quality = "high" | "medium" | "low";
/** Visitor's motion choice; "system" follows prefers-reduced-motion. */
export type MotionSetting = "system" | "reduced" | "full";
/** Where the autopilot is heading: a landmark id, or back to spawn. */
export type AutopilotTarget = string | "spawn";
/** 3D experience: the guided scroll journey (default) or free play with the ball. */
export type Experience = "journey" | "freeplay";
/** Text on the stadium scoreboard; null shows the default profile board. */
export interface ScoreboardText {
  kicker: string;
  title: string;
  lines: string[];
}

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
  experience: Experience;
  setExperience: (experience: Experience) => void;
  /** True once free play has been used: the journey then resumes from the live camera. */
  journeyResume: boolean;
  /** Active journey station (index into the station list); -1 before the journey starts. */
  journeyStation: number;
  setJourneyStation: (station: number) => void;
  /** Navigation request (chapter nav, next/previous, replay); the scroll layer consumes it. */
  journeyJump: { station: number; replay: boolean; requestId: number } | null;
  requestJourneyJump: (station: number, replay?: boolean) => void;
  /** Seconds before the next panel should appear (overlaps the camera move). */
  panelDelay: number;
  setPanelDelay: (seconds: number) => void;
  scoreboard: ScoreboardText | null;
  setScoreboard: (text: ScoreboardText | null) => void;
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
  /** Steps quality down one level; at the lowest level, offers Classic view instead. */
  degrade: () => void;
  slowNotice: boolean;
  dismissSlowNotice: () => void;
  setReadyLate: (readyLate: boolean) => void;
  fail: (reason: string) => void;
}

let autopilotRequests = 0;
let journeyRequests = 0;

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
  experience: "journey",
  setExperience: (experience) =>
    set((state) => ({ experience, journeyResume: state.journeyResume || experience === "freeplay" })),
  journeyResume: false,
  journeyStation: -1,
  setJourneyStation: (journeyStation) => set({ journeyStation }),
  journeyJump: null,
  requestJourneyJump: (station, replay = false) => set({ journeyJump: { station, replay, requestId: ++journeyRequests } }),
  panelDelay: 0,
  setPanelDelay: (panelDelay) => set({ panelDelay }),
  scoreboard: null,
  setScoreboard: (scoreboard) => set({ scoreboard }),
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
  degrade: () =>
    set((state) =>
      state.quality === "high" ? { quality: "medium" } : state.quality === "medium" ? { quality: "low" } : { slowNotice: true },
    ),
  slowNotice: false,
  dismissSlowNotice: () => set({ slowNotice: false }),
  setReadyLate: (readyLate) => set({ readyLate }),
  fail: (reason) => set({ status: "failed", failureReason: reason, mode: "classic" }),
}));
