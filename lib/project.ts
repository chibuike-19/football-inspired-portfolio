import type { Project } from "@/content/types";

const KIND_LABELS: Record<Project["kind"], string> = {
  product: "Product",
  "open-source": "Open source",
  website: "Website",
};

/** Human label for a project's kind, used on cards, previews, panels and case-study pages. */
export const kindLabel = (project: Pick<Project, "kind">) => KIND_LABELS[project.kind];
