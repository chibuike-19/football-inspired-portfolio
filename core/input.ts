import type { Vec2 } from "./math";

/** Movement keys (SPEC §7.1). `KeyboardEvent.code`, so layouts like AZERTY use the same physical keys. */
const KEY_DIRECTIONS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export const isMovementKey = (code: string) => code in KEY_DIRECTIONS;

/**
 * Converts held keys to a direction on the pitch. The camera always looks north,
 * so "up" is -z. Diagonals are normalised so they are not faster.
 */
export function keysToDirection(held: Iterable<string>): Vec2 {
  let x = 0;
  let z = 0;
  const seen = new Set<string>();
  for (const code of held) {
    const direction = KEY_DIRECTIONS[code];
    if (!direction) continue;
    // W and ArrowUp together should not double the input.
    const key = `${direction[0]},${direction[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    x += direction[0];
    z += direction[1];
  }
  const len = Math.hypot(x, z);
  return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
}

/** Minimal element shape so routing can be tested without a DOM. */
export interface FocusTarget {
  tagName: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
}

export interface RoutingContext {
  /** document.activeElement (null or <body> when nothing is focused). */
  active: FocusTarget | null;
  /** The game surface element, if focused it owns input. */
  gameSurface: FocusTarget | null;
  /** An expanded panel is open (Phase 6): the game ignores movement. */
  panelOpen: boolean;
}

/**
 * Input routing table (SPEC §7.1): the game owns movement keys only when
 * nothing interactive has focus and no panel is open.
 */
export function gameOwnsKeyboard({ active, gameSurface, panelOpen }: RoutingContext): boolean {
  if (panelOpen) return false;
  if (!active) return true;
  if (active === gameSurface) return true;
  const tag = active.tagName.toUpperCase();
  return tag === "BODY" || tag === "HTML";
}

/** Joystick drag → direction, with a small dead zone. `dy` is screen-down. */
export function joystickToDirection(dx: number, dy: number, radius: number, deadZone = 0.12): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, z: 0 };
  const magnitude = Math.min(1, len / radius);
  if (magnitude < deadZone) return { x: 0, z: 0 };
  // Rescale so movement starts smoothly at the dead-zone edge.
  const scaled = (magnitude - deadZone) / (1 - deadZone);
  return { x: (dx / len) * scaled, z: (dy / len) * scaled };
}
