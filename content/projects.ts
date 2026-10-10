import type { Project } from "./types";

// Order here is the board order around the pitch.
export const projects: Project[] = [
  {
    slug: "devspot",
    name: "DevSpot",
    kind: "product",
    context: "Full Stack Engineer at DevSpot",
    oneLiner: "Where builders join hackathons, ship projects and get discovered by organizers and investors.",
    problem:
      "Hackathon organizers, builders and investors need one place to run events, judge submissions fairly and find talent through shipped work rather than pitches.",
    contribution: [
      "AI matching system in Python that pairs builders with hackathons.",
      "JudgeBot: an AI judge agent that scores submissions against organizer-defined criteria.",
      "Prize-distribution workflows across $370K in deployed capital.",
      "Authentication and session redesign used across 11 global hackathons.",
    ],
    tech: ["Next.js", "TypeScript", "Python", "Node.js", "AWS S3", "Twilio"],
    links: [{ kind: "live", label: "Visit DevSpot", href: "https://devspot.app" }],
    accent: "#7C5CFF",
    experienceId: "devspot",
  },
  {
    slug: "fcmb-business-online",
    name: "FCMB Business Online",
    kind: "product",
    context: "Senior Frontend Developer at Rova",
    oneLiner: "Corporate internet banking for First City Monument Bank's business customers.",
    problem:
      "Businesses moving money need controlled transfers, multi-level approvals and a full audit trail that meet banking security and compliance requirements.",
    contribution: [
      "Transfer and multi-level transaction approval flows.",
      "Audit-logging UI and role-based access control (RBAC).",
      "Test-driven development with 85%+ coverage enforced through SonarQube.",
    ],
    tech: ["React", "RBAC", "SonarQube", "GitHub Actions"],
    links: [
      { kind: "live", label: "Open Business Online", href: "https://businessonline.fcmb.com", note: "Login required" },
    ],
    accent: "#5B2C83",
    experienceId: "rova",
  },
  {
    slug: "stream2peer",
    name: "Stream2Peer",
    kind: "open-source",
    context: "Open-source contributor",
    oneLiner: "A free, decentralized live-stream management service: an open-source take on StreamYard.",
    problem: "Creators who stream to several platforms at once depend on paid, closed tools to manage their broadcasts.",
    contribution: [
      "About 20 merged pull requests between October 2024 and January 2025.",
      "Responsive dashboard layout and dashboard theming.",
      "YouTube and Twitch integrations.",
      "Landing page, network and state setup, and bug fixes.",
    ],
    tech: ["TypeScript", "React", "Tailwind CSS"],
    links: [
      { kind: "source", label: "Source on GitHub", href: "https://github.com/tobySolutions/stream2peer" },
      {
        kind: "contributions",
        label: "My merged PRs",
        href: "https://github.com/tobySolutions/stream2peer/pulls?q=is%3Apr+author%3Achibuike-19+is%3Amerged",
      },
    ],
    accent: "#E8505B",
  },
  {
    slug: "roadmap-sh",
    name: "roadmap.sh",
    kind: "open-source",
    context: "Open-source contributor",
    oneLiner: "Content contributor to roadmap.sh, one of the most-starred projects on GitHub.",
    problem: "Developers need clear, community-maintained learning paths to grow in their careers.",
    contribution: [
      "6 merged pull requests (August to October 2024).",
      "Wrote content for the Git and GitHub, Redis, AI Engineer and custom-validator topics.",
    ],
    tech: ["Markdown", "Technical writing", "Git"],
    links: [
      { kind: "live", label: "Visit roadmap.sh", href: "https://roadmap.sh" },
      {
        kind: "contributions",
        label: "My merged PRs",
        href: "https://github.com/nilbuild/developer-roadmap/pulls?q=is%3Apr+author%3Achibuike-19+is%3Amerged",
      },
    ],
    accent: "#F5B544",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
