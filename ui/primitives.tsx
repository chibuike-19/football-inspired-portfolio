import type { ReactNode } from "react";
import type { ExternalLink } from "@/content/types";
import { ArrowUpRight } from "./icons";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <li className="border border-line bg-surface-2/60 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
      {children}
    </li>
  );
}

export function TagList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {items.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </ul>
  );
}

/** Small bracketed system label, e.g. [WORK_01]. Decorative. */
export function SystemLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden="true" className={`font-mono text-[11px] uppercase tracking-[0.18em] text-muted ${className}`}>
      [{children}]
    </span>
  );
}

/** Section heading: ">_ Title" with a system label on the right. */
export function SectionHeading({ id, title, label }: { id: string; title: string; label: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-5">
      <h2 id={id} className="flex items-baseline gap-3 font-display text-4xl leading-none tracking-wide sm:text-5xl">
        <span aria-hidden="true" className="font-mono text-2xl text-accent sm:text-3xl">
          &gt;_
        </span>
        {title}
      </h2>
      <SystemLabel className="hidden pb-1 sm:inline">{label}</SystemLabel>
    </div>
  );
}

const buttonBase =
  "inline-flex min-h-11 items-center gap-2 px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.12em] transition-[background-color,border-color,box-shadow,color] duration-200";

export const buttonStyles = {
  primary: `${buttonBase} bg-accent text-accent-ink shadow-[0_0_24px_-6px_var(--color-brand)] hover:bg-[#a5b4fc] hover:shadow-[0_0_32px_-4px_var(--color-brand)]`,
  secondary: `${buttonBase} border border-line bg-ink/40 text-text hover:border-accent/60 hover:text-accent`,
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Renders a content link; external URLs open in a new tab. */
export function LinkButton({
  link,
  variant = "secondary",
}: {
  link: ExternalLink;
  variant?: keyof typeof buttonStyles;
}) {
  const external = isExternal(link.href);
  return (
    <a
      href={link.href}
      className={buttonStyles[variant]}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
      {link.note && <span className="normal-case tracking-normal opacity-70">· {link.note}</span>}
      {external && <ArrowUpRight className="size-4" />}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
}
