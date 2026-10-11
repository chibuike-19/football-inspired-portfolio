import { contact, profile } from "@/content";
import { FileText, GitHub, LinkedIn, Mail } from "../icons";
import { buttonStyles, TagList } from "../primitives";

/** Hero and about. Shown on the scoreboard / center-circle landmark. */
export function ProfileSection() {
  return (
    <section id="profile" aria-labelledby="profile-heading" className="relative overflow-hidden">
      {/* Pitch stripes and center-circle motif behind the hero. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(31_122_62/0.16)_0_80px,rgb(31_122_62/0.08)_80px_160px)]" />
        <div className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/[0.06]" />
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/[0.05]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {profile.location}
        </p>
        <h1 id="profile-heading" className="mt-2 font-display text-6xl font-bold uppercase leading-[0.9] tracking-wide sm:text-8xl">
          {profile.name}
        </h1>
        <p className="mt-4 text-xl font-semibold text-text sm:text-2xl">{profile.headline}</p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{profile.intro}</p>

        <div className="mt-6">
          <TagList items={profile.strengths} label="Core strengths" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={contact.resume.href} className={buttonStyles.primary}>
            <FileText className="size-4" />
            View résumé
          </a>
          <a href="#contact" className={buttonStyles.secondary}>
            <Mail className="size-4" />
            Contact
          </a>
          <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
            <GitHub className="size-4" />
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
            <LinkedIn className="size-4" />
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-5 pb-8">
        <ProfileAbout />
      </div>
    </section>
  );
}

/** Bio and skills. `compact` stacks them for narrow containers (the detail panel). */
export function ProfileAbout({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-8" : "grid gap-10 md:grid-cols-[1.4fr_1fr]"}>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">About</h2>
        <div className="mt-3 space-y-4 leading-relaxed text-muted">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Skills</h2>
        <dl className="mt-3 space-y-4">
          {profile.skills.map((group) => (
            <div key={group.group}>
              <dt className="mb-2 text-sm font-semibold text-text">{group.group}</dt>
              <dd>
                <TagList items={group.items} label={group.group} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
