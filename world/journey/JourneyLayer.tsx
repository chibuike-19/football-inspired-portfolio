"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CHAPTERS, stationFromScroll } from "@/core/journey";
import { profile } from "@/content/profile";
import { useWorldStore } from "@/state/store";
import { buttonStyles } from "@/ui/primitives";
import type { TapPicker } from "../TapBridge";
import { StationPanel } from "./panels";
import { chapterStart, STATIONS, stationById } from "./stations";

/**
 * Chapter navigation (spec §6 rule 7, §10): always visible, synchronised with
 * the active station, and jumps directly to any chapter.
 */
function JourneyNav() {
  const station = useWorldStore((s) => s.journeyStation);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = STATIONS[station]?.chapter;
  const progress = STATIONS.length > 1 ? Math.max(0, station) / (STATIONS.length - 1) : 0;
  const { requestJourneyJump, setExperience, setMotionSetting, setMode } = useWorldStore.getState();

  const jumpTo = (chapter: (typeof CHAPTERS)[number]["id"]) => {
    setMenuOpen(false);
    requestJourneyJump(chapterStart(chapter));
  };

  const chapterButton = (chapter: (typeof CHAPTERS)[number], extra = "") => (
    <button
      type="button"
      onClick={() => jumpTo(chapter.id)}
      aria-current={active === chapter.id ? "step" : undefined}
      className={`hud-link ${extra}`}
    >
      {chapter.label}
    </button>
  );

  return (
    <header className="hud" data-ui>
      <button
        type="button"
        onClick={() => requestJourneyJump(0)}
        className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white"
      >
        <Image src={profile.avatar} alt="" width={64} height={64} className="size-8 rounded-full object-cover ring-[1.5px] ring-brand" />
        <span className="hidden xl:inline">{profile.name}</span>
        <span className="sr-only xl:hidden">{profile.name}: back to kickoff</span>
      </button>

      <nav aria-label="Chapters" className="hud-panel ml-auto hidden lg:flex">
        <ol className="flex items-center gap-0.5">
          {CHAPTERS.map((chapter) => (
            <li key={chapter.id}>{chapterButton(chapter)}</li>
          ))}
        </ol>
      </nav>
      <div className="hud-panel hidden items-center gap-1 lg:flex">
        <button type="button" onClick={() => setExperience("freeplay")} className="hud-link">
          Free play
        </button>
        <button type="button" onClick={() => setMotionSetting(reducedMotion ? "full" : "reduced")} aria-pressed={reducedMotion} className="hud-link">
          Reduce motion
        </button>
        <button type="button" onClick={() => setMode("classic")} className="hud-link">
          Classic view
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:hidden">
        <button type="button" onClick={() => setMode("classic")} className={`${buttonStyles.secondary} min-h-11 px-3`}>
          Classic view
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="journey-menu"
          className={`${buttonStyles.primary} min-h-11 px-3`}
        >
          Chapters
        </button>
      </div>
      {menuOpen && (
        <nav id="journey-menu" aria-label="Chapters" className="hud-menu lg:hidden">
          <ol className="grid gap-1">
            {CHAPTERS.map((chapter) => (
              <li key={chapter.id}>{chapterButton(chapter, "w-full justify-start text-base")}</li>
            ))}
            <li className="mt-1 border-t border-line pt-2">
              <button type="button" onClick={() => setExperience("freeplay")} className="hud-link w-full justify-start text-base">
                Free play
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setMotionSetting(reducedMotion ? "full" : "reduced")}
                aria-pressed={reducedMotion}
                className="hud-link w-full justify-start text-base"
              >
                Reduce motion: {reducedMotion ? "on" : "off"}
              </button>
            </li>
          </ol>
        </nav>
      )}

      {/* Journey progress (spec §6 rule 7). */}
      <div aria-hidden="true" className="journey-progress">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </header>
  );
}

