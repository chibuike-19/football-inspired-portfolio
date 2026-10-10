# Interactive 3D Football Portfolio — Revised Specification

**Owner:** Emmanuel Obiechina
**Status:** v2 (revised after engineering review) — supersedes the original brief
**Process:** Built phase by phase. Stop for review at the end of every phase.

---

## 0. Summary of changes from v1

| # | Change | Reason |
|---|--------|--------|
| 1 | The HTML portfolio is the **base layer**; 3D is progressive enhancement on top of it | One content source for SEO, accessibility, no-WebGL and "classic view". Fast first paint. |
| 2 | **Ball position is the only source of truth** for what is active. Menu navigation auto-dribbles the ball | Avoids camera/discovery desync. One code path. |
| 3 | Movement, collision, discovery and input logic live in a **pure TypeScript core**, outside React and three | Deterministic and unit-testable without a GPU |
| 4 | Proximity states reduced to `idle → near → active`. `expanded` is a **separate UI state** | Fewer thresholds to tune; clear behavior when the ball moves while a panel is open |
| 5 | An explicit **input router** | Resolves arrow-key, Enter and Tab conflicts between the game, HUD and panels |
| 6 | Hysteresis on **switching between landmarks**, not only per landmark | Prevents adjacent ad boards trading focus |
| 7 | Delta clamping, a fixed-step simulation and frame-rate-independent damping | No tunnelling after tab switches; identical feel at 60/120/144 Hz |
| 8 | Simple static collisions (goals, boards, tunnel) | Ball must not pass through objects |
| 9 | Mobile uses a floating joystick; no user camera orbit | Removes gesture ambiguity |
| 10 | A single DOM overlay layer positioned from the render loop instead of many `<Html>` nodes | Performance, accessibility, z-order control |
| 11 | Detects poor runtime performance and lost WebGL contexts, not only missing WebGL | Low-end devices and iOS Safari |
| 12 | Deep links for each landmark and static pages for each project | Shareability and SEO |
| 13 | Procedural stadium with baked lighting and one shadow light | No licensing risk; small download; consistent art style |
| 14 | Renders only when something changes (`frameloop="demand"`) | Battery and thermals while reading |

---

## 1. Objective

Build a production-quality portfolio for a frontend-focused full-stack engineer. A **3D football stadium is the primary navigation interface**: the visitor controls a ball, and landmarks on the pitch reveal portfolio content as the ball approaches them.

Guiding principles:

- **Explore naturally. Discover automatically. Go deeper only when interested.**
- **A recruiter never has to play to find the résumé or contact details.**
- **Usability is never sacrificed for effects, and the visuals are never sacrificed for simplicity.**
- **Nothing is fabricated.** No invented roles, dates, metrics, URLs or assets.

### Audiences
1. Recruiters and hiring managers: need skills, experience, résumé and contact within seconds.
2. Engineering leaders and founders: judge technical depth, product thinking and craft.
3. Developers and curious visitors: enjoy the interactive experience.

Tone: a premium sports-game presentation. Playful but not childish, polished but not an arcade game.

---

## 2. Content and truthfulness

### 2.1 Source of truth
All content lives in `content/` as typed data (see §14). Scene code never contains portfolio strings.

### 2.2 Known positioning (to be verified against the résumé)
- **Name:** Emmanuel Obiechina
- **Role:** Frontend-focused Full-Stack Engineer
- **Core stack:** React, Next.js, TypeScript, modern frontend engineering
- **Also:** backend integration, AI-powered features, product development, distributed teams
- **Experience candidates:**
  - **DevSpot:** platform connecting hackathon organizers, builders and investors; builder-to-opportunity matching; AI-assisted judging
  - **Rova:** corporate internet banking; admin interfaces, transfer workflows, multi-level transaction approval
- **Project candidates:** Roadmap.sh contributions, Stream2Peer, English → Nigerian languages (incl. Pidgin) translator, AI/dev-tool projects. Final selection depends on the available evidence.

### 2.3 Rules
- Dates, titles, responsibilities and outcomes come only from the résumé or repositories.
- Missing values use an explicit `TODO` placeholder with `status: "missing"` in the data. They are listed in `CONTENT_TODO.md` and are **never rendered as fake values**. A link whose URL is missing is hidden, not shown broken.
- External links open in a new tab with `rel="noopener noreferrer"`.

