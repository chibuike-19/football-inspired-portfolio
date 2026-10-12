import type { PlaybookSkill } from "./types";

/**
 * "The Starting XI": 11 skills in a 4-3-3 (approved by the owner, 2026-10-12).
 * Every detail line restates existing, verified content (profile capabilities,
 * experience highlights); nothing new is claimed.
 *
 * The goalkeeper is quality (the last line of defence), defenders are the
 * foundations that keep products safe, midfield connects the system, and the
 * forwards are what users see and use.
 */
export const playbook: PlaybookSkill[] = [
  {
    id: "quality",
    role: "Goalkeeper",
    line: "goalkeeper",
    name: "Testing & CI",
    detail: "Test-driven development with 85%+ coverage enforced through SonarQube, and GitHub Actions on every pull request.",
    group: "Quality and delivery",
  },
  {
    id: "auth",
    role: "Defender",
    line: "defence",
    name: "Auth & sessions",
    detail: "Redesigned authentication and session management across client and server, used in production across 11 global hackathons.",
    group: "Product frontend",
  },
  {
    id: "rbac",
    role: "Defender",
    line: "defence",
    name: "RBAC & maker-checker",
    detail: "Maker-checker authorization and granular role-based access control across 12+ administrative roles in corporate banking.",
    group: "Product frontend",
  },
  {
    id: "review",
    role: "Defender",
    line: "defence",
    name: "Code review",
    detail: "Led code reviews for 5 engineers, wrote the team's review checklist and mentored 50+ engineers.",
    group: "Quality and delivery",
  },
  {
    id: "data",
    role: "Defender",
    line: "defence",
    name: "Data layer",
    detail: "PostgreSQL, MongoDB, Redis and Supabase behind production products.",
    group: "Backend and AI",
  },
  {
    id: "typescript",
    role: "Midfielder",
    line: "midfield",
    name: "TypeScript",
    detail: "Typed end to end across Next.js products and Node.js services.",
    group: "Product frontend",
  },
  {
    id: "node",
    role: "Midfielder",
    line: "midfield",
    name: "Node.js & APIs",
    detail: "Node.js and Django services, secure API middleware, and Twilio messaging integrations.",
    group: "Backend and AI",
  },
  {
    id: "aws",
    role: "Midfielder",
    line: "midfield",
    name: "AWS",
    detail: "Lambda, S3 and Textract, including an end-to-end image crop and upload pipeline on S3.",
    group: "Backend and AI",
  },
  {
    id: "nextjs",
    role: "Forward",
    line: "attack",
    name: "Next.js",
    detail: "Production platforms with performance work (code splitting, lazy loading, images) and SEO engineering.",
    group: "Product frontend",
  },
  {
    id: "react",
    role: "Forward",
    line: "attack",
    name: "React & React Native",
    detail: "Corporate internet banking on the web and a React Native mobile banking app for FCMB Group.",
    group: "Product frontend",
  },
  {
    id: "ai",
    role: "Forward",
    line: "attack",
    name: "Python AI agents",
    detail: "An AI matching system and JudgeBot, an AI judge that scores hackathon submissions against organizer-defined criteria.",
    group: "Backend and AI",
  },
];
