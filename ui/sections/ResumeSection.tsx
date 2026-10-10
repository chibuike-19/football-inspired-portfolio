import { contact, profile } from "@/content";
import { Download, FileText } from "../icons";
import { buttonStyles, SectionHeading } from "../primitives";

/** Shown at the players' tunnel landmark. */
export function ResumeSection() {
  return (
    <section aria-labelledby="resume-heading" id="resume" className="mx-auto max-w-5xl px-5 py-20">
      <SectionHeading id="resume-heading" kicker="Players' tunnel" title="Résumé" />
      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-lg font-semibold">{profile.headline}</p>
          <p className="mt-2 leading-relaxed text-muted">{profile.subheadline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={contact.resume.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
              <FileText className="size-4" />
              Open résumé<span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
            <a href={contact.resume.href} download="Emmanuel-Obiechina-Resume.pdf" className={buttonStyles.secondary}>
              <Download className="size-4" />
              Download PDF
            </a>
          </div>
        </div>
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
          <div>
            <h3 className="text-sm font-semibold text-text">Certifications</h3>
            <ul className="mt-2 space-y-1 text-muted">
              {profile.certifications.map((certification) => (
                <li key={certification}>{certification}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Languages</h3>
            <ul className="mt-2 space-y-1 text-muted">
              {profile.languages.map((language) => (
                <li key={language.name}>
                  {language.name} <span className="text-muted/70">· {language.level}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
