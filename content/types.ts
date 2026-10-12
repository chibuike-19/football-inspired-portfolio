/** Year and month, e.g. "2024-11". */
export type YearMonth = `${number}-${string}`;

export type LinkKind = "live" | "source" | "contributions" | "email" | "linkedin" | "github" | "resume";

export interface ExternalLink {
  kind: LinkKind;
  label: string;
  href: string;
  /** Short qualifier shown next to the link, e.g. "Login required". */
  note?: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

/** A verified number for the hero strip, e.g. { value: "85%+", label: "test coverage" }. */
export interface Signal {
  value: string;
  label: string;
}

export interface Capability {
  title: string;
  summary: string;
  items: string[];
}

export interface Profile {
  name: string;
  /** Square photo in /public, used for the nav mark, hero and favicon. */
  avatar: string;
  headline: string;
  subheadline: string;
  location: string;
  /** One line for the scoreboard and the hero. */
  intro: string;
  /** Longer bio, one string per paragraph. */
  bio: string[];
  /** Short list shown on the scoreboard. */
  strengths: string[];
  /** One-line status shown above the hero heading. */
  status: string;
  /** Verified numbers from shipped work (sources in CONTENT.md). */
  signals: Signal[];
  /** Stack nodes drawn around the monogram in the hero. */
  stackGraph: string[];
  /** What I do, grouped; each item is backed by the résumé or LinkedIn. */
  capabilities: Capability[];
  skills: SkillGroup[];
  certifications: string[];
  languages: { name: string; level: string }[];
}

export interface Position {
  title: string;
  start: YearMonth;
  /** `null` means current. */
  end: YearMonth | null;
}

export interface Experience {
  id: string;
  company: string;
  /** Most recent position first. */
  positions: Position[];
  location: string;
  /** Main client served in this role, e.g. "FCMB Group". */
  client?: string;
  summary?: string;
  highlights: string[];
  tags: string[];
  /** Slug of the related project board, if any. */
  projectSlug?: string;
}

export interface Project {
  slug: string;
  name: string;
  kind: "product" | "open-source" | "website";
  /** Shown as a wide "featured" module on the classic page (shipped products, co-founded work). */
  featured?: boolean;
  /** e.g. "Built at Rova". */
  context?: string;
  oneLiner: string;
  problem: string;
  contribution: string[];
  tech: string[];
  /** May be empty for internal or private products; then `access` explains why. */
  links: ExternalLink[];
  /** Shown instead of a link when the product isn't publicly reachable. */
  access?: string;
  /** e.g. "Built single-handedly": shown as a badge. */
  badge?: string;
  /** Board accent colour (hex). */
  accent: string;
  /** Id of the related experience entry, if any. */
  experienceId?: string;
}

export interface ContactLinks {
  email: string;
  github: ExternalLink;
  linkedin: ExternalLink;
  resume: ExternalLink;
}

/** One display in the trophy cabinet. */
export interface Trophy {
  id: string;
  title: string;
  /** Where it was earned, e.g. "DevSpot". */
  context: string;
  items: string[];
}
