# Emmanuel Obiechina — Football Portfolio

A portfolio where a 3D football stadium is the navigation. See `SPEC.md` for the full specification and phase plan.

**Status:** Phase 5 complete. Rolling the ball near a landmark lights it up and shows a preview card with its content and links, with no click needed. Expanded panels, the HUD menu and deep links arrive in Phase 6.

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

## Tuning movement and camera

All feel-related numbers (speed, acceleration, friction, camera height and distance, look-ahead, discovery radii, grace period, switch margin) live in `core/config.ts`. Landmark positions and per-landmark radii are in `world/landmarks.ts`. They supersede the starting values in SPEC §13.

## How the 3D view loads

`world/WorldMount.tsx` decides between the 3D stadium and Classic view:

- **Classic view** is used without WebGL2, with Save-Data on, when the visitor chose it before, or when the URL has a `#section` deep link (until Phase 6).
- The world loads lazily after the HTML has painted. If it isn't ready in 15 s the page stays classic and offers "3D stadium ready: enter" when it finishes.
- A render error or lost graphics context falls back to Classic view with a short notice.

Debug builds also expose `window.__world` (`getState()`, `setBall(x, z)`) for browser tests.

To inspect the scene from any angle, build with `NEXT_PUBLIC_WORLD_DEBUG=1` (or use `npm run dev`) and add `?cam=x,y,z,targetX,targetY,targetZ` to the URL. This is compiled out of normal builds.

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
core/         pure TypeScript: movement, collision, camera, input mapping (unit-tested, no React or three.js)
lib/          site constants, date formatting
state/        discrete UI state (zustand)
ui/           server-rendered sections, reused by the 3D panels in later phases
world/        3D stadium: layout constants, landmarks, scene components, canvas textures
tests/        Vitest
```
