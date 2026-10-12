import { test } from "@playwright/test";
import { enterWorld, expect, state } from "./helpers";

test("autoplay advances from kickoff on its own, pauses, and stops at full time", async ({ page }) => {
  await page.goto("/?dwell=0.4");
  await enterWorld(page, { keepAutoplay: true });
  await page.waitForFunction(() => window.__world.getState().journeyStation >= 2, null, { timeout: 15_000 });
  await page.locator(".hud").getByRole("button", { name: "Pause tour" }).first().click();
  const paused = (await state(page)).journeyStation;
  await page.waitForTimeout(3000);
  expect((await state(page)).journeyStation).toBe(paused);
  await page.locator(".hud").getByRole("button", { name: "Play tour" }).first().click();
  const last = await page.evaluate(() => document.querySelectorAll(".journey-step").length - 1);
  await page.waitForFunction((last) => window.__world.getState().journeyStation === last, last, { timeout: 80_000 });
  await page.waitForTimeout(2000);
  expect((await state(page)).journeyStation).toBe(last);
});
