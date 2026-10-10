import { contact } from "@/content";
import { ArrowUpRight, GitHub, LinkedIn, Mail } from "../icons";
import { SectionHeading } from "../primitives";

const rowStyles =
  "group flex min-h-16 items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 transition-colors hover:border-white/25";

/** Shown at the goal-side contact terminal. */
export function ContactList() {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      <li>
        <a href={`mailto:${contact.email}`} className={rowStyles}>
          <Mail className="size-5 shrink-0 text-accent" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Email</span>
            {/* The address is shown as text so it can be copied if mailto links don't work. */}
            <span className="block break-all text-sm text-muted">{contact.email}</span>
          </span>
        </a>
      </li>
      <li>
        <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={rowStyles}>
          <LinkedIn className="size-5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">LinkedIn</span>
            <span className="block text-sm text-muted">in/emmanuelobiechina</span>
          </span>
          <ArrowUpRight className="size-4 text-muted" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
      <li>
        <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={rowStyles}>
          <GitHub className="size-5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">GitHub</span>
            <span className="block text-sm text-muted">chibuike-19</span>
          </span>
          <ArrowUpRight className="size-4 text-muted" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
    </ul>
  );
}

export function ContactSection() {
  return (
    <section aria-labelledby="contact-heading" id="contact" className="mx-auto max-w-5xl px-5 py-20">
      <SectionHeading id="contact-heading" kicker="Goal-side terminal" title="Contact" />
      <ContactList />
    </section>
  );
}
