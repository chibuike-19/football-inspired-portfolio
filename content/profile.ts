import type { Profile } from "./types";

// Sources: LinkedIn export and résumé (see CONTENT.md).
export const profile: Profile = {
  name: "Emmanuel Obiechina",
  avatar: "/avatar.jpg",
  // "Senior" approved by the owner (2026-10-12): senior title at Rova, plus review and mentoring leadership.
  headline: "Senior Full-Stack Engineer",
  subheadline: "Frontend-focused: Next.js, React and TypeScript. Test-driven, code-review-minded, built for auth and data-heavy products.",
  location: "Lagos, Nigeria",
  intro:
    "I design and ship production web platforms, from banking solutions to AI automated systems, and I ensure the quality of the code that powers them.",
  bio: [
    "I build production web applications with Next.js, React and TypeScript, working with remote teams in the US and the UK. At DevSpot I work across the stack: the product in Next.js and TypeScript, and the AI features in Python, including a system that matches builders to hackathons and an AI judge that scores submissions against organizer-defined criteria.",
    "At Rova I built transfer and multi-level approval flows for a corporate internet banking platform, practising test-driven development with 85%+ coverage.",
    "I use AI tools to move faster, and I own the result: I design the architecture, review every generated line for hallucinated APIs and dropped requirements, and keep tests, CI and code review in place so speed never costs quality.",
  ],
  strengths: ["Next.js", "React", "TypeScript", "Python for AI features", "Testing & CI"],
  status: "Building at DevSpot · Remote with US and UK teams · Lagos, Nigeria",
  signals: [
    { value: "8,382+", label: "registered users on DevSpot" },
    { value: "11", label: "global hackathons on my auth layer" },
    { value: "$370K", label: "prize capital through my workflows" },
    { value: "85%+", label: "test coverage on a banking platform" },
    { value: "3", label: "banking products built for FCMB Group" },
    { value: "50+", label: "engineers mentored" },
  ],
  stackGraph: ["Next.js", "React", "TypeScript", "Python · AI", "Node.js", "AWS"],
  capabilities: [
    {
      title: "Product frontend",
      summary: "Architecture for auth and data-heavy products that stay fast and findable.",
      items: [
        "Next.js, React, TypeScript",
        "Auth and session design",
        "Maker-checker approvals and RBAC (12+ roles)",
        "React Native mobile apps",
        "Performance: code splitting, lazy loading, images",
        "SEO engineering",
      ],
    },
    {
      title: "Backend and AI",
      summary: "The services and AI features behind the interface.",
      items: [
        "Python AI features: matching and judging agents",
        "Node.js and Django services",
        "PostgreSQL, MongoDB, Redis, Supabase",
        "AWS: Lambda, S3, Textract",
        "Twilio messaging",
      ],
    },
    {
      title: "Quality and delivery",
      summary: "How a team ships safely, not only what I ship.",
      items: [
        "Test-driven development (85%+ coverage)",
        "GitHub Actions on every pull request",
        "Code review leadership and checklists",
        "Mentoring engineers",
        "AI-assisted delivery with line-by-line review",
      ],
    },
  ],
  skills: [
    { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML", "CSS"] },
    { group: "Frameworks & libraries", items: ["React", "Next.js", "React Native", "Node.js", "Django", "Redis", "NumPy", "Jest"] },
    { group: "AI-assisted development", items: ["AI coding tools", "Model Context Protocol (MCP)", "Review and testing of all shipped code"] },
    {
      group: "Platforms & practice",
      items: [
        "GitHub Actions",
        "Docker",
        "Kubernetes",
        "PostgreSQL",
        "MongoDB",
        "Supabase",
        "GCP",
        "AWS (Lambda, S3, Textract)",
        "SonarQube",
        "TDD",
        "Data structures & algorithms",
      ],
    },
  ],
  certifications: ["Postman Student Expert", "Microsoft ADC Learnathon Champion"],
  languages: [
    { name: "English", level: "Full professional" },
    { name: "Spanish", level: "Limited working proficiency" },
    { name: "Igbo", level: "Native" },
  ],
};