---

## 3. Architecture overview

### 3.1 Layered, progressive enhancement

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: 3D World (lazy, client-only)                        │
│   R3F canvas · scene · camera · landmark visuals             │
├──────────────────────────────────────────────────────────────┤
│ Layer 2: Interactive overlay (client)                        │
│   HUD nav · discovery preview · expanded panel · joystick    │
├──────────────────────────────────────────────────────────────┤
│ Layer 1: Static HTML portfolio (server-rendered, always)     │
│   semantic sections: profile, experience, projects,          │
│   résumé, contact — the SEO, a11y and fallback surface       │
└──────────────────────────────────────────────────────────────┘
         ▲ all three render from the same typed content data
```

- **Layer 1** is complete and usable on its own. It is what crawlers, screen readers, no-JS, no-WebGL and "Classic view" users get.
- When the 3D world mounts successfully, Layer 1 is visually hidden but **stays in the DOM and in the accessibility tree** (the canvas is `aria-hidden`). Panels in Layer 2 reuse Layer 1's content components.
- When the 3D world fails, never mounts, or the visitor chooses Classic view, Layer 1 is simply shown. No separate fallback app exists.

### 3.2 Core / view separation

```
core/        pure TypeScript — no React, no three imports
  ↓ consumed by
world/       R3F components: render the core state, run the frame loop
ui/          React DOM components: subscribe to discrete state
```

The frame loop calls the core:
`input → movement.step → collision.resolve → discovery.step → camera.step → render`.

---

## 4. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), `output: 'export'` | Fully static; deployable to any static host |
| Language | TypeScript, `strict: true` | No `any` without a documented reason |
| 3D | three, @react-three/fiber, @react-three/drei | Drei imports kept selective |
| State | zustand | Split into a transient layer and a discrete layer (§9) |
| Styling | Tailwind CSS | |
| UI motion | CSS transitions; Framer Motion only if CSS proves insufficient | |
| Damping | `maath` (easing) or a local `damp()` helper | Frame-rate independent |
| Tests | Vitest (core), Playwright (end-to-end smoke) | |
| Physics engine | **None** | Custom controller and simple collisions |
| Audio | **Out of scope for v1** | May be added later; muted by default with a visible toggle |

The canvas loads with `next/dynamic` and `ssr: false`, after Layer 1 has painted.

---

## 5. World design

### 5.1 Layout
A compact, stylized stadium. The pitch is 60 × 40 world units so every landmark is a few seconds' roll away. Exact positions live in `world/landmarks.ts`.

**Revised in Phase 5:** the camera always looks north, so every landmark display sits on the north side or at the ends where it faces the camera. The technical area moved from the south touchline (where it was behind the camera) to the centre of the north touchline.

```
                          [ SCOREBOARD — Profile ]
     ┌───────────────────────────────────────────────────────────┐
     │ [AD]   [AD]     [ DUGOUTS — Experience ]     [AD]   [AD]  │
     │  -22    -11                0                  11     22   │
 [GOAL│                         ( ○ )                     Résumé /│GOAL]
Contact                    center circle                   Tunnel
(kiosk│                     (spawn point)                         │
 faces│                                                           │
camera)                                                           │
     └───────────────────────────────────────────────────────────┘
```

| Landmark ID | Physical structure | Content |
|---|---|---|
| `profile` | Center circle + main scoreboard | Name, role, short intro, core strengths |
| `experience` | Dugouts and technical-area screen, north touchline centre | DevSpot and Rova (preview); all roles (panel) |
| `project:<slug>` | One perimeter ad board per project, two groups of two either side of the dugouts | Project preview |
| `resume` | Players' tunnel at the east end; its sign turns to face the camera | Résumé preview, open/download |
| `contact` | Goal-side kiosk at the west end, turned to face the camera | Email, LinkedIn, GitHub |

- Spawn is at the center circle, facing the boards and dugouts, with the scoreboard visible.
- Activation zones never overlap (tested); switching hysteresis (§7.4) still guards the edges.
- Every landmark is within 30 units of spawn.
- A soft ring on the turf marks each landmark's spot; it brightens as the ball approaches.

### 5.2 Art direction
- Palette: rich pitch greens, charcoal/near-black stadium, white typography, **one** restrained accent color (proposed: warm amber `#F5B544`, final choice in Phase 2) used only for interactive emphasis.
- Stylized-realistic, not photoreal.
- Landmarks become prominent through purposeful light, contrast and motion when `near` or `active`. Nothing glows constantly.

