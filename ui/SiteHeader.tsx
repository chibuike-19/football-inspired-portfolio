import Link from "next/link";
import { profile } from "@/content";

// The logo links to the profile, so "Profile" is dropped on narrow screens to keep Contact visible.
const NAV = [
  { href: "/#profile", label: "Profile", wideOnly: true },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/#resume", label: "Résumé" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3 sm:gap-6">
        <Link href="/#profile" aria-label={profile.name} className="flex shrink-0 items-center gap-2 font-display text-lg font-bold uppercase tracking-wide">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-accent text-sm text-accent-ink">
            EO
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>
        <nav aria-label="Sections" className="-mr-5 ml-auto overflow-x-auto pr-5">
          <ul className="flex gap-0.5 whitespace-nowrap sm:gap-1 text-sm font-medium">
            {NAV.map((item) => (
              <li key={item.href} className={item.wideOnly ? "hidden sm:block" : undefined}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-md px-1.5 text-muted sm:px-3 transition-colors hover:text-text"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 px-5 py-8 text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>Built with Next.js, React and TypeScript.</p>
      </div>
    </footer>
  );
}
