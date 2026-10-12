import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content";
import { kindLabel } from "@/lib/project";
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
      <SiteHeader pageLabel="Case study" />
      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <Link
          href="/#projects"
          className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-muted hover:text-accent"
        >
          <ArrowLeft className="size-4" /> All work
        </Link>
        <header className="module relative mt-4 overflow-hidden px-6 py-10 sm:px-8">
          <div aria-hidden="true" className="hero-grid" />
          {/* The project's own brand colour, as on its stadium board. */}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: project.accent }} />
          <p className="relative font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {kindLabel(project)} · Case study
          </p>
          <h1 className="relative mt-3 font-display text-6xl uppercase leading-none tracking-wide sm:text-7xl">{project.name}</h1>
        </header>
        <div className="mt-10">
          <ProjectDetail project={project} />
        </div>
      </main>
      <SiteFooter />
      <div aria-hidden="true" className="grain" />
    </>
  );
}
