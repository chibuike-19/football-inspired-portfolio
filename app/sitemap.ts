import type { MetadataRoute } from "next";
import { projects } from "@/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    ...projects.map((project) => ({ url: `${SITE_URL}/projects/${project.slug}/`, priority: 0.7 })),
  ];
}