/** The active station's panel; the previous one leaves before the next arrives (spec §3). */
function JourneyPanels() {
  const station = useWorldStore((s) => s.journeyStation);
  const delay = useWorldStore((s) => s.panelDelay);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  // Keep the outgoing panel for its short exit animation.
  const [shown, setShown] = useState(station);
  const [leaving, setLeaving] = useState<number | null>(null);
  if (station !== shown) {
    setLeaving(shown);
    setShown(station);
  }

  const active = STATIONS[shown];
  const outgoing = leaving !== null ? STATIONS[leaving] : undefined;
  return (
    <>
      {outgoing && (
        <div
          key={`out-${outgoing.id}`}
          className="journey-panel"
          data-side={outgoing.side}
          data-state="out"
          aria-hidden="true"
          inert
          onAnimationEnd={() => setLeaving(null)}
        >
          <StationPanel station={outgoing} />
        </div>
      )}
      {active && (
        <div
          key={active.id}
          className="journey-panel"
          data-side={active.side}
          data-state="in"
          data-ui
          style={{ animationDelay: `${reducedMotion ? 0 : delay}s` }}
        >
          <StationPanel station={active} />
        </div>
      )}
    </>
  );
}

/** Polite announcement of each new station for screen readers. */
function JourneyAnnouncer() {
  const station = useWorldStore((s) => s.journeyStation);
  const label = STATIONS[station]?.label ?? "";
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {label}
    </p>
  );
}

/**
 * Scroll layer (spec §3, §4, §8). Native scrolling over one viewport per
 * station; the active station is derived from the scroll position with
 * hysteresis. Navigation jumps scroll instantly, so the camera moves straight
 * to the target instead of visiting every station in between.
 */
export function JourneyLayer({ picker }: { picker: RefObject<TapPicker | null> }) {
  const scroller = useRef<HTMLDivElement>(null);
  const current = useRef(-1);
  const status = useWorldStore((s) => s.status);
  const jump = useWorldStore((s) => s.journeyJump);

  // Start the story once the stadium is visible.
  useEffect(() => {
    const el = scroller.current;
    if (status !== "ready" || !el) return;
    const { journeyStation, setJourneyStation } = useWorldStore.getState();
    if (journeyStation >= 0) {
      // Returning (e.g. from free play): restore the scroll position for the current station.
      el.scrollTop = journeyStation * el.clientHeight;
      current.current = journeyStation;
    } else {
      current.current = 0;
      setJourneyStation(0);
    }
    el.focus({ preventScroll: true });
  }, [status]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (current.current < 0) return;
        const next = stationFromScroll(el.scrollTop, el.clientHeight, STATIONS.length, current.current);
        if (next === current.current) return;
        current.current = next;
        useWorldStore.getState().setJourneyStation(next);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Navigation requests: jump the scroll position, then set the station directly.
  useEffect(() => {
    const el = scroller.current;
    if (!jump || !el) return;
    const target = Math.min(STATIONS.length - 1, Math.max(0, jump.station));
    current.current = target;
    el.scrollTo({ top: target * el.clientHeight, behavior: "instant" });
    useWorldStore.getState().setJourneyStation(target);
  }, [jump]);

  // Clicking a project board is a shortcut to that project (spec §4, highlights).
  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("[data-ui]")) return;
    const id = picker.current?.(event.clientX, event.clientY);
    const station = id ? stationById(id) : undefined;
    if (station) useWorldStore.getState().requestJourneyJump(station.index);
  };

  return (
    <>
      <JourneyNav />
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Portfolio journey. Scroll or use Page Down to continue."
        className="journey-scroll"
        onClick={onClick}
      >
        {/* Pinned layer: panels stay put while the page scrolls underneath. */}
        <div className="journey-sticky">
          <JourneyPanels />
        </div>
        {STATIONS.map((station) => (
          <div key={station.id} className="journey-step" aria-hidden="true" />
        ))}
      </div>
      <JourneyAnnouncer />
    </>
  );
}
