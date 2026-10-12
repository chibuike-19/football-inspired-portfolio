"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import type { Simulation } from "@/core/simulation";
import { useWorldStore } from "@/state/store";
import { buttonStyles } from "@/ui/primitives";
import { writeViewPreference } from "./capability";
import { LANDMARKS } from "./landmarks";

type NavId = "explore" | "projects" | "experience" | "resume" | "contact";

const NAV: { id: NavId; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "resume", label: "Résumé" },
  { id: "contact", label: "Contact" },
];

/** The project board closest to the ball ("Projects" in the menu). */
function nearestBoard(ball: { x: number; z: number }): string {
  let best = "";
  let bestDistance = Infinity;
  for (const landmark of LANDMARKS) {
    if (landmark.kind !== "board") continue;
    const d = Math.hypot(landmark.position[0] - ball.x, landmark.position[1] - ball.z);
    if (d < bestDistance) {
      bestDistance = d;
      best = landmark.id;
    }
  }
  return best;
}

/**
 * Compact navigation (SPEC §10.4). Destinations dribble the ball there, so
 * discovery stays the single source of truth; Résumé and Contact also open
 * their panel straight away so they are always one click away.
 */
export function Hud({ simulation, gameSurface }: { simulation: Simulation; gameSurface: React.RefObject<HTMLElement | null> }) {
  const activeId = useWorldStore((s) => s.activeLandmarkId);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const setMotionSetting = useWorldStore((s) => s.setMotionSetting);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Close the phone menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const go = (id: NavId) => {
    const { requestAutopilot, openPanel, closePanel } = useWorldStore.getState();
    setMenuOpen(false);
    if (id === "explore") {
      closePanel();
      requestAutopilot("spawn");
    } else if (id === "projects") {
      closePanel();
      requestAutopilot(nearestBoard(simulation.ball));
    } else if (id === "experience") {
      closePanel();
      requestAutopilot("experience");
    } else {
      requestAutopilot(id);
      openPanel(id);
      return; // the panel takes focus
    }
    // Hand the keyboard back to the ball so WASD works straight away.
    gameSurface.current?.focus({ preventScroll: true });
  };

  const current = (id: NavId) =>
    (id === "projects" && activeId?.startsWith("project:")) || activeId === id || (id === "explore" && activeId === "profile");

  const enterClassic = () => {
    writeViewPreference("classic");
    useWorldStore.getState().setMode("classic");
  };

  const toggleMotion = () => setMotionSetting(reducedMotion ? "full" : "reduced");

  const navButton = (item: (typeof NAV)[number], extra = "") => (
    <button
      type="button"
      onClick={() => go(item.id)}
      aria-current={current(item.id) ? "location" : undefined}
      className={`hud-link ${extra}`}
    >
      {item.label}
    </button>
  );

  return (
    <header className="hud" data-ui>
      <button type="button" onClick={() => go("explore")} className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-white">
        <Image src={profile.avatar} alt="" width={64} height={64} className="size-8 rounded-full object-cover ring-[1.5px] ring-brand" />
        <span className="hidden lg:inline">{profile.name}</span>
        <span className="sr-only lg:hidden">{profile.name}: back to the centre circle</span>
      </button>

      {/* Desktop and tablet */}
      <nav aria-label="Stadium" className="hud-panel ml-auto hidden md:flex">
        <ul className="flex items-center gap-0.5">
          {NAV.map((item) => (
            <li key={item.id}>{navButton(item)}</li>
          ))}
        </ul>
      </nav>
      <div className="hud-panel hidden items-center gap-1 md:flex">
        <a href="/blog/" className="hud-link">
          Blog
        </a>
        <button type="button" onClick={toggleMotion} aria-pressed={reducedMotion} className="hud-link">
          Reduce motion
        </button>
        <button type="button" onClick={enterClassic} className="hud-link">
          Classic view
        </button>
      </div>

      {/* Phones */}
      <div className="ml-auto flex items-center gap-2 md:hidden">
        <button type="button" onClick={enterClassic} className={`${buttonStyles.secondary} min-h-11 px-3`}>
          Classic view
        </button>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="hud-menu"
          className={`${buttonStyles.primary} min-h-11 px-3`}
        >
          Menu
        </button>
      </div>
      {menuOpen && (
        <nav id="hud-menu" aria-label="Stadium" className="hud-menu md:hidden">
          <ul className="grid gap-1">
            {NAV.map((item) => (
              <li key={item.id}>{navButton(item, "w-full justify-start text-base")}</li>
            ))}
            <li>
              <a href="/blog/" className="hud-link w-full justify-start text-base">
                Blog
              </a>
            </li>
            <li className="mt-1 border-t border-line pt-2">
              <button type="button" onClick={toggleMotion} aria-pressed={reducedMotion} className="hud-link w-full justify-start text-base">
                Reduce motion: {reducedMotion ? "on" : "off"}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
