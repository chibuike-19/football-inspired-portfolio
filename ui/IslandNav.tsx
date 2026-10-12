"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileText } from "./icons";

const ITEMS = [
  { id: "projects", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "stack", label: "Stack" },
  { id: "resume", label: "Résumé" },
  { id: "contact", label: "Contact" },
] as const;

/** A separate page rather than a home-page section. */
export const BLOG = { href: "/blog/", label: "Blog" } as const;

const SECTION_LABELS: Record<string, string> = {
  profile: "Home",
  ...Object.fromEntries(ITEMS.map((item) => [item.id, item.label])),
};

/** Distance scrolled before the island compacts. */
const COMPACT_AFTER = 24;

/**
 * "Dynamic Island" navigation. Wide at the top of the page; once scrolled it
 * compacts into a floating pill whose status chip shows the section being read.
 * On phones it stays compact and expands downward into a menu.
 */
export function IslandNav({
  name,
  avatar,
  resumeHref,
  pageLabel,
}: {
  name: string;
  avatar: string;
  resumeHref: string;
  pageLabel?: string;
}) {
  const [compact, setCompact] = useState(false);
  const [section, setSection] = useState<string>("profile");
  const [open, setOpen] = useState(false);
  const pill = useRef<HTMLSpanElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the section in the middle band of the viewport (home page only).
  useEffect(() => {
    if (pageLabel) return;
    const sections = Object.keys(SECTION_LABELS)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setSection(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pageLabel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /** Slides the hover highlight behind the link under the pointer or keyboard focus. */
  const highlight = (target: HTMLElement | null) => {
    const el = pill.current;
    if (!el) return;
    if (!target) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    el.style.width = `${target.offsetWidth}px`;
    el.style.transform = `translateX(${target.offsetLeft}px)`;
  };

  const status = pageLabel ?? SECTION_LABELS[section] ?? "Home";

  return (
    <header className="island-wrap" data-compact={compact || undefined} data-open={open || undefined}>
      <nav aria-label="Sections" className="island">
        <div className="island-bar">
          <Link href="/#profile" aria-label={name} className="island-brand" onClick={() => setOpen(false)}>
            <Image src={avatar} alt="" width={64} height={64} className="island-mark" priority />
            <span aria-hidden="true" className="island-name">
              {name}
            </span>
          </Link>

          {/* The "live activity": which section you're in. */}
          <span className="island-status" aria-hidden="true">
            <span className="live-dot" />
            {status}
          </span>

          <ul className="island-links" onPointerLeave={() => highlight(null)}>
            <span ref={pill} aria-hidden="true" className="island-highlight" />
            {ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/#${item.id}`}
                  aria-current={!pageLabel && section === item.id ? "location" : undefined}
                  onPointerEnter={(event) => highlight(event.currentTarget)}
                  onFocus={(event) => highlight(event.currentTarget)}
                  onBlur={() => highlight(null)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={BLOG.href}
                aria-current={pageLabel === BLOG.label ? "page" : undefined}
                onPointerEnter={(event) => highlight(event.currentTarget)}
                onFocus={(event) => highlight(event.currentTarget)}
                onBlur={() => highlight(null)}
              >
                {BLOG.label}
              </Link>
            </li>
          </ul>

          <a href={resumeHref} className="island-cta">
            <FileText className="size-3.5" />
            CV
            <span className="sr-only">: open my résumé (PDF)</span>
          </a>

          <button
            ref={menuButton}
            type="button"
            className="island-menu-button"
            aria-expanded={open}
            aria-controls="island-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {/* Phone menu: the island grows downward. */}
        <div id="island-menu" className="island-menu" inert={!open}>
          <ul>
            {ITEMS.map((item) => (
              <li key={item.id}>
                <Link href={`/#${item.id}`} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={BLOG.href} aria-current={pageLabel === BLOG.label ? "page" : undefined} onClick={() => setOpen(false)}>
                {BLOG.label}
              </Link>
            </li>
            <li>
              <a href={resumeHref} onClick={() => setOpen(false)}>
                Open CV (PDF)
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
