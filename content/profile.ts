import type { Profile } from "./types";

// Sources: LinkedIn export and résumé (see CONTENT.md).
export const profile: Profile = {
  name: "Emmanuel Obiechina",
  headline: "Frontend-focused Full-Stack Engineer",
  subheadline: "Next.js, React and TypeScript. Test-driven, code-review-minded, auth and data-heavy UIs.",
  location: "Lagos, Nigeria",
  intro:
    "I ship production web apps with Next.js, React and TypeScript, from corporate banking approval flows to AI-powered hackathon platforms.",
  bio: [
    "I build production web applications with Next.js, React and TypeScript, working with remote teams in the US and the UK. At DevSpot I work across the stack: the product in Next.js and TypeScript, and the AI features in Python, including a system that matches builders to hackathons and an AI judge that scores submissions against organizer-defined criteria.",
    "At Rova I built transfer and multi-level approval flows for a corporate internet banking platform, practising test-driven development with 85%+ coverage.",
    "I use AI tools to move faster, and I own the result: I design the architecture, review every generated line for hallucinated APIs and dropped requirements, and keep tests, CI and code review in place so speed never costs quality.",
  ],
  strengths: ["Next.js", "React", "TypeScript", "Python for AI features", "Testing & CI"],
  skills: [
    { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "HTML", "CSS"] },
    { group: "Frameworks & libraries", items: ["React", "Next.js", "Node.js", "Django", "Redis", "NumPy", "Jest"] },
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
      ],
    },
  ],
  certifications: ["Postman Student Expert", "Microsoft ADC Learnathon Champion"],
  languages: [
    { name: "English", level: "Full professional" },
    { name: "Igbo", level: "Native" },
  ],
};
