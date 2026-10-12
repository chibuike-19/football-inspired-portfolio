"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Vector3, type Camera } from "three";
import { playbook } from "@/content";
import { useWorldStore } from "@/state/store";
import { FORMATION_ORIGIN, formationPositions } from "./formation";
import { playbookNodes } from "./playbookRegistry";
import { STATIONS } from "./stations";

const POSITIONS = formationPositions(playbook);
const point = new Vector3();

function toScreen(x: number, z: number, camera: Camera, width: number, height: number): [number, number] {
  point.set(x, 0.05, z).project(camera);
  return [((point.x + 1) / 2) * width, ((1 - point.y) / 2) * height];
}

/** Writes marker and line positions straight to the DOM (no React renders per frame). */
function placeNodes(camera: Camera, width: number, height: number) {
  const [ox, oy] = toScreen(FORMATION_ORIGIN[0], FORMATION_ORIGIN[1], camera, width, height);
  for (const [id, [x, z]] of POSITIONS) {
    const [sx, sy] = toScreen(x, z, camera, width, height);
    const marker = playbookNodes.markers.get(id);
    if (marker) marker.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    const line = playbookNodes.lines.get(id);
    if (line) {
      line.setAttribute("x1", ox.toFixed(1));
      line.setAttribute("y1", oy.toFixed(1));
      line.setAttribute("x2", sx.toFixed(1));
      line.setAttribute("y2", sy.toFixed(1));
    }
  }
}

/**
 * Inside the canvas: projects the formation onto the screen on every rendered
 * frame. The camera rests during the playbook, so this costs nothing while reading.
 */
export function PlaybookProjector() {
  useFrame(({ camera, size }) => {
    if (playbookNodes.markers.size === 0) return;
    placeNodes(camera, size.width, size.height);
  });
  return null;
}

const LINE_ORDER = ["attack", "midfield", "defence", "goalkeeper"] as const;

/**
 * The "Starting XI" overlay: tactical lines drawn outward from the ball, then
 * markers appearing line by line. Markers are real buttons: hover, keyboard
 * focus or tap selects one and its details show in the panel. The camera stays
 * still while the visitor explores (spec §3, Playbook).
 */
export function PlaybookOverlay() {
  const station = useWorldStore((s) => s.journeyStation);
  const delay = useWorldStore((s) => s.panelDelay);
  const selected = useWorldStore((s) => s.playbookSkill);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);
  const active = STATIONS[station]?.chapter === "playbook";
  // Present (for the exit animation) from first entry until faded out.
  const [mounted, setMounted] = useState(active);
  if (active && !mounted) setMounted(true);

  // Leaving the chapter closes the selected skill.
  useEffect(() => {
    if (!active) useWorldStore.getState().setPlaybookSkill(null);
  }, [active]);

  if (!mounted) return null;
  const select = (id: string) => useWorldStore.getState().setPlaybookSkill(id);
  // Stagger: lines from the ball outwards first, then markers line by line (spec §5: 0.2–0.4 s each).
  const order = (id: string) => {
    const skill = playbook.find((s) => s.id === id)!;
    return LINE_ORDER.indexOf(skill.line) * 4 + playbook.filter((s) => s.line === skill.line).indexOf(skill);
  };

  return (
    <div
      className="playbook-layer"
      data-state={active ? "in" : "out"}
      style={{ ["--pb-delay" as string]: `${reducedMotion ? 0 : delay}s` }}
      onTransitionEnd={(event) => {
        if (!active && event.target === event.currentTarget) setMounted(false);
      }}
    >
      <svg className="playbook-lines" aria-hidden="true">
        {playbook.map((skill) => (
          <line
            key={skill.id}
            ref={(el) => {
              if (el) playbookNodes.lines.set(skill.id, el);
              else playbookNodes.lines.delete(skill.id);
            }}
            pathLength={1}
            data-selected={selected === skill.id || undefined}
            style={{ ["--i" as string]: order(skill.id) }}
          />
        ))}
      </svg>
      <ul aria-label="The starting XI: select a player to see the skill">
        {playbook.map((skill, index) => (
          <li
            key={skill.id}
            className="playbook-marker"
            ref={(el) => {
              if (el) playbookNodes.markers.set(skill.id, el);
              else playbookNodes.markers.delete(skill.id);
            }}
            style={{ ["--i" as string]: order(skill.id) }}
          >
            <button
              type="button"
              data-ui
              aria-pressed={selected === skill.id}
              tabIndex={active ? 0 : -1}
              onPointerEnter={(event) => event.pointerType === "mouse" && select(skill.id)}
              onFocus={() => select(skill.id)}
              onClick={() => select(skill.id)}
            >
              {/* Shirt numbers: 1 in goal, 2–5 defence, 6–8 midfield, 9–11 attack. */}
              <span aria-hidden="true" className="playbook-dot">
                {index + 1}
              </span>
              <span className="playbook-name">{skill.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