---

## 6. Rendering and assets

### 6.1 Procedural-first
| Element | Approach |
|---|---|
| Pitch | Single plane with a shader or canvas texture for mow stripes and markings |
| Ball | Procedural sphere with a panel texture, or a CC0 GLB under 200 KB if a better one is found and its license is verified |
| Goals and nets | Simple tube geometry; net as a single alpha texture (no per-strand geometry) |
| Stands | Low-poly extruded tiers; seats/crowd as `InstancedMesh` |
| Floodlights | Emissive geometry + a sprite flare; **not** real lights |
| Ad boards | Rendered to `CanvasTexture` from project data (name, tagline, accent). Screenshot used if available |
| Scoreboard / dugout screens | Same canvas-texture approach |

### 6.2 Lighting
- One directional key light that **casts shadows**. Its shadow camera is tight and follows the ball (2048 map on high quality, 1024 on medium, off on low).
- Hemisphere and ambient fill. Static ambient occlusion baked into textures under stands and structures.
- `ContactShadows` (or a blob decal) under the ball.
- Landmark emphasis: animate an emissive intensity or a local spotlight intensity. Do not add lights dynamically.

### 6.3 Post-processing
None by default. Only add an effect (e.g. subtle bloom on high quality) after Phase 7 shows a clear visual benefit at acceptable cost.

### 6.4 Resource hygiene
- Geometries and materials are created once (module-level or memoized) and shared.
- Textures get correct color space and sensible sizes (≤ 1024² except the pitch).
- Everything is disposed of on unmount. R3F handles most of this; manual disposal for `CanvasTexture`s.

---

## 7. Core systems (pure TypeScript)

All tunable values live in `core/config.ts` (§13).

### 7.1 Input router (`core/input.ts`)
Collects keyboard, pointer and joystick input into one normalized vector `{x, z}` (length ≤ 1) plus discrete intents (`expand`, `close`, `recenter`).

**Routing rules:**

| Focus state | WASD / arrows | Enter / Space | Esc |
|---|---|---|---|
| `body` or game surface focused, no panel | Move ball | Expand active landmark | No-op |
| HUD control focused | Ignored by game (native behavior) | Native (activates control) | Blur to game |
| Expanded panel open | **Ignored by game** (panel may scroll) | Native | Close panel → focus game |
| Autopilot running | Any movement input **cancels autopilot** and takes control | — | Cancel autopilot |

- Movement is relative to the camera: "up" moves away from the camera.
- `preventDefault` on arrow and space keys only when the game owns input, so page scrolling still works elsewhere.
- `R` key or HUD button: recenter (autopilot back to spawn).

### 7.2 Movement (`core/movement.ts`)
`step(state, input, dt) → state`, run at a **fixed timestep** (1/120 s) through an accumulator.

- **Acceleration** toward `input × maxSpeed`, with a higher rate when reversing direction (responsive turns).
- **Friction:** exponential decay when there is no input.
- **Rolling rotation:** angular velocity = `velocity / radius` around the axis `up × velocity`. The ball rolls without slipping visually.
- **Delta clamping:** a frame delta over `MAX_FRAME_DT` (50 ms) is clamped. The accumulator caps at 5 substeps.
- **Bounds:** the ball is constrained to the pitch rectangle (plus a small margin), with a soft bounce.

### 7.3 Collision (`core/collision.ts`)
- Static obstacles are axis-aligned or oriented boxes: goal posts, ad boards, dugout, tunnel mouth.
- Circle-vs-box resolution: push the ball out along the contact normal, then reflect the normal velocity with restitution of about 0.4 and keep the tangential velocity (the ball slides along walls).
- Speeds are low, so no swept collision is needed. The delta clamp and substeps prevent tunnelling.

### 7.4 Discovery (`core/discovery.ts`)
Each landmark:

```ts
interface Landmark {
  id: LandmarkId;            // stable, matches content id
  position: Vec2;            // x, z on pitch plane
  nearRadius: number;        // enter "near"
  activeRadius: number;      // enter "active" candidate
  exitPadding: number;       // hysteresis: exit at radius + padding
  priority: number;          // tie-breaker
  anchor: Vec3;              // world point the overlay anchors to
}
```

**Proximity states (per landmark):** `idle → near → active`

- `idle → near` when `d < nearRadius`; `near → idle` when `d > nearRadius + exitPadding`.
- A landmark is an **active candidate** when `d < activeRadius` (exit at `activeRadius + exitPadding`).
- **At most one landmark is `active`.** Selection rule:
  1. Keep the current active landmark while it is still a candidate, **unless** a challenger's score is better by `SWITCH_MARGIN`.
  2. Score = `distance − directionBonus × max(0, dot(velocityDir, toLandmarkDir))` (slight preference for where the ball is heading).
  3. Ties are broken by `priority`.
- **Grace period:** when the active landmark stops being a candidate, it stays active for `EXIT_GRACE` seconds (time accumulated in the step, **not** `setTimeout`). Re-entering within the grace period cancels the exit.
- Output: `{ states: Record<LandmarkId, 'idle'|'near'|'active'>, activeId: LandmarkId | null }`. The store is written **only when this output changes**.

### 7.5 Autopilot (`core/autopilot.ts`)
Used by HUD navigation, deep links and "recenter".
- Given a target landmark, it produces input vectors that steer the ball to a point just inside its `activeRadius`, slowing on arrival. Simple seek-and-arrive; obstacles are avoided by routing through a waypoint where needed.
- Any user movement input cancels it immediately.
- With reduced motion, autopilot **teleports** the ball there instead.
- Discovery then fires through the normal path. There is **no special case** where navigation sets `activeId` directly.

---

## 8. Camera (`core/camera.ts` + `world/CameraRig.tsx`)

- Fixed pitch angle (about 40–50° down), third-person follow. **No user orbit, zoom or drag.**
- Target = ball position + look-ahead (`velocity × LOOK_AHEAD_TIME`, clamped).
- When a landmark is `active`: blend the target toward the midpoint of the ball and landmark (weight about 0.35) and ease the distance in slightly. The weight returns to 0 when the landmark becomes inactive.
- All smoothing uses exponential damping, `x += (target − x) × (1 − e^(−λ·dt))`.
- Camera position is clamped so it never clips into the stands.
- **Reduced motion:** a higher, wider fixed-angle camera. It moves only when the ball nears the frame edge, using a short ease, with no look-ahead.

---

## 9. State management (`state/store.ts`)

One zustand store with two kinds of state:

**Transient (written every frame; read with `getState()` in `useFrame`; never subscribed to by React):**
- ball position, velocity, rotation
- camera current/target
- autopilot target
- the projected screen position of the active anchor

**Discrete (subscribed to by the UI; changes rarely):**
- `activeLandmarkId`, `landmarkStates`
- `expandedId: string | null` (UI state, **not** a proximity state)
- `mode: 'world' | 'classic'`
- `quality: 'high' | 'medium' | 'low'`
- `reducedMotion: boolean`
- `hasMoved: boolean` (onboarding)
- `worldStatus: 'loading' | 'ready' | 'failed'`

No React state updates happen every frame.

---

## 10. Interface

### 10.1 Overlay layer
- **One** absolutely-positioned DOM layer above the canvas.
- The preview card's position is written from `useFrame` straight to `element.style.transform` through a ref (no React re-render). The anchor is projected to screen space, clamped to the viewport, and **flipped to the side of the screen away from the ball** so it never covers the ball or its direction of travel.
- **Mobile (< 768 px):** the preview is a bottom sheet instead of an anchored card.

### 10.2 Discovery preview (automatic, no click)
Appears when a landmark becomes `active` (fade + 8px translate, about 200ms).

| Landmark | Preview content |
|---|---|
| Profile | Name, role, one-line intro, 3–4 strengths |
| Experience | Company, role, one-line summary, 3 tech tags (one entry per company, compact) |
| Project | Name, one sentence, contribution, 3 tech tags, primary action (Live / Source) |
| Résumé | One-line summary, **Open résumé** and **Download** buttons |
| Contact | Email (copyable text), LinkedIn, GitHub |

