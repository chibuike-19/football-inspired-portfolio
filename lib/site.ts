import { profile } from "@/content/profile";

/**
 * Absolute site address, used for canonical URLs, social previews, the sitemap
 * and robots.txt. Social platforms can only fetch absolute public URLs, so this
 * must never be localhost in production. In order of preference:
 * 1. NEXT_PUBLIC_SITE_URL: your custom domain (set in Vercel once you have one);
 * 2. VERCEL_PROJECT_PRODUCTION_URL: the project's production address on Vercel
 *    (e.g. football-inspired-portfolio.vercel.app), provided by Vercel at build time;
 * 3. VERCEL_URL: this deployment's address (preview deployments);
 * 4. localhost, for local builds only.
 */
export function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;
  const vercelDeployment = process.env.VERCEL_URL;
  if (vercelDeployment) return `https://${vercelDeployment}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl().replace(/\/$/, "");

export const SITE_TITLE = `${profile.name} — ${profile.headline}`;

export const SITE_DESCRIPTION =
  "Senior full-stack engineer building web products people rely on, from corporate banking tools to hackathon platforms. Explore the portfolio as a classic page or a 3D football stadium.";

/** Social preview image (1200 × 630), served from /public at a stable URL. */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${profile.name}, ${profile.headline}: portfolio preview`,
  type: "image/png",
} as const;
