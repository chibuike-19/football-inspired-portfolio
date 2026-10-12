# Emmanuel Obiechina — Football Portfolio

A portfolio where a 3D football stadium is the navigation. See `SPEC.md` for the full specification and phase plan.

**Status:** Scroll-driven journey, step 1 of 6. The classic page is the default; "Explore in 3D" opens a guided, scroll-driven story through the stadium (Kickoff → Player → Playbook → Highlights → Journey → Trophies → Full Time). Free play (driving the ball) remains available from the journey menu. The tunnel interior and trophy room arrive in steps 4–5.

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

## Quality tiers

`world/quality.ts` defines high / medium / low (pixel ratio, shadows, texture resolution, crowd density). Touch devices and machines with ≤ 4 CPU cores start at medium. During play, `core/performance.ts` steps quality down after sustained slow frames; at the lowest tier the visitor is offered Classic view (never forced).

## Tuning movement and camera

All feel-related numbers (speed, acceleration, friction, camera height and distance, look-ahead, discovery radii, grace period, switch margin) live in `core/config.ts`. Landmark positions and per-landmark radii are in `world/landmarks.ts`. They supersede the starting values in SPEC §13.

## How the 3D view loads

`world/WorldMount.tsx`: the classic page is always the default. "Explore in 3D" appears when the device supports WebGL2 (and Save-Data is off); clicking it loads the 3D world lazily. A render error or lost graphics context falls back to the classic page with a short notice. Landmark links such as `/#contact` always open the classic page.

## The journey

- `core/journey.ts`: pure scroll-to-station mapping (with hysteresis) and camera transition planning (designed route to the next chapter, short direct jumps otherwise, instant with reduced motion). Unit-tested.
- `world/journey/stations.ts`: every resting point (camera pose, ball spot, scoreboard text, highlighted object, panel). Edit here to re-frame a chapter.
- `world/journey/JourneyLayer.tsx`: native scrolling (one viewport per station), chapter navigation, panels. `JourneyCamera.tsx` moves the camera and ball from the shared store state.
- Trophy cabinet content: `content/trophies.ts`.

To inspect the scene from any angle, build with `NEXT_PUBLIC_WORLD_DEBUG=1` (or use `npm run dev`) and add `?cam=x,y,z,targetX,targetY,targetZ` to the URL. Debug builds also expose `window.__world` (`getState()`, `setBall(x, z)`, `setExperience("journey" | "freeplay")`, `pick(clientX, clientY)`, `renderer()`) for browser tests, and accept `?quality=high|medium|low` to force a tier. All of this is compiled out of normal builds.

## Deploy

The build is fully static (`output: "export"`). Deploy `out/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

Set **`NEXT_PUBLIC_SITE_URL`** to the final domain at build time (e.g. `https://emmanuelobiechina.dev`). It is used for canonical URLs, Open Graph tags, the sitemap and robots.txt. Without it they point at `http://localhost:3000`.

## Look and feel

Colour tokens and fonts are defined once in `app/globals.css` (`@theme`) and `app/layout.tsx`. The classic page, the 3D HUD, cards and panels all read the same tokens. SPEC §5.2 records the palette, type and layout decisions.

## Editing content

All portfolio content is typed data in `content/`. No component contains portfolio text.

| File | What it holds |
|---|---|
| `content/profile.ts` | Name, headline, intro, status line, signals, stack graph, capabilities, bio, skills, certifications, languages |
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
