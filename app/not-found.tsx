import Link from "next/link";
import { buttonStyles } from "@/ui/primitives";

export default function NotFound() {
  return (
    <main id="main" className="relative mx-auto grid min-h-dvh max-w-xl place-content-center gap-4 px-5 text-center">
      <div aria-hidden="true" className="hero-grid" />
      <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-accent">&gt; ERROR 404 · out of play</p>
      <h1 className="relative font-display text-7xl uppercase leading-none tracking-wide">Page not found</h1>
      <p className="relative text-muted">That route doesn&apos;t exist on this pitch.</p>
      <div className="relative">
        <Link href="/" className={buttonStyles.primary}>
          Back to kick-off
        </Link>
      </div>
    </main>
  );
}
