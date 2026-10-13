import Image from "next/image";
import { contact, profile } from "@/content";
import { ArrowRight, FileText, GitHub, LinkedIn } from "../icons";
import { buttonStyles, SystemLabel } from "../primitives";

/** Stack nodes around the monogram: percentage positions inside the graph box. */
const NODE_POSITIONS: [number, number][] = [
  [50, 9],
  [14, 28],
  [86, 28],
  [14, 72],
  [86, 72],
  [50, 91],
];

/** Decorative "system graph": the real stack wired to a central monogram. */
function SystemGraph() {
  const nodes = profile.stackGraph.slice(0, NODE_POSITIONS.length);
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[10/9] w-full max-w-[34rem]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 90" preserveAspectRatio="none">
        {nodes.map((node, i) => {
          const [x, y] = NODE_POSITIONS[i];
          return (
            <line
              key={node}
              x1="50"
              y1="45"
              x2={x}
              y2={(y / 100) * 90}
              className="graph-link"
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${i * -0.7}s` }}
            />
          );
        })}
      </svg>
      {nodes.map((node, i) => {
        const [x, y] = NODE_POSITIONS[i];
        return (
          <span
            key={node}
            className="graph-node absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-line bg-surface/90 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text backdrop-blur"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${250 + i * 80}ms` }}
          >
            <span className="mr-2 text-accent">{"{}"}</span>
            {node}
          </span>
        );
      })}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="graph-core relative size-28 overflow-hidden border border-brand/70 bg-ink shadow-[0_0_48px_-8px_var(--color-brand)]">
          <Image src={profile.avatar} alt="" fill sizes="112px" className="object-cover" priority />
        </div>
        <span className="mt-2 inline-block border border-brand/50 bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          [Senior_FSE]
        </span>
      </div>
    </div>
  );
}

const iconLink =
  "grid size-11 place-items-center border border-line text-muted transition-colors hover:border-accent/60 hover:text-accent";

/** Hero (Layer 1), and the scoreboard / centre-circle landmark's content. */
export function ProfileSection() {
  return (
    <section id="profile" aria-labelledby="profile-heading" className="hero relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="hero-aurora" />
      <div aria-hidden="true" className="hero-grid" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-32 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        <div>
          <p className="reveal inline-flex items-start gap-2 border border-line bg-surface/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted backdrop-blur">
            <span aria-hidden="true" className="live-dot mt-[5px]" />
            <span>
              <span className="text-text">&gt; STATUS:</span> {profile.status}
            </span>
          </p>

          <h1
            id="profile-heading"
            className="reveal mt-7 font-display text-6xl uppercase leading-[0.85] tracking-wide sm:text-8xl"
            style={{ animationDelay: "80ms" }}
          >
            {profile.name}
          </h1>
          <p className="reveal mt-4 font-display text-2xl uppercase tracking-[0.12em] text-accent sm:text-3xl" style={{ animationDelay: "140ms" }}>
            {profile.headline}
          </p>

          <p className="reveal mt-7 max-w-xl border-l-2 border-brand pl-5 text-lg leading-relaxed text-text/85" style={{ animationDelay: "200ms" }}>
            {profile.intro}
          </p>

          <div className="reveal mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "260ms" }}>
            <a href="#projects" className={buttonStyles.primary}>
              View work <ArrowRight className="size-4" />
            </a>
            <a href={contact.resume.href} className={buttonStyles.secondary}>
              <FileText className="size-4" />
              Résumé
            </a>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={iconLink}>
              <GitHub className="size-5" />
              <span className="sr-only">GitHub (opens in a new tab)</span>
            </a>
            <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={iconLink}>
              <LinkedIn className="size-5" />
              <span className="sr-only">LinkedIn (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <SystemGraph />
        </div>
      </div>

      {/* Verified numbers from shipped work. */}
      <div className="relative mx-auto max-w-6xl px-5 pb-12">
        <div className="border-t border-line pt-6">
          <SystemLabel>Signals</SystemLabel>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {profile.signals.map((signal) => (
              // Value first visually; the label stays first in the DOM (dt before dd).
              <div key={signal.label} className="flex flex-col-reverse justify-end gap-1.5 border-l border-line pl-4">
                <dt className="font-mono text-[11px] uppercase leading-snug tracking-wider text-muted">{signal.label}</dt>
                <dd className="font-display text-4xl leading-none text-text">{signal.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/** Bio and capabilities, for the 3D profile panel. */
export function ProfileAbout({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-8" : "grid gap-10 md:grid-cols-[1.4fr_1fr]"}>
      <div>
        <h2 className="font-display text-3xl uppercase tracking-wide">How I work</h2>
        <div className="mt-3 space-y-4 leading-relaxed text-muted">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {profile.capabilities.map((capability) => (
          <div key={capability.title}>
            <h3 className="font-display text-2xl uppercase tracking-wide">{capability.title}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-text/90">
              {capability.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden="true" className="font-mono text-xs leading-5 text-accent">
                    ▹
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
