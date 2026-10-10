// Set NEXT_PUBLIC_SITE_URL at build time once a domain is chosen (see README).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_TITLE = "Emmanuel Obiechina — Frontend-focused Full-Stack Engineer";

export const SITE_DESCRIPTION =
  "Portfolio of Emmanuel Obiechina, a frontend-focused full-stack engineer building production web apps with Next.js, React and TypeScript. Explore it as a 3D football stadium or as a classic page.";
