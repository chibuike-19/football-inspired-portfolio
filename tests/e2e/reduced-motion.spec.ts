import { test } from "@playwright/test";
import { expect, hud, phone, state } from "./helpers";

test.use({ reducedMotion: "reduce" });

const CHAPTERS = ["The Player", "Playbook", "Highlights", "Journey", "Trophies", "Full Time", "Kickoff"];

test.describe("reduced motion", () => {
  test("classic page: no ambient animation", async ({ page }) => {
    await page.goto("/");
    const animations = await page.evaluate(() =>
      [".hero-aurora", ".graph-link", ".live-dot", ".caret"].map((s) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el).animationName : "none";
      }),
    );
    expect(animations.every((a) => a === "none")).toBe(true);
  });

  test("every chapter: the camera cuts, nothing travels or eases", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).click();
    await page.waitForFunction(() => window.__world?.getState().journeyStation === 0, null, { timeout: 25_000 });
    expect((await state(page)).reducedMotion).toBe(true);
    for (const chapter of CHAPTERS) {
      await hud(page, chapter).click();
      await page.waitForTimeout(150);
      const a = (await state(page)).camera;
      await page.waitForTimeout(350);
      const b = (await state(page)).camera;
      expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), chapter).toBeLessThan(0.01);
      // Panels appear immediately (fade only, no delay).
      const delay = await page.locator(".journey-panel[data-state='in']").evaluate((e) => getComputedStyle(e).animationDelay);
      expect(delay, chapter).toBe("0s");
    }
  });

  test("the ball teleports instead of rolling", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).click();
    await page.waitForFunction(() => window.__world?.getState().journeyStation === 0, null, { timeout: 25_000 });
    await hud(page, "Highlights").click();
    await page.waitForTimeout(150);
    const ball = (await state(page)).ballMesh!;
    expect(ball.z).toBeLessThan(-15);
  });

  test("HUD toggle overrides the system setting, and is remembered", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).click();
    await page.waitForFunction(() => !!window.__world, null, { timeout: 25_000 });
    const toggle = page.locator(".hud").getByRole("button", { name: "Reduce motion" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect((await state(page)).reducedMotion).toBe(false);
    await toggle.click();
  });

  test("phone: chapters still navigable", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: /Explore in 3D/ }).tap();
    await page.waitForFunction(() => window.__world?.getState().journeyStation === 0, null, { timeout: 25_000 });
    await page.getByRole("button", { name: "Chapters" }).tap();
    await page.locator("#journey-menu").getByRole("button", { name: "Full Time" }).tap();
    await page.waitForTimeout(200);
    expect((await state(page)).scoreboard?.title).toBe("Full time");
    await context.close();
  });
});
