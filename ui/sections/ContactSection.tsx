import { contact } from "@/content";
import { ArrowUpRight, GitHub, LinkedIn, Mail } from "../icons";
import { buttonStyles, SectionHeading } from "../primitives";

const rowStyles =
  "group flex min-h-16 items-center gap-4 border border-line bg-surface/60 px-5 py-4 transition-colors hover:border-accent/60";

/** Shown at the goal-side contact terminal. */
export function ContactList({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-3"}>
      <li>
        <a href={`mailto:${contact.email}`} className={rowStyles}>
          <Mail className="size-5 shrink-0 text-accent" />
          <span className="min-w-0">
            <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Email</span>
            {/* The address is shown as text so it can be copied if mailto links don't work. */}
            <span className="block break-all text-sm text-text">{contact.email}</span>
          </span>
        </a>
      </li>
      <li>
        <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={rowStyles}>
          <LinkedIn className="size-5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">LinkedIn</span>
            <span className="block text-sm text-text">in/emmanuelobiechina</span>
          </span>
          <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-accent" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
      <li>
        <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={rowStyles}>
          <GitHub className="size-5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted">GitHub</span>
            <span className="block text-sm text-text">chibuike-19</span>
          </span>
          <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-accent" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
    </ul>
  );
}

export function ContactSection() {
  return (
    <section aria-labelledby="contact-heading" id="contact" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading id="contact-heading" title="Initiate connection" label="Ping_05" />
      <div className="module relative overflow-hidden p-5 sm:p-10">
        <div aria-hidden="true" className="hero-grid opacity-60" />
        <div className="relative">
          <p className="max-w-2xl font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
            Building something that has to hold up in production?
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Questions about my work, a product you are building or anything on this site? Email is the fastest way to reach me.
          </p>
          <div className="mt-7">
            <a href={`mailto:${contact.email}`} className={buttonStyles.primary}>
              <Mail className="size-4" /> Send an email
            </a>
          </div>
          <div className="mt-8">
            <ContactList />
          </div>
        </div>
      </div>
    </section>
  );
}
