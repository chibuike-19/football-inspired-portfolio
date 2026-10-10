import { describe, expect, it } from "vitest";
import { BALL_CLEARANCE, chooseCardPosition, MARGIN, TOP_SAFE, type Rect } from "@/core/placement";

/** A structure 260 px wide and 120 px tall whose top-centre is (x, y). */
const at = (x: number, y: number): Rect => ({ left: x - 130, right: x + 130, top: y, bottom: y + 120 });
const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const view = { width: 1440, height: 900 };
const card = { width: 352, height: 300 };

const rect = (p: { x: number; y: number }) => ({ left: p.x, top: p.y, right: p.x + card.width, bottom: p.y + card.height });
const coversPoint = (p: { x: number; y: number }, x: number, y: number, pad: number) => {
  const r = rect(p);
  return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
};
const onScreen = (p: { x: number; y: number }) =>
  p.x >= MARGIN && p.y >= TOP_SAFE && p.x + card.width <= view.width - MARGIN && p.y + card.height <= view.height - MARGIN;

describe("chooseCardPosition", () => {
  it("prefers a spot above the landmark when there is room", () => {
    const p = chooseCardPosition(view, card, at(700, 520), { x: 720, y: 700 }, "anchor");
    expect(p.y + card.height).toBeLessThanOrEqual(520 - 20);
    expect(onScreen(p)).toBe(true);
  });

  it("goes beside the landmark, away from the ball, when above does not fit", () => {
    const p = chooseCardPosition(view, card, at(700, 200), { x: 600, y: 600 }, "anchor");
    expect(p.x).toBeGreaterThan(830); // ball is left, card goes right of the structure
    expect(onScreen(p)).toBe(true);
  });

  it("never covers the ball or the landmark structure", () => {
    for (const [ax, ay, bx, by] of [
      [1300, 300, 720, 680],
      [140, 520, 700, 690],
      [720, 440, 720, 690],
      [720, 150, 720, 400],
    ]) {
      const p = chooseCardPosition(view, card, at(ax, ay), { x: bx, y: by }, "anchor");
      expect(coversPoint(p, bx, by, BALL_CLEARANCE), `ball ${bx},${by}`).toBe(false);
      if (onScreen(p)) expect(intersects(rect(p), at(ax, ay)), `structure ${ax},${ay}`).toBe(false);
      expect(onScreen(p) || p.y >= TOP_SAFE, `${ax},${ay}`).toBe(true);
    }
  });

  it("docks in a lower corner away from the ball for dock landmarks", () => {
    const p = chooseCardPosition(view, card, at(720, 600), { x: 720, y: 680 }, "dock");
    expect(p.y + card.height).toBeGreaterThan(view.height - 60);
    expect(coversPoint(p, 720, 680, BALL_CLEARANCE)).toBe(false);
    const left = chooseCardPosition(view, card, null, { x: 1100, y: 680 }, "dock");
    expect(left.x).toBeLessThan(400);
  });

  it("keeps clear of a wide structure near the screen edge", () => {
    const sign: Rect = { left: 1130, right: 1400, top: 300, bottom: 470 };
    const p = chooseCardPosition(view, card, sign, { x: 700, y: 676 }, "anchor");
    expect(intersects(rect(p), sign)).toBe(false);
  });

  it("docks when the anchor is off-screen", () => {
    const p = chooseCardPosition(view, card, null, { x: 300, y: 650 }, "anchor");
    expect(p.x).toBeGreaterThan(view.width / 2);
  });
});
