import { CanvasTexture, SRGBColorSpace } from "three";

/** Reads a next/font family from its CSS variable so canvas text matches the page. */
function fontFamily(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

export const fonts = {
  display: () => fontFamily("--font-iceland", "'Arial Narrow', sans-serif"),
  body: () => fontFamily("--font-geist", "system-ui, sans-serif"),
};

/** Resolves once the page fonts used by canvas textures are ready. */
export async function loadCanvasFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  await Promise.all([
    document.fonts.load(`400 64px ${fonts.display()}`),
    document.fonts.load(`600 64px ${fonts.body()}`),
  ]).catch(() => undefined);
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

export function toTexture(canvas: HTMLCanvasElement, anisotropy = 8): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** Shrinks the font until the text fits `maxWidth`. Returns the size used. */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  font: (size: number) => string,
): number {
  let size = startSize;
  ctx.font = font(size);
  while (size > 8 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

/** Word-wraps `text` into at most `maxLines` lines, adding an ellipsis if cut. */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  // Compare word content only: runs of spaces in `text` collapse when re-joined.
  if (lines.length === maxLines && lines.join(" ").length < words.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}
