"use client";

import { useEffect, useRef } from "react";
import { useWorldStore } from "@/state/store";
import { hashForLandmark, landmarkFromHash } from "./hash";

/**
 * Keeps the open panel and the URL in step (SPEC §10.6): opening a panel adds
 * a history entry with its hash, Back closes it, Forward reopens it.
 */
export function usePanelHistory() {
  const expandedId = useWorldStore((s) => s.expandedId);
  const previous = useRef<string | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const was = previous.current;
    previous.current = expandedId;
    const { pathname, search, hash } = window.location;

    if (expandedId) {
      const wanted = `#${hashForLandmark(expandedId)}`;
      if (hash === wanted) return;
      if (was) {
        // Switching panels: replace rather than stack entries.
        window.history.replaceState(window.history.state, "", wanted);
      } else {
        window.history.pushState({ fpPanel: true }, "", wanted);
        pushed.current = true;
      }
      return;
    }

    if (!landmarkFromHash(hash)) return;
    if (pushed.current && (window.history.state as { fpPanel?: boolean } | null)?.fpPanel) {
      pushed.current = false;
      window.history.back();
    } else {
      // Opened from a deep link: just drop the hash.
      window.history.replaceState(null, "", pathname + search);
    }
  }, [expandedId]);

  useEffect(() => {
    const onPopState = () => {
      const id = landmarkFromHash(window.location.hash);
      const { openPanel, closePanel, expandedId: open } = useWorldStore.getState();
      pushed.current = false;
      if (id && id !== open) openPanel(id);
      else if (!id && open) closePanel();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
