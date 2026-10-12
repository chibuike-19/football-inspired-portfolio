import type { PlaybookSkill } from "@/content/types";

/**
 * 4-3-3 on the pitch (x along the length, z across), attacking west. Lines are
 * ~12 units apart so labels on the same row never touch; the ball at the
 * centre spot sits between midfield and attack, and the tactical lines fan out
 * from it in both directions.
 */
const LINE_X: Record<PlaybookSkill["line"], number> = { goalkeeper: 26, defence: 16, midfield: 4, attack: -8 };
const LINE_Z: Record<PlaybookSkill["line"], number[]> = {
  goalkeeper: [0],
  defence: [-13, -4.5, 4.5, 13],
  midfield: [-8.5, 0, 8.5],
  attack: [-12, 0, 12],
};

/** World (x, z) for each skill, in playbook order within its line. */
export function formationPositions(skills: PlaybookSkill[]): Map<string, [number, number]> {
  const used: Record<string, number> = {};
  const positions = new Map<string, [number, number]>();
  for (const skill of skills) {
    const slot = used[skill.line] ?? 0;
    used[skill.line] = slot + 1;
    const z = LINE_Z[skill.line][slot] ?? 0;
    positions.set(skill.id, [LINE_X[skill.line], z]);
  }
  return positions;
}

/** Where the connecting lines start: the ball at the centre spot. */
export const FORMATION_ORIGIN: [number, number] = [0, 0];
