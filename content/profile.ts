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
    "I build web products that people rely on, from corporate banking tools to hackathon platforms. I care about the parts users never see: clear code, good tests and changes that are safe to ship.",
  bio: [
    "I start by understanding the problem before I write code. Most bugs I've fixed came from a requirement nobody fully understood, not from a hard algorithm.",
    "I prefer simple, readable code over clever code. The next person to touch it, often me in six months, should be able to follow it without a walkthrough. Small, focused pull requests make that easier to review and safer to ship.",
    "I write tests for the things that would hurt if they broke, and I let them guide the design rather than bolting them on at the end. Code review is where I learn the most, from giving it as much as receiving it.",
    "I use AI tools day to day, but I treat their output like a pull request from a new teammate: I read every line, check it against the requirement, and I'm the one accountable for what ships.",
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
      title: "Frontend",
      summary: "Interfaces that are fast, accessible and easy to change.",
      items: [
        "Components that are small, reusable and easy to test",
        "State that stays predictable as the app grows",
        "Accessibility from the start, not as an afterthought",
        "Measure first, then optimise performance",
        "Layouts that work on any screen size",
        "Semantic HTML that search engines and screen readers understand",
      ],
    },
    {
      title: "Backend & data",
      summary: "APIs, data and the services behind the screen, including AI features in Python.",
      items: [
        "Clear API contracts and consistent error handling",
        "Data models designed before the code that uses them",
        "Authentication and authorisation done properly",
        "Caching only where it earns its place",
        "AI features with guardrails and human review",
      ],
    },
    {
      title: "Engineering practice",
      summary: "Testing, review and the habits that keep a codebase healthy.",
      items: [
        "Tests at the right level: unit, integration and end to end",
        "Small pull requests and thoughtful code review",
        "Continuous integration on every change",
        "Refactoring as part of the work, not a separate project",
        "Documentation people actually read",
        "Sharing knowledge and helping others grow",
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
