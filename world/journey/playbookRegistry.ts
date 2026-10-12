/**
 * DOM nodes the in-canvas projector positions every rendered frame. The overlay
 * (outside the canvas) registers them; nothing here triggers React renders.
 */
export const playbookNodes = {
  markers: new Map<string, HTMLElement>(),
  lines: new Map<string, SVGLineElement>(),
};
