import { contact, profile } from "@/content";
import { IslandNav } from "./IslandNav";

/** Site navigation. `pageLabel` names a non-home page in the island's status chip. */
export function SiteHeader({ pageLabel }: { pageLabel?: string } = {}) {
  return <IslandNav name={profile.name} avatar={profile.avatar} resumeHref={contact.resume.href} pageLabel={pageLabel} />;
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 font-mono text-xs text-muted">
        <p>
          <span className="text-accent">ceo@lagos</span>:~$ echo &quot;built with Next.js, React, TypeScript and three.js&quot;
          <span aria-hidden="true" className="caret" />
        </p>
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </footer>
  );
}
