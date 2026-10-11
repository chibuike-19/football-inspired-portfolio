"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { joystickToDirection } from "@/core/input";
import type { InputController } from "./input";

const RADIUS = 56;
/** Movement under this (px) is a tap, not a drag. */
const TAP_SLOP = 8;
const TAP_MS = 350;

/**
 * Floating joystick (SPEC §7.1): press anywhere on the game surface and drag.
 * Works for touch and mouse. The knob is positioned through a ref, so dragging
 * never re-renders React.
 */
export function Joystick({
  surface,
  input,
  onTap,
}: {
  surface: RefObject<HTMLElement | null>;
  input: InputController;
  /** A quick press without dragging (used to open a tapped landmark). */
  onTap?: (clientX: number, clientY: number) => void;
}) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const knob = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    let pointerId: number | null = null;
    let start = { x: 0, y: 0 };
    let origin = { x: 0, y: 0 };
    let startTime = 0;
    let dragging = false;

    const onDown = (event: PointerEvent) => {
      if (pointerId !== null || event.button !== 0) return;
      // Leave buttons and links on the surface to the browser.
      if ((event.target as Element).closest("button, a, [data-ui]")) return;
      pointerId = event.pointerId;
      element.setPointerCapture(event.pointerId);
      const rect = element.getBoundingClientRect();
      start = { x: event.clientX, y: event.clientY };
      origin = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      startTime = performance.now();
      dragging = false;
      element.focus({ preventScroll: true });
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      // Only show the joystick once this is clearly a drag, so taps don't flash it.
      if (!dragging) {
        if (Math.hypot(dx, dy) < TAP_SLOP) return;
        dragging = true;
        setOrigin(origin);
      }
      input.setJoystick(joystickToDirection(dx, dy, RADIUS));
      const len = Math.hypot(dx, dy);
      const k = len > RADIUS ? RADIUS / len : 1;
      if (knob.current) knob.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (dragging) {
        input.setJoystick({ x: 0, z: 0 });
        setOrigin(null);
      } else if (event.type === "pointerup" && performance.now() - startTime < TAP_MS) {
        onTap?.(event.clientX, event.clientY);
      }
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
    };
  }, [surface, input, onTap]);

  if (!origin) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 grid place-items-center rounded-full border-2 border-white/30 bg-black/20 backdrop-blur-sm"
      style={{ left: origin.x - RADIUS, top: origin.y - RADIUS, width: RADIUS * 2, height: RADIUS * 2 }}
    >
      <div ref={knob} className="size-12 rounded-full bg-white/80 shadow-lg shadow-black/40" />
    </div>
  );
}
