import { experience, getProject } from "@/content";
import type { Experience } from "@/content/types";
import { formatRange } from "@/lib/format";
import { ArrowRight } from "../icons";
import { SectionHeading, TagList } from "../primitives";

/** Highlights shown before "Show more" in the log. */
const VISIBLE_HIGHLIGHTS = 3;

function Highlights({ items, collapse }: { items: string[]; collapse: boolean }) {
  const bullet = (item: string) => (
    <li key={item} className="flex gap-2.5">
      <span aria-hidden="true" className="mt-[3px] font-mono text-xs text-accent">
        ▹
      </span>
      {item}
    </li>
  );
  const shown = collapse ? items.slice(0, VISIBLE_HIGHLIGHTS) : items;
  const rest = collapse ? items.slice(VISIBLE_HIGHLIGHTS) : [];
  return (
    <>
      <ul className="mt-4 space-y-2 leading-relaxed text-text/90">{shown.map(bullet)}</ul>
      {rest.length > 0 && (
        // Native disclosure: the extra highlights stay in the HTML for search engines and screen readers.
        <details className="group mt-2">
          <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-accent hover:underline">
            <span className="group-open:hidden">Show {rest.length} more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <ul className="mt-1 space-y-2 leading-relaxed text-text/90">{rest.map(bullet)}</ul>
        </details>
      )}
    </>
  );
}

/** One role. `collapse` trims long highlight lists (classic page); panels show everything. */
export function ExperienceEntry({ entry, collapse = false }: { entry: Experience; collapse?: boolean }) {
  const project = entry.projectSlug ? getProject(entry.projectSlug) : undefined;
  const current = entry.positions[0].end === null;
  return (
    <article aria-labelledby={`experience-${entry.id}`} className="module p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 id={`experience-${entry.id}`} className="flex items-center gap-3 font-display text-4xl uppercase leading-none tracking-wide">
          {entry.company}
          {current && (
            <span className="inline-flex items-center gap-1.5 border border-live/40 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] text-live">
              <span aria-hidden="true" className="live-dot" /> Current
            </span>
          )}
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{entry.location}</p>
      </header>

      <ul className="mt-3 space-y-1">
        {entry.positions.map((position) => (
          <li key={position.title + position.start} className="flex flex-wrap gap-x-3 text-sm">
            <span className="font-semibold text-text">{position.title}</span>
            <span className="font-mono text-xs leading-5 text-muted">{formatRange(position)}</span>
          </li>
        ))}
      </ul>

      {entry.summary && <p className="mt-4 leading-relaxed text-muted">{entry.summary}</p>}
      {entry.highlights.length > 0 && <Highlights items={entry.highlights} collapse={collapse} />}

      {(entry.tags.length > 0 || project) && (
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <TagList items={entry.tags} label={`${entry.company} technologies`} />
          {project && (
            <a
              href={`/projects/${project.slug}/`}
              className="inline-flex min-h-10 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-accent hover:underline"
            >
              {project.name} case study <ArrowRight className="size-4" />
            </a>
          )}
        </footer>
      )}
    </article>
  );
}

/** Experience as a timeline log; shown at the technical-area landmark. */
export function ExperienceSection() {
  return (
    <section aria-labelledby="experience-heading" id="experience" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading id="experience-heading" title="Experience log" label="Log_02" />
      <ol className="relative space-y-6 md:pl-44">
        {/* Rail */}
        <span aria-hidden="true" className="absolute bottom-2 left-[10.25rem] top-2 hidden w-px bg-line md:block" />
        {experience.map((entry) => {
          const position = entry.positions[0];
          const last = entry.positions[entry.positions.length - 1];
          return (
            <li key={entry.id} className="relative">
              <div aria-hidden="true" className="absolute -left-44 top-7 hidden w-36 text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.06em] text-muted md:block">
                {formatRange({ start: last.start, end: position.end })}
              </div>
              <span
                aria-hidden="true"
                className={`absolute -left-[0.95rem] top-8 hidden size-2.5 border md:block ${
                  position.end === null ? "border-live bg-live shadow-[0_0_12px_var(--color-live)]" : "border-accent bg-ink"
                }`}
              />
              <ExperienceEntry entry={entry} collapse />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
