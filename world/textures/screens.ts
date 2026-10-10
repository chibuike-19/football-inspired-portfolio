import type { Project } from "@/content/types";
import { createCanvas, fitText, fonts, toTexture, wrapText } from "./canvas";

/** LED perimeter board: project name, one-liner and an accent band. */
export function createBoardTexture(project: Project) {
  const W = 2048;
  const H = 250;
  const { canvas, ctx } = createCanvas(W, H);

  const gradient = ctx.createLinearGradient(0, 0, W, 0);
  gradient.addColorStop(0, "#0d1110");
  gradient.addColorStop(1, "#151b18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Accent block on the left, like a sponsor panel.
  ctx.fillStyle = project.accent;
  ctx.fillRect(0, 0, 36, H);
  ctx.fillStyle = project.accent;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(36, 0, W, H);
  ctx.globalAlpha = 1;

  const left = 90;
  const display = (size: number) => `700 ${size}px ${fonts.display()}`;
  const body = (size: number) => `500 ${size}px ${fonts.body()}`;

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  fitText(ctx, project.name.toUpperCase(), 820, 150, display);
  ctx.fillText(project.name.toUpperCase(), left, H / 2 + 6);

  ctx.font = body(46);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  const lines = wrapText(ctx, project.oneLiner, 980, 2);
  const lineHeight = 60;
  const top = H / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, 990, top + i * lineHeight));

  // LED pixel grid.
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);

  return toTexture(canvas);
}

/** Generic stadium screen: kicker, title and up to two lines of detail. */
export function createScreenTexture(options: {
  width: number;
  height: number;
  kicker: string;
  title: string;
  lines?: string[];
  accent?: string;
}) {
  const { width: W, height: H, kicker, title, lines = [], accent = "#f5b544" } = options;
  const { canvas, ctx } = createCanvas(W, H);

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#0f1513");
  gradient.addColorStop(1, "#090c0b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const pad = W * 0.06;
  const display = (size: number) => `700 ${size}px ${fonts.display()}`;
  const body = (size: number) => `500 ${size}px ${fonts.body()}`;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = accent;
  ctx.font = `700 ${Math.round(H * 0.075)}px ${fonts.display()}`;
  ctx.letterSpacing = `${Math.round(H * 0.012)}px`;
  ctx.fillText(kicker.toUpperCase(), pad, H * 0.22);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#ffffff";
  const titleSize = fitText(ctx, title.toUpperCase(), W - pad * 2, Math.round(H * 0.3), display);
  ctx.fillText(title.toUpperCase(), pad, H * 0.22 + titleSize * 0.95);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  const bodySize = Math.round(H * 0.075);
  ctx.font = body(bodySize);
  lines.slice(0, 2).forEach((line, i) => {
    const fitted = wrapText(ctx, line, W - pad * 2, 1)[0] ?? "";
    ctx.fillText(fitted, pad, H * 0.22 + titleSize + bodySize * 1.6 * (i + 1));
  });

  ctx.fillStyle = accent;
  ctx.fillRect(0, H - H * 0.03, W, H * 0.03);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let x = 0; x < W; x += 5) ctx.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 1);

  return toTexture(canvas);
}
