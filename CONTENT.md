# Content Draft (Phase 1)

Every item below comes from a cited source. In Phase 2 this becomes the typed data in `content/`.

**Sources**
- **[R]** Résumé: `~/Downloads/Emmanuel Obiechina_seT_resume.pdf` (read 2026-10-10)
- **[LI]** LinkedIn export: `~/Downloads/Profile (1).pdf` (read 2026-10-10)
- **[GH]** GitHub API: profile, repositories and merged PRs for `chibuike-19` (fetched 2026-10-10)
- **[DS]** devspot.app public homepage (fetched 2026-10-10)
- **[O]** Owner's answers in this session

Where [R] and [LI] disagree, **[LI] wins** (owner's instruction). Résumé details that LinkedIn doesn't contradict are kept.

---

## Profile

| Field | Value | Source |
|---|---|---|
| Name | Emmanuel Obiechina | R, LI |
| Headline | Frontend-focused Full-Stack Engineer | LI |
| Sub-headline | Next.js · React · TypeScript, test-driven, code-review-minded, auth & data-heavy UIs | LI |
| Location | Lagos, Nigeria | R, LI |
| Email | emmanuelobiechina8@gmail.com | R, LI, O |
| GitHub | https://github.com/chibuike-19 | O, GH |
| LinkedIn | https://www.linkedin.com/in/emmanuelobiechina | O, R, LI |
| Résumé | `/resume.pdf` | R |
| Phone | **Not shown** | O |
| "Open to roles" banner | **Not shown** | O |

**Draft intro (scoreboard; please approve or edit):**
> Frontend-focused full-stack engineer shipping production web apps with Next.js, React and TypeScript, from corporate banking approval flows to AI-powered hackathon platforms.

**Draft longer bio (profile panel), condensed from [LI]:**
> I build production web applications with Next.js, React and TypeScript, working with remote teams in the US and the UK. At DevSpot I work across the stack: the product in Next.js and TypeScript, and the AI features in Python, including a system that matches builders to hackathons and an AI judge that scores submissions against organizer-defined criteria. At Rova I built transfer and multi-level approval flows for a corporate internet banking platform, with test-driven development and 85%+ coverage.
>
> I use AI tools to move faster, and I own the result: I design the architecture, review every generated line for hallucinated APIs and dropped requirements, and keep tests, CI and code review in place so speed never costs quality.

**Strengths for the scoreboard:** Next.js · React · TypeScript · Python (AI features) · Testing & CI

**Skills [R, LI]**
- Languages: TypeScript, JavaScript, Python, Go, SQL, HTML, CSS
- Frameworks and libraries: React, Next.js, Node.js, Django, Redis, NumPy, Jest
- Platforms and practice: GitHub Actions (CI/CD), Docker, Kubernetes, PostgreSQL, MongoDB, Supabase, GCP, AWS (Lambda, S3, Textract), SonarQube, TDD

**Certifications [LI]:** Postman Student Expert · Microsoft ADC Learnathon Champion
**Spoken languages [LI]:** English (full professional), Spanish (Limited working proficiency), Igbo (native)
**Education:** omitted from the site (owner's instruction).

---

## Experience

### DevSpot — Full Stack Engineer
Nov 2024 – Present · San Francisco, US (remote) [LI]
Product: a platform where organizers run hackathons, builders ship projects and investors discover talent through proof of work [LI, DS].
- Built an **AI matching system in Python** that pairs builders with hackathons using their profiles and submitted links [LI, O].
- Built **JudgeBot, an AI judge agent in Python** that scores submissions against organizer-defined criteria, plus prize-distribution workflows, across $370K in deployed capital [R, LI, O].
- Redesigned authentication and session management across client and server; secure API middleware used in production across 11 global hackathons [R, LI].
- Optimized performance for 8,382+ registered users: reduced bundle size through code splitting, lazy loading and image optimization [R, LI].
- Lead SEO engineering for the site [LI].
- Integrated Twilio for in-app messaging; built an image crop and upload pipeline on AWS S3 [R].
- Directed AI-assisted code generation with line-by-line review; maintain 70%+ test coverage with CI as a guardrail [LI].

Tags: Next.js · TypeScript · Python · AI agents · Node.js · AWS S3 · Twilio

### Rova — Senior Frontend Developer
Mar 2025 – Apr 2026 · London, UK (remote) [LI]
- Built the admin portal features of a Corporate Internet Banking platform used by First City Monument Bank and other enterprise clients, within the Core Banking team [R, LI].
- Developed transfer and multi-level transaction approval flows with backend (Java/SQL) and DevOps (Docker, AWS) teams to meet banking security and compliance requirements [R, LI].
- Implemented audit-logging UI and role-based access control (RBAC) across the enterprise client base [R, LI].
- Practiced TDD with 85%+ coverage enforced through SonarQube [LI].
- Led code reviews for 5 engineers, wrote the team's review checklist and set up GitHub Actions on every PR [LI].

Tags: React · TypeScript · RBAC · TDD · GitHub Actions

### Browndotmedia — Frontend Engineer
Mar 2024 – Sept 2024 · Lagos, Nigeria [LI]
- Built the authentication flow for both the Browndot admin platform and talent app [LI].
- Built a shared library of 20+ reusable React components, removing ~15,000 lines of duplicated code [R].
- Mentored 3 junior developers and introduced a structured PR template that increased review participation [R].

### NitHub — Technical Mentor | Software Engineer
Technical Mentor | Software Engineer: Mar 2023 – Aug 2024 · Software Engineer: Jul 2021 – Mar 2023 · Lagos, Nigeria [LI]
- Built an English-to-Pidgin translator with Python and NLP for people with limited English proficiency [R, LI].
- Built a certificate-generation system and an event scheduler with automatic time-slot conflict detection [R].
- Technical mentor to 50+ engineers [LI].

### KAM Holding — Software Developer
Jul 2023 – Nov 2023 [LI]. Listed with title and dates only (no description available).

---

## Projects (ad boards)

**1. DevSpot** — https://devspot.app
- One-liner: Where builders join hackathons, ship projects and get discovered by organizers and investors.
- Highlights: AI builder–hackathon matching and the JudgeBot AI judge (Python), auth redesign used across 11 hackathons, prize distribution across $370K.
- Source: private.

**2. FCMB Business Online** (built at Rova) — https://businessonline.fcmb.com
- One-liner: Corporate internet banking for First City Monument Bank's business customers.
- Highlights: transfer and multi-level approval flows, audit logging, RBAC, 85%+ test coverage.
- Link label: "Live product · login required". Source: private. No screenshots without client permission.

**3. Stream2Peer** — https://stream2peer.mov · https://github.com/tobySolutions/stream2peer
- One-liner: Open-source, decentralized live-stream management (an open-source take on StreamYard).
- Contribution [GH]: about 20 merged PRs (Oct 2024 – Jan 2025): responsive dashboard layout, YouTube and Twitch integrations, landing page, dashboard theming, network/state setup, bug fixes.

**4. roadmap.sh (open source)** — https://roadmap.sh · [merged PRs](https://github.com/nilbuild/developer-roadmap/pulls?q=author%3Achibuike-19+is%3Amerged)
- One-liner: Contributor to one of GitHub's most-starred projects (about 369K stars).
- Contribution [GH]: 6 merged PRs adding content for the Git/GitHub, Redis, AI Engineer and custom-validator topics (Aug – Oct 2024).

---

## Landmark → content map

| Landmark | Content |
|---|---|
| Scoreboard / center circle | Profile, intro, strengths |
| Dugout / technical area | Experience (preview: DevSpot and Rova; panel: all roles) |
| Ad boards × 4 | DevSpot, FCMB Business Online, Stream2Peer, roadmap.sh |
| Tunnel | Résumé preview + open/download, certifications |
| Goal-side terminal | Email, LinkedIn, GitHub |

DevSpot and FCMB appear as both experience and projects. The experience entry covers the **role**, the board covers the **product**, and each links to the other.
