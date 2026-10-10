import { describe, expect, it } from "vitest";
import { experience, getProject, projects } from "@/content";
import { GOAL, PITCH } from "@/world/layout";
import { LANDMARKS } from "@/world/landmarks";

const distance = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("landmark layout", () => {
  it("has unique ids and one board per project", () => {
    const ids = LANDMARKS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LANDMARKS.filter((l) => l.kind === "board")).toHaveLength(projects.length);
  });

  it("every landmark resolves to content", () => {
    for (const landmark of LANDMARKS) {
      if (landmark.kind === "board") expect(getProject(landmark.contentId), landmark.id).toBeDefined();
    }
    expect(experience.length).toBeGreaterThanOrEqual(2); // the dugout screen shows two roles
  });

  it("discovery positions are on the pitch, where the ball can reach them", () => {
    for (const { id, position } of LANDMARKS) {
      expect(Math.abs(position[0]), id).toBeLessThan(PITCH.halfLength);
      expect(Math.abs(position[1]), id).toBeLessThan(PITCH.halfWidth);
    }
  });

  it("project boards are at least 6 units apart (SPEC §5.1)", () => {
    const boards = LANDMARKS.filter((l) => l.kind === "board");
    for (let i = 0; i < boards.length; i++) {
      for (let j = i + 1; j < boards.length; j++) {
        expect(distance(boards[i].position, boards[j].position)).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it("activation zones never overlap, so only distance decides what is active", () => {
    for (let i = 0; i < LANDMARKS.length; i++) {
      for (let j = i + 1; j < LANDMARKS.length; j++) {
        const a = LANDMARKS[i];
        const b = LANDMARKS[j];
        expect(distance(a.position, b.position), `${a.id} ↔ ${b.id}`).toBeGreaterThanOrEqual(a.activeRadius + b.activeRadius);
      }
    }
  });

  it("the camera faces every landmark's display (structures on the north side or ends)", () => {
    for (const { id, structure } of LANDMARKS) expect(structure[2], id).toBeLessThan(PITCH.halfWidth);
  });

  it("no landmark sits in a goal mouth", () => {
    for (const { id, position } of LANDMARKS) {
      const inMouth = Math.abs(position[1]) < GOAL.halfWidth && Math.abs(position[0]) > PITCH.halfLength - 2;
      expect(inMouth, id).toBe(false);
    }
  });

  it("all landmarks are a short roll from spawn (≤ 30 units)", () => {
    for (const { id, position } of LANDMARKS) expect(distance(position, [0, 0]), id).toBeLessThanOrEqual(30);
  });
});
