import { gameOwnsKeyboard, isMovementKey, keysToDirection } from "@/core/input";
import type { Vec2 } from "@/core/math";

/**
 * DOM side of the input router: collects keyboard and joystick input into one
 * direction the frame loop reads every frame (no React state per frame).
 */
export interface InputController {
  /** Current direction (length ≤ 1). Read by the frame loop. */
  direction(): Vec2;
  /** True from the first movement input, for onboarding. */
  hasMoved(): boolean;
  setJoystick(direction: Vec2): void;
  setPanelOpen(open: boolean): void;
  setGameSurface(element: HTMLElement | null): void;
  /** Called whenever input changes, so a demand frame loop can wake up. */
  onChange(listener: () => void): () => void;
  dispose(): void;
}

export function createInputController(): InputController {
  const held = new Set<string>();
  let keyDirection: Vec2 = { x: 0, z: 0 };
  let joystick: Vec2 = { x: 0, z: 0 };
  let panelOpen = false;
  let gameSurface: HTMLElement | null = null;
  let moved = false;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());
  const refresh = () => {
    keyDirection = keysToDirection(held);
    if (keyDirection.x !== 0 || keyDirection.z !== 0) moved = true;
    notify();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isMovementKey(event.code) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!gameOwnsKeyboard({ active: document.activeElement, gameSurface, panelOpen })) return;
    // Arrow keys would otherwise scroll the page.
    event.preventDefault();
    if (held.has(event.code)) return;
    held.add(event.code);
    refresh();
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (!held.delete(event.code)) return;
    refresh();
  };
  // Lost focus means we never see the keyup: release everything.
  const releaseAll = () => {
    if (held.size === 0 && joystick.x === 0 && joystick.z === 0) return;
    held.clear();
    joystick = { x: 0, z: 0 };
    refresh();
  };
  const onVisibility = () => document.hidden && releaseAll();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    direction() {
      // Joystick wins while it is held; otherwise the keyboard.
      return joystick.x !== 0 || joystick.z !== 0 ? joystick : keyDirection;
    },
    hasMoved: () => moved,
    setJoystick(direction) {
      joystick = direction;
      if (direction.x !== 0 || direction.z !== 0) moved = true;
      notify();
    },
    setPanelOpen(open) {
      panelOpen = open;
      if (open) releaseAll();
    },
    setGameSurface(element) {
      gameSurface = element;
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", onVisibility);
      listeners.clear();
    },
  };
}
