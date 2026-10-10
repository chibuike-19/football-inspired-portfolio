import { contact, experience, getProject, profile } from "@/content";
import { formatRange } from "@/lib/format";
import { ArrowRight, Download, FileText, GitHub, LinkedIn, Mail } from "./icons";
import { buttonStyles, LinkButton, TagList } from "./primitives";

/** Concise first-look content for each landmark (SPEC §10.2). */

const kicker = "font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent";
const title = "font-display text-3xl font-bold uppercase leading-none tracking-wide";
const compactButton = "min-h-10 px-3 py-2 text-xs";

function ProfilePreview() {
  return (
    <>
      <p className={kicker}>Center circle</p>
      <h2 className={title}>{profile.name}</h2>
      <p className="mt-1 text-sm font-semibold">{profile.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{profile.intro}</p>
      <div className="mt-3">
        <TagList items={profile.strengths.slice(0, 4)} label="Core strengths" />
      </div>
    </>
  );
}

function ExperiencePreview() {
  return (
    <>
      <p className={kicker}>Technical area</p>
      <h2 className={title}>Experience</h2>
      <ul className="mt-3 space-y-3">
        {experience.slice(0, 2).map((entry) => (
          <li key={entry.id}>
            <p className="text-sm font-semibold">
              {entry.company} <span className="font-normal text-muted">· {entry.positions[0].title}</span>
            </p>
            <p className="text-xs text-muted">{formatRange(entry.positions[0])}</p>
            {entry.summary && <p className="mt-1 text-sm leading-snug text-text/85">{entry.summary}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Plus {experience.length - 2} earlier roles in the full experience list.
      </p>
    </>
  );
}

function ProjectPreview({ slug }: { slug: string }) {
  const project = getProject(slug);
  if (!project) return null;
  const [primary] = project.links;
  return (
    <>
      <p className={kicker}>{project.kind === "open-source" ? "Open source" : "Product"}</p>
      <h2 className={title}>{project.name}</h2>
      {project.context && <p className="mt-1 text-xs font-semibold text-muted">{project.context}</p>}
      <p className="mt-2 text-sm leading-relaxed text-text/90">{project.oneLiner}</p>
      <p className="mt-2 text-sm leading-snug text-muted">{project.contribution[0]}</p>
      <div className="mt-3">
        <TagList items={project.tech.slice(0, 3)} label={`${project.name} technologies`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {primary && <LinkButton link={{ ...primary, note: undefined }} variant="primary" />}
        {primary?.note && <span className="text-xs text-muted">{primary.note}</span>}
        <a
          href={`/projects/${project.slug}/`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          Details<span className="sr-only"> about {project.name}</span> <ArrowRight className="size-4" />
        </a>
      </div>
    </>
  );
}

function ResumePreview() {
  return (
    <>
      <p className={kicker}>Players&apos; tunnel</p>
      <h2 className={title}>Résumé</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{profile.subheadline}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={contact.resume.href} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.primary} ${compactButton}`}>
          <FileText className="size-4" /> Open résumé<span className="sr-only"> (PDF, opens in a new tab)</span>
        </a>
        <a href={contact.resume.href} download="Emmanuel-Obiechina-Resume.pdf" className={`${buttonStyles.secondary} ${compactButton}`}>
          <Download className="size-4" /> Download PDF
        </a>
      </div>
    </>
  );
}

function ContactPreview() {
  return (
    <>
      <p className={kicker}>Goal-side terminal</p>
      <h2 className={title}>Contact</h2>
      <p className="mt-2 select-all break-all text-sm font-semibold">{contact.email}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`mailto:${contact.email}`} className={`${buttonStyles.primary} ${compactButton}`}>
          <Mail className="size-4" /> Email
        </a>
        <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.secondary} ${compactButton}`}>
          <LinkedIn className="size-4" /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.secondary} ${compactButton}`}>
          <GitHub className="size-4" /> GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </>
  );
}

export function LandmarkPreview({ id }: { id: string }) {
  if (id === "profile") return <ProfilePreview />;
  if (id === "experience") return <ExperiencePreview />;
  if (id === "resume") return <ResumePreview />;
  if (id === "contact") return <ContactPreview />;
  if (id.startsWith("project:")) return <ProjectPreview slug={id.slice("project:".length)} />;
  return null;
}

/** One-line summary for the screen-reader announcement. */
export function previewAnnouncement(id: string): string {
  if (id === "profile") return `${profile.name}, ${profile.headline}.`;
  if (id === "experience") return `Experience: ${experience.slice(0, 2).map((e) => e.company).join(" and ")}.`;
  if (id === "resume") return "Résumé: open or download the PDF.";
  if (id === "contact") return `Contact: ${contact.email}, LinkedIn and GitHub.`;
  const project = id.startsWith("project:") ? getProject(id.slice("project:".length)) : undefined;
  return project ? `Project: ${project.name}. ${project.oneLiner}` : "";
}
