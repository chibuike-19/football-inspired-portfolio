import { experience, getProject } from "@/content";
import type { Experience } from "@/content/types";
import { formatRange } from "@/lib/format";
import { ArrowRight } from "../icons";
import { SectionHeading, TagList } from "../primitives";

export function ExperienceEntry({ entry }: { entry: Experience }) {
  const project = entry.projectSlug ? getProject(entry.projectSlug) : undefined;
  return (
    <article aria-labelledby={`experience-${entry.id}`} className="rounded-2xl border border-line bg-surface p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 id={`experience-${entry.id}`} className="font-display text-3xl font-bold uppercase tracking-wide">
          {entry.company}
        </h3>
        <p className="text-sm text-muted">{entry.location}</p>
      </header>

      <ul className="mt-2 space-y-0.5">
        {entry.positions.map((position) => (
          <li key={position.title + position.start} className="flex flex-wrap gap-x-3 text-sm">
            <span className="font-semibold text-text">{position.title}</span>
            <span className="text-muted">{formatRange(position)}</span>
          </li>
        ))}
      </ul>

      {entry.summary && <p className="mt-4 leading-relaxed text-muted">{entry.summary}</p>}

      {entry.highlights.length > 0 && (
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-text/90 marker:text-pitch-bright">
          {entry.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}

      {(entry.tags.length > 0 || project) && (
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <TagList items={entry.tags} label={`${entry.company} technologies`} />
          {project && (
            <a
              href={`/projects/${project.slug}/`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              See the {project.name} project <ArrowRight className="size-4" />
            </a>
          )}
        </footer>
      )}
    </article>
  );
}

/** Shown at the dugout / technical-area landmark. */
export function ExperienceSection() {
  return (
    <section aria-labelledby="experience-heading" id="experience" className="mx-auto max-w-5xl px-5 py-20">
      <SectionHeading id="experience-heading" kicker="Technical area" title="Experience" />
      <div className="space-y-5">
        {experience.map((entry) => (
          <ExperienceEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
