import { getProject } from "@/content";
import { LANDMARK_BY_ID } from "./landmarks";

/**
 * Deep links (SPEC §10.6): `#profile`, `#experience`, `#resume`, `#contact`,
 * `#project/<slug>`. These match the Layer 1 section ids, so the same link
 * works in Classic view.
 */
export function hashForLandmark(id: string): string {
  return id.startsWith("project:") ? `project/${id.slice("project:".length)}` : id;
}

/** Landmark id for a location hash, or null if it isn't a landmark link. */
export function landmarkFromHash(hash: string): string | null {
  const value = decodeURIComponent(hash.replace(/^#/, ""));
  if (value.startsWith("project/")) {
    const slug = value.slice("project/".length);
    return getProject(slug) ? `project:${slug}` : null;
  }
  return LANDMARK_BY_ID.has(value) ? value : null;
}
