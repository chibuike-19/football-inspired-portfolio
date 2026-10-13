import type { Trophy } from "./types";

/**
 * Trophy cabinet displays (approved by the owner, 2026-10-12). Every line is
 * backed by the résumé, LinkedIn or GitHub (see CONTENT.md); nothing new.
 */
export const trophies: Trophy[] = [
  {
    id: "hackathon-scale",
    title: "Built for scale",
    context: "DevSpot",
    items: [
      "Authentication layer used across 11 global hackathons",
      "Prize workflows across $370K in deployed capital",
      "A platform with 8,382+ registered users",
    ],
  },
  {
    id: "banking-grade",
    title: "Built for trust",
    context: "Rova · FCMB Group",
    items: [
      "Built the corporate banking admin portal single-handedly",
      "RBAC across 12+ administrative roles",
      "85%+ test coverage enforced through SonarQube",
    ],
  },
  {
    id: "open-source",
    title: "Open source",
    context: "Stream2Peer · roadmap.sh",
    items: ["Co-founded Stream2Peer (40+ GitHub stars)", "Contributor to roadmap.sh (367k+ stars)"],
  },
  {
    id: "mentorship",
    title: "Helping others grow",
    context: "NitHub",
    items: ["Mentored 50+ engineers"],
  },
  {
    id: "certifications",
    title: "Certifications",
    context: "Industry programmes",
    items: ["Postman Student Expert", "Microsoft ADC Learnathon Champion"],
  },
];
