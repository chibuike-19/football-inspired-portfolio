import { describe, expect, it } from "vitest";
import { createCamera, fovForAspect, stepCamera } from "@/core/camera";
import { CAMERA } from "@/core/config";
import { gameOwnsKeyboard, joystickToDirection, keysToDirection } from "@/core/input";

const body = { tagName: "BODY" };
const button = { tagName: "BUTTON" };
const surface = { tagName: "DIV" };

describe("keysToDirection", () => {
  it("maps WASD and arrows to the pitch (up = north = -z)", () => {
    expect(keysToDirection(["KeyW"])).toEqual({ x: 0, z: -1 });
    expect(keysToDirection(["ArrowDown"])).toEqual({ x: 0, z: 1 });
    expect(keysToDirection(["KeyA"])).toEqual({ x: -1, z: 0 });
    expect(keysToDirection(["ArrowRight"])).toEqual({ x: 1, z: 0 });
  });

  it("normalises diagonals and ignores duplicate keys", () => {
    const d = keysToDirection(["KeyW", "KeyD"]);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1, 10);
    expect(keysToDirection(["KeyW", "ArrowUp"])).toEqual({ x: 0, z: -1 });
  });

  it("cancels opposite keys", () => {
    expect(keysToDirection(["KeyA", "KeyD"])).toEqual({ x: 0, z: 0 });
  });
});

describe("gameOwnsKeyboard (routing table, SPEC §7.1)", () => {
  it("owns input when nothing or the game surface is focused", () => {
    expect(gameOwnsKeyboard({ active: null, gameSurface: surface, panelOpen: false })).toBe(true);
    expect(gameOwnsKeyboard({ active: body, gameSurface: surface, panelOpen: false })).toBe(true);
    expect(gameOwnsKeyboard({ active: surface, gameSurface: surface, panelOpen: false })).toBe(true);
  });

  it("leaves focused controls and open panels alone", () => {
    expect(gameOwnsKeyboard({ active: button, gameSurface: surface, panelOpen: false })).toBe(false);
    expect(gameOwnsKeyboard({ active: body, gameSurface: surface, panelOpen: true })).toBe(false);
  });
});

describe("joystickToDirection", () => {
  it("has a dead zone and saturates at the radius", () => {
    expect(joystickToDirection(3, 0, 56)).toEqual({ x: 0, z: 0 });
    const full = joystickToDirection(0, -200, 56);
    expect(full.x).toBeCloseTo(0, 10);
    expect(full.z).toBeCloseTo(-1, 10);
  });

  it("maps screen-down to south (+z)", () => {
    expect(joystickToDirection(0, 56, 56).z).toBeGreaterThan(0);
  });
});

describe("camera", () => {
  const still = (ballX: number, ballZ: number) => ({ ballX, ballZ, vx: 0, vz: 0, reducedMotion: false });

  it("settles behind the ball, looking north", () => {
    const c = createCamera(0, 0, false);
    for (let i = 0; i < 600; i++) stepCamera(c, still(10, -5), 1 / 60);
    expect(c.px).toBeCloseTo(10, 2);
    expect(c.pz).toBeCloseTo(-5 + CAMERA.DISTANCE, 2);
    expect(c.tz).toBeLessThan(-5);
    expect(stepCamera(c, still(10, -5), 1 / 60)).toBe(false);
  });

  it("is frame-rate independent", () => {
    const a = createCamera(0, 0, false);
    const b = createCamera(0, 0, false);
    for (let i = 0; i < 30; i++) stepCamera(a, still(8, 0), 1 / 30);
    for (let i = 0; i < 144; i++) stepCamera(b, still(8, 0), 1 / 144);
    expect(a.px).toBeCloseTo(b.px, 6);
  });

  it("never enters the south stand", () => {
    const c = createCamera(0, 0, false);
    for (let i = 0; i < 600; i++) stepCamera(c, still(0, 21), 1 / 60);
    expect(c.pz).toBeLessThanOrEqual(CAMERA.MAX_Z + 1e-9);
  });

  it("looks ahead in the direction of travel, clamped", () => {
    const c = createCamera(0, 0, false);
    for (let i = 0; i < 600; i++) stepCamera(c, { ballX: 0, ballZ: 0, vx: 100, vz: 0, reducedMotion: false }, 1 / 60);
    expect(c.tx).toBeCloseTo(CAMERA.LOOK_AHEAD_MAX, 2);
  });

  it("reduced motion: holds still while the ball stays in the dead zone", () => {
    const c = createCamera(0, 0, true);
    const before = { ...c };
    for (let i = 0; i < 60; i++) stepCamera(c, { ballX: 5, ballZ: 2, vx: 3, vz: 0, reducedMotion: true }, 1 / 60);
    expect(c.px).toBeCloseTo(before.px, 6);
    expect(c.pz).toBeCloseTo(before.pz, 6);
  });

  it("widens the FOV on portrait screens only", () => {
    expect(fovForAspect(16 / 9)).toBe(CAMERA.FOV);
    expect(fovForAspect(390 / 844)).toBeGreaterThan(CAMERA.FOV);
    expect(fovForAspect(0.2)).toBe(CAMERA.MAX_FOV);
  });
});

describe("camera near the south stand", () => {
  it("keeps the ball in the vertical field of view at the south touchline", () => {
    for (const ballZ of [12, 16, 18, 21]) {
      const c = createCamera(0, ballZ, false);
      // Angle below horizontal to the ball vs to the look target.
      const toBall = Math.atan2(c.py - 0.45, ballZ - c.pz < 0 ? c.pz - ballZ : 1e-6);
      const toTarget = Math.atan2(c.py - c.ty, c.pz - c.tz);
      const halfFov = ((CAMERA.FOV / 2) * Math.PI) / 180;
      expect(toBall - toTarget, `ball z=${ballZ}`).toBeLessThan(halfFov * 0.9);
    }
  });
});

describe("landmark focus", () => {
  it("eases the look target towards the landmark and back", () => {
    const c = createCamera(0, 0, false);
    const base = createCamera(0, 0, false);
    for (let i = 0; i < 600; i++) stepCamera(c, { ballX: 0, ballZ: 0, vx: 0, vz: 0, reducedMotion: false, focus: { x: 10, z: 0 } }, 1 / 60);
    expect(c.tx).toBeGreaterThan(base.tx + 1);
    expect(c.focusWeight).toBeGreaterThan(0.99);
    for (let i = 0; i < 600; i++) stepCamera(c, { ballX: 0, ballZ: 0, vx: 0, vz: 0, reducedMotion: false, focus: null }, 1 / 60);
    expect(c.tx).toBeCloseTo(base.tx, 2);
  });

  it("does not jump when focus starts", () => {
    const c = createCamera(0, 0, false);
    const before = c.tx;
    stepCamera(c, { ballX: 0, ballZ: 0, vx: 0, vz: 0, reducedMotion: false, focus: { x: 10, z: 0 } }, 1 / 60);
    expect(Math.abs(c.tx - before)).toBeLessThan(0.1);
  });
});
