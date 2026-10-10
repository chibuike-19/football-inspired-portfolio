# Emmanuel Obiechina — Football Portfolio

A portfolio where a 3D football stadium is the navigation. See `SPEC.md` for the full specification and phase plan.

**Status:** Phase 2 complete. The server-rendered HTML portfolio (Layer 1) is finished. The 3D world starts in Phase 3.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm test           # Vitest
npm run lint
npm run typecheck  # run after a build or dev start (Next generates route types)
```

Preview the static build: `npx serve out` (or any static file server).

## Deploy

The build is fully static (`output: "export"`). Deploy `out/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

Set **`NEXT_PUBLIC_SITE_URL`** to the final domain at build time (e.g. `https://emmanuelobiechina.dev`). It is used for canonical URLs, Open Graph tags, the sitemap and robots.txt. Without it they point at `http://localhost:3000`.

## Editing content

All portfolio content is typed data in `content/`. No component contains portfolio text.

| File | What it holds |
|---|---|
| `content/profile.ts` | Name, headline, intro, bio, strengths, skills, certifications, languages |
| `content/experience.ts` | Roles (ordered by end date, current first) |
| `content/projects.ts` | Project boards: copy, links and board accent colour |
| `content/links.ts` | Email, GitHub, LinkedIn, résumé path |
| `public/resume.pdf` | The downloadable résumé — replace the file to update it |

`npm test` checks content integrity: unique slugs, cross-references between experience and projects, https links and date order.

Content sources and open items: `CONTENT.md`, `CONTENT_TODO.md`.

## Social preview image

`app/opengraph-image.png` is a committed PNG so static hosts serve it with the right content type. It is generated from `scripts/opengraph-image.tsx`; the regeneration steps are in that file's header comment.

## Structure

```
app/          routes: home, /projects/[slug], sitemap, robots, icon, OG image
content/      typed portfolio data (source of truth)
lib/          site constants, date formatting
ui/           server-rendered sections, reused by the 3D panels in later phases
tests/        Vitest
```
