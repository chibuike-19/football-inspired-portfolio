/** Preview card placement on screen (SPEC §10.1). Pure: pixels in, pixels out. */

export interface Placement {
  x: number;
  y: number;
}

export const MARGIN = 16;
/** Keeps cards clear of the top bar. */
export const TOP_SAFE = 76;
/** Half-size of the square around the ball that cards must not cover. */
export const BALL_CLEARANCE = 56;

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * Chooses where the card goes (SPEC §10.1). In order: above the landmark,
 * beside it away from the ball, beside it towards the ball. The first spot that
 * fits on screen without covering the landmark or the ball wins; otherwise the
 * card docks in a lower corner away from the ball.
 */
export function chooseCardPosition(
  view: { width: number; height: number },
  card: { width: number; height: number },
  /** On-screen bounds of the landmark (its top edge is the anchor), or null if off-screen. */
  structure: Rect | null,
  ball: { x: number; y: number },
  mode: "anchor" | "dock",
): Placement {
  const { width: w, height: h } = view;
  const { width: cw, height: ch } = card;
  const ballRect: Rect = {
    left: ball.x - BALL_CLEARANCE,
    right: ball.x + BALL_CLEARANCE,
    top: ball.y - BALL_CLEARANCE,
    bottom: ball.y + BALL_CLEARANCE,
  };
  const fits = (x: number, y: number) => x >= MARGIN && y >= TOP_SAFE && x + cw <= w - MARGIN && y + ch <= h - MARGIN;
  const clear = (x: number, y: number, avoid: Rect | null) => {
    const r = { left: x, top: y, right: x + cw, bottom: y + ch };
    return !intersects(r, ballRect) && (!avoid || !intersects(r, avoid));
  };

  if (mode === "anchor" && structure) {
    const gap = 20;
    const avoid: Rect = {
      left: structure.left - gap / 2,
      right: structure.right + gap / 2,
      top: structure.top - gap / 2,
      bottom: structure.bottom,
    };
    const centreX = (structure.left + structure.right) / 2;
    const midY = (structure.top + structure.bottom) / 2;
    const away = ball.x <= centreX ? 1 : -1;
    const clampX = (x: number) => Math.min(Math.max(x, MARGIN), w - cw - MARGIN);
    const right = structure.right + gap;
    const left = structure.left - gap - cw;
    const candidates: Placement[] = [
      { x: clampX(centreX - cw / 2), y: structure.top - gap - ch },
      { x: away > 0 ? right : left, y: midY - ch / 2 },
      { x: away > 0 ? left : right, y: midY - ch / 2 },
    ];
    for (const c of candidates) {
      const y = Math.min(Math.max(c.y, TOP_SAFE), h - ch - MARGIN);
      if (fits(c.x, y) && clear(c.x, y, avoid)) return { x: c.x, y };
    }
  }

  // Dock in the lower corner on the side away from the ball.
  const x = ball.x < w / 2 ? w - cw - MARGIN * 2 : MARGIN * 2;
  const y = h - ch - MARGIN * 2;
  if (clear(x, y, null)) return { x, y };
  return { x, y: Math.max(TOP_SAFE, ball.y - BALL_CLEARANCE - ch) };
}

