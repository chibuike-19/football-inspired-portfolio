"use client";

import { useEffect, useState } from "react";
import { useWorldStore } from "@/state/store";
import type { InputController } from "./input";

const SEEN_KEY = "fp:hint-seen";
const HINT_MS = 8000;

function hintSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: the hint may show again next visit.
  }
}

/**
 * One-time hint (SPEC §10.5): how to move, and that the menu jumps straight to
 * things. Fades after the first move or 8 seconds and is not shown again.
 */
export function Onboarding({ input }: { input: InputController }) {
  const ready = useWorldStore((s) => s.status === "ready" && s.mode === "world");
  const [state, setState] = useState<"waiting" | "in" | "out" | "done">(() => (hintSeen() ? "done" : "waiting"));
  const [touch] = useState(() => window.matchMedia("(pointer: coarse)").matches);

  if (ready && state === "waiting") setState("in");

  useEffect(() => {
    if (state !== "in") return;
    markSeen();
    const dismiss = () => setState("out");
    const timer = window.setTimeout(dismiss, HINT_MS);
    const unsubscribe = input.onChange(() => input.hasMoved() && dismiss());
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [state, input]);

  if (state === "waiting" || state === "done") return null;
  return (
    <p className="onboarding-hint" data-state={state} onTransitionEnd={() => state === "out" && setState("done")}>
      {touch ? (
        <>Drag anywhere to move the ball · the menu jumps straight to anything</>
      ) : (
        <>
          Move the ball with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrow keys, or drag · the menu jumps straight to
          anything
        </>
      )}
    </p>
  );
}
