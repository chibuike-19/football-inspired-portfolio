import { expect, type Browser, type Page } from "@playwright/test";

/** Debug-build state exposed by world/World.tsx (window.__world). */
export interface WorldState {
  ball: { x: number; z: number; vx: number; vz: number };
  ballMesh: { x: number; z: number } | null;
  camera: { x: number; y: number; z: number };
  activeLandmarkId: string | null;
  expandedId: string | null;
  autopilot: unknown;
  reducedMotion: boolean;
  experience: "journey" | "freeplay";
  journeyStation: number;
  scoreboard: { kicker: string; title: string; lines: string[] } | null;
  landmarkStates: Record<string, string>;
  stadiumMood: "match" | "closing";
}

declare global {
  interface Window {
    __world: {
      getState: () => WorldState;
      setBall: (x: number, z: number) => void;
      setExperience: (e: "journey" | "freeplay") => void;
      pick: (x: number, y: number) => string | null;
      renderer: () => { calls: number; quality: string };
    };
    __cam: WorldState["camera"][];
  }
}

export const state = (page: Page) => page.evaluate(() => window.__world.getState());

/** Classic view is the default: click "Explore in 3D" (and optionally switch to free play). */
export async function enterWorld(page: Page, { freeplay = false } = {}) {
  await page.getByRole("button", { name: /Explore in 3D/ }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("world-active") && !!window.__world, null, {
    timeout: 25_000,
  });
  if (freeplay) {
    await page.evaluate(() => window.__world.setExperience("freeplay"));
    await page.waitForFunction(() => !!document.querySelector(".game-surface[role=application]"));
    await page.waitForTimeout(300);
  } else {
    await page.waitForFunction(() => window.__world.getState().journeyStation === 0);
  }
}

export async function openJourney(page: Page) {
  await page.goto("/");
  await enterWorld(page);
}

export const hud = (page: Page, name: string) => page.locator(".hud").getByRole("button", { name, exact: true });

export const panel = (page: Page) => page.locator(".journey-panel[data-state='in']");

export async function scrollStations(page: Page, n: number) {
  await page.locator(".journey-scroll").evaluate((el, n) => el.scrollBy({ top: n * el.clientHeight, behavior: "instant" }), n);
}

/** Distance the camera moves over `ms`: ~0 means it is resting. */
export async function cameraDrift(page: Page, ms = 400) {
  const a = (await state(page)).camera;
  await page.waitForTimeout(ms);
  const b = (await state(page)).camera;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Records the camera position every frame into window.__cam. */
export async function startCameraRecorder(page: Page) {
  await page.evaluate(() => {
    window.__cam = [];
    const tick = () => {
      window.__cam.push(window.__world.getState().camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function recordCamera(page: Page, action: () => Promise<unknown>, wait: number) {
  await page.evaluate(() => (window.__cam = []));
  await action();
  await page.waitForTimeout(wait);
  return page.evaluate(() => window.__cam);
}

/** Camera inside the east stand's solid mass (outside the tunnel corridor). */
export const insideStand = (c: WorldState["camera"]) => {
  const inStand = c.x > 36.1 && c.x < 46.4 && Math.abs(c.z) < 24.5 && c.y < 1.4 + (c.x - 36) * 0.68 + 0.3;
  const inCorridor = Math.abs(c.z + 10.2) < 2.0 && c.y < 3.1;
  return inStand && !inCorridor;
};

export const ROOM = { x0: 52.3, x1: 69.5, z0: -16.2, z1: -4.2, h: 5.5 };
export const inRoom = (c: WorldState["camera"]) =>
  c.x > ROOM.x0 && c.x < ROOM.x1 && c.z > ROOM.z0 && c.z < ROOM.z1 && c.y < ROOM.h;

/** Frames where the camera crossed the trophy room's walls anywhere but its doorway or opening. */
export function roomWallCrossings(cams: WorldState["camera"][]) {
  const bad = [];
  for (let i = 1; i < cams.length; i++) {
    const a = cams[i - 1];
    const c = cams[i];
    if (inRoom(a) === inRoom(c)) continue;
    const m = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, z: (a.z + c.z) / 2 };
    const viaDoor = Math.abs(m.x - ROOM.x0) < 1 && Math.abs(m.z + 10.2) < 2.1 && m.y < 3.2;
    const viaOpening = Math.abs(m.z - ROOM.z0) < 1 && m.x > 61.7 && m.x < 65.3 && m.y < 3.4;
    if (!viaDoor && !viaOpening) bad.push(m);
  }
  return bad;
}

/** Collects console errors and page errors. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

export async function phone(browser: Browser) {
  return browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
}

export { expect };
