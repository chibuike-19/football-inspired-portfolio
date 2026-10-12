import type { Experience } from "./types";

// LinkedIn is the source of truth where it conflicts with the résumé (owner's instruction).
// Ordered by end date, current roles first.
export const experience: Experience[] = [
  {
    id: "devspot",
    company: "DevSpot",
    positions: [{ title: "Full Stack Engineer", start: "2024-11", end: null }],
    location: "San Francisco, US · Remote",
    summary:
      "A platform where organizers run hackathons, builders ship projects and investors discover talent through proof of work.",
    highlights: [
      "Built an AI matching system in Python that pairs builders with hackathons using their profiles and submitted links.",
      "Built JudgeBot, an AI judge agent in Python that scores submissions against organizer-defined criteria, plus prize-distribution workflows across $370K in deployed capital.",
      "Redesigned authentication and session management across client and server, with secure API middleware used in production across 11 global hackathons.",
      "Improved page load times for 8,382+ registered users through code splitting, lazy loading and image optimization.",
      "Lead SEO engineering for the site.",
      "Integrated Twilio for in-app messaging and built an image crop and upload pipeline on AWS S3.",
      "Direct AI-assisted code generation with line-by-line review, keeping 70%+ test coverage with CI as a guardrail.",
    ],
    tags: ["Next.js", "TypeScript", "Python", "AI agents", "Node.js", "AWS S3", "Twilio"],
    projectSlug: "devspot",
  },
  {
    id: "rova",
    company: "Rova",
    positions: [{ title: "Senior Frontend Developer", start: "2025-03", end: "2026-04" }],
    location: "London, UK · Remote",
    client: "FCMB Group",
    summary:
      "Core Banking team. Built three corporate banking products for FCMB Group: the Business Online web platform, its React Native mobile app and the admin portal behind them.",
    highlights: [
      "Single-handedly built the corporate banking admin portal: business accounts, corporate onboarding, staff administration, single and bulk transaction approvals, session management and account locking, unlocking and flagging.",
      "Implemented maker-checker authorization for sensitive administrative actions and granular RBAC across 12+ administrative roles with distinct read and write permissions, plus comprehensive audit logging.",
      "Built FCMB Business Online, the corporate internet banking web platform: accounts, payments, beneficiaries, transaction authorization and multi-level approvals.",
      "Built the React Native mobile banking app for corporate customers: account management, transaction initiation and authorization with approval hierarchies.",
      "Worked with backend (Java/SQL) and DevOps (Docker, AWS) teams to meet banking security and compliance requirements.",
      "Practised test-driven development with 85%+ coverage enforced through SonarQube.",
      "Led code reviews for 5 engineers, wrote the review checklist the team adopted and set up GitHub Actions on every pull request.",
    ],
    tags: ["React", "React Native", "Maker-checker", "RBAC", "TDD", "GitHub Actions"],
    projectSlug: "fcmb-business-online",
  },
  {
    id: "browndotmedia",
    company: "Browndotmedia",
    positions: [{ title: "Frontend Engineer", start: "2024-03", end: "2024-09" }],
    location: "Lagos, Nigeria",
    highlights: [
      "Built the authentication flow for both the Browndot admin platform and the talent app.",
      "Built a shared library of 20+ reusable React components, removing about 15,000 lines of duplicated code.",
      "Mentored 3 junior developers and introduced a pull request template that increased review participation.",
    ],
    tags: ["React", "Authentication", "Component libraries"],
  },
  {
    id: "nithub",
    company: "NitHub",
    positions: [
      { title: "Technical Mentor | Software Engineer", start: "2023-03", end: "2024-08" },
      { title: "Software Engineer", start: "2021-07", end: "2023-03" },
    ],
    location: "Lagos, Nigeria",
    highlights: [
      "Built an English-to-Pidgin translator with Python and NLP for people with limited English proficiency.",
      "Built a certificate-generation system and an event scheduler that detects time-slot conflicts before confirmation.",
      "Mentored 50+ engineers.",
    ],
    tags: ["Python", "NLP", "SQL"],
  },
];
