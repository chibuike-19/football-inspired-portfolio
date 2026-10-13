import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { OG_IMAGE } from "./site";

/**
 * Complete social-preview metadata for a page. A page that sets `openGraph` or
 * `twitter` replaces the layout's values entirely (Next merges metadata
 * shallowly), so every page builds the full set here, image included.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    // Absolute: the layout's title template would otherwise append the name a second time.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: profile.name,
      locale: "en_GB",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
