import { experience, getProject, profile } from "@/content";
import { ArrowRight } from "./icons";
import { ContactList } from "./sections/ContactSection";
import { ExperienceEntry } from "./sections/ExperienceSection";
import { ProfileAbout } from "./sections/ProfileSection";
import { ProjectDetail } from "./sections/ProjectsSection";
import { ResumeDetails } from "./sections/ResumeSection";

/** Full content for the expanded panel (SPEC §10.3), built from the Layer 1 sections. */

export function landmarkDetailTitle(id: string): { kicker: string; title: string } {
  if (id === "profile") return { kicker: "Center circle", title: profile.name };
  if (id === "experience") return { kicker: "Technical area", title: "Experience" };
  if (id === "resume") return { kicker: "Players' tunnel", title: "Résumé" };
  if (id === "contact") return { kicker: "Goal-side terminal", title: "Contact" };
  const project = id.startsWith("project:") ? getProject(id.slice("project:".length)) : undefined;
  return { kicker: project?.kind === "open-source" ? "Open source" : "Project", title: project?.name ?? "" };
}

export function LandmarkDetail({ id }: { id: string }) {
  if (id === "profile") {
    return (
      <>
        <p className="mb-6 text-lg font-semibold">{profile.headline}</p>
        <ProfileAbout compact />
      </>
    );
  }
  if (id === "experience") {
    return (
      <div className="space-y-4">
        {experience.map((entry) => (
          <ExperienceEntry key={entry.id} entry={entry} />
        ))}
      </div>
    );
  }
  if (id === "resume") return <ResumeDetails compact />;
  if (id === "contact") return <ContactList compact />;

  const project = id.startsWith("project:") ? getProject(id.slice("project:".length)) : undefined;
  if (!project) return null;
  return (
    <>
      <ProjectDetail project={project} />
      <a
        href={`/projects/${project.slug}/`}
        className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        Shareable page for {project.name} <ArrowRight className="size-4" />
      </a>
    </>
  );
}
