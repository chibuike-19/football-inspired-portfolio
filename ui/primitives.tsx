import type { ReactNode } from "react";
import type { ExternalLink } from "@/content/types";
import { ArrowUpRight } from "./icons";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
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

export function SectionHeading({ id, kicker, title }: { id: string; kicker: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">{kicker}</p>
      <h2 id={id} className="mt-1 font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

const buttonBase =
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors";

export const buttonStyles = {
  primary: `${buttonBase} bg-accent text-accent-ink hover:bg-[#ffc861]`,
  secondary: `${buttonBase} border border-line bg-surface-2 text-text hover:border-white/25`,
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
      {link.note && <span className="font-normal opacity-70">· {link.note}</span>}
      {external && <ArrowUpRight className="size-4" />}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
}
