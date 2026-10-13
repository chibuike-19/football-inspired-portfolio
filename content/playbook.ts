import type { PlaybookSkill } from "./types";

/**
 * "The Starting XI": 11 core engineering skills in a 4-3-3 (wording approved by
 * the owner, 2026-10-13). General principles, not project-specific claims.
 *
 * The goalkeeper is quality (the last line of defence), defenders are the
 * foundations that keep products safe, midfield connects the system, and the
 * forwards are what users see and use.
 */
export const playbook: PlaybookSkill[] = [
  {
    id: "testing",
    role: "Goalkeeper",
    line: "goalkeeper",
    name: "Testing",
    detail: "The last line of defence. Tests on the paths that matter most, so changes are safe to make.",
    group: "Engineering practice",
  },
  {
    id: "review",
    role: "Defender",
    line: "defence",
    name: "Code review",
    detail: "Reading code carefully and giving clear, kind feedback. Catching problems before users do.",
    group: "Engineering practice",
  },
  {
    id: "clean-code",
    role: "Defender",
    line: "defence",
    name: "Clean, readable code",
    detail: "Clear names, small functions, no cleverness for its own sake. Code is read far more than it's written.",
    group: "Engineering practice",
  },
  {
    id: "security",
    role: "Defender",
    line: "defence",
    name: "Security fundamentals",
    detail: "Validating input, handling auth and sessions properly, and never trusting the client.",
    group: "Backend & data",
  },
  {
    id: "data",
    role: "Defender",
    line: "defence",
    name: "Data modelling",
    detail: "Getting the shape of the data right early, because everything built on top depends on it.",
    group: "Backend & data",
  },
  {
    id: "system-design",
    role: "Midfielder",
    line: "midfield",
    name: "System design",
    detail: "Breaking a problem into parts with clear boundaries, and choosing the simplest design that will hold up.",
    group: "Backend & data",
  },
  {
    id: "api-design",
    role: "Midfielder",
    line: "midfield",
    name: "API design",
    detail: "Predictable, well-named interfaces with sensible errors, so frontend and backend can move independently.",
    group: "Backend & data",
  },
  {
    id: "types",
    role: "Midfielder",
    line: "midfield",
    name: "Type safety",
    detail: "Using TypeScript to make invalid states hard to represent and refactoring less risky.",
    group: "Frontend",
  },
  {
    id: "frontend",
    role: "Forward",
    line: "attack",
    name: "Frontend architecture",
    detail: "Structuring React and Next.js apps so they stay maintainable as they grow.",
    group: "Frontend",
  },
  {
    id: "performance",
    role: "Forward",
    line: "attack",
    name: "Performance",
    detail: "Measuring first, then fixing what actually matters: bundle size, loading and rendering.",
    group: "Frontend",
  },
  {
    id: "accessibility",
    role: "Forward",
    line: "attack",
    name: "Accessibility & UX",
    detail: "Building interfaces that work for everyone, with a keyboard, a screen reader or a slow phone.",
    group: "Frontend",
  },
];
