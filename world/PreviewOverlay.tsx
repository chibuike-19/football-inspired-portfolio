"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Vector3, type Camera } from "three";
import { damp } from "@/core/math";
import { chooseCardPosition, type Placement } from "@/core/placement";
import type { Simulation } from "@/core/simulation";
import { useWorldStore } from "@/state/store";
import { ArrowRight } from "@/ui/icons";
import { LandmarkPreview, previewAnnouncement } from "@/ui/LandmarkPreview";
import { LANDMARK_BY_ID } from "./landmarks";
import { BALL } from "./layout";

/** Below this width the preview is a bottom sheet instead of an anchored card. */
const SHEET_BREAKPOINT = 768;

const anchor = new Vector3();
const corner = new Vector3();
const corner2 = new Vector3();
const corner3 = new Vector3();
const right = new Vector3();
const ballPoint = new Vector3();

/**
 * Computes and writes the card position for one frame. Returns true while the
 * card is still easing towards its target. Kept outside the component because
 * it mutates the DOM element and the eased position by design.
 */
function placeCard(
  element: HTMLElement,
  landmark: {
    anchor: readonly [number, number, number];
    extent: readonly [number, number];
    preview: "anchor" | "dock";
  },
  camera: Camera,
  size: { width: number; height: number },
  ball: { x: number; z: number },
  eased: { current: Placement | null },
  dt: number,
): boolean {
  if (size.width < SHEET_BREAKPOINT) {
    element.style.transform = "";
    return false;
  }
  const w = size.width;
  const h = size.height;

  const toScreen = (v: Vector3) => ({ x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, inFront: v.z < 1 });
  // Screen bounds of a camera-facing box: anchor ± half width, down to the ground.
  right.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize().multiplyScalar(landmark.extent[0]);
  const [axw, ayw, azw] = landmark.anchor;
  const corners = [
    anchor.set(axw, ayw, azw).add(right),
    corner.set(axw, ayw, azw).sub(right),
    corner2.set(axw, ayw - landmark.extent[1], azw).add(right),
    corner3.set(axw, ayw - landmark.extent[1], azw).sub(right),
  ].map((v) => toScreen(v.project(camera)));
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const structure = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  const visible =
    corners.every((c) => c.inFront) && structure.right > 0 && structure.left < w && structure.bottom > 0 && structure.top < h;
  ballPoint.set(ball.x, BALL.radius, ball.z).project(camera);
  const target = chooseCardPosition(
    size,
    { width: element.offsetWidth, height: element.offsetHeight },
    visible ? structure : null,
    { x: ((ballPoint.x + 1) / 2) * w, y: ((1 - ballPoint.y) / 2) * h },
    landmark.preview,
  );

  const current = eased.current ?? { ...target };
  current.x = damp(current.x, target.x, 14, dt);
  current.y = damp(current.y, target.y, 14, dt);
  eased.current = current;
  element.style.transform = `translate3d(${Math.round(current.x)}px, ${Math.round(current.y)}px, 0)`;
  return Math.abs(current.x - target.x) > 0.5 || Math.abs(current.y - target.y) > 0.5;
}

/**
 * Positions the preview card from the render loop (SPEC §10.1): beside the
 * active landmark's anchor, on the side away from the ball, clamped to the
 * viewport, and moved off the ball if they overlap. Writes `style.transform`
 * directly, so React never re-renders per frame.
 */
export function PreviewTracker({ card, simulation }: { card: RefObject<HTMLDivElement | null>; simulation: Simulation }) {
  const invalidate = useThree((s) => s.invalidate);
  const activeId = useWorldStore((s) => s.activeLandmarkId);
  const eased = useRef<Placement | null>(null);

  useEffect(() => {
    eased.current = null; // snap into place for a new landmark
    invalidate();
  }, [activeId, invalidate]);

  useFrame(({ camera, size }, delta) => {
    const landmark = activeId ? LANDMARK_BY_ID.get(activeId) : undefined;
    if (!card.current || !landmark) return;
    if (placeCard(card.current, landmark, camera, size, simulation.ball, eased, Math.min(delta, 0.05))) invalidate();
  });

  return null;
}

/**
 * The preview card (DOM). Shows the active landmark's content with a short
 * fade; keeps the last content while fading out. Never takes focus (SPEC §10.2).
 */
export function PreviewCard({ card }: { card: RefObject<HTMLDivElement | null> }) {
  const activeId = useWorldStore((s) => s.activeLandmarkId);
  const [shownId, setShownId] = useState<string | null>(activeId);
  // Keep showing the last landmark while the card fades out.
  if (activeId && activeId !== shownId) setShownId(activeId);

  return (
    <div
      ref={card}
      data-ui
      data-state={activeId ? "in" : "out"}
      onTransitionEnd={() => !activeId && setShownId(null)}
      className="preview-card"
      hidden={!shownId}
    >
      {shownId && (
        <>
          <LandmarkPreview id={shownId} />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => useWorldStore.getState().openPanel(shownId)}
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              More details<span className="sr-only"> about {LANDMARK_BY_ID.get(shownId)?.title}</span>
              <ArrowRight className="size-4" />
            </button>
            <span className="hidden text-xs text-muted md:inline">
              or press <kbd>Enter</kbd>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/** Polite, throttled announcement of discoveries for screen readers (SPEC §10.2). */
export function DiscoveryAnnouncer() {
  const activeId = useWorldStore((s) => s.activeLandmarkId);
  const [message, setMessage] = useState("");
  const lastAt = useRef(0);

  useEffect(() => {
    if (!activeId) return;
    const text = previewAnnouncement(activeId);
    const wait = Math.max(0, lastAt.current + 1500 - performance.now());
    const timer = window.setTimeout(() => {
      lastAt.current = performance.now();
      setMessage(text);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
