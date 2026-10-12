import { contact, experience, profile } from "@/content";
import { Download, FileText } from "../icons";
import { buttonStyles, SectionHeading } from "../primitives";

/** Shown at the players' tunnel landmark. */
export function ResumeSection() {
  return (
    <section aria-labelledby="resume-heading" id="resume" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading id="resume-heading" title="Résumé" label="Doc_04" />
      <ResumeDetails />
    </section>
  );
}

/** Résumé actions, certifications and languages. */
export function ResumeDetails({ compact = false }: { compact?: boolean }) {
  const current = experience.find((entry) => entry.positions[0].end === null);
  return (
    <div className={compact ? "grid gap-5" : "grid gap-5 md:grid-cols-[1.4fr_1fr]"}>
      {/* Terminal-style card: a quick "file summary" before opening the PDF. */}
      <div className="module overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#f87171]/70" />
          <span className="size-2.5 rounded-full bg-[#fbbf24]/70" />
          <span className="size-2.5 rounded-full bg-[#34d399]/70" />
          <span className="ml-2 font-mono text-[11px] text-muted">~/resume</span>
        </div>
        <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
          <p className="text-muted">
            <span className="text-accent">$</span> head resume.pdf
          </p>
          <p className="text-text">{profile.name}</p>
          <p className="text-text">{profile.headline}</p>
          {current && (
            <p className="text-muted">
              {current.positions[0].title} @ {current.company}
            </p>
          )}
          <p className="text-muted">{profile.location}</p>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line p-5">
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
      <div className="module space-y-5 p-5">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Certifications</h3>
          <ul className="mt-2 space-y-1 text-text/90">
            {profile.certifications.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Languages</h3>
          <ul className="mt-2 space-y-1 text-text/90">
            {profile.languages.map((language) => (
              <li key={language.name}>
                {language.name} <span className="text-muted">· {language.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
