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

  it("every project has a link, or says why it has none, and an accent colour", () => {
    for (const project of projects) {
      if (project.kind === "open-source") expect(project.links.length, project.slug).toBeGreaterThan(0);
      if (project.links.length === 0) expect(project.access, project.slug).toBeTruthy();
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

describe("playbook", () => {
  it("is a starting XI in a 4-3-3", async () => {
    const { playbook } = await import("@/content");
    const count = (line: string) => playbook.filter((s) => s.line === line).length;
    expect(playbook).toHaveLength(11);
    expect([count("goalkeeper"), count("defence"), count("midfield"), count("attack")]).toEqual([1, 4, 3, 3]);
    expect(new Set(playbook.map((s) => s.id)).size).toBe(11);
  });

  it("has unique shirt numbers 1–11", async () => {
    const { playbook } = await import("@/content");
    expect(playbook.map((s) => s.position).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("only uses existing capability groups", async () => {
    const { playbook, profile } = await import("@/content");
    const groups = new Set(profile.capabilities.map((c) => c.title));
    for (const skill of playbook) expect(groups.has(skill.group), skill.id).toBe(true);
  });
});
