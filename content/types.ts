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

export interface Profile {
  name: string;
  headline: string;
  subheadline: string;
  location: string;
  /** One line for the scoreboard and the hero. */
  intro: string;
  /** Longer bio, one string per paragraph. */
  bio: string[];
  /** Short list shown on the scoreboard. */
  strengths: string[];
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
  summary?: string;
  highlights: string[];
  tags: string[];
  /** Slug of the related project board, if any. */
  projectSlug?: string;
}

export interface Project {
  slug: string;
  name: string;
  kind: "product" | "open-source";
  /** e.g. "Built at Rova". */
  context?: string;
  oneLiner: string;
  problem: string;
  contribution: string[];
  tech: string[];
  links: ExternalLink[];
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
