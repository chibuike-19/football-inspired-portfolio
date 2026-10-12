import { test } from "@playwright/test";
import { collectErrors, enterWorld, expect, phone } from "./helpers";

const isActive = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.classList.contains("world-active"));

test.describe("classic page (default view)", () => {
  test("is the default, with all sections and no 3D loaded", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Emmanuel Obiechina" })).toBeVisible();
    for (const name of ["Selected work", "Experience log", "Stack & practice", "Résumé", "Initiate connection"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    expect(await page.locator("canvas").count()).toBe(0);
    expect(await isActive(page)).toBe(false);
    await expect(page.getByRole("button", { name: /Explore in 3D/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("first Tab reaches the skip link; external links are safe", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe("Skip to content");
    const unsafe = await page.$$eval('a[target="_blank"]', (as) => as.filter((a) => !(a as HTMLAnchorElement).rel.includes("noopener")).length);
    expect(unsafe).toBe(0);
  });

  test("Dynamic Island compacts on scroll and tracks the section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".island-wrap")).not.toHaveAttribute("data-compact", /.*/);
    await page.evaluate(() => document.getElementById("experience")!.scrollIntoView());
    await expect(page.locator(".island-wrap")).toHaveAttribute("data-compact", "true");
    await expect(page.locator(".island-status")).toHaveText(/Experience/);
  });

  test("landmark links stay on the classic page", async ({ page }) => {
    await page.goto("/#contact");
    await page.waitForTimeout(800);
    expect(await isActive(page)).toBe(false);
    await expect(page.getByRole("heading", { name: "Initiate connection" })).toBeInViewport();
  });

  test("project case-study pages and the blog placeholder render", async ({ page }) => {
    for (const slug of ["devspot", "stream2peer", "fcmb-admin-portal", "kam-holding"]) {
      const response = await page.goto(`/projects/${slug}/`);
      expect(response?.status(), slug).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto("/blog/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Coming\s+soon/);
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Initiate connection" })).toBeVisible();
    await context.close();
  });

  test("phone: no horizontal scroll and the island menu opens", async ({ browser }) => {
    const context = await phone(browser);
    const page = await context.newPage();
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(page.locator("#island-menu").getByRole("link", { name: "Blog" })).toBeVisible();
    await context.close();
  });
});

test.describe("3D fallbacks", () => {
  test("without WebGL2: no Explore button, no canvas", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, ...args: unknown[]) => unknown;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          return type === "webgl2" ? null : original.call(this, type, ...rest);
        },
      });
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForTimeout(1000);
    await expect(page.getByRole("button", { name: /Explore in 3D/ })).toHaveCount(0);
    expect(await page.locator("canvas").count()).toBe(0);
    await context.close();
  });

  test("Explore → Classic view → reload stays classic; layer 1 stays accessible", async ({ page }) => {
    await page.goto("/");
    await enterWorld(page);
    const hidden = await page.evaluate(() => {
      const layer = document.querySelector("[data-layer1]")!;
      const island = document.querySelector(".island-wrap");
      return getComputedStyle(layer).clipPath.includes("inset(50%)") && (!island || getComputedStyle(island).display === "none");
    });
    expect(hidden).toBe(true);
    await expect(page.getByRole("heading", { level: 1, name: "Emmanuel Obiechina" })).toHaveCount(1);
    expect(await page.locator("canvas").evaluate((c) => c.closest("[aria-hidden='true']") !== null)).toBe(true);
    await page.locator(".hud").getByRole("button", { name: "Classic view" }).click();
    expect(await isActive(page)).toBe(false);
    await page.reload();
    await page.waitForTimeout(800);
    expect(await isActive(page)).toBe(false);
  });

  test("lost graphics context falls back with a notice", async ({ page }) => {
    await page.goto("/");
    await enterWorld(page);
    await page.evaluate(() => document.querySelector("canvas")!.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext());
    await page.waitForTimeout(500);
    expect(await isActive(page)).toBe(false);
    await expect(page.getByText("couldn't run on this device")).toBeVisible();
  });
});
