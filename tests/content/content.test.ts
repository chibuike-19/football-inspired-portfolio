import { describe, expect, it } from "vitest";
import { contact, experience, getProject, projects } from "@/content";
import type { ExternalLink } from "@/content/types";
import { formatRange } from "@/lib/format";

const allLinks: ExternalLink[] = [
  contact.github,
  contact.linkedin,
  contact.resume,
  ...projects.flatMap((project) => project.links),
];

describe("content integrity", () => {
  it("has unique project slugs and experience ids", () => {
    const slugs = projects.map((p) => p.slug);
    const ids = experience.map((e) => e.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses URL-safe project slugs", () => {
    for (const project of projects) expect(project.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("cross-references resolve in both directions", () => {
    for (const entry of experience) {
      if (!entry.projectSlug) continue;
      const project = getProject(entry.projectSlug);
      expect(project, entry.id).toBeDefined();
      expect(project?.experienceId).toBe(entry.id);
    }
    for (const project of projects) {
      if (!project.experienceId) continue;
      expect(experience.some((e) => e.id === project.experienceId), project.slug).toBe(true);
    }
  });

  it("links are https or site-relative, with no placeholders", () => {
    for (const link of allLinks) {
      expect(link.href, link.label).toMatch(/^(https:\/\/|\/)/);
      expect(link.href.toLowerCase()).not.toContain("todo");
    }
  });

  it("every project has at least one link and accent colour", () => {
    for (const project of projects) {
      expect(project.links.length, project.slug).toBeGreaterThan(0);
      expect(project.accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("experience is ordered by end date (current first), with valid date ranges", () => {
    const ends = experience.map((e) => e.positions[0].end ?? "9999-12");
    expect([...ends].sort().reverse()).toEqual(ends);
    for (const entry of experience) {
      for (const position of entry.positions) {
        if (position.end) expect(position.end >= position.start, entry.id).toBe(true);
      }
    }
  });
});

describe("formatRange", () => {
  it("formats closed and open ranges", () => {
    expect(formatRange({ start: "2025-03", end: "2026-04" })).toBe("Mar 2025 – Apr 2026");
    expect(formatRange({ start: "2024-11", end: null })).toBe("Nov 2024 – Present");
  });
});