- Previews **never take focus.** Discoveries are announced through a throttled `aria-live="polite"` region (at most one announcement per 1.5s).
- The preview footer shows "Press Enter / tap for details" when expanded content exists.
- Interactive elements in the preview (links, buttons) are reachable with Tab.

### 10.3 Expanded panel (intentional)
- Opened by Enter, a click or tap on the preview, a click or tap on the landmark mesh, or a deep link.
- **Desktop:** a right-side panel (about 420px wide). The scene stays visible and is slightly dimmed. **Mobile:** a full-height sheet with a visible close button.
- While it is open: ball input pauses, a focus trap is active, and Esc or the close button closes it and **returns focus to the game surface**.
- Content: full project write-up (problem, contribution, tech, links, screenshots), full experience details, résumé embed or link, all contact options.
- URL syncs (§10.6).

### 10.4 HUD navigation
- A compact top bar: logo/name (left) · **Explore · Projects · Experience · Résumé · Contact** · quality/motion settings · **Classic view** toggle (right). Collapses into a menu button on mobile.
- Selecting a destination starts autopilot to that landmark (or teleports with reduced motion). "Projects" goes to the nearest project board.
- **Résumé and Contact also open their panel immediately** on selection, without waiting for arrival, so they are reachable in one click.
- "Explore" closes panels and recenters.
- Fully keyboard accessible, with visible focus rings and 44×44px minimum touch targets.

### 10.5 Onboarding
1. Layer 1 paints immediately (the name and role are visible in under 1s).
2. While the canvas loads: a slim progress indicator over the hero area, not a blocking splash screen.
3. When ready: the canvas cross-fades in (about 600ms; instant with reduced motion). The camera settles from a slightly higher angle (about 1s; skipped with reduced motion).
4. A hint appears: "WASD / arrows to move" (desktop) or "Drag anywhere to move" (touch), plus "or use the menu ↑".
5. The hint fades after the first movement or 8s of focus, and is never shown again (stored in `localStorage`, wrapped in try/catch).
6. A "Classic view" link is visible from the first frame.

### 10.6 Routing and deep links
- Hash state: `/#profile`, `/#experience`, `/#resume`, `/#contact`, `/#project/<slug>`.
- On load with a hash: the world spawns the ball **at** that landmark and opens its expanded panel. Classic view scrolls to the section.
- Opening a panel pushes a history entry; **Back closes the panel**.
- Static per-project pages at `/projects/[slug]` (SSG). These are the canonical share/SEO URLs and link back into the world with `/#project/<slug>`.

---

## 11. Device adaptation and resilience

### 11.1 Capability gating (before mounting the canvas)
Classic view is used directly if any of these are true:
- WebGL2 is unavailable.
- `navigator.connection.saveData` is true.
- The visitor previously chose Classic view (stored preference).

### 11.2 Runtime quality
- Drei `PerformanceMonitor`: on sustained poor FPS, step down **high → medium → low**:
  - high: DPR up to 2, shadows 2048, full crowd instances
  - medium: DPR 1.5, shadows 1024, reduced instances
  - low: DPR 1, no real-time shadows (blob only), minimal crowd
- If performance is still poor at **low**: show a non-blocking toast, "Running slowly — switch to Classic view?"
- Initial tier is based on a heuristic: touch device or `hardwareConcurrency ≤ 4` starts at medium.

### 11.3 Failure handling
- A React error boundary around the canvas. On error: `worldStatus = 'failed'` and Layer 1 is revealed with a small notice.
- A `webglcontextlost` listener: show Layer 1 and attempt a single restore on `webglcontextrestored`.
- Load timeout: if the world is not ready within 15s, reveal Layer 1 and keep loading in the background with a "3D view ready" prompt.

### 11.4 Frame loop
- `frameloop="demand"`. `invalidate()` is called while the ball, camera, autopilot, landmark emphasis tweens or onboarding animation are active.
- Rendering stops when idle (e.g. while reading a panel) and when the tab is hidden.

---

## 12. Accessibility and motion

