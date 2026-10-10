import { projects } from "@/content";
import type { Project } from "@/content/types";
import { ArrowRight } from "../icons";
import { LinkButton, SectionHeading, TagList } from "../primitives";

/** Board-styled summary card. The id matches the deep link `#project/<slug>`. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      id={`project/${project.slug}`}
      aria-labelledby={`project-${project.slug}-title`}
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
    >
      {/* Advertising-board header strip in the project's accent colour. */}
      <div className="relative px-6 py-5" style={{ backgroundColor: project.accent }}>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
          {project.kind === "open-source" ? "Open source" : "Product"}
        </p>
        <h3
          id={`project-${project.slug}-title`}
          className="relative font-display text-3xl font-bold uppercase tracking-wide text-white"
        >
          {project.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        {project.context && <p className="text-sm font-semibold text-muted">{project.context}</p>}
        <p className="leading-relaxed text-text/90">{project.oneLiner}</p>
        <TagList items={project.tech} label={`${project.name} technologies`} />
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          {project.links.slice(0, 1).map((link) => (
            <LinkButton key={link.href} link={link} />
          ))}
          <a
            href={`/projects/${project.slug}/`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Details<span className="sr-only"> about {project.name}</span> <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

/** Full write-up: used by the project page and, later, the expanded panel. */
export function ProjectDetail({ project }: { project: Project }) {
  return (
    <div className="space-y-8">
      <div>
        {project.context && <p className="text-sm font-semibold text-muted">{project.context}</p>}
        <p className="mt-2 text-lg leading-relaxed text-text">{project.oneLiner}</p>
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">The problem</h2>
        <p className="mt-2 leading-relaxed text-muted">{project.problem}</p>
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">My contribution</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed text-text/90 marker:text-pitch-bright">
          {project.contribution.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Technology</h2>
        <div className="mt-3">
          <TagList items={project.tech} label={`${project.name} technologies`} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {project.links.map((link, index) => (
          <LinkButton key={link.href} link={link} variant={index === 0 ? "primary" : "secondary"} />
        ))}
      </div>
    </div>
  );
}

/** One card per perimeter advertising board. */
export function ProjectsSection() {
  return (
    <section aria-labelledby="projects-heading" id="projects" className="mx-auto max-w-5xl px-5 py-20">
      <SectionHeading id="projects-heading" kicker="Perimeter boards" title="Projects" />
      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
