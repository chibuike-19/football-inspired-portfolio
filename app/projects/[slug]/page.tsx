import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content";
import { ArrowLeft } from "@/ui/icons";
import { SiteFooter, SiteHeader } from "@/ui/SiteHeader";
import { ProjectDetail } from "@/ui/sections/ProjectsSection";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.oneLiner,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: { title: project.name, description: project.oneLiner, url: `/projects/${project.slug}/` },
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-5 pb-20 pt-10">
        <Link
          href="/#projects"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" /> All projects
        </Link>
        <header
          className="mt-4 overflow-hidden rounded-2xl px-6 py-8"
          style={{ backgroundColor: project.accent }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            {project.kind === "open-source" ? "Open source" : "Product"}
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-wide text-white sm:text-6xl">
            {project.name}
          </h1>
        </header>
        <div className="mt-8">
          <ProjectDetail project={project} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
