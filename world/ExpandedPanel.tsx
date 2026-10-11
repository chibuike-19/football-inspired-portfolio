"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useWorldStore } from "@/state/store";
import { LandmarkDetail, landmarkDetailTitle } from "@/ui/LandmarkDetail";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Expanded details (SPEC §10.3): a side panel on desktop, a full sheet on
 * phones. Modal while open: focus is trapped, Esc / the close button / the
 * backdrop close it, and focus returns to the game surface.
 */
export function ExpandedPanel({ returnFocus }: { returnFocus: RefObject<HTMLElement | null> }) {
  const expandedId = useWorldStore((s) => s.expandedId);
  const closePanel = useWorldStore((s) => s.closePanel);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  // Keep the content while the panel animates out.
  const [shownId, setShownId] = useState<string | null>(expandedId);
  if (expandedId && expandedId !== shownId) setShownId(expandedId);

  useEffect(() => {
    if (!expandedId) return;
    closeButton.current?.focus({ preventScroll: true });
    const target = returnFocus.current;
    return () => target?.focus({ preventScroll: true });
  }, [expandedId, returnFocus]);

  useEffect(() => {
    if (!expandedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      // Focus trap: wrap Tab within the dialog.
      const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("hidden"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expandedId, closePanel]);

  if (!shownId) return null;
  const { kicker, title } = landmarkDetailTitle(shownId);
  const open = expandedId !== null;

  return (
    <div className="panel-layer" data-state={open ? "open" : "closed"} data-ui onTransitionEnd={() => !open && setShownId(null)}>
      <div className="panel-backdrop" onClick={closePanel} aria-hidden="true" />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="panel-sheet"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface/95 px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">{kicker}</p>
            <h2 id="panel-title" className="font-display text-3xl font-bold uppercase leading-tight tracking-wide">
              {title}
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={closePanel}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-xl leading-none hover:border-white/25"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Close {title} details and return to the stadium</span>
          </button>
        </header>
        <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          <LandmarkDetail id={shownId} />
        </div>
      </div>
    </div>
  );
}
