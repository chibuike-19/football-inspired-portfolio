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
    summary: "Core Banking team on a corporate internet banking platform used by First City Monument Bank and other enterprise clients.",
    highlights: [
      "Built admin-portal features for a corporate internet banking platform used by First City Monument Bank and other enterprise clients.",
      "Developed transfer and multi-level transaction approval flows with backend (Java/SQL) and DevOps (Docker, AWS) teams to meet banking security and compliance requirements.",
      "Implemented audit-logging UI and role-based access control (RBAC) across the enterprise client base.",
      "Practised test-driven development with 85%+ coverage enforced through SonarQube.",
      "Led code reviews for 5 engineers, wrote the review checklist the team adopted and set up GitHub Actions on every pull request.",
    ],
    tags: ["React", "RBAC", "TDD", "SonarQube", "GitHub Actions"],
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
  {
    id: "kam-holding",
    company: "KAM Holding",
    positions: [{ title: "Software Developer", start: "2023-07", end: "2023-11" }],
    location: "Lagos, Nigeria",
    highlights: [],
    tags: [],
  },
];
