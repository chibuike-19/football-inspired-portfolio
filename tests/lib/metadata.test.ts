import { afterEach, describe, expect, it, vi } from "vitest";
import { pageMetadata } from "@/lib/metadata";
import { OG_IMAGE, resolveSiteUrl } from "@/lib/site";

describe("site URL for social previews", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the custom domain", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.dev");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "portfolio.vercel.app");
    expect(resolveSiteUrl()).toBe("https://example.dev");
  });

  it("falls back to the Vercel production address, never localhost on Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "portfolio.vercel.app");
    expect(resolveSiteUrl()).toBe("https://portfolio.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "portfolio-abc123.vercel.app");
    expect(resolveSiteUrl()).toBe("https://portfolio-abc123.vercel.app");
  });
});

describe("pageMetadata", () => {
  const m = pageMetadata({ title: "DevSpot — Emmanuel Obiechina", description: "d", path: "/projects/devspot/" });

  it("always includes the preview image for Open Graph and X", () => {
    expect(m.openGraph?.images).toEqual([OG_IMAGE]);
    expect(m.twitter?.images).toEqual([OG_IMAGE]);
    expect((m.twitter as { card?: string }).card).toBe("summary_large_image");
  });

  it("uses the page's own URL and an absolute title", () => {
    expect(m.openGraph?.url).toBe("/projects/devspot/");
    expect(m.title).toEqual({ absolute: "DevSpot — Emmanuel Obiechina" });
  });

  it("points at an image within social-platform size guidance", () => {
    expect(OG_IMAGE.width).toBe(1200);
    expect(OG_IMAGE.height).toBe(630);
  });
});
