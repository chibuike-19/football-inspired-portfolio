import type { Metadata } from "next";
import Link from "next/link";
import { contact, profile } from "@/content";
import { pageMetadata } from "@/lib/metadata";
import { ArrowLeft, GitHub, LinkedIn } from "@/ui/icons";
import { buttonStyles, SystemLabel } from "@/ui/primitives";
import { SiteFooter, SiteHeader } from "@/ui/SiteHeader";

export const metadata: Metadata = {
  ...pageMetadata({
    title: `Blog — ${profile.name}`,
    description: `Engineering notes and articles by ${profile.name}. Coming soon.`,
    path: "/blog/",
  }),
  // Nothing to index yet; switch this off with the first post.
  robots: { index: false, follow: true },
};

/** Placeholder until the first post ships (owner request, 2026-10-12). */
export default function BlogPage() {
  return (
    <>
      <SiteHeader pageLabel="Blog" />
      <main id="main" className="relative isolate flex min-h-dvh items-center overflow-hidden border-b border-line">
        <div aria-hidden="true" className="hero-aurora" />
        <div aria-hidden="true" className="hero-grid" />

        <div className="relative mx-auto w-full max-w-3xl px-5 pb-20 pt-32">
          <p className="reveal inline-flex items-center gap-2 border border-line bg-surface/70 px-3 py-2 font-mono text-[11px] text-muted backdrop-blur">
            <span aria-hidden="true" className="live-dot" />
            <span>
              <span className="text-text">&gt; STATUS:</span> writing in progress
            </span>
          </p>

          <SystemLabel className="reveal mt-8 block">Blog_00</SystemLabel>
          <h1 className="reveal mt-2 font-display text-7xl uppercase leading-[0.85] tracking-wide sm:text-9xl" style={{ animationDelay: "80ms" }}>
            Coming{" "}
            <br />
            <span className="text-accent">soon</span>
          </h1>
          <p className="reveal mt-6 max-w-xl border-l-2 border-brand pl-5 text-lg leading-relaxed text-text/85" style={{ animationDelay: "160ms" }}>
            Engineering notes and articles are on the way. Follow along and you&apos;ll see the first post when it ships.
          </p>

          {/* A tiny terminal: the "build" of the first post. */}
          <div className="reveal module mt-10 overflow-hidden" style={{ animationDelay: "240ms" }} aria-hidden="true">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#f87171]/70" />
              <span className="size-2.5 rounded-full bg-[#fbbf24]/70" />
              <span className="size-2.5 rounded-full bg-[#34d399]/70" />
              <span className="ml-2 font-mono text-[11px] text-muted">~/blog</span>
            </div>
            <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
              <p className="text-muted">
                <span className="text-accent">$</span> ls ./posts
              </p>
              <p className="text-text/80">total 0</p>
              <p className="pt-2 text-muted">
                <span className="text-accent">$</span> ./publish --first-post
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-text/80">compiling</span>
                <span className="blog-progress" />
                <span className="caret" />
              </div>
            </div>
          </div>

          <div className="reveal mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "320ms" }}>
            <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
              <LinkedIn className="size-4" /> Follow on LinkedIn
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
              <GitHub className="size-4" /> GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link
              href="/#projects"
              className="inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-accent"
            >
              <ArrowLeft className="size-4" /> Back to work
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <div aria-hidden="true" className="grain" />
    </>
  );
}
