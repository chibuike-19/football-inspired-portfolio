import { test } from "@playwright/test";
import {
  cameraDrift,
  collectErrors,
  enterWorld,
  expect,
  hud,
  insideStand,
  inRoom,
  openJourney,
  panel,
  phone,
  recordCamera,
  roomWallCrossings,
  scrollStations,
  startCameraRecorder,
  state,
} from "./helpers";

const stationIs = (page: import("@playwright/test").Page, n: number) =>
  page.waitForFunction((n) => window.__world.getState().journeyStation === n, n);

test.describe("journey: core behaviour", () => {
  test("opens on kickoff promptly, then rests", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const t0 = Date.now();
    await enterWorld(page);
    await expect(panel(page)).toContainText("kickoff");
    expect(Date.now() - t0).toBeLessThan(10_000);
    await page.waitForTimeout(3000);
    expect(await cameraDrift(page)).toBeLessThan(0.01);
    expect(errors).toEqual([]);
  });

  test("Kick off, scroll forward, scroll back", async ({ page }) => {
    await openJourney(page);
    await page.getByRole("button", { name: /Kick off/ }).click();
    await stationIs(page, 1);
    expect((await state(page)).scoreboard?.kicker).toBe("The starting XI");
    await page.waitForTimeout(2200);
    expect(await cameraDrift(page)).toBeLessThan(0.01);
    await scrollStations(page, 1);
    await stationIs(page, 2);
    await scrollStations(page, 1);
    await stationIs(page, 3);
    await scrollStations(page, -2);
    await stationIs(page, 1);
  });

  test("Page Down advances (keyboard)", async ({ page }) => {
    await openJourney(page);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.activeElement?.classList.contains("journey-scroll"))).toBe(true);
    await page.keyboard.press("PageDown");
    await stationIs(page, 1);
  });

  test("direct navigation skips intermediate stations; nav stays in sync", async ({ page }) => {
    await openJourney(page);
    await page.evaluate(() => {
      (window as unknown as { __seen: number[] }).__seen = [];
      setInterval(() => {
        const seen = (window as unknown as { __seen: number[] }).__seen;
        const s = window.__world.getState().journeyStation;
        if (seen.at(-1) !== s) seen.push(s);
      }, 16);
    });
    await hud(page, "Full Time").click();
    const last = await page.evaluate(() => document.querySelectorAll(".journey-step").length - 1);
    await stationIs(page, last);
    const seen = await page.evaluate(() => (window as unknown as { __seen: number[] }).__seen);
    expect(seen.length).toBeLessThanOrEqual(2);
    await expect(hud(page, "Full Time")).toHaveAttribute("aria-current", "step");
  });

  test("an interrupted move redirects and settles", async ({ page }) => {
    await openJourney(page);
    await page.waitForTimeout(800);
    await hud(page, "Highlights").click();
    await page.waitForTimeout(250);
    await hud(page, "Trophies").click();
    await page.waitForFunction(() => window.__world.getState().scoreboard?.kicker === "Trophy cabinet");
    await page.waitForTimeout(3000);
    expect(await cameraDrift(page)).toBeLessThan(0.01);
  });

  test("Replay resets without reloading; free play and back", async ({ page }) => {
    await openJourney(page);
    await page.evaluate(() => ((window as unknown as { __marker: boolean }).__marker = true));
    await hud(page, "Full Time").click();
    await page.waitForTimeout(2600);
    expect((await state(page)).stadiumMood).toBe("closing");
    await page.getByRole("button", { name: /Replay the journey/ }).click();
    await page.waitForFunction(() => window.__world.getState().journeyStation === 0 && document.querySelector(".journey-scroll")!.scrollTop === 0);
    expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
    expect((await state(page)).stadiumMood).toBe("match");
    await hud(page, "Free play").click();
    await page.waitForFunction(() => window.__world.getState().experience === "freeplay");
    await page.getByRole("button", { name: "Guided tour" }).click();
    await page.waitForFunction(() => window.__world.getState().experience === "journey");
  });

  test("phone: a swipe advances the story", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).tap();
    await page.waitForFunction(() => window.__world?.getState().journeyStation === 0, null, { timeout: 25_000 });
    await page.waitForTimeout(2500);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.synthesizeScrollGesture", { x: 195, y: 300, yDistance: -700, speed: 1600 });
    await page.waitForFunction(() => window.__world.getState().journeyStation >= 1, null, { timeout: 5000 });
    await context.close();
  });
});

