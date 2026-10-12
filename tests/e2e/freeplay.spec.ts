import { test } from "@playwright/test";
import { collectErrors, enterWorld, expect, phone, state } from "./helpers";

const hudButton = (page: import("@playwright/test").Page, name: string) =>
  page.locator(".hud").getByRole("button", { name, exact: true });

test.describe("free play", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await enterWorld(page, { freeplay: true });
  });

  test("keyboard drives the ball, it decelerates, the page doesn't scroll", async ({ page }) => {
    const errors = collectErrors(page);
    await page.evaluate(() => window.__world.setBall(0, 0));
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1000);
    const moving = (await state(page)).ball;
    await page.keyboard.up("KeyW");
    expect(moving.z).toBeLessThan(-5);
    expect(Math.abs(moving.vz)).toBeGreaterThan(8);
    await page.waitForTimeout(2500);
    expect((await state(page)).ball.vz).toBe(0);
    await page.keyboard.press("ArrowDown");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
  });

  test("boards stop the ball; the goal mouth is open", async ({ page }) => {
    await page.evaluate(() => window.__world.setBall(-26, -15));
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1500);
    await page.keyboard.up("KeyW");
    expect((await state(page)).ball.z).toBeGreaterThan(-21.3);
    await page.evaluate(() => window.__world.setBall(24, 0));
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(1200);
    await page.keyboard.up("KeyD");
    await page.waitForTimeout(800);
    expect((await state(page)).ball.x).toBeGreaterThan(30.3);
  });

  test("discovery: preview with no click, dismissed when leaving", async ({ page }) => {
    await page.evaluate(() => window.__world.setBall(-18, -17.5));
    await page.waitForTimeout(900);
    expect((await state(page)).activeLandmarkId).toBe("project:stream2peer");
    await expect(page.locator(".preview-card")).toContainText("Co-founder");
    await page.evaluate(() => window.__world.setBall(10, 5));
    await page.waitForTimeout(900);
    expect((await state(page)).activeLandmarkId).toBeNull();
  });

  test("menu: autopilot, panel, focus trap, Esc, Back", async ({ page }) => {
    await hudButton(page, "Experience").click();
    await page.waitForFunction(() => window.__world.getState().activeLandmarkId === "experience" && !window.__world.getState().autopilot);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Experience" })).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe("#experience");
    for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await hudButton(page, "Résumé").click();
    await expect(page.getByRole("dialog", { name: "Résumé" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("phone: touch drag moves the ball", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).tap();
    await page.waitForFunction(() => !!window.__world, null, { timeout: 25_000 });
    await page.evaluate(() => window.__world.setExperience("freeplay"));
    await page.waitForFunction(() => !!document.querySelector(".game-surface[role=application]"));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__world.setBall(0, 0));
    const cdp = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    // Upper half: the lower part of a phone screen holds the preview sheet, which the joystick ignores.
    await touch("touchStart", 200, 320);
    for (let i = 1; i <= 5; i++) await touch("touchMove", 200 + i * 14, 320);
    await page.waitForTimeout(900);
    await touch("touchEnd", 0, 0);
    expect((await state(page)).ball.x).toBeGreaterThan(3);
    await context.close();
  });
});