- The canvas is `aria-hidden="true"`. All information exists in semantic HTML (Layer 1 / panels).
- A skip link, "Skip to portfolio content", is the first focusable element.
- Visible focus styles everywhere. Text contrast is at least WCAG AA.
- Interactivity is never shown by color or light alone. Active landmarks also get a label/preview, and boards show a text label.
- **Reduced motion** (OS preference, overridable in the HUD settings):
  - fixed overview camera, no look-ahead
  - autopilot teleports
  - panels fade only (no sliding)
  - no ambient animation (flags, crowd shimmer, floodlight flicker)
- Sound: none in v1. If added later, it is muted by default with an obvious toggle and never autoplays.

---

## 13. Configuration (`core/config.ts`)

Initial values, to be calibrated in Phases 3–4:

```ts
export const MOVEMENT = {
  FIXED_DT: 1 / 120,
  MAX_FRAME_DT: 0.05,
  MAX_SUBSTEPS: 5,
  MAX_SPEED: 9,           // units/s
  ACCEL: 22,              // units/s²
  REVERSE_ACCEL_MULT: 1.8,
  FRICTION: 3.2,          // exponential decay rate
  BALL_RADIUS: 0.45,
  RESTITUTION: 0.4,
};

export const DISCOVERY = {
  DEFAULT_NEAR_RADIUS: 7,
  DEFAULT_ACTIVE_RADIUS: 4,
  EXIT_PADDING: 1,
  SWITCH_MARGIN: 1.5,
  DIRECTION_BONUS: 0.75,
  EXIT_GRACE: 0.35,       // seconds
};

export const CAMERA = {
  HEIGHT: 11,
  DISTANCE: 13,
  LOOK_AHEAD_TIME: 0.35,
  LOOK_AHEAD_MAX: 3,
  FOLLOW_LAMBDA: 4,
  FOCUS_BLEND: 0.35,
  FOCUS_LAMBDA: 2.5,
};

export const AUTOPILOT = { ARRIVE_RADIUS: 2.5, SLOW_RADIUS: 5 };
```

Landmark positions and radii are defined in `world/landmarks.ts` and reference content IDs.

---

## 14. Project structure

```
football-portfolio/
  app/
    layout.tsx               # metadata, fonts, OG
    page.tsx                 # Layer 1 (server) + <WorldMount/> (client)
    projects/[slug]/page.tsx # SSG project pages
    opengraph-image.png
  content/
    profile.ts
    experience.ts
    projects.ts
    links.ts
    types.ts
  core/                      # pure TS, unit-tested
    config.ts
    math.ts                  # vec2, damp, clamp
    input.ts
    movement.ts
    collision.ts
    discovery.ts
    autopilot.ts
    camera.ts
  state/
    store.ts
  world/                     # R3F, client-only
    WorldMount.tsx           # dynamic import, gating, error boundary
    World.tsx                # Canvas, frame loop orchestration
    Pitch.tsx
    Ball.tsx
    Stadium.tsx
    Goals.tsx
    AdBoard.tsx
    Landmark.tsx             # emphasis visuals driven by state
    CameraRig.tsx
    Lighting.tsx
    landmarks.ts             # positions, radii, anchors, obstacles
    textures/                # canvas-texture generators
  ui/
    sections/                # Layer 1 sections (reused by panels)
    Hud.tsx
    PreviewCard.tsx
    ExpandedPanel.tsx
    Joystick.tsx
    Onboarding.tsx
    LiveAnnouncer.tsx
    QualityToast.tsx
  public/
    resume.pdf               # supplied by owner
    projects/                # screenshots, if available
  tests/
    core/*.test.ts           # Vitest
    e2e/*.spec.ts            # Playwright
  CONTENT_TODO.md
  README.md
```

---

## 15. Testing strategy

### 15.1 Unit tests (Vitest) — `core/`
- **Movement:** reaching max speed; friction stopping; identical results at 30/60/144 Hz frame splits (within a tolerance); delta-clamp behavior; bounds.
- **Collision:** push-out, restitution, sliding along walls, no tunnelling at max speed with a 50ms frame.
- **Discovery:** enter/exit hysteresis; no flicker when oscillating at a boundary; grace period; at most one active; switching margin between adjacent boards; direction bias; deterministic tie-break.
- **Autopilot:** arrives inside the active radius; cancels on input.
- **Input router:** the focus/panel routing table in §7.1.