test.describe("journey: chapters", () => {
  test("playbook: 11 markers, readable, selectable, camera still", async ({ page }) => {
    await openJourney(page);
    await hud(page, "Playbook").click();
    await page.waitForTimeout(2800);
    const markers = page.locator(".playbook-marker button");
    await expect(markers).toHaveCount(11);
    const boxes = await markers.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    for (const r of boxes) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(70);
      expect(r.x + r.width).toBeLessThanOrEqual(1440);
    }
    let overlaps = 0;
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps++;
      }
    expect(overlaps).toBe(0);
    const before = await cameraDrift(page, 0);
    await markers.filter({ hasText: "Python AI agents" }).hover();
    await expect(panel(page)).toContainText("JudgeBot");
    await markers.filter({ hasText: "Testing & CI" }).focus();
    await expect(panel(page)).toContainText("85%+");
    expect(before + (await cameraDrift(page, 200))).toBeLessThan(0.001);
    await page.locator(".journey-scroll").focus();
    await page.keyboard.press("PageDown");
    await expect(page.locator(".playbook-layer")).toHaveCount(0, { timeout: 4000 });
  });

  test("highlights: board focus, dimming, dots, tunnel handoff", async ({ page }) => {
    await openJourney(page);
    await hud(page, "Highlights").click();
    await page.waitForTimeout(2600);
    let s = await state(page);
    expect(s.landmarkStates["project:devspot"]).toBe("active");
    expect(s.landmarkStates["project:stream2peer"]).toBe("dim");
    expect(s.scoreboard?.title).toBe("DevSpot");
    await panel(page).getByRole("button", { name: "Next" }).click();
    await page.waitForFunction(() => window.__world.getState().scoreboard?.title === "Stream2Peer");
    await panel(page).getByRole("button", { name: "KAM Holding" }).click();
    await page.waitForFunction(() => window.__world.getState().scoreboard?.title === "KAM Holding");
    await page.waitForTimeout(1500);
    await scrollStations(page, 1);
    await page.waitForTimeout(250);
    s = await state(page);
    expect(s.scoreboard?.title).toBe("Every highlight has a story");
    expect(s.activeLandmarkId).toBe("resume");
    await page.waitForFunction(() => window.__world.getState().scoreboard?.kicker === "Match history");
  });

  test("tunnel: in through the mouth, forward stops, never through the stand", async ({ page }) => {
    await openJourney(page);
    await startCameraRecorder(page);
    await hud(page, "Highlights").click();
    await page.waitForTimeout(2000);
    await panel(page).getByRole("button", { name: "KAM Holding" }).click();
    await page.waitForTimeout(1600);
    let cams = await recordCamera(page, () => scrollStations(page, 1), 2800);
    expect(cams.some((c) => Math.abs(c.x - 34.4) < 1.5 && Math.abs(c.z + 10.2) < 1.5 && c.y < 2.6)).toBe(true);
    expect(cams.filter(insideStand)).toEqual([]);
    let lastX = (await state(page)).camera.x;
    for (let i = 0; i < 3; i++) {
      cams = await recordCamera(page, () => scrollStations(page, 1), 1500);
      expect(cams.every((c) => Math.abs(c.z + 10.2) < 2.05 && c.y < 3.15)).toBe(true);
      const x = (await state(page)).camera.x;
      expect(x).toBeGreaterThan(lastX + 2);
      lastX = x;
    }
    cams = await recordCamera(page, () => hud(page, "Kickoff").click(), 2800);
    expect(cams.filter(insideStand)).toEqual([]);
    cams = await recordCamera(
      page,
      async () => {
        await hud(page, "Journey").click();
        await page.waitForTimeout(100);
        await panel(page).getByRole("button", { name: "Browndotmedia" }).click();
      },
      3000,
    );
    expect(cams.filter(insideStand)).toEqual([]);
  });

  test("trophy room: only through its openings; full time closes the loop", async ({ page }) => {
    await openJourney(page);
    await startCameraRecorder(page);
    await hud(page, "Journey").click();
    await page.waitForTimeout(2600);
    await panel(page).getByRole("button", { name: "NitHub" }).click();
    await page.waitForTimeout(1600);
    let cams = await recordCamera(page, () => scrollStations(page, 1), 3000);
    expect(roomWallCrossings(cams)).toEqual([]);
    expect(inRoom((await state(page)).camera)).toBe(true);
    for (let i = 0; i < 4; i++) {
      cams = await recordCamera(page, () => scrollStations(page, 1), 1700);
      expect(cams.every(inRoom)).toBe(true);
    }
    cams = await recordCamera(page, () => scrollStations(page, 1), 3400);
    expect(roomWallCrossings(cams)).toEqual([]);
    expect(cams.filter(insideStand)).toEqual([]);
    const s = await state(page);
    expect(s.scoreboard?.title).toBe("Full time");
    await page.waitForFunction(() => Math.hypot(window.__world.getState().ballMesh!.x, window.__world.getState().ballMesh!.z) < 0.5);
    await hud(page, "Kickoff").click();
    await page.waitForTimeout(2800);
    cams = await recordCamera(page, () => hud(page, "Trophies").click(), 3400);
    expect(roomWallCrossings(cams)).toEqual([]);
    expect(cams.filter(insideStand)).toEqual([]);
    cams = await recordCamera(page, () => hud(page, "Highlights").click(), 3400);
    expect(roomWallCrossings(cams)).toEqual([]);
    expect(cams.filter(insideStand)).toEqual([]);
  });
});
