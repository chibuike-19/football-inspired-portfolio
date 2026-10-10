"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import { damp } from "@/core/math";
import { useWorldStore } from "@/state/store";

/** Emphasis level for each proximity state. */
export const EMPHASIS = { idle: 0, near: 0.45, active: 1 } as const;

const LAMBDA = 6;

/**
 * Eases a landmark's emphasis (0 idle … 1 active) and hands each new value to
 * `apply`, which mutates materials directly. React re-renders only when the
 * discrete state changes; frames are requested only while easing.
 */
export function useEmphasis(id: string, apply: (value: number) => void) {
  const state = useWorldStore((s) => s.landmarkStates[id] ?? "idle");
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const target = EMPHASIS[state];
  const current = useRef(0);
  const applyRef = useRef(apply);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    applyRef.current = apply;
  });
  useLayoutEffect(() => applyRef.current(current.current), []);
  useEffect(() => invalidate(), [target, invalidate]);

  useFrame((_, delta) => {
    if (current.current === target) return;
    let next = reducedMotion ? target : damp(current.current, target, LAMBDA, Math.min(delta, 0.05));
    if (Math.abs(next - target) < 0.003) next = target;
    current.current = next;
    applyRef.current(next);
    if (next !== target) invalidate();
  });
}