### 15.2 End-to-end (Playwright)
A debug hook is exposed only in dev/test builds: `window.__world = { setBall(x, z), getState() }`.
- Hold `W` → the ball's position changes; release → it decelerates to a stop.
- `setBall` at each landmark → the correct preview text appears with **no click**; moving away dismisses it.
- Every HUD item works; Résumé and Contact open in one click.
- Deep link `/#project/<slug>` opens the correct panel; Back closes it.
- Forced WebGL failure → Layer 1 is visible with all sections.
- Keyboard-only run: skip link, HUD, open/close panel, focus returns.
- `prefers-reduced-motion` emulation → teleport navigation.
- No console errors.

### 15.3 Manual
Visual review in Chrome, Safari and Firefox desktop, and iOS Safari and Android Chrome (or emulation where unavailable — state which). Feel of movement and camera. Readability. Lighthouse run on Layer 1.

No feature is reported as working unless it has been verified.

---

## 16. Performance budgets (targets, verified in Phase 7)

| Metric | Target |
|---|---|
| LCP (Layer 1) | < 2.0s on fast 4G |
| JS before the canvas loads | < 180 KB gz (Next.js + React baseline measured at ~174 KB in Phase 2) |
| 3D chunk | < 350 KB gz |
| Total assets for the world | < 2 MB |
| Draw calls | < 150 (high), < 80 (low) |
| Frame rate | About 60 fps on a mid-range laptop at high/medium; graceful degradation otherwise |

---

## 17. Phases and exit criteria

Stop for review after each phase.

| Phase | Scope | Exit criteria |
|---|---|---|
| **1. Inspect and plan** | Collect the résumé, links and project evidence; finalize the project list; write `CONTENT_TODO.md`; calibrate the layout sketch | Content data drafted from real sources; missing items listed; plan confirmed |
| **2. Foundation and Layer 1** | Next.js scaffold; content types and data; complete static HTML portfolio (Layer 1) with SEO/OG; project pages | Layer 1 complete, accessible and deployable on its own |
| **3. Visual foundation** | Canvas mount, gating, error boundary; pitch, ball, stadium, goals, boards, lighting; static camera | Scene looks intentional from the spawn view; fallback works |
| **4. Core and movement** | `core/` input, movement, collision, camera; keyboard and joystick; unit tests | Movement feels right; tests pass; consistent across refresh rates |
| **5. Discovery** | Discovery state machine; landmark emphasis visuals; overlay layer with previews; live announcer; unit tests | Correct preview with no click at every landmark; no flicker; tests pass |
| **6. Interface and navigation** | Expanded panel; HUD; autopilot; deep links and history; onboarding; settings; Classic view toggle | All navigation paths work by keyboard, mouse and touch |
| **7. Polish and performance** | Materials, light emphasis, timing; quality tiers; demand frameloop; budgets | Budgets met or documented; no console errors |
| **8. Test and deliver** | Playwright suite; cross-browser pass; README; final `CONTENT_TODO.md` | Lint, typecheck and tests pass (verified); summary delivered |

---

## 18. Definition of done

1. A polished football stadium is immediately recognizable.
2. The ball is intuitive and satisfying to control on keyboard and touch.
3. Moving around reveals every destination with **no click** for previews.
4. Exploration has no required order.
5. Project and experience details are one interaction away from discovery.
6. The résumé and contact details are **one click** away from any state via the HUD.
7. The site is visually impressive without being cluttered.
8. Performance budgets are met or deviations are documented.
9. Layer 1 delivers all content without WebGL or JS.
10. Core logic is unit-tested; key flows are covered end to end.
11. All content and links are real; gaps are listed in `CONTENT_TODO.md`.

---

## 19. Inputs needed from the owner

- [ ] Résumé PDF (or text), placed at `public/resume.pdf`
- [ ] GitHub username / URL
- [ ] LinkedIn URL
- [ ] Contact email to display (confirm which address is public)
- [ ] Projects to feature, with live demo and repo URLs for each
- [ ] Project screenshots (optional; boards fall back to typographic designs)
- [ ] Verified dates, titles and responsibilities for DevSpot and Rova
- [ ] Preferred domain (for canonical URLs and OG metadata), if any
