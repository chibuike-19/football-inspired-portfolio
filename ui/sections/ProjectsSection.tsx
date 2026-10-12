import { experience, projects } from "@/content";
import type { Project } from "@/content/types";
import { kindLabel } from "@/lib/project";
import { ArrowRight } from "../icons";
import { LinkButton, SectionHeading, SystemLabel, TagList } from "../primitives";

/** Coloured square in the project's own brand colour (the same colour as its stadium board). */
function BrandMark({ project }: { project: Project }) {
  return <span aria-hidden="true" className="inline-block size-2.5" style={{ backgroundColor: project.accent }} />;
}

function Badge({ project }: { project: Project }) {
  if (!project.badge) return null;
  return (
    <span className="inline-flex items-center gap-1.5 border border-brand/60 bg-brand/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
      <span aria-hidden="true">★</span>
      {project.badge}
    </span>
  );
}

/** Stands in for links on products that aren't publicly reachable. */
function AccessNote({ project }: { project: Project }) {
  if (project.links.length > 0 || !project.access) return null;
  return (
    <span className="inline-flex min-h-11 items-center gap-2 border border-dashed border-line px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
      <span aria-hidden="true">🔒</span>
      {project.access}
    </span>
  );
}

function DetailsLink({ project }: { project: Project }) {
  return (
    <a
      href={`/projects/${project.slug}/`}
      className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-accent hover:underline"
    >
      Case study<span className="sr-only"> for {project.name}</span> <ArrowRight className="size-4" />
    </a>
  );
}

/**
 * Wide module for shipped products: summary on the left, spec sheet on the
 * right. The id matches the deep link `#project/<slug>`.
 */
function FeaturedProject({ project, index }: { project: Project; index: number }) {
  return (
    <article
      id={`project/${project.slug}`}
      aria-labelledby={`project-${project.slug}-title`}
      className="module grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <BrandMark project={project} />
          {kindLabel(project)}
          <span aria-hidden="true">·</span>
          <span>{project.context}</span>
        </div>
        <h3 id={`project-${project.slug}-title`} className="mt-4 font-display text-5xl uppercase leading-none tracking-wide">
          {project.name}
        </h3>
        {project.badge && (
          <div className="mt-3">
            <Badge project={project} />
          </div>
        )}
        <p className="mt-4 text-lg leading-relaxed text-text/90">{project.oneLiner}</p>
        <div className="mt-5">
          <TagList items={project.tech} label={`${project.name} technologies`} />
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {project.links.map((link, i) => (
            <LinkButton key={link.href} link={link} variant={i === 0 ? "primary" : "secondary"} />
          ))}
          <AccessNote project={project} />
          <DetailsLink project={project} />
        </div>
      </div>

      <dl className="border border-line bg-ink/50 p-5 font-mono text-[13px]">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <dt className="uppercase tracking-[0.16em] text-muted">Spec sheet</dt>
          <dd>
            <SystemLabel>{`MOD_0${index + 1}`}</SystemLabel>
          </dd>
        </div>
        {/* A <dl> must hold either bare dt/dd pairs or div-wrapped groups, not a mix. */}
        <div className="mt-4">
          <dt className="text-[11px] uppercase tracking-[0.16em] text-accent">Problem</dt>
          <dd className="mt-1 font-sans text-sm leading-relaxed text-muted">{project.problem}</dd>
        </div>
        <div className="mt-5">
          <dt className="text-[11px] uppercase tracking-[0.16em] text-accent">What I built</dt>
          <dd className="mt-2">
          <ul className="space-y-2 font-sans text-sm leading-relaxed text-text/90">
            {project.contribution.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[3px] font-mono text-xs text-accent">
                  ▹
                </span>
                {item}
              </li>
            ))}
          </ul>
          </dd>
        </div>
      </dl>
    </article>
  );
}

/** Compact module for open-source work. The id matches the deep link `#project/<slug>`. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      id={`project/${project.slug}`}
      aria-labelledby={`project-${project.slug}-title`}
      className="module flex flex-col p-6 sm:p-7"
    >
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        <BrandMark project={project} />
        {kindLabel(project)}
        <span aria-hidden="true">·</span>
        <span>{project.context}</span>
      </div>
      <h3 id={`project-${project.slug}-title`} className="mt-4 font-display text-4xl uppercase leading-none tracking-wide">
        {project.name}
      </h3>
      <p className="mt-3 leading-relaxed text-text/90">{project.oneLiner}</p>
      <p className="mt-3 flex gap-2.5 text-sm leading-relaxed text-muted">
        <span aria-hidden="true" className="mt-[2px] font-mono text-xs text-accent">
          ▹
        </span>
        {project.contribution[0]}
      </p>
      <div className="mt-5">
        <TagList items={project.tech} label={`${project.name} technologies`} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
        {project.links.slice(0, 1).map((link) => (
          <LinkButton key={link.href} link={link} />
        ))}
        <AccessNote project={project} />
        <DetailsLink project={project} />
      </div>
    </article>
  );
}

/** Full write-up: used by the project page and the 3D detail panel. */
export function ProjectDetail({ project }: { project: Project }) {
  return (
    <div className="space-y-8">
      <div>
        {project.context && (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{project.context}</p>
        )}
        {project.badge && (
          <div className="mt-3">
            <Badge project={project} />
          </div>
        )}
        <p className="mt-2 text-lg leading-relaxed text-text">{project.oneLiner}</p>
      </div>
      <div>
        <h2 className="font-display text-3xl uppercase tracking-wide">The problem</h2>
        <p className="mt-2 leading-relaxed text-muted">{project.problem}</p>
      </div>
      <div>
        <h2 className="font-display text-3xl uppercase tracking-wide">What I built</h2>
        <ul className="mt-3 space-y-2 leading-relaxed text-text/90">
          {project.contribution.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[3px] font-mono text-xs text-accent">
                ▹
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-display text-3xl uppercase tracking-wide">Technology</h2>
        <div className="mt-3">
          <TagList items={project.tech} label={`${project.name} technologies`} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {project.links.map((link, index) => (
          <LinkButton key={link.href} link={link} variant={index === 0 ? "primary" : "secondary"} />
        ))}
        <AccessNote project={project} />
      </div>
    </div>
  );
}

/** Featured work as wide modules (grouped by employer), then smaller cards. */
export function ProjectsSection() {
  const products = projects.filter((p) => p.featured);
  const more = projects.filter((p) => !p.featured);
  return (
    <section aria-labelledby="projects-heading" id="projects" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading id="projects-heading" title="Selected work" label="Work_01" />
      <div className="space-y-5">
        {products.map((project, i) => {
          // Products from the same employer are grouped under one heading (e.g. three for FCMB at Rova).
          const siblings = products.filter((p) => p.experienceId && p.experienceId === project.experienceId);
          const startsGroup = siblings.length > 1 && siblings[0] === project;
          const role = experience.find((e) => e.id === project.experienceId);
          return (
            <div key={project.slug}>
              {startsGroup && (
                <h3 className="mb-5 mt-14 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  <span aria-hidden="true" className="h-px w-8 bg-line" />
                  Built at {role?.company}: {siblings.length} products{role?.client ? ` for ${role.client}` : ""}
                </h3>
              )}
              <FeaturedProject project={project} index={i} />
            </div>
          );
        })}
      </div>
      {more.length > 0 && (
        <>
          <h3 className="mb-5 mt-14 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            More work
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            {more.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
