"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWorldStore } from "@/state/store";
import { buttonStyles } from "@/ui/primitives";
import { profile } from "@/content/profile";
import { classicReason, initialQuality, writeViewPreference } from "./capability";
import { WorldErrorBoundary } from "./WorldErrorBoundary";

const World = dynamic(() => import("./World"), { ssr: false });

/** SPEC §11.3: reveal Classic view if the world isn't ready in time. */
const LOAD_TIMEOUT_MS = 15_000;

/**
 * Decides between the 3D world and Classic view, loads the world lazily and
 * toggles `html.world-active`, which visually hides Layer 1 (it stays in the
 * accessibility tree; see globals.css).
 */
export function WorldMount() {
  const mode = useWorldStore((s) => s.mode);
  const status = useWorldStore((s) => s.status);
  const readyLate = useWorldStore((s) => s.readyLate);
  const failureReason = useWorldStore((s) => s.failureReason);
  const capable = useWorldStore((s) => s.capable);
  const { setMode, setStatus, setQuality, setReadyLate, setCapable, fail } = useWorldStore.getState();

  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const timedOut = useRef(false);

  useEffect(() => {
    const reason = classicReason();
    const hardBlocked = reason === "webgl2-unavailable" || reason === "save-data";
    setCapable(!hardBlocked);
    setQuality(initialQuality());
    // Deep links open Classic view until world deep-linking lands (Phase 6).
    if (reason || window.location.hash) return;
    setMode("world");
    setStatus("loading");
  }, [setCapable, setMode, setQuality, setStatus]);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setTimeout(() => {
      timedOut.current = true;
      setMode("classic");
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [status, setMode]);

  useEffect(() => {
    if (status === "ready" && timedOut.current) setReadyLate(true);
  }, [status, setReadyLate]);

  const active = mode === "world" && status === "ready" && !readyLate;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("world-active", active);
    return () => root.classList.remove("world-active");
  }, [active]);

  const enterWorld = useCallback(() => {
    writeViewPreference("world");
    setReadyLate(false);
    timedOut.current = false;
    if (status === "idle" || status === "failed") setStatus("loading");
    setMode("world");
    window.scrollTo(0, 0);
  }, [setMode, setReadyLate, setStatus, status]);

  const enterClassic = useCallback(() => {
    writeViewPreference("classic");
    setMode("classic");
  }, [setMode]);

  // Keyboard users who tab into the hidden page, or use the skip link, get Classic view.
  useEffect(() => {
    if (!active) return;
    const layer1 = document.querySelector("[data-layer1]");
    const onFocusIn = () => setMode("classic");
    const onSkip = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('a[href="#main"]')) setMode("classic");
    };
    layer1?.addEventListener("focusin", onFocusIn);
    document.addEventListener("click", onSkip);
    return () => {
      layer1?.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onSkip);
    };
  }, [active, setMode]);

  const loadWorld = status === "loading" || status === "ready";

  return (
    <>
      {/* Interim world chrome; the full HUD replaces it in Phase 6. Before the stage in the DOM so Tab reaches "Classic view" first. */}
      {active && (
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-white drop-shadow">
            {profile.name}
          </p>
          <button type="button" onClick={enterClassic} className={buttonStyles.secondary}>
            Classic view
          </button>
        </div>
      )}

      {loadWorld && (
        <div className="world-stage" data-state={active ? "active" : "hidden"} aria-hidden={!active}>
          <WorldErrorBoundary onError={() => fail("render-error")}>
            <World />
          </WorldErrorBoundary>
        </div>
      )}

      {mode === "world" && status === "loading" && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-white/5">
          <span className="sr-only">Loading the 3D stadium…</span>
          <div className="world-progress h-full w-1/3 bg-accent" />
        </div>
      )}

      {!active && capable && (status === "idle" || readyLate || status === "ready") && (
        <button
          type="button"
          onClick={enterWorld}
          className={`${buttonStyles.primary} fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 shadow-lg shadow-black/40`}
        >
          {readyLate ? "3D stadium ready: enter" : "Explore in 3D"}
        </button>
      )}

      {status === "failed" && !noticeDismissed && (
        <div
          role="status"
          className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 p-4 text-sm shadow-lg shadow-black/40"
        >
          <p>
            The 3D view couldn&apos;t run on this device{failureReason === "context-lost" ? " (graphics reset)" : ""}.
            Here&apos;s the classic portfolio.
          </p>
          <button type="button" onClick={() => setNoticeDismissed(true)} className="shrink-0 font-semibold text-accent">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
