import { profile } from "@/content";
import { SectionHeading, SystemLabel } from "../primitives";

/** Capabilities, how I work, and the full toolbox (Layer 1 only). */
export function StackSection() {
  return (
    <section aria-labelledby="stack-heading" id="stack" className="mx-auto max-w-6xl px-5 py-24">
      <SectionHeading id="stack-heading" title="Stack & practice" label="Stack_03" />

      <div className="grid gap-5 md:grid-cols-3">
        {profile.capabilities.map((capability, i) => (
          <article key={capability.title} className="module flex flex-col p-6">
            <SystemLabel>{`Cap_0${i + 1}`}</SystemLabel>
            <h3 className="mt-3 font-display text-3xl uppercase leading-none tracking-wide">{capability.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{capability.summary}</p>
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-text/90">
              {capability.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden="true" className="font-mono text-xs leading-5 text-accent">
                    ▹
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h3 className="flex items-center gap-3 font-display text-3xl uppercase tracking-wide">How I work</h3>
          <div className="mt-4 space-y-4 leading-relaxed text-muted">
            {profile.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-3xl uppercase tracking-wide">Toolbox</h3>
          <dl className="mt-4 space-y-4 border border-line bg-surface/50 p-5 font-mono text-[13px]">
            {profile.skills.map((group) => (
              <div key={group.group}>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-accent">{group.group}</dt>
                <dd className="mt-1 leading-relaxed text-text/85">{group.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
