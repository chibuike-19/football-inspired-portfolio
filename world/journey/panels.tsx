"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { contact, experience, getProject, playbook, profile, trophies } from "@/content";
import { formatRange } from "@/lib/format";
import { kindLabel } from "@/lib/project";
import { useWorldStore } from "@/state/store";
import { ArrowLeft, ArrowRight, Download, GitHub, LinkedIn, Mail } from "@/ui/icons";
import { buttonStyles, LinkButton, SystemLabel, TagList } from "@/ui/primitives";
import { chapterStart, STATIONS, type JourneyStation } from "./stations";

const go = (station: number, replay = false) => useWorldStore.getState().requestJourneyJump(station, replay);
const openDetails = (id: string) => useWorldStore.getState().openPanel(id);

const kicker = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent";
const heading = "font-display uppercase leading-none tracking-wide";
const textLink =
  "inline-flex min-h-10 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-accent hover:underline";

/** Short name for a station inside its chapter (e.g. the project or company name). */
const subLabel = (station: JourneyStation) => station.label.split(" · ").slice(1).join(" · ") || station.label;

/**
 * Within a chapter: previous / next, plus one dot per item for direct selection
 * (spec §4, project navigation). Reused for companies and trophies.
 */
function SubNav({ station }: { station: JourneyStation }) {
  if (!station.sub) return null;
  const { index, total } = station.sub;
  const siblings = STATIONS.filter((s) => s.chapter === station.chapter);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => go(station.index - 1)}
        className={`${buttonStyles.secondary} min-h-10 px-3 py-2`}
        aria-label="Previous"
      >
        <ArrowLeft className="size-4" />
      </button>
      <div className="flex flex-col items-center gap-2">
        <ol className="flex items-center gap-1" aria-label="Jump to">
          {siblings.map((sibling) => (
            <li key={sibling.id}>
              <button
                type="button"
                onClick={() => go(sibling.index)}
                aria-label={subLabel(sibling)}
                aria-current={sibling.index === station.index ? "step" : undefined}
                title={subLabel(sibling)}
                className="sub-dot"
              />
            </li>
          ))}
        </ol>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted" aria-hidden="true">
          <span className="text-text">{pad(index + 1)}</span> / {pad(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => go(station.index + 1)}
        className={`${buttonStyles.secondary} min-h-10 px-3 py-2`}
        aria-label="Next"
      >
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/** Chapter title shown on the first station of a multi-station chapter. */
function ChapterIntro({ show, title, subtitle }: { show: boolean; title: string; subtitle: string }) {
  if (!show) return null;
  return (
    <div className="mb-5 border-b border-line pb-4">
      <p className={`${heading} text-3xl`}>{title}</p>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

function KickoffPanel() {
  return (
    <>
      <p className={kicker}>Matchday · {profile.location}</p>
      <h2 className={`${heading} mt-3 text-5xl sm:text-6xl`}>
        Every great career has a <span className="text-accent">kickoff.</span>
      </h2>
      <p className="mt-5 font-display text-2xl uppercase tracking-wide">{profile.name}</p>
      <p className="text-sm text-muted">{profile.headline}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => go(1)} className={buttonStyles.primary}>
          Kick off <ArrowRight className="size-4" />
        </button>
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span aria-hidden="true" className="scroll-cue" /> or scroll
        </span>
      </div>
    </>
  );
}

function PlayerPanel() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Image
          src={profile.avatar}
          alt=""
          width={96}
          height={96}
          className="size-20 border border-brand/60 object-cover shadow-[0_0_30px_-8px_var(--color-brand)]"
        />
        <div>
          <p className={kicker}>Player 01</p>
          <h2 className={`${heading} mt-1 text-4xl`}>{profile.name}</h2>
          <p className="mt-1 text-sm text-accent">{profile.headline}</p>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-muted max-md:hidden">
        <span aria-hidden="true" className="live-dot mt-[5px]" />
        {profile.status}
      </p>
      <p className="mt-4 leading-relaxed text-text/85">{profile.intro}</p>
      {/* Phones: the sheet stays compact; full stats are in "How I work". */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 max-md:hidden">
        {profile.signals.slice(0, 4).map((signal) => (
          <div key={signal.label} className="flex flex-col-reverse justify-end gap-1 border-l border-line pl-3">
            <dt className="font-mono text-[10px] uppercase leading-snug tracking-wider text-muted">{signal.label}</dt>
            <dd className="font-display text-3xl leading-none">{signal.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a href={contact.resume.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
          <Download className="size-4" /> Download CV<span className="sr-only"> (PDF, opens in a new tab)</span>
        </a>
        <button type="button" onClick={() => openDetails("profile")} className={textLink}>
          How I work <ArrowRight className="size-4" />
        </button>
      </div>
    </>
  );
}

function PlaybookPanel() {
  const selectedId = useWorldStore((s) => s.playbookSkill);
  const skill = playbook.find((item) => item.id === selectedId);
  return (
    <>
      <p className={kicker}>Tactics · 4-3-3</p>
      <h2 className={`${heading} mt-2 text-5xl`}>The playbook</h2>
      <p className="mt-2 text-sm text-muted">The principles behind the game: my starting XI.</p>
      {/* Updates in place as players are selected; announced politely for screen readers. */}
      <div className="mt-5 min-h-44 border border-line bg-ink/40 p-4" aria-live="polite">
        {skill ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              #{playbook.indexOf(skill) + 1} · {skill.role} · {skill.group}
            </p>
            <p className={`${heading} mt-2 text-3xl`}>{skill.name}</p>
            <p className="mt-2 leading-relaxed text-text/90">{skill.detail}</p>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            <span className="max-md:hidden">Hover or focus a player on the pitch</span>
            <span className="md:hidden">Tap a player on the pitch</span> to see what they bring to the team.
          </p>
        )}
      </div>
      <ul className="mt-4 space-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted max-md:hidden">
        <li>Goalkeeper · quality, the last line of defence</li>
        <li>Defence · the foundations that keep products safe</li>
        <li>Midfield · what connects the system</li>
        <li>Attack · what users see and use</li>
      </ul>
    </>
  );
}

function ProjectPanel({ station, slug }: { station: JourneyStation; slug: string }) {
  const project = getProject(slug);
  if (!project) return null;
  return (
    <>
      <ChapterIntro show={station.sub?.index === 0} title="Career highlights" subtitle="The abilities, in action." />
      <p className={kicker}>
        {kindLabel(project)} · {project.context}
      </p>
      <h2 className={`${heading} mt-2 text-4xl`}>{project.name}</h2>
      {project.badge && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">★ {project.badge}</p>}
      <p className="mt-3 leading-relaxed text-text/90">{project.oneLiner}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted max-md:hidden">
        {project.contribution.slice(0, 2).map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="font-mono text-xs leading-5 text-accent">
              ▹
            </span>
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <TagList items={project.tech.slice(0, 4)} label={`${project.name} technologies`} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {project.links.slice(0, 1).map((link) => (
          <LinkButton key={link.href} link={{ ...link, note: undefined }} variant="primary" />
        ))}
        {project.links.length === 0 && project.access && (
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">🔒 {project.access}</span>
        )}
        <button type="button" onClick={() => openDetails(`project:${slug}`)} className={textLink}>
          Case study <ArrowRight className="size-4" />
        </button>
      </div>
      <SubNav station={station} />
    </>
  );
}

function ExperiencePanel({ station, id }: { station: JourneyStation; id: string }) {
  const entry = experience.find((e) => e.id === id);
  if (!entry) return null;
  const first = entry.positions[0];
  const last = entry.positions[entry.positions.length - 1];
  return (
    <>
      <ChapterIntro
        show={station.sub?.index === 0}
        title="Match history"
        subtitle="The teams and experiences that shaped my career."
      />
      <p className={kicker}>
        {formatRange({ start: last.start, end: first.end })} · {entry.location}
      </p>
      <h2 className={`${heading} mt-2 text-4xl`}>{entry.company}</h2>
      <p className="mt-1 text-sm font-semibold">{entry.positions.map((p) => p.title).join(" · ")}</p>
      {entry.summary && <p className="mt-3 text-sm leading-relaxed text-muted max-md:hidden">{entry.summary}</p>}
      <ul className="mt-3 space-y-1.5 text-sm text-text/90">
        {entry.highlights.slice(0, 3).map((item, i) => (
          <li key={item} className={`flex gap-2 ${i > 0 ? "max-md:hidden" : ""}`}>
            <span aria-hidden="true" className="font-mono text-xs leading-5 text-accent">
              ▹
            </span>
            {item}
          </li>
        ))}
      </ul>
      {entry.highlights.length > 1 && (
        <button type="button" onClick={() => openDetails("experience")} className={`${textLink} mt-2`}>
          Full experience <ArrowRight className="size-4" />
        </button>
      )}
      <SubNav station={station} />
    </>
  );
}

function TrophyPanel({ station, id }: { station: JourneyStation; id: string }) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy) return null;
  return (
    <>
      <ChapterIntro show={station.sub?.index === 0} title="The trophy cabinet" subtitle="The milestones behind the journey." />
      <SystemLabel>{`Trophy_0${(station.sub?.index ?? 0) + 1}`}</SystemLabel>
      <h2 className={`${heading} mt-2 text-4xl`}>{trophy.title}</h2>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{trophy.context}</p>
      <ul className="mt-4 space-y-2">
        {trophy.items.map((item) => (
          <li key={item} className="flex gap-2.5 leading-relaxed">
            <span aria-hidden="true" className="text-accent">
              ★
            </span>
            {item}
          </li>
        ))}
      </ul>
      <SubNav station={station} />
    </>
  );
}

function FullTimePanel() {
  return (
    <>
      <p className={kicker}>Full time</p>
      <h2 className={`${heading} mt-2 text-5xl sm:text-6xl`}>
        The next match <span className="text-accent">starts here.</span>
      </h2>
      <p className="mt-3 text-lg text-text/85">Let&apos;s build something great together.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`mailto:${contact.email}`} className={buttonStyles.primary}>
          <Mail className="size-4" /> Get in touch
        </a>
        <a href={contact.github.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
          <GitHub className="size-4" /> GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={contact.linkedin.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
          <LinkedIn className="size-4" /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <p className="mt-3 select-all break-all font-mono text-xs text-muted">{contact.email}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button type="button" onClick={() => {
            useWorldStore.getState().setAutoplay(true);
            go(chapterStart("kickoff"), true);
          }} className={textLink}>
          Replay the journey ↺
        </button>
        <button type="button" onClick={() => useWorldStore.getState().setExperience("freeplay")} className={textLink}>
          Free play: drive the ball
        </button>
        <a href={contact.resume.href} target="_blank" rel="noopener noreferrer" className={textLink}>
          <Download className="size-4" /> CV<span className="sr-only"> (PDF, opens in a new tab)</span>
        </a>
      </div>
    </>
  );
}

export function StationPanel({ station }: { station: JourneyStation }): ReactNode {
  const { panel } = station;
  switch (panel.kind) {
    case "kickoff":
      return <KickoffPanel />;
    case "player":
      return <PlayerPanel />;
    case "playbook":
      return <PlaybookPanel />;
    case "project":
      return <ProjectPanel station={station} slug={panel.slug} />;
    case "experience":
      return <ExperiencePanel station={station} id={panel.id} />;
    case "trophy":
      return <TrophyPanel station={station} id={panel.id} />;
    case "fulltime":
      return <FullTimePanel />;
  }
}

export const lastStation = STATIONS.length - 1;
