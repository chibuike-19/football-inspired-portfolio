"use client";

import { useEffect, useRef } from "react";
import { AUTOPLAY, autoplayProgress, startStation, tickAutoplay, type AutoplayClock } from "@/core/autoplay";
import { useWorldStore } from "@/state/store";
import { STATIONS } from "./stations";

const DEBUG = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_WORLD_DEBUG === "1";

/** Debug builds only: `?dwell=0.4` shortens the rest at each station (tests). */
function dwellSeconds(): number {
  if (!DEBUG) return AUTOPLAY.DWELL;
  const value = Number(new URLSearchParams(window.location.search).get("dwell"));
  return Number.isFinite(value) && value > 0 ? value : AUTOPLAY.DWELL;
}

const RING = 2 * Math.PI * 9;

/**
 * Autoplay driver and its HUD control. From kickoff the story advances on its
 * own, resting AUTOPLAY.DWELL seconds after each camera move, and stops at full
 * time. Manual navigation still works; autoplay continues from wherever the
 * visitor lands. It holds while the visitor hovers or focuses a panel, while a
 * detail panel is open, while the tab is hidden, and when paused.
 */
/** `driver`: only one mounted instance runs the clock (the HUD shows the control twice). */
export function AutoplayControl({ driver = true }: { driver?: boolean }) {
  const autoplay = useWorldStore((s) => s.autoplay);
  const finished = useWorldStore((s) => s.journeyStation >= STATIONS.length - 1);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!driver) return;
    const store = useWorldStore;
    const dwell = dwellSeconds();
    let clock: AutoplayClock | null = null;
    let station = -1;
    let last = performance.now();
    let frame = 0;
    const canHover = window.matchMedia("(hover: hover)").matches;
    /** Reading or interacting: pointer over the panel or a skill marker, or keyboard focus inside one. */
    const reading = () => {
      const areas = document.querySelectorAll(".journey-panel[data-state='in'], .playbook-layer[data-state='in'] ul");
      for (const area of areas) {
        if (canHover && area.matches(":hover")) return true;
        if (area.contains(document.activeElement)) return true;
      }
      return false;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = store.getState();
      if (s.status !== "ready" || s.journeyStation < 0) return;
      // New station (autoplay, scroll or navigation): restart the clock. The camera
      // publishes the move duration in the same update, so it is read here, a frame later.
      if (s.journeyStation !== station) {
        station = s.journeyStation;
        clock = startStation(s.moveDuration, station >= STATIONS.length - 1, dwell);
      }
      if (!clock) return;
      const held = !s.autoplay || s.autoplayHolds.length > 0 || s.expandedId !== null || document.hidden || reading();
      if (tickAutoplay(clock, dt, held)) s.requestJourneyJump(station + 1);
      if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - autoplayProgress(clock)));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [driver]);

  const label = finished ? "Tour finished" : autoplay ? "Pause tour" : "Play tour";
  return (
    <button
      type="button"
      onClick={() => useWorldStore.getState().setAutoplay(!autoplay)}
      disabled={finished}
      aria-pressed={!autoplay && !finished}
      aria-label={label}
      title={label}
      className="hud-link autoplay-button"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="rgb(148 163 184 / 0.3)" strokeWidth="2" />
        <circle
          ref={ring}
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={RING}
          strokeDashoffset={RING}
          transform="rotate(-90 12 12)"
          className="text-accent"
        />
        {autoplay || finished ? (
          <path d="M10 8.5v7M14 8.5v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M10 8l6 4-6 4z" fill="currentColor" />
        )}
      </svg>
      <span className="max-xl:sr-only">{autoplay && !finished ? "Auto" : finished ? "End" : "Paused"}</span>
    </button>
  );
}
