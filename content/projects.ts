import type { Project } from "./types";

// Order here is the board order around the pitch.
export const projects: Project[] = [
  {
    slug: "devspot",
    name: "DevSpot",
    kind: "product",
    featured: true,
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
    slug: "stream2peer",
    name: "Stream2Peer",
    kind: "open-source",
    featured: true,
    context: "Co-founder & developer",
    badge: "Co-founder",
    oneLiner:
      "An open-source, decentralized live-streaming platform built on Livepeer: broadcast to YouTube, Twitch and LinkedIn at once from a single source, straight from the browser.",
    problem:
      "Creators who stream to several platforms at once depend on paid, closed tools, and every destination has different ingest requirements.",
    contribution: [
      "Co-founded and built the platform as one of 3 contributors (40+ GitHub stars, 15 forks).",
      "Solved cross-platform stream synchronization with the Livepeer SDK, fanning a single input stream out to destinations with differing ingest requirements.",
      "Built the React/Vite frontend and Express/MySQL backend as a pnpm monorepo.",
      "Multi-guest support and browser-based streaming with no client downloads.",
    ],
    tech: ["React", "Vite", "TypeScript", "Express", "MySQL", "Livepeer", "pnpm monorepo"],
    links: [{ kind: "source", label: "Source on GitHub", href: "https://github.com/tobySolutions/stream2peer" }],
    accent: "#E8505B",
  },  // The three FCMB Group products below are from the owner's descriptions (2026-10-12).
  {
    slug: "fcmb-business-online",
    name: "FCMB Business Online",
    kind: "product",
    featured: true,
    context: "Senior Frontend Developer at Rova",
    oneLiner:
      "Enterprise-grade corporate internet banking for FCMB Group: businesses manage accounts, initiate payments, oversee beneficiaries, authorize transactions and monitor financial activity.",
    problem:
      "Corporate customers run complex banking workflows (treasury operations, onboarding, payments and approvals) that must stay secure, compliant and efficient at enterprise scale.",
    contribution: [
      "Built the web platform's corporate banking workflows: accounts, payments, beneficiaries and transaction management.",
      "Transfer and multi-level transaction approval flows, built with backend (Java/SQL) and DevOps (Docker, AWS) teams to meet banking security and compliance requirements.",
      "Audit-logging UI and role-based access control (RBAC).",
      "Test-driven development with 85%+ coverage enforced through SonarQube.",
    ],
    tech: ["React", "RBAC", "Approval workflows", "SonarQube", "GitHub Actions"],
    links: [
      { kind: "live", label: "Open Business Online", href: "https://businessonline.fcmb.com", note: "Login required" },
    ],
    accent: "#5B2C83",
    experienceId: "rova",
  },
  {
    slug: "fcmb-corporate-mobile",
    // Working name; the official app name is still to be confirmed (CONTENT_TODO.md).
    name: "FCMB Corporate Mobile",
    kind: "product",
    featured: true,
    context: "Senior Frontend Developer at Rova",
    oneLiner:
      "A secure React Native banking app for FCMB Group's corporate customers: manage business accounts, initiate and authorize transactions and oversee beneficiaries from anywhere.",
    problem:
      "Corporate banking users need approval hierarchies, account management and real-time access to business banking away from the desk, without giving up enterprise-grade security.",
    contribution: [
      "Built the React Native app for corporate customers.",
      "Transaction initiation and authorization with approval hierarchies.",
      "Account management, beneficiary oversight and day-to-day banking operations on mobile.",
    ],
    tech: ["React Native", "Approval workflows", "Mobile banking"],
    links: [],
    access: "Mobile app for FCMB corporate customers",
    accent: "#7A3E9D",
    experienceId: "rova",
  },
  {
    slug: "fcmb-admin-portal",
    // Working name; the official name is still to be confirmed (CONTENT_TODO.md).
    name: "Corporate Banking Admin Portal",
    kind: "product",
    featured: true,
    context: "Senior Frontend Developer at Rova",
    badge: "Built single-handedly",
    oneLiner:
      "The administrative platform behind FCMB Group's corporate internet banking: secure, centralized management of business accounts, onboarding, staff, approvals and banking operations.",
    problem:
      "Sensitive banking operations need strict accountability: every critical action approved by a second person, every role limited to exactly what it may read or change, and every step audited.",
    contribution: [
      "Built the platform single-handedly.",
      "Maker-checker authorization for sensitive administrative actions.",
      "Granular RBAC across 12+ administrative roles, each with distinct read and write permissions.",
      "Single and bulk transaction approvals, comprehensive audit logging and session management.",
      "Account security controls: locking, unlocking and flagging; corporate onboarding and staff administration.",
    ],
    tech: ["React", "Maker-checker", "RBAC", "Audit logging", "Session management"],
    links: [],
    access: "Internal staff tool: not publicly accessible",
    accent: "#4B2A7B",
    experienceId: "rova",
  },

  {
    slug: "roadmap-sh",
    name: "roadmap.sh",
    kind: "open-source",
    context: "Open-source contributor",
    oneLiner: "Contributor to roadmap.sh, one of GitHub's most-starred projects (367k+ stars), used by millions of developers.",
    problem: "Developers need clear, community-maintained learning paths to grow in their careers.",
    contribution: [
      "Merged pull requests improving documentation across developer roadmaps, including Git and GitHub, Redis, AI Engineer and custom validators.",
      "Helped onboard new contributors to a large-scale open-source community.",
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
  {
    slug: "kam-holding",
    name: "KAM Holding",
    kind: "website",
    context: "Company website · 2023",
    oneLiner:
      "The corporate website for KAM Holding Limited, one of Nigeria's largest indigenous metal and steel producers, presenting its businesses, subsidiaries and corporate story.",
    problem:
      "A multi-business industrial group needs one place that explains its steel, roofing and allied-products businesses and lets customers, partners and candidates reach the right team.",
    contribution: [
      "Built the company website in Next.js.",
      "Business-division and subsidiary pages, CSR and sustainability, media, and careers.",
      "Quotation and enquiry contact flows and newsletter sign-up.",
    ],
    tech: ["Next.js", "React", "Corporate website"],
    links: [{ kind: "live", label: "Visit kamholding.net", href: "https://www.kamholding.net/" }],
    accent: "#7B8A99",
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
