import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests (SPEC §15.2). They need a debug build (window.__world hooks):
 * `npm run test:e2e` builds with NEXT_PUBLIC_WORLD_DEBUG=1, then runs these.
 * Uses the installed Google Chrome with GPU flags so WebGL2 is available headless.
 */
const chrome = {
  channel: "chrome",
  launchOptions: { args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-unsafe-swiftshader"] },
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", ...chrome },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, ...chrome } },
  ],
  webServer: {
    command: "node scripts/serve-static.mjs out 4173",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
