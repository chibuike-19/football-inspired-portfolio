import Link from "next/link";
import { buttonStyles } from "@/ui/primitives";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl place-content-center gap-4 px-5 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">404 · Out of play</p>
      <h1 className="font-display text-5xl font-bold uppercase tracking-wide">Page not found</h1>
      <p className="text-muted">That page isn&apos;t on the pitch.</p>
      <div>
        <Link href="/" className={buttonStyles.primary}>
          Back to kick-off
        </Link>
      </div>
    </main>
  );
}
